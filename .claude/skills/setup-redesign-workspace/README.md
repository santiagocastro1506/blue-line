# setup-redesign-workspace

Skill para Claude Code que prepara el workspace completo antes de rediseñar un sitio web:
instala el stack de skills de diseño dentro del proyecto y crea los documentos que
gobiernan el rediseño.

Un rediseño se descarrila por dos razones prosaicas: el agente no tiene las skills de
diseño a mano y termina inventando su propio criterio, o no existe un documento que diga
qué se preserva y qué se reemplaza, así que cada sesión vuelve a decidir lo mismo. Esta
skill resuelve las dos de una vez.

## Qué hace

1. **Instala cinco paquetes de skills de diseño** en `<proyecto>/.claude/skills/` — local
   al proyecto, no global, para que las versiones queden congeladas con el repo y el
   rediseño sea reproducible:

   | Paquete | Para qué sirve |
   |---|---|
   | [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) | El motor del rediseño. Dueño de `PRODUCT.md` y `DESIGN.md` |
   | `frontend-design` (Anthropic, vendorizado en `assets/`) | Criterio de dirección visual y calibrador anti-slop |
   | [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) | Dirección estética anti-genérica |
   | [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Base consultable: paletas, tipografías, guías UX, motion |
   | [`emilkowalski/skills`](https://github.com/emilkowalski/skills) | Detalle de interacción y motion |

2. **Levanta el contexto del repo** antes de preguntar nada, y hace una sola ronda de
   preguntas sobre lo que el repo no puede contestar.

3. **Crea la estructura de documentos** desde las plantillas de `assets/`: `CLAUDE.md`,
   `AGENTS.md`, `BRIEF.md`, `DESIGN.md` (stub) y `CONTENT.md`.

4. **Reporta y entrega el siguiente paso.** No empieza a diseñar.

## Qué NO hace, a propósito

- No toca los MCP ni instala nada a nivel global.
- No escribe el contenido de `DESIGN.md` — eso lo hace `impeccable`, siguiendo el
  [spec oficial de DESIGN.md](https://github.com/google-labs-code/design.md).
- No arranca el rediseño.

## Instalación

Con el instalador universal de [skills.sh](https://skills.sh), desde la raíz del proyecto:

```bash
npx skills@latest add Leofrandex/setup-redesign-workspace --skill "*" --agent claude-code -y
```

O a mano, copiando la carpeta a las skills de tu usuario:

```bash
git clone https://github.com/Leofrandex/setup-redesign-workspace.git \
  ~/.claude/skills/setup-redesign-workspace
```

En PowerShell:

```powershell
git clone https://github.com/Leofrandex/setup-redesign-workspace.git `
  "$env:USERPROFILE\.claude\skills\setup-redesign-workspace"
```

## Uso

Desde la raíz del proyecto que vas a rediseñar:

```
Prepara el workspace para el rediseño
```

La skill se dispara sola con frases como "setup del workspace", "monta el workspace",
"arranca un rediseño" o "instala las skills de diseño". Requiere `node` y `npx`.

## Requisitos

- Claude Code (u otro agente que lea `SKILL.md`).
- Node.js con `npx`, para el instalador de skills.

## Licencias

El contenido de esta skill (`SKILL.md` y `assets/*.template`) va bajo **MIT** — ver
[`LICENSE`](./LICENSE).

`assets/frontend-design/` es una copia vendorizada del plugin oficial `frontend-design` de
Anthropic, distribuida bajo **Apache 2.0**; sus términos completos están en
[`assets/frontend-design/LICENSE.txt`](./assets/frontend-design/LICENSE.txt). Los demás
paquetes que la skill instala no se redistribuyen aquí: se descargan de sus repos y
conservan sus propias licencias.
