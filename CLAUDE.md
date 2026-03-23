# pSEO Blog Template

## Project
**pSEO Blog** — Programmatic SEO blog template. Configure via `site.config.json`.
Domain: configured in `site.config.json` · Stack: Static HTML + JSON

## Getting Started
See `SETUP.md` for initial blog setup, niche research, and brand configuration.

## Architecture
| Component | Path | Purpose |
|-----------|------|---------|
| Site Config | `site.config.json` | Brand name, domain, colors, CTA, analytics — single source of truth |
| Templates | `templates/` | 11 HTML templates (resource, guide, hub, alternatives, comparison, tool, industry, listing, index, styleguide, seo-dashboard) |
| Styles | `templates/styles/` | Reusable CSS fragments included via `{{@name}}` (see Styles section) |
| Partials | `templates/partials/` | Reusable HTML fragments included via `{{>name}}` (see Partials section) |
| Snippets | `templates/snippets/` | Head snippets injected during build (see Snippets section) |
| Assets | `assets/` | Static files (logo, favicon) copied to `public/assets/` at build |
| Images | `assets/images/` | Inline content images (WebP), named `{type}-{slug}-{n}.webp` |
| Image Compress | `scripts/compress-image.js` | Converts images to WebP (quality 80, max 1200px width) via sharp |
| Content | `content/` | JSON files per page, organized by type |
| Schemas | `.pseo/schemas/` | TypeScript interfaces defining JSON structure per content type |
| OG Images | `scripts/og-image.js` | Generates 1200x630 PNG OG images per page (Satori + resvg) |
| Fonts | `scripts/fonts/` | Montserrat TTF files for OG image rendering |
| Build | `scripts/build.sh` | JSON + template -> static HTML in `public/` + sitemap.xml + llms.txt |
| SSG Render | `scripts/render.js` | Evaluates JS template literals at build time for pre-rendered HTML |
| Validate | `scripts/validate.sh` | Validates JSON against schema rules |
| Taxonomy | `.pseo/taxonomy/` | Industry verticals and keyword registry |
| pSEO Skill | `.pseo/SKILL.md` -> `.pseo/skill/` | Orchestrator + modular guidelines (writing style, interlinking, references, etc.) |
| Improve Skill | `.pseo/IMPROVE-SKILL.md` | Post/category iteration with Ahrefs MCP integration |
| Niche Research Skill | `.pseo/NICHE-RESEARCH-SKILL.md` | Niche taxonomy generation from Ahrefs MCP data |
| Content Audit Skill | `.pseo/CONTENT-AUDIT-SKILL.md` | Blog health check: cannibalization, interlinking, depth |
| Keyword Map | `scripts/keyword-map.js` | Scans content JSONs, generates `public/assets/keyword-map.json`. Applies cached Ahrefs metrics automatically |
| Keyword Cache | `.pseo/keyword-metrics-cache.json` | Persisted Ahrefs keyword metrics (volume, KD, CPC). Auto-applied at build time |
| Analytics Snapshot | `scripts/analytics-snapshot.js` | Fetches live GSC + PostHog data into `.pseo/analytics-snapshot.json`. Config: `.pseo/analytics-config.json` |
| Analytics Config | `.pseo/analytics-config.json` | Configurable settings for analytics snapshot (hosts, periods, limits, enable/disable sources) |
| Research Brief Skill | `.pseo/RESEARCH-BRIEF-SKILL.md` | Generates per-page research briefs on demand. Consolidates analytics, keywords, cannibalization, content health. No API keys needed |
| Research Brief Script | `scripts/research-brief.js` | Batch-generates briefs to `.pseo/briefs/` (gitignored). Run locally on demand |
| SEO Dashboard | `templates/seo-dashboard.html` | Visual keyword tree + conflict viewer + KD/volume metrics (noindex, password-protected) |

## Site Configuration (`site.config.json`)
All brand-specific values are centralized in `site.config.json`:
- **Brand:** name, tagline, description, domain, site URL
- **CTA:** URL, button text, UTM params, mid-article CTA copy
- **Design:** accent colors (`accent`, `accent_light`, `accent_dark`, `dark`, `light`)
- **Analytics:** PostHog toggle, key, and host
- **Listings:** titles and descriptions for `/guides/`, `/tools/`, `/compare/`
- **Index:** homepage title, description, hero copy
- **Dashboard:** password for the SEO dashboard

Templates and build scripts read from this file. No need to edit templates to rebrand.

