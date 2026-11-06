# Muhammed Ali portfolio

A local Next.js portfolio based on the supplied CV, with a cyberpunk control-panel design. All seven requested sections are implemented: Hero, About, Skills, Projects, Experience, Terminal and Contact.

## Run locally

Requires Node.js 20.9 or newer. The project was built with Node.js 24.

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Dependencies are already installed in this checkout, so `npm run dev` is enough to restart development.

For the optimized production version:

```powershell
npm run build
npm run preview
```

Open http://127.0.0.1:4173. `npm start` runs the same production preview. The preview server binds only to the local computer. Use Ctrl+C to stop either server. The production build produces a static `out/` directory; no hosting account or backend service is configured.

The first build downloads JetBrains Mono, Inter and IBM Plex Mono through `next/font`. Next.js then serves the fonts locally with the site. A network connection is needed if those build-time fonts are not cached.

## Edit the portfolio

- `data/content.ts`: portfolio copy, CV facts, contact details, technology groups, project notes and terminal demonstration text.
- `app/globals.css`: design tokens, responsive layouts, keyboard frame, visual effects and reduced-motion styles.
- `tailwind.config.ts`: Tailwind mappings to the CSS color and font variables.
- `components/portfolio.tsx`: the seven sections and navigation.
- `components/motion-system.tsx`: construction registration, dividers, progress, parallax and motion preferences.
- `components/construction-director.tsx`: eight-unit construction scheduler, temporary selection/copy overlays and idle cursor formation.
- `lib/construction-motion.ts`: distance-based timings, smooth routing and frame-rate-independent following.
- `components/interactions.tsx`: shared pointer state, custom cursor, tilt cards and terminal typing.
- `components/network-graph.tsx`: keyboard- and touch-accessible seven-layer technology graph.
- `components/scene-loader.tsx` and `components/wireframe-scene.tsx`: deferred Three.js canvas and its lifecycle.
- `public/Muhammed_Ali_Resume.docx`: an unchanged copy of the supplied CV, available from both download buttons.

Project descriptions and employment dates come from the CV. No public project or GitHub URLs were supplied, so the project buttons open build notes. Email, phone and LinkedIn use the contact details the user approved. The terminal is explicitly an illustrative code demonstration; it does not send requests to Gemini or any other API.

## Interaction and accessibility

- Eight collaborators assemble visible content with smooth, distance-based handoffs and early placement during each drag. Queued content stays readable. Idle cursors follow the actual pointer path with a 30–170ms stagger, loose spacing and damped returns. After a short idle pause they glide out through all four screen edges, then stay offscreen until new visible content needs building; mouse movement never recalls them; no light trails are rendered. Repeated cards start with a prototype and drag ghost copies into position before placing their contents. Construction guides disappear after placement. Work starts 50px before entry, runs once, and respects reduced motion and keyboard focus. The construction sequence replaces the blocking intro.
- Sections use mandatory vertical scroll snapping with minimum viewport heights; longer sections remain scrollable.
- Navigation appears after 100px of scrolling. Mobile navigation has a menu button, closes after section selection, and supports Escape.
- Project build notes are expandable. Graph nodes can be focused and activated with Enter or Space; mobile also provides larger text buttons.
- The terminal types at 30ms per character, pauses offscreen or in a hidden tab, and can be replayed.
- Fine-pointer devices get the custom cursor and a damped 2-degree card tilt after construction. Touch devices retain standard pointer behavior.
- The footer’s motion control disables animation, tilt, custom cursor and the 3D canvas. The operating system’s reduced-motion preference also disables these features and displays all content immediately.
- The decorative Three.js scene loads separately, uses 90 desktop or 32 mobile particles, caps DPR at 1.5, and pauses rendering offscreen or when the tab is hidden. A static SVG remains available if the canvas cannot render.
- The hero’s laptop frame is removed below 768px. The layout was checked at 360px and desktop widths.

## Validation

Each of the seven implementation phases was checked with TypeScript and/or a production build before proceeding. Browser checks covered navigation, expandable project notes, the terminal replay, graph selection, keyboard operation, mobile navigation, motion disabling, canvas loading and responsive overflow. Both the page and CV download returned HTTP 200; the CV copy’s SHA-256 matches the original.

```powershell
node --test tests/construction-motion.test.mjs
npm run typecheck
npm run build
```

Lighthouse was run as a temporary npm tool, not added as a website dependency. Audit reports are in `qa/` and are excluded from version control.

The earlier production audit on 6 November 2026, before the cursor construction sequence, scored **96 Performance, 100 Accessibility, 100 Best Practices and 100 SEO**. First Contentful Paint and Largest Contentful Paint were both 0.5s, Total Blocking Time was 50ms, and Speed Index was 2.1s. The complete report is `qa/lighthouse-desktop-final.report.html`; a compact machine-readable summary is `qa/results.json`.

To reproduce the desktop audit while the production preview is running:

```powershell
npm exec --yes --package=lighthouse -- lighthouse http://127.0.0.1:4173 --preset=desktop --output=html --output-path=./qa/lighthouse-desktop.html --chrome-flags="--headless"
```

Performance measurements depend on the computer and browser. The historical Lighthouse scores predate the cursor construction sequence and have not been rerun for it. Construction runs once per element per page load; reduced motion reveals the page immediately. The audit does not replace manual screen-reader testing.
