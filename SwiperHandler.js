(function () {
    'use strict';
    var Swiper = require('swiper');

    /*===========================
    SwiperHandler
    ===========================*/
    var SwiperHandler = {
        window: null,
        swipers: {},
        initialized: false,
        initialize: function() {
            if (SwiperHandler.initialized) {
                return false;
            }

            SwiperHandler.window = $(window);
            var swiperId = 1;

            $('.initSwiper').each(function() {
                var $this = $(this);
                var idAttribute = 'swiperId-'+ swiperId;
                var selector = '#'+ idAttribute;

                $this.attr('id', idAttribute);
                SwiperHandler.swipers[swiperId] = {
                    selector: selector,
                    swiperSelector: selector +' .swiper-container',
                    element: $this,
                    settings: eval('(' + $this.attr('data-swiper-settings') + ')'),
                    instance: null,
                    currentBreakpoint: 0,
                    amountOfSlides: $('.swiper-slide', $this).length,
                };
                swiperId++;
            });

            SwiperHandler.buildAll();

            SwiperHandler.window.resize(function() {
                clearTimeout(SwiperHandler.window.resizedFinished);
                SwiperHandler.window.resizedFinished = setTimeout(SwiperHandler.rebuildOnResize, 250);
            });

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

            SwiperHandler.syncSwipers();
        },
        buildAll: function() {
            SwiperHandler._each(function(swiperId, swiper) {
                SwiperHandler.build(swiperId);
            });

            SwiperHandler.syncSwipers();
        },
        build: function(id) {
            var swiper = SwiperHandler.swipers[id];

            if (swiper.instance != null) {
                SwiperHandler.destroy(id);
            }

            swiper.instance = new Swiper(swiper.swiperSelector, SwiperHandler.getSettings(id));
        },
        syncSwipers: function() {
            SwiperHandler._each(function(swiperId, swiper) {
                var syncGroup = swiper.settings.syncGroup;
                if (syncGroup) {
                    SwiperHandler._each(function(iterationSwiperId, iterationSwiper) {
                        if (swiperId != iterationSwiperId && iterationSwiper.settings.syncGroup == syncGroup) {
                            swiper.instance.params.control = iterationSwiper.instance;
                        }
                    });
                }
            });
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
            newSettings.navigation.prevButton = swiper.selector + ' ' + (newSettings.navigation.prevEl || '.swiper-button-prev');
            newSettings.navigation.nextButton = swiper.selector + ' ' + (newSettings.navigation.nextEl || '.swiper-button-next');

            return newSettings;
        },
        getBreakpoint: function(id) {
            var swiper = SwiperHandler.swipers[id];

            for (width in swiper.settings.breakpoints) {
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
