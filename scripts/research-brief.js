#!/usr/bin/env node
/**
 * research-brief.js — Generates a research brief for a specific page
 *
 * Consolidates all local data (analytics, keywords, cannibalization, content)
 * into a single Markdown document that a content editor can pass to Claude.
 *
 * Usage:
 *   node scripts/research-brief.js <slug>
 *   node scripts/research-brief.js best-practices-topic-industry
 *   node scripts/research-brief.js --all          # generate briefs for all pages
 *   node scripts/research-brief.js --priority     # only pages needing attention
 *
 * Output: .pseo/briefs/<slug>.md
 *
 * No API keys needed — works entirely from committed local data.
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const BRIEFS_DIR = path.join(__dirname, '..', '.pseo', 'briefs');
const ANALYTICS_FILE = path.join(__dirname, '..', '.pseo', 'analytics-snapshot.json');
const KEYWORD_MAP_FILE = path.join(__dirname, '..', 'public', 'assets', 'keyword-map.json');
const KEYWORD_CACHE_FILE = path.join(__dirname, '..', '.pseo', 'keyword-metrics-cache.json');

// --- Helpers ---

function loadJson(filepath) {
  if (!fs.existsSync(filepath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch { return null; }
}

function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) files.push(...walk(fp));
    else if (f.endsWith('.json')) files.push(fp);
  }
  return files;
}

function findContentFile(slug) {
  for (const fp of walk(CONTENT_DIR)) {
    try {
      const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (data.seo && data.seo.slug === slug) return { path: fp, data };
    } catch { /* skip */ }
  }
  return null;
}

function getPageUrl(data) {
  const type = data.meta.content_type;
  const slug = data.seo.slug;
  const prefixes = {
    resource: '/resources/', guide: '/guides/', alternatives: '/compare/',
    comparison: '/compare/', tool: '/tools/', industry: '/industries/'
  };
  if (type === 'hub') {
    return (data.meta.hub_type === 'resource' ? '/resources/' : '/guides/') + slug;
  }
  return (prefixes[type] || '/') + slug;
}

