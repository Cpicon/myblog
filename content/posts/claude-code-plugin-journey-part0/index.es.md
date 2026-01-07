+++
title = "Claude Code Plugin Journey Parte 0: Agent Team Creator"
date = 2026-01-06T10:00:00
weight = 1

[taxonomies]
categories = ["Ingeniería de IA"]
tags = ["Claude Code", "Plugins", "Productividad", "Agentes IA"]
+++

# Claude Code Plugin Journey Parte 0: Agent Team Creator

¿Qué pasaría si pudieras apuntar una IA a tu proyecto y hacer que genere especialistas que realmente entienden tu stack? No asistentes genéricos—agentes que conocen tu arquitectura, tus patrones, tus convenciones.

Eso es lo que hace `agent-team-creator`. Déjame mostrarte el flujo de trabajo.

<!-- more -->

---

## Escenario 1: Genera tu Equipo de Agentes

Comienzas un nuevo proyecto—o te unes a uno existente. El código base es desconocido. Necesitas ayuda, pero los consejos genéricos de IA no son suficientes.

**Paso 1: Genera tu equipo de agentes**

```
/generate-agent-team
```

Observa cómo el plugin analiza tu proyecto:

```
Analizando código base...
├── Lenguajes: Python (75%), TypeScript (20%), SQL (5%)
├── Frameworks: FastAPI, React, SQLAlchemy
├── Arquitectura: Monorepo con separación backend/frontend
├── Patrones: Patrón repository, inyección de dependencias

Generando agentes especializados...

✓ fastapi-expert
  Conoce: Tus patrones de endpoints, modelos Pydantic, stack de middleware

✓ react-specialist
  Conoce: Tu librería de componentes, gestión de estado, patrones de hooks

✓ database-architect
  Conoce: Tus modelos SQLAlchemy, patrones de migración, convenciones de consultas

✓ test-strategist
  Conoce: Tus fixtures de pytest, patrones de mocking, utilidades de testing

Equipo guardado en .claude/agents/
```

**Paso 2: Usa tus agentes inmediatamente**

Ahora tienes especialistas conscientes del proyecto. Así es como usarlos:

**Pregunta sobre arquitectura:**

```
Usa el agente fastapi-expert para explicar cómo funciona
la autenticación en este proyecto
```

**Implementa una funcionalidad:**

```
Usa el agente react-specialist para ayudarme a añadir un nuevo
componente de dashboard siguiendo nuestros patrones existentes
```

**Depura un problema:**

```
Usa el agente database-architect para ayudarme a entender por qué
esta consulta es lenta - revisa src/repositories/user_repo.py
```

**Escribe tests:**

```
Usa el agente test-strategist para escribir tests de integración para
el nuevo endpoint de pagos siguiendo nuestras convenciones de testing
```

**¿La diferencia?** Estos agentes no dan consejos genéricos. Referencian *tus* archivos, *tus* patrones, *tus* convenciones.

---

## Escenario 2: Flujo de Trabajo Avanzado de Depuración

Después de generar tu equipo de agentes, puedes crear un **Project Debugger**—un orquestador que coordina a tus especialistas para diagnosticar problemas complejos.

**Paso 1: Genera el Project Debugger**

```
/generate-debugger
```

```
Descubriendo agentes del proyecto...
├── Encontrados: fastapi-expert, react-specialist, database-architect, test-strategist

Analizando arquitectura del proyecto...
├── Puntos de entrada identificados
├── Patrones de manejo de errores mapeados
├── Convenciones de logging detectadas

Generando project-debugger.md...

✓ Creado: .claude/agents/project-debugger.md
  - Orquesta tus 4 agentes especialistas
  - Produce informes de depuración estructurados
  - Identifica causas raíz con referencias archivo:línea
```

**Paso 2: Usa el Debugger para investigar**

Cuando encuentres un bug, invoca el project debugger:

```
Usa el agente project-debugger para investigar: Los usuarios están
recibiendo errores 500 cuando envían el formulario de checkout
```

