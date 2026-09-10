import { createEmptyResume } from '../../resume/utils/resumeModel';

const REALISTIC_PLACEHOLDER_PROFILE = {
    full_name: 'Alex Vance',
    email: 'alex.vance@example.com',
    phone: '+1 (555) 349-8201',
    location: 'San Francisco, CA',
    summary:
        'Senior Software Engineer with 6+ years of experience designing scalable distributed web platforms, high-throughput APIs, and modern user experiences. Passionate about system design and performance.',
    experience: [
        {
            company: 'Stripe',
            role: 'Senior Full Stack Engineer',
            location: 'San Francisco, CA',
            startDate: '2022-03',
            endDate: '',
            current: true,
            description:
                'Architected payment orchestration pipelines handling 12,000 requests/sec with 99.99% uptime. Led modern frontend migration to React 18, cutting TTI by 42%.',
        },
        {
            company: 'Figma',
            role: 'Software Engineer',
            location: 'San Francisco, CA',
            startDate: '2019-06',
            endDate: '2022-02',
            current: false,
            description:
                'Engineered real-time canvas rendering optimizations reducing GPU memory overhead by 35%. Mentored 4 junior engineers and built reusable design system components.',
        },
    ],
    education: [
        {
            school: 'UC Berkeley',
            degree: 'B.S. in Computer Science',
            location: 'Berkeley, CA',
            startDate: '2015-08',
            endDate: '2019-05',
            description: 'Graduated Magna Cum Laude. Dean’s Honors List (all semesters).',
        },
    ],
    skills: [
        {
            category: 'Languages & Core',
            items: ['TypeScript', 'JavaScript (ESNext)', 'Python', 'Go', 'SQL', 'HTML5/CSS3'],
        },
        {
            category: 'Frameworks & Tools',
            items: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'TailwindCSS', 'Docker', 'AWS'],
        },
    ],
    projects: [
        {
            name: 'CloudScale Agent Engine',
            techStack: 'TypeScript, Python, FastAPI',
            link: 'https://github.com/example/cloudscale',
            description: 'Open-source distributed workflow orchestrator with intelligent scheduling.',
        },
    ],
    certifications: [
        {
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            date: '2023',
        },
    ],
    linkedin_url: 'https://linkedin.com/in/alexvance',
    github_url: 'https://github.com/alexvance',
    portfolio_url: 'https://alexvance.dev',
};

/**
 * Creates a realistic resume object specifically tailored for template gallery previews.
 * If user profile data is available, it uses the user's actual information.
 * If sections are missing or empty, it safely complements them with realistic placeholder data
 * so the preview canvas accurately showcases the design's layout and typographic hierarchy.
 *
 * @param {'classic'|'modern'|'minimal'} templateId
 * @param {Object|null} userProfile
 * @param {string} [themeColor='#2C5282']
 * @returns {import('../../resume/utils/resumeModel').ResumeDocument}
 */
export function getTemplatePreviewResume(templateId = 'classic', userProfile = null, themeColor = '#2C5282') {
    // Determine whether user has populated personal info
    const hasName = Boolean(userProfile?.full_name || userProfile?.fullName);
    const hasExp = Array.isArray(userProfile?.experience) && userProfile.experience.length > 0;
    const hasEdu = Array.isArray(userProfile?.education) && userProfile.education.length > 0;
    const hasSkills = Array.isArray(userProfile?.skills) && userProfile.skills.length > 0;

    const baseProfile = hasName ? userProfile : REALISTIC_PLACEHOLDER_PROFILE;

    const preview = createEmptyResume({
        title: `${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Preview`,
        templateId,
        themeColor,
        profile: baseProfile,
    });

    // If user profile was used but had missing experience, fill with realistic preview experience
    if (!hasExp || preview.content.experience.length === 0) {
        preview.content.experience = REALISTIC_PLACEHOLDER_PROFILE.experience.map((exp, i) => ({
            id: `preview-exp-${i}`,
            ...exp,
        }));
    }

    // If user profile was used but had missing education, fill with realistic preview education
    if (!hasEdu || preview.content.education.length === 0) {
        preview.content.education = REALISTIC_PLACEHOLDER_PROFILE.education.map((edu, i) => ({
            id: `preview-edu-${i}`,
            ...edu,
        }));
    }

    // If user profile was used but had missing skills, fill with realistic preview skills
    if (!hasSkills || preview.content.skills.length === 0) {
        preview.content.skills = REALISTIC_PLACEHOLDER_PROFILE.skills.map((s, i) => ({
            id: `preview-skill-${i}`,
            ...s,
        }));
    }

    if (!preview.content.personal.summary) {
        preview.content.personal.summary = REALISTIC_PLACEHOLDER_PROFILE.summary;
    }

    return preview;
}
