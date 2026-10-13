# Arquitectura propuesta

## Capas

1. **Editor:** Tiptap/ProseMirror en producción; la demo actual usa DOM accesible y bloques tipados.
2. **Dominio:** DocMD JSON, validación, normalización y exportación semántica.
3. **Aplicación:** comandos (`insertBlock`, `updatePresentation`, `moveBlock`) y autorización.
4. **Persistencia:** snapshots periódicos más eventos append-only.
5. **Colaboración:** Yjs como CRDT; Hocuspocus como servidor WebSocket. La presencia no se persiste como contenido.

## Flujo

```text
Usuario -> editor -> comando validado -> documento local -> operación CRDT
        -> WebSocket -> peers -> snapshot PostgreSQL -> auditoría
```

El servidor nunca debe aceptar HTML renderizado como fuente de verdad. Persiste DocMD canónico y genera HTML bajo demanda.

## Persistencia

PostgreSQL: `documents`, `document_versions`, `document_members`, `document_events`, `comments`. Object storage para imágenes y archivos; el documento guarda referencias y metadatos, no blobs grandes. Redis Pub/Sub coordina instancias Hocuspocus.

## API futura

- `GET /documents/:id`
- `POST /documents/:id/commands`
- `GET /documents/:id/versions`
- `POST /documents/:id/export?format=semantic-markdown`
- WebSocket `/collaboration/:id`

## Seguridad y operación

OIDC/OAuth para identidad, RBAC (`owner`, `editor`, `commenter`, `viewer`), control de origen, rate limiting, auditoría, cifrado en tránsito y reposo. Métricas: latencia de comandos, tamaño de snapshots, reconexiones, conflictos y tiempo de exportación.

## Decisiones de colaboración

Yjs permite representar texto y orden de bloques como estructuras CRDT, resolver ediciones concurrentes y soportar undo local. WebRTC puede servir para prototipos P2P, pero WebSocket con Hocuspocus es preferible para autorización, presencia y observabilidad empresariales.

## Escalabilidad y migraciones

Los snapshots se compactan tras N eventos. Cada versión de DocMD tiene una migración pura y testeada. Los clientes negocian la versión; el servidor conserva el formato canónico más reciente y exporta formatos anteriores cuando sea necesario.

La demo no implementa multiusuario real: el indicador “demo” evita confundir simulación con colaboración productiva.
