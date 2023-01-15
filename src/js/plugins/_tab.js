import { selectAll } from '../core/query.js';
export default {
    name: 'tab',
    defaultOpt: {
        index: 0,
    },
    init: function ($el, opt, exportObj) {
        exportObj.toggle = function ($target) {
            if ($target.classList && $target.classList.contains('active')) {
                return;
            }
            selectAll('[data-target].active', $el).forEach((item) => {
                item.classList.remove('active');
                selectAll(`[data-id="${item.getAttribute('data-target')}"]`).forEach((panel) => {
                    panel.classList.add('hide');
                });
            });
            $target.classList.add('active');
            selectAll(`[data-id="${$target.getAttribute('data-target')}"]`).forEach((panel) => {
                panel.classList.remove('hide');
            });
        };
        selectAll('[data-target]', $el).forEach((item, i) => {
            selectAll(`[data-id="${item.getAttribute('data-target')}"]`).forEach((panel) => {
                if (i !== opt.index) {
                    panel.classList.add('hide');
                } else {
                    item.classList.add('active');
                }
            });
            item.addEventListener('click', (e) => {
                exportObj.toggle(e.target);
            });
        });
    },
};
