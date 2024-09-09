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
            $el.querySelectorAll('[data-target].active').forEach((item) => {
                item.classList.remove('active');
                document.querySelectorAll(`[data-id="${item.dataset.target}"]`).forEach((panel) => {
                    panel.classList.add('hide');
                });
            });
            $target.classList.add('active');
            document.querySelectorAll(`[data-id="${$target.dataset.target}"]`).forEach((panel) => {
                panel.classList.remove('hide');
            });
        };
        $el.querySelectorAll('[data-target]').forEach((item, i) => {
            $el.querySelectorAll(`[data-id="${item.dataset.target}"]`).forEach((panel) => {
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
