import type { DocMD } from './model';
import { resolvePresentation } from './model';

export function renderBlock(doc: DocMD, sectionId: string, blockId: string): string {
  const section = doc.sections.find(s => s.id === sectionId);
  const block = section?.blocks.find(b => b.id === blockId);
  if (!section || !block) throw new Error('Bloque no encontrado.');
  const p = resolvePresentation(doc, sectionId, blockId);
  const style = [`font-family:${p.fontFamily === 'mono' ? 'ui-monospace' : p.fontFamily ?? 'inherit'}`, `font-size:${p.fontSize ?? 'inherit'}`, `font-weight:${p.fontWeight ?? 400}`, `text-align:${p.align ?? 'left'}`, `line-height:${p.lineHeight ?? 1.5}`].join(';');
  const escaped = block.markdown.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  return `<div data-docmd-id="${escapeAttr(block.id)}" style="${style}">${escaped.replace(/\n/g, '<br>')}</div>`;
}

function escapeAttr(value: string): string { return value.replace(/[^a-zA-Z0-9_-]/g, ''); }
