/**
 * Escape text for safe HTML interpolation (demo SPA only).
 * @param {unknown} s
 * @returns {string}
 */
function esc(s) {
	return String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * @param {string} u
 * @returns {string}
 */
function imgSrc(u) {
	if (!u) {
		return '';
	}
	const t = String(u);
	if (t.startsWith('http') || t.startsWith('data:') || t.startsWith('//')) {
		return t;
	}
	return t;
}

/**
 * Build article card HTML (subset of server comp_article).
 * @param {object} article
 * @returns {string}
 */
function articleHtml(article) {
	if (!article) {
		return '';
	}
	const tags = (article.tags || [])
		.map((tag) => {
			const cls = tag.className ? ` ${esc(tag.className)}` : '';
			const label = esc(tag.text != null ? tag.text : tag.value || '');
			return `<span class="tag${cls}">${label}</span>`;
		})
		.join('');
	const attrs = (article.attrs || [])
		.map((attr) => {
			const v = attr.value ? `<span${attr.className ? ` class="${esc(attr.className)}"` : ''}>${esc(attr.value)}</span>` : '';
			const k = attr.key
				? `<abbr title="${esc(attr.desc || '')}">${esc(attr.key)}</abbr>`
				: '';
			return `<li>${v}${k}</li>`;
		})
		.join('');
	return `<li class="item"><article>
  <a href="${esc(article.href || '')}" data-id="${esc(article.id || '')}">
    <address>${esc(article.title || '')}</address>
  </a>
  <ul>${attrs}</ul>
  <figure>
    <img src="${esc(imgSrc(article.img))}" alt="${esc(article.imgAlt || '')}" loading="lazy" data-role="img-error">
    <figcaption>${esc(article.imgTag || '')}</figcaption>
  </figure>
  ${tags ? `<div class="tags">${tags}</div>` : ''}
</article></li>`;
}

/**
 * @param {object} data — demo `get()` model (window.context or API `data` field)
 * @returns {string}
 */
export function buildDemoSpaInnerHtml(data) {
	const d = data && data.detail;
	if (!d) {
		return '';
	}
	const album = d.album || {};
	const images = album.images || [];
	const initial = Math.min(album.initialIndex || 0, Math.max(0, images.length - 1));
	const firstImg = images.length ? imgSrc(images[initial]) : '';
	const dataImages = esc(JSON.stringify(images));
	const tagItems = (d.tags && d.tags.items) || [];
	const tags = tagItems
		.map((tag) => {
			const cls = tag.className ? ` ${esc(tag.className)}` : '';
			const label = esc(tag.text != null ? tag.text : tag.value || '');
			return `<span class="tag${cls}">${label}</span>`;
		})
		.join('');
	const recordItems = (d.record && d.record.items) || [];
	const record = recordItems
		.map((attr) => {
			const v = attr.value
				? `<span${attr.className ? ` class="${esc(attr.className)}"` : ''}>${esc(attr.value)}</span>`
				: '';
			const k = attr.key
				? `<abbr title="${esc(attr.desc || '')}">${esc(attr.key)}</abbr>`
				: '';
			return `<li>${v}${k}</li>`;
		})
		.join('');
	const timelineEntries = (d.timeline && d.timeline.entries) || [];
	const dates = timelineEntries
		.filter((entry) => entry.type === 'desc')
		.map(
			(entry) =>
				`<li><time>${esc(entry.date)}</time><strong>${esc(entry.text)}</strong></li>`,
		)
		.join('');
	const albumSection =
		images.length > 0
			? `<section class="section large demo-album-wrap"><div class="panel fixed fixed-max-xs grid grid-xs-1"><div class="album" data-role="album" data-index="${initial}" data-images="${dataImages}"><div class="album-list"><img src="${esc(firstImg)}" loading="lazy" alt="${esc(album.alt || '')}"></div></div></div></section>`
			: '';
	const nearby = data.nearbyArticleComponent;
	const nearbyItems = nearby && nearby.data && nearby.data.length
		? nearby.data.map(articleHtml).join('')
		: '';
	const nearbySection = nearbyItems
		? `<section class="result demo-nearby"><h2 class="f4">Nearby in area</h2><ul>${nearbyItems}</ul></section>`
		: '';
	const description = d.paragraph && d.paragraph.text;
	return `<section class="detail demo-detail"><div class="grid grid-xs-1"><h1 class="h3">${esc(d.title)}</h1>${
		tags ? `<div class="filter demo-detail-tags"><span class="f7">Tags</span>${tags}</div>` : ''
	}${albumSection}${
		description ? `<div class="demo-detail-description">${esc(description)}</div>` : ''
	}${
		record
			? `<h2 class="f4">Facts</h2><ul class="demo-detail-record">${record}</ul>`
			: ''
	}${
		dates ? `<h2 class="f4">History</h2><ul class="demo-detail-dates">${dates}</ul>` : ''
	}</div></section>${nearbySection}`;
}
