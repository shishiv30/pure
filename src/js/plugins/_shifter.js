import { select } from '../core/query.js';
import debounce from 'lodash/debounce';
export default {
    name: 'shifter',
    init: function ($el, opt, exportObj) {
        let shifter = $el;
        let scroller = document.querySelector('[data-role="scroller"]', shifter);
        let clientWidth = scroller.clientWidth;
        let scrollWidth = scroller.scrollWidth;
        if (scroller.children.length === 0) {
            return;
        }
        let cardWidth = scroller.children[0].clientWidth;
        let moveStep = opt.step > 0 ? opt.step : 0;
        if (moveStep === 0) {
            moveStep = clientWidth;
        } else {
            moveStep = cardWidth * moveStep;
        }
        exportObj.checkArrow = debounce(() => {
            let scrollLeft = scroller.scrollLeft;
            if (scrollLeft <= 2) {
                exportObj.hasPrev = false;
            } else {
                exportObj.hasPrev = true;
            }
            if (scrollLeft + clientWidth >= scrollWidth - 2) {
                exportObj.hasNext = false;
            } else {
                exportObj.hasNext = true;
            }

            if (exportObj.hasNext) {
                shifter.classList.remove('hidden-next');
            } else {
                shifter.classList.add('hidden-next');
            }
            if (exportObj.hasPrev) {
                shifter.classList.remove('hidden-prev');
            } else {
                shifter.classList.add('hidden-prev');
            }
        }, 100);

        exportObj.next = function () {
            scroller.scrollTo(scroller.scrollLeft + moveStep, 0);
        };

        exportObj.prev = function () {
            scroller.scrollTo(scroller.scrollLeft - moveStep, 0);
        };

        scroller.addEventListener('scroll', exportObj.checkArrow);
        exportObj.checkArrow();

        shifter.querySelector('.arrow.next').addEventListener('click', exportObj.next);
        shifter.querySelector('.arrow.prev').addEventListener('click', exportObj.prev);
    }
};