El debugger orquesta a tus especialistas:

```
Consultando fastapi-expert...
├── Trazado flujo de request a través de api/routes/checkout.py
├── Encontrado: PaymentService.process() lanza excepción no manejada

Consultando database-architect...
├── Verificado manejo de transacciones en repositories/order_repo.py
├── Encontrado: Falta rollback en fallo de pago

Consultando test-strategist...
├── Revisada cobertura de tests para flujo de checkout
├── Encontrado: No hay test para escenario de fallo de pago

Generando informe de depuración...
```

**Paso 3: Genera un informe de depuración**

El debugger produce un informe estructurado guardado en `.claude/reports/debugging/`:

```markdown
# Informe de Depuración: Errores 500 en Checkout

## Causa Raíz
Falta manejo de excepciones en PaymentService.process()
(src/services/payment.py:45) combinado con falta de
rollback de transacción (src/repositories/order_repo.py:78)

## Evidencia
- Archivo: src/services/payment.py:45-52
- Archivo: src/repositories/order_repo.py:78-85
- Test faltante: tests/integration/test_checkout.py

## Corrección Recomendada
1. Añadir try/except en payment.py:45
2. Implementar rollback en order_repo.py:78
3. Añadir test de escenario de fallo

## Efectos Secundarios
- Los pedidos pueden estar en estado inconsistente (necesita migración)
```

**Paso 4: Crea un ticket de Jira desde el informe**

Ahora convierte ese informe en una tarea de Jira. El comando encuentra automáticamente el informe de depuración más reciente:

```
/generate-jira-task
```

```
Buscando último informe de depuración...
├── Encontrado: .claude/reports/debugging/report-2026-01-06-1430.md

Cargando informe de depuración...

Buscando issues similares...
├── Buscando: "checkout payment exception rollback"
├── Encontrados 2 issues potencialmente relacionados:

  PROJ-234: "Payment processing timeout errors"
           Estado: En Progreso

  PROJ-189: "Checkout form validation issues"
           Estado: Hecho

¿Cómo deseas proceder?
> Crear nueva tarea de todos modos
> Abortar - Actualizaré un issue existente
```

Si eliges crear una nueva tarea:

```
Creando issue de Jira...
✓ Creado: PROJ-456 "Fix checkout 500 errors: missing exception handling"
  https://yourcompany.atlassian.net/browse/PROJ-456
```

La verificación de duplicados previene llenar tu backlog con issues relacionados. Si el bug es una variante de un issue existente, puedes actualizar ese ticket en lugar de crear uno nuevo.

**¿No tienes Jira configurado?** El comando degrada gracefully a generar un archivo markdown listo para copiar en `.claude/reports/jira-drafts/`.

---

## Escenario 3: Flujo de Trabajo Repetible para Múltiples Bugs

Cada investigación de bug crea su propio informe de depuración, que lleva a su propio ticket de Jira. Así es como el flujo escala a través de múltiples issues:

**Lunes: Problema de rendimiento de API**

```
Usa el agente project-debugger para investigar: ¿Por qué están
subiendo los tiempos de respuesta de la API durante horas pico?
```

Informe guardado: `.claude/reports/debugging/report-2026-01-06-0900.md`

```
/generate-jira-task
```

Creado: `PROJ-457 "Optimize database connection pooling for peak load"`

---

**Martes: Bug de renderizado en frontend**

```
Usa el agente project-debugger para investigar: El gráfico del
dashboard no se actualiza cuando llegan nuevos datos
```

Informe guardado: `.claude/reports/debugging/report-2026-01-07-1100.md`

```
/generate-jira-task
```

Creado: `PROJ-458 "Fix React state synchronization in DashboardChart component"`

---

**Miércoles: Caso edge de autenticación**

```
Usa el agente project-debugger para investigar: Los usuarios están
siendo deslogueados aleatoriamente después de cambios de contraseña
```

