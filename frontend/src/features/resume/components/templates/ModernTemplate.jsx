import { formatMonthYear, getLinkLabel, getLinkUrl, normalizeUrl } from '../../utils/resumeModel';

/**
 * Modern template — two-column layout with a tinted sidebar (contact,
 * skills, education) and a main column (summary, experience, projects).
 * themeColor drives the sidebar tint, avatar circle, and accent text —
 * this is the template built to showcase the accent color.
 *
 * Canvas rule: literal Tailwind classes only (bg-white, text-slate-*) —
 * never --color-* theme tokens — so it stays immune to app dark mode.
 * The sidebar tint uses an inline style (hex + opacity) since it's derived
 * from the user's chosen themeColor, not a fixed Tailwind class.
 *
 * NOTE: personal.linkedin/github/portfolio can be either a plain string
 * (older data / untouched field) or a { label, url } object (once the
 * user edits either the title or URL box in PersonalInfoForm). Always
 * read the display text through getLinkLabel() and the target through
 * getLinkUrl() + normalizeUrl() — rendering the raw value directly
 * crashes the page (React can't render a plain object as a child), and
 * skipping normalizeUrl() breaks the link if the user typed a URL
 * without "https://".
 *
 * @param {{
 *   content: import('../../utils/resumeModel').ResumeContent,
 *   themeColor: string,
 * }} props
 */
export default function ModernTemplate({ content, themeColor }) {
    const { personal, experience, education, projects, skills } = content;
    const initials = getInitials(personal.fullName);

    const linkedin = getLinkLabel(personal.linkedin);
    const github = getLinkLabel(personal.github);
    const portfolio = getLinkLabel(personal.portfolio);

    return (
        <div className="bg-white text-slate-800 font-sans text-[13px] leading-relaxed flex min-h-full">
            {/* Sidebar */}
            <aside
                className="w-[34%] shrink-0 px-6 py-10"
                style={{ backgroundColor: hexToRgba(themeColor, 0.06) }}
            >
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4"
                    style={{ backgroundColor: themeColor }}
                >
                    {initials || '?'}
                </div>

                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                    {personal.fullName || 'Your Name'}
                </h1>

                <div className="mt-4 space-y-1.5 text-[12px] text-slate-600">
                    {personal.email && <ContactLine icon="mail" text={personal.email} href={`mailto:${personal.email}`} />}
                    {personal.phone && (
                        <ContactLine icon="call" text={personal.phone} href={`tel:${personal.phone.replace(/[^\d+]/g, '')}`} />
                    )}
                    {personal.location && <ContactLine icon="location_on" text={personal.location} />}
                    {linkedin && <ContactLine icon="link" text={linkedin} href={normalizeUrl(getLinkUrl(personal.linkedin))} />}
                    {github && <ContactLine icon="code" text={github} href={normalizeUrl(getLinkUrl(personal.github))} />}
                    {portfolio && <ContactLine icon="language" text={portfolio} href={normalizeUrl(getLinkUrl(personal.portfolio))} />}
                </div>

                {skills.length > 0 && (
                    <div className="mt-6">
                        <SidebarHeading themeColor={themeColor}>Skills</SidebarHeading>
                        <div className="space-y-2.5">
                            {skills.map((group) => (
                                <div key={group.id}>
                                    {group.category && (
                                        <div className="text-[11px] font-semibold text-slate-700 mb-1">{group.category}</div>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                        {group.items.map((skill, i) => (
                                            <span
                                                key={`${skill}-${i}`}
                                                className="px-2 py-0.5 rounded-full text-[10.5px] font-medium text-white"
                                                style={{ backgroundColor: themeColor }}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {education.length > 0 && (
                    <div className="mt-6">
                        <SidebarHeading themeColor={themeColor}>Education</SidebarHeading>
                        <div className="space-y-3">
                            {education.map((item) => (
                                <div key={item.id}>
                                    <div className="text-[12px] font-semibold text-slate-900">{item.degree || 'Untitled degree'}</div>
                                    <div className="text-[11px] text-slate-600">{item.school}</div>
                                    <div className="text-[10.5px] text-slate-500">
                                        {formatMonthYear(item.startDate)} — {formatMonthYear(item.endDate)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            {/* Main column */}
            <main className="flex-1 px-7 py-10">
                {personal.summary && (
                    <section className="mb-6">
                        <MainHeading themeColor={themeColor}>Summary</MainHeading>
                        <p className="text-slate-700 whitespace-pre-line break-words">{personal.summary}</p>
                    </section>
                )}

                {experience.length > 0 && (
                    <section className="mb-6">
                        <MainHeading themeColor={themeColor}>Experience</MainHeading>
                        <div className="space-y-4">
                            {experience.map((item) => (
                                <div key={item.id}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="font-semibold text-slate-900">{item.role || 'Untitled role'}</span>
                                        <span className="text-[11.5px] text-slate-500 shrink-0">
                                            {formatMonthYear(item.startDate)} — {item.current ? 'Present' : formatMonthYear(item.endDate)}
                                        </span>
                                    </div>
                                    <div className="text-[12px] font-medium" style={{ color: themeColor }}>
                                        {[item.company, item.location].filter(Boolean).join(' · ')}
                                    </div>
                                    {item.description && (
                                        <p className="mt-1 text-slate-700 whitespace-pre-line break-words">{item.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {projects.length > 0 && (
                    <section>
                        <MainHeading themeColor={themeColor}>Projects</MainHeading>
                        <div className="space-y-4">
                            {projects.map((item) => (
                                <div key={item.id}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="font-semibold text-slate-900">{item.name || 'Untitled project'}</span>
                                        {item.link && (
                                            <a
                                                href={normalizeUrl(item.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11.5px] text-slate-500 shrink-0 hover:underline hover:text-slate-800"
                                            >
                                                {item.link}
                                            </a>
                                        )}
                                    </div>
                                    {item.techStack && (
                                        <div className="text-[12px] font-medium" style={{ color: themeColor }}>{item.techStack}</div>
                                    )}
                                    {item.description && (
                                        <p className="mt-1 text-slate-700 whitespace-pre-line break-words">{item.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

function ContactLine({ icon, text, href }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-slate-400">{icon}</span>
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="truncate hover:underline hover:text-slate-900">
                    {text}
                </a>
            ) : (
                <span className="truncate">{text}</span>
            )}
        </div>
    );
}

function SidebarHeading({ themeColor, children }) {
    return (
        <h2
            className="text-[11px] font-bold uppercase tracking-wider mb-2.5"
            style={{ color: themeColor }}
        >
            {children}
        </h2>
    );
}

function MainHeading({ themeColor, children }) {
    return (
        <h2
            className="text-[13px] font-bold uppercase tracking-wider text-slate-900 pb-1.5 mb-3 border-b-2"
            style={{ borderColor: themeColor }}
        >
            {children}
        </h2>
    );
}

function getInitials(fullName) {
    if (!fullName) return '';
    return fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(79, 70, 229, ${alpha})`;
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3
        ? clean.split('').map((c) => c + c).join('')
        : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}