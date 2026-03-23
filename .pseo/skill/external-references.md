# External References Guidelines

Every generated JSON must include an `external_references` array with 3-5 links. Pages without outbound links to authoritative sources look thin/affiliate to Google.

## Source Tier Priority

Always prefer higher-tier sources. Each page must have at least 2 Tier 1 sources.

| Tier | Sources | Domain Authority |
|------|---------|-----------------|
| **Tier 1** | Harvard Business Review, Forbes, McKinsey, major industry authorities | DA 80+ |
| **Tier 2** | HubSpot, Investopedia, niche-specific publications | DA 60-80 |
| **Tier 3** | Developer docs, industry-specific blogs, trade publications | DA 40-60 |

## Hard-to-verify Domains

These domains are **valid sources** but block automated URL verification (WebFetch returns 403/timeout). When using them, **only use URLs found via WebSearch** — never fabricate or guess a URL path:

Forbes, McKinsey, Investopedia, NRF, Glossy, WWD, Business of Fashion, Beauty Independent, Food Dive, QSR Magazine, Vogue Business

## Rules

1. **3-5 references per page** — no exceptions
2. **Topically relevant** — links must relate to the page's specific subject, not just the industry
3. **Mix of tiers** — at least 2 Tier 1, rest from Tier 2-3
4. **No competitor links** — never link to direct competitors (define your competitor list in `site.config.json`)
5. **Industry-specific when possible** — use topic-specific search queries for each industry
6. **NEVER fabricate URLs** — every URL must come from a real WebSearch result and be verified with WebFetch before inclusion. See `validate-urls` skill (`URL-VALIDATION-SKILL.md`) for the full process.

## URL Validation (MANDATORY)

**AI models fabricate URLs.** Even when instructed to use real links, LLMs hallucinate plausible slugs that 404. To prevent this:

1. **During generation:** Do NOT write URLs in `external_references` directly. Instead, leave it empty and use the `validate-urls` skill to find and verify real URLs via WebSearch + WebFetch.
2. **After generation:** Run the `validate-urls` skill in audit mode to verify all URLs in the batch.
3. **Build-time checks:** `validate.sh` validates structure (count, fields, HTTPS, no competitors).

See `.pseo/URL-VALIDATION-SKILL.md` for the complete validation workflow.

## Build-time Validation (`validate.sh`)

The script checks:
- `external_references` array exists and has 3-5 items
- Each item has `title`, `url`, and `source` fields
- URLs are valid HTTPS links
- No URLs point to competitor domains

See `examples/external-references.md` for the JSON format.
