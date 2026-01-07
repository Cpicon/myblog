+++
title = "La Paradoja de la Herencia: Scoping de Herramientas en Sistemas Multi-Agente"
date = 2026-01-06T12:00:00
weight = 3

[taxonomies]
categories = ["Investigación en IA"]
tags = ["Arquitectura de Agentes", "Scoping de Herramientas", "Sistemas IA", "Multi-Agente"]
+++

# La Paradoja de la Herencia: Scoping de Herramientas en Sistemas Multi-Agente

> *Esta es la Parte 2 de una serie de tres partes. Ve [Parte 0](/posts/claude-code-plugin-journey-part0/) para la visión general del plugin e instalación, o [Parte 1](/posts/claude-code-plugin-journey-part1/) para el viaje de desarrollo.*

**Resumen**: Este artículo presenta observaciones empíricas del desarrollo de un plugin de Claude Code, revelando patrones fundamentales en el diseño de sistemas IA multi-agente. A través de sesiones de desarrollo documentadas, identificamos tres hallazgos clave: (1) los modelos de herencia implícita de herramientas fallan consistentemente en la práctica, requiriendo contratos de scope explícitos; (2) las restricciones de topología impuestas por la plataforma impulsan la emergencia de patrones arquitectónicos específicos; y (3) las convenciones de nombres se convierten en requisitos funcionales en sistemas IA. Estos hallazgos tienen implicaciones para el diseño de frameworks de agentes más allá de la plataforma específica estudiada.

<!-- more -->

---

## 1. Introducción

Las plataformas de desarrollo basadas en agentes representan un paradigma emergente en ingeniería de software, donde instancias de IA colaboran en tareas complejas a través de orquestación estructurada. Estas plataformas ofrecen mecanismos de extensión—plugins, commands, agentes—que permiten a los desarrolladores personalizar el comportamiento para dominios específicos.

Este artículo examina Claude Code como caso de estudio en diseño de frameworks de agentes. Claude Code permite a los desarrolladores construir plugins personalizados con commands (atajos invocados por usuario), agentes (instancias especializadas de Claude), skills (proveedores de contexto), hooks (manejadores de eventos), e integraciones MCP (conexiones a servicios externos).

Durante el desarrollo de `agent-team-creator`, un plugin para generar agentes IA específicos del proyecto, documentamos observaciones sistemáticas sobre el comportamiento de la plataforma. Estas observaciones revelan patrones relevantes para el diseño de sistemas multi-agente de manera más amplia.

### Preguntas de Investigación

1. ¿Cómo se comportan los modelos de herencia de herramientas en práctica versus documentación?
2. ¿Qué patrones arquitectónicos emergen de las restricciones de topología de la plataforma?
3. ¿Cómo influyen las convenciones de nombres en el comportamiento de agentes en sistemas IA?

---

## 2. Análisis de Arquitectura de Plataforma

### 2.1 Taxonomía de Tipos de Componentes

Los plugins de Claude Code soportan cinco tipos de extensión distintos, cada uno con diferentes mecanismos de activación y scope:

| Componente | Activador | Invocación | Scope |
|-----------|---------|------------|-------|
| Skills | Auto (Claude decide) | Implícita | Cross-producto |
| Commands | Usuario (`/sintaxis`) | Explícita | Claude Code |
| Agents | Spawn (herramienta Task) | Explícita/Implícita | Claude Code |
| Hooks | Eventos | Automática | Claude Code |
| MCPs | Llamadas a herramientas | Explícita | Claude Code |

**Observación Clave**: Los Skills son únicos en ser cross-producto (funcionales en web UI, API, y CLI), mientras todos los otros componentes son específicos de Claude Code. Esto sugiere que diferentes modelos de herencia pueden aplicarse a diferentes tipos de componentes.

### 2.2 Inventario de Herramientas

La plataforma provee 15 herramientas built-in disponibles para agentes:

1. Read, Write, Edit, MultiEdit (operaciones de archivo)
2. Glob, Grep, LS (operaciones de búsqueda)
3. Bash (comandos de sistema)
4. WebFetch, WebSearch (acceso web)
5. NotebookRead, NotebookEdit (soporte Jupyter)
6. TodoRead, TodoWrite (seguimiento de tareas)
7. exit_plan_mode (control de flujo de trabajo)

Adicionalmente, los servidores MCP (Model Context Protocol) proveen integraciones de servicios externos—acceso a bases de datos, conexiones API, servicios de terceros.

### 2.3 Eventos de Ciclo de Vida

