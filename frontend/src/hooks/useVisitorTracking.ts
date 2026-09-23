import { useEffect } from 'react';
import { useVisitorStore } from '../stores/visitorStore';

export const useVisitorTracking = (artworkId?: string) => {
  const enterGallery = useVisitorStore((state) => state.enterGallery);
  const leaveGallery = useVisitorStore((state) => state.leaveGallery);
  const recordStop = useVisitorStore((state) => state.recordStop);

  // 注意：卸载时的清理函数按 effect 声明顺序执行，路线记录的清理必须先于
  // leaveGallery，否则当前作品这一站会在会话结束后才提交而被丢弃。
  useEffect(() => {
    if (!artworkId) return;
    const startedAt = Date.now();
    return () => recordStop(artworkId, (Date.now() - startedAt) / 1000);
  }, [artworkId, recordStop]);

  // 每次进入画廊生成一条独立参观记录，离开时标记结束
  useEffect(() => {
    enterGallery();
    return () => leaveGallery();
  }, [enterGallery, leaveGallery]);
};
