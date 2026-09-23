import type { VisitSession, VisitorLog } from '../types';
import { VisitorStatus } from '../types/enums';

/**
 * 将旧版访客数据按「一次已结束的参观」兼容转换。
 * 旧记录中作品只有去重后的观看列表、没有逐次停留，
 * 因此停留秒数留空（回放时显示 ——），总停留沿用旧字段。
 */
export function migrateVisitorLog(visitor: VisitorLog): VisitSession {
  return {
    id: `legacy-${visitor.visitorId}`,
    visitorId: visitor.visitorId,
    enteredAt: visitor.enteredAt,
    endedAt: visitor.enteredAt,
    totalSeconds: visitor.staySeconds,
    roomId: visitor.currentRoomId,
    onlineStatus: VisitorStatus.Left,
    legacy: true,
    stops: visitor.viewedArtworkIds.map((artworkId) => ({
      artworkId,
      staySeconds: 0,
      viewedAt: visitor.enteredAt,
      viewIndex: 1,
    })),
  };
}

export function migrateVisitorLogs(visitors: VisitorLog[]): VisitSession[] {
  return visitors.map(migrateVisitorLog);
}
