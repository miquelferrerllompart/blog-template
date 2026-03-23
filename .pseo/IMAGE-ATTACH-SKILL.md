---
name: image-attach
description: "Compresses an image to WebP, stores it in assets/images/, and attaches it to a content JSON with alt text and placement. Triggers on: 'attach image', 'add image to [slug]', 'compress and attach image'."
---

# Image Compress & Attach Skill

## Overview

Takes a raw image file (from Nanobanana 2 or any source), compresses it to WebP, saves it to the repo's `assets/images/` directory with a consistent naming convention, and adds the image entry to the target content JSON's `images` array.

## When This Skill Triggers

- User says: "attach image", "add image to [slug]", "compress and attach"
- User provides an image file path and a target blog post
- User has just generated images with the `image-prompts` skill and wants to attach them

## Prerequisites

- `sharp` npm package must be installed: `npm install sharp`
- The target content JSON must exist
- The image file must exist locally

---

## Step 1: Gather Inputs

Collect from the user:

| Input | Required | Example |
|-------|----------|---------|
| Image file path | Yes | `~/Downloads/topic-industry.png` |
| Target slug | Yes | `best-practices-topic-industry` |
| Alt text | Yes | `Best practices for topic in industry` |
| Placement | Yes | `after:intro` |
| Caption | No | `Fashion brands can boost retention...` |

If the user ran `image-prompts` first, these values should already be defined — confirm with user.

## Step 2: Resolve Target Content JSON

Search `content/` directory for the slug:
1. Check all subdirectories: `resources/`, `guides/`, `alternatives/`, `tools/`, `industries/`
2. Match by slug (filename without `.json`)
3. Read the JSON to get `meta.content_type`

## Step 3: Determine Output Path

Naming convention:
```
assets/images/{content_type}-{slug}-{n}.webp
```

Where `{n}` is the next available number (1, 2, 3...) based on existing images in the JSON's `images` array.

Example: `assets/images/resource-best-practices-topic-industry-1.webp`

## Step 4: Compress Image

Run the compression script:
```bash
node scripts/compress-image.js <input-path> <output-path>
```

This will:
- Convert to WebP at quality 80
- Resize to max 1200px width (maintains aspect ratio)
- Report file size and savings

Verify the output file exists and is reasonable size (< 200KB ideally).

## Step 5: Update Content JSON

Add the image entry to the `content.images` array in the target JSON.

**Critical:** The `images` array MUST be **inside the `content` object**, NOT at the root level of the JSON. Templates access images via `DATA.content.images` — placing it at root level will silently fail (images won't render).

Correct structure:
```json
{
  "meta": { ... },
  "seo": { ... },
  "content": {
    "intro": { ... },
    "sections": [ ... ],
    "images": [
      {
        "alt": "Best practices for topic in industry with product integration",
        "src": "/assets/images/resource-best-practices-topic-industry-1.webp",
        "caption": "Businesses can boost results with effective strategies",
        "placement": "after:intro"
      }
    ]
  },
  "external_references": [ ... ]
}
```

If `content.images` doesn't exist yet, create it as a new array **inside `content`**, as a sibling of `sections`/`faq`/`conclusion`.

**Important:** The `src` path must start with `/assets/images/` (site-root-relative), not the repo path.

## Step 6: Validate

1. Verify `images` is inside `content` (not at root): `node -e "const d=JSON.parse(require('fs').readFileSync('<path>','utf8')); console.log('OK:', d.content.images.length, 'images')"`
2. Verify the image file exists at the output path
2. Verify the JSON is valid after editing
3. Verify the `placement` value matches a valid location in the template:
   - `after:intro` — valid for all types
   - `after:{Section Heading}` — must match an actual section heading in the JSON
   - `after:overview` — industry pages only
   - `after:pain_points` — industry pages only
   - `after:recommendation` — alternatives pages only

## Step 7: Report

Show the user:
- Compression result (size before/after)
- Image path in repo
- Updated JSON field
- Suggest running `bash scripts/build.sh` to verify rendering

---

## Batch Mode

If the user has multiple images to attach to the same post:

1. Compress all images first
2. Add all entries to the `images` array at once
3. Verify all placements are unique (no two images at the same placement)

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `sharp` not installed | Run `npm install sharp` |
| Image too large after compression | Reduce quality to 70: edit `compress-image.js` |
| Placement doesn't match | Check section headings in the content JSON — must be exact match |
| Build fails | Run `node scripts/validate.sh` to check JSON validity |
