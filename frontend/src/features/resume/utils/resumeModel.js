/**
 * Resume document data model — single source of truth for the shape of a
 * resume, and factory functions for creating empty entities.
 *
 * @typedef {Object} PersonalInfo
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} location
 * @property {string|{label: string, url: string}} linkedin
 * @property {string|{label: string, url: string}} github
 * @property {string|{label: string, url: string}} portfolio
 * @property {string} summary
 *
 * @typedef {Object} ExperienceItem
 * @property {string} id
 * @property {string} company
 * @property {string} role
 * @property {string} location
 * @property {string} startDate
 * @property {string} endDate
 * @property {boolean} current
 * @property {string} description
 *
 * @typedef {Object} EducationItem
 * @property {string} id
 * @property {string} degree
 * @property {string} school
 * @property {string} location
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} description
 *
 * @typedef {Object} ProjectItem
 * @property {string} id
 * @property {string} name
 * @property {string} techStack
 * @property {string} link
 * @property {string} description
 *
 * @typedef {Object} SkillGroup
 * @property {string} id
 * @property {string} category
 * @property {string[]} items
 *
 * @typedef {Object} CertificationItem
 * @property {string} id
 * @property {string} name
 * @property {string} issuer
 * @property {string} date
 *
 * @typedef {Object} ResumeContent
 * @property {PersonalInfo} personal
 * @property {ExperienceItem[]} experience
 * @property {EducationItem[]} education
 * @property {ProjectItem[]} projects
 * @property {SkillGroup[]} skills
 * @property {CertificationItem[]} certifications
 *
 * @typedef {Object} ResumeDocument
 * @property {string} id
 * @property {string} title
 * @property {'classic'|'modern'|'minimal'} templateId
 * @property {string} themeColor      Hex accent color used by the template
 * @property {string} updatedAt       ISO string
 * @property {ResumeContent} content
 */

/**
 * Generates a reasonably-unique id, prefixed for readability. Used for
 * nested entities (experience/education/project/skill items) that live
 * inside the `content` jsonb column on Supabase — that column has no type
 * constraint, so a prefixed string is fine there.
 * @param {string} prefix
 * @returns {string}
 */
