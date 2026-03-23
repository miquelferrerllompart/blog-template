# Setting Up Your Blog

This template creates a static pSEO blog powered by JSON content + HTML templates. No CMS, no framework — just a build script that combines JSON data with templates to generate static HTML.

## Option A: Conversational Setup (Recommended)

Open this repo in Claude Code and provide your niche research materials:

```
"I want to set up a blog about [your topic]. Here's my research: [attach files or paste data]"
```

Claude will guide you through the setup using the **onboarding skill** — asking targeted questions and generating all config files.

### What to prepare:
- **Niche research** — keyword data, competitor analysis, audience notes (any format)
- **Brand assets** (optional) — logo SVG, brand colors, style guide
- **Domain** — where will this blog live? (e.g., blog.mybrand.com)
- **CTA destination** — where should "Get Started" buttons link?

## Option B: Manual Setup

1. Copy `site.config.example.json` to `site.config.json`
2. Edit with your brand values (name, domain, colors, CTA)
3. Edit `.pseo/skill/brand-target.md` with your audience description
4. Create your taxonomy in `.pseo/taxonomy/`
5. `npm install && npm run build`

## What Gets Configured

| File | Purpose |
|------|---------|
| `site.config.json` | Brand name, domain, colors, CTA, analytics |
| `CLAUDE.md` | Project docs for Claude (architecture, skills, conventions) |
| `.pseo/taxonomy/*.json` | Niche keywords, verticals, content plan |
| `.pseo/taxonomy/_registry.json` | Content registry tracking all planned/published pages |
| `.pseo/skill/brand-target.md` | Target audience description |
| `.pseo/analytics-config.json` | Analytics integration (PostHog, GSC) |

## After Setup

1. **Apply branding** (optional): Provide a brand book → Claude applies colors, fonts, logos
2. **Generate content**: Use the `/pseo-20` skill to create your first batch of pages
3. **Build & preview**: `npm run build && npx serve public -p 3000`
4. **Deploy**: Push `public/` to Cloudflare Pages, Vercel, or Netlify

## Environment Variables (for advanced features)

Copy `.env.example` to `.env` and fill in:

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `AHREFS_MCP_KEY` | Optional | Keyword research via Ahrefs MCP |
| `POSTHOG_API_KEY` | Optional | Traffic analytics |
| `GSC_SERVICE_ACCOUNT_JSON` | Optional | Search Console ranking data |

These are only needed for the developer role (analytics refresh, keyword enrichment). Content editors work entirely from local data.
