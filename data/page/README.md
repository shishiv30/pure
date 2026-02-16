# Page data files

Section and layout data under `data/page/`: page section arrays plus header and footer comp data.

**Page sections** (for `/page/:key`): default export = array in order hero, scrollview, points, gallery, timeline.

| Key       | File         | Push to CMS |
|-----------|--------------|-------------|
| index     | `index.js`   | `node cms/scripts/push-page-index.js` |
| ai-trend  | `ai-trend.js` | `node cms/scripts/push-page.js ai-trend data/page/ai-trend.js` |

**Header / footer** (nav and footer comps): `header.js`, `footer.js`. Header link to AI Trend: `/page/ai-trend`. Push: `node cms/scripts/push-comp.js header data/page/header.js`, `node cms/scripts/push-comp.js footer`. Server uses these in `comp_header.js` and `comp_footer.js`.
