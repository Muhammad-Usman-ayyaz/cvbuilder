import Input from '../../../../components/common/Input';
import TextArea from '../../../../components/common/TextArea';
import Button from '../../../../components/common/Button';
import ArrayItemShell from './ArrayItemShell';
import { createEmptyProject } from '../../utils/resumeModel';

/**
 * Projects section — a reorderable, addable/removable list of ProjectItem
 * entries. Fully controlled: `value` is the full array, `onChange` receives
 * the next full array on every mutation.
 *
 * @param {{
 *   value: import('../../utils/resumeModel').ProjectItem[],
 *   onChange: (next: import('../../utils/resumeModel').ProjectItem[]) => void,
 * }} props
 */
export default function ProjectsForm({ value, onChange }) {
    const updateItem = (id, patch) => {
        onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const addItem = () => {
        onChange([...value, createEmptyProject()]);
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
                    No projects added yet. Showcase work that demonstrates your skills.
                </p>
            )}

            {value.map((item, index) => (
                <ArrayItemShell
                    key={item.id}
                    title={item.name || 'Untitled project'}
                    subtitle={item.techStack}
                    defaultOpen={value.length <= 2}
                    isFirst={index === 0}
                    isLast={index === value.length - 1}
                    onMoveUp={() => moveItem(index, -1)}
                    onMoveDown={() => moveItem(index, 1)}
                    onRemove={() => removeItem(item.id)}
                    removeLabel="Remove this project"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id={`proj-name-${item.id}`}
                            label="Project Name"
                            placeholder="Resume Builder"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            required
                        />
                        <Input
                            id={`proj-techstack-${item.id}`}
                            label="Tech Stack"
                            placeholder="React, Node.js, PostgreSQL"
                            value={item.techStack}
                            onChange={(e) => updateItem(item.id, { techStack: e.target.value })}
                        />
                    </div>

                    <Input
                        id={`proj-link-${item.id}`}
                        type="url"
                        label="Link"
                        placeholder="github.com/you/project or live URL"
                        value={item.link}
                        onChange={(e) => updateItem(item.id, { link: e.target.value })}
                    />

                    <TextArea
                        id={`proj-description-${item.id}`}
                        label="Description"
                        placeholder="What it does, your role, and any notable results or metrics."
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        rows={4}
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
                Add Project
            </Button>
        </div>
    );
}