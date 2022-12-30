//select All
const selectAll = function (query, selector) {
	if (selector) {
		return selector.querySelectorAll(query);
	} else {
		return document.querySelectorAll(query);
	}
};
//select One
const select = function (query, selector) {
	if (selector) {
		return selector.querySelector(query);
	} else {
		return document.querySelector(query);
	}
};
export { selectAll, select };
