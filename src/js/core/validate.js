const isMobile = function (userAgent) {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

const isNumber = function (value) {
	return typeof value === 'number' && isFinite(value);
};
const isString = function (value) {
	return typeof value === 'string' || value instanceof String;
};
const isBoolean = function (value) {
	return typeof value === 'boolean';
};
const isFunction = function (value) {
	return typeof value === 'function';
};
const isObject = function (value) {
	return value && typeof value === 'object' && value.constructor === Object;
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
export {
	isMobile,
	isNumber,
	isString,
	isBoolean,
	isFunction,
	isObject,
	isPhoneNumber,
	isEmail,
	isUrl,
	isDate,
};
