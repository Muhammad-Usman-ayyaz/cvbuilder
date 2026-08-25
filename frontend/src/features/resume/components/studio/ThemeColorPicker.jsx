import { THEME_COLORS } from '../../utils/templateMeta';

/**
 * Row of preset color swatches plus a native color input for custom hex
 * values. Fully controlled: `value` is the current hex color, `onChange`
 * fires with the newly selected hex string.
 *
 * @param {{
 *   value: string,
 *   onChange: (nextHex: string) => void,
 * }} props
 */
export default function ThemeColorPicker({ value, onChange }) {
    const isCustom = !THEME_COLORS.some((c) => c.value.toLowerCase() === value?.toLowerCase());

    return (
        <div className="flex flex-wrap items-center gap-2">
            {THEME_COLORS.map((color) => {
                const isActive = color.value.toLowerCase() === value?.toLowerCase();
                return (
                    <button
                        key={color.value}
                        type="button"
                        onClick={() => onChange(color.value)}
                        aria-label={color.label}
                        aria-pressed={isActive}
                        title={color.label}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${isActive ? 'ring-2 ring-offset-2 ring-primary scale-105' : 'hover:scale-105'
                            }`}
                        style={{ backgroundColor: color.value }}
                    >
                        {isActive && (
                            <span className="material-symbols-outlined text-[14px] text-white">check</span>
                        )}
                    </button>
                );
            })}

            <label
                className={`relative w-7 h-7 rounded-full overflow-hidden cursor-pointer flex items-center justify-center border border-border ${isCustom ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                title="Custom color"
                style={isCustom ? { backgroundColor: value } : undefined}
            >
                {!isCustom && (
                    <span className="material-symbols-outlined text-[16px] text-text-secondary">palette</span>
                )}
                <input
                    type="color"
                    value={value || '#4F46E5'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Custom theme color"
                />
            </label>
        </div>
    );
}