function countInterlinks(data) {
  const json = JSON.stringify(data.content || {});
  // In JSON strings, <a href="..."> becomes <a href=\"...\">, so match both forms
  const matches = json.match(/<a\s+href=\\?"/g);
  return matches ? matches.length : 0;
}

function getExternalRefs(data) {
  return data.external_references || [];
}

// --- Brief Generation ---

function generateBrief(slug) {
  const result = findContentFile(slug);
  if (!result) {
    console.error(`  ✗ Page not found: ${slug}`);
    return null;
  }

  const { path: filePath, data } = result;
  const relPath = path.relative(path.join(__dirname, '..'), filePath);
  const pageUrl = getPageUrl(data);
  // Load domain from site.config.json if available, otherwise use placeholder
  let domain = 'your-domain.com';
  try {
    const siteConfig = loadJson(path.join(__dirname, '..', 'site.config.json'));
    if (siteConfig && siteConfig.domain) domain = siteConfig.domain;
  } catch { /* use default */ }
  const fullUrl = `https://${domain}${pageUrl}`;

  // Load data sources
  const analytics = loadJson(ANALYTICS_FILE);
  const keywordMap = loadJson(KEYWORD_MAP_FILE);
  const keywordCache = loadJson(KEYWORD_CACHE_FILE);

  const lines = [];

  // --- Header ---
  lines.push(`# Research Brief: ${data.seo.title}`);
  lines.push('');
  lines.push(`> Auto-generated on ${new Date().toISOString().split('T')[0]} by \`scripts/research-brief.js\``);
  lines.push(`> Pass this file to Claude when improving this page.`);
  lines.push('');

  // --- Page Summary ---
  lines.push('## Page Overview');
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| **File** | \`${relPath}\` |`);
  lines.push(`| **URL** | ${fullUrl} |`);
  lines.push(`| **Type** | ${data.meta.content_type} (${data.meta.subtype || '—'}) |`);
  lines.push(`| **Industry** | ${data.meta.industry_display || data.meta.industry || 'Global'} |`);
  lines.push(`| **Niche** | ${data.meta.niche || '—'} |`);
  lines.push(`| **Title** | ${data.seo.title} |`);
  lines.push(`| **Description** | ${data.seo.description} (${data.seo.description.length} chars) |`);
  lines.push('');

  // --- Current Keywords + Metrics ---
  lines.push('## Keywords & Metrics');
  lines.push('');
  const pageKeywords = data.seo.keywords || [];
  lines.push(`Total keywords: **${pageKeywords.length}** (target: 8-12)`);
  lines.push('');
  lines.push('| Keyword | Volume | KD | CPC | Traffic Potential |');
  lines.push('|---------|--------|-----|-----|-------------------|');
  for (const kw of pageKeywords) {
    const kwl = kw.toLowerCase().trim();
    const m = keywordCache && keywordCache[kwl];
    if (m) {
      const cpcUsd = m.cpc != null ? `$${(m.cpc / 100).toFixed(2)}` : '—';
      lines.push(`| ${kw} | ${m.volume ?? '—'} | ${m.kd ?? '—'} | ${cpcUsd} | ${m.traffic_potential ?? '—'} |`);
    } else {
      lines.push(`| ${kw} | — | — | — | — |`);
    }
  }
  lines.push('');

  // --- Analytics Data ---
  lines.push('## Traffic & Rankings');
  lines.push('');

  if (analytics && analytics._sources) {
    lines.push(`*Data freshness: ${analytics._updatedAt || 'unknown'}*`);
    lines.push('');

    // PostHog traffic
    if (analytics.posthog && analytics.posthog.top_pages) {
      const pageEntry = analytics.posthog.top_pages.find(p =>
        p.url.includes(pageUrl) || p.url.endsWith(slug)
      );
      if (pageEntry) {
        lines.push(`### PostHog (${analytics.posthog.period})`);
        lines.push('');
        lines.push(`- **Pageviews:** ${pageEntry.views}`);
        lines.push('');
      } else {
        lines.push(`### PostHog (${analytics.posthog.period})`);
        lines.push('');
        lines.push('- **Pageviews:** 0 (not in top pages)');
        lines.push('');
      }
    }

    // GSC data
    if (analytics.gsc) {
      lines.push(`### Google Search Console (${analytics.gsc.period})`);
      lines.push('');

      // Find queries for this page
      const pageQueries = (analytics.gsc.top_queries || []).filter(q =>
        q.page && (q.page.includes(pageUrl) || q.page.endsWith(slug))
      );

      // Find page in top_pages
      const gscPage = (analytics.gsc.top_pages || []).find(p =>
        p.page && (p.page.includes(pageUrl) || p.page.endsWith(slug))
      );

      if (gscPage) {
        lines.push(`- **Clicks:** ${gscPage.clicks || 0}`);
        lines.push(`- **Impressions:** ${gscPage.impressions || 0}`);
        lines.push(`- **CTR:** ${gscPage.ctr != null ? (gscPage.ctr * 100).toFixed(1) + '%' : '—'}`);
        lines.push(`- **Avg Position:** ${gscPage.position != null ? gscPage.position.toFixed(1) : '—'}`);
        lines.push('');
      }

      if (pageQueries.length > 0) {
        lines.push('**Queries ranking for this page:**');
        lines.push('');
        lines.push('| Query | Clicks | Impressions | CTR | Position |');
        lines.push('|-------|--------|-------------|-----|----------|');
        for (const q of pageQueries) {
          const ctr = q.ctr != null ? (q.ctr * 100).toFixed(1) + '%' : '—';
          const pos = q.position != null ? q.position.toFixed(1) : '—';
          lines.push(`| ${q.query} | ${q.clicks || 0} | ${q.impressions || 0} | ${ctr} | ${pos} |`);
        }
        lines.push('');
      } else if (!gscPage) {
        lines.push('*No GSC data for this page — may not be indexed yet.*');
        lines.push('');
      }
    }
  } else {
    lines.push('*Analytics snapshot not available. Ask the developer to run `node scripts/analytics-snapshot.js`.*');
    lines.push('');
  }

  // --- Cannibalization ---
  lines.push('## Keyword Cannibalization');
  lines.push('');

  if (keywordMap && keywordMap.conflicts) {
    const pageConflicts = keywordMap.conflicts.filter(c =>
      c.pages.some(p => p.slug === slug)
    );

    if (pageConflicts.length > 0) {
      lines.push(`**${pageConflicts.length} conflicts found** involving this page:`);
      lines.push('');
      lines.push('| Keyword | Risk | Competing Pages |');
      lines.push('|---------|------|-----------------|');
      for (const c of pageConflicts) {
        const others = c.pages.filter(p => p.slug !== slug).map(p => `\`${p.slug}\` (${p.type})`).join(', ');
        lines.push(`| ${c.keyword} | ${c.risk.toUpperCase()} | ${others} |`);
      }
      lines.push('');
    } else {
      lines.push('No cannibalization conflicts found for this page.');
      lines.push('');
    }
  } else {
    lines.push('*Keyword map not available. Run `node scripts/keyword-map.js` first.*');
    lines.push('');
  }

  // --- Content Health ---
  lines.push('## Content Health');
  lines.push('');

  const interlinks = countInterlinks(data);
  const extRefs = getExternalRefs(data);
  const c = data.content || {};
  const proTips = c.pro_tips || data.pro_tips || [];
  const commonMistakes = c.common_mistakes || data.common_mistakes || [];
  const faq = c.faq || data.faq || [];
  const sections = c.sections || [];

  lines.push('| Metric | Current | Target | Status |');
  lines.push('|--------|---------|--------|--------|');
  lines.push(`| Interlinks | ${interlinks} | 2-4 | ${interlinks >= 2 && interlinks <= 4 ? 'OK' : interlinks < 2 ? 'LOW' : 'HIGH'} |`);
  lines.push(`| External refs | ${extRefs.length} | 3-5 | ${extRefs.length >= 3 && extRefs.length <= 5 ? 'OK' : extRefs.length < 3 ? 'LOW' : 'HIGH'} |`);
  lines.push(`| Pro tips | ${proTips.length} | 5 | ${proTips.length === 5 ? 'OK' : proTips.length < 5 ? 'LOW' : 'HIGH'} |`);
  lines.push(`| Common mistakes | ${commonMistakes.length} | 3 | ${commonMistakes.length === 3 ? 'OK' : commonMistakes.length < 3 ? 'LOW' : 'HIGH'} |`);
  lines.push(`| FAQ items | ${faq.length} | 5-6 | ${faq.length >= 5 && faq.length <= 6 ? 'OK' : faq.length < 5 ? 'LOW' : 'HIGH'} |`);
  lines.push(`| Sections | ${sections.length} | 3-5 | ${sections.length >= 3 && sections.length <= 5 ? 'OK' : sections.length < 3 ? 'LOW' : 'HIGH'} |`);
  lines.push(`| SEO description | ${data.seo.description.length} chars | ≤155 | ${data.seo.description.length <= 155 ? 'OK' : 'TOO LONG'} |`);
  lines.push(`| Keywords count | ${pageKeywords.length} | 8-12 | ${pageKeywords.length >= 8 && pageKeywords.length <= 12 ? 'OK' : pageKeywords.length < 8 ? 'LOW' : 'HIGH'} |`);
  lines.push('');

  // External references detail
  if (extRefs.length > 0) {
    lines.push('### External References');
    lines.push('');
    lines.push('| # | Source | URL |');
    lines.push('|---|--------|-----|');
    for (let i = 0; i < extRefs.length; i++) {
      const ref = extRefs[i];
      lines.push(`| ${i + 1} | ${ref.source || ref.title || '—'} | ${ref.url || '—'} |`);
    }
    lines.push('');
  }

  // --- Related Pages (same industry) ---
  lines.push('## Related Pages (same industry)');
  lines.push('');

  if (keywordMap && keywordMap.tree) {
    const industry = data.meta.industry || '_global';
    const indTree = keywordMap.tree[industry];
    if (indTree && indTree.types) {
      for (const [type, pages] of Object.entries(indTree.types)) {
        const otherPages = pages.filter(p => p.slug !== slug);
        if (otherPages.length > 0) {
          lines.push(`**${type}:**`);
          for (const p of otherPages) {
            lines.push(`- [\`${p.slug}\`](${p.url}) — ${p.title}`);
          }
          lines.push('');
        }
      }
    } else {
      lines.push('No other pages found for this industry.');
      lines.push('');
    }
  }

  // --- Nearby Keywords (from cache, same industry) ---
  lines.push('## Keyword Opportunities (from cache)');
  lines.push('');
  lines.push('Keywords in the cache related to this industry that are NOT currently used by this page:');
  lines.push('');

  if (keywordCache) {
    const industry = (data.meta.industry || '').toLowerCase().replace(/-/g, ' ');
    const industryTerms = industry.split(' ').filter(t => t.length > 2);
    const pageKwSet = new Set(pageKeywords.map(k => k.toLowerCase().trim()));

    const opportunities = [];
    for (const [kw, metrics] of Object.entries(keywordCache)) {
      if (kw === '_updatedAt') continue;
      if (pageKwSet.has(kw)) continue;
      // Match keywords related to this industry
      const kwLower = kw.toLowerCase();
      const isRelevant = industryTerms.some(term => kwLower.includes(term)) ||
        false; // Add general niche terms here, e.g.: kwLower.includes('term1') || kwLower.includes('term2')
      if (isRelevant && metrics.volume && metrics.volume > 0) {
        opportunities.push({ keyword: kw, ...metrics });
      }
    }

    opportunities.sort((a, b) => (b.volume || 0) - (a.volume || 0));
    const topOpps = opportunities.slice(0, 15);

    if (topOpps.length > 0) {
      lines.push('| Keyword | Volume | KD | Traffic Potential |');
      lines.push('|---------|--------|-----|-------------------|');
      for (const o of topOpps) {
        lines.push(`| ${o.keyword} | ${o.volume ?? '—'} | ${o.kd ?? '—'} | ${o.traffic_potential ?? '—'} |`);
      }
    } else {
      lines.push('No additional keyword opportunities found in the cache for this industry.');
    }
  } else {
    lines.push('*Keyword cache not available.*');
  }
  lines.push('');

  // --- Suggested Actions ---
  lines.push('## Suggested Actions');
  lines.push('');

  const actions = [];

  if (interlinks < 2) actions.push('- **Add interlinks:** This page has fewer than 2 internal links. Add contextual `<a href>` links to related pages listed above.');
  if (interlinks > 4) actions.push('- **Reduce interlinks:** This page has more than 4 internal links. Remove the least relevant ones.');
  if (extRefs.length < 3) actions.push('- **Add external references:** Below minimum (3). Add authoritative sources (Tier 1: Forbes, HBR, major industry authorities).');
  if (data.seo.description.length > 155) actions.push(`- **Shorten SEO description:** Currently ${data.seo.description.length} chars (max 155).`);
  if (pageKeywords.length < 8) actions.push(`- **Add keywords:** Currently ${pageKeywords.length} (target: 8-12). Check the "Keyword Opportunities" section above.`);
  if (pageKeywords.length > 12) actions.push(`- **Trim keywords:** Currently ${pageKeywords.length} (target: 8-12). Remove the least relevant ones.`);

  // Content health actions
  if (proTips.length !== 5) actions.push(`- **Fix pro tips count:** Currently ${proTips.length} (target: 5).`);
  if (commonMistakes.length !== 3) actions.push(`- **Fix common mistakes count:** Currently ${commonMistakes.length} (target: 3).`);
  if (faq.length < 5) actions.push(`- **Add FAQ items:** Currently ${faq.length} (target: 5-6).`);

  // Check analytics signals
  if (analytics && analytics.posthog && analytics.posthog.top_pages) {
    const pageEntry = analytics.posthog.top_pages.find(p =>
      p.url.includes(pageUrl) || p.url.endsWith(slug)
    );
    if (!pageEntry) {
      actions.push('- **Zero traffic:** This page received 0 visits in the last period. Check if it\'s indexed and if keywords have search volume.');
    }
  }

  // GSC-based actions
  if (analytics && analytics.gsc && analytics.gsc.top_pages) {
    const gscPageAction = analytics.gsc.top_pages.find(p =>
      p.page && (p.page.includes(pageUrl) || p.page.endsWith(slug))
    );
    if (gscPageAction) {
      if (gscPageAction.position >= 4 && gscPageAction.position <= 10) {
        actions.push(`- **Quick win:** Ranking at position ${gscPageAction.position.toFixed(1)} — small content improvements can push to top 3.`);
      }
      if (gscPageAction.impressions > 100 && gscPageAction.ctr != null && gscPageAction.ctr < 0.03) {
        actions.push(`- **Low CTR:** ${(gscPageAction.ctr * 100).toFixed(1)}% CTR with ${gscPageAction.impressions} impressions. Rewrite title and description to match top queries.`);
      }
    }
  }

  // Reference diversity
  if (extRefs.length > 0) {
    const sources = extRefs.map(r => (r.source || r.title || '').toLowerCase()).filter(Boolean);
    const uniqueSources = new Set(sources);
    if (uniqueSources.size === 1 && sources.length > 1) {
      actions.push(`- **Diversify references:** All ${sources.length} refs from "${[...uniqueSources][0]}". Add other Tier 1 sources.`);
    }
  }

  if (actions.length === 0) {
    lines.push('No critical issues found. Consider deepening content quality or targeting new keywords from the opportunities table.');
  } else {
    lines.push(...actions);
  }
  lines.push('');

  // --- Footer ---
  lines.push('---');
  lines.push('');
  lines.push('*To improve this page, pass this brief to Claude:*');
  lines.push('');
  lines.push('```');
  lines.push(`Improve the page ${slug}. Here's the research brief: [paste or attach .pseo/briefs/${slug}.md]`);
  lines.push('```');

  return lines.join('\n');
}

