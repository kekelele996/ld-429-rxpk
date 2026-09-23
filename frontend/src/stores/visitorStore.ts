import { create } from 'zustand';
import type { VisitSession, VisitorLog } from '../types';
import { VisitorStatus } from '../types/enums';
import { visitors } from '../api/mockGallery';
import { DEFAULT_VISIT_ROOM_ID, EMPTY_VISIT_REVIVE_MS, LOCAL_VISITOR_ID, MIN_STOP_SECONDS } from '../constants/visits';
import { loadVisits, saveVisits } from '../utils/visitStorage';

const createVisitId = () => `visit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface VisitorState {
  /** 本机产生的逐次参观记录（新版本结构，本地持久化） */
  visits: VisitSession[];
  /** 旧版访客数据，仅用于兼容展示 */
  legacyVisitors: VisitorLog[];
  currentVisitId?: string;
  /** 每次进入画廊都创建一条独立的参观记录，返回参观 ID */
  enterGallery: () => string;
  /** 记录一次作品停留；停留不足最短阈值的误触会被丢弃，重看不去重 */
  recordStop: (artworkId: string, staySeconds: number) => void;
  /** 结束当前参观（离开画廊页面时调用） */
  endVisit: () => void;
}

export const useVisitorStore = create<VisitorState>((set, get) => ({
  visits: loadVisits(),
  legacyVisitors: visitors,
  enterGallery: () => {
    const { currentVisitId, visits } = get();
    if (currentVisitId) return currentVisitId;

    // 复用 StrictMode / HMR 刚刚结束且没有停留的空参观，避免重复建档
    const emptyVisit = visits.find(
      (visit) =>
        !visit.legacy &&
        visit.onlineStatus === VisitorStatus.Left &&
        visit.stops.length === 0 &&
        visit.endedAt &&
        Date.now() - new Date(visit.endedAt).getTime() < EMPTY_VISIT_REVIVE_MS,
    );

    if (emptyVisit) {
      const revived: VisitSession = { ...emptyVisit, endedAt: undefined, onlineStatus: VisitorStatus.InGallery };
      const next = visits.map((visit) => (visit.id === revived.id ? revived : visit));
      set({ visits: next, currentVisitId: revived.id });
      saveVisits(next);
      return revived.id;
    }

    const visit: VisitSession = {
      id: createVisitId(),
      visitorId: LOCAL_VISITOR_ID,
      enteredAt: new Date().toISOString(),
      stops: [],
      roomId: DEFAULT_VISIT_ROOM_ID,
      onlineStatus: VisitorStatus.InGallery,
    };
    const next = [visit, ...visits];
    set({ visits: next, currentVisitId: visit.id });
    saveVisits(next);
    return visit.id;
  },
  recordStop: (artworkId, staySeconds) => {
    const { currentVisitId } = get();
    if (!currentVisitId) return;
    // 先按真实时长判定误触，再取整保存秒数
    if (staySeconds < MIN_STOP_SECONDS) return;
    const seconds = Math.round(staySeconds);

    const next = get().visits.map((visit) => {
      if (visit.id !== currentVisitId) return visit;
      const viewIndex = visit.stops.filter((stop) => stop.artworkId === artworkId).length + 1;
      return {
        ...visit,
        onlineStatus: VisitorStatus.InGallery,
        stops: [...visit.stops, { artworkId, staySeconds: seconds, viewedAt: new Date().toISOString(), viewIndex }],
      };
    });
    set({ visits: next });
    saveVisits(next);
  },
  endVisit: () => {
    const { currentVisitId } = get();
    if (!currentVisitId) return;
    const endedAt = new Date();

    const next = get().visits.map((visit) => {
      if (visit.id !== currentVisitId) return visit;
      const enteredAt = new Date(visit.enteredAt);
      const totalSeconds = Math.max(0, Math.round((endedAt.getTime() - enteredAt.getTime()) / 1000));
      return { ...visit, endedAt: endedAt.toISOString(), totalSeconds, onlineStatus: VisitorStatus.Left };
    });
    set({ visits: next, currentVisitId: undefined });
    saveVisits(next);
  },
}));
