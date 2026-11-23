// Render stored descriptions as readable text; never manufacture brand or certification claims.
export function descriptionBlocks(description = '') {
  return description.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const text = line.replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^#{1,4}\s+/, '');
    const heading = /^(?:\d+[.)]\s+|#{1,4}\s+)/.test(line) || /^\*\*.*\*\*$/.test(line);
    return { text, heading };
  });
}

export function ProductDescription({ description }) {
  const blocks = descriptionBlocks(description || 'Cửa hàng chưa bổ sung mô tả cho sản phẩm này.');
  return <div className="space-y-3 text-sm leading-7 text-stone-600">{blocks.map((block, index) => block.heading
    ? <h3 key={index} className="!mt-6 !font-sans !text-base font-semibold text-primary">{block.text}</h3>
    : <p key={index} className="whitespace-pre-wrap">{block.text}</p>)}</div>;
}
