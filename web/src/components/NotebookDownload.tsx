/**
 * The notebook download, shared by every page that ships a bundle (pages 5-9)
 * so the button is uniform everywhere: one style, one wording, the size in the
 * label. Each page passes its own href and size string, and places it on the
 * title's row, right after the page heading. Most pages ship a zip bundle; a page
 * whose zip holds several notebooks and no traces passes format "notebooks", so the
 * label says so.
 */
export function NotebookDownload({
  href,
  size,
  format = "zip",
}: {
  href: string;
  size: string;
  format?: "zip" | "notebooks";
}) {
  return (
    <a
      className="shrink-0 rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:border-compute hover:text-ink"
      href={href}
      download
    >
      {format === "notebooks" ? "Download the notebooks" : "Download the notebook"} (zip, {size}) ↓
    </a>
  );
}
