/**
 * @module server/configs/configbase
 * @description **Route config contract** for `BaseController` (`server/controllers/basecontroller.js`).
 *
 * Each entry in `server/configs/index.js` is a plain object keyed by `name`. `BaseController` loads it via
 * `config.find((e) => e.name === name)` and invokes hooks on that object.
 *
 * ### Identity and assets
 * - **`name`** (string, required for `toPage`) — Unique id for lookup; also the EJS template basename (`${name}.ejs`).
 * - **`assetName`** (string, optional) — Overrides bundle basename for `meta.css`, `meta.js`, and `meta.role`; defaults to `name`.
 *
 * ### GET / read
 * - **`get(payload)`** (optional) — Sync or async handler. `payload` is `req.query`, or the return value of `beforeGet`.
 * - **`beforeGet(req, payload)`** (optional) — `(req, req.query) => payloadForGet`.
 *
 * ### POST / update / delete
 * Payload starts as `req.body`; optional `before*` replaces it before the main handler:
 * - **`post` / `beforePost`**
 * - **`update` / `beforeUpdate`**
 * - **`delete` / `beforeDelete`**
 *
 * If `post` / `update` / `delete` is missing, the matching controller method returns `undefined`.
 *
 * ### HTML page (`toPage`)
 * - **`seo(req, model)`** (optional) — `{ title, desc, keywords }` or Promise thereof.
 * - **`preload(req, model)`** (optional) — Array of `{ as?, href? }` merged into `meta.preload` when non-empty.
 *
 * ### Errors
 * - **`onError(error, payload)`** (optional) — Return `{ message?, data?, code? }` for `exceptionDataHandler`; missing pieces default to `error.message`, `null`, `500`.
 *
 * Extra keys on config objects are allowed for other layers; `BaseController` only uses the fields above.
 *
 * @typedef {Object} BaseControllerRouteConfig
 * @property {string} name
 * @property {string} [assetName]
 * @property {(req: import('express').Request, payload: object) => object} [beforeGet]
 * @property {(payload: object) => unknown | Promise<unknown>} [get]
 * @property {(req: import('express').Request, payload: object) => object} [beforePost]
 * @property {(payload: object) => unknown | Promise<unknown>} [post]
 * @property {(req: import('express').Request, payload: object) => object} [beforeUpdate]
 * @property {(payload: object) => unknown | Promise<unknown>} [update]
 * @property {(req: import('express').Request, payload: object) => object} [beforeDelete]
 * @property {(payload: object) => unknown | Promise<unknown>} [delete]
 * @property {(req: import('express').Request, model: object) => object | Promise<object>} [seo]
 * @property {(req: import('express').Request, model: object) => Array<{as?: string, href?: string}> | null | undefined} [preload]
 * @property {(error: Error, payload: object) => {message?: string, data?: unknown, code?: number}} [onError]
 */

/** Sentinel export so this file stays a valid ES module (documentation-only). */
export const BASE_CONTROLLER_CONFIG_CONTRACT_VERSION = 1;
