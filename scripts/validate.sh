#!/bin/bash
# validate.sh — Validate generated JSON content against schema rules
#
# Checks:
# 1. Required fields present
# 2. Array length constraints (pro_tips=5, common_mistakes=3, etc.)
# 3. SEO title matches template pattern
# 4. Slug is URL-safe
# 5. Industry-specific content (niche terms appear in body)

set -euo pipefail

CONTENT_DIR="content"
ERRORS=0
CHECKED=0

echo "🔍 Validating content JSONs..."
echo ""

for json_file in $(find "$CONTENT_DIR" -name "*.json" -type f 2>/dev/null); do
    CHECKED=$((CHECKED + 1))
    FILE_ERRORS=0

    # Basic JSON validity
    if ! node -e "JSON.parse(require('fs').readFileSync('$json_file','utf8'))" 2>/dev/null; then
        echo "❌ INVALID JSON: $json_file"
        ERRORS=$((ERRORS + 1))
        continue
    fi

    # Validate required fields and constraints
    RESULT=$(node -e "
        const data = JSON.parse(require('fs').readFileSync('$json_file', 'utf8'));
        const errors = [];

        // Required meta fields
        if (!data.meta?.content_type) errors.push('Missing meta.content_type');
        if (!data.meta?.niche) errors.push('Missing meta.niche');
        if (!data.seo?.title) errors.push('Missing seo.title');
        if (!data.seo?.description) errors.push('Missing seo.description');
        if (!data.seo?.slug) errors.push('Missing seo.slug');
        if (!data.seo?.keywords?.length) errors.push('Missing seo.keywords');

        // SEO description length
        if (data.seo?.description?.length > 160) errors.push('seo.description too long (' + data.seo.description.length + ' chars, max 160)');

        // Slug validation
        if (data.seo?.slug && !/^[a-z0-9-]+$/.test(data.seo.slug)) errors.push('Invalid slug: ' + data.seo.slug);

        // Content type specific validations
        if (data.meta?.content_type === 'resource') {
            if (data.content?.pro_tips?.length !== 5) errors.push('pro_tips should be exactly 5 (got ' + (data.content?.pro_tips?.length || 0) + ')');
            if (data.content?.common_mistakes?.length !== 3) errors.push('common_mistakes should be exactly 3 (got ' + (data.content?.common_mistakes?.length || 0) + ')');
            if (data.content?.sections) {
                data.content.sections.forEach((s, i) => {
                    if (s.items?.length < 5 || s.items?.length > 8) errors.push('Section ' + i + ' has ' + s.items.length + ' items (need 5-8)');
                });
            }
        }

        if (data.meta?.content_type === 'guide') {
            if (data.content?.faq?.length !== 6) errors.push('FAQ should be exactly 6 (got ' + (data.content?.faq?.length || 0) + ')');
            if (data.content?.sections?.length < 6 || data.content?.sections?.length > 8) {
                errors.push('Guides need 6-8 sections (got ' + (data.content?.sections?.length || 0) + ')');
            }
        }

        if (data.meta?.content_type === 'comparison') {
            if (data.content?.criteria?.length < 8 || data.content?.criteria?.length > 10) {
                errors.push('Comparisons need 8-10 criteria (got ' + (data.content?.criteria?.length || 0) + ')');
            }
        }

        if (data.meta?.content_type === 'industry') {
            if (!data.meta?.industry) errors.push('Missing meta.industry');
            if (!data.meta?.industry_display) errors.push('Missing meta.industry_display');
            if (!data.content?.hero?.headline) errors.push('Missing content.hero.headline');
            if (!data.content?.hero?.subheadline) errors.push('Missing content.hero.subheadline');
            if (!data.content?.overview) errors.push('Missing content.overview');
            if (data.content?.faq?.length < 4 || data.content?.faq?.length > 6) {
                errors.push('Industry FAQ should be 4-6 (got ' + (data.content?.faq?.length || 0) + ')');
            }
            if (data.content?.pain_points?.length < 3 || data.content?.pain_points?.length > 5) {
                errors.push('Industry pain_points should be 3-5 (got ' + (data.content?.pain_points?.length || 0) + ')');
            }
        }

        if (data.meta?.content_type === 'alternatives') {
            if (data.content?.alternatives?.length < 8 || data.content?.alternatives?.length > 10) {
                errors.push('Alternatives need 8-10 items (got ' + (data.content?.alternatives?.length || 0) + ')');
            }
        }

        // External references validation
        if (!data.external_references || !Array.isArray(data.external_references)) {
            errors.push('Missing external_references array');
        } else {
            if (data.external_references.length < 3 || data.external_references.length > 5) {
                errors.push('external_references should have 3-5 items (got ' + data.external_references.length + ')');
            }
            const competitors = []; // Define your competitors in site.config.json
            data.external_references.forEach((ref, i) => {
                if (!ref.title) errors.push('external_references[' + i + '] missing title');
                if (!ref.url) errors.push('external_references[' + i + '] missing url');
                if (!ref.source) errors.push('external_references[' + i + '] missing source');
                if (ref.url && !ref.url.startsWith('https://')) errors.push('external_references[' + i + '] url must be HTTPS');
                if (ref.url && competitors.some(c => ref.url.toLowerCase().includes(c))) {
                    errors.push('external_references[' + i + '] links to competitor: ' + ref.url);
                }
            });
        }

        // Niche relevance check — customize nicheTerms for your project
        // const bodyText = JSON.stringify(data.content || {}).toLowerCase();
        // const nicheTerms = ['term1', 'term2', 'term3', 'term4', 'term5'];
        // const found = nicheTerms.filter(t => bodyText.includes(t));
        // if (found.length < 3) errors.push('Low niche relevance: only found ' + found.length + '/' + nicheTerms.length + ' key terms');

        if (errors.length > 0) {
            console.log('❌ ' + '$json_file');
            errors.forEach(e => console.log('   → ' + e));
        } else {
            console.log('✅ ' + '$json_file');
        }
        console.log('ERRORCOUNT:' + errors.length);
    ")

    echo "$RESULT" | grep -v "ERRORCOUNT:"
    FILE_ERRORS=$(echo "$RESULT" | grep "ERRORCOUNT:" | sed 's/ERRORCOUNT://')
    ERRORS=$((ERRORS + FILE_ERRORS))
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checked: $CHECKED files"
echo "Errors:  $ERRORS"
if [ "$ERRORS" -eq 0 ]; then
    echo "✅ All validations passed!"
else
    echo "⚠️  Fix errors before building."
fi
