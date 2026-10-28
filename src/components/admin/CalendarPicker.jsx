import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarDays, calendarMonth } from '@/lib/calendar';
import { SearchSelect } from './SearchSelect';

export function CalendarPicker({ value, min, max, withTime, onChoose, onClose }) {
  const [view, setView] = useState(() => calendarMonth(value));
  const [time, setTime] = useState(value?.slice(11, 16) || '00:00');
  const currentYear = calendarMonth().year;
  function move(delta) { const date = new Date(Date.UTC(view.year, view.month + delta, 1)); setView({ year: date.getUTCFullYear(), month: date.getUTCMonth() }); }
  function pick(day, nextTime = time) { onChoose(`${day}${withTime ? `T${nextTime}` : ''}`); }
  return <div className="calendar-picker absolute z-40 !mt-2 w-[310px] max-w-[calc(100vw-3rem)] rounded-2xl border border-line bg-white p-4 shadow-xl" role="dialog" aria-label="Chọn ngày">
    <div className="!mb-3 flex items-center gap-2"><button type="button" aria-label="Tháng trước" disabled={view.year === 1900 && view.month === 0} onClick={() => move(-1)} className="rounded-lg p-1.5 hover:bg-sage"><ChevronLeft size={17} /></button>
      <SearchSelect aria-label="Chọn tháng" className="min-w-0 flex-1" inputClassName="!p-2 !pr-6 !text-xs" clearOnSearch={false} value={String(view.month)} options={Array.from({ length: 12 }, (_, month) => ({ value: String(month), label: `Tháng ${month + 1}` }))} onChange={(month) => setView((old) => ({ ...old, month: Number(month) }))} />
      <SearchSelect aria-label="Chọn năm" className="w-24" inputClassName="!p-2 !pr-6 !text-xs" clearOnSearch={false} value={String(view.year)} options={Array.from({ length: Math.max(currentYear + 20, view.year) - 1899 }, (_, i) => ({ value: String(1900 + i), label: String(1900 + i) })).reverse()} onChange={(year) => setView((old) => ({ ...old, year: Number(year) }))} />
      <button type="button" aria-label="Tháng sau" onClick={() => move(1)} className="rounded-lg p-1.5 hover:bg-sage"><ChevronRight size={17} /></button></div>
    <div className="grid grid-cols-7 text-center text-xs">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <span key={day} className="py-2 text-stone-400">{day}</span>)}
      {calendarDays(view.year, view.month).map((day, index) => day ? <button key={day} type="button" disabled={!!(min && day < min.slice(0, 10) || max && day > max.slice(0, 10))} aria-label={`Ngày ${day.slice(8)} tháng ${view.month + 1} năm ${view.year}`} aria-pressed={day === value?.slice(0, 10)} onClick={() => pick(day)} className={`aspect-square rounded-lg transition-colors disabled:opacity-25 ${day === value?.slice(0, 10) ? 'bg-primary text-white' : 'hover:bg-sage'}`}>{Number(day.slice(8))}</button> : <span key={`empty-${index}`} />)}
    </div>
    {withTime && <label className="!mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">Giờ (Việt Nam)<input type="time" aria-label="Chọn giờ" value={time} onChange={(event) => { setTime(event.target.value); if (value?.slice(0, 10) && event.target.value) pick(value.slice(0, 10), event.target.value); }} className="rounded-lg border border-line p-2" /></label>}
    <div className="!mt-3 flex justify-end border-t border-line pt-2"><button type="button" onClick={onClose} className="px-3 py-2 text-xs text-primary">Đóng lịch</button></div>
  </div>;
}
