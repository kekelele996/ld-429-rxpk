import { useMemo, useState } from 'react';
import { RouteReplay } from '../components/common/RouteReplay';
import { VisitHistorySwitcher } from '../components/common/VisitHistorySwitcher';
import { useArtworkStore } from '../stores/artworkStore';
import { useVisitorStore } from '../stores/visitorStore';
import { VisitorStatus } from '../types/enums';
import { migrateVisitorLogs } from '../utils/visitMigration';
import { rankArtworkViews, sessionTotalSeconds, sortVisitsByLatest } from '../utils/visitStats';

export function Analytics() {
  const artworks = useArtworkStore((state) => state.artworks);
  const visits = useVisitorStore((state) => state.visits);
  const legacyVisitors = useVisitorStore((state) => state.legacyVisitors);

  // 新参观记录与旧访客数据（按一次已结束参观迁移）合并，最近一次在前
  const allVisits = useMemo(
    () => sortVisitsByLatest([...visits, ...migrateVisitorLogs(legacyVisitors)]),
    [visits, legacyVisitors],
  );

  // 默认回放最近一次参观
  const [selectedId, setSelectedId] = useState<string | undefined>(allVisits[0]?.id);
  const selectedVisit = allVisits.find((visit) => visit.id === selectedId) ?? allVisits[0];

  const ranked = useMemo(() => rankArtworkViews(artworks, allVisits), [artworks, allVisits]);
  const activeVisitors = allVisits.filter((visit) => visit.onlineStatus === VisitorStatus.InGallery).length;
  const totalSeconds = allVisits.reduce((sum, visit) => sum + sessionTotalSeconds(visit), 0);
  const coveredCount = new Set(allVisits.flatMap((visit) => visit.stops.map((stop) => stop.artworkId))).size;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="text-sm text-[var(--color-muted)]">在线参观</p>
          <p className="mt-2 text-5xl font-semibold">{activeVisitors}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-[var(--color-muted)]">总停留分钟</p>
          <p className="mt-2 text-5xl font-semibold">{Math.round(totalSeconds / 60)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-[var(--color-muted)]">覆盖作品</p>
          <p className="mt-2 text-5xl font-semibold">{coveredCount}</p>
        </div>
      </div>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <h2 className="text-2xl font-semibold">最受欢迎作品</h2>
          <div className="mt-5 space-y-3">
            {ranked.map(({ artwork, views }) => (
              <div key={artwork.id} className="grid grid-cols-[1fr_auto] border-b border-[var(--color-line)] pb-3">
                <span>{artwork.title}</span>
                <span className="text-[var(--color-accent)]">{views} 次参观</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-2xl font-semibold">路线回放</h2>
          {selectedVisit ? (
            <div className="mt-5 space-y-5">
              <VisitHistorySwitcher visits={allVisits} selectedId={selectedVisit.id} onSelect={setSelectedId} />
              <RouteReplay visit={selectedVisit} artworks={artworks} />
            </div>
          ) : (
            <p className="mt-5 text-sm text-[var(--color-muted)]">暂无参观记录，进入 3D 漫游后即可生成。</p>
          )}
        </div>
      </section>
    </div>
  );
}
