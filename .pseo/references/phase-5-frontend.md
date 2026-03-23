# Phase 5: Frontend & UX

Every content type gets its own purpose-built React component. No generic templates. This is what separates useful programmatic pages from thin content.

## Core Principle

Pages should behave more like product pages than blog posts. Interactive elements, filtering, structured data — not walls of text.

## Component Architecture

```
components/
├── renderers/
│   ├── ResourceRenderer.tsx    # Idea lists, checklists, tip collections
│   ├── ToolRenderer.tsx        # Interactive tools
│   ├── GuideRenderer.tsx       # Long-form guides
│   ├── TemplateRenderer.tsx    # Downloadable templates
│   ├── AlternativeRenderer.tsx # Alternative comparison pages
│   └── ComparisonRenderer.tsx  # Head-to-head comparisons
├── shared/
│   ├── SEOHead.tsx             # Meta tags, schema markup
│   ├── Breadcrumbs.tsx         # Breadcrumb navigation
│   ├── TableOfContents.tsx     # Auto-generated TOC
│   ├── FilterBar.tsx           # Category/difficulty filters
│   ├── CopyButton.tsx          # Copy-to-clipboard
│   ├── CheckboxList.tsx        # Interactive checkboxes
│   ├── FAQSection.tsx          # Collapsible FAQ with schema markup
│   └── RelatedPages.tsx        # Internal linking component
└── layouts/
    └── PageLayout.tsx          # Shared layout wrapper
```

## Features Per Content Type

### Resource Pages (idea lists, checklists, guides)

Interactive features that make pages useful:
- **Filter by category** — dropdown or tag cloud
- **Filter by difficulty** — beginner / intermediate / advanced toggle
- **Filter by potential** — high / medium / standard
- **Copy-to-clipboard** — per item, copies title + description
- **Progress tracking** — for checklists, save checked items (in-memory or localStorage)
- **Search within page** — filter items by keyword
- **Expand/collapse sections** — for long lists

### Tool Pages

Functional tools, not just descriptions:
- **Working input form** — real inputs with validation
- **Live output** — generated result based on inputs
- **Niche-specific examples** — pre-filled with relevant data
- **Copy/export output** — clipboard or download
- **Usage counter** — "X people used this tool today" (optional, social proof)

### Guide Pages

Readable, structured long-form:
- **Sticky table of contents** — tracks reading position
- **Estimated reading time**
- **Key takeaway boxes** — highlighted per section
- **Actionable tip callouts** — visually distinct
- **Progress bar** — reading progress indicator

### Template Pages

Downloadable and usable:
- **Preview of filled template** — with niche example data
- **Interactive template** — fill fields online
- **Download as PDF/CSV** — export functionality
- **Copy template structure** — clipboard

### Alternatives Pages

Comparison-oriented:
- **Quick comparison table** — at top of page
- **Filter by use case** — "best for budget", "best for enterprise"
- **Expand details** — show/hide full pros/cons
- **Side-by-side view** — compare 2-3 alternatives

### Comparison Pages

Structured head-to-head:
- **Score visualization** — bar charts or radar charts per criterion
- **Winner badges** — per criterion and overall
- **Quick verdict** — "Choose A if... Choose B if..."
- **Collapsible detail sections**

## SEO Technical Requirements

Every page must include:

### Meta tags
```tsx
<head>
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <meta name="keywords" content={seo.keywords.join(', ')} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:title" content={seo.title} />
  <meta property="og:description" content={seo.description} />
  <meta property="og:type" content="article" />
</head>
```

### Schema markup (JSON-LD)

Depending on content type:
- **FAQPage** — for pages with FAQ sections
- **HowTo** — for checklists and step-by-step guides
- **Article** — for blog/guide pages
- **SoftwareApplication** — for tool pages
- **ItemList** — for list/idea pages

### Breadcrumbs
```
Home > {Content Type} > {Niche} > {Page Title}
```
With BreadcrumbList schema markup.

### Internal Linking Strategy

Each page links to:
- Other content types for the same niche (e.g., "See our Travel checklist" from Travel ideas page)
- Same content type for related niches (e.g., "Also check: Adventure Travel ideas")
- Parent category page (e.g., all idea lists)
- Niche hub page (e.g., all Travel content)

This creates a dense internal link structure that helps both users and crawlers.

### Sitemap

Auto-generated sitemap.xml with:
- All pages organized by content type
- lastmod dates from generation timestamps
- Priority weighting: tools (0.8) > resources (0.7) > guides (0.6) > others (0.5)
- changefreq: monthly for most, weekly for tools

## Performance Requirements

With 13K+ pages, performance matters:
- **Static generation** — pre-render all pages at build time (SSG)
- **Lazy load below-fold content** — especially for long lists
- **Image optimization** — if any images, use next/image or equivalent
- **CSS** — Tailwind utility classes, purged for production
- **Bundle size** — each page type loads only its renderer, not all components
- **Core Web Vitals** — target LCP < 2.5s, FID < 100ms, CLS < 0.1

## Output of Phase 5

- All renderer components built and tested
- Shared components (SEO, breadcrumbs, filters, etc.)
- Schema markup implemented per content type
- Sitemap generation script
- Internal linking logic
- Build tested with sample content (verify SSG works with 100+ pages)
