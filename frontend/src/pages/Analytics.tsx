import { useMemo, useState } from 'react';
import { useArtworkStore } from '../stores/artworkStore';
import { useVisitorStore } from '../stores/visitorStore';
import { VisitorStatus } from '../types/enums';

interface ReplayStop {
  artworkId: string;
  staySeconds: number | null;
}

interface ReplayVisit {
  id: string;
  label: string;
  enteredAt: string;
  staySeconds: number;
  status: VisitorStatus;
  legacy: boolean;
  stops: ReplayStop[];
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes} 分 ${rest} 秒` : `${rest} 秒`;
};

const formatTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', { hour12: false });

export function Analytics() {
  const artworks = useArtworkStore((state) => state.artworks);
  const visitors = useVisitorStore((state) => state.visitors);
  const sessions = useVisitorStore((state) => state.sessions);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 旧版 VisitorLog 逐条转换为一次已结束参观，与新的参观记录统一回放
  const visits = useMemo<ReplayVisit[]>(() => {
    const fromSessions: ReplayVisit[] = sessions.map((session) => ({
      id: session.id,
      label: `${session.visitorId} · ${formatTime(session.enteredAt)}`,
      enteredAt: session.enteredAt,
      staySeconds: session.staySeconds,
      status: session.status,
      legacy: false,
      stops: session.stops.map((stop) => ({ artworkId: stop.artworkId, staySeconds: stop.staySeconds })),
    }));
    const fromLegacy: ReplayVisit[] = visitors.map((visitor) => ({
      id: `legacy-${visitor.visitorId}`,
      label: `${visitor.visitorId} · ${formatTime(visitor.enteredAt)}（旧记录）`,
      enteredAt: visitor.enteredAt,
      staySeconds: visitor.staySeconds,
      status: VisitorStatus.Left,
      legacy: true,
      stops: visitor.viewedArtworkIds.map((artworkId) => ({ artworkId, staySeconds: null })),
    }));
    return [...fromSessions, ...fromLegacy].sort((a, b) => +new Date(b.enteredAt) - +new Date(a.enteredAt));
  }, [sessions, visitors]);

  // 默认回放最近一次参观
  const selected = visits.find((visit) => visit.id === selectedId) ?? visits[0];

  const ranked = useMemo(
    () =>
      artworks
        .map((artwork) => ({
          artwork,
          views: visits.filter((visit) => visit.stops.some((stop) => stop.artworkId === artwork.id)).length,
        }))
        .sort((a, b) => b.views - a.views),
    [artworks, visits],
  );

  const activeVisitors =
    sessions.filter((session) => session.status === VisitorStatus.InGallery).length +
    visitors.filter((visitor) => visitor.onlineStatus === VisitorStatus.InGallery).length;
  const totalStaySeconds =
    sessions.reduce((sum, session) => sum + session.staySeconds, 0) +
    visitors.reduce((sum, visitor) => sum + visitor.staySeconds, 0);
  const coveredArtworks = new Set([
    ...sessions.flatMap((session) => session.stops.map((stop) => stop.artworkId)),
    ...visitors.flatMap((visitor) => visitor.viewedArtworkIds),
  ]).size;

  const artworkTitle = (id: string) => artworks.find((artwork) => artwork.id === id)?.title ?? id;
  const repeatViews = selected ? selected.stops.length - new Set(selected.stops.map((stop) => stop.artworkId)).size : 0;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="text-sm text-[var(--color-muted)]">在线参观</p>
          <p className="mt-2 text-5xl font-semibold">{activeVisitors}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-[var(--color-muted)]">总停留分钟</p>
          <p className="mt-2 text-5xl font-semibold">{Math.round(totalStaySeconds / 60)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-[var(--color-muted)]">覆盖作品</p>
          <p className="mt-2 text-5xl font-semibold">{coveredArtworks}</p>
        </div>
      </div>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <h2 className="text-2xl font-semibold">最受欢迎作品</h2>
          <div className="mt-5 space-y-3">
            {ranked.map(({ artwork, views }) => (
              <div key={artwork.id} className="grid grid-cols-[1fr_auto] border-b border-[var(--color-line)] pb-3">
                <span>{artwork.title}</span>
                <span className="text-[var(--color-accent)]">{views} views</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">路线回放</h2>
            <select
              className="focus-ring border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
              value={selected?.id ?? ''}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.label}
                </option>
              ))}
            </select>
          </div>
          {selected ? (
            <div className="mt-5">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-muted)]">
                <span>进入时间 {formatTime(selected.enteredAt)}</span>
                <span>总停留 {formatDuration(selected.staySeconds)}</span>
                <span>重复观看 {repeatViews} 次</span>
                <span>{selected.status === VisitorStatus.InGallery ? '参观中' : '已结束'}</span>
              </div>
              {selected.stops.length > 0 ? (
                <ol className="mt-4 space-y-2">
                  {selected.stops.map((stop, index) => {
                    const revisited = selected.stops.slice(0, index).some((item) => item.artworkId === stop.artworkId);
                    return (
                      <li
                        key={`${stop.artworkId}-${index}`}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--color-line)] pb-2 text-sm"
                      >
                        <span className="text-[var(--color-muted)]">{index + 1}.</span>
                        <span>
                          {artworkTitle(stop.artworkId)}
                          {revisited ? (
                            <span className="ml-2 border border-[var(--color-line)] px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
                              重看
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[var(--color-muted)]">
                          {stop.staySeconds === null ? '未计时' : formatDuration(stop.staySeconds)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-4 text-sm text-[var(--color-muted)]">本次参观尚未记录有效停留（不足 2 秒的误触不计入）。</p>
              )}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[var(--color-muted)]">暂无参观记录。</p>
          )}
        </div>
      </section>
    </div>
  );
}
