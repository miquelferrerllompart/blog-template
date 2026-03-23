# Niche Workflow

## Per-niche workflow

For each niche the user wants to work on:

1. Read `references/phase-1-taxonomy.md`
2. Build the complete niche context JSON — this is the MOST critical step (~60% of total effort)
3. Validate depth: every field must produce meaningfully different content vs other niches
4. Generate sample pages to verify quality before scaling
5. Only proceed to full generation after user approves samples

## Multi-niche orchestration

When working across multiple niches:

- Maintain a master registry of all niches with status (draft / validated / generated / live)
- Track which content categories are active per niche
- Calculate total page count: `niches x content_types = pages`
