+++
title = "El Patrón de Arquitectura Híbrida: Lecciones de agent-team-creator"
date = 2026-01-06T11:00:00
weight = 2

[taxonomies]
categories = ["Ingeniería de IA"]
tags = ["Claude Code", "Plugins", "Agentes IA", "Arquitectura Híbrida"]
+++

# El Patrón de Arquitectura Híbrida: Lecciones de agent-team-creator

> *Esta es la Parte 1 de una serie de tres partes. Comienza con [Parte 0: Agent Team Creator](/posts/claude-code-plugin-journey-part0/) para ver qué hace el plugin, o continúa aquí para el viaje de desarrollo.*

Pensé que construir un plugin de Claude Code tomaría un fin de semana. Tres días después de luchar con bugs de acceso a herramientas MCP, sincronización de archivos en tres ubicaciones, y documentación que prometía features que no funcionaban, me di cuenta de que estaba construyendo algo más valioso que un plugin—estaba mapeando territorio inexplorado.

Esta es la historia de construir **agent-team-creator**, un plugin de Claude Code que analiza códigos base y genera agentes IA específicos del proyecto. En el camino, descubrí un patrón que convirtió las limitaciones de la plataforma en claridad arquitectónica: el **Patrón de Arquitectura Híbrida**.

<!-- more -->

---

## Acto I: La Configuración

### La Visión

La idea era simple: analizar cualquier código base y generar automáticamente un equipo de agentes Claude Code especializados adaptados a ese proyecto. ¿Un frontend React? Genera un agente diseñador de componentes. ¿Un pipeline ML de Python? Spawn un agente entrenador de modelos. El plugin entendería tu código y crearía colaboradores IA que hablan el lenguaje de tu proyecto.

Había leído la documentación. Los plugins de Claude Code soportan cinco tipos de componentes—commands, agents, skills, hooks, e integraciones MCP. Los agentes pueden spawnear subagentes usando la herramienta Task. Los servidores MCP proveen acceso a servicios externos. Parecía directo.

Esto es lo que esperaba versus lo que encontré:

| Expectativa | Realidad |
|-------------|---------|
| Los agentes de plugin pueden acceder a herramientas MCP | Los agentes de plugin **no pueden** acceder a MCP (bug documentado) |
| Los agentes pueden spawnear subagentes anidados | Solo un nivel de anidamiento |
| La documentación describe el comportamiento real | Los docs dicen que MCP funciona, pero no lo hace |
| Los cambios se propagan automáticamente | Se requiere sincronización manual en 3 ubicaciones |
| La herencia de modelo funciona | Por defecto usa Sonnet 4 sin importar la configuración |

La brecha entre expectativa y realidad se convertiría en mi currículo.

### Entendiendo el Terreno

Antes de profundizar en los puntos de dolor, déjame compartir el panorama. Los plugins de Claude Code tienen cinco tipos de componentes, cada uno con mecanismos de activación distintos:

| Componente | Activador | Propósito |
|-----------|---------|---------|
| **Skills** | Auto-invocados | Proveedores de contexto basados en matching de descripción |
| **Commands** | Iniciado por usuario (`/command`) | Atajos de comandos slash |
| **Agents** | Spawneados via herramienta Task | Instancias separadas de Claude para trabajo especializado |
| **Hooks** | Basados en eventos | Handlers de automatización (PreToolUse, PostToolUse, etc.) |
| **MCPs** | Llamadas a herramientas | Integraciones de servicios externos |

La estructura de directorios sigue un patrón predecible:

{{ tree(root="plugin-root", nodes=".claude-plugin/:marketplace.json;plugin.json,commands/:*.md,agents/:*.md,skills/:SKILL.md,hooks/:*.md,.mcp.json:config") }}

Armado con este conocimiento, construí mi primer prototipo. Funcionó—más o menos. Los commands se ejecutaron. Los agentes se spawnearon. Y entonces todo empezó a romperse de formas que la documentación no me preparó.

---

## Acto II: El Descenso

### Punto de Dolor #1: El Bug de Acceso a Herramientas MCP

Mi plugin agent-team-creator necesitaba integrarse con Jira. El plugin MCP de Atlassian estaba instalado y funcionando perfectamente en la sesión principal de Claude Code. Siguiendo la documentación, configuré mi agente de plugin para acceder a estas herramientas MCP.

El error fue inmediato y confuso:

```
Error: No such tool available: mcp__plugin_atlassian__getJiraIssue
```

