import { ChapterMenu } from "@/components/ChapterMenu";

/** Story pages get the act-page index as a left menu on wide screens; below
 *  that, the prev/next links at each page's foot are the way around. */
export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="xl:grid xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-10">
      <aside className="hidden xl:block">
        <ChapterMenu />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
