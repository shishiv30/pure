const formatPhone = function (phone) {
	return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};
const formatCurrency = function (value) {
	let strValue = value?.toString()?.split('.');
	if (/^\d+$/.test(strValue[0])) {
		strValue[0] = strValue[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}
	if (strValue[1] && /^\d+$/.test(strValue[1])) {
		strValue[0] += '.' + strValue[1];
	}
	return strValue[0];
};
const formatNumber = function (value) {
	let strValue = value?.toString()?.split('.');
	if (/^\d+$/.test(strValue[0])) {
		//format 100000 to 100,000
		strValue[0] = strValue[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}
	return strValue[0];
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
};

const formatClassToStatus = function (name) {
	if (!name) return name;
	return name.split('-').reduce((acc, cur) => {
		if (!cur) {
			return acc;
		}
		return acc + cur.charAt(0).toUpperCase() + cur.slice(1);
	}, '');
};

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
	formatClassToStatus,
};
