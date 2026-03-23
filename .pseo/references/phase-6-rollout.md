# Phase 6: Rollout & Monitoring

Never publish all pages at once. Progressive rollout lets you monitor indexing, catch issues early, and adjust before scaling.

## Rollout Schedule

### Week 1-2: Batch 1 (500-1,000 pages)

**What to publish:**
- Top 20-30 niches with highest search volume
- Resource pages only (highest impact category)
- Focus on long-tail, lower competition keywords

**Why start here:**
- Resource pages drive most traffic in the reference case
- Long-tail keywords rank faster (days vs weeks)
- Smaller batch = easier to monitor and fix issues

**Actions after publish:**
- Submit sitemap to Google Search Console
- Request indexing for 50-100 priority pages manually
- Monitor crawl stats daily
- Check for any crawl errors

### Week 3-4: Batch 2 (2,000-3,000 pages)

**What to publish:**
- Remaining niches for resource pages
- Free tools for top-performing niches from Batch 1
- Templates for highest-traffic niches

**Decision gate:** Only proceed if Batch 1 shows:
- >50% pages crawled within 14 days
- No indexing penalties or manual actions
- Rankings appearing for target keywords
- Engagement metrics (time on page, bounce rate) within acceptable range

### Week 5-8: Batch 3+ (remaining pages)

**What to publish:**
- All remaining content types
- Guides, alternatives, comparisons
- Deeper subtopic pages

**Cadence:** 1,000-2,000 pages per week, monitoring between each batch.

## Monitoring Dashboard

### Google Search Console (primary)

Track weekly:
- **Pages indexed** — target: >80% within 90 days of publish
- **Total clicks** — growth trend week over week
- **Total impressions** — broader indicator of visibility
- **Average CTR** — by content type (tools should be higher)
- **Average position** — trending direction per category
- **Crawl stats** — pages crawled per day, crawl budget usage
- **Index coverage** — discovered, crawled, indexed, excluded

### Analytics (GA4 or equivalent)

Track per content type:
- **Sessions per page type** — which categories drive traffic
- **Bounce rate** — by content type (tools < 70%, resources < 80%)
- **Time on page** — tools and checklists should be higher
- **Pages per session** — internal linking effectiveness
- **Conversion events** — if applicable (signups, downloads)

### Custom tracking

Build a simple dashboard tracking:
```
| Metric                     | Batch 1 | Batch 2 | Batch 3 | Total   |
|---------------------------|---------|---------|---------|---------|
| Pages published            |         |         |         |         |
| Pages indexed              |         |         |         |         |
| Index rate (%)             |         |         |         |         |
| Weekly clicks              |         |         |         |         |
| Weekly impressions         |         |         |         |         |
| Avg. position              |         |         |         |         |
| Top performing niche       |         |         |         |         |
| Top performing type        |         |         |         |         |
```

## Alert Thresholds

### Green (healthy)
- Index rate > 60% after 30 days
- Clicks growing week over week
- No manual actions in GSC
- Bounce rate < 80% for resources, < 70% for tools

### Yellow (investigate)
- Index rate 30-60% after 30 days
- Clicks flat or slightly declining
- High % of "Crawled - currently not indexed" pages
- Bounce rate 80-90%

### Red (pause rollout)
- Index rate < 30% after 30 days
- Pages being deindexed
- Manual action in GSC
- Bounce rate > 90%
- Significant traffic drop after a Google update

## Red Flag Response Playbook

### "Crawled but not indexed" (many pages)

Likely causes:
1. Content too thin or too similar across pages → improve niche context depth
2. Internal linking insufficient → add more cross-links
3. Page quality signals too low → improve UX components

Actions:
- Compare indexed vs not-indexed pages — find the pattern
- Improve content depth for non-indexed pages
- Add more unique value (interactive elements, tools)
- Resubmit after improvements

### Traffic drop after Google update

Actions:
- Check which pages/categories lost traffic
- Compare with Google's stated update focus
- Audit affected pages for quality signals
- Do NOT panic-edit thousands of pages
- Wait 2-4 weeks for volatility to settle before major changes

### Very low engagement (high bounce, low time)

Actions:
- Check if pages load correctly (SSG issues, broken components)
- Verify content matches search intent
- Improve above-the-fold content and UX
- Add interactive elements if missing
- Test with real users (5-minute feedback sessions)

## Indexing Acceleration Tips

- **Internal links from existing high-authority pages** — link to new programmatic pages
- **XML sitemap** — submit immediately, keep updated
- **IndexNow API** — instant notification to Bing (and indirectly helps Google)
- **RSS feed** — for new pages, helps discovery
- **Social sharing** — share select pages to drive initial crawls
- **Google Search Console URL Inspection** — manual request for priority pages (limited to ~50/day effectively)

## Output of Phase 6

- Rollout calendar with batch dates and page counts
- Monitoring dashboard (GSC + analytics + custom)
- Alert threshold configuration
- Response playbooks for common issues
- Weekly reporting template
