import { VisitorStatus } from './enums';

/** 一次作品停留记录；同一件作品重看会按观看顺序生成多条 */
export interface ArtworkStop {
  artworkId: string;
  /** 本次停留秒数；停留不足最短阈值的误触不会生成记录 */
  staySeconds: number;
  /** 本次停留开始时间（ISO） */
  viewedAt: string;
  /** 该作品在本次参观中是第几次被观看（从 1 开始，大于 1 即为重看） */
  viewIndex: number;
}

/** 一次进入画廊生成的独立参观记录 */
export interface VisitSession {
  id: string;
  visitorId: string;
  enteredAt: string;
  endedAt?: string;
  /** 整次参观总停留秒数；进行中或缺省时由停留记录求和兜底 */
  totalSeconds?: number;
  /** 按观看顺序保存的停留记录，重看不去重 */
  stops: ArtworkStop[];
  roomId: string;
  onlineStatus: VisitorStatus;
  /** 由旧版 VisitorLog 兼容转换而来的历史参观 */
  legacy?: boolean;
}

/** 旧版访客记录，仅用于历史数据兼容展示 */
export interface VisitorLog {
  visitorId: string;
  enteredAt: string;
  staySeconds: number;
  viewedArtworkIds: string[];
  currentRoomId: string;
  onlineStatus: VisitorStatus;
}
