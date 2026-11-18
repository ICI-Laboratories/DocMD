import { describe, expect, it } from 'vitest';
import { parseDocMD, serializeDocMD } from '../src/lib/docmd/format';

describe('fences with ::: delimiter lines inside directives', () => {
  const backtickSource = ':::code {#demo}\n```ts\n:::\nconsole.log(1);\n```\n:::';
  const backtickMarkdown = '```ts\n:::\nconsole.log(1);\n```';

  it('treats a lone ::: inside a backtick fence as literal content', () => {
    const parsed = parseDocMD(backtickSource);
    expect(parsed.sections[0].blocks).toHaveLength(1);
    expect(parsed.sections[0].blocks[0]).toMatchObject({ id: 'demo', kind: 'code' });
    expect(parsed.sections[0].blocks[0].markdown).toBe(backtickMarkdown);

    const serialized = serializeDocMD(parsed);
    expect(serialized).toContain(`:::code {#demo}\n${backtickMarkdown}\n:::`);
    expect(parseDocMD(serialized)).toEqual(parsed);
  });

  it('treats a lone ::: inside a tilde fence as literal content', () => {
    const source = 'Texto libre\n:::code {#tilde-demo}\n~~~ts\n:::\nx\n~~~\n:::';
    const markdown = '~~~ts\n:::\nx\n~~~';
    const parsed = parseDocMD(source);
    expect(parsed.sections[0].blocks.map(b => b.id)).toEqual(['block-1', 'tilde-demo']);
    expect(parsed.sections[0].blocks[1].markdown).toBe(markdown);

    const serialized = serializeDocMD(parsed);
    expect(serialized).toContain(`:::code {#tilde-demo}\n${markdown}\n:::`);
    expect(parseDocMD(serialized)).toEqual(parsed);
  });

  it('keeps a shorter would-be close inside a longer opening fence as content', () => {
    const source = ':::code {#long}\n````ts\n```\n:::\nbody\n````\n:::';
    const markdown = '````ts\n```\n:::\nbody\n````';
    const parsed = parseDocMD(source);
    expect(parsed.sections[0].blocks).toHaveLength(1);
    expect(parsed.sections[0].blocks[0]).toMatchObject({ id: 'long', kind: 'code' });
    expect(parsed.sections[0].blocks[0].markdown).toBe(markdown);

    const serialized = serializeDocMD(parsed);
    expect(serialized).toContain(`:::code {#long}\n${markdown}\n:::`);
    expect(parseDocMD(serialized)).toEqual(parsed);
  });

  it('preserves a following real directive with its explicit id', () => {
    const source = ':::code {#a}\n```ts\n:::\nx\n```\n:::\n:::paragraph {#real-id}\nReal\n:::';
    const parsed = parseDocMD(source);
    expect(parsed.sections[0].blocks.map(b => b.id)).toEqual(['a', 'real-id']);
    expect(parsed.sections[0].blocks[0].markdown).toBe('```ts\n:::\nx\n```');
    expect(parsed.sections[0].blocks[1]).toMatchObject({ kind: 'paragraph', markdown: 'Real' });

    const serialized = serializeDocMD(parsed);
    expect(serialized).toContain(':::paragraph {#real-id}\nReal\n:::');
    expect(parseDocMD(serialized)).toEqual(parsed);
  });

  it.each([
    ['backtick', 'Texto libre\n:::code {#demo3}\n```ts\n:::\n:::note {#block-1}\nnested\n```\n:::', '```ts\n:::\n:::note {#block-1}\nnested\n```'],
    ['tilde', 'Texto libre\n:::code {#demo3}\n~~~ts\n:::\n:::note {#block-1}\nnested\n~~~\n:::', '~~~ts\n:::\n:::note {#block-1}\nnested\n~~~'],
  ])('does not reserve explicit-looking IDs inside the example for the real document (%s)', (_marker, source, markdown) => {
    const parsed = parseDocMD(source);
    expect(parsed.sections[0].blocks.map(b => b.id)).toEqual(['block-1', 'demo3']);
    expect(parsed.sections[0].blocks[1].markdown).toBe(markdown);

    const serialized = serializeDocMD(parsed);
    expect(serialized).toContain(markdown);
    expect(parseDocMD(serialized)).toEqual(parsed);
  });
});
