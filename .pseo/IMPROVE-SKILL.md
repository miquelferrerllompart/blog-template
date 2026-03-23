---
name: improve-content
description: "Iterates and improves existing blog posts, tools, or content categories based on user feedback, SEO data, or strategic goals. Triggers when the user wants to update, improve, iterate, refresh, or optimize an existing page or group of pages. Also triggers when the user shares GSC data, ranking drops, or competitor insights for existing content. Uses the Ahrefs MCP server for keyword research and competitor analysis — no manual research needed."
---

# Improve Content — Post & Category Iteration Skill

## Overview

This skill handles **iterating on existing content** — individual posts, tools, or entire categories (e.g., all resources in an industry, all tools). It bridges the gap between Phase 7 (feedback loop) and Phase 4 (content generation) by analyzing what exists, querying Ahrefs via MCP for real SEO data, and applying data-driven improvements.

### Relationship With Other Skills

| Skill | When to use | Handoff |
|-------|-------------|---------|
| `improve-content` (this) | Iterate on existing posts/categories | Uses Ahrefs MCP for SEO data; hands off to `niche-research` for category expansion |
| `niche-research` | New niche, new vertical, expanding keyword universe | This skill triggers it when Playbook 4 (Content Gap) reveals a full niche expansion is needed |
| `pseo-20` | Generate new content pages at scale | This skill feeds improved specs; `niche-research` feeds taxonomy |

## Prerequisites

- **Ahrefs MCP** server must be configured (see `.mcp.json.example`). Uses `AHREFS_MCP_KEY` env variable.

## When This Skill Triggers

- User says: "improve", "update", "iterate", "refresh", "optimize" + a post/category reference
- User shares GSC data, ranking drops, or performance concerns about existing content
- User wants to add interlinking, update external references, or improve SEO signals
- User mentions a competitor is outranking them on a specific topic
- User wants to expand a category with more/better content

---

## Step 1: Understand the Request

Determine these 3 things before doing anything:

### 1A. What content to improve?

Identify the target scope:

| Scope | Example | Files to read |
|-------|---------|---------------|
| **Single post** | "improve the getting started tips post" | `content/resources/example-getting-started-tips.json` |
| **Single tool** | "update the ROI calculator" | `content/tools/roi-calculator.json` |
| **Industry category** | "improve all industry-x content" | All `*-industry-x.json` files |
| **Content type** | "improve all resource pages" | All `content/resources/*.json` |
| **Cross-cutting** | "improve interlinking across everything" | All content files |

**Action:** Read the relevant JSON file(s) to understand current state.

### 1B. Why improve it?

Classify the improvement reason:

| Reason | Needs Ahrefs MCP? | Action path |
|--------|-------------------|-------------|
| **Content quality** (thin sections, weak examples, outdated stats) | No | Direct edit |
| **SEO positioning** (low rankings, losing to competitor, wrong keywords) | **Yes** | Ahrefs MCP → edit |
| **Missing interlinking** (no internal links, broken links) | No | Direct edit (check existing pages) |
| **Outdated references** (dead links, old stats) | Maybe | Check links first, Ahrefs if repositioning |
| **New content opportunity** (gap in category, trending topic) | **Yes** | Ahrefs MCP → new content |
| **Competitor response** (competitor published similar/better content) | **Yes** | Ahrefs MCP → edit |
| **Category expansion** (add new industry verticals, new subtypes) | **Yes** | Ahrefs MCP → new content |
| **Schema/structure change** (add fields, change format) | No | Schema + regeneration |

### 1C. What data is available?

- **Analytics snapshot?** → Check `.pseo/analytics-snapshot.json` (`_updatedAt` field shows freshness). If stale or missing, run `node scripts/analytics-snapshot.js` first. Contains real GSC rankings (queries, positions, CTR) and PostHog traffic (pageviews, top pages). Config: `.pseo/analytics-config.json`.
- GSC screenshots/data from user? → Extract keywords, positions, CTR — may skip some MCP calls
- Ahrefs export? → Already have the data, skip MCP calls entirely
- Anecdotal feedback? → Need Ahrefs MCP confirmation

---

## Step 2: Analyze Current Content

Before deciding on improvements, read and analyze the target content:

### For a single post/tool:
1. Read the JSON file completely
2. Check: title, description, keyword targeting
3. Check: section depth (are descriptions 3-4 sentences or thin?)
4. Check: interlinking (count `<a href` occurrences — need 2-4)
5. Check: external references (3-5? Are URLs still valid?)
6. Check: pro tips, common mistakes, benchmarks (industry-specific or generic?)
7. Check: product-specific angle presence and quality
8. Compare against schema requirements in `.pseo/schemas/`

