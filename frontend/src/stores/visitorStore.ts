import { create } from 'zustand';
import type { VisitSession, VisitorLog } from '../types';
import { VisitorStatus } from '../types/enums';
import { visitSessions, visitors } from '../api/mockGallery';

/** 停留不足该秒数视为误触，不计入参观路线 */
export const MIN_STOP_SECONDS = 2;

const LOCAL_VISITOR_ID = 'visitor-local';

interface VisitorState {
  /** 旧版访客记录，统计页按一次已结束参观兼容展示 */
  visitors: VisitorLog[];
  /** 独立参观记录，每次进入画廊新增一条 */
  sessions: VisitSession[];
  currentSessionId: string | null;
  enterGallery: () => void;
  recordStop: (artworkId: string, staySeconds: number) => void;
  leaveGallery: () => void;
}

const elapsedSeconds = (since: string) => Math.round((Date.now() - new Date(since).getTime()) / 1000);

export const useVisitorStore = create<VisitorState>((set) => ({
  visitors,
  sessions: visitSessions,
  currentSessionId: null,
  enterGallery: () =>
    set((state) => {
      const last = state.sessions[state.sessions.length - 1];
      // React StrictMode 开发环境会立即卸载重挂：刚结束且尚无路线的会话直接复用
      if (
        last?.status === VisitorStatus.Left &&
        last.stops.length === 0 &&
        last.leftAt &&
        Date.now() - new Date(last.leftAt).getTime() < 2000
      ) {
        return {
          sessions: state.sessions.map((session) =>
            session.id === last.id ? { ...session, status: VisitorStatus.InGallery, leftAt: undefined } : session,
          ),
          currentSessionId: last.id,
        };
      }
      const session: VisitSession = {
        id: `visit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        visitorId: LOCAL_VISITOR_ID,
        enteredAt: new Date().toISOString(),
        staySeconds: 0,
        stops: [],
        status: VisitorStatus.InGallery,
      };
      return { sessions: [...state.sessions, session], currentSessionId: session.id };
    }),
  recordStop: (artworkId, staySeconds) => {
    if (staySeconds < MIN_STOP_SECONDS) return;
    set((state) => {
      if (!state.currentSessionId) return {};
      return {
        sessions: state.sessions.map((session) =>
          session.id === state.currentSessionId
            ? {
                ...session,
                // 重看同一作品也逐次追加，保留完整观看顺序
                stops: [
                  ...session.stops,
                  { artworkId, viewedAt: new Date().toISOString(), staySeconds: Math.round(staySeconds) },
                ],
                staySeconds: elapsedSeconds(session.enteredAt),
              }
            : session,
        ),
      };
    });
  },
  leaveGallery: () =>
    set((state) => {
      if (!state.currentSessionId) return {};
      return {
        sessions: state.sessions.map((session) =>
          session.id === state.currentSessionId
            ? {
                ...session,
                status: VisitorStatus.Left,
                leftAt: new Date().toISOString(),
                staySeconds: elapsedSeconds(session.enteredAt),
              }
            : session,
        ),
        currentSessionId: null,
      };
    }),
}));
