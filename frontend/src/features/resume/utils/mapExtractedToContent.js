import { generateId } from './resumeModel';

const MONTH_NAMES = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
};

/**
 * Best-effort conversion of a free-text extracted date (e.g. "Jan 2020",
 * "January 2020", "01/2020") into the "YYYY-MM" shape the existing
 * ExperienceForm/EducationForm date inputs (type="month") require to
 * display a value at all. Falls back to the original raw text when it
 * can't confidently parse — the raw value is still saved either way, this
 * only affects whether the review screen's date picker can *display* it.
 * A year-only value ("2020") is deliberately left unconverted rather than
 * guessing a month.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeMonthInput(raw) {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;

    const slash = trimmed.match(/^(\d{1,2})[/-](\d{4})$/);
    if (slash) return `${slash[2]}-${slash[1].padStart(2, '0')}`;

    const named = trimmed.match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
    if (named) {
        const month = MONTH_NAMES[named[1].toLowerCase()];
        if (month) return `${named[2]}-${month}`;
    }

    return raw;
}

/**
 * Converts the backend's extraction draft (POST /resumes/upload response,
 * `extracted` — field names already match ResumeContent 1:1, see
 * ats-service/models.py's ExtractedResume) into a fully-formed, editable
 * ResumeContent with real ids for every nested item, ready for the review
 * screen's local state and eventually resumeApi.upsertResume.
 *
 * @param {object} extracted
 * @returns {import('./resumeModel').ResumeContent}
 */
export function mapExtractedToContent(extracted) {
    const personal = extracted?.personal || {};
    return {
        personal: {
            fullName: personal.fullName || '',
            email: personal.email || '',
            phone: personal.phone || '',
            location: personal.location || '',
            linkedin: personal.linkedin || '',
            github: personal.github || '',
            portfolio: personal.portfolio || '',
            summary: personal.summary || '',
        },
        experience: (extracted?.experience || []).map((item) => ({
            id: generateId('exp'),
            company: item.company || '',
            role: item.role || '',
            location: item.location || '',
            startDate: normalizeMonthInput(item.startDate || ''),
            endDate: normalizeMonthInput(item.endDate || ''),
            current: Boolean(item.current),
            description: item.description || '',
        })),
        education: (extracted?.education || []).map((item) => ({
            id: generateId('edu'),
            degree: item.degree || '',
            school: item.school || '',
            location: item.location || '',
            startDate: normalizeMonthInput(item.startDate || ''),
            endDate: normalizeMonthInput(item.endDate || ''),
            description: item.description || '',
        })),
        projects: (extracted?.projects || []).map((item) => ({
            id: generateId('proj'),
            name: item.name || '',
            techStack: item.techStack || '',
            link: item.link || '',
            description: item.description || '',
        })),
        skills: (extracted?.skills || []).map((group) => ({
            id: generateId('skill'),
            category: group.category || '',
            items: Array.isArray(group.items) ? group.items.filter(Boolean) : [],
        })),
        certifications: (extracted?.certifications || []).map((item) => ({
            id: generateId('cert'),
            name: item.name || '',
            issuer: item.issuer || '',
            date: normalizeMonthInput(item.date || ''),
        })),
    };
}
