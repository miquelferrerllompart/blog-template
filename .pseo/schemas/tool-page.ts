/**
 * pSEO Blog Template — Tool Page Schema
 * ~5.7% of total pages (7 pages)
 *
 * Interactive calculators and assessment tools.
 * High engagement, high shareability, link magnet potential.
 */

interface ToolPage {
  meta: {
    content_type: 'tool';
    niche: string;
    tool_type: 'calculator' | 'analyzer' | 'comparison-tool' | 'assessment';
    generated_at: string;
    date_published: string;        // ISO date (YYYY-MM-DD)
    date_modified: string;         // ISO date (YYYY-MM-DD)
    version: number;
  };
  seo: {
    title: string;                 // TEMPLATED
    description: string;
    keywords: string[];
    slug: string;
    canonical_url: string;
  };
  tool: {
    name: string;
    purpose: string;               // What this tool does, 1 sentence
    inputs: Array<{
      field_name: string;
      field_type: 'text' | 'select' | 'number' | 'range' | 'currency';
      label: string;
      placeholder: string;         // example value for this field
      options?: string[];          // For select fields
      default_value?: string | number;
      validation: {
        required: boolean;
        min?: number;
        max?: number;
        pattern?: string;
      };
      help_text: string;           // Tooltip explaining the input
    }>;
    calculation_logic: {
      description: string;         // Plain-language explanation of the formula
      formula: string;             // The actual formula/algorithm
      assumptions: string[];       // 3-5 assumptions the calculation makes
    };
    output: {
      format: 'dashboard' | 'report' | 'comparison-table' | 'single-value';
      fields: Array<{
        label: string;
        description: string;
        format: 'currency' | 'percentage' | 'number' | 'text';
      }>;
    };
    examples: Array<{              // 3 industry-specific examples
      industry: string;
      input_values: Record<string, string | number>;
      expected_output: Record<string, string | number>;
      narrative: string;           // 2-3 sentences explaining what the results mean
    }>;
  };
  content: {
    intro: string;                 // Why this calculation matters
    how_to_use: string[];          // 4-5 step instructions
    interpretation_guide: string;  // How to read and act on the results
    industry_benchmarks: Array<{   // 5-6 benchmark ranges
      industry: string;
      typical_range: string;
      good_target: string;
    }>;
    use_cases: Array<{             // 4-6 use cases
      scenario: string;
      benefit: string;
    }>;
    faq: Array<{                   // EXACTLY 6 FAQ items
      question: string;
      answer: string;
    }>;
    methodology: string;           // Brief explanation of data sources and calculation basis
    images?: Array<{              // 0-1 inline image per tool page (tools are interactive, images less useful)
      alt: string;                // Keyword-rich alt text — must include a target keyword from seo.keywords naturally
      src: string;                // Path: /assets/images/tool-{slug}-{n}.webp
      caption?: string;           // Optional visible caption below image
      placement: string;          // "after:intro" — typically only after the intro paragraph
    }>;
  };
  external_references: Array<{     // 3-5 authoritative third-party links
    title: string;                   // Descriptive link text
    url: string;                     // Full URL to third-party source
    source: string;                  // Publisher name (e.g., "Official Blog", "Harvard Business Review")
  }>;
  related: {
    internal_links: string[];
  };
  brand_cta: {
    headline: string;              // e.g., "Ready to improve these numbers?"
    subtext: string;
    cta_button: string;            // URL injected by globals.html snippet
  };
}

// Customize per-niche during onboarding
const toolTitleTemplates: Record<string, string> = {
  // e.g. 'roi-calculator': 'ROI Calculator for {industry}',
};

export type { ToolPage };
export { toolTitleTemplates };
