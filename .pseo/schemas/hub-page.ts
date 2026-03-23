/**
 * pSEO Blog Template — Hub Page Schema
 *
 * Generic high-volume keyword pages that serve as "parent" pages
 * in a hub & spoke architecture. No industry suffix — these capture
 * head terms like "customer retention strategies" or "referral program ideas".
 *
 * Spoke pages (industry-specific guides/resources) link UP to these hubs.
 * Hubs link DOWN to spokes via the spoke_pages section.
 */

interface HubPage {
  meta: {
    content_type: 'hub';
    hub_type: 'guide' | 'resource';   // determines URL prefix: /guides/ or /resources/
    subtype: string;                   // e.g., 'retention-strategies', 'referral-ideas', 'loyalty-examples'
    niche: string;                     // e.g., 'your-niche'
    generated_at: string;
    date_published: string;        // ISO date (YYYY-MM-DD)
    date_modified: string;         // ISO date (YYYY-MM-DD)
    version: number;
  };
  seo: {
    title: string;
    description: string;               // max 155 chars
    keywords: string[];                 // 8-12 keywords — generic, NOT industry-specific
    slug: string;
    canonical_url: string;
  };
  content: {
    intro: {
      hook: string;                    // Opening that names the broad problem
      problem_statement: string;       // Why this topic matters for ecommerce/your platform merchants
      what_youll_learn: string[];      // EXACTLY 5 takeaways
      reading_time: string;            // e.g., "15 min read"
      hero_stat?: {                    // Optional headline stat
        value: string;                 // e.g., "65%"
        description: string;           // e.g., "of revenue comes from repeat customers"
        source: string;                // e.g., "Bain & Company"
      };
    };
    sections: Array<{                  // 8-12 sections (longer than spoke pages for topical depth)
      heading: string;
      body: string;                    // 300-500 words per section — comprehensive, not industry-specific
      key_takeaway: string;
      actionable_tip: string;
      platform_integration?: string;
      product_angle?: string;      // mention sparingly — 2-3 sections max
    }>;
    case_study_snippet?: {
      brand_type: string;
      challenge: string;
      solution: string;
      results: Array<{
        metric: string;
        value: string;
      }>;
    };
    conclusion: {
      summary: string;
      call_to_action: string;
    };
    faq: Array<{                       // EXACTLY 6-8 FAQ items — broad, not industry-specific
      question: string;
      answer: string;
    }>;
  };
  spoke_pages: Array<{                 // Industry-specific child pages
    slug: string;                      // e.g., "retention-strategies-fashion-apparel"
    title: string;                     // e.g., "Customer Retention Strategies for Fashion Brands"
    type: 'guide' | 'resource';        // determines URL prefix for the link
    industry: string;                  // e.g., "Fashion & Apparel"
  }>;
  sibling_hubs: Array<{               // Related hub pages
    slug: string;
    title: string;
    type: 'guide' | 'resource';
  }>;
  related_tools: Array<{              // Related calculator/tool pages
    slug: string;
    title: string;
  }>;
  external_references: Array<{
    title: string;
    url: string;
    source: string;
  }>;
  brand_cta: {
    headline: string;
    subtext: string;
    cta_button: string;
  };
}

export type { HubPage };
