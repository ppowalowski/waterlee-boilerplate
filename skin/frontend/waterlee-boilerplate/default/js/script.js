/*!
 * Modernizr v2.8.3
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */

window.Modernizr = (function( window, document, undefined ) {

    var version = '2.8.3',

    Modernizr = {},

    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
    enableClasses = true,
    /*>>cssclasses*/

    docElement = document.documentElement,

    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem /*>>inputelem*/ = document.createElement('input') /*>>inputelem*/ ,

    /*>>smile*/
    smile = ':)',
    /*>>smile*/

    toString = {}.toString,

    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/

    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/

    // More here: github.com/Modernizr/Modernizr/issues/issue/21
    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/

    /*>>ns*/
    ns = {'svg': 'http://www.w3.org/2000/svg'},
    /*>>ns*/

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, // used in testing loop


    /*>>teststyles*/
    // Inject element with style element and some CSS rules
    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
          // After page load injecting a fake body doesn't work so check if body exists
          body = document.body,
          // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
          fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
          // In order not to give false positives we create a node for each test
          // This also allows the method to scale for unspecified uses
          while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
      style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
      // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
          //avoid crashing IE8, if background image is used
          fakeBody.style.background = '';
          //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
          fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
      // If this is done after page load we don't want to remove the body so check if body exists
      if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },
    /*>>teststyles*/

    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq) && matchMedia(mq).matches || false;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
     /*>>mq*/


    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;

        if ( !isSupported ) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

            // If property was created, "remove it" (by setting value to `undefined`)
            if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),
    /*>>hasevent*/

    // TODO :: Add flag for hasownprop ? didn't last time

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }

    // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
    // es5.github.com/#x15.3.4.5

    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss( str ) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is( obj, type ) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    /*>>testprop*/

    // testProps is a generic CSS / DOM property test.

    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.

    // Because the testing of the CSS property names (with "-", as
    // opposed to the camelCase DOM properties) is non-portable and
    // non-standard but works in WebKit and IE (but not Gecko or Opera),
    // we explicitly reject properties with dashes so that authors
    // developing in WebKit or IE first don't end up with
    // browser-specific content by accident.

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }
    /*>>testprop*/

    // TODO :: add testDOMProps
    /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                // return the property name as a string
                if (elem === false) return props[i];

                // let's bind a function
                if (is(item, 'function')){
                  // default to autobind unless override
                  return item.bind(elem || obj);
                }

                // return the unbound function or obj or value
                return item;
            }
        }
        return false;
    }

    /*>>testallprops*/
    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        // did they call .prefixed('boxSizing') or are we just testing a prop?
        if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

        // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
        } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }
    /*>>testallprops*/


    /**
     * Tests
     * -----
     */

    // The *new* flexbox
    // dev.w3.org/csswg/css3-flexbox

    tests['flexbox'] = function() {
      return testPropsAll('flexWrap');
    };

    // The *old* flexbox
    // www.w3.org/TR/2009/WD-css3-flexbox-20090723/

    tests['flexboxlegacy'] = function() {
        return testPropsAll('boxDirection');
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // so we actually have to call getContext() to verify
    // github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // webk.it/70117 is tracking a legit WebGL feature detect proposal

    // We do a soft detect which may false positive in order to avoid
    // an expensive context creation: bugzil.la/732441

    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };


    // geolocation is often considered a trivial feature detect...
    // Turns out, it's quite tricky to get right:
    //
    // Using !!navigator.geolocation does two things we don't want. It:
    //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
    //   2. Disables page caching in WebKit: webk.it/43956
    //
    // Meanwhile, in Firefox < 8, an about:config setting could expose
    // a false positive that would throw an exception: bugzil.la/688158

    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
      return !!window.postMessage;
    };


    // Chrome incognito mode used to throw an exception when using openDatabase
    // It doesn't anymore.
    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
    // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
    // FF10 still uses prefixes, so check for it until then.
    // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    // css-tricks.com/rgba-browser-support/
    tests['rgba'] = function() {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };



    // this will false positive in Opera Mini
    //   github.com/Modernizr/Modernizr/issues/396

    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return (/^0.55$/).test(mStyle.opacity);
    };


    // Note, Android < 4 will pass this test, but can only animate
    //   a single property at a time
    //   goo.gl/v3V4Gp
    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
             // legacy webkit syntax (FIXME: remove when syntax not in use anymore)
              (str1 + '-webkit- '.split(' ').join(str2 + str1) +
             // standard syntax             // trailing 'background-image:'
              prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

        // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if ( ret && 'webkitPerspective' in docElement.style ) {

          // Webkit allows this media query to succeed only if the feature is enabled.
          // `@media (transform-3d),(-webkit-transform-3d){ ... }`
          injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
          });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // javascript.nwbox.com/CSSSupport/

    // false positives:
    //   WebOS github.com/Modernizr/Modernizr/issues/342
    //   WP7   github.com/Modernizr/Modernizr/issues/538
    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };



    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in some older browsers, "no" was a return value instead of empty string.
    //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
    //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5

    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw bugzil.la/365772 if cookies are disabled

    // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    // will throw the exception:
    //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    // Peculiarly, getItem and removeItem calls do not throw.

    // Because we are forced to try/catch this, we'll go aggressive.

    // Just FWIW: IE8 Compat mode supports these features completely:
    //   www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // SVG SMIL animation
    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    // This test is only for clip paths in SVG proper, not clip paths on HTML content
    // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg

    // However read the comments to dig into applying SVG clippaths to HTML content here:
    //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    /*>>webforms*/
    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        /*>>input*/
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   miketaylr.com/code/input-type-attr.html
        // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary

        // Only input placeholder is tested while textarea's placeholder is not.
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
              // safari false positive's on datalist: webk.it/74252
              // see also github.com/Modernizr/Modernizr/issues/146
              attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        /*>>input*/

        /*>>inputtypes*/
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                      // Safari 2-4 allows the smiley as a value, despite making a slider
                      bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                              // Mobile android web browser has false positive, so must
                              // check the height to see if the widget is actually there.
                              (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                      // Spec doesn't define any special parsing or detectable UI
                      //   behaviors so we pass these through as true

                      // Interestingly, opera fails the earlier test, so it doesn't
                      //  even make it here.

                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                      // Real url and email support comes with prebaked validation.
                      bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                      // If the upgraded input compontent rejects the :) text, we got a winner
                      bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        /*>>inputtypes*/
    }
    /*>>webforms*/


    // End of test definitions
    // -----------------------



    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    /*>>webforms*/
    // input tests need to run.
    Modernizr.input || webforms();
    /*>>webforms*/


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
           // we're going to quit if you're trying to overwrite an existing test
           // if we were to allow it, we'd do this:
           //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
           //   docElement.className = docElement.className.replace( re, '' );
           // but, no rly, stuff 'em.
           return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; // allow chaining.
     };


    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    /*>>shiv*/
    /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    ;(function(window, document) {
        /*jshint evil:true */
        /** version */
        var version = '3.7.0';

        /** Preset options */
        var options = window.html5 || {};

        /** Used to skip problem elements */
        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        /** Not all elements can be cloned in IE **/
        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        /** Detect whether the browser supports default html5 styles */
        var supportsHtml5Styles;

        /** Name of the expando, to work with multiple documents or to re-shiv one document */
        var expando = '_html5shiv';

        /** The id for the the documents expando */
        var expanID = 0;

        /** Cached data for each document */
        var expandoData = {};

        /** Detect whether the browser supports unknown elements */
        var supportsUnknownElements;

        (function() {
          try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
            //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
            supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
              // assign a false positive if unable to shiv
              (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
          } catch(e) {
            // assign a false positive if detection fails => unable to shiv
            supportsHtml5Styles = true;
            supportsUnknownElements = true;
          }

        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
        function addStyleSheet(ownerDocument, cssText) {
          var p = ownerDocument.createElement('p'),
          parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

          p.innerHTML = 'x<style>' + cssText + '</style>';
          return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
        function getElements() {
          var elements = html5.elements;
          return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
        function getExpandoData(ownerDocument) {
          var data = expandoData[ownerDocument[expando]];
          if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
          }
          return data;
        }

        /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
        function createElement(nodeName, ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
          }
          if (!data) {
            data = getExpandoData(ownerDocument);
          }
          var node;

          if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
          } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
          } else {
            node = data.createElem(nodeName);
          }

          // Avoid adding some elements to fragments in IE < 9 because
          // * Attributes like `name` or `type` cannot be set/changed once an element
          //   is inserted into a document/fragment
          // * Link elements with `src` attributes that are inaccessible, as with
          //   a 403 response, will cause the tab/window to crash
          // * Script elements appended to fragments will execute when their `src`
          //   or `text` property is set
          return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
        function createDocumentFragment(ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
          }
          data = data || getExpandoData(ownerDocument);
          var clone = data.frag.cloneNode(),
          i = 0,
          elems = getElements(),
          l = elems.length;
          for(;i<l;i++){
            clone.createElement(elems[i]);
          }
          return clone;
        }

        /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
        function shivMethods(ownerDocument, data) {
          if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
          }


          ownerDocument.createElement = function(nodeName) {
            //abort shiv
            if (!html5.shivMethods) {
              return data.createElem(nodeName);
            }
            return createElement(nodeName, ownerDocument, data);
          };

          ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                                                          'var n=f.cloneNode(),c=n.createElement;' +
                                                          'h.shivMethods&&(' +
                                                          // unroll the `createElement` calls
                                                          getElements().join().replace(/[\w\-]+/g, function(nodeName) {
            data.createElem(nodeName);
            data.frag.createElement(nodeName);
            return 'c("' + nodeName + '")';
          }) +
            ');return n}'
                                                         )(html5, data.frag);
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
        function shivDocument(ownerDocument) {
          if (!ownerDocument) {
            ownerDocument = document;
          }
          var data = getExpandoData(ownerDocument);

          if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
            data.hasCSS = !!addStyleSheet(ownerDocument,
                                          // corrects block display not defined in IE6/7/8/9
                                          'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                                            // adds styling not present in IE6/7/8/9
                                            'mark{background:#FF0;color:#000}' +
                                            // hides non-rendered elements
                                            'template{display:none}'
                                         );
          }
          if (!supportsUnknownElements) {
            shivMethods(ownerDocument, data);
          }
          return ownerDocument;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
        var html5 = {

          /**
           * An array or space separated string of node names of the elements to shiv.
           * @memberOf html5
           * @type Array|String
           */
          'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

          /**
           * current version of html5shiv
           */
          'version': version,

          /**
           * A flag to indicate that the HTML5 style sheet should be inserted.
           * @memberOf html5
           * @type Boolean
           */
          'shivCSS': (options.shivCSS !== false),

          /**
           * Is equal to true if a browser supports creating unknown/HTML5 elements
           * @memberOf html5
           * @type boolean
           */
          'supportsUnknownElements': supportsUnknownElements,

          /**
           * A flag to indicate that the document's `createElement` and `createDocumentFragment`
           * methods should be overwritten.
           * @memberOf html5
           * @type Boolean
           */
          'shivMethods': (options.shivMethods !== false),

          /**
           * A string to describe the type of `html5` object ("default" or "default print").
           * @memberOf html5
           * @type String
           */
          'type': 'default',

          // shivs the document according to the specified `html5` object options
          'shivDocument': shivDocument,

          //creates a shived element
          createElement: createElement,

          //creates a shived documentFragment
          createDocumentFragment: createDocumentFragment
        };

        /*--------------------------------------------------------------------------*/

        // expose html5
        window.html5 = html5;

        // shiv the document
        shivDocument(document);

    }(this, document));
    /*>>shiv*/

    // Assign private properties to the return object with prefix
    Modernizr._version      = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    /*>>prefixes*/
    Modernizr._prefixes     = prefixes;
    /*>>prefixes*/
    /*>>domprefixes*/
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;
    /*>>domprefixes*/

    /*>>mq*/
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use:
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq            = testMediaQuery;
    /*>>mq*/

    /*>>hasevent*/
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent      = isEventSupported;
    /*>>hasevent*/

    /*>>testprop*/
    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };
    /*>>testprop*/

    /*>>testallprops*/
    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')
    Modernizr.testAllProps  = testPropsAll;
    /*>>testallprops*/


    /*>>teststyles*/
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles    = injectElementWithStyles;
    /*>>teststyles*/


    /*>>prefixed*/
    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'

    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    //
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'MSTransitionEnd',
    //       'transition'       : 'transitionend'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
        // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
        return testPropsAll(prop, obj, elem);
      }
    };
    /*>>prefixed*/


    /*>>cssclasses*/
    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                            // Add the new classes to the <html> element.
                            (enableClasses ? ' js ' + classes.join(' ') : '');
    /*>>cssclasses*/

    return Modernizr;

})(this, this.document);

/*
 * jQuery FlexSlider v2.2.2
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith
 */
;
(function ($) {

  //FlexSlider: Object Instance
  $.flexslider = function(el, options) {
    var slider = $(el);

    // making variables public
    slider.vars = $.extend({}, $.flexslider.defaults, options);

    var namespace = slider.vars.namespace,
        msGesture = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
        touch = (( "ontouchstart" in window ) || msGesture || window.DocumentTouch && document instanceof DocumentTouch) && slider.vars.touch,
        // depricating this idea, as devices are being released with both of these events
        //eventType = (touch) ? "touchend" : "click",
        eventType = "click touchend MSPointerUp",
        watchedEvent = "",
        watchedEventClearTimer,
        vertical = slider.vars.direction === "vertical",
        reverse = slider.vars.reverse,
        carousel = (slider.vars.itemWidth > 0),
        fade = slider.vars.animation === "fade",
        asNav = slider.vars.asNavFor !== "",
        methods = {},
        focused = true;

    // Store a reference to the slider object
    $.data(el, "flexslider", slider);

    // Private slider methods
    methods = {
      init: function() {
        slider.animating = false;
        // Get current slide and make sure it is a number
        slider.currentSlide = parseInt( ( slider.vars.startAt ? slider.vars.startAt : 0), 10 );
        if ( isNaN( slider.currentSlide ) ) slider.currentSlide = 0;
        slider.animatingTo = slider.currentSlide;
        slider.atEnd = (slider.currentSlide === 0 || slider.currentSlide === slider.last);
        slider.containerSelector = slider.vars.selector.substr(0,slider.vars.selector.search(' '));
        slider.slides = $(slider.vars.selector, slider);
        slider.container = $(slider.containerSelector, slider);
        slider.count = slider.slides.length;
        // SYNC:
        slider.syncExists = $(slider.vars.sync).length > 0;
        // SLIDE:
        if (slider.vars.animation === "slide") slider.vars.animation = "swing";
        slider.prop = (vertical) ? "top" : "marginLeft";
        slider.args = {};
        // SLIDESHOW:
        slider.manualPause = false;
        slider.stopped = false;
        //PAUSE WHEN INVISIBLE
        slider.started = false;
        slider.startTimeout = null;
        // TOUCH/USECSS:
        slider.transitions = !slider.vars.video && !fade && slider.vars.useCSS && (function() {
          var obj = document.createElement('div'),
              props = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
          for (var i in props) {
            if ( obj.style[ props[i] ] !== undefined ) {
              slider.pfx = props[i].replace('Perspective','').toLowerCase();
              slider.prop = "-" + slider.pfx + "-transform";
              return true;
            }
          }
          return false;
        }());
        // CONTROLSCONTAINER:
        if (slider.vars.controlsContainer !== "") slider.controlsContainer = $(slider.vars.controlsContainer).length > 0 && $(slider.vars.controlsContainer);
        // MANUAL:
        if (slider.vars.manualControls !== "") slider.manualControls = $(slider.vars.manualControls).length > 0 && $(slider.vars.manualControls);

        // RANDOMIZE:
        if (slider.vars.randomize) {
          slider.slides.sort(function() { return (Math.round(Math.random())-0.5); });
          slider.container.empty().append(slider.slides);
        }

        slider.doMath();

        // INIT
        slider.setup("init");

        // CONTROLNAV:
        if (slider.vars.controlNav) methods.controlNav.setup();

        // DIRECTIONNAV:
        if (slider.vars.directionNav) methods.directionNav.setup();

        // KEYBOARD:
        if (slider.vars.keyboard && ($(slider.containerSelector).length === 1 || slider.vars.multipleKeyboard)) {
          $(document).bind('keyup', function(event) {
            var keycode = event.keyCode;
            if (!slider.animating && (keycode === 39 || keycode === 37)) {
              var target = (keycode === 39) ? slider.getTarget('next') :
                           (keycode === 37) ? slider.getTarget('prev') : false;
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            }
          });
        }
        // MOUSEWHEEL:
        if (slider.vars.mousewheel) {
          slider.bind('mousewheel', function(event, delta, deltaX, deltaY) {
            event.preventDefault();
            var target = (delta < 0) ? slider.getTarget('next') : slider.getTarget('prev');
            slider.flexAnimate(target, slider.vars.pauseOnAction);
          });
        }

        // PAUSEPLAY
        if (slider.vars.pausePlay) methods.pausePlay.setup();

        //PAUSE WHEN INVISIBLE
        if (slider.vars.slideshow && slider.vars.pauseInvisible) methods.pauseInvisible.init();

        // SLIDSESHOW
        if (slider.vars.slideshow) {
          if (slider.vars.pauseOnHover) {
            slider.hover(function() {
              if (!slider.manualPlay && !slider.manualPause) slider.pause();
            }, function() {
              if (!slider.manualPause && !slider.manualPlay && !slider.stopped) slider.play();
            });
          }
          // initialize animation
          //If we're visible, or we don't use PageVisibility API
          if(!slider.vars.pauseInvisible || !methods.pauseInvisible.isHidden()) {
            (slider.vars.initDelay > 0) ? slider.startTimeout = setTimeout(slider.play, slider.vars.initDelay) : slider.play();
          }
        }

        // ASNAV:
        if (asNav) methods.asNav.setup();

        // TOUCH
        if (touch && slider.vars.touch) methods.touch();

        // FADE&&SMOOTHHEIGHT || SLIDE:
        if (!fade || (fade && slider.vars.smoothHeight)) $(window).bind("resize orientationchange focus", methods.resize);

        slider.find("img").attr("draggable", "false");

        // API: start() Callback
        setTimeout(function(){
          slider.vars.start(slider);
        }, 200);
      },
      asNav: {
        setup: function() {
          slider.asNav = true;
          slider.animatingTo = Math.floor(slider.currentSlide/slider.move);
          slider.currentItem = slider.currentSlide;
          slider.slides.removeClass(namespace + "active-slide").eq(slider.currentItem).addClass(namespace + "active-slide");
          if(!msGesture){
              slider.slides.on(eventType, function(e){
                e.preventDefault();
                var $slide = $(this),
                    target = $slide.index();
                var posFromLeft = $slide.offset().left - $(slider).scrollLeft(); // Find position of slide relative to left of slider container
                if( posFromLeft <= 0 && $slide.hasClass( namespace + 'active-slide' ) ) {
                  slider.flexAnimate(slider.getTarget("prev"), true);
                } else if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass(namespace + "active-slide")) {
                  slider.direction = (slider.currentItem < target) ? "next" : "prev";
                  slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
                }
              });
          }else{
              el._slider = slider;
              slider.slides.each(function (){
                  var that = this;
                  that._gesture = new MSGesture();
                  that._gesture.target = that;
                  that.addEventListener("MSPointerDown", function (e){
                      e.preventDefault();
                      if(e.currentTarget._gesture)
                          e.currentTarget._gesture.addPointer(e.pointerId);
                  }, false);
                  that.addEventListener("MSGestureTap", function (e){
                      e.preventDefault();
                      var $slide = $(this),
                          target = $slide.index();
                      if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass('active')) {
                          slider.direction = (slider.currentItem < target) ? "next" : "prev";
                          slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
                      }
                  });
              });
          }
        }
      },
      controlNav: {
        setup: function() {
          if (!slider.manualControls) {
            methods.controlNav.setupPaging();
          } else { // MANUALCONTROLS:
            methods.controlNav.setupManual();
          }
        },
        setupPaging: function() {
          var type = (slider.vars.controlNav === "thumbnails") ? 'control-thumbs' : 'control-paging',
              j = 1,
              item,
              slide;

          slider.controlNavScaffold = $('<ol class="'+ namespace + 'control-nav ' + namespace + type + '"></ol>');

          if (slider.pagingCount > 1) {
            for (var i = 0; i < slider.pagingCount; i++) {
              slide = slider.slides.eq(i);
              item = (slider.vars.controlNav === "thumbnails") ? '<img src="' + slide.attr( 'data-thumb' ) + '"/>' : '<a>' + j + '</a>';
              if ( 'thumbnails' === slider.vars.controlNav && true === slider.vars.thumbCaptions ) {
                var captn = slide.attr( 'data-thumbcaption' );
                if ( '' != captn && undefined != captn ) item += '<span class="' + namespace + 'caption">' + captn + '</span>';
              }
              slider.controlNavScaffold.append('<li>' + item + '</li>');
              j++;
            }
          }

          // CONTROLSCONTAINER:
          (slider.controlsContainer) ? $(slider.controlsContainer).append(slider.controlNavScaffold) : slider.append(slider.controlNavScaffold);
          methods.controlNav.set();

          methods.controlNav.active();

          slider.controlNavScaffold.delegate('a, img', eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                slider.direction = (target > slider.currentSlide) ? "next" : "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();

          });
        },
        setupManual: function() {
          slider.controlNav = slider.manualControls;
          methods.controlNav.active();

          slider.controlNav.bind(eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                (target > slider.currentSlide) ? slider.direction = "next" : slider.direction = "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        set: function() {
          var selector = (slider.vars.controlNav === "thumbnails") ? 'img' : 'a';
          slider.controlNav = $('.' + namespace + 'control-nav li ' + selector, (slider.controlsContainer) ? slider.controlsContainer : slider);
        },
        active: function() {
          slider.controlNav.removeClass(namespace + "active").eq(slider.animatingTo).addClass(namespace + "active");
        },
        update: function(action, pos) {
          if (slider.pagingCount > 1 && action === "add") {
            slider.controlNavScaffold.append($('<li><a>' + slider.count + '</a></li>'));
          } else if (slider.pagingCount === 1) {
            slider.controlNavScaffold.find('li').remove();
          } else {
            slider.controlNav.eq(pos).closest('li').remove();
          }
          methods.controlNav.set();
          (slider.pagingCount > 1 && slider.pagingCount !== slider.controlNav.length) ? slider.update(pos, action) : methods.controlNav.active();
        }
      },
      directionNav: {
        setup: function() {
          var directionNavScaffold = $('<ul class="' + namespace + 'direction-nav"><li><a class="' + namespace + 'prev" href="#"><i class="fa fa-chevron-left"></i></a></li><li><a class="' + namespace + 'next" href="#"><i class="fa fa-chevron-right"></i></a></li></ul>');

          // CONTROLSCONTAINER:
          if (slider.controlsContainer) {
            $(slider.controlsContainer).append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider.controlsContainer);
          } else {
            slider.append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider);
          }

          methods.directionNav.update();

          slider.directionNav.bind(eventType, function(event) {
            event.preventDefault();
            var target;

            if (watchedEvent === "" || watchedEvent === event.type) {
              target = ($(this).hasClass(namespace + 'next')) ? slider.getTarget('next') : slider.getTarget('prev');
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        update: function() {
          var disabledClass = namespace + 'disabled';
          if (slider.pagingCount === 1) {
            slider.directionNav.addClass(disabledClass).attr('tabindex', '-1');
          } else if (!slider.vars.animationLoop) {
            if (slider.animatingTo === 0) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "prev").addClass(disabledClass).attr('tabindex', '-1');
            } else if (slider.animatingTo === slider.last) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "next").addClass(disabledClass).attr('tabindex', '-1');
            } else {
              slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
            }
          } else {
            slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
          }
        }
      },
      pausePlay: {
        setup: function() {
          var pausePlayScaffold = $('<div class="' + namespace + 'pauseplay"><a></a></div>');

          // CONTROLSCONTAINER:
          if (slider.controlsContainer) {
            slider.controlsContainer.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider.controlsContainer);
          } else {
            slider.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider);
          }

          methods.pausePlay.update((slider.vars.slideshow) ? namespace + 'pause' : namespace + 'play');

          slider.pausePlay.bind(eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              if ($(this).hasClass(namespace + 'pause')) {
                slider.manualPause = true;
                slider.manualPlay = false;
                slider.pause();
              } else {
                slider.manualPause = false;
                slider.manualPlay = true;
                slider.play();
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        update: function(state) {
          (state === "play") ? slider.pausePlay.removeClass(namespace + 'pause').addClass(namespace + 'play').html(slider.vars.playText) : slider.pausePlay.removeClass(namespace + 'play').addClass(namespace + 'pause').html(slider.vars.pauseText);
        }
      },
      touch: function() {
        var startX,
          startY,
          offset,
          cwidth,
          dx,
          startT,
          scrolling = false,
          localX = 0,
          localY = 0,
          accDx = 0;

        if(!msGesture){
            el.addEventListener('touchstart', onTouchStart, false);

            function onTouchStart(e) {
              if (slider.animating) {
                e.preventDefault();
              } else if ( ( window.navigator.msPointerEnabled ) || e.touches.length === 1 ) {
                slider.pause();
                // CAROUSEL:
                cwidth = (vertical) ? slider.h : slider. w;
                startT = Number(new Date());
                // CAROUSEL:

                // Local vars for X and Y points.
                localX = e.touches[0].pageX;
                localY = e.touches[0].pageY;

                offset = (carousel && reverse && slider.animatingTo === slider.last) ? 0 :
                         (carousel && reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                         (carousel && slider.currentSlide === slider.last) ? slider.limit :
                         (carousel) ? ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.currentSlide :
                         (reverse) ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
                startX = (vertical) ? localY : localX;
                startY = (vertical) ? localX : localY;

                el.addEventListener('touchmove', onTouchMove, false);
                el.addEventListener('touchend', onTouchEnd, false);
              }
            }

            function onTouchMove(e) {
              // Local vars for X and Y points.

              localX = e.touches[0].pageX;
              localY = e.touches[0].pageY;

              dx = (vertical) ? startX - localY : startX - localX;
              scrolling = (vertical) ? (Math.abs(dx) < Math.abs(localX - startY)) : (Math.abs(dx) < Math.abs(localY - startY));

              var fxms = 500;

              if ( ! scrolling || Number( new Date() ) - startT > fxms ) {
                e.preventDefault();
                if (!fade && slider.transitions) {
                  if (!slider.vars.animationLoop) {
                    dx = dx/((slider.currentSlide === 0 && dx < 0 || slider.currentSlide === slider.last && dx > 0) ? (Math.abs(dx)/cwidth+2) : 1);
                  }
                  slider.setProps(offset + dx, "setTouch");
                }
              }
            }

            function onTouchEnd(e) {
              // finish the touch by undoing the touch session
              el.removeEventListener('touchmove', onTouchMove, false);

              if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
                var updateDx = (reverse) ? -dx : dx,
                    target = (updateDx > 0) ? slider.getTarget('next') : slider.getTarget('prev');

                if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth/2)) {
                  slider.flexAnimate(target, slider.vars.pauseOnAction);
                } else {
                  if (!fade) slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true);
                }
              }
              el.removeEventListener('touchend', onTouchEnd, false);

              startX = null;
              startY = null;
              dx = null;
              offset = null;
            }
        }else{
            el.style.msTouchAction = "none";
            el._gesture = new MSGesture();
            el._gesture.target = el;
            el.addEventListener("MSPointerDown", onMSPointerDown, false);
            el._slider = slider;
            el.addEventListener("MSGestureChange", onMSGestureChange, false);
            el.addEventListener("MSGestureEnd", onMSGestureEnd, false);

            function onMSPointerDown(e){
                e.stopPropagation();
                if (slider.animating) {
                    e.preventDefault();
                }else{
                    slider.pause();
                    el._gesture.addPointer(e.pointerId);
                    accDx = 0;
                    cwidth = (vertical) ? slider.h : slider. w;
                    startT = Number(new Date());
                    // CAROUSEL:

                    offset = (carousel && reverse && slider.animatingTo === slider.last) ? 0 :
                        (carousel && reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                            (carousel && slider.currentSlide === slider.last) ? slider.limit :
                                (carousel) ? ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.currentSlide :
                                    (reverse) ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
                }
            }

            function onMSGestureChange(e) {
                e.stopPropagation();
                var slider = e.target._slider;
                if(!slider){
                    return;
                }
                var transX = -e.translationX,
                    transY = -e.translationY;

                //Accumulate translations.
                accDx = accDx + ((vertical) ? transY : transX);
                dx = accDx;
                scrolling = (vertical) ? (Math.abs(accDx) < Math.abs(-transX)) : (Math.abs(accDx) < Math.abs(-transY));

                if(e.detail === e.MSGESTURE_FLAG_INERTIA){
                    setImmediate(function (){
                        el._gesture.stop();
                    });

                    return;
                }

                if (!scrolling || Number(new Date()) - startT > 500) {
                    e.preventDefault();
                    if (!fade && slider.transitions) {
                        if (!slider.vars.animationLoop) {
                            dx = accDx / ((slider.currentSlide === 0 && accDx < 0 || slider.currentSlide === slider.last && accDx > 0) ? (Math.abs(accDx) / cwidth + 2) : 1);
                        }
                        slider.setProps(offset + dx, "setTouch");
                    }
                }
            }

            function onMSGestureEnd(e) {
                e.stopPropagation();
                var slider = e.target._slider;
                if(!slider){
                    return;
                }
                if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
                    var updateDx = (reverse) ? -dx : dx,
                        target = (updateDx > 0) ? slider.getTarget('next') : slider.getTarget('prev');

                    if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth/2)) {
                        slider.flexAnimate(target, slider.vars.pauseOnAction);
                    } else {
                        if (!fade) slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true);
                    }
                }

                startX = null;
                startY = null;
                dx = null;
                offset = null;
                accDx = 0;
            }
        }
      },
      resize: function() {
        if (!slider.animating && slider.is(':visible')) {
          if (!carousel) slider.doMath();

          if (fade) {
            // SMOOTH HEIGHT:
            methods.smoothHeight();
          } else if (carousel) { //CAROUSEL:
            slider.slides.width(slider.computedW);
            slider.update(slider.pagingCount);
            slider.setProps();
          }
          else if (vertical) { //VERTICAL:
            slider.viewport.height(slider.h);
            slider.setProps(slider.h, "setTotal");
          } else {
            // SMOOTH HEIGHT:
            if (slider.vars.smoothHeight) methods.smoothHeight();
            slider.newSlides.width(slider.computedW);
            slider.setProps(slider.computedW, "setTotal");
          }
        }
      },
      smoothHeight: function(dur) {
        if (!vertical || fade) {
          var $obj = (fade) ? slider : slider.viewport;
          (dur) ? $obj.animate({"height": slider.slides.eq(slider.animatingTo).height()}, dur) : $obj.height(slider.slides.eq(slider.animatingTo).height());
        }
      },
      sync: function(action) {
        var $obj = $(slider.vars.sync).data("flexslider"),
            target = slider.animatingTo;

        switch (action) {
          case "animate": $obj.flexAnimate(target, slider.vars.pauseOnAction, false, true); break;
          case "play": if (!$obj.playing && !$obj.asNav) { $obj.play(); } break;
          case "pause": $obj.pause(); break;
        }
      },
      uniqueID: function($clone) {
        $clone.find( '[id]' ).each(function() {
          var $this = $(this);
          $this.attr( 'id', $this.attr( 'id' ) + '_clone' );
        });
        return $clone;
      },
      pauseInvisible: {
        visProp: null,
        init: function() {
          var prefixes = ['webkit','moz','ms','o'];

          if ('hidden' in document) return 'hidden';
          for (var i = 0; i < prefixes.length; i++) {
            if ((prefixes[i] + 'Hidden') in document)
            methods.pauseInvisible.visProp = prefixes[i] + 'Hidden';
          }
          if (methods.pauseInvisible.visProp) {
            var evtname = methods.pauseInvisible.visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
            document.addEventListener(evtname, function() {
              if (methods.pauseInvisible.isHidden()) {
                if(slider.startTimeout) clearTimeout(slider.startTimeout); //If clock is ticking, stop timer and prevent from starting while invisible
                else slider.pause(); //Or just pause
              }
              else {
                if(slider.started) slider.play(); //Initiated before, just play
                else (slider.vars.initDelay > 0) ? setTimeout(slider.play, slider.vars.initDelay) : slider.play(); //Didn't init before: simply init or wait for it
              }
            });
          }
        },
        isHidden: function() {
          return document[methods.pauseInvisible.visProp] || false;
        }
      },
      setToClearWatchedEvent: function() {
        clearTimeout(watchedEventClearTimer);
        watchedEventClearTimer = setTimeout(function() {
          watchedEvent = "";
        }, 3000);
      }
    };

    // public methods
    slider.flexAnimate = function(target, pause, override, withSync, fromNav) {
      if (!slider.vars.animationLoop && target !== slider.currentSlide) {
        slider.direction = (target > slider.currentSlide) ? "next" : "prev";
      }

      if (asNav && slider.pagingCount === 1) slider.direction = (slider.currentItem < target) ? "next" : "prev";

      if (!slider.animating && (slider.canAdvance(target, fromNav) || override) && slider.is(":visible")) {
        if (asNav && withSync) {
          var master = $(slider.vars.asNavFor).data('flexslider');
          slider.atEnd = target === 0 || target === slider.count - 1;
          master.flexAnimate(target, true, false, true, fromNav);
          slider.direction = (slider.currentItem < target) ? "next" : "prev";
          master.direction = slider.direction;

          if (Math.ceil((target + 1)/slider.visible) - 1 !== slider.currentSlide && target !== 0) {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            target = Math.floor(target/slider.visible);
          } else {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            return false;
          }
        }

        slider.animating = true;
        slider.animatingTo = target;

        // SLIDESHOW:
        if (pause) slider.pause();

        // API: before() animation Callback
        slider.vars.before(slider);

        // SYNC:
        if (slider.syncExists && !fromNav) methods.sync("animate");

        // CONTROLNAV
        if (slider.vars.controlNav) methods.controlNav.active();

        // !CAROUSEL:
        // CANDIDATE: slide active class (for add/remove slide)
        if (!carousel) slider.slides.removeClass(namespace + 'active-slide').eq(target).addClass(namespace + 'active-slide');

        // INFINITE LOOP:
        // CANDIDATE: atEnd
        slider.atEnd = target === 0 || target === slider.last;

        // DIRECTIONNAV:
        if (slider.vars.directionNav) methods.directionNav.update();

        if (target === slider.last) {
          // API: end() of cycle Callback
          slider.vars.end(slider);
          // SLIDESHOW && !INFINITE LOOP:
          if (!slider.vars.animationLoop) slider.pause();
        }

        // SLIDE:
        if (!fade) {
          var dimension = (vertical) ? slider.slides.filter(':first').height() : slider.computedW,
              margin, slideString, calcNext;

          // INFINITE LOOP / REVERSE:
          if (carousel) {
            //margin = (slider.vars.itemWidth > slider.w) ? slider.vars.itemMargin * 2 : slider.vars.itemMargin;
            margin = slider.vars.itemMargin;
            calcNext = ((slider.itemW + margin) * slider.move) * slider.animatingTo;
            slideString = (calcNext > slider.limit && slider.visible !== 1) ? slider.limit : calcNext;
          } else if (slider.currentSlide === 0 && target === slider.count - 1 && slider.vars.animationLoop && slider.direction !== "next") {
            slideString = (reverse) ? (slider.count + slider.cloneOffset) * dimension : 0;
          } else if (slider.currentSlide === slider.last && target === 0 && slider.vars.animationLoop && slider.direction !== "prev") {
            slideString = (reverse) ? 0 : (slider.count + 1) * dimension;
          } else {
            slideString = (reverse) ? ((slider.count - 1) - target + slider.cloneOffset) * dimension : (target + slider.cloneOffset) * dimension;
          }
          slider.setProps(slideString, "", slider.vars.animationSpeed);
          if (slider.transitions) {
            if (!slider.vars.animationLoop || !slider.atEnd) {
              slider.animating = false;
              slider.currentSlide = slider.animatingTo;
            }
            slider.container.unbind("webkitTransitionEnd transitionend");
            slider.container.bind("webkitTransitionEnd transitionend", function() {
              slider.wrapup(dimension);
            });
          } else {
            slider.container.animate(slider.args, slider.vars.animationSpeed, slider.vars.easing, function(){
              slider.wrapup(dimension);
            });
          }
        } else { // FADE:
          if (!touch) {
            //slider.slides.eq(slider.currentSlide).fadeOut(slider.vars.animationSpeed, slider.vars.easing);
            //slider.slides.eq(target).fadeIn(slider.vars.animationSpeed, slider.vars.easing, slider.wrapup);

            slider.slides.eq(slider.currentSlide).css({"zIndex": 1}).animate({"opacity": 0}, slider.vars.animationSpeed, slider.vars.easing);
            slider.slides.eq(target).css({"zIndex": 2}).animate({"opacity": 1}, slider.vars.animationSpeed, slider.vars.easing, slider.wrapup);

          } else {
            slider.slides.eq(slider.currentSlide).css({ "opacity": 0, "zIndex": 1 });
            slider.slides.eq(target).css({ "opacity": 1, "zIndex": 2 });
            slider.wrapup(dimension);
          }
        }
        // SMOOTH HEIGHT:
        if (slider.vars.smoothHeight) methods.smoothHeight(slider.vars.animationSpeed);
      }
    };
    slider.wrapup = function(dimension) {
      // SLIDE:
      if (!fade && !carousel) {
        if (slider.currentSlide === 0 && slider.animatingTo === slider.last && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpEnd");
        } else if (slider.currentSlide === slider.last && slider.animatingTo === 0 && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpStart");
        }
      }
      slider.animating = false;
      slider.currentSlide = slider.animatingTo;
      // API: after() animation Callback
      slider.vars.after(slider);
    };

    // SLIDESHOW:
    slider.animateSlides = function() {
      if (!slider.animating && focused ) slider.flexAnimate(slider.getTarget("next"));
    };
    // SLIDESHOW:
    slider.pause = function() {
      clearInterval(slider.animatedSlides);
      slider.animatedSlides = null;
      slider.playing = false;
      // PAUSEPLAY:
      if (slider.vars.pausePlay) methods.pausePlay.update("play");
      // SYNC:
      if (slider.syncExists) methods.sync("pause");
    };
    // SLIDESHOW:
    slider.play = function() {
      if (slider.playing) clearInterval(slider.animatedSlides);
      slider.animatedSlides = slider.animatedSlides || setInterval(slider.animateSlides, slider.vars.slideshowSpeed);
      slider.started = slider.playing = true;
      // PAUSEPLAY:
      if (slider.vars.pausePlay) methods.pausePlay.update("pause");
      // SYNC:
      if (slider.syncExists) methods.sync("play");
    };
    // STOP:
    slider.stop = function () {
      slider.pause();
      slider.stopped = true;
    };
    slider.canAdvance = function(target, fromNav) {
      // ASNAV:
      var last = (asNav) ? slider.pagingCount - 1 : slider.last;
      return (fromNav) ? true :
             (asNav && slider.currentItem === slider.count - 1 && target === 0 && slider.direction === "prev") ? true :
             (asNav && slider.currentItem === 0 && target === slider.pagingCount - 1 && slider.direction !== "next") ? false :
             (target === slider.currentSlide && !asNav) ? false :
             (slider.vars.animationLoop) ? true :
             (slider.atEnd && slider.currentSlide === 0 && target === last && slider.direction !== "next") ? false :
             (slider.atEnd && slider.currentSlide === last && target === 0 && slider.direction === "next") ? false :
             true;
    };
    slider.getTarget = function(dir) {
      slider.direction = dir;
      if (dir === "next") {
        return (slider.currentSlide === slider.last) ? 0 : slider.currentSlide + 1;
      } else {
        return (slider.currentSlide === 0) ? slider.last : slider.currentSlide - 1;
      }
    };

    // SLIDE:
    slider.setProps = function(pos, special, dur) {
      var target = (function() {
        var posCheck = (pos) ? pos : ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo,
            posCalc = (function() {
              if (carousel) {
                return (special === "setTouch") ? pos :
                       (reverse && slider.animatingTo === slider.last) ? 0 :
                       (reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                       (slider.animatingTo === slider.last) ? slider.limit : posCheck;
              } else {
                switch (special) {
                  case "setTotal": return (reverse) ? ((slider.count - 1) - slider.currentSlide + slider.cloneOffset) * pos : (slider.currentSlide + slider.cloneOffset) * pos;
                  case "setTouch": return (reverse) ? pos : pos;
                  case "jumpEnd": return (reverse) ? pos : slider.count * pos;
                  case "jumpStart": return (reverse) ? slider.count * pos : pos;
                  default: return pos;
                }
              }
            }());

            return (posCalc * -1) + "px";
          }());

      if (slider.transitions) {
        target = (vertical) ? "translate3d(0," + target + ",0)" : "translate3d(" + target + ",0,0)";
        dur = (dur !== undefined) ? (dur/1000) + "s" : "0s";
        slider.container.css("-" + slider.pfx + "-transition-duration", dur);
         slider.container.css("transition-duration", dur);
      }

      slider.args[slider.prop] = target;
      if (slider.transitions || dur === undefined) slider.container.css(slider.args);

      slider.container.css('transform',target);
    };

    slider.setup = function(type) {
      // SLIDE:
      if (!fade) {
        var sliderOffset, arr;

        if (type === "init") {
          slider.viewport = $('<div class="' + namespace + 'viewport"></div>').css({"overflow": "hidden", "position": "relative"}).appendTo(slider).append(slider.container);
          // INFINITE LOOP:
          slider.cloneCount = 0;
          slider.cloneOffset = 0;
          // REVERSE:
          if (reverse) {
            arr = $.makeArray(slider.slides).reverse();
            slider.slides = $(arr);
            slider.container.empty().append(slider.slides);
          }
        }
        // INFINITE LOOP && !CAROUSEL:
        if (slider.vars.animationLoop && !carousel) {
          slider.cloneCount = 2;
          slider.cloneOffset = 1;
          // clear out old clones
          if (type !== "init") slider.container.find('.clone').remove();
          slider.container.append(slider.slides.first().clone().addClass('clone').attr('aria-hidden', 'true')).prepend(slider.slides.last().clone().addClass('clone').attr('aria-hidden', 'true'));
		      methods.uniqueID( slider.slides.first().clone().addClass('clone') ).appendTo( slider.container );
		      methods.uniqueID( slider.slides.last().clone().addClass('clone') ).prependTo( slider.container );
        }
        slider.newSlides = $(slider.vars.selector, slider);

        sliderOffset = (reverse) ? slider.count - 1 - slider.currentSlide + slider.cloneOffset : slider.currentSlide + slider.cloneOffset;
        // VERTICAL:
        if (vertical && !carousel) {
          slider.container.height((slider.count + slider.cloneCount) * 200 + "%").css("position", "absolute").width("100%");
          setTimeout(function(){
            slider.newSlides.css({"display": "block"});
            slider.doMath();
            slider.viewport.height(slider.h);
            slider.setProps(sliderOffset * slider.h, "init");
          }, (type === "init") ? 100 : 0);
        } else {
          slider.container.width((slider.count + slider.cloneCount) * 200 + "%");
          slider.setProps(sliderOffset * slider.computedW, "init");
          setTimeout(function(){
            slider.doMath();
            slider.newSlides.css({"width": slider.computedW, "float": "left", "display": "block"});
            // SMOOTH HEIGHT:
            if (slider.vars.smoothHeight) methods.smoothHeight();
          }, (type === "init") ? 100 : 0);
        }
      } else { // FADE:
        slider.slides.css({"width": "100%", "float": "left", "marginRight": "-100%", "position": "relative"});
        if (type === "init") {
          if (!touch) {
            //slider.slides.eq(slider.currentSlide).fadeIn(slider.vars.animationSpeed, slider.vars.easing);
            slider.slides.css({ "opacity": 0, "display": "block", "zIndex": 1 }).eq(slider.currentSlide).css({"zIndex": 2}).animate({"opacity": 1},slider.vars.animationSpeed,slider.vars.easing);
          } else {
            slider.slides.css({ "opacity": 0, "display": "block", "webkitTransition": "opacity " + slider.vars.animationSpeed / 1000 + "s ease", "zIndex": 1 }).eq(slider.currentSlide).css({ "opacity": 1, "zIndex": 2});
          }
        }
        // SMOOTH HEIGHT:
        if (slider.vars.smoothHeight) methods.smoothHeight();
      }
      // !CAROUSEL:
      // CANDIDATE: active slide
      if (!carousel) slider.slides.removeClass(namespace + "active-slide").eq(slider.currentSlide).addClass(namespace + "active-slide");

      //FlexSlider: init() Callback
      slider.vars.init(slider);
    };

    slider.doMath = function() {
      var slide = slider.slides.first(),
          slideMargin = slider.vars.itemMargin,
          minItems = slider.vars.minItems,
          maxItems = slider.vars.maxItems;

      slider.w = (slider.viewport===undefined) ? slider.width() : slider.viewport.width();
      slider.h = slide.height();
      slider.boxPadding = slide.outerWidth() - slide.width();

      // CAROUSEL:
      if (carousel) {
        slider.itemT = slider.vars.itemWidth + slideMargin;
        slider.minW = (minItems) ? minItems * slider.itemT : slider.w;
        slider.maxW = (maxItems) ? (maxItems * slider.itemT) - slideMargin : slider.w;
        slider.itemW = (slider.minW > slider.w) ? (slider.w - (slideMargin * (minItems - 1)))/minItems :
                       (slider.maxW < slider.w) ? (slider.w - (slideMargin * (maxItems - 1)))/maxItems :
                       (slider.vars.itemWidth > slider.w) ? slider.w : slider.vars.itemWidth;

        slider.visible = Math.floor(slider.w/(slider.itemW));
        slider.move = (slider.vars.move > 0 && slider.vars.move < slider.visible ) ? slider.vars.move : slider.visible;
        slider.pagingCount = Math.ceil(((slider.count - slider.visible)/slider.move) + 1);
        slider.last =  slider.pagingCount - 1;
        slider.limit = (slider.pagingCount === 1) ? 0 :
                       (slider.vars.itemWidth > slider.w) ? (slider.itemW * (slider.count - 1)) + (slideMargin * (slider.count - 1)) : ((slider.itemW + slideMargin) * slider.count) - slider.w - slideMargin;
      } else {
        slider.itemW = slider.w;
        slider.pagingCount = slider.count;
        slider.last = slider.count - 1;
      }
      slider.computedW = slider.itemW - slider.boxPadding;
    };

    slider.update = function(pos, action) {
      slider.doMath();

      // update currentSlide and slider.animatingTo if necessary
      if (!carousel) {
        if (pos < slider.currentSlide) {
          slider.currentSlide += 1;
        } else if (pos <= slider.currentSlide && pos !== 0) {
          slider.currentSlide -= 1;
        }
        slider.animatingTo = slider.currentSlide;
      }

      // update controlNav
      if (slider.vars.controlNav && !slider.manualControls) {
        if ((action === "add" && !carousel) || slider.pagingCount > slider.controlNav.length) {
          methods.controlNav.update("add");
        } else if ((action === "remove" && !carousel) || slider.pagingCount < slider.controlNav.length) {
          if (carousel && slider.currentSlide > slider.last) {
            slider.currentSlide -= 1;
            slider.animatingTo -= 1;
          }
          methods.controlNav.update("remove", slider.last);
        }
      }
      // update directionNav
      if (slider.vars.directionNav) methods.directionNav.update();

    };

    slider.addSlide = function(obj, pos) {
      var $obj = $(obj);

      slider.count += 1;
      slider.last = slider.count - 1;

      // append new slide
      if (vertical && reverse) {
        (pos !== undefined) ? slider.slides.eq(slider.count - pos).after($obj) : slider.container.prepend($obj);
      } else {
        (pos !== undefined) ? slider.slides.eq(pos).before($obj) : slider.container.append($obj);
      }

      // update currentSlide, animatingTo, controlNav, and directionNav
      slider.update(pos, "add");

      // update slider.slides
      slider.slides = $(slider.vars.selector + ':not(.clone)', slider);
      // re-setup the slider to accomdate new slide
      slider.setup();

      //FlexSlider: added() Callback
      slider.vars.added(slider);
    };
    slider.removeSlide = function(obj) {
      var pos = (isNaN(obj)) ? slider.slides.index($(obj)) : obj;

      // update count
      slider.count -= 1;
      slider.last = slider.count - 1;

      // remove slide
      if (isNaN(obj)) {
        $(obj, slider.slides).remove();
      } else {
        (vertical && reverse) ? slider.slides.eq(slider.last).remove() : slider.slides.eq(obj).remove();
      }

      // update currentSlide, animatingTo, controlNav, and directionNav
      slider.doMath();
      slider.update(pos, "remove");

      // update slider.slides
      slider.slides = $(slider.vars.selector + ':not(.clone)', slider);
      // re-setup the slider to accomdate new slide
      slider.setup();

      // FlexSlider: removed() Callback
      slider.vars.removed(slider);
    };

    //FlexSlider: Initialize
    methods.init();
  };

  // Ensure the slider isn't focussed if the window loses focus.
  $( window ).blur( function ( e ) {
    focused = false;
  }).focus( function ( e ) {
    focused = true;
  });

  //FlexSlider: Default Settings
  $.flexslider.defaults = {
    namespace: "flex-",             //{NEW} String: Prefix string attached to the class of every element generated by the plugin
    selector: ".slides > li",       //{NEW} Selector: Must match a simple pattern. '{container} > {slide}' -- Ignore pattern at your own peril
    animation: "fade",              //String: Select your animation type, "fade" or "slide"
    easing: "swing",                //{NEW} String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
    direction: "horizontal",        //String: Select the sliding direction, "horizontal" or "vertical"
    reverse: false,                 //{NEW} Boolean: Reverse the animation direction
    animationLoop: true,            //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
    smoothHeight: false,            //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
    startAt: 0,                     //Integer: The slide that the slider should start on. Array notation (0 = first slide)
    slideshow: true,                //Boolean: Animate slider automatically
    slideshowSpeed: 7000,           //Integer: Set the speed of the slideshow cycling, in milliseconds
    animationSpeed: 600,            //Integer: Set the speed of animations, in milliseconds
    initDelay: 0,                   //{NEW} Integer: Set an initialization delay, in milliseconds
    randomize: false,               //Boolean: Randomize slide order
    thumbCaptions: false,           //Boolean: Whether or not to put captions on thumbnails when using the "thumbnails" controlNav.

    // Usability features
    pauseOnAction: true,            //Boolean: Pause the slideshow when interacting with control elements, highly recommended.
    pauseOnHover: false,            //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
    pauseInvisible: true,   		//{NEW} Boolean: Pause the slideshow when tab is invisible, resume when visible. Provides better UX, lower CPU usage.
    useCSS: true,                   //{NEW} Boolean: Slider will use CSS3 transitions if available
    touch: true,                    //{NEW} Boolean: Allow touch swipe navigation of the slider on touch-enabled devices
    video: false,                   //{NEW} Boolean: If using video in the slider, will prevent CSS3 3D Transforms to avoid graphical glitches

    // Primary Controls
    controlNav: true,               //Boolean: Create navigation for paging control of each clide? Note: Leave true for manualControls usage
    directionNav: true,             //Boolean: Create navigation for previous/next navigation? (true/false)
    prevText: "Previous",           //String: Set the text for the "previous" directionNav item
    nextText: "Next",               //String: Set the text for the "next" directionNav item

    // Secondary Navigation
    keyboard: true,                 //Boolean: Allow slider navigating via keyboard left/right keys
    multipleKeyboard: false,        //{NEW} Boolean: Allow keyboard navigation to affect multiple sliders. Default behavior cuts out keyboard navigation with more than one slider present.
    mousewheel: false,              //{UPDATED} Boolean: Requires jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel) - Allows slider navigating via mousewheel
    pausePlay: false,               //Boolean: Create pause/play dynamic element
    pauseText: "Pause",             //String: Set the text for the "pause" pausePlay item
    playText: "Play",               //String: Set the text for the "play" pausePlay item

    // Special properties
    controlsContainer: "",          //{UPDATED} jQuery Object/Selector: Declare which container the navigation elements should be appended too. Default container is the FlexSlider element. Example use would be $(".flexslider-container"). Property is ignored if given element is not found.
    manualControls: "",             //{UPDATED} jQuery Object/Selector: Declare custom control navigation. Examples would be $(".flex-control-nav li") or "#tabs-nav li img", etc. The number of elements in your controlNav should match the number of slides/tabs.
    sync: "",                       //{NEW} Selector: Mirror the actions performed on this slider with another slider. Use with care.
    asNavFor: "",                   //{NEW} Selector: Internal property exposed for turning the slider into a thumbnail navigation for another slider

    // Carousel Options
    itemWidth: 0,                   //{NEW} Integer: Box-model width of individual carousel items, including horizontal borders and padding.
    itemMargin: 0,                  //{NEW} Integer: Margin between carousel items.
    minItems: 1,                    //{NEW} Integer: Minimum number of carousel items that should be visible. Items will resize fluidly when below this.
    maxItems: 0,                    //{NEW} Integer: Maxmimum number of carousel items that should be visible. Items will resize fluidly when above this limit.
    move: 0,                        //{NEW} Integer: Number of carousel items that should move on animation. If 0, slider will move all visible items.
    allowOneSlide: true,           //{NEW} Boolean: Whether or not to allow a slider comprised of a single slide

    // Callback API
    start: function(){},            //Callback: function(slider) - Fires when the slider loads the first slide
    before: function(){},           //Callback: function(slider) - Fires asynchronously with each slider animation
    after: function(){},            //Callback: function(slider) - Fires after each slider animation completes
    end: function(){},              //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
    added: function(){},            //{NEW} Callback: function(slider) - Fires after a slide is added
    removed: function(){},           //{NEW} Callback: function(slider) - Fires after a slide is removed
    init: function() {}             //{NEW} Callback: function(slider) - Fires after the slider is initially setup
  };

  //FlexSlider: Plugin Function
  $.fn.flexslider = function(options) {
    if (options === undefined) options = {};

    if (typeof options === "object") {
      return this.each(function() {
        var $this = $(this),
            selector = (options.selector) ? options.selector : ".slides > li",
            $slides = $this.find(selector);

      if ( ( $slides.length === 1 && options.allowOneSlide === true ) || $slides.length === 0 ) {
          $slides.fadeIn(400);
          if (options.start) options.start($this);
        } else if ($this.data('flexslider') === undefined) {
          new $.flexslider(this, options);
        }
      });
    } else {
      // Helper strings to quickly perform functions on the slider
      var $slider = $(this).data('flexslider');
      switch (options) {
        case "play": $slider.play(); break;
        case "pause": $slider.pause(); break;
        case "stop": $slider.stop(); break;
        case "next": $slider.flexAnimate($slider.getTarget("next"), true); break;
        case "prev":
        case "previous": $slider.flexAnimate($slider.getTarget("prev"), true); break;
        default: if (typeof options === "number") $slider.flexAnimate(options, true);
      }
    }
  };
})(jQuery);

/*
 *	jQuery elevateZoom 3.0.8
 *	Demo's and documentation:
 *	www.elevateweb.co.uk/image-zoom
 *
 *	Copyright (c) 2012 Andrew Eades
 *	www.elevateweb.co.uk
 *
 *	Dual licensed under the GPL and MIT licenses.
 *	http://en.wikipedia.org/wiki/MIT_License
 *	http://en.wikipedia.org/wiki/GNU_General_Public_License
 *

/*
 *	jQuery elevateZoom 3.0.3
 *	Demo's and documentation:
 *	www.elevateweb.co.uk/image-zoom
 *
 *	Copyright (c) 2012 Andrew Eades
 *	www.elevateweb.co.uk
 *
 *	Dual licensed under the GPL and MIT licenses.
 *	http://en.wikipedia.org/wiki/MIT_License
 *	http://en.wikipedia.org/wiki/GNU_General_Public_License
 */


if ( typeof Object.create !== 'function' ) {
    Object.create = function( obj ) {
        function F() {};
        F.prototype = obj;
        return new F();
    };
}

(function( $, window, document, undefined ) {
    var ElevateZoom = {
            init: function( options, elem ) {
                var self = this;

                self.elem = elem;
                self.$elem = $( elem );

                self.imageSrc = self.$elem.data("zoom-image") ? self.$elem.data("zoom-image") : self.$elem.attr("src");

                self.options = $.extend( {}, $.fn.elevateZoom.options, options );

                //TINT OVERRIDE SETTINGS
                if(self.options.tint) {
                    self.options.lensColour = "none", //colour of the lens background
                    self.options.lensOpacity =  "1" //opacity of the lens
                }
                //INNER OVERRIDE SETTINGS
                if(self.options.zoomType == "inner") {self.options.showLens = false;}


                //Remove alt on hover

                self.$elem.parent().removeAttr('title').removeAttr('alt');

                self.zoomImage = self.imageSrc;

                self.refresh( 1 );



                //Create the image swap from the gallery
                $('#'+self.options.gallery + ' a').click( function(e) {

                    //Set a class on the currently active gallery image
                    if(self.options.galleryActiveClass){
                        $('#'+self.options.gallery + ' a').removeClass(self.options.galleryActiveClass);
                        $(this).addClass(self.options.galleryActiveClass);
                    }
                    //stop any link on the a tag from working
                    e.preventDefault();

                    //call the swap image function
                    if($(this).data("zoom-image")){self.zoomImagePre = $(this).data("zoom-image")}
                    else{self.zoomImagePre = $(this).data("image");}
                    self.swaptheimage($(this).data("image"), self.zoomImagePre);
                    return false;
                });

            },

            refresh: function( length ) {
                var self = this;

                setTimeout(function() {
                    self.fetch(self.imageSrc);

                }, length || self.options.refresh );
            },

            fetch: function(imgsrc) {
                //get the image
                var self = this;
                var newImg = new Image();
                newImg.onload = function() {
                    //set the large image dimensions - used to calculte ratio's
                    self.largeWidth = newImg.width;
                    self.largeHeight = newImg.height;
                    //once image is loaded start the calls
                    self.startZoom();
                    self.currentImage = self.imageSrc;
                    //let caller know image has been loaded
                    self.options.onZoomedImageLoaded(self.$elem);
                }
                newImg.src = imgsrc; // this must be done AFTER setting onload

                return;

            },

            startZoom: function( ) {
                var self = this;
                //get dimensions of the non zoomed image
                self.nzWidth = self.$elem.width();
                self.nzHeight = self.$elem.height();

                //activated elements
                self.isWindowActive = false;
                self.isLensActive = false;
                self.isTintActive = false;
                self.overWindow = false;

                //CrossFade Wrappe
                if(self.options.imageCrossfade){
                    self.zoomWrap = self.$elem.wrap('<div style="height:'+self.nzHeight+'px;width:'+self.nzWidth+'px;" class="zoomWrapper" />');
                    self.$elem.css('position', 'absolute');
                }

                self.zoomLock = 1;
                self.scrollingLock = false;
                self.changeBgSize = false;
                self.currentZoomLevel = self.options.zoomLevel;


                //get offset of the non zoomed image
                self.nzOffset = self.$elem.offset();
                //calculate the width ratio of the large/small image
                self.widthRatio = (self.largeWidth/self.currentZoomLevel) / self.nzWidth;
                self.heightRatio = (self.largeHeight/self.currentZoomLevel) / self.nzHeight;


                //if window zoom
                if(self.options.zoomType == "window") {
                    self.zoomWindowStyle = "overflow: hidden;"
                        + "background-position: 0px 0px;text-align:center;"
                        + "background-color: " + String(self.options.zoomWindowBgColour)
                        + ";width: " + String(self.options.zoomWindowWidth) + "px;"
                        + "height: " + String(self.options.zoomWindowHeight)
                        + "px;float: left;"
                        + "background-size: "+ self.largeWidth/self.currentZoomLevel+ "px " +self.largeHeight/self.currentZoomLevel + "px;"
                        + "display: none;z-index:100;"
                        + "border: " + String(self.options.borderSize)
                        + "px solid " + self.options.borderColour
                        + ";background-repeat: no-repeat;"
                        + "position: absolute;";
                }


                //if inner  zoom
                if(self.options.zoomType == "inner") {
                    //has a border been put on the image? Lets cater for this

                    var borderWidth = self.$elem.css("border-left-width");

                    self.zoomWindowStyle = "overflow: hidden;"
                        + "margin-left: " + String(borderWidth) + ";"
                        + "margin-top: " + String(borderWidth) + ";"
                        + "background-position: 0px 0px;"
                        + "width: " + String(self.nzWidth) + "px;"
                        + "height: " + String(self.nzHeight)
                        + "px;float: left;"
                        + "display: none;"
                        + "cursor:"+(self.options.cursor)+";"
                        + "px solid " + self.options.borderColour
                        + ";background-repeat: no-repeat;"
                        + "position: absolute;";
                }



                //lens style for window zoom
                if(self.options.zoomType == "window") {


                    // adjust images less than the window height

                    if(self.nzHeight < self.options.zoomWindowWidth/self.widthRatio){
                        lensHeight = self.nzHeight;
                    }
                    else{
                        lensHeight = String((self.options.zoomWindowHeight/self.heightRatio))
                    }
                    if(self.largeWidth < self.options.zoomWindowWidth){
                        lensWidth = self.nzWidth;
                    }
                    else{
                        lensWidth =  (self.options.zoomWindowWidth/self.widthRatio);
                    }


                    self.lensStyle = "background-position: 0px 0px;width: " + String((self.options.zoomWindowWidth)/self.widthRatio) + "px;height: " + String((self.options.zoomWindowHeight)/self.heightRatio)
                    + "px;float: right;display: none;"
                    + "overflow: hidden;"
                    + "z-index: 999;"
                    + "-webkit-transform: translateZ(0);"
                    + "opacity:"+(self.options.lensOpacity)+";filter: alpha(opacity = "+(self.options.lensOpacity*100)+"); zoom:1;"
                    + "width:"+lensWidth+"px;"
                    + "height:"+lensHeight+"px;"
                    + "background-color:"+(self.options.lensColour)+";"
                    + "cursor:"+(self.options.cursor)+";"
                    + "border: "+(self.options.lensBorderSize)+"px" +
                    " solid "+(self.options.lensBorderColour)+";background-repeat: no-repeat;position: absolute;";
                }


                //tint style
                self.tintStyle = "display: block;"
                    + "position: absolute;"
                    + "background-color: "+self.options.tintColour+";"
                    + "filter:alpha(opacity=0);"
                    + "opacity: 0;"
                    + "width: " + self.nzWidth + "px;"
                    + "height: " + self.nzHeight + "px;"

                    ;

                //lens style for lens zoom with optional round for modern browsers
                self.lensRound = '';

                if(self.options.zoomType == "lens") {

                    self.lensStyle = "background-position: 0px 0px;"
                        + "float: left;display: none;"
                        + "border: " + String(self.options.borderSize) + "px solid " + self.options.borderColour+";"
                        + "width:"+ String(self.options.lensSize) +"px;"
                        + "height:"+ String(self.options.lensSize)+"px;"
                        + "background-repeat: no-repeat;position: absolute;";


                }


                //does not round in all browsers
                if(self.options.lensShape == "round") {
                    self.lensRound = "border-top-left-radius: " + String(self.options.lensSize / 2 + self.options.borderSize) + "px;"
                    + "border-top-right-radius: " + String(self.options.lensSize / 2 + self.options.borderSize) + "px;"
                    + "border-bottom-left-radius: " + String(self.options.lensSize / 2 + self.options.borderSize) + "px;"
                    + "border-bottom-right-radius: " + String(self.options.lensSize / 2 + self.options.borderSize) + "px;";

                }

                //create the div's                                                + ""
                //self.zoomContainer = $('<div/>').addClass('zoomContainer').css({"position":"relative", "height":self.nzHeight, "width":self.nzWidth});

                self.zoomContainer = $('<div class="zoomContainer" style="-webkit-transform: translateZ(0);position:absolute;left:'+self.nzOffset.left+'px;top:'+self.nzOffset.top+'px;height:'+self.nzHeight+'px;width:'+self.nzWidth+'px;"></div>');
                $('body').append(self.zoomContainer);


                //this will add overflow hidden and contrain the lens on lens mode
                if(self.options.containLensZoom && self.options.zoomType == "lens"){
                    self.zoomContainer.css("overflow", "hidden");
                }
                if(self.options.zoomType != "inner") {
                    self.zoomLens = $("<div class='zoomLens' style='" + self.lensStyle + self.lensRound +"'>&nbsp;</div>")
                    .appendTo(self.zoomContainer)
                    .click(function () {
                        self.$elem.trigger('click');
                    });


                    if(self.options.tint) {
                        self.tintContainer = $('<div/>').addClass('tintContainer');
                        self.zoomTint = $("<div class='zoomTint' style='"+self.tintStyle+"'></div>");


                        self.zoomLens.wrap(self.tintContainer);


                        self.zoomTintcss = self.zoomLens.after(self.zoomTint);

                        //if tint enabled - set an image to show over the tint

                        self.zoomTintImage = $('<img style="position: absolute; left: 0px; top: 0px; max-width: none; width: '+self.nzWidth+'px; height: '+self.nzHeight+'px;" src="'+self.imageSrc+'">')
                        .appendTo(self.zoomLens)
                        .click(function () {

                            self.$elem.trigger('click');
                        });

                    }

                }







                //create zoom window
                if(isNaN(self.options.zoomWindowPosition)){
                    self.zoomWindow = $("<div style='z-index:999;left:"+(self.windowOffsetLeft)+"px;top:"+(self.windowOffsetTop)+"px;" + self.zoomWindowStyle + "' class='zoomWindow'>&nbsp;</div>")
                    .appendTo('body')
                    .click(function () {
                        self.$elem.trigger('click');
                    });
                }else{
                    self.zoomWindow = $("<div style='z-index:999;left:"+(self.windowOffsetLeft)+"px;top:"+(self.windowOffsetTop)+"px;" + self.zoomWindowStyle + "' class='zoomWindow'>&nbsp;</div>")
                    .appendTo(self.zoomContainer)
                    .click(function () {
                        self.$elem.trigger('click');
                    });
                }
                self.zoomWindowContainer = $('<div/>').addClass('zoomWindowContainer').css("width",self.options.zoomWindowWidth);
                self.zoomWindow.wrap(self.zoomWindowContainer);


                //  self.captionStyle = "text-align: left;background-color: black;color: white;font-weight: bold;padding: 10px;font-family: sans-serif;font-size: 11px";
                // self.zoomCaption = $('<div class="elevatezoom-caption" style="'+self.captionStyle+'display: block; width: 280px;">INSERT ALT TAG</div>').appendTo(self.zoomWindow.parent());

                if(self.options.zoomType == "lens") {
                    self.zoomLens.css({ backgroundImage: "url('" + self.imageSrc + "')" });
                }
                if(self.options.zoomType == "window") {
                    self.zoomWindow.css({ backgroundImage: "url('" + self.imageSrc + "')" });
                }
                if(self.options.zoomType == "inner") {
                    self.zoomWindow.css({ backgroundImage: "url('" + self.imageSrc + "')" });
                }
                /*-------------------END THE ZOOM WINDOW AND LENS----------------------------------*/
                //touch events
                self.$elem.bind('touchmove', function(e){
                    e.preventDefault();
                    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                    self.setPosition(touch);

                });
                self.zoomContainer.bind('touchmove', function(e){
                    if(self.options.zoomType == "inner") {
                        self.showHideWindow("show");

                    }
                    e.preventDefault();
                    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                    self.setPosition(touch);

                });
                self.zoomContainer.bind('touchend', function(e){
                    self.showHideWindow("hide");
                    if(self.options.showLens) {self.showHideLens("hide");}
                    if(self.options.tint && self.options.zoomType != "inner") {self.showHideTint("hide");}
                });

                self.$elem.bind('touchend', function(e){
                    self.showHideWindow("hide");
                    if(self.options.showLens) {self.showHideLens("hide");}
                    if(self.options.tint && self.options.zoomType != "inner") {self.showHideTint("hide");}
                });
                if(self.options.showLens) {
                    self.zoomLens.bind('touchmove', function(e){

                        e.preventDefault();
                        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                        self.setPosition(touch);
                    });


                    self.zoomLens.bind('touchend', function(e){
                        self.showHideWindow("hide");
                        if(self.options.showLens) {self.showHideLens("hide");}
                        if(self.options.tint && self.options.zoomType != "inner") {self.showHideTint("hide");}
                    });
                }
                //Needed to work in IE
                self.$elem.bind('mousemove', function(e){
                    if(self.overWindow == false){self.setElements("show");}
                    //make sure on orientation change the setposition is not fired
                    if(self.lastX !== e.clientX || self.lastY !== e.clientY){
                        self.setPosition(e);
                        self.currentLoc = e;
                    }
                    self.lastX = e.clientX;
                    self.lastY = e.clientY;

                });

                self.zoomContainer.bind('mousemove', function(e){

                    if(self.overWindow == false){self.setElements("show");}

                    //make sure on orientation change the setposition is not fired
                    if(self.lastX !== e.clientX || self.lastY !== e.clientY){
                        self.setPosition(e);
                        self.currentLoc = e;
                    }
                    self.lastX = e.clientX;
                    self.lastY = e.clientY;
                });
                if(self.options.zoomType != "inner") {
                    self.zoomLens.bind('mousemove', function(e){
                        //make sure on orientation change the setposition is not fired
                        if(self.lastX !== e.clientX || self.lastY !== e.clientY){
                            self.setPosition(e);
                            self.currentLoc = e;
                        }
                        self.lastX = e.clientX;
                        self.lastY = e.clientY;
                    });
                }
                if(self.options.tint && self.options.zoomType != "inner") {
                    self.zoomTint.bind('mousemove', function(e){
                        //make sure on orientation change the setposition is not fired
                        if(self.lastX !== e.clientX || self.lastY !== e.clientY){
                            self.setPosition(e);
                            self.currentLoc = e;
                        }
                        self.lastX = e.clientX;
                        self.lastY = e.clientY;
                    });

                }
                if(self.options.zoomType == "inner") {
                    self.zoomWindow.bind('mousemove', function(e) {
                        //self.overWindow = true;
                        //make sure on orientation change the setposition is not fired
                        if(self.lastX !== e.clientX || self.lastY !== e.clientY){
                            self.setPosition(e);
                            self.currentLoc = e;
                        }
                        self.lastX = e.clientX;
                        self.lastY = e.clientY;
                    });

                }


                //  lensFadeOut: 500,  zoomTintFadeIn
                self.zoomContainer.add(self.$elem).mouseenter(function(){

                    if(self.overWindow == false){self.setElements("show");}


                }).mouseleave(function(){
                    if(!self.scrollLock){
                        self.setElements("hide");
                    }
                });
                //end ove image





                if(self.options.zoomType != "inner") {
                    self.zoomWindow.mouseenter(function(){
                        self.overWindow = true;
                        self.setElements("hide");
                    }).mouseleave(function(){

                        self.overWindow = false;
                    });
                }
                //end ove image



//				var delta = parseInt(e.originalEvent.wheelDelta || -e.originalEvent.detail);

                //      $(this).empty();
                //    return false;

                //fix for initial zoom setting
                if (self.options.zoomLevel != 1){
                    //	self.changeZoomLevel(self.currentZoomLevel);
                }
                //set the min zoomlevel
                if(self.options.minZoomLevel){
                    self.minZoomLevel = self.options.minZoomLevel;
                }
                else{
                    self.minZoomLevel = self.options.scrollZoomIncrement * 2;
                }


                if(self.options.scrollZoom){


                    self.zoomContainer.add(self.$elem).bind('mousewheel DOMMouseScroll MozMousePixelScroll', function(e){


//						in IE there is issue with firing of mouseleave - So check whether still scrolling
//						and on mouseleave check if scrolllock
                        self.scrollLock = true;
                        clearTimeout($.data(this, 'timer'));
                        $.data(this, 'timer', setTimeout(function() {
                            self.scrollLock = false;
                            //do something
                        }, 250));

                        var theEvent = e.originalEvent.wheelDelta || e.originalEvent.detail*-1


                        //this.scrollTop += ( delta < 0 ? 1 : -1 ) * 30;
                        //   e.preventDefault();


                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        e.preventDefault();


                        if(theEvent /120 > 0) {
                            //scrolling up
                            if(self.currentZoomLevel >= self.minZoomLevel){
                                self.changeZoomLevel(self.currentZoomLevel-self.options.scrollZoomIncrement);
                            }

                        }
                        else{
                            //scrolling down


                            if(self.options.maxZoomLevel){
                                if(self.currentZoomLevel <= self.options.maxZoomLevel){
                                    self.changeZoomLevel(parseFloat(self.currentZoomLevel)+self.options.scrollZoomIncrement);
                                }
                            }
                            else{
                                //andy

                                self.changeZoomLevel(parseFloat(self.currentZoomLevel)+self.options.scrollZoomIncrement);
                            }

                        }
                        return false;
                    });
                }


            },
            setElements: function(type) {
                var self = this;
        if(!self.options.zoomEnabled){return false;}
                if(type=="show"){
                    if(self.isWindowSet){
                        if(self.options.zoomType == "inner") {self.showHideWindow("show");}
                        if(self.options.zoomType == "window") {self.showHideWindow("show");}
                        if(self.options.showLens) {self.showHideLens("show");}
                        if(self.options.tint && self.options.zoomType != "inner") {self.showHideTint("show");
                        }
                    }
                }

                if(type=="hide"){
                    if(self.options.zoomType == "window") {self.showHideWindow("hide");}
                    if(!self.options.tint) {self.showHideWindow("hide");}
                    if(self.options.showLens) {self.showHideLens("hide");}
                    if(self.options.tint) {	self.showHideTint("hide");}
                }
            },
            setPosition: function(e) {

                var self = this;

        if(!self.options.zoomEnabled){return false;}

                //recaclc offset each time in case the image moves
                //this can be caused by other on page elements
                self.nzHeight = self.$elem.height();
                self.nzWidth = self.$elem.width();
                self.nzOffset = self.$elem.offset();

                if(self.options.tint && self.options.zoomType != "inner") {
                    self.zoomTint.css({ top: 0});
                    self.zoomTint.css({ left: 0});
                }
                //set responsive
                //will checking if the image needs changing before running this code work faster?
                if(self.options.responsive && !self.options.scrollZoom){
                    if(self.options.showLens){
                        if(self.nzHeight < self.options.zoomWindowWidth/self.widthRatio){
                            lensHeight = self.nzHeight;
                        }
                        else{
                            lensHeight = String((self.options.zoomWindowHeight/self.heightRatio))
                        }
                        if(self.largeWidth < self.options.zoomWindowWidth){
                            lensWidth = self.nzWidth;
                        }
                        else{
                            lensWidth =  (self.options.zoomWindowWidth/self.widthRatio);
                        }
                        self.widthRatio = self.largeWidth / self.nzWidth;
                        self.heightRatio = self.largeHeight / self.nzHeight;
                        if(self.options.zoomType != "lens") {


                            //possibly dont need to keep recalcalculating
                            //if the lens is heigher than the image, then set lens size to image size
                            if(self.nzHeight < self.options.zoomWindowWidth/self.widthRatio){
                                lensHeight = self.nzHeight;

                            }
                            else{
                                lensHeight = String((self.options.zoomWindowHeight/self.heightRatio))
                            }

                            if(self.options.zoomWindowWidth < self.options.zoomWindowWidth){
                                lensWidth = self.nzWidth;
                            }
                            else{
                                lensWidth =  (self.options.zoomWindowWidth/self.widthRatio);
                            }

                            self.zoomLens.css('width', lensWidth);
                            self.zoomLens.css('height', lensHeight);

                            if(self.options.tint){
                                self.zoomTintImage.css('width', self.nzWidth);
                                self.zoomTintImage.css('height', self.nzHeight);
                            }

                        }
                        if(self.options.zoomType == "lens") {

                            self.zoomLens.css({ width: String(self.options.lensSize) + 'px', height: String(self.options.lensSize) + 'px' })


                        }
                        //end responsive image change
                    }
                }

                //container fix
                self.zoomContainer.css({ top: self.nzOffset.top});
                self.zoomContainer.css({ left: self.nzOffset.left});
                self.mouseLeft = parseInt(e.pageX - self.nzOffset.left);
                self.mouseTop = parseInt(e.pageY - self.nzOffset.top);
                //calculate the Location of the Lens

                //calculate the bound regions - but only if zoom window
                if(self.options.zoomType == "window") {
                    self.Etoppos = (self.mouseTop < (self.zoomLens.height()/2));
                    self.Eboppos = (self.mouseTop > self.nzHeight - (self.zoomLens.height()/2)-(self.options.lensBorderSize*2));
                    self.Eloppos = (self.mouseLeft < 0+((self.zoomLens.width()/2)));
                    self.Eroppos = (self.mouseLeft > (self.nzWidth - (self.zoomLens.width()/2)-(self.options.lensBorderSize*2)));
                }
                //calculate the bound regions - but only for inner zoom
                if(self.options.zoomType == "inner"){
                    self.Etoppos = (self.mouseTop < ((self.nzHeight/2)/self.heightRatio) );
                    self.Eboppos = (self.mouseTop > (self.nzHeight - ((self.nzHeight/2)/self.heightRatio)));
                    self.Eloppos = (self.mouseLeft < 0+(((self.nzWidth/2)/self.widthRatio)));
                    self.Eroppos = (self.mouseLeft > (self.nzWidth - (self.nzWidth/2)/self.widthRatio-(self.options.lensBorderSize*2)));
                }

                // if the mouse position of the slider is one of the outerbounds, then hide  window and lens
                if (self.mouseLeft <= 0 || self.mouseTop < 0 || self.mouseLeft > self.nzWidth || self.mouseTop > self.nzHeight ) {
                    self.setElements("hide");
                    return;
                }
                //else continue with operations
                else {


                    //lens options
                    if(self.options.showLens) {
                        //		self.showHideLens("show");
                        //set background position of lens
                        self.lensLeftPos = String(self.mouseLeft - self.zoomLens.width() / 2);
                        self.lensTopPos = String(self.mouseTop - self.zoomLens.height() / 2);


                    }
                    //adjust the background position if the mouse is in one of the outer regions

                    //Top region
                    if(self.Etoppos){
                        self.lensTopPos = 0;
                    }
                    //Left Region
                    if(self.Eloppos){
                        self.windowLeftPos = 0;
                        self.lensLeftPos = 0;
                        self.tintpos=0;
                    }
                    //Set bottom and right region for window mode
                    if(self.options.zoomType == "window") {
                        if(self.Eboppos){
                            self.lensTopPos = Math.max( (self.nzHeight)-self.zoomLens.height()-(self.options.lensBorderSize*2), 0 );
                        }
                        if(self.Eroppos){
                            self.lensLeftPos = (self.nzWidth-(self.zoomLens.width())-(self.options.lensBorderSize*2));
                        }
                    }
                    //Set bottom and right region for inner mode
                    if(self.options.zoomType == "inner") {
                        if(self.Eboppos){
                            self.lensTopPos = Math.max( ((self.nzHeight)-(self.options.lensBorderSize*2)), 0 );
                        }
                        if(self.Eroppos){
                            self.lensLeftPos = (self.nzWidth-(self.nzWidth)-(self.options.lensBorderSize*2));
                        }

                    }
                    //if lens zoom
                    if(self.options.zoomType == "lens") {
                        self.windowLeftPos = String(((e.pageX - self.nzOffset.left) * self.widthRatio - self.zoomLens.width() / 2) * (-1));
                        self.windowTopPos = String(((e.pageY - self.nzOffset.top) * self.heightRatio - self.zoomLens.height() / 2) * (-1));

                        self.zoomLens.css({ backgroundPosition: self.windowLeftPos + 'px ' + self.windowTopPos + 'px' });

                        if(self.changeBgSize){

                            if(self.nzHeight>self.nzWidth){
                                if(self.options.zoomType == "lens"){
                                    self.zoomLens.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                                }

                                self.zoomWindow.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                            }
                            else{
                                if(self.options.zoomType == "lens"){
                                    self.zoomLens.css({ "background-size": self.largeWidth/self.newvaluewidth + 'px ' + self.largeHeight/self.newvaluewidth + 'px' });
                                }
                                self.zoomWindow.css({ "background-size": self.largeWidth/self.newvaluewidth + 'px ' + self.largeHeight/self.newvaluewidth + 'px' });
                            }
                            self.changeBgSize = false;
                        }

                        self.setWindowPostition(e);
                    }
                    //if tint zoom
                    if(self.options.tint && self.options.zoomType != "inner") {
                        self.setTintPosition(e);

                    }
                    //set the css background position
                    if(self.options.zoomType == "window") {
                        self.setWindowPostition(e);
                    }
                    if(self.options.zoomType == "inner") {
                        self.setWindowPostition(e);
                    }
                    if(self.options.showLens) {

                        if(self.fullwidth && self.options.zoomType != "lens"){
                            self.lensLeftPos = 0;

                        }
                        self.zoomLens.css({ left: self.lensLeftPos + 'px', top: self.lensTopPos + 'px' })
                    }

                } //end else



            },
            showHideWindow: function(change) {
                var self = this;
                if(change == "show"){
                    if(!self.isWindowActive){
                        if(self.options.zoomWindowFadeIn){
                            self.zoomWindow.stop(true, true, false).fadeIn(self.options.zoomWindowFadeIn);
                        }
                        else{self.zoomWindow.show();}
                        self.isWindowActive = true;
                    }
                }
                if(change == "hide"){
                    if(self.isWindowActive){
                        if(self.options.zoomWindowFadeOut){
                            self.zoomWindow.stop(true, true).fadeOut(self.options.zoomWindowFadeOut);
                        }
                        else{self.zoomWindow.hide();}
                        self.isWindowActive = false;
                    }
                }
            },
            showHideLens: function(change) {
                var self = this;
                if(change == "show"){
                    if(!self.isLensActive){
                        if(self.options.lensFadeIn){
                            self.zoomLens.stop(true, true, false).fadeIn(self.options.lensFadeIn);
                        }
                        else{self.zoomLens.show();}
                        self.isLensActive = true;
                    }
                }
                if(change == "hide"){
                    if(self.isLensActive){
                        if(self.options.lensFadeOut){
                            self.zoomLens.stop(true, true).fadeOut(self.options.lensFadeOut);
                        }
                        else{self.zoomLens.hide();}
                        self.isLensActive = false;
                    }
                }
            },
            showHideTint: function(change) {
                var self = this;
                if(change == "show"){
                    if(!self.isTintActive){

                        if(self.options.zoomTintFadeIn){
                            self.zoomTint.css({opacity:self.options.tintOpacity}).animate().stop(true, true).fadeIn("slow");
                        }
                        else{
                            self.zoomTint.css({opacity:self.options.tintOpacity}).animate();
                            self.zoomTint.show();


                        }
                        self.isTintActive = true;
                    }
                }
                if(change == "hide"){
                    if(self.isTintActive){

                        if(self.options.zoomTintFadeOut){
                            self.zoomTint.stop(true, true).fadeOut(self.options.zoomTintFadeOut);
                        }
                        else{self.zoomTint.hide();}
                        self.isTintActive = false;
                    }
                }
            },
            setLensPostition: function( e ) {


            },
            setWindowPostition: function( e ) {
                //return obj.slice( 0, count );
                var self = this;

                if(!isNaN(self.options.zoomWindowPosition)){

                    switch (self.options.zoomWindowPosition) {
                    case 1: //done
                        self.windowOffsetTop = (self.options.zoomWindowOffety);//DONE - 1
                        self.windowOffsetLeft =(+self.nzWidth); //DONE 1, 2, 3, 4, 16
                        break;
                    case 2:
                        if(self.options.zoomWindowHeight > self.nzHeight){ //positive margin

                            self.windowOffsetTop = ((self.options.zoomWindowHeight/2)-(self.nzHeight/2))*(-1);
                            self.windowOffsetLeft =(self.nzWidth); //DONE 1, 2, 3, 4, 16
                        }
                        else{ //negative margin

                        }
                        break;
                    case 3: //done
                        self.windowOffsetTop = (self.nzHeight - self.zoomWindow.height() - (self.options.borderSize*2)); //DONE 3,9
                        self.windowOffsetLeft =(self.nzWidth); //DONE 1, 2, 3, 4, 16
                        break;
                    case 4: //done
                        self.windowOffsetTop = (self.nzHeight); //DONE - 4,5,6,7,8
                        self.windowOffsetLeft =(self.nzWidth); //DONE 1, 2, 3, 4, 16
                        break;
                    case 5: //done
                        self.windowOffsetTop = (self.nzHeight); //DONE - 4,5,6,7,8
                        self.windowOffsetLeft =(self.nzWidth-self.zoomWindow.width()-(self.options.borderSize*2)); //DONE - 5,15
                        break;
                    case 6:
                        if(self.options.zoomWindowHeight > self.nzHeight){ //positive margin
                            self.windowOffsetTop = (self.nzHeight);  //DONE - 4,5,6,7,8

                            self.windowOffsetLeft =((self.options.zoomWindowWidth/2)-(self.nzWidth/2)+(self.options.borderSize*2))*(-1);
                        }
                        else{ //negative margin

                        }


                        break;
                    case 7: //done
                        self.windowOffsetTop = (self.nzHeight);  //DONE - 4,5,6,7,8
                        self.windowOffsetLeft = 0; //DONE 7, 13
                        break;
                    case 8: //done
                        self.windowOffsetTop = (self.nzHeight); //DONE - 4,5,6,7,8
                        self.windowOffsetLeft =(self.zoomWindow.width()+(self.options.borderSize*2) )* (-1);  //DONE 8,9,10,11,12
                        break;
                    case 9:  //done
                        self.windowOffsetTop = (self.nzHeight - self.zoomWindow.height() - (self.options.borderSize*2)); //DONE 3,9
                        self.windowOffsetLeft =(self.zoomWindow.width()+(self.options.borderSize*2) )* (-1);  //DONE 8,9,10,11,12
                        break;
                    case 10:
                        if(self.options.zoomWindowHeight > self.nzHeight){ //positive margin

                            self.windowOffsetTop = ((self.options.zoomWindowHeight/2)-(self.nzHeight/2))*(-1);
                            self.windowOffsetLeft =(self.zoomWindow.width()+(self.options.borderSize*2) )* (-1);  //DONE 8,9,10,11,12
                        }
                        else{ //negative margin

                        }
                        break;
                    case 11:
                        self.windowOffsetTop = (self.options.zoomWindowOffety);
                        self.windowOffsetLeft =(self.zoomWindow.width()+(self.options.borderSize*2) )* (-1);  //DONE 8,9,10,11,12
                        break;
                    case 12: //done
                        self.windowOffsetTop = (self.zoomWindow.height()+(self.options.borderSize*2))*(-1); //DONE 12,13,14,15,16
                        self.windowOffsetLeft =(self.zoomWindow.width()+(self.options.borderSize*2) )* (-1);  //DONE 8,9,10,11,12
                        break;
                    case 13: //done
                        self.windowOffsetTop = (self.zoomWindow.height()+(self.options.borderSize*2))*(-1); //DONE 12,13,14,15,16
                        self.windowOffsetLeft =(0); //DONE 7, 13
                        break;
                    case 14:
                        if(self.options.zoomWindowHeight > self.nzHeight){ //positive margin
                            self.windowOffsetTop = (self.zoomWindow.height()+(self.options.borderSize*2))*(-1); //DONE 12,13,14,15,16

                            self.windowOffsetLeft =((self.options.zoomWindowWidth/2)-(self.nzWidth/2)+(self.options.borderSize*2))*(-1);
                        }
                        else{ //negative margin

                        }

                        break;
                    case 15://done
                        self.windowOffsetTop = (self.zoomWindow.height()+(self.options.borderSize*2))*(-1); //DONE 12,13,14,15,16
                        self.windowOffsetLeft =(self.nzWidth-self.zoomWindow.width()-(self.options.borderSize*2)); //DONE - 5,15
                        break;
                    case 16:  //done
                        self.windowOffsetTop = (self.zoomWindow.height()+(self.options.borderSize*2))*(-1); //DONE 12,13,14,15,16
                        self.windowOffsetLeft =(self.nzWidth); //DONE 1, 2, 3, 4, 16
                        break;
                    default: //done
                        self.windowOffsetTop = (self.options.zoomWindowOffety);//DONE - 1
                    self.windowOffsetLeft =(self.nzWidth); //DONE 1, 2, 3, 4, 16
                    }
                } //end isNAN
                else{
                    //WE CAN POSITION IN A CLASS - ASSUME THAT ANY STRING PASSED IS
                    self.externalContainer = $('#'+self.options.zoomWindowPosition);
                    self.externalContainerWidth = self.externalContainer.width();
                    self.externalContainerHeight = self.externalContainer.height();
                    self.externalContainerOffset = self.externalContainer.offset();

                    self.windowOffsetTop = self.externalContainerOffset.top;//DONE - 1
                    self.windowOffsetLeft =self.externalContainerOffset.left; //DONE 1, 2, 3, 4, 16

                }
                self.isWindowSet = true;
                self.windowOffsetTop = self.windowOffsetTop + self.options.zoomWindowOffety;
                self.windowOffsetLeft = self.windowOffsetLeft + self.options.zoomWindowOffetx;

                self.zoomWindow.css({ top: self.windowOffsetTop});
                self.zoomWindow.css({ left: self.windowOffsetLeft});

                if(self.options.zoomType == "inner") {
                    self.zoomWindow.css({ top: 0});
                    self.zoomWindow.css({ left: 0});

                }


                self.windowLeftPos = String(((e.pageX - self.nzOffset.left) * self.widthRatio - self.zoomWindow.width() / 2) * (-1));
                self.windowTopPos = String(((e.pageY - self.nzOffset.top) * self.heightRatio - self.zoomWindow.height() / 2) * (-1));
                if(self.Etoppos){self.windowTopPos = 0;}
                if(self.Eloppos){self.windowLeftPos = 0;}
                if(self.Eboppos){self.windowTopPos = (self.largeHeight/self.currentZoomLevel-self.zoomWindow.height())*(-1);  }
                if(self.Eroppos){self.windowLeftPos = ((self.largeWidth/self.currentZoomLevel-self.zoomWindow.width())*(-1));}

                //stops micro movements
                if(self.fullheight){
                    self.windowTopPos = 0;

                }
                if(self.fullwidth){
                    self.windowLeftPos = 0;

                }
                //set the css background position


                if(self.options.zoomType == "window" || self.options.zoomType == "inner") {

                    if(self.zoomLock == 1){
                        //overrides for images not zoomable
                        if(self.widthRatio <= 1){

                            self.windowLeftPos = 0;
                        }
                        if(self.heightRatio <= 1){
                            self.windowTopPos = 0;
                        }
                    }
                    // adjust images less than the window height

                    if(self.largeHeight < self.options.zoomWindowHeight){

                        self.windowTopPos = 0;
                    }
                    if(self.largeWidth < self.options.zoomWindowWidth){
                        self.windowLeftPos = 0;
                    }

                    //set the zoomwindow background position
                    if (self.options.easing){

                        //     if(self.changeZoom){
                        //           clearInterval(self.loop);
                        //           self.changeZoom = false;
                        //           self.loop = false;

                        //            }
                        //set the pos to 0 if not set
                        if(!self.xp){self.xp = 0;}
                        if(!self.yp){self.yp = 0;}
                        //if loop not already started, then run it
                        if (!self.loop){
                            self.loop = setInterval(function(){
                                //using zeno's paradox

                                self.xp += (self.windowLeftPos  - self.xp) / self.options.easingAmount;
                                self.yp += (self.windowTopPos  - self.yp) / self.options.easingAmount;
                                if(self.scrollingLock){


                                    clearInterval(self.loop);
                                    self.xp = self.windowLeftPos;
                                    self.yp = self.windowTopPos

                                    self.xp = ((e.pageX - self.nzOffset.left) * self.widthRatio - self.zoomWindow.width() / 2) * (-1);
                                    self.yp = (((e.pageY - self.nzOffset.top) * self.heightRatio - self.zoomWindow.height() / 2) * (-1));

                                    if(self.changeBgSize){
                                        if(self.nzHeight>self.nzWidth){
                                            if(self.options.zoomType == "lens"){
                                                self.zoomLens.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                                            }
                                            self.zoomWindow.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                                        }
                                        else{
                                            if(self.options.zoomType != "lens"){
                                                self.zoomLens.css({ "background-size": self.largeWidth/self.newvaluewidth + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                                            }
                                            self.zoomWindow.css({ "background-size": self.largeWidth/self.newvaluewidth + 'px ' + self.largeHeight/self.newvaluewidth + 'px' });

                                        }

                                        /*
             if(!self.bgxp){self.bgxp = self.largeWidth/self.newvalue;}
                        if(!self.bgyp){self.bgyp = self.largeHeight/self.newvalue ;}
                 if (!self.bgloop){
                     self.bgloop = setInterval(function(){

                 self.bgxp += (self.largeWidth/self.newvalue  - self.bgxp) / self.options.easingAmount;
                                self.bgyp += (self.largeHeight/self.newvalue  - self.bgyp) / self.options.easingAmount;

           self.zoomWindow.css({ "background-size": self.bgxp + 'px ' + self.bgyp + 'px' });


                  }, 16);

                 }
                                         */
                                        self.changeBgSize = false;
                                    }

                                    self.zoomWindow.css({ backgroundPosition: self.windowLeftPos + 'px ' + self.windowTopPos + 'px' });
                                    self.scrollingLock = false;
                                    self.loop = false;

                                }
                                else{
                                    if(self.changeBgSize){
                                        if(self.nzHeight>self.nzWidth){
                                            if(self.options.zoomType == "lens"){
                                                self.zoomLens.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                                            }
                                            self.zoomWindow.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                                        }
                                        else{
                                            if(self.options.zoomType != "lens"){
                                                self.zoomLens.css({ "background-size": self.largeWidth/self.newvaluewidth + 'px ' + self.largeHeight/self.newvaluewidth + 'px' });
                                            }
                                            self.zoomWindow.css({ "background-size": self.largeWidth/self.newvaluewidth + 'px ' + self.largeHeight/self.newvaluewidth + 'px' });
                                        }
                                        self.changeBgSize = false;
                                    }

                                    self.zoomWindow.css({ backgroundPosition: self.xp + 'px ' + self.yp + 'px' });
                                }
                            }, 16);
                        }
                    }
                    else{
                        if(self.changeBgSize){
                            if(self.nzHeight>self.nzWidth){
                                if(self.options.zoomType == "lens"){
                                    self.zoomLens.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                                }

                                self.zoomWindow.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                            }
                            else{
                                if(self.options.zoomType == "lens"){
                                    self.zoomLens.css({ "background-size": self.largeWidth/self.newvaluewidth + 'px ' + self.largeHeight/self.newvaluewidth + 'px' });
                                }
                                if((self.largeHeight/self.newvaluewidth) < self.options.zoomWindowHeight){

                                    self.zoomWindow.css({ "background-size": self.largeWidth/self.newvaluewidth + 'px ' + self.largeHeight/self.newvaluewidth + 'px' });
                                }
                                else{

                                    self.zoomWindow.css({ "background-size": self.largeWidth/self.newvalueheight + 'px ' + self.largeHeight/self.newvalueheight + 'px' });
                                }

                            }
                            self.changeBgSize = false;
                        }

                        self.zoomWindow.css({ backgroundPosition: self.windowLeftPos + 'px ' + self.windowTopPos + 'px' });
                    }
                }
            },
            setTintPosition: function(e){
                var self = this;
                self.nzOffset = self.$elem.offset();
                self.tintpos = String(((e.pageX - self.nzOffset.left)-(self.zoomLens.width() / 2)) * (-1));
                self.tintposy = String(((e.pageY - self.nzOffset.top) - self.zoomLens.height() / 2) * (-1));
                if(self.Etoppos){
                    self.tintposy = 0;
                }
                if(self.Eloppos){
                    self.tintpos=0;
                }
                if(self.Eboppos){
                    self.tintposy = (self.nzHeight-self.zoomLens.height()-(self.options.lensBorderSize*2))*(-1);
                }
                if(self.Eroppos){
                    self.tintpos = ((self.nzWidth-self.zoomLens.width()-(self.options.lensBorderSize*2))*(-1));
                }
                if(self.options.tint) {
                    //stops micro movements
                    if(self.fullheight){
                        self.tintposy = 0;

                    }
                    if(self.fullwidth){
                        self.tintpos = 0;

                    }
                    self.zoomTintImage.css({'left': self.tintpos+'px'});
                    self.zoomTintImage.css({'top': self.tintposy+'px'});
                }
            },

            swaptheimage: function(smallimage, largeimage){
                var self = this;
                var newImg = new Image();

                if(self.options.loadingIcon){
                    self.spinner = $('<div style="background: url(\''+self.options.loadingIcon+'\') no-repeat center;height:'+self.nzHeight+'px;width:'+self.nzWidth+'px;z-index: 2000;position: absolute; background-position: center center;"></div>');
                    self.$elem.after(self.spinner);
                }

                self.options.onImageSwap(self.$elem);

                newImg.onload = function() {
                    self.largeWidth = newImg.width;
                    self.largeHeight = newImg.height;
                    self.zoomImage = largeimage;
                    self.zoomWindow.css({ "background-size": self.largeWidth + 'px ' + self.largeHeight + 'px' });
                    self.zoomWindow.css({ "background-size": self.largeWidth + 'px ' + self.largeHeight + 'px' });


                    self.swapAction(smallimage, largeimage);
                    return;
                }
                newImg.src = largeimage; // this must be done AFTER setting onload

            },
            swapAction: function(smallimage, largeimage){


                var self = this;

                var newImg2 = new Image();
                newImg2.onload = function() {
                    //re-calculate values
                    self.nzHeight = newImg2.height;
                    self.nzWidth = newImg2.width;
                    self.options.onImageSwapComplete(self.$elem);

                    self.doneCallback();
                    return;
                }
                newImg2.src = smallimage;

                //reset the zoomlevel to that initially set in options
                self.currentZoomLevel = self.options.zoomLevel;
                self.options.maxZoomLevel = false;

                //swaps the main image
                //self.$elem.attr("src",smallimage);
                //swaps the zoom image
                if(self.options.zoomType == "lens") {
                    self.zoomLens.css({ backgroundImage: "url('" + largeimage + "')" });
                }
                if(self.options.zoomType == "window") {
                    self.zoomWindow.css({ backgroundImage: "url('" + largeimage + "')" });
                }
                if(self.options.zoomType == "inner") {
                    self.zoomWindow.css({ backgroundImage: "url('" + largeimage + "')" });
                }



                self.currentImage = largeimage;

                if(self.options.imageCrossfade){
                    var oldImg = self.$elem;
                    var newImg = oldImg.clone();
                    self.$elem.attr("src",smallimage)
                    self.$elem.after(newImg);
                    newImg.stop(true).fadeOut(self.options.imageCrossfade, function() {
                        $(this).remove();
                    });

                    //       				if(self.options.zoomType == "inner"){
                    //remove any attributes on the cloned image so we can resize later
                    self.$elem.width("auto").removeAttr("width");
                    self.$elem.height("auto").removeAttr("height");
                    //   }

                    oldImg.fadeIn(self.options.imageCrossfade);

                    if(self.options.tint && self.options.zoomType != "inner") {

                        var oldImgTint = self.zoomTintImage;
                        var newImgTint = oldImgTint.clone();
                        self.zoomTintImage.attr("src",largeimage)
                        self.zoomTintImage.after(newImgTint);
                        newImgTint.stop(true).fadeOut(self.options.imageCrossfade, function() {
                            $(this).remove();
                        });



                        oldImgTint.fadeIn(self.options.imageCrossfade);


                        //self.zoomTintImage.attr("width",elem.data("image"));

                        //resize the tint window
                        self.zoomTint.css({ height: self.$elem.height()});
                        self.zoomTint.css({ width: self.$elem.width()});
                    }

                    self.zoomContainer.css("height", self.$elem.height());
                    self.zoomContainer.css("width", self.$elem.width());

                    if(self.options.zoomType == "inner"){
                        if(!self.options.constrainType){
                            self.zoomWrap.parent().css("height", self.$elem.height());
                            self.zoomWrap.parent().css("width", self.$elem.width());

                            self.zoomWindow.css("height", self.$elem.height());
                            self.zoomWindow.css("width", self.$elem.width());
                        }
                    }

                    if(self.options.imageCrossfade){
                        self.zoomWrap.css("height", self.$elem.height());
                        self.zoomWrap.css("width", self.$elem.width());
                    }
                }
                else{
                    self.$elem.attr("src",smallimage);
                    if(self.options.tint) {
                        self.zoomTintImage.attr("src",largeimage);
                        //self.zoomTintImage.attr("width",elem.data("image"));
                        self.zoomTintImage.attr("height",self.$elem.height());
                        //self.zoomTintImage.attr('src') = elem.data("image");
                        self.zoomTintImage.css({ height: self.$elem.height()});
                        self.zoomTint.css({ height: self.$elem.height()});

                    }
                    self.zoomContainer.css("height", self.$elem.height());
                    self.zoomContainer.css("width", self.$elem.width());

                    if(self.options.imageCrossfade){
                        self.zoomWrap.css("height", self.$elem.height());
                        self.zoomWrap.css("width", self.$elem.width());
                    }
                }
                if(self.options.constrainType){

                    //This will contrain the image proportions
                    if(self.options.constrainType == "height"){

                        self.zoomContainer.css("height", self.options.constrainSize);
                        self.zoomContainer.css("width", "auto");

                        if(self.options.imageCrossfade){
                            self.zoomWrap.css("height", self.options.constrainSize);
                            self.zoomWrap.css("width", "auto");
                            self.constwidth = self.zoomWrap.width();


                        }
                        else{
                            self.$elem.css("height", self.options.constrainSize);
                            self.$elem.css("width", "auto");
                            self.constwidth = self.$elem.width();
                        }

                        if(self.options.zoomType == "inner"){

                            self.zoomWrap.parent().css("height", self.options.constrainSize);
                            self.zoomWrap.parent().css("width", self.constwidth);
                            self.zoomWindow.css("height", self.options.constrainSize);
                            self.zoomWindow.css("width", self.constwidth);
                        }
                        if(self.options.tint){
                            self.tintContainer.css("height", self.options.constrainSize);
                            self.tintContainer.css("width", self.constwidth);
                            self.zoomTint.css("height", self.options.constrainSize);
                            self.zoomTint.css("width", self.constwidth);
                            self.zoomTintImage.css("height", self.options.constrainSize);
                            self.zoomTintImage.css("width", self.constwidth);
                        }

                    }
                    if(self.options.constrainType == "width"){
                        self.zoomContainer.css("height", "auto");
                        self.zoomContainer.css("width", self.options.constrainSize);

                        if(self.options.imageCrossfade){
                            self.zoomWrap.css("height", "auto");
                            self.zoomWrap.css("width", self.options.constrainSize);
                            self.constheight = self.zoomWrap.height();
                        }
                        else{
                            self.$elem.css("height", "auto");
                            self.$elem.css("width", self.options.constrainSize);
                            self.constheight = self.$elem.height();
                        }
                        if(self.options.zoomType == "inner"){
                            self.zoomWrap.parent().css("height", self.constheight);
                            self.zoomWrap.parent().css("width", self.options.constrainSize);
                            self.zoomWindow.css("height", self.constheight);
                            self.zoomWindow.css("width", self.options.constrainSize);
                        }
                        if(self.options.tint){
                            self.tintContainer.css("height", self.constheight);
                            self.tintContainer.css("width", self.options.constrainSize);
                            self.zoomTint.css("height", self.constheight);
                            self.zoomTint.css("width", self.options.constrainSize);
                            self.zoomTintImage.css("height", self.constheight);
                            self.zoomTintImage.css("width", self.options.constrainSize);
                        }

                    }


                }

            },
            doneCallback: function(){

                var self = this;
                if(self.options.loadingIcon){
                    self.spinner.hide();
                }

                self.nzOffset = self.$elem.offset();
                self.nzWidth = self.$elem.width();
                self.nzHeight = self.$elem.height();

                // reset the zoomlevel back to default
                self.currentZoomLevel = self.options.zoomLevel;

                //ratio of the large to small image
                self.widthRatio = self.largeWidth / self.nzWidth;
                self.heightRatio = self.largeHeight / self.nzHeight;

                //NEED TO ADD THE LENS SIZE FOR ROUND
                // adjust images less than the window height
                if(self.options.zoomType == "window") {

                    if(self.nzHeight < self.options.zoomWindowWidth/self.widthRatio){
                        lensHeight = self.nzHeight;

                    }
                    else{
                        lensHeight = String((self.options.zoomWindowHeight/self.heightRatio))
                    }

                    if(self.options.zoomWindowWidth < self.options.zoomWindowWidth){
                        lensWidth = self.nzWidth;
                    }
                    else{
                        lensWidth =  (self.options.zoomWindowWidth/self.widthRatio);
                    }


                    if(self.zoomLens){

                        self.zoomLens.css('width', lensWidth);
                        self.zoomLens.css('height', lensHeight);


                    }
                }
            },
            getCurrentImage: function(){
                var self = this;
                return self.zoomImage;
            },
            getGalleryList: function(){
                var self = this;
                //loop through the gallery options and set them in list for fancybox
                self.gallerylist = [];
                if (self.options.gallery){


                    $('#'+self.options.gallery + ' a').each(function() {

                        var img_src = '';
                        if($(this).data("zoom-image")){
                            img_src = $(this).data("zoom-image");
                        }
                        else if($(this).data("image")){
                            img_src = $(this).data("image");
                        }
                        //put the current image at the start
                        if(img_src == self.zoomImage){
                            self.gallerylist.unshift({
                                href: ''+img_src+'',
                                title: $(this).find('img').attr("title")
                            });
                        }
                        else{
                            self.gallerylist.push({
                                href: ''+img_src+'',
                                title: $(this).find('img').attr("title")
                            });
                        }


                    });
                }
                //if no gallery - return current image
                else{
                    self.gallerylist.push({
                        href: ''+self.zoomImage+'',
                        title: $(this).find('img').attr("title")
                    });
                }
                return self.gallerylist;

            },
            changeZoomLevel: function(value){
                var self = this;

                //flag a zoom, so can adjust the easing during setPosition
                self.scrollingLock = true;

                //round to two decimal places
                self.newvalue = parseFloat(value).toFixed(2);
                newvalue = parseFloat(value).toFixed(2);




                //maxwidth & Maxheight of the image
                maxheightnewvalue = self.largeHeight/((self.options.zoomWindowHeight / self.nzHeight) * self.nzHeight);
                maxwidthtnewvalue = self.largeWidth/((self.options.zoomWindowWidth / self.nzWidth) * self.nzWidth);




                //calculate new heightratio
                if(self.options.zoomType != "inner")
                {
                    if(maxheightnewvalue <= newvalue){
                        self.heightRatio = (self.largeHeight/maxheightnewvalue) / self.nzHeight;
                        self.newvalueheight = maxheightnewvalue;
                        self.fullheight = true;

                    }
                    else{
                        self.heightRatio = (self.largeHeight/newvalue) / self.nzHeight;
                        self.newvalueheight = newvalue;
                        self.fullheight = false;

                    }


//					calculate new width ratio

                    if(maxwidthtnewvalue <= newvalue){
                        self.widthRatio = (self.largeWidth/maxwidthtnewvalue) / self.nzWidth;
                        self.newvaluewidth = maxwidthtnewvalue;
                        self.fullwidth = true;

                    }
                    else{
                        self.widthRatio = (self.largeWidth/newvalue) / self.nzWidth;
                        self.newvaluewidth = newvalue;
                        self.fullwidth = false;

                    }
                    if(self.options.zoomType == "lens"){
                        if(maxheightnewvalue <= newvalue){
                            self.fullwidth = true;
                            self.newvaluewidth = maxheightnewvalue;

                        } else{
                            self.widthRatio = (self.largeWidth/newvalue) / self.nzWidth;
                            self.newvaluewidth = newvalue;

                            self.fullwidth = false;
                        }}
                }



                if(self.options.zoomType == "inner")
                {
                    maxheightnewvalue = parseFloat(self.largeHeight/self.nzHeight).toFixed(2);
                    maxwidthtnewvalue = parseFloat(self.largeWidth/self.nzWidth).toFixed(2);
                    if(newvalue > maxheightnewvalue){
                        newvalue = maxheightnewvalue;
                    }
                    if(newvalue > maxwidthtnewvalue){
                        newvalue = maxwidthtnewvalue;
                    }


                    if(maxheightnewvalue <= newvalue){


                        self.heightRatio = (self.largeHeight/newvalue) / self.nzHeight;
                        if(newvalue > maxheightnewvalue){
                            self.newvalueheight = maxheightnewvalue;
                        }else{
                            self.newvalueheight = newvalue;
                        }
                        self.fullheight = true;


                    }
                    else{



                        self.heightRatio = (self.largeHeight/newvalue) / self.nzHeight;

                        if(newvalue > maxheightnewvalue){

                            self.newvalueheight = maxheightnewvalue;
                        }else{
                            self.newvalueheight = newvalue;
                        }
                        self.fullheight = false;
                    }




                    if(maxwidthtnewvalue <= newvalue){

                        self.widthRatio = (self.largeWidth/newvalue) / self.nzWidth;
                        if(newvalue > maxwidthtnewvalue){

                            self.newvaluewidth = maxwidthtnewvalue;
                        }else{
                            self.newvaluewidth = newvalue;
                        }

                        self.fullwidth = true;


                    }
                    else{

                        self.widthRatio = (self.largeWidth/newvalue) / self.nzWidth;
                        self.newvaluewidth = newvalue;
                        self.fullwidth = false;
                    }


                } //end inner
                scrcontinue = false;

                if(self.options.zoomType == "inner"){

                    if(self.nzWidth > self.nzHeight){
                        if( self.newvaluewidth <= maxwidthtnewvalue){
                            scrcontinue = true;
                        }
                        else{

                            scrcontinue = false;
                            self.fullheight = true;
                            self.fullwidth = true;
                        }
                    }
                    if(self.nzHeight > self.nzWidth){
                        if( self.newvaluewidth <= maxwidthtnewvalue){
                            scrcontinue = true;
                        }
                        else{
                            scrcontinue = false;

                            self.fullheight = true;
                            self.fullwidth = true;
                        }
                    }
                }

                if(self.options.zoomType != "inner"){
                    scrcontinue = true;
                }

                if(scrcontinue){



                    self.zoomLock = 0;
                    self.changeZoom = true;

                    //if lens height is less than image height


                    if(((self.options.zoomWindowHeight)/self.heightRatio) <= self.nzHeight){


                        self.currentZoomLevel = self.newvalueheight;
                        if(self.options.zoomType != "lens" && self.options.zoomType != "inner") {
                            self.changeBgSize = true;

                            self.zoomLens.css({height: String((self.options.zoomWindowHeight)/self.heightRatio) + 'px' })
                        }
                        if(self.options.zoomType == "lens" || self.options.zoomType == "inner") {
                            self.changeBgSize = true;
                        }


                    }




                    if((self.options.zoomWindowWidth/self.widthRatio) <= self.nzWidth){



                        if(self.options.zoomType != "inner"){
                            if(self.newvaluewidth > self.newvalueheight)   {
                                self.currentZoomLevel = self.newvaluewidth;

                            }
                        }

                        if(self.options.zoomType != "lens" && self.options.zoomType != "inner") {
                            self.changeBgSize = true;

                            self.zoomLens.css({width: String((self.options.zoomWindowWidth)/self.widthRatio) + 'px' })
                        }
                        if(self.options.zoomType == "lens" || self.options.zoomType == "inner") {
                            self.changeBgSize = true;
                        }

                    }
                    if(self.options.zoomType == "inner"){
                        self.changeBgSize = true;

                        if(self.nzWidth > self.nzHeight){
                            self.currentZoomLevel = self.newvaluewidth;
                        }
                        if(self.nzHeight > self.nzWidth){
                            self.currentZoomLevel = self.newvaluewidth;
                        }
                    }

                }      //under

                //sets the boundry change, called in setWindowPos
                self.setPosition(self.currentLoc);
                //
            },
            closeAll: function(){
                if(self.zoomWindow){self.zoomWindow.hide();}
                if(self.zoomLens){self.zoomLens.hide();}
                if(self.zoomTint){self.zoomTint.hide();}
            },
            changeState: function(value){
          var self = this;
                if(value == 'enable'){self.options.zoomEnabled = true;}
                if(value == 'disable'){self.options.zoomEnabled = false;}

            }

    };




    $.fn.elevateZoom = function( options ) {
        return this.each(function() {
            var elevate = Object.create( ElevateZoom );

            elevate.init( options, this );

            $.data( this, 'elevateZoom', elevate );

        });
    };

    $.fn.elevateZoom.options = {
            zoomActivation: "hover", // Can also be click (PLACEHOLDER FOR NEXT VERSION)
      zoomEnabled: true, //false disables zoomwindow from showing
            preloading: 1, //by default, load all the images, if 0, then only load images after activated (PLACEHOLDER FOR NEXT VERSION)
            zoomLevel: 1, //default zoom level of image
            scrollZoom: false, //allow zoom on mousewheel, true to activate
            scrollZoomIncrement: 0.1,  //steps of the scrollzoom
            minZoomLevel: false,
            maxZoomLevel: false,
            easing: false,
            easingAmount: 12,
            lensSize: 200,
            zoomWindowWidth: 400,
            zoomWindowHeight: 400,
            zoomWindowOffetx: 0,
            zoomWindowOffety: 0,
            zoomWindowPosition: 1,
            zoomWindowBgColour: "#fff",
            lensFadeIn: false,
            lensFadeOut: false,
            debug: false,
            zoomWindowFadeIn: false,
            zoomWindowFadeOut: false,
            zoomWindowAlwaysShow: false,
            zoomTintFadeIn: false,
            zoomTintFadeOut: false,
            borderSize: 4,
            showLens: true,
            borderColour: "#888",
            lensBorderSize: 1,
            lensBorderColour: "#000",
            lensShape: "square", //can be "round"
            zoomType: "window", //window is default,  also "lens" available -
            containLensZoom: false,
            lensColour: "white", //colour of the lens background
            lensOpacity: 0.4, //opacity of the lens
            lenszoom: false,
            tint: false, //enable the tinting
            tintColour: "#333", //default tint color, can be anything, red, #ccc, rgb(0,0,0)
            tintOpacity: 0.4, //opacity of the tint
            gallery: false,
            galleryActiveClass: "zoomGalleryActive",
            imageCrossfade: false,
            constrainType: false,  //width or height
            constrainSize: false,  //in pixels the dimensions you want to constrain on
            loadingIcon: false, //http://www.example.com/spinner.gif
            cursor:"default", // user should set to what they want the cursor as, if they have set a click function
            responsive:true,
            onComplete: $.noop,
            onZoomedImageLoaded: function() {},
            onImageSwap: $.noop,
            onImageSwapComplete: $.noop
    };

})( jQuery, window, document );

/*	
 * jQuery mmenu v4.7.5
 * @requires jQuery 1.7.0 or later
 *
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 * www.frebsite.nl
 *
 * Licensed under the MIT license:
 * http://en.wikipedia.org/wiki/MIT_License
 */
! function(e) {
    function n() {
        l = !0, d.$wndw = e(window), d.$html = e("html"), d.$body = e("body"), e.each([i, a, o], function(e, n) {
            n.add = function(e) {
                e = e.split(" ");
                for (var t in e) n[e[t]] = n.mm(e[t])
            }
        }), i.mm = function(e) {
            return "mm-" + e
        }, i.add("wrapper menu inline panel nopanel list nolist subtitle selected label spacer current highest hidden opened subopened subopen fullsubopen subclose"), i.umm = function(e) {
            return "mm-" == e.slice(0, 3) && (e = e.slice(3)), e
        }, a.mm = function(e) {
            return "mm-" + e
        }, a.add("parent"), o.mm = function(e) {
            return e + ".mm"
        }, o.add("toggle open close setSelected transitionend webkitTransitionEnd mousedown mouseup touchstart touchmove touchend scroll resize click keydown keyup"), e[t]._c = i, e[t]._d = a, e[t]._e = o, e[t].glbl = d
    }
    var t = "mmenu",
        s = "4.7.5";
    if (!e[t]) {
        var i = {},
            a = {},
            o = {},
            l = !1,
            d = {
                $wndw: null,
                $html: null,
                $body: null
            };
        e[t] = function(n, s, i) {
            this.$menu = n, this.opts = s, this.conf = i, this.vars = {}, "function" == typeof this.___deprecated && this.___deprecated(), this._initMenu(), this._initAnchors(), this._initEvents();
            var a = this.$menu.children(this.conf.panelNodetype);
            for (var o in e[t].addons) e[t].addons[o]._add.call(this), e[t].addons[o]._add = function() {}, e[t].addons[o]._setup.call(this);
            return this._init(a), "function" == typeof this.___debug && this.___debug(), this
        }, e[t].version = s, e[t].addons = {}, e[t].uniqueId = 0, e[t].defaults = {
            classes: "",
            slidingSubmenus: !0,
            onClick: {
                setSelected: !0
            }
        }, e[t].configuration = {
            panelNodetype: "ul, ol, div",
            transitionDuration: 400,
            openingInterval: 25,
            classNames: {
                panel: "Panel",
                selected: "Selected",
                label: "Label",
                spacer: "Spacer"
            }
        }, e[t].prototype = {
            _init: function(n) {
                n = n.not("." + i.nopanel), n = this._initPanels(n);
                for (var s in e[t].addons) e[t].addons[s]._init.call(this, n);
                this._update()
            },
            _initMenu: function() {
                this.opts.offCanvas && this.conf.clone && (this.$menu = this.$menu.clone(!0), this.$menu.add(this.$menu.find("*")).filter("[id]").each(function() {
                    e(this).attr("id", i.mm(e(this).attr("id")))
                })), this.$menu.contents().each(function() {
                    3 == e(this)[0].nodeType && e(this).remove()
                }), this.$menu.parent().addClass(i.wrapper);
                var n = [i.menu];
                n.push(i.mm(this.opts.slidingSubmenus ? "horizontal" : "vertical")), this.opts.classes && n.push(this.opts.classes), this.$menu.addClass(n.join(" "))
            },
            _initPanels: function(n) {
                var t = this;
                this.__findAddBack(n, "ul, ol").not("." + i.nolist).addClass(i.list);
                var s = this.__findAddBack(n, "." + i.list).find("> li");
                this.__refactorClass(s, this.conf.classNames.selected, "selected"), this.__refactorClass(s, this.conf.classNames.label, "label"), this.__refactorClass(s, this.conf.classNames.spacer, "spacer"), s.off(o.setSelected).on(o.setSelected, function(n, t) {
                    n.stopPropagation(), s.removeClass(i.selected), "boolean" != typeof t && (t = !0), t && e(this).addClass(i.selected)
                }), this.__refactorClass(this.__findAddBack(n, "." + this.conf.classNames.panel), this.conf.classNames.panel, "panel"), n.add(this.__findAddBack(n, "." + i.list).children().children().filter(this.conf.panelNodetype).not("." + i.nopanel)).addClass(i.panel);
                var l = this.__findAddBack(n, "." + i.panel),
                    d = e("." + i.panel, this.$menu);
                if (l.each(function() {
                        var n = e(this),
                            s = n.attr("id") || t.__getUniqueId();
                        n.attr("id", s)
                    }), l.each(function() {
                        var n = e(this),
                            s = n.is("ul, ol") ? n : n.find("ul ,ol").first(),
                            o = n.parent(),
                            l = o.children("a, span"),
                            d = o.closest("." + i.panel);
                        if (o.parent().is("." + i.list) && !n.data(a.parent)) {
                            n.data(a.parent, o);
                            var r = e('<a class="' + i.subopen + '" href="#' + n.attr("id") + '" />').insertBefore(l);
                            l.is("a") || r.addClass(i.fullsubopen), t.opts.slidingSubmenus && s.prepend('<li class="' + i.subtitle + '"><a class="' + i.subclose + '" href="#' + d.attr("id") + '">' + l.text() + "</a></li>")
                        }
                    }), this.opts.slidingSubmenus) {
                    var r = this.__findAddBack(n, "." + i.list).find("> li." + i.selected);
                    r.parents("li").removeClass(i.selected).end().add(r.parents("li")).each(function() {
                        var n = e(this),
                            t = n.find("> ." + i.panel);
                        t.length && (n.parents("." + i.panel).addClass(i.subopened), t.addClass(i.opened))
                    }).closest("." + i.panel).addClass(i.opened).parents("." + i.panel).addClass(i.subopened)
                } else {
                    var r = e("li." + i.selected, d);
                    r.parents("li").removeClass(i.selected).end().add(r.parents("li")).addClass(i.opened)
                }
                var u = d.filter("." + i.opened);
                return u.length || (u = l.first()), u.addClass(i.opened).last().addClass(i.current), this.opts.slidingSubmenus && l.not(u.last()).addClass(i.hidden).end().appendTo(this.$menu), l
            },
            _initAnchors: function() {
                var n = this;
                d.$body.on(o.click, "a", function(s) {
                    var a = e(this),
                        l = !1,
                        r = n.$menu.find(a).length;
                    for (var u in e[t].addons)
                        if (e[t].addons[u]._clickAnchor && (l = e[t].addons[u]._clickAnchor.call(n, a, r))) break;
                    if (!l && r) {
                        var c = a.attr("href") || "";
                        if ("#" == c.slice(0, 1)) try {
                            e(c, n.$menu).is("." + i.panel) && (l = !0, e(c).trigger(n.opts.slidingSubmenus ? o.open : o.toggle))
                        } catch (p) {}
                    }
                    if (l && s.preventDefault(), !l && r && a.is("." + i.list + " > li > a") && !a.is('[rel="external"]') && !a.is('[target="_blank"]')) {
                        n.__valueOrFn(n.opts.onClick.setSelected, a) && a.parent().trigger(o.setSelected);
                        var h = n.__valueOrFn(n.opts.onClick.preventDefault, a, "#" == c.slice(0, 1));
                        h && s.preventDefault(), n.__valueOrFn(n.opts.onClick.blockUI, a, !h) && d.$html.addClass(i.blocking), n.__valueOrFn(n.opts.onClick.close, a, h) && n.$menu.trigger(o.close)
                    }
                })
            },
            _initEvents: function() {
                var n = this;
                this.$menu.on(o.toggle + " " + o.open + " " + o.close, "." + i.panel, function(e) {
                    e.stopPropagation()
                }), this.opts.slidingSubmenus ? this.$menu.on(o.open, "." + i.panel, function() {
                    return n._openSubmenuHorizontal(e(this))
                }) : this.$menu.on(o.toggle, "." + i.panel, function() {
                    var n = e(this);
                    n.trigger(n.parent().hasClass(i.opened) ? o.close : o.open)
                }).on(o.open, "." + i.panel, function() {
                    e(this).parent().addClass(i.opened)
                }).on(o.close, "." + i.panel, function() {
                    e(this).parent().removeClass(i.opened)
                })
            },
            _openSubmenuHorizontal: function(n) {
                if (n.hasClass(i.current)) return !1;
                var t = e("." + i.panel, this.$menu),
                    s = t.filter("." + i.current);
                return t.removeClass(i.highest).removeClass(i.current).not(n).not(s).addClass(i.hidden), n.hasClass(i.opened) ? s.addClass(i.highest).removeClass(i.opened).removeClass(i.subopened) : (n.addClass(i.highest), s.addClass(i.subopened)), n.removeClass(i.hidden).addClass(i.current), setTimeout(function() {
                    n.removeClass(i.subopened).addClass(i.opened)
                }, this.conf.openingInterval), "open"
            },
            _update: function(e) {
                if (this.updates || (this.updates = []), "function" == typeof e) this.updates.push(e);
                else
                    for (var n = 0, t = this.updates.length; t > n; n++) this.updates[n].call(this, e)
            },
            __valueOrFn: function(e, n, t) {
                return "function" == typeof e ? e.call(n[0]) : "undefined" == typeof e && "undefined" != typeof t ? t : e
            },
            __refactorClass: function(e, n, t) {
                return e.filter("." + n).removeClass(n).addClass(i[t])
            },
            __findAddBack: function(e, n) {
                return e.find(n).add(e.filter(n))
            },
            __transitionend: function(e, n, t) {
                var s = !1,
                    i = function() {
                        s || n.call(e[0]), s = !0
                    };
                e.one(o.transitionend, i), e.one(o.webkitTransitionEnd, i), setTimeout(i, 1.1 * t)
            },
            __getUniqueId: function() {
                return i.mm(e[t].uniqueId++)
            }
        }, e.fn[t] = function(s, i) {
            return l || n(), s = e.extend(!0, {}, e[t].defaults, s), i = e.extend(!0, {}, e[t].configuration, i), this.each(function() {
                var n = e(this);
                n.data(t) || n.data(t, new e[t](n, s, i))
            })
        }, e[t].support = {
            touch: "ontouchstart" in window || navigator.msMaxTouchPoints
        }
    }
}(jQuery);
/*	
 * jQuery mmenu offCanvas addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(e) {
    var t = "mmenu",
        o = "offCanvas";
    e[t].addons[o] = {
        _init: function() {},
        _setup: function() {
            if (this.opts[o]) {
                var t = this,
                    s = this.opts[o],
                    p = this.conf[o];
                "string" != typeof p.pageSelector && (p.pageSelector = "> " + p.pageNodetype), a.$allMenus = (a.$allMenus || e()).add(this.$menu), this.vars.opened = !1;
                var r = [n.offcanvas];
                "left" != s.position && r.push(n.mm(s.position)), "back" != s.zposition && r.push(n.mm(s.zposition)), this.$menu.addClass(r.join(" ")).parent().removeClass(n.wrapper), this.setPage(a.$page), this[o + "_initBlocker"](), this[o + "_initWindow"](), this.$menu.on(i.open + " " + i.opening + " " + i.opened + " " + i.close + " " + i.closing + " " + i.closed + " " + i.setPage, function(e) {
                    e.stopPropagation()
                }).on(i.open + " " + i.close + " " + i.setPage, function(e) {
                    t[e.type]()
                }), this.$menu[p.menuInjectMethod + "To"](p.menuWrapperSelector)
            }
        },
        _add: function() {
            n = e[t]._c, s = e[t]._d, i = e[t]._e, n.add("offcanvas slideout modal background opening blocker page"), s.add("style"), i.add("opening opened closing closed setPage"), a = e[t].glbl
        },
        _clickAnchor: function(e) {
            if (!this.opts[o]) return !1;
            var t = this.$menu.attr("id");
            if (t && t.length && (this.conf.clone && (t = n.umm(t)), e.is('[href="#' + t + '"]'))) return this.open(), !0;
            if (a.$page) {
                var t = a.$page.attr("id");
                return t && t.length && e.is('[href="#' + t + '"]') ? (this.close(), !0) : !1
            }
        }
    }, e[t].defaults[o] = {
        position: "left",
        zposition: "back",
        modal: !1,
        moveBackground: !0
    }, e[t].configuration[o] = {
        pageNodetype: "div",
        pageSelector: null,
        menuWrapperSelector: "body",
        menuInjectMethod: "prepend"
    }, e[t].prototype.open = function() {
        if (this.vars.opened) return !1;
        var e = this;
        return this._openSetup(), setTimeout(function() {
            e._openFinish()
        }, this.conf.openingInterval), "open"
    }, e[t].prototype._openSetup = function() {
        var e = this;
        a.$allMenus.not(this.$menu).trigger(i.close), a.$page.data(s.style, a.$page.attr("style") || ""), a.$wndw.trigger(i.resize, [!0]);
        var t = [n.opened];
        this.opts[o].modal && t.push(n.modal), this.opts[o].moveBackground && t.push(n.background), "left" != this.opts[o].position && t.push(n.mm(this.opts[o].position)), "back" != this.opts[o].zposition && t.push(n.mm(this.opts[o].zposition)), this.opts.classes && t.push(this.opts.classes), a.$html.addClass(t.join(" ")), setTimeout(function() {
            e.vars.opened = !0
        }, this.conf.openingInterval), this.$menu.addClass(n.current + " " + n.opened)
    }, e[t].prototype._openFinish = function() {
        var e = this;
        this.__transitionend(a.$page, function() {
            e.$menu.trigger(i.opened)
        }, this.conf.transitionDuration), a.$html.addClass(n.opening), this.$menu.trigger(i.opening)
    }, e[t].prototype.close = function() {
        if (!this.vars.opened) return !1;
        var e = this;
        return this.__transitionend(a.$page, function() {
            e.$menu.removeClass(n.current).removeClass(n.opened), a.$html.removeClass(n.opened).removeClass(n.modal).removeClass(n.background).removeClass(n.mm(e.opts[o].position)).removeClass(n.mm(e.opts[o].zposition)), e.opts.classes && a.$html.removeClass(e.opts.classes), a.$page.attr("style", a.$page.data(s.style)), e.vars.opened = !1, e.$menu.trigger(i.closed)
        }, this.conf.transitionDuration), a.$html.removeClass(n.opening), this.$menu.trigger(i.closing), "close"
    }, e[t].prototype.setPage = function(t) {
        t || (t = e(this.conf[o].pageSelector, a.$body), t.length > 1 && (t = t.wrapAll("<" + this.conf[o].pageNodetype + " />").parent())), t.addClass(n.page + " " + n.slideout), a.$page = t
    }, e[t].prototype[o + "_initWindow"] = function() {
        a.$wndw.on(i.keydown, function(e) {
            return a.$html.hasClass(n.opened) && 9 == e.keyCode ? (e.preventDefault(), !1) : void 0
        });
        var s = 0;
        a.$wndw.on(i.resize, function(e, t) {
            if (t || a.$html.hasClass(n.opened)) {
                var o = a.$wndw.height();
                (t || o != s) && (s = o, a.$page.css("minHeight", o))
            }
        }), e[t].prototype[o + "_initWindow"] = function() {}
    }, e[t].prototype[o + "_initBlocker"] = function() {
        var s = e('<div id="' + n.blocker + '" class="' + n.slideout + '" />').appendTo(a.$body);
        s.on(i.touchstart, function(e) {
            e.preventDefault(), e.stopPropagation(), s.trigger(i.mousedown)
        }).on(i.mousedown, function(e) {
            e.preventDefault(), a.$html.hasClass(n.modal) || a.$allMenus.trigger(i.close)
        }), e[t].prototype[o + "_initBlocker"] = function() {}
    };
    var n, s, i, a
}(jQuery);
/*	
 * jQuery mmenu buttonbars addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(t) {
    var n = "mmenu",
        a = "buttonbars";
    t[n].addons[a] = {
        _init: function(n) {
            this.opts[a], this.conf[a], this.__refactorClass(t("div", n), this.conf.classNames[a].buttonbar, "buttonbar"), t("." + i.buttonbar, n).each(function() {
                var n = t(this),
                    a = n.children().not("input"),
                    o = n.children().filter("input");
                n.addClass(i.buttonbar + "-" + a.length), o.each(function() {
                    var n = t(this),
                        i = a.filter('label[for="' + n.attr("id") + '"]');
                    i.length && n.insertBefore(i)
                })
            })
        },
        _setup: function() {},
        _add: function() {
            i = t[n]._c, o = t[n]._d, r = t[n]._e, i.add("buttonbar"), s = t[n].glbl
        }
    }, t[n].defaults[a] = {}, t[n].configuration.classNames[a] = {
        buttonbar: "Buttonbar"
    };
    var i, o, r, s
}(jQuery);
/*	
 * jQuery mmenu counters addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(t) {
    var e = "mmenu",
        n = "counters";
    t[e].addons[n] = {
        _init: function(e) {
            var s = this,
                d = this.opts[n];
            this.conf[n], this.__refactorClass(t("em", e), this.conf.classNames[n].counter, "counter"), d.add && e.each(function() {
                var e = t(this).data(o.parent);
                e && (e.find("> em." + a.counter).length || e.prepend(t('<em class="' + a.counter + '" />')))
            }), d.update && e.each(function() {
                var e = t(this),
                    n = e.data(o.parent);
                if (n) {
                    var d = n.find("> em." + a.counter);
                    d.length && (e.is("." + a.list) || (e = e.find("> ." + a.list)), e.length && !e.data(o.updatecounter) && (e.data(o.updatecounter, !0), s._update(function() {
                        var t = e.children().not("." + a.label).not("." + a.subtitle).not("." + a.hidden).not("." + a.search).not("." + a.noresultsmsg);
                        d.html(t.length)
                    })))
                }
            })
        },
        _setup: function() {
            var a = this.opts[n];
            "boolean" == typeof a && (a = {
                add: a,
                update: a
            }), "object" != typeof a && (a = {}), a = t.extend(!0, {}, t[e].defaults[n], a), this.opts[n] = a
        },
        _add: function() {
            a = t[e]._c, o = t[e]._d, s = t[e]._e, a.add("counter search noresultsmsg"), o.add("updatecounter"), d = t[e].glbl
        }
    }, t[e].defaults[n] = {
        add: !1,
        update: !1
    }, t[e].configuration.classNames[n] = {
        counter: "Counter"
    };
    var a, o, s, d
}(jQuery);
/*	
 * jQuery mmenu dragOpen addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(e) {
    function t(e, t, n) {
        return t > e && (e = t), e > n && (e = n), e
    }
    var n = "mmenu",
        o = "dragOpen";
    e[n].addons[o] = {
        _init: function() {},
        _setup: function() {
            if (this.opts.offCanvas) {
                var s = this,
                    p = this.opts[o],
                    d = this.conf[o];
                if ("boolean" == typeof p && (p = {
                        open: p
                    }), "object" != typeof p && (p = {}), p = e.extend(!0, {}, e[n].defaults[o], p), p.open) {
                    if (Hammer.VERSION < 2) return;
                    var f, c, h, m, u = {},
                        g = 0,
                        l = !1,
                        v = !1,
                        _ = 0,
                        w = 0;
                    switch (this.opts.offCanvas.position) {
                        case "left":
                        case "right":
                            u.events = "panleft panright", u.typeLower = "x", u.typeUpper = "X", v = "width";
                            break;
                        case "top":
                        case "bottom":
                            u.events = "panup pandown", u.typeLower = "y", u.typeUpper = "Y", v = "height"
                    }
                    switch (this.opts.offCanvas.position) {
                        case "left":
                        case "top":
                            u.negative = !1;
                            break;
                        case "right":
                        case "bottom":
                            u.negative = !0
                    }
                    switch (this.opts.offCanvas.position) {
                        case "left":
                            u.open_dir = "right", u.close_dir = "left";
                            break;
                        case "right":
                            u.open_dir = "left", u.close_dir = "right";
                            break;
                        case "top":
                            u.open_dir = "down", u.close_dir = "up";
                            break;
                        case "bottom":
                            u.open_dir = "up", u.close_dir = "down"
                    }
                    var b = this.__valueOrFn(p.pageNode, this.$menu, r.$page);
                    "string" == typeof b && (b = e(b));
                    var y = r.$page;
                    switch (this.opts.offCanvas.zposition) {
                        case "front":
                            y = this.$menu;
                            break;
                        case "next":
                            y = y.add(this.$menu)
                    }
                    var $ = new Hammer(b[0], p.vendors.hammer);
                    $.on("panstart", function(e) {
                        switch (m = e.center[u.typeLower], s.opts.offCanvas.position) {
                            case "right":
                            case "bottom":
                                m >= r.$wndw[v]() - p.maxStartPos && (g = 1);
                                break;
                            default:
                                m <= p.maxStartPos && (g = 1)
                        }
                        l = u.open_dir
                    }).on(u.events + " panend", function(e) {
                        g > 0 && e.preventDefault()
                    }).on(u.events, function(e) {
                        if (f = e["delta" + u.typeUpper], u.negative && (f = -f), f != _ && (l = f >= _ ? u.open_dir : u.close_dir), _ = f, _ > p.threshold && 1 == g) {
                            if (r.$html.hasClass(a.opened)) return;
                            g = 2, s._openSetup(), s.$menu.trigger(i.opening), r.$html.addClass(a.dragging), w = t(r.$wndw[v]() * d[v].perc, d[v].min, d[v].max)
                        }
                        2 == g && (c = t(_, 10, w) - ("front" == s.opts.offCanvas.zposition ? w : 0), u.negative && (c = -c), h = "translate" + u.typeUpper + "(" + c + "px )", y.css({
                            "-webkit-transform": "-webkit-" + h,
                            transform: h
                        }))
                    }).on("panend", function() {
                        2 == g && (r.$html.removeClass(a.dragging), y.css("transform", ""), s[l == u.open_dir ? "_openFinish" : "close"]()), g = 0
                    })
                }
            }
        },
        _add: function() {
            return "function" != typeof Hammer ? (e[n].addons[o]._init = function() {}, e[n].addons[o]._setup = function() {}, void 0) : (a = e[n]._c, s = e[n]._d, i = e[n]._e, a.add("dragging"), r = e[n].glbl, void 0)
        }
    }, e[n].defaults[o] = {
        open: !1,
        maxStartPos: 100,
        threshold: 50,
        vendors: {
            hammer: {}
        }
    }, e[n].configuration[o] = {
        width: {
            perc: .8,
            min: 140,
            max: 440
        },
        height: {
            perc: .8,
            min: 140,
            max: 880
        }
    };
    var a, s, i, r
}(jQuery);
/*	
 * jQuery mmenu fixedElements addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(o) {
    var t = "mmenu",
        d = "fixedElements";
    o[t].addons[d] = {
        _init: function() {
            if (this.opts.offCanvas) {
                var o = this.conf.classNames[d].fixedTop,
                    t = this.conf.classNames[d].fixedBottom,
                    e = this.__refactorClass(a.$page.find("." + o), o, "fixed-top"),
                    s = this.__refactorClass(a.$page.find("." + t), t, "fixed-bottom");
                e.add(s).appendTo(a.$body).addClass(i.slideout)
            }
        },
        _setup: function() {},
        _add: function() {
            i = o[t]._c, e = o[t]._d, s = o[t]._e, i.add("fixed-top fixed-bottom"), a = o[t].glbl
        }
    }, o[t].defaults[d] = {}, o[t].configuration.classNames[d] = {
        fixedTop: "FixedTop",
        fixedBottom: "FixedBottom"
    };
    var i, e, s, a
}(jQuery);
/*	
 * jQuery mmenu footer addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(t) {
    var o = "mmenu",
        e = "footer";
    t[o].addons[e] = {
        _init: function(a) {
            var d = this,
                i = this.opts[e],
                r = t("div." + n.footer, this.$menu);
            r.length && (i.update && a.each(function() {
                var o = t(this),
                    a = t("." + d.conf.classNames[e].panelFooter, o),
                    u = a.html();
                u || (u = i.title);
                var l = function() {
                    r[u ? "show" : "hide"](), r.html(u)
                };
                o.on(s.open, l), o.hasClass(n.current) && l()
            }), t[o].addons.buttonbars && t[o].addons.buttonbars._init.call(this, r))
        },
        _setup: function() {
            var a = this.opts[e];
            if ("boolean" == typeof a && (a = {
                    add: a,
                    update: a
                }), "object" != typeof a && (a = {}), a = t.extend(!0, {}, t[o].defaults[e], a), this.opts[e] = a, a.add) {
                var s = a.content ? a.content : a.title;
                t('<div class="' + n.footer + '" />').appendTo(this.$menu).append(s), this.$menu.addClass(n.hasfooter)
            }
        },
        _add: function() {
            n = t[o]._c, a = t[o]._d, s = t[o]._e, n.add("footer hasfooter"), d = t[o].glbl
        }
    }, t[o].defaults[e] = {
        add: !1,
        content: !1,
        title: "",
        update: !1
    }, t[o].configuration.classNames[e] = {
        panelFooter: "Footer"
    };
    var n, a, s, d
}(jQuery);
/*	
 * jQuery mmenu header addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(e) {
    var t = "mmenu",
        a = "header";
    e[t].addons[a] = {
        _init: function(s) {
            var i = this,
                o = this.opts[a],
                l = (this.conf[a], e("." + n.header, this.$menu));
            if (l.length) {
                if (o.update) {
                    var h = l.find("." + n.title),
                        c = l.find("." + n.prev),
                        f = l.find("." + n.next),
                        p = l.find("." + n.close),
                        u = !1;
                    r.$page && (u = "#" + r.$page.attr("id"), p.attr("href", u)), s.each(function() {
                        var t = e(this),
                            s = t.find("." + i.conf.classNames[a].panelHeader),
                            r = t.find("." + i.conf.classNames[a].panelPrev),
                            l = t.find("." + i.conf.classNames[a].panelNext),
                            p = s.html(),
                            u = r.attr("href"),
                            v = l.attr("href"),
                            m = r.html(),
                            b = l.html();
                        p || (p = t.find("." + n.subclose).html()), p || (p = o.title), u || (u = t.find("." + n.subclose).attr("href"));
                        var x = function() {
                            h[p ? "show" : "hide"](), h.html(p), c[u ? "attr" : "removeAttr"]("href", u), c[u || m ? "show" : "hide"](), c.html(m), f[v ? "attr" : "removeAttr"]("href", v), f[v || b ? "show" : "hide"](), f.html(b)
                        };
                        t.on(d.open, x), t.hasClass(n.current) && x()
                    })
                }
                e[t].addons.buttonbars && e[t].addons.buttonbars._init.call(this, l)
            }
        },
        _setup: function() {
            var s = this.opts[a];
            if (this.conf[a], "boolean" == typeof s && (s = {
                    add: s,
                    update: s
                }), "object" != typeof s && (s = {}), "undefined" == typeof s.content && (s.content = ["prev", "title", "next"]), s = e.extend(!0, {}, e[t].defaults[a], s), this.opts[a] = s, s.add) {
                if (s.content instanceof Array) {
                    for (var d = e("<div />"), r = 0, i = s.content.length; i > r; r++) switch (s.content[r]) {
                        case "prev":
                        case "next":
                        case "close":
                            d.append('<a class="' + n[s.content[r]] + '" href="#"></a>');
                            break;
                        case "title":
                            d.append('<span class="' + n.title + '"></span>');
                            break;
                        default:
                            d.append(s.content[r])
                    }
                    d = d.html()
                } else var d = s.content;
                e('<div class="' + n.header + '" />').prependTo(this.$menu).append(d), this.$menu.addClass(n.hasheader)
            }
        },
        _add: function() {
            n = e[t]._c, s = e[t]._d, d = e[t]._e, n.add("header hasheader prev next close title"), r = e[t].glbl
        }
    }, e[t].defaults[a] = {
        add: !1,
        title: "Menu",
        update: !1
    }, e[t].configuration.classNames[a] = {
        panelHeader: "Header",
        panelNext: "Next",
        panelPrev: "Prev"
    };
    var n, s, d, r
}(jQuery);
/*	
 * jQuery mmenu labels addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(l) {
    var e = "mmenu",
        s = "labels";
    l[e].addons[s] = {
        _init: function(e) {
            var n = this.opts[s];
            this.__refactorClass(l("li", this.$menu), this.conf.classNames[s].collapsed, "collapsed"), n.collapse && l("." + a.label, e).each(function() {
                var e = l(this),
                    s = e.nextUntil("." + a.label, "." + a.collapsed);
                s.length && (e.children("." + a.subopen).length || (e.wrapInner("<span />"), e.prepend('<a href="#" class="' + a.subopen + " " + a.fullsubopen + '" />')))
            })
        },
        _setup: function() {
            var a = this.opts[s];
            "boolean" == typeof a && (a = {
                collapse: a
            }), "object" != typeof a && (a = {}), a = l.extend(!0, {}, l[e].defaults[s], a), this.opts[s] = a
        },
        _add: function() {
            a = l[e]._c, n = l[e]._d, o = l[e]._e, a.add("collapsed uncollapsed"), t = l[e].glbl
        },
        _clickAnchor: function(l, e) {
            if (e) {
                var s = l.parent();
                if (s.is("." + a.label)) {
                    var n = s.nextUntil("." + a.label, "." + a.collapsed);
                    return s.toggleClass(a.opened), n[s.hasClass(a.opened) ? "addClass" : "removeClass"](a.uncollapsed), !0
                }
            }
            return !1
        }
    }, l[e].defaults[s] = {
        collapse: !1
    }, l[e].configuration.classNames[s] = {
        collapsed: "Collapsed"
    };
    var a, n, o, t
}(jQuery);
/*	
 * jQuery mmenu searchfield addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(e) {
    function s(e) {
        switch (e) {
            case 9:
            case 16:
            case 17:
            case 18:
            case 37:
            case 38:
            case 39:
            case 40:
                return !0
        }
        return !1
    }
    var n = "mmenu",
        t = "searchfield";
    e[n].addons[t] = {
        _init: function(n) {
            var i = this,
                l = this.opts[t],
                d = this.conf[t];
            if (l.add) {
                switch (l.addTo) {
                    case "menu":
                        var c = this.$menu;
                        break;
                    case "panels":
                        var c = n;
                        break;
                    default:
                        var c = e(l.addTo, this.$menu).filter("." + a.panel)
                }
                c.length && c.each(function() {
                    var s = e(this),
                        n = s.is("." + a.menu) ? d.form ? "form" : "div" : "li";
                    if (!s.children(n + "." + a.search).length) {
                        if (s.is("." + a.menu)) var t = i.$menu,
                            r = "prependTo";
                        else var t = s.children().first(),
                            r = t.is("." + a.subtitle) ? "insertAfter" : "insertBefore";
                        var o = e("<" + n + ' class="' + a.search + '" />');
                        if ("form" == n && "object" == typeof d.form)
                            for (var c in d.form) o.attr(c, d.form[c]);
                        o.append('<input placeholder="' + l.placeholder + '" type="text" autocomplete="off" />'), o[r](t)
                    }
                    l.noResults && (s.is("." + a.menu) && (s = s.children("." + a.panel).first()), n = s.is("." + a.list) ? "li" : "div", s.children(n + "." + a.noresultsmsg).length || e("<" + n + ' class="' + a.noresultsmsg + '" />').html(l.noResults).appendTo(s))
                })
            }
            if (this.$menu.children("." + a.search).length && this.$menu.addClass(a.hassearch), l.search) {
                var h = e("." + a.search, this.$menu);
                h.length && h.each(function() {
                    var n = e(this);
                    if ("menu" == l.addTo) var t = e("." + a.panel, i.$menu),
                        d = i.$menu;
                    else var t = n.closest("." + a.panel),
                        d = t;
                    var c = n.children("input"),
                        h = i.__findAddBack(t, "." + a.list).children("li"),
                        u = h.filter("." + a.label),
                        f = h.not("." + a.subtitle).not("." + a.label).not("." + a.search).not("." + a.noresultsmsg),
                        p = "> a";
                    l.showLinksOnly || (p += ", > span"), c.off(o.keyup + " " + o.change).on(o.keyup, function(e) {
                        s(e.keyCode) || n.trigger(o.search)
                    }).on(o.change, function() {
                        n.trigger(o.search)
                    }), n.off(o.reset + " " + o.search).on(o.reset + " " + o.search, function(e) {
                        e.stopPropagation()
                    }).on(o.reset, function() {
                        n.trigger(o.search, [""])
                    }).on(o.search, function(s, n) {
                        "string" == typeof n ? c.val(n) : n = c.val(), n = n.toLowerCase(), t.scrollTop(0), f.add(u).addClass(a.hidden), f.each(function() {
                            var s = e(this);
                            e(p, s).text().toLowerCase().indexOf(n) > -1 && s.add(s.prevAll("." + a.label).first()).removeClass(a.hidden)
                        }), e(t.get().reverse()).each(function(s) {
                            var n = e(this),
                                t = n.data(r.parent);
                            if (t) {
                                var d = n.add(n.find("> ." + a.list)).find("> li").not("." + a.subtitle).not("." + a.search).not("." + a.noresultsmsg).not("." + a.label).not("." + a.hidden);
                                d.length ? t.removeClass(a.hidden).removeClass(a.nosubresults).prevAll("." + a.label).first().removeClass(a.hidden) : "menu" == l.addTo && (n.hasClass(a.opened) && setTimeout(function() {
                                    t.trigger(o.open)
                                }, 1.5 * (s + 1) * i.conf.openingInterval), t.addClass(a.nosubresults))
                            }
                        }), d[f.not("." + a.hidden).length ? "removeClass" : "addClass"](a.noresults), i._update()
                    })
                })
            }
        },
        _setup: function() {
            var s = this.opts[t];
            this.conf[t], "boolean" == typeof s && (s = {
                add: s,
                search: s
            }), "object" != typeof s && (s = {}), s = e.extend(!0, {}, e[n].defaults[t], s), "boolean" != typeof s.showLinksOnly && (s.showLinksOnly = "menu" == s.addTo), this.opts[t] = s
        },
        _add: function() {
            a = e[n]._c, r = e[n]._d, o = e[n]._e, a.add("search hassearch noresultsmsg noresults nosubresults"), o.add("search reset change"), i = e[n].glbl
        }
    }, e[n].defaults[t] = {
        add: !1,
        addTo: "menu",
        search: !1,
        placeholder: "Search",
        noResults: "No results found."
    }, e[n].configuration[t] = {
        form: !1
    };
    var a, r, o, i
}(jQuery);
/*	
 * jQuery mmenu toggles addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
! function(e) {
    var t = "mmenu",
        s = "toggles";
    e[t].addons[s] = {
        _init: function(t) {
            var a = this;
            this.opts[s], this.conf[s], this.__refactorClass(e("input", t), this.conf.classNames[s].toggle, "toggle"), this.__refactorClass(e("input", t), this.conf.classNames[s].check, "check"), e("input." + c.toggle + ", input." + c.check, t).each(function() {
                var t = e(this),
                    s = t.closest("li"),
                    l = t.hasClass(c.toggle) ? "toggle" : "check",
                    n = t.attr("id") || a.__getUniqueId();
                s.children('label[for="' + n + '"]').length || (t.attr("id", n), s.prepend(t), e('<label for="' + n + '" class="' + c[l] + '"></label>').insertBefore(s.children("a, span").last()))
            })
        },
        _setup: function() {},
        _add: function() {
            c = e[t]._c, a = e[t]._d, l = e[t]._e, c.add("toggle check"), n = e[t].glbl
        }
    }, e[t].defaults[s] = {}, e[t].configuration.classNames[s] = {
        toggle: "Toggle",
        check: "Check"
    };
    var c, a, l, n
}(jQuery);

jQuery(document).ready(function() {

  // Select-wrapper for select elements

  jQuery("select").wrap("<div class='select-wrapper'></div>");
  jQuery("select").after("<i class='fa fa-angle-down'></i>");

  jQuery("#advanced-search-list select").unwrap();
  jQuery("#region_id").unwrap();

  //Flexslider

  jQuery(window).load(function() {
    jQuery('.product-flexslider').flexslider({
      animation: "slide",
      slideshow: false,
      maxItems: 2,
      itemWidth: 50
    });
  });

  // Product page / wishlist - quantity increase/decrease
  jQuery(".quantity").append('<i id="add1" class="plus fa fa-plus" />').prepend('<i id="minus1" class="minus fa fa-minus" />');
  jQuery(".quantity .plus").click(function(){
    var currentVal = parseInt(jQuery(this).parent().find(".qty").val());
    if (!currentVal || currentVal=="" || currentVal == "NaN") currentVal = 0;
    jQuery(this).parent().find(".qty").val(currentVal + 1);
  });

  jQuery(".quantity .minus").click(function(){
    var currentVal = parseInt(jQuery(this).parent().find(".qty").val());
    if (currentVal == "NaN") currentVal = 0;
    if (currentVal > 1){
      jQuery(this).parent().find(".qty").val(currentVal - 1);
    }
  });

  //Grid / List view
  jQuery('.view-mode strong.grid').after('<i class="fa fa-th"></i>');
  jQuery('.view-mode strong.list').after('<i class="fa fa-align-justify"></i>');

  jQuery('.view-mode a.list').each(function() {
    if (jQuery(this).text() == 'List')
      jQuery(this).text('');
      jQuery(this).append('<i class="fa fa-align-justify"></i>');
    });

  jQuery('.view-mode a.grid').each(function() {
    if (jQuery(this).text() == 'Grid')
      jQuery(this).text('');
      jQuery(this).append('<i class="fa fa-th"></i>');
  });

  //Top cart
  jQuery(".top--cart").click(function(e) {
    e.stopPropagation();
    jQuery(this).toggleClass('active');
  });
  jQuery(document).click(function() {
    jQuery('.top--cart').removeClass('active');    
  });

  //Scroll to top

  jQuery('.footer-container').after('<div class="scrollToTop"></div>');
  jQuery('.scrollToTop').append('<i class="fa fa-chevron-circle-up fa-2x"></i>');
  jQuery(window).scroll(function(){
    if (jQuery(this).scrollTop() > 100) {
      jQuery('.scrollToTop').fadeIn();
    } else {
      jQuery('.scrollToTop').fadeOut();
    }
  });
  
  //Click event to scroll to top
  jQuery('.scrollToTop').click(function(){
    jQuery('html, body').animate({scrollTop : 0},800);
    return false;
  });


  // media query event handler
  if (matchMedia) {
    var mq = window.matchMedia("(min-width: 640px)");
    mq.addListener(WidthChange);
    WidthChange(mq);
  }

  // media query change
  function WidthChange(mq) {

    if (mq.matches) {
      // window width is at least 500px
        jQuery('.gallery-image.visible').elevateZoom();
        jQuery('.more-views').click(function(){
          jQuery('.gallery-image.visible').elevateZoom();
        })
    }
    else {
      // window width is less than 500px
       jQuery('.gallery-image.visible').elevateZoom({
          constrainType:"height",
          constrainSize:274,       
          zoomType: "lens",
          containLensZoom: true,
        cursor: "pointer",
        galleryActiveClass: "active",
        zoomWindowFadeIn: 500,
        zoomWindowFadeOut: 750
          });

        jQuery('.more-views').click(function(){
          jQuery('.gallery-image.visible').elevateZoom({
          constrainType:"height",
          constrainSize:274,       
          zoomType: "lens",
          containLensZoom: true,
        cursor: "pointer",
        galleryActiveClass: "active",
        zoomWindowFadeIn: 500,
        zoomWindowFadeOut: 750
          });
        })    
    }

  }

  // Jquery mmenu
  jQuery('.header').append('<a href="#menu" class="mmenu-btn"><i class="fa fa-align-justify fa-2x"></i></a>');

  jQuery(function() {
    jQuery('nav#menu').mmenu();
  });

});




//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVybml6ci5qcyIsImpxdWVyeS5mbGV4c2xpZGVyLmpzIiwiZWxldmF0ZVpvb20uanMiLCJqcXVlcnkubW1lbnUuanMiLCJzY3JpcHRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzkzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOXpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InNjcmlwdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogTW9kZXJuaXpyIHYyLjguM1xuICogd3d3Lm1vZGVybml6ci5jb21cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEZhcnVrIEF0ZXMsIFBhdWwgSXJpc2gsIEFsZXggU2V4dG9uXG4gKiBBdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBhbmQgTUlUIGxpY2Vuc2VzOiB3d3cubW9kZXJuaXpyLmNvbS9saWNlbnNlL1xuICovXG5cbi8qXG4gKiBNb2Rlcm5penIgdGVzdHMgd2hpY2ggbmF0aXZlIENTUzMgYW5kIEhUTUw1IGZlYXR1cmVzIGFyZSBhdmFpbGFibGUgaW5cbiAqIHRoZSBjdXJyZW50IFVBIGFuZCBtYWtlcyB0aGUgcmVzdWx0cyBhdmFpbGFibGUgdG8geW91IGluIHR3byB3YXlzOlxuICogYXMgcHJvcGVydGllcyBvbiBhIGdsb2JhbCBNb2Rlcm5penIgb2JqZWN0LCBhbmQgYXMgY2xhc3NlcyBvbiB0aGVcbiAqIDxodG1sPiBlbGVtZW50LiBUaGlzIGluZm9ybWF0aW9uIGFsbG93cyB5b3UgdG8gcHJvZ3Jlc3NpdmVseSBlbmhhbmNlXG4gKiB5b3VyIHBhZ2VzIHdpdGggYSBncmFudWxhciBsZXZlbCBvZiBjb250cm9sIG92ZXIgdGhlIGV4cGVyaWVuY2UuXG4gKlxuICogTW9kZXJuaXpyIGhhcyBhbiBvcHRpb25hbCAobm90IGluY2x1ZGVkKSBjb25kaXRpb25hbCByZXNvdXJjZSBsb2FkZXJcbiAqIGNhbGxlZCBNb2Rlcm5penIubG9hZCgpLCBiYXNlZCBvbiBZZXBub3BlLmpzICh5ZXBub3BlanMuY29tKS5cbiAqIFRvIGdldCBhIGJ1aWxkIHRoYXQgaW5jbHVkZXMgTW9kZXJuaXpyLmxvYWQoKSwgYXMgd2VsbCBhcyBjaG9vc2luZ1xuICogd2hpY2ggdGVzdHMgdG8gaW5jbHVkZSwgZ28gdG8gd3d3Lm1vZGVybml6ci5jb20vZG93bmxvYWQvXG4gKlxuICogQXV0aG9ycyAgICAgICAgRmFydWsgQXRlcywgUGF1bCBJcmlzaCwgQWxleCBTZXh0b25cbiAqIENvbnRyaWJ1dG9ycyAgIFJ5YW4gU2VkZG9uLCBCZW4gQWxtYW5cbiAqL1xuXG53aW5kb3cuTW9kZXJuaXpyID0gKGZ1bmN0aW9uKCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQgKSB7XG5cbiAgICB2YXIgdmVyc2lvbiA9ICcyLjguMycsXG5cbiAgICBNb2Rlcm5penIgPSB7fSxcblxuICAgIC8qPj5jc3NjbGFzc2VzKi9cbiAgICAvLyBvcHRpb24gZm9yIGVuYWJsaW5nIHRoZSBIVE1MIGNsYXNzZXMgdG8gYmUgYWRkZWRcbiAgICBlbmFibGVDbGFzc2VzID0gdHJ1ZSxcbiAgICAvKj4+Y3NzY2xhc3NlcyovXG5cbiAgICBkb2NFbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG91ciBcIm1vZGVybml6clwiIGVsZW1lbnQgdGhhdCB3ZSBkbyBtb3N0IGZlYXR1cmUgdGVzdHMgb24uXG4gICAgICovXG4gICAgbW9kID0gJ21vZGVybml6cicsXG4gICAgbW9kRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobW9kKSxcbiAgICBtU3R5bGUgPSBtb2RFbGVtLnN0eWxlLFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSBpbnB1dCBlbGVtZW50IGZvciB2YXJpb3VzIFdlYiBGb3JtcyBmZWF0dXJlIHRlc3RzLlxuICAgICAqL1xuICAgIGlucHV0RWxlbSAvKj4+aW5wdXRlbGVtKi8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpIC8qPj5pbnB1dGVsZW0qLyAsXG5cbiAgICAvKj4+c21pbGUqL1xuICAgIHNtaWxlID0gJzopJyxcbiAgICAvKj4+c21pbGUqL1xuXG4gICAgdG9TdHJpbmcgPSB7fS50b1N0cmluZyxcblxuICAgIC8vIFRPRE8gOjogbWFrZSB0aGUgcHJlZml4ZXMgbW9yZSBncmFudWxhclxuICAgIC8qPj5wcmVmaXhlcyovXG4gICAgLy8gTGlzdCBvZiBwcm9wZXJ0eSB2YWx1ZXMgdG8gc2V0IGZvciBjc3MgdGVzdHMuIFNlZSB0aWNrZXQgIzIxXG4gICAgcHJlZml4ZXMgPSAnIC13ZWJraXQtIC1tb3otIC1vLSAtbXMtICcuc3BsaXQoJyAnKSxcbiAgICAvKj4+cHJlZml4ZXMqL1xuXG4gICAgLyo+PmRvbXByZWZpeGVzKi9cbiAgICAvLyBGb2xsb3dpbmcgc3BlYyBpcyB0byBleHBvc2UgdmVuZG9yLXNwZWNpZmljIHN0eWxlIHByb3BlcnRpZXMgYXM6XG4gICAgLy8gICBlbGVtLnN0eWxlLldlYmtpdEJvcmRlclJhZGl1c1xuICAgIC8vIGFuZCB0aGUgZm9sbG93aW5nIHdvdWxkIGJlIGluY29ycmVjdDpcbiAgICAvLyAgIGVsZW0uc3R5bGUud2Via2l0Qm9yZGVyUmFkaXVzXG5cbiAgICAvLyBXZWJraXQgZ2hvc3RzIHRoZWlyIHByb3BlcnRpZXMgaW4gbG93ZXJjYXNlIGJ1dCBPcGVyYSAmIE1veiBkbyBub3QuXG4gICAgLy8gTWljcm9zb2Z0IHVzZXMgYSBsb3dlcmNhc2UgYG1zYCBpbnN0ZWFkIG9mIHRoZSBjb3JyZWN0IGBNc2AgaW4gSUU4K1xuICAgIC8vICAgZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDgvMDMvMTAvMjEuNDguMTAvXG5cbiAgICAvLyBNb3JlIGhlcmU6IGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvaXNzdWUvMjFcbiAgICBvbVByZWZpeGVzID0gJ1dlYmtpdCBNb3ogTyBtcycsXG5cbiAgICBjc3NvbVByZWZpeGVzID0gb21QcmVmaXhlcy5zcGxpdCgnICcpLFxuXG4gICAgZG9tUHJlZml4ZXMgPSBvbVByZWZpeGVzLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKSxcbiAgICAvKj4+ZG9tcHJlZml4ZXMqL1xuXG4gICAgLyo+Pm5zKi9cbiAgICBucyA9IHsnc3ZnJzogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ30sXG4gICAgLyo+Pm5zKi9cblxuICAgIHRlc3RzID0ge30sXG4gICAgaW5wdXRzID0ge30sXG4gICAgYXR0cnMgPSB7fSxcblxuICAgIGNsYXNzZXMgPSBbXSxcblxuICAgIHNsaWNlID0gY2xhc3Nlcy5zbGljZSxcblxuICAgIGZlYXR1cmVOYW1lLCAvLyB1c2VkIGluIHRlc3RpbmcgbG9vcFxuXG5cbiAgICAvKj4+dGVzdHN0eWxlcyovXG4gICAgLy8gSW5qZWN0IGVsZW1lbnQgd2l0aCBzdHlsZSBlbGVtZW50IGFuZCBzb21lIENTUyBydWxlc1xuICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzID0gZnVuY3Rpb24oIHJ1bGUsIGNhbGxiYWNrLCBub2RlcywgdGVzdG5hbWVzICkge1xuXG4gICAgICB2YXIgc3R5bGUsIHJldCwgbm9kZSwgZG9jT3ZlcmZsb3csXG4gICAgICAgICAgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgLy8gQWZ0ZXIgcGFnZSBsb2FkIGluamVjdGluZyBhIGZha2UgYm9keSBkb2Vzbid0IHdvcmsgc28gY2hlY2sgaWYgYm9keSBleGlzdHNcbiAgICAgICAgICBib2R5ID0gZG9jdW1lbnQuYm9keSxcbiAgICAgICAgICAvLyBJRTYgYW5kIDcgd29uJ3QgcmV0dXJuIG9mZnNldFdpZHRoIG9yIG9mZnNldEhlaWdodCB1bmxlc3MgaXQncyBpbiB0aGUgYm9keSBlbGVtZW50LCBzbyB3ZSBmYWtlIGl0LlxuICAgICAgICAgIGZha2VCb2R5ID0gYm9keSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5Jyk7XG5cbiAgICAgIGlmICggcGFyc2VJbnQobm9kZXMsIDEwKSApIHtcbiAgICAgICAgICAvLyBJbiBvcmRlciBub3QgdG8gZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMgd2UgY3JlYXRlIGEgbm9kZSBmb3IgZWFjaCB0ZXN0XG4gICAgICAgICAgLy8gVGhpcyBhbHNvIGFsbG93cyB0aGUgbWV0aG9kIHRvIHNjYWxlIGZvciB1bnNwZWNpZmllZCB1c2VzXG4gICAgICAgICAgd2hpbGUgKCBub2Rlcy0tICkge1xuICAgICAgICAgICAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgIG5vZGUuaWQgPSB0ZXN0bmFtZXMgPyB0ZXN0bmFtZXNbbm9kZXNdIDogbW9kICsgKG5vZGVzICsgMSk7XG4gICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIDxzdHlsZT4gZWxlbWVudHMgaW4gSUU2LTkgYXJlIGNvbnNpZGVyZWQgJ05vU2NvcGUnIGVsZW1lbnRzIGFuZCB0aGVyZWZvcmUgd2lsbCBiZSByZW1vdmVkXG4gICAgICAvLyB3aGVuIGluamVjdGVkIHdpdGggaW5uZXJIVE1MLiBUbyBnZXQgYXJvdW5kIHRoaXMgeW91IG5lZWQgdG8gcHJlcGVuZCB0aGUgJ05vU2NvcGUnIGVsZW1lbnRcbiAgICAgIC8vIHdpdGggYSAnc2NvcGVkJyBlbGVtZW50LCBpbiBvdXIgY2FzZSB0aGUgc29mdC1oeXBoZW4gZW50aXR5IGFzIGl0IHdvbid0IG1lc3Mgd2l0aCBvdXIgbWVhc3VyZW1lbnRzLlxuICAgICAgLy8gbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzM4OTclMjhWUy44NSUyOS5hc3B4XG4gICAgICAvLyBEb2N1bWVudHMgc2VydmVkIGFzIHhtbCB3aWxsIHRocm93IGlmIHVzaW5nICZzaHk7IHNvIHVzZSB4bWwgZnJpZW5kbHkgZW5jb2RlZCB2ZXJzaW9uLiBTZWUgaXNzdWUgIzI3N1xuICAgICAgc3R5bGUgPSBbJyYjMTczOycsJzxzdHlsZSBpZD1cInMnLCBtb2QsICdcIj4nLCBydWxlLCAnPC9zdHlsZT4nXS5qb2luKCcnKTtcbiAgICAgIGRpdi5pZCA9IG1vZDtcbiAgICAgIC8vIElFNiB3aWxsIGZhbHNlIHBvc2l0aXZlIG9uIHNvbWUgdGVzdHMgZHVlIHRvIHRoZSBzdHlsZSBlbGVtZW50IGluc2lkZSB0aGUgdGVzdCBkaXYgc29tZWhvdyBpbnRlcmZlcmluZyBvZmZzZXRIZWlnaHQsIHNvIGluc2VydCBpdCBpbnRvIGJvZHkgb3IgZmFrZWJvZHkuXG4gICAgICAvLyBPcGVyYSB3aWxsIGFjdCBhbGwgcXVpcmt5IHdoZW4gaW5qZWN0aW5nIGVsZW1lbnRzIGluIGRvY3VtZW50RWxlbWVudCB3aGVuIHBhZ2UgaXMgc2VydmVkIGFzIHhtbCwgbmVlZHMgZmFrZWJvZHkgdG9vLiAjMjcwXG4gICAgICAoYm9keSA/IGRpdiA6IGZha2VCb2R5KS5pbm5lckhUTUwgKz0gc3R5bGU7XG4gICAgICBmYWtlQm9keS5hcHBlbmRDaGlsZChkaXYpO1xuICAgICAgaWYgKCAhYm9keSApIHtcbiAgICAgICAgICAvL2F2b2lkIGNyYXNoaW5nIElFOCwgaWYgYmFja2dyb3VuZCBpbWFnZSBpcyB1c2VkXG4gICAgICAgICAgZmFrZUJvZHkuc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgIC8vU2FmYXJpIDUuMTMvNS4xLjQgT1NYIHN0b3BzIGxvYWRpbmcgaWYgOjotd2Via2l0LXNjcm9sbGJhciBpcyB1c2VkIGFuZCBzY3JvbGxiYXJzIGFyZSB2aXNpYmxlXG4gICAgICAgICAgZmFrZUJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICBkb2NPdmVyZmxvdyA9IGRvY0VsZW1lbnQuc3R5bGUub3ZlcmZsb3c7XG4gICAgICAgICAgZG9jRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgICAgICAgIGRvY0VsZW1lbnQuYXBwZW5kQ2hpbGQoZmFrZUJvZHkpO1xuICAgICAgfVxuXG4gICAgICByZXQgPSBjYWxsYmFjayhkaXYsIHJ1bGUpO1xuICAgICAgLy8gSWYgdGhpcyBpcyBkb25lIGFmdGVyIHBhZ2UgbG9hZCB3ZSBkb24ndCB3YW50IHRvIHJlbW92ZSB0aGUgYm9keSBzbyBjaGVjayBpZiBib2R5IGV4aXN0c1xuICAgICAgaWYgKCAhYm9keSApIHtcbiAgICAgICAgICBmYWtlQm9keS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZha2VCb2R5KTtcbiAgICAgICAgICBkb2NFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gZG9jT3ZlcmZsb3c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRpdi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGRpdik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhIXJldDtcblxuICAgIH0sXG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuXG4gICAgLyo+Pm1xKi9cbiAgICAvLyBhZGFwdGVkIGZyb20gbWF0Y2hNZWRpYSBwb2x5ZmlsbFxuICAgIC8vIGJ5IFNjb3R0IEplaGwgYW5kIFBhdWwgSXJpc2hcbiAgICAvLyBnaXN0LmdpdGh1Yi5jb20vNzg2NzY4XG4gICAgdGVzdE1lZGlhUXVlcnkgPSBmdW5jdGlvbiggbXEgKSB7XG5cbiAgICAgIHZhciBtYXRjaE1lZGlhID0gd2luZG93Lm1hdGNoTWVkaWEgfHwgd2luZG93Lm1zTWF0Y2hNZWRpYTtcbiAgICAgIGlmICggbWF0Y2hNZWRpYSApIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoTWVkaWEobXEpICYmIG1hdGNoTWVkaWEobXEpLm1hdGNoZXMgfHwgZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBib29sO1xuXG4gICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQG1lZGlhICcgKyBtcSArICcgeyAjJyArIG1vZCArICcgeyBwb3NpdGlvbjogYWJzb2x1dGU7IH0gfScsIGZ1bmN0aW9uKCBub2RlICkge1xuICAgICAgICBib29sID0gKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID9cbiAgICAgICAgICAgICAgICAgIGdldENvbXB1dGVkU3R5bGUobm9kZSwgbnVsbCkgOlxuICAgICAgICAgICAgICAgICAgbm9kZS5jdXJyZW50U3R5bGUpWydwb3NpdGlvbiddID09ICdhYnNvbHV0ZSc7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGJvb2w7XG5cbiAgICAgfSxcbiAgICAgLyo+Pm1xKi9cblxuXG4gICAgLyo+Pmhhc2V2ZW50Ki9cbiAgICAvL1xuICAgIC8vIGlzRXZlbnRTdXBwb3J0ZWQgZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQgc3VwcG9ydHMgdGhlIGdpdmVuIGV2ZW50XG4gICAgLy8ga2FuZ2F4LmdpdGh1Yi5jb20vaXNldmVudHN1cHBvcnRlZC9cbiAgICAvL1xuICAgIC8vIFRoZSBmb2xsb3dpbmcgcmVzdWx0cyBhcmUga25vd24gaW5jb3JyZWN0czpcbiAgICAvLyAgIE1vZGVybml6ci5oYXNFdmVudChcIndlYmtpdFRyYW5zaXRpb25FbmRcIiwgZWxlbSkgLy8gZmFsc2UgbmVnYXRpdmVcbiAgICAvLyAgIE1vZGVybml6ci5oYXNFdmVudChcInRleHRJbnB1dFwiKSAvLyBpbiBXZWJraXQuIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMzMzXG4gICAgLy8gICAuLi5cbiAgICBpc0V2ZW50U3VwcG9ydGVkID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgICB2YXIgVEFHTkFNRVMgPSB7XG4gICAgICAgICdzZWxlY3QnOiAnaW5wdXQnLCAnY2hhbmdlJzogJ2lucHV0JyxcbiAgICAgICAgJ3N1Ym1pdCc6ICdmb3JtJywgJ3Jlc2V0JzogJ2Zvcm0nLFxuICAgICAgICAnZXJyb3InOiAnaW1nJywgJ2xvYWQnOiAnaW1nJywgJ2Fib3J0JzogJ2ltZydcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGlzRXZlbnRTdXBwb3J0ZWQoIGV2ZW50TmFtZSwgZWxlbWVudCApIHtcblxuICAgICAgICBlbGVtZW50ID0gZWxlbWVudCB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFRBR05BTUVTW2V2ZW50TmFtZV0gfHwgJ2RpdicpO1xuICAgICAgICBldmVudE5hbWUgPSAnb24nICsgZXZlbnROYW1lO1xuXG4gICAgICAgIC8vIFdoZW4gdXNpbmcgYHNldEF0dHJpYnV0ZWAsIElFIHNraXBzIFwidW5sb2FkXCIsIFdlYktpdCBza2lwcyBcInVubG9hZFwiIGFuZCBcInJlc2l6ZVwiLCB3aGVyZWFzIGBpbmAgXCJjYXRjaGVzXCIgdGhvc2VcbiAgICAgICAgdmFyIGlzU3VwcG9ydGVkID0gZXZlbnROYW1lIGluIGVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCAhaXNTdXBwb3J0ZWQgKSB7XG4gICAgICAgICAgLy8gSWYgaXQgaGFzIG5vIGBzZXRBdHRyaWJ1dGVgIChpLmUuIGRvZXNuJ3QgaW1wbGVtZW50IE5vZGUgaW50ZXJmYWNlKSwgdHJ5IGdlbmVyaWMgZWxlbWVudFxuICAgICAgICAgIGlmICggIWVsZW1lbnQuc2V0QXR0cmlidXRlICkge1xuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIGVsZW1lbnQuc2V0QXR0cmlidXRlICYmIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlICkge1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoZXZlbnROYW1lLCAnJyk7XG4gICAgICAgICAgICBpc1N1cHBvcnRlZCA9IGlzKGVsZW1lbnRbZXZlbnROYW1lXSwgJ2Z1bmN0aW9uJyk7XG5cbiAgICAgICAgICAgIC8vIElmIHByb3BlcnR5IHdhcyBjcmVhdGVkLCBcInJlbW92ZSBpdFwiIChieSBzZXR0aW5nIHZhbHVlIHRvIGB1bmRlZmluZWRgKVxuICAgICAgICAgICAgaWYgKCAhaXMoZWxlbWVudFtldmVudE5hbWVdLCAndW5kZWZpbmVkJykgKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRbZXZlbnROYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGV2ZW50TmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudCA9IG51bGw7XG4gICAgICAgIHJldHVybiBpc1N1cHBvcnRlZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc0V2ZW50U3VwcG9ydGVkO1xuICAgIH0pKCksXG4gICAgLyo+Pmhhc2V2ZW50Ki9cblxuICAgIC8vIFRPRE8gOjogQWRkIGZsYWcgZm9yIGhhc293bnByb3AgPyBkaWRuJ3QgbGFzdCB0aW1lXG5cbiAgICAvLyBoYXNPd25Qcm9wZXJ0eSBzaGltIGJ5IGthbmdheCBuZWVkZWQgZm9yIFNhZmFyaSAyLjAgc3VwcG9ydFxuICAgIF9oYXNPd25Qcm9wZXJ0eSA9ICh7fSkuaGFzT3duUHJvcGVydHksIGhhc093blByb3A7XG5cbiAgICBpZiAoICFpcyhfaGFzT3duUHJvcGVydHksICd1bmRlZmluZWQnKSAmJiAhaXMoX2hhc093blByb3BlcnR5LmNhbGwsICd1bmRlZmluZWQnKSApIHtcbiAgICAgIGhhc093blByb3AgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICByZXR1cm4gX2hhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGhhc093blByb3AgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkgeyAvKiB5ZXMsIHRoaXMgY2FuIGdpdmUgZmFsc2UgcG9zaXRpdmVzL25lZ2F0aXZlcywgYnV0IG1vc3Qgb2YgdGhlIHRpbWUgd2UgZG9uJ3QgY2FyZSBhYm91dCB0aG9zZSAqL1xuICAgICAgICByZXR1cm4gKChwcm9wZXJ0eSBpbiBvYmplY3QpICYmIGlzKG9iamVjdC5jb25zdHJ1Y3Rvci5wcm90b3R5cGVbcHJvcGVydHldLCAndW5kZWZpbmVkJykpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBZGFwdGVkIGZyb20gRVM1LXNoaW0gaHR0cHM6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9lczUtc2hpbS9ibG9iL21hc3Rlci9lczUtc2hpbS5qc1xuICAgIC8vIGVzNS5naXRodWIuY29tLyN4MTUuMy40LjVcblxuICAgIGlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gYmluZCh0aGF0KSB7XG5cbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgICAgIGJvdW5kID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSB7XG5cbiAgICAgICAgICAgICAgdmFyIEYgPSBmdW5jdGlvbigpe307XG4gICAgICAgICAgICAgIEYucHJvdG90eXBlID0gdGFyZ2V0LnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgdmFyIHNlbGYgPSBuZXcgRigpO1xuXG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0YXJnZXQuYXBwbHkoXG4gICAgICAgICAgICAgICAgICBzZWxmLFxuICAgICAgICAgICAgICAgICAgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0LmFwcGx5KFxuICAgICAgICAgICAgICAgICAgdGhhdCxcbiAgICAgICAgICAgICAgICAgIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSlcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGJvdW5kO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXRDc3MgYXBwbGllcyBnaXZlbiBzdHlsZXMgdG8gdGhlIE1vZGVybml6ciBET00gbm9kZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzZXRDc3MoIHN0ciApIHtcbiAgICAgICAgbVN0eWxlLmNzc1RleHQgPSBzdHI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc2V0Q3NzQWxsIGV4dHJhcG9sYXRlcyBhbGwgdmVuZG9yLXNwZWNpZmljIGNzcyBzdHJpbmdzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNldENzc0FsbCggc3RyMSwgc3RyMiApIHtcbiAgICAgICAgcmV0dXJuIHNldENzcyhwcmVmaXhlcy5qb2luKHN0cjEgKyAnOycpICsgKCBzdHIyIHx8ICcnICkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGlzIHJldHVybnMgYSBib29sZWFuIGZvciBpZiB0eXBlb2Ygb2JqIGlzIGV4YWN0bHkgdHlwZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpcyggb2JqLCB0eXBlICkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gdHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjb250YWlucyByZXR1cm5zIGEgYm9vbGVhbiBmb3IgaWYgc3Vic3RyIGlzIGZvdW5kIHdpdGhpbiBzdHIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29udGFpbnMoIHN0ciwgc3Vic3RyICkge1xuICAgICAgICByZXR1cm4gISF+KCcnICsgc3RyKS5pbmRleE9mKHN1YnN0cik7XG4gICAgfVxuXG4gICAgLyo+PnRlc3Rwcm9wKi9cblxuICAgIC8vIHRlc3RQcm9wcyBpcyBhIGdlbmVyaWMgQ1NTIC8gRE9NIHByb3BlcnR5IHRlc3QuXG5cbiAgICAvLyBJbiB0ZXN0aW5nIHN1cHBvcnQgZm9yIGEgZ2l2ZW4gQ1NTIHByb3BlcnR5LCBpdCdzIGxlZ2l0IHRvIHRlc3Q6XG4gICAgLy8gICAgYGVsZW0uc3R5bGVbc3R5bGVOYW1lXSAhPT0gdW5kZWZpbmVkYFxuICAgIC8vIElmIHRoZSBwcm9wZXJ0eSBpcyBzdXBwb3J0ZWQgaXQgd2lsbCByZXR1cm4gYW4gZW1wdHkgc3RyaW5nLFxuICAgIC8vIGlmIHVuc3VwcG9ydGVkIGl0IHdpbGwgcmV0dXJuIHVuZGVmaW5lZC5cblxuICAgIC8vIFdlJ2xsIHRha2UgYWR2YW50YWdlIG9mIHRoaXMgcXVpY2sgdGVzdCBhbmQgc2tpcCBzZXR0aW5nIGEgc3R5bGVcbiAgICAvLyBvbiBvdXIgbW9kZXJuaXpyIGVsZW1lbnQsIGJ1dCBpbnN0ZWFkIGp1c3QgdGVzdGluZyB1bmRlZmluZWQgdnNcbiAgICAvLyBlbXB0eSBzdHJpbmcuXG5cbiAgICAvLyBCZWNhdXNlIHRoZSB0ZXN0aW5nIG9mIHRoZSBDU1MgcHJvcGVydHkgbmFtZXMgKHdpdGggXCItXCIsIGFzXG4gICAgLy8gb3Bwb3NlZCB0byB0aGUgY2FtZWxDYXNlIERPTSBwcm9wZXJ0aWVzKSBpcyBub24tcG9ydGFibGUgYW5kXG4gICAgLy8gbm9uLXN0YW5kYXJkIGJ1dCB3b3JrcyBpbiBXZWJLaXQgYW5kIElFIChidXQgbm90IEdlY2tvIG9yIE9wZXJhKSxcbiAgICAvLyB3ZSBleHBsaWNpdGx5IHJlamVjdCBwcm9wZXJ0aWVzIHdpdGggZGFzaGVzIHNvIHRoYXQgYXV0aG9yc1xuICAgIC8vIGRldmVsb3BpbmcgaW4gV2ViS2l0IG9yIElFIGZpcnN0IGRvbid0IGVuZCB1cCB3aXRoXG4gICAgLy8gYnJvd3Nlci1zcGVjaWZpYyBjb250ZW50IGJ5IGFjY2lkZW50LlxuXG4gICAgZnVuY3Rpb24gdGVzdFByb3BzKCBwcm9wcywgcHJlZml4ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpIGluIHByb3BzICkge1xuICAgICAgICAgICAgdmFyIHByb3AgPSBwcm9wc1tpXTtcbiAgICAgICAgICAgIGlmICggIWNvbnRhaW5zKHByb3AsIFwiLVwiKSAmJiBtU3R5bGVbcHJvcF0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ZWQgPT0gJ3BmeCcgPyBwcm9wIDogdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qPj50ZXN0cHJvcCovXG5cbiAgICAvLyBUT0RPIDo6IGFkZCB0ZXN0RE9NUHJvcHNcbiAgICAvKipcbiAgICAgKiB0ZXN0RE9NUHJvcHMgaXMgYSBnZW5lcmljIERPTSBwcm9wZXJ0eSB0ZXN0OyBpZiBhIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgKiAgIGEgY2VydGFpbiBwcm9wZXJ0eSwgaXQgd29uJ3QgcmV0dXJuIHVuZGVmaW5lZCBmb3IgaXQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdGVzdERPTVByb3BzKCBwcm9wcywgb2JqLCBlbGVtICkge1xuICAgICAgICBmb3IgKCB2YXIgaSBpbiBwcm9wcyApIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gb2JqW3Byb3BzW2ldXTtcbiAgICAgICAgICAgIGlmICggaXRlbSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdGhlIHByb3BlcnR5IG5hbWUgYXMgYSBzdHJpbmdcbiAgICAgICAgICAgICAgICBpZiAoZWxlbSA9PT0gZmFsc2UpIHJldHVybiBwcm9wc1tpXTtcblxuICAgICAgICAgICAgICAgIC8vIGxldCdzIGJpbmQgYSBmdW5jdGlvblxuICAgICAgICAgICAgICAgIGlmIChpcyhpdGVtLCAnZnVuY3Rpb24nKSl7XG4gICAgICAgICAgICAgICAgICAvLyBkZWZhdWx0IHRvIGF1dG9iaW5kIHVubGVzcyBvdmVycmlkZVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uYmluZChlbGVtIHx8IG9iaik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1bmJvdW5kIGZ1bmN0aW9uIG9yIG9iaiBvciB2YWx1ZVxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cbiAgICAvKipcbiAgICAgKiB0ZXN0UHJvcHNBbGwgdGVzdHMgYSBsaXN0IG9mIERPTSBwcm9wZXJ0aWVzIHdlIHdhbnQgdG8gY2hlY2sgYWdhaW5zdC5cbiAgICAgKiAgIFdlIHNwZWNpZnkgbGl0ZXJhbGx5IEFMTCBwb3NzaWJsZSAoa25vd24gYW5kL29yIGxpa2VseSkgcHJvcGVydGllcyBvblxuICAgICAqICAgdGhlIGVsZW1lbnQgaW5jbHVkaW5nIHRoZSBub24tdmVuZG9yIHByZWZpeGVkIG9uZSwgZm9yIGZvcndhcmQtXG4gICAgICogICBjb21wYXRpYmlsaXR5LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRlc3RQcm9wc0FsbCggcHJvcCwgcHJlZml4ZWQsIGVsZW0gKSB7XG5cbiAgICAgICAgdmFyIHVjUHJvcCAgPSBwcm9wLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zbGljZSgxKSxcbiAgICAgICAgICAgIHByb3BzICAgPSAocHJvcCArICcgJyArIGNzc29tUHJlZml4ZXMuam9pbih1Y1Byb3AgKyAnICcpICsgdWNQcm9wKS5zcGxpdCgnICcpO1xuXG4gICAgICAgIC8vIGRpZCB0aGV5IGNhbGwgLnByZWZpeGVkKCdib3hTaXppbmcnKSBvciBhcmUgd2UganVzdCB0ZXN0aW5nIGEgcHJvcD9cbiAgICAgICAgaWYoaXMocHJlZml4ZWQsIFwic3RyaW5nXCIpIHx8IGlzKHByZWZpeGVkLCBcInVuZGVmaW5lZFwiKSkge1xuICAgICAgICAgIHJldHVybiB0ZXN0UHJvcHMocHJvcHMsIHByZWZpeGVkKTtcblxuICAgICAgICAvLyBvdGhlcndpc2UsIHRoZXkgY2FsbGVkIC5wcmVmaXhlZCgncmVxdWVzdEFuaW1hdGlvbkZyYW1lJywgd2luZG93WywgZWxlbV0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvcHMgPSAocHJvcCArICcgJyArIChkb21QcmVmaXhlcykuam9pbih1Y1Byb3AgKyAnICcpICsgdWNQcm9wKS5zcGxpdCgnICcpO1xuICAgICAgICAgIHJldHVybiB0ZXN0RE9NUHJvcHMocHJvcHMsIHByZWZpeGVkLCBlbGVtKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cblxuXG4gICAgLyoqXG4gICAgICogVGVzdHNcbiAgICAgKiAtLS0tLVxuICAgICAqL1xuXG4gICAgLy8gVGhlICpuZXcqIGZsZXhib3hcbiAgICAvLyBkZXYudzMub3JnL2Nzc3dnL2NzczMtZmxleGJveFxuXG4gICAgdGVzdHNbJ2ZsZXhib3gnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnZmxleFdyYXAnKTtcbiAgICB9O1xuXG4gICAgLy8gVGhlICpvbGQqIGZsZXhib3hcbiAgICAvLyB3d3cudzMub3JnL1RSLzIwMDkvV0QtY3NzMy1mbGV4Ym94LTIwMDkwNzIzL1xuXG4gICAgdGVzdHNbJ2ZsZXhib3hsZWdhY3knXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hEaXJlY3Rpb24nKTtcbiAgICB9O1xuXG4gICAgLy8gT24gdGhlIFM2MCBhbmQgQkIgU3Rvcm0sIGdldENvbnRleHQgZXhpc3RzLCBidXQgYWx3YXlzIHJldHVybnMgdW5kZWZpbmVkXG4gICAgLy8gc28gd2UgYWN0dWFsbHkgaGF2ZSB0byBjYWxsIGdldENvbnRleHQoKSB0byB2ZXJpZnlcbiAgICAvLyBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzL2lzc3VlLzk3L1xuXG4gICAgdGVzdHNbJ2NhbnZhcyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHJldHVybiAhIShlbGVtLmdldENvbnRleHQgJiYgZWxlbS5nZXRDb250ZXh0KCcyZCcpKTtcbiAgICB9O1xuXG4gICAgdGVzdHNbJ2NhbnZhc3RleHQnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISEoTW9kZXJuaXpyWydjYW52YXMnXSAmJiBpcyhkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKS5nZXRDb250ZXh0KCcyZCcpLmZpbGxUZXh0LCAnZnVuY3Rpb24nKSk7XG4gICAgfTtcblxuICAgIC8vIHdlYmsuaXQvNzAxMTcgaXMgdHJhY2tpbmcgYSBsZWdpdCBXZWJHTCBmZWF0dXJlIGRldGVjdCBwcm9wb3NhbFxuXG4gICAgLy8gV2UgZG8gYSBzb2Z0IGRldGVjdCB3aGljaCBtYXkgZmFsc2UgcG9zaXRpdmUgaW4gb3JkZXIgdG8gYXZvaWRcbiAgICAvLyBhbiBleHBlbnNpdmUgY29udGV4dCBjcmVhdGlvbjogYnVnemlsLmxhLzczMjQ0MVxuXG4gICAgdGVzdHNbJ3dlYmdsJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dDtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBUaGUgTW9kZXJuaXpyLnRvdWNoIHRlc3Qgb25seSBpbmRpY2F0ZXMgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgKiAgICB0b3VjaCBldmVudHMsIHdoaWNoIGRvZXMgbm90IG5lY2Vzc2FyaWx5IHJlZmxlY3QgYSB0b3VjaHNjcmVlblxuICAgICAqICAgIGRldmljZSwgYXMgZXZpZGVuY2VkIGJ5IHRhYmxldHMgcnVubmluZyBXaW5kb3dzIDcgb3IsIGFsYXMsXG4gICAgICogICAgdGhlIFBhbG0gUHJlIC8gV2ViT1MgKHRvdWNoKSBwaG9uZXMuXG4gICAgICpcbiAgICAgKiBBZGRpdGlvbmFsbHksIENocm9tZSAoZGVza3RvcCkgdXNlZCB0byBsaWUgYWJvdXQgaXRzIHN1cHBvcnQgb24gdGhpcyxcbiAgICAgKiAgICBidXQgdGhhdCBoYXMgc2luY2UgYmVlbiByZWN0aWZpZWQ6IGNyYnVnLmNvbS8zNjQxNVxuICAgICAqXG4gICAgICogV2UgYWxzbyB0ZXN0IGZvciBGaXJlZm94IDQgTXVsdGl0b3VjaCBTdXBwb3J0LlxuICAgICAqXG4gICAgICogRm9yIG1vcmUgaW5mbywgc2VlOiBtb2Rlcm5penIuZ2l0aHViLmNvbS9Nb2Rlcm5penIvdG91Y2guaHRtbFxuICAgICAqL1xuXG4gICAgdGVzdHNbJ3RvdWNoJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJvb2w7XG5cbiAgICAgICAgaWYoKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykgfHwgd2luZG93LkRvY3VtZW50VG91Y2ggJiYgZG9jdW1lbnQgaW5zdGFuY2VvZiBEb2N1bWVudFRvdWNoKSB7XG4gICAgICAgICAgYm9vbCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5qZWN0RWxlbWVudFdpdGhTdHlsZXMoWydAbWVkaWEgKCcscHJlZml4ZXMuam9pbigndG91Y2gtZW5hYmxlZCksKCcpLG1vZCwnKScsJ3sjbW9kZXJuaXpye3RvcDo5cHg7cG9zaXRpb246YWJzb2x1dGV9fSddLmpvaW4oJycpLCBmdW5jdGlvbiggbm9kZSApIHtcbiAgICAgICAgICAgIGJvb2wgPSBub2RlLm9mZnNldFRvcCA9PT0gOTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG5cblxuICAgIC8vIGdlb2xvY2F0aW9uIGlzIG9mdGVuIGNvbnNpZGVyZWQgYSB0cml2aWFsIGZlYXR1cmUgZGV0ZWN0Li4uXG4gICAgLy8gVHVybnMgb3V0LCBpdCdzIHF1aXRlIHRyaWNreSB0byBnZXQgcmlnaHQ6XG4gICAgLy9cbiAgICAvLyBVc2luZyAhIW5hdmlnYXRvci5nZW9sb2NhdGlvbiBkb2VzIHR3byB0aGluZ3Mgd2UgZG9uJ3Qgd2FudC4gSXQ6XG4gICAgLy8gICAxLiBMZWFrcyBtZW1vcnkgaW4gSUU5OiBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzUxM1xuICAgIC8vICAgMi4gRGlzYWJsZXMgcGFnZSBjYWNoaW5nIGluIFdlYktpdDogd2Viay5pdC80Mzk1NlxuICAgIC8vXG4gICAgLy8gTWVhbndoaWxlLCBpbiBGaXJlZm94IDwgOCwgYW4gYWJvdXQ6Y29uZmlnIHNldHRpbmcgY291bGQgZXhwb3NlXG4gICAgLy8gYSBmYWxzZSBwb3NpdGl2ZSB0aGF0IHdvdWxkIHRocm93IGFuIGV4Y2VwdGlvbjogYnVnemlsLmxhLzY4ODE1OFxuXG4gICAgdGVzdHNbJ2dlb2xvY2F0aW9uJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdnZW9sb2NhdGlvbicgaW4gbmF2aWdhdG9yO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydwb3N0bWVzc2FnZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF3aW5kb3cucG9zdE1lc3NhZ2U7XG4gICAgfTtcblxuXG4gICAgLy8gQ2hyb21lIGluY29nbml0byBtb2RlIHVzZWQgdG8gdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gdXNpbmcgb3BlbkRhdGFiYXNlXG4gICAgLy8gSXQgZG9lc24ndCBhbnltb3JlLlxuICAgIHRlc3RzWyd3ZWJzcWxkYXRhYmFzZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF3aW5kb3cub3BlbkRhdGFiYXNlO1xuICAgIH07XG5cbiAgICAvLyBWZW5kb3JzIGhhZCBpbmNvbnNpc3RlbnQgcHJlZml4aW5nIHdpdGggdGhlIGV4cGVyaW1lbnRhbCBJbmRleGVkIERCOlxuICAgIC8vIC0gV2Via2l0J3MgaW1wbGVtZW50YXRpb24gaXMgYWNjZXNzaWJsZSB0aHJvdWdoIHdlYmtpdEluZGV4ZWREQlxuICAgIC8vIC0gRmlyZWZveCBzaGlwcGVkIG1vel9pbmRleGVkREIgYmVmb3JlIEZGNGI5LCBidXQgc2luY2UgdGhlbiBoYXMgYmVlbiBtb3pJbmRleGVkREJcbiAgICAvLyBGb3Igc3BlZWQsIHdlIGRvbid0IHRlc3QgdGhlIGxlZ2FjeSAoYW5kIGJldGEtb25seSkgaW5kZXhlZERCXG4gICAgdGVzdHNbJ2luZGV4ZWREQiddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF0ZXN0UHJvcHNBbGwoXCJpbmRleGVkREJcIiwgd2luZG93KTtcbiAgICB9O1xuXG4gICAgLy8gZG9jdW1lbnRNb2RlIGxvZ2ljIGZyb20gWVVJIHRvIGZpbHRlciBvdXQgSUU4IENvbXBhdCBNb2RlXG4gICAgLy8gICB3aGljaCBmYWxzZSBwb3NpdGl2ZXMuXG4gICAgdGVzdHNbJ2hhc2hjaGFuZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGlzRXZlbnRTdXBwb3J0ZWQoJ2hhc2hjaGFuZ2UnLCB3aW5kb3cpICYmIChkb2N1bWVudC5kb2N1bWVudE1vZGUgPT09IHVuZGVmaW5lZCB8fCBkb2N1bWVudC5kb2N1bWVudE1vZGUgPiA3KTtcbiAgICB9O1xuXG4gICAgLy8gUGVyIDEuNjpcbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgTW9kZXJuaXpyLmhpc3RvcnltYW5hZ2VtZW50IGJ1dCB0aGUgbG9uZ2VyXG4gICAgLy8gbmFtZSBoYXMgYmVlbiBkZXByZWNhdGVkIGluIGZhdm9yIG9mIGEgc2hvcnRlciBhbmQgcHJvcGVydHktbWF0Y2hpbmcgb25lLlxuICAgIC8vIFRoZSBvbGQgQVBJIGlzIHN0aWxsIGF2YWlsYWJsZSBpbiAxLjYsIGJ1dCBhcyBvZiAyLjAgd2lsbCB0aHJvdyBhIHdhcm5pbmcsXG4gICAgLy8gYW5kIGluIHRoZSBmaXJzdCByZWxlYXNlIHRoZXJlYWZ0ZXIgZGlzYXBwZWFyIGVudGlyZWx5LlxuICAgIHRlc3RzWydoaXN0b3J5J10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhISh3aW5kb3cuaGlzdG9yeSAmJiBoaXN0b3J5LnB1c2hTdGF0ZSk7XG4gICAgfTtcblxuICAgIHRlc3RzWydkcmFnYW5kZHJvcCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcmV0dXJuICgnZHJhZ2dhYmxlJyBpbiBkaXYpIHx8ICgnb25kcmFnc3RhcnQnIGluIGRpdiAmJiAnb25kcm9wJyBpbiBkaXYpO1xuICAgIH07XG5cbiAgICAvLyBGRjMuNiB3YXMgRU9MJ2VkIG9uIDQvMjQvMTIsIGJ1dCB0aGUgRVNSIHZlcnNpb24gb2YgRkYxMFxuICAgIC8vIHdpbGwgYmUgc3VwcG9ydGVkIHVudGlsIEZGMTkgKDIvMTIvMTMpLCBhdCB3aGljaCB0aW1lLCBFU1IgYmVjb21lcyBGRjE3LlxuICAgIC8vIEZGMTAgc3RpbGwgdXNlcyBwcmVmaXhlcywgc28gY2hlY2sgZm9yIGl0IHVudGlsIHRoZW4uXG4gICAgLy8gZm9yIG1vcmUgRVNSIGluZm8sIHNlZTogbW96aWxsYS5vcmcvZW4tVVMvZmlyZWZveC9vcmdhbml6YXRpb25zL2ZhcS9cbiAgICB0ZXN0c1snd2Vic29ja2V0cyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnV2ViU29ja2V0JyBpbiB3aW5kb3cgfHwgJ01veldlYlNvY2tldCcgaW4gd2luZG93O1xuICAgIH07XG5cblxuICAgIC8vIGNzcy10cmlja3MuY29tL3JnYmEtYnJvd3Nlci1zdXBwb3J0L1xuICAgIHRlc3RzWydyZ2JhJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2V0IGFuIHJnYmEoKSBjb2xvciBhbmQgY2hlY2sgdGhlIHJldHVybmVkIHZhbHVlXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTUwLDI1NSwxNTAsLjUpJyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5zKG1TdHlsZS5iYWNrZ3JvdW5kQ29sb3IsICdyZ2JhJyk7XG4gICAgfTtcblxuICAgIHRlc3RzWydoc2xhJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2FtZSBhcyByZ2JhKCksIGluIGZhY3QsIGJyb3dzZXJzIHJlLW1hcCBoc2xhKCkgdG8gcmdiYSgpIGludGVybmFsbHksXG4gICAgICAgIC8vICAgZXhjZXB0IElFOSB3aG8gcmV0YWlucyBpdCBhcyBoc2xhXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kLWNvbG9yOmhzbGEoMTIwLDQwJSwxMDAlLC41KScpO1xuXG4gICAgICAgIHJldHVybiBjb250YWlucyhtU3R5bGUuYmFja2dyb3VuZENvbG9yLCAncmdiYScpIHx8IGNvbnRhaW5zKG1TdHlsZS5iYWNrZ3JvdW5kQ29sb3IsICdoc2xhJyk7XG4gICAgfTtcblxuICAgIHRlc3RzWydtdWx0aXBsZWJncyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFNldHRpbmcgbXVsdGlwbGUgaW1hZ2VzIEFORCBhIGNvbG9yIG9uIHRoZSBiYWNrZ3JvdW5kIHNob3J0aGFuZCBwcm9wZXJ0eVxuICAgICAgICAvLyAgYW5kIHRoZW4gcXVlcnlpbmcgdGhlIHN0eWxlLmJhY2tncm91bmQgcHJvcGVydHkgdmFsdWUgZm9yIHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gIG9jY3VycmVuY2VzIG9mIFwidXJsKFwiIGlzIGEgcmVsaWFibGUgbWV0aG9kIGZvciBkZXRlY3RpbmcgQUNUVUFMIHN1cHBvcnQgZm9yIHRoaXMhXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kOnVybChodHRwczovLyksdXJsKGh0dHBzOi8vKSxyZWQgdXJsKGh0dHBzOi8vKScpO1xuXG4gICAgICAgIC8vIElmIHRoZSBVQSBzdXBwb3J0cyBtdWx0aXBsZSBiYWNrZ3JvdW5kcywgdGhlcmUgc2hvdWxkIGJlIHRocmVlIG9jY3VycmVuY2VzXG4gICAgICAgIC8vICAgb2YgdGhlIHN0cmluZyBcInVybChcIiBpbiB0aGUgcmV0dXJuIHZhbHVlIGZvciBlbGVtU3R5bGUuYmFja2dyb3VuZFxuXG4gICAgICAgIHJldHVybiAoLyh1cmxcXHMqXFwoLio/KXszfS8pLnRlc3QobVN0eWxlLmJhY2tncm91bmQpO1xuICAgIH07XG5cblxuXG4gICAgLy8gdGhpcyB3aWxsIGZhbHNlIHBvc2l0aXZlIGluIE9wZXJhIE1pbmlcbiAgICAvLyAgIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMzk2XG5cbiAgICB0ZXN0c1snYmFja2dyb3VuZHNpemUnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdiYWNrZ3JvdW5kU2l6ZScpO1xuICAgIH07XG5cbiAgICB0ZXN0c1snYm9yZGVyaW1hZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3JkZXJJbWFnZScpO1xuICAgIH07XG5cblxuICAgIC8vIFN1cGVyIGNvbXByZWhlbnNpdmUgdGFibGUgYWJvdXQgYWxsIHRoZSB1bmlxdWUgaW1wbGVtZW50YXRpb25zIG9mXG4gICAgLy8gYm9yZGVyLXJhZGl1czogbXVkZGxlZHJhbWJsaW5ncy5jb20vdGFibGUtb2YtY3NzMy1ib3JkZXItcmFkaXVzLWNvbXBsaWFuY2VcblxuICAgIHRlc3RzWydib3JkZXJyYWRpdXMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3JkZXJSYWRpdXMnKTtcbiAgICB9O1xuXG4gICAgLy8gV2ViT1MgdW5mb3J0dW5hdGVseSBmYWxzZSBwb3NpdGl2ZXMgb24gdGhpcyB0ZXN0LlxuICAgIHRlc3RzWydib3hzaGFkb3cnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hTaGFkb3cnKTtcbiAgICB9O1xuXG4gICAgLy8gRkYzLjAgd2lsbCBmYWxzZSBwb3NpdGl2ZSBvbiB0aGlzIHRlc3RcbiAgICB0ZXN0c1sndGV4dHNoYWRvdyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKS5zdHlsZS50ZXh0U2hhZG93ID09PSAnJztcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snb3BhY2l0eSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEJyb3dzZXJzIHRoYXQgYWN0dWFsbHkgaGF2ZSBDU1MgT3BhY2l0eSBpbXBsZW1lbnRlZCBoYXZlIGRvbmUgc29cbiAgICAgICAgLy8gIGFjY29yZGluZyB0byBzcGVjLCB3aGljaCBtZWFucyB0aGVpciByZXR1cm4gdmFsdWVzIGFyZSB3aXRoaW4gdGhlXG4gICAgICAgIC8vICByYW5nZSBvZiBbMC4wLDEuMF0gLSBpbmNsdWRpbmcgdGhlIGxlYWRpbmcgemVyby5cblxuICAgICAgICBzZXRDc3NBbGwoJ29wYWNpdHk6LjU1Jyk7XG5cbiAgICAgICAgLy8gVGhlIG5vbi1saXRlcmFsIC4gaW4gdGhpcyByZWdleCBpcyBpbnRlbnRpb25hbDpcbiAgICAgICAgLy8gICBHZXJtYW4gQ2hyb21lIHJldHVybnMgdGhpcyB2YWx1ZSBhcyAwLDU1XG4gICAgICAgIC8vIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvI2lzc3VlLzU5L2NvbW1lbnQvNTE2NjMyXG4gICAgICAgIHJldHVybiAoL14wLjU1JC8pLnRlc3QobVN0eWxlLm9wYWNpdHkpO1xuICAgIH07XG5cblxuICAgIC8vIE5vdGUsIEFuZHJvaWQgPCA0IHdpbGwgcGFzcyB0aGlzIHRlc3QsIGJ1dCBjYW4gb25seSBhbmltYXRlXG4gICAgLy8gICBhIHNpbmdsZSBwcm9wZXJ0eSBhdCBhIHRpbWVcbiAgICAvLyAgIGdvby5nbC92M1Y0R3BcbiAgICB0ZXN0c1snY3NzYW5pbWF0aW9ucyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2FuaW1hdGlvbk5hbWUnKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzY29sdW1ucyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2NvbHVtbkNvdW50Jyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc2dyYWRpZW50cyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgQ1NTIEdyYWRpZW50cyBzeW50YXgsIHBsZWFzZSBzZWU6XG4gICAgICAgICAqIHdlYmtpdC5vcmcvYmxvZy8xNzUvaW50cm9kdWNpbmctY3NzLWdyYWRpZW50cy9cbiAgICAgICAgICogZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0NTUy8tbW96LWxpbmVhci1ncmFkaWVudFxuICAgICAgICAgKiBkZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vQ1NTLy1tb3otcmFkaWFsLWdyYWRpZW50XG4gICAgICAgICAqIGRldi53My5vcmcvY3Nzd2cvY3NzMy1pbWFnZXMvI2dyYWRpZW50cy1cbiAgICAgICAgICovXG5cbiAgICAgICAgdmFyIHN0cjEgPSAnYmFja2dyb3VuZC1pbWFnZTonLFxuICAgICAgICAgICAgc3RyMiA9ICdncmFkaWVudChsaW5lYXIsbGVmdCB0b3AscmlnaHQgYm90dG9tLGZyb20oIzlmOSksdG8od2hpdGUpKTsnLFxuICAgICAgICAgICAgc3RyMyA9ICdsaW5lYXItZ3JhZGllbnQobGVmdCB0b3AsIzlmOSwgd2hpdGUpOyc7XG5cbiAgICAgICAgc2V0Q3NzKFxuICAgICAgICAgICAgIC8vIGxlZ2FjeSB3ZWJraXQgc3ludGF4IChGSVhNRTogcmVtb3ZlIHdoZW4gc3ludGF4IG5vdCBpbiB1c2UgYW55bW9yZSlcbiAgICAgICAgICAgICAgKHN0cjEgKyAnLXdlYmtpdC0gJy5zcGxpdCgnICcpLmpvaW4oc3RyMiArIHN0cjEpICtcbiAgICAgICAgICAgICAvLyBzdGFuZGFyZCBzeW50YXggICAgICAgICAgICAgLy8gdHJhaWxpbmcgJ2JhY2tncm91bmQtaW1hZ2U6J1xuICAgICAgICAgICAgICBwcmVmaXhlcy5qb2luKHN0cjMgKyBzdHIxKSkuc2xpY2UoMCwgLXN0cjEubGVuZ3RoKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBjb250YWlucyhtU3R5bGUuYmFja2dyb3VuZEltYWdlLCAnZ3JhZGllbnQnKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzcmVmbGVjdGlvbnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hSZWZsZWN0Jyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc3RyYW5zZm9ybXMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISF0ZXN0UHJvcHNBbGwoJ3RyYW5zZm9ybScpO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydjc3N0cmFuc2Zvcm1zM2QnXSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciByZXQgPSAhIXRlc3RQcm9wc0FsbCgncGVyc3BlY3RpdmUnKTtcblxuICAgICAgICAvLyBXZWJraXQncyAzRCB0cmFuc2Zvcm1zIGFyZSBwYXNzZWQgb2ZmIHRvIHRoZSBicm93c2VyJ3Mgb3duIGdyYXBoaWNzIHJlbmRlcmVyLlxuICAgICAgICAvLyAgIEl0IHdvcmtzIGZpbmUgaW4gU2FmYXJpIG9uIExlb3BhcmQgYW5kIFNub3cgTGVvcGFyZCwgYnV0IG5vdCBpbiBDaHJvbWUgaW5cbiAgICAgICAgLy8gICBzb21lIGNvbmRpdGlvbnMuIEFzIGEgcmVzdWx0LCBXZWJraXQgdHlwaWNhbGx5IHJlY29nbml6ZXMgdGhlIHN5bnRheCBidXRcbiAgICAgICAgLy8gICB3aWxsIHNvbWV0aW1lcyB0aHJvdyBhIGZhbHNlIHBvc2l0aXZlLCB0aHVzIHdlIG11c3QgZG8gYSBtb3JlIHRob3JvdWdoIGNoZWNrOlxuICAgICAgICBpZiAoIHJldCAmJiAnd2Via2l0UGVyc3BlY3RpdmUnIGluIGRvY0VsZW1lbnQuc3R5bGUgKSB7XG5cbiAgICAgICAgICAvLyBXZWJraXQgYWxsb3dzIHRoaXMgbWVkaWEgcXVlcnkgdG8gc3VjY2VlZCBvbmx5IGlmIHRoZSBmZWF0dXJlIGlzIGVuYWJsZWQuXG4gICAgICAgICAgLy8gYEBtZWRpYSAodHJhbnNmb3JtLTNkKSwoLXdlYmtpdC10cmFuc2Zvcm0tM2QpeyAuLi4gfWBcbiAgICAgICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQG1lZGlhICh0cmFuc2Zvcm0tM2QpLCgtd2Via2l0LXRyYW5zZm9ybS0zZCl7I21vZGVybml6cntsZWZ0OjlweDtwb3NpdGlvbjphYnNvbHV0ZTtoZWlnaHQ6M3B4O319JywgZnVuY3Rpb24oIG5vZGUsIHJ1bGUgKSB7XG4gICAgICAgICAgICByZXQgPSBub2RlLm9mZnNldExlZnQgPT09IDkgJiYgbm9kZS5vZmZzZXRIZWlnaHQgPT09IDM7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzdHJhbnNpdGlvbnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCd0cmFuc2l0aW9uJyk7XG4gICAgfTtcblxuXG4gICAgLyo+PmZvbnRmYWNlKi9cbiAgICAvLyBAZm9udC1mYWNlIGRldGVjdGlvbiByb3V0aW5lIGJ5IERpZWdvIFBlcmluaVxuICAgIC8vIGphdmFzY3JpcHQubndib3guY29tL0NTU1N1cHBvcnQvXG5cbiAgICAvLyBmYWxzZSBwb3NpdGl2ZXM6XG4gICAgLy8gICBXZWJPUyBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzM0MlxuICAgIC8vICAgV1A3ICAgZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy81MzhcbiAgICB0ZXN0c1snZm9udGZhY2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYm9vbDtcblxuICAgICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQGZvbnQtZmFjZSB7Zm9udC1mYW1pbHk6XCJmb250XCI7c3JjOnVybChcImh0dHBzOi8vXCIpfScsIGZ1bmN0aW9uKCBub2RlLCBydWxlICkge1xuICAgICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbW9kZXJuaXpyJyksXG4gICAgICAgICAgICAgIHNoZWV0ID0gc3R5bGUuc2hlZXQgfHwgc3R5bGUuc3R5bGVTaGVldCxcbiAgICAgICAgICAgICAgY3NzVGV4dCA9IHNoZWV0ID8gKHNoZWV0LmNzc1J1bGVzICYmIHNoZWV0LmNzc1J1bGVzWzBdID8gc2hlZXQuY3NzUnVsZXNbMF0uY3NzVGV4dCA6IHNoZWV0LmNzc1RleHQgfHwgJycpIDogJyc7XG5cbiAgICAgICAgICBib29sID0gL3NyYy9pLnRlc3QoY3NzVGV4dCkgJiYgY3NzVGV4dC5pbmRleE9mKHJ1bGUuc3BsaXQoJyAnKVswXSkgPT09IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG4gICAgLyo+PmZvbnRmYWNlKi9cblxuICAgIC8vIENTUyBnZW5lcmF0ZWQgY29udGVudCBkZXRlY3Rpb25cbiAgICB0ZXN0c1snZ2VuZXJhdGVkY29udGVudCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBib29sO1xuXG4gICAgICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzKFsnIycsbW9kLCd7Zm9udDowLzAgYX0jJyxtb2QsJzphZnRlcntjb250ZW50OlwiJyxzbWlsZSwnXCI7dmlzaWJpbGl0eTpoaWRkZW47Zm9udDozcHgvMSBhfSddLmpvaW4oJycpLCBmdW5jdGlvbiggbm9kZSApIHtcbiAgICAgICAgICBib29sID0gbm9kZS5vZmZzZXRIZWlnaHQgPj0gMztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcblxuXG5cbiAgICAvLyBUaGVzZSB0ZXN0cyBldmFsdWF0ZSBzdXBwb3J0IG9mIHRoZSB2aWRlby9hdWRpbyBlbGVtZW50cywgYXMgd2VsbCBhc1xuICAgIC8vIHRlc3Rpbmcgd2hhdCB0eXBlcyBvZiBjb250ZW50IHRoZXkgc3VwcG9ydC5cbiAgICAvL1xuICAgIC8vIFdlJ3JlIHVzaW5nIHRoZSBCb29sZWFuIGNvbnN0cnVjdG9yIGhlcmUsIHNvIHRoYXQgd2UgY2FuIGV4dGVuZCB0aGUgdmFsdWVcbiAgICAvLyBlLmcuICBNb2Rlcm5penIudmlkZW8gICAgIC8vIHRydWVcbiAgICAvLyAgICAgICBNb2Rlcm5penIudmlkZW8ub2dnIC8vICdwcm9iYWJseSdcbiAgICAvL1xuICAgIC8vIENvZGVjIHZhbHVlcyBmcm9tIDogZ2l0aHViLmNvbS9OaWVsc0xlZW5oZWVyL2h0bWw1dGVzdC9ibG9iLzkxMDZhOC9pbmRleC5odG1sI0w4NDVcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHRoeCB0byBOaWVsc0xlZW5oZWVyIGFuZCB6Y29ycGFuXG5cbiAgICAvLyBOb3RlOiBpbiBzb21lIG9sZGVyIGJyb3dzZXJzLCBcIm5vXCIgd2FzIGEgcmV0dXJuIHZhbHVlIGluc3RlYWQgb2YgZW1wdHkgc3RyaW5nLlxuICAgIC8vICAgSXQgd2FzIGxpdmUgaW4gRkYzLjUuMCBhbmQgMy41LjEsIGJ1dCBmaXhlZCBpbiAzLjUuMlxuICAgIC8vICAgSXQgd2FzIGFsc28gbGl2ZSBpbiBTYWZhcmkgNC4wLjAgLSA0LjAuNCwgYnV0IGZpeGVkIGluIDQuMC41XG5cbiAgICB0ZXN0c1sndmlkZW8nXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyksXG4gICAgICAgICAgICBib29sID0gZmFsc2U7XG5cbiAgICAgICAgLy8gSUU5IFJ1bm5pbmcgb24gV2luZG93cyBTZXJ2ZXIgU0tVIGNhbiBjYXVzZSBhbiBleGNlcHRpb24gdG8gYmUgdGhyb3duLCBidWcgIzIyNFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCBib29sID0gISFlbGVtLmNhblBsYXlUeXBlICkge1xuICAgICAgICAgICAgICAgIGJvb2wgICAgICA9IG5ldyBCb29sZWFuKGJvb2wpO1xuICAgICAgICAgICAgICAgIGJvb2wub2dnICA9IGVsZW0uY2FuUGxheVR5cGUoJ3ZpZGVvL29nZzsgY29kZWNzPVwidGhlb3JhXCInKSAgICAgIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBXaXRob3V0IFF1aWNrVGltZSwgdGhpcyB2YWx1ZSB3aWxsIGJlIGB1bmRlZmluZWRgLiBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzU0NlxuICAgICAgICAgICAgICAgIGJvb2wuaDI2NCA9IGVsZW0uY2FuUGxheVR5cGUoJ3ZpZGVvL21wNDsgY29kZWNzPVwiYXZjMS40MkUwMUVcIicpIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICBib29sLndlYm0gPSBlbGVtLmNhblBsYXlUeXBlKCd2aWRlby93ZWJtOyBjb2RlY3M9XCJ2cDgsIHZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sJycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gY2F0Y2goZSkgeyB9XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcblxuICAgIHRlc3RzWydhdWRpbyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKSxcbiAgICAgICAgICAgIGJvb2wgPSBmYWxzZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCBib29sID0gISFlbGVtLmNhblBsYXlUeXBlICkge1xuICAgICAgICAgICAgICAgIGJvb2wgICAgICA9IG5ldyBCb29sZWFuKGJvb2wpO1xuICAgICAgICAgICAgICAgIGJvb2wub2dnICA9IGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL29nZzsgY29kZWNzPVwidm9yYmlzXCInKS5yZXBsYWNlKC9ebm8kLywnJyk7XG4gICAgICAgICAgICAgICAgYm9vbC5tcDMgID0gZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8vbXBlZzsnKSAgICAgICAgICAgICAgIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBNaW1ldHlwZXMgYWNjZXB0ZWQ6XG4gICAgICAgICAgICAgICAgLy8gICBkZXZlbG9wZXIubW96aWxsYS5vcmcvRW4vTWVkaWFfZm9ybWF0c19zdXBwb3J0ZWRfYnlfdGhlX2F1ZGlvX2FuZF92aWRlb19lbGVtZW50c1xuICAgICAgICAgICAgICAgIC8vICAgYml0Lmx5L2lwaG9uZW9zY29kZWNzXG4gICAgICAgICAgICAgICAgYm9vbC53YXYgID0gZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8vd2F2OyBjb2RlY3M9XCIxXCInKSAgICAgLnJlcGxhY2UoL15ubyQvLCcnKTtcbiAgICAgICAgICAgICAgICBib29sLm00YSAgPSAoIGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL3gtbTRhOycpICAgICAgICAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL2FhYzsnKSkgICAgICAgICAgICAgLnJlcGxhY2UoL15ubyQvLCcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaChlKSB7IH1cblxuICAgICAgICByZXR1cm4gYm9vbDtcbiAgICB9O1xuXG5cbiAgICAvLyBJbiBGRjQsIGlmIGRpc2FibGVkLCB3aW5kb3cubG9jYWxTdG9yYWdlIHNob3VsZCA9PT0gbnVsbC5cblxuICAgIC8vIE5vcm1hbGx5LCB3ZSBjb3VsZCBub3QgdGVzdCB0aGF0IGRpcmVjdGx5IGFuZCBuZWVkIHRvIGRvIGFcbiAgICAvLyAgIGAoJ2xvY2FsU3RvcmFnZScgaW4gd2luZG93KSAmJiBgIHRlc3QgZmlyc3QgYmVjYXVzZSBvdGhlcndpc2UgRmlyZWZveCB3aWxsXG4gICAgLy8gICB0aHJvdyBidWd6aWwubGEvMzY1NzcyIGlmIGNvb2tpZXMgYXJlIGRpc2FibGVkXG5cbiAgICAvLyBBbHNvIGluIGlPUzUgUHJpdmF0ZSBCcm93c2luZyBtb2RlLCBhdHRlbXB0aW5nIHRvIHVzZSBsb2NhbFN0b3JhZ2Uuc2V0SXRlbVxuICAgIC8vIHdpbGwgdGhyb3cgdGhlIGV4Y2VwdGlvbjpcbiAgICAvLyAgIFFVT1RBX0VYQ0VFREVEX0VSUlJPUiBET00gRXhjZXB0aW9uIDIyLlxuICAgIC8vIFBlY3VsaWFybHksIGdldEl0ZW0gYW5kIHJlbW92ZUl0ZW0gY2FsbHMgZG8gbm90IHRocm93LlxuXG4gICAgLy8gQmVjYXVzZSB3ZSBhcmUgZm9yY2VkIHRvIHRyeS9jYXRjaCB0aGlzLCB3ZSdsbCBnbyBhZ2dyZXNzaXZlLlxuXG4gICAgLy8gSnVzdCBGV0lXOiBJRTggQ29tcGF0IG1vZGUgc3VwcG9ydHMgdGhlc2UgZmVhdHVyZXMgY29tcGxldGVseTpcbiAgICAvLyAgIHd3dy5xdWlya3Ntb2RlLm9yZy9kb20vaHRtbDUuaHRtbFxuICAgIC8vIEJ1dCBJRTggZG9lc24ndCBzdXBwb3J0IGVpdGhlciB3aXRoIGxvY2FsIGZpbGVzXG5cbiAgICB0ZXN0c1snbG9jYWxzdG9yYWdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKG1vZCwgbW9kKTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKG1vZCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGVzdHNbJ3Nlc3Npb25zdG9yYWdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0obW9kLCBtb2QpO1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShtb2QpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ3dlYndvcmtlcnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISF3aW5kb3cuV29ya2VyO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydhcHBsaWNhdGlvbmNhY2hlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhd2luZG93LmFwcGxpY2F0aW9uQ2FjaGU7XG4gICAgfTtcblxuXG4gICAgLy8gVGhhbmtzIHRvIEVyaWsgRGFobHN0cm9tXG4gICAgdGVzdHNbJ3N2ZyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucy5zdmcsICdzdmcnKS5jcmVhdGVTVkdSZWN0O1xuICAgIH07XG5cbiAgICAvLyBzcGVjaWZpY2FsbHkgZm9yIFNWRyBpbmxpbmUgaW4gSFRNTCwgbm90IHdpdGhpbiBYSFRNTFxuICAgIC8vIHRlc3QgcGFnZTogcGF1bGlyaXNoLmNvbS9kZW1vL2lubGluZS1zdmdcbiAgICB0ZXN0c1snaW5saW5lc3ZnJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGRpdi5pbm5lckhUTUwgPSAnPHN2Zy8+JztcbiAgICAgIHJldHVybiAoZGl2LmZpcnN0Q2hpbGQgJiYgZGl2LmZpcnN0Q2hpbGQubmFtZXNwYWNlVVJJKSA9PSBucy5zdmc7XG4gICAgfTtcblxuICAgIC8vIFNWRyBTTUlMIGFuaW1hdGlvblxuICAgIHRlc3RzWydzbWlsJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICYmIC9TVkdBbmltYXRlLy50ZXN0KHRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLnN2ZywgJ2FuaW1hdGUnKSkpO1xuICAgIH07XG5cbiAgICAvLyBUaGlzIHRlc3QgaXMgb25seSBmb3IgY2xpcCBwYXRocyBpbiBTVkcgcHJvcGVyLCBub3QgY2xpcCBwYXRocyBvbiBIVE1MIGNvbnRlbnRcbiAgICAvLyBkZW1vOiBzcnVmYWN1bHR5LnNydS5lZHUvZGF2aWQuZGFpbGV5L3N2Zy9uZXdzdHVmZi9jbGlwUGF0aDQuc3ZnXG5cbiAgICAvLyBIb3dldmVyIHJlYWQgdGhlIGNvbW1lbnRzIHRvIGRpZyBpbnRvIGFwcGx5aW5nIFNWRyBjbGlwcGF0aHMgdG8gSFRNTCBjb250ZW50IGhlcmU6XG4gICAgLy8gICBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzIxMyNpc3N1ZWNvbW1lbnQtMTE0OTQ5MVxuICAgIHRlc3RzWydzdmdjbGlwcGF0aHMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiYgL1NWR0NsaXBQYXRoLy50ZXN0KHRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLnN2ZywgJ2NsaXBQYXRoJykpKTtcbiAgICB9O1xuXG4gICAgLyo+PndlYmZvcm1zKi9cbiAgICAvLyBpbnB1dCBmZWF0dXJlcyBhbmQgaW5wdXQgdHlwZXMgZ28gZGlyZWN0bHkgb250byB0aGUgcmV0IG9iamVjdCwgYnlwYXNzaW5nIHRoZSB0ZXN0cyBsb29wLlxuICAgIC8vIEhvbGQgdGhpcyBndXkgdG8gZXhlY3V0ZSBpbiBhIG1vbWVudC5cbiAgICBmdW5jdGlvbiB3ZWJmb3JtcygpIHtcbiAgICAgICAgLyo+PmlucHV0Ki9cbiAgICAgICAgLy8gUnVuIHRocm91Z2ggSFRNTDUncyBuZXcgaW5wdXQgYXR0cmlidXRlcyB0byBzZWUgaWYgdGhlIFVBIHVuZGVyc3RhbmRzIGFueS5cbiAgICAgICAgLy8gV2UncmUgdXNpbmcgZiB3aGljaCBpcyB0aGUgPGlucHV0PiBlbGVtZW50IGNyZWF0ZWQgZWFybHkgb25cbiAgICAgICAgLy8gTWlrZSBUYXlsciBoYXMgY3JlYXRlZCBhIGNvbXByZWhlbnNpdmUgcmVzb3VyY2UgZm9yIHRlc3RpbmcgdGhlc2UgYXR0cmlidXRlc1xuICAgICAgICAvLyAgIHdoZW4gYXBwbGllZCB0byBhbGwgaW5wdXQgdHlwZXM6XG4gICAgICAgIC8vICAgbWlrZXRheWxyLmNvbS9jb2RlL2lucHV0LXR5cGUtYXR0ci5odG1sXG4gICAgICAgIC8vIHNwZWM6IHd3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvdGhlLWlucHV0LWVsZW1lbnQuaHRtbCNpbnB1dC10eXBlLWF0dHItc3VtbWFyeVxuXG4gICAgICAgIC8vIE9ubHkgaW5wdXQgcGxhY2Vob2xkZXIgaXMgdGVzdGVkIHdoaWxlIHRleHRhcmVhJ3MgcGxhY2Vob2xkZXIgaXMgbm90LlxuICAgICAgICAvLyBDdXJyZW50bHkgU2FmYXJpIDQgYW5kIE9wZXJhIDExIGhhdmUgc3VwcG9ydCBvbmx5IGZvciB0aGUgaW5wdXQgcGxhY2Vob2xkZXJcbiAgICAgICAgLy8gQm90aCB0ZXN0cyBhcmUgYXZhaWxhYmxlIGluIGZlYXR1cmUtZGV0ZWN0cy9mb3Jtcy1wbGFjZWhvbGRlci5qc1xuICAgICAgICBNb2Rlcm5penJbJ2lucHV0J10gPSAoZnVuY3Rpb24oIHByb3BzICkge1xuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsZW4gPSBwcm9wcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICBhdHRyc1sgcHJvcHNbaV0gXSA9ICEhKHByb3BzW2ldIGluIGlucHV0RWxlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXR0cnMubGlzdCl7XG4gICAgICAgICAgICAgIC8vIHNhZmFyaSBmYWxzZSBwb3NpdGl2ZSdzIG9uIGRhdGFsaXN0OiB3ZWJrLml0Lzc0MjUyXG4gICAgICAgICAgICAgIC8vIHNlZSBhbHNvIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMTQ2XG4gICAgICAgICAgICAgIGF0dHJzLmxpc3QgPSAhIShkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkYXRhbGlzdCcpICYmIHdpbmRvdy5IVE1MRGF0YUxpc3RFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhdHRycztcbiAgICAgICAgfSkoJ2F1dG9jb21wbGV0ZSBhdXRvZm9jdXMgbGlzdCBwbGFjZWhvbGRlciBtYXggbWluIG11bHRpcGxlIHBhdHRlcm4gcmVxdWlyZWQgc3RlcCcuc3BsaXQoJyAnKSk7XG4gICAgICAgIC8qPj5pbnB1dCovXG5cbiAgICAgICAgLyo+PmlucHV0dHlwZXMqL1xuICAgICAgICAvLyBSdW4gdGhyb3VnaCBIVE1MNSdzIG5ldyBpbnB1dCB0eXBlcyB0byBzZWUgaWYgdGhlIFVBIHVuZGVyc3RhbmRzIGFueS5cbiAgICAgICAgLy8gICBUaGlzIGlzIHB1dCBiZWhpbmQgdGhlIHRlc3RzIHJ1bmxvb3AgYmVjYXVzZSBpdCBkb2Vzbid0IHJldHVybiBhXG4gICAgICAgIC8vICAgdHJ1ZS9mYWxzZSBsaWtlIGFsbCB0aGUgb3RoZXIgdGVzdHM7IGluc3RlYWQsIGl0IHJldHVybnMgYW4gb2JqZWN0XG4gICAgICAgIC8vICAgY29udGFpbmluZyBlYWNoIGlucHV0IHR5cGUgd2l0aCBpdHMgY29ycmVzcG9uZGluZyB0cnVlL2ZhbHNlIHZhbHVlXG5cbiAgICAgICAgLy8gQmlnIHRoYW5rcyB0byBAbWlrZXRheWxyIGZvciB0aGUgaHRtbDUgZm9ybXMgZXhwZXJ0aXNlLiBtaWtldGF5bHIuY29tL1xuICAgICAgICBNb2Rlcm5penJbJ2lucHV0dHlwZXMnXSA9IChmdW5jdGlvbihwcm9wcykge1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGJvb2wsIGlucHV0RWxlbVR5cGUsIGRlZmF1bHRWaWV3LCBsZW4gPSBwcm9wcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIGlucHV0RWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCBpbnB1dEVsZW1UeXBlID0gcHJvcHNbaV0pO1xuICAgICAgICAgICAgICAgIGJvb2wgPSBpbnB1dEVsZW0udHlwZSAhPT0gJ3RleHQnO1xuXG4gICAgICAgICAgICAgICAgLy8gV2UgZmlyc3QgY2hlY2sgdG8gc2VlIGlmIHRoZSB0eXBlIHdlIGdpdmUgaXQgc3RpY2tzLi5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdHlwZSBkb2VzLCB3ZSBmZWVkIGl0IGEgdGV4dHVhbCB2YWx1ZSwgd2hpY2ggc2hvdWxkbid0IGJlIHZhbGlkLlxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSB2YWx1ZSBkb2Vzbid0IHN0aWNrLCB3ZSBrbm93IHRoZXJlJ3MgaW5wdXQgc2FuaXRpemF0aW9uIHdoaWNoIGluZmVycyBhIGN1c3RvbSBVSVxuICAgICAgICAgICAgICAgIGlmICggYm9vbCApIHtcblxuICAgICAgICAgICAgICAgICAgICBpbnB1dEVsZW0udmFsdWUgICAgICAgICA9IHNtaWxlO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dEVsZW0uc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTt2aXNpYmlsaXR5OmhpZGRlbjsnO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggL15yYW5nZSQvLnRlc3QoaW5wdXRFbGVtVHlwZSkgJiYgaW5wdXRFbGVtLnN0eWxlLldlYmtpdEFwcGVhcmFuY2UgIT09IHVuZGVmaW5lZCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgIGRvY0VsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXRFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmlldyA9IGRvY3VtZW50LmRlZmF1bHRWaWV3O1xuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDItNCBhbGxvd3MgdGhlIHNtaWxleSBhcyBhIHZhbHVlLCBkZXNwaXRlIG1ha2luZyBhIHNsaWRlclxuICAgICAgICAgICAgICAgICAgICAgIGJvb2wgPSAgZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShpbnB1dEVsZW0sIG51bGwpLldlYmtpdEFwcGVhcmFuY2UgIT09ICd0ZXh0ZmllbGQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNb2JpbGUgYW5kcm9pZCB3ZWIgYnJvd3NlciBoYXMgZmFsc2UgcG9zaXRpdmUsIHNvIG11c3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBoZWlnaHQgdG8gc2VlIGlmIHRoZSB3aWRnZXQgaXMgYWN0dWFsbHkgdGhlcmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5wdXRFbGVtLm9mZnNldEhlaWdodCAhPT0gMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBkb2NFbGVtZW50LnJlbW92ZUNoaWxkKGlucHV0RWxlbSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICggL14oc2VhcmNofHRlbCkkLy50ZXN0KGlucHV0RWxlbVR5cGUpICl7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gU3BlYyBkb2Vzbid0IGRlZmluZSBhbnkgc3BlY2lhbCBwYXJzaW5nIG9yIGRldGVjdGFibGUgVUlcbiAgICAgICAgICAgICAgICAgICAgICAvLyAgIGJlaGF2aW9ycyBzbyB3ZSBwYXNzIHRoZXNlIHRocm91Z2ggYXMgdHJ1ZVxuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSW50ZXJlc3RpbmdseSwgb3BlcmEgZmFpbHMgdGhlIGVhcmxpZXIgdGVzdCwgc28gaXQgZG9lc24ndFxuICAgICAgICAgICAgICAgICAgICAgIC8vICBldmVuIG1ha2UgaXQgaGVyZS5cblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCAvXih1cmx8ZW1haWwpJC8udGVzdChpbnB1dEVsZW1UeXBlKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBSZWFsIHVybCBhbmQgZW1haWwgc3VwcG9ydCBjb21lcyB3aXRoIHByZWJha2VkIHZhbGlkYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgYm9vbCA9IGlucHV0RWxlbS5jaGVja1ZhbGlkaXR5ICYmIGlucHV0RWxlbS5jaGVja1ZhbGlkaXR5KCkgPT09IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHVwZ3JhZGVkIGlucHV0IGNvbXBvbnRlbnQgcmVqZWN0cyB0aGUgOikgdGV4dCwgd2UgZ290IGEgd2lubmVyXG4gICAgICAgICAgICAgICAgICAgICAgYm9vbCA9IGlucHV0RWxlbS52YWx1ZSAhPSBzbWlsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlucHV0c1sgcHJvcHNbaV0gXSA9ICEhYm9vbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnB1dHM7XG4gICAgICAgIH0pKCdzZWFyY2ggdGVsIHVybCBlbWFpbCBkYXRldGltZSBkYXRlIG1vbnRoIHdlZWsgdGltZSBkYXRldGltZS1sb2NhbCBudW1iZXIgcmFuZ2UgY29sb3InLnNwbGl0KCcgJykpO1xuICAgICAgICAvKj4+aW5wdXR0eXBlcyovXG4gICAgfVxuICAgIC8qPj53ZWJmb3JtcyovXG5cblxuICAgIC8vIEVuZCBvZiB0ZXN0IGRlZmluaXRpb25zXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG5cbiAgICAvLyBSdW4gdGhyb3VnaCBhbGwgdGVzdHMgYW5kIGRldGVjdCB0aGVpciBzdXBwb3J0IGluIHRoZSBjdXJyZW50IFVBLlxuICAgIC8vIHRvZG86IGh5cG90aGV0aWNhbGx5IHdlIGNvdWxkIGJlIGRvaW5nIGFuIGFycmF5IG9mIHRlc3RzIGFuZCB1c2UgYSBiYXNpYyBsb29wIGhlcmUuXG4gICAgZm9yICggdmFyIGZlYXR1cmUgaW4gdGVzdHMgKSB7XG4gICAgICAgIGlmICggaGFzT3duUHJvcCh0ZXN0cywgZmVhdHVyZSkgKSB7XG4gICAgICAgICAgICAvLyBydW4gdGhlIHRlc3QsIHRocm93IHRoZSByZXR1cm4gdmFsdWUgaW50byB0aGUgTW9kZXJuaXpyLFxuICAgICAgICAgICAgLy8gICB0aGVuIGJhc2VkIG9uIHRoYXQgYm9vbGVhbiwgZGVmaW5lIGFuIGFwcHJvcHJpYXRlIGNsYXNzTmFtZVxuICAgICAgICAgICAgLy8gICBhbmQgcHVzaCBpdCBpbnRvIGFuIGFycmF5IG9mIGNsYXNzZXMgd2UnbGwgam9pbiBsYXRlci5cbiAgICAgICAgICAgIGZlYXR1cmVOYW1lICA9IGZlYXR1cmUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIE1vZGVybml6cltmZWF0dXJlTmFtZV0gPSB0ZXN0c1tmZWF0dXJlXSgpO1xuXG4gICAgICAgICAgICBjbGFzc2VzLnB1c2goKE1vZGVybml6cltmZWF0dXJlTmFtZV0gPyAnJyA6ICduby0nKSArIGZlYXR1cmVOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qPj53ZWJmb3JtcyovXG4gICAgLy8gaW5wdXQgdGVzdHMgbmVlZCB0byBydW4uXG4gICAgTW9kZXJuaXpyLmlucHV0IHx8IHdlYmZvcm1zKCk7XG4gICAgLyo+PndlYmZvcm1zKi9cblxuXG4gICAgLyoqXG4gICAgICogYWRkVGVzdCBhbGxvd3MgdGhlIHVzZXIgdG8gZGVmaW5lIHRoZWlyIG93biBmZWF0dXJlIHRlc3RzXG4gICAgICogdGhlIHJlc3VsdCB3aWxsIGJlIGFkZGVkIG9udG8gdGhlIE1vZGVybml6ciBvYmplY3QsXG4gICAgICogYXMgd2VsbCBhcyBhbiBhcHByb3ByaWF0ZSBjbGFzc05hbWUgc2V0IG9uIHRoZSBodG1sIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmZWF0dXJlIC0gU3RyaW5nIG5hbWluZyB0aGUgZmVhdHVyZVxuICAgICAqIEBwYXJhbSB0ZXN0IC0gRnVuY3Rpb24gcmV0dXJuaW5nIHRydWUgaWYgZmVhdHVyZSBpcyBzdXBwb3J0ZWQsIGZhbHNlIGlmIG5vdFxuICAgICAqL1xuICAgICBNb2Rlcm5penIuYWRkVGVzdCA9IGZ1bmN0aW9uICggZmVhdHVyZSwgdGVzdCApIHtcbiAgICAgICBpZiAoIHR5cGVvZiBmZWF0dXJlID09ICdvYmplY3QnICkge1xuICAgICAgICAgZm9yICggdmFyIGtleSBpbiBmZWF0dXJlICkge1xuICAgICAgICAgICBpZiAoIGhhc093blByb3AoIGZlYXR1cmUsIGtleSApICkge1xuICAgICAgICAgICAgIE1vZGVybml6ci5hZGRUZXN0KCBrZXksIGZlYXR1cmVbIGtleSBdICk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICBmZWF0dXJlID0gZmVhdHVyZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICBpZiAoIE1vZGVybml6cltmZWF0dXJlXSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAvLyB3ZSdyZSBnb2luZyB0byBxdWl0IGlmIHlvdSdyZSB0cnlpbmcgdG8gb3ZlcndyaXRlIGFuIGV4aXN0aW5nIHRlc3RcbiAgICAgICAgICAgLy8gaWYgd2Ugd2VyZSB0byBhbGxvdyBpdCwgd2UnZCBkbyB0aGlzOlxuICAgICAgICAgICAvLyAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCJcXFxcYihuby0pP1wiICsgZmVhdHVyZSArIFwiXFxcXGJcIik7XG4gICAgICAgICAgIC8vICAgZG9jRWxlbWVudC5jbGFzc05hbWUgPSBkb2NFbGVtZW50LmNsYXNzTmFtZS5yZXBsYWNlKCByZSwgJycgKTtcbiAgICAgICAgICAgLy8gYnV0LCBubyBybHksIHN0dWZmICdlbS5cbiAgICAgICAgICAgcmV0dXJuIE1vZGVybml6cjtcbiAgICAgICAgIH1cblxuICAgICAgICAgdGVzdCA9IHR5cGVvZiB0ZXN0ID09ICdmdW5jdGlvbicgPyB0ZXN0KCkgOiB0ZXN0O1xuXG4gICAgICAgICBpZiAodHlwZW9mIGVuYWJsZUNsYXNzZXMgIT09IFwidW5kZWZpbmVkXCIgJiYgZW5hYmxlQ2xhc3Nlcykge1xuICAgICAgICAgICBkb2NFbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyAodGVzdCA/ICcnIDogJ25vLScpICsgZmVhdHVyZTtcbiAgICAgICAgIH1cbiAgICAgICAgIE1vZGVybml6cltmZWF0dXJlXSA9IHRlc3Q7XG5cbiAgICAgICB9XG5cbiAgICAgICByZXR1cm4gTW9kZXJuaXpyOyAvLyBhbGxvdyBjaGFpbmluZy5cbiAgICAgfTtcblxuXG4gICAgLy8gUmVzZXQgbW9kRWxlbS5jc3NUZXh0IHRvIG5vdGhpbmcgdG8gcmVkdWNlIG1lbW9yeSBmb290cHJpbnQuXG4gICAgc2V0Q3NzKCcnKTtcbiAgICBtb2RFbGVtID0gaW5wdXRFbGVtID0gbnVsbDtcblxuICAgIC8qPj5zaGl2Ki9cbiAgICAvKipcbiAgICAgKiBAcHJlc2VydmUgSFRNTDUgU2hpdiBwcmV2My43LjEgfCBAYWZhcmthcyBAamRhbHRvbiBAam9uX25lYWwgQHJlbSB8IE1JVC9HUEwyIExpY2Vuc2VkXG4gICAgICovXG4gICAgOyhmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50KSB7XG4gICAgICAgIC8qanNoaW50IGV2aWw6dHJ1ZSAqL1xuICAgICAgICAvKiogdmVyc2lvbiAqL1xuICAgICAgICB2YXIgdmVyc2lvbiA9ICczLjcuMCc7XG5cbiAgICAgICAgLyoqIFByZXNldCBvcHRpb25zICovXG4gICAgICAgIHZhciBvcHRpb25zID0gd2luZG93Lmh0bWw1IHx8IHt9O1xuXG4gICAgICAgIC8qKiBVc2VkIHRvIHNraXAgcHJvYmxlbSBlbGVtZW50cyAqL1xuICAgICAgICB2YXIgcmVTa2lwID0gL148fF4oPzpidXR0b258bWFwfHNlbGVjdHx0ZXh0YXJlYXxvYmplY3R8aWZyYW1lfG9wdGlvbnxvcHRncm91cCkkL2k7XG5cbiAgICAgICAgLyoqIE5vdCBhbGwgZWxlbWVudHMgY2FuIGJlIGNsb25lZCBpbiBJRSAqKi9cbiAgICAgICAgdmFyIHNhdmVDbG9uZXMgPSAvXig/OmF8Ynxjb2RlfGRpdnxmaWVsZHNldHxoMXxoMnxoM3xoNHxoNXxoNnxpfGxhYmVsfGxpfG9sfHB8cXxzcGFufHN0cm9uZ3xzdHlsZXx0YWJsZXx0Ym9keXx0ZHx0aHx0cnx1bCkkL2k7XG5cbiAgICAgICAgLyoqIERldGVjdCB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGRlZmF1bHQgaHRtbDUgc3R5bGVzICovXG4gICAgICAgIHZhciBzdXBwb3J0c0h0bWw1U3R5bGVzO1xuXG4gICAgICAgIC8qKiBOYW1lIG9mIHRoZSBleHBhbmRvLCB0byB3b3JrIHdpdGggbXVsdGlwbGUgZG9jdW1lbnRzIG9yIHRvIHJlLXNoaXYgb25lIGRvY3VtZW50ICovXG4gICAgICAgIHZhciBleHBhbmRvID0gJ19odG1sNXNoaXYnO1xuXG4gICAgICAgIC8qKiBUaGUgaWQgZm9yIHRoZSB0aGUgZG9jdW1lbnRzIGV4cGFuZG8gKi9cbiAgICAgICAgdmFyIGV4cGFuSUQgPSAwO1xuXG4gICAgICAgIC8qKiBDYWNoZWQgZGF0YSBmb3IgZWFjaCBkb2N1bWVudCAqL1xuICAgICAgICB2YXIgZXhwYW5kb0RhdGEgPSB7fTtcblxuICAgICAgICAvKiogRGV0ZWN0IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdW5rbm93biBlbGVtZW50cyAqL1xuICAgICAgICB2YXIgc3VwcG9ydHNVbmtub3duRWxlbWVudHM7XG5cbiAgICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGEuaW5uZXJIVE1MID0gJzx4eXo+PC94eXo+JztcbiAgICAgICAgICAgIC8vaWYgdGhlIGhpZGRlbiBwcm9wZXJ0eSBpcyBpbXBsZW1lbnRlZCB3ZSBjYW4gYXNzdW1lLCB0aGF0IHRoZSBicm93c2VyIHN1cHBvcnRzIGJhc2ljIEhUTUw1IFN0eWxlc1xuICAgICAgICAgICAgc3VwcG9ydHNIdG1sNVN0eWxlcyA9ICgnaGlkZGVuJyBpbiBhKTtcblxuICAgICAgICAgICAgc3VwcG9ydHNVbmtub3duRWxlbWVudHMgPSBhLmNoaWxkTm9kZXMubGVuZ3RoID09IDEgfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAvLyBhc3NpZ24gYSBmYWxzZSBwb3NpdGl2ZSBpZiB1bmFibGUgdG8gc2hpdlxuICAgICAgICAgICAgICAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCkoJ2EnKTtcbiAgICAgICAgICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgdHlwZW9mIGZyYWcuY2xvbmVOb2RlID09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICAgICAgdHlwZW9mIGZyYWcuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCA9PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICAgICAgICAgIHR5cGVvZiBmcmFnLmNyZWF0ZUVsZW1lbnQgPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0oKSk7XG4gICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAvLyBhc3NpZ24gYSBmYWxzZSBwb3NpdGl2ZSBpZiBkZXRlY3Rpb24gZmFpbHMgPT4gdW5hYmxlIHRvIHNoaXZcbiAgICAgICAgICAgIHN1cHBvcnRzSHRtbDVTdHlsZXMgPSB0cnVlO1xuICAgICAgICAgICAgc3VwcG9ydHNVbmtub3duRWxlbWVudHMgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICB9KCkpO1xuXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgc3R5bGUgc2hlZXQgd2l0aCB0aGUgZ2l2ZW4gQ1NTIHRleHQgYW5kIGFkZHMgaXQgdG8gdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGNzc1RleHQgVGhlIENTUyB0ZXh0LlxuICAgICAgICAgKiBAcmV0dXJucyB7U3R5bGVTaGVldH0gVGhlIHN0eWxlIGVsZW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBhZGRTdHlsZVNoZWV0KG93bmVyRG9jdW1lbnQsIGNzc1RleHQpIHtcbiAgICAgICAgICB2YXIgcCA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpLFxuICAgICAgICAgIHBhcmVudCA9IG93bmVyRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSB8fCBvd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgICAgIHAuaW5uZXJIVE1MID0gJ3g8c3R5bGU+JyArIGNzc1RleHQgKyAnPC9zdHlsZT4nO1xuICAgICAgICAgIHJldHVybiBwYXJlbnQuaW5zZXJ0QmVmb3JlKHAubGFzdENoaWxkLCBwYXJlbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgYGh0bWw1LmVsZW1lbnRzYCBhcyBhbiBhcnJheS5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5fSBBbiBhcnJheSBvZiBzaGl2ZWQgZWxlbWVudCBub2RlIG5hbWVzLlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0RWxlbWVudHMoKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnRzID0gaHRtbDUuZWxlbWVudHM7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBlbGVtZW50cyA9PSAnc3RyaW5nJyA/IGVsZW1lbnRzLnNwbGl0KCcgJykgOiBlbGVtZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBkYXRhIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIGRvY3VtZW50XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR9IG93bmVyRG9jdW1lbnQgVGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBvYmplY3Qgb2YgZGF0YS5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IGV4cGFuZG9EYXRhW293bmVyRG9jdW1lbnRbZXhwYW5kb11dO1xuICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZXhwYW5JRCsrO1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudFtleHBhbmRvXSA9IGV4cGFuSUQ7XG4gICAgICAgICAgICBleHBhbmRvRGF0YVtleHBhbklEXSA9IGRhdGE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgYSBzaGl2ZWQgZWxlbWVudCBmb3IgdGhlIGdpdmVuIG5vZGVOYW1lIGFuZCBkb2N1bWVudFxuICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5vZGVOYW1lIG5hbWUgb2YgdGhlIGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtIHtEb2N1bWVudH0gb3duZXJEb2N1bWVudCBUaGUgY29udGV4dCBkb2N1bWVudC5cbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gVGhlIHNoaXZlZCBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChub2RlTmFtZSwgb3duZXJEb2N1bWVudCwgZGF0YSl7XG4gICAgICAgICAgaWYgKCFvd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICBvd25lckRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzKXtcbiAgICAgICAgICAgIHJldHVybiBvd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEgPSBnZXRFeHBhbmRvRGF0YShvd25lckRvY3VtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIG5vZGU7XG5cbiAgICAgICAgICBpZiAoZGF0YS5jYWNoZVtub2RlTmFtZV0pIHtcbiAgICAgICAgICAgIG5vZGUgPSBkYXRhLmNhY2hlW25vZGVOYW1lXS5jbG9uZU5vZGUoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNhdmVDbG9uZXMudGVzdChub2RlTmFtZSkpIHtcbiAgICAgICAgICAgIG5vZGUgPSAoZGF0YS5jYWNoZVtub2RlTmFtZV0gPSBkYXRhLmNyZWF0ZUVsZW0obm9kZU5hbWUpKS5jbG9uZU5vZGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZSA9IGRhdGEuY3JlYXRlRWxlbShub2RlTmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXZvaWQgYWRkaW5nIHNvbWUgZWxlbWVudHMgdG8gZnJhZ21lbnRzIGluIElFIDwgOSBiZWNhdXNlXG4gICAgICAgICAgLy8gKiBBdHRyaWJ1dGVzIGxpa2UgYG5hbWVgIG9yIGB0eXBlYCBjYW5ub3QgYmUgc2V0L2NoYW5nZWQgb25jZSBhbiBlbGVtZW50XG4gICAgICAgICAgLy8gICBpcyBpbnNlcnRlZCBpbnRvIGEgZG9jdW1lbnQvZnJhZ21lbnRcbiAgICAgICAgICAvLyAqIExpbmsgZWxlbWVudHMgd2l0aCBgc3JjYCBhdHRyaWJ1dGVzIHRoYXQgYXJlIGluYWNjZXNzaWJsZSwgYXMgd2l0aFxuICAgICAgICAgIC8vICAgYSA0MDMgcmVzcG9uc2UsIHdpbGwgY2F1c2UgdGhlIHRhYi93aW5kb3cgdG8gY3Jhc2hcbiAgICAgICAgICAvLyAqIFNjcmlwdCBlbGVtZW50cyBhcHBlbmRlZCB0byBmcmFnbWVudHMgd2lsbCBleGVjdXRlIHdoZW4gdGhlaXIgYHNyY2BcbiAgICAgICAgICAvLyAgIG9yIGB0ZXh0YCBwcm9wZXJ0eSBpcyBzZXRcbiAgICAgICAgICByZXR1cm4gbm9kZS5jYW5IYXZlQ2hpbGRyZW4gJiYgIXJlU2tpcC50ZXN0KG5vZGVOYW1lKSAmJiAhbm9kZS50YWdVcm4gPyBkYXRhLmZyYWcuYXBwZW5kQ2hpbGQobm9kZSkgOiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgYSBzaGl2ZWQgRG9jdW1lbnRGcmFnbWVudCBmb3IgdGhlIGdpdmVuIGRvY3VtZW50XG4gICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBjb250ZXh0IGRvY3VtZW50LlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgc2hpdmVkIERvY3VtZW50RnJhZ21lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVEb2N1bWVudEZyYWdtZW50KG93bmVyRG9jdW1lbnQsIGRhdGEpe1xuICAgICAgICAgIGlmICghb3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZihzdXBwb3J0c1Vua25vd25FbGVtZW50cyl7XG4gICAgICAgICAgICByZXR1cm4gb3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhdGEgPSBkYXRhIHx8IGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpO1xuICAgICAgICAgIHZhciBjbG9uZSA9IGRhdGEuZnJhZy5jbG9uZU5vZGUoKSxcbiAgICAgICAgICBpID0gMCxcbiAgICAgICAgICBlbGVtcyA9IGdldEVsZW1lbnRzKCksXG4gICAgICAgICAgbCA9IGVsZW1zLmxlbmd0aDtcbiAgICAgICAgICBmb3IoO2k8bDtpKyspe1xuICAgICAgICAgICAgY2xvbmUuY3JlYXRlRWxlbWVudChlbGVtc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjbG9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaGl2cyB0aGUgYGNyZWF0ZUVsZW1lbnRgIGFuZCBgY3JlYXRlRG9jdW1lbnRGcmFnbWVudGAgbWV0aG9kcyBvZiB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR8RG9jdW1lbnRGcmFnbWVudH0gb3duZXJEb2N1bWVudCBUaGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIG9mIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHNoaXZNZXRob2RzKG93bmVyRG9jdW1lbnQsIGRhdGEpIHtcbiAgICAgICAgICBpZiAoIWRhdGEuY2FjaGUpIHtcbiAgICAgICAgICAgIGRhdGEuY2FjaGUgPSB7fTtcbiAgICAgICAgICAgIGRhdGEuY3JlYXRlRWxlbSA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudDtcbiAgICAgICAgICAgIGRhdGEuY3JlYXRlRnJhZyA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudDtcbiAgICAgICAgICAgIGRhdGEuZnJhZyA9IGRhdGEuY3JlYXRlRnJhZygpO1xuICAgICAgICAgIH1cblxuXG4gICAgICAgICAgb3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24obm9kZU5hbWUpIHtcbiAgICAgICAgICAgIC8vYWJvcnQgc2hpdlxuICAgICAgICAgICAgaWYgKCFodG1sNS5zaGl2TWV0aG9kcykge1xuICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jcmVhdGVFbGVtKG5vZGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50KG5vZGVOYW1lLCBvd25lckRvY3VtZW50LCBkYXRhKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgb3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50ID0gRnVuY3Rpb24oJ2gsZicsICdyZXR1cm4gZnVuY3Rpb24oKXsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFyIG49Zi5jbG9uZU5vZGUoKSxjPW4uY3JlYXRlRWxlbWVudDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaC5zaGl2TWV0aG9kcyYmKCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVucm9sbCB0aGUgYGNyZWF0ZUVsZW1lbnRgIGNhbGxzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RWxlbWVudHMoKS5qb2luKCkucmVwbGFjZSgvW1xcd1xcLV0rL2csIGZ1bmN0aW9uKG5vZGVOYW1lKSB7XG4gICAgICAgICAgICBkYXRhLmNyZWF0ZUVsZW0obm9kZU5hbWUpO1xuICAgICAgICAgICAgZGF0YS5mcmFnLmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuICdjKFwiJyArIG5vZGVOYW1lICsgJ1wiKSc7XG4gICAgICAgICAgfSkgK1xuICAgICAgICAgICAgJyk7cmV0dXJuIG59J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKShodG1sNSwgZGF0YS5mcmFnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaGl2cyB0aGUgZ2l2ZW4gZG9jdW1lbnQuXG4gICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBkb2N1bWVudCB0byBzaGl2LlxuICAgICAgICAgKiBAcmV0dXJucyB7RG9jdW1lbnR9IFRoZSBzaGl2ZWQgZG9jdW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBzaGl2RG9jdW1lbnQob3duZXJEb2N1bWVudCkge1xuICAgICAgICAgIGlmICghb3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgZGF0YSA9IGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpO1xuXG4gICAgICAgICAgaWYgKGh0bWw1LnNoaXZDU1MgJiYgIXN1cHBvcnRzSHRtbDVTdHlsZXMgJiYgIWRhdGEuaGFzQ1NTKSB7XG4gICAgICAgICAgICBkYXRhLmhhc0NTUyA9ICEhYWRkU3R5bGVTaGVldChvd25lckRvY3VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29ycmVjdHMgYmxvY2sgZGlzcGxheSBub3QgZGVmaW5lZCBpbiBJRTYvNy84LzlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhcnRpY2xlLGFzaWRlLGRpYWxvZyxmaWdjYXB0aW9uLGZpZ3VyZSxmb290ZXIsaGVhZGVyLGhncm91cCxtYWluLG5hdixzZWN0aW9ue2Rpc3BsYXk6YmxvY2t9JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZHMgc3R5bGluZyBub3QgcHJlc2VudCBpbiBJRTYvNy84LzlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21hcmt7YmFja2dyb3VuZDojRkYwO2NvbG9yOiMwMDB9JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhpZGVzIG5vbi1yZW5kZXJlZCBlbGVtZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGVtcGxhdGV7ZGlzcGxheTpub25lfSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFzdXBwb3J0c1Vua25vd25FbGVtZW50cykge1xuICAgICAgICAgICAgc2hpdk1ldGhvZHMob3duZXJEb2N1bWVudCwgZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBvd25lckRvY3VtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBgaHRtbDVgIG9iamVjdCBpcyBleHBvc2VkIHNvIHRoYXQgbW9yZSBlbGVtZW50cyBjYW4gYmUgc2hpdmVkIGFuZFxuICAgICAgICAgKiBleGlzdGluZyBzaGl2aW5nIGNhbiBiZSBkZXRlY3RlZCBvbiBpZnJhbWVzLlxuICAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogLy8gb3B0aW9ucyBjYW4gYmUgY2hhbmdlZCBiZWZvcmUgdGhlIHNjcmlwdCBpcyBpbmNsdWRlZFxuICAgICAgICAgKiBodG1sNSA9IHsgJ2VsZW1lbnRzJzogJ21hcmsgc2VjdGlvbicsICdzaGl2Q1NTJzogZmFsc2UsICdzaGl2TWV0aG9kcyc6IGZhbHNlIH07XG4gICAgICAgICAqL1xuICAgICAgICB2YXIgaHRtbDUgPSB7XG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBBbiBhcnJheSBvciBzcGFjZSBzZXBhcmF0ZWQgc3RyaW5nIG9mIG5vZGUgbmFtZXMgb2YgdGhlIGVsZW1lbnRzIHRvIHNoaXYuXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgQXJyYXl8U3RyaW5nXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ2VsZW1lbnRzJzogb3B0aW9ucy5lbGVtZW50cyB8fCAnYWJiciBhcnRpY2xlIGFzaWRlIGF1ZGlvIGJkaSBjYW52YXMgZGF0YSBkYXRhbGlzdCBkZXRhaWxzIGRpYWxvZyBmaWdjYXB0aW9uIGZpZ3VyZSBmb290ZXIgaGVhZGVyIGhncm91cCBtYWluIG1hcmsgbWV0ZXIgbmF2IG91dHB1dCBwcm9ncmVzcyBzZWN0aW9uIHN1bW1hcnkgdGVtcGxhdGUgdGltZSB2aWRlbycsXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBjdXJyZW50IHZlcnNpb24gb2YgaHRtbDVzaGl2XG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3ZlcnNpb24nOiB2ZXJzaW9uLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQSBmbGFnIHRvIGluZGljYXRlIHRoYXQgdGhlIEhUTUw1IHN0eWxlIHNoZWV0IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3NoaXZDU1MnOiAob3B0aW9ucy5zaGl2Q1NTICE9PSBmYWxzZSksXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBJcyBlcXVhbCB0byB0cnVlIGlmIGEgYnJvd3NlciBzdXBwb3J0cyBjcmVhdGluZyB1bmtub3duL0hUTUw1IGVsZW1lbnRzXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgICAqL1xuICAgICAgICAgICdzdXBwb3J0c1Vua25vd25FbGVtZW50cyc6IHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQSBmbGFnIHRvIGluZGljYXRlIHRoYXQgdGhlIGRvY3VtZW50J3MgYGNyZWF0ZUVsZW1lbnRgIGFuZCBgY3JlYXRlRG9jdW1lbnRGcmFnbWVudGBcbiAgICAgICAgICAgKiBtZXRob2RzIHNob3VsZCBiZSBvdmVyd3JpdHRlbi5cbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3NoaXZNZXRob2RzJzogKG9wdGlvbnMuc2hpdk1ldGhvZHMgIT09IGZhbHNlKSxcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEEgc3RyaW5nIHRvIGRlc2NyaWJlIHRoZSB0eXBlIG9mIGBodG1sNWAgb2JqZWN0IChcImRlZmF1bHRcIiBvciBcImRlZmF1bHQgcHJpbnRcIikuXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3R5cGUnOiAnZGVmYXVsdCcsXG5cbiAgICAgICAgICAvLyBzaGl2cyB0aGUgZG9jdW1lbnQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQgYGh0bWw1YCBvYmplY3Qgb3B0aW9uc1xuICAgICAgICAgICdzaGl2RG9jdW1lbnQnOiBzaGl2RG9jdW1lbnQsXG5cbiAgICAgICAgICAvL2NyZWF0ZXMgYSBzaGl2ZWQgZWxlbWVudFxuICAgICAgICAgIGNyZWF0ZUVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnQsXG5cbiAgICAgICAgICAvL2NyZWF0ZXMgYSBzaGl2ZWQgZG9jdW1lbnRGcmFnbWVudFxuICAgICAgICAgIGNyZWF0ZURvY3VtZW50RnJhZ21lbnQ6IGNyZWF0ZURvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgfTtcblxuICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgICAgICAvLyBleHBvc2UgaHRtbDVcbiAgICAgICAgd2luZG93Lmh0bWw1ID0gaHRtbDU7XG5cbiAgICAgICAgLy8gc2hpdiB0aGUgZG9jdW1lbnRcbiAgICAgICAgc2hpdkRvY3VtZW50KGRvY3VtZW50KTtcblxuICAgIH0odGhpcywgZG9jdW1lbnQpKTtcbiAgICAvKj4+c2hpdiovXG5cbiAgICAvLyBBc3NpZ24gcHJpdmF0ZSBwcm9wZXJ0aWVzIHRvIHRoZSByZXR1cm4gb2JqZWN0IHdpdGggcHJlZml4XG4gICAgTW9kZXJuaXpyLl92ZXJzaW9uICAgICAgPSB2ZXJzaW9uO1xuXG4gICAgLy8gZXhwb3NlIHRoZXNlIGZvciB0aGUgcGx1Z2luIEFQSS4gTG9vayBpbiB0aGUgc291cmNlIGZvciBob3cgdG8gam9pbigpIHRoZW0gYWdhaW5zdCB5b3VyIGlucHV0XG4gICAgLyo+PnByZWZpeGVzKi9cbiAgICBNb2Rlcm5penIuX3ByZWZpeGVzICAgICA9IHByZWZpeGVzO1xuICAgIC8qPj5wcmVmaXhlcyovXG4gICAgLyo+PmRvbXByZWZpeGVzKi9cbiAgICBNb2Rlcm5penIuX2RvbVByZWZpeGVzICA9IGRvbVByZWZpeGVzO1xuICAgIE1vZGVybml6ci5fY3Nzb21QcmVmaXhlcyAgPSBjc3NvbVByZWZpeGVzO1xuICAgIC8qPj5kb21wcmVmaXhlcyovXG5cbiAgICAvKj4+bXEqL1xuICAgIC8vIE1vZGVybml6ci5tcSB0ZXN0cyBhIGdpdmVuIG1lZGlhIHF1ZXJ5LCBsaXZlIGFnYWluc3QgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHdpbmRvd1xuICAgIC8vIEEgZmV3IGltcG9ydGFudCBub3RlczpcbiAgICAvLyAgICogSWYgYSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgbWVkaWEgcXVlcmllcyBhdCBhbGwgKGVnLiBvbGRJRSkgdGhlIG1xKCkgd2lsbCBhbHdheXMgcmV0dXJuIGZhbHNlXG4gICAgLy8gICAqIEEgbWF4LXdpZHRoIG9yIG9yaWVudGF0aW9uIHF1ZXJ5IHdpbGwgYmUgZXZhbHVhdGVkIGFnYWluc3QgdGhlIGN1cnJlbnQgc3RhdGUsIHdoaWNoIG1heSBjaGFuZ2UgbGF0ZXIuXG4gICAgLy8gICAqIFlvdSBtdXN0IHNwZWNpZnkgdmFsdWVzLiBFZy4gSWYgeW91IGFyZSB0ZXN0aW5nIHN1cHBvcnQgZm9yIHRoZSBtaW4td2lkdGggbWVkaWEgcXVlcnkgdXNlOlxuICAgIC8vICAgICAgIE1vZGVybml6ci5tcSgnKG1pbi13aWR0aDowKScpXG4gICAgLy8gdXNhZ2U6XG4gICAgLy8gTW9kZXJuaXpyLm1xKCdvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDo3NjgpJylcbiAgICBNb2Rlcm5penIubXEgICAgICAgICAgICA9IHRlc3RNZWRpYVF1ZXJ5O1xuICAgIC8qPj5tcSovXG5cbiAgICAvKj4+aGFzZXZlbnQqL1xuICAgIC8vIE1vZGVybml6ci5oYXNFdmVudCgpIGRldGVjdHMgc3VwcG9ydCBmb3IgYSBnaXZlbiBldmVudCwgd2l0aCBhbiBvcHRpb25hbCBlbGVtZW50IHRvIHRlc3Qgb25cbiAgICAvLyBNb2Rlcm5penIuaGFzRXZlbnQoJ2dlc3R1cmVzdGFydCcsIGVsZW0pXG4gICAgTW9kZXJuaXpyLmhhc0V2ZW50ICAgICAgPSBpc0V2ZW50U3VwcG9ydGVkO1xuICAgIC8qPj5oYXNldmVudCovXG5cbiAgICAvKj4+dGVzdHByb3AqL1xuICAgIC8vIE1vZGVybml6ci50ZXN0UHJvcCgpIGludmVzdGlnYXRlcyB3aGV0aGVyIGEgZ2l2ZW4gc3R5bGUgcHJvcGVydHkgaXMgcmVjb2duaXplZFxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcHJvcGVydHkgbmFtZXMgbXVzdCBiZSBwcm92aWRlZCBpbiB0aGUgY2FtZWxDYXNlIHZhcmlhbnQuXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RQcm9wKCdwb2ludGVyRXZlbnRzJylcbiAgICBNb2Rlcm5penIudGVzdFByb3AgICAgICA9IGZ1bmN0aW9uKHByb3Ape1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzKFtwcm9wXSk7XG4gICAgfTtcbiAgICAvKj4+dGVzdHByb3AqL1xuXG4gICAgLyo+PnRlc3RhbGxwcm9wcyovXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RBbGxQcm9wcygpIGludmVzdGlnYXRlcyB3aGV0aGVyIGEgZ2l2ZW4gc3R5bGUgcHJvcGVydHksXG4gICAgLy8gICBvciBhbnkgb2YgaXRzIHZlbmRvci1wcmVmaXhlZCB2YXJpYW50cywgaXMgcmVjb2duaXplZFxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcHJvcGVydHkgbmFtZXMgbXVzdCBiZSBwcm92aWRlZCBpbiB0aGUgY2FtZWxDYXNlIHZhcmlhbnQuXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RBbGxQcm9wcygnYm94U2l6aW5nJylcbiAgICBNb2Rlcm5penIudGVzdEFsbFByb3BzICA9IHRlc3RQcm9wc0FsbDtcbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cblxuXG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuICAgIC8vIE1vZGVybml6ci50ZXN0U3R5bGVzKCkgYWxsb3dzIHlvdSB0byBhZGQgY3VzdG9tIHN0eWxlcyB0byB0aGUgZG9jdW1lbnQgYW5kIHRlc3QgYW4gZWxlbWVudCBhZnRlcndhcmRzXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RTdHlsZXMoJyNtb2Rlcm5penIgeyBwb3NpdGlvbjphYnNvbHV0ZSB9JywgZnVuY3Rpb24oZWxlbSwgcnVsZSl7IC4uLiB9KVxuICAgIE1vZGVybml6ci50ZXN0U3R5bGVzICAgID0gaW5qZWN0RWxlbWVudFdpdGhTdHlsZXM7XG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuXG5cbiAgICAvKj4+cHJlZml4ZWQqL1xuICAgIC8vIE1vZGVybml6ci5wcmVmaXhlZCgpIHJldHVybnMgdGhlIHByZWZpeGVkIG9yIG5vbnByZWZpeGVkIHByb3BlcnR5IG5hbWUgdmFyaWFudCBvZiB5b3VyIGlucHV0XG4gICAgLy8gTW9kZXJuaXpyLnByZWZpeGVkKCdib3hTaXppbmcnKSAvLyAnTW96Qm94U2l6aW5nJ1xuXG4gICAgLy8gUHJvcGVydGllcyBtdXN0IGJlIHBhc3NlZCBhcyBkb20tc3R5bGUgY2FtZWxjYXNlLCByYXRoZXIgdGhhbiBgYm94LXNpemluZ2AgaHlwZW50YXRlZCBzdHlsZS5cbiAgICAvLyBSZXR1cm4gdmFsdWVzIHdpbGwgYWxzbyBiZSB0aGUgY2FtZWxDYXNlIHZhcmlhbnQsIGlmIHlvdSBuZWVkIHRvIHRyYW5zbGF0ZSB0aGF0IHRvIGh5cGVuYXRlZCBzdHlsZSB1c2U6XG4gICAgLy9cbiAgICAvLyAgICAgc3RyLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oc3RyLG0xKXsgcmV0dXJuICctJyArIG0xLnRvTG93ZXJDYXNlKCk7IH0pLnJlcGxhY2UoL15tcy0vLCctbXMtJyk7XG5cbiAgICAvLyBJZiB5b3UncmUgdHJ5aW5nIHRvIGFzY2VydGFpbiB3aGljaCB0cmFuc2l0aW9uIGVuZCBldmVudCB0byBiaW5kIHRvLCB5b3UgbWlnaHQgZG8gc29tZXRoaW5nIGxpa2UuLi5cbiAgICAvL1xuICAgIC8vICAgICB2YXIgdHJhbnNFbmRFdmVudE5hbWVzID0ge1xuICAgIC8vICAgICAgICdXZWJraXRUcmFuc2l0aW9uJyA6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAnTW96VHJhbnNpdGlvbicgICAgOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgLy8gICAgICAgJ09UcmFuc2l0aW9uJyAgICAgIDogJ29UcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAnbXNUcmFuc2l0aW9uJyAgICAgOiAnTVNUcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAndHJhbnNpdGlvbicgICAgICAgOiAndHJhbnNpdGlvbmVuZCdcbiAgICAvLyAgICAgfSxcbiAgICAvLyAgICAgdHJhbnNFbmRFdmVudE5hbWUgPSB0cmFuc0VuZEV2ZW50TmFtZXNbIE1vZGVybml6ci5wcmVmaXhlZCgndHJhbnNpdGlvbicpIF07XG5cbiAgICBNb2Rlcm5penIucHJlZml4ZWQgICAgICA9IGZ1bmN0aW9uKHByb3AsIG9iaiwgZWxlbSl7XG4gICAgICBpZighb2JqKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwocHJvcCwgJ3BmeCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGVzdGluZyBET00gcHJvcGVydHkgZS5nLiBNb2Rlcm5penIucHJlZml4ZWQoJ3JlcXVlc3RBbmltYXRpb25GcmFtZScsIHdpbmRvdykgLy8gJ21velJlcXVlc3RBbmltYXRpb25GcmFtZSdcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbChwcm9wLCBvYmosIGVsZW0pO1xuICAgICAgfVxuICAgIH07XG4gICAgLyo+PnByZWZpeGVkKi9cblxuXG4gICAgLyo+PmNzc2NsYXNzZXMqL1xuICAgIC8vIFJlbW92ZSBcIm5vLWpzXCIgY2xhc3MgZnJvbSA8aHRtbD4gZWxlbWVudCwgaWYgaXQgZXhpc3RzOlxuICAgIGRvY0VsZW1lbnQuY2xhc3NOYW1lID0gZG9jRWxlbWVudC5jbGFzc05hbWUucmVwbGFjZSgvKF58XFxzKW5vLWpzKFxcc3wkKS8sICckMSQyJykgK1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBuZXcgY2xhc3NlcyB0byB0aGUgPGh0bWw+IGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVuYWJsZUNsYXNzZXMgPyAnIGpzICcgKyBjbGFzc2VzLmpvaW4oJyAnKSA6ICcnKTtcbiAgICAvKj4+Y3NzY2xhc3NlcyovXG5cbiAgICByZXR1cm4gTW9kZXJuaXpyO1xuXG59KSh0aGlzLCB0aGlzLmRvY3VtZW50KTtcbiIsIi8qXG4gKiBqUXVlcnkgRmxleFNsaWRlciB2Mi4yLjJcbiAqIENvcHlyaWdodCAyMDEyIFdvb1RoZW1lc1xuICogQ29udHJpYnV0aW5nIEF1dGhvcjogVHlsZXIgU21pdGhcbiAqL1xuO1xuKGZ1bmN0aW9uICgkKSB7XG5cbiAgLy9GbGV4U2xpZGVyOiBPYmplY3QgSW5zdGFuY2VcbiAgJC5mbGV4c2xpZGVyID0gZnVuY3Rpb24oZWwsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2xpZGVyID0gJChlbCk7XG5cbiAgICAvLyBtYWtpbmcgdmFyaWFibGVzIHB1YmxpY1xuICAgIHNsaWRlci52YXJzID0gJC5leHRlbmQoe30sICQuZmxleHNsaWRlci5kZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICB2YXIgbmFtZXNwYWNlID0gc2xpZGVyLnZhcnMubmFtZXNwYWNlLFxuICAgICAgICBtc0dlc3R1cmUgPSB3aW5kb3cubmF2aWdhdG9yICYmIHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCAmJiB3aW5kb3cuTVNHZXN0dXJlLFxuICAgICAgICB0b3VjaCA9ICgoIFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93ICkgfHwgbXNHZXN0dXJlIHx8IHdpbmRvdy5Eb2N1bWVudFRvdWNoICYmIGRvY3VtZW50IGluc3RhbmNlb2YgRG9jdW1lbnRUb3VjaCkgJiYgc2xpZGVyLnZhcnMudG91Y2gsXG4gICAgICAgIC8vIGRlcHJpY2F0aW5nIHRoaXMgaWRlYSwgYXMgZGV2aWNlcyBhcmUgYmVpbmcgcmVsZWFzZWQgd2l0aCBib3RoIG9mIHRoZXNlIGV2ZW50c1xuICAgICAgICAvL2V2ZW50VHlwZSA9ICh0b3VjaCkgPyBcInRvdWNoZW5kXCIgOiBcImNsaWNrXCIsXG4gICAgICAgIGV2ZW50VHlwZSA9IFwiY2xpY2sgdG91Y2hlbmQgTVNQb2ludGVyVXBcIixcbiAgICAgICAgd2F0Y2hlZEV2ZW50ID0gXCJcIixcbiAgICAgICAgd2F0Y2hlZEV2ZW50Q2xlYXJUaW1lcixcbiAgICAgICAgdmVydGljYWwgPSBzbGlkZXIudmFycy5kaXJlY3Rpb24gPT09IFwidmVydGljYWxcIixcbiAgICAgICAgcmV2ZXJzZSA9IHNsaWRlci52YXJzLnJldmVyc2UsXG4gICAgICAgIGNhcm91c2VsID0gKHNsaWRlci52YXJzLml0ZW1XaWR0aCA+IDApLFxuICAgICAgICBmYWRlID0gc2xpZGVyLnZhcnMuYW5pbWF0aW9uID09PSBcImZhZGVcIixcbiAgICAgICAgYXNOYXYgPSBzbGlkZXIudmFycy5hc05hdkZvciAhPT0gXCJcIixcbiAgICAgICAgbWV0aG9kcyA9IHt9LFxuICAgICAgICBmb2N1c2VkID0gdHJ1ZTtcblxuICAgIC8vIFN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBzbGlkZXIgb2JqZWN0XG4gICAgJC5kYXRhKGVsLCBcImZsZXhzbGlkZXJcIiwgc2xpZGVyKTtcblxuICAgIC8vIFByaXZhdGUgc2xpZGVyIG1ldGhvZHNcbiAgICBtZXRob2RzID0ge1xuICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHNsaWRlci5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgLy8gR2V0IGN1cnJlbnQgc2xpZGUgYW5kIG1ha2Ugc3VyZSBpdCBpcyBhIG51bWJlclxuICAgICAgICBzbGlkZXIuY3VycmVudFNsaWRlID0gcGFyc2VJbnQoICggc2xpZGVyLnZhcnMuc3RhcnRBdCA/IHNsaWRlci52YXJzLnN0YXJ0QXQgOiAwKSwgMTAgKTtcbiAgICAgICAgaWYgKCBpc05hTiggc2xpZGVyLmN1cnJlbnRTbGlkZSApICkgc2xpZGVyLmN1cnJlbnRTbGlkZSA9IDA7XG4gICAgICAgIHNsaWRlci5hbmltYXRpbmdUbyA9IHNsaWRlci5jdXJyZW50U2xpZGU7XG4gICAgICAgIHNsaWRlci5hdEVuZCA9IChzbGlkZXIuY3VycmVudFNsaWRlID09PSAwIHx8IHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0KTtcbiAgICAgICAgc2xpZGVyLmNvbnRhaW5lclNlbGVjdG9yID0gc2xpZGVyLnZhcnMuc2VsZWN0b3Iuc3Vic3RyKDAsc2xpZGVyLnZhcnMuc2VsZWN0b3Iuc2VhcmNoKCcgJykpO1xuICAgICAgICBzbGlkZXIuc2xpZGVzID0gJChzbGlkZXIudmFycy5zZWxlY3Rvciwgc2xpZGVyKTtcbiAgICAgICAgc2xpZGVyLmNvbnRhaW5lciA9ICQoc2xpZGVyLmNvbnRhaW5lclNlbGVjdG9yLCBzbGlkZXIpO1xuICAgICAgICBzbGlkZXIuY291bnQgPSBzbGlkZXIuc2xpZGVzLmxlbmd0aDtcbiAgICAgICAgLy8gU1lOQzpcbiAgICAgICAgc2xpZGVyLnN5bmNFeGlzdHMgPSAkKHNsaWRlci52YXJzLnN5bmMpLmxlbmd0aCA+IDA7XG4gICAgICAgIC8vIFNMSURFOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuYW5pbWF0aW9uID09PSBcInNsaWRlXCIpIHNsaWRlci52YXJzLmFuaW1hdGlvbiA9IFwic3dpbmdcIjtcbiAgICAgICAgc2xpZGVyLnByb3AgPSAodmVydGljYWwpID8gXCJ0b3BcIiA6IFwibWFyZ2luTGVmdFwiO1xuICAgICAgICBzbGlkZXIuYXJncyA9IHt9O1xuICAgICAgICAvLyBTTElERVNIT1c6XG4gICAgICAgIHNsaWRlci5tYW51YWxQYXVzZSA9IGZhbHNlO1xuICAgICAgICBzbGlkZXIuc3RvcHBlZCA9IGZhbHNlO1xuICAgICAgICAvL1BBVVNFIFdIRU4gSU5WSVNJQkxFXG4gICAgICAgIHNsaWRlci5zdGFydGVkID0gZmFsc2U7XG4gICAgICAgIHNsaWRlci5zdGFydFRpbWVvdXQgPSBudWxsO1xuICAgICAgICAvLyBUT1VDSC9VU0VDU1M6XG4gICAgICAgIHNsaWRlci50cmFuc2l0aW9ucyA9ICFzbGlkZXIudmFycy52aWRlbyAmJiAhZmFkZSAmJiBzbGlkZXIudmFycy51c2VDU1MgJiYgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBvYmogPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgICAgICAgcHJvcHMgPSBbJ3BlcnNwZWN0aXZlUHJvcGVydHknLCAnV2Via2l0UGVyc3BlY3RpdmUnLCAnTW96UGVyc3BlY3RpdmUnLCAnT1BlcnNwZWN0aXZlJywgJ21zUGVyc3BlY3RpdmUnXTtcbiAgICAgICAgICBmb3IgKHZhciBpIGluIHByb3BzKSB7XG4gICAgICAgICAgICBpZiAoIG9iai5zdHlsZVsgcHJvcHNbaV0gXSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICBzbGlkZXIucGZ4ID0gcHJvcHNbaV0ucmVwbGFjZSgnUGVyc3BlY3RpdmUnLCcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICBzbGlkZXIucHJvcCA9IFwiLVwiICsgc2xpZGVyLnBmeCArIFwiLXRyYW5zZm9ybVwiO1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KCkpO1xuICAgICAgICAvLyBDT05UUk9MU0NPTlRBSU5FUjpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmNvbnRyb2xzQ29udGFpbmVyICE9PSBcIlwiKSBzbGlkZXIuY29udHJvbHNDb250YWluZXIgPSAkKHNsaWRlci52YXJzLmNvbnRyb2xzQ29udGFpbmVyKS5sZW5ndGggPiAwICYmICQoc2xpZGVyLnZhcnMuY29udHJvbHNDb250YWluZXIpO1xuICAgICAgICAvLyBNQU5VQUw6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5tYW51YWxDb250cm9scyAhPT0gXCJcIikgc2xpZGVyLm1hbnVhbENvbnRyb2xzID0gJChzbGlkZXIudmFycy5tYW51YWxDb250cm9scykubGVuZ3RoID4gMCAmJiAkKHNsaWRlci52YXJzLm1hbnVhbENvbnRyb2xzKTtcblxuICAgICAgICAvLyBSQU5ET01JWkU6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5yYW5kb21pemUpIHtcbiAgICAgICAgICBzbGlkZXIuc2xpZGVzLnNvcnQoZnVuY3Rpb24oKSB7IHJldHVybiAoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKS0wLjUpOyB9KTtcbiAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLmVtcHR5KCkuYXBwZW5kKHNsaWRlci5zbGlkZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuXG4gICAgICAgIC8vIElOSVRcbiAgICAgICAgc2xpZGVyLnNldHVwKFwiaW5pdFwiKTtcblxuICAgICAgICAvLyBDT05UUk9MTkFWOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuY29udHJvbE5hdikgbWV0aG9kcy5jb250cm9sTmF2LnNldHVwKCk7XG5cbiAgICAgICAgLy8gRElSRUNUSU9OTkFWOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuZGlyZWN0aW9uTmF2KSBtZXRob2RzLmRpcmVjdGlvbk5hdi5zZXR1cCgpO1xuXG4gICAgICAgIC8vIEtFWUJPQVJEOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMua2V5Ym9hcmQgJiYgKCQoc2xpZGVyLmNvbnRhaW5lclNlbGVjdG9yKS5sZW5ndGggPT09IDEgfHwgc2xpZGVyLnZhcnMubXVsdGlwbGVLZXlib2FyZCkpIHtcbiAgICAgICAgICAkKGRvY3VtZW50KS5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIga2V5Y29kZSA9IGV2ZW50LmtleUNvZGU7XG4gICAgICAgICAgICBpZiAoIXNsaWRlci5hbmltYXRpbmcgJiYgKGtleWNvZGUgPT09IDM5IHx8IGtleWNvZGUgPT09IDM3KSkge1xuICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gKGtleWNvZGUgPT09IDM5KSA/IHNsaWRlci5nZXRUYXJnZXQoJ25leHQnKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAoa2V5Y29kZSA9PT0gMzcpID8gc2xpZGVyLmdldFRhcmdldCgncHJldicpIDogZmFsc2U7XG4gICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIE1PVVNFV0hFRUw6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5tb3VzZXdoZWVsKSB7XG4gICAgICAgICAgc2xpZGVyLmJpbmQoJ21vdXNld2hlZWwnLCBmdW5jdGlvbihldmVudCwgZGVsdGEsIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IChkZWx0YSA8IDApID8gc2xpZGVyLmdldFRhcmdldCgnbmV4dCcpIDogc2xpZGVyLmdldFRhcmdldCgncHJldicpO1xuICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQQVVTRVBMQVlcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLnBhdXNlUGxheSkgbWV0aG9kcy5wYXVzZVBsYXkuc2V0dXAoKTtcblxuICAgICAgICAvL1BBVVNFIFdIRU4gSU5WSVNJQkxFXG4gICAgICAgIGlmIChzbGlkZXIudmFycy5zbGlkZXNob3cgJiYgc2xpZGVyLnZhcnMucGF1c2VJbnZpc2libGUpIG1ldGhvZHMucGF1c2VJbnZpc2libGUuaW5pdCgpO1xuXG4gICAgICAgIC8vIFNMSURTRVNIT1dcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLnNsaWRlc2hvdykge1xuICAgICAgICAgIGlmIChzbGlkZXIudmFycy5wYXVzZU9uSG92ZXIpIHtcbiAgICAgICAgICAgIHNsaWRlci5ob3ZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKCFzbGlkZXIubWFudWFsUGxheSAmJiAhc2xpZGVyLm1hbnVhbFBhdXNlKSBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAoIXNsaWRlci5tYW51YWxQYXVzZSAmJiAhc2xpZGVyLm1hbnVhbFBsYXkgJiYgIXNsaWRlci5zdG9wcGVkKSBzbGlkZXIucGxheSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGluaXRpYWxpemUgYW5pbWF0aW9uXG4gICAgICAgICAgLy9JZiB3ZSdyZSB2aXNpYmxlLCBvciB3ZSBkb24ndCB1c2UgUGFnZVZpc2liaWxpdHkgQVBJXG4gICAgICAgICAgaWYoIXNsaWRlci52YXJzLnBhdXNlSW52aXNpYmxlIHx8ICFtZXRob2RzLnBhdXNlSW52aXNpYmxlLmlzSGlkZGVuKCkpIHtcbiAgICAgICAgICAgIChzbGlkZXIudmFycy5pbml0RGVsYXkgPiAwKSA/IHNsaWRlci5zdGFydFRpbWVvdXQgPSBzZXRUaW1lb3V0KHNsaWRlci5wbGF5LCBzbGlkZXIudmFycy5pbml0RGVsYXkpIDogc2xpZGVyLnBsYXkoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBU05BVjpcbiAgICAgICAgaWYgKGFzTmF2KSBtZXRob2RzLmFzTmF2LnNldHVwKCk7XG5cbiAgICAgICAgLy8gVE9VQ0hcbiAgICAgICAgaWYgKHRvdWNoICYmIHNsaWRlci52YXJzLnRvdWNoKSBtZXRob2RzLnRvdWNoKCk7XG5cbiAgICAgICAgLy8gRkFERSYmU01PT1RISEVJR0hUIHx8IFNMSURFOlxuICAgICAgICBpZiAoIWZhZGUgfHwgKGZhZGUgJiYgc2xpZGVyLnZhcnMuc21vb3RoSGVpZ2h0KSkgJCh3aW5kb3cpLmJpbmQoXCJyZXNpemUgb3JpZW50YXRpb25jaGFuZ2UgZm9jdXNcIiwgbWV0aG9kcy5yZXNpemUpO1xuXG4gICAgICAgIHNsaWRlci5maW5kKFwiaW1nXCIpLmF0dHIoXCJkcmFnZ2FibGVcIiwgXCJmYWxzZVwiKTtcblxuICAgICAgICAvLyBBUEk6IHN0YXJ0KCkgQ2FsbGJhY2tcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIHNsaWRlci52YXJzLnN0YXJ0KHNsaWRlcik7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9LFxuICAgICAgYXNOYXY6IHtcbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNsaWRlci5hc05hdiA9IHRydWU7XG4gICAgICAgICAgc2xpZGVyLmFuaW1hdGluZ1RvID0gTWF0aC5mbG9vcihzbGlkZXIuY3VycmVudFNsaWRlL3NsaWRlci5tb3ZlKTtcbiAgICAgICAgICBzbGlkZXIuY3VycmVudEl0ZW0gPSBzbGlkZXIuY3VycmVudFNsaWRlO1xuICAgICAgICAgIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEoc2xpZGVyLmN1cnJlbnRJdGVtKS5hZGRDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKTtcbiAgICAgICAgICBpZighbXNHZXN0dXJlKXtcbiAgICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5vbihldmVudFR5cGUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgJHNsaWRlID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gJHNsaWRlLmluZGV4KCk7XG4gICAgICAgICAgICAgICAgdmFyIHBvc0Zyb21MZWZ0ID0gJHNsaWRlLm9mZnNldCgpLmxlZnQgLSAkKHNsaWRlcikuc2Nyb2xsTGVmdCgpOyAvLyBGaW5kIHBvc2l0aW9uIG9mIHNsaWRlIHJlbGF0aXZlIHRvIGxlZnQgb2Ygc2xpZGVyIGNvbnRhaW5lclxuICAgICAgICAgICAgICAgIGlmKCBwb3NGcm9tTGVmdCA8PSAwICYmICRzbGlkZS5oYXNDbGFzcyggbmFtZXNwYWNlICsgJ2FjdGl2ZS1zbGlkZScgKSApIHtcbiAgICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZShzbGlkZXIuZ2V0VGFyZ2V0KFwicHJldlwiKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghJChzbGlkZXIudmFycy5hc05hdkZvcikuZGF0YSgnZmxleHNsaWRlcicpLmFuaW1hdGluZyAmJiAhJHNsaWRlLmhhc0NsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpKSB7XG4gICAgICAgICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uID0gKHNsaWRlci5jdXJyZW50SXRlbSA8IHRhcmdldCkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbiwgZmFsc2UsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIGVsLl9zbGlkZXIgPSBzbGlkZXI7XG4gICAgICAgICAgICAgIHNsaWRlci5zbGlkZXMuZWFjaChmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgIHRoYXQuX2dlc3R1cmUgPSBuZXcgTVNHZXN0dXJlKCk7XG4gICAgICAgICAgICAgICAgICB0aGF0Ll9nZXN0dXJlLnRhcmdldCA9IHRoYXQ7XG4gICAgICAgICAgICAgICAgICB0aGF0LmFkZEV2ZW50TGlzdGVuZXIoXCJNU1BvaW50ZXJEb3duXCIsIGZ1bmN0aW9uIChlKXtcbiAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoZS5jdXJyZW50VGFyZ2V0Ll9nZXN0dXJlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuX2dlc3R1cmUuYWRkUG9pbnRlcihlLnBvaW50ZXJJZCk7XG4gICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICB0aGF0LmFkZEV2ZW50TGlzdGVuZXIoXCJNU0dlc3R1cmVUYXBcIiwgZnVuY3Rpb24gKGUpe1xuICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNsaWRlID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gJHNsaWRlLmluZGV4KCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCEkKHNsaWRlci52YXJzLmFzTmF2Rm9yKS5kYXRhKCdmbGV4c2xpZGVyJykuYW5pbWF0aW5nICYmICEkc2xpZGUuaGFzQ2xhc3MoJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb24gPSAoc2xpZGVyLmN1cnJlbnRJdGVtIDwgdGFyZ2V0KSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIGZhbHNlLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY29udHJvbE5hdjoge1xuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCFzbGlkZXIubWFudWFsQ29udHJvbHMpIHtcbiAgICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi5zZXR1cFBhZ2luZygpO1xuICAgICAgICAgIH0gZWxzZSB7IC8vIE1BTlVBTENPTlRST0xTOlxuICAgICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LnNldHVwTWFudWFsKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXR1cFBhZ2luZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHR5cGUgPSAoc2xpZGVyLnZhcnMuY29udHJvbE5hdiA9PT0gXCJ0aHVtYm5haWxzXCIpID8gJ2NvbnRyb2wtdGh1bWJzJyA6ICdjb250cm9sLXBhZ2luZycsXG4gICAgICAgICAgICAgIGogPSAxLFxuICAgICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgICBzbGlkZTtcblxuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQgPSAkKCc8b2wgY2xhc3M9XCInKyBuYW1lc3BhY2UgKyAnY29udHJvbC1uYXYgJyArIG5hbWVzcGFjZSArIHR5cGUgKyAnXCI+PC9vbD4nKTtcblxuICAgICAgICAgIGlmIChzbGlkZXIucGFnaW5nQ291bnQgPiAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWRlci5wYWdpbmdDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgIHNsaWRlID0gc2xpZGVyLnNsaWRlcy5lcShpKTtcbiAgICAgICAgICAgICAgaXRlbSA9IChzbGlkZXIudmFycy5jb250cm9sTmF2ID09PSBcInRodW1ibmFpbHNcIikgPyAnPGltZyBzcmM9XCInICsgc2xpZGUuYXR0ciggJ2RhdGEtdGh1bWInICkgKyAnXCIvPicgOiAnPGE+JyArIGogKyAnPC9hPic7XG4gICAgICAgICAgICAgIGlmICggJ3RodW1ibmFpbHMnID09PSBzbGlkZXIudmFycy5jb250cm9sTmF2ICYmIHRydWUgPT09IHNsaWRlci52YXJzLnRodW1iQ2FwdGlvbnMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhcHRuID0gc2xpZGUuYXR0ciggJ2RhdGEtdGh1bWJjYXB0aW9uJyApO1xuICAgICAgICAgICAgICAgIGlmICggJycgIT0gY2FwdG4gJiYgdW5kZWZpbmVkICE9IGNhcHRuICkgaXRlbSArPSAnPHNwYW4gY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ2NhcHRpb25cIj4nICsgY2FwdG4gKyAnPC9zcGFuPic7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXZTY2FmZm9sZC5hcHBlbmQoJzxsaT4nICsgaXRlbSArICc8L2xpPicpO1xuICAgICAgICAgICAgICBqKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ09OVFJPTFNDT05UQUlORVI6XG4gICAgICAgICAgKHNsaWRlci5jb250cm9sc0NvbnRhaW5lcikgPyAkKHNsaWRlci5jb250cm9sc0NvbnRhaW5lcikuYXBwZW5kKHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQpIDogc2xpZGVyLmFwcGVuZChzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkKTtcbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYuc2V0KCk7XG5cbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYuYWN0aXZlKCk7XG5cbiAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkLmRlbGVnYXRlKCdhLCBpbWcnLCBldmVudFR5cGUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiIHx8IHdhdGNoZWRFdmVudCA9PT0gZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gc2xpZGVyLmNvbnRyb2xOYXYuaW5kZXgoJHRoaXMpO1xuXG4gICAgICAgICAgICAgIGlmICghJHRoaXMuaGFzQ2xhc3MobmFtZXNwYWNlICsgJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9ICh0YXJnZXQgPiBzbGlkZXIuY3VycmVudFNsaWRlKSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2V0dXAgZmxhZ3MgdG8gcHJldmVudCBldmVudCBkdXBsaWNhdGlvblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBldmVudC50eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWV0aG9kcy5zZXRUb0NsZWFyV2F0Y2hlZEV2ZW50KCk7XG5cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0dXBNYW51YWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2ID0gc2xpZGVyLm1hbnVhbENvbnRyb2xzO1xuICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi5hY3RpdmUoKTtcblxuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2LmJpbmQoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIiB8fCB3YXRjaGVkRXZlbnQgPT09IGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHNsaWRlci5jb250cm9sTmF2LmluZGV4KCR0aGlzKTtcblxuICAgICAgICAgICAgICBpZiAoISR0aGlzLmhhc0NsYXNzKG5hbWVzcGFjZSArICdhY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgICh0YXJnZXQgPiBzbGlkZXIuY3VycmVudFNsaWRlKSA/IHNsaWRlci5kaXJlY3Rpb24gPSBcIm5leHRcIiA6IHNsaWRlci5kaXJlY3Rpb24gPSBcInByZXZcIjtcbiAgICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXR1cCBmbGFncyB0byBwcmV2ZW50IGV2ZW50IGR1cGxpY2F0aW9uXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgIHdhdGNoZWRFdmVudCA9IGV2ZW50LnR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXRob2RzLnNldFRvQ2xlYXJXYXRjaGVkRXZlbnQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgc2VsZWN0b3IgPSAoc2xpZGVyLnZhcnMuY29udHJvbE5hdiA9PT0gXCJ0aHVtYm5haWxzXCIpID8gJ2ltZycgOiAnYSc7XG4gICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXYgPSAkKCcuJyArIG5hbWVzcGFjZSArICdjb250cm9sLW5hdiBsaSAnICsgc2VsZWN0b3IsIChzbGlkZXIuY29udHJvbHNDb250YWluZXIpID8gc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyIDogc2xpZGVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdi5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZVwiKS5lcShzbGlkZXIuYW5pbWF0aW5nVG8pLmFkZENsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlXCIpO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGFjdGlvbiwgcG9zKSB7XG4gICAgICAgICAgaWYgKHNsaWRlci5wYWdpbmdDb3VudCA+IDEgJiYgYWN0aW9uID09PSBcImFkZFwiKSB7XG4gICAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkLmFwcGVuZCgkKCc8bGk+PGE+JyArIHNsaWRlci5jb3VudCArICc8L2E+PC9saT4nKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQuZmluZCgnbGknKS5yZW1vdmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXYuZXEocG9zKS5jbG9zZXN0KCdsaScpLnJlbW92ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYuc2V0KCk7XG4gICAgICAgICAgKHNsaWRlci5wYWdpbmdDb3VudCA+IDEgJiYgc2xpZGVyLnBhZ2luZ0NvdW50ICE9PSBzbGlkZXIuY29udHJvbE5hdi5sZW5ndGgpID8gc2xpZGVyLnVwZGF0ZShwb3MsIGFjdGlvbikgOiBtZXRob2RzLmNvbnRyb2xOYXYuYWN0aXZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkaXJlY3Rpb25OYXY6IHtcbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBkaXJlY3Rpb25OYXZTY2FmZm9sZCA9ICQoJzx1bCBjbGFzcz1cIicgKyBuYW1lc3BhY2UgKyAnZGlyZWN0aW9uLW5hdlwiPjxsaT48YSBjbGFzcz1cIicgKyBuYW1lc3BhY2UgKyAncHJldlwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS1jaGV2cm9uLWxlZnRcIj48L2k+PC9hPjwvbGk+PGxpPjxhIGNsYXNzPVwiJyArIG5hbWVzcGFjZSArICduZXh0XCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLWNoZXZyb24tcmlnaHRcIj48L2k+PC9hPjwvbGk+PC91bD4nKTtcblxuICAgICAgICAgIC8vIENPTlRST0xTQ09OVEFJTkVSOlxuICAgICAgICAgIGlmIChzbGlkZXIuY29udHJvbHNDb250YWluZXIpIHtcbiAgICAgICAgICAgICQoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKS5hcHBlbmQoZGlyZWN0aW9uTmF2U2NhZmZvbGQpO1xuICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdiA9ICQoJy4nICsgbmFtZXNwYWNlICsgJ2RpcmVjdGlvbi1uYXYgbGkgYScsIHNsaWRlci5jb250cm9sc0NvbnRhaW5lcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5hcHBlbmQoZGlyZWN0aW9uTmF2U2NhZmZvbGQpO1xuICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdiA9ICQoJy4nICsgbmFtZXNwYWNlICsgJ2RpcmVjdGlvbi1uYXYgbGkgYScsIHNsaWRlcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbWV0aG9kcy5kaXJlY3Rpb25OYXYudXBkYXRlKCk7XG5cbiAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LmJpbmQoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciB0YXJnZXQ7XG5cbiAgICAgICAgICAgIGlmICh3YXRjaGVkRXZlbnQgPT09IFwiXCIgfHwgd2F0Y2hlZEV2ZW50ID09PSBldmVudC50eXBlKSB7XG4gICAgICAgICAgICAgIHRhcmdldCA9ICgkKHRoaXMpLmhhc0NsYXNzKG5hbWVzcGFjZSArICduZXh0JykpID8gc2xpZGVyLmdldFRhcmdldCgnbmV4dCcpIDogc2xpZGVyLmdldFRhcmdldCgncHJldicpO1xuICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2V0dXAgZmxhZ3MgdG8gcHJldmVudCBldmVudCBkdXBsaWNhdGlvblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBldmVudC50eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWV0aG9kcy5zZXRUb0NsZWFyV2F0Y2hlZEV2ZW50KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGRpc2FibGVkQ2xhc3MgPSBuYW1lc3BhY2UgKyAnZGlzYWJsZWQnO1xuICAgICAgICAgIGlmIChzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYuYWRkQ2xhc3MoZGlzYWJsZWRDbGFzcykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCFzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgICBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSAwKSB7XG4gICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYucmVtb3ZlQ2xhc3MoZGlzYWJsZWRDbGFzcykuZmlsdGVyKCcuJyArIG5hbWVzcGFjZSArIFwicHJldlwiKS5hZGRDbGFzcyhkaXNhYmxlZENsYXNzKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzbGlkZXIuYW5pbWF0aW5nVG8gPT09IHNsaWRlci5sYXN0KSB7XG4gICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYucmVtb3ZlQ2xhc3MoZGlzYWJsZWRDbGFzcykuZmlsdGVyKCcuJyArIG5hbWVzcGFjZSArIFwibmV4dFwiKS5hZGRDbGFzcyhkaXNhYmxlZENsYXNzKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdi5yZW1vdmVDbGFzcyhkaXNhYmxlZENsYXNzKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LnJlbW92ZUNsYXNzKGRpc2FibGVkQ2xhc3MpLnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcGF1c2VQbGF5OiB7XG4gICAgICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcGF1c2VQbGF5U2NhZmZvbGQgPSAkKCc8ZGl2IGNsYXNzPVwiJyArIG5hbWVzcGFjZSArICdwYXVzZXBsYXlcIj48YT48L2E+PC9kaXY+Jyk7XG5cbiAgICAgICAgICAvLyBDT05UUk9MU0NPTlRBSU5FUjpcbiAgICAgICAgICBpZiAoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICBzbGlkZXIuY29udHJvbHNDb250YWluZXIuYXBwZW5kKHBhdXNlUGxheVNjYWZmb2xkKTtcbiAgICAgICAgICAgIHNsaWRlci5wYXVzZVBsYXkgPSAkKCcuJyArIG5hbWVzcGFjZSArICdwYXVzZXBsYXkgYScsIHNsaWRlci5jb250cm9sc0NvbnRhaW5lcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5hcHBlbmQocGF1c2VQbGF5U2NhZmZvbGQpO1xuICAgICAgICAgICAgc2xpZGVyLnBhdXNlUGxheSA9ICQoJy4nICsgbmFtZXNwYWNlICsgJ3BhdXNlcGxheSBhJywgc2xpZGVyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBtZXRob2RzLnBhdXNlUGxheS51cGRhdGUoKHNsaWRlci52YXJzLnNsaWRlc2hvdykgPyBuYW1lc3BhY2UgKyAncGF1c2UnIDogbmFtZXNwYWNlICsgJ3BsYXknKTtcblxuICAgICAgICAgIHNsaWRlci5wYXVzZVBsYXkuYmluZChldmVudFR5cGUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiIHx8IHdhdGNoZWRFdmVudCA9PT0gZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhuYW1lc3BhY2UgKyAncGF1c2UnKSkge1xuICAgICAgICAgICAgICAgIHNsaWRlci5tYW51YWxQYXVzZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2xpZGVyLm1hbnVhbFBsYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzbGlkZXIubWFudWFsUGF1c2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzbGlkZXIubWFudWFsUGxheSA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2xpZGVyLnBsYXkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXR1cCBmbGFncyB0byBwcmV2ZW50IGV2ZW50IGR1cGxpY2F0aW9uXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgIHdhdGNoZWRFdmVudCA9IGV2ZW50LnR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXRob2RzLnNldFRvQ2xlYXJXYXRjaGVkRXZlbnQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICAgIChzdGF0ZSA9PT0gXCJwbGF5XCIpID8gc2xpZGVyLnBhdXNlUGxheS5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyAncGF1c2UnKS5hZGRDbGFzcyhuYW1lc3BhY2UgKyAncGxheScpLmh0bWwoc2xpZGVyLnZhcnMucGxheVRleHQpIDogc2xpZGVyLnBhdXNlUGxheS5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyAncGxheScpLmFkZENsYXNzKG5hbWVzcGFjZSArICdwYXVzZScpLmh0bWwoc2xpZGVyLnZhcnMucGF1c2VUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHRvdWNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXJ0WCxcbiAgICAgICAgICBzdGFydFksXG4gICAgICAgICAgb2Zmc2V0LFxuICAgICAgICAgIGN3aWR0aCxcbiAgICAgICAgICBkeCxcbiAgICAgICAgICBzdGFydFQsXG4gICAgICAgICAgc2Nyb2xsaW5nID0gZmFsc2UsXG4gICAgICAgICAgbG9jYWxYID0gMCxcbiAgICAgICAgICBsb2NhbFkgPSAwLFxuICAgICAgICAgIGFjY0R4ID0gMDtcblxuICAgICAgICBpZighbXNHZXN0dXJlKXtcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gb25Ub3VjaFN0YXJ0KGUpIHtcbiAgICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmcpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoICggd2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICkgfHwgZS50b3VjaGVzLmxlbmd0aCA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgICAgICAvLyBDQVJPVVNFTDpcbiAgICAgICAgICAgICAgICBjd2lkdGggPSAodmVydGljYWwpID8gc2xpZGVyLmggOiBzbGlkZXIuIHc7XG4gICAgICAgICAgICAgICAgc3RhcnRUID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgICAgICAgICAgICAgIC8vIENBUk9VU0VMOlxuXG4gICAgICAgICAgICAgICAgLy8gTG9jYWwgdmFycyBmb3IgWCBhbmQgWSBwb2ludHMuXG4gICAgICAgICAgICAgICAgbG9jYWxYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgICAgICAgIGxvY2FsWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcblxuICAgICAgICAgICAgICAgIG9mZnNldCA9IChjYXJvdXNlbCAmJiByZXZlcnNlICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmxhc3QpID8gMCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsICYmIHJldmVyc2UpID8gc2xpZGVyLmxpbWl0IC0gKCgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwgJiYgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpID8gc2xpZGVyLmxpbWl0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwpID8gKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5jdXJyZW50U2xpZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIChyZXZlcnNlKSA/IChzbGlkZXIubGFzdCAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoIDogKHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoO1xuICAgICAgICAgICAgICAgIHN0YXJ0WCA9ICh2ZXJ0aWNhbCkgPyBsb2NhbFkgOiBsb2NhbFg7XG4gICAgICAgICAgICAgICAgc3RhcnRZID0gKHZlcnRpY2FsKSA/IGxvY2FsWCA6IGxvY2FsWTtcblxuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gb25Ub3VjaE1vdmUoZSkge1xuICAgICAgICAgICAgICAvLyBMb2NhbCB2YXJzIGZvciBYIGFuZCBZIHBvaW50cy5cblxuICAgICAgICAgICAgICBsb2NhbFggPSBlLnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgICAgICAgIGxvY2FsWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcblxuICAgICAgICAgICAgICBkeCA9ICh2ZXJ0aWNhbCkgPyBzdGFydFggLSBsb2NhbFkgOiBzdGFydFggLSBsb2NhbFg7XG4gICAgICAgICAgICAgIHNjcm9sbGluZyA9ICh2ZXJ0aWNhbCkgPyAoTWF0aC5hYnMoZHgpIDwgTWF0aC5hYnMobG9jYWxYIC0gc3RhcnRZKSkgOiAoTWF0aC5hYnMoZHgpIDwgTWF0aC5hYnMobG9jYWxZIC0gc3RhcnRZKSk7XG5cbiAgICAgICAgICAgICAgdmFyIGZ4bXMgPSA1MDA7XG5cbiAgICAgICAgICAgICAgaWYgKCAhIHNjcm9sbGluZyB8fCBOdW1iZXIoIG5ldyBEYXRlKCkgKSAtIHN0YXJ0VCA+IGZ4bXMgKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGlmICghZmFkZSAmJiBzbGlkZXIudHJhbnNpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkge1xuICAgICAgICAgICAgICAgICAgICBkeCA9IGR4Lygoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gMCAmJiBkeCA8IDAgfHwgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgZHggPiAwKSA/IChNYXRoLmFicyhkeCkvY3dpZHRoKzIpIDogMSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMob2Zmc2V0ICsgZHgsIFwic2V0VG91Y2hcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uVG91Y2hFbmQoZSkge1xuICAgICAgICAgICAgICAvLyBmaW5pc2ggdGhlIHRvdWNoIGJ5IHVuZG9pbmcgdGhlIHRvdWNoIHNlc3Npb25cbiAgICAgICAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlKTtcblxuICAgICAgICAgICAgICBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIuY3VycmVudFNsaWRlICYmICFzY3JvbGxpbmcgJiYgIShkeCA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlRHggPSAocmV2ZXJzZSkgPyAtZHggOiBkeCxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gKHVwZGF0ZUR4ID4gMCkgPyBzbGlkZXIuZ2V0VGFyZ2V0KCduZXh0JykgOiBzbGlkZXIuZ2V0VGFyZ2V0KCdwcmV2Jyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0KSAmJiAoTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUIDwgNTUwICYmIE1hdGguYWJzKHVwZGF0ZUR4KSA+IDUwIHx8IE1hdGguYWJzKHVwZGF0ZUR4KSA+IGN3aWR0aC8yKSkge1xuICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGlmICghZmFkZSkgc2xpZGVyLmZsZXhBbmltYXRlKHNsaWRlci5jdXJyZW50U2xpZGUsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQsIGZhbHNlKTtcblxuICAgICAgICAgICAgICBzdGFydFggPSBudWxsO1xuICAgICAgICAgICAgICBzdGFydFkgPSBudWxsO1xuICAgICAgICAgICAgICBkeCA9IG51bGw7XG4gICAgICAgICAgICAgIG9mZnNldCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZWwuc3R5bGUubXNUb3VjaEFjdGlvbiA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZWwuX2dlc3R1cmUgPSBuZXcgTVNHZXN0dXJlKCk7XG4gICAgICAgICAgICBlbC5fZ2VzdHVyZS50YXJnZXQgPSBlbDtcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJNU1BvaW50ZXJEb3duXCIsIG9uTVNQb2ludGVyRG93biwgZmFsc2UpO1xuICAgICAgICAgICAgZWwuX3NsaWRlciA9IHNsaWRlcjtcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJNU0dlc3R1cmVDaGFuZ2VcIiwgb25NU0dlc3R1cmVDaGFuZ2UsIGZhbHNlKTtcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJNU0dlc3R1cmVFbmRcIiwgb25NU0dlc3R1cmVFbmQsIGZhbHNlKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gb25NU1BvaW50ZXJEb3duKGUpe1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgICAgICAgICAgZWwuX2dlc3R1cmUuYWRkUG9pbnRlcihlLnBvaW50ZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGFjY0R4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY3dpZHRoID0gKHZlcnRpY2FsKSA/IHNsaWRlci5oIDogc2xpZGVyLiB3O1xuICAgICAgICAgICAgICAgICAgICBzdGFydFQgPSBOdW1iZXIobmV3IERhdGUoKSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIENBUk9VU0VMOlxuXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IChjYXJvdXNlbCAmJiByZXZlcnNlICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmxhc3QpID8gMCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwgJiYgcmV2ZXJzZSkgPyBzbGlkZXIubGltaXQgLSAoKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5hbmltYXRpbmdUbykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjYXJvdXNlbCAmJiBzbGlkZXIuY3VycmVudFNsaWRlID09PSBzbGlkZXIubGFzdCkgPyBzbGlkZXIubGltaXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwpID8gKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5jdXJyZW50U2xpZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHJldmVyc2UpID8gKHNsaWRlci5sYXN0IC0gc2xpZGVyLmN1cnJlbnRTbGlkZSArIHNsaWRlci5jbG9uZU9mZnNldCkgKiBjd2lkdGggOiAoc2xpZGVyLmN1cnJlbnRTbGlkZSArIHNsaWRlci5jbG9uZU9mZnNldCkgKiBjd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvbk1TR2VzdHVyZUNoYW5nZShlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB2YXIgc2xpZGVyID0gZS50YXJnZXQuX3NsaWRlcjtcbiAgICAgICAgICAgICAgICBpZighc2xpZGVyKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdHJhbnNYID0gLWUudHJhbnNsYXRpb25YLFxuICAgICAgICAgICAgICAgICAgICB0cmFuc1kgPSAtZS50cmFuc2xhdGlvblk7XG5cbiAgICAgICAgICAgICAgICAvL0FjY3VtdWxhdGUgdHJhbnNsYXRpb25zLlxuICAgICAgICAgICAgICAgIGFjY0R4ID0gYWNjRHggKyAoKHZlcnRpY2FsKSA/IHRyYW5zWSA6IHRyYW5zWCk7XG4gICAgICAgICAgICAgICAgZHggPSBhY2NEeDtcbiAgICAgICAgICAgICAgICBzY3JvbGxpbmcgPSAodmVydGljYWwpID8gKE1hdGguYWJzKGFjY0R4KSA8IE1hdGguYWJzKC10cmFuc1gpKSA6IChNYXRoLmFicyhhY2NEeCkgPCBNYXRoLmFicygtdHJhbnNZKSk7XG5cbiAgICAgICAgICAgICAgICBpZihlLmRldGFpbCA9PT0gZS5NU0dFU1RVUkVfRkxBR19JTkVSVElBKXtcbiAgICAgICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwuX2dlc3R1cmUuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFzY3JvbGxpbmcgfHwgTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUID4gNTAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmYWRlICYmIHNsaWRlci50cmFuc2l0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHggPSBhY2NEeCAvICgoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gMCAmJiBhY2NEeCA8IDAgfHwgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgYWNjRHggPiAwKSA/IChNYXRoLmFicyhhY2NEeCkgLyBjd2lkdGggKyAyKSA6IDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKG9mZnNldCArIGR4LCBcInNldFRvdWNoXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvbk1TR2VzdHVyZUVuZChlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB2YXIgc2xpZGVyID0gZS50YXJnZXQuX3NsaWRlcjtcbiAgICAgICAgICAgICAgICBpZighc2xpZGVyKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIuY3VycmVudFNsaWRlICYmICFzY3JvbGxpbmcgJiYgIShkeCA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVwZGF0ZUR4ID0gKHJldmVyc2UpID8gLWR4IDogZHgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSAodXBkYXRlRHggPiAwKSA/IHNsaWRlci5nZXRUYXJnZXQoJ25leHQnKSA6IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0KSAmJiAoTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUIDwgNTUwICYmIE1hdGguYWJzKHVwZGF0ZUR4KSA+IDUwIHx8IE1hdGguYWJzKHVwZGF0ZUR4KSA+IGN3aWR0aC8yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZhZGUpIHNsaWRlci5mbGV4QW5pbWF0ZShzbGlkZXIuY3VycmVudFNsaWRlLCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN0YXJ0WCA9IG51bGw7XG4gICAgICAgICAgICAgICAgc3RhcnRZID0gbnVsbDtcbiAgICAgICAgICAgICAgICBkeCA9IG51bGw7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBhY2NEeCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZXNpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXNsaWRlci5hbmltYXRpbmcgJiYgc2xpZGVyLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgICAgaWYgKCFjYXJvdXNlbCkgc2xpZGVyLmRvTWF0aCgpO1xuXG4gICAgICAgICAgaWYgKGZhZGUpIHtcbiAgICAgICAgICAgIC8vIFNNT09USCBIRUlHSFQ6XG4gICAgICAgICAgICBtZXRob2RzLnNtb290aEhlaWdodCgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2Fyb3VzZWwpIHsgLy9DQVJPVVNFTDpcbiAgICAgICAgICAgIHNsaWRlci5zbGlkZXMud2lkdGgoc2xpZGVyLmNvbXB1dGVkVyk7XG4gICAgICAgICAgICBzbGlkZXIudXBkYXRlKHNsaWRlci5wYWdpbmdDb3VudCk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAodmVydGljYWwpIHsgLy9WRVJUSUNBTDpcbiAgICAgICAgICAgIHNsaWRlci52aWV3cG9ydC5oZWlnaHQoc2xpZGVyLmgpO1xuICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKHNsaWRlci5oLCBcInNldFRvdGFsXCIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTTU9PVEggSEVJR0hUOlxuICAgICAgICAgICAgaWYgKHNsaWRlci52YXJzLnNtb290aEhlaWdodCkgbWV0aG9kcy5zbW9vdGhIZWlnaHQoKTtcbiAgICAgICAgICAgIHNsaWRlci5uZXdTbGlkZXMud2lkdGgoc2xpZGVyLmNvbXB1dGVkVyk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVyLmNvbXB1dGVkVywgXCJzZXRUb3RhbFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzbW9vdGhIZWlnaHQ6IGZ1bmN0aW9uKGR1cikge1xuICAgICAgICBpZiAoIXZlcnRpY2FsIHx8IGZhZGUpIHtcbiAgICAgICAgICB2YXIgJG9iaiA9IChmYWRlKSA/IHNsaWRlciA6IHNsaWRlci52aWV3cG9ydDtcbiAgICAgICAgICAoZHVyKSA/ICRvYmouYW5pbWF0ZSh7XCJoZWlnaHRcIjogc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuYW5pbWF0aW5nVG8pLmhlaWdodCgpfSwgZHVyKSA6ICRvYmouaGVpZ2h0KHNsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmFuaW1hdGluZ1RvKS5oZWlnaHQoKSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzeW5jOiBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgICAgdmFyICRvYmogPSAkKHNsaWRlci52YXJzLnN5bmMpLmRhdGEoXCJmbGV4c2xpZGVyXCIpLFxuICAgICAgICAgICAgdGFyZ2V0ID0gc2xpZGVyLmFuaW1hdGluZ1RvO1xuXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgY2FzZSBcImFuaW1hdGVcIjogJG9iai5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIGZhbHNlLCB0cnVlKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBsYXlcIjogaWYgKCEkb2JqLnBsYXlpbmcgJiYgISRvYmouYXNOYXYpIHsgJG9iai5wbGF5KCk7IH0gYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBhdXNlXCI6ICRvYmoucGF1c2UoKTsgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB1bmlxdWVJRDogZnVuY3Rpb24oJGNsb25lKSB7XG4gICAgICAgICRjbG9uZS5maW5kKCAnW2lkXScgKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgICAgJHRoaXMuYXR0ciggJ2lkJywgJHRoaXMuYXR0ciggJ2lkJyApICsgJ19jbG9uZScgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAkY2xvbmU7XG4gICAgICB9LFxuICAgICAgcGF1c2VJbnZpc2libGU6IHtcbiAgICAgICAgdmlzUHJvcDogbnVsbCxcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHByZWZpeGVzID0gWyd3ZWJraXQnLCdtb3onLCdtcycsJ28nXTtcblxuICAgICAgICAgIGlmICgnaGlkZGVuJyBpbiBkb2N1bWVudCkgcmV0dXJuICdoaWRkZW4nO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICgocHJlZml4ZXNbaV0gKyAnSGlkZGVuJykgaW4gZG9jdW1lbnQpXG4gICAgICAgICAgICBtZXRob2RzLnBhdXNlSW52aXNpYmxlLnZpc1Byb3AgPSBwcmVmaXhlc1tpXSArICdIaWRkZW4nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWV0aG9kcy5wYXVzZUludmlzaWJsZS52aXNQcm9wKSB7XG4gICAgICAgICAgICB2YXIgZXZ0bmFtZSA9IG1ldGhvZHMucGF1c2VJbnZpc2libGUudmlzUHJvcC5yZXBsYWNlKC9bSHxoXWlkZGVuLywnJykgKyAndmlzaWJpbGl0eWNoYW5nZSc7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGV2dG5hbWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAobWV0aG9kcy5wYXVzZUludmlzaWJsZS5pc0hpZGRlbigpKSB7XG4gICAgICAgICAgICAgICAgaWYoc2xpZGVyLnN0YXJ0VGltZW91dCkgY2xlYXJUaW1lb3V0KHNsaWRlci5zdGFydFRpbWVvdXQpOyAvL0lmIGNsb2NrIGlzIHRpY2tpbmcsIHN0b3AgdGltZXIgYW5kIHByZXZlbnQgZnJvbSBzdGFydGluZyB3aGlsZSBpbnZpc2libGVcbiAgICAgICAgICAgICAgICBlbHNlIHNsaWRlci5wYXVzZSgpOyAvL09yIGp1c3QgcGF1c2VcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZihzbGlkZXIuc3RhcnRlZCkgc2xpZGVyLnBsYXkoKTsgLy9Jbml0aWF0ZWQgYmVmb3JlLCBqdXN0IHBsYXlcbiAgICAgICAgICAgICAgICBlbHNlIChzbGlkZXIudmFycy5pbml0RGVsYXkgPiAwKSA/IHNldFRpbWVvdXQoc2xpZGVyLnBsYXksIHNsaWRlci52YXJzLmluaXREZWxheSkgOiBzbGlkZXIucGxheSgpOyAvL0RpZG4ndCBpbml0IGJlZm9yZTogc2ltcGx5IGluaXQgb3Igd2FpdCBmb3IgaXRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpc0hpZGRlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGRvY3VtZW50W21ldGhvZHMucGF1c2VJbnZpc2libGUudmlzUHJvcF0gfHwgZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZXRUb0NsZWFyV2F0Y2hlZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHdhdGNoZWRFdmVudENsZWFyVGltZXIpO1xuICAgICAgICB3YXRjaGVkRXZlbnRDbGVhclRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBcIlwiO1xuICAgICAgICB9LCAzMDAwKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gcHVibGljIG1ldGhvZHNcbiAgICBzbGlkZXIuZmxleEFuaW1hdGUgPSBmdW5jdGlvbih0YXJnZXQsIHBhdXNlLCBvdmVycmlkZSwgd2l0aFN5bmMsIGZyb21OYXYpIHtcbiAgICAgIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCAmJiB0YXJnZXQgIT09IHNsaWRlci5jdXJyZW50U2xpZGUpIHtcbiAgICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9ICh0YXJnZXQgPiBzbGlkZXIuY3VycmVudFNsaWRlKSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICB9XG5cbiAgICAgIGlmIChhc05hdiAmJiBzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpIHNsaWRlci5kaXJlY3Rpb24gPSAoc2xpZGVyLmN1cnJlbnRJdGVtIDwgdGFyZ2V0KSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG5cbiAgICAgIGlmICghc2xpZGVyLmFuaW1hdGluZyAmJiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0LCBmcm9tTmF2KSB8fCBvdmVycmlkZSkgJiYgc2xpZGVyLmlzKFwiOnZpc2libGVcIikpIHtcbiAgICAgICAgaWYgKGFzTmF2ICYmIHdpdGhTeW5jKSB7XG4gICAgICAgICAgdmFyIG1hc3RlciA9ICQoc2xpZGVyLnZhcnMuYXNOYXZGb3IpLmRhdGEoJ2ZsZXhzbGlkZXInKTtcbiAgICAgICAgICBzbGlkZXIuYXRFbmQgPSB0YXJnZXQgPT09IDAgfHwgdGFyZ2V0ID09PSBzbGlkZXIuY291bnQgLSAxO1xuICAgICAgICAgIG1hc3Rlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHRydWUsIGZhbHNlLCB0cnVlLCBmcm9tTmF2KTtcbiAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uID0gKHNsaWRlci5jdXJyZW50SXRlbSA8IHRhcmdldCkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuICAgICAgICAgIG1hc3Rlci5kaXJlY3Rpb24gPSBzbGlkZXIuZGlyZWN0aW9uO1xuXG4gICAgICAgICAgaWYgKE1hdGguY2VpbCgodGFyZ2V0ICsgMSkvc2xpZGVyLnZpc2libGUpIC0gMSAhPT0gc2xpZGVyLmN1cnJlbnRTbGlkZSAmJiB0YXJnZXQgIT09IDApIHtcbiAgICAgICAgICAgIHNsaWRlci5jdXJyZW50SXRlbSA9IHRhcmdldDtcbiAgICAgICAgICAgIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEodGFyZ2V0KS5hZGRDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKTtcbiAgICAgICAgICAgIHRhcmdldCA9IE1hdGguZmxvb3IodGFyZ2V0L3NsaWRlci52aXNpYmxlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLmN1cnJlbnRJdGVtID0gdGFyZ2V0O1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKS5lcSh0YXJnZXQpLmFkZENsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNsaWRlci5hbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nVG8gPSB0YXJnZXQ7XG5cbiAgICAgICAgLy8gU0xJREVTSE9XOlxuICAgICAgICBpZiAocGF1c2UpIHNsaWRlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEFQSTogYmVmb3JlKCkgYW5pbWF0aW9uIENhbGxiYWNrXG4gICAgICAgIHNsaWRlci52YXJzLmJlZm9yZShzbGlkZXIpO1xuXG4gICAgICAgIC8vIFNZTkM6XG4gICAgICAgIGlmIChzbGlkZXIuc3luY0V4aXN0cyAmJiAhZnJvbU5hdikgbWV0aG9kcy5zeW5jKFwiYW5pbWF0ZVwiKTtcblxuICAgICAgICAvLyBDT05UUk9MTkFWXG4gICAgICAgIGlmIChzbGlkZXIudmFycy5jb250cm9sTmF2KSBtZXRob2RzLmNvbnRyb2xOYXYuYWN0aXZlKCk7XG5cbiAgICAgICAgLy8gIUNBUk9VU0VMOlxuICAgICAgICAvLyBDQU5ESURBVEU6IHNsaWRlIGFjdGl2ZSBjbGFzcyAoZm9yIGFkZC9yZW1vdmUgc2xpZGUpXG4gICAgICAgIGlmICghY2Fyb3VzZWwpIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgJ2FjdGl2ZS1zbGlkZScpLmVxKHRhcmdldCkuYWRkQ2xhc3MobmFtZXNwYWNlICsgJ2FjdGl2ZS1zbGlkZScpO1xuXG4gICAgICAgIC8vIElORklOSVRFIExPT1A6XG4gICAgICAgIC8vIENBTkRJREFURTogYXRFbmRcbiAgICAgICAgc2xpZGVyLmF0RW5kID0gdGFyZ2V0ID09PSAwIHx8IHRhcmdldCA9PT0gc2xpZGVyLmxhc3Q7XG5cbiAgICAgICAgLy8gRElSRUNUSU9OTkFWOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuZGlyZWN0aW9uTmF2KSBtZXRob2RzLmRpcmVjdGlvbk5hdi51cGRhdGUoKTtcblxuICAgICAgICBpZiAodGFyZ2V0ID09PSBzbGlkZXIubGFzdCkge1xuICAgICAgICAgIC8vIEFQSTogZW5kKCkgb2YgY3ljbGUgQ2FsbGJhY2tcbiAgICAgICAgICBzbGlkZXIudmFycy5lbmQoc2xpZGVyKTtcbiAgICAgICAgICAvLyBTTElERVNIT1cgJiYgIUlORklOSVRFIExPT1A6XG4gICAgICAgICAgaWYgKCFzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNMSURFOlxuICAgICAgICBpZiAoIWZhZGUpIHtcbiAgICAgICAgICB2YXIgZGltZW5zaW9uID0gKHZlcnRpY2FsKSA/IHNsaWRlci5zbGlkZXMuZmlsdGVyKCc6Zmlyc3QnKS5oZWlnaHQoKSA6IHNsaWRlci5jb21wdXRlZFcsXG4gICAgICAgICAgICAgIG1hcmdpbiwgc2xpZGVTdHJpbmcsIGNhbGNOZXh0O1xuXG4gICAgICAgICAgLy8gSU5GSU5JVEUgTE9PUCAvIFJFVkVSU0U6XG4gICAgICAgICAgaWYgKGNhcm91c2VsKSB7XG4gICAgICAgICAgICAvL21hcmdpbiA9IChzbGlkZXIudmFycy5pdGVtV2lkdGggPiBzbGlkZXIudykgPyBzbGlkZXIudmFycy5pdGVtTWFyZ2luICogMiA6IHNsaWRlci52YXJzLml0ZW1NYXJnaW47XG4gICAgICAgICAgICBtYXJnaW4gPSBzbGlkZXIudmFycy5pdGVtTWFyZ2luO1xuICAgICAgICAgICAgY2FsY05leHQgPSAoKHNsaWRlci5pdGVtVyArIG1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAgICAgICBzbGlkZVN0cmluZyA9IChjYWxjTmV4dCA+IHNsaWRlci5saW1pdCAmJiBzbGlkZXIudmlzaWJsZSAhPT0gMSkgPyBzbGlkZXIubGltaXQgOiBjYWxjTmV4dDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgdGFyZ2V0ID09PSBzbGlkZXIuY291bnQgLSAxICYmIHNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJuZXh0XCIpIHtcbiAgICAgICAgICAgIHNsaWRlU3RyaW5nID0gKHJldmVyc2UpID8gKHNsaWRlci5jb3VudCArIHNsaWRlci5jbG9uZU9mZnNldCkgKiBkaW1lbnNpb24gOiAwO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgdGFyZ2V0ID09PSAwICYmIHNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJwcmV2XCIpIHtcbiAgICAgICAgICAgIHNsaWRlU3RyaW5nID0gKHJldmVyc2UpID8gMCA6IChzbGlkZXIuY291bnQgKyAxKSAqIGRpbWVuc2lvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVTdHJpbmcgPSAocmV2ZXJzZSkgPyAoKHNsaWRlci5jb3VudCAtIDEpIC0gdGFyZ2V0ICsgc2xpZGVyLmNsb25lT2Zmc2V0KSAqIGRpbWVuc2lvbiA6ICh0YXJnZXQgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogZGltZW5zaW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVTdHJpbmcsIFwiXCIsIHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgICAgICBpZiAoc2xpZGVyLnRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIXNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgfHwgIXNsaWRlci5hdEVuZCkge1xuICAgICAgICAgICAgICBzbGlkZXIuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgPSBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLnVuYmluZChcIndlYmtpdFRyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZFwiKTtcbiAgICAgICAgICAgIHNsaWRlci5jb250YWluZXIuYmluZChcIndlYmtpdFRyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2xpZGVyLndyYXB1cChkaW1lbnNpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5jb250YWluZXIuYW5pbWF0ZShzbGlkZXIuYXJncywgc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsIHNsaWRlci52YXJzLmVhc2luZywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgc2xpZGVyLndyYXB1cChkaW1lbnNpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgeyAvLyBGQURFOlxuICAgICAgICAgIGlmICghdG91Y2gpIHtcbiAgICAgICAgICAgIC8vc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5mYWRlT3V0KHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcpO1xuICAgICAgICAgICAgLy9zbGlkZXIuc2xpZGVzLmVxKHRhcmdldCkuZmFkZUluKHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcsIHNsaWRlci53cmFwdXApO1xuXG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5jdXJyZW50U2xpZGUpLmNzcyh7XCJ6SW5kZXhcIjogMX0pLmFuaW1hdGUoe1wib3BhY2l0eVwiOiAwfSwgc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsIHNsaWRlci52YXJzLmVhc2luZyk7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmVxKHRhcmdldCkuY3NzKHtcInpJbmRleFwiOiAyfSkuYW5pbWF0ZSh7XCJvcGFjaXR5XCI6IDF9LCBzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCwgc2xpZGVyLnZhcnMuZWFzaW5nLCBzbGlkZXIud3JhcHVwKTtcblxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5jdXJyZW50U2xpZGUpLmNzcyh7IFwib3BhY2l0eVwiOiAwLCBcInpJbmRleFwiOiAxIH0pO1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5lcSh0YXJnZXQpLmNzcyh7IFwib3BhY2l0eVwiOiAxLCBcInpJbmRleFwiOiAyIH0pO1xuICAgICAgICAgICAgc2xpZGVyLndyYXB1cChkaW1lbnNpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBTTU9PVEggSEVJR0hUOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuc21vb3RoSGVpZ2h0KSBtZXRob2RzLnNtb290aEhlaWdodChzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBzbGlkZXIud3JhcHVwID0gZnVuY3Rpb24oZGltZW5zaW9uKSB7XG4gICAgICAvLyBTTElERTpcbiAgICAgIGlmICghZmFkZSAmJiAhY2Fyb3VzZWwpIHtcbiAgICAgICAgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCAmJiBzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgc2xpZGVyLnNldFByb3BzKGRpbWVuc2lvbiwgXCJqdW1wRW5kXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0ICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gMCAmJiBzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgc2xpZGVyLnNldFByb3BzKGRpbWVuc2lvbiwgXCJqdW1wU3RhcnRcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNsaWRlci5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgPSBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAvLyBBUEk6IGFmdGVyKCkgYW5pbWF0aW9uIENhbGxiYWNrXG4gICAgICBzbGlkZXIudmFycy5hZnRlcihzbGlkZXIpO1xuICAgIH07XG5cbiAgICAvLyBTTElERVNIT1c6XG4gICAgc2xpZGVyLmFuaW1hdGVTbGlkZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghc2xpZGVyLmFuaW1hdGluZyAmJiBmb2N1c2VkICkgc2xpZGVyLmZsZXhBbmltYXRlKHNsaWRlci5nZXRUYXJnZXQoXCJuZXh0XCIpKTtcbiAgICB9O1xuICAgIC8vIFNMSURFU0hPVzpcbiAgICBzbGlkZXIucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoc2xpZGVyLmFuaW1hdGVkU2xpZGVzKTtcbiAgICAgIHNsaWRlci5hbmltYXRlZFNsaWRlcyA9IG51bGw7XG4gICAgICBzbGlkZXIucGxheWluZyA9IGZhbHNlO1xuICAgICAgLy8gUEFVU0VQTEFZOlxuICAgICAgaWYgKHNsaWRlci52YXJzLnBhdXNlUGxheSkgbWV0aG9kcy5wYXVzZVBsYXkudXBkYXRlKFwicGxheVwiKTtcbiAgICAgIC8vIFNZTkM6XG4gICAgICBpZiAoc2xpZGVyLnN5bmNFeGlzdHMpIG1ldGhvZHMuc3luYyhcInBhdXNlXCIpO1xuICAgIH07XG4gICAgLy8gU0xJREVTSE9XOlxuICAgIHNsaWRlci5wbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc2xpZGVyLnBsYXlpbmcpIGNsZWFySW50ZXJ2YWwoc2xpZGVyLmFuaW1hdGVkU2xpZGVzKTtcbiAgICAgIHNsaWRlci5hbmltYXRlZFNsaWRlcyA9IHNsaWRlci5hbmltYXRlZFNsaWRlcyB8fCBzZXRJbnRlcnZhbChzbGlkZXIuYW5pbWF0ZVNsaWRlcywgc2xpZGVyLnZhcnMuc2xpZGVzaG93U3BlZWQpO1xuICAgICAgc2xpZGVyLnN0YXJ0ZWQgPSBzbGlkZXIucGxheWluZyA9IHRydWU7XG4gICAgICAvLyBQQVVTRVBMQVk6XG4gICAgICBpZiAoc2xpZGVyLnZhcnMucGF1c2VQbGF5KSBtZXRob2RzLnBhdXNlUGxheS51cGRhdGUoXCJwYXVzZVwiKTtcbiAgICAgIC8vIFNZTkM6XG4gICAgICBpZiAoc2xpZGVyLnN5bmNFeGlzdHMpIG1ldGhvZHMuc3luYyhcInBsYXlcIik7XG4gICAgfTtcbiAgICAvLyBTVE9QOlxuICAgIHNsaWRlci5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgc2xpZGVyLnBhdXNlKCk7XG4gICAgICBzbGlkZXIuc3RvcHBlZCA9IHRydWU7XG4gICAgfTtcbiAgICBzbGlkZXIuY2FuQWR2YW5jZSA9IGZ1bmN0aW9uKHRhcmdldCwgZnJvbU5hdikge1xuICAgICAgLy8gQVNOQVY6XG4gICAgICB2YXIgbGFzdCA9IChhc05hdikgPyBzbGlkZXIucGFnaW5nQ291bnQgLSAxIDogc2xpZGVyLmxhc3Q7XG4gICAgICByZXR1cm4gKGZyb21OYXYpID8gdHJ1ZSA6XG4gICAgICAgICAgICAgKGFzTmF2ICYmIHNsaWRlci5jdXJyZW50SXRlbSA9PT0gc2xpZGVyLmNvdW50IC0gMSAmJiB0YXJnZXQgPT09IDAgJiYgc2xpZGVyLmRpcmVjdGlvbiA9PT0gXCJwcmV2XCIpID8gdHJ1ZSA6XG4gICAgICAgICAgICAgKGFzTmF2ICYmIHNsaWRlci5jdXJyZW50SXRlbSA9PT0gMCAmJiB0YXJnZXQgPT09IHNsaWRlci5wYWdpbmdDb3VudCAtIDEgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJuZXh0XCIpID8gZmFsc2UgOlxuICAgICAgICAgICAgICh0YXJnZXQgPT09IHNsaWRlci5jdXJyZW50U2xpZGUgJiYgIWFzTmF2KSA/IGZhbHNlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkgPyB0cnVlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLmF0RW5kICYmIHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgdGFyZ2V0ID09PSBsYXN0ICYmIHNsaWRlci5kaXJlY3Rpb24gIT09IFwibmV4dFwiKSA/IGZhbHNlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLmF0RW5kICYmIHNsaWRlci5jdXJyZW50U2xpZGUgPT09IGxhc3QgJiYgdGFyZ2V0ID09PSAwICYmIHNsaWRlci5kaXJlY3Rpb24gPT09IFwibmV4dFwiKSA/IGZhbHNlIDpcbiAgICAgICAgICAgICB0cnVlO1xuICAgIH07XG4gICAgc2xpZGVyLmdldFRhcmdldCA9IGZ1bmN0aW9uKGRpcikge1xuICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9IGRpcjtcbiAgICAgIGlmIChkaXIgPT09IFwibmV4dFwiKSB7XG4gICAgICAgIHJldHVybiAoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpID8gMCA6IHNsaWRlci5jdXJyZW50U2xpZGUgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChzbGlkZXIuY3VycmVudFNsaWRlID09PSAwKSA/IHNsaWRlci5sYXN0IDogc2xpZGVyLmN1cnJlbnRTbGlkZSAtIDE7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIFNMSURFOlxuICAgIHNsaWRlci5zZXRQcm9wcyA9IGZ1bmN0aW9uKHBvcywgc3BlY2lhbCwgZHVyKSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcG9zQ2hlY2sgPSAocG9zKSA/IHBvcyA6ICgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8sXG4gICAgICAgICAgICBwb3NDYWxjID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAoY2Fyb3VzZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHNwZWNpYWwgPT09IFwic2V0VG91Y2hcIikgPyBwb3MgOlxuICAgICAgICAgICAgICAgICAgICAgICAocmV2ZXJzZSAmJiBzbGlkZXIuYW5pbWF0aW5nVG8gPT09IHNsaWRlci5sYXN0KSA/IDAgOlxuICAgICAgICAgICAgICAgICAgICAgICAocmV2ZXJzZSkgPyBzbGlkZXIubGltaXQgLSAoKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5hbmltYXRpbmdUbykgOlxuICAgICAgICAgICAgICAgICAgICAgICAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCkgPyBzbGlkZXIubGltaXQgOiBwb3NDaGVjaztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHNwZWNpYWwpIHtcbiAgICAgICAgICAgICAgICAgIGNhc2UgXCJzZXRUb3RhbFwiOiByZXR1cm4gKHJldmVyc2UpID8gKChzbGlkZXIuY291bnQgLSAxKSAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogcG9zIDogKHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogcG9zO1xuICAgICAgICAgICAgICAgICAgY2FzZSBcInNldFRvdWNoXCI6IHJldHVybiAocmV2ZXJzZSkgPyBwb3MgOiBwb3M7XG4gICAgICAgICAgICAgICAgICBjYXNlIFwianVtcEVuZFwiOiByZXR1cm4gKHJldmVyc2UpID8gcG9zIDogc2xpZGVyLmNvdW50ICogcG9zO1xuICAgICAgICAgICAgICAgICAgY2FzZSBcImp1bXBTdGFydFwiOiByZXR1cm4gKHJldmVyc2UpID8gc2xpZGVyLmNvdW50ICogcG9zIDogcG9zO1xuICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIHBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oKSk7XG5cbiAgICAgICAgICAgIHJldHVybiAocG9zQ2FsYyAqIC0xKSArIFwicHhcIjtcbiAgICAgICAgICB9KCkpO1xuXG4gICAgICBpZiAoc2xpZGVyLnRyYW5zaXRpb25zKSB7XG4gICAgICAgIHRhcmdldCA9ICh2ZXJ0aWNhbCkgPyBcInRyYW5zbGF0ZTNkKDAsXCIgKyB0YXJnZXQgKyBcIiwwKVwiIDogXCJ0cmFuc2xhdGUzZChcIiArIHRhcmdldCArIFwiLDAsMClcIjtcbiAgICAgICAgZHVyID0gKGR1ciAhPT0gdW5kZWZpbmVkKSA/IChkdXIvMTAwMCkgKyBcInNcIiA6IFwiMHNcIjtcbiAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5jc3MoXCItXCIgKyBzbGlkZXIucGZ4ICsgXCItdHJhbnNpdGlvbi1kdXJhdGlvblwiLCBkdXIpO1xuICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5jc3MoXCJ0cmFuc2l0aW9uLWR1cmF0aW9uXCIsIGR1cik7XG4gICAgICB9XG5cbiAgICAgIHNsaWRlci5hcmdzW3NsaWRlci5wcm9wXSA9IHRhcmdldDtcbiAgICAgIGlmIChzbGlkZXIudHJhbnNpdGlvbnMgfHwgZHVyID09PSB1bmRlZmluZWQpIHNsaWRlci5jb250YWluZXIuY3NzKHNsaWRlci5hcmdzKTtcblxuICAgICAgc2xpZGVyLmNvbnRhaW5lci5jc3MoJ3RyYW5zZm9ybScsdGFyZ2V0KTtcbiAgICB9O1xuXG4gICAgc2xpZGVyLnNldHVwID0gZnVuY3Rpb24odHlwZSkge1xuICAgICAgLy8gU0xJREU6XG4gICAgICBpZiAoIWZhZGUpIHtcbiAgICAgICAgdmFyIHNsaWRlck9mZnNldCwgYXJyO1xuXG4gICAgICAgIGlmICh0eXBlID09PSBcImluaXRcIikge1xuICAgICAgICAgIHNsaWRlci52aWV3cG9ydCA9ICQoJzxkaXYgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ3ZpZXdwb3J0XCI+PC9kaXY+JykuY3NzKHtcIm92ZXJmbG93XCI6IFwiaGlkZGVuXCIsIFwicG9zaXRpb25cIjogXCJyZWxhdGl2ZVwifSkuYXBwZW5kVG8oc2xpZGVyKS5hcHBlbmQoc2xpZGVyLmNvbnRhaW5lcik7XG4gICAgICAgICAgLy8gSU5GSU5JVEUgTE9PUDpcbiAgICAgICAgICBzbGlkZXIuY2xvbmVDb3VudCA9IDA7XG4gICAgICAgICAgc2xpZGVyLmNsb25lT2Zmc2V0ID0gMDtcbiAgICAgICAgICAvLyBSRVZFUlNFOlxuICAgICAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgICAgICBhcnIgPSAkLm1ha2VBcnJheShzbGlkZXIuc2xpZGVzKS5yZXZlcnNlKCk7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzID0gJChhcnIpO1xuICAgICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5lbXB0eSgpLmFwcGVuZChzbGlkZXIuc2xpZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSU5GSU5JVEUgTE9PUCAmJiAhQ0FST1VTRUw6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5hbmltYXRpb25Mb29wICYmICFjYXJvdXNlbCkge1xuICAgICAgICAgIHNsaWRlci5jbG9uZUNvdW50ID0gMjtcbiAgICAgICAgICBzbGlkZXIuY2xvbmVPZmZzZXQgPSAxO1xuICAgICAgICAgIC8vIGNsZWFyIG91dCBvbGQgY2xvbmVzXG4gICAgICAgICAgaWYgKHR5cGUgIT09IFwiaW5pdFwiKSBzbGlkZXIuY29udGFpbmVyLmZpbmQoJy5jbG9uZScpLnJlbW92ZSgpO1xuICAgICAgICAgIHNsaWRlci5jb250YWluZXIuYXBwZW5kKHNsaWRlci5zbGlkZXMuZmlyc3QoKS5jbG9uZSgpLmFkZENsYXNzKCdjbG9uZScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKSkucHJlcGVuZChzbGlkZXIuc2xpZGVzLmxhc3QoKS5jbG9uZSgpLmFkZENsYXNzKCdjbG9uZScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKSk7XG5cdFx0ICAgICAgbWV0aG9kcy51bmlxdWVJRCggc2xpZGVyLnNsaWRlcy5maXJzdCgpLmNsb25lKCkuYWRkQ2xhc3MoJ2Nsb25lJykgKS5hcHBlbmRUbyggc2xpZGVyLmNvbnRhaW5lciApO1xuXHRcdCAgICAgIG1ldGhvZHMudW5pcXVlSUQoIHNsaWRlci5zbGlkZXMubGFzdCgpLmNsb25lKCkuYWRkQ2xhc3MoJ2Nsb25lJykgKS5wcmVwZW5kVG8oIHNsaWRlci5jb250YWluZXIgKTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXIubmV3U2xpZGVzID0gJChzbGlkZXIudmFycy5zZWxlY3Rvciwgc2xpZGVyKTtcblxuICAgICAgICBzbGlkZXJPZmZzZXQgPSAocmV2ZXJzZSkgPyBzbGlkZXIuY291bnQgLSAxIC0gc2xpZGVyLmN1cnJlbnRTbGlkZSArIHNsaWRlci5jbG9uZU9mZnNldCA6IHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQ7XG4gICAgICAgIC8vIFZFUlRJQ0FMOlxuICAgICAgICBpZiAodmVydGljYWwgJiYgIWNhcm91c2VsKSB7XG4gICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5oZWlnaHQoKHNsaWRlci5jb3VudCArIHNsaWRlci5jbG9uZUNvdW50KSAqIDIwMCArIFwiJVwiKS5jc3MoXCJwb3NpdGlvblwiLCBcImFic29sdXRlXCIpLndpZHRoKFwiMTAwJVwiKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzbGlkZXIubmV3U2xpZGVzLmNzcyh7XCJkaXNwbGF5XCI6IFwiYmxvY2tcIn0pO1xuICAgICAgICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuICAgICAgICAgICAgc2xpZGVyLnZpZXdwb3J0LmhlaWdodChzbGlkZXIuaCk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVyT2Zmc2V0ICogc2xpZGVyLmgsIFwiaW5pdFwiKTtcbiAgICAgICAgICB9LCAodHlwZSA9PT0gXCJpbml0XCIpID8gMTAwIDogMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci53aWR0aCgoc2xpZGVyLmNvdW50ICsgc2xpZGVyLmNsb25lQ291bnQpICogMjAwICsgXCIlXCIpO1xuICAgICAgICAgIHNsaWRlci5zZXRQcm9wcyhzbGlkZXJPZmZzZXQgKiBzbGlkZXIuY29tcHV0ZWRXLCBcImluaXRcIik7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuICAgICAgICAgICAgc2xpZGVyLm5ld1NsaWRlcy5jc3Moe1wid2lkdGhcIjogc2xpZGVyLmNvbXB1dGVkVywgXCJmbG9hdFwiOiBcImxlZnRcIiwgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIn0pO1xuICAgICAgICAgICAgLy8gU01PT1RIIEhFSUdIVDpcbiAgICAgICAgICAgIGlmIChzbGlkZXIudmFycy5zbW9vdGhIZWlnaHQpIG1ldGhvZHMuc21vb3RoSGVpZ2h0KCk7XG4gICAgICAgICAgfSwgKHR5cGUgPT09IFwiaW5pdFwiKSA/IDEwMCA6IDApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBGQURFOlxuICAgICAgICBzbGlkZXIuc2xpZGVzLmNzcyh7XCJ3aWR0aFwiOiBcIjEwMCVcIiwgXCJmbG9hdFwiOiBcImxlZnRcIiwgXCJtYXJnaW5SaWdodFwiOiBcIi0xMDAlXCIsIFwicG9zaXRpb25cIjogXCJyZWxhdGl2ZVwifSk7XG4gICAgICAgIGlmICh0eXBlID09PSBcImluaXRcIikge1xuICAgICAgICAgIGlmICghdG91Y2gpIHtcbiAgICAgICAgICAgIC8vc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5mYWRlSW4oc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsIHNsaWRlci52YXJzLmVhc2luZyk7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmNzcyh7IFwib3BhY2l0eVwiOiAwLCBcImRpc3BsYXlcIjogXCJibG9ja1wiLCBcInpJbmRleFwiOiAxIH0pLmVxKHNsaWRlci5jdXJyZW50U2xpZGUpLmNzcyh7XCJ6SW5kZXhcIjogMn0pLmFuaW1hdGUoe1wib3BhY2l0eVwiOiAxfSxzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCxzbGlkZXIudmFycy5lYXNpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmNzcyh7IFwib3BhY2l0eVwiOiAwLCBcImRpc3BsYXlcIjogXCJibG9ja1wiLCBcIndlYmtpdFRyYW5zaXRpb25cIjogXCJvcGFjaXR5IFwiICsgc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQgLyAxMDAwICsgXCJzIGVhc2VcIiwgXCJ6SW5kZXhcIjogMSB9KS5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5jc3MoeyBcIm9wYWNpdHlcIjogMSwgXCJ6SW5kZXhcIjogMn0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBTTU9PVEggSEVJR0hUOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuc21vb3RoSGVpZ2h0KSBtZXRob2RzLnNtb290aEhlaWdodCgpO1xuICAgICAgfVxuICAgICAgLy8gIUNBUk9VU0VMOlxuICAgICAgLy8gQ0FORElEQVRFOiBhY3RpdmUgc2xpZGVcbiAgICAgIGlmICghY2Fyb3VzZWwpIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuYWRkQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIik7XG5cbiAgICAgIC8vRmxleFNsaWRlcjogaW5pdCgpIENhbGxiYWNrXG4gICAgICBzbGlkZXIudmFycy5pbml0KHNsaWRlcik7XG4gICAgfTtcblxuICAgIHNsaWRlci5kb01hdGggPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzbGlkZSA9IHNsaWRlci5zbGlkZXMuZmlyc3QoKSxcbiAgICAgICAgICBzbGlkZU1hcmdpbiA9IHNsaWRlci52YXJzLml0ZW1NYXJnaW4sXG4gICAgICAgICAgbWluSXRlbXMgPSBzbGlkZXIudmFycy5taW5JdGVtcyxcbiAgICAgICAgICBtYXhJdGVtcyA9IHNsaWRlci52YXJzLm1heEl0ZW1zO1xuXG4gICAgICBzbGlkZXIudyA9IChzbGlkZXIudmlld3BvcnQ9PT11bmRlZmluZWQpID8gc2xpZGVyLndpZHRoKCkgOiBzbGlkZXIudmlld3BvcnQud2lkdGgoKTtcbiAgICAgIHNsaWRlci5oID0gc2xpZGUuaGVpZ2h0KCk7XG4gICAgICBzbGlkZXIuYm94UGFkZGluZyA9IHNsaWRlLm91dGVyV2lkdGgoKSAtIHNsaWRlLndpZHRoKCk7XG5cbiAgICAgIC8vIENBUk9VU0VMOlxuICAgICAgaWYgKGNhcm91c2VsKSB7XG4gICAgICAgIHNsaWRlci5pdGVtVCA9IHNsaWRlci52YXJzLml0ZW1XaWR0aCArIHNsaWRlTWFyZ2luO1xuICAgICAgICBzbGlkZXIubWluVyA9IChtaW5JdGVtcykgPyBtaW5JdGVtcyAqIHNsaWRlci5pdGVtVCA6IHNsaWRlci53O1xuICAgICAgICBzbGlkZXIubWF4VyA9IChtYXhJdGVtcykgPyAobWF4SXRlbXMgKiBzbGlkZXIuaXRlbVQpIC0gc2xpZGVNYXJnaW4gOiBzbGlkZXIudztcbiAgICAgICAgc2xpZGVyLml0ZW1XID0gKHNsaWRlci5taW5XID4gc2xpZGVyLncpID8gKHNsaWRlci53IC0gKHNsaWRlTWFyZ2luICogKG1pbkl0ZW1zIC0gMSkpKS9taW5JdGVtcyA6XG4gICAgICAgICAgICAgICAgICAgICAgIChzbGlkZXIubWF4VyA8IHNsaWRlci53KSA/IChzbGlkZXIudyAtIChzbGlkZU1hcmdpbiAqIChtYXhJdGVtcyAtIDEpKSkvbWF4SXRlbXMgOlxuICAgICAgICAgICAgICAgICAgICAgICAoc2xpZGVyLnZhcnMuaXRlbVdpZHRoID4gc2xpZGVyLncpID8gc2xpZGVyLncgOiBzbGlkZXIudmFycy5pdGVtV2lkdGg7XG5cbiAgICAgICAgc2xpZGVyLnZpc2libGUgPSBNYXRoLmZsb29yKHNsaWRlci53LyhzbGlkZXIuaXRlbVcpKTtcbiAgICAgICAgc2xpZGVyLm1vdmUgPSAoc2xpZGVyLnZhcnMubW92ZSA+IDAgJiYgc2xpZGVyLnZhcnMubW92ZSA8IHNsaWRlci52aXNpYmxlICkgPyBzbGlkZXIudmFycy5tb3ZlIDogc2xpZGVyLnZpc2libGU7XG4gICAgICAgIHNsaWRlci5wYWdpbmdDb3VudCA9IE1hdGguY2VpbCgoKHNsaWRlci5jb3VudCAtIHNsaWRlci52aXNpYmxlKS9zbGlkZXIubW92ZSkgKyAxKTtcbiAgICAgICAgc2xpZGVyLmxhc3QgPSAgc2xpZGVyLnBhZ2luZ0NvdW50IC0gMTtcbiAgICAgICAgc2xpZGVyLmxpbWl0ID0gKHNsaWRlci5wYWdpbmdDb3VudCA9PT0gMSkgPyAwIDpcbiAgICAgICAgICAgICAgICAgICAgICAgKHNsaWRlci52YXJzLml0ZW1XaWR0aCA+IHNsaWRlci53KSA/IChzbGlkZXIuaXRlbVcgKiAoc2xpZGVyLmNvdW50IC0gMSkpICsgKHNsaWRlTWFyZ2luICogKHNsaWRlci5jb3VudCAtIDEpKSA6ICgoc2xpZGVyLml0ZW1XICsgc2xpZGVNYXJnaW4pICogc2xpZGVyLmNvdW50KSAtIHNsaWRlci53IC0gc2xpZGVNYXJnaW47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzbGlkZXIuaXRlbVcgPSBzbGlkZXIudztcbiAgICAgICAgc2xpZGVyLnBhZ2luZ0NvdW50ID0gc2xpZGVyLmNvdW50O1xuICAgICAgICBzbGlkZXIubGFzdCA9IHNsaWRlci5jb3VudCAtIDE7XG4gICAgICB9XG4gICAgICBzbGlkZXIuY29tcHV0ZWRXID0gc2xpZGVyLml0ZW1XIC0gc2xpZGVyLmJveFBhZGRpbmc7XG4gICAgfTtcblxuICAgIHNsaWRlci51cGRhdGUgPSBmdW5jdGlvbihwb3MsIGFjdGlvbikge1xuICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuXG4gICAgICAvLyB1cGRhdGUgY3VycmVudFNsaWRlIGFuZCBzbGlkZXIuYW5pbWF0aW5nVG8gaWYgbmVjZXNzYXJ5XG4gICAgICBpZiAoIWNhcm91c2VsKSB7XG4gICAgICAgIGlmIChwb3MgPCBzbGlkZXIuY3VycmVudFNsaWRlKSB7XG4gICAgICAgICAgc2xpZGVyLmN1cnJlbnRTbGlkZSArPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKHBvcyA8PSBzbGlkZXIuY3VycmVudFNsaWRlICYmIHBvcyAhPT0gMCkge1xuICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgLT0gMTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nVG8gPSBzbGlkZXIuY3VycmVudFNsaWRlO1xuICAgICAgfVxuXG4gICAgICAvLyB1cGRhdGUgY29udHJvbE5hdlxuICAgICAgaWYgKHNsaWRlci52YXJzLmNvbnRyb2xOYXYgJiYgIXNsaWRlci5tYW51YWxDb250cm9scykge1xuICAgICAgICBpZiAoKGFjdGlvbiA9PT0gXCJhZGRcIiAmJiAhY2Fyb3VzZWwpIHx8IHNsaWRlci5wYWdpbmdDb3VudCA+IHNsaWRlci5jb250cm9sTmF2Lmxlbmd0aCkge1xuICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi51cGRhdGUoXCJhZGRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoKGFjdGlvbiA9PT0gXCJyZW1vdmVcIiAmJiAhY2Fyb3VzZWwpIHx8IHNsaWRlci5wYWdpbmdDb3VudCA8IHNsaWRlci5jb250cm9sTmF2Lmxlbmd0aCkge1xuICAgICAgICAgIGlmIChjYXJvdXNlbCAmJiBzbGlkZXIuY3VycmVudFNsaWRlID4gc2xpZGVyLmxhc3QpIHtcbiAgICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgLT0gMTtcbiAgICAgICAgICAgIHNsaWRlci5hbmltYXRpbmdUbyAtPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYudXBkYXRlKFwicmVtb3ZlXCIsIHNsaWRlci5sYXN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIGRpcmVjdGlvbk5hdlxuICAgICAgaWYgKHNsaWRlci52YXJzLmRpcmVjdGlvbk5hdikgbWV0aG9kcy5kaXJlY3Rpb25OYXYudXBkYXRlKCk7XG5cbiAgICB9O1xuXG4gICAgc2xpZGVyLmFkZFNsaWRlID0gZnVuY3Rpb24ob2JqLCBwb3MpIHtcbiAgICAgIHZhciAkb2JqID0gJChvYmopO1xuXG4gICAgICBzbGlkZXIuY291bnQgKz0gMTtcbiAgICAgIHNsaWRlci5sYXN0ID0gc2xpZGVyLmNvdW50IC0gMTtcblxuICAgICAgLy8gYXBwZW5kIG5ldyBzbGlkZVxuICAgICAgaWYgKHZlcnRpY2FsICYmIHJldmVyc2UpIHtcbiAgICAgICAgKHBvcyAhPT0gdW5kZWZpbmVkKSA/IHNsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmNvdW50IC0gcG9zKS5hZnRlcigkb2JqKSA6IHNsaWRlci5jb250YWluZXIucHJlcGVuZCgkb2JqKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChwb3MgIT09IHVuZGVmaW5lZCkgPyBzbGlkZXIuc2xpZGVzLmVxKHBvcykuYmVmb3JlKCRvYmopIDogc2xpZGVyLmNvbnRhaW5lci5hcHBlbmQoJG9iaik7XG4gICAgICB9XG5cbiAgICAgIC8vIHVwZGF0ZSBjdXJyZW50U2xpZGUsIGFuaW1hdGluZ1RvLCBjb250cm9sTmF2LCBhbmQgZGlyZWN0aW9uTmF2XG4gICAgICBzbGlkZXIudXBkYXRlKHBvcywgXCJhZGRcIik7XG5cbiAgICAgIC8vIHVwZGF0ZSBzbGlkZXIuc2xpZGVzXG4gICAgICBzbGlkZXIuc2xpZGVzID0gJChzbGlkZXIudmFycy5zZWxlY3RvciArICc6bm90KC5jbG9uZSknLCBzbGlkZXIpO1xuICAgICAgLy8gcmUtc2V0dXAgdGhlIHNsaWRlciB0byBhY2NvbWRhdGUgbmV3IHNsaWRlXG4gICAgICBzbGlkZXIuc2V0dXAoKTtcblxuICAgICAgLy9GbGV4U2xpZGVyOiBhZGRlZCgpIENhbGxiYWNrXG4gICAgICBzbGlkZXIudmFycy5hZGRlZChzbGlkZXIpO1xuICAgIH07XG4gICAgc2xpZGVyLnJlbW92ZVNsaWRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgcG9zID0gKGlzTmFOKG9iaikpID8gc2xpZGVyLnNsaWRlcy5pbmRleCgkKG9iaikpIDogb2JqO1xuXG4gICAgICAvLyB1cGRhdGUgY291bnRcbiAgICAgIHNsaWRlci5jb3VudCAtPSAxO1xuICAgICAgc2xpZGVyLmxhc3QgPSBzbGlkZXIuY291bnQgLSAxO1xuXG4gICAgICAvLyByZW1vdmUgc2xpZGVcbiAgICAgIGlmIChpc05hTihvYmopKSB7XG4gICAgICAgICQob2JqLCBzbGlkZXIuc2xpZGVzKS5yZW1vdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICh2ZXJ0aWNhbCAmJiByZXZlcnNlKSA/IHNsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmxhc3QpLnJlbW92ZSgpIDogc2xpZGVyLnNsaWRlcy5lcShvYmopLnJlbW92ZSgpO1xuICAgICAgfVxuXG4gICAgICAvLyB1cGRhdGUgY3VycmVudFNsaWRlLCBhbmltYXRpbmdUbywgY29udHJvbE5hdiwgYW5kIGRpcmVjdGlvbk5hdlxuICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuICAgICAgc2xpZGVyLnVwZGF0ZShwb3MsIFwicmVtb3ZlXCIpO1xuXG4gICAgICAvLyB1cGRhdGUgc2xpZGVyLnNsaWRlc1xuICAgICAgc2xpZGVyLnNsaWRlcyA9ICQoc2xpZGVyLnZhcnMuc2VsZWN0b3IgKyAnOm5vdCguY2xvbmUpJywgc2xpZGVyKTtcbiAgICAgIC8vIHJlLXNldHVwIHRoZSBzbGlkZXIgdG8gYWNjb21kYXRlIG5ldyBzbGlkZVxuICAgICAgc2xpZGVyLnNldHVwKCk7XG5cbiAgICAgIC8vIEZsZXhTbGlkZXI6IHJlbW92ZWQoKSBDYWxsYmFja1xuICAgICAgc2xpZGVyLnZhcnMucmVtb3ZlZChzbGlkZXIpO1xuICAgIH07XG5cbiAgICAvL0ZsZXhTbGlkZXI6IEluaXRpYWxpemVcbiAgICBtZXRob2RzLmluaXQoKTtcbiAgfTtcblxuICAvLyBFbnN1cmUgdGhlIHNsaWRlciBpc24ndCBmb2N1c3NlZCBpZiB0aGUgd2luZG93IGxvc2VzIGZvY3VzLlxuICAkKCB3aW5kb3cgKS5ibHVyKCBmdW5jdGlvbiAoIGUgKSB7XG4gICAgZm9jdXNlZCA9IGZhbHNlO1xuICB9KS5mb2N1cyggZnVuY3Rpb24gKCBlICkge1xuICAgIGZvY3VzZWQgPSB0cnVlO1xuICB9KTtcblxuICAvL0ZsZXhTbGlkZXI6IERlZmF1bHQgU2V0dGluZ3NcbiAgJC5mbGV4c2xpZGVyLmRlZmF1bHRzID0ge1xuICAgIG5hbWVzcGFjZTogXCJmbGV4LVwiLCAgICAgICAgICAgICAvL3tORVd9IFN0cmluZzogUHJlZml4IHN0cmluZyBhdHRhY2hlZCB0byB0aGUgY2xhc3Mgb2YgZXZlcnkgZWxlbWVudCBnZW5lcmF0ZWQgYnkgdGhlIHBsdWdpblxuICAgIHNlbGVjdG9yOiBcIi5zbGlkZXMgPiBsaVwiLCAgICAgICAvL3tORVd9IFNlbGVjdG9yOiBNdXN0IG1hdGNoIGEgc2ltcGxlIHBhdHRlcm4uICd7Y29udGFpbmVyfSA+IHtzbGlkZX0nIC0tIElnbm9yZSBwYXR0ZXJuIGF0IHlvdXIgb3duIHBlcmlsXG4gICAgYW5pbWF0aW9uOiBcImZhZGVcIiwgICAgICAgICAgICAgIC8vU3RyaW5nOiBTZWxlY3QgeW91ciBhbmltYXRpb24gdHlwZSwgXCJmYWRlXCIgb3IgXCJzbGlkZVwiXG4gICAgZWFzaW5nOiBcInN3aW5nXCIsICAgICAgICAgICAgICAgIC8ve05FV30gU3RyaW5nOiBEZXRlcm1pbmVzIHRoZSBlYXNpbmcgbWV0aG9kIHVzZWQgaW4galF1ZXJ5IHRyYW5zaXRpb25zLiBqUXVlcnkgZWFzaW5nIHBsdWdpbiBpcyBzdXBwb3J0ZWQhXG4gICAgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiwgICAgICAgIC8vU3RyaW5nOiBTZWxlY3QgdGhlIHNsaWRpbmcgZGlyZWN0aW9uLCBcImhvcml6b250YWxcIiBvciBcInZlcnRpY2FsXCJcbiAgICByZXZlcnNlOiBmYWxzZSwgICAgICAgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogUmV2ZXJzZSB0aGUgYW5pbWF0aW9uIGRpcmVjdGlvblxuICAgIGFuaW1hdGlvbkxvb3A6IHRydWUsICAgICAgICAgICAgLy9Cb29sZWFuOiBTaG91bGQgdGhlIGFuaW1hdGlvbiBsb29wPyBJZiBmYWxzZSwgZGlyZWN0aW9uTmF2IHdpbGwgcmVjZWl2ZWQgXCJkaXNhYmxlXCIgY2xhc3NlcyBhdCBlaXRoZXIgZW5kXG4gICAgc21vb3RoSGVpZ2h0OiBmYWxzZSwgICAgICAgICAgICAvL3tORVd9IEJvb2xlYW46IEFsbG93IGhlaWdodCBvZiB0aGUgc2xpZGVyIHRvIGFuaW1hdGUgc21vb3RobHkgaW4gaG9yaXpvbnRhbCBtb2RlXG4gICAgc3RhcnRBdDogMCwgICAgICAgICAgICAgICAgICAgICAvL0ludGVnZXI6IFRoZSBzbGlkZSB0aGF0IHRoZSBzbGlkZXIgc2hvdWxkIHN0YXJ0IG9uLiBBcnJheSBub3RhdGlvbiAoMCA9IGZpcnN0IHNsaWRlKVxuICAgIHNsaWRlc2hvdzogdHJ1ZSwgICAgICAgICAgICAgICAgLy9Cb29sZWFuOiBBbmltYXRlIHNsaWRlciBhdXRvbWF0aWNhbGx5XG4gICAgc2xpZGVzaG93U3BlZWQ6IDcwMDAsICAgICAgICAgICAvL0ludGVnZXI6IFNldCB0aGUgc3BlZWQgb2YgdGhlIHNsaWRlc2hvdyBjeWNsaW5nLCBpbiBtaWxsaXNlY29uZHNcbiAgICBhbmltYXRpb25TcGVlZDogNjAwLCAgICAgICAgICAgIC8vSW50ZWdlcjogU2V0IHRoZSBzcGVlZCBvZiBhbmltYXRpb25zLCBpbiBtaWxsaXNlY29uZHNcbiAgICBpbml0RGVsYXk6IDAsICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogU2V0IGFuIGluaXRpYWxpemF0aW9uIGRlbGF5LCBpbiBtaWxsaXNlY29uZHNcbiAgICByYW5kb21pemU6IGZhbHNlLCAgICAgICAgICAgICAgIC8vQm9vbGVhbjogUmFuZG9taXplIHNsaWRlIG9yZGVyXG4gICAgdGh1bWJDYXB0aW9uczogZmFsc2UsICAgICAgICAgICAvL0Jvb2xlYW46IFdoZXRoZXIgb3Igbm90IHRvIHB1dCBjYXB0aW9ucyBvbiB0aHVtYm5haWxzIHdoZW4gdXNpbmcgdGhlIFwidGh1bWJuYWlsc1wiIGNvbnRyb2xOYXYuXG5cbiAgICAvLyBVc2FiaWxpdHkgZmVhdHVyZXNcbiAgICBwYXVzZU9uQWN0aW9uOiB0cnVlLCAgICAgICAgICAgIC8vQm9vbGVhbjogUGF1c2UgdGhlIHNsaWRlc2hvdyB3aGVuIGludGVyYWN0aW5nIHdpdGggY29udHJvbCBlbGVtZW50cywgaGlnaGx5IHJlY29tbWVuZGVkLlxuICAgIHBhdXNlT25Ib3ZlcjogZmFsc2UsICAgICAgICAgICAgLy9Cb29sZWFuOiBQYXVzZSB0aGUgc2xpZGVzaG93IHdoZW4gaG92ZXJpbmcgb3ZlciBzbGlkZXIsIHRoZW4gcmVzdW1lIHdoZW4gbm8gbG9uZ2VyIGhvdmVyaW5nXG4gICAgcGF1c2VJbnZpc2libGU6IHRydWUsICAgXHRcdC8ve05FV30gQm9vbGVhbjogUGF1c2UgdGhlIHNsaWRlc2hvdyB3aGVuIHRhYiBpcyBpbnZpc2libGUsIHJlc3VtZSB3aGVuIHZpc2libGUuIFByb3ZpZGVzIGJldHRlciBVWCwgbG93ZXIgQ1BVIHVzYWdlLlxuICAgIHVzZUNTUzogdHJ1ZSwgICAgICAgICAgICAgICAgICAgLy97TkVXfSBCb29sZWFuOiBTbGlkZXIgd2lsbCB1c2UgQ1NTMyB0cmFuc2l0aW9ucyBpZiBhdmFpbGFibGVcbiAgICB0b3VjaDogdHJ1ZSwgICAgICAgICAgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogQWxsb3cgdG91Y2ggc3dpcGUgbmF2aWdhdGlvbiBvZiB0aGUgc2xpZGVyIG9uIHRvdWNoLWVuYWJsZWQgZGV2aWNlc1xuICAgIHZpZGVvOiBmYWxzZSwgICAgICAgICAgICAgICAgICAgLy97TkVXfSBCb29sZWFuOiBJZiB1c2luZyB2aWRlbyBpbiB0aGUgc2xpZGVyLCB3aWxsIHByZXZlbnQgQ1NTMyAzRCBUcmFuc2Zvcm1zIHRvIGF2b2lkIGdyYXBoaWNhbCBnbGl0Y2hlc1xuXG4gICAgLy8gUHJpbWFyeSBDb250cm9sc1xuICAgIGNvbnRyb2xOYXY6IHRydWUsICAgICAgICAgICAgICAgLy9Cb29sZWFuOiBDcmVhdGUgbmF2aWdhdGlvbiBmb3IgcGFnaW5nIGNvbnRyb2wgb2YgZWFjaCBjbGlkZT8gTm90ZTogTGVhdmUgdHJ1ZSBmb3IgbWFudWFsQ29udHJvbHMgdXNhZ2VcbiAgICBkaXJlY3Rpb25OYXY6IHRydWUsICAgICAgICAgICAgIC8vQm9vbGVhbjogQ3JlYXRlIG5hdmlnYXRpb24gZm9yIHByZXZpb3VzL25leHQgbmF2aWdhdGlvbj8gKHRydWUvZmFsc2UpXG4gICAgcHJldlRleHQ6IFwiUHJldmlvdXNcIiwgICAgICAgICAgIC8vU3RyaW5nOiBTZXQgdGhlIHRleHQgZm9yIHRoZSBcInByZXZpb3VzXCIgZGlyZWN0aW9uTmF2IGl0ZW1cbiAgICBuZXh0VGV4dDogXCJOZXh0XCIsICAgICAgICAgICAgICAgLy9TdHJpbmc6IFNldCB0aGUgdGV4dCBmb3IgdGhlIFwibmV4dFwiIGRpcmVjdGlvbk5hdiBpdGVtXG5cbiAgICAvLyBTZWNvbmRhcnkgTmF2aWdhdGlvblxuICAgIGtleWJvYXJkOiB0cnVlLCAgICAgICAgICAgICAgICAgLy9Cb29sZWFuOiBBbGxvdyBzbGlkZXIgbmF2aWdhdGluZyB2aWEga2V5Ym9hcmQgbGVmdC9yaWdodCBrZXlzXG4gICAgbXVsdGlwbGVLZXlib2FyZDogZmFsc2UsICAgICAgICAvL3tORVd9IEJvb2xlYW46IEFsbG93IGtleWJvYXJkIG5hdmlnYXRpb24gdG8gYWZmZWN0IG11bHRpcGxlIHNsaWRlcnMuIERlZmF1bHQgYmVoYXZpb3IgY3V0cyBvdXQga2V5Ym9hcmQgbmF2aWdhdGlvbiB3aXRoIG1vcmUgdGhhbiBvbmUgc2xpZGVyIHByZXNlbnQuXG4gICAgbW91c2V3aGVlbDogZmFsc2UsICAgICAgICAgICAgICAvL3tVUERBVEVEfSBCb29sZWFuOiBSZXF1aXJlcyBqcXVlcnkubW91c2V3aGVlbC5qcyAoaHR0cHM6Ly9naXRodWIuY29tL2JyYW5kb25hYXJvbi9qcXVlcnktbW91c2V3aGVlbCkgLSBBbGxvd3Mgc2xpZGVyIG5hdmlnYXRpbmcgdmlhIG1vdXNld2hlZWxcbiAgICBwYXVzZVBsYXk6IGZhbHNlLCAgICAgICAgICAgICAgIC8vQm9vbGVhbjogQ3JlYXRlIHBhdXNlL3BsYXkgZHluYW1pYyBlbGVtZW50XG4gICAgcGF1c2VUZXh0OiBcIlBhdXNlXCIsICAgICAgICAgICAgIC8vU3RyaW5nOiBTZXQgdGhlIHRleHQgZm9yIHRoZSBcInBhdXNlXCIgcGF1c2VQbGF5IGl0ZW1cbiAgICBwbGF5VGV4dDogXCJQbGF5XCIsICAgICAgICAgICAgICAgLy9TdHJpbmc6IFNldCB0aGUgdGV4dCBmb3IgdGhlIFwicGxheVwiIHBhdXNlUGxheSBpdGVtXG5cbiAgICAvLyBTcGVjaWFsIHByb3BlcnRpZXNcbiAgICBjb250cm9sc0NvbnRhaW5lcjogXCJcIiwgICAgICAgICAgLy97VVBEQVRFRH0galF1ZXJ5IE9iamVjdC9TZWxlY3RvcjogRGVjbGFyZSB3aGljaCBjb250YWluZXIgdGhlIG5hdmlnYXRpb24gZWxlbWVudHMgc2hvdWxkIGJlIGFwcGVuZGVkIHRvby4gRGVmYXVsdCBjb250YWluZXIgaXMgdGhlIEZsZXhTbGlkZXIgZWxlbWVudC4gRXhhbXBsZSB1c2Ugd291bGQgYmUgJChcIi5mbGV4c2xpZGVyLWNvbnRhaW5lclwiKS4gUHJvcGVydHkgaXMgaWdub3JlZCBpZiBnaXZlbiBlbGVtZW50IGlzIG5vdCBmb3VuZC5cbiAgICBtYW51YWxDb250cm9sczogXCJcIiwgICAgICAgICAgICAgLy97VVBEQVRFRH0galF1ZXJ5IE9iamVjdC9TZWxlY3RvcjogRGVjbGFyZSBjdXN0b20gY29udHJvbCBuYXZpZ2F0aW9uLiBFeGFtcGxlcyB3b3VsZCBiZSAkKFwiLmZsZXgtY29udHJvbC1uYXYgbGlcIikgb3IgXCIjdGFicy1uYXYgbGkgaW1nXCIsIGV0Yy4gVGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiB5b3VyIGNvbnRyb2xOYXYgc2hvdWxkIG1hdGNoIHRoZSBudW1iZXIgb2Ygc2xpZGVzL3RhYnMuXG4gICAgc3luYzogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgIC8ve05FV30gU2VsZWN0b3I6IE1pcnJvciB0aGUgYWN0aW9ucyBwZXJmb3JtZWQgb24gdGhpcyBzbGlkZXIgd2l0aCBhbm90aGVyIHNsaWRlci4gVXNlIHdpdGggY2FyZS5cbiAgICBhc05hdkZvcjogXCJcIiwgICAgICAgICAgICAgICAgICAgLy97TkVXfSBTZWxlY3RvcjogSW50ZXJuYWwgcHJvcGVydHkgZXhwb3NlZCBmb3IgdHVybmluZyB0aGUgc2xpZGVyIGludG8gYSB0aHVtYm5haWwgbmF2aWdhdGlvbiBmb3IgYW5vdGhlciBzbGlkZXJcblxuICAgIC8vIENhcm91c2VsIE9wdGlvbnNcbiAgICBpdGVtV2lkdGg6IDAsICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogQm94LW1vZGVsIHdpZHRoIG9mIGluZGl2aWR1YWwgY2Fyb3VzZWwgaXRlbXMsIGluY2x1ZGluZyBob3Jpem9udGFsIGJvcmRlcnMgYW5kIHBhZGRpbmcuXG4gICAgaXRlbU1hcmdpbjogMCwgICAgICAgICAgICAgICAgICAvL3tORVd9IEludGVnZXI6IE1hcmdpbiBiZXR3ZWVuIGNhcm91c2VsIGl0ZW1zLlxuICAgIG1pbkl0ZW1zOiAxLCAgICAgICAgICAgICAgICAgICAgLy97TkVXfSBJbnRlZ2VyOiBNaW5pbXVtIG51bWJlciBvZiBjYXJvdXNlbCBpdGVtcyB0aGF0IHNob3VsZCBiZSB2aXNpYmxlLiBJdGVtcyB3aWxsIHJlc2l6ZSBmbHVpZGx5IHdoZW4gYmVsb3cgdGhpcy5cbiAgICBtYXhJdGVtczogMCwgICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogTWF4bWltdW0gbnVtYmVyIG9mIGNhcm91c2VsIGl0ZW1zIHRoYXQgc2hvdWxkIGJlIHZpc2libGUuIEl0ZW1zIHdpbGwgcmVzaXplIGZsdWlkbHkgd2hlbiBhYm92ZSB0aGlzIGxpbWl0LlxuICAgIG1vdmU6IDAsICAgICAgICAgICAgICAgICAgICAgICAgLy97TkVXfSBJbnRlZ2VyOiBOdW1iZXIgb2YgY2Fyb3VzZWwgaXRlbXMgdGhhdCBzaG91bGQgbW92ZSBvbiBhbmltYXRpb24uIElmIDAsIHNsaWRlciB3aWxsIG1vdmUgYWxsIHZpc2libGUgaXRlbXMuXG4gICAgYWxsb3dPbmVTbGlkZTogdHJ1ZSwgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogV2hldGhlciBvciBub3QgdG8gYWxsb3cgYSBzbGlkZXIgY29tcHJpc2VkIG9mIGEgc2luZ2xlIHNsaWRlXG5cbiAgICAvLyBDYWxsYmFjayBBUElcbiAgICBzdGFydDogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgIC8vQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyB3aGVuIHRoZSBzbGlkZXIgbG9hZHMgdGhlIGZpcnN0IHNsaWRlXG4gICAgYmVmb3JlOiBmdW5jdGlvbigpe30sICAgICAgICAgICAvL0NhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgYXN5bmNocm9ub3VzbHkgd2l0aCBlYWNoIHNsaWRlciBhbmltYXRpb25cbiAgICBhZnRlcjogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgIC8vQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyBhZnRlciBlYWNoIHNsaWRlciBhbmltYXRpb24gY29tcGxldGVzXG4gICAgZW5kOiBmdW5jdGlvbigpe30sICAgICAgICAgICAgICAvL0NhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgd2hlbiB0aGUgc2xpZGVyIHJlYWNoZXMgdGhlIGxhc3Qgc2xpZGUgKGFzeW5jaHJvbm91cylcbiAgICBhZGRlZDogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgIC8ve05FV30gQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyBhZnRlciBhIHNsaWRlIGlzIGFkZGVkXG4gICAgcmVtb3ZlZDogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgLy97TkVXfSBDYWxsYmFjazogZnVuY3Rpb24oc2xpZGVyKSAtIEZpcmVzIGFmdGVyIGEgc2xpZGUgaXMgcmVtb3ZlZFxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge30gICAgICAgICAgICAgLy97TkVXfSBDYWxsYmFjazogZnVuY3Rpb24oc2xpZGVyKSAtIEZpcmVzIGFmdGVyIHRoZSBzbGlkZXIgaXMgaW5pdGlhbGx5IHNldHVwXG4gIH07XG5cbiAgLy9GbGV4U2xpZGVyOiBQbHVnaW4gRnVuY3Rpb25cbiAgJC5mbi5mbGV4c2xpZGVyID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zID09PSB1bmRlZmluZWQpIG9wdGlvbnMgPSB7fTtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHNlbGVjdG9yID0gKG9wdGlvbnMuc2VsZWN0b3IpID8gb3B0aW9ucy5zZWxlY3RvciA6IFwiLnNsaWRlcyA+IGxpXCIsXG4gICAgICAgICAgICAkc2xpZGVzID0gJHRoaXMuZmluZChzZWxlY3Rvcik7XG5cbiAgICAgIGlmICggKCAkc2xpZGVzLmxlbmd0aCA9PT0gMSAmJiBvcHRpb25zLmFsbG93T25lU2xpZGUgPT09IHRydWUgKSB8fCAkc2xpZGVzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAkc2xpZGVzLmZhZGVJbig0MDApO1xuICAgICAgICAgIGlmIChvcHRpb25zLnN0YXJ0KSBvcHRpb25zLnN0YXJ0KCR0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmICgkdGhpcy5kYXRhKCdmbGV4c2xpZGVyJykgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG5ldyAkLmZsZXhzbGlkZXIodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBIZWxwZXIgc3RyaW5ncyB0byBxdWlja2x5IHBlcmZvcm0gZnVuY3Rpb25zIG9uIHRoZSBzbGlkZXJcbiAgICAgIHZhciAkc2xpZGVyID0gJCh0aGlzKS5kYXRhKCdmbGV4c2xpZGVyJyk7XG4gICAgICBzd2l0Y2ggKG9wdGlvbnMpIHtcbiAgICAgICAgY2FzZSBcInBsYXlcIjogJHNsaWRlci5wbGF5KCk7IGJyZWFrO1xuICAgICAgICBjYXNlIFwicGF1c2VcIjogJHNsaWRlci5wYXVzZSgpOyBicmVhaztcbiAgICAgICAgY2FzZSBcInN0b3BcIjogJHNsaWRlci5zdG9wKCk7IGJyZWFrO1xuICAgICAgICBjYXNlIFwibmV4dFwiOiAkc2xpZGVyLmZsZXhBbmltYXRlKCRzbGlkZXIuZ2V0VGFyZ2V0KFwibmV4dFwiKSwgdHJ1ZSk7IGJyZWFrO1xuICAgICAgICBjYXNlIFwicHJldlwiOlxuICAgICAgICBjYXNlIFwicHJldmlvdXNcIjogJHNsaWRlci5mbGV4QW5pbWF0ZSgkc2xpZGVyLmdldFRhcmdldChcInByZXZcIiksIHRydWUpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDogaWYgKHR5cGVvZiBvcHRpb25zID09PSBcIm51bWJlclwiKSAkc2xpZGVyLmZsZXhBbmltYXRlKG9wdGlvbnMsIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0pKGpRdWVyeSk7XG4iLCIvKlxuICpcdGpRdWVyeSBlbGV2YXRlWm9vbSAzLjAuOFxuICpcdERlbW8ncyBhbmQgZG9jdW1lbnRhdGlvbjpcbiAqXHR3d3cuZWxldmF0ZXdlYi5jby51ay9pbWFnZS16b29tXG4gKlxuICpcdENvcHlyaWdodCAoYykgMjAxMiBBbmRyZXcgRWFkZXNcbiAqXHR3d3cuZWxldmF0ZXdlYi5jby51a1xuICpcbiAqXHREdWFsIGxpY2Vuc2VkIHVuZGVyIHRoZSBHUEwgYW5kIE1JVCBsaWNlbnNlcy5cbiAqXHRodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlXG4gKlx0aHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9HTlVfR2VuZXJhbF9QdWJsaWNfTGljZW5zZVxuICpcblxuLypcbiAqXHRqUXVlcnkgZWxldmF0ZVpvb20gMy4wLjNcbiAqXHREZW1vJ3MgYW5kIGRvY3VtZW50YXRpb246XG4gKlx0d3d3LmVsZXZhdGV3ZWIuY28udWsvaW1hZ2Utem9vbVxuICpcbiAqXHRDb3B5cmlnaHQgKGMpIDIwMTIgQW5kcmV3IEVhZGVzXG4gKlx0d3d3LmVsZXZhdGV3ZWIuY28udWtcbiAqXG4gKlx0RHVhbCBsaWNlbnNlZCB1bmRlciB0aGUgR1BMIGFuZCBNSVQgbGljZW5zZXMuXG4gKlx0aHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZVxuICpcdGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvR05VX0dlbmVyYWxfUHVibGljX0xpY2Vuc2VcbiAqL1xuXG5cbmlmICggdHlwZW9mIE9iamVjdC5jcmVhdGUgIT09ICdmdW5jdGlvbicgKSB7XG4gICAgT2JqZWN0LmNyZWF0ZSA9IGZ1bmN0aW9uKCBvYmogKSB7XG4gICAgICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICAgICAgRi5wcm90b3R5cGUgPSBvYmo7XG4gICAgICAgIHJldHVybiBuZXcgRigpO1xuICAgIH07XG59XG5cbihmdW5jdGlvbiggJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkICkge1xuICAgIHZhciBFbGV2YXRlWm9vbSA9IHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCBvcHRpb25zLCBlbGVtICkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbSA9IGVsZW07XG4gICAgICAgICAgICAgICAgc2VsZi4kZWxlbSA9ICQoIGVsZW0gKTtcblxuICAgICAgICAgICAgICAgIHNlbGYuaW1hZ2VTcmMgPSBzZWxmLiRlbGVtLmRhdGEoXCJ6b29tLWltYWdlXCIpID8gc2VsZi4kZWxlbS5kYXRhKFwiem9vbS1pbWFnZVwiKSA6IHNlbGYuJGVsZW0uYXR0cihcInNyY1wiKTtcblxuICAgICAgICAgICAgICAgIHNlbGYub3B0aW9ucyA9ICQuZXh0ZW5kKCB7fSwgJC5mbi5lbGV2YXRlWm9vbS5vcHRpb25zLCBvcHRpb25zICk7XG5cbiAgICAgICAgICAgICAgICAvL1RJTlQgT1ZFUlJJREUgU0VUVElOR1NcbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMudGludCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMubGVuc0NvbG91ciA9IFwibm9uZVwiLCAvL2NvbG91ciBvZiB0aGUgbGVucyBiYWNrZ3JvdW5kXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub3B0aW9ucy5sZW5zT3BhY2l0eSA9ICBcIjFcIiAvL29wYWNpdHkgb2YgdGhlIGxlbnNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9JTk5FUiBPVkVSUklERSBTRVRUSU5HU1xuICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImlubmVyXCIpIHtzZWxmLm9wdGlvbnMuc2hvd0xlbnMgPSBmYWxzZTt9XG5cblxuICAgICAgICAgICAgICAgIC8vUmVtb3ZlIGFsdCBvbiBob3ZlclxuXG4gICAgICAgICAgICAgICAgc2VsZi4kZWxlbS5wYXJlbnQoKS5yZW1vdmVBdHRyKCd0aXRsZScpLnJlbW92ZUF0dHIoJ2FsdCcpO1xuXG4gICAgICAgICAgICAgICAgc2VsZi56b29tSW1hZ2UgPSBzZWxmLmltYWdlU3JjO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5yZWZyZXNoKCAxICk7XG5cblxuXG4gICAgICAgICAgICAgICAgLy9DcmVhdGUgdGhlIGltYWdlIHN3YXAgZnJvbSB0aGUgZ2FsbGVyeVxuICAgICAgICAgICAgICAgICQoJyMnK3NlbGYub3B0aW9ucy5nYWxsZXJ5ICsgJyBhJykuY2xpY2soIGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICAgICAgICAgICAgICAvL1NldCBhIGNsYXNzIG9uIHRoZSBjdXJyZW50bHkgYWN0aXZlIGdhbGxlcnkgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLmdhbGxlcnlBY3RpdmVDbGFzcyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjJytzZWxmLm9wdGlvbnMuZ2FsbGVyeSArICcgYScpLnJlbW92ZUNsYXNzKHNlbGYub3B0aW9ucy5nYWxsZXJ5QWN0aXZlQ2xhc3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhzZWxmLm9wdGlvbnMuZ2FsbGVyeUFjdGl2ZUNsYXNzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvL3N0b3AgYW55IGxpbmsgb24gdGhlIGEgdGFnIGZyb20gd29ya2luZ1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9jYWxsIHRoZSBzd2FwIGltYWdlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmKCQodGhpcykuZGF0YShcInpvb20taW1hZ2VcIikpe3NlbGYuem9vbUltYWdlUHJlID0gJCh0aGlzKS5kYXRhKFwiem9vbS1pbWFnZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtzZWxmLnpvb21JbWFnZVByZSA9ICQodGhpcykuZGF0YShcImltYWdlXCIpO31cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zd2FwdGhlaW1hZ2UoJCh0aGlzKS5kYXRhKFwiaW1hZ2VcIiksIHNlbGYuem9vbUltYWdlUHJlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZWZyZXNoOiBmdW5jdGlvbiggbGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZmV0Y2goc2VsZi5pbWFnZVNyYyk7XG5cbiAgICAgICAgICAgICAgICB9LCBsZW5ndGggfHwgc2VsZi5vcHRpb25zLnJlZnJlc2ggKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZldGNoOiBmdW5jdGlvbihpbWdzcmMpIHtcbiAgICAgICAgICAgICAgICAvL2dldCB0aGUgaW1hZ2VcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0ltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgICAgIG5ld0ltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9zZXQgdGhlIGxhcmdlIGltYWdlIGRpbWVuc2lvbnMgLSB1c2VkIHRvIGNhbGN1bHRlIHJhdGlvJ3NcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sYXJnZVdpZHRoID0gbmV3SW1nLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxhcmdlSGVpZ2h0ID0gbmV3SW1nLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgLy9vbmNlIGltYWdlIGlzIGxvYWRlZCBzdGFydCB0aGUgY2FsbHNcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGFydFpvb20oKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50SW1hZ2UgPSBzZWxmLmltYWdlU3JjO1xuICAgICAgICAgICAgICAgICAgICAvL2xldCBjYWxsZXIga25vdyBpbWFnZSBoYXMgYmVlbiBsb2FkZWRcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zLm9uWm9vbWVkSW1hZ2VMb2FkZWQoc2VsZi4kZWxlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5ld0ltZy5zcmMgPSBpbWdzcmM7IC8vIHRoaXMgbXVzdCBiZSBkb25lIEFGVEVSIHNldHRpbmcgb25sb2FkXG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHN0YXJ0Wm9vbTogZnVuY3Rpb24oICkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICAvL2dldCBkaW1lbnNpb25zIG9mIHRoZSBub24gem9vbWVkIGltYWdlXG4gICAgICAgICAgICAgICAgc2VsZi5ueldpZHRoID0gc2VsZi4kZWxlbS53aWR0aCgpO1xuICAgICAgICAgICAgICAgIHNlbGYubnpIZWlnaHQgPSBzZWxmLiRlbGVtLmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgICAgLy9hY3RpdmF0ZWQgZWxlbWVudHNcbiAgICAgICAgICAgICAgICBzZWxmLmlzV2luZG93QWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc2VsZi5pc0xlbnNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZWxmLmlzVGludEFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNlbGYub3ZlcldpbmRvdyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy9Dcm9zc0ZhZGUgV3JhcHBlXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLmltYWdlQ3Jvc3NmYWRlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV3JhcCA9IHNlbGYuJGVsZW0ud3JhcCgnPGRpdiBzdHlsZT1cImhlaWdodDonK3NlbGYubnpIZWlnaHQrJ3B4O3dpZHRoOicrc2VsZi5ueldpZHRoKydweDtcIiBjbGFzcz1cInpvb21XcmFwcGVyXCIgLz4nKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZWxlbS5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2VsZi56b29tTG9jayA9IDE7XG4gICAgICAgICAgICAgICAgc2VsZi5zY3JvbGxpbmdMb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2VCZ1NpemUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRab29tTGV2ZWwgPSBzZWxmLm9wdGlvbnMuem9vbUxldmVsO1xuXG5cbiAgICAgICAgICAgICAgICAvL2dldCBvZmZzZXQgb2YgdGhlIG5vbiB6b29tZWQgaW1hZ2VcbiAgICAgICAgICAgICAgICBzZWxmLm56T2Zmc2V0ID0gc2VsZi4kZWxlbS5vZmZzZXQoKTtcbiAgICAgICAgICAgICAgICAvL2NhbGN1bGF0ZSB0aGUgd2lkdGggcmF0aW8gb2YgdGhlIGxhcmdlL3NtYWxsIGltYWdlXG4gICAgICAgICAgICAgICAgc2VsZi53aWR0aFJhdGlvID0gKHNlbGYubGFyZ2VXaWR0aC9zZWxmLmN1cnJlbnRab29tTGV2ZWwpIC8gc2VsZi5ueldpZHRoO1xuICAgICAgICAgICAgICAgIHNlbGYuaGVpZ2h0UmF0aW8gPSAoc2VsZi5sYXJnZUhlaWdodC9zZWxmLmN1cnJlbnRab29tTGV2ZWwpIC8gc2VsZi5uekhlaWdodDtcblxuXG4gICAgICAgICAgICAgICAgLy9pZiB3aW5kb3cgem9vbVxuICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcIndpbmRvd1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvd1N0eWxlID0gXCJvdmVyZmxvdzogaGlkZGVuO1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiYmFja2dyb3VuZC1wb3NpdGlvbjogMHB4IDBweDt0ZXh0LWFsaWduOmNlbnRlcjtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcImJhY2tncm91bmQtY29sb3I6IFwiICsgU3RyaW5nKHNlbGYub3B0aW9ucy56b29tV2luZG93QmdDb2xvdXIpXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiO3dpZHRoOiBcIiArIFN0cmluZyhzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1dpZHRoKSArIFwicHg7XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJoZWlnaHQ6IFwiICsgU3RyaW5nKHNlbGYub3B0aW9ucy56b29tV2luZG93SGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcInB4O2Zsb2F0OiBsZWZ0O1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiYmFja2dyb3VuZC1zaXplOiBcIisgc2VsZi5sYXJnZVdpZHRoL3NlbGYuY3VycmVudFpvb21MZXZlbCsgXCJweCBcIiArc2VsZi5sYXJnZUhlaWdodC9zZWxmLmN1cnJlbnRab29tTGV2ZWwgKyBcInB4O1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiZGlzcGxheTogbm9uZTt6LWluZGV4OjEwMDtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcImJvcmRlcjogXCIgKyBTdHJpbmcoc2VsZi5vcHRpb25zLmJvcmRlclNpemUpXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwicHggc29saWQgXCIgKyBzZWxmLm9wdGlvbnMuYm9yZGVyQ29sb3VyXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiO2JhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJwb3NpdGlvbjogYWJzb2x1dGU7XCI7XG4gICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAvL2lmIGlubmVyICB6b29tXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwiaW5uZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAvL2hhcyBhIGJvcmRlciBiZWVuIHB1dCBvbiB0aGUgaW1hZ2U/IExldHMgY2F0ZXIgZm9yIHRoaXNcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYm9yZGVyV2lkdGggPSBzZWxmLiRlbGVtLmNzcyhcImJvcmRlci1sZWZ0LXdpZHRoXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvd1N0eWxlID0gXCJvdmVyZmxvdzogaGlkZGVuO1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwibWFyZ2luLWxlZnQ6IFwiICsgU3RyaW5nKGJvcmRlcldpZHRoKSArIFwiO1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwibWFyZ2luLXRvcDogXCIgKyBTdHJpbmcoYm9yZGVyV2lkdGgpICsgXCI7XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJiYWNrZ3JvdW5kLXBvc2l0aW9uOiAwcHggMHB4O1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwid2lkdGg6IFwiICsgU3RyaW5nKHNlbGYubnpXaWR0aCkgKyBcInB4O1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiaGVpZ2h0OiBcIiArIFN0cmluZyhzZWxmLm56SGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcInB4O2Zsb2F0OiBsZWZ0O1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiZGlzcGxheTogbm9uZTtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcImN1cnNvcjpcIisoc2VsZi5vcHRpb25zLmN1cnNvcikrXCI7XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJweCBzb2xpZCBcIiArIHNlbGYub3B0aW9ucy5ib3JkZXJDb2xvdXJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCI7YmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcInBvc2l0aW9uOiBhYnNvbHV0ZTtcIjtcbiAgICAgICAgICAgICAgICB9XG5cblxuXG4gICAgICAgICAgICAgICAgLy9sZW5zIHN0eWxlIGZvciB3aW5kb3cgem9vbVxuICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcIndpbmRvd1wiKSB7XG5cblxuICAgICAgICAgICAgICAgICAgICAvLyBhZGp1c3QgaW1hZ2VzIGxlc3MgdGhhbiB0aGUgd2luZG93IGhlaWdodFxuXG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYubnpIZWlnaHQgPCBzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1dpZHRoL3NlbGYud2lkdGhSYXRpbyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5zSGVpZ2h0ID0gc2VsZi5uekhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVuc0hlaWdodCA9IFN0cmluZygoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dIZWlnaHQvc2VsZi5oZWlnaHRSYXRpbykpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5sYXJnZVdpZHRoIDwgc2VsZi5vcHRpb25zLnpvb21XaW5kb3dXaWR0aCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5zV2lkdGggPSBzZWxmLm56V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbnNXaWR0aCA9ICAoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dXaWR0aC9zZWxmLndpZHRoUmF0aW8pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmxlbnNTdHlsZSA9IFwiYmFja2dyb3VuZC1wb3NpdGlvbjogMHB4IDBweDt3aWR0aDogXCIgKyBTdHJpbmcoKHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgpL3NlbGYud2lkdGhSYXRpbykgKyBcInB4O2hlaWdodDogXCIgKyBTdHJpbmcoKHNlbGYub3B0aW9ucy56b29tV2luZG93SGVpZ2h0KS9zZWxmLmhlaWdodFJhdGlvKVxuICAgICAgICAgICAgICAgICAgICArIFwicHg7ZmxvYXQ6IHJpZ2h0O2Rpc3BsYXk6IG5vbmU7XCJcbiAgICAgICAgICAgICAgICAgICAgKyBcIm92ZXJmbG93OiBoaWRkZW47XCJcbiAgICAgICAgICAgICAgICAgICAgKyBcInotaW5kZXg6IDk5OTtcIlxuICAgICAgICAgICAgICAgICAgICArIFwiLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7XCJcbiAgICAgICAgICAgICAgICAgICAgKyBcIm9wYWNpdHk6XCIrKHNlbGYub3B0aW9ucy5sZW5zT3BhY2l0eSkrXCI7ZmlsdGVyOiBhbHBoYShvcGFjaXR5ID0gXCIrKHNlbGYub3B0aW9ucy5sZW5zT3BhY2l0eSoxMDApK1wiKTsgem9vbToxO1wiXG4gICAgICAgICAgICAgICAgICAgICsgXCJ3aWR0aDpcIitsZW5zV2lkdGgrXCJweDtcIlxuICAgICAgICAgICAgICAgICAgICArIFwiaGVpZ2h0OlwiK2xlbnNIZWlnaHQrXCJweDtcIlxuICAgICAgICAgICAgICAgICAgICArIFwiYmFja2dyb3VuZC1jb2xvcjpcIisoc2VsZi5vcHRpb25zLmxlbnNDb2xvdXIpK1wiO1wiXG4gICAgICAgICAgICAgICAgICAgICsgXCJjdXJzb3I6XCIrKHNlbGYub3B0aW9ucy5jdXJzb3IpK1wiO1wiXG4gICAgICAgICAgICAgICAgICAgICsgXCJib3JkZXI6IFwiKyhzZWxmLm9wdGlvbnMubGVuc0JvcmRlclNpemUpK1wicHhcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiIHNvbGlkIFwiKyhzZWxmLm9wdGlvbnMubGVuc0JvcmRlckNvbG91cikrXCI7YmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtwb3NpdGlvbjogYWJzb2x1dGU7XCI7XG4gICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAvL3RpbnQgc3R5bGVcbiAgICAgICAgICAgICAgICBzZWxmLnRpbnRTdHlsZSA9IFwiZGlzcGxheTogYmxvY2s7XCJcbiAgICAgICAgICAgICAgICAgICAgKyBcInBvc2l0aW9uOiBhYnNvbHV0ZTtcIlxuICAgICAgICAgICAgICAgICAgICArIFwiYmFja2dyb3VuZC1jb2xvcjogXCIrc2VsZi5vcHRpb25zLnRpbnRDb2xvdXIrXCI7XCJcbiAgICAgICAgICAgICAgICAgICAgKyBcImZpbHRlcjphbHBoYShvcGFjaXR5PTApO1wiXG4gICAgICAgICAgICAgICAgICAgICsgXCJvcGFjaXR5OiAwO1wiXG4gICAgICAgICAgICAgICAgICAgICsgXCJ3aWR0aDogXCIgKyBzZWxmLm56V2lkdGggKyBcInB4O1wiXG4gICAgICAgICAgICAgICAgICAgICsgXCJoZWlnaHQ6IFwiICsgc2VsZi5uekhlaWdodCArIFwicHg7XCJcblxuICAgICAgICAgICAgICAgICAgICA7XG5cbiAgICAgICAgICAgICAgICAvL2xlbnMgc3R5bGUgZm9yIGxlbnMgem9vbSB3aXRoIG9wdGlvbmFsIHJvdW5kIGZvciBtb2Rlcm4gYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBzZWxmLmxlbnNSb3VuZCA9ICcnO1xuXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwibGVuc1wiKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sZW5zU3R5bGUgPSBcImJhY2tncm91bmQtcG9zaXRpb246IDBweCAwcHg7XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCJmbG9hdDogbGVmdDtkaXNwbGF5OiBub25lO1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiYm9yZGVyOiBcIiArIFN0cmluZyhzZWxmLm9wdGlvbnMuYm9yZGVyU2l6ZSkgKyBcInB4IHNvbGlkIFwiICsgc2VsZi5vcHRpb25zLmJvcmRlckNvbG91citcIjtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcIndpZHRoOlwiKyBTdHJpbmcoc2VsZi5vcHRpb25zLmxlbnNTaXplKSArXCJweDtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcImhlaWdodDpcIisgU3RyaW5nKHNlbGYub3B0aW9ucy5sZW5zU2l6ZSkrXCJweDtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBcImJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7cG9zaXRpb246IGFic29sdXRlO1wiO1xuXG5cbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIC8vZG9lcyBub3Qgcm91bmQgaW4gYWxsIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLmxlbnNTaGFwZSA9PSBcInJvdW5kXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sZW5zUm91bmQgPSBcImJvcmRlci10b3AtbGVmdC1yYWRpdXM6IFwiICsgU3RyaW5nKHNlbGYub3B0aW9ucy5sZW5zU2l6ZSAvIDIgKyBzZWxmLm9wdGlvbnMuYm9yZGVyU2l6ZSkgKyBcInB4O1wiXG4gICAgICAgICAgICAgICAgICAgICsgXCJib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogXCIgKyBTdHJpbmcoc2VsZi5vcHRpb25zLmxlbnNTaXplIC8gMiArIHNlbGYub3B0aW9ucy5ib3JkZXJTaXplKSArIFwicHg7XCJcbiAgICAgICAgICAgICAgICAgICAgKyBcImJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6IFwiICsgU3RyaW5nKHNlbGYub3B0aW9ucy5sZW5zU2l6ZSAvIDIgKyBzZWxmLm9wdGlvbnMuYm9yZGVyU2l6ZSkgKyBcInB4O1wiXG4gICAgICAgICAgICAgICAgICAgICsgXCJib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czogXCIgKyBTdHJpbmcoc2VsZi5vcHRpb25zLmxlbnNTaXplIC8gMiArIHNlbGYub3B0aW9ucy5ib3JkZXJTaXplKSArIFwicHg7XCI7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL2NyZWF0ZSB0aGUgZGl2J3MgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXCJcbiAgICAgICAgICAgICAgICAvL3NlbGYuem9vbUNvbnRhaW5lciA9ICQoJzxkaXYvPicpLmFkZENsYXNzKCd6b29tQ29udGFpbmVyJykuY3NzKHtcInBvc2l0aW9uXCI6XCJyZWxhdGl2ZVwiLCBcImhlaWdodFwiOnNlbGYubnpIZWlnaHQsIFwid2lkdGhcIjpzZWxmLm56V2lkdGh9KTtcblxuICAgICAgICAgICAgICAgIHNlbGYuem9vbUNvbnRhaW5lciA9ICQoJzxkaXYgY2xhc3M9XCJ6b29tQ29udGFpbmVyXCIgc3R5bGU9XCItd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oicrc2VsZi5uek9mZnNldC5sZWZ0KydweDt0b3A6JytzZWxmLm56T2Zmc2V0LnRvcCsncHg7aGVpZ2h0Oicrc2VsZi5uekhlaWdodCsncHg7d2lkdGg6JytzZWxmLm56V2lkdGgrJ3B4O1wiPjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoc2VsZi56b29tQ29udGFpbmVyKTtcblxuXG4gICAgICAgICAgICAgICAgLy90aGlzIHdpbGwgYWRkIG92ZXJmbG93IGhpZGRlbiBhbmQgY29udHJhaW4gdGhlIGxlbnMgb24gbGVucyBtb2RlXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLmNvbnRhaW5MZW5zWm9vbSAmJiBzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJsZW5zXCIpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuY3NzKFwib3ZlcmZsb3dcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImlubmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tTGVucyA9ICQoXCI8ZGl2IGNsYXNzPSd6b29tTGVucycgc3R5bGU9J1wiICsgc2VsZi5sZW5zU3R5bGUgKyBzZWxmLmxlbnNSb3VuZCArXCInPiZuYnNwOzwvZGl2PlwiKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oc2VsZi56b29tQ29udGFpbmVyKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZWxlbS50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy50aW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbnRDb250YWluZXIgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcygndGludENvbnRhaW5lcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludCA9ICQoXCI8ZGl2IGNsYXNzPSd6b29tVGludCcgc3R5bGU9J1wiK3NlbGYudGludFN0eWxlK1wiJz48L2Rpdj5cIik7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tTGVucy53cmFwKHNlbGYudGludENvbnRhaW5lcik7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludGNzcyA9IHNlbGYuem9vbUxlbnMuYWZ0ZXIoc2VsZi56b29tVGludCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYgdGludCBlbmFibGVkIC0gc2V0IGFuIGltYWdlIHRvIHNob3cgb3ZlciB0aGUgdGludFxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50SW1hZ2UgPSAkKCc8aW1nIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiAwcHg7IHRvcDogMHB4OyBtYXgtd2lkdGg6IG5vbmU7IHdpZHRoOiAnK3NlbGYubnpXaWR0aCsncHg7IGhlaWdodDogJytzZWxmLm56SGVpZ2h0KydweDtcIiBzcmM9XCInK3NlbGYuaW1hZ2VTcmMrJ1wiPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oc2VsZi56b29tTGVucylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRlbGVtLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cblxuXG5cblxuXG5cbiAgICAgICAgICAgICAgICAvL2NyZWF0ZSB6b29tIHdpbmRvd1xuICAgICAgICAgICAgICAgIGlmKGlzTmFOKHNlbGYub3B0aW9ucy56b29tV2luZG93UG9zaXRpb24pKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93ID0gJChcIjxkaXYgc3R5bGU9J3otaW5kZXg6OTk5O2xlZnQ6XCIrKHNlbGYud2luZG93T2Zmc2V0TGVmdCkrXCJweDt0b3A6XCIrKHNlbGYud2luZG93T2Zmc2V0VG9wKStcInB4O1wiICsgc2VsZi56b29tV2luZG93U3R5bGUgKyBcIicgY2xhc3M9J3pvb21XaW5kb3cnPiZuYnNwOzwvZGl2PlwiKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oJ2JvZHknKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZWxlbS50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93ID0gJChcIjxkaXYgc3R5bGU9J3otaW5kZXg6OTk5O2xlZnQ6XCIrKHNlbGYud2luZG93T2Zmc2V0TGVmdCkrXCJweDt0b3A6XCIrKHNlbGYud2luZG93T2Zmc2V0VG9wKStcInB4O1wiICsgc2VsZi56b29tV2luZG93U3R5bGUgKyBcIicgY2xhc3M9J3pvb21XaW5kb3cnPiZuYnNwOzwvZGl2PlwiKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oc2VsZi56b29tQ29udGFpbmVyKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZWxlbS50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93Q29udGFpbmVyID0gJCgnPGRpdi8+JykuYWRkQ2xhc3MoJ3pvb21XaW5kb3dDb250YWluZXInKS5jc3MoXCJ3aWR0aFwiLHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgpO1xuICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy53cmFwKHNlbGYuem9vbVdpbmRvd0NvbnRhaW5lcik7XG5cblxuICAgICAgICAgICAgICAgIC8vICBzZWxmLmNhcHRpb25TdHlsZSA9IFwidGV4dC1hbGlnbjogbGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiBibGFjaztjb2xvcjogd2hpdGU7Zm9udC13ZWlnaHQ6IGJvbGQ7cGFkZGluZzogMTBweDtmb250LWZhbWlseTogc2Fucy1zZXJpZjtmb250LXNpemU6IDExcHhcIjtcbiAgICAgICAgICAgICAgICAvLyBzZWxmLnpvb21DYXB0aW9uID0gJCgnPGRpdiBjbGFzcz1cImVsZXZhdGV6b29tLWNhcHRpb25cIiBzdHlsZT1cIicrc2VsZi5jYXB0aW9uU3R5bGUrJ2Rpc3BsYXk6IGJsb2NrOyB3aWR0aDogMjgwcHg7XCI+SU5TRVJUIEFMVCBUQUc8L2Rpdj4nKS5hcHBlbmRUbyhzZWxmLnpvb21XaW5kb3cucGFyZW50KCkpO1xuXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwibGVuc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUxlbnMuY3NzKHsgYmFja2dyb3VuZEltYWdlOiBcInVybCgnXCIgKyBzZWxmLmltYWdlU3JjICsgXCInKVwiIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJ3aW5kb3dcIikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgYmFja2dyb3VuZEltYWdlOiBcInVybCgnXCIgKyBzZWxmLmltYWdlU3JjICsgXCInKVwiIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5jc3MoeyBiYWNrZ3JvdW5kSW1hZ2U6IFwidXJsKCdcIiArIHNlbGYuaW1hZ2VTcmMgKyBcIicpXCIgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLUVORCBUSEUgWk9PTSBXSU5ET1cgQU5EIExFTlMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cbiAgICAgICAgICAgICAgICAvL3RvdWNoIGV2ZW50c1xuICAgICAgICAgICAgICAgIHNlbGYuJGVsZW0uYmluZCgndG91Y2htb3ZlJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvdWNoID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0gfHwgZS5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNldFBvc2l0aW9uKHRvdWNoKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNlbGYuem9vbUNvbnRhaW5lci5iaW5kKCd0b3VjaG1vdmUnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwiaW5uZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zaG93SGlkZVdpbmRvdyhcInNob3dcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b3VjaCA9IGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdIHx8IGUub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXRQb3NpdGlvbih0b3VjaCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuYmluZCgndG91Y2hlbmQnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaG93SGlkZVdpbmRvdyhcImhpZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy5zaG93TGVucykge3NlbGYuc2hvd0hpZGVMZW5zKFwiaGlkZVwiKTt9XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy50aW50ICYmIHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImlubmVyXCIpIHtzZWxmLnNob3dIaWRlVGludChcImhpZGVcIik7fVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgc2VsZi4kZWxlbS5iaW5kKCd0b3VjaGVuZCcsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNob3dIaWRlV2luZG93KFwiaGlkZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnNob3dMZW5zKSB7c2VsZi5zaG93SGlkZUxlbnMoXCJoaWRlXCIpO31cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnRpbnQgJiYgc2VsZi5vcHRpb25zLnpvb21UeXBlICE9IFwiaW5uZXJcIikge3NlbGYuc2hvd0hpZGVUaW50KFwiaGlkZVwiKTt9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnNob3dMZW5zKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUxlbnMuYmluZCgndG91Y2htb3ZlJywgZnVuY3Rpb24oZSl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3VjaCA9IGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdIHx8IGUub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0UG9zaXRpb24odG91Y2gpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUxlbnMuYmluZCgndG91Y2hlbmQnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2hvd0hpZGVXaW5kb3coXCJoaWRlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnNob3dMZW5zKSB7c2VsZi5zaG93SGlkZUxlbnMoXCJoaWRlXCIpO31cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy50aW50ICYmIHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImlubmVyXCIpIHtzZWxmLnNob3dIaWRlVGludChcImhpZGVcIik7fVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9OZWVkZWQgdG8gd29yayBpbiBJRVxuICAgICAgICAgICAgICAgIHNlbGYuJGVsZW0uYmluZCgnbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3ZlcldpbmRvdyA9PSBmYWxzZSl7c2VsZi5zZXRFbGVtZW50cyhcInNob3dcIik7fVxuICAgICAgICAgICAgICAgICAgICAvL21ha2Ugc3VyZSBvbiBvcmllbnRhdGlvbiBjaGFuZ2UgdGhlIHNldHBvc2l0aW9uIGlzIG5vdCBmaXJlZFxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmxhc3RYICE9PSBlLmNsaWVudFggfHwgc2VsZi5sYXN0WSAhPT0gZS5jbGllbnRZKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0UG9zaXRpb24oZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRMb2MgPSBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubGFzdFggPSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubGFzdFkgPSBlLmNsaWVudFk7XG5cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHNlbGYuem9vbUNvbnRhaW5lci5iaW5kKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKXtcblxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm92ZXJXaW5kb3cgPT0gZmFsc2Upe3NlbGYuc2V0RWxlbWVudHMoXCJzaG93XCIpO31cblxuICAgICAgICAgICAgICAgICAgICAvL21ha2Ugc3VyZSBvbiBvcmllbnRhdGlvbiBjaGFuZ2UgdGhlIHNldHBvc2l0aW9uIGlzIG5vdCBmaXJlZFxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmxhc3RYICE9PSBlLmNsaWVudFggfHwgc2VsZi5sYXN0WSAhPT0gZS5jbGllbnRZKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0UG9zaXRpb24oZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRMb2MgPSBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubGFzdFggPSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubGFzdFkgPSBlLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlICE9IFwiaW5uZXJcIikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmJpbmQoJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9tYWtlIHN1cmUgb24gb3JpZW50YXRpb24gY2hhbmdlIHRoZSBzZXRwb3NpdGlvbiBpcyBub3QgZmlyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYubGFzdFggIT09IGUuY2xpZW50WCB8fCBzZWxmLmxhc3RZICE9PSBlLmNsaWVudFkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0UG9zaXRpb24oZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50TG9jID0gZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGFzdFggPSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxhc3RZID0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnRpbnQgJiYgc2VsZi5vcHRpb25zLnpvb21UeXBlICE9IFwiaW5uZXJcIikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50LmJpbmQoJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9tYWtlIHN1cmUgb24gb3JpZW50YXRpb24gY2hhbmdlIHRoZSBzZXRwb3NpdGlvbiBpcyBub3QgZmlyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYubGFzdFggIT09IGUuY2xpZW50WCB8fCBzZWxmLmxhc3RZICE9PSBlLmNsaWVudFkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0UG9zaXRpb24oZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50TG9jID0gZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGFzdFggPSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxhc3RZID0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5iaW5kKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NlbGYub3ZlcldpbmRvdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL21ha2Ugc3VyZSBvbiBvcmllbnRhdGlvbiBjaGFuZ2UgdGhlIHNldHBvc2l0aW9uIGlzIG5vdCBmaXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5sYXN0WCAhPT0gZS5jbGllbnRYIHx8IHNlbGYubGFzdFkgIT09IGUuY2xpZW50WSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXRQb3NpdGlvbihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRMb2MgPSBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sYXN0WCA9IGUuY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGFzdFkgPSBlLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAvLyAgbGVuc0ZhZGVPdXQ6IDUwMCwgIHpvb21UaW50RmFkZUluXG4gICAgICAgICAgICAgICAgc2VsZi56b29tQ29udGFpbmVyLmFkZChzZWxmLiRlbGVtKS5tb3VzZWVudGVyKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vdmVyV2luZG93ID09IGZhbHNlKXtzZWxmLnNldEVsZW1lbnRzKFwic2hvd1wiKTt9XG5cblxuICAgICAgICAgICAgICAgIH0pLm1vdXNlbGVhdmUoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIXNlbGYuc2Nyb2xsTG9jayl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNldEVsZW1lbnRzKFwiaGlkZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vZW5kIG92ZSBpbWFnZVxuXG5cblxuXG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgIT0gXCJpbm5lclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5tb3VzZWVudGVyKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm92ZXJXaW5kb3cgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXRFbGVtZW50cyhcImhpZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIH0pLm1vdXNlbGVhdmUoZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vdmVyV2luZG93ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2VuZCBvdmUgaW1hZ2VcblxuXG5cbi8vXHRcdFx0XHR2YXIgZGVsdGEgPSBwYXJzZUludChlLm9yaWdpbmFsRXZlbnQud2hlZWxEZWx0YSB8fCAtZS5vcmlnaW5hbEV2ZW50LmRldGFpbCk7XG5cbiAgICAgICAgICAgICAgICAvLyAgICAgICQodGhpcykuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICAvLyAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvL2ZpeCBmb3IgaW5pdGlhbCB6b29tIHNldHRpbmdcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5vcHRpb25zLnpvb21MZXZlbCAhPSAxKXtcbiAgICAgICAgICAgICAgICAgICAgLy9cdHNlbGYuY2hhbmdlWm9vbUxldmVsKHNlbGYuY3VycmVudFpvb21MZXZlbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vc2V0IHRoZSBtaW4gem9vbWxldmVsXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLm1pblpvb21MZXZlbCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubWluWm9vbUxldmVsID0gc2VsZi5vcHRpb25zLm1pblpvb21MZXZlbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5taW5ab29tTGV2ZWwgPSBzZWxmLm9wdGlvbnMuc2Nyb2xsWm9vbUluY3JlbWVudCAqIDI7XG4gICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuc2Nyb2xsWm9vbSl7XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuYWRkKHNlbGYuJGVsZW0pLmJpbmQoJ21vdXNld2hlZWwgRE9NTW91c2VTY3JvbGwgTW96TW91c2VQaXhlbFNjcm9sbCcsIGZ1bmN0aW9uKGUpe1xuXG5cbi8vXHRcdFx0XHRcdFx0aW4gSUUgdGhlcmUgaXMgaXNzdWUgd2l0aCBmaXJpbmcgb2YgbW91c2VsZWF2ZSAtIFNvIGNoZWNrIHdoZXRoZXIgc3RpbGwgc2Nyb2xsaW5nXG4vL1x0XHRcdFx0XHRcdGFuZCBvbiBtb3VzZWxlYXZlIGNoZWNrIGlmIHNjcm9sbGxvY2tcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2Nyb2xsTG9jayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoJC5kYXRhKHRoaXMsICd0aW1lcicpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZGF0YSh0aGlzLCAndGltZXInLCBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2Nyb2xsTG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZG8gc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAyNTApKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZUV2ZW50ID0gZS5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEgfHwgZS5vcmlnaW5hbEV2ZW50LmRldGFpbCotMVxuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcy5zY3JvbGxUb3AgKz0gKCBkZWx0YSA8IDAgPyAxIDogLTEgKSAqIDMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBlLnByZXZlbnREZWZhdWx0KCk7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYodGhlRXZlbnQgLzEyMCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Njcm9sbGluZyB1cFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYuY3VycmVudFpvb21MZXZlbCA+PSBzZWxmLm1pblpvb21MZXZlbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlWm9vbUxldmVsKHNlbGYuY3VycmVudFpvb21MZXZlbC1zZWxmLm9wdGlvbnMuc2Nyb2xsWm9vbUluY3JlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2Nyb2xsaW5nIGRvd25cblxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLm1heFpvb21MZXZlbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYuY3VycmVudFpvb21MZXZlbCA8PSBzZWxmLm9wdGlvbnMubWF4Wm9vbUxldmVsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlWm9vbUxldmVsKHBhcnNlRmxvYXQoc2VsZi5jdXJyZW50Wm9vbUxldmVsKStzZWxmLm9wdGlvbnMuc2Nyb2xsWm9vbUluY3JlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9hbmR5XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2Vab29tTGV2ZWwocGFyc2VGbG9hdChzZWxmLmN1cnJlbnRab29tTGV2ZWwpK3NlbGYub3B0aW9ucy5zY3JvbGxab29tSW5jcmVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRFbGVtZW50czogZnVuY3Rpb24odHlwZSkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYoIXNlbGYub3B0aW9ucy56b29tRW5hYmxlZCl7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgICAgICAgICBpZih0eXBlPT1cInNob3dcIil7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYuaXNXaW5kb3dTZXQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwiaW5uZXJcIikge3NlbGYuc2hvd0hpZGVXaW5kb3coXCJzaG93XCIpO31cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcIndpbmRvd1wiKSB7c2VsZi5zaG93SGlkZVdpbmRvdyhcInNob3dcIik7fVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnNob3dMZW5zKSB7c2VsZi5zaG93SGlkZUxlbnMoXCJzaG93XCIpO31cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy50aW50ICYmIHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImlubmVyXCIpIHtzZWxmLnNob3dIaWRlVGludChcInNob3dcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZih0eXBlPT1cImhpZGVcIil7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcIndpbmRvd1wiKSB7c2VsZi5zaG93SGlkZVdpbmRvdyhcImhpZGVcIik7fVxuICAgICAgICAgICAgICAgICAgICBpZighc2VsZi5vcHRpb25zLnRpbnQpIHtzZWxmLnNob3dIaWRlV2luZG93KFwiaGlkZVwiKTt9XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy5zaG93TGVucykge3NlbGYuc2hvd0hpZGVMZW5zKFwiaGlkZVwiKTt9XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy50aW50KSB7XHRzZWxmLnNob3dIaWRlVGludChcImhpZGVcIik7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRQb3NpdGlvbjogZnVuY3Rpb24oZSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmKCFzZWxmLm9wdGlvbnMuem9vbUVuYWJsZWQpe3JldHVybiBmYWxzZTt9XG5cbiAgICAgICAgICAgICAgICAvL3JlY2FjbGMgb2Zmc2V0IGVhY2ggdGltZSBpbiBjYXNlIHRoZSBpbWFnZSBtb3Zlc1xuICAgICAgICAgICAgICAgIC8vdGhpcyBjYW4gYmUgY2F1c2VkIGJ5IG90aGVyIG9uIHBhZ2UgZWxlbWVudHNcbiAgICAgICAgICAgICAgICBzZWxmLm56SGVpZ2h0ID0gc2VsZi4kZWxlbS5oZWlnaHQoKTtcbiAgICAgICAgICAgICAgICBzZWxmLm56V2lkdGggPSBzZWxmLiRlbGVtLndpZHRoKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5uek9mZnNldCA9IHNlbGYuJGVsZW0ub2Zmc2V0KCk7XG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMudGludCAmJiBzZWxmLm9wdGlvbnMuem9vbVR5cGUgIT0gXCJpbm5lclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnQuY3NzKHsgdG9wOiAwfSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnQuY3NzKHsgbGVmdDogMH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL3NldCByZXNwb25zaXZlXG4gICAgICAgICAgICAgICAgLy93aWxsIGNoZWNraW5nIGlmIHRoZSBpbWFnZSBuZWVkcyBjaGFuZ2luZyBiZWZvcmUgcnVubmluZyB0aGlzIGNvZGUgd29yayBmYXN0ZXI/XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnJlc3BvbnNpdmUgJiYgIXNlbGYub3B0aW9ucy5zY3JvbGxab29tKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnNob3dMZW5zKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYubnpIZWlnaHQgPCBzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1dpZHRoL3NlbGYud2lkdGhSYXRpbyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuc0hlaWdodCA9IHNlbGYubnpIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbnNIZWlnaHQgPSBTdHJpbmcoKHNlbGYub3B0aW9ucy56b29tV2luZG93SGVpZ2h0L3NlbGYuaGVpZ2h0UmF0aW8pKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5sYXJnZVdpZHRoIDwgc2VsZi5vcHRpb25zLnpvb21XaW5kb3dXaWR0aCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuc1dpZHRoID0gc2VsZi5ueldpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5zV2lkdGggPSAgKHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgvc2VsZi53aWR0aFJhdGlvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2lkdGhSYXRpbyA9IHNlbGYubGFyZ2VXaWR0aCAvIHNlbGYubnpXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaGVpZ2h0UmF0aW8gPSBzZWxmLmxhcmdlSGVpZ2h0IC8gc2VsZi5uekhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImxlbnNcIikge1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Bvc3NpYmx5IGRvbnQgbmVlZCB0byBrZWVwIHJlY2FsY2FsY3VsYXRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2lmIHRoZSBsZW5zIGlzIGhlaWdoZXIgdGhhbiB0aGUgaW1hZ2UsIHRoZW4gc2V0IGxlbnMgc2l6ZSB0byBpbWFnZSBzaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5uekhlaWdodCA8IHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgvc2VsZi53aWR0aFJhdGlvKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuc0hlaWdodCA9IHNlbGYubnpIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuc0hlaWdodCA9IFN0cmluZygoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dIZWlnaHQvc2VsZi5oZWlnaHRSYXRpbykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dXaWR0aCA8IHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5zV2lkdGggPSBzZWxmLm56V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbnNXaWR0aCA9ICAoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dXaWR0aC9zZWxmLndpZHRoUmF0aW8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUxlbnMuY3NzKCd3aWR0aCcsIGxlbnNXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tTGVucy5jc3MoJ2hlaWdodCcsIGxlbnNIZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnRpbnQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50SW1hZ2UuY3NzKCd3aWR0aCcsIHNlbGYubnpXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnRJbWFnZS5jc3MoJ2hlaWdodCcsIHNlbGYubnpIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwibGVuc1wiKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcyh7IHdpZHRoOiBTdHJpbmcoc2VsZi5vcHRpb25zLmxlbnNTaXplKSArICdweCcsIGhlaWdodDogU3RyaW5nKHNlbGYub3B0aW9ucy5sZW5zU2l6ZSkgKyAncHgnIH0pXG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy9lbmQgcmVzcG9uc2l2ZSBpbWFnZSBjaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vY29udGFpbmVyIGZpeFxuICAgICAgICAgICAgICAgIHNlbGYuem9vbUNvbnRhaW5lci5jc3MoeyB0b3A6IHNlbGYubnpPZmZzZXQudG9wfSk7XG4gICAgICAgICAgICAgICAgc2VsZi56b29tQ29udGFpbmVyLmNzcyh7IGxlZnQ6IHNlbGYubnpPZmZzZXQubGVmdH0pO1xuICAgICAgICAgICAgICAgIHNlbGYubW91c2VMZWZ0ID0gcGFyc2VJbnQoZS5wYWdlWCAtIHNlbGYubnpPZmZzZXQubGVmdCk7XG4gICAgICAgICAgICAgICAgc2VsZi5tb3VzZVRvcCA9IHBhcnNlSW50KGUucGFnZVkgLSBzZWxmLm56T2Zmc2V0LnRvcCk7XG4gICAgICAgICAgICAgICAgLy9jYWxjdWxhdGUgdGhlIExvY2F0aW9uIG9mIHRoZSBMZW5zXG5cbiAgICAgICAgICAgICAgICAvL2NhbGN1bGF0ZSB0aGUgYm91bmQgcmVnaW9ucyAtIGJ1dCBvbmx5IGlmIHpvb20gd2luZG93XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwid2luZG93XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5FdG9wcG9zID0gKHNlbGYubW91c2VUb3AgPCAoc2VsZi56b29tTGVucy5oZWlnaHQoKS8yKSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuRWJvcHBvcyA9IChzZWxmLm1vdXNlVG9wID4gc2VsZi5uekhlaWdodCAtIChzZWxmLnpvb21MZW5zLmhlaWdodCgpLzIpLShzZWxmLm9wdGlvbnMubGVuc0JvcmRlclNpemUqMikpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLkVsb3Bwb3MgPSAoc2VsZi5tb3VzZUxlZnQgPCAwKygoc2VsZi56b29tTGVucy53aWR0aCgpLzIpKSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuRXJvcHBvcyA9IChzZWxmLm1vdXNlTGVmdCA+IChzZWxmLm56V2lkdGggLSAoc2VsZi56b29tTGVucy53aWR0aCgpLzIpLShzZWxmLm9wdGlvbnMubGVuc0JvcmRlclNpemUqMikpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9jYWxjdWxhdGUgdGhlIGJvdW5kIHJlZ2lvbnMgLSBidXQgb25seSBmb3IgaW5uZXIgem9vbVxuICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImlubmVyXCIpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLkV0b3Bwb3MgPSAoc2VsZi5tb3VzZVRvcCA8ICgoc2VsZi5uekhlaWdodC8yKS9zZWxmLmhlaWdodFJhdGlvKSApO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLkVib3Bwb3MgPSAoc2VsZi5tb3VzZVRvcCA+IChzZWxmLm56SGVpZ2h0IC0gKChzZWxmLm56SGVpZ2h0LzIpL3NlbGYuaGVpZ2h0UmF0aW8pKSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuRWxvcHBvcyA9IChzZWxmLm1vdXNlTGVmdCA8IDArKCgoc2VsZi5ueldpZHRoLzIpL3NlbGYud2lkdGhSYXRpbykpKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5Fcm9wcG9zID0gKHNlbGYubW91c2VMZWZ0ID4gKHNlbGYubnpXaWR0aCAtIChzZWxmLm56V2lkdGgvMikvc2VsZi53aWR0aFJhdGlvLShzZWxmLm9wdGlvbnMubGVuc0JvcmRlclNpemUqMikpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgbW91c2UgcG9zaXRpb24gb2YgdGhlIHNsaWRlciBpcyBvbmUgb2YgdGhlIG91dGVyYm91bmRzLCB0aGVuIGhpZGUgIHdpbmRvdyBhbmQgbGVuc1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLm1vdXNlTGVmdCA8PSAwIHx8IHNlbGYubW91c2VUb3AgPCAwIHx8IHNlbGYubW91c2VMZWZ0ID4gc2VsZi5ueldpZHRoIHx8IHNlbGYubW91c2VUb3AgPiBzZWxmLm56SGVpZ2h0ICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNldEVsZW1lbnRzKFwiaGlkZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2Vsc2UgY29udGludWUgd2l0aCBvcGVyYXRpb25zXG4gICAgICAgICAgICAgICAgZWxzZSB7XG5cblxuICAgICAgICAgICAgICAgICAgICAvL2xlbnMgb3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuc2hvd0xlbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXHRcdHNlbGYuc2hvd0hpZGVMZW5zKFwic2hvd1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc2V0IGJhY2tncm91bmQgcG9zaXRpb24gb2YgbGVuc1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sZW5zTGVmdFBvcyA9IFN0cmluZyhzZWxmLm1vdXNlTGVmdCAtIHNlbGYuem9vbUxlbnMud2lkdGgoKSAvIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sZW5zVG9wUG9zID0gU3RyaW5nKHNlbGYubW91c2VUb3AgLSBzZWxmLnpvb21MZW5zLmhlaWdodCgpIC8gMik7XG5cblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vYWRqdXN0IHRoZSBiYWNrZ3JvdW5kIHBvc2l0aW9uIGlmIHRoZSBtb3VzZSBpcyBpbiBvbmUgb2YgdGhlIG91dGVyIHJlZ2lvbnNcblxuICAgICAgICAgICAgICAgICAgICAvL1RvcCByZWdpb25cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5FdG9wcG9zKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGVuc1RvcFBvcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy9MZWZ0IFJlZ2lvblxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLkVsb3Bwb3Mpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dMZWZ0UG9zID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGVuc0xlZnRQb3MgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aW50cG9zPTA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy9TZXQgYm90dG9tIGFuZCByaWdodCByZWdpb24gZm9yIHdpbmRvdyBtb2RlXG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcIndpbmRvd1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLkVib3Bwb3Mpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGVuc1RvcFBvcyA9IE1hdGgubWF4KCAoc2VsZi5uekhlaWdodCktc2VsZi56b29tTGVucy5oZWlnaHQoKS0oc2VsZi5vcHRpb25zLmxlbnNCb3JkZXJTaXplKjIpLCAwICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLkVyb3Bwb3Mpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGVuc0xlZnRQb3MgPSAoc2VsZi5ueldpZHRoLShzZWxmLnpvb21MZW5zLndpZHRoKCkpLShzZWxmLm9wdGlvbnMubGVuc0JvcmRlclNpemUqMikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vU2V0IGJvdHRvbSBhbmQgcmlnaHQgcmVnaW9uIGZvciBpbm5lciBtb2RlXG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImlubmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYuRWJvcHBvcyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sZW5zVG9wUG9zID0gTWF0aC5tYXgoICgoc2VsZi5uekhlaWdodCktKHNlbGYub3B0aW9ucy5sZW5zQm9yZGVyU2l6ZSoyKSksIDAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYuRXJvcHBvcyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sZW5zTGVmdFBvcyA9IChzZWxmLm56V2lkdGgtKHNlbGYubnpXaWR0aCktKHNlbGYub3B0aW9ucy5sZW5zQm9yZGVyU2l6ZSoyKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvL2lmIGxlbnMgem9vbVxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJsZW5zXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93TGVmdFBvcyA9IFN0cmluZygoKGUucGFnZVggLSBzZWxmLm56T2Zmc2V0LmxlZnQpICogc2VsZi53aWR0aFJhdGlvIC0gc2VsZi56b29tTGVucy53aWR0aCgpIC8gMikgKiAoLTEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93VG9wUG9zID0gU3RyaW5nKCgoZS5wYWdlWSAtIHNlbGYubnpPZmZzZXQudG9wKSAqIHNlbGYuaGVpZ2h0UmF0aW8gLSBzZWxmLnpvb21MZW5zLmhlaWdodCgpIC8gMikgKiAoLTEpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tTGVucy5jc3MoeyBiYWNrZ3JvdW5kUG9zaXRpb246IHNlbGYud2luZG93TGVmdFBvcyArICdweCAnICsgc2VsZi53aW5kb3dUb3BQb3MgKyAncHgnIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmNoYW5nZUJnU2l6ZSl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm56SGVpZ2h0PnNlbGYubnpXaWR0aCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImxlbnNcIil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcyh7IFwiYmFja2dyb3VuZC1zaXplXCI6IHNlbGYubGFyZ2VXaWR0aC9zZWxmLm5ld3ZhbHVlaGVpZ2h0ICsgJ3B4ICcgKyBzZWxmLmxhcmdlSGVpZ2h0L3NlbGYubmV3dmFsdWVoZWlnaHQgKyAncHgnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyh7IFwiYmFja2dyb3VuZC1zaXplXCI6IHNlbGYubGFyZ2VXaWR0aC9zZWxmLm5ld3ZhbHVlaGVpZ2h0ICsgJ3B4ICcgKyBzZWxmLmxhcmdlSGVpZ2h0L3NlbGYubmV3dmFsdWVoZWlnaHQgKyAncHgnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJsZW5zXCIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tTGVucy5jc3MoeyBcImJhY2tncm91bmQtc2l6ZVwiOiBzZWxmLmxhcmdlV2lkdGgvc2VsZi5uZXd2YWx1ZXdpZHRoICsgJ3B4ICcgKyBzZWxmLmxhcmdlSGVpZ2h0L3NlbGYubmV3dmFsdWV3aWR0aCArICdweCcgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyh7IFwiYmFja2dyb3VuZC1zaXplXCI6IHNlbGYubGFyZ2VXaWR0aC9zZWxmLm5ld3ZhbHVld2lkdGggKyAncHggJyArIHNlbGYubGFyZ2VIZWlnaHQvc2VsZi5uZXd2YWx1ZXdpZHRoICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2VCZ1NpemUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXRXaW5kb3dQb3N0aXRpb24oZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy9pZiB0aW50IHpvb21cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnRpbnQgJiYgc2VsZi5vcHRpb25zLnpvb21UeXBlICE9IFwiaW5uZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXRUaW50UG9zaXRpb24oZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvL3NldCB0aGUgY3NzIGJhY2tncm91bmQgcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwid2luZG93XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0V2luZG93UG9zdGl0aW9uKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImlubmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0V2luZG93UG9zdGl0aW9uKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy5zaG93TGVucykge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmZ1bGx3aWR0aCAmJiBzZWxmLm9wdGlvbnMuem9vbVR5cGUgIT0gXCJsZW5zXCIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGVuc0xlZnRQb3MgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcyh7IGxlZnQ6IHNlbGYubGVuc0xlZnRQb3MgKyAncHgnLCB0b3A6IHNlbGYubGVuc1RvcFBvcyArICdweCcgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSAvL2VuZCBlbHNlXG5cblxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0hpZGVXaW5kb3c6IGZ1bmN0aW9uKGNoYW5nZSkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZihjaGFuZ2UgPT0gXCJzaG93XCIpe1xuICAgICAgICAgICAgICAgICAgICBpZighc2VsZi5pc1dpbmRvd0FjdGl2ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVdpbmRvd0ZhZGVJbil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LnN0b3AodHJ1ZSwgdHJ1ZSwgZmFsc2UpLmZhZGVJbihzZWxmLm9wdGlvbnMuem9vbVdpbmRvd0ZhZGVJbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle3NlbGYuem9vbVdpbmRvdy5zaG93KCk7fVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pc1dpbmRvd0FjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoY2hhbmdlID09IFwiaGlkZVwiKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5pc1dpbmRvd0FjdGl2ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVdpbmRvd0ZhZGVPdXQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dGYWRlT3V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7c2VsZi56b29tV2luZG93LmhpZGUoKTt9XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmlzV2luZG93QWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0hpZGVMZW5zOiBmdW5jdGlvbihjaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYoY2hhbmdlID09IFwic2hvd1wiKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIXNlbGYuaXNMZW5zQWN0aXZlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy5sZW5zRmFkZUluKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLnN0b3AodHJ1ZSwgdHJ1ZSwgZmFsc2UpLmZhZGVJbihzZWxmLm9wdGlvbnMubGVuc0ZhZGVJbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle3NlbGYuem9vbUxlbnMuc2hvdygpO31cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaXNMZW5zQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihjaGFuZ2UgPT0gXCJoaWRlXCIpe1xuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmlzTGVuc0FjdGl2ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMubGVuc0ZhZGVPdXQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUxlbnMuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KHNlbGYub3B0aW9ucy5sZW5zRmFkZU91dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle3NlbGYuem9vbUxlbnMuaGlkZSgpO31cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaXNMZW5zQWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0hpZGVUaW50OiBmdW5jdGlvbihjaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYoY2hhbmdlID09IFwic2hvd1wiKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIXNlbGYuaXNUaW50QWN0aXZlKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UaW50RmFkZUluKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50LmNzcyh7b3BhY2l0eTpzZWxmLm9wdGlvbnMudGludE9wYWNpdHl9KS5hbmltYXRlKCkuc3RvcCh0cnVlLCB0cnVlKS5mYWRlSW4oXCJzbG93XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50LmNzcyh7b3BhY2l0eTpzZWxmLm9wdGlvbnMudGludE9wYWNpdHl9KS5hbmltYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludC5zaG93KCk7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pc1RpbnRBY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKGNoYW5nZSA9PSBcImhpZGVcIil7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYuaXNUaW50QWN0aXZlKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UaW50RmFkZU91dCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludC5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoc2VsZi5vcHRpb25zLnpvb21UaW50RmFkZU91dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle3NlbGYuem9vbVRpbnQuaGlkZSgpO31cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaXNUaW50QWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0TGVuc1Bvc3RpdGlvbjogZnVuY3Rpb24oIGUgKSB7XG5cblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldFdpbmRvd1Bvc3RpdGlvbjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gb2JqLnNsaWNlKCAwLCBjb3VudCApO1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIGlmKCFpc05hTihzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1Bvc2l0aW9uKSl7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1Bvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTogLy9kb25lXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9IChzZWxmLm9wdGlvbnMuem9vbVdpbmRvd09mZmV0eSk7Ly9ET05FIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0oK3NlbGYubnpXaWR0aCk7IC8vRE9ORSAxLCAyLCAzLCA0LCAxNlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tV2luZG93SGVpZ2h0ID4gc2VsZi5uekhlaWdodCl7IC8vcG9zaXRpdmUgbWFyZ2luXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9ICgoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dIZWlnaHQvMiktKHNlbGYubnpIZWlnaHQvMikpKigtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0oc2VsZi5ueldpZHRoKTsgLy9ET05FIDEsIDIsIDMsIDQsIDE2XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNleyAvL25lZ2F0aXZlIG1hcmdpblxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiAvL2RvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0VG9wID0gKHNlbGYubnpIZWlnaHQgLSBzZWxmLnpvb21XaW5kb3cuaGVpZ2h0KCkgLSAoc2VsZi5vcHRpb25zLmJvcmRlclNpemUqMikpOyAvL0RPTkUgMyw5XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldExlZnQgPShzZWxmLm56V2lkdGgpOyAvL0RPTkUgMSwgMiwgMywgNCwgMTZcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDQ6IC8vZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRUb3AgPSAoc2VsZi5uekhlaWdodCk7IC8vRE9ORSAtIDQsNSw2LDcsOFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0oc2VsZi5ueldpZHRoKTsgLy9ET05FIDEsIDIsIDMsIDQsIDE2XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA1OiAvL2RvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0VG9wID0gKHNlbGYubnpIZWlnaHQpOyAvL0RPTkUgLSA0LDUsNiw3LDhcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0TGVmdCA9KHNlbGYubnpXaWR0aC1zZWxmLnpvb21XaW5kb3cud2lkdGgoKS0oc2VsZi5vcHRpb25zLmJvcmRlclNpemUqMikpOyAvL0RPTkUgLSA1LDE1XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dIZWlnaHQgPiBzZWxmLm56SGVpZ2h0KXsgLy9wb3NpdGl2ZSBtYXJnaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9IChzZWxmLm56SGVpZ2h0KTsgIC8vRE9ORSAtIDQsNSw2LDcsOFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0oKHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgvMiktKHNlbGYubnpXaWR0aC8yKSsoc2VsZi5vcHRpb25zLmJvcmRlclNpemUqMikpKigtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNleyAvL25lZ2F0aXZlIG1hcmdpblxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNzogLy9kb25lXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9IChzZWxmLm56SGVpZ2h0KTsgIC8vRE9ORSAtIDQsNSw2LDcsOFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0gMDsgLy9ET05FIDcsIDEzXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA4OiAvL2RvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0VG9wID0gKHNlbGYubnpIZWlnaHQpOyAvL0RPTkUgLSA0LDUsNiw3LDhcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0TGVmdCA9KHNlbGYuem9vbVdpbmRvdy53aWR0aCgpKyhzZWxmLm9wdGlvbnMuYm9yZGVyU2l6ZSoyKSApKiAoLTEpOyAgLy9ET05FIDgsOSwxMCwxMSwxMlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgOTogIC8vZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRUb3AgPSAoc2VsZi5uekhlaWdodCAtIHNlbGYuem9vbVdpbmRvdy5oZWlnaHQoKSAtIChzZWxmLm9wdGlvbnMuYm9yZGVyU2l6ZSoyKSk7IC8vRE9ORSAzLDlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0TGVmdCA9KHNlbGYuem9vbVdpbmRvdy53aWR0aCgpKyhzZWxmLm9wdGlvbnMuYm9yZGVyU2l6ZSoyKSApKiAoLTEpOyAgLy9ET05FIDgsOSwxMCwxMSwxMlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVdpbmRvd0hlaWdodCA+IHNlbGYubnpIZWlnaHQpeyAvL3Bvc2l0aXZlIG1hcmdpblxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRUb3AgPSAoKHNlbGYub3B0aW9ucy56b29tV2luZG93SGVpZ2h0LzIpLShzZWxmLm56SGVpZ2h0LzIpKSooLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0TGVmdCA9KHNlbGYuem9vbVdpbmRvdy53aWR0aCgpKyhzZWxmLm9wdGlvbnMuYm9yZGVyU2l6ZSoyKSApKiAoLTEpOyAgLy9ET05FIDgsOSwxMCwxMSwxMlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXsgLy9uZWdhdGl2ZSBtYXJnaW5cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTE6XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9IChzZWxmLm9wdGlvbnMuem9vbVdpbmRvd09mZmV0eSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldExlZnQgPShzZWxmLnpvb21XaW5kb3cud2lkdGgoKSsoc2VsZi5vcHRpb25zLmJvcmRlclNpemUqMikgKSogKC0xKTsgIC8vRE9ORSA4LDksMTAsMTEsMTJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDEyOiAvL2RvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0VG9wID0gKHNlbGYuem9vbVdpbmRvdy5oZWlnaHQoKSsoc2VsZi5vcHRpb25zLmJvcmRlclNpemUqMikpKigtMSk7IC8vRE9ORSAxMiwxMywxNCwxNSwxNlxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0oc2VsZi56b29tV2luZG93LndpZHRoKCkrKHNlbGYub3B0aW9ucy5ib3JkZXJTaXplKjIpICkqICgtMSk7ICAvL0RPTkUgOCw5LDEwLDExLDEyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxMzogLy9kb25lXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9IChzZWxmLnpvb21XaW5kb3cuaGVpZ2h0KCkrKHNlbGYub3B0aW9ucy5ib3JkZXJTaXplKjIpKSooLTEpOyAvL0RPTkUgMTIsMTMsMTQsMTUsMTZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0TGVmdCA9KDApOyAvL0RPTkUgNywgMTNcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dIZWlnaHQgPiBzZWxmLm56SGVpZ2h0KXsgLy9wb3NpdGl2ZSBtYXJnaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9IChzZWxmLnpvb21XaW5kb3cuaGVpZ2h0KCkrKHNlbGYub3B0aW9ucy5ib3JkZXJTaXplKjIpKSooLTEpOyAvL0RPTkUgMTIsMTMsMTQsMTUsMTZcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0TGVmdCA9KChzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1dpZHRoLzIpLShzZWxmLm56V2lkdGgvMikrKHNlbGYub3B0aW9ucy5ib3JkZXJTaXplKjIpKSooLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXsgLy9uZWdhdGl2ZSBtYXJnaW5cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxNTovL2RvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0VG9wID0gKHNlbGYuem9vbVdpbmRvdy5oZWlnaHQoKSsoc2VsZi5vcHRpb25zLmJvcmRlclNpemUqMikpKigtMSk7IC8vRE9ORSAxMiwxMywxNCwxNSwxNlxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0oc2VsZi5ueldpZHRoLXNlbGYuem9vbVdpbmRvdy53aWR0aCgpLShzZWxmLm9wdGlvbnMuYm9yZGVyU2l6ZSoyKSk7IC8vRE9ORSAtIDUsMTVcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE2OiAgLy9kb25lXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9IChzZWxmLnpvb21XaW5kb3cuaGVpZ2h0KCkrKHNlbGYub3B0aW9ucy5ib3JkZXJTaXplKjIpKSooLTEpOyAvL0RPTkUgMTIsMTMsMTQsMTUsMTZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0TGVmdCA9KHNlbGYubnpXaWR0aCk7IC8vRE9ORSAxLCAyLCAzLCA0LCAxNlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IC8vZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRUb3AgPSAoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dPZmZldHkpOy8vRE9ORSAtIDFcbiAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0oc2VsZi5ueldpZHRoKTsgLy9ET05FIDEsIDIsIDMsIDQsIDE2XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IC8vZW5kIGlzTkFOXG4gICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgLy9XRSBDQU4gUE9TSVRJT04gSU4gQSBDTEFTUyAtIEFTU1VNRSBUSEFUIEFOWSBTVFJJTkcgUEFTU0VEIElTXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZXh0ZXJuYWxDb250YWluZXIgPSAkKCcjJytzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1Bvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5leHRlcm5hbENvbnRhaW5lcldpZHRoID0gc2VsZi5leHRlcm5hbENvbnRhaW5lci53aWR0aCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmV4dGVybmFsQ29udGFpbmVySGVpZ2h0ID0gc2VsZi5leHRlcm5hbENvbnRhaW5lci5oZWlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5leHRlcm5hbENvbnRhaW5lck9mZnNldCA9IHNlbGYuZXh0ZXJuYWxDb250YWluZXIub2Zmc2V0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRUb3AgPSBzZWxmLmV4dGVybmFsQ29udGFpbmVyT2Zmc2V0LnRvcDsvL0RPTkUgLSAxXG4gICAgICAgICAgICAgICAgICAgIHNlbGYud2luZG93T2Zmc2V0TGVmdCA9c2VsZi5leHRlcm5hbENvbnRhaW5lck9mZnNldC5sZWZ0OyAvL0RPTkUgMSwgMiwgMywgNCwgMTZcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmlzV2luZG93U2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLndpbmRvd09mZnNldFRvcCA9IHNlbGYud2luZG93T2Zmc2V0VG9wICsgc2VsZi5vcHRpb25zLnpvb21XaW5kb3dPZmZldHk7XG4gICAgICAgICAgICAgICAgc2VsZi53aW5kb3dPZmZzZXRMZWZ0ID0gc2VsZi53aW5kb3dPZmZzZXRMZWZ0ICsgc2VsZi5vcHRpb25zLnpvb21XaW5kb3dPZmZldHg7XG5cbiAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgdG9wOiBzZWxmLndpbmRvd09mZnNldFRvcH0pO1xuICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5jc3MoeyBsZWZ0OiBzZWxmLndpbmRvd09mZnNldExlZnR9KTtcblxuICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImlubmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyh7IHRvcDogMH0pO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgbGVmdDogMH0pO1xuXG4gICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICBzZWxmLndpbmRvd0xlZnRQb3MgPSBTdHJpbmcoKChlLnBhZ2VYIC0gc2VsZi5uek9mZnNldC5sZWZ0KSAqIHNlbGYud2lkdGhSYXRpbyAtIHNlbGYuem9vbVdpbmRvdy53aWR0aCgpIC8gMikgKiAoLTEpKTtcbiAgICAgICAgICAgICAgICBzZWxmLndpbmRvd1RvcFBvcyA9IFN0cmluZygoKGUucGFnZVkgLSBzZWxmLm56T2Zmc2V0LnRvcCkgKiBzZWxmLmhlaWdodFJhdGlvIC0gc2VsZi56b29tV2luZG93LmhlaWdodCgpIC8gMikgKiAoLTEpKTtcbiAgICAgICAgICAgICAgICBpZihzZWxmLkV0b3Bwb3Mpe3NlbGYud2luZG93VG9wUG9zID0gMDt9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5FbG9wcG9zKXtzZWxmLndpbmRvd0xlZnRQb3MgPSAwO31cbiAgICAgICAgICAgICAgICBpZihzZWxmLkVib3Bwb3Mpe3NlbGYud2luZG93VG9wUG9zID0gKHNlbGYubGFyZ2VIZWlnaHQvc2VsZi5jdXJyZW50Wm9vbUxldmVsLXNlbGYuem9vbVdpbmRvdy5oZWlnaHQoKSkqKC0xKTsgIH1cbiAgICAgICAgICAgICAgICBpZihzZWxmLkVyb3Bwb3Mpe3NlbGYud2luZG93TGVmdFBvcyA9ICgoc2VsZi5sYXJnZVdpZHRoL3NlbGYuY3VycmVudFpvb21MZXZlbC1zZWxmLnpvb21XaW5kb3cud2lkdGgoKSkqKC0xKSk7fVxuXG4gICAgICAgICAgICAgICAgLy9zdG9wcyBtaWNybyBtb3ZlbWVudHNcbiAgICAgICAgICAgICAgICBpZihzZWxmLmZ1bGxoZWlnaHQpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd1RvcFBvcyA9IDA7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5mdWxsd2lkdGgpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd0xlZnRQb3MgPSAwO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vc2V0IHRoZSBjc3MgYmFja2dyb3VuZCBwb3NpdGlvblxuXG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJ3aW5kb3dcIiB8fCBzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi56b29tTG9jayA9PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vb3ZlcnJpZGVzIGZvciBpbWFnZXMgbm90IHpvb21hYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLndpZHRoUmF0aW8gPD0gMSl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd0xlZnRQb3MgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5oZWlnaHRSYXRpbyA8PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd1RvcFBvcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gYWRqdXN0IGltYWdlcyBsZXNzIHRoYW4gdGhlIHdpbmRvdyBoZWlnaHRcblxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmxhcmdlSGVpZ2h0IDwgc2VsZi5vcHRpb25zLnpvb21XaW5kb3dIZWlnaHQpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd1RvcFBvcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5sYXJnZVdpZHRoIDwgc2VsZi5vcHRpb25zLnpvb21XaW5kb3dXaWR0aCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpbmRvd0xlZnRQb3MgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy9zZXQgdGhlIHpvb213aW5kb3cgYmFja2dyb3VuZCBwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vcHRpb25zLmVhc2luZyl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZihzZWxmLmNoYW5nZVpvb20pe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5sb29wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICBzZWxmLmNoYW5nZVpvb20gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICBzZWxmLmxvb3AgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NldCB0aGUgcG9zIHRvIDAgaWYgbm90IHNldFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIXNlbGYueHApe3NlbGYueHAgPSAwO31cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFzZWxmLnlwKXtzZWxmLnlwID0gMDt9XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2lmIGxvb3Agbm90IGFscmVhZHkgc3RhcnRlZCwgdGhlbiBydW4gaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5sb29wKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxvb3AgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3VzaW5nIHplbm8ncyBwYXJhZG94XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi54cCArPSAoc2VsZi53aW5kb3dMZWZ0UG9zICAtIHNlbGYueHApIC8gc2VsZi5vcHRpb25zLmVhc2luZ0Ftb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi55cCArPSAoc2VsZi53aW5kb3dUb3BQb3MgIC0gc2VsZi55cCkgLyBzZWxmLm9wdGlvbnMuZWFzaW5nQW1vdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLnNjcm9sbGluZ0xvY2spe1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5sb29wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYueHAgPSBzZWxmLndpbmRvd0xlZnRQb3M7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnlwID0gc2VsZi53aW5kb3dUb3BQb3NcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi54cCA9ICgoZS5wYWdlWCAtIHNlbGYubnpPZmZzZXQubGVmdCkgKiBzZWxmLndpZHRoUmF0aW8gLSBzZWxmLnpvb21XaW5kb3cud2lkdGgoKSAvIDIpICogKC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYueXAgPSAoKChlLnBhZ2VZIC0gc2VsZi5uek9mZnNldC50b3ApICogc2VsZi5oZWlnaHRSYXRpbyAtIHNlbGYuem9vbVdpbmRvdy5oZWlnaHQoKSAvIDIpICogKC0xKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYuY2hhbmdlQmdTaXplKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm56SGVpZ2h0PnNlbGYubnpXaWR0aCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImxlbnNcIil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcyh7IFwiYmFja2dyb3VuZC1zaXplXCI6IHNlbGYubGFyZ2VXaWR0aC9zZWxmLm5ld3ZhbHVlaGVpZ2h0ICsgJ3B4ICcgKyBzZWxmLmxhcmdlSGVpZ2h0L3NlbGYubmV3dmFsdWVoZWlnaHQgKyAncHgnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5jc3MoeyBcImJhY2tncm91bmQtc2l6ZVwiOiBzZWxmLmxhcmdlV2lkdGgvc2VsZi5uZXd2YWx1ZWhlaWdodCArICdweCAnICsgc2VsZi5sYXJnZUhlaWdodC9zZWxmLm5ld3ZhbHVlaGVpZ2h0ICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlICE9IFwibGVuc1wiKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUxlbnMuY3NzKHsgXCJiYWNrZ3JvdW5kLXNpemVcIjogc2VsZi5sYXJnZVdpZHRoL3NlbGYubmV3dmFsdWV3aWR0aCArICdweCAnICsgc2VsZi5sYXJnZUhlaWdodC9zZWxmLm5ld3ZhbHVlaGVpZ2h0ICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgXCJiYWNrZ3JvdW5kLXNpemVcIjogc2VsZi5sYXJnZVdpZHRoL3NlbGYubmV3dmFsdWV3aWR0aCArICdweCAnICsgc2VsZi5sYXJnZUhlaWdodC9zZWxmLm5ld3ZhbHVld2lkdGggKyAncHgnIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICBpZighc2VsZi5iZ3hwKXtzZWxmLmJneHAgPSBzZWxmLmxhcmdlV2lkdGgvc2VsZi5uZXd2YWx1ZTt9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZighc2VsZi5iZ3lwKXtzZWxmLmJneXAgPSBzZWxmLmxhcmdlSGVpZ2h0L3NlbGYubmV3dmFsdWUgO31cbiAgICAgICAgICAgICAgICAgaWYgKCFzZWxmLmJnbG9vcCl7XG4gICAgICAgICAgICAgICAgICAgICBzZWxmLmJnbG9vcCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgc2VsZi5iZ3hwICs9IChzZWxmLmxhcmdlV2lkdGgvc2VsZi5uZXd2YWx1ZSAgLSBzZWxmLmJneHApIC8gc2VsZi5vcHRpb25zLmVhc2luZ0Ftb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5iZ3lwICs9IChzZWxmLmxhcmdlSGVpZ2h0L3NlbGYubmV3dmFsdWUgIC0gc2VsZi5iZ3lwKSAvIHNlbGYub3B0aW9ucy5lYXNpbmdBbW91bnQ7XG5cbiAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyh7IFwiYmFja2dyb3VuZC1zaXplXCI6IHNlbGYuYmd4cCArICdweCAnICsgc2VsZi5iZ3lwICsgJ3B4JyB9KTtcblxuXG4gICAgICAgICAgICAgICAgICB9LCAxNik7XG5cbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlQmdTaXplID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5jc3MoeyBiYWNrZ3JvdW5kUG9zaXRpb246IHNlbGYud2luZG93TGVmdFBvcyArICdweCAnICsgc2VsZi53aW5kb3dUb3BQb3MgKyAncHgnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY3JvbGxpbmdMb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxvb3AgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmNoYW5nZUJnU2l6ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5uekhlaWdodD5zZWxmLm56V2lkdGgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJsZW5zXCIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tTGVucy5jc3MoeyBcImJhY2tncm91bmQtc2l6ZVwiOiBzZWxmLmxhcmdlV2lkdGgvc2VsZi5uZXd2YWx1ZWhlaWdodCArICdweCAnICsgc2VsZi5sYXJnZUhlaWdodC9zZWxmLm5ld3ZhbHVlaGVpZ2h0ICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgXCJiYWNrZ3JvdW5kLXNpemVcIjogc2VsZi5sYXJnZVdpZHRoL3NlbGYubmV3dmFsdWVoZWlnaHQgKyAncHggJyArIHNlbGYubGFyZ2VIZWlnaHQvc2VsZi5uZXd2YWx1ZWhlaWdodCArICdweCcgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImxlbnNcIil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcyh7IFwiYmFja2dyb3VuZC1zaXplXCI6IHNlbGYubGFyZ2VXaWR0aC9zZWxmLm5ld3ZhbHVld2lkdGggKyAncHggJyArIHNlbGYubGFyZ2VIZWlnaHQvc2VsZi5uZXd2YWx1ZXdpZHRoICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgXCJiYWNrZ3JvdW5kLXNpemVcIjogc2VsZi5sYXJnZVdpZHRoL3NlbGYubmV3dmFsdWV3aWR0aCArICdweCAnICsgc2VsZi5sYXJnZUhlaWdodC9zZWxmLm5ld3ZhbHVld2lkdGggKyAncHgnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNoYW5nZUJnU2l6ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgYmFja2dyb3VuZFBvc2l0aW9uOiBzZWxmLnhwICsgJ3B4ICcgKyBzZWxmLnlwICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5jaGFuZ2VCZ1NpemUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYubnpIZWlnaHQ+c2VsZi5ueldpZHRoKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwibGVuc1wiKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUxlbnMuY3NzKHsgXCJiYWNrZ3JvdW5kLXNpemVcIjogc2VsZi5sYXJnZVdpZHRoL3NlbGYubmV3dmFsdWVoZWlnaHQgKyAncHggJyArIHNlbGYubGFyZ2VIZWlnaHQvc2VsZi5uZXd2YWx1ZWhlaWdodCArICdweCcgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgXCJiYWNrZ3JvdW5kLXNpemVcIjogc2VsZi5sYXJnZVdpZHRoL3NlbGYubmV3dmFsdWVoZWlnaHQgKyAncHggJyArIHNlbGYubGFyZ2VIZWlnaHQvc2VsZi5uZXd2YWx1ZWhlaWdodCArICdweCcgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImxlbnNcIil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcyh7IFwiYmFja2dyb3VuZC1zaXplXCI6IHNlbGYubGFyZ2VXaWR0aC9zZWxmLm5ld3ZhbHVld2lkdGggKyAncHggJyArIHNlbGYubGFyZ2VIZWlnaHQvc2VsZi5uZXd2YWx1ZXdpZHRoICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZigoc2VsZi5sYXJnZUhlaWdodC9zZWxmLm5ld3ZhbHVld2lkdGgpIDwgc2VsZi5vcHRpb25zLnpvb21XaW5kb3dIZWlnaHQpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgXCJiYWNrZ3JvdW5kLXNpemVcIjogc2VsZi5sYXJnZVdpZHRoL3NlbGYubmV3dmFsdWV3aWR0aCArICdweCAnICsgc2VsZi5sYXJnZUhlaWdodC9zZWxmLm5ld3ZhbHVld2lkdGggKyAncHgnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5jc3MoeyBcImJhY2tncm91bmQtc2l6ZVwiOiBzZWxmLmxhcmdlV2lkdGgvc2VsZi5uZXd2YWx1ZWhlaWdodCArICdweCAnICsgc2VsZi5sYXJnZUhlaWdodC9zZWxmLm5ld3ZhbHVlaGVpZ2h0ICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlQmdTaXplID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5jc3MoeyBiYWNrZ3JvdW5kUG9zaXRpb246IHNlbGYud2luZG93TGVmdFBvcyArICdweCAnICsgc2VsZi53aW5kb3dUb3BQb3MgKyAncHgnIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldFRpbnRQb3NpdGlvbjogZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHNlbGYubnpPZmZzZXQgPSBzZWxmLiRlbGVtLm9mZnNldCgpO1xuICAgICAgICAgICAgICAgIHNlbGYudGludHBvcyA9IFN0cmluZygoKGUucGFnZVggLSBzZWxmLm56T2Zmc2V0LmxlZnQpLShzZWxmLnpvb21MZW5zLndpZHRoKCkgLyAyKSkgKiAoLTEpKTtcbiAgICAgICAgICAgICAgICBzZWxmLnRpbnRwb3N5ID0gU3RyaW5nKCgoZS5wYWdlWSAtIHNlbGYubnpPZmZzZXQudG9wKSAtIHNlbGYuem9vbUxlbnMuaGVpZ2h0KCkgLyAyKSAqICgtMSkpO1xuICAgICAgICAgICAgICAgIGlmKHNlbGYuRXRvcHBvcyl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGludHBvc3kgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihzZWxmLkVsb3Bwb3Mpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbnRwb3M9MDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5FYm9wcG9zKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aW50cG9zeSA9IChzZWxmLm56SGVpZ2h0LXNlbGYuem9vbUxlbnMuaGVpZ2h0KCktKHNlbGYub3B0aW9ucy5sZW5zQm9yZGVyU2l6ZSoyKSkqKC0xKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5Fcm9wcG9zKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aW50cG9zID0gKChzZWxmLm56V2lkdGgtc2VsZi56b29tTGVucy53aWR0aCgpLShzZWxmLm9wdGlvbnMubGVuc0JvcmRlclNpemUqMikpKigtMSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMudGludCkge1xuICAgICAgICAgICAgICAgICAgICAvL3N0b3BzIG1pY3JvIG1vdmVtZW50c1xuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmZ1bGxoZWlnaHQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aW50cG9zeSA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLmZ1bGx3aWR0aCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbnRwb3MgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludEltYWdlLmNzcyh7J2xlZnQnOiBzZWxmLnRpbnRwb3MrJ3B4J30pO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50SW1hZ2UuY3NzKHsndG9wJzogc2VsZi50aW50cG9zeSsncHgnfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgc3dhcHRoZWltYWdlOiBmdW5jdGlvbihzbWFsbGltYWdlLCBsYXJnZWltYWdlKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0ltZyA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLmxvYWRpbmdJY29uKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zcGlubmVyID0gJCgnPGRpdiBzdHlsZT1cImJhY2tncm91bmQ6IHVybChcXCcnK3NlbGYub3B0aW9ucy5sb2FkaW5nSWNvbisnXFwnKSBuby1yZXBlYXQgY2VudGVyO2hlaWdodDonK3NlbGYubnpIZWlnaHQrJ3B4O3dpZHRoOicrc2VsZi5ueldpZHRoKydweDt6LWluZGV4OiAyMDAwO3Bvc2l0aW9uOiBhYnNvbHV0ZTsgYmFja2dyb3VuZC1wb3NpdGlvbjogY2VudGVyIGNlbnRlcjtcIj48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZWxlbS5hZnRlcihzZWxmLnNwaW5uZXIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlbGYub3B0aW9ucy5vbkltYWdlU3dhcChzZWxmLiRlbGVtKTtcblxuICAgICAgICAgICAgICAgIG5ld0ltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sYXJnZVdpZHRoID0gbmV3SW1nLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxhcmdlSGVpZ2h0ID0gbmV3SW1nLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tSW1hZ2UgPSBsYXJnZWltYWdlO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgXCJiYWNrZ3JvdW5kLXNpemVcIjogc2VsZi5sYXJnZVdpZHRoICsgJ3B4ICcgKyBzZWxmLmxhcmdlSGVpZ2h0ICsgJ3B4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyh7IFwiYmFja2dyb3VuZC1zaXplXCI6IHNlbGYubGFyZ2VXaWR0aCArICdweCAnICsgc2VsZi5sYXJnZUhlaWdodCArICdweCcgfSk7XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnN3YXBBY3Rpb24oc21hbGxpbWFnZSwgbGFyZ2VpbWFnZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV3SW1nLnNyYyA9IGxhcmdlaW1hZ2U7IC8vIHRoaXMgbXVzdCBiZSBkb25lIEFGVEVSIHNldHRpbmcgb25sb2FkXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzd2FwQWN0aW9uOiBmdW5jdGlvbihzbWFsbGltYWdlLCBsYXJnZWltYWdlKXtcblxuXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgdmFyIG5ld0ltZzIgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICBuZXdJbWcyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvL3JlLWNhbGN1bGF0ZSB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5uekhlaWdodCA9IG5ld0ltZzIuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBzZWxmLm56V2lkdGggPSBuZXdJbWcyLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMub25JbWFnZVN3YXBDb21wbGV0ZShzZWxmLiRlbGVtKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmRvbmVDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5ld0ltZzIuc3JjID0gc21hbGxpbWFnZTtcblxuICAgICAgICAgICAgICAgIC8vcmVzZXQgdGhlIHpvb21sZXZlbCB0byB0aGF0IGluaXRpYWxseSBzZXQgaW4gb3B0aW9uc1xuICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudFpvb21MZXZlbCA9IHNlbGYub3B0aW9ucy56b29tTGV2ZWw7XG4gICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zLm1heFpvb21MZXZlbCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy9zd2FwcyB0aGUgbWFpbiBpbWFnZVxuICAgICAgICAgICAgICAgIC8vc2VsZi4kZWxlbS5hdHRyKFwic3JjXCIsc21hbGxpbWFnZSk7XG4gICAgICAgICAgICAgICAgLy9zd2FwcyB0aGUgem9vbSBpbWFnZVxuICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImxlbnNcIikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcyh7IGJhY2tncm91bmRJbWFnZTogXCJ1cmwoJ1wiICsgbGFyZ2VpbWFnZSArIFwiJylcIiB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwid2luZG93XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyh7IGJhY2tncm91bmRJbWFnZTogXCJ1cmwoJ1wiICsgbGFyZ2VpbWFnZSArIFwiJylcIiB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwiaW5uZXJcIikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKHsgYmFja2dyb3VuZEltYWdlOiBcInVybCgnXCIgKyBsYXJnZWltYWdlICsgXCInKVwiIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuXG5cbiAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRJbWFnZSA9IGxhcmdlaW1hZ2U7XG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuaW1hZ2VDcm9zc2ZhZGUpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkSW1nID0gc2VsZi4kZWxlbTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0ltZyA9IG9sZEltZy5jbG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRlbGVtLmF0dHIoXCJzcmNcIixzbWFsbGltYWdlKVxuICAgICAgICAgICAgICAgICAgICBzZWxmLiRlbGVtLmFmdGVyKG5ld0ltZyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld0ltZy5zdG9wKHRydWUpLmZhZGVPdXQoc2VsZi5vcHRpb25zLmltYWdlQ3Jvc3NmYWRlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgIFx0XHRcdFx0aWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwiaW5uZXJcIil7XG4gICAgICAgICAgICAgICAgICAgIC8vcmVtb3ZlIGFueSBhdHRyaWJ1dGVzIG9uIHRoZSBjbG9uZWQgaW1hZ2Ugc28gd2UgY2FuIHJlc2l6ZSBsYXRlclxuICAgICAgICAgICAgICAgICAgICBzZWxmLiRlbGVtLndpZHRoKFwiYXV0b1wiKS5yZW1vdmVBdHRyKFwid2lkdGhcIik7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGVsZW0uaGVpZ2h0KFwiYXV0b1wiKS5yZW1vdmVBdHRyKFwiaGVpZ2h0XCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgIH1cblxuICAgICAgICAgICAgICAgICAgICBvbGRJbWcuZmFkZUluKHNlbGYub3B0aW9ucy5pbWFnZUNyb3NzZmFkZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnRpbnQgJiYgc2VsZi5vcHRpb25zLnpvb21UeXBlICE9IFwiaW5uZXJcIikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkSW1nVGludCA9IHNlbGYuem9vbVRpbnRJbWFnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdJbWdUaW50ID0gb2xkSW1nVGludC5jbG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludEltYWdlLmF0dHIoXCJzcmNcIixsYXJnZWltYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludEltYWdlLmFmdGVyKG5ld0ltZ1RpbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW1nVGludC5zdG9wKHRydWUpLmZhZGVPdXQoc2VsZi5vcHRpb25zLmltYWdlQ3Jvc3NmYWRlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cblxuXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRJbWdUaW50LmZhZGVJbihzZWxmLm9wdGlvbnMuaW1hZ2VDcm9zc2ZhZGUpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc2VsZi56b29tVGludEltYWdlLmF0dHIoXCJ3aWR0aFwiLGVsZW0uZGF0YShcImltYWdlXCIpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9yZXNpemUgdGhlIHRpbnQgd2luZG93XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50LmNzcyh7IGhlaWdodDogc2VsZi4kZWxlbS5oZWlnaHQoKX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludC5jc3MoeyB3aWR0aDogc2VsZi4kZWxlbS53aWR0aCgpfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuY3NzKFwiaGVpZ2h0XCIsIHNlbGYuJGVsZW0uaGVpZ2h0KCkpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuY3NzKFwid2lkdGhcIiwgc2VsZi4kZWxlbS53aWR0aCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFzZWxmLm9wdGlvbnMuY29uc3RyYWluVHlwZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV3JhcC5wYXJlbnQoKS5jc3MoXCJoZWlnaHRcIiwgc2VsZi4kZWxlbS5oZWlnaHQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV3JhcC5wYXJlbnQoKS5jc3MoXCJ3aWR0aFwiLCBzZWxmLiRlbGVtLndpZHRoKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyhcImhlaWdodFwiLCBzZWxmLiRlbGVtLmhlaWdodCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKFwid2lkdGhcIiwgc2VsZi4kZWxlbS53aWR0aCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy5pbWFnZUNyb3NzZmFkZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XcmFwLmNzcyhcImhlaWdodFwiLCBzZWxmLiRlbGVtLmhlaWdodCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdyYXAuY3NzKFwid2lkdGhcIiwgc2VsZi4kZWxlbS53aWR0aCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRlbGVtLmF0dHIoXCJzcmNcIixzbWFsbGltYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnRpbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnRJbWFnZS5hdHRyKFwic3JjXCIsbGFyZ2VpbWFnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NlbGYuem9vbVRpbnRJbWFnZS5hdHRyKFwid2lkdGhcIixlbGVtLmRhdGEoXCJpbWFnZVwiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50SW1hZ2UuYXR0cihcImhlaWdodFwiLHNlbGYuJGVsZW0uaGVpZ2h0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9zZWxmLnpvb21UaW50SW1hZ2UuYXR0cignc3JjJykgPSBlbGVtLmRhdGEoXCJpbWFnZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnRJbWFnZS5jc3MoeyBoZWlnaHQ6IHNlbGYuJGVsZW0uaGVpZ2h0KCl9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnQuY3NzKHsgaGVpZ2h0OiBzZWxmLiRlbGVtLmhlaWdodCgpfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuY3NzKFwiaGVpZ2h0XCIsIHNlbGYuJGVsZW0uaGVpZ2h0KCkpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuY3NzKFwid2lkdGhcIiwgc2VsZi4kZWxlbS53aWR0aCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuaW1hZ2VDcm9zc2ZhZGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV3JhcC5jc3MoXCJoZWlnaHRcIiwgc2VsZi4kZWxlbS5oZWlnaHQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XcmFwLmNzcyhcIndpZHRoXCIsIHNlbGYuJGVsZW0ud2lkdGgoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLmNvbnN0cmFpblR5cGUpe1xuXG4gICAgICAgICAgICAgICAgICAgIC8vVGhpcyB3aWxsIGNvbnRyYWluIHRoZSBpbWFnZSBwcm9wb3J0aW9uc1xuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuY29uc3RyYWluVHlwZSA9PSBcImhlaWdodFwiKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tQ29udGFpbmVyLmNzcyhcImhlaWdodFwiLCBzZWxmLm9wdGlvbnMuY29uc3RyYWluU2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuY3NzKFwid2lkdGhcIiwgXCJhdXRvXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuaW1hZ2VDcm9zc2ZhZGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdyYXAuY3NzKFwiaGVpZ2h0XCIsIHNlbGYub3B0aW9ucy5jb25zdHJhaW5TaXplKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XcmFwLmNzcyhcIndpZHRoXCIsIFwiYXV0b1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNvbnN0d2lkdGggPSBzZWxmLnpvb21XcmFwLndpZHRoKCk7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRlbGVtLmNzcyhcImhlaWdodFwiLCBzZWxmLm9wdGlvbnMuY29uc3RyYWluU2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZWxlbS5jc3MoXCJ3aWR0aFwiLCBcImF1dG9cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb25zdHdpZHRoID0gc2VsZi4kZWxlbS53aWR0aCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdyYXAucGFyZW50KCkuY3NzKFwiaGVpZ2h0XCIsIHNlbGYub3B0aW9ucy5jb25zdHJhaW5TaXplKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XcmFwLnBhcmVudCgpLmNzcyhcIndpZHRoXCIsIHNlbGYuY29uc3R3aWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyhcImhlaWdodFwiLCBzZWxmLm9wdGlvbnMuY29uc3RyYWluU2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV2luZG93LmNzcyhcIndpZHRoXCIsIHNlbGYuY29uc3R3aWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMudGludCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aW50Q29udGFpbmVyLmNzcyhcImhlaWdodFwiLCBzZWxmLm9wdGlvbnMuY29uc3RyYWluU2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aW50Q29udGFpbmVyLmNzcyhcIndpZHRoXCIsIHNlbGYuY29uc3R3aWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludC5jc3MoXCJoZWlnaHRcIiwgc2VsZi5vcHRpb25zLmNvbnN0cmFpblNpemUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnQuY3NzKFwid2lkdGhcIiwgc2VsZi5jb25zdHdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50SW1hZ2UuY3NzKFwiaGVpZ2h0XCIsIHNlbGYub3B0aW9ucy5jb25zdHJhaW5TaXplKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21UaW50SW1hZ2UuY3NzKFwid2lkdGhcIiwgc2VsZi5jb25zdHdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy5jb25zdHJhaW5UeXBlID09IFwid2lkdGhcIil7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21Db250YWluZXIuY3NzKFwiaGVpZ2h0XCIsIFwiYXV0b1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUNvbnRhaW5lci5jc3MoXCJ3aWR0aFwiLCBzZWxmLm9wdGlvbnMuY29uc3RyYWluU2l6ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy5pbWFnZUNyb3NzZmFkZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tV3JhcC5jc3MoXCJoZWlnaHRcIiwgXCJhdXRvXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdyYXAuY3NzKFwid2lkdGhcIiwgc2VsZi5vcHRpb25zLmNvbnN0cmFpblNpemUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29uc3RoZWlnaHQgPSBzZWxmLnpvb21XcmFwLmhlaWdodCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRlbGVtLmNzcyhcImhlaWdodFwiLCBcImF1dG9cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZWxlbS5jc3MoXCJ3aWR0aFwiLCBzZWxmLm9wdGlvbnMuY29uc3RyYWluU2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb25zdGhlaWdodCA9IHNlbGYuJGVsZW0uaGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XcmFwLnBhcmVudCgpLmNzcyhcImhlaWdodFwiLCBzZWxmLmNvbnN0aGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XcmFwLnBhcmVudCgpLmNzcyhcIndpZHRoXCIsIHNlbGYub3B0aW9ucy5jb25zdHJhaW5TaXplKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21XaW5kb3cuY3NzKFwiaGVpZ2h0XCIsIHNlbGYuY29uc3RoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVdpbmRvdy5jc3MoXCJ3aWR0aFwiLCBzZWxmLm9wdGlvbnMuY29uc3RyYWluU2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMudGludCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aW50Q29udGFpbmVyLmNzcyhcImhlaWdodFwiLCBzZWxmLmNvbnN0aGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbnRDb250YWluZXIuY3NzKFwid2lkdGhcIiwgc2VsZi5vcHRpb25zLmNvbnN0cmFpblNpemUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnQuY3NzKFwiaGVpZ2h0XCIsIHNlbGYuY29uc3RoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnQuY3NzKFwid2lkdGhcIiwgc2VsZi5vcHRpb25zLmNvbnN0cmFpblNpemUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbVRpbnRJbWFnZS5jc3MoXCJoZWlnaHRcIiwgc2VsZi5jb25zdGhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tVGludEltYWdlLmNzcyhcIndpZHRoXCIsIHNlbGYub3B0aW9ucy5jb25zdHJhaW5TaXplKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRvbmVDYWxsYmFjazogZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMubG9hZGluZ0ljb24pe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNwaW5uZXIuaGlkZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlbGYubnpPZmZzZXQgPSBzZWxmLiRlbGVtLm9mZnNldCgpO1xuICAgICAgICAgICAgICAgIHNlbGYubnpXaWR0aCA9IHNlbGYuJGVsZW0ud2lkdGgoKTtcbiAgICAgICAgICAgICAgICBzZWxmLm56SGVpZ2h0ID0gc2VsZi4kZWxlbS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgICAgIC8vIHJlc2V0IHRoZSB6b29tbGV2ZWwgYmFjayB0byBkZWZhdWx0XG4gICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Wm9vbUxldmVsID0gc2VsZi5vcHRpb25zLnpvb21MZXZlbDtcblxuICAgICAgICAgICAgICAgIC8vcmF0aW8gb2YgdGhlIGxhcmdlIHRvIHNtYWxsIGltYWdlXG4gICAgICAgICAgICAgICAgc2VsZi53aWR0aFJhdGlvID0gc2VsZi5sYXJnZVdpZHRoIC8gc2VsZi5ueldpZHRoO1xuICAgICAgICAgICAgICAgIHNlbGYuaGVpZ2h0UmF0aW8gPSBzZWxmLmxhcmdlSGVpZ2h0IC8gc2VsZi5uekhlaWdodDtcblxuICAgICAgICAgICAgICAgIC8vTkVFRCBUTyBBREQgVEhFIExFTlMgU0laRSBGT1IgUk9VTkRcbiAgICAgICAgICAgICAgICAvLyBhZGp1c3QgaW1hZ2VzIGxlc3MgdGhhbiB0aGUgd2luZG93IGhlaWdodFxuICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcIndpbmRvd1wiKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5uekhlaWdodCA8IHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgvc2VsZi53aWR0aFJhdGlvKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbnNIZWlnaHQgPSBzZWxmLm56SGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbnNIZWlnaHQgPSBTdHJpbmcoKHNlbGYub3B0aW9ucy56b29tV2luZG93SGVpZ2h0L3NlbGYuaGVpZ2h0UmF0aW8pKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21XaW5kb3dXaWR0aCA8IHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVuc1dpZHRoID0gc2VsZi5ueldpZHRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5zV2lkdGggPSAgKHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgvc2VsZi53aWR0aFJhdGlvKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi56b29tTGVucyl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuem9vbUxlbnMuY3NzKCd3aWR0aCcsIGxlbnNXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcygnaGVpZ2h0JywgbGVuc0hlaWdodCk7XG5cblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEN1cnJlbnRJbWFnZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuem9vbUltYWdlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEdhbGxlcnlMaXN0OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICAvL2xvb3AgdGhyb3VnaCB0aGUgZ2FsbGVyeSBvcHRpb25zIGFuZCBzZXQgdGhlbSBpbiBsaXN0IGZvciBmYW5jeWJveFxuICAgICAgICAgICAgICAgIHNlbGYuZ2FsbGVyeWxpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5vcHRpb25zLmdhbGxlcnkpe1xuXG5cbiAgICAgICAgICAgICAgICAgICAgJCgnIycrc2VsZi5vcHRpb25zLmdhbGxlcnkgKyAnIGEnKS5lYWNoKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW1nX3NyYyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoJCh0aGlzKS5kYXRhKFwiem9vbS1pbWFnZVwiKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nX3NyYyA9ICQodGhpcykuZGF0YShcInpvb20taW1hZ2VcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKCQodGhpcykuZGF0YShcImltYWdlXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWdfc3JjID0gJCh0aGlzKS5kYXRhKFwiaW1hZ2VcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3B1dCB0aGUgY3VycmVudCBpbWFnZSBhdCB0aGUgc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGltZ19zcmMgPT0gc2VsZi56b29tSW1hZ2Upe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZ2FsbGVyeWxpc3QudW5zaGlmdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6ICcnK2ltZ19zcmMrJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAkKHRoaXMpLmZpbmQoJ2ltZycpLmF0dHIoXCJ0aXRsZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmdhbGxlcnlsaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBocmVmOiAnJytpbWdfc3JjKycnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJCh0aGlzKS5maW5kKCdpbWcnKS5hdHRyKFwidGl0bGVcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2lmIG5vIGdhbGxlcnkgLSByZXR1cm4gY3VycmVudCBpbWFnZVxuICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZ2FsbGVyeWxpc3QucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBocmVmOiAnJytzZWxmLnpvb21JbWFnZSsnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAkKHRoaXMpLmZpbmQoJ2ltZycpLmF0dHIoXCJ0aXRsZVwiKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2FsbGVyeWxpc3Q7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaGFuZ2Vab29tTGV2ZWw6IGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICAvL2ZsYWcgYSB6b29tLCBzbyBjYW4gYWRqdXN0IHRoZSBlYXNpbmcgZHVyaW5nIHNldFBvc2l0aW9uXG4gICAgICAgICAgICAgICAgc2VsZi5zY3JvbGxpbmdMb2NrID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIC8vcm91bmQgdG8gdHdvIGRlY2ltYWwgcGxhY2VzXG4gICAgICAgICAgICAgICAgc2VsZi5uZXd2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpLnRvRml4ZWQoMik7XG4gICAgICAgICAgICAgICAgbmV3dmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKS50b0ZpeGVkKDIpO1xuXG5cblxuXG4gICAgICAgICAgICAgICAgLy9tYXh3aWR0aCAmIE1heGhlaWdodCBvZiB0aGUgaW1hZ2VcbiAgICAgICAgICAgICAgICBtYXhoZWlnaHRuZXd2YWx1ZSA9IHNlbGYubGFyZ2VIZWlnaHQvKChzZWxmLm9wdGlvbnMuem9vbVdpbmRvd0hlaWdodCAvIHNlbGYubnpIZWlnaHQpICogc2VsZi5uekhlaWdodCk7XG4gICAgICAgICAgICAgICAgbWF4d2lkdGh0bmV3dmFsdWUgPSBzZWxmLmxhcmdlV2lkdGgvKChzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1dpZHRoIC8gc2VsZi5ueldpZHRoKSAqIHNlbGYubnpXaWR0aCk7XG5cblxuXG5cbiAgICAgICAgICAgICAgICAvL2NhbGN1bGF0ZSBuZXcgaGVpZ2h0cmF0aW9cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgIT0gXCJpbm5lclwiKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobWF4aGVpZ2h0bmV3dmFsdWUgPD0gbmV3dmFsdWUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5oZWlnaHRSYXRpbyA9IChzZWxmLmxhcmdlSGVpZ2h0L21heGhlaWdodG5ld3ZhbHVlKSAvIHNlbGYubnpIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5ld3ZhbHVlaGVpZ2h0ID0gbWF4aGVpZ2h0bmV3dmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZ1bGxoZWlnaHQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaGVpZ2h0UmF0aW8gPSAoc2VsZi5sYXJnZUhlaWdodC9uZXd2YWx1ZSkgLyBzZWxmLm56SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXd2YWx1ZWhlaWdodCA9IG5ld3ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mdWxsaGVpZ2h0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbi8vXHRcdFx0XHRcdGNhbGN1bGF0ZSBuZXcgd2lkdGggcmF0aW9cblxuICAgICAgICAgICAgICAgICAgICBpZihtYXh3aWR0aHRuZXd2YWx1ZSA8PSBuZXd2YWx1ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpZHRoUmF0aW8gPSAoc2VsZi5sYXJnZVdpZHRoL21heHdpZHRodG5ld3ZhbHVlKSAvIHNlbGYubnpXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV3dmFsdWV3aWR0aCA9IG1heHdpZHRodG5ld3ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mdWxsd2lkdGggPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYud2lkdGhSYXRpbyA9IChzZWxmLmxhcmdlV2lkdGgvbmV3dmFsdWUpIC8gc2VsZi5ueldpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXd2YWx1ZXdpZHRoID0gbmV3dmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZ1bGx3aWR0aCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwibGVuc1wiKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG1heGhlaWdodG5ld3ZhbHVlIDw9IG5ld3ZhbHVlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZ1bGx3aWR0aCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXd2YWx1ZXdpZHRoID0gbWF4aGVpZ2h0bmV3dmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLndpZHRoUmF0aW8gPSAoc2VsZi5sYXJnZVdpZHRoL25ld3ZhbHVlKSAvIHNlbGYubnpXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5ld3ZhbHVld2lkdGggPSBuZXd2YWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZnVsbHdpZHRoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIH1cblxuXG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4aGVpZ2h0bmV3dmFsdWUgPSBwYXJzZUZsb2F0KHNlbGYubGFyZ2VIZWlnaHQvc2VsZi5uekhlaWdodCkudG9GaXhlZCgyKTtcbiAgICAgICAgICAgICAgICAgICAgbWF4d2lkdGh0bmV3dmFsdWUgPSBwYXJzZUZsb2F0KHNlbGYubGFyZ2VXaWR0aC9zZWxmLm56V2lkdGgpLnRvRml4ZWQoMik7XG4gICAgICAgICAgICAgICAgICAgIGlmKG5ld3ZhbHVlID4gbWF4aGVpZ2h0bmV3dmFsdWUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3dmFsdWUgPSBtYXhoZWlnaHRuZXd2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihuZXd2YWx1ZSA+IG1heHdpZHRodG5ld3ZhbHVlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld3ZhbHVlID0gbWF4d2lkdGh0bmV3dmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgICAgIGlmKG1heGhlaWdodG5ld3ZhbHVlIDw9IG5ld3ZhbHVlKXtcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmhlaWdodFJhdGlvID0gKHNlbGYubGFyZ2VIZWlnaHQvbmV3dmFsdWUpIC8gc2VsZi5uekhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG5ld3ZhbHVlID4gbWF4aGVpZ2h0bmV3dmFsdWUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV3dmFsdWVoZWlnaHQgPSBtYXhoZWlnaHRuZXd2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV3dmFsdWVoZWlnaHQgPSBuZXd2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZnVsbGhlaWdodCA9IHRydWU7XG5cblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG5cblxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmhlaWdodFJhdGlvID0gKHNlbGYubGFyZ2VIZWlnaHQvbmV3dmFsdWUpIC8gc2VsZi5uekhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobmV3dmFsdWUgPiBtYXhoZWlnaHRuZXd2YWx1ZSl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5ld3ZhbHVlaGVpZ2h0ID0gbWF4aGVpZ2h0bmV3dmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5ld3ZhbHVlaGVpZ2h0ID0gbmV3dmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZ1bGxoZWlnaHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cblxuXG4gICAgICAgICAgICAgICAgICAgIGlmKG1heHdpZHRodG5ld3ZhbHVlIDw9IG5ld3ZhbHVlKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aWR0aFJhdGlvID0gKHNlbGYubGFyZ2VXaWR0aC9uZXd2YWx1ZSkgLyBzZWxmLm56V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihuZXd2YWx1ZSA+IG1heHdpZHRodG5ld3ZhbHVlKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV3dmFsdWV3aWR0aCA9IG1heHdpZHRodG5ld3ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXd2YWx1ZXdpZHRoID0gbmV3dmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZnVsbHdpZHRoID0gdHJ1ZTtcblxuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi53aWR0aFJhdGlvID0gKHNlbGYubGFyZ2VXaWR0aC9uZXd2YWx1ZSkgLyBzZWxmLm56V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5ld3ZhbHVld2lkdGggPSBuZXd2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZnVsbHdpZHRoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgfSAvL2VuZCBpbm5lclxuICAgICAgICAgICAgICAgIHNjcmNvbnRpbnVlID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKXtcblxuICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm56V2lkdGggPiBzZWxmLm56SGVpZ2h0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBzZWxmLm5ld3ZhbHVld2lkdGggPD0gbWF4d2lkdGh0bmV3dmFsdWUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmNvbnRpbnVlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3Jjb250aW51ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZnVsbGhlaWdodCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mdWxsd2lkdGggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYubnpIZWlnaHQgPiBzZWxmLm56V2lkdGgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIHNlbGYubmV3dmFsdWV3aWR0aCA8PSBtYXh3aWR0aHRuZXd2YWx1ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyY29udGludWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3Jjb250aW51ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mdWxsaGVpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZ1bGx3aWR0aCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgIT0gXCJpbm5lclwiKXtcbiAgICAgICAgICAgICAgICAgICAgc2NyY29udGludWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKHNjcmNvbnRpbnVlKXtcblxuXG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tTG9jayA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlWm9vbSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9pZiBsZW5zIGhlaWdodCBpcyBsZXNzIHRoYW4gaW1hZ2UgaGVpZ2h0XG5cblxuICAgICAgICAgICAgICAgICAgICBpZigoKHNlbGYub3B0aW9ucy56b29tV2luZG93SGVpZ2h0KS9zZWxmLmhlaWdodFJhdGlvKSA8PSBzZWxmLm56SGVpZ2h0KXtcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRab29tTGV2ZWwgPSBzZWxmLm5ld3ZhbHVlaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5vcHRpb25zLnpvb21UeXBlICE9IFwibGVuc1wiICYmIHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImlubmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNoYW5nZUJnU2l6ZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnpvb21MZW5zLmNzcyh7aGVpZ2h0OiBTdHJpbmcoKHNlbGYub3B0aW9ucy56b29tV2luZG93SGVpZ2h0KS9zZWxmLmhlaWdodFJhdGlvKSArICdweCcgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImxlbnNcIiB8fCBzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJpbm5lclwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2VCZ1NpemUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cblxuXG4gICAgICAgICAgICAgICAgICAgIGlmKChzZWxmLm9wdGlvbnMuem9vbVdpbmRvd1dpZHRoL3NlbGYud2lkdGhSYXRpbykgPD0gc2VsZi5ueldpZHRoKXtcblxuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImlubmVyXCIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYubmV3dmFsdWV3aWR0aCA+IHNlbGYubmV3dmFsdWVoZWlnaHQpICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRab29tTGV2ZWwgPSBzZWxmLm5ld3ZhbHVld2lkdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSAhPSBcImxlbnNcIiAmJiBzZWxmLm9wdGlvbnMuem9vbVR5cGUgIT0gXCJpbm5lclwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2VCZ1NpemUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi56b29tTGVucy5jc3Moe3dpZHRoOiBTdHJpbmcoKHNlbGYub3B0aW9ucy56b29tV2luZG93V2lkdGgpL3NlbGYud2lkdGhSYXRpbykgKyAncHgnIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm9wdGlvbnMuem9vbVR5cGUgPT0gXCJsZW5zXCIgfHwgc2VsZi5vcHRpb25zLnpvb21UeXBlID09IFwiaW5uZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlQmdTaXplID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYub3B0aW9ucy56b29tVHlwZSA9PSBcImlubmVyXCIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2VCZ1NpemUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm56V2lkdGggPiBzZWxmLm56SGVpZ2h0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRab29tTGV2ZWwgPSBzZWxmLm5ld3ZhbHVld2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLm56SGVpZ2h0ID4gc2VsZi5ueldpZHRoKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRab29tTGV2ZWwgPSBzZWxmLm5ld3ZhbHVld2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0gICAgICAvL3VuZGVyXG5cbiAgICAgICAgICAgICAgICAvL3NldHMgdGhlIGJvdW5kcnkgY2hhbmdlLCBjYWxsZWQgaW4gc2V0V2luZG93UG9zXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRQb3NpdGlvbihzZWxmLmN1cnJlbnRMb2MpO1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xvc2VBbGw6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgaWYoc2VsZi56b29tV2luZG93KXtzZWxmLnpvb21XaW5kb3cuaGlkZSgpO31cbiAgICAgICAgICAgICAgICBpZihzZWxmLnpvb21MZW5zKXtzZWxmLnpvb21MZW5zLmhpZGUoKTt9XG4gICAgICAgICAgICAgICAgaWYoc2VsZi56b29tVGludCl7c2VsZi56b29tVGludC5oaWRlKCk7fVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoYW5nZVN0YXRlOiBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmKHZhbHVlID09ICdlbmFibGUnKXtzZWxmLm9wdGlvbnMuem9vbUVuYWJsZWQgPSB0cnVlO31cbiAgICAgICAgICAgICAgICBpZih2YWx1ZSA9PSAnZGlzYWJsZScpe3NlbGYub3B0aW9ucy56b29tRW5hYmxlZCA9IGZhbHNlO31cblxuICAgICAgICAgICAgfVxuXG4gICAgfTtcblxuXG5cblxuICAgICQuZm4uZWxldmF0ZVpvb20gPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbGV2YXRlID0gT2JqZWN0LmNyZWF0ZSggRWxldmF0ZVpvb20gKTtcblxuICAgICAgICAgICAgZWxldmF0ZS5pbml0KCBvcHRpb25zLCB0aGlzICk7XG5cbiAgICAgICAgICAgICQuZGF0YSggdGhpcywgJ2VsZXZhdGVab29tJywgZWxldmF0ZSApO1xuXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkLmZuLmVsZXZhdGVab29tLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICB6b29tQWN0aXZhdGlvbjogXCJob3ZlclwiLCAvLyBDYW4gYWxzbyBiZSBjbGljayAoUExBQ0VIT0xERVIgRk9SIE5FWFQgVkVSU0lPTilcbiAgICAgIHpvb21FbmFibGVkOiB0cnVlLCAvL2ZhbHNlIGRpc2FibGVzIHpvb213aW5kb3cgZnJvbSBzaG93aW5nXG4gICAgICAgICAgICBwcmVsb2FkaW5nOiAxLCAvL2J5IGRlZmF1bHQsIGxvYWQgYWxsIHRoZSBpbWFnZXMsIGlmIDAsIHRoZW4gb25seSBsb2FkIGltYWdlcyBhZnRlciBhY3RpdmF0ZWQgKFBMQUNFSE9MREVSIEZPUiBORVhUIFZFUlNJT04pXG4gICAgICAgICAgICB6b29tTGV2ZWw6IDEsIC8vZGVmYXVsdCB6b29tIGxldmVsIG9mIGltYWdlXG4gICAgICAgICAgICBzY3JvbGxab29tOiBmYWxzZSwgLy9hbGxvdyB6b29tIG9uIG1vdXNld2hlZWwsIHRydWUgdG8gYWN0aXZhdGVcbiAgICAgICAgICAgIHNjcm9sbFpvb21JbmNyZW1lbnQ6IDAuMSwgIC8vc3RlcHMgb2YgdGhlIHNjcm9sbHpvb21cbiAgICAgICAgICAgIG1pblpvb21MZXZlbDogZmFsc2UsXG4gICAgICAgICAgICBtYXhab29tTGV2ZWw6IGZhbHNlLFxuICAgICAgICAgICAgZWFzaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGVhc2luZ0Ftb3VudDogMTIsXG4gICAgICAgICAgICBsZW5zU2l6ZTogMjAwLFxuICAgICAgICAgICAgem9vbVdpbmRvd1dpZHRoOiA0MDAsXG4gICAgICAgICAgICB6b29tV2luZG93SGVpZ2h0OiA0MDAsXG4gICAgICAgICAgICB6b29tV2luZG93T2ZmZXR4OiAwLFxuICAgICAgICAgICAgem9vbVdpbmRvd09mZmV0eTogMCxcbiAgICAgICAgICAgIHpvb21XaW5kb3dQb3NpdGlvbjogMSxcbiAgICAgICAgICAgIHpvb21XaW5kb3dCZ0NvbG91cjogXCIjZmZmXCIsXG4gICAgICAgICAgICBsZW5zRmFkZUluOiBmYWxzZSxcbiAgICAgICAgICAgIGxlbnNGYWRlT3V0OiBmYWxzZSxcbiAgICAgICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgICAgIHpvb21XaW5kb3dGYWRlSW46IGZhbHNlLFxuICAgICAgICAgICAgem9vbVdpbmRvd0ZhZGVPdXQ6IGZhbHNlLFxuICAgICAgICAgICAgem9vbVdpbmRvd0Fsd2F5c1Nob3c6IGZhbHNlLFxuICAgICAgICAgICAgem9vbVRpbnRGYWRlSW46IGZhbHNlLFxuICAgICAgICAgICAgem9vbVRpbnRGYWRlT3V0OiBmYWxzZSxcbiAgICAgICAgICAgIGJvcmRlclNpemU6IDQsXG4gICAgICAgICAgICBzaG93TGVuczogdHJ1ZSxcbiAgICAgICAgICAgIGJvcmRlckNvbG91cjogXCIjODg4XCIsXG4gICAgICAgICAgICBsZW5zQm9yZGVyU2l6ZTogMSxcbiAgICAgICAgICAgIGxlbnNCb3JkZXJDb2xvdXI6IFwiIzAwMFwiLFxuICAgICAgICAgICAgbGVuc1NoYXBlOiBcInNxdWFyZVwiLCAvL2NhbiBiZSBcInJvdW5kXCJcbiAgICAgICAgICAgIHpvb21UeXBlOiBcIndpbmRvd1wiLCAvL3dpbmRvdyBpcyBkZWZhdWx0LCAgYWxzbyBcImxlbnNcIiBhdmFpbGFibGUgLVxuICAgICAgICAgICAgY29udGFpbkxlbnNab29tOiBmYWxzZSxcbiAgICAgICAgICAgIGxlbnNDb2xvdXI6IFwid2hpdGVcIiwgLy9jb2xvdXIgb2YgdGhlIGxlbnMgYmFja2dyb3VuZFxuICAgICAgICAgICAgbGVuc09wYWNpdHk6IDAuNCwgLy9vcGFjaXR5IG9mIHRoZSBsZW5zXG4gICAgICAgICAgICBsZW5zem9vbTogZmFsc2UsXG4gICAgICAgICAgICB0aW50OiBmYWxzZSwgLy9lbmFibGUgdGhlIHRpbnRpbmdcbiAgICAgICAgICAgIHRpbnRDb2xvdXI6IFwiIzMzM1wiLCAvL2RlZmF1bHQgdGludCBjb2xvciwgY2FuIGJlIGFueXRoaW5nLCByZWQsICNjY2MsIHJnYigwLDAsMClcbiAgICAgICAgICAgIHRpbnRPcGFjaXR5OiAwLjQsIC8vb3BhY2l0eSBvZiB0aGUgdGludFxuICAgICAgICAgICAgZ2FsbGVyeTogZmFsc2UsXG4gICAgICAgICAgICBnYWxsZXJ5QWN0aXZlQ2xhc3M6IFwiem9vbUdhbGxlcnlBY3RpdmVcIixcbiAgICAgICAgICAgIGltYWdlQ3Jvc3NmYWRlOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnN0cmFpblR5cGU6IGZhbHNlLCAgLy93aWR0aCBvciBoZWlnaHRcbiAgICAgICAgICAgIGNvbnN0cmFpblNpemU6IGZhbHNlLCAgLy9pbiBwaXhlbHMgdGhlIGRpbWVuc2lvbnMgeW91IHdhbnQgdG8gY29uc3RyYWluIG9uXG4gICAgICAgICAgICBsb2FkaW5nSWNvbjogZmFsc2UsIC8vaHR0cDovL3d3dy5leGFtcGxlLmNvbS9zcGlubmVyLmdpZlxuICAgICAgICAgICAgY3Vyc29yOlwiZGVmYXVsdFwiLCAvLyB1c2VyIHNob3VsZCBzZXQgdG8gd2hhdCB0aGV5IHdhbnQgdGhlIGN1cnNvciBhcywgaWYgdGhleSBoYXZlIHNldCBhIGNsaWNrIGZ1bmN0aW9uXG4gICAgICAgICAgICByZXNwb25zaXZlOnRydWUsXG4gICAgICAgICAgICBvbkNvbXBsZXRlOiAkLm5vb3AsXG4gICAgICAgICAgICBvblpvb21lZEltYWdlTG9hZGVkOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAgICAgb25JbWFnZVN3YXA6ICQubm9vcCxcbiAgICAgICAgICAgIG9uSW1hZ2VTd2FwQ29tcGxldGU6ICQubm9vcFxuICAgIH07XG5cbn0pKCBqUXVlcnksIHdpbmRvdywgZG9jdW1lbnQgKTtcbiIsIi8qXHRcbiAqIGpRdWVyeSBtbWVudSB2NC43LjVcbiAqIEByZXF1aXJlcyBqUXVlcnkgMS43LjAgb3IgbGF0ZXJcbiAqXG4gKiBtbWVudS5mcmVic2l0ZS5ubFxuICpcbiAqIENvcHlyaWdodCAoYykgRnJlZCBIZXVzc2NoZW5cbiAqIHd3dy5mcmVic2l0ZS5ubFxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZTpcbiAqIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2VcbiAqL1xuISBmdW5jdGlvbihlKSB7XG4gICAgZnVuY3Rpb24gbigpIHtcbiAgICAgICAgbCA9ICEwLCBkLiR3bmR3ID0gZSh3aW5kb3cpLCBkLiRodG1sID0gZShcImh0bWxcIiksIGQuJGJvZHkgPSBlKFwiYm9keVwiKSwgZS5lYWNoKFtpLCBhLCBvXSwgZnVuY3Rpb24oZSwgbikge1xuICAgICAgICAgICAgbi5hZGQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgZSA9IGUuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHQgaW4gZSkgbltlW3RdXSA9IG4ubW0oZVt0XSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIGkubW0gPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJtbS1cIiArIGVcbiAgICAgICAgfSwgaS5hZGQoXCJ3cmFwcGVyIG1lbnUgaW5saW5lIHBhbmVsIG5vcGFuZWwgbGlzdCBub2xpc3Qgc3VidGl0bGUgc2VsZWN0ZWQgbGFiZWwgc3BhY2VyIGN1cnJlbnQgaGlnaGVzdCBoaWRkZW4gb3BlbmVkIHN1Ym9wZW5lZCBzdWJvcGVuIGZ1bGxzdWJvcGVuIHN1YmNsb3NlXCIpLCBpLnVtbSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm1tLVwiID09IGUuc2xpY2UoMCwgMykgJiYgKGUgPSBlLnNsaWNlKDMpKSwgZVxuICAgICAgICB9LCBhLm1tID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIFwibW0tXCIgKyBlXG4gICAgICAgIH0sIGEuYWRkKFwicGFyZW50XCIpLCBvLm1tID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUgKyBcIi5tbVwiXG4gICAgICAgIH0sIG8uYWRkKFwidG9nZ2xlIG9wZW4gY2xvc2Ugc2V0U2VsZWN0ZWQgdHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG1vdXNlZG93biBtb3VzZXVwIHRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIHNjcm9sbCByZXNpemUgY2xpY2sga2V5ZG93biBrZXl1cFwiKSwgZVt0XS5fYyA9IGksIGVbdF0uX2QgPSBhLCBlW3RdLl9lID0gbywgZVt0XS5nbGJsID0gZFxuICAgIH1cbiAgICB2YXIgdCA9IFwibW1lbnVcIixcbiAgICAgICAgcyA9IFwiNC43LjVcIjtcbiAgICBpZiAoIWVbdF0pIHtcbiAgICAgICAgdmFyIGkgPSB7fSxcbiAgICAgICAgICAgIGEgPSB7fSxcbiAgICAgICAgICAgIG8gPSB7fSxcbiAgICAgICAgICAgIGwgPSAhMSxcbiAgICAgICAgICAgIGQgPSB7XG4gICAgICAgICAgICAgICAgJHduZHc6IG51bGwsXG4gICAgICAgICAgICAgICAgJGh0bWw6IG51bGwsXG4gICAgICAgICAgICAgICAgJGJvZHk6IG51bGxcbiAgICAgICAgICAgIH07XG4gICAgICAgIGVbdF0gPSBmdW5jdGlvbihuLCBzLCBpKSB7XG4gICAgICAgICAgICB0aGlzLiRtZW51ID0gbiwgdGhpcy5vcHRzID0gcywgdGhpcy5jb25mID0gaSwgdGhpcy52YXJzID0ge30sIFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgdGhpcy5fX19kZXByZWNhdGVkICYmIHRoaXMuX19fZGVwcmVjYXRlZCgpLCB0aGlzLl9pbml0TWVudSgpLCB0aGlzLl9pbml0QW5jaG9ycygpLCB0aGlzLl9pbml0RXZlbnRzKCk7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuJG1lbnUuY2hpbGRyZW4odGhpcy5jb25mLnBhbmVsTm9kZXR5cGUpO1xuICAgICAgICAgICAgZm9yICh2YXIgbyBpbiBlW3RdLmFkZG9ucykgZVt0XS5hZGRvbnNbb10uX2FkZC5jYWxsKHRoaXMpLCBlW3RdLmFkZG9uc1tvXS5fYWRkID0gZnVuY3Rpb24oKSB7fSwgZVt0XS5hZGRvbnNbb10uX3NldHVwLmNhbGwodGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5pdChhKSwgXCJmdW5jdGlvblwiID09IHR5cGVvZiB0aGlzLl9fX2RlYnVnICYmIHRoaXMuX19fZGVidWcoKSwgdGhpc1xuICAgICAgICB9LCBlW3RdLnZlcnNpb24gPSBzLCBlW3RdLmFkZG9ucyA9IHt9LCBlW3RdLnVuaXF1ZUlkID0gMCwgZVt0XS5kZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIGNsYXNzZXM6IFwiXCIsXG4gICAgICAgICAgICBzbGlkaW5nU3VibWVudXM6ICEwLFxuICAgICAgICAgICAgb25DbGljazoge1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkOiAhMFxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBlW3RdLmNvbmZpZ3VyYXRpb24gPSB7XG4gICAgICAgICAgICBwYW5lbE5vZGV0eXBlOiBcInVsLCBvbCwgZGl2XCIsXG4gICAgICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDQwMCxcbiAgICAgICAgICAgIG9wZW5pbmdJbnRlcnZhbDogMjUsXG4gICAgICAgICAgICBjbGFzc05hbWVzOiB7XG4gICAgICAgICAgICAgICAgcGFuZWw6IFwiUGFuZWxcIixcbiAgICAgICAgICAgICAgICBzZWxlY3RlZDogXCJTZWxlY3RlZFwiLFxuICAgICAgICAgICAgICAgIGxhYmVsOiBcIkxhYmVsXCIsXG4gICAgICAgICAgICAgICAgc3BhY2VyOiBcIlNwYWNlclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGVbdF0ucHJvdG90eXBlID0ge1xuICAgICAgICAgICAgX2luaXQ6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgICBuID0gbi5ub3QoXCIuXCIgKyBpLm5vcGFuZWwpLCBuID0gdGhpcy5faW5pdFBhbmVscyhuKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBzIGluIGVbdF0uYWRkb25zKSBlW3RdLmFkZG9uc1tzXS5faW5pdC5jYWxsKHRoaXMsIG4pO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2luaXRNZW51OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdHMub2ZmQ2FudmFzICYmIHRoaXMuY29uZi5jbG9uZSAmJiAodGhpcy4kbWVudSA9IHRoaXMuJG1lbnUuY2xvbmUoITApLCB0aGlzLiRtZW51LmFkZCh0aGlzLiRtZW51LmZpbmQoXCIqXCIpKS5maWx0ZXIoXCJbaWRdXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGUodGhpcykuYXR0cihcImlkXCIsIGkubW0oZSh0aGlzKS5hdHRyKFwiaWRcIikpKVxuICAgICAgICAgICAgICAgIH0pKSwgdGhpcy4kbWVudS5jb250ZW50cygpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIDMgPT0gZSh0aGlzKVswXS5ub2RlVHlwZSAmJiBlKHRoaXMpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgfSksIHRoaXMuJG1lbnUucGFyZW50KCkuYWRkQ2xhc3MoaS53cmFwcGVyKTtcbiAgICAgICAgICAgICAgICB2YXIgbiA9IFtpLm1lbnVdO1xuICAgICAgICAgICAgICAgIG4ucHVzaChpLm1tKHRoaXMub3B0cy5zbGlkaW5nU3VibWVudXMgPyBcImhvcml6b250YWxcIiA6IFwidmVydGljYWxcIikpLCB0aGlzLm9wdHMuY2xhc3NlcyAmJiBuLnB1c2godGhpcy5vcHRzLmNsYXNzZXMpLCB0aGlzLiRtZW51LmFkZENsYXNzKG4uam9pbihcIiBcIikpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2luaXRQYW5lbHM6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2ZpbmRBZGRCYWNrKG4sIFwidWwsIG9sXCIpLm5vdChcIi5cIiArIGkubm9saXN0KS5hZGRDbGFzcyhpLmxpc3QpO1xuICAgICAgICAgICAgICAgIHZhciBzID0gdGhpcy5fX2ZpbmRBZGRCYWNrKG4sIFwiLlwiICsgaS5saXN0KS5maW5kKFwiPiBsaVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcmVmYWN0b3JDbGFzcyhzLCB0aGlzLmNvbmYuY2xhc3NOYW1lcy5zZWxlY3RlZCwgXCJzZWxlY3RlZFwiKSwgdGhpcy5fX3JlZmFjdG9yQ2xhc3MocywgdGhpcy5jb25mLmNsYXNzTmFtZXMubGFiZWwsIFwibGFiZWxcIiksIHRoaXMuX19yZWZhY3RvckNsYXNzKHMsIHRoaXMuY29uZi5jbGFzc05hbWVzLnNwYWNlciwgXCJzcGFjZXJcIiksIHMub2ZmKG8uc2V0U2VsZWN0ZWQpLm9uKG8uc2V0U2VsZWN0ZWQsIGZ1bmN0aW9uKG4sIHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbi5zdG9wUHJvcGFnYXRpb24oKSwgcy5yZW1vdmVDbGFzcyhpLnNlbGVjdGVkKSwgXCJib29sZWFuXCIgIT0gdHlwZW9mIHQgJiYgKHQgPSAhMCksIHQgJiYgZSh0aGlzKS5hZGRDbGFzcyhpLnNlbGVjdGVkKVxuICAgICAgICAgICAgICAgIH0pLCB0aGlzLl9fcmVmYWN0b3JDbGFzcyh0aGlzLl9fZmluZEFkZEJhY2sobiwgXCIuXCIgKyB0aGlzLmNvbmYuY2xhc3NOYW1lcy5wYW5lbCksIHRoaXMuY29uZi5jbGFzc05hbWVzLnBhbmVsLCBcInBhbmVsXCIpLCBuLmFkZCh0aGlzLl9fZmluZEFkZEJhY2sobiwgXCIuXCIgKyBpLmxpc3QpLmNoaWxkcmVuKCkuY2hpbGRyZW4oKS5maWx0ZXIodGhpcy5jb25mLnBhbmVsTm9kZXR5cGUpLm5vdChcIi5cIiArIGkubm9wYW5lbCkpLmFkZENsYXNzKGkucGFuZWwpO1xuICAgICAgICAgICAgICAgIHZhciBsID0gdGhpcy5fX2ZpbmRBZGRCYWNrKG4sIFwiLlwiICsgaS5wYW5lbCksXG4gICAgICAgICAgICAgICAgICAgIGQgPSBlKFwiLlwiICsgaS5wYW5lbCwgdGhpcy4kbWVudSk7XG4gICAgICAgICAgICAgICAgaWYgKGwuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuID0gZSh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzID0gbi5hdHRyKFwiaWRcIikgfHwgdC5fX2dldFVuaXF1ZUlkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuLmF0dHIoXCJpZFwiLCBzKVxuICAgICAgICAgICAgICAgICAgICB9KSwgbC5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSBlKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMgPSBuLmlzKFwidWwsIG9sXCIpID8gbiA6IG4uZmluZChcInVsICxvbFwiKS5maXJzdCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8gPSBuLnBhcmVudCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgPSBvLmNoaWxkcmVuKFwiYSwgc3BhblwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkID0gby5jbG9zZXN0KFwiLlwiICsgaS5wYW5lbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5wYXJlbnQoKS5pcyhcIi5cIiArIGkubGlzdCkgJiYgIW4uZGF0YShhLnBhcmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuLmRhdGEoYS5wYXJlbnQsIG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByID0gZSgnPGEgY2xhc3M9XCInICsgaS5zdWJvcGVuICsgJ1wiIGhyZWY9XCIjJyArIG4uYXR0cihcImlkXCIpICsgJ1wiIC8+JykuaW5zZXJ0QmVmb3JlKGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwuaXMoXCJhXCIpIHx8IHIuYWRkQ2xhc3MoaS5mdWxsc3Vib3BlbiksIHQub3B0cy5zbGlkaW5nU3VibWVudXMgJiYgcy5wcmVwZW5kKCc8bGkgY2xhc3M9XCInICsgaS5zdWJ0aXRsZSArICdcIj48YSBjbGFzcz1cIicgKyBpLnN1YmNsb3NlICsgJ1wiIGhyZWY9XCIjJyArIGQuYXR0cihcImlkXCIpICsgJ1wiPicgKyBsLnRleHQoKSArIFwiPC9hPjwvbGk+XCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLCB0aGlzLm9wdHMuc2xpZGluZ1N1Ym1lbnVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByID0gdGhpcy5fX2ZpbmRBZGRCYWNrKG4sIFwiLlwiICsgaS5saXN0KS5maW5kKFwiPiBsaS5cIiArIGkuc2VsZWN0ZWQpO1xuICAgICAgICAgICAgICAgICAgICByLnBhcmVudHMoXCJsaVwiKS5yZW1vdmVDbGFzcyhpLnNlbGVjdGVkKS5lbmQoKS5hZGQoci5wYXJlbnRzKFwibGlcIikpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbiA9IGUodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdCA9IG4uZmluZChcIj4gLlwiICsgaS5wYW5lbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Lmxlbmd0aCAmJiAobi5wYXJlbnRzKFwiLlwiICsgaS5wYW5lbCkuYWRkQ2xhc3MoaS5zdWJvcGVuZWQpLCB0LmFkZENsYXNzKGkub3BlbmVkKSlcbiAgICAgICAgICAgICAgICAgICAgfSkuY2xvc2VzdChcIi5cIiArIGkucGFuZWwpLmFkZENsYXNzKGkub3BlbmVkKS5wYXJlbnRzKFwiLlwiICsgaS5wYW5lbCkuYWRkQ2xhc3MoaS5zdWJvcGVuZWQpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSBlKFwibGkuXCIgKyBpLnNlbGVjdGVkLCBkKTtcbiAgICAgICAgICAgICAgICAgICAgci5wYXJlbnRzKFwibGlcIikucmVtb3ZlQ2xhc3MoaS5zZWxlY3RlZCkuZW5kKCkuYWRkKHIucGFyZW50cyhcImxpXCIpKS5hZGRDbGFzcyhpLm9wZW5lZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHUgPSBkLmZpbHRlcihcIi5cIiArIGkub3BlbmVkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdS5sZW5ndGggfHwgKHUgPSBsLmZpcnN0KCkpLCB1LmFkZENsYXNzKGkub3BlbmVkKS5sYXN0KCkuYWRkQ2xhc3MoaS5jdXJyZW50KSwgdGhpcy5vcHRzLnNsaWRpbmdTdWJtZW51cyAmJiBsLm5vdCh1Lmxhc3QoKSkuYWRkQ2xhc3MoaS5oaWRkZW4pLmVuZCgpLmFwcGVuZFRvKHRoaXMuJG1lbnUpLCBsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2luaXRBbmNob3JzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgZC4kYm9keS5vbihvLmNsaWNrLCBcImFcIiwgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGUodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBsID0gITEsXG4gICAgICAgICAgICAgICAgICAgICAgICByID0gbi4kbWVudS5maW5kKGEpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgdSBpbiBlW3RdLmFkZG9ucylcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlW3RdLmFkZG9uc1t1XS5fY2xpY2tBbmNob3IgJiYgKGwgPSBlW3RdLmFkZG9uc1t1XS5fY2xpY2tBbmNob3IuY2FsbChuLCBhLCByKSkpIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWwgJiYgcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBhLmF0dHIoXCJocmVmXCIpIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXCIjXCIgPT0gYy5zbGljZSgwLCAxKSkgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlKGMsIG4uJG1lbnUpLmlzKFwiLlwiICsgaS5wYW5lbCkgJiYgKGwgPSAhMCwgZShjKS50cmlnZ2VyKG4ub3B0cy5zbGlkaW5nU3VibWVudXMgPyBvLm9wZW4gOiBvLnRvZ2dsZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChwKSB7fVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChsICYmIHMucHJldmVudERlZmF1bHQoKSwgIWwgJiYgciAmJiBhLmlzKFwiLlwiICsgaS5saXN0ICsgXCIgPiBsaSA+IGFcIikgJiYgIWEuaXMoJ1tyZWw9XCJleHRlcm5hbFwiXScpICYmICFhLmlzKCdbdGFyZ2V0PVwiX2JsYW5rXCJdJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG4uX192YWx1ZU9yRm4obi5vcHRzLm9uQ2xpY2suc2V0U2VsZWN0ZWQsIGEpICYmIGEucGFyZW50KCkudHJpZ2dlcihvLnNldFNlbGVjdGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoID0gbi5fX3ZhbHVlT3JGbihuLm9wdHMub25DbGljay5wcmV2ZW50RGVmYXVsdCwgYSwgXCIjXCIgPT0gYy5zbGljZSgwLCAxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoICYmIHMucHJldmVudERlZmF1bHQoKSwgbi5fX3ZhbHVlT3JGbihuLm9wdHMub25DbGljay5ibG9ja1VJLCBhLCAhaCkgJiYgZC4kaHRtbC5hZGRDbGFzcyhpLmJsb2NraW5nKSwgbi5fX3ZhbHVlT3JGbihuLm9wdHMub25DbGljay5jbG9zZSwgYSwgaCkgJiYgbi4kbWVudS50cmlnZ2VyKG8uY2xvc2UpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9pbml0RXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy4kbWVudS5vbihvLnRvZ2dsZSArIFwiIFwiICsgby5vcGVuICsgXCIgXCIgKyBvLmNsb3NlLCBcIi5cIiArIGkucGFuZWwsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgIH0pLCB0aGlzLm9wdHMuc2xpZGluZ1N1Ym1lbnVzID8gdGhpcy4kbWVudS5vbihvLm9wZW4sIFwiLlwiICsgaS5wYW5lbCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuLl9vcGVuU3VibWVudUhvcml6b250YWwoZSh0aGlzKSlcbiAgICAgICAgICAgICAgICB9KSA6IHRoaXMuJG1lbnUub24oby50b2dnbGUsIFwiLlwiICsgaS5wYW5lbCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuID0gZSh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgbi50cmlnZ2VyKG4ucGFyZW50KCkuaGFzQ2xhc3MoaS5vcGVuZWQpID8gby5jbG9zZSA6IG8ub3BlbilcbiAgICAgICAgICAgICAgICB9KS5vbihvLm9wZW4sIFwiLlwiICsgaS5wYW5lbCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGUodGhpcykucGFyZW50KCkuYWRkQ2xhc3MoaS5vcGVuZWQpXG4gICAgICAgICAgICAgICAgfSkub24oby5jbG9zZSwgXCIuXCIgKyBpLnBhbmVsLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZSh0aGlzKS5wYXJlbnQoKS5yZW1vdmVDbGFzcyhpLm9wZW5lZClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9vcGVuU3VibWVudUhvcml6b250YWw6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgICBpZiAobi5oYXNDbGFzcyhpLmN1cnJlbnQpKSByZXR1cm4gITE7XG4gICAgICAgICAgICAgICAgdmFyIHQgPSBlKFwiLlwiICsgaS5wYW5lbCwgdGhpcy4kbWVudSksXG4gICAgICAgICAgICAgICAgICAgIHMgPSB0LmZpbHRlcihcIi5cIiArIGkuY3VycmVudCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQucmVtb3ZlQ2xhc3MoaS5oaWdoZXN0KS5yZW1vdmVDbGFzcyhpLmN1cnJlbnQpLm5vdChuKS5ub3QocykuYWRkQ2xhc3MoaS5oaWRkZW4pLCBuLmhhc0NsYXNzKGkub3BlbmVkKSA/IHMuYWRkQ2xhc3MoaS5oaWdoZXN0KS5yZW1vdmVDbGFzcyhpLm9wZW5lZCkucmVtb3ZlQ2xhc3MoaS5zdWJvcGVuZWQpIDogKG4uYWRkQ2xhc3MoaS5oaWdoZXN0KSwgcy5hZGRDbGFzcyhpLnN1Ym9wZW5lZCkpLCBuLnJlbW92ZUNsYXNzKGkuaGlkZGVuKS5hZGRDbGFzcyhpLmN1cnJlbnQpLCBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBuLnJlbW92ZUNsYXNzKGkuc3Vib3BlbmVkKS5hZGRDbGFzcyhpLm9wZW5lZClcbiAgICAgICAgICAgICAgICB9LCB0aGlzLmNvbmYub3BlbmluZ0ludGVydmFsKSwgXCJvcGVuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfdXBkYXRlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudXBkYXRlcyB8fCAodGhpcy51cGRhdGVzID0gW10pLCBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIGUpIHRoaXMudXBkYXRlcy5wdXNoKGUpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIHQgPSB0aGlzLnVwZGF0ZXMubGVuZ3RoOyB0ID4gbjsgbisrKSB0aGlzLnVwZGF0ZXNbbl0uY2FsbCh0aGlzLCBlKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9fdmFsdWVPckZuOiBmdW5jdGlvbihlLCBuLCB0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgZSA/IGUuY2FsbChuWzBdKSA6IFwidW5kZWZpbmVkXCIgPT0gdHlwZW9mIGUgJiYgXCJ1bmRlZmluZWRcIiAhPSB0eXBlb2YgdCA/IHQgOiBlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX19yZWZhY3RvckNsYXNzOiBmdW5jdGlvbihlLCBuLCB0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGUuZmlsdGVyKFwiLlwiICsgbikucmVtb3ZlQ2xhc3MobikuYWRkQ2xhc3MoaVt0XSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfX2ZpbmRBZGRCYWNrOiBmdW5jdGlvbihlLCBuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGUuZmluZChuKS5hZGQoZS5maWx0ZXIobikpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX190cmFuc2l0aW9uZW5kOiBmdW5jdGlvbihlLCBuLCB0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSAhMSxcbiAgICAgICAgICAgICAgICAgICAgaSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcyB8fCBuLmNhbGwoZVswXSksIHMgPSAhMFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGUub25lKG8udHJhbnNpdGlvbmVuZCwgaSksIGUub25lKG8ud2Via2l0VHJhbnNpdGlvbkVuZCwgaSksIHNldFRpbWVvdXQoaSwgMS4xICogdClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfX2dldFVuaXF1ZUlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaS5tbShlW3RdLnVuaXF1ZUlkKyspXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGUuZm5bdF0gPSBmdW5jdGlvbihzLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gbCB8fCBuKCksIHMgPSBlLmV4dGVuZCghMCwge30sIGVbdF0uZGVmYXVsdHMsIHMpLCBpID0gZS5leHRlbmQoITAsIHt9LCBlW3RdLmNvbmZpZ3VyYXRpb24sIGkpLCB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG4gPSBlKHRoaXMpO1xuICAgICAgICAgICAgICAgIG4uZGF0YSh0KSB8fCBuLmRhdGEodCwgbmV3IGVbdF0obiwgcywgaSkpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9LCBlW3RdLnN1cHBvcnQgPSB7XG4gICAgICAgICAgICB0b3VjaDogXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3cgfHwgbmF2aWdhdG9yLm1zTWF4VG91Y2hQb2ludHNcbiAgICAgICAgfVxuICAgIH1cbn0oalF1ZXJ5KTtcbi8qXHRcbiAqIGpRdWVyeSBtbWVudSBvZmZDYW52YXMgYWRkb25cbiAqIG1tZW51LmZyZWJzaXRlLm5sXG4gKlxuICogQ29weXJpZ2h0IChjKSBGcmVkIEhldXNzY2hlblxuICovXG4hIGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdCA9IFwibW1lbnVcIixcbiAgICAgICAgbyA9IFwib2ZmQ2FudmFzXCI7XG4gICAgZVt0XS5hZGRvbnNbb10gPSB7XG4gICAgICAgIF9pbml0OiBmdW5jdGlvbigpIHt9LFxuICAgICAgICBfc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0c1tvXSkge1xuICAgICAgICAgICAgICAgIHZhciB0ID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcyA9IHRoaXMub3B0c1tvXSxcbiAgICAgICAgICAgICAgICAgICAgcCA9IHRoaXMuY29uZltvXTtcbiAgICAgICAgICAgICAgICBcInN0cmluZ1wiICE9IHR5cGVvZiBwLnBhZ2VTZWxlY3RvciAmJiAocC5wYWdlU2VsZWN0b3IgPSBcIj4gXCIgKyBwLnBhZ2VOb2RldHlwZSksIGEuJGFsbE1lbnVzID0gKGEuJGFsbE1lbnVzIHx8IGUoKSkuYWRkKHRoaXMuJG1lbnUpLCB0aGlzLnZhcnMub3BlbmVkID0gITE7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBbbi5vZmZjYW52YXNdO1xuICAgICAgICAgICAgICAgIFwibGVmdFwiICE9IHMucG9zaXRpb24gJiYgci5wdXNoKG4ubW0ocy5wb3NpdGlvbikpLCBcImJhY2tcIiAhPSBzLnpwb3NpdGlvbiAmJiByLnB1c2gobi5tbShzLnpwb3NpdGlvbikpLCB0aGlzLiRtZW51LmFkZENsYXNzKHIuam9pbihcIiBcIikpLnBhcmVudCgpLnJlbW92ZUNsYXNzKG4ud3JhcHBlciksIHRoaXMuc2V0UGFnZShhLiRwYWdlKSwgdGhpc1tvICsgXCJfaW5pdEJsb2NrZXJcIl0oKSwgdGhpc1tvICsgXCJfaW5pdFdpbmRvd1wiXSgpLCB0aGlzLiRtZW51Lm9uKGkub3BlbiArIFwiIFwiICsgaS5vcGVuaW5nICsgXCIgXCIgKyBpLm9wZW5lZCArIFwiIFwiICsgaS5jbG9zZSArIFwiIFwiICsgaS5jbG9zaW5nICsgXCIgXCIgKyBpLmNsb3NlZCArIFwiIFwiICsgaS5zZXRQYWdlLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICB9KS5vbihpLm9wZW4gKyBcIiBcIiArIGkuY2xvc2UgKyBcIiBcIiArIGkuc2V0UGFnZSwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICB0W2UudHlwZV0oKVxuICAgICAgICAgICAgICAgIH0pLCB0aGlzLiRtZW51W3AubWVudUluamVjdE1ldGhvZCArIFwiVG9cIl0ocC5tZW51V3JhcHBlclNlbGVjdG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfYWRkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIG4gPSBlW3RdLl9jLCBzID0gZVt0XS5fZCwgaSA9IGVbdF0uX2UsIG4uYWRkKFwib2ZmY2FudmFzIHNsaWRlb3V0IG1vZGFsIGJhY2tncm91bmQgb3BlbmluZyBibG9ja2VyIHBhZ2VcIiksIHMuYWRkKFwic3R5bGVcIiksIGkuYWRkKFwib3BlbmluZyBvcGVuZWQgY2xvc2luZyBjbG9zZWQgc2V0UGFnZVwiKSwgYSA9IGVbdF0uZ2xibFxuICAgICAgICB9LFxuICAgICAgICBfY2xpY2tBbmNob3I6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5vcHRzW29dKSByZXR1cm4gITE7XG4gICAgICAgICAgICB2YXIgdCA9IHRoaXMuJG1lbnUuYXR0cihcImlkXCIpO1xuICAgICAgICAgICAgaWYgKHQgJiYgdC5sZW5ndGggJiYgKHRoaXMuY29uZi5jbG9uZSAmJiAodCA9IG4udW1tKHQpKSwgZS5pcygnW2hyZWY9XCIjJyArIHQgKyAnXCJdJykpKSByZXR1cm4gdGhpcy5vcGVuKCksICEwO1xuICAgICAgICAgICAgaWYgKGEuJHBhZ2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IGEuJHBhZ2UuYXR0cihcImlkXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0ICYmIHQubGVuZ3RoICYmIGUuaXMoJ1tocmVmPVwiIycgKyB0ICsgJ1wiXScpID8gKHRoaXMuY2xvc2UoKSwgITApIDogITFcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIGVbdF0uZGVmYXVsdHNbb10gPSB7XG4gICAgICAgIHBvc2l0aW9uOiBcImxlZnRcIixcbiAgICAgICAgenBvc2l0aW9uOiBcImJhY2tcIixcbiAgICAgICAgbW9kYWw6ICExLFxuICAgICAgICBtb3ZlQmFja2dyb3VuZDogITBcbiAgICB9LCBlW3RdLmNvbmZpZ3VyYXRpb25bb10gPSB7XG4gICAgICAgIHBhZ2VOb2RldHlwZTogXCJkaXZcIixcbiAgICAgICAgcGFnZVNlbGVjdG9yOiBudWxsLFxuICAgICAgICBtZW51V3JhcHBlclNlbGVjdG9yOiBcImJvZHlcIixcbiAgICAgICAgbWVudUluamVjdE1ldGhvZDogXCJwcmVwZW5kXCJcbiAgICB9LCBlW3RdLnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnZhcnMub3BlbmVkKSByZXR1cm4gITE7XG4gICAgICAgIHZhciBlID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRoaXMuX29wZW5TZXR1cCgpLCBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZS5fb3BlbkZpbmlzaCgpXG4gICAgICAgIH0sIHRoaXMuY29uZi5vcGVuaW5nSW50ZXJ2YWwpLCBcIm9wZW5cIlxuICAgIH0sIGVbdF0ucHJvdG90eXBlLl9vcGVuU2V0dXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGUgPSB0aGlzO1xuICAgICAgICBhLiRhbGxNZW51cy5ub3QodGhpcy4kbWVudSkudHJpZ2dlcihpLmNsb3NlKSwgYS4kcGFnZS5kYXRhKHMuc3R5bGUsIGEuJHBhZ2UuYXR0cihcInN0eWxlXCIpIHx8IFwiXCIpLCBhLiR3bmR3LnRyaWdnZXIoaS5yZXNpemUsIFshMF0pO1xuICAgICAgICB2YXIgdCA9IFtuLm9wZW5lZF07XG4gICAgICAgIHRoaXMub3B0c1tvXS5tb2RhbCAmJiB0LnB1c2gobi5tb2RhbCksIHRoaXMub3B0c1tvXS5tb3ZlQmFja2dyb3VuZCAmJiB0LnB1c2gobi5iYWNrZ3JvdW5kKSwgXCJsZWZ0XCIgIT0gdGhpcy5vcHRzW29dLnBvc2l0aW9uICYmIHQucHVzaChuLm1tKHRoaXMub3B0c1tvXS5wb3NpdGlvbikpLCBcImJhY2tcIiAhPSB0aGlzLm9wdHNbb10uenBvc2l0aW9uICYmIHQucHVzaChuLm1tKHRoaXMub3B0c1tvXS56cG9zaXRpb24pKSwgdGhpcy5vcHRzLmNsYXNzZXMgJiYgdC5wdXNoKHRoaXMub3B0cy5jbGFzc2VzKSwgYS4kaHRtbC5hZGRDbGFzcyh0LmpvaW4oXCIgXCIpKSwgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGUudmFycy5vcGVuZWQgPSAhMFxuICAgICAgICB9LCB0aGlzLmNvbmYub3BlbmluZ0ludGVydmFsKSwgdGhpcy4kbWVudS5hZGRDbGFzcyhuLmN1cnJlbnQgKyBcIiBcIiArIG4ub3BlbmVkKVxuICAgIH0sIGVbdF0ucHJvdG90eXBlLl9vcGVuRmluaXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlID0gdGhpcztcbiAgICAgICAgdGhpcy5fX3RyYW5zaXRpb25lbmQoYS4kcGFnZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBlLiRtZW51LnRyaWdnZXIoaS5vcGVuZWQpXG4gICAgICAgIH0sIHRoaXMuY29uZi50cmFuc2l0aW9uRHVyYXRpb24pLCBhLiRodG1sLmFkZENsYXNzKG4ub3BlbmluZyksIHRoaXMuJG1lbnUudHJpZ2dlcihpLm9wZW5pbmcpXG4gICAgfSwgZVt0XS5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZhcnMub3BlbmVkKSByZXR1cm4gITE7XG4gICAgICAgIHZhciBlID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRoaXMuX190cmFuc2l0aW9uZW5kKGEuJHBhZ2UsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZS4kbWVudS5yZW1vdmVDbGFzcyhuLmN1cnJlbnQpLnJlbW92ZUNsYXNzKG4ub3BlbmVkKSwgYS4kaHRtbC5yZW1vdmVDbGFzcyhuLm9wZW5lZCkucmVtb3ZlQ2xhc3Mobi5tb2RhbCkucmVtb3ZlQ2xhc3Mobi5iYWNrZ3JvdW5kKS5yZW1vdmVDbGFzcyhuLm1tKGUub3B0c1tvXS5wb3NpdGlvbikpLnJlbW92ZUNsYXNzKG4ubW0oZS5vcHRzW29dLnpwb3NpdGlvbikpLCBlLm9wdHMuY2xhc3NlcyAmJiBhLiRodG1sLnJlbW92ZUNsYXNzKGUub3B0cy5jbGFzc2VzKSwgYS4kcGFnZS5hdHRyKFwic3R5bGVcIiwgYS4kcGFnZS5kYXRhKHMuc3R5bGUpKSwgZS52YXJzLm9wZW5lZCA9ICExLCBlLiRtZW51LnRyaWdnZXIoaS5jbG9zZWQpXG4gICAgICAgIH0sIHRoaXMuY29uZi50cmFuc2l0aW9uRHVyYXRpb24pLCBhLiRodG1sLnJlbW92ZUNsYXNzKG4ub3BlbmluZyksIHRoaXMuJG1lbnUudHJpZ2dlcihpLmNsb3NpbmcpLCBcImNsb3NlXCJcbiAgICB9LCBlW3RdLnByb3RvdHlwZS5zZXRQYWdlID0gZnVuY3Rpb24odCkge1xuICAgICAgICB0IHx8ICh0ID0gZSh0aGlzLmNvbmZbb10ucGFnZVNlbGVjdG9yLCBhLiRib2R5KSwgdC5sZW5ndGggPiAxICYmICh0ID0gdC53cmFwQWxsKFwiPFwiICsgdGhpcy5jb25mW29dLnBhZ2VOb2RldHlwZSArIFwiIC8+XCIpLnBhcmVudCgpKSksIHQuYWRkQ2xhc3Mobi5wYWdlICsgXCIgXCIgKyBuLnNsaWRlb3V0KSwgYS4kcGFnZSA9IHRcbiAgICB9LCBlW3RdLnByb3RvdHlwZVtvICsgXCJfaW5pdFdpbmRvd1wiXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBhLiR3bmR3Lm9uKGkua2V5ZG93biwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGEuJGh0bWwuaGFzQ2xhc3Mobi5vcGVuZWQpICYmIDkgPT0gZS5rZXlDb2RlID8gKGUucHJldmVudERlZmF1bHQoKSwgITEpIDogdm9pZCAwXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgcyA9IDA7XG4gICAgICAgIGEuJHduZHcub24oaS5yZXNpemUsIGZ1bmN0aW9uKGUsIHQpIHtcbiAgICAgICAgICAgIGlmICh0IHx8IGEuJGh0bWwuaGFzQ2xhc3Mobi5vcGVuZWQpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG8gPSBhLiR3bmR3LmhlaWdodCgpO1xuICAgICAgICAgICAgICAgICh0IHx8IG8gIT0gcykgJiYgKHMgPSBvLCBhLiRwYWdlLmNzcyhcIm1pbkhlaWdodFwiLCBvKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIGVbdF0ucHJvdG90eXBlW28gKyBcIl9pbml0V2luZG93XCJdID0gZnVuY3Rpb24oKSB7fVxuICAgIH0sIGVbdF0ucHJvdG90eXBlW28gKyBcIl9pbml0QmxvY2tlclwiXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcyA9IGUoJzxkaXYgaWQ9XCInICsgbi5ibG9ja2VyICsgJ1wiIGNsYXNzPVwiJyArIG4uc2xpZGVvdXQgKyAnXCIgLz4nKS5hcHBlbmRUbyhhLiRib2R5KTtcbiAgICAgICAgcy5vbihpLnRvdWNoc3RhcnQsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKSwgZS5zdG9wUHJvcGFnYXRpb24oKSwgcy50cmlnZ2VyKGkubW91c2Vkb3duKVxuICAgICAgICB9KS5vbihpLm1vdXNlZG93biwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpLCBhLiRodG1sLmhhc0NsYXNzKG4ubW9kYWwpIHx8IGEuJGFsbE1lbnVzLnRyaWdnZXIoaS5jbG9zZSlcbiAgICAgICAgfSksIGVbdF0ucHJvdG90eXBlW28gKyBcIl9pbml0QmxvY2tlclwiXSA9IGZ1bmN0aW9uKCkge31cbiAgICB9O1xuICAgIHZhciBuLCBzLCBpLCBhXG59KGpRdWVyeSk7XG4vKlx0XG4gKiBqUXVlcnkgbW1lbnUgYnV0dG9uYmFycyBhZGRvblxuICogbW1lbnUuZnJlYnNpdGUubmxcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEZyZWQgSGV1c3NjaGVuXG4gKi9cbiEgZnVuY3Rpb24odCkge1xuICAgIHZhciBuID0gXCJtbWVudVwiLFxuICAgICAgICBhID0gXCJidXR0b25iYXJzXCI7XG4gICAgdFtuXS5hZGRvbnNbYV0gPSB7XG4gICAgICAgIF9pbml0OiBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgICB0aGlzLm9wdHNbYV0sIHRoaXMuY29uZlthXSwgdGhpcy5fX3JlZmFjdG9yQ2xhc3ModChcImRpdlwiLCBuKSwgdGhpcy5jb25mLmNsYXNzTmFtZXNbYV0uYnV0dG9uYmFyLCBcImJ1dHRvbmJhclwiKSwgdChcIi5cIiArIGkuYnV0dG9uYmFyLCBuKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBuID0gdCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgYSA9IG4uY2hpbGRyZW4oKS5ub3QoXCJpbnB1dFwiKSxcbiAgICAgICAgICAgICAgICAgICAgbyA9IG4uY2hpbGRyZW4oKS5maWx0ZXIoXCJpbnB1dFwiKTtcbiAgICAgICAgICAgICAgICBuLmFkZENsYXNzKGkuYnV0dG9uYmFyICsgXCItXCIgKyBhLmxlbmd0aCksIG8uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSB0KHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSA9IGEuZmlsdGVyKCdsYWJlbFtmb3I9XCInICsgbi5hdHRyKFwiaWRcIikgKyAnXCJdJyk7XG4gICAgICAgICAgICAgICAgICAgIGkubGVuZ3RoICYmIG4uaW5zZXJ0QmVmb3JlKGkpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIF9zZXR1cDogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgX2FkZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpID0gdFtuXS5fYywgbyA9IHRbbl0uX2QsIHIgPSB0W25dLl9lLCBpLmFkZChcImJ1dHRvbmJhclwiKSwgcyA9IHRbbl0uZ2xibFxuICAgICAgICB9XG4gICAgfSwgdFtuXS5kZWZhdWx0c1thXSA9IHt9LCB0W25dLmNvbmZpZ3VyYXRpb24uY2xhc3NOYW1lc1thXSA9IHtcbiAgICAgICAgYnV0dG9uYmFyOiBcIkJ1dHRvbmJhclwiXG4gICAgfTtcbiAgICB2YXIgaSwgbywgciwgc1xufShqUXVlcnkpO1xuLypcdFxuICogalF1ZXJ5IG1tZW51IGNvdW50ZXJzIGFkZG9uXG4gKiBtbWVudS5mcmVic2l0ZS5ubFxuICpcbiAqIENvcHlyaWdodCAoYykgRnJlZCBIZXVzc2NoZW5cbiAqL1xuISBmdW5jdGlvbih0KSB7XG4gICAgdmFyIGUgPSBcIm1tZW51XCIsXG4gICAgICAgIG4gPSBcImNvdW50ZXJzXCI7XG4gICAgdFtlXS5hZGRvbnNbbl0gPSB7XG4gICAgICAgIF9pbml0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHRoaXMsXG4gICAgICAgICAgICAgICAgZCA9IHRoaXMub3B0c1tuXTtcbiAgICAgICAgICAgIHRoaXMuY29uZltuXSwgdGhpcy5fX3JlZmFjdG9yQ2xhc3ModChcImVtXCIsIGUpLCB0aGlzLmNvbmYuY2xhc3NOYW1lc1tuXS5jb3VudGVyLCBcImNvdW50ZXJcIiksIGQuYWRkICYmIGUuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IHQodGhpcykuZGF0YShvLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgZSAmJiAoZS5maW5kKFwiPiBlbS5cIiArIGEuY291bnRlcikubGVuZ3RoIHx8IGUucHJlcGVuZCh0KCc8ZW0gY2xhc3M9XCInICsgYS5jb3VudGVyICsgJ1wiIC8+JykpKVxuICAgICAgICAgICAgfSksIGQudXBkYXRlICYmIGUuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IHQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgIG4gPSBlLmRhdGEoby5wYXJlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkID0gbi5maW5kKFwiPiBlbS5cIiArIGEuY291bnRlcik7XG4gICAgICAgICAgICAgICAgICAgIGQubGVuZ3RoICYmIChlLmlzKFwiLlwiICsgYS5saXN0KSB8fCAoZSA9IGUuZmluZChcIj4gLlwiICsgYS5saXN0KSksIGUubGVuZ3RoICYmICFlLmRhdGEoby51cGRhdGVjb3VudGVyKSAmJiAoZS5kYXRhKG8udXBkYXRlY291bnRlciwgITApLCBzLl91cGRhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IGUuY2hpbGRyZW4oKS5ub3QoXCIuXCIgKyBhLmxhYmVsKS5ub3QoXCIuXCIgKyBhLnN1YnRpdGxlKS5ub3QoXCIuXCIgKyBhLmhpZGRlbikubm90KFwiLlwiICsgYS5zZWFyY2gpLm5vdChcIi5cIiArIGEubm9yZXN1bHRzbXNnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQuaHRtbCh0Lmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgfSkpKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIF9zZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMub3B0c1tuXTtcbiAgICAgICAgICAgIFwiYm9vbGVhblwiID09IHR5cGVvZiBhICYmIChhID0ge1xuICAgICAgICAgICAgICAgIGFkZDogYSxcbiAgICAgICAgICAgICAgICB1cGRhdGU6IGFcbiAgICAgICAgICAgIH0pLCBcIm9iamVjdFwiICE9IHR5cGVvZiBhICYmIChhID0ge30pLCBhID0gdC5leHRlbmQoITAsIHt9LCB0W2VdLmRlZmF1bHRzW25dLCBhKSwgdGhpcy5vcHRzW25dID0gYVxuICAgICAgICB9LFxuICAgICAgICBfYWRkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGEgPSB0W2VdLl9jLCBvID0gdFtlXS5fZCwgcyA9IHRbZV0uX2UsIGEuYWRkKFwiY291bnRlciBzZWFyY2ggbm9yZXN1bHRzbXNnXCIpLCBvLmFkZChcInVwZGF0ZWNvdW50ZXJcIiksIGQgPSB0W2VdLmdsYmxcbiAgICAgICAgfVxuICAgIH0sIHRbZV0uZGVmYXVsdHNbbl0gPSB7XG4gICAgICAgIGFkZDogITEsXG4gICAgICAgIHVwZGF0ZTogITFcbiAgICB9LCB0W2VdLmNvbmZpZ3VyYXRpb24uY2xhc3NOYW1lc1tuXSA9IHtcbiAgICAgICAgY291bnRlcjogXCJDb3VudGVyXCJcbiAgICB9O1xuICAgIHZhciBhLCBvLCBzLCBkXG59KGpRdWVyeSk7XG4vKlx0XG4gKiBqUXVlcnkgbW1lbnUgZHJhZ09wZW4gYWRkb25cbiAqIG1tZW51LmZyZWJzaXRlLm5sXG4gKlxuICogQ29weXJpZ2h0IChjKSBGcmVkIEhldXNzY2hlblxuICovXG4hIGZ1bmN0aW9uKGUpIHtcbiAgICBmdW5jdGlvbiB0KGUsIHQsIG4pIHtcbiAgICAgICAgcmV0dXJuIHQgPiBlICYmIChlID0gdCksIGUgPiBuICYmIChlID0gbiksIGVcbiAgICB9XG4gICAgdmFyIG4gPSBcIm1tZW51XCIsXG4gICAgICAgIG8gPSBcImRyYWdPcGVuXCI7XG4gICAgZVtuXS5hZGRvbnNbb10gPSB7XG4gICAgICAgIF9pbml0OiBmdW5jdGlvbigpIHt9LFxuICAgICAgICBfc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5vZmZDYW52YXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHAgPSB0aGlzLm9wdHNbb10sXG4gICAgICAgICAgICAgICAgICAgIGQgPSB0aGlzLmNvbmZbb107XG4gICAgICAgICAgICAgICAgaWYgKFwiYm9vbGVhblwiID09IHR5cGVvZiBwICYmIChwID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbjogcFxuICAgICAgICAgICAgICAgICAgICB9KSwgXCJvYmplY3RcIiAhPSB0eXBlb2YgcCAmJiAocCA9IHt9KSwgcCA9IGUuZXh0ZW5kKCEwLCB7fSwgZVtuXS5kZWZhdWx0c1tvXSwgcCksIHAub3Blbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoSGFtbWVyLlZFUlNJT04gPCAyKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHZhciBmLCBjLCBoLCBtLCB1ID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBnID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGwgPSAhMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSAhMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIF8gPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodGhpcy5vcHRzLm9mZkNhbnZhcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImxlZnRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyaWdodFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHUuZXZlbnRzID0gXCJwYW5sZWZ0IHBhbnJpZ2h0XCIsIHUudHlwZUxvd2VyID0gXCJ4XCIsIHUudHlwZVVwcGVyID0gXCJYXCIsIHYgPSBcIndpZHRoXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwidG9wXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYm90dG9tXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdS5ldmVudHMgPSBcInBhbnVwIHBhbmRvd25cIiwgdS50eXBlTG93ZXIgPSBcInlcIiwgdS50eXBlVXBwZXIgPSBcIllcIiwgdiA9IFwiaGVpZ2h0XCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRoaXMub3B0cy5vZmZDYW52YXMucG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwidG9wXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdS5uZWdhdGl2ZSA9ICExO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJpZ2h0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYm90dG9tXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdS5uZWdhdGl2ZSA9ICEwXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0aGlzLm9wdHMub2ZmQ2FudmFzLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibGVmdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHUub3Blbl9kaXIgPSBcInJpZ2h0XCIsIHUuY2xvc2VfZGlyID0gXCJsZWZ0XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmlnaHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1Lm9wZW5fZGlyID0gXCJsZWZ0XCIsIHUuY2xvc2VfZGlyID0gXCJyaWdodFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRvcFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHUub3Blbl9kaXIgPSBcImRvd25cIiwgdS5jbG9zZV9kaXIgPSBcInVwXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYm90dG9tXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdS5vcGVuX2RpciA9IFwidXBcIiwgdS5jbG9zZV9kaXIgPSBcImRvd25cIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBiID0gdGhpcy5fX3ZhbHVlT3JGbihwLnBhZ2VOb2RlLCB0aGlzLiRtZW51LCByLiRwYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgXCJzdHJpbmdcIiA9PSB0eXBlb2YgYiAmJiAoYiA9IGUoYikpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IHIuJHBhZ2U7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodGhpcy5vcHRzLm9mZkNhbnZhcy56cG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmcm9udFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgPSB0aGlzLiRtZW51O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5leHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0geS5hZGQodGhpcy4kbWVudSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgJCA9IG5ldyBIYW1tZXIoYlswXSwgcC52ZW5kb3JzLmhhbW1lcik7XG4gICAgICAgICAgICAgICAgICAgICQub24oXCJwYW5zdGFydFwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG0gPSBlLmNlbnRlclt1LnR5cGVMb3dlcl0sIHMub3B0cy5vZmZDYW52YXMucG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmlnaHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYm90dG9tXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gPj0gci4kd25kd1t2XSgpIC0gcC5tYXhTdGFydFBvcyAmJiAoZyA9IDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtIDw9IHAubWF4U3RhcnRQb3MgJiYgKGcgPSAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IHUub3Blbl9kaXJcbiAgICAgICAgICAgICAgICAgICAgfSkub24odS5ldmVudHMgKyBcIiBwYW5lbmRcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZyA+IDAgJiYgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgIH0pLm9uKHUuZXZlbnRzLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZiA9IGVbXCJkZWx0YVwiICsgdS50eXBlVXBwZXJdLCB1Lm5lZ2F0aXZlICYmIChmID0gLWYpLCBmICE9IF8gJiYgKGwgPSBmID49IF8gPyB1Lm9wZW5fZGlyIDogdS5jbG9zZV9kaXIpLCBfID0gZiwgXyA+IHAudGhyZXNob2xkICYmIDEgPT0gZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyLiRodG1sLmhhc0NsYXNzKGEub3BlbmVkKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGcgPSAyLCBzLl9vcGVuU2V0dXAoKSwgcy4kbWVudS50cmlnZ2VyKGkub3BlbmluZyksIHIuJGh0bWwuYWRkQ2xhc3MoYS5kcmFnZ2luZyksIHcgPSB0KHIuJHduZHdbdl0oKSAqIGRbdl0ucGVyYywgZFt2XS5taW4sIGRbdl0ubWF4KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgMiA9PSBnICYmIChjID0gdChfLCAxMCwgdykgLSAoXCJmcm9udFwiID09IHMub3B0cy5vZmZDYW52YXMuenBvc2l0aW9uID8gdyA6IDApLCB1Lm5lZ2F0aXZlICYmIChjID0gLWMpLCBoID0gXCJ0cmFuc2xhdGVcIiArIHUudHlwZVVwcGVyICsgXCIoXCIgKyBjICsgXCJweCApXCIsIHkuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIi13ZWJraXQtdHJhbnNmb3JtXCI6IFwiLXdlYmtpdC1cIiArIGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBoXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgfSkub24oXCJwYW5lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAyID09IGcgJiYgKHIuJGh0bWwucmVtb3ZlQ2xhc3MoYS5kcmFnZ2luZyksIHkuY3NzKFwidHJhbnNmb3JtXCIsIFwiXCIpLCBzW2wgPT0gdS5vcGVuX2RpciA/IFwiX29wZW5GaW5pc2hcIiA6IFwiY2xvc2VcIl0oKSksIGcgPSAwXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfYWRkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBcImZ1bmN0aW9uXCIgIT0gdHlwZW9mIEhhbW1lciA/IChlW25dLmFkZG9uc1tvXS5faW5pdCA9IGZ1bmN0aW9uKCkge30sIGVbbl0uYWRkb25zW29dLl9zZXR1cCA9IGZ1bmN0aW9uKCkge30sIHZvaWQgMCkgOiAoYSA9IGVbbl0uX2MsIHMgPSBlW25dLl9kLCBpID0gZVtuXS5fZSwgYS5hZGQoXCJkcmFnZ2luZ1wiKSwgciA9IGVbbl0uZ2xibCwgdm9pZCAwKVxuICAgICAgICB9XG4gICAgfSwgZVtuXS5kZWZhdWx0c1tvXSA9IHtcbiAgICAgICAgb3BlbjogITEsXG4gICAgICAgIG1heFN0YXJ0UG9zOiAxMDAsXG4gICAgICAgIHRocmVzaG9sZDogNTAsXG4gICAgICAgIHZlbmRvcnM6IHtcbiAgICAgICAgICAgIGhhbW1lcjoge31cbiAgICAgICAgfVxuICAgIH0sIGVbbl0uY29uZmlndXJhdGlvbltvXSA9IHtcbiAgICAgICAgd2lkdGg6IHtcbiAgICAgICAgICAgIHBlcmM6IC44LFxuICAgICAgICAgICAgbWluOiAxNDAsXG4gICAgICAgICAgICBtYXg6IDQ0MFxuICAgICAgICB9LFxuICAgICAgICBoZWlnaHQ6IHtcbiAgICAgICAgICAgIHBlcmM6IC44LFxuICAgICAgICAgICAgbWluOiAxNDAsXG4gICAgICAgICAgICBtYXg6IDg4MFxuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgYSwgcywgaSwgclxufShqUXVlcnkpO1xuLypcdFxuICogalF1ZXJ5IG1tZW51IGZpeGVkRWxlbWVudHMgYWRkb25cbiAqIG1tZW51LmZyZWJzaXRlLm5sXG4gKlxuICogQ29weXJpZ2h0IChjKSBGcmVkIEhldXNzY2hlblxuICovXG4hIGZ1bmN0aW9uKG8pIHtcbiAgICB2YXIgdCA9IFwibW1lbnVcIixcbiAgICAgICAgZCA9IFwiZml4ZWRFbGVtZW50c1wiO1xuICAgIG9bdF0uYWRkb25zW2RdID0ge1xuICAgICAgICBfaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLm9mZkNhbnZhcykge1xuICAgICAgICAgICAgICAgIHZhciBvID0gdGhpcy5jb25mLmNsYXNzTmFtZXNbZF0uZml4ZWRUb3AsXG4gICAgICAgICAgICAgICAgICAgIHQgPSB0aGlzLmNvbmYuY2xhc3NOYW1lc1tkXS5maXhlZEJvdHRvbSxcbiAgICAgICAgICAgICAgICAgICAgZSA9IHRoaXMuX19yZWZhY3RvckNsYXNzKGEuJHBhZ2UuZmluZChcIi5cIiArIG8pLCBvLCBcImZpeGVkLXRvcFwiKSxcbiAgICAgICAgICAgICAgICAgICAgcyA9IHRoaXMuX19yZWZhY3RvckNsYXNzKGEuJHBhZ2UuZmluZChcIi5cIiArIHQpLCB0LCBcImZpeGVkLWJvdHRvbVwiKTtcbiAgICAgICAgICAgICAgICBlLmFkZChzKS5hcHBlbmRUbyhhLiRib2R5KS5hZGRDbGFzcyhpLnNsaWRlb3V0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfc2V0dXA6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIF9hZGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaSA9IG9bdF0uX2MsIGUgPSBvW3RdLl9kLCBzID0gb1t0XS5fZSwgaS5hZGQoXCJmaXhlZC10b3AgZml4ZWQtYm90dG9tXCIpLCBhID0gb1t0XS5nbGJsXG4gICAgICAgIH1cbiAgICB9LCBvW3RdLmRlZmF1bHRzW2RdID0ge30sIG9bdF0uY29uZmlndXJhdGlvbi5jbGFzc05hbWVzW2RdID0ge1xuICAgICAgICBmaXhlZFRvcDogXCJGaXhlZFRvcFwiLFxuICAgICAgICBmaXhlZEJvdHRvbTogXCJGaXhlZEJvdHRvbVwiXG4gICAgfTtcbiAgICB2YXIgaSwgZSwgcywgYVxufShqUXVlcnkpO1xuLypcdFxuICogalF1ZXJ5IG1tZW51IGZvb3RlciBhZGRvblxuICogbW1lbnUuZnJlYnNpdGUubmxcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEZyZWQgSGV1c3NjaGVuXG4gKi9cbiEgZnVuY3Rpb24odCkge1xuICAgIHZhciBvID0gXCJtbWVudVwiLFxuICAgICAgICBlID0gXCJmb290ZXJcIjtcbiAgICB0W29dLmFkZG9uc1tlXSA9IHtcbiAgICAgICAgX2luaXQ6IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICAgIHZhciBkID0gdGhpcyxcbiAgICAgICAgICAgICAgICBpID0gdGhpcy5vcHRzW2VdLFxuICAgICAgICAgICAgICAgIHIgPSB0KFwiZGl2LlwiICsgbi5mb290ZXIsIHRoaXMuJG1lbnUpO1xuICAgICAgICAgICAgci5sZW5ndGggJiYgKGkudXBkYXRlICYmIGEuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbyA9IHQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgIGEgPSB0KFwiLlwiICsgZC5jb25mLmNsYXNzTmFtZXNbZV0ucGFuZWxGb290ZXIsIG8pLFxuICAgICAgICAgICAgICAgICAgICB1ID0gYS5odG1sKCk7XG4gICAgICAgICAgICAgICAgdSB8fCAodSA9IGkudGl0bGUpO1xuICAgICAgICAgICAgICAgIHZhciBsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJbdSA/IFwic2hvd1wiIDogXCJoaWRlXCJdKCksIHIuaHRtbCh1KVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgby5vbihzLm9wZW4sIGwpLCBvLmhhc0NsYXNzKG4uY3VycmVudCkgJiYgbCgpXG4gICAgICAgICAgICB9KSwgdFtvXS5hZGRvbnMuYnV0dG9uYmFycyAmJiB0W29dLmFkZG9ucy5idXR0b25iYXJzLl9pbml0LmNhbGwodGhpcywgcikpXG4gICAgICAgIH0sXG4gICAgICAgIF9zZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMub3B0c1tlXTtcbiAgICAgICAgICAgIGlmIChcImJvb2xlYW5cIiA9PSB0eXBlb2YgYSAmJiAoYSA9IHtcbiAgICAgICAgICAgICAgICAgICAgYWRkOiBhLFxuICAgICAgICAgICAgICAgICAgICB1cGRhdGU6IGFcbiAgICAgICAgICAgICAgICB9KSwgXCJvYmplY3RcIiAhPSB0eXBlb2YgYSAmJiAoYSA9IHt9KSwgYSA9IHQuZXh0ZW5kKCEwLCB7fSwgdFtvXS5kZWZhdWx0c1tlXSwgYSksIHRoaXMub3B0c1tlXSA9IGEsIGEuYWRkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBhLmNvbnRlbnQgPyBhLmNvbnRlbnQgOiBhLnRpdGxlO1xuICAgICAgICAgICAgICAgIHQoJzxkaXYgY2xhc3M9XCInICsgbi5mb290ZXIgKyAnXCIgLz4nKS5hcHBlbmRUbyh0aGlzLiRtZW51KS5hcHBlbmQocyksIHRoaXMuJG1lbnUuYWRkQ2xhc3Mobi5oYXNmb290ZXIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIF9hZGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbiA9IHRbb10uX2MsIGEgPSB0W29dLl9kLCBzID0gdFtvXS5fZSwgbi5hZGQoXCJmb290ZXIgaGFzZm9vdGVyXCIpLCBkID0gdFtvXS5nbGJsXG4gICAgICAgIH1cbiAgICB9LCB0W29dLmRlZmF1bHRzW2VdID0ge1xuICAgICAgICBhZGQ6ICExLFxuICAgICAgICBjb250ZW50OiAhMSxcbiAgICAgICAgdGl0bGU6IFwiXCIsXG4gICAgICAgIHVwZGF0ZTogITFcbiAgICB9LCB0W29dLmNvbmZpZ3VyYXRpb24uY2xhc3NOYW1lc1tlXSA9IHtcbiAgICAgICAgcGFuZWxGb290ZXI6IFwiRm9vdGVyXCJcbiAgICB9O1xuICAgIHZhciBuLCBhLCBzLCBkXG59KGpRdWVyeSk7XG4vKlx0XG4gKiBqUXVlcnkgbW1lbnUgaGVhZGVyIGFkZG9uXG4gKiBtbWVudS5mcmVic2l0ZS5ubFxuICpcbiAqIENvcHlyaWdodCAoYykgRnJlZCBIZXVzc2NoZW5cbiAqL1xuISBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHQgPSBcIm1tZW51XCIsXG4gICAgICAgIGEgPSBcImhlYWRlclwiO1xuICAgIGVbdF0uYWRkb25zW2FdID0ge1xuICAgICAgICBfaW5pdDogZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgdmFyIGkgPSB0aGlzLFxuICAgICAgICAgICAgICAgIG8gPSB0aGlzLm9wdHNbYV0sXG4gICAgICAgICAgICAgICAgbCA9ICh0aGlzLmNvbmZbYV0sIGUoXCIuXCIgKyBuLmhlYWRlciwgdGhpcy4kbWVudSkpO1xuICAgICAgICAgICAgaWYgKGwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKG8udXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoID0gbC5maW5kKFwiLlwiICsgbi50aXRsZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjID0gbC5maW5kKFwiLlwiICsgbi5wcmV2KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGYgPSBsLmZpbmQoXCIuXCIgKyBuLm5leHQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IGwuZmluZChcIi5cIiArIG4uY2xvc2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdSA9ICExO1xuICAgICAgICAgICAgICAgICAgICByLiRwYWdlICYmICh1ID0gXCIjXCIgKyByLiRwYWdlLmF0dHIoXCJpZFwiKSwgcC5hdHRyKFwiaHJlZlwiLCB1KSksIHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ID0gZSh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzID0gdC5maW5kKFwiLlwiICsgaS5jb25mLmNsYXNzTmFtZXNbYV0ucGFuZWxIZWFkZXIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSB0LmZpbmQoXCIuXCIgKyBpLmNvbmYuY2xhc3NOYW1lc1thXS5wYW5lbFByZXYpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgPSB0LmZpbmQoXCIuXCIgKyBpLmNvbmYuY2xhc3NOYW1lc1thXS5wYW5lbE5leHQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBzLmh0bWwoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1ID0gci5hdHRyKFwiaHJlZlwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ID0gbC5hdHRyKFwiaHJlZlwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtID0gci5odG1sKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYiA9IGwuaHRtbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcCB8fCAocCA9IHQuZmluZChcIi5cIiArIG4uc3ViY2xvc2UpLmh0bWwoKSksIHAgfHwgKHAgPSBvLnRpdGxlKSwgdSB8fCAodSA9IHQuZmluZChcIi5cIiArIG4uc3ViY2xvc2UpLmF0dHIoXCJocmVmXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaFtwID8gXCJzaG93XCIgOiBcImhpZGVcIl0oKSwgaC5odG1sKHApLCBjW3UgPyBcImF0dHJcIiA6IFwicmVtb3ZlQXR0clwiXShcImhyZWZcIiwgdSksIGNbdSB8fCBtID8gXCJzaG93XCIgOiBcImhpZGVcIl0oKSwgYy5odG1sKG0pLCBmW3YgPyBcImF0dHJcIiA6IFwicmVtb3ZlQXR0clwiXShcImhyZWZcIiwgdiksIGZbdiB8fCBiID8gXCJzaG93XCIgOiBcImhpZGVcIl0oKSwgZi5odG1sKGIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdC5vbihkLm9wZW4sIHgpLCB0Lmhhc0NsYXNzKG4uY3VycmVudCkgJiYgeCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVbdF0uYWRkb25zLmJ1dHRvbmJhcnMgJiYgZVt0XS5hZGRvbnMuYnV0dG9uYmFycy5faW5pdC5jYWxsKHRoaXMsIGwpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIF9zZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHRoaXMub3B0c1thXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZbYV0sIFwiYm9vbGVhblwiID09IHR5cGVvZiBzICYmIChzID0ge1xuICAgICAgICAgICAgICAgICAgICBhZGQ6IHMsXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZTogc1xuICAgICAgICAgICAgICAgIH0pLCBcIm9iamVjdFwiICE9IHR5cGVvZiBzICYmIChzID0ge30pLCBcInVuZGVmaW5lZFwiID09IHR5cGVvZiBzLmNvbnRlbnQgJiYgKHMuY29udGVudCA9IFtcInByZXZcIiwgXCJ0aXRsZVwiLCBcIm5leHRcIl0pLCBzID0gZS5leHRlbmQoITAsIHt9LCBlW3RdLmRlZmF1bHRzW2FdLCBzKSwgdGhpcy5vcHRzW2FdID0gcywgcy5hZGQpIHtcbiAgICAgICAgICAgICAgICBpZiAocy5jb250ZW50IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZCA9IGUoXCI8ZGl2IC8+XCIpLCByID0gMCwgaSA9IHMuY29udGVudC5sZW5ndGg7IGkgPiByOyByKyspIHN3aXRjaCAocy5jb250ZW50W3JdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicHJldlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5leHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjbG9zZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuYXBwZW5kKCc8YSBjbGFzcz1cIicgKyBuW3MuY29udGVudFtyXV0gKyAnXCIgaHJlZj1cIiNcIj48L2E+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwidGl0bGVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLmFwcGVuZCgnPHNwYW4gY2xhc3M9XCInICsgbi50aXRsZSArICdcIj48L3NwYW4+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuYXBwZW5kKHMuY29udGVudFtyXSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkID0gZC5odG1sKClcbiAgICAgICAgICAgICAgICB9IGVsc2UgdmFyIGQgPSBzLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgZSgnPGRpdiBjbGFzcz1cIicgKyBuLmhlYWRlciArICdcIiAvPicpLnByZXBlbmRUbyh0aGlzLiRtZW51KS5hcHBlbmQoZCksIHRoaXMuJG1lbnUuYWRkQ2xhc3Mobi5oYXNoZWFkZXIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIF9hZGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbiA9IGVbdF0uX2MsIHMgPSBlW3RdLl9kLCBkID0gZVt0XS5fZSwgbi5hZGQoXCJoZWFkZXIgaGFzaGVhZGVyIHByZXYgbmV4dCBjbG9zZSB0aXRsZVwiKSwgciA9IGVbdF0uZ2xibFxuICAgICAgICB9XG4gICAgfSwgZVt0XS5kZWZhdWx0c1thXSA9IHtcbiAgICAgICAgYWRkOiAhMSxcbiAgICAgICAgdGl0bGU6IFwiTWVudVwiLFxuICAgICAgICB1cGRhdGU6ICExXG4gICAgfSwgZVt0XS5jb25maWd1cmF0aW9uLmNsYXNzTmFtZXNbYV0gPSB7XG4gICAgICAgIHBhbmVsSGVhZGVyOiBcIkhlYWRlclwiLFxuICAgICAgICBwYW5lbE5leHQ6IFwiTmV4dFwiLFxuICAgICAgICBwYW5lbFByZXY6IFwiUHJldlwiXG4gICAgfTtcbiAgICB2YXIgbiwgcywgZCwgclxufShqUXVlcnkpO1xuLypcdFxuICogalF1ZXJ5IG1tZW51IGxhYmVscyBhZGRvblxuICogbW1lbnUuZnJlYnNpdGUubmxcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEZyZWQgSGV1c3NjaGVuXG4gKi9cbiEgZnVuY3Rpb24obCkge1xuICAgIHZhciBlID0gXCJtbWVudVwiLFxuICAgICAgICBzID0gXCJsYWJlbHNcIjtcbiAgICBsW2VdLmFkZG9uc1tzXSA9IHtcbiAgICAgICAgX2luaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5vcHRzW3NdO1xuICAgICAgICAgICAgdGhpcy5fX3JlZmFjdG9yQ2xhc3MobChcImxpXCIsIHRoaXMuJG1lbnUpLCB0aGlzLmNvbmYuY2xhc3NOYW1lc1tzXS5jb2xsYXBzZWQsIFwiY29sbGFwc2VkXCIpLCBuLmNvbGxhcHNlICYmIGwoXCIuXCIgKyBhLmxhYmVsLCBlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBlID0gbCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgcyA9IGUubmV4dFVudGlsKFwiLlwiICsgYS5sYWJlbCwgXCIuXCIgKyBhLmNvbGxhcHNlZCk7XG4gICAgICAgICAgICAgICAgcy5sZW5ndGggJiYgKGUuY2hpbGRyZW4oXCIuXCIgKyBhLnN1Ym9wZW4pLmxlbmd0aCB8fCAoZS53cmFwSW5uZXIoXCI8c3BhbiAvPlwiKSwgZS5wcmVwZW5kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwiJyArIGEuc3Vib3BlbiArIFwiIFwiICsgYS5mdWxsc3Vib3BlbiArICdcIiAvPicpKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIF9zZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMub3B0c1tzXTtcbiAgICAgICAgICAgIFwiYm9vbGVhblwiID09IHR5cGVvZiBhICYmIChhID0ge1xuICAgICAgICAgICAgICAgIGNvbGxhcHNlOiBhXG4gICAgICAgICAgICB9KSwgXCJvYmplY3RcIiAhPSB0eXBlb2YgYSAmJiAoYSA9IHt9KSwgYSA9IGwuZXh0ZW5kKCEwLCB7fSwgbFtlXS5kZWZhdWx0c1tzXSwgYSksIHRoaXMub3B0c1tzXSA9IGFcbiAgICAgICAgfSxcbiAgICAgICAgX2FkZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhID0gbFtlXS5fYywgbiA9IGxbZV0uX2QsIG8gPSBsW2VdLl9lLCBhLmFkZChcImNvbGxhcHNlZCB1bmNvbGxhcHNlZFwiKSwgdCA9IGxbZV0uZ2xibFxuICAgICAgICB9LFxuICAgICAgICBfY2xpY2tBbmNob3I6IGZ1bmN0aW9uKGwsIGUpIHtcbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBsLnBhcmVudCgpO1xuICAgICAgICAgICAgICAgIGlmIChzLmlzKFwiLlwiICsgYS5sYWJlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSBzLm5leHRVbnRpbChcIi5cIiArIGEubGFiZWwsIFwiLlwiICsgYS5jb2xsYXBzZWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcy50b2dnbGVDbGFzcyhhLm9wZW5lZCksIG5bcy5oYXNDbGFzcyhhLm9wZW5lZCkgPyBcImFkZENsYXNzXCIgOiBcInJlbW92ZUNsYXNzXCJdKGEudW5jb2xsYXBzZWQpLCAhMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAhMVxuICAgICAgICB9XG4gICAgfSwgbFtlXS5kZWZhdWx0c1tzXSA9IHtcbiAgICAgICAgY29sbGFwc2U6ICExXG4gICAgfSwgbFtlXS5jb25maWd1cmF0aW9uLmNsYXNzTmFtZXNbc10gPSB7XG4gICAgICAgIGNvbGxhcHNlZDogXCJDb2xsYXBzZWRcIlxuICAgIH07XG4gICAgdmFyIGEsIG4sIG8sIHRcbn0oalF1ZXJ5KTtcbi8qXHRcbiAqIGpRdWVyeSBtbWVudSBzZWFyY2hmaWVsZCBhZGRvblxuICogbW1lbnUuZnJlYnNpdGUubmxcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEZyZWQgSGV1c3NjaGVuXG4gKi9cbiEgZnVuY3Rpb24oZSkge1xuICAgIGZ1bmN0aW9uIHMoZSkge1xuICAgICAgICBzd2l0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgIGNhc2UgMTY6XG4gICAgICAgICAgICBjYXNlIDE3OlxuICAgICAgICAgICAgY2FzZSAxODpcbiAgICAgICAgICAgIGNhc2UgMzc6XG4gICAgICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgY2FzZSAzOTpcbiAgICAgICAgICAgIGNhc2UgNDA6XG4gICAgICAgICAgICAgICAgcmV0dXJuICEwXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICExXG4gICAgfVxuICAgIHZhciBuID0gXCJtbWVudVwiLFxuICAgICAgICB0ID0gXCJzZWFyY2hmaWVsZFwiO1xuICAgIGVbbl0uYWRkb25zW3RdID0ge1xuICAgICAgICBfaW5pdDogZnVuY3Rpb24obikge1xuICAgICAgICAgICAgdmFyIGkgPSB0aGlzLFxuICAgICAgICAgICAgICAgIGwgPSB0aGlzLm9wdHNbdF0sXG4gICAgICAgICAgICAgICAgZCA9IHRoaXMuY29uZlt0XTtcbiAgICAgICAgICAgIGlmIChsLmFkZCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAobC5hZGRUbykge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwibWVudVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB0aGlzLiRtZW51O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJwYW5lbHNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjID0gbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBlKGwuYWRkVG8sIHRoaXMuJG1lbnUpLmZpbHRlcihcIi5cIiArIGEucGFuZWwpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGMubGVuZ3RoICYmIGMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSBlKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbiA9IHMuaXMoXCIuXCIgKyBhLm1lbnUpID8gZC5mb3JtID8gXCJmb3JtXCIgOiBcImRpdlwiIDogXCJsaVwiO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXMuY2hpbGRyZW4obiArIFwiLlwiICsgYS5zZWFyY2gpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMuaXMoXCIuXCIgKyBhLm1lbnUpKSB2YXIgdCA9IGkuJG1lbnUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IFwicHJlcGVuZFRvXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHZhciB0ID0gcy5jaGlsZHJlbigpLmZpcnN0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IHQuaXMoXCIuXCIgKyBhLnN1YnRpdGxlKSA/IFwiaW5zZXJ0QWZ0ZXJcIiA6IFwiaW5zZXJ0QmVmb3JlXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbyA9IGUoXCI8XCIgKyBuICsgJyBjbGFzcz1cIicgKyBhLnNlYXJjaCArICdcIiAvPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFwiZm9ybVwiID09IG4gJiYgXCJvYmplY3RcIiA9PSB0eXBlb2YgZC5mb3JtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGMgaW4gZC5mb3JtKSBvLmF0dHIoYywgZC5mb3JtW2NdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uYXBwZW5kKCc8aW5wdXQgcGxhY2Vob2xkZXI9XCInICsgbC5wbGFjZWhvbGRlciArICdcIiB0eXBlPVwidGV4dFwiIGF1dG9jb21wbGV0ZT1cIm9mZlwiIC8+JyksIG9bcl0odClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsLm5vUmVzdWx0cyAmJiAocy5pcyhcIi5cIiArIGEubWVudSkgJiYgKHMgPSBzLmNoaWxkcmVuKFwiLlwiICsgYS5wYW5lbCkuZmlyc3QoKSksIG4gPSBzLmlzKFwiLlwiICsgYS5saXN0KSA/IFwibGlcIiA6IFwiZGl2XCIsIHMuY2hpbGRyZW4obiArIFwiLlwiICsgYS5ub3Jlc3VsdHNtc2cpLmxlbmd0aCB8fCBlKFwiPFwiICsgbiArICcgY2xhc3M9XCInICsgYS5ub3Jlc3VsdHNtc2cgKyAnXCIgLz4nKS5odG1sKGwubm9SZXN1bHRzKS5hcHBlbmRUbyhzKSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuJG1lbnUuY2hpbGRyZW4oXCIuXCIgKyBhLnNlYXJjaCkubGVuZ3RoICYmIHRoaXMuJG1lbnUuYWRkQ2xhc3MoYS5oYXNzZWFyY2gpLCBsLnNlYXJjaCkge1xuICAgICAgICAgICAgICAgIHZhciBoID0gZShcIi5cIiArIGEuc2VhcmNoLCB0aGlzLiRtZW51KTtcbiAgICAgICAgICAgICAgICBoLmxlbmd0aCAmJiBoLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuID0gZSh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwibWVudVwiID09IGwuYWRkVG8pIHZhciB0ID0gZShcIi5cIiArIGEucGFuZWwsIGkuJG1lbnUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZCA9IGkuJG1lbnU7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgdmFyIHQgPSBuLmNsb3Nlc3QoXCIuXCIgKyBhLnBhbmVsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSB0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IG4uY2hpbGRyZW4oXCJpbnB1dFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGggPSBpLl9fZmluZEFkZEJhY2sodCwgXCIuXCIgKyBhLmxpc3QpLmNoaWxkcmVuKFwibGlcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICB1ID0gaC5maWx0ZXIoXCIuXCIgKyBhLmxhYmVsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGYgPSBoLm5vdChcIi5cIiArIGEuc3VidGl0bGUpLm5vdChcIi5cIiArIGEubGFiZWwpLm5vdChcIi5cIiArIGEuc2VhcmNoKS5ub3QoXCIuXCIgKyBhLm5vcmVzdWx0c21zZyksXG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gXCI+IGFcIjtcbiAgICAgICAgICAgICAgICAgICAgbC5zaG93TGlua3NPbmx5IHx8IChwICs9IFwiLCA+IHNwYW5cIiksIGMub2ZmKG8ua2V5dXAgKyBcIiBcIiArIG8uY2hhbmdlKS5vbihvLmtleXVwLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzKGUua2V5Q29kZSkgfHwgbi50cmlnZ2VyKG8uc2VhcmNoKVxuICAgICAgICAgICAgICAgICAgICB9KS5vbihvLmNoYW5nZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuLnRyaWdnZXIoby5zZWFyY2gpXG4gICAgICAgICAgICAgICAgICAgIH0pLCBuLm9mZihvLnJlc2V0ICsgXCIgXCIgKyBvLnNlYXJjaCkub24oby5yZXNldCArIFwiIFwiICsgby5zZWFyY2gsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgfSkub24oby5yZXNldCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuLnRyaWdnZXIoby5zZWFyY2gsIFtcIlwiXSlcbiAgICAgICAgICAgICAgICAgICAgfSkub24oby5zZWFyY2gsIGZ1bmN0aW9uKHMsIG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3RyaW5nXCIgPT0gdHlwZW9mIG4gPyBjLnZhbChuKSA6IG4gPSBjLnZhbCgpLCBuID0gbi50b0xvd2VyQ2FzZSgpLCB0LnNjcm9sbFRvcCgwKSwgZi5hZGQodSkuYWRkQ2xhc3MoYS5oaWRkZW4pLCBmLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSBlKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUocCwgcykudGV4dCgpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihuKSA+IC0xICYmIHMuYWRkKHMucHJldkFsbChcIi5cIiArIGEubGFiZWwpLmZpcnN0KCkpLnJlbW92ZUNsYXNzKGEuaGlkZGVuKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSksIGUodC5nZXQoKS5yZXZlcnNlKCkpLmVhY2goZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuID0gZSh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdCA9IG4uZGF0YShyLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSBuLmFkZChuLmZpbmQoXCI+IC5cIiArIGEubGlzdCkpLmZpbmQoXCI+IGxpXCIpLm5vdChcIi5cIiArIGEuc3VidGl0bGUpLm5vdChcIi5cIiArIGEuc2VhcmNoKS5ub3QoXCIuXCIgKyBhLm5vcmVzdWx0c21zZykubm90KFwiLlwiICsgYS5sYWJlbCkubm90KFwiLlwiICsgYS5oaWRkZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLmxlbmd0aCA/IHQucmVtb3ZlQ2xhc3MoYS5oaWRkZW4pLnJlbW92ZUNsYXNzKGEubm9zdWJyZXN1bHRzKS5wcmV2QWxsKFwiLlwiICsgYS5sYWJlbCkuZmlyc3QoKS5yZW1vdmVDbGFzcyhhLmhpZGRlbikgOiBcIm1lbnVcIiA9PSBsLmFkZFRvICYmIChuLmhhc0NsYXNzKGEub3BlbmVkKSAmJiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdC50cmlnZ2VyKG8ub3BlbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMS41ICogKHMgKyAxKSAqIGkuY29uZi5vcGVuaW5nSW50ZXJ2YWwpLCB0LmFkZENsYXNzKGEubm9zdWJyZXN1bHRzKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSwgZFtmLm5vdChcIi5cIiArIGEuaGlkZGVuKS5sZW5ndGggPyBcInJlbW92ZUNsYXNzXCIgOiBcImFkZENsYXNzXCJdKGEubm9yZXN1bHRzKSwgaS5fdXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHMgPSB0aGlzLm9wdHNbdF07XG4gICAgICAgICAgICB0aGlzLmNvbmZbdF0sIFwiYm9vbGVhblwiID09IHR5cGVvZiBzICYmIChzID0ge1xuICAgICAgICAgICAgICAgIGFkZDogcyxcbiAgICAgICAgICAgICAgICBzZWFyY2g6IHNcbiAgICAgICAgICAgIH0pLCBcIm9iamVjdFwiICE9IHR5cGVvZiBzICYmIChzID0ge30pLCBzID0gZS5leHRlbmQoITAsIHt9LCBlW25dLmRlZmF1bHRzW3RdLCBzKSwgXCJib29sZWFuXCIgIT0gdHlwZW9mIHMuc2hvd0xpbmtzT25seSAmJiAocy5zaG93TGlua3NPbmx5ID0gXCJtZW51XCIgPT0gcy5hZGRUbyksIHRoaXMub3B0c1t0XSA9IHNcbiAgICAgICAgfSxcbiAgICAgICAgX2FkZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhID0gZVtuXS5fYywgciA9IGVbbl0uX2QsIG8gPSBlW25dLl9lLCBhLmFkZChcInNlYXJjaCBoYXNzZWFyY2ggbm9yZXN1bHRzbXNnIG5vcmVzdWx0cyBub3N1YnJlc3VsdHNcIiksIG8uYWRkKFwic2VhcmNoIHJlc2V0IGNoYW5nZVwiKSwgaSA9IGVbbl0uZ2xibFxuICAgICAgICB9XG4gICAgfSwgZVtuXS5kZWZhdWx0c1t0XSA9IHtcbiAgICAgICAgYWRkOiAhMSxcbiAgICAgICAgYWRkVG86IFwibWVudVwiLFxuICAgICAgICBzZWFyY2g6ICExLFxuICAgICAgICBwbGFjZWhvbGRlcjogXCJTZWFyY2hcIixcbiAgICAgICAgbm9SZXN1bHRzOiBcIk5vIHJlc3VsdHMgZm91bmQuXCJcbiAgICB9LCBlW25dLmNvbmZpZ3VyYXRpb25bdF0gPSB7XG4gICAgICAgIGZvcm06ICExXG4gICAgfTtcbiAgICB2YXIgYSwgciwgbywgaVxufShqUXVlcnkpO1xuLypcdFxuICogalF1ZXJ5IG1tZW51IHRvZ2dsZXMgYWRkb25cbiAqIG1tZW51LmZyZWJzaXRlLm5sXG4gKlxuICogQ29weXJpZ2h0IChjKSBGcmVkIEhldXNzY2hlblxuICovXG4hIGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdCA9IFwibW1lbnVcIixcbiAgICAgICAgcyA9IFwidG9nZ2xlc1wiO1xuICAgIGVbdF0uYWRkb25zW3NdID0ge1xuICAgICAgICBfaW5pdDogZnVuY3Rpb24odCkge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5vcHRzW3NdLCB0aGlzLmNvbmZbc10sIHRoaXMuX19yZWZhY3RvckNsYXNzKGUoXCJpbnB1dFwiLCB0KSwgdGhpcy5jb25mLmNsYXNzTmFtZXNbc10udG9nZ2xlLCBcInRvZ2dsZVwiKSwgdGhpcy5fX3JlZmFjdG9yQ2xhc3MoZShcImlucHV0XCIsIHQpLCB0aGlzLmNvbmYuY2xhc3NOYW1lc1tzXS5jaGVjaywgXCJjaGVja1wiKSwgZShcImlucHV0LlwiICsgYy50b2dnbGUgKyBcIiwgaW5wdXQuXCIgKyBjLmNoZWNrLCB0KS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciB0ID0gZSh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgcyA9IHQuY2xvc2VzdChcImxpXCIpLFxuICAgICAgICAgICAgICAgICAgICBsID0gdC5oYXNDbGFzcyhjLnRvZ2dsZSkgPyBcInRvZ2dsZVwiIDogXCJjaGVja1wiLFxuICAgICAgICAgICAgICAgICAgICBuID0gdC5hdHRyKFwiaWRcIikgfHwgYS5fX2dldFVuaXF1ZUlkKCk7XG4gICAgICAgICAgICAgICAgcy5jaGlsZHJlbignbGFiZWxbZm9yPVwiJyArIG4gKyAnXCJdJykubGVuZ3RoIHx8ICh0LmF0dHIoXCJpZFwiLCBuKSwgcy5wcmVwZW5kKHQpLCBlKCc8bGFiZWwgZm9yPVwiJyArIG4gKyAnXCIgY2xhc3M9XCInICsgY1tsXSArICdcIj48L2xhYmVsPicpLmluc2VydEJlZm9yZShzLmNoaWxkcmVuKFwiYSwgc3BhblwiKS5sYXN0KCkpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgX3NldHVwOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICBfYWRkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGMgPSBlW3RdLl9jLCBhID0gZVt0XS5fZCwgbCA9IGVbdF0uX2UsIGMuYWRkKFwidG9nZ2xlIGNoZWNrXCIpLCBuID0gZVt0XS5nbGJsXG4gICAgICAgIH1cbiAgICB9LCBlW3RdLmRlZmF1bHRzW3NdID0ge30sIGVbdF0uY29uZmlndXJhdGlvbi5jbGFzc05hbWVzW3NdID0ge1xuICAgICAgICB0b2dnbGU6IFwiVG9nZ2xlXCIsXG4gICAgICAgIGNoZWNrOiBcIkNoZWNrXCJcbiAgICB9O1xuICAgIHZhciBjLCBhLCBsLCBuXG59KGpRdWVyeSk7IiwiXG5qUXVlcnkoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIC8vIFNlbGVjdC13cmFwcGVyIGZvciBzZWxlY3QgZWxlbWVudHNcblxuICBqUXVlcnkoXCJzZWxlY3RcIikud3JhcChcIjxkaXYgY2xhc3M9J3NlbGVjdC13cmFwcGVyJz48L2Rpdj5cIik7XG4gIGpRdWVyeShcInNlbGVjdFwiKS5hZnRlcihcIjxpIGNsYXNzPSdmYSBmYS1hbmdsZS1kb3duJz48L2k+XCIpO1xuXG4gIGpRdWVyeShcIiNhZHZhbmNlZC1zZWFyY2gtbGlzdCBzZWxlY3RcIikudW53cmFwKCk7XG4gIGpRdWVyeShcIiNyZWdpb25faWRcIikudW53cmFwKCk7XG5cbiAgLy9GbGV4c2xpZGVyXG5cbiAgalF1ZXJ5KHdpbmRvdykubG9hZChmdW5jdGlvbigpIHtcbiAgICBqUXVlcnkoJy5wcm9kdWN0LWZsZXhzbGlkZXInKS5mbGV4c2xpZGVyKHtcbiAgICAgIGFuaW1hdGlvbjogXCJzbGlkZVwiLFxuICAgICAgc2xpZGVzaG93OiBmYWxzZSxcbiAgICAgIG1heEl0ZW1zOiAyLFxuICAgICAgaXRlbVdpZHRoOiA1MFxuICAgIH0pO1xuICB9KTtcblxuICAvLyBQcm9kdWN0IHBhZ2UgLyB3aXNobGlzdCAtIHF1YW50aXR5IGluY3JlYXNlL2RlY3JlYXNlXG4gIGpRdWVyeShcIi5xdWFudGl0eVwiKS5hcHBlbmQoJzxpIGlkPVwiYWRkMVwiIGNsYXNzPVwicGx1cyBmYSBmYS1wbHVzXCIgLz4nKS5wcmVwZW5kKCc8aSBpZD1cIm1pbnVzMVwiIGNsYXNzPVwibWludXMgZmEgZmEtbWludXNcIiAvPicpO1xuICBqUXVlcnkoXCIucXVhbnRpdHkgLnBsdXNcIikuY2xpY2soZnVuY3Rpb24oKXtcbiAgICB2YXIgY3VycmVudFZhbCA9IHBhcnNlSW50KGpRdWVyeSh0aGlzKS5wYXJlbnQoKS5maW5kKFwiLnF0eVwiKS52YWwoKSk7XG4gICAgaWYgKCFjdXJyZW50VmFsIHx8IGN1cnJlbnRWYWw9PVwiXCIgfHwgY3VycmVudFZhbCA9PSBcIk5hTlwiKSBjdXJyZW50VmFsID0gMDtcbiAgICBqUXVlcnkodGhpcykucGFyZW50KCkuZmluZChcIi5xdHlcIikudmFsKGN1cnJlbnRWYWwgKyAxKTtcbiAgfSk7XG5cbiAgalF1ZXJ5KFwiLnF1YW50aXR5IC5taW51c1wiKS5jbGljayhmdW5jdGlvbigpe1xuICAgIHZhciBjdXJyZW50VmFsID0gcGFyc2VJbnQoalF1ZXJ5KHRoaXMpLnBhcmVudCgpLmZpbmQoXCIucXR5XCIpLnZhbCgpKTtcbiAgICBpZiAoY3VycmVudFZhbCA9PSBcIk5hTlwiKSBjdXJyZW50VmFsID0gMDtcbiAgICBpZiAoY3VycmVudFZhbCA+IDEpe1xuICAgICAgalF1ZXJ5KHRoaXMpLnBhcmVudCgpLmZpbmQoXCIucXR5XCIpLnZhbChjdXJyZW50VmFsIC0gMSk7XG4gICAgfVxuICB9KTtcblxuICAvL0dyaWQgLyBMaXN0IHZpZXdcbiAgalF1ZXJ5KCcudmlldy1tb2RlIHN0cm9uZy5ncmlkJykuYWZ0ZXIoJzxpIGNsYXNzPVwiZmEgZmEtdGhcIj48L2k+Jyk7XG4gIGpRdWVyeSgnLnZpZXctbW9kZSBzdHJvbmcubGlzdCcpLmFmdGVyKCc8aSBjbGFzcz1cImZhIGZhLWFsaWduLWp1c3RpZnlcIj48L2k+Jyk7XG5cbiAgalF1ZXJ5KCcudmlldy1tb2RlIGEubGlzdCcpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgaWYgKGpRdWVyeSh0aGlzKS50ZXh0KCkgPT0gJ0xpc3QnKVxuICAgICAgalF1ZXJ5KHRoaXMpLnRleHQoJycpO1xuICAgICAgalF1ZXJ5KHRoaXMpLmFwcGVuZCgnPGkgY2xhc3M9XCJmYSBmYS1hbGlnbi1qdXN0aWZ5XCI+PC9pPicpO1xuICAgIH0pO1xuXG4gIGpRdWVyeSgnLnZpZXctbW9kZSBhLmdyaWQnKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgIGlmIChqUXVlcnkodGhpcykudGV4dCgpID09ICdHcmlkJylcbiAgICAgIGpRdWVyeSh0aGlzKS50ZXh0KCcnKTtcbiAgICAgIGpRdWVyeSh0aGlzKS5hcHBlbmQoJzxpIGNsYXNzPVwiZmEgZmEtdGhcIj48L2k+Jyk7XG4gIH0pO1xuXG4gIC8vVG9wIGNhcnRcbiAgalF1ZXJ5KFwiLnRvcC0tY2FydFwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBqUXVlcnkodGhpcykudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpO1xuICB9KTtcbiAgalF1ZXJ5KGRvY3VtZW50KS5jbGljayhmdW5jdGlvbigpIHtcbiAgICBqUXVlcnkoJy50b3AtLWNhcnQnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7ICAgIFxuICB9KTtcblxuICAvL1Njcm9sbCB0byB0b3BcblxuICBqUXVlcnkoJy5mb290ZXItY29udGFpbmVyJykuYWZ0ZXIoJzxkaXYgY2xhc3M9XCJzY3JvbGxUb1RvcFwiPjwvZGl2PicpO1xuICBqUXVlcnkoJy5zY3JvbGxUb1RvcCcpLmFwcGVuZCgnPGkgY2xhc3M9XCJmYSBmYS1jaGV2cm9uLWNpcmNsZS11cCBmYS0yeFwiPjwvaT4nKTtcbiAgalF1ZXJ5KHdpbmRvdykuc2Nyb2xsKGZ1bmN0aW9uKCl7XG4gICAgaWYgKGpRdWVyeSh0aGlzKS5zY3JvbGxUb3AoKSA+IDEwMCkge1xuICAgICAgalF1ZXJ5KCcuc2Nyb2xsVG9Ub3AnKS5mYWRlSW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgalF1ZXJ5KCcuc2Nyb2xsVG9Ub3AnKS5mYWRlT3V0KCk7XG4gICAgfVxuICB9KTtcbiAgXG4gIC8vQ2xpY2sgZXZlbnQgdG8gc2Nyb2xsIHRvIHRvcFxuICBqUXVlcnkoJy5zY3JvbGxUb1RvcCcpLmNsaWNrKGZ1bmN0aW9uKCl7XG4gICAgalF1ZXJ5KCdodG1sLCBib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wIDogMH0sODAwKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xuXG5cbiAgLy8gbWVkaWEgcXVlcnkgZXZlbnQgaGFuZGxlclxuICBpZiAobWF0Y2hNZWRpYSkge1xuICAgIHZhciBtcSA9IHdpbmRvdy5tYXRjaE1lZGlhKFwiKG1pbi13aWR0aDogNjQwcHgpXCIpO1xuICAgIG1xLmFkZExpc3RlbmVyKFdpZHRoQ2hhbmdlKTtcbiAgICBXaWR0aENoYW5nZShtcSk7XG4gIH1cblxuICAvLyBtZWRpYSBxdWVyeSBjaGFuZ2VcbiAgZnVuY3Rpb24gV2lkdGhDaGFuZ2UobXEpIHtcblxuICAgIGlmIChtcS5tYXRjaGVzKSB7XG4gICAgICAvLyB3aW5kb3cgd2lkdGggaXMgYXQgbGVhc3QgNTAwcHhcbiAgICAgICAgalF1ZXJ5KCcuZ2FsbGVyeS1pbWFnZS52aXNpYmxlJykuZWxldmF0ZVpvb20oKTtcbiAgICAgICAgalF1ZXJ5KCcubW9yZS12aWV3cycpLmNsaWNrKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgalF1ZXJ5KCcuZ2FsbGVyeS1pbWFnZS52aXNpYmxlJykuZWxldmF0ZVpvb20oKTtcbiAgICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyB3aW5kb3cgd2lkdGggaXMgbGVzcyB0aGFuIDUwMHB4XG4gICAgICAgalF1ZXJ5KCcuZ2FsbGVyeS1pbWFnZS52aXNpYmxlJykuZWxldmF0ZVpvb20oe1xuICAgICAgICAgIGNvbnN0cmFpblR5cGU6XCJoZWlnaHRcIixcbiAgICAgICAgICBjb25zdHJhaW5TaXplOjI3NCwgICAgICAgXG4gICAgICAgICAgem9vbVR5cGU6IFwibGVuc1wiLFxuICAgICAgICAgIGNvbnRhaW5MZW5zWm9vbTogdHJ1ZSxcbiAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgZ2FsbGVyeUFjdGl2ZUNsYXNzOiBcImFjdGl2ZVwiLFxuICAgICAgICB6b29tV2luZG93RmFkZUluOiA1MDAsXG4gICAgICAgIHpvb21XaW5kb3dGYWRlT3V0OiA3NTBcbiAgICAgICAgICB9KTtcblxuICAgICAgICBqUXVlcnkoJy5tb3JlLXZpZXdzJykuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgICBqUXVlcnkoJy5nYWxsZXJ5LWltYWdlLnZpc2libGUnKS5lbGV2YXRlWm9vbSh7XG4gICAgICAgICAgY29uc3RyYWluVHlwZTpcImhlaWdodFwiLFxuICAgICAgICAgIGNvbnN0cmFpblNpemU6Mjc0LCAgICAgICBcbiAgICAgICAgICB6b29tVHlwZTogXCJsZW5zXCIsXG4gICAgICAgICAgY29udGFpbkxlbnNab29tOiB0cnVlLFxuICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICBnYWxsZXJ5QWN0aXZlQ2xhc3M6IFwiYWN0aXZlXCIsXG4gICAgICAgIHpvb21XaW5kb3dGYWRlSW46IDUwMCxcbiAgICAgICAgem9vbVdpbmRvd0ZhZGVPdXQ6IDc1MFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KSAgICBcbiAgICB9XG5cbiAgfVxuXG4gIC8vIEpxdWVyeSBtbWVudVxuICBqUXVlcnkoJy5oZWFkZXInKS5hcHBlbmQoJzxhIGhyZWY9XCIjbWVudVwiIGNsYXNzPVwibW1lbnUtYnRuXCI+PGkgY2xhc3M9XCJmYSBmYS1hbGlnbi1qdXN0aWZ5IGZhLTJ4XCI+PC9pPjwvYT4nKTtcblxuICBqUXVlcnkoZnVuY3Rpb24oKSB7XG4gICAgalF1ZXJ5KCduYXYjbWVudScpLm1tZW51KCk7XG4gIH0pO1xuXG59KTtcblxuXG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==