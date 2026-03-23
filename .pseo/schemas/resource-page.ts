/**
 * pSEO Blog Template — Resource Page Schema
 * ~57% of total pages (70 pages)
 *
 * Used for: idea lists, checklists, collections,
 * product guides, examples — all industry-specific.
 */

interface ResourcePage {
  meta: {
    content_type: 'resource';
    subtype: 'idea-list' | 'checklist' | 'tip-list' | 'examples' | 'comparison-list' | 'roi-analysis' | 'app-list';
    niche: string;                  // e.g., 'your-niche'
    industry: string;              // e.g., "your-industry-slug"
    industry_display: string;      // e.g., "Your Industry"
    generated_at: string;          // ISO timestamp
    date_published: string;        // ISO date (YYYY-MM-DD) — when the page was first published
    date_modified: string;         // ISO date (YYYY-MM-DD) — when the page was last updated
    version: number;
  };
  seo: {
    title: string;                 // TEMPLATED — never AI-generated
    description: string;           // max 155 chars, includes industry + benefit
    keywords: string[];            // 8-12 long-tail keywords
    slug: string;                  // URL-safe, deterministic pattern
    canonical_url: string;         // full URL on yourdomain.com
  };
  content: {
    intro: {
      hook: string;                // 1-2 sentences — industry-specific problem/opportunity
      context: string;             // Why this topic matters for THIS industry (with stats)
      what_youll_find: string;     // Brief page description
      industry_stat: {             // One compelling data point for this industry
        value: string;             // e.g., "42%"
        description: string;       // e.g., "of customers say this influences their decisions"
        source: string;            // e.g., "Bond Brand Loyalty Report 2025"
      };
    };
    sections: Array<{              // 3-5 sections
      heading: string;
      description: string;         // 2-3 sentences explaining the section
      items: Array<{               // EXACTLY 5-8 items per section
        title: string;
        description: string;       // 3-4 sentences, actionable, industry-specific
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        impact: 'high' | 'medium' | 'standard';
        product_angle?: string;  // How our product enhances this (optional but encouraged)
        example: string;           // Real-world or realistic example for THIS industry
      }>;
    }>;
    pro_tips: string[];            // EXACTLY 5 tips — each must reference the specific industry
    common_mistakes: string[];     // EXACTLY 3 mistakes to avoid
    industry_benchmarks: {         // Key metrics for this industry
      metrics: Array<{
        value: string;             // e.g., "42%"
        label: string;             // e.g., "Avg. Repeat Purchase Rate"
      }>;
      source: string;
    };
    next_steps: string;            // What to do after reading — soft CTA
    images?: Array<{              // 1-2 inline images per resource page
      alt: string;                // Keyword-rich alt text — must include a target keyword from seo.keywords naturally
      src: string;                // Path: /assets/images/resource-{slug}-{n}.webp
      caption?: string;           // Optional visible caption below image
      placement: string;          // "after:intro" or "after:{Section Heading}" — where to render the image
    }>;
  };
  external_references: Array<{     // 3-5 authoritative third-party links
    title: string;                   // Descriptive link text
    url: string;                     // Full URL to third-party source
    source: string;                  // Publisher name (e.g., "Official Blog", "Harvard Business Review")
  }>;
  related: {
    internal_links: string[];      // slugs of related pages (same industry or same content type)
    cross_industry_links: string[]; // same content type, different industry
  };
  brand_cta: {
    headline: string;              // Industry-specific CTA headline
    subtext: string;               // 1 sentence value prop for THIS industry
    cta_button: string;            // e.g., "Start Free — No Credit Card" — URL injected by globals.html snippet
  };
}

// Title Templates — deterministic, never AI-generated
// Customize per-niche during onboarding
const resourceTitleTemplates: Record<string, string> = {
  'idea-list':            '{count} Ideas for {industry} in {year}',
  'checklist':            '{industry} Checklist ({year})',
  'tip-list':             '{count} Tips for {industry} in {year}',
  'examples':             'Best {industry} Examples in {year}',
  'comparison-list':      '{industry} Comparison Guide ({year})',
  'roi-analysis':         '{industry} ROI: What to Expect in {year}',
  'app-list':             'Best Apps for {industry} ({year})',
};

export type { ResourcePage };
export { resourceTitleTemplates };
