# pSEO Blog Template

Static programmatic SEO blog — generate hundreds of pages from JSON content + HTML templates.

## Quick Start

```bash
# 1. Configure your brand
cp site.config.example.json site.config.json
# Edit site.config.json with your brand name, domain, colors, CTA

# 2. Build
bash scripts/validate.sh   # Validate all content JSONs
bash scripts/build.sh      # Build static HTML -> public/
npx serve public -p 3000   # Preview at http://localhost:3000

# 3. First-time setup with Claude
# Open this repo in Claude Code and say:
# "Set up this blog for my brand"
# See SETUP.md for the full onboarding guide
```

## Repo Structure

```
blog/
├── CLAUDE.md              <- Claude reads this first (project memory)
├── SETUP.md               <- First-time setup guide
├── site.config.json       <- Brand config (name, domain, colors, CTA)
├── .pseo/                 <- pSEO engine (strategy + schemas + taxonomy + skills)
│   ├── SKILL.md           <- pSEO 2.0 methodology (7 phases)
│   ├── IMPROVE-SKILL.md   <- Post/category iteration with Ahrefs MCP
│   ├── NICHE-RESEARCH-SKILL.md <- Niche taxonomy from Ahrefs MCP
│   ├── CONTENT-AUDIT-SKILL.md  <- Blog health check & cannibalization
│   ├── ONBOARDING-SKILL.md     <- Blog initialization guide
│   ├── BRANDING-SKILL.md       <- Visual identity application
│   ├── schemas/           <- TypeScript interfaces per content type
│   ├── taxonomy/          <- Industry verticals + content registry
│   ├── samples/           <- Reference JSONs
│   └── references/        <- Phase-by-phase guides
├── content/               <- JSON files (one per page)
│   ├── hubs/              <- Hub pages (high-volume keywords)
│   ├── resources/         <- Industry-specific pages
│   ├── guides/            <- How-to guides
│   ├── alternatives/      <- "[X] alternatives" pages
│   ├── comparisons/       <- "[A] vs [B]" pages
│   ├── tools/             <- Interactive calculators
│   └── industries/        <- Per-vertical landing pages
├── templates/             <- 11 HTML templates (incl. listing, styleguide, seo-dashboard)
├── scripts/               <- build.sh, validate.sh, keyword-map.js, og-image.js
├── assets/                <- Logo, favicon, content images
├── .env.example           <- Environment variables template
└── public/                <- Built output (gitignored, deploy-ready)
```

---

## Two Roles: Developer vs Content Editor

This repo is designed for **two distinct roles** working on different cadences:

| | Developer | Content Editor |
|--|-----------|----------------|
| **Cadence** | Weekly (15 min) | Daily / on-demand |
| **API keys needed?** | Yes (Ahrefs, PostHog, GSC) | No — works 100% offline |
| **What they do** | Refresh data, enrich keywords, maintain scripts | Create/improve pages using local data |
| **Tools** | Terminal, API keys, `.env` | Claude (Cowork or Claude Code) + this repo |

The developer refreshes data once a week and commits the updated files. Content editors then pull and work entirely from the **local database** — no API keys, no MCP servers, no external calls.

---

## Developer Weekly Routine (15 min)

Run these scripts to refresh the local data that content editors will use:

```bash
# 1. Refresh analytics (PostHog pageviews + GSC rankings)
node scripts/analytics-snapshot.js

# 2. Rebuild keyword map (cannibalization detection)
node scripts/keyword-map.js

# 3. (Optional) Generate research briefs locally
node scripts/research-brief.js --all
# Briefs are gitignored — editors can generate on demand via Claude

# 4. (Optional) Enrich keyword cache via Ahrefs MCP
#    Only needed when new keywords were added to content
#    Enable Ahrefs MCP first via /mcp in Claude Code
```

Then commit the updated data files:

```bash
git add .pseo/analytics-snapshot.json .pseo/keyword-metrics-cache.json public/assets/keyword-map.json
git commit -m "Weekly data refresh: analytics + keyword map"
git push
```

### What gets refreshed

