# Afterglow tools

Helper scripts for the CRT site in the folder above. The website does not need them, and GitHub Pages does not publish this folder (its name starts with `_`).

Run them from this folder. They need Node.js 18 or newer.

| Command | What it does |
| --- | --- |
| `npm install` | Once. Gets the test browser driver and the pixel fonts. |
| `node serve.mjs` | Shows the site at http://localhost:4173/afterglow/ |
| `node test.mjs` | Clicks through the site in a hidden browser. Takes about two minutes. Must end with "0 failed". |
| `node shot.mjs` | Takes pictures into `out/`: desktop and phone, light and dark. `node shot.mjs tube` does one page. |
| `node shot.mjs --og` | Remakes `../images/og.jpg`, the picture shown when the link is shared. |
| `node art.mjs` | Draws the pixel art into `../images/`. `node art.mjs b_crt,new` draws only those. |

The drawings are code: `art-ui.js`, `art-buttons.js`, `art-pictures.js`, `art-ring.js`, with helpers in `artlib.js`.

The tests and pictures need a Chromium browser. If none is found, run `npx playwright install chromium` once, or set `CHROME_PATH` to a Chrome you already have.

The full maintainer guide is `.claude/CLAUDE.md` at the top of the repository.
