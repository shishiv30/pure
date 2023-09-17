// import _ from 'lodash';
// import { emit } from '../core/event.js';
// (function ($) {
//     $.fn.facebooklink = function() {
//         let $this = $(this);
//         let namespace = {
//             go: function() {
//                 let keyword = $this.data('keyword');
//                 let url = encodeURIComponent(location.href);
//                 if (keyword)
//                     url = url + '&t=' + encodeURIComponent(keyword);
//                 window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, 'facebook-share-dialog', 'sharer', 'toolbar=0,status=0,width=626,height=436');
//             }
//         };
//         $this.click(namespace.go);
//         $this.data('facebooklink', namespace);
//         return namespace;
//     };
//     $.fn.googlepluslink = function() {
//         let $this = $(this);
//         let namespace = {
//             go: function() {
//                 window.open('https://plus.google.com/share?url=' + encodeURIComponent(location.href), 'googlesharer', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
//             }
//         };
//         $this.data('googlepluslink', namespace);
//         return namespace;
//     };
//     $.fn.twitterlink = function() {
//         let $this = $(this);
//         let namespace = {
//             go: function() {
//                 window.open('http://twitter.com/share?text=Check out this house I found on @Conjee&url=' + encodeURIComponent(location.href));
//             }
//         };
//         $this.click(namespace.go);
//         $this.data('twitterlink', namespace);
//         return namespace;
//     };
//     $.fn.phonecall = function() {
//         let $this = $(this);
//         let number = $this.data('phonecall');
//         let namespace = {
//             go: function() {
//                 window.location.href = 'tel:1' + number;
//             }
//         };
//         $this.click(namespace.go);
//         $this.data('phonecall', namespace);
//         return namespace;
//     };
//     $.fn.mailto = function() {
//         let $this = $(this);
//         let mail = $this.data('mailto');
//         let params = $this.data('params');
//         let namespace = {
//             go: function() {
//                 let link = 'mailto:' + mail;
//                 if (params) {
//                     link = link + '?' + params;
//                 }
//                 window.location.href = link;
//             }
//         };
//         $this.click(namespace.go);
//         $this.data('mailto', namespace);
//         return namespace;
//     };
//     $.fn.msgto = function() {
//         let $this = $(this);
//         let text = $this.data('msgto');
//         let smsChar = (browser && browser.versions && browser.versions.ios) ? '&' : '?';
//         let namespace = {
//             go: function() {
//                 window.location.href = 'sms:' + smsChar + 'body=' + text;
//             }
//         };
//         $this.click(namespace.go);
//         $this.data('msgto', namespace);
//         return namespace;
//     };
//     $(document).addEventListener('click', '[data-link]', function() {
//         let $this = $(this);
//         let type = $this.attr('data-link');
//         let target = $this.attr('data-target');
//         switch (type) {
//             case 'facebook':
//                 $this.facebooklink().go();
//                 break;
//             case 'googleplus':
//                 $this.googlepluslink().go();
//                 break;
//             case 'twitter':
//                 $this.twitterlink().go();
//                 break;
//             case 'phonecall':
//                 $this.phonecall().go();
//                 break;
//             case 'mailto':
//                 $this.mailto().go();
//                 break;
//             case 'msgto':
//                 $this.msgto().go();
//                 break;
//             case 'focuson':
//                 let timer = setTimeout(function() {
//                     $(target).focus();
//                 }, 100);
//                 $this.addEventListener('click', function() {
//                     if (timer) {
//                         clearTimeout(timer);
//                     }
//                     timer = setTimeout(function() {
//                         $(target).focus();
//                     }, 100);
//                 });
//                 break;
//             case 'utm':
//                 $this.utmlink().go();
//                 return false;
//             default:
//                 $.sendRequest($this.attr('href'), {
//                     type: 'redirect'
//                 });
//                 break;
//         }
//         $this.removeAttr('data-link');
//     });
//
