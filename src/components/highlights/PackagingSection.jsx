import { useState } from 'react';
import { ArrowUpRight, Check, Recycle, RefreshCw, ShoppingBag } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { HIGHLIGHT_SOURCES, PACKAGING_TIPS } from '@/constants/highlights';
import { SectionHeading } from './SectionHeading';

const icons = { bag: ShoppingBag, reuse: RefreshCw, recycle: Recycle };

function PackagingIllustration() {
  return <svg viewBox="0 0 460 360" className="!mx-auto w-full max-w-md" role="img" aria-label="Túi giấy, chai thủy tinh và hộp đựng với họa tiết lá xanh">
    <ellipse cx="235" cy="315" rx="170" ry="17" fill="#173b2d" opacity=".35" />
    <circle cx="250" cy="180" r="130" fill="#3b624b" />
    <path d="M78 122h138l16 185H63Z" fill="#d4c5a0" stroke="#e8d8b5" strokeWidth="2" strokeLinejoin="round" />
    <path d="M109 137V96c0-48 74-48 74 0v41" fill="none" stroke="#e9dbba" strokeWidth="7" strokeLinecap="round" />
    <path d="M145 252v-61m0 39c-33-2-47-22-42-43 29 1 44 17 42 43Zm0-13c1-26 18-42 43-40-1 26-18 43-43 40Z" fill="#71895e" stroke="#5e774d" strokeWidth="2" />
    <path d="M276 131v33l-18 26v108c0 10 60 10 60 0V190l-18-26v-33" fill="#98ad8b" stroke="#c3d0b4" strokeWidth="2" strokeLinejoin="round" />
    <rect x="272" y="118" width="32" height="18" rx="5" fill="#d2bb8e" /><rect x="264" y="224" width="48" height="49" rx="5" fill="#ece4cd" /><path d="M279 251c1-12 10-17 19-16-1 10-9 17-19 16Zm0 0v9" fill="#89a074" stroke="#6e865b" strokeWidth="2" />
    <path d="M203 253h81v56h-81Z" fill="#b69b72" stroke="#dac6a0" strokeWidth="2" /><path d="M196 245h95v15h-95Z" fill="#d3bd96" /><path d="M244 261v47" stroke="#e3d3b3" strokeWidth="10" />
    <path d="M350 231c-9-26 0-49 27-65 13 27 4 55-27 65Zm-1 0-14 48M340 259c-25 2-43-12-46-34 26-3 43 12 46 34Z" fill="#8ca775" stroke="#afc197" strokeWidth="2" />
    <circle cx="72" cy="68" r="4" fill="#bdcda6" /><circle cx="370" cy="112" r="5" fill="#9eb784" />
  </svg>;
}

export function PackagingSection() {
  const [selected, setSelected] = useState(PACKAGING_TIPS[0].id);
  const active = PACKAGING_TIPS.find((tip) => tip.id === selected);
  return <section id="bao-bi" aria-labelledby="packaging-heading" className="scroll-mt-32 overflow-hidden rounded-[2rem] bg-[#294c38] px-5 py-10 text-white sm:px-9 sm:py-14 lg:px-12"><div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-12">
    <Reveal><p className="!mb-2 text-[10px] uppercase tracking-[0.2em] text-[#b3c49e]">Ít hơn một chút, xanh hơn mỗi ngày</p><PackagingIllustration /><p className="text-center text-xs leading-7 text-[#c0ceb3]">Hướng tới bao bì vừa đủ và có trách nhiệm.</p></Reveal>
    <Reveal><SectionHeading eyebrow="04 / NHẸ DẤU CHÂN" title={<span id="packaging-heading">Chọn điều lành.<br />Để lại ít hơn.</span>} description="Giảm vật liệu dùng một lần, ưu tiên tái sử dụng và tìm hiểu cách phân loại. Đó là những bước nhỏ Mộc mong muốn cùng bạn thực hiện." light /><div role="group" aria-label="Tìm hiểu cách sử dụng bao bì" className="!mb-6 flex flex-wrap gap-2">{PACKAGING_TIPS.map((tip) => { const Icon = icons[tip.icon]; return <button key={tip.id} type="button" id={`packaging-${tip.id}`} aria-pressed={selected === tip.id} aria-controls="packaging-tip" onClick={() => setSelected(tip.id)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 !text-xs transition-colors ${selected === tip.id ? 'border-[#e4e9cf] bg-[#e4e9cf] text-[#294c38]' : 'border-[#acc098]/40 text-[#d5dfc7] hover:bg-white/10'}`}><Icon size={14} />{tip.label}</button>; })}</div><div id="packaging-tip" aria-labelledby={`packaging-${active.id}`} aria-live="polite" aria-atomic="true" className="rounded-2xl border border-[#adc295]/25 bg-white/5 p-5 sm:p-6"><h3 className="font-serif text-xl leading-relaxed text-[#f3f3e2]">{active.title}</h3><p className="!mt-3 text-xs leading-7 text-[#c4d0b8]">{active.text}</p><ul className="!mt-4 space-y-3">{active.tips.map((tip) => <li key={tip} className="flex items-start gap-2 text-xs leading-6 text-[#d4dfc8]"><Check size={13} className="!mt-1 shrink-0 text-[#b6cb95]" />{tip}</li>)}</ul></div><a href={HIGHLIGHT_SOURCES.packaging} target="_blank" rel="noopener noreferrer" className="!mt-4 inline-flex min-h-11 items-center gap-2 text-[10px] !text-[#b5c7a2] underline underline-offset-4">Tìm hiểu về tái chế và ủ phân từ EPA <ArrowUpRight size={12} /></a></Reveal>
  </div></section>;
}
