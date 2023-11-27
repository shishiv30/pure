import { trigger, emit, on, off } from '../core/event.js';
import { stringToObj } from '../convert.js';

export default {
    name: 'player',
    defaultOpt: {
        images: [],
        imgIndex: 0,
        autoPlay: false,
        showProcess: true,
        showControl: true,
        animationDuration: 4000,
        direction: true,
    },
    init($el, opt, exportOb) {
        if (!opt.images) {
            return;
        }
        opt.images = stringToObj(opt.images);
        let index = Math.min(opt.images.length - 1, opt.imgIndex);
        let nextImage;
        let getFirstImg = function () {
            return $el.querySelector('img:first-of-type');
        }
        let getLastImg = function () {
            return $el.querySelector('img:last-of-type');
        }
        let _updateImage = function () {
            let nextImageIndex = index;
            if (opt.direction) {
                nextImageIndex = index + 1;
                if (index === opt.images.length - 1) {
                    nextImageIndex = 0;
                }
            } else {
                nextImageIndex = index - 1;
                if (index === 0) {
                    nextImageIndex = opt.images.length - 1;
                }
            }
            // console.log('load image ' + opt.images[nextImageIndex]);
            if (nextImage) {
                nextImage.src = opt.images[nextImageIndex];
            }
        };
        let _updateProcess = function () {
            let current = $el.querySelector('.player-processing > .active');
            if (current) {
                current.classList.remove('active');
            }
            let next = $el.querySelector(`.player-processing > button[data-index="${index}"]`);
            if (next) {
                next.classList.add('active');
            }
        }
        let _update = function (force) {
            _updateProcess();
            _updateImage();
            if (force) {
                $el.classList.add("reset");
                $el.offsetWidth;
                $el.classList.remove("reset");
                play();
            }
        }
        let goTo = function (i) {
            if (i < 0) {
                index = 0;
            } else if (i > opt.images.length - 1) {
                index = opt.images.length - 1;
            } else {
                index = i;
            }
            _update(true);
        };

        let goNext = function (force) {
            if (index == opt.images.length - 1) {
                index = 0;
            } else {
                index++;
            }
            opt.direction = true;
            // console.log(index);
            _update(force);
        };
        let goPrev = function (force) {
            if (index == 0) {
                index = opt.images.length - 1;
            } else {
                index--;
            }
            opt.direction = false;
            _update(force);
        };

        let play = function () {
            $el.classList.add('playing');
            emit('player.play', [opt._pid]);
        };
        let pause = function () {
            $el.classList.remove('playing');
            emit('player.pause', [opt._pid]);
        };
        let toggle = function () {
            if ($el.classList.contains('playing')) {
                pause();
            } else {
                play();
            }
        };
        let _switch = function () {
            if (opt.direction) {
                goNext();
            } else {
                goPrev();
            }
        }

        if (opt.showControl) {
            //insert some html into $el
            $el.innerHTML += `<div class="buttons">
                <button type="button" class="player-prev"></button>
                <button type="button" class="player-toggle"></button>
                <button type=" button" class="player-next"></button>
            </div>`;
        }
        if (opt.showProcess) {
            let html = '<div class="player-processing">';
            for (let i = 0; i < opt.images.length; i++) {
                html += `<button data-index="${i}"></button>`;
            }
            html += '</div>';
            $el.innerHTML += html;
        }

        $el.querySelector('img:first-of-type').addEventListener('animationiteration', () => {
            // console.log('first');
            nextImage = getLastImg();
            _switch();
        });

        $el.querySelector('img:last-of-type').addEventListener('animationiteration', () => {
            // console.log('last');
            nextImage = getFirstImg();
            _switch();
        });

        $el.querySelectorAll('.player-processing > button').forEach((item) => {
            item.addEventListener('click', () => {
                goTo(Number.parseInt(item.dataset.index));
            });
        });
        $el.querySelector('.player-toggle').addEventListener('click', () => {
            toggle();
        });
        $el.querySelector('.player-prev').addEventListener('click', () => {
            goPrev(true);
        });
        $el.querySelector('.player-next').addEventListener('click', () => {
            goNext(true);
        });
        _updateProcess();

        exportOb.goTo = goTo;
        exportOb.goNext = goNext;
        exportOb.goPrev = goPrev;
        exportOb.play = play;
        exportOb.pause = pause;
        exportOb.toggle = toggle;
    }
}