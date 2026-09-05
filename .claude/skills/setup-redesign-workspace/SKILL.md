---
name: setup-redesign-workspace
description: >-
  Prepara el workspace completo para rediseñar un sitio web: instala el stack de
  skills de diseño (taste-skill, ui-ux-pro-max, impeccable, emilkowalski/skills,
  frontend-design de Anthropic)
  en el proyecto y crea la estructura de documentos que gobierna el rediseño
  (CLAUDE.md, AGENTS.md, BRIEF.md, DESIGN.md, CONTENT.md). Úsala siempre que el
  usuario pida "setup del workspace", "prepara el workspace", "monta el
  workspace", "arranca un rediseño", "set up the workspace", "instala las skills
  de diseño", o cuando empiece a trabajar en el rediseño de una página web y el
  proyecto todavía no tenga DESIGN.md ni las skills de diseño instaladas —
  aunque no nombre la palabra "workspace". No la uses para rediseñar de verdad
  (eso es impeccable), ni para proyectos que ya pasaron por este setup.
---

# Setup de workspace para rediseño web

Un rediseño se descarrila por dos razones prosaicas: el agente no tiene las skills de
diseño a mano y termina inventando su propio criterio, o no existe un documento que diga
qué se preserva y qué se reemplaza, así que cada sesión vuelve a decidir lo mismo.

Esta skill resuelve las dos de una vez: deja las herramientas instaladas y los documentos
de autoridad creados, para que el trabajo de diseño empiece con el terreno firme.

## Qué hace y qué no

**Hace:** instala cinco paquetes de skills de diseño en `<proyecto>/.claude/skills/`,
crea la estructura de `.md` que gobierna el proyecto, e inventaría el sitio actual.

**No hace, a propósito:**

- **No toca los MCP.** Están a nivel global y son transversales a todos los proyectos.
- **No instala nada a nivel global.** Todo el stack de diseño vive dentro del proyecto,
  por decisión explícita del usuario: las versiones quedan congeladas con el repo y un
  rediseño de hace seis meses se puede reproducir tal cual. Si encuentras `impeccable`,
  `ui-ux-pro-max` o `frontend-design` instalados como plugin global, **dilo en el reporte
  y ofrece quitarlos** — conviven sin romperse, pero la copia local gana y la global sólo
  crea confusión sobre qué versión está mandando.
