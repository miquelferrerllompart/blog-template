# File Structure Convention

All pSEO work follows this structure:

```
pseo-project/
├── taxonomy/
│   ├── _registry.json          # Master list of all niches + status
│   └── {niche-slug}.json       # One file per niche
├── schemas/
│   └── {content-type}.ts       # One schema per content category
├── content/
│   └── {content-type}/
│       └── {niche-slug}.json   # Generated content files
├── components/
│   └── {content-type}/
│       └── index.tsx            # One renderer per content type
├── templates/
│   └── titles.ts               # Deterministic title templates
└── config/
    └── generation.json          # API settings, concurrency, retry config
```
