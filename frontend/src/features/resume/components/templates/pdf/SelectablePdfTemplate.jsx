import { Document, Page, Text, View, Link, StyleSheet } from '@react-pdf/renderer';

function formatMonthYear(value) {
    if (!value) return '';
    const [year, month] = value.split('-');
    if (!year || !month) return value;
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getLinkLabel(link) {
    if (!link) return '';
    return typeof link === 'object' ? (link.label ?? '') : link;
}

function getLinkUrl(link) {
    if (!link) return '';
    return typeof link === 'object' ? (link.url ?? '') : link;
}

function normalizeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const createStyles = (themeColor = '#4F46E5') =>
    StyleSheet.create({
        page: {
            padding: 36,
            fontSize: 9.5,
            fontFamily: 'Helvetica',
            color: '#1e293b',
            lineHeight: 1.4,
        },
        header: {
            textAlign: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottomWidth: 1.5,
            borderBottomColor: themeColor,
        },
        fullName: {
            fontSize: 22,
            fontFamily: 'Helvetica-Bold',
            color: '#0f172a',
            lineHeight: 1.3,
            marginBottom: 8,
            textAlign: 'center',
        },
        contactRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 6,
            rowGap: 4,
            columnGap: 4,
        },
        contactItemContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        contactText: {
            fontSize: 9,
            color: '#475569',
            fontFamily: 'Helvetica',
        },
        bullet: {
            fontSize: 9,
            color: '#94a3b8',
            marginHorizontal: 4,
        },
        contactLink: {
            fontSize: 9,
            color: themeColor || '#2563eb',
            textDecoration: 'none',
            fontFamily: 'Helvetica-Bold',
        },
        section: {
            marginBottom: 10,
        },
        sectionTitle: {
            fontSize: 10.5,
            fontFamily: 'Helvetica-Bold',
            color: '#0f172a',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            paddingBottom: 2,
            marginBottom: 6,
            borderBottomWidth: 1,
            borderBottomColor: themeColor,
        },
        itemHeaderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 1,
        },
        itemTitle: {
            fontSize: 9.5,
            fontFamily: 'Helvetica-Bold',
            color: '#0f172a',
            flex: 1,
        },
        itemDates: {
            fontSize: 8.5,
            color: '#64748b',
        },
        itemSub: {
            fontSize: 8.5,
            fontFamily: 'Helvetica-Oblique',
            color: '#475569',
            marginBottom: 2,
        },
        description: {
            fontSize: 9,
            color: '#334155',
            marginTop: 2,
            marginBottom: 4,
            lineHeight: 1.35,
        },
        skillRow: {
            flexDirection: 'row',
            marginBottom: 3,
            fontSize: 9,
        },
        skillCategory: {
            fontFamily: 'Helvetica-Bold',
            color: '#0f172a',
            marginRight: 4,
        },
        skillItems: {
            color: '#334155',
            flex: 1,
        },
    });

