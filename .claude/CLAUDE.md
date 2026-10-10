# hwedi.tech: maintainer guide

You are the maintainer of the website at https://hwedi.tech.
This repository is hwedi/hwedi.github.io. It is plain HTML, CSS and JavaScript on GitHub Pages. There is no build step.

Two things live here:

- **The portfolio.** The files in the top folder (index.html and friends). It is the home page, https://hwedi.tech.
- **Afterglow.** The folder `afterglow/`. It is a made-up personal homepage from 2002, shown inside a simulated CRT monitor. It is at https://hwedi.tech/afterglow/.

The owner asks for changes in plain words. You do everything yourself, from editing to publishing.
Do not ask questions you can answer by reading the files.
Reply in short, simple sentences.

Always start with `git fetch origin` and work from the latest origin/main. Ignore any earlier branches or half-finished work.

## How changes go live

- A push to main is live. GitHub Pages publishes about a minute later.
- There is no test copy. Look at your work on your own machine first (see "The tools").

## Ship every change like this

1. Check your work first.
   - Run `node --check afterglow/js/app.js` if you changed it.
   - Run the click tests: `cd afterglow/_tools && npm install && node test.mjs`. It takes about two minutes. It must end with "0 failed".
   - Take pictures and look at them: `node shot.mjs` (add a page name, like `node shot.mjs tube`). Open the files in `afterglow/_tools/out/`. Check desktop and phone, light and dark.
   - For the portfolio there are no tests. Make sure every file the HTML links to exists, and look at the page.
2. Run these commands from the top folder:
   - `git add -A`
   - `git commit -m "short plain message"`
   - `git pull --rebase origin main`
   - `git push origin HEAD:main`
3. If you cannot push to main from here, open a pull request and merge it yourself. If that is blocked too, tell the owner the single click they need to make. Never force-push.
4. Tell the owner what changed and that it will be live in about a minute. Tell them to press Ctrl+F5 on the site (browsers keep the old files for up to ten minutes).
5. When you publish a brand-new address (a new folder or a new .html file), wait three minutes before you open it or check it. If anyone asks for it before GitHub has finished, the "not found" answer can stick to that exact address for a long time. Adding `?x=1` to the address shows the real page meanwhile. The next push that changes a published file clears it.

## What gets published

GitHub Pages puts every file in this repository on the website, with one exception: a file or folder whose name starts with `_` or `.` is left out.

- That is why the helper scripts are in `afterglow/_tools/` and this guide is in `.claude/`. Keep them there.
- Left out of the website does not mean private. The repository is public on GitHub, so everything in it can be read there. Never commit passwords, keys or private details.
- Do not add `.nojekyll` or `_config.yml`. They change what gets published.
- A loose `.md` file anywhere else becomes a public web page (GitHub Pages turns it into `.html`). Keep notes in this file.

## Facts about the repository

- CNAME must stay exactly: hwedi.tech
- The portfolio is the owner's own work: index.html (its styles are inside it), post.html, notIndex.html, default.css, blue.css, green.css, purple.css, script.js (the colour theme switcher), images/. Do not change it unless the owner asks.
- The portfolio does not link to Afterglow. The owner wanted the home page left as it is. Add a link only if they ask.
- Leave bucket-policy.txt, `null` and README.md alone.
- Both sites share one browser storage area (the same address). The portfolio uses the key `theme`. Afterglow uses keys that start with `afterglow.`. Keep it that way.

## Afterglow: what it is

A visitor sees an old tube monitor (the made-up "KILOVOLT K19 Pro"). On its glass is "AFTERGLOW", the homepage of nox, a made-up 16-year-old night owl in 2002 who loves CRT monitors.
The monitor works: MENU opens an on-screen menu, DEGAUSS shakes the picture, the power button switches it off, and the magnet on the bezel can be dragged over the glass to bend and stain the picture.

### The files

- `afterglow/index.html`: the whole thing, one page. It has two layers:
  - the **monitor**: the plastic case, the glass, the buttons, the on-screen menu;
  - the **homepage**: everything inside `<div class="page" id="page">`. The comment banner inside it marks where it starts.
- `afterglow/css/monitor.css`: how the monitor looks. Light and dark theme both live here (the case is beige in light, graphite in dark).
- `afterglow/css/site.css`: how the 2002 homepage looks, and its three layouts (`w-wide`, `w-mid`, `w-narrow`).
- `afterglow/css/fonts.css` and `afterglow/fonts/`: three open-licence fonts and their licence files. Keep the licence files.
- `afterglow/js/app.js`: one file, three parts, in this order:
  1. `SND`: the sounds and the three tunes. All of it is made in the browser. There are no sound files.
  2. `CRT`: the tube. Picture maths, the glass layers, power, degauss, the magnet, the menu, the pointer.
  3. The homepage scripts: changing pages, the clock, the hit counter, the poll, the guestbook, the music buttons, the test patterns, the moth.
