import { ChapterMenu } from "@/components/ChapterMenu";
import { TopPageNav } from "@/components/TopPageNav";

/** Story pages get the act-page index as a left menu on wide screens, and the
 *  previous/next buttons at the top and foot of each page at every width; below
 *  xl the buttons are the way around. */
export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="xl:grid xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-10">
      <aside className="hidden xl:block">
        <ChapterMenu />
      </aside>
      <div className="min-w-0">
        <TopPageNav />
        {children}
      </div>
    </div>
  );
}
