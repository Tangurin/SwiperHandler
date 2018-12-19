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
                    allowAutoplay: true,
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
        syncSwipers: function() {
            SwiperHandler._each(function(swiperId, swiper) {
                for (var i in swiper.syncsWith) {
                    var syncsWithSwiper = SwiperHandler.swipers[ swiper.syncsWith[i] ];
                    if (syncsWithSwiper.instance.controller && swiper.instance.controller) {
                        swiper.instance.controller.control = syncsWithSwiper.instance;
                    }
                }
            });
        },
        bindEvents () {
            SwiperHandler._each(function(swiperId, swiper) {
                swiper.instance.on('click touchEnd', function(e) {
                    SwiperHandler.toggleAutoplay(swiperId, false, true);
                    SwiperHandler.toggleAutoplayOnSynced(swiperId, false, true);
                });

                $(swiper.settings.default.navigation.prevEl +','+ swiper.settings.default.navigation.nextEl).on('click', function() {
                    SwiperHandler.toggleAutoplay(swiperId, false, true);
                    SwiperHandler.toggleAutoplayOnSynced(swiperId, false, true);
                });
            });
        },
        pauseOnHover: function(id) {
            var swiper = SwiperHandler.swipers[id];
            if ( ! swiper.settings.pauseOnHover) {
                return;
            }

            swiper.element.on('mouseover', function() {
                SwiperHandler.toggleAutoplay(id, false);
                SwiperHandler.toggleAutoplayOnSynced(id, false);
            });

            swiper.element.on('mouseleave', function() {
                if (swiper.allowAutoplay) {
                    SwiperHandler.toggleAutoplay(id, true);
                    SwiperHandler.toggleAutoplayOnSynced(id, true);
                }
            })
        },
        toggleAutoplay: function(id, play, removeAutoPlay) {
            var swiper = SwiperHandler.swipers[id];
            var play = play || false;
            var removeAutoPlay = removeAutoPlay || false;

            if (!swiper.instance.autoplay || !swiper.settings.default.autoplay) {
                return;
            }

            if (play) {
                swiper.instance.autoplay.start();
            } else {
                swiper.instance.autoplay.stop();
            }

            if (removeAutoPlay) {
                swiper.allowAutoplay = false;
            }
        },
        toggleAutoplayOnSynced (id, play, removeAutoPlay) {
            var swiper = SwiperHandler.swipers[id];
            var play = play || false;
            var removeAutoPlay = removeAutoPlay || false;

            for (var i in swiper.syncsWith) {
                var syncedSwiper = SwiperHandler.swipers[ swiper.syncsWith[i] ];

                if (!syncedSwiper.instance.autoplay || !syncedSwiper.settings.default.autoplay) {
                    return;
                }

                if (play) {
                    syncedSwiper.instance.autoplay.start();
                } else {
                    syncedSwiper.instance.autoplay.stop();
                }

                if (removeAutoPlay) {
                    syncedSwiper.allowAutoplay = false;
                }
            }
        },
        getSettings: function(id) {
            var swiper = SwiperHandler.swipers[id];
            //Make sure there is a default navigation config
            var navigation = swiper.settings.default.navigation || {};
            navigation.prevEl = swiper.selector + ' ' + (navigation.prevEl || '.swiper-button-prev'),
            navigation.nextEl = swiper.selector + ' ' + (navigation.nextEl || '.swiper-button-next'),
            SwiperHandler.swipers[id].settings.default.navigation = navigation;

            var settings = swiper.settings || {};

            var breakpointSettings = {};
            swiper.currentBreakpoint = SwiperHandler.getBreakpoint(id);
            if (swiper.currentBreakpoint > 0) {
                breakpointSettings = swiper.settings.breakpoints[swiper.currentBreakpoint];
            }
            
            var newSettings = settings.default || {};
            newSettings = $.extend({}, newSettings, breakpointSettings);

            if (settings.centerSlidesIfTooFew && swiper.amountOfSlides < newSettings.slidesPerView) {
                newSettings.centeredSlides = true;
            }

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