Pasé horas depurando. ¿Estaba mal mi configuración? ¿Nombré mal la herramienta? Entonces los encontré—cuatro issues de GitHub documentando el mismo problema:

| Issue | Descripción |
|-------|-------------|
| #13605 | Los subagentes de plugin personalizados no pueden acceder a herramientas MCP |
| #15810 | Los subagentes no heredan herramientas MCP de agentes definidos en plugins |
| #14496 | Acceso inconsistente a MCP con prompts complejos |
| #7296 | Fallo de herencia de scope para agentes lanzados con Task |

La documentación decía:

> "Cuando el campo tools se omite, los subagentes heredan todas las herramientas MCP disponibles para el hilo principal."

La realidad discrepaba. Los agentes definidos en plugins viven en un scope diferente—pueden ver las herramientas MCP listadas en la sesión principal, pero no pueden invocarlas.

---

**★ Momento de Enseñanza: La Realidad del Scope MCP**

Las herramientas MCP funcionan confiablemente en dos contextos:
1. La sesión principal de Claude Code
2. Commands (que corren en el scope de la sesión principal)

Las herramientas MCP **no funcionan** en:
- Agentes definidos en plugins spawneados via herramienta Task
- Subagentes de cualquier tipo

Si tu plugin necesita acceso a servicios externos, tus **commands** deben manejarlo, no tus agentes.

---

### Punto de Dolor #2: Infierno de Sincronización en Tres Ubicaciones

Después de modificar mis definiciones de agentes, recargué Claude Code. Mis cambios no estaban ahí. Edité de nuevo. Todavía nada.

Resulta que los plugins de Claude Code existen en tres ubicaciones separadas que deben sincronizarse manualmente:

| Ubicación | Ruta | Propósito |
|----------|------|---------|
| Fuente Marketplace | `~/.claude/local-marketplace/` | Donde editas |
| Plugin Instalado | `~/.claude/plugins/plugin-name/` | Donde Claude lee |
| Cache | `~/.claude/plugins/cache/marketplace/plugin/version/` | Backup versionado |

No hay hot reload. No hay auto-sync. Editas en un lugar, pero Claude lee de otro.

¿La solución? Un script de sincronización:

```bash
#!/bin/bash
PLUGIN_NAME="agent-team-creator"
MARKETPLACE="$HOME/.claude/local-marketplace"
INSTALLED="$HOME/.claude/plugins/$PLUGIN_NAME"
CACHE="$HOME/.claude/plugins/cache/local-marketplace/$PLUGIN_NAME/1.0.0"

rsync -av "$MARKETPLACE/commands/" "$INSTALLED/commands/"
rsync -av "$MARKETPLACE/commands/" "$CACHE/commands/"
rsync -av "$MARKETPLACE/agents/" "$INSTALLED/agents/"
rsync -av "$MARKETPLACE/agents/" "$CACHE/agents/"
echo "Plugin sincronizado en todas las ubicaciones"
```

Después de cada cambio: sync, cerrar Claude Code, reiniciar. Esto se volvió memoria muscular.

---

**★ Momento de Enseñanza: Depurando Tu Plugin**

Cuando las cosas van mal, estos comandos son tus amigos:

```bash
# Verificar si el plugin está cargado
ls ~/.claude/plugins/

# Verificar sincronización del cache
diff -r ~/.claude/plugins/agent-team-creator/ \
        ~/.claude/plugins/cache/local-marketplace/agent-team-creator/1.0.0/

# Validar sintaxis de marketplace.json
cat ~/.claude/local-marketplace/.claude-plugin/marketplace.json | jq .

# Ver estructura del plugin
tree ~/.claude/plugins/agent-team-creator/
```

---

### Punto de Dolor #3: Problemas de Validación de Schema

Mi primer marketplace.json fue rechazado con errores crípticos:

```
owner: Expected object, received string
source: Invalid input
```

