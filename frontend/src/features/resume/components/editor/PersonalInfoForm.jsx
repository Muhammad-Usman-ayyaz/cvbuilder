import Input from '../../../../components/common/Input';
import TextArea from '../../../../components/common/TextArea';

/**
 * Personal info section of the resume editor — name, contact details, and
 * summary. Fully controlled: renders `value` and calls `onChange` with the
 * next personal object on every keystroke, so the parent (ResumeStudioPage)
 * stays the single source of truth for resume state.
 *
 * LinkedIn/GitHub/Portfolio are `{ label, url }` objects (not plain
 * strings) so the person can control what text shows on the resume
 * ("LinkedIn", or anything else) separately from the actual link target.
 * Only `label` renders on the resume/PDF; `url` is what the link points
 * to and is never shown as visible text.
 *
 * @param {{
 *   value: import('../../utils/resumeModel').PersonalInfo,
 *   onChange: (next: import('../../utils/resumeModel').PersonalInfo) => void,
 * }} props
 */

// One config entry per link field: which key it lives under, its default
// display label, and the URL placeholder shown in the input.
const LINK_FIELDS = [
    { key: 'linkedin', defaultLabel: 'LinkedIn', urlPlaceholder: 'linkedin.com/in/alexmorgan' },
    { key: 'github', defaultLabel: 'GitHub', urlPlaceholder: 'github.com/alexmorgan' },
    { key: 'portfolio', defaultLabel: 'Portfolio', urlPlaceholder: 'alexmorgan.dev' },
];

// Older saved resumes may still have linkedin/github/portfolio as plain
// strings rather than { label, url } objects. Normalizing on read means
// this form (and anything spreading `value`) never crashes on old data —
// it just treats the old string as the url and fills in a sensible
// default label.
function normalizeLink(raw, defaultLabel) {
    if (raw && typeof raw === 'object') {
        return { label: raw.label ?? defaultLabel, url: raw.url ?? '' };
    }
    return { label: defaultLabel, url: raw ?? '' };
}

export default function PersonalInfoForm({ value, onChange }) {
    const handleField = (field) => (e) => {
        onChange({ ...value, [field]: e.target.value });
    };

    const handleLinkField = (field, key) => (e) => {
        const current = normalizeLink(value[field], LINK_FIELDS.find((f) => f.key === field)?.defaultLabel);
        onChange({ ...value, [field]: { ...current, [key]: e.target.value } });
    };

    return (
        <div className="space-y-4">
            <Input
                id="personal-fullName"
                label="Full Name"
                placeholder="Alex Morgan"
                value={value.fullName}
                onChange={handleField('fullName')}
                required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    id="personal-email"
                    type="email"
                    label="Email"
                    placeholder="alex.morgan@email.com"
                    value={value.email}
                    onChange={handleField('email')}
                    required
                />
                <Input
                    id="personal-phone"
                    type="tel"
                    label="Phone"
                    placeholder="+1 (555) 123-4567"
                    value={value.phone}
                    onChange={handleField('phone')}
                />
            </div>

            <Input
                id="personal-location"
                label="Location"
                placeholder="San Francisco, CA"
                value={value.location}
                onChange={handleField('location')}
            />

            {/* Links — each is a title/url pair. Title is what shows on the
                resume and PDF; URL is only ever used as the link target. */}
            <div className="space-y-3">
                {LINK_FIELDS.map(({ key, defaultLabel, urlPlaceholder }) => {
                    const link = normalizeLink(value[key], defaultLabel);
                    return (
                        <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-bg-main">
                            <Input
                                id={`personal-${key}-label`}
                                label={`${defaultLabel} title`}
                                placeholder={defaultLabel}
                                value={link.label}
                                onChange={handleLinkField(key, 'label')}
                                helpText="Shown on the resume, e.g. “LinkedIn” or “My Site”."
                            />
                            <Input
                                id={`personal-${key}-url`}
                                label={`${defaultLabel} URL`}
                                placeholder={urlPlaceholder}
                                value={link.url}
                                onChange={handleLinkField(key, 'url')}
                                helpText="Where the link goes. Never shown as text."
                            />
                        </div>
                    );
                })}
            </div>

            <TextArea
                id="personal-summary"
                label="Professional Summary"
                placeholder="A short pitch — who you are, what you're great at, and what you're looking for next."
                value={value.summary}
                onChange={handleField('summary')}
                rows={4}
                maxLength={500}
                helpText="2–4 sentences. This is usually the first thing a recruiter reads."
            />
        </div>
    );
}