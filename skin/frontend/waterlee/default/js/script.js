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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVybml6ci5qcyIsImpxdWVyeS5mbGV4c2xpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzkzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJzY3JpcHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIE1vZGVybml6ciB2Mi44LjNcbiAqIHd3dy5tb2Rlcm5penIuY29tXG4gKlxuICogQ29weXJpZ2h0IChjKSBGYXJ1ayBBdGVzLCBQYXVsIElyaXNoLCBBbGV4IFNleHRvblxuICogQXZhaWxhYmxlIHVuZGVyIHRoZSBCU0QgYW5kIE1JVCBsaWNlbnNlczogd3d3Lm1vZGVybml6ci5jb20vbGljZW5zZS9cbiAqL1xuXG4vKlxuICogTW9kZXJuaXpyIHRlc3RzIHdoaWNoIG5hdGl2ZSBDU1MzIGFuZCBIVE1MNSBmZWF0dXJlcyBhcmUgYXZhaWxhYmxlIGluXG4gKiB0aGUgY3VycmVudCBVQSBhbmQgbWFrZXMgdGhlIHJlc3VsdHMgYXZhaWxhYmxlIHRvIHlvdSBpbiB0d28gd2F5czpcbiAqIGFzIHByb3BlcnRpZXMgb24gYSBnbG9iYWwgTW9kZXJuaXpyIG9iamVjdCwgYW5kIGFzIGNsYXNzZXMgb24gdGhlXG4gKiA8aHRtbD4gZWxlbWVudC4gVGhpcyBpbmZvcm1hdGlvbiBhbGxvd3MgeW91IHRvIHByb2dyZXNzaXZlbHkgZW5oYW5jZVxuICogeW91ciBwYWdlcyB3aXRoIGEgZ3JhbnVsYXIgbGV2ZWwgb2YgY29udHJvbCBvdmVyIHRoZSBleHBlcmllbmNlLlxuICpcbiAqIE1vZGVybml6ciBoYXMgYW4gb3B0aW9uYWwgKG5vdCBpbmNsdWRlZCkgY29uZGl0aW9uYWwgcmVzb3VyY2UgbG9hZGVyXG4gKiBjYWxsZWQgTW9kZXJuaXpyLmxvYWQoKSwgYmFzZWQgb24gWWVwbm9wZS5qcyAoeWVwbm9wZWpzLmNvbSkuXG4gKiBUbyBnZXQgYSBidWlsZCB0aGF0IGluY2x1ZGVzIE1vZGVybml6ci5sb2FkKCksIGFzIHdlbGwgYXMgY2hvb3NpbmdcbiAqIHdoaWNoIHRlc3RzIHRvIGluY2x1ZGUsIGdvIHRvIHd3dy5tb2Rlcm5penIuY29tL2Rvd25sb2FkL1xuICpcbiAqIEF1dGhvcnMgICAgICAgIEZhcnVrIEF0ZXMsIFBhdWwgSXJpc2gsIEFsZXggU2V4dG9uXG4gKiBDb250cmlidXRvcnMgICBSeWFuIFNlZGRvbiwgQmVuIEFsbWFuXG4gKi9cblxud2luZG93Lk1vZGVybml6ciA9IChmdW5jdGlvbiggd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkICkge1xuXG4gICAgdmFyIHZlcnNpb24gPSAnMi44LjMnLFxuXG4gICAgTW9kZXJuaXpyID0ge30sXG5cbiAgICAvKj4+Y3NzY2xhc3NlcyovXG4gICAgLy8gb3B0aW9uIGZvciBlbmFibGluZyB0aGUgSFRNTCBjbGFzc2VzIHRvIGJlIGFkZGVkXG4gICAgZW5hYmxlQ2xhc3NlcyA9IHRydWUsXG4gICAgLyo+PmNzc2NsYXNzZXMqL1xuXG4gICAgZG9jRWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBvdXIgXCJtb2Rlcm5penJcIiBlbGVtZW50IHRoYXQgd2UgZG8gbW9zdCBmZWF0dXJlIHRlc3RzIG9uLlxuICAgICAqL1xuICAgIG1vZCA9ICdtb2Rlcm5penInLFxuICAgIG1vZEVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG1vZCksXG4gICAgbVN0eWxlID0gbW9kRWxlbS5zdHlsZSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgaW5wdXQgZWxlbWVudCBmb3IgdmFyaW91cyBXZWIgRm9ybXMgZmVhdHVyZSB0ZXN0cy5cbiAgICAgKi9cbiAgICBpbnB1dEVsZW0gLyo+PmlucHV0ZWxlbSovID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKSAvKj4+aW5wdXRlbGVtKi8gLFxuXG4gICAgLyo+PnNtaWxlKi9cbiAgICBzbWlsZSA9ICc6KScsXG4gICAgLyo+PnNtaWxlKi9cblxuICAgIHRvU3RyaW5nID0ge30udG9TdHJpbmcsXG5cbiAgICAvLyBUT0RPIDo6IG1ha2UgdGhlIHByZWZpeGVzIG1vcmUgZ3JhbnVsYXJcbiAgICAvKj4+cHJlZml4ZXMqL1xuICAgIC8vIExpc3Qgb2YgcHJvcGVydHkgdmFsdWVzIHRvIHNldCBmb3IgY3NzIHRlc3RzLiBTZWUgdGlja2V0ICMyMVxuICAgIHByZWZpeGVzID0gJyAtd2Via2l0LSAtbW96LSAtby0gLW1zLSAnLnNwbGl0KCcgJyksXG4gICAgLyo+PnByZWZpeGVzKi9cblxuICAgIC8qPj5kb21wcmVmaXhlcyovXG4gICAgLy8gRm9sbG93aW5nIHNwZWMgaXMgdG8gZXhwb3NlIHZlbmRvci1zcGVjaWZpYyBzdHlsZSBwcm9wZXJ0aWVzIGFzOlxuICAgIC8vICAgZWxlbS5zdHlsZS5XZWJraXRCb3JkZXJSYWRpdXNcbiAgICAvLyBhbmQgdGhlIGZvbGxvd2luZyB3b3VsZCBiZSBpbmNvcnJlY3Q6XG4gICAgLy8gICBlbGVtLnN0eWxlLndlYmtpdEJvcmRlclJhZGl1c1xuXG4gICAgLy8gV2Via2l0IGdob3N0cyB0aGVpciBwcm9wZXJ0aWVzIGluIGxvd2VyY2FzZSBidXQgT3BlcmEgJiBNb3ogZG8gbm90LlxuICAgIC8vIE1pY3Jvc29mdCB1c2VzIGEgbG93ZXJjYXNlIGBtc2AgaW5zdGVhZCBvZiB0aGUgY29ycmVjdCBgTXNgIGluIElFOCtcbiAgICAvLyAgIGVyaWsuZWFlLm5ldC9hcmNoaXZlcy8yMDA4LzAzLzEwLzIxLjQ4LjEwL1xuXG4gICAgLy8gTW9yZSBoZXJlOiBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzL2lzc3VlLzIxXG4gICAgb21QcmVmaXhlcyA9ICdXZWJraXQgTW96IE8gbXMnLFxuXG4gICAgY3Nzb21QcmVmaXhlcyA9IG9tUHJlZml4ZXMuc3BsaXQoJyAnKSxcblxuICAgIGRvbVByZWZpeGVzID0gb21QcmVmaXhlcy50b0xvd2VyQ2FzZSgpLnNwbGl0KCcgJyksXG4gICAgLyo+PmRvbXByZWZpeGVzKi9cblxuICAgIC8qPj5ucyovXG4gICAgbnMgPSB7J3N2Zyc6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyd9LFxuICAgIC8qPj5ucyovXG5cbiAgICB0ZXN0cyA9IHt9LFxuICAgIGlucHV0cyA9IHt9LFxuICAgIGF0dHJzID0ge30sXG5cbiAgICBjbGFzc2VzID0gW10sXG5cbiAgICBzbGljZSA9IGNsYXNzZXMuc2xpY2UsXG5cbiAgICBmZWF0dXJlTmFtZSwgLy8gdXNlZCBpbiB0ZXN0aW5nIGxvb3BcblxuXG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuICAgIC8vIEluamVjdCBlbGVtZW50IHdpdGggc3R5bGUgZWxlbWVudCBhbmQgc29tZSBDU1MgcnVsZXNcbiAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcyA9IGZ1bmN0aW9uKCBydWxlLCBjYWxsYmFjaywgbm9kZXMsIHRlc3RuYW1lcyApIHtcblxuICAgICAgdmFyIHN0eWxlLCByZXQsIG5vZGUsIGRvY092ZXJmbG93LFxuICAgICAgICAgIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICAgIC8vIEFmdGVyIHBhZ2UgbG9hZCBpbmplY3RpbmcgYSBmYWtlIGJvZHkgZG9lc24ndCB3b3JrIHNvIGNoZWNrIGlmIGJvZHkgZXhpc3RzXG4gICAgICAgICAgYm9keSA9IGRvY3VtZW50LmJvZHksXG4gICAgICAgICAgLy8gSUU2IGFuZCA3IHdvbid0IHJldHVybiBvZmZzZXRXaWR0aCBvciBvZmZzZXRIZWlnaHQgdW5sZXNzIGl0J3MgaW4gdGhlIGJvZHkgZWxlbWVudCwgc28gd2UgZmFrZSBpdC5cbiAgICAgICAgICBmYWtlQm9keSA9IGJvZHkgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYm9keScpO1xuXG4gICAgICBpZiAoIHBhcnNlSW50KG5vZGVzLCAxMCkgKSB7XG4gICAgICAgICAgLy8gSW4gb3JkZXIgbm90IHRvIGdpdmUgZmFsc2UgcG9zaXRpdmVzIHdlIGNyZWF0ZSBhIG5vZGUgZm9yIGVhY2ggdGVzdFxuICAgICAgICAgIC8vIFRoaXMgYWxzbyBhbGxvd3MgdGhlIG1ldGhvZCB0byBzY2FsZSBmb3IgdW5zcGVjaWZpZWQgdXNlc1xuICAgICAgICAgIHdoaWxlICggbm9kZXMtLSApIHtcbiAgICAgICAgICAgICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICBub2RlLmlkID0gdGVzdG5hbWVzID8gdGVzdG5hbWVzW25vZGVzXSA6IG1vZCArIChub2RlcyArIDEpO1xuICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyA8c3R5bGU+IGVsZW1lbnRzIGluIElFNi05IGFyZSBjb25zaWRlcmVkICdOb1Njb3BlJyBlbGVtZW50cyBhbmQgdGhlcmVmb3JlIHdpbGwgYmUgcmVtb3ZlZFxuICAgICAgLy8gd2hlbiBpbmplY3RlZCB3aXRoIGlubmVySFRNTC4gVG8gZ2V0IGFyb3VuZCB0aGlzIHlvdSBuZWVkIHRvIHByZXBlbmQgdGhlICdOb1Njb3BlJyBlbGVtZW50XG4gICAgICAvLyB3aXRoIGEgJ3Njb3BlZCcgZWxlbWVudCwgaW4gb3VyIGNhc2UgdGhlIHNvZnQtaHlwaGVuIGVudGl0eSBhcyBpdCB3b24ndCBtZXNzIHdpdGggb3VyIG1lYXN1cmVtZW50cy5cbiAgICAgIC8vIG1zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMzODk3JTI4VlMuODUlMjkuYXNweFxuICAgICAgLy8gRG9jdW1lbnRzIHNlcnZlZCBhcyB4bWwgd2lsbCB0aHJvdyBpZiB1c2luZyAmc2h5OyBzbyB1c2UgeG1sIGZyaWVuZGx5IGVuY29kZWQgdmVyc2lvbi4gU2VlIGlzc3VlICMyNzdcbiAgICAgIHN0eWxlID0gWycmIzE3MzsnLCc8c3R5bGUgaWQ9XCJzJywgbW9kLCAnXCI+JywgcnVsZSwgJzwvc3R5bGU+J10uam9pbignJyk7XG4gICAgICBkaXYuaWQgPSBtb2Q7XG4gICAgICAvLyBJRTYgd2lsbCBmYWxzZSBwb3NpdGl2ZSBvbiBzb21lIHRlc3RzIGR1ZSB0byB0aGUgc3R5bGUgZWxlbWVudCBpbnNpZGUgdGhlIHRlc3QgZGl2IHNvbWVob3cgaW50ZXJmZXJpbmcgb2Zmc2V0SGVpZ2h0LCBzbyBpbnNlcnQgaXQgaW50byBib2R5IG9yIGZha2Vib2R5LlxuICAgICAgLy8gT3BlcmEgd2lsbCBhY3QgYWxsIHF1aXJreSB3aGVuIGluamVjdGluZyBlbGVtZW50cyBpbiBkb2N1bWVudEVsZW1lbnQgd2hlbiBwYWdlIGlzIHNlcnZlZCBhcyB4bWwsIG5lZWRzIGZha2Vib2R5IHRvby4gIzI3MFxuICAgICAgKGJvZHkgPyBkaXYgOiBmYWtlQm9keSkuaW5uZXJIVE1MICs9IHN0eWxlO1xuICAgICAgZmFrZUJvZHkuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgIGlmICggIWJvZHkgKSB7XG4gICAgICAgICAgLy9hdm9pZCBjcmFzaGluZyBJRTgsIGlmIGJhY2tncm91bmQgaW1hZ2UgaXMgdXNlZFxuICAgICAgICAgIGZha2VCb2R5LnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgICAgICAgICAvL1NhZmFyaSA1LjEzLzUuMS40IE9TWCBzdG9wcyBsb2FkaW5nIGlmIDo6LXdlYmtpdC1zY3JvbGxiYXIgaXMgdXNlZCBhbmQgc2Nyb2xsYmFycyBhcmUgdmlzaWJsZVxuICAgICAgICAgIGZha2VCb2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgICAgICAgZG9jT3ZlcmZsb3cgPSBkb2NFbGVtZW50LnN0eWxlLm92ZXJmbG93O1xuICAgICAgICAgIGRvY0VsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICBkb2NFbGVtZW50LmFwcGVuZENoaWxkKGZha2VCb2R5KTtcbiAgICAgIH1cblxuICAgICAgcmV0ID0gY2FsbGJhY2soZGl2LCBydWxlKTtcbiAgICAgIC8vIElmIHRoaXMgaXMgZG9uZSBhZnRlciBwYWdlIGxvYWQgd2UgZG9uJ3Qgd2FudCB0byByZW1vdmUgdGhlIGJvZHkgc28gY2hlY2sgaWYgYm9keSBleGlzdHNcbiAgICAgIGlmICggIWJvZHkgKSB7XG4gICAgICAgICAgZmFrZUJvZHkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmYWtlQm9keSk7XG4gICAgICAgICAgZG9jRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9IGRvY092ZXJmbG93O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkaXYucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkaXYpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gISFyZXQ7XG5cbiAgICB9LFxuICAgIC8qPj50ZXN0c3R5bGVzKi9cblxuICAgIC8qPj5tcSovXG4gICAgLy8gYWRhcHRlZCBmcm9tIG1hdGNoTWVkaWEgcG9seWZpbGxcbiAgICAvLyBieSBTY290dCBKZWhsIGFuZCBQYXVsIElyaXNoXG4gICAgLy8gZ2lzdC5naXRodWIuY29tLzc4Njc2OFxuICAgIHRlc3RNZWRpYVF1ZXJ5ID0gZnVuY3Rpb24oIG1xICkge1xuXG4gICAgICB2YXIgbWF0Y2hNZWRpYSA9IHdpbmRvdy5tYXRjaE1lZGlhIHx8IHdpbmRvdy5tc01hdGNoTWVkaWE7XG4gICAgICBpZiAoIG1hdGNoTWVkaWEgKSB7XG4gICAgICAgIHJldHVybiBtYXRjaE1lZGlhKG1xKSAmJiBtYXRjaE1lZGlhKG1xKS5tYXRjaGVzIHx8IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgYm9vbDtcblxuICAgICAgaW5qZWN0RWxlbWVudFdpdGhTdHlsZXMoJ0BtZWRpYSAnICsgbXEgKyAnIHsgIycgKyBtb2QgKyAnIHsgcG9zaXRpb246IGFic29sdXRlOyB9IH0nLCBmdW5jdGlvbiggbm9kZSApIHtcbiAgICAgICAgYm9vbCA9ICh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSA/XG4gICAgICAgICAgICAgICAgICBnZXRDb21wdXRlZFN0eWxlKG5vZGUsIG51bGwpIDpcbiAgICAgICAgICAgICAgICAgIG5vZGUuY3VycmVudFN0eWxlKVsncG9zaXRpb24nXSA9PSAnYWJzb2x1dGUnO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBib29sO1xuXG4gICAgIH0sXG4gICAgIC8qPj5tcSovXG5cblxuICAgIC8qPj5oYXNldmVudCovXG4gICAgLy9cbiAgICAvLyBpc0V2ZW50U3VwcG9ydGVkIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50IHN1cHBvcnRzIHRoZSBnaXZlbiBldmVudFxuICAgIC8vIGthbmdheC5naXRodWIuY29tL2lzZXZlbnRzdXBwb3J0ZWQvXG4gICAgLy9cbiAgICAvLyBUaGUgZm9sbG93aW5nIHJlc3VsdHMgYXJlIGtub3duIGluY29ycmVjdHM6XG4gICAgLy8gICBNb2Rlcm5penIuaGFzRXZlbnQoXCJ3ZWJraXRUcmFuc2l0aW9uRW5kXCIsIGVsZW0pIC8vIGZhbHNlIG5lZ2F0aXZlXG4gICAgLy8gICBNb2Rlcm5penIuaGFzRXZlbnQoXCJ0ZXh0SW5wdXRcIikgLy8gaW4gV2Via2l0LiBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzMzM1xuICAgIC8vICAgLi4uXG4gICAgaXNFdmVudFN1cHBvcnRlZCA9IChmdW5jdGlvbigpIHtcblxuICAgICAgdmFyIFRBR05BTUVTID0ge1xuICAgICAgICAnc2VsZWN0JzogJ2lucHV0JywgJ2NoYW5nZSc6ICdpbnB1dCcsXG4gICAgICAgICdzdWJtaXQnOiAnZm9ybScsICdyZXNldCc6ICdmb3JtJyxcbiAgICAgICAgJ2Vycm9yJzogJ2ltZycsICdsb2FkJzogJ2ltZycsICdhYm9ydCc6ICdpbWcnXG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBpc0V2ZW50U3VwcG9ydGVkKCBldmVudE5hbWUsIGVsZW1lbnQgKSB7XG5cbiAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChUQUdOQU1FU1tldmVudE5hbWVdIHx8ICdkaXYnKTtcbiAgICAgICAgZXZlbnROYW1lID0gJ29uJyArIGV2ZW50TmFtZTtcblxuICAgICAgICAvLyBXaGVuIHVzaW5nIGBzZXRBdHRyaWJ1dGVgLCBJRSBza2lwcyBcInVubG9hZFwiLCBXZWJLaXQgc2tpcHMgXCJ1bmxvYWRcIiBhbmQgXCJyZXNpemVcIiwgd2hlcmVhcyBgaW5gIFwiY2F0Y2hlc1wiIHRob3NlXG4gICAgICAgIHZhciBpc1N1cHBvcnRlZCA9IGV2ZW50TmFtZSBpbiBlbGVtZW50O1xuXG4gICAgICAgIGlmICggIWlzU3VwcG9ydGVkICkge1xuICAgICAgICAgIC8vIElmIGl0IGhhcyBubyBgc2V0QXR0cmlidXRlYCAoaS5lLiBkb2Vzbid0IGltcGxlbWVudCBOb2RlIGludGVyZmFjZSksIHRyeSBnZW5lcmljIGVsZW1lbnRcbiAgICAgICAgICBpZiAoICFlbGVtZW50LnNldEF0dHJpYnV0ZSApIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCBlbGVtZW50LnNldEF0dHJpYnV0ZSAmJiBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSApIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGV2ZW50TmFtZSwgJycpO1xuICAgICAgICAgICAgaXNTdXBwb3J0ZWQgPSBpcyhlbGVtZW50W2V2ZW50TmFtZV0sICdmdW5jdGlvbicpO1xuXG4gICAgICAgICAgICAvLyBJZiBwcm9wZXJ0eSB3YXMgY3JlYXRlZCwgXCJyZW1vdmUgaXRcIiAoYnkgc2V0dGluZyB2YWx1ZSB0byBgdW5kZWZpbmVkYClcbiAgICAgICAgICAgIGlmICggIWlzKGVsZW1lbnRbZXZlbnROYW1lXSwgJ3VuZGVmaW5lZCcpICkge1xuICAgICAgICAgICAgICBlbGVtZW50W2V2ZW50TmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShldmVudE5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQgPSBudWxsO1xuICAgICAgICByZXR1cm4gaXNTdXBwb3J0ZWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXNFdmVudFN1cHBvcnRlZDtcbiAgICB9KSgpLFxuICAgIC8qPj5oYXNldmVudCovXG5cbiAgICAvLyBUT0RPIDo6IEFkZCBmbGFnIGZvciBoYXNvd25wcm9wID8gZGlkbid0IGxhc3QgdGltZVxuXG4gICAgLy8gaGFzT3duUHJvcGVydHkgc2hpbSBieSBrYW5nYXggbmVlZGVkIGZvciBTYWZhcmkgMi4wIHN1cHBvcnRcbiAgICBfaGFzT3duUHJvcGVydHkgPSAoe30pLmhhc093blByb3BlcnR5LCBoYXNPd25Qcm9wO1xuXG4gICAgaWYgKCAhaXMoX2hhc093blByb3BlcnR5LCAndW5kZWZpbmVkJykgJiYgIWlzKF9oYXNPd25Qcm9wZXJ0eS5jYWxsLCAndW5kZWZpbmVkJykgKSB7XG4gICAgICBoYXNPd25Qcm9wID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICAgICAgcmV0dXJuIF9oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpO1xuICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBoYXNPd25Qcm9wID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHsgLyogeWVzLCB0aGlzIGNhbiBnaXZlIGZhbHNlIHBvc2l0aXZlcy9uZWdhdGl2ZXMsIGJ1dCBtb3N0IG9mIHRoZSB0aW1lIHdlIGRvbid0IGNhcmUgYWJvdXQgdGhvc2UgKi9cbiAgICAgICAgcmV0dXJuICgocHJvcGVydHkgaW4gb2JqZWN0KSAmJiBpcyhvYmplY3QuY29uc3RydWN0b3IucHJvdG90eXBlW3Byb3BlcnR5XSwgJ3VuZGVmaW5lZCcpKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gQWRhcHRlZCBmcm9tIEVTNS1zaGltIGh0dHBzOi8vZ2l0aHViLmNvbS9rcmlza293YWwvZXM1LXNoaW0vYmxvYi9tYXN0ZXIvZXM1LXNoaW0uanNcbiAgICAvLyBlczUuZ2l0aHViLmNvbS8jeDE1LjMuNC41XG5cbiAgICBpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gICAgICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIGJpbmQodGhhdCkge1xuXG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgICAgICBib3VuZCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkge1xuXG4gICAgICAgICAgICAgIHZhciBGID0gZnVuY3Rpb24oKXt9O1xuICAgICAgICAgICAgICBGLnByb3RvdHlwZSA9IHRhcmdldC5wcm90b3R5cGU7XG4gICAgICAgICAgICAgIHZhciBzZWxmID0gbmV3IEYoKTtcblxuICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGFyZ2V0LmFwcGx5KFxuICAgICAgICAgICAgICAgICAgc2VsZixcbiAgICAgICAgICAgICAgICAgIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5hcHBseShcbiAgICAgICAgICAgICAgICAgIHRoYXQsXG4gICAgICAgICAgICAgICAgICBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBib3VuZDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc2V0Q3NzIGFwcGxpZXMgZ2l2ZW4gc3R5bGVzIHRvIHRoZSBNb2Rlcm5penIgRE9NIG5vZGUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gc2V0Q3NzKCBzdHIgKSB7XG4gICAgICAgIG1TdHlsZS5jc3NUZXh0ID0gc3RyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNldENzc0FsbCBleHRyYXBvbGF0ZXMgYWxsIHZlbmRvci1zcGVjaWZpYyBjc3Mgc3RyaW5ncy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzZXRDc3NBbGwoIHN0cjEsIHN0cjIgKSB7XG4gICAgICAgIHJldHVybiBzZXRDc3MocHJlZml4ZXMuam9pbihzdHIxICsgJzsnKSArICggc3RyMiB8fCAnJyApKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBpcyByZXR1cm5zIGEgYm9vbGVhbiBmb3IgaWYgdHlwZW9mIG9iaiBpcyBleGFjdGx5IHR5cGUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXMoIG9iaiwgdHlwZSApIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09IHR5cGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY29udGFpbnMgcmV0dXJucyBhIGJvb2xlYW4gZm9yIGlmIHN1YnN0ciBpcyBmb3VuZCB3aXRoaW4gc3RyLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbnRhaW5zKCBzdHIsIHN1YnN0ciApIHtcbiAgICAgICAgcmV0dXJuICEhfignJyArIHN0cikuaW5kZXhPZihzdWJzdHIpO1xuICAgIH1cblxuICAgIC8qPj50ZXN0cHJvcCovXG5cbiAgICAvLyB0ZXN0UHJvcHMgaXMgYSBnZW5lcmljIENTUyAvIERPTSBwcm9wZXJ0eSB0ZXN0LlxuXG4gICAgLy8gSW4gdGVzdGluZyBzdXBwb3J0IGZvciBhIGdpdmVuIENTUyBwcm9wZXJ0eSwgaXQncyBsZWdpdCB0byB0ZXN0OlxuICAgIC8vICAgIGBlbGVtLnN0eWxlW3N0eWxlTmFtZV0gIT09IHVuZGVmaW5lZGBcbiAgICAvLyBJZiB0aGUgcHJvcGVydHkgaXMgc3VwcG9ydGVkIGl0IHdpbGwgcmV0dXJuIGFuIGVtcHR5IHN0cmluZyxcbiAgICAvLyBpZiB1bnN1cHBvcnRlZCBpdCB3aWxsIHJldHVybiB1bmRlZmluZWQuXG5cbiAgICAvLyBXZSdsbCB0YWtlIGFkdmFudGFnZSBvZiB0aGlzIHF1aWNrIHRlc3QgYW5kIHNraXAgc2V0dGluZyBhIHN0eWxlXG4gICAgLy8gb24gb3VyIG1vZGVybml6ciBlbGVtZW50LCBidXQgaW5zdGVhZCBqdXN0IHRlc3RpbmcgdW5kZWZpbmVkIHZzXG4gICAgLy8gZW1wdHkgc3RyaW5nLlxuXG4gICAgLy8gQmVjYXVzZSB0aGUgdGVzdGluZyBvZiB0aGUgQ1NTIHByb3BlcnR5IG5hbWVzICh3aXRoIFwiLVwiLCBhc1xuICAgIC8vIG9wcG9zZWQgdG8gdGhlIGNhbWVsQ2FzZSBET00gcHJvcGVydGllcykgaXMgbm9uLXBvcnRhYmxlIGFuZFxuICAgIC8vIG5vbi1zdGFuZGFyZCBidXQgd29ya3MgaW4gV2ViS2l0IGFuZCBJRSAoYnV0IG5vdCBHZWNrbyBvciBPcGVyYSksXG4gICAgLy8gd2UgZXhwbGljaXRseSByZWplY3QgcHJvcGVydGllcyB3aXRoIGRhc2hlcyBzbyB0aGF0IGF1dGhvcnNcbiAgICAvLyBkZXZlbG9waW5nIGluIFdlYktpdCBvciBJRSBmaXJzdCBkb24ndCBlbmQgdXAgd2l0aFxuICAgIC8vIGJyb3dzZXItc3BlY2lmaWMgY29udGVudCBieSBhY2NpZGVudC5cblxuICAgIGZ1bmN0aW9uIHRlc3RQcm9wcyggcHJvcHMsIHByZWZpeGVkICkge1xuICAgICAgICBmb3IgKCB2YXIgaSBpbiBwcm9wcyApIHtcbiAgICAgICAgICAgIHZhciBwcm9wID0gcHJvcHNbaV07XG4gICAgICAgICAgICBpZiAoICFjb250YWlucyhwcm9wLCBcIi1cIikgJiYgbVN0eWxlW3Byb3BdICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeGVkID09ICdwZngnID8gcHJvcCA6IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvKj4+dGVzdHByb3AqL1xuXG4gICAgLy8gVE9ETyA6OiBhZGQgdGVzdERPTVByb3BzXG4gICAgLyoqXG4gICAgICogdGVzdERPTVByb3BzIGlzIGEgZ2VuZXJpYyBET00gcHJvcGVydHkgdGVzdDsgaWYgYSBicm93c2VyIHN1cHBvcnRzXG4gICAgICogICBhIGNlcnRhaW4gcHJvcGVydHksIGl0IHdvbid0IHJldHVybiB1bmRlZmluZWQgZm9yIGl0LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRlc3RET01Qcm9wcyggcHJvcHMsIG9iaiwgZWxlbSApIHtcbiAgICAgICAgZm9yICggdmFyIGkgaW4gcHJvcHMgKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IG9ialtwcm9wc1tpXV07XG4gICAgICAgICAgICBpZiAoIGl0ZW0gIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSBwcm9wZXJ0eSBuYW1lIGFzIGEgc3RyaW5nXG4gICAgICAgICAgICAgICAgaWYgKGVsZW0gPT09IGZhbHNlKSByZXR1cm4gcHJvcHNbaV07XG5cbiAgICAgICAgICAgICAgICAvLyBsZXQncyBiaW5kIGEgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICBpZiAoaXMoaXRlbSwgJ2Z1bmN0aW9uJykpe1xuICAgICAgICAgICAgICAgICAgLy8gZGVmYXVsdCB0byBhdXRvYmluZCB1bmxlc3Mgb3ZlcnJpZGVcbiAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmJpbmQoZWxlbSB8fCBvYmopO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdW5ib3VuZCBmdW5jdGlvbiBvciBvYmogb3IgdmFsdWVcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyo+PnRlc3RhbGxwcm9wcyovXG4gICAgLyoqXG4gICAgICogdGVzdFByb3BzQWxsIHRlc3RzIGEgbGlzdCBvZiBET00gcHJvcGVydGllcyB3ZSB3YW50IHRvIGNoZWNrIGFnYWluc3QuXG4gICAgICogICBXZSBzcGVjaWZ5IGxpdGVyYWxseSBBTEwgcG9zc2libGUgKGtub3duIGFuZC9vciBsaWtlbHkpIHByb3BlcnRpZXMgb25cbiAgICAgKiAgIHRoZSBlbGVtZW50IGluY2x1ZGluZyB0aGUgbm9uLXZlbmRvciBwcmVmaXhlZCBvbmUsIGZvciBmb3J3YXJkLVxuICAgICAqICAgY29tcGF0aWJpbGl0eS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0ZXN0UHJvcHNBbGwoIHByb3AsIHByZWZpeGVkLCBlbGVtICkge1xuXG4gICAgICAgIHZhciB1Y1Byb3AgID0gcHJvcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSksXG4gICAgICAgICAgICBwcm9wcyAgID0gKHByb3AgKyAnICcgKyBjc3NvbVByZWZpeGVzLmpvaW4odWNQcm9wICsgJyAnKSArIHVjUHJvcCkuc3BsaXQoJyAnKTtcblxuICAgICAgICAvLyBkaWQgdGhleSBjYWxsIC5wcmVmaXhlZCgnYm94U2l6aW5nJykgb3IgYXJlIHdlIGp1c3QgdGVzdGluZyBhIHByb3A/XG4gICAgICAgIGlmKGlzKHByZWZpeGVkLCBcInN0cmluZ1wiKSB8fCBpcyhwcmVmaXhlZCwgXCJ1bmRlZmluZWRcIikpIHtcbiAgICAgICAgICByZXR1cm4gdGVzdFByb3BzKHByb3BzLCBwcmVmaXhlZCk7XG5cbiAgICAgICAgLy8gb3RoZXJ3aXNlLCB0aGV5IGNhbGxlZCAucHJlZml4ZWQoJ3JlcXVlc3RBbmltYXRpb25GcmFtZScsIHdpbmRvd1ssIGVsZW1dKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb3BzID0gKHByb3AgKyAnICcgKyAoZG9tUHJlZml4ZXMpLmpvaW4odWNQcm9wICsgJyAnKSArIHVjUHJvcCkuc3BsaXQoJyAnKTtcbiAgICAgICAgICByZXR1cm4gdGVzdERPTVByb3BzKHByb3BzLCBwcmVmaXhlZCwgZWxlbSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyo+PnRlc3RhbGxwcm9wcyovXG5cblxuICAgIC8qKlxuICAgICAqIFRlc3RzXG4gICAgICogLS0tLS1cbiAgICAgKi9cblxuICAgIC8vIFRoZSAqbmV3KiBmbGV4Ym94XG4gICAgLy8gZGV2LnczLm9yZy9jc3N3Zy9jc3MzLWZsZXhib3hcblxuICAgIHRlc3RzWydmbGV4Ym94J10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2ZsZXhXcmFwJyk7XG4gICAgfTtcblxuICAgIC8vIFRoZSAqb2xkKiBmbGV4Ym94XG4gICAgLy8gd3d3LnczLm9yZy9UUi8yMDA5L1dELWNzczMtZmxleGJveC0yMDA5MDcyMy9cblxuICAgIHRlc3RzWydmbGV4Ym94bGVnYWN5J10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnYm94RGlyZWN0aW9uJyk7XG4gICAgfTtcblxuICAgIC8vIE9uIHRoZSBTNjAgYW5kIEJCIFN0b3JtLCBnZXRDb250ZXh0IGV4aXN0cywgYnV0IGFsd2F5cyByZXR1cm5zIHVuZGVmaW5lZFxuICAgIC8vIHNvIHdlIGFjdHVhbGx5IGhhdmUgdG8gY2FsbCBnZXRDb250ZXh0KCkgdG8gdmVyaWZ5XG4gICAgLy8gZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy9pc3N1ZS85Ny9cblxuICAgIHRlc3RzWydjYW52YXMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICByZXR1cm4gISEoZWxlbS5nZXRDb250ZXh0ICYmIGVsZW0uZ2V0Q29udGV4dCgnMmQnKSk7XG4gICAgfTtcblxuICAgIHRlc3RzWydjYW52YXN0ZXh0J10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhKE1vZGVybml6clsnY2FudmFzJ10gJiYgaXMoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dCgnMmQnKS5maWxsVGV4dCwgJ2Z1bmN0aW9uJykpO1xuICAgIH07XG5cbiAgICAvLyB3ZWJrLml0LzcwMTE3IGlzIHRyYWNraW5nIGEgbGVnaXQgV2ViR0wgZmVhdHVyZSBkZXRlY3QgcHJvcG9zYWxcblxuICAgIC8vIFdlIGRvIGEgc29mdCBkZXRlY3Qgd2hpY2ggbWF5IGZhbHNlIHBvc2l0aXZlIGluIG9yZGVyIHRvIGF2b2lkXG4gICAgLy8gYW4gZXhwZW5zaXZlIGNvbnRleHQgY3JlYXRpb246IGJ1Z3ppbC5sYS83MzI0NDFcblxuICAgIHRlc3RzWyd3ZWJnbCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQ7XG4gICAgfTtcblxuICAgIC8qXG4gICAgICogVGhlIE1vZGVybml6ci50b3VjaCB0ZXN0IG9ubHkgaW5kaWNhdGVzIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzXG4gICAgICogICAgdG91Y2ggZXZlbnRzLCB3aGljaCBkb2VzIG5vdCBuZWNlc3NhcmlseSByZWZsZWN0IGEgdG91Y2hzY3JlZW5cbiAgICAgKiAgICBkZXZpY2UsIGFzIGV2aWRlbmNlZCBieSB0YWJsZXRzIHJ1bm5pbmcgV2luZG93cyA3IG9yLCBhbGFzLFxuICAgICAqICAgIHRoZSBQYWxtIFByZSAvIFdlYk9TICh0b3VjaCkgcGhvbmVzLlxuICAgICAqXG4gICAgICogQWRkaXRpb25hbGx5LCBDaHJvbWUgKGRlc2t0b3ApIHVzZWQgdG8gbGllIGFib3V0IGl0cyBzdXBwb3J0IG9uIHRoaXMsXG4gICAgICogICAgYnV0IHRoYXQgaGFzIHNpbmNlIGJlZW4gcmVjdGlmaWVkOiBjcmJ1Zy5jb20vMzY0MTVcbiAgICAgKlxuICAgICAqIFdlIGFsc28gdGVzdCBmb3IgRmlyZWZveCA0IE11bHRpdG91Y2ggU3VwcG9ydC5cbiAgICAgKlxuICAgICAqIEZvciBtb3JlIGluZm8sIHNlZTogbW9kZXJuaXpyLmdpdGh1Yi5jb20vTW9kZXJuaXpyL3RvdWNoLmh0bWxcbiAgICAgKi9cblxuICAgIHRlc3RzWyd0b3VjaCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBib29sO1xuXG4gICAgICAgIGlmKCgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHx8IHdpbmRvdy5Eb2N1bWVudFRvdWNoICYmIGRvY3VtZW50IGluc3RhbmNlb2YgRG9jdW1lbnRUb3VjaCkge1xuICAgICAgICAgIGJvb2wgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzKFsnQG1lZGlhICgnLHByZWZpeGVzLmpvaW4oJ3RvdWNoLWVuYWJsZWQpLCgnKSxtb2QsJyknLCd7I21vZGVybml6cnt0b3A6OXB4O3Bvc2l0aW9uOmFic29sdXRlfX0nXS5qb2luKCcnKSwgZnVuY3Rpb24oIG5vZGUgKSB7XG4gICAgICAgICAgICBib29sID0gbm9kZS5vZmZzZXRUb3AgPT09IDk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYm9vbDtcbiAgICB9O1xuXG5cbiAgICAvLyBnZW9sb2NhdGlvbiBpcyBvZnRlbiBjb25zaWRlcmVkIGEgdHJpdmlhbCBmZWF0dXJlIGRldGVjdC4uLlxuICAgIC8vIFR1cm5zIG91dCwgaXQncyBxdWl0ZSB0cmlja3kgdG8gZ2V0IHJpZ2h0OlxuICAgIC8vXG4gICAgLy8gVXNpbmcgISFuYXZpZ2F0b3IuZ2VvbG9jYXRpb24gZG9lcyB0d28gdGhpbmdzIHdlIGRvbid0IHdhbnQuIEl0OlxuICAgIC8vICAgMS4gTGVha3MgbWVtb3J5IGluIElFOTogZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy81MTNcbiAgICAvLyAgIDIuIERpc2FibGVzIHBhZ2UgY2FjaGluZyBpbiBXZWJLaXQ6IHdlYmsuaXQvNDM5NTZcbiAgICAvL1xuICAgIC8vIE1lYW53aGlsZSwgaW4gRmlyZWZveCA8IDgsIGFuIGFib3V0OmNvbmZpZyBzZXR0aW5nIGNvdWxkIGV4cG9zZVxuICAgIC8vIGEgZmFsc2UgcG9zaXRpdmUgdGhhdCB3b3VsZCB0aHJvdyBhbiBleGNlcHRpb246IGJ1Z3ppbC5sYS82ODgxNThcblxuICAgIHRlc3RzWydnZW9sb2NhdGlvbiddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnZ2VvbG9jYXRpb24nIGluIG5hdmlnYXRvcjtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1sncG9zdG1lc3NhZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICEhd2luZG93LnBvc3RNZXNzYWdlO1xuICAgIH07XG5cblxuICAgIC8vIENocm9tZSBpbmNvZ25pdG8gbW9kZSB1c2VkIHRvIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIHVzaW5nIG9wZW5EYXRhYmFzZVxuICAgIC8vIEl0IGRvZXNuJ3QgYW55bW9yZS5cbiAgICB0ZXN0c1snd2Vic3FsZGF0YWJhc2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICEhd2luZG93Lm9wZW5EYXRhYmFzZTtcbiAgICB9O1xuXG4gICAgLy8gVmVuZG9ycyBoYWQgaW5jb25zaXN0ZW50IHByZWZpeGluZyB3aXRoIHRoZSBleHBlcmltZW50YWwgSW5kZXhlZCBEQjpcbiAgICAvLyAtIFdlYmtpdCdzIGltcGxlbWVudGF0aW9uIGlzIGFjY2Vzc2libGUgdGhyb3VnaCB3ZWJraXRJbmRleGVkREJcbiAgICAvLyAtIEZpcmVmb3ggc2hpcHBlZCBtb3pfaW5kZXhlZERCIGJlZm9yZSBGRjRiOSwgYnV0IHNpbmNlIHRoZW4gaGFzIGJlZW4gbW96SW5kZXhlZERCXG4gICAgLy8gRm9yIHNwZWVkLCB3ZSBkb24ndCB0ZXN0IHRoZSBsZWdhY3kgKGFuZCBiZXRhLW9ubHkpIGluZGV4ZWREQlxuICAgIHRlc3RzWydpbmRleGVkREInXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICEhdGVzdFByb3BzQWxsKFwiaW5kZXhlZERCXCIsIHdpbmRvdyk7XG4gICAgfTtcblxuICAgIC8vIGRvY3VtZW50TW9kZSBsb2dpYyBmcm9tIFlVSSB0byBmaWx0ZXIgb3V0IElFOCBDb21wYXQgTW9kZVxuICAgIC8vICAgd2hpY2ggZmFsc2UgcG9zaXRpdmVzLlxuICAgIHRlc3RzWydoYXNoY2hhbmdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBpc0V2ZW50U3VwcG9ydGVkKCdoYXNoY2hhbmdlJywgd2luZG93KSAmJiAoZG9jdW1lbnQuZG9jdW1lbnRNb2RlID09PSB1bmRlZmluZWQgfHwgZG9jdW1lbnQuZG9jdW1lbnRNb2RlID4gNyk7XG4gICAgfTtcblxuICAgIC8vIFBlciAxLjY6XG4gICAgLy8gVGhpcyB1c2VkIHRvIGJlIE1vZGVybml6ci5oaXN0b3J5bWFuYWdlbWVudCBidXQgdGhlIGxvbmdlclxuICAgIC8vIG5hbWUgaGFzIGJlZW4gZGVwcmVjYXRlZCBpbiBmYXZvciBvZiBhIHNob3J0ZXIgYW5kIHByb3BlcnR5LW1hdGNoaW5nIG9uZS5cbiAgICAvLyBUaGUgb2xkIEFQSSBpcyBzdGlsbCBhdmFpbGFibGUgaW4gMS42LCBidXQgYXMgb2YgMi4wIHdpbGwgdGhyb3cgYSB3YXJuaW5nLFxuICAgIC8vIGFuZCBpbiB0aGUgZmlyc3QgcmVsZWFzZSB0aGVyZWFmdGVyIGRpc2FwcGVhciBlbnRpcmVseS5cbiAgICB0ZXN0c1snaGlzdG9yeSddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISEod2luZG93Lmhpc3RvcnkgJiYgaGlzdG9yeS5wdXNoU3RhdGUpO1xuICAgIH07XG5cbiAgICB0ZXN0c1snZHJhZ2FuZGRyb3AnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHJldHVybiAoJ2RyYWdnYWJsZScgaW4gZGl2KSB8fCAoJ29uZHJhZ3N0YXJ0JyBpbiBkaXYgJiYgJ29uZHJvcCcgaW4gZGl2KTtcbiAgICB9O1xuXG4gICAgLy8gRkYzLjYgd2FzIEVPTCdlZCBvbiA0LzI0LzEyLCBidXQgdGhlIEVTUiB2ZXJzaW9uIG9mIEZGMTBcbiAgICAvLyB3aWxsIGJlIHN1cHBvcnRlZCB1bnRpbCBGRjE5ICgyLzEyLzEzKSwgYXQgd2hpY2ggdGltZSwgRVNSIGJlY29tZXMgRkYxNy5cbiAgICAvLyBGRjEwIHN0aWxsIHVzZXMgcHJlZml4ZXMsIHNvIGNoZWNrIGZvciBpdCB1bnRpbCB0aGVuLlxuICAgIC8vIGZvciBtb3JlIEVTUiBpbmZvLCBzZWU6IG1vemlsbGEub3JnL2VuLVVTL2ZpcmVmb3gvb3JnYW5pemF0aW9ucy9mYXEvXG4gICAgdGVzdHNbJ3dlYnNvY2tldHMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ1dlYlNvY2tldCcgaW4gd2luZG93IHx8ICdNb3pXZWJTb2NrZXQnIGluIHdpbmRvdztcbiAgICB9O1xuXG5cbiAgICAvLyBjc3MtdHJpY2tzLmNvbS9yZ2JhLWJyb3dzZXItc3VwcG9ydC9cbiAgICB0ZXN0c1sncmdiYSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFNldCBhbiByZ2JhKCkgY29sb3IgYW5kIGNoZWNrIHRoZSByZXR1cm5lZCB2YWx1ZVxuXG4gICAgICAgIHNldENzcygnYmFja2dyb3VuZC1jb2xvcjpyZ2JhKDE1MCwyNTUsMTUwLC41KScpO1xuXG4gICAgICAgIHJldHVybiBjb250YWlucyhtU3R5bGUuYmFja2dyb3VuZENvbG9yLCAncmdiYScpO1xuICAgIH07XG5cbiAgICB0ZXN0c1snaHNsYSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFNhbWUgYXMgcmdiYSgpLCBpbiBmYWN0LCBicm93c2VycyByZS1tYXAgaHNsYSgpIHRvIHJnYmEoKSBpbnRlcm5hbGx5LFxuICAgICAgICAvLyAgIGV4Y2VwdCBJRTkgd2hvIHJldGFpbnMgaXQgYXMgaHNsYVxuXG4gICAgICAgIHNldENzcygnYmFja2dyb3VuZC1jb2xvcjpoc2xhKDEyMCw0MCUsMTAwJSwuNSknKTtcblxuICAgICAgICByZXR1cm4gY29udGFpbnMobVN0eWxlLmJhY2tncm91bmRDb2xvciwgJ3JnYmEnKSB8fCBjb250YWlucyhtU3R5bGUuYmFja2dyb3VuZENvbG9yLCAnaHNsYScpO1xuICAgIH07XG5cbiAgICB0ZXN0c1snbXVsdGlwbGViZ3MnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTZXR0aW5nIG11bHRpcGxlIGltYWdlcyBBTkQgYSBjb2xvciBvbiB0aGUgYmFja2dyb3VuZCBzaG9ydGhhbmQgcHJvcGVydHlcbiAgICAgICAgLy8gIGFuZCB0aGVuIHF1ZXJ5aW5nIHRoZSBzdHlsZS5iYWNrZ3JvdW5kIHByb3BlcnR5IHZhbHVlIGZvciB0aGUgbnVtYmVyIG9mXG4gICAgICAgIC8vICBvY2N1cnJlbmNlcyBvZiBcInVybChcIiBpcyBhIHJlbGlhYmxlIG1ldGhvZCBmb3IgZGV0ZWN0aW5nIEFDVFVBTCBzdXBwb3J0IGZvciB0aGlzIVxuXG4gICAgICAgIHNldENzcygnYmFja2dyb3VuZDp1cmwoaHR0cHM6Ly8pLHVybChodHRwczovLykscmVkIHVybChodHRwczovLyknKTtcblxuICAgICAgICAvLyBJZiB0aGUgVUEgc3VwcG9ydHMgbXVsdGlwbGUgYmFja2dyb3VuZHMsIHRoZXJlIHNob3VsZCBiZSB0aHJlZSBvY2N1cnJlbmNlc1xuICAgICAgICAvLyAgIG9mIHRoZSBzdHJpbmcgXCJ1cmwoXCIgaW4gdGhlIHJldHVybiB2YWx1ZSBmb3IgZWxlbVN0eWxlLmJhY2tncm91bmRcblxuICAgICAgICByZXR1cm4gKC8odXJsXFxzKlxcKC4qPyl7M30vKS50ZXN0KG1TdHlsZS5iYWNrZ3JvdW5kKTtcbiAgICB9O1xuXG5cblxuICAgIC8vIHRoaXMgd2lsbCBmYWxzZSBwb3NpdGl2ZSBpbiBPcGVyYSBNaW5pXG4gICAgLy8gICBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzM5NlxuXG4gICAgdGVzdHNbJ2JhY2tncm91bmRzaXplJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnYmFja2dyb3VuZFNpemUnKTtcbiAgICB9O1xuXG4gICAgdGVzdHNbJ2JvcmRlcmltYWdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnYm9yZGVySW1hZ2UnKTtcbiAgICB9O1xuXG5cbiAgICAvLyBTdXBlciBjb21wcmVoZW5zaXZlIHRhYmxlIGFib3V0IGFsbCB0aGUgdW5pcXVlIGltcGxlbWVudGF0aW9ucyBvZlxuICAgIC8vIGJvcmRlci1yYWRpdXM6IG11ZGRsZWRyYW1ibGluZ3MuY29tL3RhYmxlLW9mLWNzczMtYm9yZGVyLXJhZGl1cy1jb21wbGlhbmNlXG5cbiAgICB0ZXN0c1snYm9yZGVycmFkaXVzJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnYm9yZGVyUmFkaXVzJyk7XG4gICAgfTtcblxuICAgIC8vIFdlYk9TIHVuZm9ydHVuYXRlbHkgZmFsc2UgcG9zaXRpdmVzIG9uIHRoaXMgdGVzdC5cbiAgICB0ZXN0c1snYm94c2hhZG93J10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnYm94U2hhZG93Jyk7XG4gICAgfTtcblxuICAgIC8vIEZGMy4wIHdpbGwgZmFsc2UgcG9zaXRpdmUgb24gdGhpcyB0ZXN0XG4gICAgdGVzdHNbJ3RleHRzaGFkb3cnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jykuc3R5bGUudGV4dFNoYWRvdyA9PT0gJyc7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ29wYWNpdHknXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBCcm93c2VycyB0aGF0IGFjdHVhbGx5IGhhdmUgQ1NTIE9wYWNpdHkgaW1wbGVtZW50ZWQgaGF2ZSBkb25lIHNvXG4gICAgICAgIC8vICBhY2NvcmRpbmcgdG8gc3BlYywgd2hpY2ggbWVhbnMgdGhlaXIgcmV0dXJuIHZhbHVlcyBhcmUgd2l0aGluIHRoZVxuICAgICAgICAvLyAgcmFuZ2Ugb2YgWzAuMCwxLjBdIC0gaW5jbHVkaW5nIHRoZSBsZWFkaW5nIHplcm8uXG5cbiAgICAgICAgc2V0Q3NzQWxsKCdvcGFjaXR5Oi41NScpO1xuXG4gICAgICAgIC8vIFRoZSBub24tbGl0ZXJhbCAuIGluIHRoaXMgcmVnZXggaXMgaW50ZW50aW9uYWw6XG4gICAgICAgIC8vICAgR2VybWFuIENocm9tZSByZXR1cm5zIHRoaXMgdmFsdWUgYXMgMCw1NVxuICAgICAgICAvLyBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLyNpc3N1ZS81OS9jb21tZW50LzUxNjYzMlxuICAgICAgICByZXR1cm4gKC9eMC41NSQvKS50ZXN0KG1TdHlsZS5vcGFjaXR5KTtcbiAgICB9O1xuXG5cbiAgICAvLyBOb3RlLCBBbmRyb2lkIDwgNCB3aWxsIHBhc3MgdGhpcyB0ZXN0LCBidXQgY2FuIG9ubHkgYW5pbWF0ZVxuICAgIC8vICAgYSBzaW5nbGUgcHJvcGVydHkgYXQgYSB0aW1lXG4gICAgLy8gICBnb28uZ2wvdjNWNEdwXG4gICAgdGVzdHNbJ2Nzc2FuaW1hdGlvbnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdhbmltYXRpb25OYW1lJyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc2NvbHVtbnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdjb2x1bW5Db3VudCcpO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydjc3NncmFkaWVudHMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIENTUyBHcmFkaWVudHMgc3ludGF4LCBwbGVhc2Ugc2VlOlxuICAgICAgICAgKiB3ZWJraXQub3JnL2Jsb2cvMTc1L2ludHJvZHVjaW5nLWNzcy1ncmFkaWVudHMvXG4gICAgICAgICAqIGRldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9DU1MvLW1vei1saW5lYXItZ3JhZGllbnRcbiAgICAgICAgICogZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0NTUy8tbW96LXJhZGlhbC1ncmFkaWVudFxuICAgICAgICAgKiBkZXYudzMub3JnL2Nzc3dnL2NzczMtaW1hZ2VzLyNncmFkaWVudHMtXG4gICAgICAgICAqL1xuXG4gICAgICAgIHZhciBzdHIxID0gJ2JhY2tncm91bmQtaW1hZ2U6JyxcbiAgICAgICAgICAgIHN0cjIgPSAnZ3JhZGllbnQobGluZWFyLGxlZnQgdG9wLHJpZ2h0IGJvdHRvbSxmcm9tKCM5ZjkpLHRvKHdoaXRlKSk7JyxcbiAgICAgICAgICAgIHN0cjMgPSAnbGluZWFyLWdyYWRpZW50KGxlZnQgdG9wLCM5ZjksIHdoaXRlKTsnO1xuXG4gICAgICAgIHNldENzcyhcbiAgICAgICAgICAgICAvLyBsZWdhY3kgd2Via2l0IHN5bnRheCAoRklYTUU6IHJlbW92ZSB3aGVuIHN5bnRheCBub3QgaW4gdXNlIGFueW1vcmUpXG4gICAgICAgICAgICAgIChzdHIxICsgJy13ZWJraXQtICcuc3BsaXQoJyAnKS5qb2luKHN0cjIgKyBzdHIxKSArXG4gICAgICAgICAgICAgLy8gc3RhbmRhcmQgc3ludGF4ICAgICAgICAgICAgIC8vIHRyYWlsaW5nICdiYWNrZ3JvdW5kLWltYWdlOidcbiAgICAgICAgICAgICAgcHJlZml4ZXMuam9pbihzdHIzICsgc3RyMSkpLnNsaWNlKDAsIC1zdHIxLmxlbmd0aClcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gY29udGFpbnMobVN0eWxlLmJhY2tncm91bmRJbWFnZSwgJ2dyYWRpZW50Jyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc3JlZmxlY3Rpb25zJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnYm94UmVmbGVjdCcpO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydjc3N0cmFuc2Zvcm1zJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhdGVzdFByb3BzQWxsKCd0cmFuc2Zvcm0nKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzdHJhbnNmb3JtczNkJ10gPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgcmV0ID0gISF0ZXN0UHJvcHNBbGwoJ3BlcnNwZWN0aXZlJyk7XG5cbiAgICAgICAgLy8gV2Via2l0J3MgM0QgdHJhbnNmb3JtcyBhcmUgcGFzc2VkIG9mZiB0byB0aGUgYnJvd3NlcidzIG93biBncmFwaGljcyByZW5kZXJlci5cbiAgICAgICAgLy8gICBJdCB3b3JrcyBmaW5lIGluIFNhZmFyaSBvbiBMZW9wYXJkIGFuZCBTbm93IExlb3BhcmQsIGJ1dCBub3QgaW4gQ2hyb21lIGluXG4gICAgICAgIC8vICAgc29tZSBjb25kaXRpb25zLiBBcyBhIHJlc3VsdCwgV2Via2l0IHR5cGljYWxseSByZWNvZ25pemVzIHRoZSBzeW50YXggYnV0XG4gICAgICAgIC8vICAgd2lsbCBzb21ldGltZXMgdGhyb3cgYSBmYWxzZSBwb3NpdGl2ZSwgdGh1cyB3ZSBtdXN0IGRvIGEgbW9yZSB0aG9yb3VnaCBjaGVjazpcbiAgICAgICAgaWYgKCByZXQgJiYgJ3dlYmtpdFBlcnNwZWN0aXZlJyBpbiBkb2NFbGVtZW50LnN0eWxlICkge1xuXG4gICAgICAgICAgLy8gV2Via2l0IGFsbG93cyB0aGlzIG1lZGlhIHF1ZXJ5IHRvIHN1Y2NlZWQgb25seSBpZiB0aGUgZmVhdHVyZSBpcyBlbmFibGVkLlxuICAgICAgICAgIC8vIGBAbWVkaWEgKHRyYW5zZm9ybS0zZCksKC13ZWJraXQtdHJhbnNmb3JtLTNkKXsgLi4uIH1gXG4gICAgICAgICAgaW5qZWN0RWxlbWVudFdpdGhTdHlsZXMoJ0BtZWRpYSAodHJhbnNmb3JtLTNkKSwoLXdlYmtpdC10cmFuc2Zvcm0tM2QpeyNtb2Rlcm5penJ7bGVmdDo5cHg7cG9zaXRpb246YWJzb2x1dGU7aGVpZ2h0OjNweDt9fScsIGZ1bmN0aW9uKCBub2RlLCBydWxlICkge1xuICAgICAgICAgICAgcmV0ID0gbm9kZS5vZmZzZXRMZWZ0ID09PSA5ICYmIG5vZGUub2Zmc2V0SGVpZ2h0ID09PSAzO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc3RyYW5zaXRpb25zJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgndHJhbnNpdGlvbicpO1xuICAgIH07XG5cblxuICAgIC8qPj5mb250ZmFjZSovXG4gICAgLy8gQGZvbnQtZmFjZSBkZXRlY3Rpb24gcm91dGluZSBieSBEaWVnbyBQZXJpbmlcbiAgICAvLyBqYXZhc2NyaXB0Lm53Ym94LmNvbS9DU1NTdXBwb3J0L1xuXG4gICAgLy8gZmFsc2UgcG9zaXRpdmVzOlxuICAgIC8vICAgV2ViT1MgZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy8zNDJcbiAgICAvLyAgIFdQNyAgIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvNTM4XG4gICAgdGVzdHNbJ2ZvbnRmYWNlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJvb2w7XG5cbiAgICAgICAgaW5qZWN0RWxlbWVudFdpdGhTdHlsZXMoJ0Bmb250LWZhY2Uge2ZvbnQtZmFtaWx5OlwiZm9udFwiO3NyYzp1cmwoXCJodHRwczovL1wiKX0nLCBmdW5jdGlvbiggbm9kZSwgcnVsZSApIHtcbiAgICAgICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc21vZGVybml6cicpLFxuICAgICAgICAgICAgICBzaGVldCA9IHN0eWxlLnNoZWV0IHx8IHN0eWxlLnN0eWxlU2hlZXQsXG4gICAgICAgICAgICAgIGNzc1RleHQgPSBzaGVldCA/IChzaGVldC5jc3NSdWxlcyAmJiBzaGVldC5jc3NSdWxlc1swXSA/IHNoZWV0LmNzc1J1bGVzWzBdLmNzc1RleHQgOiBzaGVldC5jc3NUZXh0IHx8ICcnKSA6ICcnO1xuXG4gICAgICAgICAgYm9vbCA9IC9zcmMvaS50ZXN0KGNzc1RleHQpICYmIGNzc1RleHQuaW5kZXhPZihydWxlLnNwbGl0KCcgJylbMF0pID09PSAwO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYm9vbDtcbiAgICB9O1xuICAgIC8qPj5mb250ZmFjZSovXG5cbiAgICAvLyBDU1MgZ2VuZXJhdGVkIGNvbnRlbnQgZGV0ZWN0aW9uXG4gICAgdGVzdHNbJ2dlbmVyYXRlZGNvbnRlbnQnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYm9vbDtcblxuICAgICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcyhbJyMnLG1vZCwne2ZvbnQ6MC8wIGF9IycsbW9kLCc6YWZ0ZXJ7Y29udGVudDpcIicsc21pbGUsJ1wiO3Zpc2liaWxpdHk6aGlkZGVuO2ZvbnQ6M3B4LzEgYX0nXS5qb2luKCcnKSwgZnVuY3Rpb24oIG5vZGUgKSB7XG4gICAgICAgICAgYm9vbCA9IG5vZGUub2Zmc2V0SGVpZ2h0ID49IDM7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG5cblxuXG4gICAgLy8gVGhlc2UgdGVzdHMgZXZhbHVhdGUgc3VwcG9ydCBvZiB0aGUgdmlkZW8vYXVkaW8gZWxlbWVudHMsIGFzIHdlbGwgYXNcbiAgICAvLyB0ZXN0aW5nIHdoYXQgdHlwZXMgb2YgY29udGVudCB0aGV5IHN1cHBvcnQuXG4gICAgLy9cbiAgICAvLyBXZSdyZSB1c2luZyB0aGUgQm9vbGVhbiBjb25zdHJ1Y3RvciBoZXJlLCBzbyB0aGF0IHdlIGNhbiBleHRlbmQgdGhlIHZhbHVlXG4gICAgLy8gZS5nLiAgTW9kZXJuaXpyLnZpZGVvICAgICAvLyB0cnVlXG4gICAgLy8gICAgICAgTW9kZXJuaXpyLnZpZGVvLm9nZyAvLyAncHJvYmFibHknXG4gICAgLy9cbiAgICAvLyBDb2RlYyB2YWx1ZXMgZnJvbSA6IGdpdGh1Yi5jb20vTmllbHNMZWVuaGVlci9odG1sNXRlc3QvYmxvYi85MTA2YTgvaW5kZXguaHRtbCNMODQ1XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB0aHggdG8gTmllbHNMZWVuaGVlciBhbmQgemNvcnBhblxuXG4gICAgLy8gTm90ZTogaW4gc29tZSBvbGRlciBicm93c2VycywgXCJub1wiIHdhcyBhIHJldHVybiB2YWx1ZSBpbnN0ZWFkIG9mIGVtcHR5IHN0cmluZy5cbiAgICAvLyAgIEl0IHdhcyBsaXZlIGluIEZGMy41LjAgYW5kIDMuNS4xLCBidXQgZml4ZWQgaW4gMy41LjJcbiAgICAvLyAgIEl0IHdhcyBhbHNvIGxpdmUgaW4gU2FmYXJpIDQuMC4wIC0gNC4wLjQsIGJ1dCBmaXhlZCBpbiA0LjAuNVxuXG4gICAgdGVzdHNbJ3ZpZGVvJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpLFxuICAgICAgICAgICAgYm9vbCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIElFOSBSdW5uaW5nIG9uIFdpbmRvd3MgU2VydmVyIFNLVSBjYW4gY2F1c2UgYW4gZXhjZXB0aW9uIHRvIGJlIHRocm93biwgYnVnICMyMjRcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICggYm9vbCA9ICEhZWxlbS5jYW5QbGF5VHlwZSApIHtcbiAgICAgICAgICAgICAgICBib29sICAgICAgPSBuZXcgQm9vbGVhbihib29sKTtcbiAgICAgICAgICAgICAgICBib29sLm9nZyAgPSBlbGVtLmNhblBsYXlUeXBlKCd2aWRlby9vZ2c7IGNvZGVjcz1cInRoZW9yYVwiJykgICAgICAucmVwbGFjZSgvXm5vJC8sJycpO1xuXG4gICAgICAgICAgICAgICAgLy8gV2l0aG91dCBRdWlja1RpbWUsIHRoaXMgdmFsdWUgd2lsbCBiZSBgdW5kZWZpbmVkYC4gZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy81NDZcbiAgICAgICAgICAgICAgICBib29sLmgyNjQgPSBlbGVtLmNhblBsYXlUeXBlKCd2aWRlby9tcDQ7IGNvZGVjcz1cImF2YzEuNDJFMDFFXCInKSAucmVwbGFjZSgvXm5vJC8sJycpO1xuXG4gICAgICAgICAgICAgICAgYm9vbC53ZWJtID0gZWxlbS5jYW5QbGF5VHlwZSgndmlkZW8vd2VibTsgY29kZWNzPVwidnA4LCB2b3JiaXNcIicpLnJlcGxhY2UoL15ubyQvLCcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGNhdGNoKGUpIHsgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG5cbiAgICB0ZXN0c1snYXVkaW8nXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyksXG4gICAgICAgICAgICBib29sID0gZmFsc2U7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICggYm9vbCA9ICEhZWxlbS5jYW5QbGF5VHlwZSApIHtcbiAgICAgICAgICAgICAgICBib29sICAgICAgPSBuZXcgQm9vbGVhbihib29sKTtcbiAgICAgICAgICAgICAgICBib29sLm9nZyAgPSBlbGVtLmNhblBsYXlUeXBlKCdhdWRpby9vZ2c7IGNvZGVjcz1cInZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sJycpO1xuICAgICAgICAgICAgICAgIGJvb2wubXAzICA9IGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL21wZWc7JykgICAgICAgICAgICAgICAucmVwbGFjZSgvXm5vJC8sJycpO1xuXG4gICAgICAgICAgICAgICAgLy8gTWltZXR5cGVzIGFjY2VwdGVkOlxuICAgICAgICAgICAgICAgIC8vICAgZGV2ZWxvcGVyLm1vemlsbGEub3JnL0VuL01lZGlhX2Zvcm1hdHNfc3VwcG9ydGVkX2J5X3RoZV9hdWRpb19hbmRfdmlkZW9fZWxlbWVudHNcbiAgICAgICAgICAgICAgICAvLyAgIGJpdC5seS9pcGhvbmVvc2NvZGVjc1xuICAgICAgICAgICAgICAgIGJvb2wud2F2ICA9IGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL3dhdjsgY29kZWNzPVwiMVwiJykgICAgIC5yZXBsYWNlKC9ebm8kLywnJyk7XG4gICAgICAgICAgICAgICAgYm9vbC5tNGEgID0gKCBlbGVtLmNhblBsYXlUeXBlKCdhdWRpby94LW00YTsnKSAgICAgICAgICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNhblBsYXlUeXBlKCdhdWRpby9hYWM7JykpICAgICAgICAgICAgIC5yZXBsYWNlKC9ebm8kLywnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2goZSkgeyB9XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcblxuXG4gICAgLy8gSW4gRkY0LCBpZiBkaXNhYmxlZCwgd2luZG93LmxvY2FsU3RvcmFnZSBzaG91bGQgPT09IG51bGwuXG5cbiAgICAvLyBOb3JtYWxseSwgd2UgY291bGQgbm90IHRlc3QgdGhhdCBkaXJlY3RseSBhbmQgbmVlZCB0byBkbyBhXG4gICAgLy8gICBgKCdsb2NhbFN0b3JhZ2UnIGluIHdpbmRvdykgJiYgYCB0ZXN0IGZpcnN0IGJlY2F1c2Ugb3RoZXJ3aXNlIEZpcmVmb3ggd2lsbFxuICAgIC8vICAgdGhyb3cgYnVnemlsLmxhLzM2NTc3MiBpZiBjb29raWVzIGFyZSBkaXNhYmxlZFxuXG4gICAgLy8gQWxzbyBpbiBpT1M1IFByaXZhdGUgQnJvd3NpbmcgbW9kZSwgYXR0ZW1wdGluZyB0byB1c2UgbG9jYWxTdG9yYWdlLnNldEl0ZW1cbiAgICAvLyB3aWxsIHRocm93IHRoZSBleGNlcHRpb246XG4gICAgLy8gICBRVU9UQV9FWENFRURFRF9FUlJST1IgRE9NIEV4Y2VwdGlvbiAyMi5cbiAgICAvLyBQZWN1bGlhcmx5LCBnZXRJdGVtIGFuZCByZW1vdmVJdGVtIGNhbGxzIGRvIG5vdCB0aHJvdy5cblxuICAgIC8vIEJlY2F1c2Ugd2UgYXJlIGZvcmNlZCB0byB0cnkvY2F0Y2ggdGhpcywgd2UnbGwgZ28gYWdncmVzc2l2ZS5cblxuICAgIC8vIEp1c3QgRldJVzogSUU4IENvbXBhdCBtb2RlIHN1cHBvcnRzIHRoZXNlIGZlYXR1cmVzIGNvbXBsZXRlbHk6XG4gICAgLy8gICB3d3cucXVpcmtzbW9kZS5vcmcvZG9tL2h0bWw1Lmh0bWxcbiAgICAvLyBCdXQgSUU4IGRvZXNuJ3Qgc3VwcG9ydCBlaXRoZXIgd2l0aCBsb2NhbCBmaWxlc1xuXG4gICAgdGVzdHNbJ2xvY2Fsc3RvcmFnZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShtb2QsIG1vZCk7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShtb2QpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRlc3RzWydzZXNzaW9uc3RvcmFnZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKG1vZCwgbW9kKTtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0obW9kKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHRlc3RzWyd3ZWJ3b3JrZXJzJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhd2luZG93LldvcmtlcjtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snYXBwbGljYXRpb25jYWNoZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5hcHBsaWNhdGlvbkNhY2hlO1xuICAgIH07XG5cblxuICAgIC8vIFRoYW5rcyB0byBFcmlrIERhaGxzdHJvbVxuICAgIHRlc3RzWydzdmcnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiYgISFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMuc3ZnLCAnc3ZnJykuY3JlYXRlU1ZHUmVjdDtcbiAgICB9O1xuXG4gICAgLy8gc3BlY2lmaWNhbGx5IGZvciBTVkcgaW5saW5lIGluIEhUTUwsIG5vdCB3aXRoaW4gWEhUTUxcbiAgICAvLyB0ZXN0IHBhZ2U6IHBhdWxpcmlzaC5jb20vZGVtby9pbmxpbmUtc3ZnXG4gICAgdGVzdHNbJ2lubGluZXN2ZyddID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBkaXYuaW5uZXJIVE1MID0gJzxzdmcvPic7XG4gICAgICByZXR1cm4gKGRpdi5maXJzdENoaWxkICYmIGRpdi5maXJzdENoaWxkLm5hbWVzcGFjZVVSSSkgPT0gbnMuc3ZnO1xuICAgIH07XG5cbiAgICAvLyBTVkcgU01JTCBhbmltYXRpb25cbiAgICB0ZXN0c1snc21pbCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiAvU1ZHQW5pbWF0ZS8udGVzdCh0b1N0cmluZy5jYWxsKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucy5zdmcsICdhbmltYXRlJykpKTtcbiAgICB9O1xuXG4gICAgLy8gVGhpcyB0ZXN0IGlzIG9ubHkgZm9yIGNsaXAgcGF0aHMgaW4gU1ZHIHByb3Blciwgbm90IGNsaXAgcGF0aHMgb24gSFRNTCBjb250ZW50XG4gICAgLy8gZGVtbzogc3J1ZmFjdWx0eS5zcnUuZWR1L2RhdmlkLmRhaWxleS9zdmcvbmV3c3R1ZmYvY2xpcFBhdGg0LnN2Z1xuXG4gICAgLy8gSG93ZXZlciByZWFkIHRoZSBjb21tZW50cyB0byBkaWcgaW50byBhcHBseWluZyBTVkcgY2xpcHBhdGhzIHRvIEhUTUwgY29udGVudCBoZXJlOlxuICAgIC8vICAgZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy8yMTMjaXNzdWVjb21tZW50LTExNDk0OTFcbiAgICB0ZXN0c1snc3ZnY2xpcHBhdGhzJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICYmIC9TVkdDbGlwUGF0aC8udGVzdCh0b1N0cmluZy5jYWxsKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucy5zdmcsICdjbGlwUGF0aCcpKSk7XG4gICAgfTtcblxuICAgIC8qPj53ZWJmb3JtcyovXG4gICAgLy8gaW5wdXQgZmVhdHVyZXMgYW5kIGlucHV0IHR5cGVzIGdvIGRpcmVjdGx5IG9udG8gdGhlIHJldCBvYmplY3QsIGJ5cGFzc2luZyB0aGUgdGVzdHMgbG9vcC5cbiAgICAvLyBIb2xkIHRoaXMgZ3V5IHRvIGV4ZWN1dGUgaW4gYSBtb21lbnQuXG4gICAgZnVuY3Rpb24gd2ViZm9ybXMoKSB7XG4gICAgICAgIC8qPj5pbnB1dCovXG4gICAgICAgIC8vIFJ1biB0aHJvdWdoIEhUTUw1J3MgbmV3IGlucHV0IGF0dHJpYnV0ZXMgdG8gc2VlIGlmIHRoZSBVQSB1bmRlcnN0YW5kcyBhbnkuXG4gICAgICAgIC8vIFdlJ3JlIHVzaW5nIGYgd2hpY2ggaXMgdGhlIDxpbnB1dD4gZWxlbWVudCBjcmVhdGVkIGVhcmx5IG9uXG4gICAgICAgIC8vIE1pa2UgVGF5bHIgaGFzIGNyZWF0ZWQgYSBjb21wcmVoZW5zaXZlIHJlc291cmNlIGZvciB0ZXN0aW5nIHRoZXNlIGF0dHJpYnV0ZXNcbiAgICAgICAgLy8gICB3aGVuIGFwcGxpZWQgdG8gYWxsIGlucHV0IHR5cGVzOlxuICAgICAgICAvLyAgIG1pa2V0YXlsci5jb20vY29kZS9pbnB1dC10eXBlLWF0dHIuaHRtbFxuICAgICAgICAvLyBzcGVjOiB3d3cud2hhdHdnLm9yZy9zcGVjcy93ZWItYXBwcy9jdXJyZW50LXdvcmsvbXVsdGlwYWdlL3RoZS1pbnB1dC1lbGVtZW50Lmh0bWwjaW5wdXQtdHlwZS1hdHRyLXN1bW1hcnlcblxuICAgICAgICAvLyBPbmx5IGlucHV0IHBsYWNlaG9sZGVyIGlzIHRlc3RlZCB3aGlsZSB0ZXh0YXJlYSdzIHBsYWNlaG9sZGVyIGlzIG5vdC5cbiAgICAgICAgLy8gQ3VycmVudGx5IFNhZmFyaSA0IGFuZCBPcGVyYSAxMSBoYXZlIHN1cHBvcnQgb25seSBmb3IgdGhlIGlucHV0IHBsYWNlaG9sZGVyXG4gICAgICAgIC8vIEJvdGggdGVzdHMgYXJlIGF2YWlsYWJsZSBpbiBmZWF0dXJlLWRldGVjdHMvZm9ybXMtcGxhY2Vob2xkZXIuanNcbiAgICAgICAgTW9kZXJuaXpyWydpbnB1dCddID0gKGZ1bmN0aW9uKCBwcm9wcyApIHtcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbGVuID0gcHJvcHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgYXR0cnNbIHByb3BzW2ldIF0gPSAhIShwcm9wc1tpXSBpbiBpbnB1dEVsZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF0dHJzLmxpc3Qpe1xuICAgICAgICAgICAgICAvLyBzYWZhcmkgZmFsc2UgcG9zaXRpdmUncyBvbiBkYXRhbGlzdDogd2Viay5pdC83NDI1MlxuICAgICAgICAgICAgICAvLyBzZWUgYWxzbyBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzE0NlxuICAgICAgICAgICAgICBhdHRycy5saXN0ID0gISEoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGF0YWxpc3QnKSAmJiB3aW5kb3cuSFRNTERhdGFMaXN0RWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXR0cnM7XG4gICAgICAgIH0pKCdhdXRvY29tcGxldGUgYXV0b2ZvY3VzIGxpc3QgcGxhY2Vob2xkZXIgbWF4IG1pbiBtdWx0aXBsZSBwYXR0ZXJuIHJlcXVpcmVkIHN0ZXAnLnNwbGl0KCcgJykpO1xuICAgICAgICAvKj4+aW5wdXQqL1xuXG4gICAgICAgIC8qPj5pbnB1dHR5cGVzKi9cbiAgICAgICAgLy8gUnVuIHRocm91Z2ggSFRNTDUncyBuZXcgaW5wdXQgdHlwZXMgdG8gc2VlIGlmIHRoZSBVQSB1bmRlcnN0YW5kcyBhbnkuXG4gICAgICAgIC8vICAgVGhpcyBpcyBwdXQgYmVoaW5kIHRoZSB0ZXN0cyBydW5sb29wIGJlY2F1c2UgaXQgZG9lc24ndCByZXR1cm4gYVxuICAgICAgICAvLyAgIHRydWUvZmFsc2UgbGlrZSBhbGwgdGhlIG90aGVyIHRlc3RzOyBpbnN0ZWFkLCBpdCByZXR1cm5zIGFuIG9iamVjdFxuICAgICAgICAvLyAgIGNvbnRhaW5pbmcgZWFjaCBpbnB1dCB0eXBlIHdpdGggaXRzIGNvcnJlc3BvbmRpbmcgdHJ1ZS9mYWxzZSB2YWx1ZVxuXG4gICAgICAgIC8vIEJpZyB0aGFua3MgdG8gQG1pa2V0YXlsciBmb3IgdGhlIGh0bWw1IGZvcm1zIGV4cGVydGlzZS4gbWlrZXRheWxyLmNvbS9cbiAgICAgICAgTW9kZXJuaXpyWydpbnB1dHR5cGVzJ10gPSAoZnVuY3Rpb24ocHJvcHMpIHtcblxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBib29sLCBpbnB1dEVsZW1UeXBlLCBkZWZhdWx0VmlldywgbGVuID0gcHJvcHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cbiAgICAgICAgICAgICAgICBpbnB1dEVsZW0uc2V0QXR0cmlidXRlKCd0eXBlJywgaW5wdXRFbGVtVHlwZSA9IHByb3BzW2ldKTtcbiAgICAgICAgICAgICAgICBib29sID0gaW5wdXRFbGVtLnR5cGUgIT09ICd0ZXh0JztcblxuICAgICAgICAgICAgICAgIC8vIFdlIGZpcnN0IGNoZWNrIHRvIHNlZSBpZiB0aGUgdHlwZSB3ZSBnaXZlIGl0IHN0aWNrcy4uXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHR5cGUgZG9lcywgd2UgZmVlZCBpdCBhIHRleHR1YWwgdmFsdWUsIHdoaWNoIHNob3VsZG4ndCBiZSB2YWxpZC5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdmFsdWUgZG9lc24ndCBzdGljaywgd2Uga25vdyB0aGVyZSdzIGlucHV0IHNhbml0aXphdGlvbiB3aGljaCBpbmZlcnMgYSBjdXN0b20gVUlcbiAgICAgICAgICAgICAgICBpZiAoIGJvb2wgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRFbGVtLnZhbHVlICAgICAgICAgPSBzbWlsZTtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRFbGVtLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246YWJzb2x1dGU7dmlzaWJpbGl0eTpoaWRkZW47JztcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIC9ecmFuZ2UkLy50ZXN0KGlucHV0RWxlbVR5cGUpICYmIGlucHV0RWxlbS5zdHlsZS5XZWJraXRBcHBlYXJhbmNlICE9PSB1bmRlZmluZWQgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICBkb2NFbGVtZW50LmFwcGVuZENoaWxkKGlucHV0RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZpZXcgPSBkb2N1bWVudC5kZWZhdWx0VmlldztcblxuICAgICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSAyLTQgYWxsb3dzIHRoZSBzbWlsZXkgYXMgYSB2YWx1ZSwgZGVzcGl0ZSBtYWtpbmcgYSBzbGlkZXJcbiAgICAgICAgICAgICAgICAgICAgICBib29sID0gIGRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoaW5wdXRFbGVtLCBudWxsKS5XZWJraXRBcHBlYXJhbmNlICE9PSAndGV4dGZpZWxkJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW9iaWxlIGFuZHJvaWQgd2ViIGJyb3dzZXIgaGFzIGZhbHNlIHBvc2l0aXZlLCBzbyBtdXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayB0aGUgaGVpZ2h0IHRvIHNlZSBpZiB0aGUgd2lkZ2V0IGlzIGFjdHVhbGx5IHRoZXJlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGlucHV0RWxlbS5vZmZzZXRIZWlnaHQgIT09IDApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgZG9jRWxlbWVudC5yZW1vdmVDaGlsZChpbnB1dEVsZW0pO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIC9eKHNlYXJjaHx0ZWwpJC8udGVzdChpbnB1dEVsZW1UeXBlKSApe1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFNwZWMgZG9lc24ndCBkZWZpbmUgYW55IHNwZWNpYWwgcGFyc2luZyBvciBkZXRlY3RhYmxlIFVJXG4gICAgICAgICAgICAgICAgICAgICAgLy8gICBiZWhhdmlvcnMgc28gd2UgcGFzcyB0aGVzZSB0aHJvdWdoIGFzIHRydWVcblxuICAgICAgICAgICAgICAgICAgICAgIC8vIEludGVyZXN0aW5nbHksIG9wZXJhIGZhaWxzIHRoZSBlYXJsaWVyIHRlc3QsIHNvIGl0IGRvZXNuJ3RcbiAgICAgICAgICAgICAgICAgICAgICAvLyAgZXZlbiBtYWtlIGl0IGhlcmUuXG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICggL14odXJsfGVtYWlsKSQvLnRlc3QoaW5wdXRFbGVtVHlwZSkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gUmVhbCB1cmwgYW5kIGVtYWlsIHN1cHBvcnQgY29tZXMgd2l0aCBwcmViYWtlZCB2YWxpZGF0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgIGJvb2wgPSBpbnB1dEVsZW0uY2hlY2tWYWxpZGl0eSAmJiBpbnB1dEVsZW0uY2hlY2tWYWxpZGl0eSgpID09PSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSB1cGdyYWRlZCBpbnB1dCBjb21wb250ZW50IHJlamVjdHMgdGhlIDopIHRleHQsIHdlIGdvdCBhIHdpbm5lclxuICAgICAgICAgICAgICAgICAgICAgIGJvb2wgPSBpbnB1dEVsZW0udmFsdWUgIT0gc21pbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpbnB1dHNbIHByb3BzW2ldIF0gPSAhIWJvb2w7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5wdXRzO1xuICAgICAgICB9KSgnc2VhcmNoIHRlbCB1cmwgZW1haWwgZGF0ZXRpbWUgZGF0ZSBtb250aCB3ZWVrIHRpbWUgZGF0ZXRpbWUtbG9jYWwgbnVtYmVyIHJhbmdlIGNvbG9yJy5zcGxpdCgnICcpKTtcbiAgICAgICAgLyo+PmlucHV0dHlwZXMqL1xuICAgIH1cbiAgICAvKj4+d2ViZm9ybXMqL1xuXG5cbiAgICAvLyBFbmQgb2YgdGVzdCBkZWZpbml0aW9uc1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuXG4gICAgLy8gUnVuIHRocm91Z2ggYWxsIHRlc3RzIGFuZCBkZXRlY3QgdGhlaXIgc3VwcG9ydCBpbiB0aGUgY3VycmVudCBVQS5cbiAgICAvLyB0b2RvOiBoeXBvdGhldGljYWxseSB3ZSBjb3VsZCBiZSBkb2luZyBhbiBhcnJheSBvZiB0ZXN0cyBhbmQgdXNlIGEgYmFzaWMgbG9vcCBoZXJlLlxuICAgIGZvciAoIHZhciBmZWF0dXJlIGluIHRlc3RzICkge1xuICAgICAgICBpZiAoIGhhc093blByb3AodGVzdHMsIGZlYXR1cmUpICkge1xuICAgICAgICAgICAgLy8gcnVuIHRoZSB0ZXN0LCB0aHJvdyB0aGUgcmV0dXJuIHZhbHVlIGludG8gdGhlIE1vZGVybml6cixcbiAgICAgICAgICAgIC8vICAgdGhlbiBiYXNlZCBvbiB0aGF0IGJvb2xlYW4sIGRlZmluZSBhbiBhcHByb3ByaWF0ZSBjbGFzc05hbWVcbiAgICAgICAgICAgIC8vICAgYW5kIHB1c2ggaXQgaW50byBhbiBhcnJheSBvZiBjbGFzc2VzIHdlJ2xsIGpvaW4gbGF0ZXIuXG4gICAgICAgICAgICBmZWF0dXJlTmFtZSAgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBNb2Rlcm5penJbZmVhdHVyZU5hbWVdID0gdGVzdHNbZmVhdHVyZV0oKTtcblxuICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKChNb2Rlcm5penJbZmVhdHVyZU5hbWVdID8gJycgOiAnbm8tJykgKyBmZWF0dXJlTmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKj4+d2ViZm9ybXMqL1xuICAgIC8vIGlucHV0IHRlc3RzIG5lZWQgdG8gcnVuLlxuICAgIE1vZGVybml6ci5pbnB1dCB8fCB3ZWJmb3JtcygpO1xuICAgIC8qPj53ZWJmb3JtcyovXG5cblxuICAgIC8qKlxuICAgICAqIGFkZFRlc3QgYWxsb3dzIHRoZSB1c2VyIHRvIGRlZmluZSB0aGVpciBvd24gZmVhdHVyZSB0ZXN0c1xuICAgICAqIHRoZSByZXN1bHQgd2lsbCBiZSBhZGRlZCBvbnRvIHRoZSBNb2Rlcm5penIgb2JqZWN0LFxuICAgICAqIGFzIHdlbGwgYXMgYW4gYXBwcm9wcmlhdGUgY2xhc3NOYW1lIHNldCBvbiB0aGUgaHRtbCBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gZmVhdHVyZSAtIFN0cmluZyBuYW1pbmcgdGhlIGZlYXR1cmVcbiAgICAgKiBAcGFyYW0gdGVzdCAtIEZ1bmN0aW9uIHJldHVybmluZyB0cnVlIGlmIGZlYXR1cmUgaXMgc3VwcG9ydGVkLCBmYWxzZSBpZiBub3RcbiAgICAgKi9cbiAgICAgTW9kZXJuaXpyLmFkZFRlc3QgPSBmdW5jdGlvbiAoIGZlYXR1cmUsIHRlc3QgKSB7XG4gICAgICAgaWYgKCB0eXBlb2YgZmVhdHVyZSA9PSAnb2JqZWN0JyApIHtcbiAgICAgICAgIGZvciAoIHZhciBrZXkgaW4gZmVhdHVyZSApIHtcbiAgICAgICAgICAgaWYgKCBoYXNPd25Qcm9wKCBmZWF0dXJlLCBrZXkgKSApIHtcbiAgICAgICAgICAgICBNb2Rlcm5penIuYWRkVGVzdCgga2V5LCBmZWF0dXJlWyBrZXkgXSApO1xuICAgICAgICAgICB9XG4gICAgICAgICB9XG4gICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgZmVhdHVyZSA9IGZlYXR1cmUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgaWYgKCBNb2Rlcm5penJbZmVhdHVyZV0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgLy8gd2UncmUgZ29pbmcgdG8gcXVpdCBpZiB5b3UncmUgdHJ5aW5nIHRvIG92ZXJ3cml0ZSBhbiBleGlzdGluZyB0ZXN0XG4gICAgICAgICAgIC8vIGlmIHdlIHdlcmUgdG8gYWxsb3cgaXQsIHdlJ2QgZG8gdGhpczpcbiAgICAgICAgICAgLy8gICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiXFxcXGIobm8tKT9cIiArIGZlYXR1cmUgKyBcIlxcXFxiXCIpO1xuICAgICAgICAgICAvLyAgIGRvY0VsZW1lbnQuY2xhc3NOYW1lID0gZG9jRWxlbWVudC5jbGFzc05hbWUucmVwbGFjZSggcmUsICcnICk7XG4gICAgICAgICAgIC8vIGJ1dCwgbm8gcmx5LCBzdHVmZiAnZW0uXG4gICAgICAgICAgIHJldHVybiBNb2Rlcm5penI7XG4gICAgICAgICB9XG5cbiAgICAgICAgIHRlc3QgPSB0eXBlb2YgdGVzdCA9PSAnZnVuY3Rpb24nID8gdGVzdCgpIDogdGVzdDtcblxuICAgICAgICAgaWYgKHR5cGVvZiBlbmFibGVDbGFzc2VzICE9PSBcInVuZGVmaW5lZFwiICYmIGVuYWJsZUNsYXNzZXMpIHtcbiAgICAgICAgICAgZG9jRWxlbWVudC5jbGFzc05hbWUgKz0gJyAnICsgKHRlc3QgPyAnJyA6ICduby0nKSArIGZlYXR1cmU7XG4gICAgICAgICB9XG4gICAgICAgICBNb2Rlcm5penJbZmVhdHVyZV0gPSB0ZXN0O1xuXG4gICAgICAgfVxuXG4gICAgICAgcmV0dXJuIE1vZGVybml6cjsgLy8gYWxsb3cgY2hhaW5pbmcuXG4gICAgIH07XG5cblxuICAgIC8vIFJlc2V0IG1vZEVsZW0uY3NzVGV4dCB0byBub3RoaW5nIHRvIHJlZHVjZSBtZW1vcnkgZm9vdHByaW50LlxuICAgIHNldENzcygnJyk7XG4gICAgbW9kRWxlbSA9IGlucHV0RWxlbSA9IG51bGw7XG5cbiAgICAvKj4+c2hpdiovXG4gICAgLyoqXG4gICAgICogQHByZXNlcnZlIEhUTUw1IFNoaXYgcHJldjMuNy4xIHwgQGFmYXJrYXMgQGpkYWx0b24gQGpvbl9uZWFsIEByZW0gfCBNSVQvR1BMMiBMaWNlbnNlZFxuICAgICAqL1xuICAgIDsoZnVuY3Rpb24od2luZG93LCBkb2N1bWVudCkge1xuICAgICAgICAvKmpzaGludCBldmlsOnRydWUgKi9cbiAgICAgICAgLyoqIHZlcnNpb24gKi9cbiAgICAgICAgdmFyIHZlcnNpb24gPSAnMy43LjAnO1xuXG4gICAgICAgIC8qKiBQcmVzZXQgb3B0aW9ucyAqL1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHdpbmRvdy5odG1sNSB8fCB7fTtcblxuICAgICAgICAvKiogVXNlZCB0byBza2lwIHByb2JsZW0gZWxlbWVudHMgKi9cbiAgICAgICAgdmFyIHJlU2tpcCA9IC9ePHxeKD86YnV0dG9ufG1hcHxzZWxlY3R8dGV4dGFyZWF8b2JqZWN0fGlmcmFtZXxvcHRpb258b3B0Z3JvdXApJC9pO1xuXG4gICAgICAgIC8qKiBOb3QgYWxsIGVsZW1lbnRzIGNhbiBiZSBjbG9uZWQgaW4gSUUgKiovXG4gICAgICAgIHZhciBzYXZlQ2xvbmVzID0gL14oPzphfGJ8Y29kZXxkaXZ8ZmllbGRzZXR8aDF8aDJ8aDN8aDR8aDV8aDZ8aXxsYWJlbHxsaXxvbHxwfHF8c3BhbnxzdHJvbmd8c3R5bGV8dGFibGV8dGJvZHl8dGR8dGh8dHJ8dWwpJC9pO1xuXG4gICAgICAgIC8qKiBEZXRlY3Qgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBkZWZhdWx0IGh0bWw1IHN0eWxlcyAqL1xuICAgICAgICB2YXIgc3VwcG9ydHNIdG1sNVN0eWxlcztcblxuICAgICAgICAvKiogTmFtZSBvZiB0aGUgZXhwYW5kbywgdG8gd29yayB3aXRoIG11bHRpcGxlIGRvY3VtZW50cyBvciB0byByZS1zaGl2IG9uZSBkb2N1bWVudCAqL1xuICAgICAgICB2YXIgZXhwYW5kbyA9ICdfaHRtbDVzaGl2JztcblxuICAgICAgICAvKiogVGhlIGlkIGZvciB0aGUgdGhlIGRvY3VtZW50cyBleHBhbmRvICovXG4gICAgICAgIHZhciBleHBhbklEID0gMDtcblxuICAgICAgICAvKiogQ2FjaGVkIGRhdGEgZm9yIGVhY2ggZG9jdW1lbnQgKi9cbiAgICAgICAgdmFyIGV4cGFuZG9EYXRhID0ge307XG5cbiAgICAgICAgLyoqIERldGVjdCB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIHVua25vd24gZWxlbWVudHMgKi9cbiAgICAgICAgdmFyIHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzO1xuXG4gICAgICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBhLmlubmVySFRNTCA9ICc8eHl6PjwveHl6Pic7XG4gICAgICAgICAgICAvL2lmIHRoZSBoaWRkZW4gcHJvcGVydHkgaXMgaW1wbGVtZW50ZWQgd2UgY2FuIGFzc3VtZSwgdGhhdCB0aGUgYnJvd3NlciBzdXBwb3J0cyBiYXNpYyBIVE1MNSBTdHlsZXNcbiAgICAgICAgICAgIHN1cHBvcnRzSHRtbDVTdHlsZXMgPSAoJ2hpZGRlbicgaW4gYSk7XG5cbiAgICAgICAgICAgIHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzID0gYS5jaGlsZE5vZGVzLmxlbmd0aCA9PSAxIHx8IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgLy8gYXNzaWduIGEgZmFsc2UgcG9zaXRpdmUgaWYgdW5hYmxlIHRvIHNoaXZcbiAgICAgICAgICAgICAgKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQpKCdhJyk7XG4gICAgICAgICAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIHR5cGVvZiBmcmFnLmNsb25lTm9kZSA9PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICAgICAgICAgIHR5cGVvZiBmcmFnLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQgPT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgICAgICAgICB0eXBlb2YgZnJhZy5jcmVhdGVFbGVtZW50ID09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KCkpO1xuICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgLy8gYXNzaWduIGEgZmFsc2UgcG9zaXRpdmUgaWYgZGV0ZWN0aW9uIGZhaWxzID0+IHVuYWJsZSB0byBzaGl2XG4gICAgICAgICAgICBzdXBwb3J0c0h0bWw1U3R5bGVzID0gdHJ1ZTtcbiAgICAgICAgICAgIHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSgpKTtcblxuICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIHN0eWxlIHNoZWV0IHdpdGggdGhlIGdpdmVuIENTUyB0ZXh0IGFuZCBhZGRzIGl0IHRvIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHBhcmFtIHtEb2N1bWVudH0gb3duZXJEb2N1bWVudCBUaGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjc3NUZXh0IFRoZSBDU1MgdGV4dC5cbiAgICAgICAgICogQHJldHVybnMge1N0eWxlU2hlZXR9IFRoZSBzdHlsZSBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gYWRkU3R5bGVTaGVldChvd25lckRvY3VtZW50LCBjc3NUZXh0KSB7XG4gICAgICAgICAgdmFyIHAgPSBvd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKSxcbiAgICAgICAgICBwYXJlbnQgPSBvd25lckRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0gfHwgb3duZXJEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgICAgICBwLmlubmVySFRNTCA9ICd4PHN0eWxlPicgKyBjc3NUZXh0ICsgJzwvc3R5bGU+JztcbiAgICAgICAgICByZXR1cm4gcGFyZW50Lmluc2VydEJlZm9yZShwLmxhc3RDaGlsZCwgcGFyZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIGBodG1sNS5lbGVtZW50c2AgYXMgYW4gYXJyYXkuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheX0gQW4gYXJyYXkgb2Ygc2hpdmVkIGVsZW1lbnQgbm9kZSBuYW1lcy5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldEVsZW1lbnRzKCkge1xuICAgICAgICAgIHZhciBlbGVtZW50cyA9IGh0bWw1LmVsZW1lbnRzO1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgZWxlbWVudHMgPT0gJ3N0cmluZycgPyBlbGVtZW50cy5zcGxpdCgnICcpIDogZWxlbWVudHM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyB0aGUgZGF0YSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiBkb2N1bWVudFxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gQW4gb2JqZWN0IG9mIGRhdGEuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRFeHBhbmRvRGF0YShvd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgdmFyIGRhdGEgPSBleHBhbmRvRGF0YVtvd25lckRvY3VtZW50W2V4cGFuZG9dXTtcbiAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGV4cGFuSUQrKztcbiAgICAgICAgICAgIG93bmVyRG9jdW1lbnRbZXhwYW5kb10gPSBleHBhbklEO1xuICAgICAgICAgICAgZXhwYW5kb0RhdGFbZXhwYW5JRF0gPSBkYXRhO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiByZXR1cm5zIGEgc2hpdmVkIGVsZW1lbnQgZm9yIHRoZSBnaXZlbiBub2RlTmFtZSBhbmQgZG9jdW1lbnRcbiAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBub2RlTmFtZSBuYW1lIG9mIHRoZSBlbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR9IG93bmVyRG9jdW1lbnQgVGhlIGNvbnRleHQgZG9jdW1lbnQuXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBzaGl2ZWQgZWxlbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQobm9kZU5hbWUsIG93bmVyRG9jdW1lbnQsIGRhdGEpe1xuICAgICAgICAgIGlmICghb3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZihzdXBwb3J0c1Vua25vd25FbGVtZW50cyl7XG4gICAgICAgICAgICByZXR1cm4gb3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVOYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICBkYXRhID0gZ2V0RXhwYW5kb0RhdGEob3duZXJEb2N1bWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBub2RlO1xuXG4gICAgICAgICAgaWYgKGRhdGEuY2FjaGVbbm9kZU5hbWVdKSB7XG4gICAgICAgICAgICBub2RlID0gZGF0YS5jYWNoZVtub2RlTmFtZV0uY2xvbmVOb2RlKCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzYXZlQ2xvbmVzLnRlc3Qobm9kZU5hbWUpKSB7XG4gICAgICAgICAgICBub2RlID0gKGRhdGEuY2FjaGVbbm9kZU5hbWVdID0gZGF0YS5jcmVhdGVFbGVtKG5vZGVOYW1lKSkuY2xvbmVOb2RlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUgPSBkYXRhLmNyZWF0ZUVsZW0obm9kZU5hbWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEF2b2lkIGFkZGluZyBzb21lIGVsZW1lbnRzIHRvIGZyYWdtZW50cyBpbiBJRSA8IDkgYmVjYXVzZVxuICAgICAgICAgIC8vICogQXR0cmlidXRlcyBsaWtlIGBuYW1lYCBvciBgdHlwZWAgY2Fubm90IGJlIHNldC9jaGFuZ2VkIG9uY2UgYW4gZWxlbWVudFxuICAgICAgICAgIC8vICAgaXMgaW5zZXJ0ZWQgaW50byBhIGRvY3VtZW50L2ZyYWdtZW50XG4gICAgICAgICAgLy8gKiBMaW5rIGVsZW1lbnRzIHdpdGggYHNyY2AgYXR0cmlidXRlcyB0aGF0IGFyZSBpbmFjY2Vzc2libGUsIGFzIHdpdGhcbiAgICAgICAgICAvLyAgIGEgNDAzIHJlc3BvbnNlLCB3aWxsIGNhdXNlIHRoZSB0YWIvd2luZG93IHRvIGNyYXNoXG4gICAgICAgICAgLy8gKiBTY3JpcHQgZWxlbWVudHMgYXBwZW5kZWQgdG8gZnJhZ21lbnRzIHdpbGwgZXhlY3V0ZSB3aGVuIHRoZWlyIGBzcmNgXG4gICAgICAgICAgLy8gICBvciBgdGV4dGAgcHJvcGVydHkgaXMgc2V0XG4gICAgICAgICAgcmV0dXJuIG5vZGUuY2FuSGF2ZUNoaWxkcmVuICYmICFyZVNraXAudGVzdChub2RlTmFtZSkgJiYgIW5vZGUudGFnVXJuID8gZGF0YS5mcmFnLmFwcGVuZENoaWxkKG5vZGUpIDogbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiByZXR1cm5zIGEgc2hpdmVkIERvY3VtZW50RnJhZ21lbnQgZm9yIHRoZSBnaXZlbiBkb2N1bWVudFxuICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICogQHBhcmFtIHtEb2N1bWVudH0gb3duZXJEb2N1bWVudCBUaGUgY29udGV4dCBkb2N1bWVudC5cbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gVGhlIHNoaXZlZCBEb2N1bWVudEZyYWdtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRG9jdW1lbnRGcmFnbWVudChvd25lckRvY3VtZW50LCBkYXRhKXtcbiAgICAgICAgICBpZiAoIW93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIG93bmVyRG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoc3VwcG9ydHNVbmtub3duRWxlbWVudHMpe1xuICAgICAgICAgICAgcmV0dXJuIG93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkYXRhID0gZGF0YSB8fCBnZXRFeHBhbmRvRGF0YShvd25lckRvY3VtZW50KTtcbiAgICAgICAgICB2YXIgY2xvbmUgPSBkYXRhLmZyYWcuY2xvbmVOb2RlKCksXG4gICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgZWxlbXMgPSBnZXRFbGVtZW50cygpLFxuICAgICAgICAgIGwgPSBlbGVtcy5sZW5ndGg7XG4gICAgICAgICAgZm9yKDtpPGw7aSsrKXtcbiAgICAgICAgICAgIGNsb25lLmNyZWF0ZUVsZW1lbnQoZWxlbXNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2hpdnMgdGhlIGBjcmVhdGVFbGVtZW50YCBhbmQgYGNyZWF0ZURvY3VtZW50RnJhZ21lbnRgIG1ldGhvZHMgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fERvY3VtZW50RnJhZ21lbnR9IG93bmVyRG9jdW1lbnQgVGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSBvZiB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBzaGl2TWV0aG9kcyhvd25lckRvY3VtZW50LCBkYXRhKSB7XG4gICAgICAgICAgaWYgKCFkYXRhLmNhY2hlKSB7XG4gICAgICAgICAgICBkYXRhLmNhY2hlID0ge307XG4gICAgICAgICAgICBkYXRhLmNyZWF0ZUVsZW0gPSBvd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQ7XG4gICAgICAgICAgICBkYXRhLmNyZWF0ZUZyYWcgPSBvd25lckRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQ7XG4gICAgICAgICAgICBkYXRhLmZyYWcgPSBkYXRhLmNyZWF0ZUZyYWcoKTtcbiAgICAgICAgICB9XG5cblxuICAgICAgICAgIG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKG5vZGVOYW1lKSB7XG4gICAgICAgICAgICAvL2Fib3J0IHNoaXZcbiAgICAgICAgICAgIGlmICghaHRtbDUuc2hpdk1ldGhvZHMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY3JlYXRlRWxlbShub2RlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudChub2RlTmFtZSwgb3duZXJEb2N1bWVudCwgZGF0YSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIG93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCA9IEZ1bmN0aW9uKCdoLGYnLCAncmV0dXJuIGZ1bmN0aW9uKCl7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ZhciBuPWYuY2xvbmVOb2RlKCksYz1uLmNyZWF0ZUVsZW1lbnQ7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2guc2hpdk1ldGhvZHMmJignICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1bnJvbGwgdGhlIGBjcmVhdGVFbGVtZW50YCBjYWxsc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEVsZW1lbnRzKCkuam9pbigpLnJlcGxhY2UoL1tcXHdcXC1dKy9nLCBmdW5jdGlvbihub2RlTmFtZSkge1xuICAgICAgICAgICAgZGF0YS5jcmVhdGVFbGVtKG5vZGVOYW1lKTtcbiAgICAgICAgICAgIGRhdGEuZnJhZy5jcmVhdGVFbGVtZW50KG5vZGVOYW1lKTtcbiAgICAgICAgICAgIHJldHVybiAnYyhcIicgKyBub2RlTmFtZSArICdcIiknO1xuICAgICAgICAgIH0pICtcbiAgICAgICAgICAgICcpO3JldHVybiBufSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkoaHRtbDUsIGRhdGEuZnJhZyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2hpdnMgdGhlIGdpdmVuIGRvY3VtZW50LlxuICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICogQHBhcmFtIHtEb2N1bWVudH0gb3duZXJEb2N1bWVudCBUaGUgZG9jdW1lbnQgdG8gc2hpdi5cbiAgICAgICAgICogQHJldHVybnMge0RvY3VtZW50fSBUaGUgc2hpdmVkIGRvY3VtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gc2hpdkRvY3VtZW50KG93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICBpZiAoIW93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIG93bmVyRG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGRhdGEgPSBnZXRFeHBhbmRvRGF0YShvd25lckRvY3VtZW50KTtcblxuICAgICAgICAgIGlmIChodG1sNS5zaGl2Q1NTICYmICFzdXBwb3J0c0h0bWw1U3R5bGVzICYmICFkYXRhLmhhc0NTUykge1xuICAgICAgICAgICAgZGF0YS5oYXNDU1MgPSAhIWFkZFN0eWxlU2hlZXQob3duZXJEb2N1bWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvcnJlY3RzIGJsb2NrIGRpc3BsYXkgbm90IGRlZmluZWQgaW4gSUU2LzcvOC85XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYXJ0aWNsZSxhc2lkZSxkaWFsb2csZmlnY2FwdGlvbixmaWd1cmUsZm9vdGVyLGhlYWRlcixoZ3JvdXAsbWFpbixuYXYsc2VjdGlvbntkaXNwbGF5OmJsb2NrfScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGRzIHN0eWxpbmcgbm90IHByZXNlbnQgaW4gSUU2LzcvOC85XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtYXJre2JhY2tncm91bmQ6I0ZGMDtjb2xvcjojMDAwfScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBoaWRlcyBub24tcmVuZGVyZWQgZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RlbXBsYXRle2Rpc3BsYXk6bm9uZX0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghc3VwcG9ydHNVbmtub3duRWxlbWVudHMpIHtcbiAgICAgICAgICAgIHNoaXZNZXRob2RzKG93bmVyRG9jdW1lbnQsIGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gb3duZXJEb2N1bWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYGh0bWw1YCBvYmplY3QgaXMgZXhwb3NlZCBzbyB0aGF0IG1vcmUgZWxlbWVudHMgY2FuIGJlIHNoaXZlZCBhbmRcbiAgICAgICAgICogZXhpc3Rpbmcgc2hpdmluZyBjYW4gYmUgZGV0ZWN0ZWQgb24gaWZyYW1lcy5cbiAgICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqIC8vIG9wdGlvbnMgY2FuIGJlIGNoYW5nZWQgYmVmb3JlIHRoZSBzY3JpcHQgaXMgaW5jbHVkZWRcbiAgICAgICAgICogaHRtbDUgPSB7ICdlbGVtZW50cyc6ICdtYXJrIHNlY3Rpb24nLCAnc2hpdkNTUyc6IGZhbHNlLCAnc2hpdk1ldGhvZHMnOiBmYWxzZSB9O1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGh0bWw1ID0ge1xuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQW4gYXJyYXkgb3Igc3BhY2Ugc2VwYXJhdGVkIHN0cmluZyBvZiBub2RlIG5hbWVzIG9mIHRoZSBlbGVtZW50cyB0byBzaGl2LlxuICAgICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgICAqIEB0eXBlIEFycmF5fFN0cmluZ1xuICAgICAgICAgICAqL1xuICAgICAgICAgICdlbGVtZW50cyc6IG9wdGlvbnMuZWxlbWVudHMgfHwgJ2FiYnIgYXJ0aWNsZSBhc2lkZSBhdWRpbyBiZGkgY2FudmFzIGRhdGEgZGF0YWxpc3QgZGV0YWlscyBkaWFsb2cgZmlnY2FwdGlvbiBmaWd1cmUgZm9vdGVyIGhlYWRlciBoZ3JvdXAgbWFpbiBtYXJrIG1ldGVyIG5hdiBvdXRwdXQgcHJvZ3Jlc3Mgc2VjdGlvbiBzdW1tYXJ5IHRlbXBsYXRlIHRpbWUgdmlkZW8nLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogY3VycmVudCB2ZXJzaW9uIG9mIGh0bWw1c2hpdlxuICAgICAgICAgICAqL1xuICAgICAgICAgICd2ZXJzaW9uJzogdmVyc2lvbixcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEEgZmxhZyB0byBpbmRpY2F0ZSB0aGF0IHRoZSBIVE1MNSBzdHlsZSBzaGVldCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICAgICAqL1xuICAgICAgICAgICdzaGl2Q1NTJzogKG9wdGlvbnMuc2hpdkNTUyAhPT0gZmFsc2UpLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogSXMgZXF1YWwgdG8gdHJ1ZSBpZiBhIGJyb3dzZXIgc3VwcG9ydHMgY3JlYXRpbmcgdW5rbm93bi9IVE1MNSBlbGVtZW50c1xuICAgICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICAgKi9cbiAgICAgICAgICAnc3VwcG9ydHNVbmtub3duRWxlbWVudHMnOiBzdXBwb3J0c1Vua25vd25FbGVtZW50cyxcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEEgZmxhZyB0byBpbmRpY2F0ZSB0aGF0IHRoZSBkb2N1bWVudCdzIGBjcmVhdGVFbGVtZW50YCBhbmQgYGNyZWF0ZURvY3VtZW50RnJhZ21lbnRgXG4gICAgICAgICAgICogbWV0aG9kcyBzaG91bGQgYmUgb3ZlcndyaXR0ZW4uXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICAgICAqL1xuICAgICAgICAgICdzaGl2TWV0aG9kcyc6IChvcHRpb25zLnNoaXZNZXRob2RzICE9PSBmYWxzZSksXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBBIHN0cmluZyB0byBkZXNjcmliZSB0aGUgdHlwZSBvZiBgaHRtbDVgIG9iamVjdCAoXCJkZWZhdWx0XCIgb3IgXCJkZWZhdWx0IHByaW50XCIpLlxuICAgICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAgICAgICAqL1xuICAgICAgICAgICd0eXBlJzogJ2RlZmF1bHQnLFxuXG4gICAgICAgICAgLy8gc2hpdnMgdGhlIGRvY3VtZW50IGFjY29yZGluZyB0byB0aGUgc3BlY2lmaWVkIGBodG1sNWAgb2JqZWN0IG9wdGlvbnNcbiAgICAgICAgICAnc2hpdkRvY3VtZW50Jzogc2hpdkRvY3VtZW50LFxuXG4gICAgICAgICAgLy9jcmVhdGVzIGEgc2hpdmVkIGVsZW1lbnRcbiAgICAgICAgICBjcmVhdGVFbGVtZW50OiBjcmVhdGVFbGVtZW50LFxuXG4gICAgICAgICAgLy9jcmVhdGVzIGEgc2hpdmVkIGRvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgICBjcmVhdGVEb2N1bWVudEZyYWdtZW50OiBjcmVhdGVEb2N1bWVudEZyYWdtZW50XG4gICAgICAgIH07XG5cbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAgICAgLy8gZXhwb3NlIGh0bWw1XG4gICAgICAgIHdpbmRvdy5odG1sNSA9IGh0bWw1O1xuXG4gICAgICAgIC8vIHNoaXYgdGhlIGRvY3VtZW50XG4gICAgICAgIHNoaXZEb2N1bWVudChkb2N1bWVudCk7XG5cbiAgICB9KHRoaXMsIGRvY3VtZW50KSk7XG4gICAgLyo+PnNoaXYqL1xuXG4gICAgLy8gQXNzaWduIHByaXZhdGUgcHJvcGVydGllcyB0byB0aGUgcmV0dXJuIG9iamVjdCB3aXRoIHByZWZpeFxuICAgIE1vZGVybml6ci5fdmVyc2lvbiAgICAgID0gdmVyc2lvbjtcblxuICAgIC8vIGV4cG9zZSB0aGVzZSBmb3IgdGhlIHBsdWdpbiBBUEkuIExvb2sgaW4gdGhlIHNvdXJjZSBmb3IgaG93IHRvIGpvaW4oKSB0aGVtIGFnYWluc3QgeW91ciBpbnB1dFxuICAgIC8qPj5wcmVmaXhlcyovXG4gICAgTW9kZXJuaXpyLl9wcmVmaXhlcyAgICAgPSBwcmVmaXhlcztcbiAgICAvKj4+cHJlZml4ZXMqL1xuICAgIC8qPj5kb21wcmVmaXhlcyovXG4gICAgTW9kZXJuaXpyLl9kb21QcmVmaXhlcyAgPSBkb21QcmVmaXhlcztcbiAgICBNb2Rlcm5penIuX2Nzc29tUHJlZml4ZXMgID0gY3Nzb21QcmVmaXhlcztcbiAgICAvKj4+ZG9tcHJlZml4ZXMqL1xuXG4gICAgLyo+Pm1xKi9cbiAgICAvLyBNb2Rlcm5penIubXEgdGVzdHMgYSBnaXZlbiBtZWRpYSBxdWVyeSwgbGl2ZSBhZ2FpbnN0IHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSB3aW5kb3dcbiAgICAvLyBBIGZldyBpbXBvcnRhbnQgbm90ZXM6XG4gICAgLy8gICAqIElmIGEgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IG1lZGlhIHF1ZXJpZXMgYXQgYWxsIChlZy4gb2xkSUUpIHRoZSBtcSgpIHdpbGwgYWx3YXlzIHJldHVybiBmYWxzZVxuICAgIC8vICAgKiBBIG1heC13aWR0aCBvciBvcmllbnRhdGlvbiBxdWVyeSB3aWxsIGJlIGV2YWx1YXRlZCBhZ2FpbnN0IHRoZSBjdXJyZW50IHN0YXRlLCB3aGljaCBtYXkgY2hhbmdlIGxhdGVyLlxuICAgIC8vICAgKiBZb3UgbXVzdCBzcGVjaWZ5IHZhbHVlcy4gRWcuIElmIHlvdSBhcmUgdGVzdGluZyBzdXBwb3J0IGZvciB0aGUgbWluLXdpZHRoIG1lZGlhIHF1ZXJ5IHVzZTpcbiAgICAvLyAgICAgICBNb2Rlcm5penIubXEoJyhtaW4td2lkdGg6MCknKVxuICAgIC8vIHVzYWdlOlxuICAgIC8vIE1vZGVybml6ci5tcSgnb25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6NzY4KScpXG4gICAgTW9kZXJuaXpyLm1xICAgICAgICAgICAgPSB0ZXN0TWVkaWFRdWVyeTtcbiAgICAvKj4+bXEqL1xuXG4gICAgLyo+Pmhhc2V2ZW50Ki9cbiAgICAvLyBNb2Rlcm5penIuaGFzRXZlbnQoKSBkZXRlY3RzIHN1cHBvcnQgZm9yIGEgZ2l2ZW4gZXZlbnQsIHdpdGggYW4gb3B0aW9uYWwgZWxlbWVudCB0byB0ZXN0IG9uXG4gICAgLy8gTW9kZXJuaXpyLmhhc0V2ZW50KCdnZXN0dXJlc3RhcnQnLCBlbGVtKVxuICAgIE1vZGVybml6ci5oYXNFdmVudCAgICAgID0gaXNFdmVudFN1cHBvcnRlZDtcbiAgICAvKj4+aGFzZXZlbnQqL1xuXG4gICAgLyo+PnRlc3Rwcm9wKi9cbiAgICAvLyBNb2Rlcm5penIudGVzdFByb3AoKSBpbnZlc3RpZ2F0ZXMgd2hldGhlciBhIGdpdmVuIHN0eWxlIHByb3BlcnR5IGlzIHJlY29nbml6ZWRcbiAgICAvLyBOb3RlIHRoYXQgdGhlIHByb3BlcnR5IG5hbWVzIG11c3QgYmUgcHJvdmlkZWQgaW4gdGhlIGNhbWVsQ2FzZSB2YXJpYW50LlxuICAgIC8vIE1vZGVybml6ci50ZXN0UHJvcCgncG9pbnRlckV2ZW50cycpXG4gICAgTW9kZXJuaXpyLnRlc3RQcm9wICAgICAgPSBmdW5jdGlvbihwcm9wKXtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wcyhbcHJvcF0pO1xuICAgIH07XG4gICAgLyo+PnRlc3Rwcm9wKi9cblxuICAgIC8qPj50ZXN0YWxscHJvcHMqL1xuICAgIC8vIE1vZGVybml6ci50ZXN0QWxsUHJvcHMoKSBpbnZlc3RpZ2F0ZXMgd2hldGhlciBhIGdpdmVuIHN0eWxlIHByb3BlcnR5LFxuICAgIC8vICAgb3IgYW55IG9mIGl0cyB2ZW5kb3ItcHJlZml4ZWQgdmFyaWFudHMsIGlzIHJlY29nbml6ZWRcbiAgICAvLyBOb3RlIHRoYXQgdGhlIHByb3BlcnR5IG5hbWVzIG11c3QgYmUgcHJvdmlkZWQgaW4gdGhlIGNhbWVsQ2FzZSB2YXJpYW50LlxuICAgIC8vIE1vZGVybml6ci50ZXN0QWxsUHJvcHMoJ2JveFNpemluZycpXG4gICAgTW9kZXJuaXpyLnRlc3RBbGxQcm9wcyAgPSB0ZXN0UHJvcHNBbGw7XG4gICAgLyo+PnRlc3RhbGxwcm9wcyovXG5cblxuICAgIC8qPj50ZXN0c3R5bGVzKi9cbiAgICAvLyBNb2Rlcm5penIudGVzdFN0eWxlcygpIGFsbG93cyB5b3UgdG8gYWRkIGN1c3RvbSBzdHlsZXMgdG8gdGhlIGRvY3VtZW50IGFuZCB0ZXN0IGFuIGVsZW1lbnQgYWZ0ZXJ3YXJkc1xuICAgIC8vIE1vZGVybml6ci50ZXN0U3R5bGVzKCcjbW9kZXJuaXpyIHsgcG9zaXRpb246YWJzb2x1dGUgfScsIGZ1bmN0aW9uKGVsZW0sIHJ1bGUpeyAuLi4gfSlcbiAgICBNb2Rlcm5penIudGVzdFN0eWxlcyAgICA9IGluamVjdEVsZW1lbnRXaXRoU3R5bGVzO1xuICAgIC8qPj50ZXN0c3R5bGVzKi9cblxuXG4gICAgLyo+PnByZWZpeGVkKi9cbiAgICAvLyBNb2Rlcm5penIucHJlZml4ZWQoKSByZXR1cm5zIHRoZSBwcmVmaXhlZCBvciBub25wcmVmaXhlZCBwcm9wZXJ0eSBuYW1lIHZhcmlhbnQgb2YgeW91ciBpbnB1dFxuICAgIC8vIE1vZGVybml6ci5wcmVmaXhlZCgnYm94U2l6aW5nJykgLy8gJ01vekJveFNpemluZydcblxuICAgIC8vIFByb3BlcnRpZXMgbXVzdCBiZSBwYXNzZWQgYXMgZG9tLXN0eWxlIGNhbWVsY2FzZSwgcmF0aGVyIHRoYW4gYGJveC1zaXppbmdgIGh5cGVudGF0ZWQgc3R5bGUuXG4gICAgLy8gUmV0dXJuIHZhbHVlcyB3aWxsIGFsc28gYmUgdGhlIGNhbWVsQ2FzZSB2YXJpYW50LCBpZiB5b3UgbmVlZCB0byB0cmFuc2xhdGUgdGhhdCB0byBoeXBlbmF0ZWQgc3R5bGUgdXNlOlxuICAgIC8vXG4gICAgLy8gICAgIHN0ci5yZXBsYWNlKC8oW0EtWl0pL2csIGZ1bmN0aW9uKHN0cixtMSl7IHJldHVybiAnLScgKyBtMS50b0xvd2VyQ2FzZSgpOyB9KS5yZXBsYWNlKC9ebXMtLywnLW1zLScpO1xuXG4gICAgLy8gSWYgeW91J3JlIHRyeWluZyB0byBhc2NlcnRhaW4gd2hpY2ggdHJhbnNpdGlvbiBlbmQgZXZlbnQgdG8gYmluZCB0bywgeW91IG1pZ2h0IGRvIHNvbWV0aGluZyBsaWtlLi4uXG4gICAgLy9cbiAgICAvLyAgICAgdmFyIHRyYW5zRW5kRXZlbnROYW1lcyA9IHtcbiAgICAvLyAgICAgICAnV2Via2l0VHJhbnNpdGlvbicgOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgLy8gICAgICAgJ01velRyYW5zaXRpb24nICAgIDogJ3RyYW5zaXRpb25lbmQnLFxuICAgIC8vICAgICAgICdPVHJhbnNpdGlvbicgICAgICA6ICdvVHJhbnNpdGlvbkVuZCcsXG4gICAgLy8gICAgICAgJ21zVHJhbnNpdGlvbicgICAgIDogJ01TVHJhbnNpdGlvbkVuZCcsXG4gICAgLy8gICAgICAgJ3RyYW5zaXRpb24nICAgICAgIDogJ3RyYW5zaXRpb25lbmQnXG4gICAgLy8gICAgIH0sXG4gICAgLy8gICAgIHRyYW5zRW5kRXZlbnROYW1lID0gdHJhbnNFbmRFdmVudE5hbWVzWyBNb2Rlcm5penIucHJlZml4ZWQoJ3RyYW5zaXRpb24nKSBdO1xuXG4gICAgTW9kZXJuaXpyLnByZWZpeGVkICAgICAgPSBmdW5jdGlvbihwcm9wLCBvYmosIGVsZW0pe1xuICAgICAgaWYoIW9iaikge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKHByb3AsICdwZngnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRlc3RpbmcgRE9NIHByb3BlcnR5IGUuZy4gTW9kZXJuaXpyLnByZWZpeGVkKCdyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLCB3aW5kb3cpIC8vICdtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwocHJvcCwgb2JqLCBlbGVtKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIC8qPj5wcmVmaXhlZCovXG5cblxuICAgIC8qPj5jc3NjbGFzc2VzKi9cbiAgICAvLyBSZW1vdmUgXCJuby1qc1wiIGNsYXNzIGZyb20gPGh0bWw+IGVsZW1lbnQsIGlmIGl0IGV4aXN0czpcbiAgICBkb2NFbGVtZW50LmNsYXNzTmFtZSA9IGRvY0VsZW1lbnQuY2xhc3NOYW1lLnJlcGxhY2UoLyhefFxccyluby1qcyhcXHN8JCkvLCAnJDEkMicpICtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbmV3IGNsYXNzZXMgdG8gdGhlIDxodG1sPiBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbmFibGVDbGFzc2VzID8gJyBqcyAnICsgY2xhc3Nlcy5qb2luKCcgJykgOiAnJyk7XG4gICAgLyo+PmNzc2NsYXNzZXMqL1xuXG4gICAgcmV0dXJuIE1vZGVybml6cjtcblxufSkodGhpcywgdGhpcy5kb2N1bWVudCk7XG4iLCIvKlxuICogalF1ZXJ5IEZsZXhTbGlkZXIgdjIuMi4yXG4gKiBDb3B5cmlnaHQgMjAxMiBXb29UaGVtZXNcbiAqIENvbnRyaWJ1dGluZyBBdXRob3I6IFR5bGVyIFNtaXRoXG4gKi9cbjtcbihmdW5jdGlvbiAoJCkge1xuXG4gIC8vRmxleFNsaWRlcjogT2JqZWN0IEluc3RhbmNlXG4gICQuZmxleHNsaWRlciA9IGZ1bmN0aW9uKGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIHNsaWRlciA9ICQoZWwpO1xuXG4gICAgLy8gbWFraW5nIHZhcmlhYmxlcyBwdWJsaWNcbiAgICBzbGlkZXIudmFycyA9ICQuZXh0ZW5kKHt9LCAkLmZsZXhzbGlkZXIuZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgdmFyIG5hbWVzcGFjZSA9IHNsaWRlci52YXJzLm5hbWVzcGFjZSxcbiAgICAgICAgbXNHZXN0dXJlID0gd2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgJiYgd2luZG93Lk1TR2VzdHVyZSxcbiAgICAgICAgdG91Y2ggPSAoKCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdyApIHx8IG1zR2VzdHVyZSB8fCB3aW5kb3cuRG9jdW1lbnRUb3VjaCAmJiBkb2N1bWVudCBpbnN0YW5jZW9mIERvY3VtZW50VG91Y2gpICYmIHNsaWRlci52YXJzLnRvdWNoLFxuICAgICAgICAvLyBkZXByaWNhdGluZyB0aGlzIGlkZWEsIGFzIGRldmljZXMgYXJlIGJlaW5nIHJlbGVhc2VkIHdpdGggYm90aCBvZiB0aGVzZSBldmVudHNcbiAgICAgICAgLy9ldmVudFR5cGUgPSAodG91Y2gpID8gXCJ0b3VjaGVuZFwiIDogXCJjbGlja1wiLFxuICAgICAgICBldmVudFR5cGUgPSBcImNsaWNrIHRvdWNoZW5kIE1TUG9pbnRlclVwXCIsXG4gICAgICAgIHdhdGNoZWRFdmVudCA9IFwiXCIsXG4gICAgICAgIHdhdGNoZWRFdmVudENsZWFyVGltZXIsXG4gICAgICAgIHZlcnRpY2FsID0gc2xpZGVyLnZhcnMuZGlyZWN0aW9uID09PSBcInZlcnRpY2FsXCIsXG4gICAgICAgIHJldmVyc2UgPSBzbGlkZXIudmFycy5yZXZlcnNlLFxuICAgICAgICBjYXJvdXNlbCA9IChzbGlkZXIudmFycy5pdGVtV2lkdGggPiAwKSxcbiAgICAgICAgZmFkZSA9IHNsaWRlci52YXJzLmFuaW1hdGlvbiA9PT0gXCJmYWRlXCIsXG4gICAgICAgIGFzTmF2ID0gc2xpZGVyLnZhcnMuYXNOYXZGb3IgIT09IFwiXCIsXG4gICAgICAgIG1ldGhvZHMgPSB7fSxcbiAgICAgICAgZm9jdXNlZCA9IHRydWU7XG5cbiAgICAvLyBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgc2xpZGVyIG9iamVjdFxuICAgICQuZGF0YShlbCwgXCJmbGV4c2xpZGVyXCIsIHNsaWRlcik7XG5cbiAgICAvLyBQcml2YXRlIHNsaWRlciBtZXRob2RzXG4gICAgbWV0aG9kcyA9IHtcbiAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgIC8vIEdldCBjdXJyZW50IHNsaWRlIGFuZCBtYWtlIHN1cmUgaXQgaXMgYSBudW1iZXJcbiAgICAgICAgc2xpZGVyLmN1cnJlbnRTbGlkZSA9IHBhcnNlSW50KCAoIHNsaWRlci52YXJzLnN0YXJ0QXQgPyBzbGlkZXIudmFycy5zdGFydEF0IDogMCksIDEwICk7XG4gICAgICAgIGlmICggaXNOYU4oIHNsaWRlci5jdXJyZW50U2xpZGUgKSApIHNsaWRlci5jdXJyZW50U2xpZGUgPSAwO1xuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nVG8gPSBzbGlkZXIuY3VycmVudFNsaWRlO1xuICAgICAgICBzbGlkZXIuYXRFbmQgPSAoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gMCB8fCBzbGlkZXIuY3VycmVudFNsaWRlID09PSBzbGlkZXIubGFzdCk7XG4gICAgICAgIHNsaWRlci5jb250YWluZXJTZWxlY3RvciA9IHNsaWRlci52YXJzLnNlbGVjdG9yLnN1YnN0cigwLHNsaWRlci52YXJzLnNlbGVjdG9yLnNlYXJjaCgnICcpKTtcbiAgICAgICAgc2xpZGVyLnNsaWRlcyA9ICQoc2xpZGVyLnZhcnMuc2VsZWN0b3IsIHNsaWRlcik7XG4gICAgICAgIHNsaWRlci5jb250YWluZXIgPSAkKHNsaWRlci5jb250YWluZXJTZWxlY3Rvciwgc2xpZGVyKTtcbiAgICAgICAgc2xpZGVyLmNvdW50ID0gc2xpZGVyLnNsaWRlcy5sZW5ndGg7XG4gICAgICAgIC8vIFNZTkM6XG4gICAgICAgIHNsaWRlci5zeW5jRXhpc3RzID0gJChzbGlkZXIudmFycy5zeW5jKS5sZW5ndGggPiAwO1xuICAgICAgICAvLyBTTElERTpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmFuaW1hdGlvbiA9PT0gXCJzbGlkZVwiKSBzbGlkZXIudmFycy5hbmltYXRpb24gPSBcInN3aW5nXCI7XG4gICAgICAgIHNsaWRlci5wcm9wID0gKHZlcnRpY2FsKSA/IFwidG9wXCIgOiBcIm1hcmdpbkxlZnRcIjtcbiAgICAgICAgc2xpZGVyLmFyZ3MgPSB7fTtcbiAgICAgICAgLy8gU0xJREVTSE9XOlxuICAgICAgICBzbGlkZXIubWFudWFsUGF1c2UgPSBmYWxzZTtcbiAgICAgICAgc2xpZGVyLnN0b3BwZWQgPSBmYWxzZTtcbiAgICAgICAgLy9QQVVTRSBXSEVOIElOVklTSUJMRVxuICAgICAgICBzbGlkZXIuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICBzbGlkZXIuc3RhcnRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgLy8gVE9VQ0gvVVNFQ1NTOlxuICAgICAgICBzbGlkZXIudHJhbnNpdGlvbnMgPSAhc2xpZGVyLnZhcnMudmlkZW8gJiYgIWZhZGUgJiYgc2xpZGVyLnZhcnMudXNlQ1NTICYmIChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgb2JqID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgICAgIHByb3BzID0gWydwZXJzcGVjdGl2ZVByb3BlcnR5JywgJ1dlYmtpdFBlcnNwZWN0aXZlJywgJ01velBlcnNwZWN0aXZlJywgJ09QZXJzcGVjdGl2ZScsICdtc1BlcnNwZWN0aXZlJ107XG4gICAgICAgICAgZm9yICh2YXIgaSBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYgKCBvYmouc3R5bGVbIHByb3BzW2ldIF0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgc2xpZGVyLnBmeCA9IHByb3BzW2ldLnJlcGxhY2UoJ1BlcnNwZWN0aXZlJywnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgc2xpZGVyLnByb3AgPSBcIi1cIiArIHNsaWRlci5wZnggKyBcIi10cmFuc2Zvcm1cIjtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSgpKTtcbiAgICAgICAgLy8gQ09OVFJPTFNDT05UQUlORVI6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5jb250cm9sc0NvbnRhaW5lciAhPT0gXCJcIikgc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyID0gJChzbGlkZXIudmFycy5jb250cm9sc0NvbnRhaW5lcikubGVuZ3RoID4gMCAmJiAkKHNsaWRlci52YXJzLmNvbnRyb2xzQ29udGFpbmVyKTtcbiAgICAgICAgLy8gTUFOVUFMOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMubWFudWFsQ29udHJvbHMgIT09IFwiXCIpIHNsaWRlci5tYW51YWxDb250cm9scyA9ICQoc2xpZGVyLnZhcnMubWFudWFsQ29udHJvbHMpLmxlbmd0aCA+IDAgJiYgJChzbGlkZXIudmFycy5tYW51YWxDb250cm9scyk7XG5cbiAgICAgICAgLy8gUkFORE9NSVpFOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMucmFuZG9taXplKSB7XG4gICAgICAgICAgc2xpZGVyLnNsaWRlcy5zb3J0KGZ1bmN0aW9uKCkgeyByZXR1cm4gKE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSktMC41KTsgfSk7XG4gICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5lbXB0eSgpLmFwcGVuZChzbGlkZXIuc2xpZGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNsaWRlci5kb01hdGgoKTtcblxuICAgICAgICAvLyBJTklUXG4gICAgICAgIHNsaWRlci5zZXR1cChcImluaXRcIik7XG5cbiAgICAgICAgLy8gQ09OVFJPTE5BVjpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmNvbnRyb2xOYXYpIG1ldGhvZHMuY29udHJvbE5hdi5zZXR1cCgpO1xuXG4gICAgICAgIC8vIERJUkVDVElPTk5BVjpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmRpcmVjdGlvbk5hdikgbWV0aG9kcy5kaXJlY3Rpb25OYXYuc2V0dXAoKTtcblxuICAgICAgICAvLyBLRVlCT0FSRDpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmtleWJvYXJkICYmICgkKHNsaWRlci5jb250YWluZXJTZWxlY3RvcikubGVuZ3RoID09PSAxIHx8IHNsaWRlci52YXJzLm11bHRpcGxlS2V5Ym9hcmQpKSB7XG4gICAgICAgICAgJChkb2N1bWVudCkuYmluZCgna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIGtleWNvZGUgPSBldmVudC5rZXlDb2RlO1xuICAgICAgICAgICAgaWYgKCFzbGlkZXIuYW5pbWF0aW5nICYmIChrZXljb2RlID09PSAzOSB8fCBrZXljb2RlID09PSAzNykpIHtcbiAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IChrZXljb2RlID09PSAzOSkgPyBzbGlkZXIuZ2V0VGFyZ2V0KCduZXh0JykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKGtleWNvZGUgPT09IDM3KSA/IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKSA6IGZhbHNlO1xuICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBNT1VTRVdIRUVMOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMubW91c2V3aGVlbCkge1xuICAgICAgICAgIHNsaWRlci5iaW5kKCdtb3VzZXdoZWVsJywgZnVuY3Rpb24oZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAoZGVsdGEgPCAwKSA/IHNsaWRlci5nZXRUYXJnZXQoJ25leHQnKSA6IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKTtcbiAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUEFVU0VQTEFZXG4gICAgICAgIGlmIChzbGlkZXIudmFycy5wYXVzZVBsYXkpIG1ldGhvZHMucGF1c2VQbGF5LnNldHVwKCk7XG5cbiAgICAgICAgLy9QQVVTRSBXSEVOIElOVklTSUJMRVxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuc2xpZGVzaG93ICYmIHNsaWRlci52YXJzLnBhdXNlSW52aXNpYmxlKSBtZXRob2RzLnBhdXNlSW52aXNpYmxlLmluaXQoKTtcblxuICAgICAgICAvLyBTTElEU0VTSE9XXG4gICAgICAgIGlmIChzbGlkZXIudmFycy5zbGlkZXNob3cpIHtcbiAgICAgICAgICBpZiAoc2xpZGVyLnZhcnMucGF1c2VPbkhvdmVyKSB7XG4gICAgICAgICAgICBzbGlkZXIuaG92ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGlmICghc2xpZGVyLm1hbnVhbFBsYXkgJiYgIXNsaWRlci5tYW51YWxQYXVzZSkgc2xpZGVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKCFzbGlkZXIubWFudWFsUGF1c2UgJiYgIXNsaWRlci5tYW51YWxQbGF5ICYmICFzbGlkZXIuc3RvcHBlZCkgc2xpZGVyLnBsYXkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBpbml0aWFsaXplIGFuaW1hdGlvblxuICAgICAgICAgIC8vSWYgd2UncmUgdmlzaWJsZSwgb3Igd2UgZG9uJ3QgdXNlIFBhZ2VWaXNpYmlsaXR5IEFQSVxuICAgICAgICAgIGlmKCFzbGlkZXIudmFycy5wYXVzZUludmlzaWJsZSB8fCAhbWV0aG9kcy5wYXVzZUludmlzaWJsZS5pc0hpZGRlbigpKSB7XG4gICAgICAgICAgICAoc2xpZGVyLnZhcnMuaW5pdERlbGF5ID4gMCkgPyBzbGlkZXIuc3RhcnRUaW1lb3V0ID0gc2V0VGltZW91dChzbGlkZXIucGxheSwgc2xpZGVyLnZhcnMuaW5pdERlbGF5KSA6IHNsaWRlci5wbGF5KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQVNOQVY6XG4gICAgICAgIGlmIChhc05hdikgbWV0aG9kcy5hc05hdi5zZXR1cCgpO1xuXG4gICAgICAgIC8vIFRPVUNIXG4gICAgICAgIGlmICh0b3VjaCAmJiBzbGlkZXIudmFycy50b3VjaCkgbWV0aG9kcy50b3VjaCgpO1xuXG4gICAgICAgIC8vIEZBREUmJlNNT09USEhFSUdIVCB8fCBTTElERTpcbiAgICAgICAgaWYgKCFmYWRlIHx8IChmYWRlICYmIHNsaWRlci52YXJzLnNtb290aEhlaWdodCkpICQod2luZG93KS5iaW5kKFwicmVzaXplIG9yaWVudGF0aW9uY2hhbmdlIGZvY3VzXCIsIG1ldGhvZHMucmVzaXplKTtcblxuICAgICAgICBzbGlkZXIuZmluZChcImltZ1wiKS5hdHRyKFwiZHJhZ2dhYmxlXCIsIFwiZmFsc2VcIik7XG5cbiAgICAgICAgLy8gQVBJOiBzdGFydCgpIENhbGxiYWNrXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICBzbGlkZXIudmFycy5zdGFydChzbGlkZXIpO1xuICAgICAgICB9LCAyMDApO1xuICAgICAgfSxcbiAgICAgIGFzTmF2OiB7XG4gICAgICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzbGlkZXIuYXNOYXYgPSB0cnVlO1xuICAgICAgICAgIHNsaWRlci5hbmltYXRpbmdUbyA9IE1hdGguZmxvb3Ioc2xpZGVyLmN1cnJlbnRTbGlkZS9zbGlkZXIubW92ZSk7XG4gICAgICAgICAgc2xpZGVyLmN1cnJlbnRJdGVtID0gc2xpZGVyLmN1cnJlbnRTbGlkZTtcbiAgICAgICAgICBzbGlkZXIuc2xpZGVzLnJlbW92ZUNsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpLmVxKHNsaWRlci5jdXJyZW50SXRlbSkuYWRkQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIik7XG4gICAgICAgICAgaWYoIW1zR2VzdHVyZSl7XG4gICAgICAgICAgICAgIHNsaWRlci5zbGlkZXMub24oZXZlbnRUeXBlLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdmFyICRzbGlkZSA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9ICRzbGlkZS5pbmRleCgpO1xuICAgICAgICAgICAgICAgIHZhciBwb3NGcm9tTGVmdCA9ICRzbGlkZS5vZmZzZXQoKS5sZWZ0IC0gJChzbGlkZXIpLnNjcm9sbExlZnQoKTsgLy8gRmluZCBwb3NpdGlvbiBvZiBzbGlkZSByZWxhdGl2ZSB0byBsZWZ0IG9mIHNsaWRlciBjb250YWluZXJcbiAgICAgICAgICAgICAgICBpZiggcG9zRnJvbUxlZnQgPD0gMCAmJiAkc2xpZGUuaGFzQ2xhc3MoIG5hbWVzcGFjZSArICdhY3RpdmUtc2xpZGUnICkgKSB7XG4gICAgICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUoc2xpZGVyLmdldFRhcmdldChcInByZXZcIiksIHRydWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISQoc2xpZGVyLnZhcnMuYXNOYXZGb3IpLmRhdGEoJ2ZsZXhzbGlkZXInKS5hbmltYXRpbmcgJiYgISRzbGlkZS5oYXNDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKSkge1xuICAgICAgICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9IChzbGlkZXIuY3VycmVudEl0ZW0gPCB0YXJnZXQpID8gXCJuZXh0XCIgOiBcInByZXZcIjtcbiAgICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIGZhbHNlLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBlbC5fc2xpZGVyID0gc2xpZGVyO1xuICAgICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmVhY2goZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICB0aGF0Ll9nZXN0dXJlID0gbmV3IE1TR2VzdHVyZSgpO1xuICAgICAgICAgICAgICAgICAgdGhhdC5fZ2VzdHVyZS50YXJnZXQgPSB0aGF0O1xuICAgICAgICAgICAgICAgICAgdGhhdC5hZGRFdmVudExpc3RlbmVyKFwiTVNQb2ludGVyRG93blwiLCBmdW5jdGlvbiAoZSl7XG4gICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmKGUuY3VycmVudFRhcmdldC5fZ2VzdHVyZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0Ll9nZXN0dXJlLmFkZFBvaW50ZXIoZS5wb2ludGVySWQpO1xuICAgICAgICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgdGhhdC5hZGRFdmVudExpc3RlbmVyKFwiTVNHZXN0dXJlVGFwXCIsIGZ1bmN0aW9uIChlKXtcbiAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgdmFyICRzbGlkZSA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldCA9ICRzbGlkZS5pbmRleCgpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmICghJChzbGlkZXIudmFycy5hc05hdkZvcikuZGF0YSgnZmxleHNsaWRlcicpLmFuaW1hdGluZyAmJiAhJHNsaWRlLmhhc0NsYXNzKCdhY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uID0gKHNsaWRlci5jdXJyZW50SXRlbSA8IHRhcmdldCkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uLCBmYWxzZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNvbnRyb2xOYXY6IHtcbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICghc2xpZGVyLm1hbnVhbENvbnRyb2xzKSB7XG4gICAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYuc2V0dXBQYWdpbmcoKTtcbiAgICAgICAgICB9IGVsc2UgeyAvLyBNQU5VQUxDT05UUk9MUzpcbiAgICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi5zZXR1cE1hbnVhbCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0dXBQYWdpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciB0eXBlID0gKHNsaWRlci52YXJzLmNvbnRyb2xOYXYgPT09IFwidGh1bWJuYWlsc1wiKSA/ICdjb250cm9sLXRodW1icycgOiAnY29udHJvbC1wYWdpbmcnLFxuICAgICAgICAgICAgICBqID0gMSxcbiAgICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgICAgc2xpZGU7XG5cbiAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkID0gJCgnPG9sIGNsYXNzPVwiJysgbmFtZXNwYWNlICsgJ2NvbnRyb2wtbmF2ICcgKyBuYW1lc3BhY2UgKyB0eXBlICsgJ1wiPjwvb2w+Jyk7XG5cbiAgICAgICAgICBpZiAoc2xpZGVyLnBhZ2luZ0NvdW50ID4gMSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGlkZXIucGFnaW5nQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICBzbGlkZSA9IHNsaWRlci5zbGlkZXMuZXEoaSk7XG4gICAgICAgICAgICAgIGl0ZW0gPSAoc2xpZGVyLnZhcnMuY29udHJvbE5hdiA9PT0gXCJ0aHVtYm5haWxzXCIpID8gJzxpbWcgc3JjPVwiJyArIHNsaWRlLmF0dHIoICdkYXRhLXRodW1iJyApICsgJ1wiLz4nIDogJzxhPicgKyBqICsgJzwvYT4nO1xuICAgICAgICAgICAgICBpZiAoICd0aHVtYm5haWxzJyA9PT0gc2xpZGVyLnZhcnMuY29udHJvbE5hdiAmJiB0cnVlID09PSBzbGlkZXIudmFycy50aHVtYkNhcHRpb25zICkge1xuICAgICAgICAgICAgICAgIHZhciBjYXB0biA9IHNsaWRlLmF0dHIoICdkYXRhLXRodW1iY2FwdGlvbicgKTtcbiAgICAgICAgICAgICAgICBpZiAoICcnICE9IGNhcHRuICYmIHVuZGVmaW5lZCAhPSBjYXB0biApIGl0ZW0gKz0gJzxzcGFuIGNsYXNzPVwiJyArIG5hbWVzcGFjZSArICdjYXB0aW9uXCI+JyArIGNhcHRuICsgJzwvc3Bhbj4nO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQuYXBwZW5kKCc8bGk+JyArIGl0ZW0gKyAnPC9saT4nKTtcbiAgICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENPTlRST0xTQ09OVEFJTkVSOlxuICAgICAgICAgIChzbGlkZXIuY29udHJvbHNDb250YWluZXIpID8gJChzbGlkZXIuY29udHJvbHNDb250YWluZXIpLmFwcGVuZChzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkKSA6IHNsaWRlci5hcHBlbmQoc2xpZGVyLmNvbnRyb2xOYXZTY2FmZm9sZCk7XG4gICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LnNldCgpO1xuXG4gICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LmFjdGl2ZSgpO1xuXG4gICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXZTY2FmZm9sZC5kZWxlZ2F0ZSgnYSwgaW1nJywgZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIiB8fCB3YXRjaGVkRXZlbnQgPT09IGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHNsaWRlci5jb250cm9sTmF2LmluZGV4KCR0aGlzKTtcblxuICAgICAgICAgICAgICBpZiAoISR0aGlzLmhhc0NsYXNzKG5hbWVzcGFjZSArICdhY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb24gPSAodGFyZ2V0ID4gc2xpZGVyLmN1cnJlbnRTbGlkZSkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNldHVwIGZsYWdzIHRvIHByZXZlbnQgZXZlbnQgZHVwbGljYXRpb25cbiAgICAgICAgICAgIGlmICh3YXRjaGVkRXZlbnQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgd2F0Y2hlZEV2ZW50ID0gZXZlbnQudHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1ldGhvZHMuc2V0VG9DbGVhcldhdGNoZWRFdmVudCgpO1xuXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldHVwTWFudWFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdiA9IHNsaWRlci5tYW51YWxDb250cm9scztcbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYuYWN0aXZlKCk7XG5cbiAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdi5iaW5kKGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGlmICh3YXRjaGVkRXZlbnQgPT09IFwiXCIgfHwgd2F0Y2hlZEV2ZW50ID09PSBldmVudC50eXBlKSB7XG4gICAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgICB0YXJnZXQgPSBzbGlkZXIuY29udHJvbE5hdi5pbmRleCgkdGhpcyk7XG5cbiAgICAgICAgICAgICAgaWYgKCEkdGhpcy5oYXNDbGFzcyhuYW1lc3BhY2UgKyAnYWN0aXZlJykpIHtcbiAgICAgICAgICAgICAgICAodGFyZ2V0ID4gc2xpZGVyLmN1cnJlbnRTbGlkZSkgPyBzbGlkZXIuZGlyZWN0aW9uID0gXCJuZXh0XCIgOiBzbGlkZXIuZGlyZWN0aW9uID0gXCJwcmV2XCI7XG4gICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2V0dXAgZmxhZ3MgdG8gcHJldmVudCBldmVudCBkdXBsaWNhdGlvblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBldmVudC50eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWV0aG9kcy5zZXRUb0NsZWFyV2F0Y2hlZEV2ZW50KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHNlbGVjdG9yID0gKHNsaWRlci52YXJzLmNvbnRyb2xOYXYgPT09IFwidGh1bWJuYWlsc1wiKSA/ICdpbWcnIDogJ2EnO1xuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2ID0gJCgnLicgKyBuYW1lc3BhY2UgKyAnY29udHJvbC1uYXYgbGkgJyArIHNlbGVjdG9yLCAoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKSA/IHNsaWRlci5jb250cm9sc0NvbnRhaW5lciA6IHNsaWRlcik7XG4gICAgICAgIH0sXG4gICAgICAgIGFjdGl2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXYucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmVcIikuZXEoc2xpZGVyLmFuaW1hdGluZ1RvKS5hZGRDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZVwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihhY3Rpb24sIHBvcykge1xuICAgICAgICAgIGlmIChzbGlkZXIucGFnaW5nQ291bnQgPiAxICYmIGFjdGlvbiA9PT0gXCJhZGRcIikge1xuICAgICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXZTY2FmZm9sZC5hcHBlbmQoJCgnPGxpPjxhPicgKyBzbGlkZXIuY291bnQgKyAnPC9hPjwvbGk+JykpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2xpZGVyLnBhZ2luZ0NvdW50ID09PSAxKSB7XG4gICAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkLmZpbmQoJ2xpJykucmVtb3ZlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2LmVxKHBvcykuY2xvc2VzdCgnbGknKS5yZW1vdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LnNldCgpO1xuICAgICAgICAgIChzbGlkZXIucGFnaW5nQ291bnQgPiAxICYmIHNsaWRlci5wYWdpbmdDb3VudCAhPT0gc2xpZGVyLmNvbnRyb2xOYXYubGVuZ3RoKSA/IHNsaWRlci51cGRhdGUocG9zLCBhY3Rpb24pIDogbWV0aG9kcy5jb250cm9sTmF2LmFjdGl2ZSgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZGlyZWN0aW9uTmF2OiB7XG4gICAgICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgZGlyZWN0aW9uTmF2U2NhZmZvbGQgPSAkKCc8dWwgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ2RpcmVjdGlvbi1uYXZcIj48bGk+PGEgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ3ByZXZcIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtY2hldnJvbi1sZWZ0XCI+PC9pPjwvYT48L2xpPjxsaT48YSBjbGFzcz1cIicgKyBuYW1lc3BhY2UgKyAnbmV4dFwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS1jaGV2cm9uLXJpZ2h0XCI+PC9pPjwvYT48L2xpPjwvdWw+Jyk7XG5cbiAgICAgICAgICAvLyBDT05UUk9MU0NPTlRBSU5FUjpcbiAgICAgICAgICBpZiAoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAkKHNsaWRlci5jb250cm9sc0NvbnRhaW5lcikuYXBwZW5kKGRpcmVjdGlvbk5hdlNjYWZmb2xkKTtcbiAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYgPSAkKCcuJyArIG5hbWVzcGFjZSArICdkaXJlY3Rpb24tbmF2IGxpIGEnLCBzbGlkZXIuY29udHJvbHNDb250YWluZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuYXBwZW5kKGRpcmVjdGlvbk5hdlNjYWZmb2xkKTtcbiAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYgPSAkKCcuJyArIG5hbWVzcGFjZSArICdkaXJlY3Rpb24tbmF2IGxpIGEnLCBzbGlkZXIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG1ldGhvZHMuZGlyZWN0aW9uTmF2LnVwZGF0ZSgpO1xuXG4gICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdi5iaW5kKGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0O1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiIHx8IHdhdGNoZWRFdmVudCA9PT0gZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICB0YXJnZXQgPSAoJCh0aGlzKS5oYXNDbGFzcyhuYW1lc3BhY2UgKyAnbmV4dCcpKSA/IHNsaWRlci5nZXRUYXJnZXQoJ25leHQnKSA6IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKTtcbiAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNldHVwIGZsYWdzIHRvIHByZXZlbnQgZXZlbnQgZHVwbGljYXRpb25cbiAgICAgICAgICAgIGlmICh3YXRjaGVkRXZlbnQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgd2F0Y2hlZEV2ZW50ID0gZXZlbnQudHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1ldGhvZHMuc2V0VG9DbGVhcldhdGNoZWRFdmVudCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBkaXNhYmxlZENsYXNzID0gbmFtZXNwYWNlICsgJ2Rpc2FibGVkJztcbiAgICAgICAgICBpZiAoc2xpZGVyLnBhZ2luZ0NvdW50ID09PSAxKSB7XG4gICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LmFkZENsYXNzKGRpc2FibGVkQ2xhc3MpLmF0dHIoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgICAgfSBlbHNlIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkge1xuICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmdUbyA9PT0gMCkge1xuICAgICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LnJlbW92ZUNsYXNzKGRpc2FibGVkQ2xhc3MpLmZpbHRlcignLicgKyBuYW1lc3BhY2UgKyBcInByZXZcIikuYWRkQ2xhc3MoZGlzYWJsZWRDbGFzcykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCkge1xuICAgICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LnJlbW92ZUNsYXNzKGRpc2FibGVkQ2xhc3MpLmZpbHRlcignLicgKyBuYW1lc3BhY2UgKyBcIm5leHRcIikuYWRkQ2xhc3MoZGlzYWJsZWRDbGFzcykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYucmVtb3ZlQ2xhc3MoZGlzYWJsZWRDbGFzcykucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdi5yZW1vdmVDbGFzcyhkaXNhYmxlZENsYXNzKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHBhdXNlUGxheToge1xuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHBhdXNlUGxheVNjYWZmb2xkID0gJCgnPGRpdiBjbGFzcz1cIicgKyBuYW1lc3BhY2UgKyAncGF1c2VwbGF5XCI+PGE+PC9hPjwvZGl2PicpO1xuXG4gICAgICAgICAgLy8gQ09OVFJPTFNDT05UQUlORVI6XG4gICAgICAgICAgaWYgKHNsaWRlci5jb250cm9sc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyLmFwcGVuZChwYXVzZVBsYXlTY2FmZm9sZCk7XG4gICAgICAgICAgICBzbGlkZXIucGF1c2VQbGF5ID0gJCgnLicgKyBuYW1lc3BhY2UgKyAncGF1c2VwbGF5IGEnLCBzbGlkZXIuY29udHJvbHNDb250YWluZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuYXBwZW5kKHBhdXNlUGxheVNjYWZmb2xkKTtcbiAgICAgICAgICAgIHNsaWRlci5wYXVzZVBsYXkgPSAkKCcuJyArIG5hbWVzcGFjZSArICdwYXVzZXBsYXkgYScsIHNsaWRlcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbWV0aG9kcy5wYXVzZVBsYXkudXBkYXRlKChzbGlkZXIudmFycy5zbGlkZXNob3cpID8gbmFtZXNwYWNlICsgJ3BhdXNlJyA6IG5hbWVzcGFjZSArICdwbGF5Jyk7XG5cbiAgICAgICAgICBzbGlkZXIucGF1c2VQbGF5LmJpbmQoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIiB8fCB3YXRjaGVkRXZlbnQgPT09IGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MobmFtZXNwYWNlICsgJ3BhdXNlJykpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXIubWFudWFsUGF1c2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNsaWRlci5tYW51YWxQbGF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc2xpZGVyLnBhdXNlKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2xpZGVyLm1hbnVhbFBhdXNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc2xpZGVyLm1hbnVhbFBsYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNsaWRlci5wbGF5KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2V0dXAgZmxhZ3MgdG8gcHJldmVudCBldmVudCBkdXBsaWNhdGlvblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBldmVudC50eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWV0aG9kcy5zZXRUb0NsZWFyV2F0Y2hlZEV2ZW50KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgICAoc3RhdGUgPT09IFwicGxheVwiKSA/IHNsaWRlci5wYXVzZVBsYXkucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgJ3BhdXNlJykuYWRkQ2xhc3MobmFtZXNwYWNlICsgJ3BsYXknKS5odG1sKHNsaWRlci52YXJzLnBsYXlUZXh0KSA6IHNsaWRlci5wYXVzZVBsYXkucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgJ3BsYXknKS5hZGRDbGFzcyhuYW1lc3BhY2UgKyAncGF1c2UnKS5odG1sKHNsaWRlci52YXJzLnBhdXNlVGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB0b3VjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGFydFgsXG4gICAgICAgICAgc3RhcnRZLFxuICAgICAgICAgIG9mZnNldCxcbiAgICAgICAgICBjd2lkdGgsXG4gICAgICAgICAgZHgsXG4gICAgICAgICAgc3RhcnRULFxuICAgICAgICAgIHNjcm9sbGluZyA9IGZhbHNlLFxuICAgICAgICAgIGxvY2FsWCA9IDAsXG4gICAgICAgICAgbG9jYWxZID0gMCxcbiAgICAgICAgICBhY2NEeCA9IDA7XG5cbiAgICAgICAgaWYoIW1zR2VzdHVyZSl7XG4gICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgICAgICAgICAgIGlmIChzbGlkZXIuYW5pbWF0aW5nKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCAoIHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCApIHx8IGUudG91Y2hlcy5sZW5ndGggPT09IDEgKSB7XG4gICAgICAgICAgICAgICAgc2xpZGVyLnBhdXNlKCk7XG4gICAgICAgICAgICAgICAgLy8gQ0FST1VTRUw6XG4gICAgICAgICAgICAgICAgY3dpZHRoID0gKHZlcnRpY2FsKSA/IHNsaWRlci5oIDogc2xpZGVyLiB3O1xuICAgICAgICAgICAgICAgIHN0YXJ0VCA9IE51bWJlcihuZXcgRGF0ZSgpKTtcbiAgICAgICAgICAgICAgICAvLyBDQVJPVVNFTDpcblxuICAgICAgICAgICAgICAgIC8vIExvY2FsIHZhcnMgZm9yIFggYW5kIFkgcG9pbnRzLlxuICAgICAgICAgICAgICAgIGxvY2FsWCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgICAgICBsb2NhbFkgPSBlLnRvdWNoZXNbMF0ucGFnZVk7XG5cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSAoY2Fyb3VzZWwgJiYgcmV2ZXJzZSAmJiBzbGlkZXIuYW5pbWF0aW5nVG8gPT09IHNsaWRlci5sYXN0KSA/IDAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIChjYXJvdXNlbCAmJiByZXZlcnNlKSA/IHNsaWRlci5saW1pdCAtICgoKHNsaWRlci5pdGVtVyArIHNsaWRlci52YXJzLml0ZW1NYXJnaW4pICogc2xpZGVyLm1vdmUpICogc2xpZGVyLmFuaW1hdGluZ1RvKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsICYmIHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0KSA/IHNsaWRlci5saW1pdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsKSA/ICgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuY3VycmVudFNsaWRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAocmV2ZXJzZSkgPyAoc2xpZGVyLmxhc3QgLSBzbGlkZXIuY3VycmVudFNsaWRlICsgc2xpZGVyLmNsb25lT2Zmc2V0KSAqIGN3aWR0aCA6IChzbGlkZXIuY3VycmVudFNsaWRlICsgc2xpZGVyLmNsb25lT2Zmc2V0KSAqIGN3aWR0aDtcbiAgICAgICAgICAgICAgICBzdGFydFggPSAodmVydGljYWwpID8gbG9jYWxZIDogbG9jYWxYO1xuICAgICAgICAgICAgICAgIHN0YXJ0WSA9ICh2ZXJ0aWNhbCkgPyBsb2NhbFggOiBsb2NhbFk7XG5cbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKGUpIHtcbiAgICAgICAgICAgICAgLy8gTG9jYWwgdmFycyBmb3IgWCBhbmQgWSBwb2ludHMuXG5cbiAgICAgICAgICAgICAgbG9jYWxYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgICAgICBsb2NhbFkgPSBlLnRvdWNoZXNbMF0ucGFnZVk7XG5cbiAgICAgICAgICAgICAgZHggPSAodmVydGljYWwpID8gc3RhcnRYIC0gbG9jYWxZIDogc3RhcnRYIC0gbG9jYWxYO1xuICAgICAgICAgICAgICBzY3JvbGxpbmcgPSAodmVydGljYWwpID8gKE1hdGguYWJzKGR4KSA8IE1hdGguYWJzKGxvY2FsWCAtIHN0YXJ0WSkpIDogKE1hdGguYWJzKGR4KSA8IE1hdGguYWJzKGxvY2FsWSAtIHN0YXJ0WSkpO1xuXG4gICAgICAgICAgICAgIHZhciBmeG1zID0gNTAwO1xuXG4gICAgICAgICAgICAgIGlmICggISBzY3JvbGxpbmcgfHwgTnVtYmVyKCBuZXcgRGF0ZSgpICkgLSBzdGFydFQgPiBmeG1zICkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZhZGUgJiYgc2xpZGVyLnRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIXNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgZHggPSBkeC8oKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgZHggPCAwIHx8IHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0ICYmIGR4ID4gMCkgPyAoTWF0aC5hYnMoZHgpL2N3aWR0aCsyKSA6IDEpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKG9mZnNldCArIGR4LCBcInNldFRvdWNoXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvblRvdWNoRW5kKGUpIHtcbiAgICAgICAgICAgICAgLy8gZmluaXNoIHRoZSB0b3VjaCBieSB1bmRvaW5nIHRoZSB0b3VjaCBzZXNzaW9uXG4gICAgICAgICAgICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmN1cnJlbnRTbGlkZSAmJiAhc2Nyb2xsaW5nICYmICEoZHggPT09IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVwZGF0ZUR4ID0gKHJldmVyc2UpID8gLWR4IDogZHgsXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9ICh1cGRhdGVEeCA+IDApID8gc2xpZGVyLmdldFRhcmdldCgnbmV4dCcpIDogc2xpZGVyLmdldFRhcmdldCgncHJldicpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNsaWRlci5jYW5BZHZhbmNlKHRhcmdldCkgJiYgKE51bWJlcihuZXcgRGF0ZSgpKSAtIHN0YXJ0VCA8IDU1MCAmJiBNYXRoLmFicyh1cGRhdGVEeCkgPiA1MCB8fCBNYXRoLmFicyh1cGRhdGVEeCkgPiBjd2lkdGgvMikpIHtcbiAgICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWZhZGUpIHNsaWRlci5mbGV4QW5pbWF0ZShzbGlkZXIuY3VycmVudFNsaWRlLCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgc3RhcnRYID0gbnVsbDtcbiAgICAgICAgICAgICAgc3RhcnRZID0gbnVsbDtcbiAgICAgICAgICAgICAgZHggPSBudWxsO1xuICAgICAgICAgICAgICBvZmZzZXQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVsLnN0eWxlLm1zVG91Y2hBY3Rpb24gPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGVsLl9nZXN0dXJlID0gbmV3IE1TR2VzdHVyZSgpO1xuICAgICAgICAgICAgZWwuX2dlc3R1cmUudGFyZ2V0ID0gZWw7XG4gICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiTVNQb2ludGVyRG93blwiLCBvbk1TUG9pbnRlckRvd24sIGZhbHNlKTtcbiAgICAgICAgICAgIGVsLl9zbGlkZXIgPSBzbGlkZXI7XG4gICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiTVNHZXN0dXJlQ2hhbmdlXCIsIG9uTVNHZXN0dXJlQ2hhbmdlLCBmYWxzZSk7XG4gICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiTVNHZXN0dXJlRW5kXCIsIG9uTVNHZXN0dXJlRW5kLCBmYWxzZSk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uTVNQb2ludGVyRG93bihlKXtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChzbGlkZXIuYW5pbWF0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyLnBhdXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGVsLl9nZXN0dXJlLmFkZFBvaW50ZXIoZS5wb2ludGVySWQpO1xuICAgICAgICAgICAgICAgICAgICBhY2NEeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGN3aWR0aCA9ICh2ZXJ0aWNhbCkgPyBzbGlkZXIuaCA6IHNsaWRlci4gdztcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgICAgICAgICAgICAgICAgICAvLyBDQVJPVVNFTDpcblxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAoY2Fyb3VzZWwgJiYgcmV2ZXJzZSAmJiBzbGlkZXIuYW5pbWF0aW5nVG8gPT09IHNsaWRlci5sYXN0KSA/IDAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsICYmIHJldmVyc2UpID8gc2xpZGVyLmxpbWl0IC0gKCgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwgJiYgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpID8gc2xpZGVyLmxpbWl0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsKSA/ICgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuY3VycmVudFNsaWRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChyZXZlcnNlKSA/IChzbGlkZXIubGFzdCAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoIDogKHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gb25NU0dlc3R1cmVDaGFuZ2UoZSkge1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNsaWRlciA9IGUudGFyZ2V0Ll9zbGlkZXI7XG4gICAgICAgICAgICAgICAgaWYoIXNsaWRlcil7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zWCA9IC1lLnRyYW5zbGF0aW9uWCxcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNZID0gLWUudHJhbnNsYXRpb25ZO1xuXG4gICAgICAgICAgICAgICAgLy9BY2N1bXVsYXRlIHRyYW5zbGF0aW9ucy5cbiAgICAgICAgICAgICAgICBhY2NEeCA9IGFjY0R4ICsgKCh2ZXJ0aWNhbCkgPyB0cmFuc1kgOiB0cmFuc1gpO1xuICAgICAgICAgICAgICAgIGR4ID0gYWNjRHg7XG4gICAgICAgICAgICAgICAgc2Nyb2xsaW5nID0gKHZlcnRpY2FsKSA/IChNYXRoLmFicyhhY2NEeCkgPCBNYXRoLmFicygtdHJhbnNYKSkgOiAoTWF0aC5hYnMoYWNjRHgpIDwgTWF0aC5hYnMoLXRyYW5zWSkpO1xuXG4gICAgICAgICAgICAgICAgaWYoZS5kZXRhaWwgPT09IGUuTVNHRVNUVVJFX0ZMQUdfSU5FUlRJQSl7XG4gICAgICAgICAgICAgICAgICAgIHNldEltbWVkaWF0ZShmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLl9nZXN0dXJlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghc2Nyb2xsaW5nIHx8IE51bWJlcihuZXcgRGF0ZSgpKSAtIHN0YXJ0VCA+IDUwMCkge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZmFkZSAmJiBzbGlkZXIudHJhbnNpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ID0gYWNjRHggLyAoKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgYWNjRHggPCAwIHx8IHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0ICYmIGFjY0R4ID4gMCkgPyAoTWF0aC5hYnMoYWNjRHgpIC8gY3dpZHRoICsgMikgOiAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlci5zZXRQcm9wcyhvZmZzZXQgKyBkeCwgXCJzZXRUb3VjaFwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gb25NU0dlc3R1cmVFbmQoZSkge1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNsaWRlciA9IGUudGFyZ2V0Ll9zbGlkZXI7XG4gICAgICAgICAgICAgICAgaWYoIXNsaWRlcil7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmN1cnJlbnRTbGlkZSAmJiAhc2Nyb2xsaW5nICYmICEoZHggPT09IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cGRhdGVEeCA9IChyZXZlcnNlKSA/IC1keCA6IGR4LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gKHVwZGF0ZUR4ID4gMCkgPyBzbGlkZXIuZ2V0VGFyZ2V0KCduZXh0JykgOiBzbGlkZXIuZ2V0VGFyZ2V0KCdwcmV2Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsaWRlci5jYW5BZHZhbmNlKHRhcmdldCkgJiYgKE51bWJlcihuZXcgRGF0ZSgpKSAtIHN0YXJ0VCA8IDU1MCAmJiBNYXRoLmFicyh1cGRhdGVEeCkgPiA1MCB8fCBNYXRoLmFicyh1cGRhdGVEeCkgPiBjd2lkdGgvMikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmYWRlKSBzbGlkZXIuZmxleEFuaW1hdGUoc2xpZGVyLmN1cnJlbnRTbGlkZSwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdGFydFggPSBudWxsO1xuICAgICAgICAgICAgICAgIHN0YXJ0WSA9IG51bGw7XG4gICAgICAgICAgICAgICAgZHggPSBudWxsO1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IG51bGw7XG4gICAgICAgICAgICAgICAgYWNjRHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcmVzaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFzbGlkZXIuYW5pbWF0aW5nICYmIHNsaWRlci5pcygnOnZpc2libGUnKSkge1xuICAgICAgICAgIGlmICghY2Fyb3VzZWwpIHNsaWRlci5kb01hdGgoKTtcblxuICAgICAgICAgIGlmIChmYWRlKSB7XG4gICAgICAgICAgICAvLyBTTU9PVEggSEVJR0hUOlxuICAgICAgICAgICAgbWV0aG9kcy5zbW9vdGhIZWlnaHQoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNhcm91c2VsKSB7IC8vQ0FST1VTRUw6XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLndpZHRoKHNsaWRlci5jb21wdXRlZFcpO1xuICAgICAgICAgICAgc2xpZGVyLnVwZGF0ZShzbGlkZXIucGFnaW5nQ291bnQpO1xuICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHZlcnRpY2FsKSB7IC8vVkVSVElDQUw6XG4gICAgICAgICAgICBzbGlkZXIudmlld3BvcnQuaGVpZ2h0KHNsaWRlci5oKTtcbiAgICAgICAgICAgIHNsaWRlci5zZXRQcm9wcyhzbGlkZXIuaCwgXCJzZXRUb3RhbFwiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gU01PT1RIIEhFSUdIVDpcbiAgICAgICAgICAgIGlmIChzbGlkZXIudmFycy5zbW9vdGhIZWlnaHQpIG1ldGhvZHMuc21vb3RoSGVpZ2h0KCk7XG4gICAgICAgICAgICBzbGlkZXIubmV3U2xpZGVzLndpZHRoKHNsaWRlci5jb21wdXRlZFcpO1xuICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKHNsaWRlci5jb21wdXRlZFcsIFwic2V0VG90YWxcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc21vb3RoSGVpZ2h0OiBmdW5jdGlvbihkdXIpIHtcbiAgICAgICAgaWYgKCF2ZXJ0aWNhbCB8fCBmYWRlKSB7XG4gICAgICAgICAgdmFyICRvYmogPSAoZmFkZSkgPyBzbGlkZXIgOiBzbGlkZXIudmlld3BvcnQ7XG4gICAgICAgICAgKGR1cikgPyAkb2JqLmFuaW1hdGUoe1wiaGVpZ2h0XCI6IHNsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmFuaW1hdGluZ1RvKS5oZWlnaHQoKX0sIGR1cikgOiAkb2JqLmhlaWdodChzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5hbmltYXRpbmdUbykuaGVpZ2h0KCkpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc3luYzogZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgIHZhciAkb2JqID0gJChzbGlkZXIudmFycy5zeW5jKS5kYXRhKFwiZmxleHNsaWRlclwiKSxcbiAgICAgICAgICAgIHRhcmdldCA9IHNsaWRlci5hbmltYXRpbmdUbztcblxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgIGNhc2UgXCJhbmltYXRlXCI6ICRvYmouZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uLCBmYWxzZSwgdHJ1ZSk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJwbGF5XCI6IGlmICghJG9iai5wbGF5aW5nICYmICEkb2JqLmFzTmF2KSB7ICRvYmoucGxheSgpOyB9IGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJwYXVzZVwiOiAkb2JqLnBhdXNlKCk7IGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdW5pcXVlSUQ6IGZ1bmN0aW9uKCRjbG9uZSkge1xuICAgICAgICAkY2xvbmUuZmluZCggJ1tpZF0nICkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICR0aGlzLmF0dHIoICdpZCcsICR0aGlzLmF0dHIoICdpZCcgKSArICdfY2xvbmUnICk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gJGNsb25lO1xuICAgICAgfSxcbiAgICAgIHBhdXNlSW52aXNpYmxlOiB7XG4gICAgICAgIHZpc1Byb3A6IG51bGwsXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBwcmVmaXhlcyA9IFsnd2Via2l0JywnbW96JywnbXMnLCdvJ107XG5cbiAgICAgICAgICBpZiAoJ2hpZGRlbicgaW4gZG9jdW1lbnQpIHJldHVybiAnaGlkZGVuJztcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoKHByZWZpeGVzW2ldICsgJ0hpZGRlbicpIGluIGRvY3VtZW50KVxuICAgICAgICAgICAgbWV0aG9kcy5wYXVzZUludmlzaWJsZS52aXNQcm9wID0gcHJlZml4ZXNbaV0gKyAnSGlkZGVuJztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1ldGhvZHMucGF1c2VJbnZpc2libGUudmlzUHJvcCkge1xuICAgICAgICAgICAgdmFyIGV2dG5hbWUgPSBtZXRob2RzLnBhdXNlSW52aXNpYmxlLnZpc1Byb3AucmVwbGFjZSgvW0h8aF1pZGRlbi8sJycpICsgJ3Zpc2liaWxpdHljaGFuZ2UnO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldnRuYW1lLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKG1ldGhvZHMucGF1c2VJbnZpc2libGUuaXNIaWRkZW4oKSkge1xuICAgICAgICAgICAgICAgIGlmKHNsaWRlci5zdGFydFRpbWVvdXQpIGNsZWFyVGltZW91dChzbGlkZXIuc3RhcnRUaW1lb3V0KTsgLy9JZiBjbG9jayBpcyB0aWNraW5nLCBzdG9wIHRpbWVyIGFuZCBwcmV2ZW50IGZyb20gc3RhcnRpbmcgd2hpbGUgaW52aXNpYmxlXG4gICAgICAgICAgICAgICAgZWxzZSBzbGlkZXIucGF1c2UoKTsgLy9PciBqdXN0IHBhdXNlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYoc2xpZGVyLnN0YXJ0ZWQpIHNsaWRlci5wbGF5KCk7IC8vSW5pdGlhdGVkIGJlZm9yZSwganVzdCBwbGF5XG4gICAgICAgICAgICAgICAgZWxzZSAoc2xpZGVyLnZhcnMuaW5pdERlbGF5ID4gMCkgPyBzZXRUaW1lb3V0KHNsaWRlci5wbGF5LCBzbGlkZXIudmFycy5pbml0RGVsYXkpIDogc2xpZGVyLnBsYXkoKTsgLy9EaWRuJ3QgaW5pdCBiZWZvcmU6IHNpbXBseSBpbml0IG9yIHdhaXQgZm9yIGl0XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaXNIaWRkZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBkb2N1bWVudFttZXRob2RzLnBhdXNlSW52aXNpYmxlLnZpc1Byb3BdIHx8IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc2V0VG9DbGVhcldhdGNoZWRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh3YXRjaGVkRXZlbnRDbGVhclRpbWVyKTtcbiAgICAgICAgd2F0Y2hlZEV2ZW50Q2xlYXJUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgd2F0Y2hlZEV2ZW50ID0gXCJcIjtcbiAgICAgICAgfSwgMzAwMCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIHB1YmxpYyBtZXRob2RzXG4gICAgc2xpZGVyLmZsZXhBbmltYXRlID0gZnVuY3Rpb24odGFyZ2V0LCBwYXVzZSwgb3ZlcnJpZGUsIHdpdGhTeW5jLCBmcm9tTmF2KSB7XG4gICAgICBpZiAoIXNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgJiYgdGFyZ2V0ICE9PSBzbGlkZXIuY3VycmVudFNsaWRlKSB7XG4gICAgICAgIHNsaWRlci5kaXJlY3Rpb24gPSAodGFyZ2V0ID4gc2xpZGVyLmN1cnJlbnRTbGlkZSkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXNOYXYgJiYgc2xpZGVyLnBhZ2luZ0NvdW50ID09PSAxKSBzbGlkZXIuZGlyZWN0aW9uID0gKHNsaWRlci5jdXJyZW50SXRlbSA8IHRhcmdldCkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuXG4gICAgICBpZiAoIXNsaWRlci5hbmltYXRpbmcgJiYgKHNsaWRlci5jYW5BZHZhbmNlKHRhcmdldCwgZnJvbU5hdikgfHwgb3ZlcnJpZGUpICYmIHNsaWRlci5pcyhcIjp2aXNpYmxlXCIpKSB7XG4gICAgICAgIGlmIChhc05hdiAmJiB3aXRoU3luYykge1xuICAgICAgICAgIHZhciBtYXN0ZXIgPSAkKHNsaWRlci52YXJzLmFzTmF2Rm9yKS5kYXRhKCdmbGV4c2xpZGVyJyk7XG4gICAgICAgICAgc2xpZGVyLmF0RW5kID0gdGFyZ2V0ID09PSAwIHx8IHRhcmdldCA9PT0gc2xpZGVyLmNvdW50IC0gMTtcbiAgICAgICAgICBtYXN0ZXIuZmxleEFuaW1hdGUodGFyZ2V0LCB0cnVlLCBmYWxzZSwgdHJ1ZSwgZnJvbU5hdik7XG4gICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9IChzbGlkZXIuY3VycmVudEl0ZW0gPCB0YXJnZXQpID8gXCJuZXh0XCIgOiBcInByZXZcIjtcbiAgICAgICAgICBtYXN0ZXIuZGlyZWN0aW9uID0gc2xpZGVyLmRpcmVjdGlvbjtcblxuICAgICAgICAgIGlmIChNYXRoLmNlaWwoKHRhcmdldCArIDEpL3NsaWRlci52aXNpYmxlKSAtIDEgIT09IHNsaWRlci5jdXJyZW50U2xpZGUgJiYgdGFyZ2V0ICE9PSAwKSB7XG4gICAgICAgICAgICBzbGlkZXIuY3VycmVudEl0ZW0gPSB0YXJnZXQ7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLnJlbW92ZUNsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpLmVxKHRhcmdldCkuYWRkQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIik7XG4gICAgICAgICAgICB0YXJnZXQgPSBNYXRoLmZsb29yKHRhcmdldC9zbGlkZXIudmlzaWJsZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5jdXJyZW50SXRlbSA9IHRhcmdldDtcbiAgICAgICAgICAgIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEodGFyZ2V0KS5hZGRDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgc2xpZGVyLmFuaW1hdGluZ1RvID0gdGFyZ2V0O1xuXG4gICAgICAgIC8vIFNMSURFU0hPVzpcbiAgICAgICAgaWYgKHBhdXNlKSBzbGlkZXIucGF1c2UoKTtcblxuICAgICAgICAvLyBBUEk6IGJlZm9yZSgpIGFuaW1hdGlvbiBDYWxsYmFja1xuICAgICAgICBzbGlkZXIudmFycy5iZWZvcmUoc2xpZGVyKTtcblxuICAgICAgICAvLyBTWU5DOlxuICAgICAgICBpZiAoc2xpZGVyLnN5bmNFeGlzdHMgJiYgIWZyb21OYXYpIG1ldGhvZHMuc3luYyhcImFuaW1hdGVcIik7XG5cbiAgICAgICAgLy8gQ09OVFJPTE5BVlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuY29udHJvbE5hdikgbWV0aG9kcy5jb250cm9sTmF2LmFjdGl2ZSgpO1xuXG4gICAgICAgIC8vICFDQVJPVVNFTDpcbiAgICAgICAgLy8gQ0FORElEQVRFOiBzbGlkZSBhY3RpdmUgY2xhc3MgKGZvciBhZGQvcmVtb3ZlIHNsaWRlKVxuICAgICAgICBpZiAoIWNhcm91c2VsKSBzbGlkZXIuc2xpZGVzLnJlbW92ZUNsYXNzKG5hbWVzcGFjZSArICdhY3RpdmUtc2xpZGUnKS5lcSh0YXJnZXQpLmFkZENsYXNzKG5hbWVzcGFjZSArICdhY3RpdmUtc2xpZGUnKTtcblxuICAgICAgICAvLyBJTkZJTklURSBMT09QOlxuICAgICAgICAvLyBDQU5ESURBVEU6IGF0RW5kXG4gICAgICAgIHNsaWRlci5hdEVuZCA9IHRhcmdldCA9PT0gMCB8fCB0YXJnZXQgPT09IHNsaWRlci5sYXN0O1xuXG4gICAgICAgIC8vIERJUkVDVElPTk5BVjpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmRpcmVjdGlvbk5hdikgbWV0aG9kcy5kaXJlY3Rpb25OYXYudXBkYXRlKCk7XG5cbiAgICAgICAgaWYgKHRhcmdldCA9PT0gc2xpZGVyLmxhc3QpIHtcbiAgICAgICAgICAvLyBBUEk6IGVuZCgpIG9mIGN5Y2xlIENhbGxiYWNrXG4gICAgICAgICAgc2xpZGVyLnZhcnMuZW5kKHNsaWRlcik7XG4gICAgICAgICAgLy8gU0xJREVTSE9XICYmICFJTkZJTklURSBMT09QOlxuICAgICAgICAgIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkgc2xpZGVyLnBhdXNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTTElERTpcbiAgICAgICAgaWYgKCFmYWRlKSB7XG4gICAgICAgICAgdmFyIGRpbWVuc2lvbiA9ICh2ZXJ0aWNhbCkgPyBzbGlkZXIuc2xpZGVzLmZpbHRlcignOmZpcnN0JykuaGVpZ2h0KCkgOiBzbGlkZXIuY29tcHV0ZWRXLFxuICAgICAgICAgICAgICBtYXJnaW4sIHNsaWRlU3RyaW5nLCBjYWxjTmV4dDtcblxuICAgICAgICAgIC8vIElORklOSVRFIExPT1AgLyBSRVZFUlNFOlxuICAgICAgICAgIGlmIChjYXJvdXNlbCkge1xuICAgICAgICAgICAgLy9tYXJnaW4gPSAoc2xpZGVyLnZhcnMuaXRlbVdpZHRoID4gc2xpZGVyLncpID8gc2xpZGVyLnZhcnMuaXRlbU1hcmdpbiAqIDIgOiBzbGlkZXIudmFycy5pdGVtTWFyZ2luO1xuICAgICAgICAgICAgbWFyZ2luID0gc2xpZGVyLnZhcnMuaXRlbU1hcmdpbjtcbiAgICAgICAgICAgIGNhbGNOZXh0ID0gKChzbGlkZXIuaXRlbVcgKyBtYXJnaW4pICogc2xpZGVyLm1vdmUpICogc2xpZGVyLmFuaW1hdGluZ1RvO1xuICAgICAgICAgICAgc2xpZGVTdHJpbmcgPSAoY2FsY05leHQgPiBzbGlkZXIubGltaXQgJiYgc2xpZGVyLnZpc2libGUgIT09IDEpID8gc2xpZGVyLmxpbWl0IDogY2FsY05leHQ7XG4gICAgICAgICAgfSBlbHNlIGlmIChzbGlkZXIuY3VycmVudFNsaWRlID09PSAwICYmIHRhcmdldCA9PT0gc2xpZGVyLmNvdW50IC0gMSAmJiBzbGlkZXIudmFycy5hbmltYXRpb25Mb29wICYmIHNsaWRlci5kaXJlY3Rpb24gIT09IFwibmV4dFwiKSB7XG4gICAgICAgICAgICBzbGlkZVN0cmluZyA9IChyZXZlcnNlKSA/IChzbGlkZXIuY291bnQgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogZGltZW5zaW9uIDogMDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0ICYmIHRhcmdldCA9PT0gMCAmJiBzbGlkZXIudmFycy5hbmltYXRpb25Mb29wICYmIHNsaWRlci5kaXJlY3Rpb24gIT09IFwicHJldlwiKSB7XG4gICAgICAgICAgICBzbGlkZVN0cmluZyA9IChyZXZlcnNlKSA/IDAgOiAoc2xpZGVyLmNvdW50ICsgMSkgKiBkaW1lbnNpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlU3RyaW5nID0gKHJldmVyc2UpID8gKChzbGlkZXIuY291bnQgLSAxKSAtIHRhcmdldCArIHNsaWRlci5jbG9uZU9mZnNldCkgKiBkaW1lbnNpb24gOiAodGFyZ2V0ICsgc2xpZGVyLmNsb25lT2Zmc2V0KSAqIGRpbWVuc2lvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2xpZGVyLnNldFByb3BzKHNsaWRlU3RyaW5nLCBcIlwiLCBzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCk7XG4gICAgICAgICAgaWYgKHNsaWRlci50cmFuc2l0aW9ucykge1xuICAgICAgICAgICAgaWYgKCFzbGlkZXIudmFycy5hbmltYXRpb25Mb29wIHx8ICFzbGlkZXIuYXRFbmQpIHtcbiAgICAgICAgICAgICAgc2xpZGVyLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICBzbGlkZXIuY3VycmVudFNsaWRlID0gc2xpZGVyLmFuaW1hdGluZ1RvO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci51bmJpbmQoXCJ3ZWJraXRUcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmRcIik7XG4gICAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLmJpbmQoXCJ3ZWJraXRUcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNsaWRlci53cmFwdXAoZGltZW5zaW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLmFuaW1hdGUoc2xpZGVyLmFyZ3MsIHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHNsaWRlci53cmFwdXAoZGltZW5zaW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgLy8gRkFERTpcbiAgICAgICAgICBpZiAoIXRvdWNoKSB7XG4gICAgICAgICAgICAvL3NsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuZmFkZU91dChzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCwgc2xpZGVyLnZhcnMuZWFzaW5nKTtcbiAgICAgICAgICAgIC8vc2xpZGVyLnNsaWRlcy5lcSh0YXJnZXQpLmZhZGVJbihzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCwgc2xpZGVyLnZhcnMuZWFzaW5nLCBzbGlkZXIud3JhcHVwKTtcblxuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5jc3Moe1wiekluZGV4XCI6IDF9KS5hbmltYXRlKHtcIm9wYWNpdHlcIjogMH0sIHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcpO1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5lcSh0YXJnZXQpLmNzcyh7XCJ6SW5kZXhcIjogMn0pLmFuaW1hdGUoe1wib3BhY2l0eVwiOiAxfSwgc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsIHNsaWRlci52YXJzLmVhc2luZywgc2xpZGVyLndyYXB1cCk7XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5jc3MoeyBcIm9wYWNpdHlcIjogMCwgXCJ6SW5kZXhcIjogMSB9KTtcbiAgICAgICAgICAgIHNsaWRlci5zbGlkZXMuZXEodGFyZ2V0KS5jc3MoeyBcIm9wYWNpdHlcIjogMSwgXCJ6SW5kZXhcIjogMiB9KTtcbiAgICAgICAgICAgIHNsaWRlci53cmFwdXAoZGltZW5zaW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gU01PT1RIIEhFSUdIVDpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLnNtb290aEhlaWdodCkgbWV0aG9kcy5zbW9vdGhIZWlnaHQoc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQpO1xuICAgICAgfVxuICAgIH07XG4gICAgc2xpZGVyLndyYXB1cCA9IGZ1bmN0aW9uKGRpbWVuc2lvbikge1xuICAgICAgLy8gU0xJREU6XG4gICAgICBpZiAoIWZhZGUgJiYgIWNhcm91c2VsKSB7XG4gICAgICAgIGlmIChzbGlkZXIuY3VycmVudFNsaWRlID09PSAwICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmxhc3QgJiYgc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkge1xuICAgICAgICAgIHNsaWRlci5zZXRQcm9wcyhkaW1lbnNpb24sIFwianVtcEVuZFwiKTtcbiAgICAgICAgfSBlbHNlIGlmIChzbGlkZXIuY3VycmVudFNsaWRlID09PSBzbGlkZXIubGFzdCAmJiBzbGlkZXIuYW5pbWF0aW5nVG8gPT09IDAgJiYgc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkge1xuICAgICAgICAgIHNsaWRlci5zZXRQcm9wcyhkaW1lbnNpb24sIFwianVtcFN0YXJ0XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzbGlkZXIuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICBzbGlkZXIuY3VycmVudFNsaWRlID0gc2xpZGVyLmFuaW1hdGluZ1RvO1xuICAgICAgLy8gQVBJOiBhZnRlcigpIGFuaW1hdGlvbiBDYWxsYmFja1xuICAgICAgc2xpZGVyLnZhcnMuYWZ0ZXIoc2xpZGVyKTtcbiAgICB9O1xuXG4gICAgLy8gU0xJREVTSE9XOlxuICAgIHNsaWRlci5hbmltYXRlU2xpZGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXNsaWRlci5hbmltYXRpbmcgJiYgZm9jdXNlZCApIHNsaWRlci5mbGV4QW5pbWF0ZShzbGlkZXIuZ2V0VGFyZ2V0KFwibmV4dFwiKSk7XG4gICAgfTtcbiAgICAvLyBTTElERVNIT1c6XG4gICAgc2xpZGVyLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhckludGVydmFsKHNsaWRlci5hbmltYXRlZFNsaWRlcyk7XG4gICAgICBzbGlkZXIuYW5pbWF0ZWRTbGlkZXMgPSBudWxsO1xuICAgICAgc2xpZGVyLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgIC8vIFBBVVNFUExBWTpcbiAgICAgIGlmIChzbGlkZXIudmFycy5wYXVzZVBsYXkpIG1ldGhvZHMucGF1c2VQbGF5LnVwZGF0ZShcInBsYXlcIik7XG4gICAgICAvLyBTWU5DOlxuICAgICAgaWYgKHNsaWRlci5zeW5jRXhpc3RzKSBtZXRob2RzLnN5bmMoXCJwYXVzZVwiKTtcbiAgICB9O1xuICAgIC8vIFNMSURFU0hPVzpcbiAgICBzbGlkZXIucGxheSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHNsaWRlci5wbGF5aW5nKSBjbGVhckludGVydmFsKHNsaWRlci5hbmltYXRlZFNsaWRlcyk7XG4gICAgICBzbGlkZXIuYW5pbWF0ZWRTbGlkZXMgPSBzbGlkZXIuYW5pbWF0ZWRTbGlkZXMgfHwgc2V0SW50ZXJ2YWwoc2xpZGVyLmFuaW1hdGVTbGlkZXMsIHNsaWRlci52YXJzLnNsaWRlc2hvd1NwZWVkKTtcbiAgICAgIHNsaWRlci5zdGFydGVkID0gc2xpZGVyLnBsYXlpbmcgPSB0cnVlO1xuICAgICAgLy8gUEFVU0VQTEFZOlxuICAgICAgaWYgKHNsaWRlci52YXJzLnBhdXNlUGxheSkgbWV0aG9kcy5wYXVzZVBsYXkudXBkYXRlKFwicGF1c2VcIik7XG4gICAgICAvLyBTWU5DOlxuICAgICAgaWYgKHNsaWRlci5zeW5jRXhpc3RzKSBtZXRob2RzLnN5bmMoXCJwbGF5XCIpO1xuICAgIH07XG4gICAgLy8gU1RPUDpcbiAgICBzbGlkZXIuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHNsaWRlci5wYXVzZSgpO1xuICAgICAgc2xpZGVyLnN0b3BwZWQgPSB0cnVlO1xuICAgIH07XG4gICAgc2xpZGVyLmNhbkFkdmFuY2UgPSBmdW5jdGlvbih0YXJnZXQsIGZyb21OYXYpIHtcbiAgICAgIC8vIEFTTkFWOlxuICAgICAgdmFyIGxhc3QgPSAoYXNOYXYpID8gc2xpZGVyLnBhZ2luZ0NvdW50IC0gMSA6IHNsaWRlci5sYXN0O1xuICAgICAgcmV0dXJuIChmcm9tTmF2KSA/IHRydWUgOlxuICAgICAgICAgICAgIChhc05hdiAmJiBzbGlkZXIuY3VycmVudEl0ZW0gPT09IHNsaWRlci5jb3VudCAtIDEgJiYgdGFyZ2V0ID09PSAwICYmIHNsaWRlci5kaXJlY3Rpb24gPT09IFwicHJldlwiKSA/IHRydWUgOlxuICAgICAgICAgICAgIChhc05hdiAmJiBzbGlkZXIuY3VycmVudEl0ZW0gPT09IDAgJiYgdGFyZ2V0ID09PSBzbGlkZXIucGFnaW5nQ291bnQgLSAxICYmIHNsaWRlci5kaXJlY3Rpb24gIT09IFwibmV4dFwiKSA/IGZhbHNlIDpcbiAgICAgICAgICAgICAodGFyZ2V0ID09PSBzbGlkZXIuY3VycmVudFNsaWRlICYmICFhc05hdikgPyBmYWxzZSA6XG4gICAgICAgICAgICAgKHNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3ApID8gdHJ1ZSA6XG4gICAgICAgICAgICAgKHNsaWRlci5hdEVuZCAmJiBzbGlkZXIuY3VycmVudFNsaWRlID09PSAwICYmIHRhcmdldCA9PT0gbGFzdCAmJiBzbGlkZXIuZGlyZWN0aW9uICE9PSBcIm5leHRcIikgPyBmYWxzZSA6XG4gICAgICAgICAgICAgKHNsaWRlci5hdEVuZCAmJiBzbGlkZXIuY3VycmVudFNsaWRlID09PSBsYXN0ICYmIHRhcmdldCA9PT0gMCAmJiBzbGlkZXIuZGlyZWN0aW9uID09PSBcIm5leHRcIikgPyBmYWxzZSA6XG4gICAgICAgICAgICAgdHJ1ZTtcbiAgICB9O1xuICAgIHNsaWRlci5nZXRUYXJnZXQgPSBmdW5jdGlvbihkaXIpIHtcbiAgICAgIHNsaWRlci5kaXJlY3Rpb24gPSBkaXI7XG4gICAgICBpZiAoZGlyID09PSBcIm5leHRcIikge1xuICAgICAgICByZXR1cm4gKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0KSA/IDAgOiBzbGlkZXIuY3VycmVudFNsaWRlICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gMCkgPyBzbGlkZXIubGFzdCA6IHNsaWRlci5jdXJyZW50U2xpZGUgLSAxO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBTTElERTpcbiAgICBzbGlkZXIuc2V0UHJvcHMgPSBmdW5jdGlvbihwb3MsIHNwZWNpYWwsIGR1cikge1xuICAgICAgdmFyIHRhcmdldCA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBvc0NoZWNrID0gKHBvcykgPyBwb3MgOiAoKHNsaWRlci5pdGVtVyArIHNsaWRlci52YXJzLml0ZW1NYXJnaW4pICogc2xpZGVyLm1vdmUpICogc2xpZGVyLmFuaW1hdGluZ1RvLFxuICAgICAgICAgICAgcG9zQ2FsYyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKGNhcm91c2VsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzcGVjaWFsID09PSBcInNldFRvdWNoXCIpID8gcG9zIDpcbiAgICAgICAgICAgICAgICAgICAgICAgKHJldmVyc2UgJiYgc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCkgPyAwIDpcbiAgICAgICAgICAgICAgICAgICAgICAgKHJldmVyc2UpID8gc2xpZGVyLmxpbWl0IC0gKCgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgKHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmxhc3QpID8gc2xpZGVyLmxpbWl0IDogcG9zQ2hlY2s7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChzcGVjaWFsKSB7XG4gICAgICAgICAgICAgICAgICBjYXNlIFwic2V0VG90YWxcIjogcmV0dXJuIChyZXZlcnNlKSA/ICgoc2xpZGVyLmNvdW50IC0gMSkgLSBzbGlkZXIuY3VycmVudFNsaWRlICsgc2xpZGVyLmNsb25lT2Zmc2V0KSAqIHBvcyA6IChzbGlkZXIuY3VycmVudFNsaWRlICsgc2xpZGVyLmNsb25lT2Zmc2V0KSAqIHBvcztcbiAgICAgICAgICAgICAgICAgIGNhc2UgXCJzZXRUb3VjaFwiOiByZXR1cm4gKHJldmVyc2UpID8gcG9zIDogcG9zO1xuICAgICAgICAgICAgICAgICAgY2FzZSBcImp1bXBFbmRcIjogcmV0dXJuIChyZXZlcnNlKSA/IHBvcyA6IHNsaWRlci5jb3VudCAqIHBvcztcbiAgICAgICAgICAgICAgICAgIGNhc2UgXCJqdW1wU3RhcnRcIjogcmV0dXJuIChyZXZlcnNlKSA/IHNsaWRlci5jb3VudCAqIHBvcyA6IHBvcztcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBwb3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KCkpO1xuXG4gICAgICAgICAgICByZXR1cm4gKHBvc0NhbGMgKiAtMSkgKyBcInB4XCI7XG4gICAgICAgICAgfSgpKTtcblxuICAgICAgaWYgKHNsaWRlci50cmFuc2l0aW9ucykge1xuICAgICAgICB0YXJnZXQgPSAodmVydGljYWwpID8gXCJ0cmFuc2xhdGUzZCgwLFwiICsgdGFyZ2V0ICsgXCIsMClcIiA6IFwidHJhbnNsYXRlM2QoXCIgKyB0YXJnZXQgKyBcIiwwLDApXCI7XG4gICAgICAgIGR1ciA9IChkdXIgIT09IHVuZGVmaW5lZCkgPyAoZHVyLzEwMDApICsgXCJzXCIgOiBcIjBzXCI7XG4gICAgICAgIHNsaWRlci5jb250YWluZXIuY3NzKFwiLVwiICsgc2xpZGVyLnBmeCArIFwiLXRyYW5zaXRpb24tZHVyYXRpb25cIiwgZHVyKTtcbiAgICAgICAgIHNsaWRlci5jb250YWluZXIuY3NzKFwidHJhbnNpdGlvbi1kdXJhdGlvblwiLCBkdXIpO1xuICAgICAgfVxuXG4gICAgICBzbGlkZXIuYXJnc1tzbGlkZXIucHJvcF0gPSB0YXJnZXQ7XG4gICAgICBpZiAoc2xpZGVyLnRyYW5zaXRpb25zIHx8IGR1ciA9PT0gdW5kZWZpbmVkKSBzbGlkZXIuY29udGFpbmVyLmNzcyhzbGlkZXIuYXJncyk7XG5cbiAgICAgIHNsaWRlci5jb250YWluZXIuY3NzKCd0cmFuc2Zvcm0nLHRhcmdldCk7XG4gICAgfTtcblxuICAgIHNsaWRlci5zZXR1cCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIC8vIFNMSURFOlxuICAgICAgaWYgKCFmYWRlKSB7XG4gICAgICAgIHZhciBzbGlkZXJPZmZzZXQsIGFycjtcblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJpbml0XCIpIHtcbiAgICAgICAgICBzbGlkZXIudmlld3BvcnQgPSAkKCc8ZGl2IGNsYXNzPVwiJyArIG5hbWVzcGFjZSArICd2aWV3cG9ydFwiPjwvZGl2PicpLmNzcyh7XCJvdmVyZmxvd1wiOiBcImhpZGRlblwiLCBcInBvc2l0aW9uXCI6IFwicmVsYXRpdmVcIn0pLmFwcGVuZFRvKHNsaWRlcikuYXBwZW5kKHNsaWRlci5jb250YWluZXIpO1xuICAgICAgICAgIC8vIElORklOSVRFIExPT1A6XG4gICAgICAgICAgc2xpZGVyLmNsb25lQ291bnQgPSAwO1xuICAgICAgICAgIHNsaWRlci5jbG9uZU9mZnNldCA9IDA7XG4gICAgICAgICAgLy8gUkVWRVJTRTpcbiAgICAgICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICAgICAgYXJyID0gJC5tYWtlQXJyYXkoc2xpZGVyLnNsaWRlcykucmV2ZXJzZSgpO1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcyA9ICQoYXJyKTtcbiAgICAgICAgICAgIHNsaWRlci5jb250YWluZXIuZW1wdHkoKS5hcHBlbmQoc2xpZGVyLnNsaWRlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElORklOSVRFIExPT1AgJiYgIUNBUk9VU0VMOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCAmJiAhY2Fyb3VzZWwpIHtcbiAgICAgICAgICBzbGlkZXIuY2xvbmVDb3VudCA9IDI7XG4gICAgICAgICAgc2xpZGVyLmNsb25lT2Zmc2V0ID0gMTtcbiAgICAgICAgICAvLyBjbGVhciBvdXQgb2xkIGNsb25lc1xuICAgICAgICAgIGlmICh0eXBlICE9PSBcImluaXRcIikgc2xpZGVyLmNvbnRhaW5lci5maW5kKCcuY2xvbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLmFwcGVuZChzbGlkZXIuc2xpZGVzLmZpcnN0KCkuY2xvbmUoKS5hZGRDbGFzcygnY2xvbmUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJykpLnByZXBlbmQoc2xpZGVyLnNsaWRlcy5sYXN0KCkuY2xvbmUoKS5hZGRDbGFzcygnY2xvbmUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJykpO1xuXHRcdCAgICAgIG1ldGhvZHMudW5pcXVlSUQoIHNsaWRlci5zbGlkZXMuZmlyc3QoKS5jbG9uZSgpLmFkZENsYXNzKCdjbG9uZScpICkuYXBwZW5kVG8oIHNsaWRlci5jb250YWluZXIgKTtcblx0XHQgICAgICBtZXRob2RzLnVuaXF1ZUlEKCBzbGlkZXIuc2xpZGVzLmxhc3QoKS5jbG9uZSgpLmFkZENsYXNzKCdjbG9uZScpICkucHJlcGVuZFRvKCBzbGlkZXIuY29udGFpbmVyICk7XG4gICAgICAgIH1cbiAgICAgICAgc2xpZGVyLm5ld1NsaWRlcyA9ICQoc2xpZGVyLnZhcnMuc2VsZWN0b3IsIHNsaWRlcik7XG5cbiAgICAgICAgc2xpZGVyT2Zmc2V0ID0gKHJldmVyc2UpID8gc2xpZGVyLmNvdW50IC0gMSAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQgOiBzbGlkZXIuY3VycmVudFNsaWRlICsgc2xpZGVyLmNsb25lT2Zmc2V0O1xuICAgICAgICAvLyBWRVJUSUNBTDpcbiAgICAgICAgaWYgKHZlcnRpY2FsICYmICFjYXJvdXNlbCkge1xuICAgICAgICAgIHNsaWRlci5jb250YWluZXIuaGVpZ2h0KChzbGlkZXIuY291bnQgKyBzbGlkZXIuY2xvbmVDb3VudCkgKiAyMDAgKyBcIiVcIikuY3NzKFwicG9zaXRpb25cIiwgXCJhYnNvbHV0ZVwiKS53aWR0aChcIjEwMCVcIik7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgc2xpZGVyLm5ld1NsaWRlcy5jc3Moe1wiZGlzcGxheVwiOiBcImJsb2NrXCJ9KTtcbiAgICAgICAgICAgIHNsaWRlci5kb01hdGgoKTtcbiAgICAgICAgICAgIHNsaWRlci52aWV3cG9ydC5oZWlnaHQoc2xpZGVyLmgpO1xuICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKHNsaWRlck9mZnNldCAqIHNsaWRlci5oLCBcImluaXRcIik7XG4gICAgICAgICAgfSwgKHR5cGUgPT09IFwiaW5pdFwiKSA/IDEwMCA6IDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNsaWRlci5jb250YWluZXIud2lkdGgoKHNsaWRlci5jb3VudCArIHNsaWRlci5jbG9uZUNvdW50KSAqIDIwMCArIFwiJVwiKTtcbiAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVyT2Zmc2V0ICogc2xpZGVyLmNvbXB1dGVkVywgXCJpbml0XCIpO1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHNsaWRlci5kb01hdGgoKTtcbiAgICAgICAgICAgIHNsaWRlci5uZXdTbGlkZXMuY3NzKHtcIndpZHRoXCI6IHNsaWRlci5jb21wdXRlZFcsIFwiZmxvYXRcIjogXCJsZWZ0XCIsIFwiZGlzcGxheVwiOiBcImJsb2NrXCJ9KTtcbiAgICAgICAgICAgIC8vIFNNT09USCBIRUlHSFQ6XG4gICAgICAgICAgICBpZiAoc2xpZGVyLnZhcnMuc21vb3RoSGVpZ2h0KSBtZXRob2RzLnNtb290aEhlaWdodCgpO1xuICAgICAgICAgIH0sICh0eXBlID09PSBcImluaXRcIikgPyAxMDAgOiAwKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gRkFERTpcbiAgICAgICAgc2xpZGVyLnNsaWRlcy5jc3Moe1wid2lkdGhcIjogXCIxMDAlXCIsIFwiZmxvYXRcIjogXCJsZWZ0XCIsIFwibWFyZ2luUmlnaHRcIjogXCItMTAwJVwiLCBcInBvc2l0aW9uXCI6IFwicmVsYXRpdmVcIn0pO1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJpbml0XCIpIHtcbiAgICAgICAgICBpZiAoIXRvdWNoKSB7XG4gICAgICAgICAgICAvL3NsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuZmFkZUluKHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcpO1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5jc3MoeyBcIm9wYWNpdHlcIjogMCwgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIiwgXCJ6SW5kZXhcIjogMSB9KS5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5jc3Moe1wiekluZGV4XCI6IDJ9KS5hbmltYXRlKHtcIm9wYWNpdHlcIjogMX0sc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsc2xpZGVyLnZhcnMuZWFzaW5nKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5jc3MoeyBcIm9wYWNpdHlcIjogMCwgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIiwgXCJ3ZWJraXRUcmFuc2l0aW9uXCI6IFwib3BhY2l0eSBcIiArIHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkIC8gMTAwMCArIFwicyBlYXNlXCIsIFwiekluZGV4XCI6IDEgfSkuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuY3NzKHsgXCJvcGFjaXR5XCI6IDEsIFwiekluZGV4XCI6IDJ9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gU01PT1RIIEhFSUdIVDpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLnNtb290aEhlaWdodCkgbWV0aG9kcy5zbW9vdGhIZWlnaHQoKTtcbiAgICAgIH1cbiAgICAgIC8vICFDQVJPVVNFTDpcbiAgICAgIC8vIENBTkRJREFURTogYWN0aXZlIHNsaWRlXG4gICAgICBpZiAoIWNhcm91c2VsKSBzbGlkZXIuc2xpZGVzLnJlbW92ZUNsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpLmVxKHNsaWRlci5jdXJyZW50U2xpZGUpLmFkZENsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpO1xuXG4gICAgICAvL0ZsZXhTbGlkZXI6IGluaXQoKSBDYWxsYmFja1xuICAgICAgc2xpZGVyLnZhcnMuaW5pdChzbGlkZXIpO1xuICAgIH07XG5cbiAgICBzbGlkZXIuZG9NYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2xpZGUgPSBzbGlkZXIuc2xpZGVzLmZpcnN0KCksXG4gICAgICAgICAgc2xpZGVNYXJnaW4gPSBzbGlkZXIudmFycy5pdGVtTWFyZ2luLFxuICAgICAgICAgIG1pbkl0ZW1zID0gc2xpZGVyLnZhcnMubWluSXRlbXMsXG4gICAgICAgICAgbWF4SXRlbXMgPSBzbGlkZXIudmFycy5tYXhJdGVtcztcblxuICAgICAgc2xpZGVyLncgPSAoc2xpZGVyLnZpZXdwb3J0PT09dW5kZWZpbmVkKSA/IHNsaWRlci53aWR0aCgpIDogc2xpZGVyLnZpZXdwb3J0LndpZHRoKCk7XG4gICAgICBzbGlkZXIuaCA9IHNsaWRlLmhlaWdodCgpO1xuICAgICAgc2xpZGVyLmJveFBhZGRpbmcgPSBzbGlkZS5vdXRlcldpZHRoKCkgLSBzbGlkZS53aWR0aCgpO1xuXG4gICAgICAvLyBDQVJPVVNFTDpcbiAgICAgIGlmIChjYXJvdXNlbCkge1xuICAgICAgICBzbGlkZXIuaXRlbVQgPSBzbGlkZXIudmFycy5pdGVtV2lkdGggKyBzbGlkZU1hcmdpbjtcbiAgICAgICAgc2xpZGVyLm1pblcgPSAobWluSXRlbXMpID8gbWluSXRlbXMgKiBzbGlkZXIuaXRlbVQgOiBzbGlkZXIudztcbiAgICAgICAgc2xpZGVyLm1heFcgPSAobWF4SXRlbXMpID8gKG1heEl0ZW1zICogc2xpZGVyLml0ZW1UKSAtIHNsaWRlTWFyZ2luIDogc2xpZGVyLnc7XG4gICAgICAgIHNsaWRlci5pdGVtVyA9IChzbGlkZXIubWluVyA+IHNsaWRlci53KSA/IChzbGlkZXIudyAtIChzbGlkZU1hcmdpbiAqIChtaW5JdGVtcyAtIDEpKSkvbWluSXRlbXMgOlxuICAgICAgICAgICAgICAgICAgICAgICAoc2xpZGVyLm1heFcgPCBzbGlkZXIudykgPyAoc2xpZGVyLncgLSAoc2xpZGVNYXJnaW4gKiAobWF4SXRlbXMgLSAxKSkpL21heEl0ZW1zIDpcbiAgICAgICAgICAgICAgICAgICAgICAgKHNsaWRlci52YXJzLml0ZW1XaWR0aCA+IHNsaWRlci53KSA/IHNsaWRlci53IDogc2xpZGVyLnZhcnMuaXRlbVdpZHRoO1xuXG4gICAgICAgIHNsaWRlci52aXNpYmxlID0gTWF0aC5mbG9vcihzbGlkZXIudy8oc2xpZGVyLml0ZW1XKSk7XG4gICAgICAgIHNsaWRlci5tb3ZlID0gKHNsaWRlci52YXJzLm1vdmUgPiAwICYmIHNsaWRlci52YXJzLm1vdmUgPCBzbGlkZXIudmlzaWJsZSApID8gc2xpZGVyLnZhcnMubW92ZSA6IHNsaWRlci52aXNpYmxlO1xuICAgICAgICBzbGlkZXIucGFnaW5nQ291bnQgPSBNYXRoLmNlaWwoKChzbGlkZXIuY291bnQgLSBzbGlkZXIudmlzaWJsZSkvc2xpZGVyLm1vdmUpICsgMSk7XG4gICAgICAgIHNsaWRlci5sYXN0ID0gIHNsaWRlci5wYWdpbmdDb3VudCAtIDE7XG4gICAgICAgIHNsaWRlci5saW1pdCA9IChzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpID8gMCA6XG4gICAgICAgICAgICAgICAgICAgICAgIChzbGlkZXIudmFycy5pdGVtV2lkdGggPiBzbGlkZXIudykgPyAoc2xpZGVyLml0ZW1XICogKHNsaWRlci5jb3VudCAtIDEpKSArIChzbGlkZU1hcmdpbiAqIChzbGlkZXIuY291bnQgLSAxKSkgOiAoKHNsaWRlci5pdGVtVyArIHNsaWRlTWFyZ2luKSAqIHNsaWRlci5jb3VudCkgLSBzbGlkZXIudyAtIHNsaWRlTWFyZ2luO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2xpZGVyLml0ZW1XID0gc2xpZGVyLnc7XG4gICAgICAgIHNsaWRlci5wYWdpbmdDb3VudCA9IHNsaWRlci5jb3VudDtcbiAgICAgICAgc2xpZGVyLmxhc3QgPSBzbGlkZXIuY291bnQgLSAxO1xuICAgICAgfVxuICAgICAgc2xpZGVyLmNvbXB1dGVkVyA9IHNsaWRlci5pdGVtVyAtIHNsaWRlci5ib3hQYWRkaW5nO1xuICAgIH07XG5cbiAgICBzbGlkZXIudXBkYXRlID0gZnVuY3Rpb24ocG9zLCBhY3Rpb24pIHtcbiAgICAgIHNsaWRlci5kb01hdGgoKTtcblxuICAgICAgLy8gdXBkYXRlIGN1cnJlbnRTbGlkZSBhbmQgc2xpZGVyLmFuaW1hdGluZ1RvIGlmIG5lY2Vzc2FyeVxuICAgICAgaWYgKCFjYXJvdXNlbCkge1xuICAgICAgICBpZiAocG9zIDwgc2xpZGVyLmN1cnJlbnRTbGlkZSkge1xuICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgKz0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChwb3MgPD0gc2xpZGVyLmN1cnJlbnRTbGlkZSAmJiBwb3MgIT09IDApIHtcbiAgICAgICAgICBzbGlkZXIuY3VycmVudFNsaWRlIC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgc2xpZGVyLmFuaW1hdGluZ1RvID0gc2xpZGVyLmN1cnJlbnRTbGlkZTtcbiAgICAgIH1cblxuICAgICAgLy8gdXBkYXRlIGNvbnRyb2xOYXZcbiAgICAgIGlmIChzbGlkZXIudmFycy5jb250cm9sTmF2ICYmICFzbGlkZXIubWFudWFsQ29udHJvbHMpIHtcbiAgICAgICAgaWYgKChhY3Rpb24gPT09IFwiYWRkXCIgJiYgIWNhcm91c2VsKSB8fCBzbGlkZXIucGFnaW5nQ291bnQgPiBzbGlkZXIuY29udHJvbE5hdi5sZW5ndGgpIHtcbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYudXBkYXRlKFwiYWRkXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKChhY3Rpb24gPT09IFwicmVtb3ZlXCIgJiYgIWNhcm91c2VsKSB8fCBzbGlkZXIucGFnaW5nQ291bnQgPCBzbGlkZXIuY29udHJvbE5hdi5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAoY2Fyb3VzZWwgJiYgc2xpZGVyLmN1cnJlbnRTbGlkZSA+IHNsaWRlci5sYXN0KSB7XG4gICAgICAgICAgICBzbGlkZXIuY3VycmVudFNsaWRlIC09IDE7XG4gICAgICAgICAgICBzbGlkZXIuYW5pbWF0aW5nVG8gLT0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LnVwZGF0ZShcInJlbW92ZVwiLCBzbGlkZXIubGFzdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHVwZGF0ZSBkaXJlY3Rpb25OYXZcbiAgICAgIGlmIChzbGlkZXIudmFycy5kaXJlY3Rpb25OYXYpIG1ldGhvZHMuZGlyZWN0aW9uTmF2LnVwZGF0ZSgpO1xuXG4gICAgfTtcblxuICAgIHNsaWRlci5hZGRTbGlkZSA9IGZ1bmN0aW9uKG9iaiwgcG9zKSB7XG4gICAgICB2YXIgJG9iaiA9ICQob2JqKTtcblxuICAgICAgc2xpZGVyLmNvdW50ICs9IDE7XG4gICAgICBzbGlkZXIubGFzdCA9IHNsaWRlci5jb3VudCAtIDE7XG5cbiAgICAgIC8vIGFwcGVuZCBuZXcgc2xpZGVcbiAgICAgIGlmICh2ZXJ0aWNhbCAmJiByZXZlcnNlKSB7XG4gICAgICAgIChwb3MgIT09IHVuZGVmaW5lZCkgPyBzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5jb3VudCAtIHBvcykuYWZ0ZXIoJG9iaikgOiBzbGlkZXIuY29udGFpbmVyLnByZXBlbmQoJG9iaik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAocG9zICE9PSB1bmRlZmluZWQpID8gc2xpZGVyLnNsaWRlcy5lcShwb3MpLmJlZm9yZSgkb2JqKSA6IHNsaWRlci5jb250YWluZXIuYXBwZW5kKCRvYmopO1xuICAgICAgfVxuXG4gICAgICAvLyB1cGRhdGUgY3VycmVudFNsaWRlLCBhbmltYXRpbmdUbywgY29udHJvbE5hdiwgYW5kIGRpcmVjdGlvbk5hdlxuICAgICAgc2xpZGVyLnVwZGF0ZShwb3MsIFwiYWRkXCIpO1xuXG4gICAgICAvLyB1cGRhdGUgc2xpZGVyLnNsaWRlc1xuICAgICAgc2xpZGVyLnNsaWRlcyA9ICQoc2xpZGVyLnZhcnMuc2VsZWN0b3IgKyAnOm5vdCguY2xvbmUpJywgc2xpZGVyKTtcbiAgICAgIC8vIHJlLXNldHVwIHRoZSBzbGlkZXIgdG8gYWNjb21kYXRlIG5ldyBzbGlkZVxuICAgICAgc2xpZGVyLnNldHVwKCk7XG5cbiAgICAgIC8vRmxleFNsaWRlcjogYWRkZWQoKSBDYWxsYmFja1xuICAgICAgc2xpZGVyLnZhcnMuYWRkZWQoc2xpZGVyKTtcbiAgICB9O1xuICAgIHNsaWRlci5yZW1vdmVTbGlkZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIHBvcyA9IChpc05hTihvYmopKSA/IHNsaWRlci5zbGlkZXMuaW5kZXgoJChvYmopKSA6IG9iajtcblxuICAgICAgLy8gdXBkYXRlIGNvdW50XG4gICAgICBzbGlkZXIuY291bnQgLT0gMTtcbiAgICAgIHNsaWRlci5sYXN0ID0gc2xpZGVyLmNvdW50IC0gMTtcblxuICAgICAgLy8gcmVtb3ZlIHNsaWRlXG4gICAgICBpZiAoaXNOYU4ob2JqKSkge1xuICAgICAgICAkKG9iaiwgc2xpZGVyLnNsaWRlcykucmVtb3ZlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAodmVydGljYWwgJiYgcmV2ZXJzZSkgPyBzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5sYXN0KS5yZW1vdmUoKSA6IHNsaWRlci5zbGlkZXMuZXEob2JqKS5yZW1vdmUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gdXBkYXRlIGN1cnJlbnRTbGlkZSwgYW5pbWF0aW5nVG8sIGNvbnRyb2xOYXYsIGFuZCBkaXJlY3Rpb25OYXZcbiAgICAgIHNsaWRlci5kb01hdGgoKTtcbiAgICAgIHNsaWRlci51cGRhdGUocG9zLCBcInJlbW92ZVwiKTtcblxuICAgICAgLy8gdXBkYXRlIHNsaWRlci5zbGlkZXNcbiAgICAgIHNsaWRlci5zbGlkZXMgPSAkKHNsaWRlci52YXJzLnNlbGVjdG9yICsgJzpub3QoLmNsb25lKScsIHNsaWRlcik7XG4gICAgICAvLyByZS1zZXR1cCB0aGUgc2xpZGVyIHRvIGFjY29tZGF0ZSBuZXcgc2xpZGVcbiAgICAgIHNsaWRlci5zZXR1cCgpO1xuXG4gICAgICAvLyBGbGV4U2xpZGVyOiByZW1vdmVkKCkgQ2FsbGJhY2tcbiAgICAgIHNsaWRlci52YXJzLnJlbW92ZWQoc2xpZGVyKTtcbiAgICB9O1xuXG4gICAgLy9GbGV4U2xpZGVyOiBJbml0aWFsaXplXG4gICAgbWV0aG9kcy5pbml0KCk7XG4gIH07XG5cbiAgLy8gRW5zdXJlIHRoZSBzbGlkZXIgaXNuJ3QgZm9jdXNzZWQgaWYgdGhlIHdpbmRvdyBsb3NlcyBmb2N1cy5cbiAgJCggd2luZG93ICkuYmx1ciggZnVuY3Rpb24gKCBlICkge1xuICAgIGZvY3VzZWQgPSBmYWxzZTtcbiAgfSkuZm9jdXMoIGZ1bmN0aW9uICggZSApIHtcbiAgICBmb2N1c2VkID0gdHJ1ZTtcbiAgfSk7XG5cbiAgLy9GbGV4U2xpZGVyOiBEZWZhdWx0IFNldHRpbmdzXG4gICQuZmxleHNsaWRlci5kZWZhdWx0cyA9IHtcbiAgICBuYW1lc3BhY2U6IFwiZmxleC1cIiwgICAgICAgICAgICAgLy97TkVXfSBTdHJpbmc6IFByZWZpeCBzdHJpbmcgYXR0YWNoZWQgdG8gdGhlIGNsYXNzIG9mIGV2ZXJ5IGVsZW1lbnQgZ2VuZXJhdGVkIGJ5IHRoZSBwbHVnaW5cbiAgICBzZWxlY3RvcjogXCIuc2xpZGVzID4gbGlcIiwgICAgICAgLy97TkVXfSBTZWxlY3RvcjogTXVzdCBtYXRjaCBhIHNpbXBsZSBwYXR0ZXJuLiAne2NvbnRhaW5lcn0gPiB7c2xpZGV9JyAtLSBJZ25vcmUgcGF0dGVybiBhdCB5b3VyIG93biBwZXJpbFxuICAgIGFuaW1hdGlvbjogXCJmYWRlXCIsICAgICAgICAgICAgICAvL1N0cmluZzogU2VsZWN0IHlvdXIgYW5pbWF0aW9uIHR5cGUsIFwiZmFkZVwiIG9yIFwic2xpZGVcIlxuICAgIGVhc2luZzogXCJzd2luZ1wiLCAgICAgICAgICAgICAgICAvL3tORVd9IFN0cmluZzogRGV0ZXJtaW5lcyB0aGUgZWFzaW5nIG1ldGhvZCB1c2VkIGluIGpRdWVyeSB0cmFuc2l0aW9ucy4galF1ZXJ5IGVhc2luZyBwbHVnaW4gaXMgc3VwcG9ydGVkIVxuICAgIGRpcmVjdGlvbjogXCJob3Jpem9udGFsXCIsICAgICAgICAvL1N0cmluZzogU2VsZWN0IHRoZSBzbGlkaW5nIGRpcmVjdGlvbiwgXCJob3Jpem9udGFsXCIgb3IgXCJ2ZXJ0aWNhbFwiXG4gICAgcmV2ZXJzZTogZmFsc2UsICAgICAgICAgICAgICAgICAvL3tORVd9IEJvb2xlYW46IFJldmVyc2UgdGhlIGFuaW1hdGlvbiBkaXJlY3Rpb25cbiAgICBhbmltYXRpb25Mb29wOiB0cnVlLCAgICAgICAgICAgIC8vQm9vbGVhbjogU2hvdWxkIHRoZSBhbmltYXRpb24gbG9vcD8gSWYgZmFsc2UsIGRpcmVjdGlvbk5hdiB3aWxsIHJlY2VpdmVkIFwiZGlzYWJsZVwiIGNsYXNzZXMgYXQgZWl0aGVyIGVuZFxuICAgIHNtb290aEhlaWdodDogZmFsc2UsICAgICAgICAgICAgLy97TkVXfSBCb29sZWFuOiBBbGxvdyBoZWlnaHQgb2YgdGhlIHNsaWRlciB0byBhbmltYXRlIHNtb290aGx5IGluIGhvcml6b250YWwgbW9kZVxuICAgIHN0YXJ0QXQ6IDAsICAgICAgICAgICAgICAgICAgICAgLy9JbnRlZ2VyOiBUaGUgc2xpZGUgdGhhdCB0aGUgc2xpZGVyIHNob3VsZCBzdGFydCBvbi4gQXJyYXkgbm90YXRpb24gKDAgPSBmaXJzdCBzbGlkZSlcbiAgICBzbGlkZXNob3c6IHRydWUsICAgICAgICAgICAgICAgIC8vQm9vbGVhbjogQW5pbWF0ZSBzbGlkZXIgYXV0b21hdGljYWxseVxuICAgIHNsaWRlc2hvd1NwZWVkOiA3MDAwLCAgICAgICAgICAgLy9JbnRlZ2VyOiBTZXQgdGhlIHNwZWVkIG9mIHRoZSBzbGlkZXNob3cgY3ljbGluZywgaW4gbWlsbGlzZWNvbmRzXG4gICAgYW5pbWF0aW9uU3BlZWQ6IDYwMCwgICAgICAgICAgICAvL0ludGVnZXI6IFNldCB0aGUgc3BlZWQgb2YgYW5pbWF0aW9ucywgaW4gbWlsbGlzZWNvbmRzXG4gICAgaW5pdERlbGF5OiAwLCAgICAgICAgICAgICAgICAgICAvL3tORVd9IEludGVnZXI6IFNldCBhbiBpbml0aWFsaXphdGlvbiBkZWxheSwgaW4gbWlsbGlzZWNvbmRzXG4gICAgcmFuZG9taXplOiBmYWxzZSwgICAgICAgICAgICAgICAvL0Jvb2xlYW46IFJhbmRvbWl6ZSBzbGlkZSBvcmRlclxuICAgIHRodW1iQ2FwdGlvbnM6IGZhbHNlLCAgICAgICAgICAgLy9Cb29sZWFuOiBXaGV0aGVyIG9yIG5vdCB0byBwdXQgY2FwdGlvbnMgb24gdGh1bWJuYWlscyB3aGVuIHVzaW5nIHRoZSBcInRodW1ibmFpbHNcIiBjb250cm9sTmF2LlxuXG4gICAgLy8gVXNhYmlsaXR5IGZlYXR1cmVzXG4gICAgcGF1c2VPbkFjdGlvbjogdHJ1ZSwgICAgICAgICAgICAvL0Jvb2xlYW46IFBhdXNlIHRoZSBzbGlkZXNob3cgd2hlbiBpbnRlcmFjdGluZyB3aXRoIGNvbnRyb2wgZWxlbWVudHMsIGhpZ2hseSByZWNvbW1lbmRlZC5cbiAgICBwYXVzZU9uSG92ZXI6IGZhbHNlLCAgICAgICAgICAgIC8vQm9vbGVhbjogUGF1c2UgdGhlIHNsaWRlc2hvdyB3aGVuIGhvdmVyaW5nIG92ZXIgc2xpZGVyLCB0aGVuIHJlc3VtZSB3aGVuIG5vIGxvbmdlciBob3ZlcmluZ1xuICAgIHBhdXNlSW52aXNpYmxlOiB0cnVlLCAgIFx0XHQvL3tORVd9IEJvb2xlYW46IFBhdXNlIHRoZSBzbGlkZXNob3cgd2hlbiB0YWIgaXMgaW52aXNpYmxlLCByZXN1bWUgd2hlbiB2aXNpYmxlLiBQcm92aWRlcyBiZXR0ZXIgVVgsIGxvd2VyIENQVSB1c2FnZS5cbiAgICB1c2VDU1M6IHRydWUsICAgICAgICAgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogU2xpZGVyIHdpbGwgdXNlIENTUzMgdHJhbnNpdGlvbnMgaWYgYXZhaWxhYmxlXG4gICAgdG91Y2g6IHRydWUsICAgICAgICAgICAgICAgICAgICAvL3tORVd9IEJvb2xlYW46IEFsbG93IHRvdWNoIHN3aXBlIG5hdmlnYXRpb24gb2YgdGhlIHNsaWRlciBvbiB0b3VjaC1lbmFibGVkIGRldmljZXNcbiAgICB2aWRlbzogZmFsc2UsICAgICAgICAgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogSWYgdXNpbmcgdmlkZW8gaW4gdGhlIHNsaWRlciwgd2lsbCBwcmV2ZW50IENTUzMgM0QgVHJhbnNmb3JtcyB0byBhdm9pZCBncmFwaGljYWwgZ2xpdGNoZXNcblxuICAgIC8vIFByaW1hcnkgQ29udHJvbHNcbiAgICBjb250cm9sTmF2OiB0cnVlLCAgICAgICAgICAgICAgIC8vQm9vbGVhbjogQ3JlYXRlIG5hdmlnYXRpb24gZm9yIHBhZ2luZyBjb250cm9sIG9mIGVhY2ggY2xpZGU/IE5vdGU6IExlYXZlIHRydWUgZm9yIG1hbnVhbENvbnRyb2xzIHVzYWdlXG4gICAgZGlyZWN0aW9uTmF2OiB0cnVlLCAgICAgICAgICAgICAvL0Jvb2xlYW46IENyZWF0ZSBuYXZpZ2F0aW9uIGZvciBwcmV2aW91cy9uZXh0IG5hdmlnYXRpb24/ICh0cnVlL2ZhbHNlKVxuICAgIHByZXZUZXh0OiBcIlByZXZpb3VzXCIsICAgICAgICAgICAvL1N0cmluZzogU2V0IHRoZSB0ZXh0IGZvciB0aGUgXCJwcmV2aW91c1wiIGRpcmVjdGlvbk5hdiBpdGVtXG4gICAgbmV4dFRleHQ6IFwiTmV4dFwiLCAgICAgICAgICAgICAgIC8vU3RyaW5nOiBTZXQgdGhlIHRleHQgZm9yIHRoZSBcIm5leHRcIiBkaXJlY3Rpb25OYXYgaXRlbVxuXG4gICAgLy8gU2Vjb25kYXJ5IE5hdmlnYXRpb25cbiAgICBrZXlib2FyZDogdHJ1ZSwgICAgICAgICAgICAgICAgIC8vQm9vbGVhbjogQWxsb3cgc2xpZGVyIG5hdmlnYXRpbmcgdmlhIGtleWJvYXJkIGxlZnQvcmlnaHQga2V5c1xuICAgIG11bHRpcGxlS2V5Ym9hcmQ6IGZhbHNlLCAgICAgICAgLy97TkVXfSBCb29sZWFuOiBBbGxvdyBrZXlib2FyZCBuYXZpZ2F0aW9uIHRvIGFmZmVjdCBtdWx0aXBsZSBzbGlkZXJzLiBEZWZhdWx0IGJlaGF2aW9yIGN1dHMgb3V0IGtleWJvYXJkIG5hdmlnYXRpb24gd2l0aCBtb3JlIHRoYW4gb25lIHNsaWRlciBwcmVzZW50LlxuICAgIG1vdXNld2hlZWw6IGZhbHNlLCAgICAgICAgICAgICAgLy97VVBEQVRFRH0gQm9vbGVhbjogUmVxdWlyZXMganF1ZXJ5Lm1vdXNld2hlZWwuanMgKGh0dHBzOi8vZ2l0aHViLmNvbS9icmFuZG9uYWFyb24vanF1ZXJ5LW1vdXNld2hlZWwpIC0gQWxsb3dzIHNsaWRlciBuYXZpZ2F0aW5nIHZpYSBtb3VzZXdoZWVsXG4gICAgcGF1c2VQbGF5OiBmYWxzZSwgICAgICAgICAgICAgICAvL0Jvb2xlYW46IENyZWF0ZSBwYXVzZS9wbGF5IGR5bmFtaWMgZWxlbWVudFxuICAgIHBhdXNlVGV4dDogXCJQYXVzZVwiLCAgICAgICAgICAgICAvL1N0cmluZzogU2V0IHRoZSB0ZXh0IGZvciB0aGUgXCJwYXVzZVwiIHBhdXNlUGxheSBpdGVtXG4gICAgcGxheVRleHQ6IFwiUGxheVwiLCAgICAgICAgICAgICAgIC8vU3RyaW5nOiBTZXQgdGhlIHRleHQgZm9yIHRoZSBcInBsYXlcIiBwYXVzZVBsYXkgaXRlbVxuXG4gICAgLy8gU3BlY2lhbCBwcm9wZXJ0aWVzXG4gICAgY29udHJvbHNDb250YWluZXI6IFwiXCIsICAgICAgICAgIC8ve1VQREFURUR9IGpRdWVyeSBPYmplY3QvU2VsZWN0b3I6IERlY2xhcmUgd2hpY2ggY29udGFpbmVyIHRoZSBuYXZpZ2F0aW9uIGVsZW1lbnRzIHNob3VsZCBiZSBhcHBlbmRlZCB0b28uIERlZmF1bHQgY29udGFpbmVyIGlzIHRoZSBGbGV4U2xpZGVyIGVsZW1lbnQuIEV4YW1wbGUgdXNlIHdvdWxkIGJlICQoXCIuZmxleHNsaWRlci1jb250YWluZXJcIikuIFByb3BlcnR5IGlzIGlnbm9yZWQgaWYgZ2l2ZW4gZWxlbWVudCBpcyBub3QgZm91bmQuXG4gICAgbWFudWFsQ29udHJvbHM6IFwiXCIsICAgICAgICAgICAgIC8ve1VQREFURUR9IGpRdWVyeSBPYmplY3QvU2VsZWN0b3I6IERlY2xhcmUgY3VzdG9tIGNvbnRyb2wgbmF2aWdhdGlvbi4gRXhhbXBsZXMgd291bGQgYmUgJChcIi5mbGV4LWNvbnRyb2wtbmF2IGxpXCIpIG9yIFwiI3RhYnMtbmF2IGxpIGltZ1wiLCBldGMuIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4geW91ciBjb250cm9sTmF2IHNob3VsZCBtYXRjaCB0aGUgbnVtYmVyIG9mIHNsaWRlcy90YWJzLlxuICAgIHN5bmM6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAvL3tORVd9IFNlbGVjdG9yOiBNaXJyb3IgdGhlIGFjdGlvbnMgcGVyZm9ybWVkIG9uIHRoaXMgc2xpZGVyIHdpdGggYW5vdGhlciBzbGlkZXIuIFVzZSB3aXRoIGNhcmUuXG4gICAgYXNOYXZGb3I6IFwiXCIsICAgICAgICAgICAgICAgICAgIC8ve05FV30gU2VsZWN0b3I6IEludGVybmFsIHByb3BlcnR5IGV4cG9zZWQgZm9yIHR1cm5pbmcgdGhlIHNsaWRlciBpbnRvIGEgdGh1bWJuYWlsIG5hdmlnYXRpb24gZm9yIGFub3RoZXIgc2xpZGVyXG5cbiAgICAvLyBDYXJvdXNlbCBPcHRpb25zXG4gICAgaXRlbVdpZHRoOiAwLCAgICAgICAgICAgICAgICAgICAvL3tORVd9IEludGVnZXI6IEJveC1tb2RlbCB3aWR0aCBvZiBpbmRpdmlkdWFsIGNhcm91c2VsIGl0ZW1zLCBpbmNsdWRpbmcgaG9yaXpvbnRhbCBib3JkZXJzIGFuZCBwYWRkaW5nLlxuICAgIGl0ZW1NYXJnaW46IDAsICAgICAgICAgICAgICAgICAgLy97TkVXfSBJbnRlZ2VyOiBNYXJnaW4gYmV0d2VlbiBjYXJvdXNlbCBpdGVtcy5cbiAgICBtaW5JdGVtczogMSwgICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogTWluaW11bSBudW1iZXIgb2YgY2Fyb3VzZWwgaXRlbXMgdGhhdCBzaG91bGQgYmUgdmlzaWJsZS4gSXRlbXMgd2lsbCByZXNpemUgZmx1aWRseSB3aGVuIGJlbG93IHRoaXMuXG4gICAgbWF4SXRlbXM6IDAsICAgICAgICAgICAgICAgICAgICAvL3tORVd9IEludGVnZXI6IE1heG1pbXVtIG51bWJlciBvZiBjYXJvdXNlbCBpdGVtcyB0aGF0IHNob3VsZCBiZSB2aXNpYmxlLiBJdGVtcyB3aWxsIHJlc2l6ZSBmbHVpZGx5IHdoZW4gYWJvdmUgdGhpcyBsaW1pdC5cbiAgICBtb3ZlOiAwLCAgICAgICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogTnVtYmVyIG9mIGNhcm91c2VsIGl0ZW1zIHRoYXQgc2hvdWxkIG1vdmUgb24gYW5pbWF0aW9uLiBJZiAwLCBzbGlkZXIgd2lsbCBtb3ZlIGFsbCB2aXNpYmxlIGl0ZW1zLlxuICAgIGFsbG93T25lU2xpZGU6IHRydWUsICAgICAgICAgICAvL3tORVd9IEJvb2xlYW46IFdoZXRoZXIgb3Igbm90IHRvIGFsbG93IGEgc2xpZGVyIGNvbXByaXNlZCBvZiBhIHNpbmdsZSBzbGlkZVxuXG4gICAgLy8gQ2FsbGJhY2sgQVBJXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKCl7fSwgICAgICAgICAgICAvL0NhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgd2hlbiB0aGUgc2xpZGVyIGxvYWRzIHRoZSBmaXJzdCBzbGlkZVxuICAgIGJlZm9yZTogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgLy9DYWxsYmFjazogZnVuY3Rpb24oc2xpZGVyKSAtIEZpcmVzIGFzeW5jaHJvbm91c2x5IHdpdGggZWFjaCBzbGlkZXIgYW5pbWF0aW9uXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uKCl7fSwgICAgICAgICAgICAvL0NhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgYWZ0ZXIgZWFjaCBzbGlkZXIgYW5pbWF0aW9uIGNvbXBsZXRlc1xuICAgIGVuZDogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgICAgLy9DYWxsYmFjazogZnVuY3Rpb24oc2xpZGVyKSAtIEZpcmVzIHdoZW4gdGhlIHNsaWRlciByZWFjaGVzIHRoZSBsYXN0IHNsaWRlIChhc3luY2hyb25vdXMpXG4gICAgYWRkZWQ6IGZ1bmN0aW9uKCl7fSwgICAgICAgICAgICAvL3tORVd9IENhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgYWZ0ZXIgYSBzbGlkZSBpcyBhZGRlZFxuICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKCl7fSwgICAgICAgICAgIC8ve05FV30gQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyBhZnRlciBhIHNsaWRlIGlzIHJlbW92ZWRcbiAgICBpbml0OiBmdW5jdGlvbigpIHt9ICAgICAgICAgICAgIC8ve05FV30gQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyBhZnRlciB0aGUgc2xpZGVyIGlzIGluaXRpYWxseSBzZXR1cFxuICB9O1xuXG4gIC8vRmxleFNsaWRlcjogUGx1Z2luIEZ1bmN0aW9uXG4gICQuZm4uZmxleHNsaWRlciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyA9PT0gdW5kZWZpbmVkKSBvcHRpb25zID0ge307XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICBzZWxlY3RvciA9IChvcHRpb25zLnNlbGVjdG9yKSA/IG9wdGlvbnMuc2VsZWN0b3IgOiBcIi5zbGlkZXMgPiBsaVwiLFxuICAgICAgICAgICAgJHNsaWRlcyA9ICR0aGlzLmZpbmQoc2VsZWN0b3IpO1xuXG4gICAgICBpZiAoICggJHNsaWRlcy5sZW5ndGggPT09IDEgJiYgb3B0aW9ucy5hbGxvd09uZVNsaWRlID09PSB0cnVlICkgfHwgJHNsaWRlcy5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgJHNsaWRlcy5mYWRlSW4oNDAwKTtcbiAgICAgICAgICBpZiAob3B0aW9ucy5zdGFydCkgb3B0aW9ucy5zdGFydCgkdGhpcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoJHRoaXMuZGF0YSgnZmxleHNsaWRlcicpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBuZXcgJC5mbGV4c2xpZGVyKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSGVscGVyIHN0cmluZ3MgdG8gcXVpY2tseSBwZXJmb3JtIGZ1bmN0aW9ucyBvbiB0aGUgc2xpZGVyXG4gICAgICB2YXIgJHNsaWRlciA9ICQodGhpcykuZGF0YSgnZmxleHNsaWRlcicpO1xuICAgICAgc3dpdGNoIChvcHRpb25zKSB7XG4gICAgICAgIGNhc2UgXCJwbGF5XCI6ICRzbGlkZXIucGxheSgpOyBicmVhaztcbiAgICAgICAgY2FzZSBcInBhdXNlXCI6ICRzbGlkZXIucGF1c2UoKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzdG9wXCI6ICRzbGlkZXIuc3RvcCgpOyBicmVhaztcbiAgICAgICAgY2FzZSBcIm5leHRcIjogJHNsaWRlci5mbGV4QW5pbWF0ZSgkc2xpZGVyLmdldFRhcmdldChcIm5leHRcIiksIHRydWUpOyBicmVhaztcbiAgICAgICAgY2FzZSBcInByZXZcIjpcbiAgICAgICAgY2FzZSBcInByZXZpb3VzXCI6ICRzbGlkZXIuZmxleEFuaW1hdGUoJHNsaWRlci5nZXRUYXJnZXQoXCJwcmV2XCIpLCB0cnVlKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6IGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJudW1iZXJcIikgJHNsaWRlci5mbGV4QW5pbWF0ZShvcHRpb25zLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59KShqUXVlcnkpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9