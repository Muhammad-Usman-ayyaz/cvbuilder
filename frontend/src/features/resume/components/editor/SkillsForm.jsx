import { useState } from 'react';
import Input from '../../../../components/common/Input';
import Button from '../../../../components/common/Button';
import ArrayItemShell from './ArrayItemShell';
import { createEmptySkillGroup } from '../../utils/resumeModel';

/**
 * Skills section — a reorderable, addable/removable list of SkillGroup
 * entries (a category + a tag list of individual skills). Fully controlled:
 * `value` is the full array, `onChange` receives the next full array on
 * every mutation.
 *
 * @param {{
 *   value: import('../../utils/resumeModel').SkillGroup[],
 *   onChange: (next: import('../../utils/resumeModel').SkillGroup[]) => void,
 * }} props
 */
export default function SkillsForm({ value, onChange }) {
    const updateItem = (id, patch) => {
        onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const addItem = () => {
        onChange([...value, createEmptySkillGroup()]);
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
                    No skill groups yet. Group related skills together, e.g. "Languages" or "Tools".
                </p>
            )}

            {value.map((item, index) => (
                <ArrayItemShell
                    key={item.id}
                    title={item.category || 'Untitled group'}
                    subtitle={
                        item.items.length ? `${item.items.length} skill${item.items.length === 1 ? '' : 's'}` : undefined
                    }
                    defaultOpen={value.length <= 2}
                    isFirst={index === 0}
                    isLast={index === value.length - 1}
                    onMoveUp={() => moveItem(index, -1)}
                    onMoveDown={() => moveItem(index, 1)}
                    onRemove={() => removeItem(item.id)}
                    removeLabel="Remove this skill group"
                >
                    <Input
                        id={`skill-category-${item.id}`}
                        label="Category"
                        placeholder="Languages, Frameworks, Tools..."
                        value={item.category}
                        onChange={(e) => updateItem(item.id, { category: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">Skills</label>
                        <SkillItemsEditor
                            groupId={item.id}
                            items={item.items}
                            onChange={(nextItems) => updateItem(item.id, { items: nextItems })}
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
                Add Skill Group
            </Button>
        </div>
    );
}

/**
 * Chip-style editor for a single SkillGroup's `items` string array. Type a
 * skill and press Enter or comma to add it as a chip; click a chip's × (or
 * press Backspace on an empty input) to remove it. Local to SkillsForm —
 * not shared elsewhere, so it isn't a separate exported component.
 *
 * @param {{ groupId: string, items: string[], onChange: (next: string[]) => void }} props
 */
function SkillItemsEditor({ groupId, items, onChange }) {
    const [draft, setDraft] = useState('');

    const commitDraft = () => {
        const trimmed = draft.trim();
        if (!trimmed) return;
        if (!items.includes(trimmed)) {
            onChange([...items, trimmed]);
        }
        setDraft('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commitDraft();
        } else if (e.key === 'Backspace' && draft === '' && items.length > 0) {
            onChange(items.slice(0, -1));
        }
    };

    const removeItem = (index) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div>
            {items.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {items.map((skill, index) => (
                        <span
                            key={`${skill}-${index}`}
                            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-soft-primary text-primary text-xs font-medium"
                        >
                            {skill}
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                aria-label={`Remove ${skill}`}
                                className="p-0.5 rounded-full hover:bg-primary/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <Input
                id={`skill-items-input-${groupId}`}
                placeholder="Type a skill and press Enter..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitDraft}
            />
        </div>
    );
}