import type { VisitSession } from '../../types';

interface VisitHistorySwitcherProps {
  visits: VisitSession[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const formatTime = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false });

/** 参观历史切换器，按参观进入时间列出，供路线回放选择 */
export function VisitHistorySwitcher({ visits, selectedId, onSelect }: VisitHistorySwitcherProps) {
  if (visits.length === 0) return null;

  return (
    <label className="block text-sm">
      <span className="mb-2 block text-[var(--color-muted)]">选择参观记录（共 {visits.length} 次）</span>
      <select
        className="w-full border border-[var(--color-line)] bg-[var(--color-panel)] p-3 text-sm"
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
      >
        {visits.map((visit, index) => (
          <option key={visit.id} value={visit.id}>
            {index === 0 ? '最近一次' : `第 ${visits.length - index} 次`} · {formatTime(visit.enteredAt)}
            {visit.legacy ? ' · 历史数据' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
