# Workflow Phases

The system has 7 phases. Each phase has a dedicated reference file with detailed instructions.

| Phase | Name | Reference File | Primary Output |
|-------|------|---------------|----------------|
| 1 | Niche Taxonomy | `references/phase-1-taxonomy.md` | Niche context JSONs |
| 2 | Content Categories & Schemas | `references/phase-2-schemas.md` | TypeScript/JSON schemas |
| 3 | Stack & Infrastructure | `references/phase-3-stack.md` | Generation pipeline code |
| 4 | Content Generation | `references/phase-4-generation.md` | Thousands of JSON files |
| 5 | Frontend & UX | `references/phase-5-frontend.md` | React components |
| 6 | Rollout & Monitoring | `references/phase-6-rollout.md` | Deployment batches |
| 7 | Feedback Loop | `references/phase-7-feedback.md` | Iteration plan |

## Phase Routing

When the user starts a conversation, determine where they are:

| Situation | Start at |
|-----------|----------|
| New niche, no prior work | Phase 1 |
| Niche defined, needs schemas | Phase 2 |
| Schemas ready, needs generation | Phase 3–4 |
| Content generated, needs frontend | Phase 5 |
| Ready to publish | Phase 6 |
| Already live, wants to iterate | Phase 7 |

Read the appropriate reference file before proceeding.
