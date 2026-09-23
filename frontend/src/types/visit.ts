import { VisitorStatus } from './enums';

/** 参观路线中的一站：同一作品重复到访会逐次保留，不去重 */
export interface VisitStop {
  artworkId: string;
  viewedAt: string;
  staySeconds: number;
}

/** 一次独立参观记录：每次进入画廊生成一条 */
export interface VisitSession {
  id: string;
  visitorId: string;
  enteredAt: string;
  leftAt?: string;
  staySeconds: number;
  stops: VisitStop[];
  status: VisitorStatus;
}
