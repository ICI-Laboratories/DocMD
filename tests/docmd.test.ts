import { describe, expect, it } from 'vitest';
import { parseDocMD, serializeDocMD, toSemanticMarkdown } from '../src/lib/docmd/format';
import { validateDocMD } from '../src/lib/docmd/model';

describe('DocMD', () => {
  const source = ':::paragraph {#intro align=center fontSize=20px}\nHola **mundo**\n:::';
  it('hace round-trip de la sintaxis', () => expect(serializeDocMD(parseDocMD(source))).toContain(':::paragraph {#intro align=center fontSize=20px}'));
  it('extrae Markdown semántico', () => expect(toSemanticMarkdown(parseDocMD(source))).toBe('## Documento\n\nHola **mundo**\n'));
  it('rechaza IDs duplicados', () => expect(() => validateDocMD({ docmdVersion: '0.1', id: 'x', metadata: { title: 'x' }, sections: [{ id: 's', blocks: [{ id: 'a', kind: 'paragraph', markdown: 'a' }, { id: 'a', kind: 'paragraph', markdown: 'b' }] }] })).toThrow(/IDs/));
  it('rechaza presentación insegura', () => expect(() => validateDocMD({ docmdVersion: '0.1', id: 'x', metadata: { title: 'x' }, sections: [{ id: 's', blocks: [{ id: 'a', kind: 'paragraph', markdown: 'a', presentation: { fontSize: 'expression(alert(1))' } }] }] })).toThrow(/Documento/));
});