Informe guardado: `.claude/reports/debugging/report-2026-01-08-1400.md`

```
/generate-jira-task
```

Creado: `PROJ-459 "Handle session invalidation on password change correctly"`

---

Cada investigación es independiente. El debugger crea informes con timestamp, y `/generate-jira-task` siempre toma el más reciente. Tu historial de depuración se acumula en `.claude/reports/debugging/`, dándote un archivo buscable de investigaciones pasadas.

---

## El Flujo de Trabajo Completo

{{ workflow(steps="/generate-agent-team|Crea agentes especialistas,Usa agentes diariamente|fastapi-expert react-specialist,/generate-debugger|Crea project-debugger,Depura issues|Guarda en .claude/reports/,/generate-jira-task|Crea ticket de Jira") }}

---

## Inicio Rápido

### Instalación

Instala directamente desde el marketplace de GitHub—no requiere clonar:

```bash
# Añade el marketplace (configuración única)
/plugin marketplace add Cpicon/claude-code-plugins

# Instala el plugin
/plugin install agent-team-creator
```

Eso es todo. El plugin está listo para usar inmediatamente.

### Primeros Comandos

1. Navega a tu proyecto
2. Ejecuta `/generate-agent-team` para crear tus agentes especialistas
3. Comienza a usar tus especialistas: `Usa el agente [nombre-agente] para...`
4. Ejecuta `/generate-debugger` para crear tu project debugger
5. Usa el debugger para investigar bugs: `Usa el agente project-debugger para investigar...`
6. Ejecuta `/generate-jira-task` para convertir el informe de depuración en un ticket

---

## Lo Que Obtienes

| Comando                  | Salida                  | Valor                                                 |
| ------------------------ | ----------------------- | ----------------------------------------------------- |
| `/generate-agent-team` | 3-6 agentes especialistas | Ayuda consciente del proyecto para features, preguntas, depuración |
| `/generate-debugger`   | Agente orquestador      | Coordina especialistas para investigaciones complejas    |
| `/generate-jira-task`  | Ticket Jira o markdown  | Auto-encuentra último informe, crea ticket accionable   |

### Ahorro de Tiempo

| Tarea                   | Antes                  | Después            |
| ----------------------- | ---------------------- | ------------------ |
| Obtener ayuda consciente del proyecto | N/A (solo genérico)     | Inmediato          |
| Depurar issues complejos   | Horas de investigación | Informes estructurados |
| Escribir tickets de Jira     | 15-30 min              | 2-5 min            |

---

## Pruébalo Tú Mismo

El plugin es open source y está disponible en GitHub: [Cpicon/claude-code-plugins](https://github.com/Cpicon/claude-code-plugins)

Instálalo con dos comandos, ejecuta `/generate-agent-team`, y observa qué especialistas emergen para tu proyecto.

### Contribuir y Feedback

¿Tienes ideas para mejoras? ¿Encontraste un bug? La pestaña [GitHub Issues](https://github.com/Cpicon/claude-code-plugins/issues) es donde puedes:

- **Solicitar features** — Sugerir nuevas capacidades o mejoras
- **Reportar bugs** — Ayudar a mejorar la fiabilidad reportando issues que encuentres
- **Discutir mejoras** — Compartir ideas para mantenimiento y desarrollo del plugin

Tu feedback da forma al roadmap del plugin.

En la [Parte 1](/posts/claude-code-plugin-journey-part1/), te mostraré cómo construí este plugin—los bugs que encontré, los patrones que descubrí, y por qué la arquitectura funciona como lo hace.

---

**Navegación de la Serie:**

- **Parte 0** (Estás aquí): Qué hace el plugin y cómo usarlo
- **Parte 1**: [El Patrón de Arquitectura Híbrida](/posts/claude-code-plugin-journey-part1/) — Construyendo el plugin
- **Parte 2**: [La Paradoja de la Herencia](/posts/claude-code-plugin-journey-part2/) — Insights de investigación
