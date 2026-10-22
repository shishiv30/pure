function parseStop(token) {
	if (token === 'no_min' || token === 'no_max') {
		return token;
	}
	const number = Number(token);
	return Number.isFinite(number) ? number : token;
}

function formatStop(stop, price) {
	if (stop === 'no_min') {
		return 'no min';
	}
	if (stop === 'no_max') {
		return 'no max';
	}
	const number = Number(stop);
	let text = String(number);
	if (price) {
		if (number >= 1000000) {
			const millions = number / 1000000;
			text = Number.isInteger(millions) ? `${millions}m` : `${millions.toFixed(1)}m`;
		} else if (number >= 1000) {
			const thousands = number / 1000;
			text = Number.isInteger(thousands) ? `${thousands}k` : `${thousands.toFixed(1)}k`;
		}
		return `$${text}`;
	}
	return text;
}

function formatRangeLabel(minStop, maxStop, price, key) {
	const hasMin = minStop !== 'no_min';
	const hasMax = maxStop !== 'no_max';
	const minText = formatStop(minStop, price);
	const maxText = formatStop(maxStop, price);
	if (key === 'bed' || key === 'bath') {
		const unit = key === 'bed' ? 'bd' : 'ba';
		if (hasMin && !hasMax) {
			return key === 'bath' ? `${minText}+${unit}` : `${minText}+ ${unit}`;
		}
		if (!hasMin && hasMax) {
			return `>${maxText} ${unit}`;
		}
		if (hasMin && hasMax) {
			return `${minText}-${maxText} ${unit}`;
		}
		return '';
	}
	if (hasMin && !hasMax) {
		return `${minText}+`;
	}
	if (!hasMin && hasMax) {
		return `> ${maxText}`;
	}
	if (hasMin && hasMax) {
		return `${minText} – ${maxText}`;
	}
	return '';
}

export default {
	name: 'rangeslider',
	defaultOpt: {},
	init: function ($el, opt, exportObj) {
		const stops = String($el.dataset.stops || '')
			.split(',')
			.map((token) => parseStop(token.trim()))
			.filter((stop) => stop !== '');
		if (stops.length < 2) {
			return;
		}
		const price = $el.dataset.format === 'price';
		const key = $el.dataset.key || '';
		const last = stops.length - 1;
		let minIndex = Number($el.dataset.minIndex);
		let maxIndex = Number($el.dataset.maxIndex);
		if (!Number.isInteger(minIndex) || minIndex < 0 || minIndex > last) {
			minIndex = 0;
		}
		if (!Number.isInteger(maxIndex) || maxIndex < 0 || maxIndex > last) {
			maxIndex = last;
		}
		if (minIndex > maxIndex) {
			minIndex = maxIndex;
		}

		const track = $el.querySelector('.range-slider-track');
		const fill = $el.querySelector('.range-slider-fill');
		const minNode = $el.querySelector('[data-edge="min"]');
		const maxNode = $el.querySelector('[data-edge="max"]');
		const output = $el.querySelector('output');
		const minInput = $el.querySelector('input[data-edge="min"]');
		const maxInput = $el.querySelector('input[data-edge="max"]');
		if (!track || !minNode || !maxNode) {
			return;
		}

		let dragEdge = '';

		function place() {
			const minLeft = (minIndex / last) * 100;
			const maxLeft = (maxIndex / last) * 100;
			minNode.style.left = `${minLeft}%`;
			maxNode.style.left = `${maxLeft}%`;
			if (fill) {
				fill.style.left = `${minLeft}%`;
				fill.style.width = `${maxLeft - minLeft}%`;
			}
			const minStop = stops[minIndex];
			const maxStop = stops[maxIndex];
			if (output) {
				output.textContent = formatRangeLabel(minStop, maxStop, price, key);
			}
			if (minInput) {
				minInput.value = minStop === 'no_min' ? '' : String(minStop);
			}
			if (maxInput) {
				maxInput.value = maxStop === 'no_max' ? '' : String(maxStop);
			}
			$el.dataset.minIndex = String(minIndex);
			$el.dataset.maxIndex = String(maxIndex);
			$el.dispatchEvent(new Event('input', { bubbles: true }));
		}

		function indexFromEvent(event) {
			const rect = track.getBoundingClientRect();
			const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
			const clamped = Math.min(1, Math.max(0, ratio));
			return Math.round(clamped * last);
		}

		function move(edge, index) {
			if (edge === 'min') {
				minIndex = Math.min(index, maxIndex);
			} else {
				maxIndex = Math.max(index, minIndex);
			}
			place();
		}

		function onPointerMove(event) {
			if (!dragEdge) {
				return;
			}
			move(dragEdge, indexFromEvent(event));
		}

		function onPointerUp() {
			if (!dragEdge) {
				return;
			}
			dragEdge = '';
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			$el.dispatchEvent(new Event('change', { bubbles: true }));
		}

		function startDrag(edge, event) {
			dragEdge = edge;
			event.preventDefault();
			move(edge, indexFromEvent(event));
			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp);
		}

		$el.addEventListener('reset', () => {
			minIndex = 0;
			maxIndex = last;
			place();
		});

		minNode.addEventListener('pointerdown', (event) => startDrag('min', event));
		maxNode.addEventListener('pointerdown', (event) => startDrag('max', event));
		track.addEventListener('pointerdown', (event) => {
			if (event.target === minNode || event.target === maxNode) {
				return;
			}
			const index = indexFromEvent(event);
			const edge = Math.abs(index - minIndex) <= Math.abs(index - maxIndex) ? 'min' : 'max';
			startDrag(edge, event);
		});

		exportObj.get = function () {
			return { min: stops[minIndex], max: stops[maxIndex] };
		};
		place();
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: null,
};