## Design System
| Variable | Source |
|----------|--------|
| --accent | `site.config.json` → `design.accent` |
| --accent-light | `site.config.json` → `design.accent_light` |
| --accent-dark | `site.config.json` → `design.accent_dark` |
| --dark | `site.config.json` → `design.dark` |
| --light | `site.config.json` → `design.light` |
| --font-heading | Milling (headings, buttons) |
| --font-primary | General Sans (body, labels, captions) |
| --font-code | Inconsolata |
| Layout | **C: Minimal Masonry** |
| Icons | **SVG pictograms** via `icons.html` partial (sprite sheet, `<use href="#ic-name">`) |
| Spacing | 8px grid: `--sp-2` through `--sp-80` (2,4,6,8,10,12,14,16,20,24,28,32,36,40,48,56,60,64,80) |

## URL Structure
| Type | Pattern |
|------|---------|
| Resources | `/resources/{slug}` |
| Guides | `/guides/{slug}` |
| Alternatives | `/compare/{slug}` |
| Comparisons | `/compare/{slug}` |
| Tools | `/tools/{slug}` |
| Industries | `/industries/{slug}` |
| Listing (Guides) | `/guides/` |
| Listing (Tools) | `/tools/` |
| Listing (Compare) | `/compare/` |
| Style Guide | `/styleguide` (noindex) |
| SEO Dashboard | `/seo-dashboard` (noindex, password-protected) |

## Build Pipeline
```
content/*.json -> validate.sh -> build.sh -> public/*.html + sitemap.xml + keyword-map.json
```
Templates use `{{DATA}}`, `{{TITLE}}`, `{{DESCRIPTION}}`, `{{SLUG}}` placeholders, `{{@style-name}}` styles, and `{{>partial-name}}` partials — all resolved at build time.

**SSG rendering:** `scripts/render.js` evaluates JS template literals at build time via `new Function()`, injecting pre-rendered HTML into `<div id="app">`. Interactive JS (calculators, etc.) remains client-side. FAQPage JSON-LD schema is also moved to `<head>` at build time.

**OG Images:** `og-image.js` runs first in the build, generating `public/assets/og/{type}-{slug}.png` (1200x630) for each page + `index.png` + `listing-{tools,guides,compare}.png`. Uses Satori (JSX->SVG) + resvg (SVG->PNG) with Montserrat fonts. Logo mark is embedded as SVG data URI; decorative dots replace emojis (Satori limitation).

**OG/Twitter Cards:** Injected per-page in the build step (not as snippet) since they need page-specific data (`og:title`, `og:description`, `og:url`, `og:image`, `twitter:card=summary_large_image`).

