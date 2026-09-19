---
name: graphify
description: "Turn any codebase, with its docs, SQL schemas, configs, and APIs, into a queryable knowledge graph. Use for deep architecture understanding, dependency tracing, AST relationship mapping, and structural impact analysis."
---

# Graphify — Deterministic AST Codebase Knowledge Graph

When activated or analyzing complex software architecture:

## 1. Graph Construction Rung
- **Parse AST & Symbols**: Trace imports, exports, functions, classes, schemas, and API handlers.
- **Map Dependencies**: Connect caller -> callee, database table -> ORM model, endpoint -> controller.
- **Trace Data Pipelines**: Map how state flows from backend endpoints to UI components.

## 2. Structural Analysis Directives
- **Impact Assessment**: Before modifying any function or endpoint, query the graph to list every downstream consumer.
- **Cyclic Dependency Detection**: Highlight circular imports or tightly coupled modules.
- **Dead Code Identification**: Spot unreferenced exports or orphan components.
