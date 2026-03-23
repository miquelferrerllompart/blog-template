# Phase 3: Stack & Infrastructure

The generation pipeline is surprisingly simple. The complexity lives in the taxonomy and schemas, not in the code.

## Architecture Overview

```
┌─────────────────┐
│  Niche Taxonomy  │ (309 JSON files with context)
└────────┬────────┘
         ▼
┌─────────────────┐
│  Orchestrator    │ (Node.js script, manages concurrency + retries)
│  - Reads niche   │
│  - Reads schema  │
│  - Builds prompt │
└────────┬────────┘
         ▼
┌─────────────────┐
│  AI API          │ (Gemini Flash or Claude, structured JSON output)
│  - 100 workers   │
│  - Rate limited  │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Validator       │ (Checks JSON against TypeScript schema)
│  - Retry on fail │
│  - Max 3 retries │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Content Store   │ (JSON files on filesystem, git-versioned)
│  /{type}/{slug}  │
└────────┬────────┘
         ▼
┌─────────────────┐
│  React Renderers │ (1 component per content type, SSG/ISR)
└────────┬────────┘
         ▼
┌─────────────────┐
│  Static Pages    │ (Next.js / Astro)
└─────────────────┘
```

## Technology Choices

### AI Model Selection

The bottleneck is cost-to-quality ratio, not peak quality.

| Model | Pros | Cons | Cost per 13K pages (est.) |
|-------|------|------|--------------------------|
| **Gemini Flash** | Native JSON output, cheap, fast | Lower quality on nuanced content | ~$15-30 |
| **Claude Sonnet** | Higher quality, tool_use for structured output | More expensive | ~$80-150 |
| **Claude Haiku** | Good balance, cheaper than Sonnet | Less depth than Sonnet | ~$30-60 |
| **GPT-4o-mini** | Cheap, JSON mode | Variable quality | ~$20-40 |

**Recommendation:** Start with Gemini Flash for bulk generation. Use Claude Sonnet for a 10% quality sample to compare. If quality gap is significant, consider Claude Haiku as middle ground.

### Framework

| Option | Best for |
|--------|----------|
| **Next.js (App Router, SSG)** | If you want React components + static generation + easy deployment |
| **Astro** | If you want maximum performance + island architecture |
| **Custom SSG** | If you want full control and minimal dependencies |

**Recommendation:** Next.js with static export. Widely supported, good DX, native React.

### Hosting

Static sites → Vercel, Netlify, or Cloudflare Pages. All handle 13K+ pages fine with ISR or static builds.

## Orchestrator Script

The core generation script structure:

```typescript
// generate.ts — pseudocode structure

interface GenerationConfig {
  concurrency: number;          // 50-100 workers
  maxRetries: number;           // 3
  retryDelay: number;           // 1000ms
  model: string;                // "gemini-2.0-flash" or "claude-sonnet-4-20250514"
  outputDir: string;            // "./content/{type}/{slug}.json"
  dryRun: boolean;              // Generate but don't save
}

// 1. Load all niches from taxonomy/
// 2. Load all schemas from schemas/
// 3. For each (niche, contentType) combination:
//    a. Build prompt = schema + niche context + instructions
//    b. Call AI API with structured output
//    c. Validate response against schema
//    d. If valid → save to outputDir
//    e. If invalid → retry (up to maxRetries)
//    f. If still invalid → log to errors.json for manual review
// 4. Generate report: total generated, failed, retried
```

### Key Implementation Details

**Prompt construction:**
```
System: You are a content generation system. You MUST respond with valid JSON 
matching the provided schema. Do not include any text outside the JSON object.

Schema: {full TypeScript interface as JSON Schema}

Niche context: {complete niche JSON from taxonomy}

Instructions:
- Fill every field according to the schema constraints
- Items must be specific to the {niche.name} niche
- Each item description must reference concepts from the niche context
- Do NOT use generic content that could apply to any niche
- Follow quantity constraints exactly (e.g., "15-20 items" means 15-20, not 14 or 21)

Generate content for: {title_template filled with niche + type}
```

**Concurrency management:**
```typescript
// Use p-limit or similar for controlled concurrency
import pLimit from 'p-limit';

const limit = pLimit(100); // 100 concurrent workers
const tasks = combinations.map(([niche, type]) => 
  limit(() => generatePage(niche, type))
);
await Promise.allSettled(tasks);
```

**Rate limit handling:**
- Implement exponential backoff on 429 responses
- Track tokens/minute and requests/minute
- Gemini Flash: 1500 RPM, 4M TPM (free tier: 15 RPM)
- Claude: varies by plan, check current limits

## Validation Script

```typescript
// validate.ts — runs after generation

// For each content JSON file:
// 1. Parse JSON
// 2. Validate against Zod/AJV schema
// 3. Check business rules:
//    - Arrays meet length constraints
//    - No empty strings
//    - Niche-specific terms present in content
//    - Title matches template
//    - No duplicate items
// 4. Output: valid.json (passed) + invalid.json (failed with reasons)
```

Use **Zod** for TypeScript validation or **AJV** for JSON Schema validation.

## File Storage

Content files live on the filesystem, versioned with git:

```
content/
├── idea-list/
│   ├── travel.json
│   ├── fitness.json
│   └── ...
├── checklist/
│   ├── travel.json
│   └── ...
└── tool/
    ├── travel.json
    └── ...
```

Why filesystem over database:
- Git versioning for free (track changes, rollback)
- Easy to inspect and debug
- No database dependency
- Works with static site generators natively
- Can be stored in the same repo as the code

## Cost Estimation

| Niches | Types | Pages | Gemini Flash | Claude Haiku | Claude Sonnet |
|--------|-------|-------|-------------|-------------|---------------|
| 50 | 6 | 300 | ~$1 | ~$3 | ~$8 |
| 100 | 10 | 1,000 | ~$3 | ~$8 | ~$20 |
| 200 | 20 | 4,000 | ~$8 | ~$25 | ~$60 |
| 300 | 34 | 10,200 | ~$20 | ~$50 | ~$130 |

These are rough estimates. Actual cost depends on schema complexity and output token count.

## Output of Phase 3

- Generation script (orchestrator)
- Validation script
- Configuration file (model, concurrency, paths)
- Tested with 5-10 sample pages across different niches/types
- Cost estimate for full generation run
