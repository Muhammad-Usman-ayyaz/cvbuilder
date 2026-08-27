/**
 * Rule-based ATS (Applicant Tracking System) scoring — no external API
 * calls, no ML. Two independent checks are combined into one score:
 *
 *   1. Keyword match: naive noun-phrase-ish extraction from the job
 *      description, checked against the resume's text content.
 *   2. Formatting/ATS-friendliness: structural checks (section presence,
 *      contact info, dates, empty sections).
 *
 * See analyzeResume() for the combined result shape.
 */

const STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
    'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he',
    'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i',
    'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
    'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
    'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
    'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
    'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
    'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
    'who', 'whom', 'why', 'will', 'with', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'us', 'about', 'above', 'again', 'all', 'am',
    'any', 'because', 'before', 'below', 'between', 'both', 'll', 're',
    've', 'don', 'now', 'work', 'job', 'role', 'team', 'candidate',
    'experience', 'years', 'year', 'strong', 'ability', 'able', 'including',
    'etc', 'using', 'used', 'use', 'will', 'must', 'plus', 'looking',
]);

// A few common variations/abbreviations, normalized both directions so
// "JavaScript" on the resume matches "JS" in the job description and
// vice versa. Deliberately small — see the "limitations" note in the
// feature writeup, this is not a real synonym engine.
const ALIASES = {
    js: 'javascript',
    javascript: 'javascript',
    ts: 'typescript',
    typescript: 'typescript',
    nodejs: 'node',
    'node.js': 'node',
    node: 'node',
    reactjs: 'react',
    'react.js': 'react',
    react: 'react',
    postgres: 'postgresql',
    postgresql: 'postgresql',
    mongo: 'mongodb',
    mongodb: 'mongodb',
    k8s: 'kubernetes',
    kubernetes: 'kubernetes',
    aws: 'aws',
    'amazon web services': 'aws',
    ci: 'cicd',
    cd: 'cicd',
    'ci/cd': 'cicd',
    ml: 'machinelearning',
    'machine learning': 'machinelearning',
};

function normalizeToken(token) {
    const lower = token.toLowerCase().trim();
    if (ALIASES[lower]) return ALIASES[lower];
    // crude singular/plural fold
    return lower.endsWith('s') && lower.length > 3 ? lower.slice(0, -1) : lower;
}

/**
 * Splits text into lowercase word tokens, stripping punctuation but
 * keeping "+", "#", "." inside tokens (so "C++", "C#", "node.js" survive).
 */
