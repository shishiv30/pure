import { emit, on } from '../core/event.js';

export default {
  name: 'scrollview',
  defaultOpt: {},
  init: function ($el, opt, exportObj) {
    let getScrollPX = function () {
      let scrollWidth = $el.scrollWidth;
      let width = $el.clientWidth;
      $el.style.setProperty('--scroll-width', `${scrollWidth - width}px`);
    };
    getScrollPX();
    exportObj.getScrollPX = getScrollPX;
    on('dom.resize', getScrollPX);
  },
  setOptionsBefore: null,
  setOptionsAfter: null,
  initBefore: null,
  initAfter: null,
  destroyBefore: function ($el, opt, exportObj) {
    off('dom.resize', exportObj.getScrollPX);
  },
};
