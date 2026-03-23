---
name: pseo-20
description: "Programmatic SEO 2.0 system: generates thousands of useful pages at scale using AI + JSON schemas + niche context injection. Use this skill whenever the user mentions pSEO, programmatic SEO, generating pages at scale, niche taxonomy, content schemas, bulk page generation, or wants to work on any phase of their pSEO 2.0 project. Also trigger when the user references a specific niche to work on, mentions JSON schemas for content generation, or talks about scaling SEO content programmatically. This skill covers the full lifecycle: niche research, schema design, content generation, frontend components, rollout strategy, and optimization loops."
---

# pSEO 2.0 — Programmatic SEO System

AI fills strict JSON schemas with rich niche context injection. Content and presentation are fully separated: JSON = data, templates = UI. Reference case: 13,000+ pages in <3h, +466% organic traffic in 60 days.

## Step 0 — Load foundations

Read these before any pSEO work:

1. Read `skill/core-principles.md` — 8 rules that apply at ALL times
2. Read `skill/anti-patterns.md` — things that must never happen

## Step 1 — Determine phase

Read `skill/workflow-phases.md` to identify which phase the user is in, then read the corresponding `references/phase-{n}-*.md` file.

## Step 2 — Understand the niche

If working on a new or existing niche, read `skill/niche-workflow.md` for per-niche and multi-niche orchestration steps.

## Step 3 — Know the content landscape

Read `skill/content-categories.md` to understand page type distribution and prioritization.

Read `skill/file-structure.md` for directory layout conventions.

## Step 4 — Generate content

When generating or editing content JSONs, load these guidelines:

1. Read `skill/brand-target.md` — who we're writing for
2. Read `skill/writing-style.md` — tone, style rules, what to avoid
3. Read `skill/examples/writing-style.md` — good vs bad examples
4. Read `skill/interlinking.md` — internal linking rules
5. Read `skill/examples/interlinking.md` — before/after examples
6. Read `skill/external-references.md` — source tiers, validation, rules
7. Read `skill/examples/external-references.md` — JSON format examples

## Step 5 — Validate

Run `validate.sh` to check schema compliance, external references, and structure.

For URL validation, see `.pseo/URL-VALIDATION-SKILL.md`.

## File index

```
.pseo/skill/
├── core-principles.md        # 8 rules — always apply
├── workflow-phases.md         # 7 phases + routing decision tree
├── niche-workflow.md          # Per-niche + multi-niche orchestration
├── file-structure.md          # Directory layout convention
├── content-categories.md      # Page type distribution table
├── external-references.md     # Source tiers, rules, URL validation
├── brand-target.md            # Audience definition
├── writing-style.md           # Tone pillars, style rules, avoidances
├── interlinking.md            # Internal linking rules
├── anti-patterns.md           # What never to do
└── examples/
    ├── writing-style.md       # Good vs bad tone examples
    ├── interlinking.md        # Before/after link examples
    └── external-references.md # JSON format examples
```
