import Input from '../../../../components/common/Input';
import TextArea from '../../../../components/common/TextArea';
import Button from '../../../../components/common/Button';
import ArrayItemShell from './ArrayItemShell';
import { createEmptyEducation } from '../../utils/resumeModel';

/**
 * Education section — a reorderable, addable/removable list of
 * EducationItem entries. Same controlled-array pattern as ExperienceForm.
 *
 * @param {{
 *   value: import('../../utils/resumeModel').EducationItem[],
 *   onChange: (next: import('../../utils/resumeModel').EducationItem[]) => void,
 * }} props
 */
export default function EducationForm({ value, onChange }) {
    const updateItem = (id, patch) => {
        onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const addItem = () => {
        onChange([...value, createEmptyEducation()]);
    };

    const removeItem = (id) => {
        onChange(value.filter((item) => item.id !== id));
    };

    const moveItem = (index, direction) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= value.length) return;
        const next = [...value];
        [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-4">
            {value.length === 0 && (
                <p className="text-sm text-text-secondary py-6 text-center border border-dashed border-border rounded-lg">
                    No education added yet.
                </p>
            )}

            {value.map((item, index) => (
                <ArrayItemShell
                    key={item.id}
                    title={item.degree || 'Untitled degree'}
                    subtitle={item.school}
                    defaultOpen={value.length <= 2}
                    isFirst={index === 0}
                    isLast={index === value.length - 1}
                    onMoveUp={() => moveItem(index, -1)}
                    onMoveDown={() => moveItem(index, 1)}
                    onRemove={() => removeItem(item.id)}
                    removeLabel="Remove this education entry"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id={`edu-degree-${item.id}`}
                            label="Degree"
                            placeholder="B.S. in Computer Science"
                            value={item.degree}
                            onChange={(e) => updateItem(item.id, { degree: e.target.value })}
                            required
                        />
                        <Input
                            id={`edu-school-${item.id}`}
                            label="School"
                            placeholder="University of California, Berkeley"
                            value={item.school}
                            onChange={(e) => updateItem(item.id, { school: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        id={`edu-location-${item.id}`}
                        label="Location"
                        placeholder="Berkeley, CA"
                        value={item.location}
                        onChange={(e) => updateItem(item.id, { location: e.target.value })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id={`edu-start-${item.id}`}
                            type="month"
                            label="Start Date"
                            value={item.startDate}
                            onChange={(e) => updateItem(item.id, { startDate: e.target.value })}
                        />
                        <Input
                            id={`edu-end-${item.id}`}
                            type="month"
                            label="End Date"
                            placeholder="Or expected date"
                            value={item.endDate}
                            onChange={(e) => updateItem(item.id, { endDate: e.target.value })}
                        />
                    </div>

                    <TextArea
                        id={`edu-description-${item.id}`}
                        label="Description"
                        placeholder="Relevant coursework, honors, GPA (optional), activities."
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        rows={3}
                        enableDictation
                    />
                </ArrayItemShell>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            >
                Add Education
            </Button>
        </div>
    );
}