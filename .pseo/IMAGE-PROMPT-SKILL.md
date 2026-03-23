---
name: image-prompts
description: "Generates image prompts for blog posts optimized for Google Nanobanana 2. Reads a content JSON, analyzes sections/topic, and outputs ready-to-paste prompts with keyword-rich alt text and placement metadata. Triggers on: 'generate image prompts', 'image prompts for [slug]', 'create images for [slug]'."
---

# Image Prompt Generation Skill

## Overview

Generates 1-4 image prompts per blog post for Google's Nanobanana 2 image generator. Each prompt includes the image description, keyword-rich alt text, optional caption, and placement within the post.

## When This Skill Triggers

- User says: "generate image prompts", "image prompts for [slug]", "create images for [slug]"
- User references a specific post and wants visual content for it

## Prerequisites

- Content JSON must exist for the target page

---

## Step 1: Identify the Target Page

Find the content JSON file. Accept:
- Full slug: `best-practices-topic-industry`
- Partial match: `topic industry ideas`
- File path: `content/resources/best-practices-topic-industry.json`

Read the JSON and extract:
- `meta.content_type` — determines image count
- `seo.keywords` — source for alt text keywords
- `seo.title` — context for image theme
- Section headings — determines placement options

## Step 2: Determine Image Count

| Content Type | Count | Placements |
|--------------|-------|------------|
| resource | 1-2 | `after:intro`, `after:{section heading}` |
| guide | 2-3 | `after:intro`, `after:{section heading}` |
| alternatives | 1-2 | `after:intro`, `after:recommendation` |
| tool | 0-1 | `after:intro` |
| industry | 1-2 | `after:overview`, `after:pain_points` |
| hub | 0 | No images |
| comparison | 0 | No images |

## Step 3: Generate Prompts

For each image, generate:

### Visual Style Guidelines (consistent across all posts)

- **Style:** Clean flat illustration, minimal detail, modern SaaS aesthetic
- **Colors:** Use the blog's brand palette — purple (#7000FF) as accent, soft grays, white backgrounds
- **Composition:** Simple, centered subject with generous whitespace
- **NO text in images** — Nanobanana renders text poorly
- **NO logos** — keep illustrations generic/conceptual
- **NO photorealism** — flat illustration only
- **Aspect ratio:** Landscape 16:9 or 3:2

### Prompt Structure

Each prompt should follow this pattern:

```
Flat illustration of [SUBJECT], [CONTEXT/SCENE], [STYLE DETAILS].
Clean minimal design, purple (#7000FF) accent color, white background,
modern SaaS aesthetic, no text, no logos.
```

### Alt Text Rules

- **Must include one target keyword** from `seo.keywords` naturally
- Should describe the image content, not be generic ("image of a product")
- 8-15 words, readable as a sentence
- Example: "Dashboard showing key business metrics and performance trends"

## Step 4: Output Format

Present the results as a markdown block the user can review:

```markdown
## Image Prompts for: {page title}

### Image 1
- **Placement:** `after:intro`
- **Prompt:** Flat illustration of a professional reviewing analytics on a tablet, with performance badges floating nearby. Clean minimal design, purple (#7000FF) accent color, white background, modern aesthetic, no text, no logos.
- **Alt text:** Analytics dashboard showing key business performance metrics
- **Caption:** Tracking key metrics helps businesses make smarter decisions

### Image 2
...
```

## Step 5: User Review

After presenting the prompts:
1. Ask if the user wants to adjust any prompts before generating
2. Remind them to paste each prompt into Nanobanana 2
3. After generation, use the `image-attach` skill to compress and attach the images

---

## Example

For a resource page content JSON:

**Image 1:**
- Placement: `after:intro`
- Prompt: Flat illustration of a modern workspace with digital elements floating around it, a smartphone showing an app interface nearby. Clean minimal design, purple accent, white background, modern aesthetic, no text, no logos.
- Alt: Best practices for business growth and customer engagement
- Caption: Businesses can accelerate growth with the right strategies
