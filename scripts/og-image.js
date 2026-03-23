/**
 * og-image.js — Generate OG images (1200x630) for each page at build time
 *
 * Uses satori (JSX → SVG) + @resvg/resvg-js (SVG → PNG)
 * Fonts: Loads heading font from scripts/fonts/ (Montserrat preferred, any TTF/OTF fallback)
 *
 * Usage: node scripts/og-image.js
 * Output: public/assets/og/{type}-{slug}.png
 */

const fs = require('fs');
const path = require('path');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const config = require('./load-config.js');

const CONTENT_DIR = 'content';
const OUTPUT_DIR = 'public/assets/og';

// Try Montserrat first (free), fall back to any available font
const fontFiles = fs.readdirSync(path.join(__dirname, 'fonts')).filter(f => f.endsWith('.otf') || f.endsWith('.ttf'));
const preferredFont = fontFiles.find(f => f.toLowerCase().includes('montserrat')) || fontFiles[0];
if (!preferredFont) { console.error('No font files found in scripts/fonts/'); process.exit(1); }
const fontData = fs.readFileSync(path.join(__dirname, 'fonts', preferredFont));

const TYPE_LABELS = {
    resource: 'Resource',
    guide: 'Guide',
    hub: 'Complete Guide',
    tool: 'Free Tool',
    alternatives: 'Alternatives',
    comparison: 'Comparison',
    industry: 'Industry Guide'
};

// Logo mark SVG — loaded from assets/icon.svg
const iconPath = path.join(__dirname, '..', 'assets', 'icon.svg');
const LOGO_MARK_SVG = fs.existsSync(iconPath)
    ? `data:image/svg+xml,${encodeURIComponent(fs.readFileSync(iconPath, 'utf8').replace(/#7000FF/gi, config.design.accent))}`
    : '';

const SATORI_FONTS = [
    {
        name: 'Heading',
        data: fontData,
        weight: 400,
        style: 'normal',
    },
];

function buildOgImage(title, contentType, industry) {
    const typeLabel = TYPE_LABELS[contentType] || 'Article';

    // Decorative dots (top-right) — 3x2 grid of circles
    const dots = [];
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            dots.push({
                type: 'div',
                props: {
                    style: {
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: config.design.accent,
                        opacity: 0.08 + (row * 3 + col) * 0.03,
                    },
                    children: '',
                }
            });
        }
    }

    // satori uses React-like JSX objects (hyperscript style)
    return {
        type: 'div',
        props: {
            style: {
                width: '1200px',
                height: '630px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '60px 70px',
                background: `linear-gradient(135deg, ${config.design.light} 0%, ${config.design.accent_light} 50%, ${config.design.light} 100%)`,
                fontFamily: 'Heading',
            },
            children: [
                // Top: badge + decorative dots
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                    },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    fontSize: '16px',
                                                    fontWeight: 500,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.12em',
                                                    color: config.design.accent,
                                                    background: config.design.accent_light,
                                                    padding: '8px 20px',
                                                    borderRadius: '100px',
                                                },
                                                children: typeLabel,
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        width: '62px',
                                    },
                                    children: dots,
                                }
                            }
                        ]
                    }
                },
                // Middle: title
                {
                    type: 'div',
                    props: {
                        style: {
                            fontSize: title.length > 60 ? '40px' : '48px',
                            fontFamily: 'Heading',
                            color: '#171717',
                            lineHeight: 1.15,
                            letterSpacing: '-0.02em',
                            maxWidth: '1000px',
                        },
                        children: title,
                    }
                },
                // Bottom: logo + domain
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                    },
                                    children: [
                                        // Logo mark
                                        ...(LOGO_MARK_SVG ? [{
                                            type: 'img',
                                            props: {
                                                src: LOGO_MARK_SVG,
                                                width: 36,
                                                height: 36,
                                            }
                                        }] : []),
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    fontSize: '22px',
                                                    fontFamily: 'Heading',
                                                    color: '#171717',
                                                    letterSpacing: '-0.02em',
                                                },
                                                children: config.brand.name,
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        fontSize: '16px',
                                        color: '#747474',
                                        fontWeight: 500,
                                    },
                                    children: config.brand.domain,
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };
}

async function generateImage(data, outputPath) {
    const tree = buildOgImage(
        data.seo.title,
        data.meta.content_type,
        data.meta.industry
    );

    const svg = await satori(tree, {
        width: 1200,
        height: 630,
        fonts: SATORI_FONTS,
    });

    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: 1200 },
    });
    const png = resvg.render().asPng();
    fs.writeFileSync(outputPath, png);
}

async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const files = [];
    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(f => {
            const fp = path.join(dir, f);
            if (fs.statSync(fp).isDirectory()) return walk(fp);
            if (f.endsWith('.json')) files.push(fp);
        });
    }
    walk(CONTENT_DIR);

    const prefixes = { resource: 'resources', guide: 'guides', hub: 'guides', alternatives: 'compare', comparison: 'compare', tool: 'tools' };

    console.log(`🖼️  Generating ${files.length} OG images...`);
    for (const fp of files) {
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        const prefix = prefixes[data.meta.content_type] || 'pages';
        const filename = `${prefix}-${data.seo.slug}.png`;
        const outputPath = path.join(OUTPUT_DIR, filename);
        await generateImage(data, outputPath);
        console.log(`  → ${filename}`);
    }

    // Generate index OG image
    const indexTitle = config.index.hero_headline || config.index.title;
    const indexTree = buildOgImage(
        indexTitle,
        'guide',
        null
    );
    // Override badge to say "Blog"
    indexTree.props.children[0].props.children[0].props.children[0].props.children = 'Blog';
    const svg = await satori(indexTree, {
        width: 1200,
        height: 630,
        fonts: SATORI_FONTS,
    });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.png'), resvg.render().asPng());
    console.log('  → index.png');

    // Generate listing page OG images
    const listingPages = [
        { slug: 'tools', title: config.listings.tools.title, badge: 'Tools' },
        { slug: 'guides', title: config.listings.guides.title, badge: 'Guides' },
        { slug: 'compare', title: config.listings.compare.title, badge: 'Compare' }
    ];
    for (const listing of listingPages) {
        const tree = buildOgImage(listing.title, 'guide', null);
        tree.props.children[0].props.children[0].props.children[0].props.children = listing.badge;
        const lSvg = await satori(tree, {
            width: 1200, height: 630,
            fonts: SATORI_FONTS,
        });
        const lResvg = new Resvg(lSvg, { fitTo: { mode: 'width', value: 1200 } });
        fs.writeFileSync(path.join(OUTPUT_DIR, `listing-${listing.slug}.png`), lResvg.render().asPng());
        console.log(`  → listing-${listing.slug}.png`);
    }

    console.log(`✅ Generated ${files.length + 1 + listingPages.length} OG images in ${OUTPUT_DIR}/`);
}

main().catch(e => { console.error('OG image generation failed:', e); process.exit(1); });
