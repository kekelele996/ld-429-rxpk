import type { Artwork, VisitSession } from '../types';

/** 一次参观的总停留秒数：优先使用记录的整次时长，否则由逐次停留求和 */
export function sessionTotalSeconds(session: VisitSession): number {
  if (typeof session.totalSeconds === 'number' && session.totalSeconds > 0) return session.totalSeconds;
  return session.stops.reduce((sum, stop) => sum + stop.staySeconds, 0);
}

/** 同一件作品被重复观看的次数（逐次停留数减去不同作品数） */
export function repeatViewCount(session: VisitSession): number {
  return session.stops.length - new Set(session.stops.map((stop) => stop.artworkId)).size;
}

/** 参观按进入时间倒序排列，最近一次在前 */
export function sortVisitsByLatest(visits: VisitSession[]): VisitSession[] {
  return [...visits].sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
}

/** 作品热度按「有多少不同参观看过它」统计，同一次参观内重看只计一次 */
export function rankArtworkViews(artworks: Artwork[], visits: VisitSession[]) {
  return artworks
    .map((artwork) => ({
      artwork,
      views: visits.filter((visit) => visit.stops.some((stop) => stop.artworkId === artwork.id)).length,
    }))
    .sort((a, b) => b.views - a.views);
}

/** 格式化为 mm:ss 或 hh:mm:ss */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(rest)}` : `${pad(minutes)}:${pad(rest)}`;
}
