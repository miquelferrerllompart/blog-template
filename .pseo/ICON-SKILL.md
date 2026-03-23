# Icon Creation Skill

## Purpose
Create new SVG icons for the blog design system following DRY principles.

## Single Source of Truth
All icons live in **one place**: `templates/partials/icons.html` (the SVG sprite sheet).

- Every icon is a `<symbol>` element with `id="ic-{name}"` and `viewBox="0 0 48 48"`
- Icons are referenced via `<svg viewBox="0 0 48 48"><use href="#ic-{name}"></use></svg>`
- **Never** duplicate icons as CSS data URIs, inline SVGs, or separate files
- `assets/icons.svg` is a sync copy — after adding icons to the partial, copy it: `cp templates/partials/icons.html assets/icons.svg`

## Icon Design Rules

### Color System
Icons use CSS custom properties with fallback values:
- `var(--ic-1,#7000FF)` — primary stroke/accent (default: brand purple)
- `var(--ic-2,#F1E5FF)` — background fill (default: light purple)
- `var(--ic-3,#5200CC)` — secondary details (default: dark purple)

These can be overridden per-context via CSS:
```css
.callout-icon { --ic-1: var(--gray); --ic-2: transparent; --ic-3: var(--gray); }
```

### Style Guidelines
- **ViewBox:** Always `0 0 48 48`
- **Stroke width:** 1.8 for primary outlines, 1–1.5 for secondary details
- **Fill:** Use `var(--ic-2,#F1E5FF)` for background shapes
- **Opacity:** Use 0.15–0.5 for subtle detail elements
- **Stroke caps/joins:** `round` for organic feel
- **Complexity:** Keep paths minimal — these render at 18–48px

### Naming Convention
- Industry icons: `ic-{industry-slug}` (populated per-niche)
- Topic icons: `ic-topic-{topic}` (populated per-niche)
- Tool icons: `ic-tool-{name}` or `ic-tool-default`
- UI icons: `ic-{function}` (e.g., `ic-action`, `ic-wallet`, `ic-lightbulb`)

## Steps to Add a New Icon

1. **Design** the `<symbol>` following the rules above
2. **Add** it to `templates/partials/icons.html` before the closing `</svg>`
3. **Sync** to assets: `cp templates/partials/icons.html assets/icons.svg`
4. **Add** to `templates/styleguide.html` icon grid (find the `.icon-grid` section):
   ```html
   <div class="icon-cell"><svg viewBox="0 0 48 48"><use href="#ic-{name}"></use></svg><div class="sg-label">ic-{name}</div></div>
   ```
5. **Reference** in templates via `<svg class="callout-icon" viewBox="0 0 48 48"><use href="#ic-{name}"></use></svg>` or similar

## Using Icons in Templates

### Inside template literals (JS-rendered content)
```html
<div class="key-takeaway">
    <svg class="callout-icon" viewBox="0 0 48 48"><use href="#ic-lightbulb"></use></svg>
    ${s.key_takeaway}
</div>
```

### In static HTML
```html
<svg class="callout-icon" viewBox="0 0 48 48"><use href="#ic-wallet"></use></svg>
```

### CSS for icon positioning
```css
.my-element .callout-icon {
    position: absolute;
    left: var(--sp-16);
    top: var(--sp-16);
    width: 18px;
    height: 18px;
    --ic-1: var(--accent);
    --ic-2: transparent;
    --ic-3: var(--accent-dark);
}
```

## Current Icon Inventory
Run this to list all icons: `grep -o 'id="ic-[^"]*"' templates/partials/icons.html`
