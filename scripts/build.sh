#!/bin/bash
# build.sh — Generate static HTML pages from JSON content + HTML templates
#
# Usage: ./scripts/build.sh
#
# For each JSON file in content/, this script:
# 1. Reads the JSON content
# 2. Matches it to the appropriate HTML template based on content_type
# 3. Injects the JSON data into the template
# 4. Outputs a static HTML file in public/
#
# Requirements: node (for JSON processing)

set -euo pipefail

CONTENT_DIR="content"
TEMPLATES_DIR="templates"
OUTPUT_DIR="public"

# Load brand config
CONFIG_DOMAIN=$(node -e "console.log(require('./scripts/load-config.js').brand.domain)")
CONFIG_SITE_NAME=$(node -e "console.log(require('./scripts/load-config.js').brand.site_name)")
CONFIG_BRAND_NAME=$(node -e "console.log(require('./scripts/load-config.js').brand.name)")
CONFIG_BRAND_DESC=$(node -e "console.log(require('./scripts/load-config.js').brand.description)")
CONFIG_SITE_URL=$(node -e "console.log(require('./scripts/load-config.js').brand.site_url)")
CONFIG_CTA_URL=$(node -e "console.log(require('./scripts/load-config.js').cta.url)")
CONFIG_CTA_TEXT=$(node -e "console.log(require('./scripts/load-config.js').cta.text)")
CONFIG_UTM_MEDIUM=$(node -e "console.log(require('./scripts/load-config.js').cta.utm_medium)")
CONFIG_BRAND_TAGLINE=$(node -e "console.log(require('./scripts/load-config.js').brand.tagline)")
CONFIG_BRAND_COPYRIGHT=$(node -e "console.log(require('./scripts/load-config.js').brand.copyright)")
CONFIG_ACCENT=$(node -e "console.log(require('./scripts/load-config.js').design.accent)")
CONFIG_ACCENT_LIGHT=$(node -e "console.log(require('./scripts/load-config.js').design.accent_light)")
CONFIG_ACCENT_DARK=$(node -e "console.log(require('./scripts/load-config.js').design.accent_dark)")
CONFIG_POSTHOG_ENABLED=$(node -e "console.log(require('./scripts/load-config.js').analytics.posthog_enabled)")
CONFIG_POSTHOG_KEY=$(node -e "console.log(require('./scripts/load-config.js').analytics.posthog_key)")
CONFIG_POSTHOG_HOST=$(node -e "console.log(require('./scripts/load-config.js').analytics.posthog_host)")

# Clean and prepare output
find "$OUTPUT_DIR" -name "*.html" -type f -delete 2>/dev/null || true
find "$OUTPUT_DIR" -name "*.xml" -type f -delete 2>/dev/null || true
mkdir -p "$OUTPUT_DIR"/{resources,guides,compare,tools,industries,assets}

PARTIALS_DIR="$TEMPLATES_DIR/partials"
STYLES_DIR="$TEMPLATES_DIR/styles"

echo "🔨 Building $CONFIG_SITE_NAME..."

# Generate OG images
node scripts/og-image.js

# Count files
TOTAL=$(find "$CONTENT_DIR" -name "*.json" | wc -l)
COUNT=0

