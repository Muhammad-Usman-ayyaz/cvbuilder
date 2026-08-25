/**
 * Static metadata describing the available resume templates and accent
 * color presets. Used by the template picker (create-resume modal), the
 * template switcher (studio header), and the theme color picker.
 */

/**
 * @typedef {Object} TemplateMeta
 * @property {'classic'|'modern'|'minimal'} id
 * @property {string} name
 * @property {string} description
 * @property {string} icon   Material Symbols icon name
 * @property {string} thumbnailUrl
 * @property {string} largeImageUrl
 */
/** @type {TemplateMeta[]} */
export const TEMPLATES = [
    {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional single-column layout. Safe, ATS-friendly, works everywhere.',
        icon: 'article',
        thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=150&q=80',
        largeImageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
    },
    {
        id: 'modern',
        name: 'Modern',
        description: 'Bold header with a sidebar for skills and contact details.',
        icon: 'view_sidebar',
        thumbnailUrl: 'https://images.unsplash.com/photo-1622675363311-3e1904dc1885?w=150&q=80',
        largeImageUrl: 'https://images.unsplash.com/photo-1622675363311-3e1904dc1885?w=800&q=80',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Lots of whitespace, understated type. Best for design-forward roles.',
        icon: 'crop_free',
        thumbnailUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=150&q=80',
        largeImageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
    },
];

/**
 * @param {string} id
 * @returns {TemplateMeta}
 */
export function getTemplateMeta(id) {
    return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

/**
 * Curated accent color presets for the theme color picker. First entry
 * matches the app's own --color-primary so the default resume theme feels
 * intentional rather than arbitrary.
 * @type {{ label: string, value: string }[]}
 */
export const THEME_COLORS = [
    { label: 'Indigo', value: '#4F46E5' },
    { label: 'Sky', value: '#0EA5E9' },
    { label: 'Teal', value: '#0D9488' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Amber', value: '#D97706' },
    { label: 'Rose', value: '#E11D48' },
    { label: 'Violet', value: '#7C3AED' },
    { label: 'Slate', value: '#334155' },
];