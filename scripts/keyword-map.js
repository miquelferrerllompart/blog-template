#!/usr/bin/env node
/**
 * keyword-map.js — Scans all content JSONs and generates a keyword map
 *
 * Usage:
 *   node scripts/keyword-map.js
 *
 * Outputs: public/assets/keyword-map.json
 *
 * Structure:
 * - keywords: { keyword → { pages[], metrics? } }
 * - pages: { slug → { title, type, industry, keywords, url } }
 * - conflicts: [{ keyword, pages[] }]  — keywords used by 2+ pages
 * - stats: { totalPages, totalKeywords, uniqueKeywords, conflicts, overlapRate }
 * - tree: { industry → type → [pages] }  — for tree visualization
 * - metrics: { keyword → { volume, kd, cpc } }  — from cached Ahrefs data
 *
 * Keyword enrichment is done via the Ahrefs MCP (not this script).
 * Cached metrics from `.pseo/keyword-metrics-cache.json` are applied automatically.
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'assets', 'keyword-map.json');
const CACHE_FILE = path.join(__dirname, '..', '.pseo', 'keyword-metrics-cache.json');

const URL_PREFIXES = {
    resource: '/resources/',
    guide: '/guides/',
    alternatives: '/compare/',
    comparison: '/compare/',
    tool: '/tools/',
    hub: null, // resolved dynamically based on hub_type
    industry: '/industries/'
};

function loadMetricsCache() {
    if (!fs.existsSync(CACHE_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {
        console.error('  ⚠️  Cache file corrupt, starting fresh');
        return {};
    }
}

function walk(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    for (const f of fs.readdirSync(dir)) {
        const fp = path.join(dir, f);
        if (fs.statSync(fp).isDirectory()) {
            files.push(...walk(fp));
        } else if (f.endsWith('.json')) {
            files.push(fp);
        }
    }
    return files;
}

function buildKeywordMap() {
    const pages = {};
    const keywords = {};
    const tree = {};
    let totalKeywordEntries = 0;

    const jsonFiles = walk(CONTENT_DIR);

    for (const fp of jsonFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
            const type = data.meta.content_type;
            const industry = data.meta.industry || '_global';
            const industryDisplay = data.meta.industry_display || 'Global';
            const slug = data.seo.slug;
            const title = data.seo.title;
            const pageKeywords = data.seo.keywords || [];
            let url;
            if (type === 'hub') {
                const hubType = data.meta.hub_type;
                url = (hubType === 'resource' ? '/resources/' : '/guides/') + slug;
            } else {
                url = (URL_PREFIXES[type] || '/') + slug;
            }

            // Page entry
            pages[slug] = { title, type, industry, industryDisplay, keywords: pageKeywords, url };

            // Hub architecture data
            if (type === 'hub') {
                if (!tree._architecture) tree._architecture = [];
                tree._architecture.push({
                    slug,
                    title,
                    hub_type: data.meta.hub_type,
                    niche: data.meta.niche,
                    keyword: pageKeywords[0] || '',
                    url,
                    spokes: (data.spoke_pages || []).map(s => ({
                        slug: s.slug,
                        title: s.title,
                        type: s.type,
                        industry: s.industry || null
                    })),
                    siblings: (data.sibling_hubs || []).map(s => ({
                        slug: s.slug,
                        title: s.title,
                        type: s.type
                    })),
                    tools: (data.related_tools || []).map(t => ({
                        slug: t.slug,
                        title: t.title
                    }))
                });
            }

            // Keyword index
            for (const kw of pageKeywords) {
                const kwLower = kw.toLowerCase().trim();
                if (!keywords[kwLower]) keywords[kwLower] = { pages: [] };
                keywords[kwLower].pages.push({ slug, title, type, industry, url });
                totalKeywordEntries++;
            }

            // Tree: industry → type → pages
            if (!tree[industry]) tree[industry] = { display: industryDisplay, types: {} };
            if (!tree[industry].types[type]) tree[industry].types[type] = [];
            tree[industry].types[type].push({ slug, title, keywords: pageKeywords, url });

        } catch (e) {
            console.error(`  ⚠️  Skip ${fp}: ${e.message}`);
        }
    }

    // Find conflicts (keywords used by 2+ pages)
    const conflicts = [];
    for (const [kw, kwData] of Object.entries(keywords)) {
        if (kwData.pages.length > 1) {
            const industries = [...new Set(kwData.pages.map(p => p.industry))];
            const sameIndustry = industries.length === 1 && industries[0] !== '_global';
            conflicts.push({
                keyword: kw,
                count: kwData.pages.length,
                risk: sameIndustry ? 'high' : kwData.pages.length > 3 ? 'high' : 'medium',
                pages: kwData.pages.map(p => ({ slug: p.slug, type: p.type, industry: p.industry, url: p.url }))
            });
        }
    }

    const riskOrder = { high: 0, medium: 1, low: 2 };
    conflicts.sort((a, b) => (riskOrder[a.risk] - riskOrder[b.risk]) || (b.count - a.count));

    // Mark which spokes/siblings/tools actually exist as pages
    if (tree._architecture) {
        for (const hub of tree._architecture) {
            for (const spoke of hub.spokes) {
                spoke.exists = !!pages[spoke.slug];
                if (spoke.exists) spoke.url = pages[spoke.slug].url;
            }
            for (const sib of hub.siblings) {
                sib.exists = !!pages[sib.slug];
                if (sib.exists) sib.url = pages[sib.slug].url;
            }
            for (const tool of hub.tools) {
                tool.exists = !!pages[tool.slug];
                if (tool.exists) tool.url = pages[tool.slug].url;
            }
        }
    }

    const uniqueKeywords = Object.keys(keywords).length;
    const totalPages = Object.keys(pages).length;

    const stats = {
        totalPages,
        totalKeywordEntries,
        uniqueKeywords,
        conflictCount: conflicts.length,
        overlapRate: totalKeywordEntries > 0
            ? ((totalKeywordEntries - uniqueKeywords) / totalKeywordEntries * 100).toFixed(1) + '%'
            : '0%',
        enriched: false,
        generatedAt: new Date().toISOString()
    };

    return { stats, pages, keywords, conflicts, tree };
}

function applyMetrics(map, metrics) {
    // Merge metrics into keywords
    for (const [kw, data] of Object.entries(map.keywords)) {
        if (metrics[kw]) {
            data.volume = metrics[kw].volume;
            data.kd = metrics[kw].kd;
            data.cpc = metrics[kw].cpc;
        }
    }

    // Also add metrics to conflicts for easy visualization
    for (const conflict of map.conflicts) {
        if (metrics[conflict.keyword]) {
            conflict.volume = metrics[conflict.keyword].volume;
            conflict.kd = metrics[conflict.keyword].kd;
        }
    }

    // Add metrics to tree pages' keywords
    for (const [key, ind] of Object.entries(map.tree)) {
        if (key === '_architecture' || !ind.types) continue;
        for (const pages of Object.values(ind.types)) {
            for (const page of pages) {
                page.keywordMetrics = page.keywords.map(kw => {
                    const kwl = kw.toLowerCase().trim();
                    return {
                        keyword: kw,
                        volume: metrics[kwl]?.volume ?? null,
                        kd: metrics[kwl]?.kd ?? null,
                        cpc: metrics[kwl]?.cpc ?? null
                    };
                });
            }
        }
    }

    const enrichedCount = Object.keys(metrics).length;
    const matchedCount = Object.keys(map.keywords).filter(kw => metrics[kw]).length;
    map.stats.enriched = matchedCount > 0;
    map.stats.enrichedKeywords = matchedCount;
    map.stats.enrichedAt = metrics._updatedAt || new Date().toISOString();

    return map;
}

// Main
const map = buildKeywordMap();

// Apply cached metrics if available (enrichment is done via Ahrefs MCP, not this script)
const cache = loadMetricsCache();
const cacheKeys = Object.keys(cache).filter(k => k !== '_updatedAt');
if (cacheKeys.length > 0) {
    applyMetrics(map, cache);
    console.log(`  📦 Applied ${map.stats.enrichedKeywords} cached metrics`);
}

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(map, null, 2));

const enrichLabel = map.stats.enriched ? `, ${map.stats.enrichedKeywords} enriched` : '';
console.log(`  → keyword-map.json (${map.stats.totalPages} pages, ${map.stats.uniqueKeywords} unique keywords, ${map.stats.conflictCount} conflicts${enrichLabel})`);
