# Page data files

Section and layout data under `data/page/`: page section arrays plus header and footer comp data.

**Page sections** (for `/page/:key`): default export = array in order hero, scrollview, points, gallery, timeline.

| Key       | File         |
|-----------|--------------|
| index     | `index.js`   |
| ai-trend  | `ai-trend.js` |

Add page keys to `pagePath` in `header.js`. **Seed and sync:** `node cms/scripts/seed-and-sync.js` — seeds pages and comps from these files, syncs to remote CMS.
