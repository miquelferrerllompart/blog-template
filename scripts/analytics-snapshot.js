#!/usr/bin/env node
/**
 * analytics-snapshot.js — Fetches live analytics from GSC + PostHog
 *
 * Usage:
 *   node scripts/analytics-snapshot.js           # only refreshes if stale
 *   node scripts/analytics-snapshot.js --force    # always refreshes
 *
 * Config:  .pseo/analytics-config.json   (periods, limits, hosts)
 * Output:  .pseo/analytics-snapshot.json  (committed to repo with _updatedAt)
 *
 * Resilient: skips any service whose API key is missing or whose
 * config has enabled=false. Never exits with error code.
 *
 * Environment variables (secrets — never committed):
 *   POSTHOG_API_KEY          — PostHog personal API key
 *   GSC_SERVICE_ACCOUNT_JSON — Google Search Console service account JSON (stringified)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG_FILE = path.join(__dirname, '..', '.pseo', 'analytics-config.json');
const OUTPUT_FILE = path.join(__dirname, '..', '.pseo', 'analytics-snapshot.json');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function loadConfig() {
  const defaults = {
    stale_hours: 24,
    posthog: { enabled: true, host: 'eu.i.posthog.com', project_id: '', period: '7d', top_pages_limit: 20 },
    gsc: { enabled: true, property: '', period: '28d', row_limit: 50 }
  };
  if (!fs.existsSync(CONFIG_FILE)) return defaults;
  try {
    const file = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return {
      stale_hours: file.stale_hours ?? defaults.stale_hours,
      posthog: { ...defaults.posthog, ...file.posthog },
      gsc: { ...defaults.gsc, ...file.gsc }
    };
  } catch {
    console.error('  Warning: analytics-config.json is invalid, using defaults');
    return defaults;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadExisting() {
  if (!fs.existsSync(OUTPUT_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')); }
  catch { return null; }
}

function isStale(existing, staleHours) {
  if (!existing || !existing._updatedAt) return true;
  const age = Date.now() - new Date(existing._updatedAt).getTime();
  return age > staleHours * 60 * 60 * 1000;
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch { resolve(data); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function periodToDays(period) {
  const match = period.match(/^(\d+)d$/);
  return match ? parseInt(match[1]) : 7;
}

// ---------------------------------------------------------------------------
// PostHog
// ---------------------------------------------------------------------------

async function hogqlQuery(cfg, apiKey, projectId, query) {
  const { execSync } = require('child_process');
  const payload = JSON.stringify({ query: { kind: 'HogQLQuery', query } });
  const url = `https://${cfg.host}/api/projects/${projectId}/query/`;
  const result = execSync(
    `curl -s --max-time 45 -X POST -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d @- "${url}"`,
    { input: payload, encoding: 'utf8', timeout: 50000 }
  );
  return JSON.parse(result);
}

async function fetchPostHog(cfg) {
  if (!cfg.enabled) { console.log('  -- PostHog disabled in config'); return null; }

  const apiKey = process.env.POSTHOG_API_KEY;
  const projectId = cfg.project_id || process.env.POSTHOG_PROJECT_ID;

  if (!apiKey) { console.log('  -- Skipping PostHog (POSTHOG_API_KEY not set)'); return null; }
  if (!projectId) { console.log('  -- Skipping PostHog (project_id not set)'); return null; }

  console.log('  Fetching PostHog data...');

  try {
    const days = periodToDays(cfg.period);
    const limit = cfg.top_pages_limit || 20;
    const domainFilter = cfg.domain
      ? ` AND properties.$current_url LIKE 'https://${cfg.domain}%'`
      : '';

    const pv = `event = '$pageview' AND timestamp >= now() - interval ${days} day${domainFilter}`;
    const sess = `${pv} AND properties.$session_id IS NOT NULL`;

    const totalResult = await hogqlQuery(cfg, apiKey, projectId,
      `SELECT count() as total, count(DISTINCT distinct_id) as unique_visitors FROM events WHERE ${pv}`);
    const topPagesResult = await hogqlQuery(cfg, apiKey, projectId,
      `SELECT properties.$current_url as url, count() as views FROM events WHERE ${pv} GROUP BY url ORDER BY views DESC LIMIT ${limit}`);
    const dailyResult = await hogqlQuery(cfg, apiKey, projectId,
      `SELECT toDate(timestamp) as day, count() as views FROM events WHERE ${pv} GROUP BY day ORDER BY day`);
    const referrerResult = await hogqlQuery(cfg, apiKey, projectId,
      `SELECT properties.$referrer as referrer, count() as views FROM events WHERE ${pv} GROUP BY referrer ORDER BY views DESC LIMIT 10`);
    const deviceResult = await hogqlQuery(cfg, apiKey, projectId,
      `SELECT properties.$device_type as device, count() as views FROM events WHERE ${pv} GROUP BY device ORDER BY views DESC`);
    const countryResult = await hogqlQuery(cfg, apiKey, projectId,
      `SELECT properties.$geoip_country_code as country, count() as views FROM events WHERE ${pv} GROUP BY country ORDER BY views DESC LIMIT 10`);
    const sessionResult = await hogqlQuery(cfg, apiKey, projectId,
      `SELECT count() as total_sessions, countIf(pc = 1) as bounced, round(countIf(pc = 1) * 100.0 / count(), 1) as bounce_rate, round(avg(pc), 1) as avg_pages_per_session FROM (SELECT properties.$session_id as sid, count() as pc FROM events WHERE ${sess} GROUP BY sid)`);

    const totalPageviews = totalResult.results?.[0]?.[0] || 0;
    const uniqueVisitors = totalResult.results?.[0]?.[1] || 0;

    const topPagesList = (topPagesResult.results || [])
      .filter(r => r[0] && r[1] > 0)
      .map(r => ({ url: r[0], views: r[1] }));

    const dailyTrend = (dailyResult.results || []).map(r => r[1]);
    const dailyLabels = (dailyResult.results || []).map(r => r[0]);

    const referrers = (referrerResult.results || [])
      .map(r => ({ source: r[0] || '(direct)', views: r[1] }));

    const devices = (deviceResult.results || [])
      .map(r => ({ type: r[0] || 'unknown', views: r[1] }));

    const countries = (countryResult.results || [])
      .map(r => ({ country: r[0] || 'unknown', views: r[1] }));

    const sr = sessionResult.results?.[0] || [];
    const sessions = {
      total: sr[0] || 0,
      bounced: sr[1] || 0,
      bounce_rate: sr[2] || 0,
      avg_pages_per_session: sr[3] || 0
    };

    console.log(`  OK PostHog: ${totalPageviews} pageviews, ${uniqueVisitors} visitors, ${sessions.bounce_rate}% bounce (${cfg.period})`);

    return {
      period: cfg.period,
      total_pageviews: totalPageviews,
      unique_visitors: uniqueVisitors,
      sessions,
      top_pages: topPagesList,
      referrers,
      devices,
      countries,
      daily_trend: dailyTrend,
      daily_labels: dailyLabels
    };
  } catch (err) {
    console.error(`  PostHog error: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Google Search Console
// ---------------------------------------------------------------------------

async function fetchGSC(cfg) {
  if (!cfg.enabled) { console.log('  -- GSC disabled in config'); return null; }

  const serviceAccountJson = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) { console.log('  -- Skipping GSC (GSC_SERVICE_ACCOUNT_JSON not set)'); return null; }

  console.log('  Fetching GSC data...');

  try {
    const sa = JSON.parse(serviceAccountJson);
    const token = await getGoogleAccessToken(sa);
    const siteUrl = encodeURIComponent(cfg.property);
    const days = periodToDays(cfg.period);
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const queryData = await httpsRequest({
      hostname: 'searchconsole.googleapis.com',
      path: `/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
      method: 'POST', headers: authHeaders
    }, JSON.stringify({
      startDate: daysAgo(days),
      endDate: daysAgo(1),
      dimensions: ['query'],
      rowLimit: cfg.row_limit,
      dataState: 'final'
    }));

    const pageData = await httpsRequest({
      hostname: 'searchconsole.googleapis.com',
      path: `/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
      method: 'POST', headers: authHeaders
    }, JSON.stringify({
      startDate: daysAgo(days),
      endDate: daysAgo(1),
      dimensions: ['page'],
      rowLimit: cfg.row_limit,
      dataState: 'final'
    }));

    const topQueries = (queryData.rows || []).map(r => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10
    }));

    const topPagesGsc = (pageData.rows || []).map(r => ({
      page: r.keys[0].replace(/^https?:\/\/[^/]+/, ''),
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10
    }));

    console.log(`  OK GSC: ${topQueries.length} queries, ${topPagesGsc.length} pages`);

    return {
      period: cfg.period,
      property: cfg.property,
      top_queries: topQueries,
      top_pages: topPagesGsc
    };
  } catch (err) {
    console.error(`  GSC error: ${err.message}`);
    return null;
  }
}

async function getGoogleAccessToken(serviceAccount) {
  const crypto = require('crypto');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claimSet = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  })).toString('base64url');

  const signInput = `${header}.${claimSet}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  const jwt = `${signInput}.${signature}`;

  const tokenData = await httpsRequest({
    hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`);

  return tokenData.access_token;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const config = loadConfig();
  const forceRefresh = process.argv.includes('--force');

  const existing = loadExisting();
  if (!forceRefresh && existing && !isStale(existing, config.stale_hours)) {
    const age = Math.round((Date.now() - new Date(existing._updatedAt).getTime()) / 3600000);
    console.log(`  Snapshot is fresh (${age}h old, threshold: ${config.stale_hours}h). Use --force to refresh.`);
    return;
  }

  console.log('Generating analytics snapshot...');

  const [posthog, gsc] = await Promise.all([
    fetchPostHog(config.posthog),
    fetchGSC(config.gsc)
  ]);

  const snapshot = {
    _updatedAt: new Date().toISOString(),
    _config: { stale_hours: config.stale_hours },
    _sources: {
      posthog: posthog ? 'ok' : 'skipped',
      gsc: gsc ? 'ok' : 'skipped'
    },
    posthog,
    gsc
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2));

  const sources = [posthog && 'PostHog', gsc && 'GSC'].filter(Boolean).join(' + ') || 'none';
  console.log(`  -> analytics-snapshot.json (sources: ${sources})`);
}

main().catch(err => {
  console.error(`  Analytics snapshot failed: ${err.message}`);
});
