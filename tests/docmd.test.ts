import { describe, expect, it } from 'vitest';
import { parseDocMD, serializeDocMD, toSemanticMarkdown } from '../src/lib/docmd/format';
import { validateDocMD } from '../src/lib/docmd/model';

describe('DocMD', () => {
  const source = ':::paragraph {#intro align=center fontSize=20px}\nHola **mundo**\n:::';
  it('hace round-trip de la sintaxis', () => expect(serializeDocMD(parseDocMD(source))).toContain(':::paragraph {#intro align=center fontSize=20px}'));
  it('extrae Markdown semántico', () => expect(toSemanticMarkdown(parseDocMD(source))).toBe('## Documento\n\nHola **mundo**\n'));
  it('rechaza IDs duplicados', () => expect(() => validateDocMD({ docmdVersion: '0.1', id: 'x', metadata: { title: 'x' }, sections: [{ id: 's', blocks: [{ id: 'a', kind: 'paragraph', markdown: 'a' }, { id: 'a', kind: 'paragraph', markdown: 'b' }] }] })).toThrow(/IDs/));
  it('rechaza presentación insegura', () => expect(() => validateDocMD({ docmdVersion: '0.1', id: 'x', metadata: { title: 'x' }, sections: [{ id: 's', blocks: [{ id: 'a', kind: 'paragraph', markdown: 'a', presentation: { fontSize: 'expression(alert(1))' } }] }] })).toThrow(/Documento/));

  it('preserva ID explícito y compatibilidad id= sin conflicto', () => {
    const parsedWithIdAttr = parseDocMD(':::paragraph {id=custom-id align=left}\nTexto\n:::');
    expect(parsedWithIdAttr.sections[0].blocks[0].id).toBe('custom-id');
    expect(serializeDocMD(parsedWithIdAttr)).toContain(':::paragraph {#custom-id align=left}\nTexto\n:::');

    const parsedWithBothSame = parseDocMD(':::paragraph {#same id=same align=right}\nTexto\n:::');
    expect(parsedWithBothSame.sections[0].blocks[0].id).toBe('same');

    expect(() => parseDocMD(':::paragraph {#shorthand id=conflict}\nTexto\n:::')).toThrow(/Conflicto de IDs/);
  });

  it('evita colisiones entre IDs generados y IDs explícitos o section-1', () => {
    // Explicit id matches candidate block-1 and section-1
    expect(() => parseDocMD(':::paragraph {#section-1}\nTexto\n:::')).toThrow(/ID duplicado/);

    const doc = parseDocMD('Linea libre\n:::paragraph {#block-2}\nBloque explícito\n:::\nOtra linea libre');
    const ids = doc.sections[0].blocks.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['block-1', 'block-2', 'block-3']);
    expect(ids).not.toContain('section-1');

    const explicitLater = parseDocMD('Texto libre\n:::paragraph {#block-1}\nID reservado\n:::\n:::paragraph {}\nSin ID\n:::');
    expect(explicitLater.sections[0].blocks.map(b => b.id)).toEqual(['block-2', 'block-1', 'block-3']);
  });

  it('preserva contenido markdown con líneas en blanco y directiva anidada como contenido', () => {
    const rawContent = ':::code {#snippet}\n```ts\n:::note {align=left}\nNested\n```\n\nLinea tras espacio\n:::';
    const parsed = parseDocMD(rawContent);
    expect(parsed.sections[0].blocks.length).toBe(1);
    expect(parsed.sections[0].blocks[0].markdown).toBe('```ts\n:::note {align=left}\nNested\n```\n\nLinea tras espacio');
    const serialized = serializeDocMD(parsed);
    expect(serialized).toContain('```ts\n:::note {align=left}\nNested\n```\n\nLinea tras espacio');

    const blankEdges = parseDocMD(':::paragraph {#blanks}\n\n\nTexto\n\n:::');
    expect(blankEdges.sections[0].blocks[0].markdown).toBe('\n\nTexto\n');
    expect(parseDocMD(serializeDocMD(blankEdges))).toEqual(blankEdges);
  });

  it('preserva y valida todas las propiedades declaradas de presentación segura', () => {
    const richDirective = ':::paragraph {#full align=justify fontSize=18px fontFamily=serif fontWeight=600 color=#333333 backgroundColor=rgb(255,255,255) lineHeight=1.5 spacingBefore=10 spacingAfter=20 indent=15}\nTexto con estilo\n:::';
    const parsed = parseDocMD(richDirective);
    const block = parsed.sections[0].blocks[0];
    expect(block.presentation).toEqual({
      align: 'justify',
      fontSize: '18px',
      fontFamily: 'serif',
      fontWeight: 600,
      color: '#333333',
      backgroundColor: 'rgb(255,255,255)',
      lineHeight: 1.5,
      spacingBefore: 10,
      spacingAfter: 20,
      indent: 15
    });

    const serialized = serializeDocMD(parsed);
    expect(serialized).toContain('align=justify fontSize=18px fontFamily=serif fontWeight=600 color=#333333 backgroundColor=rgb(255,255,255) lineHeight=1.5 spacingBefore=10 spacingAfter=20 indent=15');
    const reParsed = parseDocMD(serialized);
    expect(reParsed.sections[0].blocks[0].presentation).toEqual(block.presentation);
  });

  it('conserva IDs válidos del modelo, incluso Unicode, puntos y valores entre comillas', () => {
    for (const id of ['introducción.α', 'sección:uno', 'con espacios', 'comilla"y\\barra}', 'igual=valor']) {
      const doc = parseDocMD(source);
      doc.sections[0].blocks[0].id = id;
      const before = structuredClone(doc);
      expect(validateDocMD(doc).sections[0].blocks[0].id).toBe(id);
      expect(parseDocMD(serializeDocMD(doc))).toEqual(doc);
      expect(doc).toEqual(before);
    }
  });

  it('rechaza presentación inválida sin descartar silenciosamente atributos válidos', () => {
    expect(() => parseDocMD(':::paragraph {#intro align=center lineHeight=no-numérico}\nTexto\n:::')).toThrow(/Presentación/);
    expect(() => parseDocMD(':::paragraph {#intro fontSize="expression(alert(1))"}\nTexto\n:::')).toThrow(/Presentación/);
  });
});
