# Phase 4: Content Generation at Scale

This phase executes the generation pipeline built in Phase 3. The system itself is simple — the quality depends entirely on the taxonomy (Phase 1) and schemas (Phase 2).

## Pre-Generation Checklist

Before running full generation, verify:

- [ ] At least 5 sample pages generated and reviewed per content type
- [ ] Niche contexts validated with differentiation test
- [ ] Schemas finalized and validation script working
- [ ] Title templates producing correct, SEO-friendly titles
- [ ] Ahrefs MCP configured and working
- [ ] Cost estimate approved
- [ ] Output directory structure created
- [ ] Git repo initialized for content versioning

## Generation Strategy

### Order of generation

1. **Start with Resource pages** — highest impact, ~58% of total
2. **Then Free Tools** — high engagement, different intent
3. **Then Guides** — educational, good for authority
4. **Then Templates** — lower volume but high utility
5. **Alternatives & Comparisons last** — smallest categories, may need manual research

### Batch approach

Don't generate everything at once. Go in waves:

**Wave 1: Validation batch (50-100 pages)**
- 5-10 niches × top 2 content types
- Manual review of every page
- Fix schema/prompt issues before scaling

**Wave 2: First scale batch (500-1,000 pages)**
- Expand to all validated niches × top 3 content types
- Automated validation, manual spot-check 10%

**Wave 3: Full generation (remaining pages)**
- All niches × all content types
- Automated validation only
- Manual review of failed validations

## Prompt Engineering Details

### What goes into each prompt

```
[SYSTEM PROMPT]
You are a structured content generator. Respond ONLY with valid JSON.
Do not include markdown, explanation, or anything outside the JSON.

[SCHEMA]
{The full JSON schema / TypeScript interface for this content type}

[NICHE CONTEXT]
{Complete niche JSON from taxonomy — audience, pain points, monetization, etc.}

[GENERATION INSTRUCTIONS]
Content type: {type}
Niche: {niche.name}
Title: {filled title template}

Requirements:
1. Every item must be specific to {niche.name} — reference concepts from the niche context
2. Follow quantity constraints exactly:
   - sections: {min}-{max}
   - items per section: {min}-{max}
   - pro_tips: exactly {n}
3. Difficulty distribution should be roughly: 30% beginner, 50% intermediate, 20% advanced
4. Do NOT include generic advice that applies to any niche
5. Each description must be 2-4 sentences, actionable, and specific
6. Include 3-5 external_references to authoritative third-party sources:
   - At least 2 from Tier 1 (HBR, McKinsey, Bain, Forbes — DA 80+)
   - Rest from Tier 2-3 (HubSpot, Investopedia, industry-specific publications)
   - Must be topically relevant to THIS page's subject
   - Use industry-specific sources when available (check niche taxonomy `authoritative_sources`)
   - NEVER link to competitor domains (define in `site.config.json`)
7. WRITING TONE — Marketing-friendly, not technical:
   - Write for business owners and marketers, not developers
   - Lead with outcomes and benefits, then explain how
   - Use concrete numbers and examples ("3x more redemptions") not vague claims ("improves engagement")
   - Short sentences (max ~25 words), active voice, conversational tone
   - No developer jargon (API, webhook, schema, endpoint, payload, JSON)
   - No filler phrases ("In today's competitive landscape", "It goes without saying")
8. CONTEXTUAL INTERLINKING — 2-4 inline links to other blog pages:
   - Weave links naturally into description and context fields using HTML anchors
   - Format: <a href="/resources/{slug}">descriptive anchor text</a>
   - Spread across different sections, don't cluster in one place
   - Only link to pages that exist in the content plan (check available slugs)
   - URL patterns: /resources/{slug}, /guides/{slug}, /tools/{slug}, /compare/{slug}
   - Anchor text must be descriptive (topic-based), never "click here" or "read more"

QUALITY CHECK: If someone removed the niche name from this content,
would it be obvious which niche it belongs to? If not, make it more specific.
```

### Common prompt failures and fixes

| Problem | Symptom | Fix |
|---------|---------|-----|
| Generic content | Items could apply to any niche | Add "reference at least one concept from niche context per item" |
| Inconsistent length | Some items 1 sentence, others 8 | Add explicit word count range per field |
| Missing fields | JSON valid but fields empty | Add "every field must be non-empty" |
| Wrong quantity | 12 items instead of 15-20 | Repeat constraint in 3 places: schema comment, instructions, quality check |
| Repetitive | Items say the same thing differently | Add "each item must cover a unique concept, no overlapping advice" |

## Handling Failures

### Retry logic

```
Attempt 1: Standard prompt
  ↓ (validation fails)
Attempt 2: Same prompt + "Previous attempt failed: {specific validation error}"
  ↓ (validation fails)  
Attempt 3: Simplified prompt + stricter constraints
  ↓ (validation fails)
→ Log to errors.json for manual review
```

### Error tracking

Maintain `generation_log.json`:

```json
{
  "run_id": "2026-03-12-001",
  "started_at": "2026-03-12T10:00:00Z",
  "completed_at": "2026-03-12T12:47:00Z",
  "total_attempted": 10200,
  "succeeded": 10050,
  "failed_after_retries": 150,
  "retried_once": 800,
  "retried_twice": 200,
  "retried_three_times": 150,
  "total_api_calls": 11400,
  "total_cost_usd": 22.50,
  "failures_by_type": {
    "invalid_json": 30,
    "missing_fields": 45,
    "wrong_item_count": 50,
    "generic_content": 25
  }
}
```

## Post-Generation Quality Audit

After full generation, run these automated checks:

1. **Duplicate detection** — Hash content sections, flag pages with >70% similarity
2. **Niche relevance score** — Count niche-specific terms per page, flag outliers
3. **Length distribution** — Verify all pages within expected content length range
4. **Schema compliance** — Re-validate 100% of files
5. **Cross-niche leak** — Check if content from niche A appears in niche B
6. **External references audit** — Verify every page has 3-5 external_references, no competitor links, at least 2 Tier 1 sources
7. **Interlinking audit** — Verify every page has 2-4 inline `<a href>` links in body text fields pointing to valid internal slugs
8. **Tone check** — Spot-check 10% of pages for developer jargon, passive voice, and filler phrases

## Output of Phase 4

- All content JSON files generated and validated
- Generation log with statistics
- Error log with failed pages (for manual fix or re-generation)
- Quality audit report
- Git commit with all content files