El schema es estricto y poco documentado. Esto es lo que funciona:

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "local-marketplace",
  "description": "Plugins locales para Claude Code",
  "owner": {
    "name": "Tu Nombre",
    "email": "tu@email.com"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "description": "Descripción del plugin",
      "version": "1.0.0",
      "author": {
        "name": "Nombre del Autor",
        "email": "author@email.com"
      },
      "source": "./",
      "category": "development"
    }
  ]
}
```

Trampas clave:
- `owner` debe ser un objeto con `name` y `email`, no un string
- `source` debe ser `"./"` con la barra diagonal
- Faltar cualquier campo requerido causa fallos silenciosos

---

## Acto III: El Descubrimiento

### La Brecha Documentación vs. Realidad

El punto de quiebre llegó cuando construí una arquitectura multi-agente completa basada en comportamiento documentado—solo para que fallara completamente.

Los docs prometían:

> "Herramientas MCP: Los subagentes pueden acceder a herramientas MCP de servidores MCP configurados."

Probé extensivamente. Los subagentes definidos en plugins **no pueden** acceder a herramientas MCP. Esto no es un problema de configuración—es un bug conocido rastreado en múltiples issues de GitHub.

**La lección**: La documentación representa comportamiento *intencionado*, no comportamiento *garantizado*. Siempre valida suposiciones empíricamente antes de construir arquitecturas dependientes.

### El Muro del Anidamiento

Mi diseño original tenía agentes spawneando sub-agentes especializados en una estructura de árbol recursivo. Elegante en teoría. Imposible en práctica.

Cuando intenté:

{{ blocked_flow(nodes="Usuario,Command,Agente,SubAgente", blocked="SubSubAgente") }}

Claude Code respondió:

```
Error: Subagents cannot spawn subagents
```

Este es un límite duro de la plataforma. Solo un nivel de anidamiento. La restricción existe por buenas razones—prevenir recursión infinita, mantener consumo de recursos acotado, asegurar ejecución predecible. Pero invalidó toda mi arquitectura.

### Herencia de Modelo que No Hereda

Configuré mis agentes para usar `model: inherit`, esperando que usaran cualquier modelo que usara la sesión padre. Cada subagente usó por defecto Sonnet 4, sin importar:
- Modelo padre
- Configuración global
- Configuración local
- Configuración explícita del agente

Otro descubrimiento: Claude Code infiere comportamiento del agente a partir del nombre. Un agente llamado "code-reviewer" activa comportamientos de revisión built-in que pueden sobrescribir tus instrucciones personalizadas. Nombrar no es solo etiquetar—es funcional.

---

## Acto IV: La Solución

### El Patrón de Arquitectura Híbrida

Las restricciones crían creatividad. Enfrentando bugs de acceso MCP, límites de anidamiento, y fallos de herencia de modelo, desarrollé lo que ahora llamo el **Patrón de Arquitectura Híbrida**.

La insight central: **Commands y Agents tienen capacidades diferentes. Usa cada uno para lo que hace bien.**

**Capa de Command (I/O)**:
- Acceso a herramientas MCP (funciona confiablemente)
- Operaciones de sistema de archivos
- Interacción con usuario (AskUserQuestion)
- Caché de respuestas
- Comunicación con servicios externos

**Capa de Agent (Inteligencia)**:
- Razonamiento y análisis puro
- Formateo de contenido
- Toma de decisiones
- Reconocimiento de patrones
- **Sin dependencias directas de I/O**

Los commands se convierten en adaptadores de I/O. Los agentes se convierten en motores de razonamiento. Ninguno intenta hacer el trabajo del otro.

### El Pipeline de 6 Fases

Así es como esto se manifiesta en mi comando `/generate-jira-task`:

{% pipeline() %}
[
    {"phase": 0, "owner": "Command", "label": "Verificar MCP", "io": "external"},
    {"phase": 1, "owner": "Command", "label": "Resolver Proyecto", "io": "external"},
    {"phase": 2, "owner": "Command", "label": "Cargar Informe", "io": "local"},
    {"phase": 3, "owner": "Command", "label": "Verificar Dups", "io": "external"},
    {"phase": 4, "owner": "Agent", "label": "Razonamiento", "io": "none"},
    {"phase": 5, "owner": "Agent", "label": "Formateo", "io": "none"},
    {"phase": 6, "owner": "Command", "label": "Salida", "io": "external"}
]
{% end %}

Los commands manejan toda la comunicación externa (nodos cyan). Los agentes manejan todo el pensamiento (nodos verdes). El límite es limpio—nota cómo las operaciones de I/O (marcadas EXTERNAL/LOCAL) se agrupan en la capa de Command.

### Degradación Graciosa

¿Qué pasa si MCP no está disponible? El patrón maneja esto elegantemente:

```
FALLBACK_MODE se activa cuando:
  - Plugin MCP de Atlassian no disponible

Acciones:
  - Saltar Fase 1 (resolución de proyecto)
  - Saltar Fase 3 (verificación de duplicados)
  - Fase 6: Output markdown a .claude/reports/jira-drafts/
