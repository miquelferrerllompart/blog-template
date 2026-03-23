# Branding Skill — Apply Brand Identity

## Trigger
- "apply brand", "brand book", "branding", "update colors", "apply design system"
- User provides a brand book, style guide, Figma link, or design assets

## Overview
Reads brand materials (PDF, Figma, written guidelines, or verbal instructions) and applies the visual identity to the blog's design system, assets, and configuration.

## Input: Brand Materials
The user may provide any combination of:
- Brand book PDF (colors, typography, logos, tone of voice)
- Figma link to a design system or brand kit (use Figma MCP)
- Written guidelines (color palette, font names, tone rules)
- Logo files (SVG preferred)
- Verbal instructions ("use blue #2563EB, Inter font, modern minimal")

## Phase 1: Extract Brand Elements

Read all provided materials and extract:

### Colors
- **Primary/accent** color → `design.accent`
- **Light variant** (10-15% opacity or tinted) → `design.accent_light`
- **Dark variant** (hover/active states) → `design.accent_dark`
- **Background** color → `design.light`
- **Text** color → `design.dark`

If only a primary color is provided, derive the others:
- Light: mix primary with white at 10% → `accent_light`
- Dark: darken primary 20% → `accent_dark`

### Typography
- **Heading font** — check if available as OTF/TTF for OG images (Satori requires these formats)
- **Body font** — for main text
- **Code font** — for tags, labels (optional, default: Inconsolata)

If the font is a paid/proprietary font, check with the user:
- "The brand uses [Font X]. Is it available as OTF/TTF? If not, I'll suggest a free alternative for OG images."

### Logo & Icons
- **Wordmark/full logo** → `assets/logo.svg` (header, footer)
- **Icon mark/isotype** → `assets/icon.svg` (OG images, favicon base)
- **Favicon** → `assets/favicon.svg`

### Tone of Voice
If the brand book includes writing guidelines:
- Update `.pseo/skill/writing-style.md` with the brand's tone
- Update `.pseo/skill/brand-target.md` with refined audience description

## Phase 2: Confirm with User

Present extracted elements:
```
Brand colors:
  Accent:       #2563EB (blue)
  Accent light: #EFF6FF
  Accent dark:  #1D4ED8
  Background:   #FFFFFF
  Text:         #111827

Typography:
  Headings: Inter Bold
  Body:     Inter Regular

Logo: [extracted/provided]
Tone: Professional, technical, developer-focused
```

Ask: "Does this look correct? Any adjustments?"

## Phase 3: Apply to Configuration

Update `site.config.json`:
```json
{
  "design": {
    "accent": "#2563EB",
    "accent_light": "#EFF6FF",
    "accent_dark": "#1D4ED8",
    "dark": "#111827",
    "light": "#FFFFFF"
  }
}
```

## Phase 4: Apply to Assets

1. Save logo SVG → `assets/logo.svg`
2. Save icon/mark SVG → `assets/icon.svg`
3. Save favicon → `assets/favicon.svg`
4. If heading font is available as OTF/TTF:
   - Save to `scripts/fonts/` (remove old font files)
   - OG images will pick it up automatically

If Figma link provided:
- Use Figma MCP `get_design_context` or `get_screenshot` to extract design tokens
- Use `get_variable_defs` for color/spacing variables if available

## Phase 5: Apply to CSS (if needed)

The build system reads colors from `site.config.json` at build time and resolves `{{ACCENT}}` etc. in templates. However, `templates/styles/base-css.html` has hardcoded CSS variable defaults.

Update `base-css.html` `:root` variables to match the new brand colors as defaults:
- `--accent: [new color]`
- `--accent-light: [new light]`
- `--accent-dark: [new dark]`
- `--dark: [new dark text]`
- `--light: [new background]`
- `--font-heading: [new heading font]`
- `--font-primary: [new body font]`

## Phase 6: Verify

1. Run `npm run build`
2. Check OG images in `public/assets/og/` — correct colors, logo, brand name
3. Check header/footer — logo renders, CTA text correct
4. Check any page — accent colors applied in tags, buttons, links

Report results:
```
✅ Branding applied successfully!
- Colors: accent #2563EB, light #EFF6FF, dark #1D4ED8
- Logo: assets/logo.svg (updated)
- OG images: regenerated with new branding
- CSS: variables updated in base-css.html
```

## Notes
- Can be run multiple times (idempotent) — each run overwrites previous branding
- Works independently of the onboarding skill
- If fonts change, OG images are automatically regenerated on next build
- Industry color variables (`--ind-*`) are content-driven and not affected by branding
