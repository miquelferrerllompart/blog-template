#!/usr/bin/env node
/**
 * brand-audit.js — Brand voice, text composition & schema compliance audit
 *
 * Scans all content JSONs against brand guidelines from .pseo/SKILL.md
 * and schema constraints from .pseo/schemas/*.ts
 *
 * Usage: node scripts/brand-audit.js
 * Output: stdout report + .pseo/brand-audit-report.json
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const REPORT_FILE = path.join(__dirname, '..', '.pseo', 'brand-audit-report.json');

// ── Pattern definitions ──

const FILLER_PHRASES = [
  "in today's competitive landscape",
  "in today's digital",
  "in today's market",
  "in today's fast",
  "in today's world",
  "it goes without saying",
  "at the end of the day",
  "it's worth noting",
  "it's important to note",
  "it's important to remember",
  "when it comes to",
  "in order to",
  "the fact that",
  "at this point in time",
  "needless to say",
  "it should be noted",
  "as a matter of fact",
  "for all intents and purposes",
  "in the realm of",
  "leverage the power of",
  "unlock the potential",
  "take your .* to the next level",
  "in an increasingly",
];

const GRANDIOSE_WORDS = [
  'revolutionize', 'revolutionise', 'revolutionary',
  'game-changing', 'game changer',
  'disruptive', 'disrupt ',
  'groundbreaking', 'ground-breaking',
  'cutting-edge', 'cutting edge',
  'world-class', 'world class',
  'innovative', 'innovation',
  'transformative', 'transform the way',
  'paradigm shift',
  'next-generation', 'next generation',
  'state-of-the-art', 'state of the art',
  'best-in-class',
  'unparalleled', 'unprecedented',
];

const OVER_QUALIFICATION = [
  'might potentially',
  'could possibly',
  'may help to consider',
  "it's possible that",
  'perhaps consider',
  'you might want to think about',
  'it could be argued',
  'one might say',
];

const PASSIVE_PATTERNS = [
  /\b(?:is|are|was|were|been|being)\s+(?:\w+\s+)?(?:delivered|provided|achieved|offered|driven|created|designed|built|generated|produced|managed|handled|processed|implemented)\s+by\b/gi,
];

const BAD_ANCHOR_TEXT = [
  'click here',
  'read more',
  'learn more',
  'check it out',
  'find out more',
  'see more',
  'here',
];

// ── Helpers ──

function findJsonFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findJsonFiles(full));
    else if (entry.name.endsWith('.json')) results.push(full);
  }
  return results;
}

function relativePath(abs) {
  return path.relative(path.join(__dirname, '..'), abs);
}

function getAllExistingSlugs(allData) {
  const slugs = new Set();
  const URL_PREFIXES = {
    resource: '/resources/',
    guide: '/guides/',
    alternatives: '/compare/',
    comparison: '/compare/',
    tool: '/tools/',
    industry: '/industries/',
  };
  for (const { data } of allData) {
    const type = data.meta?.content_type;
    const slug = data.seo?.slug;
    if (!slug) continue;
    if (type === 'hub') {
      const prefix = data.meta.hub_type === 'guide' ? '/guides/' : '/resources/';
      slugs.add(prefix + slug);
    } else if (URL_PREFIXES[type]) {
      slugs.add(URL_PREFIXES[type] + slug);
    }
  }
  return slugs;
}

// Extract all text fields for voice/tone scanning based on content type
function getTextFields(data) {
  const fields = [];
  const type = data.meta?.content_type;
  const c = data.content || {};

  function add(value, path) {
    if (typeof value === 'string' && value.length > 0) fields.push({ value, path });
  }

  // Common CTA fields
  add(data.cta?.headline, 'cta.headline');
  add(data.cta?.subtext, 'cta.subtext');

  if (type === 'resource') {
    add(c.intro?.hook, 'content.intro.hook');
    add(c.intro?.context, 'content.intro.context');
    add(c.intro?.what_youll_find, 'content.intro.what_youll_find');
    add(c.next_steps, 'content.next_steps');
    (c.sections || []).forEach((s, si) => {
      add(s.description, `content.sections[${si}].description`);
      (s.items || []).forEach((item, ii) => {
        add(item.description, `content.sections[${si}].items[${ii}].description`);
        add(item.example, `content.sections[${si}].items[${ii}].example`);
        add(item.product_angle, `content.sections[${si}].items[${ii}].product_angle`);
      });
    });
    (c.pro_tips || []).forEach((t, i) => add(t, `content.pro_tips[${i}]`));
    (c.common_mistakes || []).forEach((m, i) => add(m, `content.common_mistakes[${i}]`));
  } else if (type === 'guide') {
    add(c.intro?.hook, 'content.intro.hook');
    add(c.intro?.problem_statement, 'content.intro.problem_statement');
    (c.sections || []).forEach((s, si) => {
      add(s.body, `content.sections[${si}].body`);
      add(s.key_takeaway, `content.sections[${si}].key_takeaway`);
      add(s.actionable_tip, `content.sections[${si}].actionable_tip`);
    });
    add(c.conclusion?.summary, 'content.conclusion.summary');
    add(c.conclusion?.call_to_action, 'content.conclusion.call_to_action');
    (c.faq || []).forEach((f, i) => add(f.answer, `content.faq[${i}].answer`));
  } else if (type === 'hub') {
    add(c.intro?.hook, 'content.intro.hook');
    add(c.intro?.problem_statement, 'content.intro.problem_statement');
    (c.sections || []).forEach((s, si) => {
      add(s.body, `content.sections[${si}].body`);
      add(s.key_takeaway, `content.sections[${si}].key_takeaway`);
      add(s.actionable_tip, `content.sections[${si}].actionable_tip`);
    });
    add(c.conclusion?.summary, 'content.conclusion.summary');
    (c.faq || []).forEach((f, i) => add(f.answer, `content.faq[${i}].answer`));
  } else if (type === 'alternatives') {
    add(c.intro?.why_look_for_alternatives, 'content.intro.why_look_for_alternatives');
    add(c.intro?.target_product_overview, 'content.intro.target_product_overview');
    add(c.how_to_choose, 'content.how_to_choose');
    (c.alternatives || []).forEach((a, i) => {
      add(a.key_differentiator, `content.alternatives[${i}].key_differentiator`);
      add(a.best_for, `content.alternatives[${i}].best_for`);
    });
    (c.faq || []).forEach((f, i) => add(f.answer, `content.faq[${i}].answer`));
  } else if (type === 'comparison') {
    if (typeof c.intro === 'string') add(c.intro, 'content.intro');
    add(c.quick_verdict?.summary, 'content.quick_verdict.summary');
    (c.criteria || []).forEach((cr, i) => {
      add(cr.product_a_detail, `content.criteria[${i}].product_a_detail`);
      add(cr.product_b_detail, `content.criteria[${i}].product_b_detail`);
    });
    add(c.verdict?.summary, 'content.verdict.summary');
    (c.faq || []).forEach((f, i) => add(f.answer, `content.faq[${i}].answer`));
  } else if (type === 'tool') {
    if (typeof c.intro === 'string') add(c.intro, 'content.intro');
    add(c.interpretation_guide, 'content.interpretation_guide');
    add(c.methodology, 'content.methodology');
    (c.how_to_use || []).forEach((h, i) => {
      if (typeof h === 'string') add(h, `content.how_to_use[${i}]`);
    });
    (c.use_cases || []).forEach((u, i) => {
      add(u.benefit, `content.use_cases[${i}].benefit`);
    });
    (c.faq || []).forEach((f, i) => add(f.answer, `content.faq[${i}].answer`));
  } else if (type === 'industry') {
    add(c.hero?.subheadline, 'content.hero.subheadline');
    add(c.overview, 'content.overview');
    add(c.product_angle, 'content.product_angle');
    (c.pain_points || []).forEach((p, i) => {
      if (typeof p === 'string') add(p, `content.pain_points[${i}]`);
      else if (p?.description) add(p.description, `content.pain_points[${i}].description`);
    });
    (c.faq || []).forEach((f, i) => add(f.answer, `content.faq[${i}].answer`));
  }

  return fields;
}

// Get fields where interlinking should appear
function getInterlinkFields(data) {
  const fields = [];
  const type = data.meta?.content_type;
  const c = data.content || {};

  function add(value, path) {
    if (typeof value === 'string' && value.length > 0) fields.push({ value, path });
  }

  if (type === 'resource') {
    add(c.intro?.context, 'content.intro.context');
    (c.sections || []).forEach((s, si) => {
      add(s.description, `content.sections[${si}].description`);
      (s.items || []).forEach((item, ii) => {
        add(item.description, `content.sections[${si}].items[${ii}].description`);
      });
    });
    (c.pro_tips || []).forEach((t, i) => add(t, `content.pro_tips[${i}]`));
  } else if (type === 'guide') {
    add(c.intro?.problem_statement, 'content.intro.problem_statement');
    (c.sections || []).forEach((s, si) => {
      add(s.body, `content.sections[${si}].body`);
      add(s.actionable_tip, `content.sections[${si}].actionable_tip`);
    });
  } else if (type === 'hub') {
    add(c.intro?.problem_statement, 'content.intro.problem_statement');
    (c.sections || []).forEach((s, si) => {
      add(s.body, `content.sections[${si}].body`);
    });
  } else if (type === 'alternatives') {
    add(c.intro?.why_look_for_alternatives, 'content.intro.why_look_for_alternatives');
    (c.alternatives || []).forEach((a, i) => {
      add(a.key_differentiator, `content.alternatives[${i}].key_differentiator`);
    });
  } else if (type === 'comparison') {
    if (typeof c.intro === 'string') add(c.intro, 'content.intro');
    (c.criteria || []).forEach((cr, i) => {
      add(cr.product_a_detail, `content.criteria[${i}].product_a_detail`);
      add(cr.product_b_detail, `content.criteria[${i}].product_b_detail`);
    });
  } else if (type === 'tool') {
    if (typeof c.intro === 'string') add(c.intro, 'content.intro');
    (c.use_cases || []).forEach((u, i) => {
      add(u.benefit, `content.use_cases[${i}].benefit`);
    });
  } else if (type === 'industry') {
    add(c.overview, 'content.overview');
    (c.pain_points || []).forEach((p, i) => {
      if (typeof p === 'string') add(p, `content.pain_points[${i}]`);
      else if (p?.description) add(p.description, `content.pain_points[${i}].description`);
    });
  }

  return fields;
}

// ── Check functions ──

function checkFillerPhrases(textFields) {
  const violations = [];
  for (const { value, path: fieldPath } of textFields) {
    const lower = value.toLowerCase();
    for (const phrase of FILLER_PHRASES) {
      if (phrase.includes('.*')) {
        const regex = new RegExp(phrase, 'i');
        if (regex.test(value)) {
          const match = value.match(regex);
          violations.push({ field: fieldPath, phrase: match[0], category: 'filler_phrase' });
        }
      } else if (lower.includes(phrase)) {
        violations.push({ field: fieldPath, phrase, category: 'filler_phrase' });
      }
    }
  }
  return violations;
}

function checkGrandioseWords(textFields) {
  const violations = [];
  for (const { value, path: fieldPath } of textFields) {
    const lower = value.toLowerCase();
    for (const word of GRANDIOSE_WORDS) {
      if (lower.includes(word.toLowerCase())) {
        violations.push({ field: fieldPath, phrase: word, category: 'grandiose_claim' });
      }
    }
  }
  return violations;
}

function checkOverQualification(textFields) {
  const violations = [];
  for (const { value, path: fieldPath } of textFields) {
    const lower = value.toLowerCase();
    for (const phrase of OVER_QUALIFICATION) {
      if (lower.includes(phrase)) {
        violations.push({ field: fieldPath, phrase, category: 'over_qualification' });
      }
    }
  }
  return violations;
}

function checkPassiveVoice(textFields) {
  const violations = [];
  for (const { value, path: fieldPath } of textFields) {
    for (const pattern of PASSIVE_PATTERNS) {
      const matches = value.match(pattern);
      if (matches) {
        for (const match of matches) {
          violations.push({ field: fieldPath, phrase: match, category: 'passive_voice' });
        }
      }
    }
  }
  return violations;
}

function checkSentenceLength(textFields) {
  const violations = [];
  for (const { value, path: fieldPath } of textFields) {
    // Strip HTML tags for word counting
    const clean = value.replace(/<[^>]+>/g, '');
    // Split on sentence-ending punctuation
    const sentences = clean.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      const wordCount = sentence.trim().split(/\s+/).length;
      if (wordCount > 35) {
        const preview = sentence.trim().substring(0, 80) + (sentence.length > 80 ? '...' : '');
        violations.push({
          field: fieldPath,
          phrase: `${wordCount} words: "${preview}"`,
          category: 'long_sentence',
        });
      }
    }
  }
  return violations;
}

function checkParagraphDensity(textFields) {
  const violations = [];
  for (const { value, path: fieldPath } of textFields) {
    // Check for blocks of text longer than 6 lines without \n
    // Lines are roughly estimated by character count (~80 chars/line)
    const paragraphs = value.split('\n');
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const estimatedLines = Math.ceil(p.replace(/<[^>]+>/g, '').length / 80);
      if (estimatedLines > 6) {
        violations.push({
          field: fieldPath,
          phrase: `~${estimatedLines} lines without break (${p.length} chars)`,
          category: 'wall_of_text',
        });
      }
    }
  }
  return violations;
}

function checkInterlinking(interlinkFields, existingSlugs) {
  const linkRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let totalLinks = 0;
  const brokenLinks = [];
  const badAnchors = [];

  for (const { value, path: fieldPath } of interlinkFields) {
    let match;
    const regex = new RegExp(linkRegex.source, linkRegex.flags);
    while ((match = regex.exec(value)) !== null) {
      totalLinks++;
      const href = match[1];
      const anchorText = match[2].toLowerCase().trim();

      // Check broken internal links
      if (href.startsWith('/')) {
        if (!existingSlugs.has(href)) {
          brokenLinks.push({ field: fieldPath, href, category: 'broken_internal_link' });
        }
      }

      // Check bad anchor text
      for (const bad of BAD_ANCHOR_TEXT) {
        if (anchorText === bad) {
          badAnchors.push({ field: fieldPath, phrase: `"${match[2]}" → ${href}`, category: 'bad_anchor_text' });
        }
      }
    }
  }

  return { totalLinks, brokenLinks, badAnchors };
}

function checkSchemaCompliance(data, filePath) {
  const violations = [];
  const type = data.meta?.content_type;
  const c = data.content || {};

  // SEO description length (schema says 155)
  const descLen = data.seo?.description?.length || 0;
  if (descLen > 155) {
    violations.push({ field: 'seo.description', phrase: `${descLen} chars (max 155)`, category: 'seo_description_too_long' });
  }

  // Keyword count (8-12)
  const kwCount = data.seo?.keywords?.length || 0;
  if (kwCount < 8 || kwCount > 12) {
    violations.push({ field: 'seo.keywords', phrase: `${kwCount} keywords (need 8-12)`, category: 'keyword_count' });
  }

  // cta_url should not exist
  if (data.cta?.cta_url) {
    violations.push({ field: 'cta.cta_url', phrase: 'Field should be removed (URL injected by globals.html)', category: 'cta_url_present' });
  }

  // External references (3-5) — some types don't have them in schema
  if (type !== 'comparison' && type !== 'alternatives') {
    const refs = data.external_references;
    if (!refs || !Array.isArray(refs)) {
      violations.push({ field: 'external_references', phrase: 'Missing array', category: 'external_refs' });
    } else {
      if (refs.length < 3 || refs.length > 5) {
        violations.push({ field: 'external_references', phrase: `${refs.length} refs (need 3-5)`, category: 'external_refs_count' });
      }
      const competitors = []; // Define your competitors here or load from site.config.json
      refs.forEach((ref, i) => {
        if (!ref.title) violations.push({ field: `external_references[${i}].title`, phrase: 'Missing', category: 'external_refs' });
        if (!ref.url) violations.push({ field: `external_references[${i}].url`, phrase: 'Missing', category: 'external_refs' });
        if (!ref.source) violations.push({ field: `external_references[${i}].source`, phrase: 'Missing', category: 'external_refs' });
        if (ref.url && !ref.url.startsWith('https://')) {
          violations.push({ field: `external_references[${i}].url`, phrase: 'Must be HTTPS', category: 'external_refs' });
        }
        if (ref.url && competitors.some(comp => ref.url.toLowerCase().includes(comp))) {
          violations.push({ field: `external_references[${i}].url`, phrase: `Competitor link: ${ref.url}`, category: 'competitor_link' });
        }
      });
    }
  }

  // Type-specific checks
  if (type === 'resource') {
    const proTips = c.pro_tips?.length || 0;
    if (proTips !== 5) violations.push({ field: 'content.pro_tips', phrase: `${proTips} (need exactly 5)`, category: 'schema_count' });
    const mistakes = c.common_mistakes?.length || 0;
    if (mistakes !== 3) violations.push({ field: 'content.common_mistakes', phrase: `${mistakes} (need exactly 3)`, category: 'schema_count' });
    const sections = c.sections?.length || 0;
    if (sections < 3 || sections > 5) violations.push({ field: 'content.sections', phrase: `${sections} sections (need 3-5)`, category: 'schema_count' });
    (c.sections || []).forEach((s, i) => {
      const items = s.items?.length || 0;
      if (items < 5 || items > 8) violations.push({ field: `content.sections[${i}].items`, phrase: `${items} items (need 5-8)`, category: 'schema_count' });
    });
  } else if (type === 'guide') {
    const faqCount = c.faq?.length || 0;
    if (faqCount !== 6) violations.push({ field: 'content.faq', phrase: `${faqCount} FAQ (need exactly 6)`, category: 'schema_count' });
    const sections = c.sections?.length || 0;
    if (sections < 6 || sections > 8) violations.push({ field: 'content.sections', phrase: `${sections} sections (need 6-8)`, category: 'schema_count' });
    const learn = c.intro?.what_youll_learn?.length || 0;
    if (learn !== 5) violations.push({ field: 'content.intro.what_youll_learn', phrase: `${learn} items (need exactly 5)`, category: 'schema_count' });
  } else if (type === 'hub') {
    const faqCount = c.faq?.length || 0;
    if (faqCount < 6 || faqCount > 8) violations.push({ field: 'content.faq', phrase: `${faqCount} FAQ (need 6-8)`, category: 'schema_count' });
    const sections = c.sections?.length || 0;
    if (sections < 8 || sections > 12) violations.push({ field: 'content.sections', phrase: `${sections} sections (need 8-12)`, category: 'schema_count' });
    const learn = c.intro?.what_youll_learn?.length || 0;
    if (learn !== 5) violations.push({ field: 'content.intro.what_youll_learn', phrase: `${learn} items (need exactly 5)`, category: 'schema_count' });
  } else if (type === 'alternatives') {
    const altCount = c.alternatives?.length || 0;
    if (altCount < 8 || altCount > 10) violations.push({ field: 'content.alternatives', phrase: `${altCount} alternatives (need 8-10)`, category: 'schema_count' });
    const faqCount = c.faq?.length || 0;
    if (faqCount !== 5) violations.push({ field: 'content.faq', phrase: `${faqCount} FAQ (need exactly 5)`, category: 'schema_count' });
    const evalCriteria = c.intro?.evaluation_criteria?.length || 0;
    if (evalCriteria !== 6) violations.push({ field: 'content.intro.evaluation_criteria', phrase: `${evalCriteria} criteria (need exactly 6)`, category: 'schema_count' });
  } else if (type === 'comparison') {
    const criteria = c.criteria?.length || 0;
    if (criteria < 8 || criteria > 10) violations.push({ field: 'content.criteria', phrase: `${criteria} criteria (need 8-10)`, category: 'schema_count' });
    const faqCount = c.faq?.length || 0;
    if (faqCount !== 6) violations.push({ field: 'content.faq', phrase: `${faqCount} FAQ (need exactly 6)`, category: 'schema_count' });
  } else if (type === 'tool') {
    const faqCount = c.faq?.length || 0;
    if (faqCount !== 6) violations.push({ field: 'content.faq', phrase: `${faqCount} FAQ (need exactly 6)`, category: 'schema_count' });
  } else if (type === 'industry') {
    const faqCount = c.faq?.length || 0;
    if (faqCount < 4 || faqCount > 6) violations.push({ field: 'content.faq', phrase: `${faqCount} FAQ (need 4-6)`, category: 'schema_count' });
    const painPoints = c.pain_points?.length || 0;
    if (painPoints < 3 || painPoints > 5) violations.push({ field: 'content.pain_points', phrase: `${painPoints} pain points (need 3-5)`, category: 'schema_count' });
  }

  return violations;
}

// ── Main ──

function main() {
  const files = findJsonFiles(CONTENT_DIR);
  console.log(`=== BRAND VOICE & STYLE AUDIT — ${new Date().toISOString().slice(0, 10)} ===\n`);

  // Load all data first (for slug validation)
  const allData = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(raw);
      allData.push({ file, data });
    } catch (e) {
      console.log(`  SKIP (invalid JSON): ${relativePath(file)}`);
    }
  }

  const existingSlugs = getAllExistingSlugs(allData);

  // Aggregate results
  const report = {
    date: new Date().toISOString(),
    files_audited: allData.length,
    voice_tone: { filler_phrase: [], grandiose_claim: [], over_qualification: [], passive_voice: [], long_sentence: [] },
    composition: { wall_of_text: [], under_linked: [], over_linked: [], broken_internal_link: [], bad_anchor_text: [] },
    schema: { seo_description_too_long: [], keyword_count: [], schema_count: [], cta_url_present: [], external_refs: [], external_refs_count: [], competitor_link: [] },
    per_file: {},
  };

  for (const { file, data } of allData) {
    const rel = relativePath(file);
    const fileViolations = [];

    // A. Voice & Tone
    const textFields = getTextFields(data);
    fileViolations.push(...checkFillerPhrases(textFields));
    fileViolations.push(...checkGrandioseWords(textFields));
    fileViolations.push(...checkOverQualification(textFields));
    fileViolations.push(...checkPassiveVoice(textFields));
    fileViolations.push(...checkSentenceLength(textFields));

    // B. Text Composition
    fileViolations.push(...checkParagraphDensity(textFields));

    // Interlinking
    const interlinkFields = getInterlinkFields(data);
    const { totalLinks, brokenLinks, badAnchors } = checkInterlinking(interlinkFields, existingSlugs);
    fileViolations.push(...brokenLinks);
    fileViolations.push(...badAnchors);

    if (totalLinks < 2) {
      fileViolations.push({ field: '-', phrase: `${totalLinks} links (target: 2-4)`, category: 'under_linked' });
    } else if (totalLinks > 4) {
      fileViolations.push({ field: '-', phrase: `${totalLinks} links (target: 2-4)`, category: 'over_linked' });
    }

    // C. Schema Compliance
    fileViolations.push(...checkSchemaCompliance(data, rel));

    // Categorize
    for (const v of fileViolations) {
      v.file = rel;
      const cat = v.category;
      // Route to the right bucket
      if (report.voice_tone[cat]) report.voice_tone[cat].push(v);
      else if (report.composition[cat]) report.composition[cat].push(v);
      else if (report.schema[cat]) report.schema[cat].push(v);
    }

    if (fileViolations.length > 0) {
      report.per_file[rel] = fileViolations;
    }
  }

  // ── Print report ──

  const voiceTotal = Object.values(report.voice_tone).reduce((s, a) => s + a.length, 0);
  const voiceFiles = new Set(Object.values(report.voice_tone).flatMap(a => a.map(v => v.file))).size;
  const compTotal = Object.values(report.composition).reduce((s, a) => s + a.length, 0);
  const compFiles = new Set(Object.values(report.composition).flatMap(a => a.map(v => v.file))).size;
  const schemaTotal = Object.values(report.schema).reduce((s, a) => s + a.length, 0);
  const schemaFiles = new Set(Object.values(report.schema).flatMap(a => a.map(v => v.file))).size;
  const totalViolations = voiceTotal + compTotal + schemaTotal;

  console.log('SUMMARY');
  console.log(`  Files audited: ${report.files_audited}`);
  console.log(`  Total violations: ${totalViolations}`);
  console.log(`  Voice & tone: ${voiceTotal} violations across ${voiceFiles} files`);
  console.log(`  Text composition: ${compTotal} violations across ${compFiles} files`);
  console.log(`  Schema compliance: ${schemaTotal} violations across ${schemaFiles} files`);

  // Top issues
  const allCategories = {};
  for (const bucket of [report.voice_tone, report.composition, report.schema]) {
    for (const [cat, items] of Object.entries(bucket)) {
      if (items.length > 0) {
        allCategories[cat] = (allCategories[cat] || 0) + items.length;
      }
    }
  }
  const sorted = Object.entries(allCategories).sort((a, b) => b[1] - a[1]);

  console.log('\nTOP ISSUES (sorted by frequency)');
  sorted.forEach(([cat, count], i) => {
    const fileCount = new Set([
      ...(report.voice_tone[cat] || []),
      ...(report.composition[cat] || []),
      ...(report.schema[cat] || []),
    ].map(v => v.file)).size;
    console.log(`  ${i + 1}. ${cat} — ${count} occurrences across ${fileCount} files`);
  });

  // ── Voice & Tone detail ──
  console.log('\n--- VOICE & TONE ---\n');
  for (const [cat, items] of Object.entries(report.voice_tone)) {
    if (items.length === 0) continue;
    const label = cat.replace(/_/g, ' ');
    console.log(`${label}: ${items.length}`);
    // Group by file
    const byFile = {};
    for (const v of items) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }
    for (const [file, violations] of Object.entries(byFile)) {
      console.log(`  ${file}:`);
      for (const v of violations) {
        console.log(`    → "${v.phrase}" in ${v.field}`);
      }
    }
    console.log('');
  }

  // ── Composition detail ──
  console.log('--- TEXT COMPOSITION ---\n');
  for (const [cat, items] of Object.entries(report.composition)) {
    if (items.length === 0) continue;
    const label = cat.replace(/_/g, ' ');
    console.log(`${label}: ${items.length}`);
    const byFile = {};
    for (const v of items) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }
    for (const [file, violations] of Object.entries(byFile)) {
      console.log(`  ${file}:`);
      for (const v of violations) {
        console.log(`    → ${v.phrase} ${v.field !== '-' ? 'in ' + v.field : ''}`);
      }
    }
    console.log('');
  }

  // ── Schema detail ──
  console.log('--- SCHEMA COMPLIANCE ---\n');
  for (const [cat, items] of Object.entries(report.schema)) {
    if (items.length === 0) continue;
    const label = cat.replace(/_/g, ' ');
    console.log(`${label}: ${items.length}`);
    const byFile = {};
    for (const v of items) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }
    for (const [file, violations] of Object.entries(byFile)) {
      console.log(`  ${file}:`);
      for (const v of violations) {
        console.log(`    → ${v.phrase} in ${v.field}`);
      }
    }
    console.log('');
  }

  // ── Write JSON report ──
  report.summary = { totalViolations, voiceTotal, compTotal, schemaTotal, voiceFiles, compFiles, schemaFiles };
  report.top_issues = sorted.map(([cat, count]) => ({ category: cat, count }));
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report written to: ${path.relative(path.join(__dirname, '..'), REPORT_FILE)}`);
}

main();
