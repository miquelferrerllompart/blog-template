/**
 * render.js — SSG pre-renderer
 *
 * Evaluates JS template literals at build time to inject static HTML
 * into <div id="app">. Keeps interactive JS (calculators, etc.) client-side.
 *
 * Usage: called from build.sh via require()
 */

// Load brand config for SSG rendering
const config = require('./load-config.js');
const SITE = {
    CTA_URL: config.cta.url,
    UTM: { medium: config.cta.utm_medium },
    appUrl: function(source, campaign, content) {
        var u = this.CTA_URL + '?utm_medium=' + this.UTM.medium + '&utm_source=' + source;
        if (campaign) u += '&utm_campaign=' + campaign;
        if (content) u += '&utm_content=' + content;
        return u;
    }
};

/**
 * Find the closing backtick of a template literal starting at `start`.
 * Properly handles nested template literals inside ${...} expressions.
 */
function findMatchingBacktick(str, start) {
    let i = start + 1;
    while (i < str.length) {
        const ch = str[i];
        if (ch === '\\') { i += 2; continue; }
        if (ch === '`') return i; // found matching close
        if (ch === '$' && str[i + 1] === '{') {
            // Enter expression — scan for matching }, handling nested template literals and braces
            i += 2;
            let braceDepth = 1;
            while (i < str.length && braceDepth > 0) {
                const c = str[i];
                if (c === '\\') { i += 2; continue; }
                if (c === '{') { braceDepth++; i++; continue; }
                if (c === '}') { braceDepth--; if (braceDepth === 0) break; i++; continue; }
                if (c === '`') {
                    // Nested template literal — recurse
                    const nestedEnd = findMatchingBacktick(str, i);
                    if (nestedEnd === -1) return -1;
                    i = nestedEnd + 1;
                    continue;
                }
                if (c === "'" || c === '"') {
                    // Skip string literals
                    const quote = c;
                    i++;
                    while (i < str.length && str[i] !== quote) {
                        if (str[i] === '\\') i++;
                        i++;
                    }
                    i++; // skip closing quote
                    continue;
                }
                i++;
            }
            i++; // skip the closing }
            continue;
        }
        i++;
    }
    return -1;
}

/**
 * Pre-render a template's <div id="app"> content at build time.
 *
 * @param {string} html - The full HTML template (after partials/styles/DATA replacement)
 * @param {object} data - The parsed JSON content data
 * @returns {string} - The HTML with <div id="app"> filled with static content
 */
function render(html, data) {
    // Find the <script> block immediately after <div id="app">
    const scriptMatch = html.match(/<div id="app"><\/div>\s*<script>([\s\S]*?)<\/script>/);
    if (!scriptMatch) return html;

    const scriptBlock = scriptMatch[1];

    // Extract everything before the innerHTML assignment (helper functions, variables)
    const innerHTMLIndex = scriptBlock.indexOf("document.getElementById('app').innerHTML");
    let preamble = scriptBlock.substring(0, innerHTMLIndex);
    // Remove const DATA declaration — we provide our own
    preamble = preamble.replace(/const DATA\s*=\s*[\s\S]*?;\n/, '');

    // Extract the template literal from innerHTML assignment
    // Find the opening backtick after innerHTML =
    const assignStart = scriptBlock.indexOf('`', innerHTMLIndex);
    if (assignStart === -1) return html;

    // Find the matching closing backtick — handles nested template literals
    const assignEnd = findMatchingBacktick(scriptBlock, assignStart);
    if (assignEnd === -1) return html;

    const templateLiteral = scriptBlock.substring(assignStart, assignEnd + 1);

    // Build evaluation code
    const evalCode = `
        const DATA = ${JSON.stringify(data)};
        const SITE = ${JSON.stringify({
            CTA_URL: SITE.CTA_URL,
            UTM: SITE.UTM
        })};
        SITE.appUrl = function(source, campaign, content) {
            var u = this.CTA_URL + '?utm_medium=' + this.UTM.medium + '&utm_source=' + source;
            if (campaign) u += '&utm_campaign=' + campaign;
            if (content) u += '&utm_content=' + content;
            return u;
        };
        ${preamble}
        return ${templateLiteral};
    `;

    let renderedHTML;
    try {
        const fn = new Function(evalCode);
        renderedHTML = fn();
    } catch (e) {
        console.error('SSG render error:', e.message);
        return html; // Fall back to CSR
    }

    // Inject rendered HTML into <div id="app">
    html = html.replace('<div id="app"></div>', '<div id="app">' + renderedHTML + '</div>');

    // Remove the innerHTML assignment from client-side JS (content already rendered)
    // Keep everything else (calculate(), event handlers, etc.)
    const innerHTMLStatement = scriptBlock.substring(innerHTMLIndex, assignEnd + 2); // +2 for backtick and semicolon
    html = html.replace(innerHTMLStatement, '// SSG: content pre-rendered at build time');

    // Move FAQ schema from client-side JS to <head> (if present)
    if (data.content && data.content.faq) {
        const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": data.content.faq.map(f => ({
                "@type": "Question",
                "name": f.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.answer
                }
            }))
        };
        const faqScriptTag = '<script type="application/ld+json">' + JSON.stringify(faqSchema) + '</script>';
        html = html.replace('</head>', faqScriptTag + '\n</head>');

        // Remove client-side FAQ schema injection
        html = html.replace(/\/\/ FAQ schema[\s\S]*?document\.head\.appendChild\(s\);/g, '// SSG: FAQ schema injected at build time');
    }

    return html;
}

module.exports = { render };
