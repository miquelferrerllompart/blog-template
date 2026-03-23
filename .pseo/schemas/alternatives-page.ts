/**
 * pSEO Blog Template — Alternatives Page Schema
 * ~6.5% of total pages (8 pages)
 *
 * "[Competitor] Alternatives for Your Platform" pages.
 * High-intent, bottom-of-funnel content.
 */

interface AlternativesPage {
  meta: {
    content_type: 'alternatives';
    niche: string;
    target_product: string;        // e.g., "Smile.io"
    generated_at: string;
    date_published: string;        // ISO date (YYYY-MM-DD)
    date_modified: string;         // ISO date (YYYY-MM-DD)
    version: number;
  };
  seo: {
    title: string;                 // "Best {product} Alternatives for Your Platform in {year}"
    description: string;
    keywords: string[];
    slug: string;
    canonical_url: string;
  };
  content: {
    intro: {
      why_look_for_alternatives: string;  // Honest, specific reasons merchants switch FROM this product
      target_product_overview: string;    // Fair summary of what the product does well
      evaluation_criteria: string[];      // EXACTLY 6 criteria used to evaluate alternatives
    };
    alternatives: Array<{          // 8-10 alternatives (your product always included, position varies)
      name: string;
      one_liner: string;
      best_for: string;            // Specific merchant type/use case
      pros: string[];              // 3-4 pros
      cons: string[];              // 2-3 cons
      pricing_summary: string;     // Actual pricing tiers
      key_differentiator: string;  // What makes this unique vs target product
      platform_integration_depth: 'native' | 'deep' | 'standard' | 'basic';
      wallet_support: boolean;     // Whether it supports Apple/Google Wallet
      pos_support: boolean;        // Whether it supports POS
    }>;
    comparison_table: {
      criteria: string[];          // Column headers
      rows: Array<{
        product: string;
        values: string[];          // One value per criterion
      }>;
    };
    recommendation: {
      best_overall: { name: string; reason: string };
      best_for_budget: { name: string; reason: string };
      best_for_omnichannel: { name: string; reason: string };
      best_for_enterprise: { name: string; reason: string };
    };
    how_to_choose: string;         // 3-4 sentences guiding the decision
    images?: Array<{              // 1-2 inline images per alternatives page
      alt: string;                // Keyword-rich alt text — must include a target keyword from seo.keywords naturally
      src: string;                // Path: /assets/images/alternatives-{slug}-{n}.webp
      caption?: string;           // Optional visible caption below image
      placement: string;          // "after:intro" or "after:recommendation" — where to render the image
    }>;
    faq: Array<{                   // EXACTLY 5 FAQ items
      question: string;
      answer: string;
    }>;
  };
  related: {
    internal_links: string[];      // Other alternatives pages + comparison pages
  };
  brand_cta: {
    headline: string;
    subtext: string;
    cta_button: string;            // URL injected by globals.html snippet
  };
}

const alternativesTitleTemplate = 'Best {product} Alternatives for Your Platform in {year}';

export type { AlternativesPage };
export { alternativesTitleTemplate };
