# Arnés de agentes SDD para opencode (modelos gratuitos)

Plantilla para programar con **[opencode](https://opencode.ai)** usando un
equipo de agentes coordinados y un flujo **SDD** (*Spec Driven Development*):
primero se escribe una especificación, un humano la aprueba, y solo entonces
los agentes escriben código y tests. Ninguna feature se da por terminada sin
tests verdes y sin que un revisor automático compruebe que cada requisito está
cubierto por un test.

Viene configurada para funcionar **sin pagar nada**, con los modelos gratuitos
de OpenCode Zen.

> 🔀 **Hay dos versiones de esta plantilla:**
> - **Esta**, para opencode y modelos gratuitos.
> - [`harness-agentes-sdd-claude-code`](https://github.com/marcomartinez-fueib/harness-agentes-sdd-claude-code),
>   la original para Claude Code.
>
> El flujo, las specs, el backlog y la documentación son idénticos; solo
> cambia la capa que conecta con la herramienta.

---

## Índice

1. [La idea en 30 segundos](#la-idea-en-30-segundos)
2. [Requisitos](#requisitos)
3. [Puesta en marcha](#puesta-en-marcha)
4. [Modelos gratuitos](#modelos-gratuitos)
5. [Tu primera feature, paso a paso](#tu-primera-feature-paso-a-paso)
6. [Qué hay en el repo](#qué-hay-en-el-repo)
7. [Los cuatro agentes](#los-cuatro-agentes)
8. [El flujo SDD y los estados](#el-flujo-sdd-y-los-estados)
9. [Las specs: EARS, design y tasks](#las-specs-ears-design-y-tasks)
10. [Las redes de seguridad](#las-redes-de-seguridad)
11. [Adaptarlo a tu proyecto](#adaptarlo-a-tu-proyecto)
12. [Consejos (sobre todo con modelos gratuitos)](#consejos-sobre-todo-con-modelos-gratuitos)
13. [Preguntas frecuentes](#preguntas-frecuentes)

---

## La idea en 30 segundos

```
            tú: "implementa la siguiente feature"
                          │
                          ▼
                  ┌───────────────┐
                  │    leader     │  agente primario: coordina, NO puede tocar src/ ni tests/
                  └───────┬───────┘
                          │  (herramienta task)
        ┌─────────────────┼──────────────────────────────┐
        ▼                 ▼                              ▼
 ┌─────────────┐   ⏸ TÚ APRUEBAS     ┌─────────────┐   ┌──────────┐
 │ spec_author │ ─► el spec ───────► │ implementer │ ─►│ reviewer │
 └─────────────┘                     └─────────────┘   └──────────┘
 requirements.md                      código + tests    APPROVED /
 design.md                            tasks [x]         CHANGES_REQUESTED
 tasks.md
```

Tres principios sostienen todo:

1. **El estado vive en archivos, no en la conversación.** El backlog está en
   `feature_list.json`, el progreso en `progress/` y las specs en `specs/`.
   Puedes cerrar opencode, volver mañana y retomar exactamente donde lo
   dejaste. Cualquier agente nuevo se orienta leyendo `AGENTS.md`.
2. **Separación de roles.** Quien coordina no implementa, quien implementa no
   se autoaprueba y quien revisa no arregla. En opencode estas reglas no son
   solo instrucciones: **los permisos de cada agente las imponen** (ver
   [Los cuatro agentes](#los-cuatro-agentes)).
3. **Demostrar, no afirmar.** "Debería funcionar" no vale. Lo único que cuenta
   es `./init.sh` en verde y cada requisito `R<n>` mapeado a un test concreto.

---

## Requisitos

- **opencode**: `curl -fsSL https://opencode.ai/install | bash`.
  Hay otras vías (`npm i -g opencode-ai`, `brew install sst/tap/opencode`…) en
  la [documentación](https://opencode.ai/docs/).
- Una cuenta de **OpenCode Zen** para los modelos gratuitos (ver
  [Modelos gratuitos](#modelos-gratuitos)).
- **Python 3.9+**, solo para el ejemplo; puedes cambiarlo por tu stack (ver
  [Adaptarlo](#adaptarlo-a-tu-proyecto)).
- **Git**.

---

## Puesta en marcha

```bash
# 1. Crea tu repo a partir de esta plantilla (botón "Use this template" en
#    GitHub) o clónalo directamente:
git clone https://github.com/marcomartinez-fueib/harness-agentes-sdd-opencode.git mi-proyecto
cd mi-proyecto

# 2. Comprueba que el entorno está sano (también activa el hook pre-push):
./init.sh
# → [OK] Entorno listo

# 3. Abre opencode en la carpeta:
opencode
```

La primera vez, dentro de opencode:

```
/connect
```

Elige **OpenCode Zen**, inicia sesión en <https://opencode.ai/auth>, copia la
API key y pégala.

Al arrancar, opencode carga solo lo siguiente:

- `opencode.json`: el modelo gratuito y el agente por defecto, que es `leader`.
- `AGENTS.md`: el mapa del repo, que reciben todos los agentes.
- `.opencode/agents/*.md`: los cuatro agentes.
- `.opencode/plugins/harness.ts`: los hooks de verificación. En el primer
  arranque instala `@opencode-ai/plugin` por su cuenta, gracias a
  `.opencode/package.json`.

> 💡 En la esquina inferior verás el agente activo, que debería ser `leader`.
> Con **Tab** cambias entre agentes primarios (`leader`, `build`, `plan`).
> Para trabajar con el arnés, quédate en `leader`.

---

## Modelos gratuitos

El repo usa por defecto `opencode/big-pickle`, el modelo gratuito más veterano
de OpenCode Zen. Se cambia en **una sola línea** de `opencode.json`:

```json
"model": "opencode/big-pickle"
```

Todos los agentes usan ese modelo: los subagentes heredan el del agente que
los lanza.

### Ver qué modelos gratuitos hay hoy

La lista de modelos gratuitos **cambia a menudo**: entran y salen modelos en
promoción. Consulta la lista vigente así:

```bash
opencode models opencode        # lista los modelos de OpenCode Zen
```

o en la tabla de precios de <https://opencode.ai/docs/zen/>, donde los
gratuitos aparecen a $0 y casi todos con el sufijo `-free`. Dentro de la TUI
también puedes cambiar de modelo con `/models`.

> ⚠️ **Privacidad.** Muchos modelos gratuitos son gratis porque el proveedor
> **usa tus prompts y tu código para mejorar el modelo**. La página de Zen
> indica, modelo a modelo, cuáles tienen retención cero. **No uses modelos
> gratuitos con código privado, credenciales ni datos personales.** Para
> proyectos de aprendizaje o personales no suele ser un problema.

> ℹ️ Según la documentación de Zen, el alta puede pedir datos de facturación
> aunque luego solo uses modelos a $0. Si no quieres darlos, lee la
> alternativa de abajo.

### Un modelo distinto por agente (opcional)

Puedes asignar un modelo concreto a un agente añadiendo `model:` en su
frontmatter, por ejemplo en `.opencode/agents/reviewer.md`:

```yaml
model: opencode/<otro-modelo-free>
```

Dos combinaciones útiles:

- **Un revisor con otro modelo distinto al implementador.** Así no comparten
  los mismos puntos ciegos.
- **Un modelo más fuerte para el `leader` y el `spec_author`.** Son los que más
  razonan; el implementador puede usar un modelo más rápido.

### Otras fuentes gratuitas

opencode admite más de 75 proveedores (`/connect`). Dos alternativas
gratuitas fuera de Zen:

- **OpenRouter**: tiene modelos con sufijo `:free`, con límites diarios. Por
  ejemplo `"model": "openrouter/<proveedor>/<modelo>:free"`.
- **Modelos locales con Ollama o LM Studio**: totalmente privados, pero hace
  falta una GPU decente. Necesitas un modelo con buen *tool calling*; los
  modelos pequeños suelen fallar con este flujo.

---

## Tu primera feature, paso a paso

El repo trae dos features de ejemplo en `feature_list.json`:

- `saludo` → ya está `done`. Mírala para ver cómo queda una feature terminada:
  `specs/saludo/`, `src/saludo.py`, `tests/test_saludo.py`,
  `progress/impl_saludo.md` y `progress/review_saludo.md`.
- `contador-palabras` → está `pending`. Es la que vas a hacer tú.

### 1. Pide la feature

Con el agente `leader` activo, escribe:

```
implementa la siguiente feature pendiente
```

El leader hace tres cosas:

1. Lee el backlog.
2. Ejecuta `./init.sh`.
3. Ve que `contador-palabras` está `pending` y lanza al **spec_author**.

El spec_author escribe tres archivos:

```
specs/contador-palabras/requirements.md   ← QUÉ (requisitos R1, R2… en EARS)
specs/contador-palabras/design.md         ← CÓMO (archivos, firmas, alternativas)
specs/contador-palabras/tasks.md          ← PASOS (T1, T2… cada uno cubre R<n>)
```

Después cambia el estado de la feature a `spec_ready`. El leader **se
detiene** y te dice:

> Spec listo en `specs/contador-palabras/`. Revísalo y di **'aprobado'** para
> continuar con la implementación, o pídeme cambios.

Mientras trabajan los subagentes, puedes entrar en sus sesiones para ver qué
hacen. Sigue la indicación de la TUI; por defecto es `Ctrl+X` seguido de las
flechas.

### 2. Revisa el spec (la parte importante)

Abre los tres archivos. Este es el momento más barato para corregir el rumbo:
cambiar una línea de `requirements.md` cuesta segundos, y cambiar código ya
escrito cuesta mucho más. Pregúntate:

- ¿Falta algún caso límite? Por ejemplo, ¿qué pasa si el texto solo tiene
  signos de puntuación?
- ¿Algún requisito es ambiguo o imposible de testear?
- ¿El diseño toca archivos que no debería?

Si quieres cambios, pídelos en lenguaje natural ("añade un requisito para
números", "R3 no me convence porque…"). Cuando esté bien, escribe:

```
aprobado
```

### 3. Implementación y revisión (automático)

1. El leader pasa la feature a `in_progress` y lanza al **implementer**.
2. El implementer:
   - ejecuta las tasks una a una y las marca con `[x]`;
   - escribe el código y los tests;
   - pasa `./init.sh`;
   - documenta el mapa requisito → test en
     `progress/impl_contador-palabras.md`.
3. El leader lanza al **reviewer**. Este comprueba la trazabilidad, las tasks,
   la arquitectura y `CHECKPOINTS.md`, y escribe su veredicto en
   `progress/review_contador-palabras.md`.
4. Según el veredicto:
   - **Rechaza:** el implementer corrige y se vuelve a revisar.
   - **Aprueba:** la feature pasa a `done` y el resumen se archiva en
     `progress/history.md`.

### 4. Commit

Revisa el diff (`git diff`) y haz el commit tú. El hook `pre-push` volverá a
pasar `./init.sh` antes de subir nada.

### 5. Añade tus propias features

Edita `feature_list.json` y añade entradas como esta:

```json
{
  "id": 3,
  "name": "exportar-csv",
  "title": "Exportar resultados a CSV",
  "description": "Qué es y por qué lo quieres, en 1-3 frases.",
  "acceptance": [
    "Criterio observable 1",
    "Criterio observable 2"
  ],
  "status": "pending",
  "sdd": true
}
```

- **`name`** es el identificador. Da nombre a la carpeta `specs/<name>/` y a
  los informes `progress/*_<name>.md`. Usa kebab-case.
- **`acceptance`** es lo que más ayuda al spec_author. Si es insuficiente, el
  spec_author marcará la feature como `blocked` y te pedirá aclaraciones en
  vez de inventarse requisitos.
- **`"sdd": false`** sirve para cambios triviales que no merecen spec.

También puedes pedírselo al leader en lenguaje natural, porque él sí puede
editar `feature_list.json`.

---

## Qué hay en el repo

```
.
├── opencode.json             # Modelo (gratuito), agente por defecto = leader, permisos globales
├── AGENTS.md                 # Mapa del repo; opencode lo carga para todos los agentes
├── CHECKPOINTS.md            # Criterios objetivos de "estado sano" (los usa el reviewer)
├── init.sh                   # Verificación del entorno: backlog coherente + tests
├── feature_list.json         # Backlog con estados
│
├── .opencode/
│   ├── agents/
│   │   ├── leader.md         # Primario: orquestador
│   │   ├── spec_author.md    # Subagente: redacta specs
│   │   ├── implementer.md    # Subagente: escribe código + tests
│   │   └── reviewer.md       # Subagente: aprueba o rechaza
│   ├── plugins/harness.ts    # Hooks: tests tras cada edición, init.sh al quedar inactivo
│   └── package.json          # Dependencia del plugin (opencode la instala solo)
│
├── docs/
│   ├── specs.md              # El proceso SDD y el formato EARS
│   ├── verification.md       # Qué cuenta como "funciona"
│   ├── architecture.md       # ✏️ Plantilla: rellénala con tu arquitectura
│   └── conventions.md        # ✏️ Plantilla: tu estilo, tests y Git
│
├── specs/<feature>/          # requirements.md · design.md · tasks.md
├── progress/
│   ├── current.md            # Sesión en curso (se vacía al cerrar)
│   ├── history.md            # Bitácora append-only
│   ├── impl_<feature>.md     # Informe del implementer (trazabilidad)
│   └── review_<feature>.md   # Veredicto del reviewer
│
├── scripts/git-hooks/pre-push   # No deja hacer push si init.sh falla
├── src/                      # Tu código (ejemplo: saludo.py)
└── tests/                    # Tus tests (ejemplo: test_saludo.py)
```

---

## Los cuatro agentes

Cada agente es un archivo Markdown en `.opencode/agents/` y el nombre del
archivo es el nombre del agente. El *frontmatter* define:

- `mode`: `primary` o `subagent`;
- la temperatura;
- y, sobre todo, los **permisos**.

Los permisos son la gran ventaja de esta versión: las reglas de rol **no
dependen de que el modelo obedezca**, cosa importante con modelos gratuitos.
opencode bloquea la acción antes de que ocurra.

| Agente | Modo | Puede | Bloqueado por permisos |
|--------|------|-------|------------------------|
| **leader** | primario (por defecto) | Leer todo; editar docs, `progress/` y `feature_list.json`; `./init.sh` y `git status/diff/log`; lanzar `spec_author`, `implementer`, `reviewer`, `explore` y `general` | Editar `src/` y `tests/`. Cualquier otro comando le pide permiso a **ti** |
| **spec_author** | subagente | Escribir en `specs/`, `progress/` y `feature_list.json` | Cualquier otra edición, bash y lanzar agentes |
| **implementer** | subagente | Editar código y tests; ejecutar comandos | `git push`, lanzar agentes. `git reset` y `rm -rf` piden permiso |
| **reviewer** | subagente | Leer todo, ejecutar tests, escribir `progress/review_*` | Editar código; `git commit/push/checkout/reset`; lanzar agentes |

Hay un límite que conviene conocer: el implementer tiene bash libre, así que
técnicamente podría tocar archivos desde la shell. Las demás capas (tests,
reviewer, pre-push) cubren ese hueco.

### La regla anti-teléfono-descompuesto

Los subagentes **escriben sus resultados en archivos** y al leader solo le
devuelven una línea con la referencia:

```
spec_ready -> specs/contador-palabras/
APPROVED -> progress/review_contador-palabras.md
```

Si cada agente le resumiera al siguiente lo que ha hecho, la información se
degradaría en cada salto, como en el juego del teléfono. Con archivos se
consiguen tres cosas:

- todos leen la misma fuente original;
- el contexto del leader no se llena de detalles, lo que importa más con
  modelos de contexto corto;
- tú puedes auditarlo todo después.

### Escalado de esfuerzo

| Complejidad | Agentes |
|-------------|---------|
| Trivial (1 archivo) | spec_author → ⏸ → implementer |
| Media (2-3 archivos) | spec_author → ⏸ → implementer → reviewer |
| Compleja (refactor) | 2-3 `explore` en paralelo → spec_author → ⏸ → implementer → reviewer |
| Muy compleja | Se parte en sub-features y se aplica la tabla a cada una |

---

## El flujo SDD y los estados

```
pending → [spec_author] → spec_ready → ⏸ HUMANO → in_progress → [implementer → reviewer] → done
                                                                                ↘ blocked
```

| Estado | Significa | Quién lo pone |
|--------|-----------|---------------|
| `pending` | Todavía no tiene spec | Tú, al añadirla |
| `spec_ready` | El spec está escrito y espera tu aprobación. No se toca código | spec_author |
| `in_progress` | Aprobada y en implementación. **Solo puede haber una a la vez** | leader, tras tu "aprobado" |
| `done` | Tests verdes y reviewer APPROVED | implementer, tras la aprobación del reviewer |
| `blocked` | Atascada; el motivo está en `progress/` | cualquiera |

La **puerta humana** es la única pausa del flujo, y es deliberada: es donde tu
criterio aporta más con menos esfuerzo.

---

## Las specs: EARS, design y tasks

El detalle completo está en [`docs/specs.md`](docs/specs.md). En resumen:

**`requirements.md`** usa EARS (*Easy Approach to Requirements Syntax*): cinco
plantillas que obligan a escribir requisitos sin ambigüedad.

| Patrón | Plantilla |
|--------|-----------|
| Ubicuo | `El sistema DEBE <acción>.` |
| Evento | `CUANDO <disparador>, el sistema DEBE <acción>.` |
| Estado | `MIENTRAS <estado>, el sistema DEBE <acción>.` |
| Opcional | `DONDE <feature opcional>, el sistema DEBE <acción>.` |
| No deseado | `SI <evento no deseado> ENTONCES el sistema DEBE <acción>.` |

Cada requisito lleva un solo `DEBE`, tiene un id estable (`R1`, `R2`…) y tiene
que poder testearse.

**`design.md`** recoge los archivos que se crean o modifican, las firmas
nuevas, los errores y al menos una alternativa descartada con su porqué.

**`tasks.md`** es un checklist ordenado en el que cada task indica qué `R<n>`
cubre.

La **trazabilidad** cierra el círculo: el reviewer rechaza la feature si algún
`R<n>` no tiene al menos un test concreto que lo verifique.

---

## Las redes de seguridad

| Capa | Dónde | Qué hace |
|------|-------|----------|
| Permisos por agente | frontmatter de `.opencode/agents/*.md` | El leader no puede editar código, el reviewer no puede editar ni hacer commit y el spec_author solo puede escribir specs |
| Permisos globales | `opencode.json` | Los comandos bash desconocidos te piden permiso. `doom_loop: ask` corta los bucles de un agente que repite la misma llamada |
| Plugin `tool.execute.after` | `.opencode/plugins/harness.ts` | Tras cada edición corre los tests y **añade el resultado a la salida de la herramienta**, así que el agente lo ve en su siguiente paso |
| Plugin `session.idle` | `.opencode/plugins/harness.ts` | Cuando la sesión queda inactiva ejecuta `./init.sh` y muestra un aviso verde o rojo en la TUI |
| `init.sh` | raíz | Valida el backlog (estados válidos y como mucho una `in_progress`) y pasa los tests |
| Hook git `pre-push` | `scripts/git-hooks/` | Impide hacer push con `init.sh` en rojo. Para emergencias: `--no-verify` |
| `CHECKPOINTS.md` | raíz | Lista objetiva que el reviewer recorre antes de aprobar |

---

## Adaptarlo a tu proyecto

1. **Borra el ejemplo.** Son estos archivos:
   - `src/saludo.py` y `tests/test_saludo.py`;
   - la carpeta `specs/saludo/` y los informes `progress/*_saludo.md`;
   - la entrada de ejemplo de `progress/history.md`;
   - las dos features de `feature_list.json`.
2. **Rellena `docs/architecture.md` y `docs/conventions.md`.** Es lo que más
   mejora el resultado, y con modelos gratuitos todavía más. Los agentes leen
   estos archivos antes de diseñar e implementar, y el reviewer los usa como
   vara de medir. Lo que no escribas ahí, el modelo lo improvisará.
3. **Cambia el comando de tests** en tres sitios:
   - en `init.sh`, el bloque de tests. Puede ser `pytest`, `npm test -- --run`,
     `cargo test`, `go test ./...`… Añade lint y typecheck si los tienes;
   - en `.opencode/plugins/harness.ts`, la constante `TEST_CMD`. Usa la versión
     más rápida;
   - en `opencode.json`, `permission.bash`, para permitir ese comando sin que
     te pregunte.
4. **Ajusta las rutas protegidas.** Si tu código no vive en `src/` y `tests/`
   (por ejemplo, si vive en `backend/` y `frontend/`), cambia las rutas en dos
   sitios:
   - en `permission.edit` de `.opencode/agents/leader.md`;
   - en el texto de `AGENTS.md`, `leader.md`, `spec_author.md` y
     `CHECKPOINTS.md`. Para localizarlas:
     `grep -rn "src/" AGENTS.md CHECKPOINTS.md .opencode/agents/`.
5. **Actualiza `CHECKPOINTS.md`** con lo que para ti significa "proyecto
   sano". Por ejemplo: "no hay queries a BD fuera de `repositories/`".

---

## Consejos (sobre todo con modelos gratuitos)

Los modelos gratuitos son capaces, pero se pierden antes que los de pago en
flujos largos de varios agentes. Lo que mejor funciona:

- **Haz features pequeñas.** Pocos requisitos (3-6) por feature. Si un spec
  crece, pide partirlo. Es el consejo que más impacto tiene.
- **Escribe `acceptance` concretos y observables.** "Que sea rápido" no sirve;
  "responde en < 200 ms con 1 000 elementos" sí.
- **Recuérdale el protocolo cuando lo pierda.** Si el leader intenta hacer las
  cosas él mismo, lo verás chocar con los permisos. Basta con decirle: *"eres
  el leader: lanza al implementer con la tarea"*.
- **Usa `@` para invocar a un agente a mano** si el leader se atasca. Por
  ejemplo, `@reviewer revisa la feature contador-palabras`.
- **Empieza una sesión nueva por feature** (`/new`). Con el estado en archivos
  no pierdes nada, y el contexto limpio ayuda mucho a los modelos pequeños.
- **Prueba otro modelo gratuito** si uno se equivoca de forma sistemática con
  las herramientas: unos hacen tool calling mucho mejor que otros. Basta con
  cambiar una línea en `opencode.json`.
- **Revisa sobre todo el spec**, no el código línea a línea. Un buen spec
  produce buen código casi siempre.
- **Cuando algo sale mal, corrige el arnés y no solo el código.** Si un agente
  repite un error, añade una regla a `docs/conventions.md`, un checkpoint, un
  test o un permiso.
- **Para retomar una sesión,** abre `opencode` y pregunta *"¿en qué estado
  estamos?"*. El leader leerá `progress/current.md` y el backlog.

---

## Preguntas frecuentes

**¿De verdad no pago nada?**
Con los modelos `-free` de OpenCode Zen, no. Ten en cuenta que esos modelos
pueden desaparecer de la lista gratuita: si uno deja de funcionar, mira la
lista actual con `opencode models opencode` y cambia `opencode.json`.

**¿Qué diferencia hay con la versión de Claude Code?**
El flujo es idéntico. Cambian tres cosas:

- la configuración vive en `opencode.json` y `.opencode/`, no en `CLAUDE.md` y
  `.claude/`;
- los hooks son un plugin en TypeScript, en lugar de comandos en
  `settings.json`;
- los roles se imponen con permisos por ruta, de forma más estricta que en
  Claude Code.

La versión de Claude Code con Opus o Sonnet sigue mejor los protocolos largos.
Esta es gratis.

**¿Puedo usar a la vez opencode y Claude Code en el mismo repo?**
Sí. Copia `.claude/` y `CLAUDE.md` de la
[otra plantilla](https://github.com/marcomartinez-fueib/harness-agentes-sdd-claude-code).
`AGENTS.md`, `specs/`, `progress/` y `feature_list.json` son comunes. Un
aviso: si existe `.claude/skills/`, opencode también lo lee. Si no lo quieres,
desactívalo con `OPENCODE_DISABLE_CLAUDE_CODE=1`.

**¿Funciona con otros lenguajes?**
Sí. Nada del flujo depende de Python: solo el ejemplo y el comando de tests.
Mira [Adaptarlo a tu proyecto](#adaptarlo-a-tu-proyecto).

**¿Qué pasa si el reviewer rechaza una y otra vez?**
El leader relanza al implementer con el informe del reviewer. Tras dos rondas
fallidas para y te pregunta: normalmente significa que el problema está en el
spec, no en el código.

**El plugin no parece ejecutarse.**
Comprueba tres cosas:

- que opencode instaló sus dependencias (debe existir
  `.opencode/node_modules/@opencode-ai/plugin`);
- que `python3 -m unittest discover -s tests` funciona desde la raíz del repo;
- los logs, con el filtro `service=harness`.

---

## Licencia

MIT. Úsalo, cámbialo y compártelo.
