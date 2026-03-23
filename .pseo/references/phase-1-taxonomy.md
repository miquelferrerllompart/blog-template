# Phase 1: Niche Taxonomy

This is the most important phase of the entire system. Spend ~60% of total project time here. Poor niche context = generic output = wasted pages.

## Niche Context Schema

Every niche MUST have this complete structure:

```json
{
  "slug": "travel",
  "name": "Travel",
  "status": "draft",
  "context": {
    "audience": {
      "primary": "Digital nomads, family vacation planners, solo travelers",
      "secondary": "Travel agents, tourism boards, hospitality businesses",
      "demographics": "25-45, income $50K-120K, tech-savvy, active on social media",
      "psychographics": "Values experiences over things, seeks authenticity, fear of missing out"
    },
    "pain_points": [
      "Seasonal traffic swings make revenue unpredictable",
      "High competition for destination keywords (dominated by TripAdvisor, Lonely Planet)",
      "Content goes stale quickly as prices, visas, and conditions change",
      "Difficulty monetizing beyond basic affiliate links",
      "Google hotel/flight results push organic listings down"
    ],
    "monetization": {
      "primary": ["Affiliate (Booking.com, GetYourGuide, Amazon gear)", "Display ads (Mediavine, AdThrive)"],
      "secondary": ["Sponsored trips and content", "Digital products (itineraries, packing lists)", "Group tours/experiences"],
      "avg_rpm": "$15-35 depending on geo targeting"
    },
    "content_that_works": {
      "formats": ["Itineraries", "Cost breakdowns", "Off-the-beaten-path guides", "Packing lists", "Visa guides"],
      "high_performing_angles": ["Budget travel", "First-time visitor guides", "Hidden gems", "Seasonal guides"],
      "content_gaps": "Most travel content is generic. Niche-specific (e.g., travel for wheelchair users, travel with toddlers) is underserved"
    },
    "subtopics": [
      "budget-travel",
      "luxury-travel", 
      "adventure-travel",
      "solo-travel",
      "family-travel",
      "digital-nomad",
      "travel-photography",
      "travel-hacking"
    ],
    "seo_landscape": {
      "competition_level": "high",
      "long_tail_opportunity": "medium-high (niche combinations like 'budget solo travel southeast asia')",
      "seasonal_patterns": "Strong seasonality: summer (Europe), winter (tropical), shoulder seasons underserved",
      "serp_features": "Hotel packs, flight widgets, featured snippets dominate top results"
    },
    "unique_considerations": [
      "E-E-A-T matters: first-hand experience signals are critical",
      "Freshness is key: outdated visa/price info kills trust",
      "Visual content (photos, maps) significantly impacts engagement",
      "Multi-language opportunity is high"
    ]
  },
  "content_categories": {
    "enabled": ["resources", "tools", "guides", "templates"],
    "disabled_reason": {
      "alternatives": "Not applicable for this niche",
      "comparisons": "Low search volume for travel tool comparisons"
    }
  },
  "generation_notes": {
    "tone": "Conversational but authoritative, first-person experience feel",
    "avoid": ["Generic 'top 10' lists without specific recommendations", "Outdated pricing", "Insensitive cultural generalizations"],
    "emphasize": ["Specific, actionable tips", "Budget ranges", "Local insider knowledge", "Safety considerations"]
  }
}
```

## Process for Building a Niche

### Step 1: Research (don't skip this)

For each niche, gather data from:
- **Google Suggest & People Also Ask** — real queries people type
- **Ahrefs/SEMrush** — keyword volumes, competition, content gaps
- **Reddit/forums** — actual pain points in the audience's words
- **Top 10 sites in the niche** — what content formats work, what's missing
- **Monetization research** — what affiliate programs exist, what RPMs look like

### Step 2: Draft the context

Fill every field in the schema above. Be specific:

**BAD audience definition:**
> "People interested in travel"

**GOOD audience definition:**
> "Digital nomads (25-35, remote workers choosing destinations based on cost-of-living and wifi quality), family vacation planners (35-45, researching kid-friendly destinations with safety as top priority), and solo female travelers (25-40, prioritizing safety guides and community recommendations)"

### Step 3: Validate depth with the differentiation test

Generate a sample page for THIS niche and for a DIFFERENT niche using the same schema. Compare them:

- If >30% of the content could be swapped between niches → context is too shallow
- Every pain point should produce content that ONLY makes sense for this niche
- Subtopics should be specific enough that each could sustain its own content cluster

### Step 4: Subtopic expansion

Each subtopic can potentially multiply content:
- 8 subtopics × 6 content types = 48 base pages per niche
- With variants (beginner/advanced, yearly, by region) this can reach 200+ per niche

Map out the full matrix before generation.

### Step 5: Peer comparison

Compare your niche context against 2-3 similar niches. If contexts are too similar, either:
- Merge the niches into one with more subtopics
- Sharpen the differences until content would be meaningfully distinct

## Niche Registry

Maintain a `_registry.json` tracking all niches:

```json
{
  "niches": [
    {
      "slug": "travel",
      "name": "Travel",
      "status": "validated",
      "content_types_enabled": 4,
      "estimated_pages": 192,
      "last_updated": "2026-03-12",
      "notes": "High competition but strong long-tail. Focus on subtopic combinations."
    }
  ],
  "totals": {
    "niches_draft": 0,
    "niches_validated": 1,
    "niches_generated": 0,
    "niches_live": 0,
    "estimated_total_pages": 192
  }
}
```

## Red Flags During Taxonomy Building

- Pain points that are generic (e.g., "needs more traffic") → dig deeper
- Subtopics that overlap heavily with another niche → refine boundaries
- Audience definition that could apply to any niche → be more specific
- Monetization that's only "affiliate and ads" → research actual programs and RPMs
- No unique_considerations → you haven't researched enough

## Output of Phase 1

Per niche:
- Complete `{slug}.json` file with all context fields populated
- Validated via differentiation test
- Subtopic matrix mapped
- Added to `_registry.json`

For the full project:
- Updated `_registry.json` with page count estimates
- Clear picture of which niches to prioritize (based on volume × competition × monetization)
