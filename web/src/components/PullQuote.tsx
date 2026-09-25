/**
 * A line set apart from the running prose: a question posed to the reader, or a
 * page's closing statement. Shared so Act 1's pages set them identically.
 */
export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-compute/10 px-4 py-3 text-center text-lg italic text-compute">
      {children}
    </p>
  );
}
