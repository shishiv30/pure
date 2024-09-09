import { trigger, emit, on, off } from '../core/event.js';

class IntervalTimer {
    constructor(callback, interval) {
        this.callback = callback;
        this.interval = interval;
        this.timerId = null;
        this.startTime = null;
        this.remaining = 0;
        this.state = IntervalTimer.STATES.IDLE;
        this.start();
        this.pause();
    }

    static get STATES() {
        return {
            IDLE: 0,
            RUNNING: 1,
            PAUSED: 2,
            RESUMED: 3,
        };
    }

    pause() {
        if (this.state !== IntervalTimer.STATES.RUNNING) return;

        this.remaining = Math.abs(this.interval - (Date.now() - this.startTime));
        clearInterval(this.timerId);
        this.state = IntervalTimer.STATES.PAUSED;
    }

    resume() {
        if (this.state !== IntervalTimer.STATES.PAUSED) return;

        this.state = IntervalTimer.STATES.RESUMED;
        setTimeout(this.timeoutCallback.bind(this), this.remaining);
    }

    timeoutCallback() {
        if (this.state !== IntervalTimer.STATES.RESUMED) return;

        this.callback();

        this.startTime = Date.now();
        this.timerId = setInterval(() => this.callback(), this.interval);
        this.state = IntervalTimer.STATES.RUNNING;
    }

    start() {
        if (this.state === IntervalTimer.STATES.IDLE) {
            this.startTime = Date.now();
            this.timerId = setInterval(() => this.callback(), this.interval);
            this.state = IntervalTimer.STATES.RUNNING;
        }
    }

    clear(force = false) {
        if (this.state !== IntervalTimer.STATES.IDLE || force) {
            clearInterval(this.timerId);
            this.state = IntervalTimer.STATES.IDLE;
        }
    }
}


export default {
    name: 'slider',
    defaultOpt: {
        data: [],
        startIndex: 0,
        autoPlay: false,
        showProcess: false,
        animationDuration: 4000,
        animationStyle: ['slider-fly-left', 'slider-zoom-in'],
        animationNextStyle: ['slider-next-zoom-in', 'slider-next-fly-left'],
    },
    init($el, opt, exportOb) {
        if (!Array.isArray(opt.data) || opt.data.length < 2) {
            return;
        }
        let index = Math.min(opt.data.length - 1, opt.startIndex);
        let index1 = index;
        let index2 = index < opt.data.length - 1 ? index + 1 : 0;
        let timer = null;
        let isPaused = true;
        let animationIndex = 0;
        let animateScript = [
            [0, 0],
            [1, 1],
        ];
        let intervalTimer = null;
        let goTo = function (index) {
            intervalTimer.clear();
            index = index;
            if (index < data.length - 1) {
                index1 = index;
                index2 = index + 1;
            } else {
                index1 = index;
                index2 = 0;
            }
            animationIndex = animationIndex + 1 >= animateScript.length ? 0 : animationIndex + 1;
            play();
            intervalTimer.start();
        };
        let goNext = function () {
            intervalTimer.clear();
            next();
            play();
            intervalTimer.start();
        };
        let goPrev = function () {
            intervalTimer.clear();
            prev();
            play();
            intervalTimer.start();
        };
        let next = function () {
            if (data.length <= 1) return;
            if (index + 1 < data.length) {
                index = index + 1;
            } else {
                index = 0;
            }
            if (index === index2) {
                index1 = index < data.length - 1 ? index + 1 : 0;
            } else {
                index2 = index < data.length - 1 ? index + 1 : 0;
            }

            animationIndex = animationIndex + 1 >= animateScript.length ? 0 : animationIndex + 1;
        };
        let prev = function () {
            if (data.length <= 1) return;
            let temp = index;
            index = index > 0 ? index - 1 : data.length - 1;

            if (index1 > index2) {
                index2 = temp;
                index1 = index;
            } else {
                index1 = temp;
                index2 = index;
            }
            animationIndex = animationIndex - 1 < 0 ? animateScript.length - 1 : animationIndex - 1;
        };
        let play = function () {
            $el.classList.remove('paused');
            intervalTimer.resume();
            emit('slider.play', [opt._pid]);
        };
        let update = function () {
            next();
        };
        let pause = function () {
            $el.classList.add('paused');
            intervalTimer.pause();
            emit('slider.pause', [opt._pid]);
        };
        let toggle = function () {
            if (isPaused) {
                play();
            } else {
                pause();
            }
        };
        let clearTimer = function () {
            if (intervalTimer) {
                intervalTimer.clear();
            }
        };
        let setAnimationDuration = function (duration) {
            $refs.img1.style.animationDuration = `${duration}ms`;
            $refs.img2.style.animationDuration = `${duration}ms`;
        };
        let init = function () {

        }

    }
}