### For a category:
1. List all files in the category
2. Check consistency across files (same quality level?)
3. Identify weakest pages (fewest interlinking, thinnest content)
4. Check coverage: which subtypes exist, which are missing?
5. Cross-reference with `.pseo/taxonomy/_registry.json` batch plan

### Output a brief diagnostic:

```
## Content Diagnostic: [target]

**Current state:**
- Pages analyzed: N
- Avg interlinking: X/page (target: 2-4)
- External references: X/page (target: 3-5)
- Content depth: [strong/adequate/thin]

**Issues found:**
1. [specific issue]
2. [specific issue]

**Recommendation:** [Direct edit / Needs Ahrefs data / Both]
```

---

## Step 3: Decision — Direct Edit or Ahrefs Research?

### Path A: Direct Edit (no Ahrefs needed)

Apply improvements directly when:
- Adding/fixing interlinking between existing pages
- Improving section descriptions (making them more specific, adding examples)
- Updating outdated external references
- Fixing schema compliance issues
- Strengthening product-specific angles or industry-specific examples
- Adding missing pro_tips, common_mistakes, or benchmarks

**Execute:** Make the JSON edits, validate with `scripts/validate.sh`, rebuild.

### Path B: Ahrefs MCP Research

Query Ahrefs via MCP when:
- SEO repositioning is needed (targeting different/better keywords)
- Competitor analysis is required
- New content gaps need to be identified
- Category expansion is planned
- User wants data-driven improvements (not guessing)

**Continue to Step 4.**

### Path C: Both

Sometimes you need Ahrefs data for strategic decisions but can also make immediate quality improvements. In this case:
1. Apply direct edits first (Path A)
2. Query Ahrefs via MCP for strategic improvements (Path B)
3. Apply data-driven improvements based on MCP results

---

## Step 4: Ahrefs MCP Research

### MCP Configuration

The Ahrefs MCP server provides tools for keyword research, site exploration, and competitor analysis. Before using any tool for the first time, call the `doc` tool to learn its interface and parameters.

**Important:** Use the `doc` tool to discover available Ahrefs MCP tools and their parameters. The MCP tools mirror the Ahrefs MCP v3 endpoints. Monetary values are returned in USD cents — divide by 100 to display in USD.

### 4A. Research Playbooks

Choose the right playbook based on the improvement reason:

#### Playbook 1: Single Post SEO Audit

For improving a specific post's positioning. Run these MCP calls:

**Call 1 — Organic keywords for our page:**
Use the Site Explorer organic-keywords MCP tool with: `target={your-domain}/{type}/{slug}` (get domain from `site.config.json`), `mode=prefix`, `select=keyword,volume,position,traffic,difficulty`, `limit=50`, `country=us`.
*Purpose:* See what keywords we currently rank for and at what positions.

**Call 2 — Keyword ideas for our target terms:**
Use the Keywords Explorer matching-terms MCP tool with: `select=keyword,volume,difficulty,serp_features`, `country=us`, `keywords={comma_separated_current_keywords}`, `limit=50`.
*Purpose:* Discover related keywords we should also target.

**Call 3 — SERP overview for primary keyword:**
Use the Keywords Explorer serp-overview MCP tool with: `select=title,url,domain_rating,traffic,keywords`, `country=us`, `keyword={primary_keyword}`.
*Purpose:* See who ranks in top 10 for our main keyword and their metrics.

**Call 4 — Competitor page organic keywords (for top 3 SERP results):**
Use the Site Explorer organic-keywords MCP tool with: `target={competitor_url}`, `mode=prefix`, `select=keyword,volume,position`, `limit=30`, `country=us`.
*Purpose:* Find keywords competitors rank for that we don't.

#### Playbook 2: Category Audit

For improving all pages in an industry or content type:

**Call 1 — Our domain overview:**
Use the Site Explorer organic-keywords MCP tool with: `target={your-domain}` (get domain from `site.config.json`), `mode=domain`, `select=keyword,volume,position,traffic,url`, `limit=200`, `country=us`.
*Purpose:* Full picture of what our blog ranks for.

**Call 2 — Keyword universe for the category:**
Use the Keywords Explorer matching-terms MCP tool with: `select=keyword,volume,difficulty`, `country=us`, `keywords={industry}+{primary_topic},{industry}+{secondary_topic},{industry}+{tertiary_topic}`, `limit=100`.
*Purpose:* Map the full keyword universe for this category.

