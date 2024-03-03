//get function is inter from loaddash
import isInteger from 'lodash/isInteger.js';

const isMobile = function (userAgent) {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

const isPhoneNumber = function (value) {
	return /^\d{10}$/.test(value);
};
const isEmail = function (value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};
const isUrl = function (value) {
	return /^(ftp|http|https):\/\/[^ "]+$/.test(value);
};
const isDate = function (value) {
	return value instanceof Date && !isNaN(value);
};
const isZipcode = function (value) {
	return /^\d{5}$/.test(value);
};

const isPrice = function (value) {
	return isInteger(value) && value > 0;
};

export { isMobile, isPhoneNumber, isEmail, isUrl, isDate, isZipcode, isPrice };
