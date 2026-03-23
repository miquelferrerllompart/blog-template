# Phase 2: Content Categories & JSON Schemas

Schemas are what make this system work at scale. Without them, AI output is inconsistent, unvalidatable, and unpredictable. Every page follows the exact same structure within its content type.

## The Golden Rule

**Never ask AI to write freeform content. Always ask it to fill a strict JSON schema.**

This means:
- Every field has a defined type
- Arrays have min/max item counts
- String fields have enums where appropriate
- Nested objects have required fields
- The schema IS the quality constraint

## Content Category Schemas

### 1. Resource Pages (~58% of pages, highest impact)

34 subtypes including: idea lists, checklists, calendars, guides, templates, tip collections, mistake lists, tool lists, strategy guides, workflow guides, etc.

```typescript
interface ResourceArticle {
  meta: {
    content_type: string;       // e.g., "idea-list", "checklist", "guide"
    niche: string;              // slug from taxonomy
    subtype: string;            // specific resource subtype
    generated_at: string;       // ISO timestamp
  };
  seo: {
    title: string;              // TEMPLATED, never AI-generated
    description: string;        // max 155 chars
    keywords: string[];         // 5-10 long-tail keywords
    slug: string;               // URL-friendly, deterministic
  };
  content: {
    intro: {
      hook: string;             // 1-2 sentences, niche-specific problem
      context: string;          // Why this resource matters for THIS niche
      what_youll_find: string;  // Brief description of page content
    };
    sections: Array<{
      heading: string;
      description: string;      // 2-3 sentences explaining the section
      items: Array<{            // EXACTLY 15-20 items per section
        title: string;
        description: string;    // 2-4 sentences, actionable
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        potential: 'high' | 'medium' | 'standard';
        category?: string;      // for filtering UI
        tags?: string[];        // for search/filter
      }>;
    }>;                         // 3-6 sections
    pro_tips: string[];         // EXACTLY 5 tips
    common_mistakes: string[];  // EXACTLY 3 mistakes to avoid
    next_steps: string;         // What to do after reading this page
  };
  related: {
    internal_links: string[];   // slugs of related pages (same niche)
    external_resources: Array<{
      title: string;
      url_placeholder: string;  // filled manually or via separate process
    }>;
  };
}
```

**Quantity constraints are critical.** Without "EXACTLY 15-20 items", you get 8 items on one page and 40 on the next. Constraints = consistency.

### 2. Free Tools (~18% of pages)

These are functional, not just text. Each tool has inputs, processing logic, and outputs.

```typescript
interface ToolPage {
  meta: {
    content_type: 'tool';
    niche: string;
    tool_type: string;          // e.g., "generator", "analyzer", "calculator", "converter"
  };
  seo: {
    title: string;              // TEMPLATED
    description: string;
    keywords: string[];
  };
  tool: {
    name: string;
    purpose: string;            // What this tool does, 1 sentence
    inputs: Array<{
      field_name: string;
      field_type: 'text' | 'select' | 'number' | 'textarea';
      label: string;
      placeholder: string;      // Niche-specific example
      options?: string[];       // For select fields
      validation?: string;      // Validation rule description
    }>;
    output_format: 'text' | 'list' | 'table' | 'json';
    examples: Array<{           // 3-5 niche-specific examples
      input_values: Record<string, string>;
      expected_output: string;
    }>;
  };
  content: {
    how_to_use: string[];       // 3-5 step instructions
    use_cases: Array<{          // 4-6 use cases
      scenario: string;
      benefit: string;
    }>;
    faq: Array<{                // 5-8 FAQ items
      question: string;
      answer: string;
    }>;
  };
}
```

### 3. Blog/Guides (~12% of pages)

```typescript
interface BlogGuide {
  meta: {
    content_type: 'guide';
    niche: string;
    topic: string;
  };
  seo: {
    title: string;              // TEMPLATED
    description: string;
    keywords: string[];
  };
  content: {
    intro: {
      hook: string;
      problem_statement: string;
      what_youll_learn: string[];  // 3-5 takeaways
    };
    sections: Array<{           // 5-8 sections
      heading: string;
      body: string;             // 150-300 words per section
      key_takeaway: string;     // 1 sentence summary
      actionable_tip?: string;
    }>;
    conclusion: {
      summary: string;
      call_to_action: string;
    };
    faq: Array<{                // 5-8 FAQ items
      question: string;
      answer: string;
    }>;
  };
}
```

