/**
 * pSEO Blog Template — Comparison Page Schema
 * ~6.5% of total pages (8 pages)
 *
 * "[A] vs [B]" head-to-head comparison pages.
 * Very high intent — bottom of funnel.
 */

interface ComparisonPage {
  meta: {
    content_type: 'comparison';
    niche: string;
    product_a: string;
    product_b: string;
    generated_at: string;
    date_published: string;        // ISO date (YYYY-MM-DD)
    date_modified: string;         // ISO date (YYYY-MM-DD)
    version: number;
  };
  seo: {
    title: string;                 // "{A} vs {B}: Which Platform App is Better?"
    description: string;
    keywords: string[];
    slug: string;
    canonical_url: string;
  };
  content: {
    intro: string;                 // 3-4 sentences setting up the comparison
    quick_verdict: {               // TL;DR at top for scanners
      summary: string;             // 2 sentences
      choose_a_if: string;
      choose_b_if: string;
    };
    product_overviews: {
      product_a: {
        name: string;
        icon: string;              // Google favicon API: https://www.google.com/s2/favicons?domain=DOMAIN&sz=64
        tagline: string;
        founded: string;
        focus: string;             // What they specialize in
        pricing_start: string;
      };
      product_b: {
        name: string;
        icon: string;              // Google favicon API: https://www.google.com/s2/favicons?domain=DOMAIN&sz=64
        tagline: string;
        founded: string;
        focus: string;
        pricing_start: string;
      };
    };
    criteria: Array<{              // 8-10 comparison criteria
      name: string;                // e.g., "Key Feature Support", "POS Integration"
      weight: 'critical' | 'important' | 'nice-to-have';
      product_a_score: 1 | 2 | 3 | 4 | 5;
      product_b_score: 1 | 2 | 3 | 4 | 5;
      product_a_detail: string;    // 2-3 sentences explaining the score
      product_b_detail: string;
      winner: 'a' | 'b' | 'tie';
    }>;
    pricing_comparison: {
      product_a_tiers: Array<{
        name: string;
        price: string;
        key_features: string[];
      }>;
      product_b_tiers: Array<{
        name: string;
        price: string;
        key_features: string[];
      }>;
      pricing_verdict: string;
    };
    verdict: {
      overall_winner: 'a' | 'b' | 'depends';
      score_a: number;             // Total weighted score
      score_b: number;
      summary: string;             // 3-4 sentences
      choose_a_if: string;         // Specific user profile
      choose_b_if: string;
    };
    faq: Array<{                   // EXACTLY 6 FAQ items
      question: string;
      answer: string;
    }>;
  };
  related: {
    internal_links: string[];
  };
  brand_cta: {
    headline: string;
    subtext: string;
    cta_button: string;            // URL injected by globals.html snippet
  };
}

const comparisonTitleTemplate = '{product_a} vs {product_b}: Which Platform App is Better?';

export type { ComparisonPage };
export { comparisonTitleTemplate };
