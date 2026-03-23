---
name: niche-research
description: "Generate a pSEO niche research report from Ahrefs data. Use this skill when the user says 'new niche', 'niche research', 'add a vertical', 'Ahrefs research for [topic]', 'generate niche report', provides keyword research data or CSV exports from Ahrefs, or wants to plan content for a new industry/topic. Also trigger when the user pastes keyword tables, competitor analysis, or content gap data and wants it turned into a structured niche plan. Uses the Ahrefs MCP server for keyword research and competitor analysis."
---

# Niche Research Report Generator

Generate structured niche taxonomy files from Ahrefs research data, formatted for the blog's pSEO system (domain configured in `site.config.json`).

## Prerequisites

- **Ahrefs MCP** server must be configured (see `.mcp.json.example`). Uses `AHREFS_MCP_KEY` env variable.

## What This Skill Produces

Two ready-to-use files for the blog repo:

1. **`{niche-slug}.json`** → goes in `.pseo/taxonomy/` — full niche context (audience, pain points, industries, SEO landscape, content strategy)
2. **`_registry-update.json`** → content matrix and rollout plan to merge into `.pseo/taxonomy/_registry.json`

## Relationship With Other Skills

| Skill | When to use | Handoff |
|-------|-------------|---------|
| `niche-research` (this) | New niche, new vertical, expanding keyword universe | Produces taxonomy → feeds into `pseo-20` for content generation |
| `pseo-20` | Generate new content pages at scale | Consumes taxonomy from this skill |
| `improve-content` | Iterate on existing posts/categories | May trigger this skill when category expansion needs fresh niche data |

## Input: What You Need

The user provides Ahrefs data in any format (tables, CSV, screenshots, pasted text) **OR** you query the Ahrefs MCP tools directly.

### Required
- **Target niche/topic** (what the blog will cover)
- **Keyword data** — either from user input or fetched via MCP tools

### If User Provides Data
- Keyword list with volume, KD, CPC (at minimum the top 20-30 keywords)
- Competitor domains with DR, traffic, keyword counts (optional)
- Content gap analysis (optional)
- Top-performing pages from competitors (optional)
- SERP overview for key terms (optional)

If the user provides a CSV file, read it directly. If they paste a table, parse it.

### If Data Is Incomplete — Query Ahrefs MCP

When the user only provides a topic/niche name without keyword data, use the Ahrefs MCP tools to build the research from scratch.

---

## Ahrefs MCP Research Playbook

### MCP Configuration

The Ahrefs MCP server provides tools for keyword research, site exploration, and competitor analysis. Before using any tool for the first time, call the `doc` tool to learn its interface and parameters.

**Important:** Use the `doc` tool to discover available Ahrefs MCP tools and their parameters before making calls. The MCP tools mirror the Ahrefs API v3 endpoints.

### Step-by-step: Building a niche from scratch

When the user says "new niche: {topic}" without data, use these MCP tool calls in order:

#### Call 1 — Seed keyword overview
Get metrics for 5-10 seed keywords derived from the niche.
Use the Keywords Explorer overview MCP tool with: `select=keyword,volume,difficulty,cpc,global_volume`, `country=us`, and the seed keywords.
*Purpose:* Validate the niche has search volume and assess difficulty.

#### Call 2 — Matching terms (expand keyword universe)
Use the Keywords Explorer matching-terms MCP tool with: `select=keyword,volume,difficulty,cpc,serp_features`, `country=us`, seed keywords, `limit=100`.
*Purpose:* Find all related keywords to map the full keyword universe.

#### Call 3 — Related terms (semantic expansion)
Use the Keywords Explorer related-terms MCP tool with: `select=keyword,volume,difficulty`, `country=us`, seed keywords, `limit=100`.
*Purpose:* Discover semantically related topics that broaden the niche coverage.

#### Call 4 — Questions people ask
Use the Keywords Explorer matching-terms MCP tool with: `select=keyword,volume,difficulty`, `country=us`, seed keywords, `limit=50`, `search_mode=questions`.
*Purpose:* Find FAQ/guide content opportunities.

#### Call 5 — SERP overview for top keyword
Use the Keywords Explorer serp-overview MCP tool with: `select=title,url,domain_rating,traffic,keywords`, `country=us`, top volume keyword.
*Purpose:* Identify top competitors in this niche.

#### Call 6 — Competitor organic keywords (for top 2-3 competitors from SERP)
Use the Site Explorer organic-keywords MCP tool with: `target={competitor_domain}`, `mode=domain`, `select=keyword,volume,position,traffic`, `limit=100`, `country=us`.
*Purpose:* See what competitors rank for — find content gaps.

