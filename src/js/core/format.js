const formatPhone = function (phone) {
	return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};
const formatCurrency = function (value) {
	return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};
const formatNumber = function (value) {
	return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};
const formatPercent = function (value) {
	return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + '%';
};
const formatDate = function (date) {
	return date.toLocaleDateString();
};
const formatDateTime = function (date) {
	return date.toLocaleString();
};
const formatTime = function (date) {
	return date.toLocaleTimeString();
};
const formatSqft = function (value) {
	if (value < 20000) {
		return formatNumber(value) + ' sqft';
	} else {
		return (value / 43560).toFixed(1) + ' acres';
	}
};
const formatPrice = function (value) {
	if (value < 1000) {
		return value;
	} else if (value < 1000000) {
		return (value / 1000).toFixed(1) + 'K';
	} else {
		return (value / 1000000).toFixed(1) + 'M';
	}
};
const formatTrim = function (value) {
	if (!value) return value;
	return value.replace(/^\s+|\s+$/g, '');
}

const formatCaplized = function (name) {
	if (!name) return name;
	return name.charAt(0).toUpperCase() + name.slice(1);
}

export {
	formatTrim,
	formatPhone,
	formatCurrency,
	formatNumber,
	formatPercent,
	formatDate,
	formatDateTime,
	formatTime,
	formatSqft,
	formatPrice,
	formatCaplized
};