- **No escribe el contenido de `DESIGN.md`.** Eso lo hace `impeccable`, que sigue el
  [spec oficial de DESIGN.md](https://github.com/google-labs-code/design.md) y corre una
  entrevista real con el usuario. Esta skill deja un stub que apunta al comando correcto.
  Ver [Paso 4](#paso-4-reporta-y-entrega-el-siguiente-paso).
- **No empieza a diseñar.** Termina, reporta, y le dice al usuario cuál es el primer paso.

## Paso 0: Verifica el terreno

Antes de instalar nada, confirma tres cosas y reporta lo que encuentres:

1. **Raíz del proyecto.** Trabaja desde la raíz del repo (donde está `.git` o
   `package.json`). El instalador escribe en `./.claude/skills/` relativo al cwd, así que
   correrlo desde una subcarpeta esparce las skills en el lugar equivocado.
2. **`node` y `npx` disponibles.** El instalador es `npx skills@latest`. Si no hay Node,
   detente y dilo — no hay plan B razonable.
3. **Qué ya existe.** Lista `.claude/skills/` y revisa si ya hay `DESIGN.md`, `BRIEF.md` o
   `CLAUDE.md` en la raíz.

Si el proyecto ya tiene las skills y los documentos, **no reinstales ni sobrescribas**:
reporta el estado y pregúntale al usuario qué falta. Sobrescribir un `BRIEF.md` que alguien
llenó a mano destruye trabajo real que esta skill no puede reponer.

## Paso 1: Instala las skills de diseño

Cuatro paquetes vía el instalador universal de skills.sh. Corre cada comando desde
la raíz del proyecto:

```bash
npx skills@latest add Leonxlnx/taste-skill              --skill "*" --agent claude-code -y
npx skills@latest add nextlevelbuilder/ui-ux-pro-max-skill --skill "*" --agent claude-code -y
npx skills@latest add pbakaus/impeccable                --skill "*" --agent claude-code -y
npx skills@latest add emilkowalski/skills               --skill "*" --agent claude-code -y
```

Detalles que importan porque ya fallaron una vez:

- **El identificador del agente es `claude-code`, no `claude`.** Con `claude` el comando
  aborta con `Invalid agents`.
- `--skill "*" -y` evita el prompt interactivo. Sin eso el instalador se queda esperando
  una selección que nadie va a dar.
- En PowerShell las comillas dobles alrededor del `*` son obligatorias.
- El instalador **copia** los archivos (no symlinks), así que las skills quedan versionadas
  con el repo. Eso es deseable: el rediseño queda reproducible.
- El instalador deja una carpeta de staging `.agents/skills/` y un `skills-lock.json` en la
  raíz. El staging se limpia solo; el lock se queda y conviene versionarlo.

### El quinto paquete: `frontend-design` (Anthropic)

No está en skills.sh — es un plugin oficial de Anthropic. Va **vendorizado** dentro de esta
skill, en `assets/frontend-design/`, precisamente para no depender del plugin global:

```bash
cp -r "<raíz de esta skill>/assets/frontend-design" "<proyecto>/.claude/skills/frontend-design"
```

En PowerShell:

```powershell
Copy-Item "<raíz de esta skill>\assets\frontend-design" "<proyecto>\.claude\skills\" -Recurse -Force
```

Son dos archivos: `SKILL.md` y `LICENSE.txt`. **Copia también la licencia** — es material
de Anthropic y el `SKILL.md` la referencia en su frontmatter.

Al terminar, verifica que las carpetas existan y cuenta cuántas skills quedaron. Si algún
paquete falló, sigue con los demás y reporta cuál falló y por qué; un rediseño con cuatro de
cinco paquetes es mucho mejor que ninguno.

### Qué aporta cada paquete

Útil para el reporte y para escribir el `CLAUDE.md`:

| Paquete | Para qué sirve |
|---|---|
| `pbakaus/impeccable` | El motor del rediseño. Dueño de `PRODUCT.md` y `DESIGN.md`. Comandos: `init`, `document`, `shape`, `critique`, `audit`, `polish`, `animate`, `typeset`, `colorize`, `extract` |
| `frontend-design` (Anthropic, vendorizado) | Criterio de dirección visual: cómo elegir paleta, tipografía y layout para que no lean como plantilla. Trae el calibrador anti-slop y el proceso de dos pasadas (plan → autocrítica → código) |
| `Leonxlnx/taste-skill` | Dirección estética anti-genérica: `design-taste-frontend`, `redesign-existing-projects`, `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `brandkit`, `image-to-code` |
| `nextlevelbuilder/ui-ux-pro-max-skill` | Base de datos consultable: paletas, pares tipográficos, guías UX, presets de motion, tipos de gráfico por stack |
| `emilkowalski/skills` | Detalle de ingeniería de interfaz y motion: `emil-design-eng`, `animate`, `animation-vocabulary`, `improve-animations`, `apple-design`, `shadcn` |

### Mantener el vendor al día

`assets/frontend-design/` es una copia congelada. Si Anthropic actualiza el plugin y quieres
la versión nueva, refresca el vendor desde el caché de plugins y vuelve a copiar:

```
~/.claude/plugins/cache/claude-plugins-official/frontend-design/<version>/skills/frontend-design/
```

Si el plugin global ya no está instalado, la fuente es el marketplace oficial de plugins de
Claude Code. No hace falta a menudo: el `SKILL.md` es guía de criterio, no código, y cambia
poco.

## Paso 2: Levanta el contexto antes de escribir documentos

No entrevistes al usuario sobre cosas que el repo ya contesta. Antes de preguntar, revisa:
`README`, `package.json`, rutas y páginas, assets de marca (logos, fuentes, imágenes),
CSS/tokens existentes, y cualquier brief o documento del cliente ya presente en el repo.

Después haz **una sola ronda** de preguntas — usa la herramienta de preguntas estructuradas
si está disponible — sobre lo único que el repo no puede contestar:

1. **Quién es el cliente y qué se está rediseñando** (sitio, URL actual si existe, alcance).
2. **Qué debe sobrevivir sin negociación** (marca, contenido, funcionalidad, restricciones
   legales o de compliance).
3. **Qué está mal con el sitio actual y cómo se ve el éxito** — la razón real por la que
   hay un rediseño.

No preguntes por colores, tipografías ni dirección estética. Eso es territorio de
`impeccable` en el Paso 4, y adelantarlo produce respuestas apresuradas que después hay que
deshacer.

Si el usuario no responde, escribe los documentos con lo que el repo evidencia y **marca
cada campo inferido explícitamente** como inferido. Un brief con huecos honestos es
utilizable; uno con datos inventados envenena todas las decisiones que vienen después.

## Paso 3: Crea la estructura de documentos

Cuatro archivos en la raíz del proyecto. Las plantillas están en `assets/`; léelas y
llénalas con lo que levantaste en el Paso 2 — no las copies crudas con los placeholders
intactos.

| Archivo | Plantilla | Contenido |
|---|---|---|
| `CLAUDE.md` | `assets/CLAUDE.md.template` | Reglas del proyecto: qué autoridad manda, qué skill usar cuándo, qué no se toca |
| `AGENTS.md` | `assets/AGENTS.md.template` | Puntero a `CLAUDE.md` para Codex, Cursor y demás agentes que leen ese nombre |
| `BRIEF.md` | `assets/BRIEF.md.template` | Cliente, alcance, audiencia, entregables, restricciones, fechas |
| `DESIGN.md` | `assets/DESIGN.md.template` | **Stub.** Sólo dice quién lo llena y con qué comando |
| `CONTENT.md` | `assets/CONTENT.md.template` | Inventario del sitio actual: qué páginas hay, qué se preserva, qué se descarta |

Reglas al escribir:

- **`AGENTS.md` es un puntero, no una copia.** Duplicar el contenido garantiza que las dos
  versiones diverjan en la tercera sesión. Que apunte a `CLAUDE.md` y ya.
- **Si el archivo ya existe, no lo pises.** Muestra qué agregarías y deja que el usuario
  decida.
- **`CONTENT.md` sólo tiene sentido con un sitio actual.** Si el rediseño arranca de cero,
  dilo y omite el archivo en vez de llenarlo de nada.

### Inventario para `CONTENT.md`

Si hay un sitio existente en el repo, recorre las páginas y para cada una anota: ruta,
propósito, y una decisión inicial de *preservar / rehacer / descartar*. Si el sitio actual
sólo está en producción y no en el repo, pide la URL y usa las herramientas de scraping
disponibles; si no hay ninguna, deja la tabla con las rutas conocidas y marca el inventario
como pendiente.

Esta tabla es la que evita la conversación circular de "¿esta página seguía o no?" en la
sesión cuatro.

## Paso 4: Reporta y entrega el siguiente paso

Cierra con un reporte corto y honesto:

- Qué paquetes se instalaron y cuántas skills quedaron disponibles.
- Qué documentos se crearon y cuáles quedaron con huecos o campos inferidos.
- Qué falló, si algo falló.
- **Si detectaste `impeccable`, `ui-ux-pro-max` o `frontend-design` como plugin global**,
  dilo y ofrece quitarlos: el stack de diseño va por proyecto. Se desinstalan con
  `claude plugin uninstall <nombre>@<marketplace>` — necesita que el usuario lo corra en su
  terminal (o con el prefijo `!` en el prompt de la sesión), porque toca la config del
  runtime que está corriendo. **Antes de que desinstale nada, verifica que
  `assets/frontend-design/` esté vendorizado**, o pierdes la fuente al borrarse el caché.
- Si `.claude/skills/` se va a versionar en git o conviene ignorarlo — pregúntalo, no lo
  decidas solo. La recomendación por defecto es versionarlo: es lo que hace el rediseño
  reproducible.

Y después, lo más importante. **Dile al usuario cuál es el primer paso real del trabajo,
porque el workspace está listo pero el diseño todavía no empezó:**

> El workspace está montado, pero `DESIGN.md` está vacío a propósito: lo escribe
> `impeccable`, no este setup. El orden es:
>
> 1. **`/impeccable init`** → escribe `PRODUCT.md` con la verdad de producto (usuarios,
>    propósito, stack, restricciones). No toca nada visual, a propósito.
> 2. Después, según el caso:
>    - **Hay un sitio actual cuya identidad quieres conservar o documentar** →
>      **`/impeccable document`** genera `DESIGN.md` desde el código existente.
>    - **La identidad visual es nueva o se reemplaza** → invoca **`/impeccable`** con lo que
>      quieres rediseñar y entra al flujo *new-work*, que corre un torneo de conceptos y
>      escribe el `DESIGN.md` nuevo.
>
> Hasta que `DESIGN.md` exista, cualquier trabajo de UI se está inventando el criterio.

No arranques el Paso 1 de esa lista por tu cuenta. `/impeccable init` abre una entrevista
con el usuario y encadenarla sin que la haya pedido convierte un setup de dos minutos en
una sesión larga que no autorizó.