**Call 3 — Per-page check (for each page in category):**
Use the Site Explorer organic-keywords MCP tool with: `target={your-domain}/{type}/{slug}` (get domain from `site.config.json`), `mode=prefix`, `select=keyword,volume,position`, `limit=20`, `country=us`.
*Purpose:* Quick audit per page — which pages rank, which don't.

#### Playbook 3: Competitor Response

For when a competitor is outranking us:

**Call 1 — Their page's organic keywords:**
Use the Site Explorer organic-keywords MCP tool with: `target={competitor_url}`, `mode=prefix`, `select=keyword,volume,position,traffic`, `limit=50`, `country=us`.

**Call 2 — Their domain metrics:**
Use the Site Explorer domain-rating MCP tool with: `target={competitor_domain}`.

**Call 3 — Their backlinks:**
Use the Site Explorer backlinks-stats MCP tool with: `target={competitor_url}`, `mode=prefix`.

**Call 4 — Our page's organic keywords (for comparison):**
Use the Site Explorer organic-keywords MCP tool with: `target={your-domain}/{type}/{slug}` (get domain from `site.config.json`), `mode=prefix`, `select=keyword,volume,position,traffic`, `limit=50`, `country=us`.

#### Playbook 4: Content Gap Discovery

For finding new pages to create within a category:

**Call 1 — Keyword ideas with volume and difficulty:**
Use the Keywords Explorer related-terms MCP tool with: `select=keyword,volume,difficulty`, `country=us`, `keywords={seed_keywords}`, `limit=100`.

**Call 2 — Questions people ask:**
Use the Keywords Explorer matching-terms MCP tool with: `select=keyword,volume,difficulty`, `country=us`, `keywords={seed_keywords}`, `limit=50`, `search_mode=questions`.

### 4B. MCP Best Practices

1. **Call `doc` first** — before using any Ahrefs MCP tool for the first time, call `doc` to learn its parameters
2. **Correct field names** — the keyword difficulty field is `difficulty` (not `keyword_difficulty`). Other common fields: `keyword`, `volume`, `cpc`, `traffic_potential`, `global_volume`, `serp_features`, `intents`
3. **Minimize fields with `select`** — only request what you need
4. **Use `limit`** — start with 20-50 results, increase only if needed
5. **Batch when possible** — use comma-separated keywords in a single call when supported
6. **Persist keyword metrics** — after fetching keyword data (volume, KD, CPC) from Ahrefs, save it to `.pseo/keyword-metrics-cache.json` so it's available in the SEO dashboard and future builds without re-querying. Use the cache functions from `scripts/keyword-map.js`.
7. **Don't re-query** — check the keyword metrics cache before calling MCP tools. Only fetch keywords not already cached.
8. **Handle rate limits** — Ahrefs MCP has strict rate limits. Do NOT make parallel API calls. Run them sequentially, and if you hit a rate limit, wait 60 seconds before retrying
9. **Handle errors gracefully:** if a tool call fails, check the error message and retry with corrected parameters. The API returns available column names in the error when you use a wrong `select` field
10. **Expect sparse data for long-tail keywords** — most industry-specific long-tail keywords return no data in Ahrefs. Only ~10-15% of niche keywords will have volume/KD data. Focus on broader terms for metrics
11. **Parse responses** — extract only actionable data, discard noise
12. **Country targeting** — default to `us` but ask user if targeting other markets
13. **Monetary values** — Ahrefs MCP returns monetary values in USD cents. Divide by 100 to display in USD.

### 4C. Interpreting Results

After running the appropriate playbook, analyze:

| Data point | What it tells us | Action |
|-----------|------------------|--------|
| Keywords we rank 1-3 | Winning terms — protect these | Don't change targeting for these |
| Keywords we rank 4-10 | Close to top — small improvements can push up | Strengthen content for these terms |
| Keywords we rank 11-30 | Opportunity zone — content improvements needed | Add sections, improve depth |
| Keywords competitors rank for but we don't | Content gaps | Add to seo.keywords, create sections |
| High volume + low KD keywords | Quick wins | Prioritize these |
| Questions (PAA) | FAQ opportunities | Add to FAQ section or create new content |
| Competitor DR vs ours | Authority gap | Focus on content quality if DR is lower |

---

## Step 5: Plan & Execute Improvements

Based on the diagnostic (Step 2) + Ahrefs data (Step 4):

### 5A. Create improvement plan