export function generateId(prefix = 'id') {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generates a plain (unprefixed) UUID. MUST be used for the top-level
 * ResumeDocument.id, since that value is stored in Postgres's `id uuid`
 * column on the `resumes` table — Postgres rejects anything that isn't a
 * strict UUID (e.g. "resume_<uuid>" fails with "invalid input syntax for
 * type uuid"), which silently breaks resume creation if generateId() is
 * used there instead.
 * @returns {string}
 */
export function generateUuid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Minimal RFC4122-ish fallback for environments without crypto.randomUUID.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Safely extracts the display label from a link field (linkedin/github/
 * portfolio). These fields start life as plain strings (see
 * createEmptyPersonal) but PersonalInfoForm upgrades them to
 * `{ label, url }` objects the moment the user types in either the title
 * or URL box, so any template that renders these fields must go through
 * this helper instead of rendering `personal.linkedin` etc. directly.
 * Rendering the raw object as a React child (e.g. `<span>{personal.linkedin}</span>`)
 * throws "Objects are not valid as a React child" and crashes to a blank
 * screen — that's the bug this helper fixes.
 * @param {string|{label: string, url: string}} link
 * @returns {string}
 */
export function getLinkLabel(link) {
    if (!link) return '';
    return typeof link === 'object' ? (link.label ?? '') : link;
}

/**
 * Safely extracts the URL from a link field. Same rationale as
 * getLinkLabel — use this instead of reading `.url` directly, since older
 * data (or a field the user never touched) may still be a plain string.
 * @param {string|{label: string, url: string}} link
 * @returns {string}
 */
export function getLinkUrl(link) {
    if (!link) return '';
    return typeof link === 'object' ? (link.url ?? '') : link;
}

/**
 * Ensures a URL actually has a protocol before it's used as an <a href>.
 * Users commonly type "linkedin.com/in/alex" without "https://" — used
 * as-is, a browser treats that as a *relative* path on your own site
 * (e.g. yoursite.com/linkedin.com/in/alex) instead of the real external
 * link. This prepends https:// only when no protocol is already present.
 * @param {string} url
 * @returns {string}
 */
export function normalizeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** @returns {PersonalInfo} */
export function createEmptyPersonal() {
    return {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: '',
        summary: '',
    };
}

/** @returns {ExperienceItem} */
export function createEmptyExperience() {
    return {
        id: generateId('exp'),
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
    };
}

/** @returns {EducationItem} */
export function createEmptyEducation() {
    return {
        id: generateId('edu'),
        degree: '',
        school: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
    };
}

/** @returns {ProjectItem} */
export function createEmptyProject() {
    return {
        id: generateId('proj'),
        name: '',
        techStack: '',
        link: '',
        description: '',
    };
}

/** @returns {SkillGroup} */
export function createEmptySkillGroup() {
    return {
        id: generateId('skill'),
        category: '',
        items: [],
    };
}

/** @returns {CertificationItem} */
export function createEmptyCertification() {
    return {
        id: generateId('cert'),
        name: '',
        issuer: '',
        date: '',
    };
}

/** @returns {ResumeContent} */
export function createEmptyContent() {
    return {
        personal: createEmptyPersonal(),
        experience: [],
        education: [],
        projects: [],
        skills: [],
        certifications: [],
    };
}

/**
 * Creates a brand-new resume document.
 * @param {{ title: string, templateId?: 'classic'|'modern'|'minimal', themeColor?: string }} params
 * @returns {ResumeDocument}
 */
export function createEmptyResume({ title, templateId = 'classic', themeColor = '#4F46E5', profile = null }) {
    const emptyContent = createEmptyContent();

    if (profile) {
        // Pre-fill Personal Info from Master Profile
        emptyContent.personal = {
            fullName: profile.full_name || profile.fullName || '',
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || [profile.city, profile.country].filter(Boolean).join(', ') || '',
            linkedin: profile.linkedin_url || profile.linkedinUrl || profile.linkedin || '',
            github: profile.github_url || profile.githubUrl || profile.github || '',
            portfolio: profile.portfolio_url || profile.portfolioUrl || profile.portfolio || '',
            summary: profile.summary || '',
        };

        // Pre-fill Experience
        if (Array.isArray(profile.experience) && profile.experience.length > 0) {
            emptyContent.experience = profile.experience.map((item) => ({
                id: generateId('exp'),
                company: item.company || '',
                role: item.role || item.title || '',
                location: item.location || '',
                startDate: item.startDate || item.start_date || '',
                endDate: item.endDate || item.end_date || '',
                current: Boolean(item.current),
                description: item.description || '',
            }));
        }

        // Pre-fill Education
        if (Array.isArray(profile.education) && profile.education.length > 0) {
            emptyContent.education = profile.education.map((item) => ({
                id: generateId('edu'),
                degree: item.degree || '',
                school: item.school || item.institution || '',
                location: item.location || '',
                startDate: item.startDate || item.start_date || '',
                endDate: item.endDate || item.end_date || '',
                description: item.description || '',
            }));
        }

        // Pre-fill Skills
        if (Array.isArray(profile.skills) && profile.skills.length > 0) {
            if (typeof profile.skills[0] === 'string') {
                emptyContent.skills = [
                    {
                        id: generateId('skill'),
                        category: 'Technical Skills',
                        items: profile.skills.filter(Boolean),
                    },
                ];
            } else {
                emptyContent.skills = profile.skills.map((grp) => ({
                    id: generateId('skill'),
                    category: grp.category || 'Skills',
                    items: Array.isArray(grp.items) ? grp.items : [],
                }));
            }
        }

        // Pre-fill Projects
        if (Array.isArray(profile.projects) && profile.projects.length > 0) {
            emptyContent.projects = profile.projects.map((proj) => ({
                id: generateId('proj'),
                name: proj.name || proj.title || '',
                techStack: proj.techStack || proj.tech_stack || '',
                link: proj.link || proj.url || '',
                description: proj.description || '',
            }));
        }

        // Pre-fill Certifications
        if (Array.isArray(profile.certifications) && profile.certifications.length > 0) {
            emptyContent.certifications = profile.certifications.map((cert) => ({
                id: generateId('cert'),
                name: cert.name || '',
                issuer: cert.issuer || '',
                date: cert.date || '',
            }));
        }
    }

    return {
        id: generateUuid(),
        title: title?.trim() || 'Untitled Resume',
        templateId,
        themeColor,
        updatedAt: new Date().toISOString(),
        content: emptyContent,
    };
}

/**
 * Deep-clones a resume and assigns fresh ids to every array item, so
 * duplicated resumes never share references (or ids) with the original.
 * @param {ResumeDocument} resume
 * @param {string} [newTitle]
 * @returns {ResumeDocument}
 */
export function duplicateResume(resume, newTitle) {
    const clone = structuredClone(resume);
    clone.id = generateUuid();
    clone.title = newTitle?.trim() || `${resume.title} (Copy)`;
    clone.updatedAt = new Date().toISOString();
    clone.content.experience = clone.content.experience.map((item) => ({ ...item, id: generateId('exp') }));
    clone.content.education = clone.content.education.map((item) => ({ ...item, id: generateId('edu') }));
    clone.content.projects = clone.content.projects.map((item) => ({ ...item, id: generateId('proj') }));
    clone.content.skills = clone.content.skills.map((item) => ({ ...item, id: generateId('skill') }));
    clone.content.certifications = (clone.content.certifications || []).map((item) => ({ ...item, id: generateId('cert') }));
    return clone;
}

/**
 * Formats an ISO date string as a short, human-readable "updated" label.
 * @param {string} isoString
 * @returns {string}
 */
export function formatUpdatedAt(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a "YYYY-MM" (month input) or ISO date string into "Mon YYYY".
 * Falls back to the raw string if it can't be parsed.
 * @param {string} value
 * @returns {string}
 */
export function formatMonthYear(value) {
    if (!value) return '';
    const [year, month] = value.split('-');
    if (!year || !month) return value;
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}