| File | Source | What it contains |
|------|--------|-----------------|
| `.pseo/analytics-snapshot.json` | PostHog + GSC APIs | Pageviews, top pages, search queries, positions, CTR |
| `.pseo/keyword-metrics-cache.json` | Ahrefs MCP | Volume, KD, CPC per keyword (additive cache) |
| `public/assets/keyword-map.json` | Built from content JSONs | All keywords across all pages + cannibalization conflicts |
| `.pseo/briefs/*.md` | All of the above | One research brief per page (gitignored) |

### Setup (one-time, developer only)

1. `cp .env.example .env` -> fill in `AHREFS_MCP_KEY`, `POSTHOG_API_KEY`, `GSC_SERVICE_ACCOUNT_JSON`
2. `cp .mcp.json.example .mcp.json` -> configure Ahrefs MCP server
3. `npm install` (for analytics + OG image scripts)

---

## Content Editor Workflow

**No API keys needed.** All data lives in committed files. Just open this repo folder in Claude (Cowork or Claude Code) and start working.

### Setup (one-time)

1. Clone this repo
2. Open the folder in Claude (Cowork mode or Claude Code)
3. That's it — no `.env`, no API keys, no MCP configuration

### Research briefs — your starting point

When you want to improve a page, just tell Claude which one. Claude will automatically generate a **research brief** — a structured report consolidating all local data:

- Page overview (file, URL, type, industry)
- Current keywords with Ahrefs metrics (volume, KD, CPC)
- Traffic data from PostHog + ranking data from GSC
- Keyword cannibalization conflicts
- Content health scorecard (interlinks, refs, tips, FAQ)
- Related pages in the same industry (for interlinking)
- Keyword opportunities not yet used by this page
- Suggested actions (prioritized fixes)

**How it works:**

```
You:    "I want to improve the getting started tips page"
Claude: [generates research brief with all data]
Claude: "What would you like to focus on? Here are the suggested actions..."
You:    "Fix the description and add more pro tips"
Claude: [applies the changes, validates, rebuilds]
```

You can also generate briefs locally with `node scripts/research-brief.js --all` and browse them at `.pseo/briefs/<slug>.md`.

### Your data sources (all local, no APIs)

| File | What it contains | Updated by |
|------|-----------------|------------|
| `.pseo/analytics-snapshot.json` | PostHog pageviews + GSC rankings/CTR | Developer (weekly) |
| `public/assets/keyword-map.json` | All keywords + cannibalization conflicts | Developer (weekly) |
| `.pseo/keyword-metrics-cache.json` | Ahrefs metrics: volume, KD, CPC | Developer (weekly) |
| `.pseo/taxonomy/` | Content plan, registry, industry keywords | Developer (as needed) |

### Daily workflow

```
1. PULL LATEST DATA
   git pull
   -> Get freshest analytics + keyword cache

2. TELL CLAUDE WHAT YOU WANT TO IMPROVE
   "I want to improve the getting started tips page"
   -> Claude generates research brief automatically
   -> Shows you the data + suggested actions

3. ADD YOUR CONTEXT & CONFIRM
   "Fix the description and add FAQs"
   -> or "Fix everything"
   -> or "Also target 'growth strategy' as a keyword"

4. CLAUDE APPLIES CHANGES
   -> Edits the JSON, validates, rebuilds

5. COMMIT & PUSH
   git add content/... && git commit && git push
   -> Deploys automatically via your hosting provider
```

### Example: Improve a page (conversational)

```
You:    "I want to improve the getting started tips page"

Claude: [reads all local data files, generates brief]

        # Research Brief: Getting Started Tips

        ## Content Health
        | Metric          | Current | Target | Status   |
        | SEO description | 157     | <=155  | TOO LONG |
        | FAQ items       | 3       | 5-6    | LOW      |
        ...

        ## Suggested Actions
        - Shorten SEO description (157 -> <=155 chars)
        - Add FAQ items (3 -> 5-6)

        What would you like to focus on?

You:    "Fix the description and add more FAQs"

Claude: [edits the JSON, validates, rebuilds]

        ## Changes Applied
        | What            | Before        | After         |
        | Description     | 157 chars     | 152 chars     |
        | FAQ items       | 3             | 6             |
```

### Example: Fix keyword cannibalization

You check `/seo-dashboard` and see a keyword is used by 3 pages. Tell Claude:

```
"The keyword 'growth strategy' has cannibalization across 3 pages.
Check keyword-map.json and differentiate the keywords."
```