- `afterglow/images/`: the pixel art, as real GIF files. `images/still/` holds the first frame of every animated GIF.
- `afterglow/images/og.jpg`: the picture shown when the link is shared.
- `afterglow/_tools/`: helper scripts. Not on the website. See "The tools".

### How the picture works

Read this before you touch `CRT` in app.js or monitor.css.

- The homepage is real, live HTML. Nothing is a screenshot or a canvas.
- **The bend.** In Chrome, Edge and other Chrome-family browsers, an SVG filter (`#crt-fx`, built by `buildFx`) bends the picture like a tube and splits the colours a little. Safari and Firefox start with flat glass and the same glass layers on top. The line `const blink = ...` decides. Never write code that needs the bend to be on.
- **The bend outside Chrome is an experiment.** A visitor can raise CURVATURE in the menu there. Nobody has seen how Safari or Firefox draws it. So it is never remembered: a reload always gives flat glass back. Do not switch it on by default until the owner has looked at it on a real iPhone and in Firefox.
- **The pointer.** The picture is bent, so the real mouse pointer would point at the wrong spot. It is hidden, and a pixel pointer (`#cur`) is drawn inside the picture. If you add something clickable that is not a link, button or form field, add its selector to `LNK` in app.js so it gets the hand pointer.
- **The old resolution.** The homepage is laid out about 800 pixels wide, like in 2002, and scaled up to fit the glass with CSS `zoom`. `window.__afterglowFit` (a small script in index.html) picks the scale and the layout. Write sizes in the page's own small pixels. A phone gets the `w-narrow` layout.
- **Zoom and measuring.** Older browsers (Safari before 26.4, Chrome before 128) report the size and place of things inside a zoomed box in that box's own small pixels. Two rules follow. Scale anything the visitor drags with a `transform`, not with `zoom` (the menu and the toast do). And if you compare `getBoundingClientRect()` of something inside the page with mouse coordinates, use the factor that `overText` uses.
- **The glass.** Scanlines, the colour mask, glow, snow (the STATIC setting), flicker, glare and the magnet stains are layers (`class="ov ..."`) above the picture. With a graphics chip they cost almost nothing. Without one, every blended layer, filter and rounded clip costs frames.
- **Slow devices.** `governor` times a couple of seconds of frames after the page loads. If it is slow, it switches off the bend and the glow (eco level 1, "ECO MODE: CURVATURE OFF"). If it is still slow, it switches to plain glass (eco level 2, the class `lite`, "ECO MODE: PLAIN GLASS"). A level is remembered after two slow visits in a row. RECALL in the menu, or raising CURVATURE, gives everything back. The tests cannot run the governor. To watch it, open the site in a browser with no graphics acceleration.
- The monitor and the homepage share one document. Give them different class names. Example: the monitor's LCD mode uses the class `flat`, because the homepage already had `.lcd` for the music display.

### How to change things

- **Words on a page.** Edit index.html, inside the right `<div class="pg" id="pg-NAME">`. The pages are home, about, tube, test, journal, links, stuff, guest and 404.
- **A new page.** Add `<div class="pg" id="pg-NAME" hidden>` next to the others. Add `'NAME'` to `PAGES` in app.js. Add `<a href="#NAME">` to the menu (`id="nav"`). Its address is hwedi.tech/afterglow/#NAME.
- **Links.** Inside the homepage every link is `href="#NAME"`. `go` in app.js changes the page. A click adds a step the Back button can undo. A pretend link to another website is written `<a href="#404" data-dead="http://some.example/page">`. It shows the pretend "404 not found" page. Pretend websites always end in `.example`.
- **The two neighbour sites** ("kero's pond" and "THE 85 Hz CAMPAIGN") are the `<div class="site" id="site-NAME">` blocks near the end of the homepage. A new neighbour needs three things: its block, its name in `RING` in app.js, and a `.page[data-site="NAME"]` rule in site.css.
- **A picture.** Every `<img>` needs `width`, `height` and `alt`. An animated GIF also needs `data-a="NAME"`, and a still at `images/still/NAME.gif`. The art tool makes both.
- **A monitor setting.** `DEF` and `MENU` sit together at the top of `CRT`. Add the default to `DEF`, the row to `MENU`, and what it does to `paint` or `changed`. Saved settings are checked against `MENU` when they are read back, so nothing else is needed.
- **A tune.** The three tunes are the functions `nightdrive`, `mothwaltz` and `pixelrain` in `SND`, listed in `SONGS`. They are written as lists of notes. Read one before you write another.
- **Something new to remember.** Save it with `store.set`. Read numbers back with `store.num`. Check everything else you read back before you use it: its type, its range, its length. Old and damaged saves are out there, and a page that breaks on one stays broken for that visitor. Add the new key to the "damaged saves" test.

