export const stringToObj = function (str, opt = {}) {
    if (!str) return null;
    let obj = null;
    if (window[str]) {
        obj = window[str];
    } else {
        try {
            obj = JSON.parse(str);
        } catch (e) {
            console.error(e);
        }
    }
    return obj;
}