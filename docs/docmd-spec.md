# Especificación DocMD v0.1

## 1. Alcance

DocMD es un contenedor JSON versionado. Su objetivo es transportar contenido Markdown estructurado y las decisiones de presentación necesarias para renderizarlo en una interfaz de documento.

## 2. Modelo canónico

```ts
{
  docmdVersion: "0.1",
  id: "doc-hello",
  metadata: { title: "Ejemplo", locale: "es-MX" },
  theme: { fontFamily: "sans", fontSize: "16px", lineHeight: 1.5 },
  sections: [{
    id: "section-1",
    title: "Primera hoja",
    blocks: [{
      id: "intro",
      kind: "paragraph",
      markdown: "Bienvenido a **DocMD**.",
      presentation: { align: "center", fontSize: "20px", fontWeight: 700 }
    }]
  }],
  extensions: {}
}
```

Un documento contiene secciones ordenadas y bloques con IDs estables. `markdown` es contenido semántico; `presentation` es opcional y no debe contener HTML o CSS libre.

## 3. Presentación segura

Propiedades permitidas en v0.1: `fontFamily` (`sans`, `serif`, `mono`), `fontSize` (unidades `px`, `rem`, `%` acotadas), `fontWeight` (400, 500, 600, 700), `color` y `backgroundColor` como hex/RGB seguro, `align` (`left`, `center`, `right`, `justify`), `lineHeight`, `spacingBefore`, `spacingAfter` y `indent`.

La precedencia es: valores inline > bloque > sección > theme > valores por defecto. Un cliente debe ignorar propiedades desconocidas, conservarlas bajo `extensions` y no ejecutarlas.

## 4. Sintaxis extendida

Para intercambio humano se usa una directiva explícita, no ambigua con Markdown estándar:

```md
:::paragraph {#intro align=center fontSize=20px}
Bienvenido a **DocMD**.
:::
```

El identificador debe ser único dentro del documento. Los valores con espacios se escriben entre comillas. El contenido puede contener llaves escapadas y cualquier Markdown normal.

## 5. Exportación semántica

La exportación elimina directivas, IDs y presentation, pero conserva encabezados, párrafos, listas, enlaces, tablas, citas, código y énfasis. Es la salida recomendada para indexación o prompts de LLM.

## 6. Seguridad

- No se acepta CSS arbitrario como estilo.
- El HTML embebido debe deshabilitarse o sanitizarse en el renderer.
- Se deben aplicar límites de tamaño y profundidad.
- Los IDs no pueden controlar selectores o consultas sin escapado.
- La validación ocurre en el cliente por UX y en el servidor como autoridad.

## 7. Compatibilidad

`docmdVersion` es obligatorio. Un lector debe rechazar versiones mayores que no comprenda y puede migrar versiones menores mediante funciones explícitas. Campos desconocidos se conservan en `extensions` y nunca modifican semántica por sí mismos.
