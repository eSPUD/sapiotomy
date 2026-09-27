/** Speaker marks for the deck's chats: a person for the user, a sparkle for the model.
 *  Each carries its role as an accessible name, since the icon replaces the label. */
export function UserIcon() {
  return (
    <span role="img" aria-label="User" title="User" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink-muted">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    </span>
  );
}

export function ModelIcon() {
  return (
    <span role="img" aria-label="Model" title="Model" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-compute text-canvas">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
        <path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z" />
      </svg>
    </span>
  );
}