### 4. Templates (~7% of pages)

```typescript
interface TemplatePage {
  meta: {
    content_type: 'template';
    niche: string;
    template_type: string;      // e.g., "email", "spreadsheet", "checklist", "calendar"
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  template: {
    name: string;
    description: string;
    structure: Array<{          // The actual template sections
      section_name: string;
      fields: Array<{
        label: string;
        type: 'text' | 'date' | 'number' | 'checkbox' | 'select';
        placeholder: string;    // Niche-specific
        help_text: string;
      }>;
    }>;
    filled_example: Record<string, any>;  // Complete example with niche data
  };
  content: {
    when_to_use: string;
    how_to_customize: string[];  // 3-5 customization tips
    best_practices: string[];    // 3-5 tips
  };
}
```

### 5. Alternatives (~4% of pages)

```typescript
interface AlternativesPage {
  meta: {
    content_type: 'alternatives';
    niche: string;
    target_product: string;     // The product to find alternatives for
  };
  seo: {
    title: string;              // "Best [Product] Alternatives in [Year]"
    description: string;
    keywords: string[];
  };
  content: {
    intro: {
      why_look_for_alternatives: string;
      evaluation_criteria: string[];  // 4-6 criteria
    };
    alternatives: Array<{       // 8-12 alternatives
      name: string;
      one_liner: string;
      best_for: string;
      pros: string[];           // 3-4 pros
      cons: string[];           // 2-3 cons
      pricing_summary: string;
      differentiator: string;   // What makes this unique vs target product
    }>;
    comparison_summary: {
      best_overall: string;
      best_budget: string;
      best_enterprise: string;
    };
    how_to_choose: string;
  };
}
```

### 6. Comparisons (~1% of pages)

```typescript
interface ComparisonPage {
  meta: {
    content_type: 'comparison';
    niche: string;
    product_a: string;
    product_b: string;
  };
  seo: {
    title: string;              // "[A] vs [B]: Which is Better for [Niche]?"
    description: string;
    keywords: string[];
  };
  content: {
    intro: string;
    criteria: Array<{           // 6-10 comparison criteria
      name: string;
      product_a_score: 1 | 2 | 3 | 4 | 5;
      product_b_score: 1 | 2 | 3 | 4 | 5;
      product_a_detail: string;
      product_b_detail: string;
      winner: 'a' | 'b' | 'tie';
    }>;
    verdict: {
      overall_winner: 'a' | 'b' | 'depends';
      choose_a_if: string;
      choose_b_if: string;
      summary: string;
    };
    faq: Array<{
      question: string;
      answer: string;
    }>;
  };
}
```

## Title Templates (deterministic, never AI-generated)

```typescript
const titleTemplates: Record<string, string> = {
  'idea-list':    '{count} {topic} Ideas for {niche} in {year}',
  'checklist':    '{topic} Checklist for {niche} ({year})',
  'guide':        '{topic} Guide for {niche}: Everything You Need to Know',
  'tips':         '{count} {topic} Tips for {niche} in {year}',
  'mistakes':     '{count} {topic} Mistakes {niche} Should Avoid',
  'tools':        'Best {topic} Tools for {niche} in {year}',
  'templates':    'Free {topic} Templates for {niche}',
  'alternatives': 'Best {product} Alternatives for {niche} in {year}',
  'comparison':   '{product_a} vs {product_b} for {niche}: Full Comparison',
  'calendar':     '{topic} Calendar for {niche} ({year})',
  'workflow':     '{topic} Workflow for {niche}: Step-by-Step',
};
```

## Validation Rules

Every generated JSON must pass these checks before being saved:

1. All required fields are present and non-empty
2. Arrays meet min/max length constraints
3. Enums contain only valid values
4. Strings are within length limits
5. No duplicate items within arrays
6. Content is niche-specific (automated check: niche name or related terms appear in body content)
7. SEO title matches the template pattern
8. Slug is URL-safe and follows naming convention

Implement validation as a separate script that runs after generation. Failed validations → retry (max 3 attempts).

## Output of Phase 2

- TypeScript interfaces for all 6 content categories
- Title template registry
- Validation script
- Sample JSONs (1 per category) to verify schemas work