Claude will:
1. Read `public/assets/keyword-map.json` -> identify which pages conflict
2. Read each conflicting JSON -> understand what each page is really about
3. Replace duplicated keywords with more specific alternatives per page
4. Validate and rebuild

### Example: Create a new page from the plan

You check `_registry.json` and see a resource is missing. Tell Claude:

```
"Create a resource page about getting started tips for the health industry.
Check the taxonomy for keywords and existing pages for style reference."
```

Claude will:
1. Read `.pseo/taxonomy/` -> relevant vertical keywords
2. Read `.pseo/keyword-metrics-cache.json` -> volume/KD for those keywords
3. Read an existing resource JSON as template -> match quality and structure
4. Generate the JSON, validate, and build

### Example: Add interlinking to a vertical

You notice pages in a vertical have few internal links. Tell Claude:

```
"Check all health content pages and add 2-4 contextual interlinks to each.
Only link to pages that exist."
```

Claude will scan all relevant JSON files, cross-reference with existing pages, and add contextual `<a href>` links within body text fields.

### What you CAN'T do without the developer

Some tasks require API keys and should be requested from the developer:

| Task | Why it needs the developer |
|------|--------------------------|
| Refresh analytics snapshot | Needs PostHog + GSC API keys |
| Enrich new keywords with Ahrefs metrics | Needs Ahrefs MCP key |
| Run live competitor analysis | Needs Ahrefs MCP |
| Add a completely new niche from scratch | Needs Ahrefs MCP for keyword research |

For these, ask the developer to run the refresh and commit the updated data files.

### Add a New Niche

When you have keyword research for a new topic:

**Option A — Paste data directly:**
```
Niche research for "organic skincare".
Here's the Ahrefs data:

| Keyword | Volume | KD | CPC |
|---------|--------|-----|-----|
| organic skincare tips | 320 | 12 | $2.40 |
| natural beauty rewards | 210 | 8 | $1.80 |
| ...
```

**Option B — Attach a CSV export:**
```
Niche research. Attached: ahrefs-keywords-export.csv
```

**Option C — Let Claude pull data via Ahrefs MCP:**
```
Niche research for "organic skincare". Use Ahrefs to find keywords and competitors.
```

Claude queries Ahrefs via MCP and generates two files:
- `{niche}.json` -> saves to `.pseo/taxonomy/`
- `_registry-update.json` -> merge into `.pseo/taxonomy/_registry.json`

---

## How to Create New Posts

Every page = a JSON file in `content/`. The JSON follows a strict schema. Templates handle all design.

### Step 1: Pick your content type

| Type | Schema | Folder | Example slug |
|------|--------|--------|--------------|
| Resource | `.pseo/schemas/resource-page.ts` | `content/resources/` | `getting-started-tips-health` |
| Guide | `.pseo/schemas/guide-page.ts` | `content/guides/` | `complete-guide-growth-engine` |
| Hub | `.pseo/schemas/hub-page.ts` | `content/hubs/` | `customer-retention` |
| Alternatives | `.pseo/schemas/alternatives-page.ts` | `content/alternatives/` | `competitor-x-alternatives` |
| Comparison | `.pseo/schemas/comparison-page.ts` | `content/comparisons/` | `tool-a-vs-tool-b` |
| Tool | `.pseo/schemas/tool-page.ts` | `content/tools/` | `roi-calculator` |
| Industry | `.pseo/schemas/industry-page.ts` | `content/industries/` | `health-wellness` |

### Step 2: Generate the JSON with Claude

Open this repo in Claude and say:

```
"Create a resource page about getting started tips for the health industry"
```

Claude will:
1. Read `CLAUDE.md` -> understand the project
2. Read `.pseo/schemas/resource-page.ts` -> know the exact JSON structure
3. Read `.pseo/taxonomy/` -> inject industry context
4. Read an existing content JSON -> match quality
5. Output a valid JSON file -> `content/resources/getting-started-tips-health.json`

### Step 3: Build

```bash
bash scripts/validate.sh   # Check JSON is valid
bash scripts/build.sh      # Generate HTML in public/
```

### Concrete examples of prompts

**Single page:**
```
"Generate a resource page: 20 tips for health industry customer retention"
```

**Batch by industry:**
```
"Generate all 7 resource subtypes for the health vertical"
```

