/** 单次观看作品的最短停留秒数，不足此时长视为误触，不计入参观路线 */
export const MIN_STOP_SECONDS = 2;

/** 本地访客 ID：纯前端模拟，本机多次参观共用同一匿名身份 */
export const LOCAL_VISITOR_ID = 'visitor-local';

/** 进入画廊的默认展厅 */
export const DEFAULT_VISIT_ROOM_ID = 'room-main';

/**
 * 刚结束、且没有任何停留记录的参观可被复用的时间窗。
 * 用于吸收 React StrictMode 挂载-卸载-重挂载以及 HMR 产生的空参观。
 */
export const EMPTY_VISIT_REVIVE_MS = 10_000;
