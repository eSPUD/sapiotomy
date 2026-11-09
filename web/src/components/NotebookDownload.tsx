/**
 * The notebook download, shared by every page that ships a bundle (pages 5-9)
 * so the button is uniform everywhere: one style, one wording, the size in the
 * label. Each page passes its own href and size string, and places it on the
 * title's row, right after the page heading. Most pages ship a zip bundle; a page
 * that links a bare .ipynb passes `label`, which says which notebook it is.
 */
export function NotebookDownload({
  href,
  size,
  label,
}: {
  href: string;
  size: string;
  label?: string;
}) {
  return (
    <a
      className="shrink-0 rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:border-chrome hover:text-ink"
      href={href}
      download
    >
      {label ? `Download the ${label} notebook (ipynb, ${size})` : `Download the notebook (zip, ${size})`} ↓
    </a>
  );
}