```

La capa de inteligencia (Fases 4-5) funciona idénticamente ya sea conectada a Jira o no. La capa de I/O degrada graciosamente a output de archivo local.

---

**★ Momento de Enseñanza: Frontmatter de Command y Agent**

**Template de Command**:
```yaml
---
name: generate-jira-task
description: Generar tarea Jira desde informe de depuración
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
argument-hint: "[archivo-informe]"
---
```

**Template de Agent**:
```yaml
---
name: implementation-planner
description: |
  Usa este agente para analizar informes de depuración y crear planes de implementación.
model: inherit
color: cyan
tools:
  - Read
  - Grep
  - Glob
---
```

Nota: Los agentes **no** deben incluir herramientas MCP en su lista de tools—no funcionarán de todos modos.

---

## Acto V: El Retorno

### Lo Que Funciona Ahora

El plugin agent-team-creator ahora funciona confiablemente con tres commands:
- `/generate-agent-team` - Analiza códigos base y genera agentes especializados
- `/generate-debugger` - Crea agentes de depuración específicos del proyecto
- `/generate-jira-task` - Convierte informes de depuración a tareas Jira

Cada uno sigue el Patrón de Arquitectura Híbrida. Los commands manejan I/O. Los agentes manejan razonamiento. El sistema degrada graciosamente cuando los servicios no están disponibles.

### Lecciones Aprendidas

| Lección | Implicación |
|--------|-------------|
| Confía pero verifica documentación | Construye pruebas mínimas de concepto antes de comprometerte con arquitecturas |
| Las restricciones revelan claridad | El patrón híbrido es más limpio que mi diseño original sin restricciones |
| La sincronización es tu responsabilidad | Automatízala. Hazla memoria muscular. |
| Nombrar es funcional | Los nombres de agentes influencian el comportamiento de la plataforma |
| Explícito sobre implícito | Nunca asumas herencia de herramientas; declara todo |

### Checklist de Inicio Rápido para Nuevos Desarrolladores de Plugins

1. **Setup**: Crea estructura de marketplace con schema JSON apropiado
2. **Desarrolla**: Edita archivos solo en la fuente del marketplace
3. **Sync**: Ejecuta script rsync después de cada cambio
4. **Reinicia**: Cierra y reinicia Claude Code (no hay hot reload)
5. **Prueba**: Verifica disponibilidad del command con `/help`
6. **Depura**: Usa `diff -r` y `jq` para validación

La lección clave: **Commands para I/O, Agents para razonamiento**. Este patrón evita cada bug que encontré.

---

## Conclusión

Construir agent-team-creator me enseñó más sobre arquitectura de agentes IA que cualquier documentación podría. Los bugs no fueron obstáculos—fueron maestros. Las restricciones no fueron limitaciones—fueron principios de diseño disfrazados.

El Patrón de Arquitectura Híbrida emergió de la necesidad, pero ahora creo que es superior a diseños sin restricciones. Límites claros entre capas de I/O e inteligencia hacen sistemas más fáciles de probar, depurar, y extender. La degradación graciosa se vuelve natural cuando ya has separado concerns.

En la Parte 2 de esta serie, daré un paso atrás de los detalles prácticos y examinaré qué revelan estos descubrimientos sobre el diseño de frameworks de agentes más ampliamente. ¿Por qué los modelos de herencia se rompen en sistemas multi-agente? ¿Qué hace que la topología hub-and-spoke emerja naturalmente? ¿Y qué nos dice naming-as-behavior sobre sistemas IA en general?

Por ahora, si estás construyendo plugins de Claude Code: abraza las restricciones. Te enseñarán cosas que la documentación no puede.

---

## Obtén el Plugin

El plugin es open source: [Cpicon/claude-code-plugins](https://github.com/Cpicon/claude-code-plugins)

Usa la pestaña [GitHub Issues](https://github.com/Cpicon/claude-code-plugins/issues) para solicitar features, reportar bugs, o discutir mejoras.

---

**Navegación de la Serie:**
- **Parte 0**: [Agent Team Creator](/posts/claude-code-plugin-journey-part0/) — Qué hace el plugin y cómo usarlo
- **Parte 1** (Estás aquí): Construyendo el plugin, lecciones aprendidas
- **Parte 2**: [La Paradoja de la Herencia](/posts/claude-code-plugin-journey-part2/) — Insights de investigación, patrones

---

*Este post está basado en observaciones empíricas de construir el plugin agent-team-creator. Todos los puntos de dolor y soluciones fueron documentados a través de sesiones reales de desarrollo.*
