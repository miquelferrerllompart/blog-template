---
name: validate-urls
description: "Validates and fixes external reference URLs in content JSONs. Triggers when generating new content (Phase 4), when the user says 'validate urls', 'check links', 'fix broken links', 'audit references', or when broken external references are detected. Uses WebFetch to verify URLs and WebSearch to find real replacements for broken ones. No static registry — all validation happens in real-time against live URLs."
---

# Validate URLs — External Reference Validation Skill

## Overview

This skill ensures every `external_references` URL in content JSONs is real, live, and returns useful content. It operates in two modes:

1. **Generation mode** — called during Phase 4 (content generation) to find and verify URLs *before* they enter the JSON
2. **Audit mode** — scans existing content files, checks every URL, and replaces broken ones

### Why This Exists

AI models fabricate URLs. Even when instructed to use real links, LLMs hallucinate plausible-looking slugs that return 404. This skill closes that gap by verifying every URL against the live web.

### Relationship With Other Skills

| Skill | Handoff |
|-------|---------|
| `pseo-20` (Phase 4) | After generating content JSON, call this skill to validate `external_references` before saving |
| `improve-content` | When improving external references, delegates URL finding/verification to this skill |
| `content-audit` | Audit mode runs as part of the full blog health check |

## When This Skill Triggers

- During content generation (Phase 4) — automatically validate URLs before writing JSON
- User says: "validate urls", "check links", "fix broken links", "audit references", "verify external links"
- User reports 404s or broken links on the blog
- After bulk content generation to verify all new files

---

## Mode 1: Generation — Find Real URLs

When generating a new content JSON, use this process to populate `external_references`:

### Step 1: Determine Topics Needed

Based on the page's content type, industry, and subtype, identify 3-5 topic queries. Example for a resource page:

```
- "ecommerce customer engagement strategies"
- "customer retention best practices"
- "online business growth examples"
```

### Step 2: Search for Real URLs

Use **WebSearch** with domain filtering to find real articles:

```
WebSearch(
  query: "{topic query}",
  allowed_domains: ["hubspot.com", "hbr.org", "bain.com", "forbes.com"]
)
```

#### Source Domain Priority

Always prefer higher-tier sources. Each page must have at least 2 Tier 1 sources.

| Tier | Domains | Notes |
|------|---------|-------|
| **Tier 1** | `hbr.org`, `bain.com`, major industry authorities | Most reliable, almost never block |
| **Tier 2** | `hubspot.com`, niche-specific publications | Reliable, good coverage |
| **Tier 3** | Developer docs, trade publications | For technical content only |

#### Hard-to-verify Domains (extra care required)

These domains block automated verification (WebFetch returns 403/timeout). URLs from them are valid but **cannot be auto-verified**. When using them:

1. **Only use URLs found via WebSearch results** — never fabricate slugs
2. If WebSearch returns a URL from these domains, it's likely real — use it
3. If you need to manually construct a URL for these domains, **don't** — search for it instead

| Domain | Verification issue |
|--------|-------------------|
| `forbes.com` | Returns 403 on WebFetch |
| `mckinsey.com` | Timeouts on WebFetch |
| `investopedia.com` | Blocked by WebSearch API |
| `nrf.com` | Deep links frequently 404 |
| `glossy.co`, `wwd.com`, `businessoffashion.com` | Block WebFetch |
| `beautyindependent.com`, `fooddive.com` | Block WebFetch |
| `qsrmagazine.com` | Returns 403 on WebFetch |
| `voguebusiness.com` | Blocks WebFetch |

**Key principle:** The domain isn't the problem — fabricated slugs are. A real Forbes article is perfectly fine as a reference. The risk is that AI invents a plausible-looking URL that doesn't exist.

### Step 3: Verify Each URL

For every URL found via WebSearch, verify it's live:

```
WebFetch(
  url: "{found_url}",
  prompt: "Does this page exist and have real content? Return YES or NO and a one-line description of what the page is about."
)
```

**Decision rules:**
- `200 + YES` → Use it
- `200 + NO` (redirect to homepage, paywall, error page) → Discard, search for alternative
- `403 / 404 / timeout` → Discard, search for alternative
- Redirect to different host → Follow redirect once, then verify

### Step 4: Format References

Build the `external_references` array with only verified URLs:

```json
{
  "title": "Descriptive Article Title (from the actual page)",
  "url": "https://verified-url.com/actual-path",
  "source": "Publisher Name"
}
```

**Rules:**
- 3-5 references per page
- Title must match the actual article title (not fabricated)
- At least 2 Tier 1 sources
- No competitor domains (defined in `site.config.json`)
- Industry-specific when possible

---

## Mode 2: Audit — Check & Fix Existing URLs

### Step 1: Scan Content Files

Identify target files based on user request:

| Scope | Files |
|-------|-------|
| All content | `content/**/*.json` |
| Single industry | `content/**/*-{industry-slug}*.json` |
| Single file | `content/{type}/{slug}.json` |

### Step 2: Extract All URLs

For each file, read `external_references` and extract all URLs.

### Step 3: Verify URLs (Batch)

Check each unique URL with WebFetch:

```
WebFetch(url: "{url}", prompt: "Does this page return real content? YES or NO.")
```

Categorize results:
- **Valid (200 + content)** → Keep
- **Broken (404)** → Must replace
- **Blocked (403)** → Must replace (unreliable domain)
- **Timeout** → Must replace (unreliable domain)

### Step 4: Find Replacements

For each broken URL, determine the topic from its `title` and `source` fields, then:

1. **WebSearch** for that topic on reliable domains
2. **WebFetch** to verify the replacement
3. Update the JSON file

### Step 5: Report

Output a summary:

```
URL Audit Results:
- Files scanned: X
- URLs checked: Y
- Valid: Z
- Replaced: W
- Details: [list of old → new replacements]
```

---

## Integration With Phase 4 (Content Generation)

When generating content via the `pseo-20` skill, the generation prompt should include this instruction:

> **Do NOT fabricate external reference URLs.** Leave the `external_references` array empty. After generation, the `validate-urls` skill will populate it with verified, live URLs found via WebSearch.

This two-step process ensures zero fabricated URLs:
1. Generate content JSON with `external_references: []`
2. Run `validate-urls` in generation mode to find and verify real URLs
3. Update the JSON with verified references

---

## Integration With validate.sh

The build-time `validate.sh` script should check that:
- `external_references` exists and has 3-5 items
- Each item has `title`, `url`, and `source` fields
- URLs are HTTPS
- No URLs point to competitor domains
- No URLs point to known-blocked domains (forbes.com, mckinsey.com, etc.)

The script catches structural issues. This skill catches *content* issues (fake URLs that look valid).

---

## Quick Reference: Reliable URL Sources by Topic

| Topic | Best search queries | Reliable domains |
|-------|-------------------|-----------------|
| Customer retention | "customer retention strategies" | hubspot.com, hbr.org, bain.com |
| Growth strategies | "business growth strategies" | hubspot.com, hbr.org |
| Marketing | "marketing best practices" | hubspot.com, hbr.org |
| Industry trends | "{industry} trends {year}" | hbr.org, industry-specific publications |
| Technology | "SaaS tools for {topic}" | relevant developer docs |

Customize this table for your niche by adding industry-specific topics and reliable domains from your `authoritative_sources` in the niche taxonomy JSON.