export const ResumePdfDocument = ({ resume }) => {
    const content = resume?.content || {};
    const themeColor = resume?.themeColor || '#4F46E5';
    const styles = createStyles(themeColor);

    const personal = content.personal || {};
    const experience = content.experience || [];
    const education = content.education || [];
    const projects = content.projects || [];
    const skills = content.skills || [];

    const contactItems = [
        personal.location ? { text: personal.location } : null,
        personal.email ? { text: personal.email, href: `mailto:${personal.email}` } : null,
        personal.phone ? { text: personal.phone, href: `tel:${personal.phone.replace(/[^\d+]/g, '')}` } : null,
        getLinkLabel(personal.linkedin) ? { text: getLinkLabel(personal.linkedin), href: normalizeUrl(getLinkUrl(personal.linkedin)) } : null,
        getLinkLabel(personal.github) ? { text: getLinkLabel(personal.github), href: normalizeUrl(getLinkUrl(personal.github)) } : null,
        getLinkLabel(personal.portfolio) ? { text: getLinkLabel(personal.portfolio), href: normalizeUrl(getLinkUrl(personal.portfolio)) } : null,
    ].filter(Boolean);

    return (
        <Document title={resume?.title || 'Resume'}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.fullName}>{personal.fullName || 'Your Name'}</Text>
                    {contactItems.length > 0 && (
                        <View style={styles.contactRow}>
                            {contactItems.map((item, idx) => (
                                <View key={idx} style={styles.contactItemContainer}>
                                    {idx > 0 && <Text style={styles.bullet}>·</Text>}
                                    {item.href ? (
                                        <Link src={item.href} style={styles.contactLink}>
                                            {item.text}
                                        </Link>
                                    ) : (
                                        <Text style={styles.contactText}>{item.text}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Summary */}
                {personal.summary ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Summary</Text>
                        <Text style={styles.description}>{personal.summary}</Text>
                    </View>
                ) : null}

                {/* Education */}
                {education.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {education.map((item, idx) => {
                            const dateStr = [
                                formatMonthYear(item.startDate),
                                formatMonthYear(item.endDate),
                            ].filter(Boolean).join(' — ');

                            const subStr = [item.school, item.location].filter(Boolean).join(', ');

                            return (
                                <View key={item.id || idx} style={{ marginBottom: 6 }} wrap={false}>
                                    <View style={styles.itemHeaderRow}>
                                        <Text style={styles.itemTitle}>{item.degree || 'Untitled Degree'}</Text>
                                        {dateStr ? <Text style={styles.itemDates}>{dateStr}</Text> : null}
                                    </View>
                                    {subStr ? <Text style={styles.itemSub}>{subStr}</Text> : null}
                                    {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                                </View>
                            );
                        })}
                    </View>
                ) : null}

                {/* Work Experience */}
                {experience.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Experience</Text>
                        {experience.map((item, idx) => {
                            const dateStr = [
                                formatMonthYear(item.startDate),
                                item.current ? 'Present' : formatMonthYear(item.endDate),
                            ].filter(Boolean).join(' — ');

                            const subStr = [item.company, item.location].filter(Boolean).join(', ');

                            return (
                                <View key={item.id || idx} style={{ marginBottom: 6 }} wrap={false}>
                                    <View style={styles.itemHeaderRow}>
                                        <Text style={styles.itemTitle}>{item.role || 'Untitled Role'}</Text>
                                        {dateStr ? <Text style={styles.itemDates}>{dateStr}</Text> : null}
                                    </View>
                                    {subStr ? <Text style={styles.itemSub}>{subStr}</Text> : null}
                                    {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                                </View>
                            );
                        })}
                    </View>
                ) : null}

                {/* Projects */}
                {projects.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Projects</Text>
                        {projects.map((item, idx) => (
                            <View key={item.id || idx} style={{ marginBottom: 6 }} wrap={false}>
                                <View style={styles.itemHeaderRow}>
                                    <Text style={styles.itemTitle}>{item.name || 'Untitled Project'}</Text>
                                    {item.link ? (
                                        <Link src={normalizeUrl(item.link)} style={[styles.itemDates, styles.contactLink]}>
                                            {item.link}
                                        </Link>
                                    ) : null}
                                </View>
                                {item.techStack ? <Text style={styles.itemSub}>{item.techStack}</Text> : null}
                                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                            </View>
                        ))}
                    </View>
                ) : null}

                {/* Skills */}
                {skills.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Skills</Text>
                        {skills.map((group, idx) => (
                            <View key={group.id || idx} style={styles.skillRow}>
                                {group.category ? <Text style={styles.skillCategory}>{group.category}:</Text> : null}
                                <Text style={styles.skillItems}>
                                    {Array.isArray(group.items) ? group.items.join(', ') : group.items || ''}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </Page>
        </Document>
    );
};

export default ResumePdfDocument;