Nueve eventos de hook definen el ciclo de vida del agente:

| Evento | Activador |
|-------|---------|
| PreToolUse | Antes de cualquier ejecución de herramienta |
| PostToolUse | Después de ejecución de herramienta |
| UserPromptSubmit | Mensaje de usuario recibido |
| Stop | Completación de agente |
| SubagentStop | Completación de subagente |
| SessionStart | Inicialización de sesión |
| SessionEnd | Terminación de sesión |
| PreCompact | Antes de compactación de contexto |
| Notification | Notificación del sistema |

Los códigos de salida de hooks siguen convenciones Unix: 0 para éxito, 2 para errores bloqueantes (Claude procesa stderr), otros códigos para errores no bloqueantes.

---

## 3. Hallazgos Clave

### 3.1 La Paradoja de la Herencia

**Afirmación de Documentación**:
> "Herramientas MCP: Los subagentes pueden acceder a herramientas MCP de servidores MCP configurados. Cuando el campo tools se omite, los subagentes heredan todas las herramientas MCP disponibles para el hilo principal."

**Comportamiento Observado**: Los subagentes definidos en plugins no pueden acceder a herramientas MCP bajo ninguna configuración probada.

Esta discrepancia está documentada en cuatro issues de GitHub (#13605, #15810, #14496, #7296), cada uno describiendo una manifestación diferente de fallo de herencia de scope:

| Issue | Modo de Fallo | Contexto de Scope |
|-------|-------------|---------------|
| #13605 | Agentes de plugin no pueden acceder a MCP | Plugin vs built-in |
| #15810 | Subagentes no heredan MCP | Jerarquía padre-hijo |
| #14496 | Prompts complejos rompen acceso MCP | Complejidad de prompt |
| #7296 | Agentes lanzados con Task carecen de MCP | Herencia de scope de usuario |

**Análisis**: El patrón sugiere un problema arquitectónico fundamental en lugar de bugs aislados. La herencia de herramientas opera diferentemente a través de límites de scope:

1. **Agentes built-in** heredan herramientas MCP correctamente
2. **Agentes definidos en plugins** no heredan herramientas MCP
3. **Agentes lanzados con Task** reciben un scope fresco sin configuraciones de nivel de usuario

**Implicación para Diseño de Frameworks**: Los modelos de herencia implícita de herramientas requieren contratos explícitos en límites de scope. Asumir que las herramientas se propagan a través de jerarquías de agentes crea dependencias frágiles. Las declaraciones explícitas de herramientas en cada nivel de scope, aunque verbose, producen comportamiento predecible.

### 3.2 Restricciones de Topología y Patrones Emergentes

**Descubrimiento**: La plataforma impone un límite de anidamiento de un solo nivel para spawn de agentes.

{{ blocked_flow(nodes="Agente,Subagente", blocked="Subsubagente") }}

Cuando un agente intenta spawnear un subagente anidado, la plataforma retorna:

```
Error: Subagents cannot spawn subagents
```

**Justificación de Diseño (Inferida)**:
- Previene recursión infinita en sistemas autónomos
- Mantiene consumo de recursos acotado
- Asegura topología de ejecución predecible
- Simplifica debugging y monitoreo

**Arquitectura Emergente: Hub-and-Spoke**

{{ hub_spoke(hub="Agente Principal", spokes="Agente 1,Agente 2,Agente 3") }}

Esta restricción elimina jerarquías de agentes en estructura de árbol en favor de topologías planas coordinadas por hub. El agente "hub" coordina ejecución paralela de agentes "spoke". Ningún spoke puede spawnear agentes adicionales.

**Trade-off Observado**:

| Capacidad Perdida | Propiedad Ganada |
|-----------------|-----------------|
| Descomposición recursiva | Profundidad de ejecución acotada |
| Jerarquía dinámica | Topología predecible |
| Anidamiento arbitrario | Gestión de recursos simplificada |

**Implicación para Diseño de Frameworks**: Las restricciones de topología son decisiones de diseño, no meras limitaciones. El patrón hub-and-spoke que emerge del anidamiento de un solo nivel produce sistemas más fáciles de razonar, depurar, y monitorear que estructuras recursivas arbitrarias.

### 3.3 Naming como Comportamiento

**Descubrimiento**: Claude Code infiere comportamiento de agente a partir de nombres de agentes.

Un agente llamado `code-reviewer` activa comportamientos de revisión built-in que pueden sobrescribir instrucciones personalizadas del system prompt. La plataforma aplica heurísticas basadas en convenciones de nombres.

**Patrón Observado**:

| Nombre de Agente | Comportamiento Inferido |
|------------|------------------|
| `code-reviewer` | Patrones genéricos de revisión de código |
| `test-writer` | Patrones de generación de tests |
| `implementation-planner` | Menos inferencia, más control personalizado |

**Análisis**: Esto representa un paradigma de "convención sobre configuración" aplicado a sistemas de agentes IA. La plataforma asume que nombres semánticamente significativos llevan intención de comportamiento.

**Implicaciones**:
1. Las convenciones de nombres se convierten en requisitos funcionales
2. Nombres distintivos, no genéricos preservan comportamiento personalizado
3. El diseño de sistemas de agentes debe considerar inferencia basada en nombres

---

## 4. Patrones Emergentes

### 4.1 Separación I/O (Arquitectura Híbrida)

En respuesta a las limitaciones de acceso MCP, emergió un patrón arquitectónico claro: separar operaciones de I/O de operaciones de inteligencia.

**Modelo de Capas**:

| Capa | Responsabilidades | Componentes |
|-------|-----------------|------------|
| I/O | Acceso MCP, operaciones de archivo, interacción con usuario, caché | Commands |
| Inteligencia | Razonamiento, análisis, formateo, decisiones | Agents |

**Ejemplo de Pipeline de 6 Fases**:

{% pipeline() %}
[
    {"phase": 0, "owner": "Command", "label": "Disponibilidad", "io": "external"},
    {"phase": 1, "owner": "Command", "label": "Resolver Datos", "io": "external"},
    {"phase": 2, "owner": "Command", "label": "Cargar Contenido", "io": "local"},
    {"phase": 3, "owner": "Command", "label": "Validación", "io": "external"},
    {"phase": 4, "owner": "Agent", "label": "Razonamiento", "io": "none"},
    {"phase": 5, "owner": "Agent", "label": "Formateo", "io": "none"},
    {"phase": 6, "owner": "Command", "label": "Entrega", "io": "external"}
]
{% end %}

**Generalizabilidad**: Esta separación aplica a cualquier framework donde existan restricciones de acceso a herramientas. La capa de inteligencia se vuelve portable y testeable en aislamiento. La capa de I/O se convierte en el adaptador específico de plataforma.

### 4.2 Validación Basada en Fases

Cada transición de fase representa un checkpoint de validación:

| Checkpoint | Validación |
|------------|------------|
| Pre-fase | Verificación de contrato de entrada |
| Mid-fase | Checkpoint de progreso |
| Post-fase | Cumplimiento de contrato de salida |
| Inter-fase | Validación de transformación de datos |

**Estrategias de Recuperación de Errores**:
1. Rollback al último estado válido
2. Reintentar con parámetros modificados
3. Escalar a modo fallback
4. Preservar resultados parciales

### 4.3 Degradación Graciosa

**Patrón FALLBACK_MODE**:

Cuando los servicios externos se vuelven no disponibles, el sistema degrada graciosamente:

{{ comparison(mode1_title="Modo Normal", mode1_steps="Fase 1: Resolver MCP,Fase 3: Verificar Dups,Fase 6: Crear Issue", mode2_title="Modo Fallback", mode2_steps="Fase 1: Saltar,Fase 3: Saltar,Fase 6: Archivo Local", shared_title="Capa de Inteligencia (Siempre Activa)", shared_steps="Fase 4: Razonamiento,Fase 5: Formateo") }}

Las capas de inteligencia (Fases 4-5) funcionan idénticamente en ambos modos. El razonamiento core se preserva incluso cuando las capacidades de I/O están reducidas.

---

## 5. Implicaciones para Diseño de Frameworks

### 5.1 Filosofía de Acceso a Herramientas

**Recomendación**: Preferir declaraciones explícitas de herramientas sobre herencia implícita.

La paradoja de la herencia demuestra que los modelos implícitos crean límites de scope inesperados. Las declaraciones explícitas, aunque verbose, producen comportamiento predecible:

```yaml
# Explícito (recomendado)
tools:
  - Read
  - Write
  - Grep

# Implícito (problemático)
tools: inherit  # Comportamiento varía por contexto
```

### 5.2 Fidelidad de Documentación

**Requisito**: La implementación debe coincidir con la documentación.

La brecha entre comportamiento documentado y real de MCP consumió esfuerzo significativo de debugging. Pruebas automatizadas de comportamientos documentados captarían tales discrepancias antes de que lleguen a usuarios.

### 5.3 Testing en Contextos Reales

**Requisito**: Probar con restricciones reales de plataforma.

El acceso MCP funciona en testing aislado pero falla en contextos de plugin. Los tests de integración deben ejecutarse en ambientes similares a producción con límites de scope reales.

### 5.4 Consideraciones de Experiencia de Desarrollador

**Observación**: Los requisitos complejos de deployment desalientan la experimentación.

El requisito de sincronización en tres ubicaciones, falta de hot reload, y validación estricta de schema añaden fricción al ciclo de desarrollo. Cada restricción añade aproximadamente 2-5 minutos por ciclo de cambio versus segundos para sistemas con hot-reload.

**Análisis de Trade-off**:

| Restricción | Beneficio | Costo |
|------------|---------|------|
| Sync en tres ubicaciones | Consistencia de versión | Overhead de sync manual |
| Sin hot reload | Predictabilidad de estado | Delay de reinicio |
| Schema estricto | Detección temprana de errores | Dificultad de debugging |

---

## 6. Conclusión

### Resumen de Contribuciones

Este estudio empírico del desarrollo de plugins de Claude Code revela patrones aplicables al diseño de sistemas IA multi-agente:

1. **La Paradoja de la Herencia**: Los modelos de herencia de acceso a herramientas documentados en especificaciones pueden no funcionar a través de todos los límites de scope. Los contratos explícitos previenen comportamiento inesperado.

2. **Arquitectura Impulsada por Topología**: Las restricciones impuestas por plataforma (como anidamiento de un solo nivel) impulsan la emergencia de patrones específicos (hub-and-spoke) que pueden ser superiores a diseños sin restricciones.

3. **Naming como Comportamiento**: En sistemas de agentes IA, las convenciones de nombres llevan implicaciones funcionales más allá del etiquetado.

4. **Separación I/O**: Separar I/O de inteligencia crea sistemas portables, testeables, con degradación graciosa.

### Limitaciones

Este estudio está basado en observaciones de una sola plataforma (Claude Code) durante un período específico de desarrollo. Los hallazgos pueden no generalizarse a todos los frameworks de agentes. Adicionalmente, el comportamiento de la plataforma puede cambiar a medida que se resuelven bugs.

### Direcciones Futuras de Investigación

1. Análisis comparativo de modelos de herencia de herramientas a través de plataformas de agentes
2. Especificación formal de contratos de scope para sistemas multi-agente
3. Estudios empíricos de acoplamiento naming-comportamiento en otros sistemas IA
4. Patrones de diseño de frameworks que explícitamente aprovechan restricciones de topología

---

## Apéndice: Resumen de Evidencia

### Issues de GitHub Referenciados

| Issue | Descripción |
|-------|-------------|
| #13605 | Agentes de plugin personalizados no pueden acceder a MCP |
| #15810 | Subagentes no heredan MCP de agentes definidos en plugins |
| #14496 | Acceso inconsistente a MCP con prompts complejos |
| #7296 | Fallo de herencia de scope para agentes lanzados con Task |

### Métricas de Investigación

- **Período de Observación**: Enero 3-4, 2026
- **Inversión de Tokens**: ~265,000 tokens a través de sesiones
- **Observaciones Distintas**: 13 hallazgos documentados
- **Tipos de Hallazgo**: 4 Decisiones, 8 Descubrimientos, 1 Cambio

### Metodología

Las observaciones fueron recolectadas a través de sesiones de desarrollo usando el sistema de memoria persistente claude-mem. Cada hallazgo fue cruzado contra documentación y, donde aplicable, reportes de issues de GitHub. Los workarounds fueron desarrollados a través de experimentación iterativa.

---

## Obtén el Plugin

El plugin discutido en esta investigación es open source: [Cpicon/claude-code-plugins](https://github.com/Cpicon/claude-code-plugins)

Usa la pestaña [GitHub Issues](https://github.com/Cpicon/claude-code-plugins/issues) para solicitar features, reportar bugs, o discutir mejoras.

---

**Navegación de la Serie:**
- **Parte 0**: [Agent Team Creator](/posts/claude-code-plugin-journey-part0/) — Qué hace el plugin y cómo usarlo
- **Parte 1**: [El Patrón de Arquitectura Híbrida](/posts/claude-code-plugin-journey-part1/) — Construyendo el plugin, lecciones aprendidas
- **Parte 2** (Estás aquí): Insights de investigación, patrones

---

*Este artículo está basado en observaciones empíricas del desarrollo del plugin agent-team-creator de Claude Code. Para guía práctica de implementación, ve Parte 1.*
