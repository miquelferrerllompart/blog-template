# Onboarding Skill — Initialize a New Blog

## Trigger
- "set up blog", "initialize", "onboard", "start new blog"
- First conversation in a fresh template repo (site.config.json has placeholder values)
- User provides niche research documents or materials

## Overview
This skill guides the setup of a new blog from the template. It adapts to whatever the user provides — keyword data, written briefs, competitor URLs, or just a verbal description.

## Input: Niche Research Bundle
The user may provide any combination of:
- Keyword data (CSV, spreadsheet paste, Ahrefs exports)
- Written notes about the niche, audience, competitors
- Competitor URLs to analyze
- Brand book or style guide
- Or just a verbal description ("I want a blog about X")

## Phase 1: Understand the Niche

### Read all provided materials and extract:
- Primary topic / niche name
- Target audience (who reads this blog?)
- Key competitors (domains, products)
- Core keywords + volumes (if provided)
- Content gaps / opportunities

### Ask the user to confirm or fill gaps:
1. "Based on your research, the niche is **[X]** targeting **[Y]**. Correct?"
2. "Who is the primary audience?" (e.g., small business owners, developers, marketers)
3. "What problem does your product/brand solve for them?"
4. "Who are the main competitors in this space?"

**If the user only gave a verbal description:** Use Ahrefs MCP (if available) to research keywords, or ask the user to provide keyword data.

## Phase 2: Brand Configuration

Ask targeted questions — only what can't be derived from the research:

### Required:
1. **Brand name** — "What's the brand name?"
2. **Blog domain** — "What domain will this blog live on?" (e.g., blog.mybrand.com)
3. **Main product/site URL** — "What's your main website?" (e.g., https://mybrand.com)
4. **CTA destination** — "Where should CTA buttons link?" (e.g., signup page, app store)
5. **CTA button text** — "What should CTA buttons say?" (e.g., "Get Started →", "Try Free →")

### Optional (with smart defaults):
6. **Accent color** — Suggest a palette based on the niche, or ask for hex code. Default: #7000FF
7. **Logo** — "Do you have an SVG logo file? Or we'll use a placeholder."
8. **Analytics** — "Do you use PostHog? If so, provide the project key and API host."

### Generate `site.config.json` from answers
Write the config file with all gathered values. Use sensible defaults for anything not provided.

## Phase 3: Taxonomy & Content Plan

From the keyword data + niche understanding:

### Generate taxonomy files:
1. `.pseo/taxonomy/{niche-slug}.json` — structured taxonomy with:
   - Niche name and description
   - Verticals/subtopics (5-15)
   - Keywords per vertical with volumes/KD (if available)
   - Content type recommendations per vertical

2. `.pseo/taxonomy/_registry.json` — content plan with:
   - All planned pages (type × topic)
   - Status tracking (planned/published)
   - Estimated page count

### Generate brand context:
3. `.pseo/skill/brand-target.md` — audience description based on Phase 1 answers

### Present the content plan for approval:
- "I've planned **[N] pages** across [types]. Here's the breakdown..."
- Show table: type | count | example topics
- "Should I adjust the scope? Add/remove content types? Change the verticals?"

## Phase 4: Generate Config Files

Once approved, write all configuration files:

1. **`site.config.json`** — full brand configuration
2. **`CLAUDE.md`** — project documentation for Claude (from template, with brand values injected)
3. **`.pseo/analytics-config.json`** — with configured domain
4. **`.pseo/skill/brand-target.md`** — audience description
5. **Placeholder assets** — if no logo provided, note that `assets/logo.svg` and `assets/favicon.svg` are placeholders

### CLAUDE.md generation
Read the existing CLAUDE.md template and replace all `{{PLACEHOLDER}}` values with the configured brand values. Update:
- Project name and description
- Domain and URLs
- Design system colors
- Content plan section (from taxonomy)
- Available skills table

## Phase 5: Verify & Next Steps

1. Run `npm install` if not already done
2. Run `npm run build` — verify it succeeds (may use example content or be empty)
3. If build succeeds, print:

```
✅ Blog initialized successfully!

Next steps:
1. Replace placeholder logo: assets/logo.svg, assets/favicon.svg, assets/icon.svg
2. (Optional) Apply branding: provide a brand book and use the branding skill
3. Generate content: use the /pseo-20 skill to create your first batch of pages
4. Deploy: push public/ to Cloudflare Pages, Vercel, or Netlify
```

## Notes
- If the user provides a brand book along with niche research, suggest running the **branding skill** after onboarding to apply visual identity.
- The onboarding skill can be re-run to update configuration, but will warn about overwriting existing files.
- Content generation is intentionally separate — use /pseo-20 after onboarding.
