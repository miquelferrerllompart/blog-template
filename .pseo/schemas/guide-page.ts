/**
 * pSEO Blog Template — Guide Page Schema
 * ~24% of total pages (30 pages)
 *
 * Long-form educational content. Industry-specific how-to guides
 * for building programs on Your Platform.
 */

interface GuidePage {
  meta: {
    content_type: 'guide';
    subtype: 'build-loyalty' | 'retention-guide' | 'omnichannel-loyalty' | 'referral-setup' | 'wallet-guide' | 'tiered-loyalty' | 'marketing-guide' | 'churn-reduction';
    niche: string;                  // e.g., 'your-niche'
    industry: string;
    industry_display: string;
    generated_at: string;
    date_published: string;        // ISO date (YYYY-MM-DD)
    date_modified: string;         // ISO date (YYYY-MM-DD)
    version: number;
  };
  seo: {
    title: string;                 // TEMPLATED
    description: string;           // max 155 chars
    keywords: string[];            // 8-12 long-tail keywords
    slug: string;
    canonical_url: string;
  };
  content: {
    intro: {
      hook: string;                // Industry-specific opening that names the problem
      problem_statement: string;   // Why [industry] merchants specifically struggle with loyalty
      what_youll_learn: string[];  // EXACTLY 5 takeaways
      reading_time: string;        // e.g., "12 min read"
    };
    sections: Array<{              // 6-8 sections
      heading: string;
      body: string;                // 200-400 words per section — industry-specific
      key_takeaway: string;        // 1-sentence summary
      actionable_tip: string;      // Specific action the reader can take today
      platform_integration?: string; // How this connects to platform features (POS, Flow, etc.)
      product_angle?: string;  // How wallet passes enhance this strategy
    }>;
    case_study_snippet: {          // Mini case study (real or realistic composite)
      brand_type: string;          // e.g., "A mid-size fashion DTC brand"
      challenge: string;
      solution: string;
      results: Array<{
        metric: string;
        value: string;
      }>;                          // 3-4 results
    };
    conclusion: {
      summary: string;             // 2-3 sentences
      call_to_action: string;      // Soft CTA referencing your product
    };
    faq: Array<{                   // EXACTLY 6 FAQ items — industry-specific
      question: string;
      answer: string;              // 2-4 sentences
    }>;
    images?: Array<{              // 2-3 inline images per guide page
      alt: string;                // Keyword-rich alt text — must include a target keyword from seo.keywords naturally
      src: string;                // Path: /assets/images/guide-{slug}-{n}.webp
      caption?: string;           // Optional visible caption below image
      placement: string;          // "after:intro" or "after:{Section Heading}" — where to render the image
    }>;
  };
  external_references: Array<{     // 3-5 authoritative third-party links
    title: string;
    url: string;
    source: string;
  }>;
  related: {
    internal_links: string[];
    cross_industry_links: string[];
  };
  brand_cta: {
    headline: string;
    subtext: string;
    cta_button: string;            // URL injected by globals.html snippet
  };
}

const guideTitleTemplates: Record<string, string> = {
  'build-loyalty':       'How to Build a Program for Your {industry} Store',
  'retention-guide':     'Complete Guide to {industry} Customer Retention on Your Platform',
  'omnichannel-loyalty': 'Omnichannel Loyalty Guide for {industry} Brands',
  // Health & Wellness niche templates
  'referral-setup':    'How to Set Up a Referral Program for Your {industry}',
  'churn-reduction':   'How to Reduce Churn and Retain Customers in Your {industry}',
  'wallet-guide':      'How to Use Digital Wallet Passes for {industry} Loyalty',
  'tiered-loyalty':    'How to Build a Tiered Program for {industry}',
  'marketing-guide':   'Complete Guide to {industry} Marketing on Your Platform',
};

export type { GuidePage };
export { guideTitleTemplates };
