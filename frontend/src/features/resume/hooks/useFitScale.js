import { useRef, useState, useLayoutEffect } from 'react';

/**
 * Measures its own rendered width and returns a scale factor so a
 * fixed-size render (e.g. ResumeCanvas's A4 page) can be shrunk to exactly
 * fit a responsive container. Recalculates on resize, not on every render.
 *
 * @param {number} targetWidth - the natural/unscaled width of the content
 * @returns {[React.RefObject, number]} [ref to attach to the container, scale]
 */
export function useFitScale(targetWidth) {
    const ref = useRef(null);
    const [scale, setScale] = useState(0);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        const update = () => {
            const width = el.offsetWidth;
            if (width > 0) setScale(width / targetWidth);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [targetWidth]);

    return [ref, scale];
}