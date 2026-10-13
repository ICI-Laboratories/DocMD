import { z } from 'zod';

export const PresentationSchema = z.object({
  fontFamily: z.enum(['sans', 'serif', 'mono']).optional(),
  fontSize: z.string().regex(/^([1-9][0-9]?)(px|rem|%)$/).optional(),
  fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).optional(),
  color: z.string().regex(/^(#[0-9a-fA-F]{3,8}|rgb\([^)]*\))$/).optional(),
  backgroundColor: z.string().regex(/^(#[0-9a-fA-F]{3,8}|rgb\([^)]*\))$/).optional(),
  align: z.enum(['left', 'center', 'right', 'justify']).optional(),
  lineHeight: z.number().min(0.8).max(3).optional(),
  spacingBefore: z.number().min(0).max(200).optional(),
  spacingAfter: z.number().min(0).max(200).optional(),
  indent: z.number().min(0).max(300).optional()
}).strict();

export const BlockSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['paragraph', 'heading', 'quote', 'list', 'code', 'divider']),
  markdown: z.string(),
  presentation: PresentationSchema.optional(),
  extensions: z.record(z.unknown()).optional()
});

export const DocMDSchema = z.object({
  docmdVersion: z.literal('0.1'),
  id: z.string().min(1),
  metadata: z.object({ title: z.string(), locale: z.string().optional() }),
  theme: PresentationSchema.optional(),
  sections: z.array(z.object({ id: z.string().min(1), title: z.string().optional(), blocks: z.array(BlockSchema) })),
  extensions: z.record(z.unknown()).optional()
});

export type Presentation = z.infer<typeof PresentationSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type DocMD = z.infer<typeof DocMDSchema>;

export function validateDocMD(input: unknown): DocMD {
  const result = DocMDSchema.safeParse(input);
  if (!result.success) throw new Error(`Documento DocMD inválido: ${result.error.issues.map(i => i.path.join('.') + ' ' + i.message).join('; ')}`);
  const ids = result.data.sections.flatMap(s => [s.id, ...s.blocks.map(b => b.id)]);
  if (new Set(ids).size !== ids.length) throw new Error('Documento DocMD inválido: los IDs deben ser únicos.');
  return result.data;
}

export function resolvePresentation(doc: DocMD, sectionId: string, blockId: string): Presentation {
  const section = doc.sections.find(s => s.id === sectionId);
  const block = section?.blocks.find(b => b.id === blockId);
  if (!section || !block) throw new Error('Sección o bloque no encontrado.');
  return { ...(doc.theme ?? {}), ...(block.presentation ?? {}) };
}
