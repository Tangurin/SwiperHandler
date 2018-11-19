(function () {
    'use strict';
    var Swiper = require('swiper');
    if (typeof Swiper.default != 'undefined') {
        Swiper = Swiper.default;
    }

    /*===========================
    SwiperHandler
    ===========================*/
    var SwiperHandler = {
        window: null,
        swiperId: 1,
        swipers: {},
        initialized: false,
        initialize: function() {
            var self = this;
            $('.initSwiper').each(function() {
                var $this = $(this);
                if ($this.hasClass('initialized')) {
                    return true;
                }
                var idAttribute = 'swiperId-'+ self.swiperId;
                var selector = '#'+ idAttribute;

                $this.attr('id', idAttribute);
                SwiperHandler.swipers[self.swiperId] = {
                    selector: selector,
                    swiperSelector: selector +' .swiper-container',
                    element: $this,
                    settings: eval('(' + $this.attr('data-swiper-settings') + ')'),
                    instance: null,
                    currentBreakpoint: 0,
                    syncsWith: [],
                    amountOfSlides: $('.swiper-slide', $this).length,
                };
                self.swiperId++;
            });

            SwiperHandler.findSyncs();

            if (SwiperHandler.initialized === false) {
                SwiperHandler.window = $(window);
                SwiperHandler.window.resize(function() {
                    clearTimeout(SwiperHandler.window.resizedFinished);
                    SwiperHandler.window.resizedFinished = setTimeout(SwiperHandler.rebuildOnResize, 250);
                });
            }

            SwiperHandler.buildAll(true);

            SwiperHandler.initialized = true;
        },
        rebuildOnResize: function() {
            SwiperHandler._each(function(swiperId, swiper) {
                var swiper = SwiperHandler.swipers[swiperId];
                var breakpoint = SwiperHandler.getBreakpoint(swiperId);

                if (swiper.currentBreakpoint != breakpoint) {
                    SwiperHandler.build(swiperId);
                }
            });

            SwiperHandler.onAllSwipersBuilt();
        },
        buildAll: function(dontDestroy) {
            SwiperHandler._each(function(swiperId, swiper) {
                SwiperHandler.build(swiperId, dontDestroy);
            });

            SwiperHandler.onAllSwipersBuilt();
        },
        build: function(id, dontDestroy) {
            var dontDestroy = dontDestroy || false;
            var swiper = SwiperHandler.swipers[id];

            if (dontDestroy === false && swiper.instance != null) {
                SwiperHandler.destroy(id);
            }

            swiper.instance = new Swiper(swiper.swiperSelector, SwiperHandler.getSettings(id));
            SwiperHandler.pauseOnHover(id);
            swiper.element.addClass('initialized');
        },
        findSyncs () {
            SwiperHandler._each(function(swiperId, swiper) {
                var syncGroup = swiper.settings.syncGroup;
                if (syncGroup) {
                    SwiperHandler._each(function(iterationSwiperId, iterationSwiper) {
                        if (swiperId != iterationSwiperId && iterationSwiper.settings.syncGroup == syncGroup) {
                            swiper.syncsWith.push(parseInt(iterationSwiperId));
                        }
                    });
                }
            });
        },
        onAllSwipersBuilt: function() {
            SwiperHandler.syncSwipers();
            SwiperHandler.bindEvents();
        },
        pauseOnHover: function(id) {
            var swiper = SwiperHandler.swipers[id];
            if ( ! swiper.settings.pauseOnHover || (swiper.instance.autoplay && swiper.instance.autoplay.running == false) ) {
                return;
            }

            swiper.element.on('mouseover', function() {
                swiper.instance.autoplay.stop();
            });
            swiper.element.on('mouseleave', function() {
                swiper.instance.autoplay.start();
            })
        },
        getSettings: function(id) {
            var swiper = SwiperHandler.swipers[id];
            var settings = swiper.settings || {};
            var newSettings = settings.default || {};
            var breakpoint = SwiperHandler.getBreakpoint(id);
            var breakpointSettings = {};

            swiper.currentBreakpoint = breakpoint;
            if (breakpoint > 0) {
                breakpointSettings = swiper.settings.breakpoints[breakpoint];
            }
            newSettings = $.extend({}, newSettings, breakpointSettings);

            if (settings.centerSlidesIfTooFew && swiper.amountOfSlides < newSettings.slidesPerView) {
                newSettings.centeredSlides = true;
            }

            //Add empty navigation if not exists
            newSettings.navigation = newSettings.navigation || {};
            //Add current swiper-selector before prev/next nav button
            newSettings.navigation.prevEl = swiper.selector + ' ' + (newSettings.navigation.prevEl || '.swiper-button-prev');
            newSettings.navigation.nextEl = swiper.selector + ' ' + (newSettings.navigation.nextEl || '.swiper-button-next');

            return newSettings;
        },
        getBreakpoint: function(id) {
            var swiper = SwiperHandler.swipers[id];

            for (var width in swiper.settings.breakpoints) {
              if (SwiperHandler.window.width() <= width) {
                return width;
              }
            }

            return 0;
        },
        destroyAll: function() {
            SwiperHandler._each(function(swiperId, swiper) {
                SwiperHandler.destroy(swiperId);
            });
        },
        destroy: function(id) {
            if (SwiperHandler.swipers[id].instance != null) {
                SwiperHandler.swipers[id].instance.destroy(false, true);
            }
        },
        _each: function(callback) {
            if (typeof callback != 'function') {
                return false;
            }
            $.each(SwiperHandler.swipers, function(swiperId, swiper) {
                callback(swiperId, swiper);
            });
        },
    };
    
    window.SwiperHandler = SwiperHandler;
})();

/*===========================
SwiperHandler AMD Export
===========================*/
if (typeof(module) !== 'undefined')
{
    module.exports = window.SwiperHandler;
}
else if (typeof define === 'function' && define.amd) {
    define([], function () {
        'use strict';
        return window.SwiperHandler;
    });
}