Build also:
- Copies `assets/*` -> `public/assets/` (logo, favicon)
- Generates `public/assets/keyword-map.json` via `scripts/keyword-map.js` (keyword cannibalization map + cached Ahrefs metrics)
- Copies `templates/styleguide.html` -> `public/styleguide.html` (noindex, excluded from sitemap)
- Copies `templates/seo-dashboard.html` -> `public/seo-dashboard.html` (noindex, password-protected, excluded from sitemap)
- Injects all `templates/snippets/*.html` before `</head>` in every generated HTML file (alphabetical order)
- Generates listing pages (`/guides/`, `/tools/`, `/compare/`) by aggregating content JSONs into a shared `listing.html` template
- Generates `sitemap.xml` with `<lastmod>`, `<changefreq>`, `<priority>` per content type (tools 0.9, listings/industries 0.85, compare/guides 0.8, resources 0.7, home 1.0)
- Generates `robots.txt` with sitemap + llms.txt references
- Generates `llms.txt` (AEO — [llms.txt spec](https://llmstxt.org)) from content JSONs for LLM discovery (ChatGPT, Perplexity, Google AI Overviews)
- Minifies all HTML files (removes comments, collapses whitespace between tags) — zero external dependencies, pure Node

## Snippets (`templates/snippets/`)
Snippets are HTML fragments auto-injected before `</head>` in **every** page at build time. Use them for anything shared across all pages — never duplicate across templates.

| Snippet | Purpose |
|---------|---------|
| `favicon.html` | Favicon (`/assets/favicon.svg`) |
| `globals.html` | `window.SITE` global config: CTA URL, UTM builder (reads from `site.config.json`) |
| `heading-anchors.html` | Auto-generates anchor links on h2/h3/h4 headings with hover indicator, URL update, and clipboard copy |
| `posthog.html` | PostHog analytics (configurable via `site.config.json`) |
| `toc.html` | Auto-generates sticky Table of Contents from h2/h3 headings. Desktop: sidebar right of content. Mobile: collapsible block. Includes IntersectionObserver for active heading highlight and `scroll-margin-top` offset for sticky nav. Only renders if >=3 headings exist. |
| `footer-cta.html` | Sets footer CTA link href via global config |
| `mid-cta.html` | Auto-injects mid-article CTA block before the 3rd `h2` (if >=4 headings) |
| `schema-org.html` | Global `Organization` JSON-LD schema (name, URL, logo, sameAs) |

**Adding a new snippet:** Create `templates/snippets/{name}.html` — it will be injected automatically. Note: files load in alphabetical order, so `globals.html` is available before `posthog.html`.

**`window.SITE` API** (defined in `globals.html`):
- `SITE.CTA_URL` — base CTA URL (from `site.config.json`)
- `SITE.appUrl(source, campaign, content)` — returns full URL with UTM params (`utm_medium`, `utm_source`, optional `utm_campaign` and `utm_content`)

**Important:** `cta_url` was removed from all JSON schemas — CTA links are now centralized in `globals.html`. Only `headline`, `subtext`, and `cta_button` come from JSON content.

## Schema JSON-LD (AEO)
Each page has structured data for Google AI Overviews / featured snippets:

| Template | Schemas (all in `<head>` at build time) |
|----------|---------------------------------------------|
| index | `Blog` |
| listing | `CollectionPage` + `BreadcrumbList` |
| resource | `Article` + `BreadcrumbList` |
| guide | `Article` + `BreadcrumbList` + `FAQPage` |
| hub | `Article` + `BreadcrumbList` + `FAQPage` |
| tool | `WebApplication` + `BreadcrumbList` + `FAQPage` |
| alternatives | `Article` + `BreadcrumbList` + `FAQPage` |
| comparison | `Article` + `BreadcrumbList` + `FAQPage` |
| industry | `CollectionPage` + `BreadcrumbList` + `FAQPage` |

Global `Organization` schema is injected via `schema-org.html` snippet on all pages.

## Styles (`templates/styles/`)
Reusable CSS fragments included in templates via `{{@name}}` syntax. Resolved at build time from `templates/styles/{name}.html`.

| Style | Purpose | Used by |
|-------|---------|---------|
| `base-css` | CSS reset, `:root` variables (colors, radii, spacing), body/link styles, mobile spacing overrides | All templates |
| `header-css` | Sticky header, nav links, CTA button, burger menu, mobile menu | All templates |
| `cta-css` | CTA block styles (`.cta-block`, `.cta-btn`) | resource, guide, alternatives, comparison, tool |
| `faq-css` | FAQ accordion styles (`.faq-section`, `.faq-q`, `.faq-a`) | guide, alternatives, comparison, tool |
| `footer-css` | Footer styles (`.site-footer`) | All templates |
| `related-css` | Related links styles (`.related`, `.related-link`) | resource, guide |
| `tool-css` | Tool page components (calculator, how-to, benchmarks, use cases, examples, methodology) | tool, styleguide |
| `content-img-css` | Inline content images (`.content-img`, `figcaption`) | resource, guide, alternatives, tool, industry |

**Adding a new style:** Create `templates/styles/{name}.html` and reference it with `{{@name}}` in the templates that need it.

## Partials (`templates/partials/`)
Reusable HTML fragments included in templates via `{{>name}}` syntax. Resolved at build time from `templates/partials/{name}.html`.

| Partial | Purpose | Used by |
|---------|---------|---------|
| `header` | Sticky header with logo, nav links, CTA, burger menu + mobile menu. Includes inline `<script>` for CTA URL and mobile menu close. | All templates |
| `footer` | Footer HTML markup | All templates |
| `icons` | SVG sprite sheet with all pictogram icons (`ic-*`). Referenced via `<use href="#ic-name">`. | index, listing, tool, industry, styleguide |

**Adding a new partial:** Create `templates/partials/{name}.html` and reference it with `{{>name}}` in the templates that need it.

## Terms
| Term | Meaning |
|------|---------|
| pSEO | Programmatic SEO — AI generates pages at scale via JSON schemas |
| Vertical | Industry niche (e.g., fashion, beauty, health) |
| Batch | Content rollout group (~30 pages each) |
| Hub & Spoke | Architecture where hub pages capture high-volume keywords, spoke pages target long-tail keywords and link up to hubs |

## Available Skills
| Skill | Source | Trigger | What it does |
|-------|--------|---------|-------------|
| `onboarding` | `.pseo/ONBOARDING-SKILL.md` | "set up blog", "initialize", "get started" | Guides blog initialization: niche research, taxonomy setup, first content batch |
| `branding` | `.pseo/BRANDING-SKILL.md` | "apply brand", "brand book", "brand identity" | Applies visual identity from brand materials to `site.config.json` and templates |
| `niche-research` | `.pseo/NICHE-RESEARCH-SKILL.md` | "new niche", "niche research", "add a vertical", Ahrefs data | Uses Ahrefs MCP for keyword research, generates taxonomy JSONs in `.pseo/taxonomy/` |
| `pseo-20` | `.pseo/SKILL.md` | "generate pages", "batch content" | Full pSEO methodology for content generation at scale |
| `improve-content` | `.pseo/IMPROVE-SKILL.md` | "improve", "update", "iterate", "refresh", "optimize" + post/category reference; ranking drops; competitor outranking | Analyzes existing posts/tools/categories, uses Ahrefs MCP for SEO data, applies data-driven improvements |
| `content-audit` | `.pseo/CONTENT-AUDIT-SKILL.md` | "audit", "health check", "content review", "check cannibalization", "SEO audit" | Runs full blog audit: keyword cannibalization (via keyword-map.json), interlinking, references, depth, coverage. Visual dashboard at `/seo-dashboard` |
| `research-brief` | `.pseo/RESEARCH-BRIEF-SKILL.md` | "improve", "optimize", "work on", "fix" + page slug; "research brief", "analyze", "diagnostic"; "what should I improve?" | Generates a research brief consolidating analytics, keywords, cannibalization, content health for a specific page. No API keys needed. Waits for user input before making changes |
| `image-prompts` | `.pseo/IMAGE-PROMPT-SKILL.md` | "generate image prompts", "image prompts for [slug]" | Generates Nanobanana 2 prompts with keyword-rich alt text and placement metadata |
| `image-attach` | `.pseo/IMAGE-ATTACH-SKILL.md` | "attach image", "add image to [slug]" | Compresses image to WebP, stores in `assets/images/`, updates content JSON |
| `validate-urls` | `.pseo/URL-VALIDATION-SKILL.md` | "validate urls", "check links", "fix broken links", "audit references"; also runs automatically during Phase 4 content generation | Verifies external reference URLs in real-time via WebFetch, replaces broken ones via WebSearch. No static registry — all validation is live |
| `icon` | `.pseo/ICON-SKILL.md` | "create icon", "add icon", "new icon" | Creates SVG icons following DRY principles — single source in `templates/partials/icons.html`, synced to `assets/icons.svg` |

## Content Style
- **Target:** Your target audience as defined during onboarding. Configure the specific persona via the branding and onboarding skills.
- **Tone:** Direct, reader-first. Four pillars: (1) Direct & unambiguous — every word earns its place, (2) Technically precise — exact when talking tech, no euphemisms, (3) Reader-first — sell outcomes not features, (4) Aspirational without grandiosity — facts not promises. Conversational but precise.
- **Interlinking:** Every page must have 2-4 contextual inline links (`<a href>`) to other blog articles within body text fields. Separate from the `related` section at the bottom.
- **Link format in JSON:** `<a href="/resources/{slug}">descriptive anchor text</a>` — only link to existing pages
- **Paragraph density:** No more than 5-6 lines without a line break. In JSON body/description fields, separate paragraphs with `\n`. Templates split on `\n` to render `<p>` tags with spacing.
- Full guidelines in `.pseo/skill/` (brand-target, writing-style, interlinking, external-references + examples)

## Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `AHREFS_MCP_KEY` | `.env` (gitignored) | Ahrefs MCP Bearer token. Used by the Ahrefs MCP server (configured in `.mcp.json`). |
| `POSTHOG_API_KEY` | `.env` (gitignored) | PostHog personal API key. Used by `scripts/analytics-snapshot.js` for traffic data. |
| `GSC_SERVICE_ACCOUNT_JSON` | `.env` (gitignored) | Google Search Console service account JSON (stringified). Used by `scripts/analytics-snapshot.js` for ranking data. |

Setup: `cp .env.example .env` and `cp .mcp.json.example .mcp.json`, then fill in your keys. Analytics config (hosts, periods, limits) lives in `.pseo/analytics-config.json`.

**Ahrefs MCP:** Disabled by default (`"disabled": true` in `.mcp.json`). To activate on-demand, use `/mcp` in Claude Code and enable the Ahrefs server when needed (e.g., for niche-research, improve-content, or keyword enrichment).
