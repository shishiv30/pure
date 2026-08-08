# Client-side JS lifetime (Pure)

Canonical reference for how webpack page bundles boot, run the Page/plugin pipeline, wire the demo Router, and refresh `[data-role]` components. Use this when debugging duplicate `init`, double fetches, or missing plugin binding after SPA HTML inject.

For the full `/demo/tx` path (build + Express SSR + APIs + client), see [`demo-tx-lifecycle.md`](demo-tx-lifecycle.md).

---

## 1. Document and bundle entry

```mermaid
sequenceDiagram
	participant Browser
	participant HTML as Page_HTML
	participant SSR as SSR_inline_script
	participant Bundle as Webpack_chunk

	Browser->>HTML: Parse DOM
	opt Server_rendered_page
		SSR->>Browser: window.context = JSON
		SSR->>Browser: meta.js script tag
	end
	HTML->>Bundle: Load e.g. demo.min.js
	Note over Bundle: Entry client/pages/demo/index.js
	Bundle->>Bundle: import chain loads core + plugins SCSS
```

| Stage | What runs | Where |
|--------|-----------|--------|
| Static HTML | Markup, optional `<!-- include:header.html -->` | `client/pages/<page>/index.html` |
| SSR extras | `window.context`, theme script | `server/ejs/html_below.ejs` |
| Webpack entry | Page IIFE: `window.page = main(win, settings)` | `client/pages/<name>/index.js` |
| Build config | One chunk per page name | `webpack.config.base.page.js` |

---

## 2. Module evaluation (once per script execution)

When the bundle entry module runs, imports execute **top-down** before `main()`:

```mermaid
flowchart TD
	subgraph moduleEval [Module evaluation order]
		A[demo/index.js imports]
		B[index.js imports Page Plugin plugins]
		C[installDOMHooks]
		D[Each plugin module loaded]
		E[IIFE main win settings]
		A --> B --> C --> D --> E
	end
```

**`installDOMHooks()`** ([`client/js/core/dom.hook.js`](../client/js/core/dom.hook.js), called from [`client/js/index.js`](../client/js/index.js)):

- Patches `innerHTML` / `outerHTML` / `textContent` / `innerText` setters on prototypes.
- On DOM writes: queue plugin cleanup + `emit('dom.updated')` → targeted `Page.refreshComponents(el)`.

Runs **once per bundle evaluation**, not inside `main()`.

---

## 3. `main()` bootstrap

```mermaid
flowchart TB
	main[main frame settings]
	reg[Loop plugins index new Plugin each]
	ctx[root.ctx = root.ctx or empty]
	page[new Page root.ctx settings]
	init[page.init no args]
	assign[Object.assign root exportObj Plugin]

	main --> reg --> ctx --> page --> init --> assign

	subgraph pageInit [page.init Plugin.init pipeline]
		direction TB
		el["$el = body if missing"]
		ctxSetup[Page wrapper init initCtxByWindow Ua Url Cookie Storage]
		demoInit[demo.init defBool defEnum updateDetail new Router]
		demoLoad[demo.load switchToDetail or Grid delay]
		demoRender[demo.render empty]
		pageRender[Page wrapper render eventListener emit dom.load]
		el --> ctxSetup --> demoInit --> demoLoad --> demoRender --> pageRender
	end

	init --> pageInit
```

| Step | File | Behavior |
|------|------|----------|
| Register plugins | `client/js/plugins/index.js` | `new Plugin(setting)` → `Plugin.register` → `Plugin.records['cui_<name>']` |
| Page instance | `client/js/core/page.js` | Merges page-specific settings (e.g. `demo`) into Plugin lifecycle |
| `page.init()` | `client/js/index.js` | Direct call on `Page` instance (not via `data-role` scan) |
| `exportObj` | Same | Exposed as `window.exportObj` after promise resolves |

**Important:** Widget plugins use `data-role` + `refreshComponents`. The **page/demo** plugin runs only via `main()` → `page.init()`, not by scanning the body for `data-role="demo"`.

---

## 4. Demo `init`: Router and global listeners

Inside `demo.init` ([`client/pages/demo/index.js`](../client/pages/demo/index.js)):

```mermaid
flowchart LR
	demoInit[demo.init]
	router[new Router rules linkScope demo]
	rInit[Router.init]
	click[document click listener]
	pop[window popstate listener]
	replace[replace current pathname]

	demoInit --> router --> rInit
	rInit --> click
	rInit --> pop
	rInit --> replace
```

| `Router.init` | Effect |
|---------------|--------|
| `click` | Intercepts same-origin `/demo/` links → `push()` → rule `loading` |
| `popstate` | Back/forward → `navigate` |
| `replace(pathname)` | Initial route sync (detail URL can trigger `updateDetail` on load) |

**Lifetime issue (fixed):** Each `new Router()` used to add another `document` click listener with no teardown. **Now:** `Router.destroy()` removes listeners; constructing a new `Router` destroys `Router.active`; `main()` is idempotent per frame (`__pureMainPage` boot guard). HMR can call `resetMain()` via `module.hot.dispose`.

