import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    section: { marginBottom: 10 },
    header: { fontSize: 18, marginBottom: 5, fontWeight: 'bold' },
    title: { fontSize: 12, fontWeight: 'bold' },
    text: { marginBottom: 3, color: '#333333' }
});

export const ResumePdfDocument = ({ resumeData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.section}>
                <Text style={styles.header}>{resumeData?.personalInfo?.fullName || 'Your Name'}</Text>
                <Text style={styles.text}>{resumeData?.personalInfo?.email} | {resumeData?.personalInfo?.phone}</Text>
            </View>

            {/* Experience */}
            {resumeData?.experience?.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.title}>WORK EXPERIENCE</Text>
                    {resumeData.experience.map((exp, idx) => (
                        <View key={idx} style={{ marginTop: 5 }}>
                            <Text style={{ fontWeight: 'bold' }}>{exp.role} - {exp.company}</Text>
                            <Text style={styles.text}>{exp.description}</Text>
                        </View>
                    ))}
                </View>
            )}
        </Page>
    </Document>
);