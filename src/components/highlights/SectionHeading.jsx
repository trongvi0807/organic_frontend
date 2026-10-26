export function SectionHeading({ eyebrow, title, description, light = false, centered = false }) {
  return <div className={centered ? '!mx-auto !mb-9 max-w-2xl text-center sm:!mb-12' : '!mb-9 max-w-2xl sm:!mb-12'}>
    <p className={`!mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? 'text-[#c3d0b2]' : 'text-[#7d8d64]'}`}>{eyebrow}</p>
    <h2 className={`font-serif text-3xl font-medium leading-[1.25] tracking-tight sm:text-4xl lg:text-[42px] ${light ? 'text-[#faf8eb]' : 'text-primary'}`}>{title}</h2>
    {description && <p className={`!mt-5 text-sm leading-8 ${light ? 'text-[#cbd4c0]' : 'text-[#78816e]'}`}>{description}</p>}
  </div>;
}
