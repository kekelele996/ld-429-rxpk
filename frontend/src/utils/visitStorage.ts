import type { VisitSession } from '../types';
import { VisitorStatus } from '../types/enums';

const STORAGE_KEY = 'virtual-gallery:visit-sessions';

/** 读取本地保存的参观记录；页面被直接关闭等未正常结束的参观按已结束兼容 */
export function loadVisits(): VisitSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as VisitSession[]).map(normalize);
  } catch {
    return [];
  }
}

export function saveVisits(visits: VisitSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  } catch {
    // 存储不可用时参观记录仅保留在内存中，不影响漫游
  }
}

/** 持久化或外部数据里进行中却已无活跃页面的参观，统一按已结束展示 */
function normalize(session: VisitSession): VisitSession {
  if (session.onlineStatus === VisitorStatus.InGallery) {
    return { ...session, onlineStatus: VisitorStatus.Left };
  }
  return session;
}