// --- Priority Mode ---

function findPriorityPages() {
  const analytics = loadJson(ANALYTICS_FILE);
  const keywordMap = loadJson(KEYWORD_MAP_FILE);
  const slugs = new Set();

  // Pages with cannibalization conflicts
  if (keywordMap && keywordMap.conflicts) {
    for (const c of keywordMap.conflicts) {
      if (c.risk === 'high') {
        for (const p of c.pages) slugs.add(p.slug);
      }
    }
  }

  // Pages with content health issues
  for (const fp of walk(CONTENT_DIR)) {
    try {
      const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (!d.seo || !d.seo.slug) continue;
      const s = d.seo.slug;
      if (slugs.has(s)) continue;
      const il = countInterlinks(d);
      const refs = getExternalRefs(d);
      const kws = d.seo.keywords || [];
      if (il < 2 || refs.length < 3 || kws.length < 8 || d.seo.description.length > 155) {
        slugs.add(s);
      }
    } catch { /* skip */ }
  }

  return [...slugs];
}

function findAllSlugs() {
  const slugs = [];
  for (const fp of walk(CONTENT_DIR)) {
    try {
      const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (data.seo && data.seo.slug) slugs.push(data.seo.slug);
    } catch { /* skip */ }
  }
  return slugs;
}

// --- Main ---

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node scripts/research-brief.js <slug>       # single page brief');
  console.log('  node scripts/research-brief.js --all        # all pages');
  console.log('  node scripts/research-brief.js --priority   # pages needing attention');
  process.exit(0);
}

fs.mkdirSync(BRIEFS_DIR, { recursive: true });

let slugs;

if (args[0] === '--all') {
  slugs = findAllSlugs();
  console.log(`Generating briefs for all ${slugs.length} pages...`);
} else if (args[0] === '--priority') {
  slugs = findPriorityPages();
  console.log(`Generating briefs for ${slugs.length} priority pages...`);
} else {
  slugs = args;
}

let generated = 0;
for (const slug of slugs) {
  const brief = generateBrief(slug);
  if (brief) {
    const outFile = path.join(BRIEFS_DIR, `${slug}.md`);
    fs.writeFileSync(outFile, brief);
    console.log(`  ✓ ${slug}.md`);
    generated++;
  }
}

console.log(`\nDone: ${generated} brief(s) generated in .pseo/briefs/`);
