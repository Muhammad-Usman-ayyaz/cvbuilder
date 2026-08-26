import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ResumePdfDocument } from '../components/templates/pdf/SelectablePdfTemplate';

/**
 * Generates and downloads a 100% vector, ATS-friendly PDF document
 * directly into the browser's download folder.
 *
 * @param {import('./resumeModel').ResumeDocument} resume
 */
export async function exportResumeAsPdf(resume) {
    if (!resume) return;

    try {
        const doc = React.createElement(ResumePdfDocument, { resume });
        const blob = await pdf(doc).toBlob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Clean filename (e.g., "John_Doe_Resume.pdf" or "Untitled_Resume.pdf")
        const fileName = (resume.title || 'Resume')
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';

        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