function tokenize(text) {
    const raw = text.toLowerCase().match(/[a-z0-9][a-z0-9+#.]*/gi) || [];
    // Drop a trailing "." that's just end-of-sentence punctuation glued to
    // the token (e.g. "plus.") while leaving mid-token dots alone (e.g.
    // "node.js").
    return raw.map((t) => t.replace(/\.+$/, ''));
}

/**
 * Naive noun-phrase-ish extraction: walks the token stream and groups
 * consecutive non-stopword tokens into phrases of 1-3 words. This is not
 * real POS tagging — it just assumes that runs of "meaningful" words in a
 * job description tend to be the skills/tools/requirements worth matching
 * (e.g. "project management", "REST APIs", "machine learning").
 */
function extractCandidatePhrases(text) {
    // Split on list/sentence delimiters first so comma-separated skill
    // lists ("Node.js, Express, REST APIs") don't get chunked together
    // into one meaningless phrase — each segment is chunked independently.
    const segments = text.split(/[,;:()\n/]+|\.\s+/);

    const phrases = [];

    for (const segment of segments) {
        const tokens = tokenize(segment);
        let chunk = [];

        const flush = () => {
            if (chunk.length === 0) return;
            for (let size = 1; size <= 3 && size <= chunk.length; size++) {
                for (let start = 0; start <= chunk.length - size; start++) {
                    phrases.push(chunk.slice(start, start + size).join(' '));
                }
            }
            chunk = [];
        };

        for (const raw of tokens) {
            const isStopword = STOPWORDS.has(raw.toLowerCase());
            const isTooShort = raw.length < 2 && !/[0-9]/.test(raw);
            if (isStopword || isTooShort) {
                flush();
            } else {
                chunk.push(raw);
            }
        }
        flush();
    }

    return phrases;
}

/**
 * Extracts the top N ranked keywords/phrases from a job description.
 * Ranking favors multi-word phrases slightly (they're usually more
 * specific/meaningful) and then frequency.
 */
export function extractKeywords(jobDescription, limit = 25) {
    const phrases = extractCandidatePhrases(jobDescription);

    const counts = new Map();
    for (const phrase of phrases) {
        if (!phrase) continue;
        counts.set(phrase, (counts.get(phrase) || 0) + 1);
    }

    const ranked = Array.from(counts.entries())
        .map(([phrase, count]) => ({
            phrase,
            count,
            words: phrase.split(' ').length,
        }))
        .sort((a, b) => (b.words - a.words) * 2 + (b.count - a.count));

    // De-duplicate phrases that are a *word-boundary* sub-phrase of an
    // already-picked longer phrase (e.g. drop "learning" once "machine
    // learning" is already in). Deliberately word-based, not a plain
    // substring check — a naive substring test would also (wrongly) drop
    // "js" because it's a substring of "node.js".
    const picked = [];
    for (const candidate of ranked) {
        const candidateWords = candidate.phrase.split(' ');
        const isSubsumed = picked.some((p) => {
            if (p.phrase === candidate.phrase) return false;
            const pickedWords = p.phrase.split(' ');
            if (candidateWords.length >= pickedWords.length) return false;
            for (let start = 0; start <= pickedWords.length - candidateWords.length; start++) {
                if (candidateWords.every((w, i) => pickedWords[start + i] === w)) return true;
            }
            return false;
        });
        if (!isSubsumed) picked.push(candidate);
        if (picked.length >= limit) break;
    }

    return picked.map((p) => p.phrase);
}

/** Flattens a resume's `content` object into one lowercase text blob. */
export function resumeContentToText(content) {
    if (!content) return '';
    const parts = [];
    const personal = content.personal || {};
    parts.push(personal.summary, personal.location);

    for (const exp of content.experience || []) {
        parts.push(exp.role, exp.company, exp.description);
    }
    for (const edu of content.education || []) {
        parts.push(edu.degree, edu.school, edu.description);
    }
    for (const proj of content.projects || []) {
        parts.push(proj.name, proj.techStack, proj.description);
    }
    for (const group of content.skills || []) {
        parts.push(group.category, ...(group.items || []));
    }

    return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Checks whether a normalized-word sequence appears as a contiguous run
 * inside another normalized-word sequence. Word-boundary aware — unlike a
 * plain string .includes(), this won't false-positive on "ci" appearing
 * inside "science" or "cd" inside some unrelated word.
 */
function containsWordSequence(haystackWords, needleWords) {
    if (needleWords.length === 0) return false;
    for (let start = 0; start <= haystackWords.length - needleWords.length; start++) {
        if (needleWords.every((w, i) => haystackWords[start + i] === w)) return true;
    }
    return false;
}

/** @returns {{ score: number, matched: string[], missing: string[] }} */
export function scoreKeywordMatch(jobDescription, resumeContent) {
    const keywords = extractKeywords(jobDescription);
    const resumeText = resumeContentToText(resumeContent);
    const resumeTokensNormalized = tokenize(resumeText).map(normalizeToken);

    const matched = [];
    const missing = [];

    for (const phrase of keywords) {
        const phraseWordsNormalized = phrase.split(' ').map(normalizeToken);
        const isMatch = containsWordSequence(resumeTokensNormalized, phraseWordsNormalized);
        if (isMatch) {
            matched.push(phrase);
        } else {
            missing.push(phrase);
        }
    }

    const score = keywords.length === 0
        ? 0
        : Math.round((matched.length / keywords.length) * 100);

    return { score, matched, missing };
}

/**
 * Structural/formatting checks. Each check is pass/fail with a short note
 * — deliberately not a vague sub-score, so the user knows exactly what to
 * fix.
 * @returns {{ checks: Array<{label: string, passed: boolean, note: string}> }}
 */
export function checkFormatting(resumeContent) {
    const content = resumeContent || {};
    const personal = content.personal || {};
    const experience = content.experience || [];
    const education = content.education || [];
    const skills = content.skills || [];

    const checks = [];

    const hasEmail = Boolean(personal.email && personal.email.trim());
    const hasPhone = Boolean(personal.phone && personal.phone.trim());
    checks.push({
        label: 'Contact information present',
        passed: hasEmail && hasPhone,
        note: hasEmail && hasPhone
            ? 'Email and phone number are both present.'
            : `Missing ${!hasEmail ? 'email' : ''}${!hasEmail && !hasPhone ? ' and ' : ''}${!hasPhone ? 'phone number' : ''}. ATS parsers and recruiters look for both.`,
    });

    checks.push({
        label: 'Professional summary',
        passed: Boolean(personal.summary && personal.summary.trim().length >= 20),
        note: personal.summary && personal.summary.trim().length >= 20
            ? 'A summary section is present.'
            : 'No (or a very short) summary — a 2-3 sentence summary near the top helps both ATS keyword scanning and human reviewers.',
    });

    const hasExperienceSection = experience.length > 0;
    checks.push({
        label: 'Experience section present',
        passed: hasExperienceSection,
        note: hasExperienceSection
            ? `${experience.length} experience entr${experience.length === 1 ? 'y' : 'ies'} found.`
            : 'No work experience entries found.',
    });

    const experienceWithMissingDates = experience.filter(
        (exp) => !exp.startDate || (!exp.endDate && !exp.current)
    );
    checks.push({
        label: 'Experience entries have dates',
        passed: hasExperienceSection && experienceWithMissingDates.length === 0,
        note: !hasExperienceSection
            ? 'Skipped — no experience entries.'
            : experienceWithMissingDates.length === 0
                ? 'All experience entries have a start date and an end date (or "current").'
                : `${experienceWithMissingDates.length} experience entr${experienceWithMissingDates.length === 1 ? 'y is' : 'ies are'} missing a start or end date — ATS systems often can't compute tenure without them.`,
    });

    const emptyExperienceDescriptions = experience.filter(
        (exp) => !exp.description || exp.description.trim().length < 10
    );
    checks.push({
        label: 'Experience descriptions are not empty',
        passed: hasExperienceSection && emptyExperienceDescriptions.length === 0,
        note: !hasExperienceSection
            ? 'Skipped — no experience entries.'
            : emptyExperienceDescriptions.length === 0
                ? 'Every experience entry has a description.'
                : `${emptyExperienceDescriptions.length} experience entr${emptyExperienceDescriptions.length === 1 ? 'y has' : 'ies have'} little or no description — add specific achievements/responsibilities.`,
    });

    const hasEducationSection = education.length > 0;
    checks.push({
        label: 'Education section present',
        passed: hasEducationSection,
        note: hasEducationSection
            ? `${education.length} education entr${education.length === 1 ? 'y' : 'ies'} found.`
            : 'No education entries found.',
    });

    const hasSkillsSection = skills.length > 0 && skills.some((g) => (g.items || []).length > 0);
    checks.push({
        label: 'Skills section present',
        passed: hasSkillsSection,
        note: hasSkillsSection
            ? 'At least one skills group with listed items was found.'
            : 'No skills listed — most ATS keyword scans weight a dedicated skills section heavily.',
    });

    return { checks };
}

const MIN_JD_WORDS = 20;
const MIN_JD_KEYWORDS = 3;

/**
 * A resume is "effectively empty" if none of its major content sections
 * have anything in them — in that case a score is close to meaningless
 * (there's nothing for keywords to match against, and every formatting
 * check will fail), so callers should surface a warning instead of just
 * showing a low score with no explanation.
 */
function isResumeEffectivelyEmpty(resumeContent) {
    const content = resumeContent || {};
    const experience = content.experience || [];
    const education = content.education || [];
    const skills = content.skills || [];
    const hasSkillItems = skills.some((g) => (g.items || []).length > 0);

    return experience.length === 0 && education.length === 0 && !hasSkillItems;
}

/**
 * Builds the list of result-level warnings — data-quality issues with the
 * inputs themselves, as opposed to the formatting/keyword checks below
 * (which assess quality of a *reasonable* input). Kept separate from
 * scoring so a thin/empty input still gets scored normally; the warning
 * just tells the user the score isn't very meaningful.
 * @returns {string[]}
 */
function buildWarnings(resumeContent, jobDescription, keywordCount) {
    const warnings = [];

    if (isResumeEffectivelyEmpty(resumeContent)) {
        warnings.push('This resume appears to be empty — fill it out for a meaningful score.');
    }

    const jdWordCount = (jobDescription.match(/\S+/g) || []).length;
    if (jdWordCount < MIN_JD_WORDS || keywordCount < MIN_JD_KEYWORDS) {
        warnings.push('This job description is very short — results may not be meaningful.');
    }

    return warnings;
}

/**
 * Combines keyword match and formatting checks into one overall score.
 * Weighting: keyword match matters most for a specific job application
 * (70%), formatting completeness is the rest (30%) since it's a
 * job-independent baseline.
 * @returns {{
 *   overallScore: number,
 *   keywordMatch: { score: number, matched: string[], missing: string[] },
 *   formatting: { checks: Array<{label: string, passed: boolean, note: string}> },
 *   warnings: string[]
 * }}
 */
export function analyzeResume(resumeContent, jobDescription) {
    const keywordMatch = scoreKeywordMatch(jobDescription, resumeContent);
    const formatting = checkFormatting(resumeContent);

    const formattingScore = formatting.checks.length === 0
        ? 0
        : Math.round((formatting.checks.filter((c) => c.passed).length / formatting.checks.length) * 100);

    const overallScore = Math.round(keywordMatch.score * 0.7 + formattingScore * 0.3);

    const keywordCount = keywordMatch.matched.length + keywordMatch.missing.length;
    const warnings = buildWarnings(resumeContent, jobDescription, keywordCount);

    return { overallScore, keywordMatch, formatting, warnings };
}