#### Call 7 — Competitor domain metrics
Use the Site Explorer domain-rating MCP tool with: `target={competitor_domain}`.
*Purpose:* Assess competitor authority level.

#### Call 8 — Our current position (if we have existing content)
Use the Site Explorer organic-keywords MCP tool with: `target={your-domain}` (get domain from `site.config.json`), `mode=domain`, `select=keyword,volume,position,url`, `limit=50`, `country=us`, `search={niche_term}`.
*Purpose:* Check if we already rank for anything in this niche.

### MCP Best Practices

1. **Call `doc` first** — before using any Ahrefs MCP tool for the first time, call `doc` to learn its parameters
2. **Correct field names** — the keyword difficulty field is `difficulty` (not `keyword_difficulty`). Other common fields: `keyword`, `volume`, `cpc`, `traffic_potential`, `global_volume`, `serp_features`, `intents`
3. **Minimize fields with `select`** — only request what you need
4. **Use `limit`** — start with 50-100 results, increase only if needed
5. **Batch keywords** — use comma-separated keywords in a single call when supported
6. **Persist keyword metrics** — after fetching keyword data (volume, KD, CPC), save it to `.pseo/keyword-metrics-cache.json` so it's available in the SEO dashboard and future builds without re-querying
7. **Don't re-query** — check the keyword metrics cache before calling MCP tools. Only fetch keywords not already cached
8. **Handle rate limits** — Ahrefs MCP has strict rate limits. Do NOT make parallel API calls. Run them sequentially, and if you hit a rate limit, wait 60 seconds before retrying
9. **Handle errors:** if a tool call fails, check the error message and retry with corrected parameters. The API returns available column names in the error when you use a wrong `select` field
10. **Expect sparse data for long-tail keywords** — most industry-specific long-tail keywords (e.g., "beauty ecommerce loyalty launch") return no data in Ahrefs. This is normal. Only ~10-15% of niche long-tail keywords will have volume/KD data. Focus on the broader terms for metrics and use long-tail keywords for content structure
11. **Country targeting** — default to `us` but ask user if targeting other markets
12. **Monetary values** — Ahrefs MCP returns monetary values (CPC, traffic_value, etc.) in USD cents. Divide by 100 to display in USD.

---

## Process

### Step 1: Parse Input Data

Read whatever the user provided OR run the MCP playbook above. Extract into structured tables:

- Keywords: term, volume, KD, CPC, intent
- Competitors: domain, DR, traffic, keywords, overlap %
- Content gaps: topics with volume but no good coverage

### Step 2: Analyze & Identify Structure

From the keyword data, identify:

- **Subtopics/verticals** — natural clusters in the keywords (these become the `subtopics` array)
- **Content type fit** — which of the 6 content types (resource, guide, alternatives, comparison, tool, industry) make sense
- **Title templates** — deterministic patterns that cover keyword clusters
- **Page count** — how many pages per content type × subtopic
- **Authoritative sources** — domains that appear in SERPs, competitor backlink profiles, or are recognized authorities in the niche. Categorize them into industry publications, data sources, competitor blogs, and official resources. These domains will be used during content generation to find specific reference URLs for outbound links.

The golden rule: every page must target a real keyword cluster with proven volume. No speculative pages.

### Step 3: Generate Both Files

Write the two JSON files directly to the repo:

1. `.pseo/taxonomy/{niche-slug}.json`
2. Present `_registry-update.json` to user for manual merge into `_registry.json`

### Step 4: Summary

End with a brief summary:
- Total pages planned
- Estimated monthly search volume addressable
- Top 3 highest-opportunity keywords
- Recommended Batch 1 focus

---

## Output Format

### File 1: `{niche-slug}.json`

Follow this exact structure:

```json
{
  "slug": "{niche-slug}",
  "name": "{Niche Display Name}",
  "status": "validated",
  "context": {
    "audience": {
      "primary": "...",
      "secondary": "...",
      "demographics": "...",
      "psychographics": "..."
    },
    "pain_points": [
      "10 specific pain points backed by the keyword data"
    ],
    "monetization": {
      "primary": ["How your product monetizes in this niche"],
      "secondary": ["..."],
      "business_model": "..."
    },
    "content_that_works": {
      "formats": ["7-10 content formats derived from competitor analysis"],
      "high_performing_angles": ["5-7 angles based on top-ranking content"],
      "content_gaps": "What nobody is covering (derived from Ahrefs data)"
    },
    "subtopics": [
      {
        "slug": "subtopic-slug",
        "name": "Subtopic Display Name",
        "specifics": "What makes this subtopic unique",
        "product_angle": "How your product applies to this subtopic",
        "relevance": "Why this matters for your target audience"
      }
    ],
    "seo_landscape": {
      "competition_level": "low|medium|high (based on avg KD)",
      "long_tail_opportunity": "assessment based on keyword data",
      "seasonal_patterns": "any patterns visible in the data",
      "serp_features": "what dominates SERPs for key terms",
      "current_position": {
        "organic_keywords": 0,
        "organic_traffic": 0,
        "top_performing_content": "none yet",
        "traffic_value": "$0",
        "key_gap": "describe the opportunity"
      },
      "competitor_intel": {
        "competitor_slug": {
          "traffic": 0,
          "dr": 0,
          "strategy": "their content approach",
          "top_page": "their best performing page"
        }
      }
    },
    "authoritative_sources": {
      "industry_publications": ["Top industry media/publications for this niche"],
      "data_sources": ["Sites with stats, reports, and research data"],
      "competitor_blogs": ["Competitor blogs with quality content to reference"],
      "official_resources": ["Official docs, government sites, or standards bodies"]
    },
    "unique_considerations": [
      "5-7 things unique to this niche that content must account for"
    ]
  },
  "content_categories": {
    "enabled": ["resources", "guides", "alternatives", "comparisons", "tools"],
    "disabled_reason": {}
  },
  "generation_notes": {
    "tone": "...",
    "avoid": ["4-5 things to avoid"],
    "emphasize": ["5-7 things to emphasize"],
    "cta_strategy": "..."
  }
}
```

### File 2: `_registry-update.json`

Content matrix with page counts, title templates, slug patterns, and rollout batches:

```json
{
  "niche_entry": {
    "slug": "{niche-slug}",
    "name": "{Niche Display Name}",
    "status": "validated",
    "content_types_enabled": 5,
    "estimated_pages": 0,
    "last_updated": "YYYY-MM-DD",
    "notes": "One-line summary from keyword data"
  },
  "content_matrix": {
    "resources": {
      "subtypes": [
        {
          "template": "Title template with {industry} and {year} placeholders",
          "slug_pattern": "slug-pattern-{industry}",
          "industries": 0,
          "pages": 0
        }
      ],
      "total_pages": 0
    },
    "guides": { "subtypes": [], "total_pages": 0 },
    "alternatives": { "subtypes": [], "total_pages": 0 },
    "comparisons": { "subtypes": [], "total_pages": 0 },
    "tools": { "subtypes": [], "total_pages": 0 }
  },
  "rollout_batches": [
    { "batch": 1, "pages": 0, "focus": "...", "timeline": "Week 1-2" }
  ]
}
```

---

## Quality Checks

Before outputting, verify:

- [ ] Every `subtopic` maps to real keywords from the input/MCP data
- [ ] Page count estimates are realistic (not inflated)
- [ ] Title templates produce titles that match actual search queries
- [ ] Pain points come from keyword intent, not generic assumptions
- [ ] Competitor intel uses actual Ahrefs data, not guesses
- [ ] The `product_angle` and `relevance` fields are specific to your product and target audience
- [ ] `authoritative_sources` contains real, active domains found in SERPs or competitor data — not generic guesses
- [ ] All keyword volumes and KD scores come from Ahrefs data, not estimates

---

## Examples

### Example 1: User says "new niche: pet care ecommerce"

1. Run MCP playbook (Calls 1-8) with seeds: "pet care ecommerce", "pet store online", "pet shop customer retention"
2. MCP returns 150+ keywords, top competitors identified from SERPs
3. Identify subtopics: dogs, cats, exotic pets, pet grooming, pet food subscriptions
4. Generate `pet-care.json` with full context
5. Generate `_registry-update.json` with 25 planned pages
6. Summary: "25 pages planned, 45K monthly volume addressable, top opportunity: 'pet store ecommerce' (vol: 1,200, KD: 12)"

### Example 2: User pastes Ahrefs CSV data

1. Parse CSV → extract keywords, volumes, KD
2. Skip MCP calls (data already provided)
3. Cluster keywords into subtopics
4. Generate both files
5. Summary with data-backed recommendations

### Example 3: Triggered from `improve-content` skill

1. `improve-content` determines category expansion is needed (e.g., "add health vertical")
2. Hands off to this skill with context: "Generate niche research for [new vertical]"
3. Run MCP playbook with vertical-specific seeds
4. Generate taxonomy files
5. Hand back to `improve-content` or `pseo-20` for content generation
