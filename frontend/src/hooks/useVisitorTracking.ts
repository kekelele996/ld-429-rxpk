import { useEffect, useRef } from 'react';
import { useVisitorStore } from '../stores/visitorStore';

/**
 * 进入画廊时开始一条独立参观记录，离开时结束；
 * 跟踪当前聚焦作品的停留时长，切换或离开时结算，
 * 停留不足最短阈值（由 store 判定）的误触不记录。
 */
export const useVisitorTracking = (artworkId?: string) => {
  const enterGallery = useVisitorStore((state) => state.enterGallery);
  const endVisit = useVisitorStore((state) => state.endVisit);
  const recordStop = useVisitorStore((state) => state.recordStop);

  const focusedIdRef = useRef<string | undefined>(artworkId);
  const focusedSinceRef = useRef<number>(Date.now());

  const flushStop = () => {
    const focusedId = focusedIdRef.current;
    if (focusedId) {
      recordStop(focusedId, (Date.now() - focusedSinceRef.current) / 1000);
    }
    focusedIdRef.current = undefined;
  };

  // 参观生命周期：挂载即进入，卸载/关闭页面即离开
  useEffect(() => {
    enterGallery();

    const leave = () => {
      flushStop();
      endVisit();
    };
    window.addEventListener('pagehide', leave);

    return () => {
      window.removeEventListener('pagehide', leave);
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterGallery, endVisit]);

  // 聚焦作品变化时结算上一段停留，重看同一件作品也会产生新的停留段
  useEffect(() => {
    if (artworkId === focusedIdRef.current) return;
    flushStop();
    if (artworkId) {
      focusedIdRef.current = artworkId;
      focusedSinceRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId, recordStop]);
};