```
## Improvement Plan: [target]

Based on Ahrefs data:

### Keywords
- Current ranking keywords: [from API]
- Add to seo.keywords: [list from gap analysis]
- Update title: [old] → [new] (only if data strongly supports it)
- Update description: [old] → [new]

### Content Additions
- New section: [topic] (addresses keyword gap: "{keyword}" — vol: X, KD: Y)
- Expand section X: add content targeting "{keyword}"
- Add pro tip about: [topic from PAA questions]

### Interlinking
- Add link to [page] in section Y (anchor: "descriptive text")
- Add link from [other page] to this page

### External References
- Replace: [old ref] → [new ref] (higher authority)
- Add: [new ref] (covers gap)

### New Pages (if category expansion)
- [slug]: targets "{keyword}" (vol: X, KD: Y)
```

### 5B. Execute the edits

1. Edit the JSON file(s) following schema rules
2. Maintain all existing schema constraints (field counts, enums, etc.)
3. Run `scripts/validate.sh` to verify
4. Run `scripts/build.sh` to rebuild
5. Summarize changes with before/after metrics

### 5C. Present results to user

```
## Improvements Applied: [target]

### Changes made:
- Updated seo.keywords: added X terms, removed Y
- Added/expanded N sections targeting new keywords
- Added M internal links
- Updated external references

### Ahrefs data summary:
- Our page ranks for X keywords (was Y before)
- Top opportunity: "{keyword}" (vol: X, KD: Y, current pos: Z)
- Competitor gap: N keywords they rank for that we don't
- Recommended next: [next action]
```

---

## Quality Checklist

Before finalizing any improvement:

- [ ] Title follows deterministic template (not AI-generated)
- [ ] SEO description ≤ 155 characters
- [ ] 8-12 keywords in seo.keywords
- [ ] 2-4 contextual inline links (not just related section)
- [ ] 3-5 external references (at least 2 Tier 1)
- [ ] All linked pages actually exist
- [ ] Industry-specific content (not generic)
- [ ] Product-specific angle included where relevant
- [ ] Pro tips are actionable and specific
- [ ] Common mistakes are real pitfalls, not filler
- [ ] Benchmarks have sources
- [ ] No developer jargon (API, webhook, schema, etc.)
- [ ] Passes `validate.sh`

---

## Examples

### Example 1: "A resource post isn't ranking well"

1. Read the target content JSON
2. Diagnostic: content is solid, 3 interlinks, 4 external refs — structure OK
3. **Decision: Ahrefs MCP needed** (SEO positioning issue)
4. Run **Playbook 1** (Single Post SEO Audit):
   - Call 1: Our page ranks for 8 keywords, best position #14 for the primary keyword
   - Call 2: Found 35 related keywords, 12 with KD < 20
   - Call 3: Top SERP result has DR 60, 45 keywords
   - Call 4: Competitor targets keywords we don't
5. **Apply improvements:**
   - Add gap keywords to seo.keywords
   - Add new section targeting gap keywords
   - Expand intro with stat from SERP competitor analysis
6. Validate, build, summarize

### Example 2: "Add more interlinking to posts in a category"

1. Read all JSON files for the target category
2. Count `<a href` in each — diagnostic shows 0-1 links per page
3. **Decision: Direct edit** (no Ahrefs needed)
4. Cross-reference existing pages to find link opportunities
5. Add 2-4 contextual links per page
6. Validate and rebuild

### Example 3: "A competitor published a better comparison page"

1. Read the comparison content JSON
2. Diagnostic: current content has 8 criteria, solid structure
3. **Decision: Ahrefs MCP needed** (competitor response)
4. Run **Playbook 3** (Competitor Response):
   - Call 1: Their page ranks for 25 keywords
   - Call 2: Their DR is 60 (vs our ~15)
   - Call 3: They have 45 backlinks to this page
   - Call 4: We rank for 5 keywords on this topic
5. **Apply improvements:**
   - Add 3 new comparison criteria they cover that we don't
   - Strengthen our unique angles
   - Add FAQ items targeting their PAA keywords
6. Validate, build, summarize

### Example 4: "I want to add a new vertical to resources"

1. Check `_registry.json` for planned batches
2. Check niche taxonomy JSON for the target vertical data
3. **Decision: Hand off to `niche-research` skill** (full category expansion)
4. `niche-research` runs its MCP playbook with vertical-specific seeds
5. Produces/updates niche taxonomy JSON with Ahrefs data
6. Generates `_registry-update.json` with content matrix
7. **Hand off to `pseo-20` skill** for page generation with enriched niche context
