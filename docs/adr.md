# ADR-001: Modelo estructurado

Usamos JSON canónico con bloques tipados porque separa semántica y estilo, valida entradas y permite migraciones deterministas.

# ADR-002: Markdown como contenido

Cada bloque conserva Markdown controlado para facilitar exportación a LLM y compatibilidad humana. El renderer no confía en HTML arbitrario.

# ADR-003: CRDT para colaboración

Se recomienda Yjs/Hocuspocus porque resuelve operaciones concurrentes y presencia con una infraestructura WebSocket conocida. El MVP inicia con snapshots y eventos.

# ADR-004: Exportación pura

`toSemanticMarkdown` es una función pura y testeable. La salida no depende del navegador, CSS o usuario que la solicite.