**Specific content type:**
```
"Create a comparison page: Tool A vs Tool B"
```

**Tool page:**
```
"Create the ROI calculator tool page"
```

---

## How to Improve Existing Posts

Claude has a dedicated `improve-content` skill that queries Ahrefs via MCP for real SEO data before making changes.

### Quick edits (no Ahrefs needed)

```
"Add more interlinking to health posts"
"Improve the pro_tips in getting-started-tips — make them more specific"
"Update the industry_benchmarks with 2026 data"
```

### SEO-driven improvements (uses Ahrefs MCP)

```
"The getting started tips post isn't ranking well — improve it"
"A competitor published a better guide, we need to respond"
"Run an audit of all health content"
```

Claude will:
1. Read the current content and produce a diagnostic
2. Query Ahrefs via MCP for keyword data, competitor analysis, and content gaps
3. Apply improvements based on real data
4. Validate and rebuild

### Content audit

Run a full health check across all content:

```
"Run a content audit"
"Check for keyword cannibalization"
```

The audit checks: keyword conflicts, interlinking health, external references, content depth, schema compliance, and coverage gaps.

**Visual dashboard:** After building, visit `/seo-dashboard` (password configured in `site.config.json`) to see an interactive keyword tree with conflict highlighting and KD/volume metrics.

### Adding images to posts

Each post can have 1-4 inline images (WebP, stored in `assets/images/`). The workflow uses two skills:

**Step 1 — Generate prompts:**

```
"Generate image prompts for example-getting-started-tips"
```