If `main()` / `demo.init` still appears to double-fetch, check that the entry script is not evaluated twice without dispose, and that DevTools shows a single `document` click listener.

---

## 5. First `dom.load` and `[data-role]` plugins

After page `render`, `Page.eventListener()` ([`client/js/core/page.js`](../client/js/core/page.js)) runs once per completed `page.init`:

```mermaid
flowchart TB
	emit[emit dom.load]
	debounce[on dom.load debounced 100ms]
	scan[Page.refreshComponents document]
	loop[For each data-role not loaded]
	pluginFn[Plugin.records cui_name element dataset]
	pipeline[Plugin instance init load render]

	emit --> debounce --> scan --> loop --> pluginFn --> pipeline
```

**Stacking:** Every full `page.init()` → `render` → `Page.eventListener()` adds **another** debounced `dom.load` handler on the custom event bus ([`client/js/core/event.js`](../client/js/core/event.js)), not `document.addEventListener('dom.load')`.

---

## 6. Demo SPA detail path

```mermaid
sequenceDiagram
	participant User
	participant Router
	participant Index as demo_index.js
	participant API as GET_api_demo_detail
	participant EJS as detailSpa_buildDemoSpaInnerHtml
	participant DOM as inject_outerHTML
	participant Ev as emit_dom_load

	User->>Router: Click detail link
	Router->>Index: loading rule updateDetail prId
	Index->>API: fetch
	API-->>Index: envelope.data
	Index->>EJS: renderEjsTemplate comp_article_detail + nearby
	EJS-->>Index: HTML string
	Index->>DOM: injectDemoSpaHtml
	Index->>Ev: emit dom.load
	Ev->>Index: refreshComponents sliders list-dict etc
```

| Piece | Role |
|-------|------|
| `client/pages/demo/detailSpa.js` | Webpack-compiled EJS → HTML |
| `client/js/core/renderEjs.js` + `helpers/ejsRenderContext.js` | `getHref` / `getSrc` like SSR |
| `injectDemoSpaHtml` | Replaces `#detail` and `section.result` `outerHTML` |
| `emit('dom.load')` | Re-binds plugins on new markup |

`outerHTML` updates go through DOM hooks → `dom.updated` → partial `refreshComponents`. See also [`docs/listing-data-pipeline.md`](listing-data-pipeline.md).

---

## 7. Ongoing runtime (after boot)

```mermaid
flowchart TB
	subgraph persistent [Long-lived globals]
		RouterClick[document click handlers Nx if reinited]
		RouterPop[window popstate handlers Nx]
		DomLoadHandlers[dom.load bus handlers Nx]
		DOMHooks[prototype innerHTML outerHTML patches 1x per bundle eval]
		PluginRegistry[Plugin.records all registered plugins]
	end

	subgraph onDemand [On user or code action]
		Nav[Router push replace]
		SPA[updateDetail fetch inject]
		Resize[window resize debounced dom.resize]
		Scroll[window scroll debounced dom.scroll]
		Write[DOM innerHTML outerHTML dom.updated refresh]
	end

	persistent --> onDemand
```

---

## 8. When the graph runs again (duplicate lifetime)

```mermaid
flowchart LR
	HMR[Webpack HMR re-executes entry module]
	main2[main win demo again]
	init2[demo.init again]
	router2[new Router again]

	HMR --> main2 --> init2 --> router2
```

Same in production if the entry script were evaluated twice (unusual).

**Symptoms (before fix):**

- `console.count('demo.init')` → 2+
- `updateDetail` / detail API called twice per click
- Multiple `document` click listeners (DevTools: `getEventListeners(document).click`)

**Not caused by:** `refreshComponents` alone (does not call `demo.init`). **Was caused by:** repeated `Router.init()` without teardown.

**Mitigation (implemented):** `Router.destroy()` + `Router.active` singleton teardown; `main()` boot guard (`__pureMainPage`); `resetMain()` for HMR dispose. See [`client/js/core/router.js`](../client/js/core/router.js) and [`client/js/index.js`](../client/js/index.js).

---

## 9. Quick reference: who owns what

| Concern | Owner | Init trigger |
|---------|--------|----------------|
| Page context (`exportObj.ctx`) | `Page` wrapper | `page.init()` |
| Demo view state (`switchToGrid`, etc.) | `defEnum` on `body` | `demo.init` |
| Client routing | `Router` | `demo.init` → `new Router` |
| Detail HTML + fetch | `exportObj.updateDetail` | Router `loading` or manual |
| Widget plugins (slider, header, …) | `Plugin.register` | `dom.load` / `dom.updated` → `refreshComponents` |
| SOA-shaped data | `window.context` / API envelope | SSR inline or `updateDetail` assign |

---

## Related docs

- [`client.md`](../client.md) — plugin model, SCSS, practical guidelines
- [`docs/listing-data-pipeline.md`](listing-data-pipeline.md) — demo data → EJS / SPA
- [`build-system.md`](../build-system.md) — webpack entries and output
