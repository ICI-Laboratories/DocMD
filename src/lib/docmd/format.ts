import type { Block, DocMD, Presentation } from './model';

const attrs = (input: string): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const match of input.matchAll(/([a-zA-Z]+)=((?:"[^"]*")|(?:[^\s]+))/g)) result[match[1]] = match[2].replace(/^"|"$/g, '');
  return result;
};

export function parseDocMD(source: string): DocMD {
  const lines = source.split(/\r?\n/);
  const sections: DocMD['sections'] = [{ id: 'section-1', title: 'Documento', blocks: [] }];
  let current: Block | null = null;
  for (const line of lines) {
    const opening = line.match(/^:::(\w+)\s+\{([^}]*)\}\s*$/);
    if (opening) {
      const values = attrs(opening[2]);
      current = { id: values.id || `block-${sections[0].blocks.length + 1}`, kind: opening[1] as Block['kind'], markdown: '', presentation: toPresentation(values) };
      continue;
    }
    if (line.trim() === ':::' && current) { sections[0].blocks.push(current); current = null; continue; }
    if (current) current.markdown += (current.markdown ? '\n' : '') + line;
    else if (line.trim()) sections[0].blocks.push({ id: `block-${sections[0].blocks.length + 1}`, kind: 'paragraph', markdown: line });
  }
  if (current) throw new Error('Directiva DocMD sin cierre :::');
  return { docmdVersion: '0.1', id: 'doc-imported', metadata: { title: 'Documento' }, sections };
}

function toPresentation(values: Record<string, string>): Presentation {
  const p: Presentation = {};
  if (values.fontFamily === 'sans' || values.fontFamily === 'serif' || values.fontFamily === 'mono') p.fontFamily = values.fontFamily;
  if (values.fontSize) p.fontSize = values.fontSize;
  if (values.align === 'left' || values.align === 'center' || values.align === 'right' || values.align === 'justify') p.align = values.align;
  if (/^(400|500|600|700)$/.test(values.fontWeight ?? '')) p.fontWeight = Number(values.fontWeight) as Presentation['fontWeight'];
  return p;
}

export function serializeDocMD(doc: DocMD): string {
  return doc.sections.flatMap(section => section.blocks.map(block => {
    const p = block.presentation ?? {};
    const settings = Object.entries({ ...p }).map(([key, value]) => `${key}=${String(value).includes(' ') ? `"${value}"` : value}`).join(' ');
    return `:::${block.kind} {#${block.id}${settings ? ` ${settings}` : ''}}\n${block.markdown}\n:::`;
  })).join('\n\n');
}

export function toSemanticMarkdown(doc: DocMD): string {
  return doc.sections.flatMap(section => [section.title ? `## ${section.title}` : '', ...section.blocks.map(b => b.markdown.trim())]).filter(Boolean).join('\n\n').trim() + '\n';
}
