# Interlinking Guidelines

Every content page must weave internal links naturally into body text — not just at the bottom in "Related" sections.

## Rules

1. **2-4 contextual inline links per page** within description/context fields (not in the `related` section — that's separate)
2. **Use HTML anchor tags** in JSON string fields: `<a href="/resources/slug">descriptive text</a>`
3. **Link text must be descriptive** — never "click here" or "read more". Use the topic as anchor.
4. **Link to relevant content types:** resources to other resources or guides in the same industry; guides to related resources or tools; tools to guides that explain the concept
5. **Spread links across sections** — don't cluster all links in the intro or a single section
6. **URL patterns:** `/resources/{slug}`, `/guides/{slug}`, `/tools/{slug}`, `/compare/{slug}`
7. **Only link to pages that exist** — reference the content plan and existing slugs. Never link to pages that haven't been created yet.

See `examples/interlinking.md` for before/after examples.