for json_file in $(find "$CONTENT_DIR" -name "*.json" -type f); do
    COUNT=$((COUNT + 1))

    # Extract content type and slug from JSON
    CONTENT_TYPE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$json_file','utf8')).meta.content_type)")
    SLUG=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$json_file','utf8')).seo.slug)")

    # Map content type to template and output directory
    case "$CONTENT_TYPE" in
        resource)     TEMPLATE="$TEMPLATES_DIR/resource.html"; OUT_PATH="$OUTPUT_DIR/resources/$SLUG.html" ;;
        guide)        TEMPLATE="$TEMPLATES_DIR/guide.html"; OUT_PATH="$OUTPUT_DIR/guides/$SLUG.html" ;;
        hub)
            HUB_TYPE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$json_file','utf8')).meta.hub_type)")
            TEMPLATE="$TEMPLATES_DIR/hub.html"
            case "$HUB_TYPE" in
                guide)    OUT_PATH="$OUTPUT_DIR/guides/$SLUG.html" ;;
                resource) OUT_PATH="$OUTPUT_DIR/resources/$SLUG.html" ;;
                *)        OUT_PATH="$OUTPUT_DIR/guides/$SLUG.html" ;;
            esac
            ;;
        alternatives) TEMPLATE="$TEMPLATES_DIR/alternatives.html"; OUT_PATH="$OUTPUT_DIR/compare/$SLUG.html" ;;
        comparison)   TEMPLATE="$TEMPLATES_DIR/comparison.html"; OUT_PATH="$OUTPUT_DIR/compare/$SLUG.html" ;;
        tool)         TEMPLATE="$TEMPLATES_DIR/tool.html"; OUT_PATH="$OUTPUT_DIR/tools/$SLUG.html" ;;
        industry)     TEMPLATE="$TEMPLATES_DIR/industry.html"; OUT_PATH="$OUTPUT_DIR/industries/$SLUG.html" ;;
        *)            echo "⚠️  Unknown content type: $CONTENT_TYPE in $json_file"; continue ;;
    esac

    if [ ! -f "$TEMPLATE" ]; then
        echo "⚠️  Template not found: $TEMPLATE (skipping $json_file)"
        continue
    fi

    # Generate HTML by injecting JSON into template
    # Templates should use {{DATA}} as placeholder for the JSON payload
    node -e "
        const fs = require('fs');
        const path = require('path');
        const data = JSON.parse(fs.readFileSync('$json_file', 'utf8'));
        let template = fs.readFileSync('$TEMPLATE', 'utf8');
        // Resolve styles: {{@name}} → content of styles/name.html
        template = template.replace(/\{\{@([a-z0-9_-]+)\}\}/g, (_, name) => {
            const fp = path.join('$STYLES_DIR', name + '.html');
            return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
        });
        // Resolve partials: {{>name}} → content of partials/name.html
        template = template.replace(/\{\{>([a-z0-9_-]+)\}\}/g, (_, name) => {
            const fp = path.join('$PARTIALS_DIR', name + '.html');
            return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
        });
        template = template.replace('{{DATA}}', JSON.stringify(data));
        template = template.replace(/\{\{TITLE\}\}/g, data.seo.title);
        template = template.replace(/\{\{DESCRIPTION\}\}/g, data.seo.description);
        template = template.replace(/\{\{SLUG\}\}/g, data.seo.slug);
        template = template.replace(/\{\{DATE_PUBLISHED\}\}/g, data.meta.date_published || '');
        template = template.replace(/\{\{DATE_MODIFIED\}\}/g, data.meta.date_modified || '');
        // Industry pages need all pages data for dynamic aggregation
        if (data.meta.content_type === 'industry') {
            const allPages = [];
            function walkContent(dir) {
                if (!fs.existsSync(dir)) return;
                fs.readdirSync(dir).forEach(f => {
                    const fp = path.join(dir, f);
                    if (fs.statSync(fp).isDirectory()) return walkContent(fp);
                    if (!f.endsWith('.json')) return;
                    try {
                        const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
                        if (d.meta.content_type === 'industry') return;
                        allPages.push({
                            type: d.meta.content_type === 'hub' ? d.meta.hub_type : d.meta.content_type,
                            industry: d.meta.industry || '',
                            title: d.seo.title,
                            description: d.seo.description,
                            slug: d.seo.slug
                        });
                    } catch(e) {}
                });
            }
            walkContent('$CONTENT_DIR');
            template = template.replace('{{INDUSTRY_PAGES}}', JSON.stringify(allPages));
        }
        // Hub-specific placeholders
        const prefixes = {resource:'resources',guide:'guides',hub:data.meta.hub_type==='resource'?'resources':'guides',alternatives:'compare',comparison:'compare',tool:'tools',industry:'industries'};
        if (data.meta.content_type === 'hub') {
            const hubPrefix = prefixes.hub;
            template = template.replace(/\{\{CANONICAL\}\}/g, 'https://$CONFIG_DOMAIN/' + hubPrefix + '/' + data.seo.slug);
            const sectionLabel = data.meta.hub_type === 'guide' ? 'Guides' : 'Resources';
            const sectionAnchor = data.meta.hub_type === 'guide' ? 'guides' : 'resources';
            template = template.replace(/\{\{BREADCRUMB_SECTION\}\}/g, sectionLabel);
            template = template.replace(/\{\{BREADCRUMB_ANCHOR\}\}/g, sectionAnchor);
        }
        const ogUrl = 'https://$CONFIG_DOMAIN/' + prefixes[data.meta.content_type] + '/' + data.seo.slug;
        const ogImage = 'https://$CONFIG_DOMAIN/assets/og/' + prefixes[data.meta.content_type] + '-' + data.seo.slug + '.png';
        const ogTags = [
            '<meta property=\"og:title\" content=\"' + data.seo.title.replace(/\"/g,'&quot;') + '\">',
            '<meta property=\"og:description\" content=\"' + data.seo.description.replace(/\"/g,'&quot;') + '\">',
            '<meta property=\"og:url\" content=\"' + ogUrl + '\">',
            '<meta property=\"og:type\" content=\"article\">',
            '<meta property=\"og:site_name\" content=\"$CONFIG_SITE_NAME\">',
            '<meta property=\"og:image\" content=\"' + ogImage + '\">',
            '<meta property=\"og:image:width\" content=\"1200\">',
            '<meta property=\"og:image:height\" content=\"630\">',
            '<meta name=\"twitter:card\" content=\"summary_large_image\">',
            '<meta name=\"twitter:title\" content=\"' + data.seo.title.replace(/\"/g,'&quot;') + '\">',
            '<meta name=\"twitter:description\" content=\"' + data.seo.description.replace(/\"/g,'&quot;') + '\">',
            '<meta name=\"twitter:image\" content=\"' + ogImage + '\">'
        ].join('\n');
        template = template.replace('</head>', ogTags + '\n</head>');
        // SSG: pre-render content into <div id="app">
        const { render } = require('./scripts/render.js');
        template = render(template, data);
        fs.writeFileSync('$OUT_PATH', template);
    "

    echo "  [$COUNT/$TOTAL] $SLUG → $OUT_PATH"
done

echo ""
echo "✅ Built $COUNT pages in $OUTPUT_DIR/"
echo ""

# Generate index page (blog listing)
INDEX_TEMPLATE="$TEMPLATES_DIR/index.html"
if [ -f "$INDEX_TEMPLATE" ]; then
    echo "📋 Generating index page..."
    node -e "
        const fs = require('fs');
        const path = require('path');

        // Collect page summaries from all content JSONs
        const pages = [];
        const contentDir = '$CONTENT_DIR';

        function walk(dir) {
            if (!fs.existsSync(dir)) return;
            fs.readdirSync(dir).forEach(f => {
                const fp = path.join(dir, f);
                if (fs.statSync(fp).isDirectory()) return walk(fp);
                if (!f.endsWith('.json')) return;
                try {
                    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
                    pages.push({
                        type: data.meta.content_type === 'hub' ? data.meta.hub_type : data.meta.content_type,
                        is_hub: data.meta.content_type === 'hub',
                        industry: data.meta.industry || '',
                        industry_display: data.meta.industry_display || '',
                        title: data.seo.title,
                        description: data.seo.description,
                        slug: data.seo.slug,
                        keywords: data.seo.keywords || []
                    });
                } catch(e) { console.error('Skip:', fp, e.message); }
            });
        }
        walk(contentDir);

        // Sort: tools first, then featured types, then alphabetical
        const typeOrder = {tool:0, industry:1, guide:2, alternatives:3, comparison:4, resource:5};
        pages.sort((a,b) => (typeOrder[a.type]??5) - (typeOrder[b.type]??5) || a.title.localeCompare(b.title));

        let template = fs.readFileSync('$INDEX_TEMPLATE', 'utf8');
        // Resolve styles
        template = template.replace(/\{\{@([a-z0-9_-]+)\}\}/g, (_, name) => {
            const fp = path.join('$STYLES_DIR', name + '.html');
            return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
        });
        // Resolve partials
        template = template.replace(/\{\{>([a-z0-9_-]+)\}\}/g, (_, name) => {
            const fp = path.join('$PARTIALS_DIR', name + '.html');
            return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
        });
        template = template.replace('{{PAGES}}', JSON.stringify(pages));
        // Inject OG / Twitter Card meta tags for index
        const config = require('./scripts/load-config.js');
        const indexTitle = config.index.title;
        const indexDesc = config.index.description;
        const domain = config.brand.domain;
        const siteName = config.brand.site_name;
        const ogTags = [
            '<meta property=\"og:title\" content=\"' + indexTitle.replace(/\"/g,'&quot;') + '\">',
            '<meta property=\"og:description\" content=\"' + indexDesc.replace(/\"/g,'&quot;') + '\">',
            '<meta property=\"og:url\" content=\"https://' + domain + '\">',
            '<meta property=\"og:type\" content=\"website\">',
            '<meta property=\"og:site_name\" content=\"' + siteName.replace(/\"/g,'&quot;') + '\">',
            '<meta property=\"og:image\" content=\"https://' + domain + '/assets/og/index.png\">',
            '<meta property=\"og:image:width\" content=\"1200\">',
            '<meta property=\"og:image:height\" content=\"630\">',
            '<meta name=\"twitter:card\" content=\"summary_large_image\">',
            '<meta name=\"twitter:title\" content=\"' + indexTitle.replace(/\"/g,'&quot;') + '\">',
            '<meta name=\"twitter:description\" content=\"' + indexDesc.replace(/\"/g,'&quot;') + '\">',
            '<meta name=\"twitter:image\" content=\"https://' + domain + '/assets/og/index.png\">'
        ].join('\n');
        template = template.replace('</head>', ogTags + '\n</head>');
        fs.writeFileSync('$OUTPUT_DIR/index.html', template);
        console.log('  → index.html (' + pages.length + ' pages)');
    "
fi

# Generate listing pages (guides, tools, compare)
LISTING_TEMPLATE="$TEMPLATES_DIR/listing.html"
if [ -f "$LISTING_TEMPLATE" ]; then
    echo "📑 Generating listing pages..."
    node -e "
        const fs = require('fs');
        const path = require('path');
        const { render } = require('./scripts/render.js');

        // Collect all page summaries
        const pages = [];
        function walk(dir) {
            if (!fs.existsSync(dir)) return;
            fs.readdirSync(dir).forEach(f => {
                const fp = path.join(dir, f);
                if (fs.statSync(fp).isDirectory()) return walk(fp);
                if (!f.endsWith('.json')) return;
                try {
                    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
                    if (data.meta.content_type === 'industry') return;
                    const summary = {
                        type: data.meta.content_type === 'hub' ? data.meta.hub_type : data.meta.content_type,
                        original_type: data.meta.content_type,
                        is_hub: data.meta.content_type === 'hub',
                        industry: data.meta.industry || '',
                        industry_display: data.meta.industry_display || '',
                        title: data.seo.title,
                        description: data.seo.description,
                        slug: data.seo.slug
                    };
                    // Add product icons for compare listing cards
                    if (data.meta.content_type === 'comparison' && data.content.product_overviews) {
                        summary.icon_a = data.content.product_overviews.product_a.icon || '';
                        summary.icon_b = data.content.product_overviews.product_b.icon || '';
                        summary.name_a = data.content.product_overviews.product_a.name || data.meta.product_a || '';
                        summary.name_b = data.content.product_overviews.product_b.name || data.meta.product_b || '';
                    }
                    if (data.meta.content_type === 'alternatives') {
                        summary.target_product = data.meta.target_product || '';
                    }
                    pages.push(summary);
                } catch(e) {}
            });
        }
        walk('$CONTENT_DIR');

        const config = require('./scripts/load-config.js');
        const listings = [
            {
                type: 'tools',
                slug: 'tools',
                title: config.listings.tools.title,
                description: config.listings.tools.description,
                headline: config.listings.tools.headline,
                subtitle: config.listings.tools.subtitle,
                breadcrumb: 'Tools',
                filter: p => p.type === 'tool',
                sort: (a,b) => a.title.localeCompare(b.title)
            },
            {
                type: 'guides',
                slug: 'guides',
                title: config.listings.guides.title,
                description: config.listings.guides.description,
                headline: config.listings.guides.headline,
                subtitle: config.listings.guides.subtitle,
                breadcrumb: 'Guides',
                filter: p => p.type === 'guide' || (p.is_hub && p.original_type === 'hub'),
                sort: (a,b) => (b.is_hub?1:0) - (a.is_hub?1:0) || a.title.localeCompare(b.title)
            },
            {
                type: 'compare',
                slug: 'compare',
                title: config.listings.compare.title,
                description: config.listings.compare.description,
                headline: config.listings.compare.headline,
                subtitle: config.listings.compare.subtitle,
                breadcrumb: 'Compare',
                filter: p => p.type === 'alternatives' || p.type === 'comparison',
                sort: (a,b) => a.title.localeCompare(b.title)
            }
        ];

        const baseTemplate = fs.readFileSync('$LISTING_TEMPLATE', 'utf8');

        for (const listing of listings) {
            let template = baseTemplate;
            // Resolve styles
            template = template.replace(/\{\{@([a-z0-9_-]+)\}\}/g, (_, name) => {
                const fp = path.join('$STYLES_DIR', name + '.html');
                return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
            });
            // Resolve partials
            template = template.replace(/\{\{>([a-z0-9_-]+)\}\}/g, (_, name) => {
                const fp = path.join('$PARTIALS_DIR', name + '.html');
                return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
            });

            const filteredPages = pages.filter(listing.filter).sort(listing.sort);
            const data = {
                meta: { content_type: 'listing' },
                seo: { title: listing.title, description: listing.description, slug: listing.slug },
                listing: { type: listing.type, headline: listing.headline, subtitle: listing.subtitle, breadcrumb: listing.breadcrumb },
                pages: filteredPages
            };

            template = template.replace('{{DATA}}', JSON.stringify(data));
            template = template.replace(/\{\{TITLE\}\}/g, listing.title);
            template = template.replace(/\{\{DESCRIPTION\}\}/g, listing.description);
            template = template.replace(/\{\{SLUG\}\}/g, listing.slug);

            // OG tags
            const ogUrl = 'https://' + config.brand.domain + '/' + listing.slug + '/';
            const ogImage = 'https://' + config.brand.domain + '/assets/og/listing-' + listing.slug + '.png';
            const ogTags = [
                '<meta property=\"og:title\" content=\"' + listing.title.replace(/\"/g,'&quot;') + '\">',
                '<meta property=\"og:description\" content=\"' + listing.description.replace(/\"/g,'&quot;') + '\">',
                '<meta property=\"og:url\" content=\"' + ogUrl + '\">',
                '<meta property=\"og:type\" content=\"website\">',
                '<meta property=\"og:site_name\" content=\"' + config.brand.site_name.replace(/\"/g,'&quot;') + '\">',
                '<meta property=\"og:image\" content=\"' + ogImage + '\">',
                '<meta property=\"og:image:width\" content=\"1200\">',
                '<meta property=\"og:image:height\" content=\"630\">',
                '<meta name=\"twitter:card\" content=\"summary_large_image\">',
                '<meta name=\"twitter:title\" content=\"' + listing.title.replace(/\"/g,'&quot;') + '\">',
                '<meta name=\"twitter:description\" content=\"' + listing.description.replace(/\"/g,'&quot;') + '\">',
                '<meta name=\"twitter:image\" content=\"' + ogImage + '\">'
            ].join('\n');
            template = template.replace('</head>', ogTags + '\n</head>');

            // SSG pre-render
            template = render(template, data);

            const outDir = '$OUTPUT_DIR/' + listing.slug;
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(outDir + '/index.html', template);
            console.log('  → /' + listing.slug + '/ (' + filteredPages.length + ' pages)');
        }
    "
fi

# Generate sitemap with lastmod, changefreq, priority
TODAY=$(date -u +%Y-%m-%d 2>/dev/null || date +%Y-%m-%d)
echo '<?xml version="1.0" encoding="UTF-8"?>' > "$OUTPUT_DIR/sitemap.xml"
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' >> "$OUTPUT_DIR/sitemap.xml"
for html_file in $(find "$OUTPUT_DIR" -name "*.html" -type f | sort); do
    # Skip noindex pages
    case "$html_file" in *styleguide*|*seo-dashboard*) continue ;; esac
    PATH_REL=$(echo "$html_file" | sed "s|$OUTPUT_DIR||" | sed 's|\.html$||')
    # Normalize */index → */ (directory index pages)
    PATH_REL=$(echo "$PATH_REL" | sed 's|/index$|/|')
    # index → root
    if [ "$PATH_REL" = "/" ]; then
        PRIORITY="1.0"
        FREQ="daily"
    elif [ "$PATH_REL" = "/guides/" ] || [ "$PATH_REL" = "/tools/" ] || [ "$PATH_REL" = "/compare/" ]; then
        PRIORITY="0.85"
        FREQ="weekly"
    elif echo "$PATH_REL" | grep -q "^/industries/"; then
        PRIORITY="0.85"
        FREQ="weekly"
    elif echo "$PATH_REL" | grep -q "^/tools/"; then
        PRIORITY="0.9"
        FREQ="monthly"
    elif echo "$PATH_REL" | grep -q "^/compare/"; then
        PRIORITY="0.8"
        FREQ="monthly"
    elif echo "$PATH_REL" | grep -q "^/guides/"; then
        PRIORITY="0.8"
        FREQ="monthly"
    else
        PRIORITY="0.7"
        FREQ="monthly"
    fi
    echo "  <url><loc>https://${CONFIG_DOMAIN}${PATH_REL}</loc><lastmod>${TODAY}</lastmod><changefreq>${FREQ}</changefreq><priority>${PRIORITY}</priority></url>" >> "$OUTPUT_DIR/sitemap.xml"
done
echo '</urlset>' >> "$OUTPUT_DIR/sitemap.xml"
echo "📄 Sitemap generated: $OUTPUT_DIR/sitemap.xml"

# Generate robots.txt
cat > "$OUTPUT_DIR/robots.txt" << ROBOTS
User-agent: *
Allow: /

Sitemap: https://$CONFIG_DOMAIN/sitemap.xml

# LLM-friendly site description (llms.txt spec)
# https://llmstxt.org
# Discovered by ChatGPT, Perplexity, Google AI Overviews
ROBOTS
echo "# https://$CONFIG_DOMAIN/llms.txt" >> "$OUTPUT_DIR/robots.txt"
echo "🤖 robots.txt generated: $OUTPUT_DIR/robots.txt"

# Generate llms.txt (AEO — LLM-friendly site description)
echo "🤖 Generating llms.txt..."
node -e "
    const fs = require('fs');
    const path = require('path');
    const config = require('./scripts/load-config.js');
    const contentDir = '$CONTENT_DIR';
    const pages = {tool:[], resource:[], guide:[], alternatives:[], comparison:[], industry:[]};

    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(f => {
            const fp = path.join(dir, f);
            if (fs.statSync(fp).isDirectory()) return walk(fp);
            if (!f.endsWith('.json')) return;
            try {
                const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
                const type = d.meta.content_type === 'hub' ? d.meta.hub_type : d.meta.content_type;
                if (!pages[type]) pages[type] = [];
                const prefixes = {resource:'/resources/',guide:'/guides/',alternatives:'/compare/',comparison:'/compare/',tool:'/tools/',industry:'/industries/'};
                pages[type].push({
                    title: d.seo.title,
                    desc: d.seo.description,
                    url: 'https://' + config.brand.domain + (prefixes[type]||'/') + d.seo.slug
                });
            } catch(e) {}
        });
    }
    walk(contentDir);

    let out = '# ' + config.brand.name + ' Blog\n\n';
    out += '> ' + config.brand.description + '\n\n';
    out += '## About\n\n';
    out += config.brand.description + ' ';
    out += 'This blog provides free calculators, guides, comparison pages, and actionable resources.\n\n';

    const sections = [
        {key:'tool', title:'Free Tools', desc:'Interactive calculators for loyalty program metrics.'},
        {key:'guide', title:'Guides', desc:'In-depth guides on loyalty, retention, and wallet-pass strategies by industry.'},
        {key:'resource', title:'Resources', desc:'Curated reward ideas, checklists, and best practices by industry vertical.'},
        {key:'alternatives', title:'Alternatives', desc:'Comparison pages for app alternatives.'},
        {key:'comparison', title:'Comparisons', desc:'Head-to-head product comparisons for loyalty platforms.'},
        {key:'industry', title:'Industries', desc:'Industry-specific loyalty program landing pages with curated guides, tools, and resources.'}
    ];

    for (const s of sections) {
        if (!pages[s.key] || pages[s.key].length === 0) continue;
        out += '## ' + s.title + '\n\n';
        out += s.desc + '\n\n';
        pages[s.key].sort((a,b) => a.title.localeCompare(b.title));
        for (const p of pages[s.key]) {
            out += '- [' + p.title + '](' + p.url + '): ' + p.desc + '\n';
        }
        out += '\n';
    }

    fs.writeFileSync('$OUTPUT_DIR/llms.txt', out.trim() + '\n');
    console.log('  → llms.txt (' + Object.values(pages).flat().length + ' pages indexed)');
"

# Copy assets (logo, favicon, etc.)
if [ -d "assets" ]; then
    cp -r assets/* "$OUTPUT_DIR/assets/"
    echo "🖼️  Assets copied to $OUTPUT_DIR/assets/"
fi

# Generate keyword map (scans all content JSONs for cannibalization detection)
echo "🔑 Generating keyword map..."
node scripts/keyword-map.js

# Copy static pages (styleguide, seo-dashboard, etc.) — resolve partials
if [ -f "$TEMPLATES_DIR/styleguide.html" ]; then
    node -e "
        const fs = require('fs');
        const path = require('path');
        let html = fs.readFileSync('$TEMPLATES_DIR/styleguide.html', 'utf8');
        html = html.replace(/\{\{@([a-z0-9_-]+)\}\}/g, (_, name) => {
            const fp = path.join('$STYLES_DIR', name + '.html');
            return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
        });
        html = html.replace(/\{\{>([a-z0-9_-]+)\}\}/g, (_, name) => {
            const fp = path.join('$PARTIALS_DIR', name + '.html');
            return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
        });
        fs.writeFileSync('$OUTPUT_DIR/styleguide.html', html);
    "
    echo "🎨 Style guide copied: $OUTPUT_DIR/styleguide.html"
fi

# Copy SEO dashboard (noindex, password-protected)
if [ -f "$TEMPLATES_DIR/seo-dashboard.html" ]; then
    node -e "
        const fs = require('fs');
        const path = require('path');
        let html = fs.readFileSync('$TEMPLATES_DIR/seo-dashboard.html', 'utf8');
        html = html.replace(/\{\{@([a-z0-9_-]+)\}\}/g, (_, name) => {
            const fp = path.join('$STYLES_DIR', name + '.html');
            return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
        });
        html = html.replace(/\{\{>([a-z0-9_-]+)\}\}/g, (_, name) => {
            const fp = path.join('$PARTIALS_DIR', name + '.html');
            return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
        });
        fs.writeFileSync('$OUTPUT_DIR/seo-dashboard.html', html);
    "
    echo "📊 SEO dashboard copied: $OUTPUT_DIR/seo-dashboard.html"
fi

# Inject head snippets (PostHog, etc.) into all HTML files
SNIPPETS_DIR="$TEMPLATES_DIR/snippets"
if [ -d "$SNIPPETS_DIR" ]; then
    SNIPPET=""
    for snippet_file in "$SNIPPETS_DIR"/*.html; do
        [ -f "$snippet_file" ] && SNIPPET="${SNIPPET}$(cat "$snippet_file")"
    done
    if [ -n "$SNIPPET" ]; then
        for html_file in $(find "$OUTPUT_DIR" -name "*.html" -type f); do
            node -e "
                const fs = require('fs');
                const snippet = fs.readFileSync('/dev/stdin', 'utf8');
                const file = '$html_file';
                let html = fs.readFileSync(file, 'utf8');
                html = html.replace('</head>', snippet + '</head>');
                fs.writeFileSync(file, html);
            " <<< "$SNIPPET"
        done
        echo "💉 Injected head snippets into all HTML files"
    fi
fi

# Resolve config placeholders in all HTML files
echo "🔧 Resolving config placeholders..."
for html_file in $(find "$OUTPUT_DIR" -name "*.html" -type f); do
    node -e "
        const fs = require('fs');
        const config = require('./scripts/load-config.js');
        let html = fs.readFileSync('$html_file', 'utf8');

        // Brand placeholders
        html = html.replace(/\{\{BRAND_NAME\}\}/g, config.brand.name);
        html = html.replace(/\{\{BRAND_TAGLINE\}\}/g, config.brand.tagline);
        html = html.replace(/\{\{BRAND_DESCRIPTION\}\}/g, config.brand.description);
        html = html.replace(/\{\{BRAND_COPYRIGHT\}\}/g, config.brand.copyright);
        html = html.replace(/\{\{SITE_NAME\}\}/g, config.brand.site_name);
        html = html.replace(/\{\{SITE_URL\}\}/g, config.brand.site_url);
        html = html.replace(/\{\{SITE_URL_DISPLAY\}\}/g, config.brand.site_url.replace(/^https?:\/\//, ''));
        html = html.replace(/\{\{DOMAIN\}\}/g, config.brand.domain);
        html = html.replace(/\{\{BLOG_URL\}\}/g, 'https://' + config.brand.domain);

        // CTA placeholders
        html = html.replace(/\{\{CTA_URL\}\}/g, config.cta.url);
        html = html.replace(/\{\{CTA_TEXT\}\}/g, config.cta.text);
        html = html.replace(/\{\{UTM_MEDIUM\}\}/g, config.cta.utm_medium);

        // Analytics placeholders
        html = html.replace(/\{\{POSTHOG_ENABLED\}\}/g, String(config.analytics.posthog_enabled));
        html = html.replace(/\{\{POSTHOG_KEY\}\}/g, config.analytics.posthog_key);
        html = html.replace(/\{\{POSTHOG_HOST\}\}/g, config.analytics.posthog_host);

        // Index page placeholders
        html = html.replace(/\{\{INDEX_TITLE\}\}/g, config.index.title);
        html = html.replace(/\{\{INDEX_DESCRIPTION\}\}/g, config.index.description);
        html = html.replace(/\{\{INDEX_HERO_HEADLINE\}\}/g, config.index.hero_headline);
        html = html.replace(/\{\{INDEX_HERO_SUBTITLE\}\}/g, config.index.hero_subtitle);
        html = html.replace(/\{\{INDEX_CANONICAL\}\}/g, 'https://' + config.brand.domain);
        html = html.replace(/\{\{INDEX_BLOG_NAME\}\}/g, config.brand.site_name);
        html = html.replace(/\{\{INDEX_HERO_TITLE\}\}/g, config.index.hero_headline);
        html = html.replace(/\{\{INDEX_NL_DESC\}\}/g, config.newsletter?.description || 'Stay updated with our latest guides and resources.');
        html = html.replace(/\{\{INDEX_CTA_BODY\}\}/g, config.cta.mid_body || 'Try ' + config.brand.name + ' today.');

        // Listing/static page placeholders
        html = html.replace(/\{\{NL_BANNER_DESC\}\}/g, config.newsletter?.banner_description || 'Weekly strategies and real examples. One email, no fluff.');
        html = html.replace(/\{\{LISTING_CTA_BODY\}\}/g, config.cta.mid_body || 'Try ' + config.brand.name + ' today.');
        html = html.replace(/\{\{LISTING_CTA_BUTTON\}\}/g, config.cta.text);
        html = html.replace(/\{\{STYLEGUIDE_CTA_BODY\}\}/g, config.cta.mid_body || 'Try ' + config.brand.name + ' today.');

        // Fallback: resolve any remaining {{CANONICAL}} on static pages (styleguide, seo-dashboard)
        html = html.replace(/\{\{CANONICAL\}\}/g, 'https://' + config.brand.domain);

        // Design placeholders (for inline styles if any)
        html = html.replace(/\{\{ACCENT\}\}/g, config.design.accent);
        html = html.replace(/\{\{ACCENT_LIGHT\}\}/g, config.design.accent_light);
        html = html.replace(/\{\{ACCENT_DARK\}\}/g, config.design.accent_dark);

        // Mid-CTA placeholders (with fallbacks)
        html = html.replace(/\{\{MID_CTA_HEADLINE\}\}/g, config.cta.mid_headline || 'Ready to get started?');
        html = html.replace(/\{\{MID_CTA_BODY\}\}/g, config.cta.mid_body || 'Try ' + config.brand.name + ' today.');
        html = html.replace(/\{\{MID_CTA_BUTTON\}\}/g, config.cta.mid_button || config.cta.text);

        // Newsletter placeholders (with fallbacks)
        html = html.replace(/\{\{NL_SIDEBAR_LABEL\}\}/g, config.newsletter?.sidebar_label || 'Stay updated');

        // Dashboard password
        html = html.replace(/\{\{DASHBOARD_PASSWORD\}\}/g, config.dashboard_password || 'admin2026');

        fs.writeFileSync('$html_file', html);
    "
done
echo "✅ Placeholders resolved"

# Minify all HTML files (inline CSS + JS included)
echo "🗜️  Minifying HTML..."
for html_file in $(find "$OUTPUT_DIR" -name "*.html" -type f); do
    node -e "
        const fs = require('fs');
        let html = fs.readFileSync('$html_file', 'utf8');
        // Collapse whitespace between tags (preserve inside <script>/<style> as-is since they're already compact)
        // Remove HTML comments (except conditionals)
        html = html.replace(/<!--(?!\[)[\s\S]*?-->/g, '');
        // Collapse runs of whitespace between tags
        html = html.replace(/>\s+</g, '><');
        // Trim leading/trailing whitespace per line and collapse blank lines
        html = html.replace(/^\s+/gm, '').replace(/\n{2,}/g, '\n').trim();
        fs.writeFileSync('$html_file', html);
    "
done
echo "✅ Minified $(find "$OUTPUT_DIR" -name "*.html" | wc -l | tr -d ' ') HTML files"

# Generate Cloudflare Pages _headers for cache control
cat > "$OUTPUT_DIR/_headers" << 'HEADERS'
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/assets/og/*
  Cache-Control: public, max-age=2592000

/*.html
  Cache-Control: public, max-age=14400

/sitemap.xml
  Cache-Control: public, max-age=86400

/llms.txt
  Cache-Control: public, max-age=86400

/robots.txt
  Cache-Control: public, max-age=86400
HEADERS
echo "📋 Cache headers generated: $OUTPUT_DIR/_headers"
