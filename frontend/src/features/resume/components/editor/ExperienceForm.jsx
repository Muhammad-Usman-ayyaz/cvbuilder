import Input from '../../../../components/common/Input';
import TextArea from '../../../../components/common/TextArea';
import Button from '../../../../components/common/Button';
import ArrayItemShell from './ArrayItemShell';
import { createEmptyExperience } from '../../utils/resumeModel';

/**
 * Work experience section — a reorderable, addable/removable list of
 * ExperienceItem entries. Fully controlled: `value` is the full array,
 * `onChange` receives the next full array on every mutation.
 *
 * @param {{
 *   value: import('../../utils/resumeModel').ExperienceItem[],
 *   onChange: (next: import('../../utils/resumeModel').ExperienceItem[]) => void,
 * }} props
 */
export default function ExperienceForm({ value, onChange }) {
    const updateItem = (id, patch) => {
        onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const addItem = () => {
        onChange([...value, createEmptyExperience()]);
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
                    No experience added yet. Add your most recent role first.
                </p>
            )}

            {value.map((item, index) => (
                <ArrayItemShell
                    key={item.id}
                    title={item.role || 'Untitled role'}
                    subtitle={item.company}
                    defaultOpen={value.length <= 2}
                    isFirst={index === 0}
                    isLast={index === value.length - 1}
                    onMoveUp={() => moveItem(index, -1)}
                    onMoveDown={() => moveItem(index, 1)}
                    onRemove={() => removeItem(item.id)}
                    removeLabel="Remove this role"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id={`exp-role-${item.id}`}
                            label="Job Title"
                            placeholder="Senior Software Engineer"
                            value={item.role}
                            onChange={(e) => updateItem(item.id, { role: e.target.value })}
                            required
                        />
                        <Input
                            id={`exp-company-${item.id}`}
                            label="Company"
                            placeholder="Acme Inc."
                            value={item.company}
                            onChange={(e) => updateItem(item.id, { company: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        id={`exp-location-${item.id}`}
                        label="Location"
                        placeholder="San Francisco, CA (or Remote)"
                        value={item.location}
                        onChange={(e) => updateItem(item.id, { location: e.target.value })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id={`exp-start-${item.id}`}
                            type="month"
                            label="Start Date"
                            value={item.startDate}
                            onChange={(e) => updateItem(item.id, { startDate: e.target.value })}
                        />
                        <div>
                            <Input
                                id={`exp-end-${item.id}`}
                                type="month"
                                label="End Date"
                                value={item.endDate}
                                onChange={(e) => updateItem(item.id, { endDate: e.target.value })}
                                disabled={item.current}
                                helpText={item.current ? 'Marked as current role' : undefined}
                            />
                            <label className="mt-2 flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={item.current}
                                    onChange={(e) =>
                                        updateItem(item.id, {
                                            current: e.target.checked,
                                            endDate: e.target.checked ? '' : item.endDate,
                                        })
                                    }
                                    className="rounded border-border text-primary focus:ring-primary/30"
                                />
                                I currently work here
                            </label>
                        </div>
                    </div>

                    <TextArea
                        id={`exp-description-${item.id}`}
                        label="Description"
                        placeholder="Use short bullet-style lines. Start with an action verb, include a measurable result where you can."
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        rows={4}
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
                Add Experience
            </Button>
        </div>
    );
}