import ClassicTemplate from '../templates/ClassicTemplate';
import ModernTemplate from '../templates/ModernTemplate';
import MinimalTemplate from '../templates/MinimalTemplate';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const TEMPLATE_COMPONENTS = {
    classic: ClassicTemplate,
    modern: ModernTemplate,
    minimal: MinimalTemplate,
};

/**
 * The live A4 preview canvas. Renders the resume's content through
 * whichever template component matches `templateId`, at a fixed true-to-
 * size A4 pixel footprint (794×1123, ~96dpi), then scales the whole thing
 * down visually via CSS transform so it fits smaller preview panes without
 * the template itself ever re-rendering at a different size.
 *
 * id="resume-print-canvas" is load-bearing: the print/export CSS in
 * index.css scopes @media print rules to this exact id to hide everything
 * else on the page and force the true un-scaled 794px width. Don't rename
 * without updating that stylesheet.
 *
 * PRINT FIX: the outer wrapper below is intentionally sized in on-screen
 * pixels (A4_WIDTH * scale) with overflow-hidden, so the preview reads as
 * a shrunk thumbnail. That's correct on screen, but at print time the
 * index.css rules reset #resume-print-canvas back to its true 794px width
 * — if this outer wrapper stays clamped to the *scaled* width during
 * print, it clips the right edge of every line, which is what makes
 * summary/description text look like it "never wraps" on the exported
 * page (the wrap is happening, the far side is just being cut off). The
 * print:!w-auto / print:!h-auto / print:overflow-visible classes undo the
 * clamp specifically during print, and `className` is now actually wired
 * up so callers (see ResumeStudioPage's print:!scale-100) can apply their
 * own print overrides too — previously the prop was accepted but silently
 * dropped.
 *
 * @param {{
 *   resume: import('../../utils/resumeModel').ResumeDocument,
 *   scale?: number,
 *   className?: string,
 * }} props
 */
export default function ResumeCanvas({ resume, scale = 1, className = '' }) {
    const TemplateComponent = TEMPLATE_COMPONENTS[resume.templateId] ?? ClassicTemplate;

    return (
        <div
            className={`overflow-hidden print:overflow-visible print:!w-auto print:!h-auto ${className}`}
            style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}
        >
            <div
                id="resume-print-canvas"
                className={`shadow-lg origin-top-left ${className}`}
                style={{
                    width: A4_WIDTH,
                    height: A4_HEIGHT,
                    transform: `scale(${scale})`,
                    overflowWrap: 'anywhere',
                    wordBreak: 'normal',
                    whiteSpace: 'normal',
                }}
            >
                <TemplateComponent
                    content={resume.content}
                    themeColor={resume.themeColor}
                />
            </div>
        </div>
    );
}