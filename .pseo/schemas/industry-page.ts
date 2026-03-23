/**
 * pSEO Blog Template — Industry Landing Page Schema
 *
 * Per-vertical aggregation pages that group all content (guides, resources,
 * tools, comparisons, alternatives) for a specific industry.
 *
 * URL: /industries/{slug}
 *
 * These pages do NOT hardcode related page slugs — the template dynamically
 * discovers all pages matching meta.industry at build time via {{INDUSTRY_PAGES}}.
 */

interface IndustryPage {
  meta: {
    content_type: 'industry';
    niche: string;                     // e.g., 'your-niche'
    industry: string;                  // e.g., 'fashion-apparel' — must match meta.industry in spoke pages
    industry_display: string;          // e.g., 'Fashion & Apparel'
    generated_at: string;
    date_published: string;        // ISO date (YYYY-MM-DD)
    date_modified: string;         // ISO date (YYYY-MM-DD)
    version: number;
  };
  seo: {
    title: string;                     // e.g., "Fashion & Apparel Programs: Guides, Tools & Resources"
    description: string;               // max 155 chars
    keywords: string[];                // 8-12 keywords
    slug: string;                      // e.g., 'fashion-apparel' — matches industry slug
    canonical_url: string;
  };
  content: {
    hero: {
      headline: string;               // e.g., "Programs for Fashion & Apparel Brands"
      subheadline: string;            // 1-2 sentence value prop for this vertical
    };
    hero_stat?: {                     // Optional headline stat
      value: string;                  // e.g., "65%"
      description: string;           // e.g., "of fashion shoppers join programs"
      source: string;                // e.g., "McKinsey 2024"
    };
    overview: string;                 // 2-3 paragraphs about loyalty in this industry (HTML)
    pain_points: string[];            // 3-5 industry-specific pain points
    product_angle: string;        // How wallet passes help this vertical (HTML)
    faq: Array<{                      // 4-6 industry-specific FAQs
      question: string;
      answer: string;
    }>;
    images?: Array<{                 // 1-2 inline images per industry page
      alt: string;                   // Keyword-rich alt text — must include a target keyword from seo.keywords naturally
      src: string;                   // Path: /assets/images/industry-{slug}-{n}.webp
      caption?: string;              // Optional visible caption below image
      placement: string;             // "after:overview" or "after:pain_points" — where to render the image
    }>;
  };
  brand_cta: {
    headline: string;
    subtext: string;
    cta_button: string;
  };
  external_references: Array<{
    title: string;
    url: string;
    source: string;
  }>;
}

export type { IndustryPage };