Claude will analyze the post content and output ready-to-paste prompts with:
- Image description optimized for your image generator
- Keyword-rich alt text (pulled from the page's SEO keywords)
- Suggested placement within the post
- Optional caption

**Step 2 — Generate images externally:**

Copy each prompt into your preferred image generator and download the results.

**Step 3 — Compress and attach:**

```
"Attach image ~/Downloads/tips-hero.png to example-getting-started-tips"
```

Claude will:
1. Compress the image to WebP (quality 80, max 1200px width)
2. Save it to `assets/images/resource-example-getting-started-tips-1.webp`
3. Add the image entry to the content JSON with alt text and placement
4. Rebuild to verify rendering

**Image count per content type:**

| Type | Images | Placement |
|------|--------|-----------|
| Resource | 1-2 | After intro, after a section |
| Guide | 2-3 | After intro + key sections |
| Alternatives | 1-2 | After intro, after recommendation |
| Tool | 0-1 | After intro |
| Industry | 1-2 | After overview, after pain points |
| Hub / Comparison | 0 | No images |

### Keyword enrichment

Keyword metrics (KD, volume, CPC) are fetched via the Ahrefs MCP during skill execution and cached in `.pseo/keyword-metrics-cache.json`. The build automatically applies cached metrics to the keyword map and SEO dashboard.

Metrics are cached in `.pseo/keyword-metrics-cache.json` (committed to the repo). Subsequent builds automatically apply cached metrics. The cache is additive — new keywords are fetched via MCP and merged, existing ones are preserved.

### Quality checklist

After editing, verify:
- Does the content pass `bash scripts/validate.sh`?
- Would this be useful if search engines didn't exist?
- If you swap the industry name, does the content still make sense? -> too generic, rewrite
- Check `/seo-dashboard` for new keyword conflicts

---

## Design System

All templates share CSS variables configured in `site.config.json` — edit the config to rebrand:

| Variable | Config path | Usage |
|----------|-------------|-------|
| `--accent` | `design.accent` | Primary brand color |
| `--accent-light` | `design.accent_light` | Backgrounds, tags |
| `--accent-dark` | `design.accent_dark` | Hover states |
| `--dark` | `design.dark` | Text, dark sections |
| `--font-heading` | Milling | Headings (h1-h4) |
| `--font-primary` | General Sans | Body text |
| `--font-code` | Inconsolata | Tags, labels, code |

Layout: **Minimal Masonry** (index) -- Icons: **SVG pictograms** via `icons.html` partial (sprite sheet)

**Style Guide:** Available at `/styleguide` — a visual reference of all reusable components (colors, typography, buttons, cards, badges, hero, CTA blocks, etc.). Useful for validating styles after changes. This page is `noindex` and excluded from the sitemap.

**SEO Dashboard:** Available at `/seo-dashboard` (password in `site.config.json`) — interactive keyword tree, cannibalization conflict table, and keyword search. Auto-generated from content JSONs at build time. Also `noindex` and excluded from the sitemap.

---

## Build Pipeline

```
content/*.json -> validate.sh -> build.sh -> public/*.html + sitemap.xml + keyword-map.json
```

- `validate.sh` — Checks required fields, array lengths, slug format, industry relevance
- `build.sh` — Reads each JSON, matches template by `content_type`, injects data, generates sitemap, index, keyword map, and static pages
- `keyword-map.js` — Scans all content JSONs, detects keyword cannibalization, outputs `public/assets/keyword-map.json`. Automatically applies cached Ahrefs metrics (KD, volume, CPC) from `.pseo/keyword-metrics-cache.json`.
- Templates render JSON client-side with vanilla JS (no framework dependency)

Build also generates:
- **Listing pages** — `/guides/`, `/tools/`, `/compare/` (aggregated from content JSONs)
- `sitemap.xml` — with lastmod, changefreq, priority per content type
- `robots.txt` + `llms.txt` — for search engines and LLM discovery
- `keyword-map.json` — keyword index with conflict detection + Ahrefs metrics (when cached)
- `seo-dashboard.html` — visual keyword tree with KD/volume metrics (noindex, password-protected)
- `styleguide.html` — component reference (noindex)

---

## Available Skills

All skills live in `.pseo/` and use the Ahrefs MCP server for SEO data (configured via `.mcp.json`). The Ahrefs MCP is disabled by default — enable it via `/mcp` before running skills that need SEO data.

| Skill | File | Trigger | What it does |
|-------|------|---------|-------------|
| `onboarding` | `ONBOARDING-SKILL.md` | "set up blog", "initialize", "get started" | Guides blog initialization: niche research, taxonomy, first batch |
| `branding` | `BRANDING-SKILL.md` | "apply brand", "brand book", "brand identity" | Applies visual identity from brand materials to `site.config.json` |
| `pseo-20` | `SKILL.md` | "generate pages", "batch content" | Full pSEO methodology for content generation at scale |
| `niche-research` | `NICHE-RESEARCH-SKILL.md` | "new niche", "niche research", "add vertical" | Uses Ahrefs MCP, generates taxonomy JSONs |
| `improve-content` | `IMPROVE-SKILL.md` | "improve", "update", "optimize" + post/category | Analyzes content, uses Ahrefs MCP, applies data-driven improvements |
| `content-audit` | `CONTENT-AUDIT-SKILL.md` | "audit", "health check", "check cannibalization" | Full blog audit with visual dashboard |
| `research-brief` | `RESEARCH-BRIEF-SKILL.md` | "research brief", "analyze", "diagnostic" | Generates research brief per page from local data |
| `image-prompts` | `IMAGE-PROMPT-SKILL.md` | "generate image prompts", "image prompts for [slug]" | Generates image prompts with keyword-rich alt text |
| `image-attach` | `IMAGE-ATTACH-SKILL.md` | "attach image", "add image to [slug]" | Compresses to WebP, stores in `assets/images/`, updates content JSON |
| `validate-urls` | `URL-VALIDATION-SKILL.md` | "validate urls", "check links", "fix broken links" | Verifies external reference URLs via WebFetch, replaces broken ones |
| `icon` | `ICON-SKILL.md` | "create icon", "add icon", "new icon" | Creates SVG icons, single source in `icons.html` partial |

**Skill cycle:** `onboarding` -> `niche-research` -> `pseo-20` -> `content-audit` -> `improve-content` -> repeat
**Image cycle:** `image-prompts` -> generate externally -> `image-attach`

---

## Deployment

The `public/` directory contains the complete built site, ready to deploy to any static hosting provider.

### Cloudflare Pages

```bash
# Build command: bash scripts/build.sh
# Output directory: public/
# Branch deploys: every PR gets a preview URL
```

### Vercel

```bash
# Build command: bash scripts/build.sh
# Output directory: public/
# Framework preset: Other
```

### Netlify

```bash
# Build command: bash scripts/build.sh
# Publish directory: public/
```

All three providers support automatic deploys from the `main` branch and preview URLs for pull requests. Configure via the provider's dashboard.
