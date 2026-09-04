import Input from '../../../../components/common/Input';
import Button from '../../../../components/common/Button';
import ArrayItemShell from './ArrayItemShell';
import { createEmptyCertification } from '../../utils/resumeModel';

/**
 * Certifications section — same controlled-array pattern as EducationForm/
 * ExperienceForm/ProjectsForm. Not wired into EditorTabs (Resume Studio)
 * yet since that's a separate, deliberately out-of-scope UI change — this
 * form is used by the CV-upload review screen (ReviewImportedCv.jsx) so
 * certifications extracted from an uploaded CV have somewhere to be
 * reviewed/edited. The data itself still round-trips fine through
 * content.certifications either way (see resumeModel.js).
 *
 * @param {{
 *   value: import('../../utils/resumeModel').CertificationItem[],
 *   onChange: (next: import('../../utils/resumeModel').CertificationItem[]) => void,
 * }} props
 */
export default function CertificationsForm({ value, onChange }) {
    const items = value || [];

    const updateItem = (id, patch) => {
        onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const addItem = () => {
        onChange([...items, createEmptyCertification()]);
    };

    const removeItem = (id) => {
        onChange(items.filter((item) => item.id !== id));
    };

    const moveItem = (index, direction) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= items.length) return;
        const next = [...items];
        [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-4">
            {items.length === 0 && (
                <p className="text-sm text-text-secondary py-6 text-center border border-dashed border-border rounded-lg">
                    No certifications added yet.
                </p>
            )}

            {items.map((item, index) => (
                <ArrayItemShell
                    key={item.id}
                    title={item.name || 'Untitled certification'}
                    subtitle={item.issuer}
                    defaultOpen={items.length <= 2}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    onMoveUp={() => moveItem(index, -1)}
                    onMoveDown={() => moveItem(index, 1)}
                    onRemove={() => removeItem(item.id)}
                    removeLabel="Remove this certification"
                >
                    <Input
                        id={`cert-name-${item.id}`}
                        label="Certification Name"
                        placeholder="AWS Certified Solutions Architect"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id={`cert-issuer-${item.id}`}
                            label="Issuer"
                            placeholder="Amazon Web Services"
                            value={item.issuer}
                            onChange={(e) => updateItem(item.id, { issuer: e.target.value })}
                        />
                        <Input
                            id={`cert-date-${item.id}`}
                            type="month"
                            label="Date"
                            value={item.date}
                            onChange={(e) => updateItem(item.id, { date: e.target.value })}
                        />
                    </div>
                </ArrayItemShell>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            >
                Add Certification
            </Button>
        </div>
    );
}
