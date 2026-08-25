import { formatMonthYear, getLinkLabel, getLinkUrl, normalizeUrl } from '../../utils/resumeModel';

/**
 * Minimal template — single-column, borderless, airy. Separation comes
 * from whitespace and font-weight hierarchy, not rules or fills. themeColor
 * is used extremely sparingly (a thin left-border accent on the name) so
 * this template still reads well in plain black and white.
 *
 * Canvas rule: literal Tailwind classes only (bg-white, text-slate-*) —
 * never --color-* theme tokens — so it stays immune to app dark mode.
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
export default function MinimalTemplate({ content, themeColor }) {
    const { personal, experience, education, projects, skills } = content;

    const contactItems = [
        personal.email && { text: personal.email, href: `mailto:${personal.email}` },
        personal.phone && { text: personal.phone, href: `tel:${personal.phone.replace(/[^\d+]/g, '')}` },
        personal.location && { text: personal.location },
        personal.linkedin && { text: getLinkLabel(personal.linkedin), href: normalizeUrl(getLinkUrl(personal.linkedin)) },
        personal.github && { text: getLinkLabel(personal.github), href: normalizeUrl(getLinkUrl(personal.github)) },
        personal.portfolio && { text: getLinkLabel(personal.portfolio), href: normalizeUrl(getLinkUrl(personal.portfolio)) },
    ].filter(Boolean);

    return (
        <div className="bg-white text-slate-800 font-sans text-[13px] leading-relaxed px-12 py-12">
            <header className="mb-8 pl-3 border-l-2" style={{ borderColor: themeColor }}>
                <h1 className="text-xl font-semibold text-slate-900">
                    {personal.fullName || 'Your Name'}
                </h1>
                {contactItems.length > 0 && (
                    <p className="mt-1 text-[11.5px] text-slate-400 flex flex-wrap items-center gap-x-2.5">
                        {contactItems.map((item, i) => (
                            item.href ? (
                                <a
                                    key={i}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline hover:text-slate-600"
                                >
                                    {item.text}
                                </a>
                            ) : (
                                <span key={i}>{item.text}</span>
                            )
                        ))}
                    </p>
                )}
            </header>

            <div className="space-y-8">
                {personal.summary && (
                    <Section title="Summary">
                        <p className="text-slate-600 whitespace-pre-line break-words">{personal.summary}</p>
                    </Section>
                )}

                {experience.length > 0 && (
                    <Section title="Experience">
                        <div className="space-y-5">
                            {experience.map((item) => (
                                <div key={item.id}>
                                    <div className="font-medium text-slate-900">{item.role || 'Untitled role'}</div>
                                    <div className="text-[12px] text-slate-400">
                                        {[item.company, item.location].filter(Boolean).join(', ')}
                                        {'   '}
                                        {formatMonthYear(item.startDate)} – {item.current ? 'Present' : formatMonthYear(item.endDate)}
                                    </div>
                                    {item.description && (
                                        <p className="mt-1.5 text-slate-600 whitespace-pre-line break-words">{item.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {education.length > 0 && (
                    <Section title="Education">
                        <div className="space-y-5">
                            {education.map((item) => (
                                <div key={item.id}>
                                    <div className="font-medium text-slate-900">{item.degree || 'Untitled degree'}</div>
                                    <div className="text-[12px] text-slate-400">
                                        {[item.school, item.location].filter(Boolean).join(', ')}
                                        {'   '}
                                        {formatMonthYear(item.startDate)} – {formatMonthYear(item.endDate)}
                                    </div>
                                    {item.description && (
                                        <p className="mt-1.5 text-slate-600 whitespace-pre-line break-words">{item.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {projects.length > 0 && (
                    <Section title="Projects">
                        <div className="space-y-5">
                            {projects.map((item) => (
                                <div key={item.id}>
                                    <div className="font-medium text-slate-900">
                                        {item.name || 'Untitled project'}
                                        {item.link && (
                                            <>
                                                {' — '}
                                                <a
                                                    href={normalizeUrl(item.link)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-400 font-normal hover:underline hover:text-slate-600"
                                                >
                                                    {item.link}
                                                </a>
                                            </>
                                        )}
                                    </div>
                                    {item.techStack && (
                                        <div className="text-[12px] text-slate-400">{item.techStack}</div>
                                    )}
                                    {item.description && (
                                        <p className="mt-1.5 text-slate-600 whitespace-pre-line break-words">{item.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {skills.length > 0 && (
                    <Section title="Skills">
                        <div className="space-y-1">
                            {skills.map((group) => (
                                <div key={group.id} className="text-slate-600">
                                    {group.category && (
                                        <span className="text-slate-900 font-medium">{group.category}: </span>
                                    )}
                                    {group.items.join(', ')}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section>
            <h2 className="text-[13px] font-semibold text-slate-900 mb-2.5">{title}</h2>
            {children}
        </section>
    );
}