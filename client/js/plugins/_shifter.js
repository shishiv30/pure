import debounce from 'lodash/debounce.js';
import { defBool } from '../core/def.js';

// boolean UI statuses controlled by CSS classes on the shifter element:
// - hidden-next: hide the "next" arrow when there is no more content
// - hidden-prev: hide the "prev" arrow when already at the start
const boolStatus = ['hidden-next', 'hidden-prev'];

export default {
    name: 'shifter',
    init: function ($el, opt, exportObj) {
        const shifter = $el;
        const scroller = document.querySelector('[data-role="scroller"]', shifter);
        const clientWidth = scroller.clientWidth;
        const scrollWidth = scroller.scrollWidth;
        if (scroller.children.length === 0) {
            return;
        }
        const cardWidth = scroller.children[0].clientWidth;
        let moveStep = opt.step > 0 ? opt.step : 0;
        if (moveStep === 0) {
            moveStep = clientWidth;
        } else {
            moveStep = cardWidth * moveStep;
        }

        boolStatus.forEach((name) => {
            defBool(name, shifter, opt, exportObj);
        });

        // create prev/next arrow buttons if they don't already exist
        let prevArrow = shifter.querySelector('.arrow.prev');
        let nextArrow = shifter.querySelector('.arrow.next');

        if (!prevArrow) {
            prevArrow = document.createElement('button');
            prevArrow.type = 'button';
            prevArrow.className = 'arrow prev circle small';
            prevArrow.innerHTML = '<i class="icon-angle-left"></i>';
            shifter.insertBefore(prevArrow, scroller);
        }

        if (!nextArrow) {
            nextArrow = document.createElement('button');
            nextArrow.type = 'button';
            nextArrow.className = 'arrow next circle small';
            nextArrow.innerHTML = '<i class="icon-angle-right"></i>';
            shifter.appendChild(nextArrow);
        }

        exportObj.checkArrow = debounce(() => {
            const scrollLeft = scroller.scrollLeft;
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
                exportObj.removeHiddenNext();
            } else {
                exportObj.addHiddenNext();
            }
            if (exportObj.hasPrev) {
                exportObj.removeHiddenPrev();
            } else {
                exportObj.addHiddenPrev();
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

        nextArrow.addEventListener('click', exportObj.next);
        prevArrow.addEventListener('click', exportObj.prev);
    }
};
