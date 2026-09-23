import type { Artwork, VisitSession } from '../../types';
import { VisitorStatus } from '../../types/enums';
import { formatDuration, repeatViewCount, sessionTotalSeconds } from '../../utils/visitStats';

interface RouteReplayProps {
  visit: VisitSession;
  artworks: Artwork[];
}

const formatTime = (value?: string) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '——';

/** 单次参观的路线回放：按观看顺序展示逐次停留与重复观看 */
export function RouteReplay({ visit, artworks }: RouteReplayProps) {
  const titleOf = (artworkId: string) => artworks.find((artwork) => artwork.id === artworkId)?.title ?? artworkId;
  const totalSeconds = sessionTotalSeconds(visit);
  const uniqueCount = new Set(visit.stops.map((stop) => stop.artworkId)).size;
  const repeatCount = repeatViewCount(visit);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="border border-[var(--color-line)] p-3">
          <p className="text-[var(--color-muted)]">总停留</p>
          <p className="mt-1 text-xl font-semibold">{formatDuration(totalSeconds)}</p>
        </div>
        <div className="border border-[var(--color-line)] p-3">
          <p className="text-[var(--color-muted)]">观看 / 作品数</p>
          <p className="mt-1 text-xl font-semibold">
            {visit.stops.length} / {uniqueCount}
          </p>
        </div>
        <div className="border border-[var(--color-line)] p-3">
          <p className="text-[var(--color-muted)]">重复观看</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-accent)]">{repeatCount} 次</p>
        </div>
      </div>

      <div className="text-xs text-[var(--color-muted)]">
        {formatTime(visit.enteredAt)} ~ {visit.onlineStatus === VisitorStatus.InGallery ? '参观中' : formatTime(visit.endedAt)}
        {visit.legacy ? ' · 旧访客数据，按一次已结束参观兼容展示' : ''}
      </div>

      {visit.stops.length === 0 ? (
        <p className="border border-dashed border-[var(--color-line)] p-4 text-sm text-[var(--color-muted)]">
          本次参观没有有效停留记录（停留不足 2 秒的误触不计入路线）。
        </p>
      ) : (
        <>
          <p className="text-sm text-[var(--color-muted)]">
            路线：{visit.stops.map((stop) => titleOf(stop.artworkId)).join(' → ')}
          </p>
          <ol className="space-y-2 text-sm">
            {visit.stops.map((stop, index) => (
              <li key={`${stop.artworkId}-${index}`} className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] pb-2">
                <span className="flex items-center gap-2">
                  <span className="text-[var(--color-muted)]">{index + 1}.</span>
                  <span>{titleOf(stop.artworkId)}</span>
                  {stop.viewIndex > 1 && (
                    <span className="border border-[var(--color-accent)] px-2 py-0.5 text-xs text-[var(--color-accent)]">
                      第 {stop.viewIndex} 次观看
                    </span>
                  )}
                </span>
                <span className="text-[var(--color-muted)]">
                  {visit.legacy ? '停留 ——' : `停留 ${formatDuration(stop.staySeconds)}`}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
