import {
    formatMonthYear,
    getLinkLabel,
    getLinkUrl,
    normalizeUrl,
} from '../../utils/resumeModel';

/**
 * Classic template — single-column, traditional, ATS-friendly.
 *
 * Important:
 * - Resume content uses normal text wrapping.
 * - Flex children use min-w-0 so they can shrink.
 * - Long URLs/text are allowed to break.
 * - The same resume data can be used with different templates.
 *
 * @param {{
 *   content: import('../../utils/resumeModel').ResumeContent,
 *   themeColor: string,
 * }} props
 */
export default function ClassicTemplate({ content, themeColor }) {
    const {
        personal,
        experience,
        education,
        projects,
        skills,
    } = content;

    // Contact information
    const contactItems = [
        personal.location && {
            text: personal.location,
        },

        personal.email && {
            text: personal.email,
            href: `mailto:${personal.email}`,
        },

        personal.phone && {
            text: personal.phone,
            href: `tel:${personal.phone.replace(/[^\d+]/g, '')}`,
        },

        personal.linkedin && {
            text: getLinkLabel(personal.linkedin),
            href: normalizeUrl(getLinkUrl(personal.linkedin)),
        },

        personal.github && {
            text: getLinkLabel(personal.github),
            href: normalizeUrl(getLinkUrl(personal.github)),
        },

        personal.portfolio && {
            text: getLinkLabel(personal.portfolio),
            href: normalizeUrl(getLinkUrl(personal.portfolio)),
        },
    ].filter(Boolean);

    return (
        <div
            className="
                bg-white
                text-slate-800
                font-sans
                text-[13px]
                leading-relaxed
                px-10
                py-10
                whitespace-normal
                break-words
            "
            style={{
                overflowWrap: 'anywhere',
            }}
        >
            {/* ================= HEADER ================= */}
            <header
                className="text-center mb-6 pb-4 border-b-2"
                style={{ borderColor: themeColor }}
            >
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight break-words">
                    {personal.fullName || 'Your Name'}
                </h1>

                {contactItems.length > 0 && (
                    <p className="mt-1.5 text-[12px] text-slate-500 flex flex-wrap items-center justify-center gap-x-1.5">
                        {contactItems.map((item, i) => (
                            <span
                                key={i}
                                className="
                                    flex
                                    items-center
                                    gap-1.5
                                    min-w-0
                                    max-w-full
                                    break-words
                                "
                                style={{
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {i > 0 && (
                                    <span className="text-slate-300 shrink-0">
                                        ·
                                    </span>
                                )}

                                {item.href ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
                                            hover:underline
                                            hover:text-slate-800
                                            min-w-0
                                            break-all
                                        "
                                    >
                                        {item.text}
                                    </a>
                                ) : (
                                    <span className="min-w-0 break-words">
                                        {item.text}
                                    </span>
                                )}
                            </span>
                        ))}
                    </p>
                )}
            </header>

            {/* ================= SUMMARY ================= */}
            {personal.summary && (
                <Section
                    title="Summary"
                    themeColor={themeColor}
                >
                    <p
                        className="
                            text-slate-700
                            whitespace-pre-line
                            break-words
                            min-w-0
                        "
                        style={{
                            overflowWrap: 'anywhere',
                        }}
                    >
                        {personal.summary}
                    </p>
                </Section>
            )}

            {/* ================= EXPERIENCE ================= */}
            {experience.length > 0 && (
                <Section
                    title="Experience"
                    themeColor={themeColor}
                >
                    <div className="space-y-4">
                        {experience.map((item) => (
                            <div
                                key={item.id}
                                className="min-w-0"
                            >
                                {/* Role + Date */}
                                <div
                                    className="
                                        flex
                                        items-baseline
                                        justify-between
                                        gap-3
                                        min-w-0
                                    "
                                >
                                    <span
                                        className="
                                            font-semibold
                                            text-slate-900
                                            min-w-0
                                            break-words
                                        "
                                        style={{
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {item.role || 'Untitled role'}
                                    </span>

                                    <span
                                        className="
                                            text-[12px]
                                            text-slate-500
                                            shrink-0
                                        "
                                    >
                                        {formatMonthYear(item.startDate)}
                                        {' — '}
                                        {item.current
                                            ? 'Present'
                                            : formatMonthYear(item.endDate)}
                                    </span>
                                </div>

                                {/* Company + Location */}
                                <div
                                    className="
                                        text-[12px]
                                        text-slate-500
                                        italic
                                        min-w-0
                                        break-words
                                    "
                                    style={{
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    {[item.company, item.location]
                                        .filter(Boolean)
                                        .join(', ')}
                                </div>

                                {/* Description */}
                                {item.description && (
                                    <p
                                        className="
                                            mt-1
                                            text-slate-700
                                            whitespace-pre-line
                                            break-words
                                            min-w-0
                                        "
                                        style={{
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ================= EDUCATION ================= */}
            {education.length > 0 && (
                <Section
                    title="Education"
                    themeColor={themeColor}
                >
                    <div className="space-y-4">
                        {education.map((item) => (
                            <div
                                key={item.id}
                                className="min-w-0"
                            >
                                {/* Degree + Date */}
                                <div
                                    className="
                                        flex
                                        items-baseline
                                        justify-between
                                        gap-3
                                        min-w-0
                                    "
                                >
                                    <span
                                        className="
                                            font-semibold
                                            text-slate-900
                                            min-w-0
                                            break-words
                                        "
                                        style={{
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {item.degree || 'Untitled degree'}
                                    </span>

                                    <span
                                        className="
                                            text-[12px]
                                            text-slate-500
                                            shrink-0
                                        "
                                    >
                                        {formatMonthYear(item.startDate)}
                                        {' — '}
                                        {formatMonthYear(item.endDate)}
                                    </span>
                                </div>

                                {/* School + Location */}
                                <div
                                    className="
                                        text-[12px]
                                        text-slate-500
                                        italic
                                        min-w-0
                                        break-words
                                    "
                                    style={{
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    {[item.school, item.location]
                                        .filter(Boolean)
                                        .join(', ')}
                                </div>

                                {/* Description */}
                                {item.description && (
                                    <p
                                        className="
                                            mt-1
                                            text-slate-700
                                            whitespace-pre-line
                                            break-words
                                            min-w-0
                                        "
                                        style={{
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ================= PROJECTS ================= */}
            {projects.length > 0 && (
                <Section
                    title="Projects"
                    themeColor={themeColor}
                >
                    <div className="space-y-4">
                        {projects.map((item) => (
                            <div
                                key={item.id}
                                className="min-w-0"
                            >
                                {/* Project Name + Link */}
                                <div
                                    className="
                                        flex
                                        items-baseline
                                        justify-between
                                        gap-3
                                        min-w-0
                                    "
                                >
                                    <span
                                        className="
                                            font-semibold
                                            text-slate-900
                                            min-w-0
                                            break-words
                                        "
                                        style={{
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {item.name || 'Untitled project'}
                                    </span>

                                    {item.link && (
                                        <a
                                            href={normalizeUrl(item.link)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="
                                                text-[12px]
                                                text-slate-500
                                                shrink
                                                min-w-0
                                                break-all
                                                hover:underline
                                                hover:text-slate-800
                                            "
                                        >
                                            {item.link}
                                        </a>
                                    )}
                                </div>

                                {/* Tech Stack */}
                                {item.techStack && (
                                    <div
                                        className="
                                            text-[12px]
                                            text-slate-500
                                            italic
                                            min-w-0
                                            break-words
                                        "
                                        style={{
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {item.techStack}
                                    </div>
                                )}

                                {/* Project Description */}
                                {item.description && (
                                    <p
                                        className="
                                            mt-1
                                            text-slate-700
                                            whitespace-pre-line
                                            break-words
                                            min-w-0
                                        "
                                        style={{
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ================= SKILLS ================= */}
            {skills.length > 0 && (
                <Section
                    title="Skills"
                    themeColor={themeColor}
                >
                    <div className="space-y-1.5">
                        {skills.map((group) => (
                            <div
                                key={group.id}
                                className="
                                    flex
                                    gap-2
                                    min-w-0
                                "
                            >
                                {group.category && (
                                    <span
                                        className="
                                            font-semibold
                                            text-slate-900
                                            shrink-0
                                        "
                                    >
                                        {group.category}:
                                    </span>
                                )}

                                <span
                                    className="
                                        text-slate-700
                                        min-w-0
                                        break-words
                                    "
                                    style={{
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    {group.items.join(', ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}


/* ================= SECTION COMPONENT ================= */

function Section({
    title,
    themeColor,
    children,
}) {
    return (
        <section className="mb-5 min-w-0">
            <h2
                className="
                    text-[12px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-900
                    pb-1
                    mb-2.5
                    border-b
                "
                style={{
                    borderColor: themeColor,
                }}
            >
                {title}
            </h2>

            {children}
        </section>
    );
}