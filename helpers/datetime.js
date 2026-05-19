/**
 * Parse a date string into a Date, or null when invalid.
 * @param {string} dateString
 * @returns {Date|null}
 */
export function stringToDate(dateString) {
	if (dateString == null || dateString === '') {
		return null;
	}
	const trimmed = String(dateString).trim();
	const usMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
	if (usMatch) {
		const [, month, day, year] = usMatch;
		const usDate = new Date(Number(year), Number(month) - 1, Number(day));
		return Number.isNaN(usDate.getTime()) ? null : usDate;
	}
	const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
	if (timeMatch) {
		const [, hours, minutes, seconds = '0'] = timeMatch;
		const hour = Number(hours);
		const minute = Number(minutes);
		const second = Number(seconds);
		if (hour > 23 || minute > 59 || second > 59) {
			return null;
		}
		const today = new Date();
		const timeDate = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
			hour,
			minute,
			second,
		);
		return Number.isNaN(timeDate.getTime()) ? null : timeDate;
	}
	const parsed = new Date(trimmed);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDate(value) {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}
	if (typeof value === 'string') {
		return stringToDate(value);
	}
	if (typeof value === 'number') {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	return null;
}

function pad2(value) {
	return String(value).padStart(2, '0');
}

function applyFormat(date, formatString, tokenEntries) {
	const tokenMap = Object.fromEntries(
		tokenEntries.map(([token, value]) => [
			token,
			token === 'YYYY' ? String(value) : pad2(value),
		]),
	);
	const tokens = tokenEntries.map(([token]) => token).sort((a, b) => b.length - a.length);
	let result = formatString;
	for (const token of tokens) {
		result = result.replaceAll(token, tokenMap[token]);
	}
	return result;
}

/**
 * Format a date with tokens MM, DD, YYYY (e.g. MM/DD/YYYY).
 * @param {Date|string|number} date
 * @param {string} formatString
 * @returns {string}
 */
export function dateToString(date, formatString) {
	const parsed = toDate(date);
	if (!parsed) {
		return '';
	}
	return applyFormat(parsed, formatString, [
		['YYYY', parsed.getFullYear()],
		['MM', parsed.getMonth() + 1],
		['DD', parsed.getDate()],
	]);
}

/**
 * Format a time with tokens HH, MM, SS (e.g. HH:MM:SS).
 * @param {Date|string|number} date
 * @param {string} formatString
 * @returns {string}
 */
export function timeToString(date, formatString) {
	const parsed = toDate(date);
	if (!parsed) {
		return '';
	}
	return applyFormat(parsed, formatString, [
		['HH', parsed.getHours()],
		['MM', parsed.getMinutes()],
		['SS', parsed.getSeconds()],
	]);
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function calendarMonthGap(earlier, later) {
	let months =
		(later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());
	if (later.getDate() < earlier.getDate()) {
		months -= 1;
	}
	return Math.max(months, 0);
}

function calendarYearGap(earlier, later) {
	let years = later.getFullYear() - earlier.getFullYear();
	if (
		later.getMonth() < earlier.getMonth() ||
		(later.getMonth() === earlier.getMonth() && later.getDate() < earlier.getDate())
	) {
		years -= 1;
	}
	return Math.max(years, 0);
}

/**
 * Human-readable relative time between two dates.
 * @param {Date|string|number} date
 * @param {Date|string|number|null} [compareDate] defaults to now
 * @returns {string}
 */
export function timeDiff(date, compareDate = null) {
	const target = toDate(date);
	if (!target) {
		return '';
	}
	const reference =
		compareDate == null ? new Date() : toDate(compareDate);
	if (!reference) {
		return '';
	}

	const diffMs = target.getTime() - reference.getTime();
	const absMs = Math.abs(diffMs);
	const suffix = diffMs >= 0 ? 'soon' : 'ago';
	const earlier = diffMs >= 0 ? reference : target;
	const later = diffMs >= 0 ? target : reference;

	if (absMs < 5 * MINUTE_MS) {
		return 'Just Now';
	}

	const minutes = Math.floor(absMs / MINUTE_MS);
	if (absMs < HOUR_MS) {
		return `${minutes} min ${suffix}`;
	}

	const hours = Math.floor(absMs / HOUR_MS);
	if (absMs < 48 * HOUR_MS) {
		return `${hours} hr ${suffix}`;
	}

	const days = Math.floor(absMs / DAY_MS);
	if (days < 30) {
		return `${days} days ${suffix}`;
	}

	const months = calendarMonthGap(earlier, later);
	if (months < 12) {
		return `${months} monthes ${suffix}`;
	}

	const years = calendarYearGap(earlier, later);
	return `${years} years ago`;
}