### Things that must keep working

- No sound before the visitor clicks or taps something. Browsers block it anyway.
- Reduced motion: when the visitor's device asks for it, the flicker, the rolling, the shaking and the flying moth stop, and stills replace the animated GIFs. This also works when the setting changes while the page is open.
- Keyboard: every control can be reached and used with the keyboard. The first Tab stop is a button that skips to the monitor's own buttons. The menu works with the arrow keys. Esc closes the menu and the test patterns.
- Phone: nothing scrolls sideways. The magnet works with a tap. Text boxes have letters of at least 16px, or phones zoom in when they are tapped. A phone on its side still shows the whole monitor.
- The Back and Forward buttons move between the pages of the homepage.
- Both themes of the monitor.
- Everything a visitor does (monitor settings, poll vote, guestbook entry, magnet stains, visit count) is saved only in their own browser. Nothing is sent anywhere. So a guestbook entry is seen only by the person who wrote it, and the poll and counter numbers are pretend. Do not change the page to say otherwise unless you build a real one, and ask the owner first.
- Everything a visitor types is shown as plain text (`esc` in app.js). Never put it into the page as HTML.
- The page loads nothing from other websites. Keep it that way.

### Rules for content

- Afterglow is fiction. nox is not the owner. Do not put the owner's real name, photo or details into it unless they ask.
- It is always spring 2002 on the homepage. No newer technology, no newer slang.
- nox writes in lowercase, casually, with Canadian spelling (colour, favourite, grey). Dates are mm.dd.yy. Check the weekday when a dated entry mentions school.
- kero writes like a kid who loves frogs ("2", "ur", "kewl"). THE 85 Hz CAMPAIGN writes IN CAPITALS and uses no styling on purpose.
- The monitor (Kilovolt K19 Pro), the browser (Navigatron), the web hosts, the games and the other sites are all made up. Keep it that way: no real companies, bands or people, and no real logos. Search the web before you invent a new name. Three names in the first version turned out to be real brands and had to be changed.
- A few real product names appear as plain words, the way a teenager in 2002 would say them (win98, linux, notepad, windows, flash). That is enough. Do not add more.
- The tube shrine explains how CRT monitors really work. Those facts are true. Keep them true. The "your signal" line is worked out to stay inside the numbers in the table above it.
- All the art is original and drawn by code. Do not add pictures copied from somewhere else.
- No emojis on the 2002 pages. Use text faces like ^_^ instead.

## The tools

They are in `afterglow/_tools/`. The website does not need them. They need Node.js 18 or newer.

- `npm install`: once, inside `afterglow/_tools/`. The `node_modules` and `out` folders are not committed.
- `node serve.mjs`: shows the site at http://localhost:4173/afterglow/ the way visitors get it.
- `node test.mjs`: clicks through the site in a hidden browser and checks what is easy to break. Add a check when you add a feature. Then break the feature on purpose once, in a copy, to see that the check notices.
- `node shot.mjs`: takes pictures (desktop and phone, light and dark) into `out/`. `node shot.mjs tube` does one page.
- `node shot.mjs --og`: remakes `images/og.jpg`. Do this when the top of the home page or the monitor looks different.
- `node art.mjs`: draws the pixel art. The drawings are code in `art-ui.js`, `art-buttons.js`, `art-pictures.js` and `art-ring.js`. Each entry `ART.name` becomes `images/name.gif` (two are not GIFs: `banner.jpg` and `favicon.png`). `node art.mjs name1,name2` draws only those. Look at `out/sheet.png` afterwards.

The tests and pictures need a Chromium browser. Claude Code on the web has one and the tools find it. Anywhere else, run `npx playwright install chromium` once, or set `CHROME_PATH` to a Chrome you already have.

The tests can only run Chrome. Safari and Firefox are checked by pretending: one test switches the bend off, and one makes Chrome measure zoomed boxes the old way. That is not the same as the real browsers. If the owner reports a problem in one of them, believe them.

## What you cannot do

You cannot change the domain settings or the GitHub Pages settings. If the owner needs one of those, give them the exact clicks.
