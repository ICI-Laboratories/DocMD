import type { Block, DocMD, Presentation } from './model';
import { PresentationSchema, validateDocMD } from './model';

const DIRECTIVE_OPENING = /^:::(\w+)\s+\{((?:"(?:\\.|[^"\\])*"|[^"}])*)\}\s*$/;
const SHORTHAND_ID = /^[^\s{}"\\=]+$/;

const PRESENTATION_KEYS: (keyof Presentation)[] = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'color',
  'backgroundColor',
  'align',
  'lineHeight',
  'spacingBefore',
  'spacingAfter',
  'indent'
];

interface DirectiveHeader {
  id?: string;
  attrs: Record<string, string>;
}

function parseDirectiveHeader(rawAttrs: string): DirectiveHeader {
  let id: string | undefined;
  let remaining = rawAttrs.trim();

  const idShorthandMatch = remaining.match(/^#([^\s{}"\\=]+)(?:\s+|$)/);
  if (idShorthandMatch) {
    id = idShorthandMatch[1];
    remaining = remaining.slice(idShorthandMatch[0].length).trim();
  }

  const attrsResult: Record<string, string> = {};
  for (const match of remaining.matchAll(/([a-zA-Z]+)=("(?:\\.|[^"\\])*"|[^\s]+)/g)) {
    attrsResult[match[1]] = match[2].startsWith('"') ? JSON.parse(match[2]) : match[2];
  }

  if (attrsResult.id !== undefined) {
    if (!attrsResult.id) throw new Error('El ID de una directiva no puede estar vacío.');
    if (id !== undefined && attrsResult.id !== id) {
      throw new Error(`Conflicto de IDs en directiva: #${id} y id=${attrsResult.id}`);
    }
    id = attrsResult.id;
    delete attrsResult.id;
  }

  return { id, attrs: attrsResult };
}

function nextGeneratedId(usedIds: Set<string>, counter: { current: number }): string {
  while (true) {
    const candidate = `block-${counter.current++}`;
    if (!usedIds.has(candidate)) {
      usedIds.add(candidate);
      return candidate;
    }
  }
}

export function parseDocMD(source: string): DocMD {
  const lines = source.split(/\r?\n/);
  const sections: DocMD['sections'] = [{ id: 'section-1', title: 'Documento', blocks: [] }];
  const usedIds = new Set<string>(['section-1']);
  const reservedIds = new Set<string>(['section-1']);
  // Reserve explicit IDs before assigning names to plain text or anonymous blocks.
  let insideDirective = false;
  for (const line of lines) {
    if (insideDirective) {
      if (line.trim() === ':::') insideDirective = false;
      continue;
    }
    const opening = line.match(DIRECTIVE_OPENING);
    if (opening) {
      const { id } = parseDirectiveHeader(opening[2]);
      if (id !== undefined) reservedIds.add(id);
      insideDirective = true;
    }
  }
  const counter = { current: 1 };
  let current: Block | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    // If we are inside an active directive, don't open a nested directive or replace current block.
    // Content lines (including blank lines and nested :::) are treated as markdown content.
    if (current) {
      if (line.trim() === ':::') {
        current.markdown = contentLines.join('\n');
        sections[0].blocks.push(current);
        current = null;
      } else {
        contentLines.push(line);
      }
      continue;
    }

    const opening = line.match(DIRECTIVE_OPENING);
    if (opening) {
      const header = parseDirectiveHeader(opening[2]);
      let blockId = header.id;
      if (blockId) {
        if (usedIds.has(blockId)) {
          throw new Error(`ID duplicado detectado: ${blockId}`);
        }
        usedIds.add(blockId);
      } else {
        blockId = nextGeneratedId(reservedIds, counter);
      }

      const presentation = toPresentation(header.attrs);
      current = {
        id: blockId,
        kind: opening[1] as Block['kind'],
        markdown: '',
        ...(presentation ? { presentation } : {})
      };
      contentLines = [];
      continue;
    }

    if (line.trim()) {
      const genId = nextGeneratedId(reservedIds, counter);
      sections[0].blocks.push({ id: genId, kind: 'paragraph', markdown: line });
    }
  }

  if (current) throw new Error('Directiva DocMD sin cierre :::');
  return validateDocMD({ docmdVersion: '0.1', id: 'doc-imported', metadata: { title: 'Documento' }, sections });
}

function toPresentation(values: Record<string, string>): Presentation | undefined {
  const candidate: Record<string, unknown> = {};

  if (values.fontFamily !== undefined) candidate.fontFamily = values.fontFamily;
  if (values.fontSize !== undefined) candidate.fontSize = values.fontSize;
  if (values.fontWeight !== undefined) {
    const num = Number(values.fontWeight);
    candidate.fontWeight = isNaN(num) ? values.fontWeight : num;
  }
  if (values.color !== undefined) candidate.color = values.color;
  if (values.backgroundColor !== undefined) candidate.backgroundColor = values.backgroundColor;
  if (values.align !== undefined) candidate.align = values.align;
  if (values.lineHeight !== undefined) candidate.lineHeight = Number(values.lineHeight);
  if (values.spacingBefore !== undefined) candidate.spacingBefore = Number(values.spacingBefore);
  if (values.spacingAfter !== undefined) candidate.spacingAfter = Number(values.spacingAfter);
  if (values.indent !== undefined) candidate.indent = Number(values.indent);

  // Validate with PresentationSchema
  const parsed = PresentationSchema.safeParse(candidate);
  if (!parsed.success) throw new Error('Presentación DocMD inválida.');
  if (Object.keys(parsed.data).length > 0) {
    return parsed.data;
  }
  return undefined;
}

export function serializeDocMD(doc: DocMD): string {
  return doc.sections.flatMap(section => section.blocks.map(block => {
    const p = block.presentation ?? {};
    // Align before fontSize retains existing expected syntax (e.g. {#intro align=center fontSize=20px})
    // and deterministic serialization for all Presentation keys
    const entries: [string, unknown][] = [];
    if (p.align !== undefined) entries.push(['align', p.align]);
    if (p.fontSize !== undefined) entries.push(['fontSize', p.fontSize]);

    for (const key of PRESENTATION_KEYS) {
      if (key !== 'align' && key !== 'fontSize' && p[key] !== undefined) {
        entries.push([key, p[key]]);
      }
    }

    const settings = entries.map(([key, value]) => `${key}=${String(value).includes(' ') ? `"${value}"` : value}`).join(' ');
    const identifier = SHORTHAND_ID.test(block.id) ? `#${block.id}` : `id=${JSON.stringify(block.id)}`;
    return `:::${block.kind} {${identifier}${settings ? ` ${settings}` : ''}}\n${block.markdown}\n:::`;
  })).join('\n\n');
}

export function toSemanticMarkdown(doc: DocMD): string {
  return doc.sections.flatMap(section => [section.title ? `## ${section.title}` : '', ...section.blocks.map(b => b.markdown.trim())]).filter(Boolean).join('\n\n').trim() + '\n';
}
