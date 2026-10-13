# DocMD

DocMD es una propuesta de formato documental que separa **contenido semántico** y **presentación**. El usuario trabaja en una interfaz familiar tipo Google Docs; el servidor conserva un documento estructurado, versionable y preparado para colaboración y extracción por LLM.

## Estado

Este repositorio contiene la especificación DocMD v0.1, una librería TypeScript sin estado y una demo web local. La colaboración multiusuario está diseñada, pero la presencia y el guardado de la demo son simulados.

## Inicio rápido

```bash
npm install
npm run dev
```

También puedes ejecutar:

```bash
npm run test
npm run check
npm run build
```

## Idea central

```text
Editor visual -> modelo DocMD canónico -> snapshot/eventos -> exportación semántica Markdown -> LLM
```

DocMD no permite CSS arbitrario como API principal. Los estilos usan tokens seguros (`fontSize`, `fontFamily`, `align`, `lineHeight`, etc.) y se validan antes de persistirse.

## Sintaxis amigable

La representación canónica es JSON. Para revisión humana se propone una sintaxis Markdown extendida con directivas de bloque:

```md
:::paragraph {#intro align=center fontSize=20px}
Bienvenido a **DocMD**.
:::
```

La directiva no cambia el contenido Markdown: únicamente añade identidad y presentación. `toSemanticMarkdown` elimina todas las directivas.

## Arquitectura

- **Frontend:** Astro y TypeScript; el editor visual modifica bloques tipados.
- **Dominio:** `src/lib/docmd`, funciones puras y validación Zod.
- **MVP backend:** API REST/tRPC, snapshots y eventos en PostgreSQL.
- **Colaboración:** Yjs + Hocuspocus sobre WebSocket; Redis para coordinación horizontal.
- **Adjuntos:** object storage compatible con S3.
- **Seguridad:** sanitización de Markdown/HTML, RBAC, auditoría y límites de tamaño.

La propuesta detallada está en [`docs/architecture.md`](docs/architecture.md) y la especificación en [`docs/docmd-spec.md`](docs/docmd-spec.md).

## Estructura

```text
src/lib/docmd/       modelo, validación, parser, serializer y exportadores
src/pages/index.astro demo visual del editor
docs/                 especificación, arquitectura y ADRs
tests/                pruebas de dominio
```

## Roadmap

1. v0.1: modelo canónico, demo y exportación semántica.
2. v0.2: editor basado en ProseMirror/Tiptap y persistencia de snapshots.
3. v0.3: Yjs/Hocuspocus, cursores y presencia real.
4. v1.0: permisos, comentarios, historial, migraciones y API pública.
