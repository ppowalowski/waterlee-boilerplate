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

// Select-wrapper for select elements

jQuery(document).ready(function() {
    jQuery("select").wrap("<div class='select-wrapper'></div>");
    jQuery("select").after("<i class='fa fa-angle-down'></i>");
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVybml6ci5qcyIsImpxdWVyeS5mbGV4c2xpZGVyLmpzIiwic2NyaXB0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5M0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNybkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InNjcmlwdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogTW9kZXJuaXpyIHYyLjguM1xuICogd3d3Lm1vZGVybml6ci5jb21cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEZhcnVrIEF0ZXMsIFBhdWwgSXJpc2gsIEFsZXggU2V4dG9uXG4gKiBBdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBhbmQgTUlUIGxpY2Vuc2VzOiB3d3cubW9kZXJuaXpyLmNvbS9saWNlbnNlL1xuICovXG5cbi8qXG4gKiBNb2Rlcm5penIgdGVzdHMgd2hpY2ggbmF0aXZlIENTUzMgYW5kIEhUTUw1IGZlYXR1cmVzIGFyZSBhdmFpbGFibGUgaW5cbiAqIHRoZSBjdXJyZW50IFVBIGFuZCBtYWtlcyB0aGUgcmVzdWx0cyBhdmFpbGFibGUgdG8geW91IGluIHR3byB3YXlzOlxuICogYXMgcHJvcGVydGllcyBvbiBhIGdsb2JhbCBNb2Rlcm5penIgb2JqZWN0LCBhbmQgYXMgY2xhc3NlcyBvbiB0aGVcbiAqIDxodG1sPiBlbGVtZW50LiBUaGlzIGluZm9ybWF0aW9uIGFsbG93cyB5b3UgdG8gcHJvZ3Jlc3NpdmVseSBlbmhhbmNlXG4gKiB5b3VyIHBhZ2VzIHdpdGggYSBncmFudWxhciBsZXZlbCBvZiBjb250cm9sIG92ZXIgdGhlIGV4cGVyaWVuY2UuXG4gKlxuICogTW9kZXJuaXpyIGhhcyBhbiBvcHRpb25hbCAobm90IGluY2x1ZGVkKSBjb25kaXRpb25hbCByZXNvdXJjZSBsb2FkZXJcbiAqIGNhbGxlZCBNb2Rlcm5penIubG9hZCgpLCBiYXNlZCBvbiBZZXBub3BlLmpzICh5ZXBub3BlanMuY29tKS5cbiAqIFRvIGdldCBhIGJ1aWxkIHRoYXQgaW5jbHVkZXMgTW9kZXJuaXpyLmxvYWQoKSwgYXMgd2VsbCBhcyBjaG9vc2luZ1xuICogd2hpY2ggdGVzdHMgdG8gaW5jbHVkZSwgZ28gdG8gd3d3Lm1vZGVybml6ci5jb20vZG93bmxvYWQvXG4gKlxuICogQXV0aG9ycyAgICAgICAgRmFydWsgQXRlcywgUGF1bCBJcmlzaCwgQWxleCBTZXh0b25cbiAqIENvbnRyaWJ1dG9ycyAgIFJ5YW4gU2VkZG9uLCBCZW4gQWxtYW5cbiAqL1xuXG53aW5kb3cuTW9kZXJuaXpyID0gKGZ1bmN0aW9uKCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQgKSB7XG5cbiAgICB2YXIgdmVyc2lvbiA9ICcyLjguMycsXG5cbiAgICBNb2Rlcm5penIgPSB7fSxcblxuICAgIC8qPj5jc3NjbGFzc2VzKi9cbiAgICAvLyBvcHRpb24gZm9yIGVuYWJsaW5nIHRoZSBIVE1MIGNsYXNzZXMgdG8gYmUgYWRkZWRcbiAgICBlbmFibGVDbGFzc2VzID0gdHJ1ZSxcbiAgICAvKj4+Y3NzY2xhc3NlcyovXG5cbiAgICBkb2NFbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG91ciBcIm1vZGVybml6clwiIGVsZW1lbnQgdGhhdCB3ZSBkbyBtb3N0IGZlYXR1cmUgdGVzdHMgb24uXG4gICAgICovXG4gICAgbW9kID0gJ21vZGVybml6cicsXG4gICAgbW9kRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobW9kKSxcbiAgICBtU3R5bGUgPSBtb2RFbGVtLnN0eWxlLFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSBpbnB1dCBlbGVtZW50IGZvciB2YXJpb3VzIFdlYiBGb3JtcyBmZWF0dXJlIHRlc3RzLlxuICAgICAqL1xuICAgIGlucHV0RWxlbSAvKj4+aW5wdXRlbGVtKi8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpIC8qPj5pbnB1dGVsZW0qLyAsXG5cbiAgICAvKj4+c21pbGUqL1xuICAgIHNtaWxlID0gJzopJyxcbiAgICAvKj4+c21pbGUqL1xuXG4gICAgdG9TdHJpbmcgPSB7fS50b1N0cmluZyxcblxuICAgIC8vIFRPRE8gOjogbWFrZSB0aGUgcHJlZml4ZXMgbW9yZSBncmFudWxhclxuICAgIC8qPj5wcmVmaXhlcyovXG4gICAgLy8gTGlzdCBvZiBwcm9wZXJ0eSB2YWx1ZXMgdG8gc2V0IGZvciBjc3MgdGVzdHMuIFNlZSB0aWNrZXQgIzIxXG4gICAgcHJlZml4ZXMgPSAnIC13ZWJraXQtIC1tb3otIC1vLSAtbXMtICcuc3BsaXQoJyAnKSxcbiAgICAvKj4+cHJlZml4ZXMqL1xuXG4gICAgLyo+PmRvbXByZWZpeGVzKi9cbiAgICAvLyBGb2xsb3dpbmcgc3BlYyBpcyB0byBleHBvc2UgdmVuZG9yLXNwZWNpZmljIHN0eWxlIHByb3BlcnRpZXMgYXM6XG4gICAgLy8gICBlbGVtLnN0eWxlLldlYmtpdEJvcmRlclJhZGl1c1xuICAgIC8vIGFuZCB0aGUgZm9sbG93aW5nIHdvdWxkIGJlIGluY29ycmVjdDpcbiAgICAvLyAgIGVsZW0uc3R5bGUud2Via2l0Qm9yZGVyUmFkaXVzXG5cbiAgICAvLyBXZWJraXQgZ2hvc3RzIHRoZWlyIHByb3BlcnRpZXMgaW4gbG93ZXJjYXNlIGJ1dCBPcGVyYSAmIE1veiBkbyBub3QuXG4gICAgLy8gTWljcm9zb2Z0IHVzZXMgYSBsb3dlcmNhc2UgYG1zYCBpbnN0ZWFkIG9mIHRoZSBjb3JyZWN0IGBNc2AgaW4gSUU4K1xuICAgIC8vICAgZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDgvMDMvMTAvMjEuNDguMTAvXG5cbiAgICAvLyBNb3JlIGhlcmU6IGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvaXNzdWUvMjFcbiAgICBvbVByZWZpeGVzID0gJ1dlYmtpdCBNb3ogTyBtcycsXG5cbiAgICBjc3NvbVByZWZpeGVzID0gb21QcmVmaXhlcy5zcGxpdCgnICcpLFxuXG4gICAgZG9tUHJlZml4ZXMgPSBvbVByZWZpeGVzLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKSxcbiAgICAvKj4+ZG9tcHJlZml4ZXMqL1xuXG4gICAgLyo+Pm5zKi9cbiAgICBucyA9IHsnc3ZnJzogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ30sXG4gICAgLyo+Pm5zKi9cblxuICAgIHRlc3RzID0ge30sXG4gICAgaW5wdXRzID0ge30sXG4gICAgYXR0cnMgPSB7fSxcblxuICAgIGNsYXNzZXMgPSBbXSxcblxuICAgIHNsaWNlID0gY2xhc3Nlcy5zbGljZSxcblxuICAgIGZlYXR1cmVOYW1lLCAvLyB1c2VkIGluIHRlc3RpbmcgbG9vcFxuXG5cbiAgICAvKj4+dGVzdHN0eWxlcyovXG4gICAgLy8gSW5qZWN0IGVsZW1lbnQgd2l0aCBzdHlsZSBlbGVtZW50IGFuZCBzb21lIENTUyBydWxlc1xuICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzID0gZnVuY3Rpb24oIHJ1bGUsIGNhbGxiYWNrLCBub2RlcywgdGVzdG5hbWVzICkge1xuXG4gICAgICB2YXIgc3R5bGUsIHJldCwgbm9kZSwgZG9jT3ZlcmZsb3csXG4gICAgICAgICAgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgLy8gQWZ0ZXIgcGFnZSBsb2FkIGluamVjdGluZyBhIGZha2UgYm9keSBkb2Vzbid0IHdvcmsgc28gY2hlY2sgaWYgYm9keSBleGlzdHNcbiAgICAgICAgICBib2R5ID0gZG9jdW1lbnQuYm9keSxcbiAgICAgICAgICAvLyBJRTYgYW5kIDcgd29uJ3QgcmV0dXJuIG9mZnNldFdpZHRoIG9yIG9mZnNldEhlaWdodCB1bmxlc3MgaXQncyBpbiB0aGUgYm9keSBlbGVtZW50LCBzbyB3ZSBmYWtlIGl0LlxuICAgICAgICAgIGZha2VCb2R5ID0gYm9keSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5Jyk7XG5cbiAgICAgIGlmICggcGFyc2VJbnQobm9kZXMsIDEwKSApIHtcbiAgICAgICAgICAvLyBJbiBvcmRlciBub3QgdG8gZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMgd2UgY3JlYXRlIGEgbm9kZSBmb3IgZWFjaCB0ZXN0XG4gICAgICAgICAgLy8gVGhpcyBhbHNvIGFsbG93cyB0aGUgbWV0aG9kIHRvIHNjYWxlIGZvciB1bnNwZWNpZmllZCB1c2VzXG4gICAgICAgICAgd2hpbGUgKCBub2Rlcy0tICkge1xuICAgICAgICAgICAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgIG5vZGUuaWQgPSB0ZXN0bmFtZXMgPyB0ZXN0bmFtZXNbbm9kZXNdIDogbW9kICsgKG5vZGVzICsgMSk7XG4gICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIDxzdHlsZT4gZWxlbWVudHMgaW4gSUU2LTkgYXJlIGNvbnNpZGVyZWQgJ05vU2NvcGUnIGVsZW1lbnRzIGFuZCB0aGVyZWZvcmUgd2lsbCBiZSByZW1vdmVkXG4gICAgICAvLyB3aGVuIGluamVjdGVkIHdpdGggaW5uZXJIVE1MLiBUbyBnZXQgYXJvdW5kIHRoaXMgeW91IG5lZWQgdG8gcHJlcGVuZCB0aGUgJ05vU2NvcGUnIGVsZW1lbnRcbiAgICAgIC8vIHdpdGggYSAnc2NvcGVkJyBlbGVtZW50LCBpbiBvdXIgY2FzZSB0aGUgc29mdC1oeXBoZW4gZW50aXR5IGFzIGl0IHdvbid0IG1lc3Mgd2l0aCBvdXIgbWVhc3VyZW1lbnRzLlxuICAgICAgLy8gbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzM4OTclMjhWUy44NSUyOS5hc3B4XG4gICAgICAvLyBEb2N1bWVudHMgc2VydmVkIGFzIHhtbCB3aWxsIHRocm93IGlmIHVzaW5nICZzaHk7IHNvIHVzZSB4bWwgZnJpZW5kbHkgZW5jb2RlZCB2ZXJzaW9uLiBTZWUgaXNzdWUgIzI3N1xuICAgICAgc3R5bGUgPSBbJyYjMTczOycsJzxzdHlsZSBpZD1cInMnLCBtb2QsICdcIj4nLCBydWxlLCAnPC9zdHlsZT4nXS5qb2luKCcnKTtcbiAgICAgIGRpdi5pZCA9IG1vZDtcbiAgICAgIC8vIElFNiB3aWxsIGZhbHNlIHBvc2l0aXZlIG9uIHNvbWUgdGVzdHMgZHVlIHRvIHRoZSBzdHlsZSBlbGVtZW50IGluc2lkZSB0aGUgdGVzdCBkaXYgc29tZWhvdyBpbnRlcmZlcmluZyBvZmZzZXRIZWlnaHQsIHNvIGluc2VydCBpdCBpbnRvIGJvZHkgb3IgZmFrZWJvZHkuXG4gICAgICAvLyBPcGVyYSB3aWxsIGFjdCBhbGwgcXVpcmt5IHdoZW4gaW5qZWN0aW5nIGVsZW1lbnRzIGluIGRvY3VtZW50RWxlbWVudCB3aGVuIHBhZ2UgaXMgc2VydmVkIGFzIHhtbCwgbmVlZHMgZmFrZWJvZHkgdG9vLiAjMjcwXG4gICAgICAoYm9keSA/IGRpdiA6IGZha2VCb2R5KS5pbm5lckhUTUwgKz0gc3R5bGU7XG4gICAgICBmYWtlQm9keS5hcHBlbmRDaGlsZChkaXYpO1xuICAgICAgaWYgKCAhYm9keSApIHtcbiAgICAgICAgICAvL2F2b2lkIGNyYXNoaW5nIElFOCwgaWYgYmFja2dyb3VuZCBpbWFnZSBpcyB1c2VkXG4gICAgICAgICAgZmFrZUJvZHkuc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgIC8vU2FmYXJpIDUuMTMvNS4xLjQgT1NYIHN0b3BzIGxvYWRpbmcgaWYgOjotd2Via2l0LXNjcm9sbGJhciBpcyB1c2VkIGFuZCBzY3JvbGxiYXJzIGFyZSB2aXNpYmxlXG4gICAgICAgICAgZmFrZUJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICBkb2NPdmVyZmxvdyA9IGRvY0VsZW1lbnQuc3R5bGUub3ZlcmZsb3c7XG4gICAgICAgICAgZG9jRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgICAgICAgIGRvY0VsZW1lbnQuYXBwZW5kQ2hpbGQoZmFrZUJvZHkpO1xuICAgICAgfVxuXG4gICAgICByZXQgPSBjYWxsYmFjayhkaXYsIHJ1bGUpO1xuICAgICAgLy8gSWYgdGhpcyBpcyBkb25lIGFmdGVyIHBhZ2UgbG9hZCB3ZSBkb24ndCB3YW50IHRvIHJlbW92ZSB0aGUgYm9keSBzbyBjaGVjayBpZiBib2R5IGV4aXN0c1xuICAgICAgaWYgKCAhYm9keSApIHtcbiAgICAgICAgICBmYWtlQm9keS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZha2VCb2R5KTtcbiAgICAgICAgICBkb2NFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gZG9jT3ZlcmZsb3c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRpdi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGRpdik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhIXJldDtcblxuICAgIH0sXG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuXG4gICAgLyo+Pm1xKi9cbiAgICAvLyBhZGFwdGVkIGZyb20gbWF0Y2hNZWRpYSBwb2x5ZmlsbFxuICAgIC8vIGJ5IFNjb3R0IEplaGwgYW5kIFBhdWwgSXJpc2hcbiAgICAvLyBnaXN0LmdpdGh1Yi5jb20vNzg2NzY4XG4gICAgdGVzdE1lZGlhUXVlcnkgPSBmdW5jdGlvbiggbXEgKSB7XG5cbiAgICAgIHZhciBtYXRjaE1lZGlhID0gd2luZG93Lm1hdGNoTWVkaWEgfHwgd2luZG93Lm1zTWF0Y2hNZWRpYTtcbiAgICAgIGlmICggbWF0Y2hNZWRpYSApIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoTWVkaWEobXEpICYmIG1hdGNoTWVkaWEobXEpLm1hdGNoZXMgfHwgZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBib29sO1xuXG4gICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQG1lZGlhICcgKyBtcSArICcgeyAjJyArIG1vZCArICcgeyBwb3NpdGlvbjogYWJzb2x1dGU7IH0gfScsIGZ1bmN0aW9uKCBub2RlICkge1xuICAgICAgICBib29sID0gKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID9cbiAgICAgICAgICAgICAgICAgIGdldENvbXB1dGVkU3R5bGUobm9kZSwgbnVsbCkgOlxuICAgICAgICAgICAgICAgICAgbm9kZS5jdXJyZW50U3R5bGUpWydwb3NpdGlvbiddID09ICdhYnNvbHV0ZSc7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGJvb2w7XG5cbiAgICAgfSxcbiAgICAgLyo+Pm1xKi9cblxuXG4gICAgLyo+Pmhhc2V2ZW50Ki9cbiAgICAvL1xuICAgIC8vIGlzRXZlbnRTdXBwb3J0ZWQgZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQgc3VwcG9ydHMgdGhlIGdpdmVuIGV2ZW50XG4gICAgLy8ga2FuZ2F4LmdpdGh1Yi5jb20vaXNldmVudHN1cHBvcnRlZC9cbiAgICAvL1xuICAgIC8vIFRoZSBmb2xsb3dpbmcgcmVzdWx0cyBhcmUga25vd24gaW5jb3JyZWN0czpcbiAgICAvLyAgIE1vZGVybml6ci5oYXNFdmVudChcIndlYmtpdFRyYW5zaXRpb25FbmRcIiwgZWxlbSkgLy8gZmFsc2UgbmVnYXRpdmVcbiAgICAvLyAgIE1vZGVybml6ci5oYXNFdmVudChcInRleHRJbnB1dFwiKSAvLyBpbiBXZWJraXQuIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMzMzXG4gICAgLy8gICAuLi5cbiAgICBpc0V2ZW50U3VwcG9ydGVkID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgICB2YXIgVEFHTkFNRVMgPSB7XG4gICAgICAgICdzZWxlY3QnOiAnaW5wdXQnLCAnY2hhbmdlJzogJ2lucHV0JyxcbiAgICAgICAgJ3N1Ym1pdCc6ICdmb3JtJywgJ3Jlc2V0JzogJ2Zvcm0nLFxuICAgICAgICAnZXJyb3InOiAnaW1nJywgJ2xvYWQnOiAnaW1nJywgJ2Fib3J0JzogJ2ltZydcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGlzRXZlbnRTdXBwb3J0ZWQoIGV2ZW50TmFtZSwgZWxlbWVudCApIHtcblxuICAgICAgICBlbGVtZW50ID0gZWxlbWVudCB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFRBR05BTUVTW2V2ZW50TmFtZV0gfHwgJ2RpdicpO1xuICAgICAgICBldmVudE5hbWUgPSAnb24nICsgZXZlbnROYW1lO1xuXG4gICAgICAgIC8vIFdoZW4gdXNpbmcgYHNldEF0dHJpYnV0ZWAsIElFIHNraXBzIFwidW5sb2FkXCIsIFdlYktpdCBza2lwcyBcInVubG9hZFwiIGFuZCBcInJlc2l6ZVwiLCB3aGVyZWFzIGBpbmAgXCJjYXRjaGVzXCIgdGhvc2VcbiAgICAgICAgdmFyIGlzU3VwcG9ydGVkID0gZXZlbnROYW1lIGluIGVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCAhaXNTdXBwb3J0ZWQgKSB7XG4gICAgICAgICAgLy8gSWYgaXQgaGFzIG5vIGBzZXRBdHRyaWJ1dGVgIChpLmUuIGRvZXNuJ3QgaW1wbGVtZW50IE5vZGUgaW50ZXJmYWNlKSwgdHJ5IGdlbmVyaWMgZWxlbWVudFxuICAgICAgICAgIGlmICggIWVsZW1lbnQuc2V0QXR0cmlidXRlICkge1xuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIGVsZW1lbnQuc2V0QXR0cmlidXRlICYmIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlICkge1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoZXZlbnROYW1lLCAnJyk7XG4gICAgICAgICAgICBpc1N1cHBvcnRlZCA9IGlzKGVsZW1lbnRbZXZlbnROYW1lXSwgJ2Z1bmN0aW9uJyk7XG5cbiAgICAgICAgICAgIC8vIElmIHByb3BlcnR5IHdhcyBjcmVhdGVkLCBcInJlbW92ZSBpdFwiIChieSBzZXR0aW5nIHZhbHVlIHRvIGB1bmRlZmluZWRgKVxuICAgICAgICAgICAgaWYgKCAhaXMoZWxlbWVudFtldmVudE5hbWVdLCAndW5kZWZpbmVkJykgKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRbZXZlbnROYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGV2ZW50TmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudCA9IG51bGw7XG4gICAgICAgIHJldHVybiBpc1N1cHBvcnRlZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc0V2ZW50U3VwcG9ydGVkO1xuICAgIH0pKCksXG4gICAgLyo+Pmhhc2V2ZW50Ki9cblxuICAgIC8vIFRPRE8gOjogQWRkIGZsYWcgZm9yIGhhc293bnByb3AgPyBkaWRuJ3QgbGFzdCB0aW1lXG5cbiAgICAvLyBoYXNPd25Qcm9wZXJ0eSBzaGltIGJ5IGthbmdheCBuZWVkZWQgZm9yIFNhZmFyaSAyLjAgc3VwcG9ydFxuICAgIF9oYXNPd25Qcm9wZXJ0eSA9ICh7fSkuaGFzT3duUHJvcGVydHksIGhhc093blByb3A7XG5cbiAgICBpZiAoICFpcyhfaGFzT3duUHJvcGVydHksICd1bmRlZmluZWQnKSAmJiAhaXMoX2hhc093blByb3BlcnR5LmNhbGwsICd1bmRlZmluZWQnKSApIHtcbiAgICAgIGhhc093blByb3AgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICByZXR1cm4gX2hhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGhhc093blByb3AgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkgeyAvKiB5ZXMsIHRoaXMgY2FuIGdpdmUgZmFsc2UgcG9zaXRpdmVzL25lZ2F0aXZlcywgYnV0IG1vc3Qgb2YgdGhlIHRpbWUgd2UgZG9uJ3QgY2FyZSBhYm91dCB0aG9zZSAqL1xuICAgICAgICByZXR1cm4gKChwcm9wZXJ0eSBpbiBvYmplY3QpICYmIGlzKG9iamVjdC5jb25zdHJ1Y3Rvci5wcm90b3R5cGVbcHJvcGVydHldLCAndW5kZWZpbmVkJykpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBZGFwdGVkIGZyb20gRVM1LXNoaW0gaHR0cHM6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9lczUtc2hpbS9ibG9iL21hc3Rlci9lczUtc2hpbS5qc1xuICAgIC8vIGVzNS5naXRodWIuY29tLyN4MTUuMy40LjVcblxuICAgIGlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gYmluZCh0aGF0KSB7XG5cbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgICAgIGJvdW5kID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSB7XG5cbiAgICAgICAgICAgICAgdmFyIEYgPSBmdW5jdGlvbigpe307XG4gICAgICAgICAgICAgIEYucHJvdG90eXBlID0gdGFyZ2V0LnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgdmFyIHNlbGYgPSBuZXcgRigpO1xuXG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0YXJnZXQuYXBwbHkoXG4gICAgICAgICAgICAgICAgICBzZWxmLFxuICAgICAgICAgICAgICAgICAgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0LmFwcGx5KFxuICAgICAgICAgICAgICAgICAgdGhhdCxcbiAgICAgICAgICAgICAgICAgIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSlcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGJvdW5kO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXRDc3MgYXBwbGllcyBnaXZlbiBzdHlsZXMgdG8gdGhlIE1vZGVybml6ciBET00gbm9kZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzZXRDc3MoIHN0ciApIHtcbiAgICAgICAgbVN0eWxlLmNzc1RleHQgPSBzdHI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc2V0Q3NzQWxsIGV4dHJhcG9sYXRlcyBhbGwgdmVuZG9yLXNwZWNpZmljIGNzcyBzdHJpbmdzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNldENzc0FsbCggc3RyMSwgc3RyMiApIHtcbiAgICAgICAgcmV0dXJuIHNldENzcyhwcmVmaXhlcy5qb2luKHN0cjEgKyAnOycpICsgKCBzdHIyIHx8ICcnICkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGlzIHJldHVybnMgYSBib29sZWFuIGZvciBpZiB0eXBlb2Ygb2JqIGlzIGV4YWN0bHkgdHlwZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpcyggb2JqLCB0eXBlICkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gdHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjb250YWlucyByZXR1cm5zIGEgYm9vbGVhbiBmb3IgaWYgc3Vic3RyIGlzIGZvdW5kIHdpdGhpbiBzdHIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29udGFpbnMoIHN0ciwgc3Vic3RyICkge1xuICAgICAgICByZXR1cm4gISF+KCcnICsgc3RyKS5pbmRleE9mKHN1YnN0cik7XG4gICAgfVxuXG4gICAgLyo+PnRlc3Rwcm9wKi9cblxuICAgIC8vIHRlc3RQcm9wcyBpcyBhIGdlbmVyaWMgQ1NTIC8gRE9NIHByb3BlcnR5IHRlc3QuXG5cbiAgICAvLyBJbiB0ZXN0aW5nIHN1cHBvcnQgZm9yIGEgZ2l2ZW4gQ1NTIHByb3BlcnR5LCBpdCdzIGxlZ2l0IHRvIHRlc3Q6XG4gICAgLy8gICAgYGVsZW0uc3R5bGVbc3R5bGVOYW1lXSAhPT0gdW5kZWZpbmVkYFxuICAgIC8vIElmIHRoZSBwcm9wZXJ0eSBpcyBzdXBwb3J0ZWQgaXQgd2lsbCByZXR1cm4gYW4gZW1wdHkgc3RyaW5nLFxuICAgIC8vIGlmIHVuc3VwcG9ydGVkIGl0IHdpbGwgcmV0dXJuIHVuZGVmaW5lZC5cblxuICAgIC8vIFdlJ2xsIHRha2UgYWR2YW50YWdlIG9mIHRoaXMgcXVpY2sgdGVzdCBhbmQgc2tpcCBzZXR0aW5nIGEgc3R5bGVcbiAgICAvLyBvbiBvdXIgbW9kZXJuaXpyIGVsZW1lbnQsIGJ1dCBpbnN0ZWFkIGp1c3QgdGVzdGluZyB1bmRlZmluZWQgdnNcbiAgICAvLyBlbXB0eSBzdHJpbmcuXG5cbiAgICAvLyBCZWNhdXNlIHRoZSB0ZXN0aW5nIG9mIHRoZSBDU1MgcHJvcGVydHkgbmFtZXMgKHdpdGggXCItXCIsIGFzXG4gICAgLy8gb3Bwb3NlZCB0byB0aGUgY2FtZWxDYXNlIERPTSBwcm9wZXJ0aWVzKSBpcyBub24tcG9ydGFibGUgYW5kXG4gICAgLy8gbm9uLXN0YW5kYXJkIGJ1dCB3b3JrcyBpbiBXZWJLaXQgYW5kIElFIChidXQgbm90IEdlY2tvIG9yIE9wZXJhKSxcbiAgICAvLyB3ZSBleHBsaWNpdGx5IHJlamVjdCBwcm9wZXJ0aWVzIHdpdGggZGFzaGVzIHNvIHRoYXQgYXV0aG9yc1xuICAgIC8vIGRldmVsb3BpbmcgaW4gV2ViS2l0IG9yIElFIGZpcnN0IGRvbid0IGVuZCB1cCB3aXRoXG4gICAgLy8gYnJvd3Nlci1zcGVjaWZpYyBjb250ZW50IGJ5IGFjY2lkZW50LlxuXG4gICAgZnVuY3Rpb24gdGVzdFByb3BzKCBwcm9wcywgcHJlZml4ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpIGluIHByb3BzICkge1xuICAgICAgICAgICAgdmFyIHByb3AgPSBwcm9wc1tpXTtcbiAgICAgICAgICAgIGlmICggIWNvbnRhaW5zKHByb3AsIFwiLVwiKSAmJiBtU3R5bGVbcHJvcF0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ZWQgPT0gJ3BmeCcgPyBwcm9wIDogdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qPj50ZXN0cHJvcCovXG5cbiAgICAvLyBUT0RPIDo6IGFkZCB0ZXN0RE9NUHJvcHNcbiAgICAvKipcbiAgICAgKiB0ZXN0RE9NUHJvcHMgaXMgYSBnZW5lcmljIERPTSBwcm9wZXJ0eSB0ZXN0OyBpZiBhIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgKiAgIGEgY2VydGFpbiBwcm9wZXJ0eSwgaXQgd29uJ3QgcmV0dXJuIHVuZGVmaW5lZCBmb3IgaXQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdGVzdERPTVByb3BzKCBwcm9wcywgb2JqLCBlbGVtICkge1xuICAgICAgICBmb3IgKCB2YXIgaSBpbiBwcm9wcyApIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gb2JqW3Byb3BzW2ldXTtcbiAgICAgICAgICAgIGlmICggaXRlbSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdGhlIHByb3BlcnR5IG5hbWUgYXMgYSBzdHJpbmdcbiAgICAgICAgICAgICAgICBpZiAoZWxlbSA9PT0gZmFsc2UpIHJldHVybiBwcm9wc1tpXTtcblxuICAgICAgICAgICAgICAgIC8vIGxldCdzIGJpbmQgYSBmdW5jdGlvblxuICAgICAgICAgICAgICAgIGlmIChpcyhpdGVtLCAnZnVuY3Rpb24nKSl7XG4gICAgICAgICAgICAgICAgICAvLyBkZWZhdWx0IHRvIGF1dG9iaW5kIHVubGVzcyBvdmVycmlkZVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uYmluZChlbGVtIHx8IG9iaik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1bmJvdW5kIGZ1bmN0aW9uIG9yIG9iaiBvciB2YWx1ZVxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cbiAgICAvKipcbiAgICAgKiB0ZXN0UHJvcHNBbGwgdGVzdHMgYSBsaXN0IG9mIERPTSBwcm9wZXJ0aWVzIHdlIHdhbnQgdG8gY2hlY2sgYWdhaW5zdC5cbiAgICAgKiAgIFdlIHNwZWNpZnkgbGl0ZXJhbGx5IEFMTCBwb3NzaWJsZSAoa25vd24gYW5kL29yIGxpa2VseSkgcHJvcGVydGllcyBvblxuICAgICAqICAgdGhlIGVsZW1lbnQgaW5jbHVkaW5nIHRoZSBub24tdmVuZG9yIHByZWZpeGVkIG9uZSwgZm9yIGZvcndhcmQtXG4gICAgICogICBjb21wYXRpYmlsaXR5LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRlc3RQcm9wc0FsbCggcHJvcCwgcHJlZml4ZWQsIGVsZW0gKSB7XG5cbiAgICAgICAgdmFyIHVjUHJvcCAgPSBwcm9wLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zbGljZSgxKSxcbiAgICAgICAgICAgIHByb3BzICAgPSAocHJvcCArICcgJyArIGNzc29tUHJlZml4ZXMuam9pbih1Y1Byb3AgKyAnICcpICsgdWNQcm9wKS5zcGxpdCgnICcpO1xuXG4gICAgICAgIC8vIGRpZCB0aGV5IGNhbGwgLnByZWZpeGVkKCdib3hTaXppbmcnKSBvciBhcmUgd2UganVzdCB0ZXN0aW5nIGEgcHJvcD9cbiAgICAgICAgaWYoaXMocHJlZml4ZWQsIFwic3RyaW5nXCIpIHx8IGlzKHByZWZpeGVkLCBcInVuZGVmaW5lZFwiKSkge1xuICAgICAgICAgIHJldHVybiB0ZXN0UHJvcHMocHJvcHMsIHByZWZpeGVkKTtcblxuICAgICAgICAvLyBvdGhlcndpc2UsIHRoZXkgY2FsbGVkIC5wcmVmaXhlZCgncmVxdWVzdEFuaW1hdGlvbkZyYW1lJywgd2luZG93WywgZWxlbV0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvcHMgPSAocHJvcCArICcgJyArIChkb21QcmVmaXhlcykuam9pbih1Y1Byb3AgKyAnICcpICsgdWNQcm9wKS5zcGxpdCgnICcpO1xuICAgICAgICAgIHJldHVybiB0ZXN0RE9NUHJvcHMocHJvcHMsIHByZWZpeGVkLCBlbGVtKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cblxuXG4gICAgLyoqXG4gICAgICogVGVzdHNcbiAgICAgKiAtLS0tLVxuICAgICAqL1xuXG4gICAgLy8gVGhlICpuZXcqIGZsZXhib3hcbiAgICAvLyBkZXYudzMub3JnL2Nzc3dnL2NzczMtZmxleGJveFxuXG4gICAgdGVzdHNbJ2ZsZXhib3gnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnZmxleFdyYXAnKTtcbiAgICB9O1xuXG4gICAgLy8gVGhlICpvbGQqIGZsZXhib3hcbiAgICAvLyB3d3cudzMub3JnL1RSLzIwMDkvV0QtY3NzMy1mbGV4Ym94LTIwMDkwNzIzL1xuXG4gICAgdGVzdHNbJ2ZsZXhib3hsZWdhY3knXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hEaXJlY3Rpb24nKTtcbiAgICB9O1xuXG4gICAgLy8gT24gdGhlIFM2MCBhbmQgQkIgU3Rvcm0sIGdldENvbnRleHQgZXhpc3RzLCBidXQgYWx3YXlzIHJldHVybnMgdW5kZWZpbmVkXG4gICAgLy8gc28gd2UgYWN0dWFsbHkgaGF2ZSB0byBjYWxsIGdldENvbnRleHQoKSB0byB2ZXJpZnlcbiAgICAvLyBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzL2lzc3VlLzk3L1xuXG4gICAgdGVzdHNbJ2NhbnZhcyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHJldHVybiAhIShlbGVtLmdldENvbnRleHQgJiYgZWxlbS5nZXRDb250ZXh0KCcyZCcpKTtcbiAgICB9O1xuXG4gICAgdGVzdHNbJ2NhbnZhc3RleHQnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISEoTW9kZXJuaXpyWydjYW52YXMnXSAmJiBpcyhkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKS5nZXRDb250ZXh0KCcyZCcpLmZpbGxUZXh0LCAnZnVuY3Rpb24nKSk7XG4gICAgfTtcblxuICAgIC8vIHdlYmsuaXQvNzAxMTcgaXMgdHJhY2tpbmcgYSBsZWdpdCBXZWJHTCBmZWF0dXJlIGRldGVjdCBwcm9wb3NhbFxuXG4gICAgLy8gV2UgZG8gYSBzb2Z0IGRldGVjdCB3aGljaCBtYXkgZmFsc2UgcG9zaXRpdmUgaW4gb3JkZXIgdG8gYXZvaWRcbiAgICAvLyBhbiBleHBlbnNpdmUgY29udGV4dCBjcmVhdGlvbjogYnVnemlsLmxhLzczMjQ0MVxuXG4gICAgdGVzdHNbJ3dlYmdsJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dDtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBUaGUgTW9kZXJuaXpyLnRvdWNoIHRlc3Qgb25seSBpbmRpY2F0ZXMgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgKiAgICB0b3VjaCBldmVudHMsIHdoaWNoIGRvZXMgbm90IG5lY2Vzc2FyaWx5IHJlZmxlY3QgYSB0b3VjaHNjcmVlblxuICAgICAqICAgIGRldmljZSwgYXMgZXZpZGVuY2VkIGJ5IHRhYmxldHMgcnVubmluZyBXaW5kb3dzIDcgb3IsIGFsYXMsXG4gICAgICogICAgdGhlIFBhbG0gUHJlIC8gV2ViT1MgKHRvdWNoKSBwaG9uZXMuXG4gICAgICpcbiAgICAgKiBBZGRpdGlvbmFsbHksIENocm9tZSAoZGVza3RvcCkgdXNlZCB0byBsaWUgYWJvdXQgaXRzIHN1cHBvcnQgb24gdGhpcyxcbiAgICAgKiAgICBidXQgdGhhdCBoYXMgc2luY2UgYmVlbiByZWN0aWZpZWQ6IGNyYnVnLmNvbS8zNjQxNVxuICAgICAqXG4gICAgICogV2UgYWxzbyB0ZXN0IGZvciBGaXJlZm94IDQgTXVsdGl0b3VjaCBTdXBwb3J0LlxuICAgICAqXG4gICAgICogRm9yIG1vcmUgaW5mbywgc2VlOiBtb2Rlcm5penIuZ2l0aHViLmNvbS9Nb2Rlcm5penIvdG91Y2guaHRtbFxuICAgICAqL1xuXG4gICAgdGVzdHNbJ3RvdWNoJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJvb2w7XG5cbiAgICAgICAgaWYoKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykgfHwgd2luZG93LkRvY3VtZW50VG91Y2ggJiYgZG9jdW1lbnQgaW5zdGFuY2VvZiBEb2N1bWVudFRvdWNoKSB7XG4gICAgICAgICAgYm9vbCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5qZWN0RWxlbWVudFdpdGhTdHlsZXMoWydAbWVkaWEgKCcscHJlZml4ZXMuam9pbigndG91Y2gtZW5hYmxlZCksKCcpLG1vZCwnKScsJ3sjbW9kZXJuaXpye3RvcDo5cHg7cG9zaXRpb246YWJzb2x1dGV9fSddLmpvaW4oJycpLCBmdW5jdGlvbiggbm9kZSApIHtcbiAgICAgICAgICAgIGJvb2wgPSBub2RlLm9mZnNldFRvcCA9PT0gOTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG5cblxuICAgIC8vIGdlb2xvY2F0aW9uIGlzIG9mdGVuIGNvbnNpZGVyZWQgYSB0cml2aWFsIGZlYXR1cmUgZGV0ZWN0Li4uXG4gICAgLy8gVHVybnMgb3V0LCBpdCdzIHF1aXRlIHRyaWNreSB0byBnZXQgcmlnaHQ6XG4gICAgLy9cbiAgICAvLyBVc2luZyAhIW5hdmlnYXRvci5nZW9sb2NhdGlvbiBkb2VzIHR3byB0aGluZ3Mgd2UgZG9uJ3Qgd2FudC4gSXQ6XG4gICAgLy8gICAxLiBMZWFrcyBtZW1vcnkgaW4gSUU5OiBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzUxM1xuICAgIC8vICAgMi4gRGlzYWJsZXMgcGFnZSBjYWNoaW5nIGluIFdlYktpdDogd2Viay5pdC80Mzk1NlxuICAgIC8vXG4gICAgLy8gTWVhbndoaWxlLCBpbiBGaXJlZm94IDwgOCwgYW4gYWJvdXQ6Y29uZmlnIHNldHRpbmcgY291bGQgZXhwb3NlXG4gICAgLy8gYSBmYWxzZSBwb3NpdGl2ZSB0aGF0IHdvdWxkIHRocm93IGFuIGV4Y2VwdGlvbjogYnVnemlsLmxhLzY4ODE1OFxuXG4gICAgdGVzdHNbJ2dlb2xvY2F0aW9uJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdnZW9sb2NhdGlvbicgaW4gbmF2aWdhdG9yO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydwb3N0bWVzc2FnZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF3aW5kb3cucG9zdE1lc3NhZ2U7XG4gICAgfTtcblxuXG4gICAgLy8gQ2hyb21lIGluY29nbml0byBtb2RlIHVzZWQgdG8gdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gdXNpbmcgb3BlbkRhdGFiYXNlXG4gICAgLy8gSXQgZG9lc24ndCBhbnltb3JlLlxuICAgIHRlc3RzWyd3ZWJzcWxkYXRhYmFzZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF3aW5kb3cub3BlbkRhdGFiYXNlO1xuICAgIH07XG5cbiAgICAvLyBWZW5kb3JzIGhhZCBpbmNvbnNpc3RlbnQgcHJlZml4aW5nIHdpdGggdGhlIGV4cGVyaW1lbnRhbCBJbmRleGVkIERCOlxuICAgIC8vIC0gV2Via2l0J3MgaW1wbGVtZW50YXRpb24gaXMgYWNjZXNzaWJsZSB0aHJvdWdoIHdlYmtpdEluZGV4ZWREQlxuICAgIC8vIC0gRmlyZWZveCBzaGlwcGVkIG1vel9pbmRleGVkREIgYmVmb3JlIEZGNGI5LCBidXQgc2luY2UgdGhlbiBoYXMgYmVlbiBtb3pJbmRleGVkREJcbiAgICAvLyBGb3Igc3BlZWQsIHdlIGRvbid0IHRlc3QgdGhlIGxlZ2FjeSAoYW5kIGJldGEtb25seSkgaW5kZXhlZERCXG4gICAgdGVzdHNbJ2luZGV4ZWREQiddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF0ZXN0UHJvcHNBbGwoXCJpbmRleGVkREJcIiwgd2luZG93KTtcbiAgICB9O1xuXG4gICAgLy8gZG9jdW1lbnRNb2RlIGxvZ2ljIGZyb20gWVVJIHRvIGZpbHRlciBvdXQgSUU4IENvbXBhdCBNb2RlXG4gICAgLy8gICB3aGljaCBmYWxzZSBwb3NpdGl2ZXMuXG4gICAgdGVzdHNbJ2hhc2hjaGFuZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGlzRXZlbnRTdXBwb3J0ZWQoJ2hhc2hjaGFuZ2UnLCB3aW5kb3cpICYmIChkb2N1bWVudC5kb2N1bWVudE1vZGUgPT09IHVuZGVmaW5lZCB8fCBkb2N1bWVudC5kb2N1bWVudE1vZGUgPiA3KTtcbiAgICB9O1xuXG4gICAgLy8gUGVyIDEuNjpcbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgTW9kZXJuaXpyLmhpc3RvcnltYW5hZ2VtZW50IGJ1dCB0aGUgbG9uZ2VyXG4gICAgLy8gbmFtZSBoYXMgYmVlbiBkZXByZWNhdGVkIGluIGZhdm9yIG9mIGEgc2hvcnRlciBhbmQgcHJvcGVydHktbWF0Y2hpbmcgb25lLlxuICAgIC8vIFRoZSBvbGQgQVBJIGlzIHN0aWxsIGF2YWlsYWJsZSBpbiAxLjYsIGJ1dCBhcyBvZiAyLjAgd2lsbCB0aHJvdyBhIHdhcm5pbmcsXG4gICAgLy8gYW5kIGluIHRoZSBmaXJzdCByZWxlYXNlIHRoZXJlYWZ0ZXIgZGlzYXBwZWFyIGVudGlyZWx5LlxuICAgIHRlc3RzWydoaXN0b3J5J10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhISh3aW5kb3cuaGlzdG9yeSAmJiBoaXN0b3J5LnB1c2hTdGF0ZSk7XG4gICAgfTtcblxuICAgIHRlc3RzWydkcmFnYW5kZHJvcCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcmV0dXJuICgnZHJhZ2dhYmxlJyBpbiBkaXYpIHx8ICgnb25kcmFnc3RhcnQnIGluIGRpdiAmJiAnb25kcm9wJyBpbiBkaXYpO1xuICAgIH07XG5cbiAgICAvLyBGRjMuNiB3YXMgRU9MJ2VkIG9uIDQvMjQvMTIsIGJ1dCB0aGUgRVNSIHZlcnNpb24gb2YgRkYxMFxuICAgIC8vIHdpbGwgYmUgc3VwcG9ydGVkIHVudGlsIEZGMTkgKDIvMTIvMTMpLCBhdCB3aGljaCB0aW1lLCBFU1IgYmVjb21lcyBGRjE3LlxuICAgIC8vIEZGMTAgc3RpbGwgdXNlcyBwcmVmaXhlcywgc28gY2hlY2sgZm9yIGl0IHVudGlsIHRoZW4uXG4gICAgLy8gZm9yIG1vcmUgRVNSIGluZm8sIHNlZTogbW96aWxsYS5vcmcvZW4tVVMvZmlyZWZveC9vcmdhbml6YXRpb25zL2ZhcS9cbiAgICB0ZXN0c1snd2Vic29ja2V0cyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnV2ViU29ja2V0JyBpbiB3aW5kb3cgfHwgJ01veldlYlNvY2tldCcgaW4gd2luZG93O1xuICAgIH07XG5cblxuICAgIC8vIGNzcy10cmlja3MuY29tL3JnYmEtYnJvd3Nlci1zdXBwb3J0L1xuICAgIHRlc3RzWydyZ2JhJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2V0IGFuIHJnYmEoKSBjb2xvciBhbmQgY2hlY2sgdGhlIHJldHVybmVkIHZhbHVlXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTUwLDI1NSwxNTAsLjUpJyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5zKG1TdHlsZS5iYWNrZ3JvdW5kQ29sb3IsICdyZ2JhJyk7XG4gICAgfTtcblxuICAgIHRlc3RzWydoc2xhJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2FtZSBhcyByZ2JhKCksIGluIGZhY3QsIGJyb3dzZXJzIHJlLW1hcCBoc2xhKCkgdG8gcmdiYSgpIGludGVybmFsbHksXG4gICAgICAgIC8vICAgZXhjZXB0IElFOSB3aG8gcmV0YWlucyBpdCBhcyBoc2xhXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kLWNvbG9yOmhzbGEoMTIwLDQwJSwxMDAlLC41KScpO1xuXG4gICAgICAgIHJldHVybiBjb250YWlucyhtU3R5bGUuYmFja2dyb3VuZENvbG9yLCAncmdiYScpIHx8IGNvbnRhaW5zKG1TdHlsZS5iYWNrZ3JvdW5kQ29sb3IsICdoc2xhJyk7XG4gICAgfTtcblxuICAgIHRlc3RzWydtdWx0aXBsZWJncyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFNldHRpbmcgbXVsdGlwbGUgaW1hZ2VzIEFORCBhIGNvbG9yIG9uIHRoZSBiYWNrZ3JvdW5kIHNob3J0aGFuZCBwcm9wZXJ0eVxuICAgICAgICAvLyAgYW5kIHRoZW4gcXVlcnlpbmcgdGhlIHN0eWxlLmJhY2tncm91bmQgcHJvcGVydHkgdmFsdWUgZm9yIHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gIG9jY3VycmVuY2VzIG9mIFwidXJsKFwiIGlzIGEgcmVsaWFibGUgbWV0aG9kIGZvciBkZXRlY3RpbmcgQUNUVUFMIHN1cHBvcnQgZm9yIHRoaXMhXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kOnVybChodHRwczovLyksdXJsKGh0dHBzOi8vKSxyZWQgdXJsKGh0dHBzOi8vKScpO1xuXG4gICAgICAgIC8vIElmIHRoZSBVQSBzdXBwb3J0cyBtdWx0aXBsZSBiYWNrZ3JvdW5kcywgdGhlcmUgc2hvdWxkIGJlIHRocmVlIG9jY3VycmVuY2VzXG4gICAgICAgIC8vICAgb2YgdGhlIHN0cmluZyBcInVybChcIiBpbiB0aGUgcmV0dXJuIHZhbHVlIGZvciBlbGVtU3R5bGUuYmFja2dyb3VuZFxuXG4gICAgICAgIHJldHVybiAoLyh1cmxcXHMqXFwoLio/KXszfS8pLnRlc3QobVN0eWxlLmJhY2tncm91bmQpO1xuICAgIH07XG5cblxuXG4gICAgLy8gdGhpcyB3aWxsIGZhbHNlIHBvc2l0aXZlIGluIE9wZXJhIE1pbmlcbiAgICAvLyAgIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMzk2XG5cbiAgICB0ZXN0c1snYmFja2dyb3VuZHNpemUnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdiYWNrZ3JvdW5kU2l6ZScpO1xuICAgIH07XG5cbiAgICB0ZXN0c1snYm9yZGVyaW1hZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3JkZXJJbWFnZScpO1xuICAgIH07XG5cblxuICAgIC8vIFN1cGVyIGNvbXByZWhlbnNpdmUgdGFibGUgYWJvdXQgYWxsIHRoZSB1bmlxdWUgaW1wbGVtZW50YXRpb25zIG9mXG4gICAgLy8gYm9yZGVyLXJhZGl1czogbXVkZGxlZHJhbWJsaW5ncy5jb20vdGFibGUtb2YtY3NzMy1ib3JkZXItcmFkaXVzLWNvbXBsaWFuY2VcblxuICAgIHRlc3RzWydib3JkZXJyYWRpdXMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3JkZXJSYWRpdXMnKTtcbiAgICB9O1xuXG4gICAgLy8gV2ViT1MgdW5mb3J0dW5hdGVseSBmYWxzZSBwb3NpdGl2ZXMgb24gdGhpcyB0ZXN0LlxuICAgIHRlc3RzWydib3hzaGFkb3cnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hTaGFkb3cnKTtcbiAgICB9O1xuXG4gICAgLy8gRkYzLjAgd2lsbCBmYWxzZSBwb3NpdGl2ZSBvbiB0aGlzIHRlc3RcbiAgICB0ZXN0c1sndGV4dHNoYWRvdyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKS5zdHlsZS50ZXh0U2hhZG93ID09PSAnJztcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snb3BhY2l0eSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEJyb3dzZXJzIHRoYXQgYWN0dWFsbHkgaGF2ZSBDU1MgT3BhY2l0eSBpbXBsZW1lbnRlZCBoYXZlIGRvbmUgc29cbiAgICAgICAgLy8gIGFjY29yZGluZyB0byBzcGVjLCB3aGljaCBtZWFucyB0aGVpciByZXR1cm4gdmFsdWVzIGFyZSB3aXRoaW4gdGhlXG4gICAgICAgIC8vICByYW5nZSBvZiBbMC4wLDEuMF0gLSBpbmNsdWRpbmcgdGhlIGxlYWRpbmcgemVyby5cblxuICAgICAgICBzZXRDc3NBbGwoJ29wYWNpdHk6LjU1Jyk7XG5cbiAgICAgICAgLy8gVGhlIG5vbi1saXRlcmFsIC4gaW4gdGhpcyByZWdleCBpcyBpbnRlbnRpb25hbDpcbiAgICAgICAgLy8gICBHZXJtYW4gQ2hyb21lIHJldHVybnMgdGhpcyB2YWx1ZSBhcyAwLDU1XG4gICAgICAgIC8vIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvI2lzc3VlLzU5L2NvbW1lbnQvNTE2NjMyXG4gICAgICAgIHJldHVybiAoL14wLjU1JC8pLnRlc3QobVN0eWxlLm9wYWNpdHkpO1xuICAgIH07XG5cblxuICAgIC8vIE5vdGUsIEFuZHJvaWQgPCA0IHdpbGwgcGFzcyB0aGlzIHRlc3QsIGJ1dCBjYW4gb25seSBhbmltYXRlXG4gICAgLy8gICBhIHNpbmdsZSBwcm9wZXJ0eSBhdCBhIHRpbWVcbiAgICAvLyAgIGdvby5nbC92M1Y0R3BcbiAgICB0ZXN0c1snY3NzYW5pbWF0aW9ucyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2FuaW1hdGlvbk5hbWUnKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzY29sdW1ucyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2NvbHVtbkNvdW50Jyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc2dyYWRpZW50cyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgQ1NTIEdyYWRpZW50cyBzeW50YXgsIHBsZWFzZSBzZWU6XG4gICAgICAgICAqIHdlYmtpdC5vcmcvYmxvZy8xNzUvaW50cm9kdWNpbmctY3NzLWdyYWRpZW50cy9cbiAgICAgICAgICogZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0NTUy8tbW96LWxpbmVhci1ncmFkaWVudFxuICAgICAgICAgKiBkZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vQ1NTLy1tb3otcmFkaWFsLWdyYWRpZW50XG4gICAgICAgICAqIGRldi53My5vcmcvY3Nzd2cvY3NzMy1pbWFnZXMvI2dyYWRpZW50cy1cbiAgICAgICAgICovXG5cbiAgICAgICAgdmFyIHN0cjEgPSAnYmFja2dyb3VuZC1pbWFnZTonLFxuICAgICAgICAgICAgc3RyMiA9ICdncmFkaWVudChsaW5lYXIsbGVmdCB0b3AscmlnaHQgYm90dG9tLGZyb20oIzlmOSksdG8od2hpdGUpKTsnLFxuICAgICAgICAgICAgc3RyMyA9ICdsaW5lYXItZ3JhZGllbnQobGVmdCB0b3AsIzlmOSwgd2hpdGUpOyc7XG5cbiAgICAgICAgc2V0Q3NzKFxuICAgICAgICAgICAgIC8vIGxlZ2FjeSB3ZWJraXQgc3ludGF4IChGSVhNRTogcmVtb3ZlIHdoZW4gc3ludGF4IG5vdCBpbiB1c2UgYW55bW9yZSlcbiAgICAgICAgICAgICAgKHN0cjEgKyAnLXdlYmtpdC0gJy5zcGxpdCgnICcpLmpvaW4oc3RyMiArIHN0cjEpICtcbiAgICAgICAgICAgICAvLyBzdGFuZGFyZCBzeW50YXggICAgICAgICAgICAgLy8gdHJhaWxpbmcgJ2JhY2tncm91bmQtaW1hZ2U6J1xuICAgICAgICAgICAgICBwcmVmaXhlcy5qb2luKHN0cjMgKyBzdHIxKSkuc2xpY2UoMCwgLXN0cjEubGVuZ3RoKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBjb250YWlucyhtU3R5bGUuYmFja2dyb3VuZEltYWdlLCAnZ3JhZGllbnQnKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzcmVmbGVjdGlvbnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hSZWZsZWN0Jyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc3RyYW5zZm9ybXMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISF0ZXN0UHJvcHNBbGwoJ3RyYW5zZm9ybScpO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydjc3N0cmFuc2Zvcm1zM2QnXSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciByZXQgPSAhIXRlc3RQcm9wc0FsbCgncGVyc3BlY3RpdmUnKTtcblxuICAgICAgICAvLyBXZWJraXQncyAzRCB0cmFuc2Zvcm1zIGFyZSBwYXNzZWQgb2ZmIHRvIHRoZSBicm93c2VyJ3Mgb3duIGdyYXBoaWNzIHJlbmRlcmVyLlxuICAgICAgICAvLyAgIEl0IHdvcmtzIGZpbmUgaW4gU2FmYXJpIG9uIExlb3BhcmQgYW5kIFNub3cgTGVvcGFyZCwgYnV0IG5vdCBpbiBDaHJvbWUgaW5cbiAgICAgICAgLy8gICBzb21lIGNvbmRpdGlvbnMuIEFzIGEgcmVzdWx0LCBXZWJraXQgdHlwaWNhbGx5IHJlY29nbml6ZXMgdGhlIHN5bnRheCBidXRcbiAgICAgICAgLy8gICB3aWxsIHNvbWV0aW1lcyB0aHJvdyBhIGZhbHNlIHBvc2l0aXZlLCB0aHVzIHdlIG11c3QgZG8gYSBtb3JlIHRob3JvdWdoIGNoZWNrOlxuICAgICAgICBpZiAoIHJldCAmJiAnd2Via2l0UGVyc3BlY3RpdmUnIGluIGRvY0VsZW1lbnQuc3R5bGUgKSB7XG5cbiAgICAgICAgICAvLyBXZWJraXQgYWxsb3dzIHRoaXMgbWVkaWEgcXVlcnkgdG8gc3VjY2VlZCBvbmx5IGlmIHRoZSBmZWF0dXJlIGlzIGVuYWJsZWQuXG4gICAgICAgICAgLy8gYEBtZWRpYSAodHJhbnNmb3JtLTNkKSwoLXdlYmtpdC10cmFuc2Zvcm0tM2QpeyAuLi4gfWBcbiAgICAgICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQG1lZGlhICh0cmFuc2Zvcm0tM2QpLCgtd2Via2l0LXRyYW5zZm9ybS0zZCl7I21vZGVybml6cntsZWZ0OjlweDtwb3NpdGlvbjphYnNvbHV0ZTtoZWlnaHQ6M3B4O319JywgZnVuY3Rpb24oIG5vZGUsIHJ1bGUgKSB7XG4gICAgICAgICAgICByZXQgPSBub2RlLm9mZnNldExlZnQgPT09IDkgJiYgbm9kZS5vZmZzZXRIZWlnaHQgPT09IDM7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzdHJhbnNpdGlvbnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCd0cmFuc2l0aW9uJyk7XG4gICAgfTtcblxuXG4gICAgLyo+PmZvbnRmYWNlKi9cbiAgICAvLyBAZm9udC1mYWNlIGRldGVjdGlvbiByb3V0aW5lIGJ5IERpZWdvIFBlcmluaVxuICAgIC8vIGphdmFzY3JpcHQubndib3guY29tL0NTU1N1cHBvcnQvXG5cbiAgICAvLyBmYWxzZSBwb3NpdGl2ZXM6XG4gICAgLy8gICBXZWJPUyBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzM0MlxuICAgIC8vICAgV1A3ICAgZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy81MzhcbiAgICB0ZXN0c1snZm9udGZhY2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYm9vbDtcblxuICAgICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQGZvbnQtZmFjZSB7Zm9udC1mYW1pbHk6XCJmb250XCI7c3JjOnVybChcImh0dHBzOi8vXCIpfScsIGZ1bmN0aW9uKCBub2RlLCBydWxlICkge1xuICAgICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbW9kZXJuaXpyJyksXG4gICAgICAgICAgICAgIHNoZWV0ID0gc3R5bGUuc2hlZXQgfHwgc3R5bGUuc3R5bGVTaGVldCxcbiAgICAgICAgICAgICAgY3NzVGV4dCA9IHNoZWV0ID8gKHNoZWV0LmNzc1J1bGVzICYmIHNoZWV0LmNzc1J1bGVzWzBdID8gc2hlZXQuY3NzUnVsZXNbMF0uY3NzVGV4dCA6IHNoZWV0LmNzc1RleHQgfHwgJycpIDogJyc7XG5cbiAgICAgICAgICBib29sID0gL3NyYy9pLnRlc3QoY3NzVGV4dCkgJiYgY3NzVGV4dC5pbmRleE9mKHJ1bGUuc3BsaXQoJyAnKVswXSkgPT09IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG4gICAgLyo+PmZvbnRmYWNlKi9cblxuICAgIC8vIENTUyBnZW5lcmF0ZWQgY29udGVudCBkZXRlY3Rpb25cbiAgICB0ZXN0c1snZ2VuZXJhdGVkY29udGVudCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBib29sO1xuXG4gICAgICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzKFsnIycsbW9kLCd7Zm9udDowLzAgYX0jJyxtb2QsJzphZnRlcntjb250ZW50OlwiJyxzbWlsZSwnXCI7dmlzaWJpbGl0eTpoaWRkZW47Zm9udDozcHgvMSBhfSddLmpvaW4oJycpLCBmdW5jdGlvbiggbm9kZSApIHtcbiAgICAgICAgICBib29sID0gbm9kZS5vZmZzZXRIZWlnaHQgPj0gMztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcblxuXG5cbiAgICAvLyBUaGVzZSB0ZXN0cyBldmFsdWF0ZSBzdXBwb3J0IG9mIHRoZSB2aWRlby9hdWRpbyBlbGVtZW50cywgYXMgd2VsbCBhc1xuICAgIC8vIHRlc3Rpbmcgd2hhdCB0eXBlcyBvZiBjb250ZW50IHRoZXkgc3VwcG9ydC5cbiAgICAvL1xuICAgIC8vIFdlJ3JlIHVzaW5nIHRoZSBCb29sZWFuIGNvbnN0cnVjdG9yIGhlcmUsIHNvIHRoYXQgd2UgY2FuIGV4dGVuZCB0aGUgdmFsdWVcbiAgICAvLyBlLmcuICBNb2Rlcm5penIudmlkZW8gICAgIC8vIHRydWVcbiAgICAvLyAgICAgICBNb2Rlcm5penIudmlkZW8ub2dnIC8vICdwcm9iYWJseSdcbiAgICAvL1xuICAgIC8vIENvZGVjIHZhbHVlcyBmcm9tIDogZ2l0aHViLmNvbS9OaWVsc0xlZW5oZWVyL2h0bWw1dGVzdC9ibG9iLzkxMDZhOC9pbmRleC5odG1sI0w4NDVcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHRoeCB0byBOaWVsc0xlZW5oZWVyIGFuZCB6Y29ycGFuXG5cbiAgICAvLyBOb3RlOiBpbiBzb21lIG9sZGVyIGJyb3dzZXJzLCBcIm5vXCIgd2FzIGEgcmV0dXJuIHZhbHVlIGluc3RlYWQgb2YgZW1wdHkgc3RyaW5nLlxuICAgIC8vICAgSXQgd2FzIGxpdmUgaW4gRkYzLjUuMCBhbmQgMy41LjEsIGJ1dCBmaXhlZCBpbiAzLjUuMlxuICAgIC8vICAgSXQgd2FzIGFsc28gbGl2ZSBpbiBTYWZhcmkgNC4wLjAgLSA0LjAuNCwgYnV0IGZpeGVkIGluIDQuMC41XG5cbiAgICB0ZXN0c1sndmlkZW8nXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyksXG4gICAgICAgICAgICBib29sID0gZmFsc2U7XG5cbiAgICAgICAgLy8gSUU5IFJ1bm5pbmcgb24gV2luZG93cyBTZXJ2ZXIgU0tVIGNhbiBjYXVzZSBhbiBleGNlcHRpb24gdG8gYmUgdGhyb3duLCBidWcgIzIyNFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCBib29sID0gISFlbGVtLmNhblBsYXlUeXBlICkge1xuICAgICAgICAgICAgICAgIGJvb2wgICAgICA9IG5ldyBCb29sZWFuKGJvb2wpO1xuICAgICAgICAgICAgICAgIGJvb2wub2dnICA9IGVsZW0uY2FuUGxheVR5cGUoJ3ZpZGVvL29nZzsgY29kZWNzPVwidGhlb3JhXCInKSAgICAgIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBXaXRob3V0IFF1aWNrVGltZSwgdGhpcyB2YWx1ZSB3aWxsIGJlIGB1bmRlZmluZWRgLiBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzU0NlxuICAgICAgICAgICAgICAgIGJvb2wuaDI2NCA9IGVsZW0uY2FuUGxheVR5cGUoJ3ZpZGVvL21wNDsgY29kZWNzPVwiYXZjMS40MkUwMUVcIicpIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICBib29sLndlYm0gPSBlbGVtLmNhblBsYXlUeXBlKCd2aWRlby93ZWJtOyBjb2RlY3M9XCJ2cDgsIHZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sJycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gY2F0Y2goZSkgeyB9XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcblxuICAgIHRlc3RzWydhdWRpbyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKSxcbiAgICAgICAgICAgIGJvb2wgPSBmYWxzZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCBib29sID0gISFlbGVtLmNhblBsYXlUeXBlICkge1xuICAgICAgICAgICAgICAgIGJvb2wgICAgICA9IG5ldyBCb29sZWFuKGJvb2wpO1xuICAgICAgICAgICAgICAgIGJvb2wub2dnICA9IGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL29nZzsgY29kZWNzPVwidm9yYmlzXCInKS5yZXBsYWNlKC9ebm8kLywnJyk7XG4gICAgICAgICAgICAgICAgYm9vbC5tcDMgID0gZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8vbXBlZzsnKSAgICAgICAgICAgICAgIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBNaW1ldHlwZXMgYWNjZXB0ZWQ6XG4gICAgICAgICAgICAgICAgLy8gICBkZXZlbG9wZXIubW96aWxsYS5vcmcvRW4vTWVkaWFfZm9ybWF0c19zdXBwb3J0ZWRfYnlfdGhlX2F1ZGlvX2FuZF92aWRlb19lbGVtZW50c1xuICAgICAgICAgICAgICAgIC8vICAgYml0Lmx5L2lwaG9uZW9zY29kZWNzXG4gICAgICAgICAgICAgICAgYm9vbC53YXYgID0gZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8vd2F2OyBjb2RlY3M9XCIxXCInKSAgICAgLnJlcGxhY2UoL15ubyQvLCcnKTtcbiAgICAgICAgICAgICAgICBib29sLm00YSAgPSAoIGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL3gtbTRhOycpICAgICAgICAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL2FhYzsnKSkgICAgICAgICAgICAgLnJlcGxhY2UoL15ubyQvLCcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaChlKSB7IH1cblxuICAgICAgICByZXR1cm4gYm9vbDtcbiAgICB9O1xuXG5cbiAgICAvLyBJbiBGRjQsIGlmIGRpc2FibGVkLCB3aW5kb3cubG9jYWxTdG9yYWdlIHNob3VsZCA9PT0gbnVsbC5cblxuICAgIC8vIE5vcm1hbGx5LCB3ZSBjb3VsZCBub3QgdGVzdCB0aGF0IGRpcmVjdGx5IGFuZCBuZWVkIHRvIGRvIGFcbiAgICAvLyAgIGAoJ2xvY2FsU3RvcmFnZScgaW4gd2luZG93KSAmJiBgIHRlc3QgZmlyc3QgYmVjYXVzZSBvdGhlcndpc2UgRmlyZWZveCB3aWxsXG4gICAgLy8gICB0aHJvdyBidWd6aWwubGEvMzY1NzcyIGlmIGNvb2tpZXMgYXJlIGRpc2FibGVkXG5cbiAgICAvLyBBbHNvIGluIGlPUzUgUHJpdmF0ZSBCcm93c2luZyBtb2RlLCBhdHRlbXB0aW5nIHRvIHVzZSBsb2NhbFN0b3JhZ2Uuc2V0SXRlbVxuICAgIC8vIHdpbGwgdGhyb3cgdGhlIGV4Y2VwdGlvbjpcbiAgICAvLyAgIFFVT1RBX0VYQ0VFREVEX0VSUlJPUiBET00gRXhjZXB0aW9uIDIyLlxuICAgIC8vIFBlY3VsaWFybHksIGdldEl0ZW0gYW5kIHJlbW92ZUl0ZW0gY2FsbHMgZG8gbm90IHRocm93LlxuXG4gICAgLy8gQmVjYXVzZSB3ZSBhcmUgZm9yY2VkIHRvIHRyeS9jYXRjaCB0aGlzLCB3ZSdsbCBnbyBhZ2dyZXNzaXZlLlxuXG4gICAgLy8gSnVzdCBGV0lXOiBJRTggQ29tcGF0IG1vZGUgc3VwcG9ydHMgdGhlc2UgZmVhdHVyZXMgY29tcGxldGVseTpcbiAgICAvLyAgIHd3dy5xdWlya3Ntb2RlLm9yZy9kb20vaHRtbDUuaHRtbFxuICAgIC8vIEJ1dCBJRTggZG9lc24ndCBzdXBwb3J0IGVpdGhlciB3aXRoIGxvY2FsIGZpbGVzXG5cbiAgICB0ZXN0c1snbG9jYWxzdG9yYWdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKG1vZCwgbW9kKTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKG1vZCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGVzdHNbJ3Nlc3Npb25zdG9yYWdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0obW9kLCBtb2QpO1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShtb2QpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ3dlYndvcmtlcnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISF3aW5kb3cuV29ya2VyO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydhcHBsaWNhdGlvbmNhY2hlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhd2luZG93LmFwcGxpY2F0aW9uQ2FjaGU7XG4gICAgfTtcblxuXG4gICAgLy8gVGhhbmtzIHRvIEVyaWsgRGFobHN0cm9tXG4gICAgdGVzdHNbJ3N2ZyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucy5zdmcsICdzdmcnKS5jcmVhdGVTVkdSZWN0O1xuICAgIH07XG5cbiAgICAvLyBzcGVjaWZpY2FsbHkgZm9yIFNWRyBpbmxpbmUgaW4gSFRNTCwgbm90IHdpdGhpbiBYSFRNTFxuICAgIC8vIHRlc3QgcGFnZTogcGF1bGlyaXNoLmNvbS9kZW1vL2lubGluZS1zdmdcbiAgICB0ZXN0c1snaW5saW5lc3ZnJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGRpdi5pbm5lckhUTUwgPSAnPHN2Zy8+JztcbiAgICAgIHJldHVybiAoZGl2LmZpcnN0Q2hpbGQgJiYgZGl2LmZpcnN0Q2hpbGQubmFtZXNwYWNlVVJJKSA9PSBucy5zdmc7XG4gICAgfTtcblxuICAgIC8vIFNWRyBTTUlMIGFuaW1hdGlvblxuICAgIHRlc3RzWydzbWlsJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICYmIC9TVkdBbmltYXRlLy50ZXN0KHRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLnN2ZywgJ2FuaW1hdGUnKSkpO1xuICAgIH07XG5cbiAgICAvLyBUaGlzIHRlc3QgaXMgb25seSBmb3IgY2xpcCBwYXRocyBpbiBTVkcgcHJvcGVyLCBub3QgY2xpcCBwYXRocyBvbiBIVE1MIGNvbnRlbnRcbiAgICAvLyBkZW1vOiBzcnVmYWN1bHR5LnNydS5lZHUvZGF2aWQuZGFpbGV5L3N2Zy9uZXdzdHVmZi9jbGlwUGF0aDQuc3ZnXG5cbiAgICAvLyBIb3dldmVyIHJlYWQgdGhlIGNvbW1lbnRzIHRvIGRpZyBpbnRvIGFwcGx5aW5nIFNWRyBjbGlwcGF0aHMgdG8gSFRNTCBjb250ZW50IGhlcmU6XG4gICAgLy8gICBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzIxMyNpc3N1ZWNvbW1lbnQtMTE0OTQ5MVxuICAgIHRlc3RzWydzdmdjbGlwcGF0aHMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiYgL1NWR0NsaXBQYXRoLy50ZXN0KHRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLnN2ZywgJ2NsaXBQYXRoJykpKTtcbiAgICB9O1xuXG4gICAgLyo+PndlYmZvcm1zKi9cbiAgICAvLyBpbnB1dCBmZWF0dXJlcyBhbmQgaW5wdXQgdHlwZXMgZ28gZGlyZWN0bHkgb250byB0aGUgcmV0IG9iamVjdCwgYnlwYXNzaW5nIHRoZSB0ZXN0cyBsb29wLlxuICAgIC8vIEhvbGQgdGhpcyBndXkgdG8gZXhlY3V0ZSBpbiBhIG1vbWVudC5cbiAgICBmdW5jdGlvbiB3ZWJmb3JtcygpIHtcbiAgICAgICAgLyo+PmlucHV0Ki9cbiAgICAgICAgLy8gUnVuIHRocm91Z2ggSFRNTDUncyBuZXcgaW5wdXQgYXR0cmlidXRlcyB0byBzZWUgaWYgdGhlIFVBIHVuZGVyc3RhbmRzIGFueS5cbiAgICAgICAgLy8gV2UncmUgdXNpbmcgZiB3aGljaCBpcyB0aGUgPGlucHV0PiBlbGVtZW50IGNyZWF0ZWQgZWFybHkgb25cbiAgICAgICAgLy8gTWlrZSBUYXlsciBoYXMgY3JlYXRlZCBhIGNvbXByZWhlbnNpdmUgcmVzb3VyY2UgZm9yIHRlc3RpbmcgdGhlc2UgYXR0cmlidXRlc1xuICAgICAgICAvLyAgIHdoZW4gYXBwbGllZCB0byBhbGwgaW5wdXQgdHlwZXM6XG4gICAgICAgIC8vICAgbWlrZXRheWxyLmNvbS9jb2RlL2lucHV0LXR5cGUtYXR0ci5odG1sXG4gICAgICAgIC8vIHNwZWM6IHd3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvdGhlLWlucHV0LWVsZW1lbnQuaHRtbCNpbnB1dC10eXBlLWF0dHItc3VtbWFyeVxuXG4gICAgICAgIC8vIE9ubHkgaW5wdXQgcGxhY2Vob2xkZXIgaXMgdGVzdGVkIHdoaWxlIHRleHRhcmVhJ3MgcGxhY2Vob2xkZXIgaXMgbm90LlxuICAgICAgICAvLyBDdXJyZW50bHkgU2FmYXJpIDQgYW5kIE9wZXJhIDExIGhhdmUgc3VwcG9ydCBvbmx5IGZvciB0aGUgaW5wdXQgcGxhY2Vob2xkZXJcbiAgICAgICAgLy8gQm90aCB0ZXN0cyBhcmUgYXZhaWxhYmxlIGluIGZlYXR1cmUtZGV0ZWN0cy9mb3Jtcy1wbGFjZWhvbGRlci5qc1xuICAgICAgICBNb2Rlcm5penJbJ2lucHV0J10gPSAoZnVuY3Rpb24oIHByb3BzICkge1xuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsZW4gPSBwcm9wcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICBhdHRyc1sgcHJvcHNbaV0gXSA9ICEhKHByb3BzW2ldIGluIGlucHV0RWxlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXR0cnMubGlzdCl7XG4gICAgICAgICAgICAgIC8vIHNhZmFyaSBmYWxzZSBwb3NpdGl2ZSdzIG9uIGRhdGFsaXN0OiB3ZWJrLml0Lzc0MjUyXG4gICAgICAgICAgICAgIC8vIHNlZSBhbHNvIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMTQ2XG4gICAgICAgICAgICAgIGF0dHJzLmxpc3QgPSAhIShkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkYXRhbGlzdCcpICYmIHdpbmRvdy5IVE1MRGF0YUxpc3RFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhdHRycztcbiAgICAgICAgfSkoJ2F1dG9jb21wbGV0ZSBhdXRvZm9jdXMgbGlzdCBwbGFjZWhvbGRlciBtYXggbWluIG11bHRpcGxlIHBhdHRlcm4gcmVxdWlyZWQgc3RlcCcuc3BsaXQoJyAnKSk7XG4gICAgICAgIC8qPj5pbnB1dCovXG5cbiAgICAgICAgLyo+PmlucHV0dHlwZXMqL1xuICAgICAgICAvLyBSdW4gdGhyb3VnaCBIVE1MNSdzIG5ldyBpbnB1dCB0eXBlcyB0byBzZWUgaWYgdGhlIFVBIHVuZGVyc3RhbmRzIGFueS5cbiAgICAgICAgLy8gICBUaGlzIGlzIHB1dCBiZWhpbmQgdGhlIHRlc3RzIHJ1bmxvb3AgYmVjYXVzZSBpdCBkb2Vzbid0IHJldHVybiBhXG4gICAgICAgIC8vICAgdHJ1ZS9mYWxzZSBsaWtlIGFsbCB0aGUgb3RoZXIgdGVzdHM7IGluc3RlYWQsIGl0IHJldHVybnMgYW4gb2JqZWN0XG4gICAgICAgIC8vICAgY29udGFpbmluZyBlYWNoIGlucHV0IHR5cGUgd2l0aCBpdHMgY29ycmVzcG9uZGluZyB0cnVlL2ZhbHNlIHZhbHVlXG5cbiAgICAgICAgLy8gQmlnIHRoYW5rcyB0byBAbWlrZXRheWxyIGZvciB0aGUgaHRtbDUgZm9ybXMgZXhwZXJ0aXNlLiBtaWtldGF5bHIuY29tL1xuICAgICAgICBNb2Rlcm5penJbJ2lucHV0dHlwZXMnXSA9IChmdW5jdGlvbihwcm9wcykge1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGJvb2wsIGlucHV0RWxlbVR5cGUsIGRlZmF1bHRWaWV3LCBsZW4gPSBwcm9wcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIGlucHV0RWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCBpbnB1dEVsZW1UeXBlID0gcHJvcHNbaV0pO1xuICAgICAgICAgICAgICAgIGJvb2wgPSBpbnB1dEVsZW0udHlwZSAhPT0gJ3RleHQnO1xuXG4gICAgICAgICAgICAgICAgLy8gV2UgZmlyc3QgY2hlY2sgdG8gc2VlIGlmIHRoZSB0eXBlIHdlIGdpdmUgaXQgc3RpY2tzLi5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdHlwZSBkb2VzLCB3ZSBmZWVkIGl0IGEgdGV4dHVhbCB2YWx1ZSwgd2hpY2ggc2hvdWxkbid0IGJlIHZhbGlkLlxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSB2YWx1ZSBkb2Vzbid0IHN0aWNrLCB3ZSBrbm93IHRoZXJlJ3MgaW5wdXQgc2FuaXRpemF0aW9uIHdoaWNoIGluZmVycyBhIGN1c3RvbSBVSVxuICAgICAgICAgICAgICAgIGlmICggYm9vbCApIHtcblxuICAgICAgICAgICAgICAgICAgICBpbnB1dEVsZW0udmFsdWUgICAgICAgICA9IHNtaWxlO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dEVsZW0uc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTt2aXNpYmlsaXR5OmhpZGRlbjsnO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggL15yYW5nZSQvLnRlc3QoaW5wdXRFbGVtVHlwZSkgJiYgaW5wdXRFbGVtLnN0eWxlLldlYmtpdEFwcGVhcmFuY2UgIT09IHVuZGVmaW5lZCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgIGRvY0VsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXRFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmlldyA9IGRvY3VtZW50LmRlZmF1bHRWaWV3O1xuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDItNCBhbGxvd3MgdGhlIHNtaWxleSBhcyBhIHZhbHVlLCBkZXNwaXRlIG1ha2luZyBhIHNsaWRlclxuICAgICAgICAgICAgICAgICAgICAgIGJvb2wgPSAgZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShpbnB1dEVsZW0sIG51bGwpLldlYmtpdEFwcGVhcmFuY2UgIT09ICd0ZXh0ZmllbGQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNb2JpbGUgYW5kcm9pZCB3ZWIgYnJvd3NlciBoYXMgZmFsc2UgcG9zaXRpdmUsIHNvIG11c3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBoZWlnaHQgdG8gc2VlIGlmIHRoZSB3aWRnZXQgaXMgYWN0dWFsbHkgdGhlcmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5wdXRFbGVtLm9mZnNldEhlaWdodCAhPT0gMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBkb2NFbGVtZW50LnJlbW92ZUNoaWxkKGlucHV0RWxlbSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICggL14oc2VhcmNofHRlbCkkLy50ZXN0KGlucHV0RWxlbVR5cGUpICl7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gU3BlYyBkb2Vzbid0IGRlZmluZSBhbnkgc3BlY2lhbCBwYXJzaW5nIG9yIGRldGVjdGFibGUgVUlcbiAgICAgICAgICAgICAgICAgICAgICAvLyAgIGJlaGF2aW9ycyBzbyB3ZSBwYXNzIHRoZXNlIHRocm91Z2ggYXMgdHJ1ZVxuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSW50ZXJlc3RpbmdseSwgb3BlcmEgZmFpbHMgdGhlIGVhcmxpZXIgdGVzdCwgc28gaXQgZG9lc24ndFxuICAgICAgICAgICAgICAgICAgICAgIC8vICBldmVuIG1ha2UgaXQgaGVyZS5cblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCAvXih1cmx8ZW1haWwpJC8udGVzdChpbnB1dEVsZW1UeXBlKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBSZWFsIHVybCBhbmQgZW1haWwgc3VwcG9ydCBjb21lcyB3aXRoIHByZWJha2VkIHZhbGlkYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgYm9vbCA9IGlucHV0RWxlbS5jaGVja1ZhbGlkaXR5ICYmIGlucHV0RWxlbS5jaGVja1ZhbGlkaXR5KCkgPT09IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHVwZ3JhZGVkIGlucHV0IGNvbXBvbnRlbnQgcmVqZWN0cyB0aGUgOikgdGV4dCwgd2UgZ290IGEgd2lubmVyXG4gICAgICAgICAgICAgICAgICAgICAgYm9vbCA9IGlucHV0RWxlbS52YWx1ZSAhPSBzbWlsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlucHV0c1sgcHJvcHNbaV0gXSA9ICEhYm9vbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnB1dHM7XG4gICAgICAgIH0pKCdzZWFyY2ggdGVsIHVybCBlbWFpbCBkYXRldGltZSBkYXRlIG1vbnRoIHdlZWsgdGltZSBkYXRldGltZS1sb2NhbCBudW1iZXIgcmFuZ2UgY29sb3InLnNwbGl0KCcgJykpO1xuICAgICAgICAvKj4+aW5wdXR0eXBlcyovXG4gICAgfVxuICAgIC8qPj53ZWJmb3JtcyovXG5cblxuICAgIC8vIEVuZCBvZiB0ZXN0IGRlZmluaXRpb25zXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG5cbiAgICAvLyBSdW4gdGhyb3VnaCBhbGwgdGVzdHMgYW5kIGRldGVjdCB0aGVpciBzdXBwb3J0IGluIHRoZSBjdXJyZW50IFVBLlxuICAgIC8vIHRvZG86IGh5cG90aGV0aWNhbGx5IHdlIGNvdWxkIGJlIGRvaW5nIGFuIGFycmF5IG9mIHRlc3RzIGFuZCB1c2UgYSBiYXNpYyBsb29wIGhlcmUuXG4gICAgZm9yICggdmFyIGZlYXR1cmUgaW4gdGVzdHMgKSB7XG4gICAgICAgIGlmICggaGFzT3duUHJvcCh0ZXN0cywgZmVhdHVyZSkgKSB7XG4gICAgICAgICAgICAvLyBydW4gdGhlIHRlc3QsIHRocm93IHRoZSByZXR1cm4gdmFsdWUgaW50byB0aGUgTW9kZXJuaXpyLFxuICAgICAgICAgICAgLy8gICB0aGVuIGJhc2VkIG9uIHRoYXQgYm9vbGVhbiwgZGVmaW5lIGFuIGFwcHJvcHJpYXRlIGNsYXNzTmFtZVxuICAgICAgICAgICAgLy8gICBhbmQgcHVzaCBpdCBpbnRvIGFuIGFycmF5IG9mIGNsYXNzZXMgd2UnbGwgam9pbiBsYXRlci5cbiAgICAgICAgICAgIGZlYXR1cmVOYW1lICA9IGZlYXR1cmUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIE1vZGVybml6cltmZWF0dXJlTmFtZV0gPSB0ZXN0c1tmZWF0dXJlXSgpO1xuXG4gICAgICAgICAgICBjbGFzc2VzLnB1c2goKE1vZGVybml6cltmZWF0dXJlTmFtZV0gPyAnJyA6ICduby0nKSArIGZlYXR1cmVOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qPj53ZWJmb3JtcyovXG4gICAgLy8gaW5wdXQgdGVzdHMgbmVlZCB0byBydW4uXG4gICAgTW9kZXJuaXpyLmlucHV0IHx8IHdlYmZvcm1zKCk7XG4gICAgLyo+PndlYmZvcm1zKi9cblxuXG4gICAgLyoqXG4gICAgICogYWRkVGVzdCBhbGxvd3MgdGhlIHVzZXIgdG8gZGVmaW5lIHRoZWlyIG93biBmZWF0dXJlIHRlc3RzXG4gICAgICogdGhlIHJlc3VsdCB3aWxsIGJlIGFkZGVkIG9udG8gdGhlIE1vZGVybml6ciBvYmplY3QsXG4gICAgICogYXMgd2VsbCBhcyBhbiBhcHByb3ByaWF0ZSBjbGFzc05hbWUgc2V0IG9uIHRoZSBodG1sIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmZWF0dXJlIC0gU3RyaW5nIG5hbWluZyB0aGUgZmVhdHVyZVxuICAgICAqIEBwYXJhbSB0ZXN0IC0gRnVuY3Rpb24gcmV0dXJuaW5nIHRydWUgaWYgZmVhdHVyZSBpcyBzdXBwb3J0ZWQsIGZhbHNlIGlmIG5vdFxuICAgICAqL1xuICAgICBNb2Rlcm5penIuYWRkVGVzdCA9IGZ1bmN0aW9uICggZmVhdHVyZSwgdGVzdCApIHtcbiAgICAgICBpZiAoIHR5cGVvZiBmZWF0dXJlID09ICdvYmplY3QnICkge1xuICAgICAgICAgZm9yICggdmFyIGtleSBpbiBmZWF0dXJlICkge1xuICAgICAgICAgICBpZiAoIGhhc093blByb3AoIGZlYXR1cmUsIGtleSApICkge1xuICAgICAgICAgICAgIE1vZGVybml6ci5hZGRUZXN0KCBrZXksIGZlYXR1cmVbIGtleSBdICk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICBmZWF0dXJlID0gZmVhdHVyZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICBpZiAoIE1vZGVybml6cltmZWF0dXJlXSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAvLyB3ZSdyZSBnb2luZyB0byBxdWl0IGlmIHlvdSdyZSB0cnlpbmcgdG8gb3ZlcndyaXRlIGFuIGV4aXN0aW5nIHRlc3RcbiAgICAgICAgICAgLy8gaWYgd2Ugd2VyZSB0byBhbGxvdyBpdCwgd2UnZCBkbyB0aGlzOlxuICAgICAgICAgICAvLyAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCJcXFxcYihuby0pP1wiICsgZmVhdHVyZSArIFwiXFxcXGJcIik7XG4gICAgICAgICAgIC8vICAgZG9jRWxlbWVudC5jbGFzc05hbWUgPSBkb2NFbGVtZW50LmNsYXNzTmFtZS5yZXBsYWNlKCByZSwgJycgKTtcbiAgICAgICAgICAgLy8gYnV0LCBubyBybHksIHN0dWZmICdlbS5cbiAgICAgICAgICAgcmV0dXJuIE1vZGVybml6cjtcbiAgICAgICAgIH1cblxuICAgICAgICAgdGVzdCA9IHR5cGVvZiB0ZXN0ID09ICdmdW5jdGlvbicgPyB0ZXN0KCkgOiB0ZXN0O1xuXG4gICAgICAgICBpZiAodHlwZW9mIGVuYWJsZUNsYXNzZXMgIT09IFwidW5kZWZpbmVkXCIgJiYgZW5hYmxlQ2xhc3Nlcykge1xuICAgICAgICAgICBkb2NFbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyAodGVzdCA/ICcnIDogJ25vLScpICsgZmVhdHVyZTtcbiAgICAgICAgIH1cbiAgICAgICAgIE1vZGVybml6cltmZWF0dXJlXSA9IHRlc3Q7XG5cbiAgICAgICB9XG5cbiAgICAgICByZXR1cm4gTW9kZXJuaXpyOyAvLyBhbGxvdyBjaGFpbmluZy5cbiAgICAgfTtcblxuXG4gICAgLy8gUmVzZXQgbW9kRWxlbS5jc3NUZXh0IHRvIG5vdGhpbmcgdG8gcmVkdWNlIG1lbW9yeSBmb290cHJpbnQuXG4gICAgc2V0Q3NzKCcnKTtcbiAgICBtb2RFbGVtID0gaW5wdXRFbGVtID0gbnVsbDtcblxuICAgIC8qPj5zaGl2Ki9cbiAgICAvKipcbiAgICAgKiBAcHJlc2VydmUgSFRNTDUgU2hpdiBwcmV2My43LjEgfCBAYWZhcmthcyBAamRhbHRvbiBAam9uX25lYWwgQHJlbSB8IE1JVC9HUEwyIExpY2Vuc2VkXG4gICAgICovXG4gICAgOyhmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50KSB7XG4gICAgICAgIC8qanNoaW50IGV2aWw6dHJ1ZSAqL1xuICAgICAgICAvKiogdmVyc2lvbiAqL1xuICAgICAgICB2YXIgdmVyc2lvbiA9ICczLjcuMCc7XG5cbiAgICAgICAgLyoqIFByZXNldCBvcHRpb25zICovXG4gICAgICAgIHZhciBvcHRpb25zID0gd2luZG93Lmh0bWw1IHx8IHt9O1xuXG4gICAgICAgIC8qKiBVc2VkIHRvIHNraXAgcHJvYmxlbSBlbGVtZW50cyAqL1xuICAgICAgICB2YXIgcmVTa2lwID0gL148fF4oPzpidXR0b258bWFwfHNlbGVjdHx0ZXh0YXJlYXxvYmplY3R8aWZyYW1lfG9wdGlvbnxvcHRncm91cCkkL2k7XG5cbiAgICAgICAgLyoqIE5vdCBhbGwgZWxlbWVudHMgY2FuIGJlIGNsb25lZCBpbiBJRSAqKi9cbiAgICAgICAgdmFyIHNhdmVDbG9uZXMgPSAvXig/OmF8Ynxjb2RlfGRpdnxmaWVsZHNldHxoMXxoMnxoM3xoNHxoNXxoNnxpfGxhYmVsfGxpfG9sfHB8cXxzcGFufHN0cm9uZ3xzdHlsZXx0YWJsZXx0Ym9keXx0ZHx0aHx0cnx1bCkkL2k7XG5cbiAgICAgICAgLyoqIERldGVjdCB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGRlZmF1bHQgaHRtbDUgc3R5bGVzICovXG4gICAgICAgIHZhciBzdXBwb3J0c0h0bWw1U3R5bGVzO1xuXG4gICAgICAgIC8qKiBOYW1lIG9mIHRoZSBleHBhbmRvLCB0byB3b3JrIHdpdGggbXVsdGlwbGUgZG9jdW1lbnRzIG9yIHRvIHJlLXNoaXYgb25lIGRvY3VtZW50ICovXG4gICAgICAgIHZhciBleHBhbmRvID0gJ19odG1sNXNoaXYnO1xuXG4gICAgICAgIC8qKiBUaGUgaWQgZm9yIHRoZSB0aGUgZG9jdW1lbnRzIGV4cGFuZG8gKi9cbiAgICAgICAgdmFyIGV4cGFuSUQgPSAwO1xuXG4gICAgICAgIC8qKiBDYWNoZWQgZGF0YSBmb3IgZWFjaCBkb2N1bWVudCAqL1xuICAgICAgICB2YXIgZXhwYW5kb0RhdGEgPSB7fTtcblxuICAgICAgICAvKiogRGV0ZWN0IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdW5rbm93biBlbGVtZW50cyAqL1xuICAgICAgICB2YXIgc3VwcG9ydHNVbmtub3duRWxlbWVudHM7XG5cbiAgICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGEuaW5uZXJIVE1MID0gJzx4eXo+PC94eXo+JztcbiAgICAgICAgICAgIC8vaWYgdGhlIGhpZGRlbiBwcm9wZXJ0eSBpcyBpbXBsZW1lbnRlZCB3ZSBjYW4gYXNzdW1lLCB0aGF0IHRoZSBicm93c2VyIHN1cHBvcnRzIGJhc2ljIEhUTUw1IFN0eWxlc1xuICAgICAgICAgICAgc3VwcG9ydHNIdG1sNVN0eWxlcyA9ICgnaGlkZGVuJyBpbiBhKTtcblxuICAgICAgICAgICAgc3VwcG9ydHNVbmtub3duRWxlbWVudHMgPSBhLmNoaWxkTm9kZXMubGVuZ3RoID09IDEgfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAvLyBhc3NpZ24gYSBmYWxzZSBwb3NpdGl2ZSBpZiB1bmFibGUgdG8gc2hpdlxuICAgICAgICAgICAgICAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCkoJ2EnKTtcbiAgICAgICAgICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgdHlwZW9mIGZyYWcuY2xvbmVOb2RlID09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICAgICAgdHlwZW9mIGZyYWcuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCA9PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICAgICAgICAgIHR5cGVvZiBmcmFnLmNyZWF0ZUVsZW1lbnQgPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0oKSk7XG4gICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAvLyBhc3NpZ24gYSBmYWxzZSBwb3NpdGl2ZSBpZiBkZXRlY3Rpb24gZmFpbHMgPT4gdW5hYmxlIHRvIHNoaXZcbiAgICAgICAgICAgIHN1cHBvcnRzSHRtbDVTdHlsZXMgPSB0cnVlO1xuICAgICAgICAgICAgc3VwcG9ydHNVbmtub3duRWxlbWVudHMgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICB9KCkpO1xuXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgc3R5bGUgc2hlZXQgd2l0aCB0aGUgZ2l2ZW4gQ1NTIHRleHQgYW5kIGFkZHMgaXQgdG8gdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGNzc1RleHQgVGhlIENTUyB0ZXh0LlxuICAgICAgICAgKiBAcmV0dXJucyB7U3R5bGVTaGVldH0gVGhlIHN0eWxlIGVsZW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBhZGRTdHlsZVNoZWV0KG93bmVyRG9jdW1lbnQsIGNzc1RleHQpIHtcbiAgICAgICAgICB2YXIgcCA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpLFxuICAgICAgICAgIHBhcmVudCA9IG93bmVyRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSB8fCBvd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgICAgIHAuaW5uZXJIVE1MID0gJ3g8c3R5bGU+JyArIGNzc1RleHQgKyAnPC9zdHlsZT4nO1xuICAgICAgICAgIHJldHVybiBwYXJlbnQuaW5zZXJ0QmVmb3JlKHAubGFzdENoaWxkLCBwYXJlbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgYGh0bWw1LmVsZW1lbnRzYCBhcyBhbiBhcnJheS5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5fSBBbiBhcnJheSBvZiBzaGl2ZWQgZWxlbWVudCBub2RlIG5hbWVzLlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0RWxlbWVudHMoKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnRzID0gaHRtbDUuZWxlbWVudHM7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBlbGVtZW50cyA9PSAnc3RyaW5nJyA/IGVsZW1lbnRzLnNwbGl0KCcgJykgOiBlbGVtZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBkYXRhIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIGRvY3VtZW50XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR9IG93bmVyRG9jdW1lbnQgVGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBvYmplY3Qgb2YgZGF0YS5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IGV4cGFuZG9EYXRhW293bmVyRG9jdW1lbnRbZXhwYW5kb11dO1xuICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZXhwYW5JRCsrO1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudFtleHBhbmRvXSA9IGV4cGFuSUQ7XG4gICAgICAgICAgICBleHBhbmRvRGF0YVtleHBhbklEXSA9IGRhdGE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgYSBzaGl2ZWQgZWxlbWVudCBmb3IgdGhlIGdpdmVuIG5vZGVOYW1lIGFuZCBkb2N1bWVudFxuICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5vZGVOYW1lIG5hbWUgb2YgdGhlIGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtIHtEb2N1bWVudH0gb3duZXJEb2N1bWVudCBUaGUgY29udGV4dCBkb2N1bWVudC5cbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gVGhlIHNoaXZlZCBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChub2RlTmFtZSwgb3duZXJEb2N1bWVudCwgZGF0YSl7XG4gICAgICAgICAgaWYgKCFvd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICBvd25lckRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzKXtcbiAgICAgICAgICAgIHJldHVybiBvd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEgPSBnZXRFeHBhbmRvRGF0YShvd25lckRvY3VtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIG5vZGU7XG5cbiAgICAgICAgICBpZiAoZGF0YS5jYWNoZVtub2RlTmFtZV0pIHtcbiAgICAgICAgICAgIG5vZGUgPSBkYXRhLmNhY2hlW25vZGVOYW1lXS5jbG9uZU5vZGUoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNhdmVDbG9uZXMudGVzdChub2RlTmFtZSkpIHtcbiAgICAgICAgICAgIG5vZGUgPSAoZGF0YS5jYWNoZVtub2RlTmFtZV0gPSBkYXRhLmNyZWF0ZUVsZW0obm9kZU5hbWUpKS5jbG9uZU5vZGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZSA9IGRhdGEuY3JlYXRlRWxlbShub2RlTmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXZvaWQgYWRkaW5nIHNvbWUgZWxlbWVudHMgdG8gZnJhZ21lbnRzIGluIElFIDwgOSBiZWNhdXNlXG4gICAgICAgICAgLy8gKiBBdHRyaWJ1dGVzIGxpa2UgYG5hbWVgIG9yIGB0eXBlYCBjYW5ub3QgYmUgc2V0L2NoYW5nZWQgb25jZSBhbiBlbGVtZW50XG4gICAgICAgICAgLy8gICBpcyBpbnNlcnRlZCBpbnRvIGEgZG9jdW1lbnQvZnJhZ21lbnRcbiAgICAgICAgICAvLyAqIExpbmsgZWxlbWVudHMgd2l0aCBgc3JjYCBhdHRyaWJ1dGVzIHRoYXQgYXJlIGluYWNjZXNzaWJsZSwgYXMgd2l0aFxuICAgICAgICAgIC8vICAgYSA0MDMgcmVzcG9uc2UsIHdpbGwgY2F1c2UgdGhlIHRhYi93aW5kb3cgdG8gY3Jhc2hcbiAgICAgICAgICAvLyAqIFNjcmlwdCBlbGVtZW50cyBhcHBlbmRlZCB0byBmcmFnbWVudHMgd2lsbCBleGVjdXRlIHdoZW4gdGhlaXIgYHNyY2BcbiAgICAgICAgICAvLyAgIG9yIGB0ZXh0YCBwcm9wZXJ0eSBpcyBzZXRcbiAgICAgICAgICByZXR1cm4gbm9kZS5jYW5IYXZlQ2hpbGRyZW4gJiYgIXJlU2tpcC50ZXN0KG5vZGVOYW1lKSAmJiAhbm9kZS50YWdVcm4gPyBkYXRhLmZyYWcuYXBwZW5kQ2hpbGQobm9kZSkgOiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgYSBzaGl2ZWQgRG9jdW1lbnRGcmFnbWVudCBmb3IgdGhlIGdpdmVuIGRvY3VtZW50XG4gICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBjb250ZXh0IGRvY3VtZW50LlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgc2hpdmVkIERvY3VtZW50RnJhZ21lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVEb2N1bWVudEZyYWdtZW50KG93bmVyRG9jdW1lbnQsIGRhdGEpe1xuICAgICAgICAgIGlmICghb3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZihzdXBwb3J0c1Vua25vd25FbGVtZW50cyl7XG4gICAgICAgICAgICByZXR1cm4gb3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhdGEgPSBkYXRhIHx8IGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpO1xuICAgICAgICAgIHZhciBjbG9uZSA9IGRhdGEuZnJhZy5jbG9uZU5vZGUoKSxcbiAgICAgICAgICBpID0gMCxcbiAgICAgICAgICBlbGVtcyA9IGdldEVsZW1lbnRzKCksXG4gICAgICAgICAgbCA9IGVsZW1zLmxlbmd0aDtcbiAgICAgICAgICBmb3IoO2k8bDtpKyspe1xuICAgICAgICAgICAgY2xvbmUuY3JlYXRlRWxlbWVudChlbGVtc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjbG9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaGl2cyB0aGUgYGNyZWF0ZUVsZW1lbnRgIGFuZCBgY3JlYXRlRG9jdW1lbnRGcmFnbWVudGAgbWV0aG9kcyBvZiB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR8RG9jdW1lbnRGcmFnbWVudH0gb3duZXJEb2N1bWVudCBUaGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIG9mIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHNoaXZNZXRob2RzKG93bmVyRG9jdW1lbnQsIGRhdGEpIHtcbiAgICAgICAgICBpZiAoIWRhdGEuY2FjaGUpIHtcbiAgICAgICAgICAgIGRhdGEuY2FjaGUgPSB7fTtcbiAgICAgICAgICAgIGRhdGEuY3JlYXRlRWxlbSA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudDtcbiAgICAgICAgICAgIGRhdGEuY3JlYXRlRnJhZyA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudDtcbiAgICAgICAgICAgIGRhdGEuZnJhZyA9IGRhdGEuY3JlYXRlRnJhZygpO1xuICAgICAgICAgIH1cblxuXG4gICAgICAgICAgb3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24obm9kZU5hbWUpIHtcbiAgICAgICAgICAgIC8vYWJvcnQgc2hpdlxuICAgICAgICAgICAgaWYgKCFodG1sNS5zaGl2TWV0aG9kcykge1xuICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jcmVhdGVFbGVtKG5vZGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50KG5vZGVOYW1lLCBvd25lckRvY3VtZW50LCBkYXRhKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgb3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50ID0gRnVuY3Rpb24oJ2gsZicsICdyZXR1cm4gZnVuY3Rpb24oKXsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFyIG49Zi5jbG9uZU5vZGUoKSxjPW4uY3JlYXRlRWxlbWVudDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaC5zaGl2TWV0aG9kcyYmKCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVucm9sbCB0aGUgYGNyZWF0ZUVsZW1lbnRgIGNhbGxzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RWxlbWVudHMoKS5qb2luKCkucmVwbGFjZSgvW1xcd1xcLV0rL2csIGZ1bmN0aW9uKG5vZGVOYW1lKSB7XG4gICAgICAgICAgICBkYXRhLmNyZWF0ZUVsZW0obm9kZU5hbWUpO1xuICAgICAgICAgICAgZGF0YS5mcmFnLmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuICdjKFwiJyArIG5vZGVOYW1lICsgJ1wiKSc7XG4gICAgICAgICAgfSkgK1xuICAgICAgICAgICAgJyk7cmV0dXJuIG59J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKShodG1sNSwgZGF0YS5mcmFnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaGl2cyB0aGUgZ2l2ZW4gZG9jdW1lbnQuXG4gICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBkb2N1bWVudCB0byBzaGl2LlxuICAgICAgICAgKiBAcmV0dXJucyB7RG9jdW1lbnR9IFRoZSBzaGl2ZWQgZG9jdW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBzaGl2RG9jdW1lbnQob3duZXJEb2N1bWVudCkge1xuICAgICAgICAgIGlmICghb3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgZGF0YSA9IGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpO1xuXG4gICAgICAgICAgaWYgKGh0bWw1LnNoaXZDU1MgJiYgIXN1cHBvcnRzSHRtbDVTdHlsZXMgJiYgIWRhdGEuaGFzQ1NTKSB7XG4gICAgICAgICAgICBkYXRhLmhhc0NTUyA9ICEhYWRkU3R5bGVTaGVldChvd25lckRvY3VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29ycmVjdHMgYmxvY2sgZGlzcGxheSBub3QgZGVmaW5lZCBpbiBJRTYvNy84LzlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhcnRpY2xlLGFzaWRlLGRpYWxvZyxmaWdjYXB0aW9uLGZpZ3VyZSxmb290ZXIsaGVhZGVyLGhncm91cCxtYWluLG5hdixzZWN0aW9ue2Rpc3BsYXk6YmxvY2t9JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZHMgc3R5bGluZyBub3QgcHJlc2VudCBpbiBJRTYvNy84LzlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21hcmt7YmFja2dyb3VuZDojRkYwO2NvbG9yOiMwMDB9JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhpZGVzIG5vbi1yZW5kZXJlZCBlbGVtZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGVtcGxhdGV7ZGlzcGxheTpub25lfSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFzdXBwb3J0c1Vua25vd25FbGVtZW50cykge1xuICAgICAgICAgICAgc2hpdk1ldGhvZHMob3duZXJEb2N1bWVudCwgZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBvd25lckRvY3VtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBgaHRtbDVgIG9iamVjdCBpcyBleHBvc2VkIHNvIHRoYXQgbW9yZSBlbGVtZW50cyBjYW4gYmUgc2hpdmVkIGFuZFxuICAgICAgICAgKiBleGlzdGluZyBzaGl2aW5nIGNhbiBiZSBkZXRlY3RlZCBvbiBpZnJhbWVzLlxuICAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogLy8gb3B0aW9ucyBjYW4gYmUgY2hhbmdlZCBiZWZvcmUgdGhlIHNjcmlwdCBpcyBpbmNsdWRlZFxuICAgICAgICAgKiBodG1sNSA9IHsgJ2VsZW1lbnRzJzogJ21hcmsgc2VjdGlvbicsICdzaGl2Q1NTJzogZmFsc2UsICdzaGl2TWV0aG9kcyc6IGZhbHNlIH07XG4gICAgICAgICAqL1xuICAgICAgICB2YXIgaHRtbDUgPSB7XG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBBbiBhcnJheSBvciBzcGFjZSBzZXBhcmF0ZWQgc3RyaW5nIG9mIG5vZGUgbmFtZXMgb2YgdGhlIGVsZW1lbnRzIHRvIHNoaXYuXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgQXJyYXl8U3RyaW5nXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ2VsZW1lbnRzJzogb3B0aW9ucy5lbGVtZW50cyB8fCAnYWJiciBhcnRpY2xlIGFzaWRlIGF1ZGlvIGJkaSBjYW52YXMgZGF0YSBkYXRhbGlzdCBkZXRhaWxzIGRpYWxvZyBmaWdjYXB0aW9uIGZpZ3VyZSBmb290ZXIgaGVhZGVyIGhncm91cCBtYWluIG1hcmsgbWV0ZXIgbmF2IG91dHB1dCBwcm9ncmVzcyBzZWN0aW9uIHN1bW1hcnkgdGVtcGxhdGUgdGltZSB2aWRlbycsXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBjdXJyZW50IHZlcnNpb24gb2YgaHRtbDVzaGl2XG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3ZlcnNpb24nOiB2ZXJzaW9uLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQSBmbGFnIHRvIGluZGljYXRlIHRoYXQgdGhlIEhUTUw1IHN0eWxlIHNoZWV0IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3NoaXZDU1MnOiAob3B0aW9ucy5zaGl2Q1NTICE9PSBmYWxzZSksXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBJcyBlcXVhbCB0byB0cnVlIGlmIGEgYnJvd3NlciBzdXBwb3J0cyBjcmVhdGluZyB1bmtub3duL0hUTUw1IGVsZW1lbnRzXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgICAqL1xuICAgICAgICAgICdzdXBwb3J0c1Vua25vd25FbGVtZW50cyc6IHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQSBmbGFnIHRvIGluZGljYXRlIHRoYXQgdGhlIGRvY3VtZW50J3MgYGNyZWF0ZUVsZW1lbnRgIGFuZCBgY3JlYXRlRG9jdW1lbnRGcmFnbWVudGBcbiAgICAgICAgICAgKiBtZXRob2RzIHNob3VsZCBiZSBvdmVyd3JpdHRlbi5cbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3NoaXZNZXRob2RzJzogKG9wdGlvbnMuc2hpdk1ldGhvZHMgIT09IGZhbHNlKSxcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEEgc3RyaW5nIHRvIGRlc2NyaWJlIHRoZSB0eXBlIG9mIGBodG1sNWAgb2JqZWN0IChcImRlZmF1bHRcIiBvciBcImRlZmF1bHQgcHJpbnRcIikuXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3R5cGUnOiAnZGVmYXVsdCcsXG5cbiAgICAgICAgICAvLyBzaGl2cyB0aGUgZG9jdW1lbnQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQgYGh0bWw1YCBvYmplY3Qgb3B0aW9uc1xuICAgICAgICAgICdzaGl2RG9jdW1lbnQnOiBzaGl2RG9jdW1lbnQsXG5cbiAgICAgICAgICAvL2NyZWF0ZXMgYSBzaGl2ZWQgZWxlbWVudFxuICAgICAgICAgIGNyZWF0ZUVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnQsXG5cbiAgICAgICAgICAvL2NyZWF0ZXMgYSBzaGl2ZWQgZG9jdW1lbnRGcmFnbWVudFxuICAgICAgICAgIGNyZWF0ZURvY3VtZW50RnJhZ21lbnQ6IGNyZWF0ZURvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgfTtcblxuICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgICAgICAvLyBleHBvc2UgaHRtbDVcbiAgICAgICAgd2luZG93Lmh0bWw1ID0gaHRtbDU7XG5cbiAgICAgICAgLy8gc2hpdiB0aGUgZG9jdW1lbnRcbiAgICAgICAgc2hpdkRvY3VtZW50KGRvY3VtZW50KTtcblxuICAgIH0odGhpcywgZG9jdW1lbnQpKTtcbiAgICAvKj4+c2hpdiovXG5cbiAgICAvLyBBc3NpZ24gcHJpdmF0ZSBwcm9wZXJ0aWVzIHRvIHRoZSByZXR1cm4gb2JqZWN0IHdpdGggcHJlZml4XG4gICAgTW9kZXJuaXpyLl92ZXJzaW9uICAgICAgPSB2ZXJzaW9uO1xuXG4gICAgLy8gZXhwb3NlIHRoZXNlIGZvciB0aGUgcGx1Z2luIEFQSS4gTG9vayBpbiB0aGUgc291cmNlIGZvciBob3cgdG8gam9pbigpIHRoZW0gYWdhaW5zdCB5b3VyIGlucHV0XG4gICAgLyo+PnByZWZpeGVzKi9cbiAgICBNb2Rlcm5penIuX3ByZWZpeGVzICAgICA9IHByZWZpeGVzO1xuICAgIC8qPj5wcmVmaXhlcyovXG4gICAgLyo+PmRvbXByZWZpeGVzKi9cbiAgICBNb2Rlcm5penIuX2RvbVByZWZpeGVzICA9IGRvbVByZWZpeGVzO1xuICAgIE1vZGVybml6ci5fY3Nzb21QcmVmaXhlcyAgPSBjc3NvbVByZWZpeGVzO1xuICAgIC8qPj5kb21wcmVmaXhlcyovXG5cbiAgICAvKj4+bXEqL1xuICAgIC8vIE1vZGVybml6ci5tcSB0ZXN0cyBhIGdpdmVuIG1lZGlhIHF1ZXJ5LCBsaXZlIGFnYWluc3QgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHdpbmRvd1xuICAgIC8vIEEgZmV3IGltcG9ydGFudCBub3RlczpcbiAgICAvLyAgICogSWYgYSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgbWVkaWEgcXVlcmllcyBhdCBhbGwgKGVnLiBvbGRJRSkgdGhlIG1xKCkgd2lsbCBhbHdheXMgcmV0dXJuIGZhbHNlXG4gICAgLy8gICAqIEEgbWF4LXdpZHRoIG9yIG9yaWVudGF0aW9uIHF1ZXJ5IHdpbGwgYmUgZXZhbHVhdGVkIGFnYWluc3QgdGhlIGN1cnJlbnQgc3RhdGUsIHdoaWNoIG1heSBjaGFuZ2UgbGF0ZXIuXG4gICAgLy8gICAqIFlvdSBtdXN0IHNwZWNpZnkgdmFsdWVzLiBFZy4gSWYgeW91IGFyZSB0ZXN0aW5nIHN1cHBvcnQgZm9yIHRoZSBtaW4td2lkdGggbWVkaWEgcXVlcnkgdXNlOlxuICAgIC8vICAgICAgIE1vZGVybml6ci5tcSgnKG1pbi13aWR0aDowKScpXG4gICAgLy8gdXNhZ2U6XG4gICAgLy8gTW9kZXJuaXpyLm1xKCdvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDo3NjgpJylcbiAgICBNb2Rlcm5penIubXEgICAgICAgICAgICA9IHRlc3RNZWRpYVF1ZXJ5O1xuICAgIC8qPj5tcSovXG5cbiAgICAvKj4+aGFzZXZlbnQqL1xuICAgIC8vIE1vZGVybml6ci5oYXNFdmVudCgpIGRldGVjdHMgc3VwcG9ydCBmb3IgYSBnaXZlbiBldmVudCwgd2l0aCBhbiBvcHRpb25hbCBlbGVtZW50IHRvIHRlc3Qgb25cbiAgICAvLyBNb2Rlcm5penIuaGFzRXZlbnQoJ2dlc3R1cmVzdGFydCcsIGVsZW0pXG4gICAgTW9kZXJuaXpyLmhhc0V2ZW50ICAgICAgPSBpc0V2ZW50U3VwcG9ydGVkO1xuICAgIC8qPj5oYXNldmVudCovXG5cbiAgICAvKj4+dGVzdHByb3AqL1xuICAgIC8vIE1vZGVybml6ci50ZXN0UHJvcCgpIGludmVzdGlnYXRlcyB3aGV0aGVyIGEgZ2l2ZW4gc3R5bGUgcHJvcGVydHkgaXMgcmVjb2duaXplZFxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcHJvcGVydHkgbmFtZXMgbXVzdCBiZSBwcm92aWRlZCBpbiB0aGUgY2FtZWxDYXNlIHZhcmlhbnQuXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RQcm9wKCdwb2ludGVyRXZlbnRzJylcbiAgICBNb2Rlcm5penIudGVzdFByb3AgICAgICA9IGZ1bmN0aW9uKHByb3Ape1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzKFtwcm9wXSk7XG4gICAgfTtcbiAgICAvKj4+dGVzdHByb3AqL1xuXG4gICAgLyo+PnRlc3RhbGxwcm9wcyovXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RBbGxQcm9wcygpIGludmVzdGlnYXRlcyB3aGV0aGVyIGEgZ2l2ZW4gc3R5bGUgcHJvcGVydHksXG4gICAgLy8gICBvciBhbnkgb2YgaXRzIHZlbmRvci1wcmVmaXhlZCB2YXJpYW50cywgaXMgcmVjb2duaXplZFxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcHJvcGVydHkgbmFtZXMgbXVzdCBiZSBwcm92aWRlZCBpbiB0aGUgY2FtZWxDYXNlIHZhcmlhbnQuXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RBbGxQcm9wcygnYm94U2l6aW5nJylcbiAgICBNb2Rlcm5penIudGVzdEFsbFByb3BzICA9IHRlc3RQcm9wc0FsbDtcbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cblxuXG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuICAgIC8vIE1vZGVybml6ci50ZXN0U3R5bGVzKCkgYWxsb3dzIHlvdSB0byBhZGQgY3VzdG9tIHN0eWxlcyB0byB0aGUgZG9jdW1lbnQgYW5kIHRlc3QgYW4gZWxlbWVudCBhZnRlcndhcmRzXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RTdHlsZXMoJyNtb2Rlcm5penIgeyBwb3NpdGlvbjphYnNvbHV0ZSB9JywgZnVuY3Rpb24oZWxlbSwgcnVsZSl7IC4uLiB9KVxuICAgIE1vZGVybml6ci50ZXN0U3R5bGVzICAgID0gaW5qZWN0RWxlbWVudFdpdGhTdHlsZXM7XG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuXG5cbiAgICAvKj4+cHJlZml4ZWQqL1xuICAgIC8vIE1vZGVybml6ci5wcmVmaXhlZCgpIHJldHVybnMgdGhlIHByZWZpeGVkIG9yIG5vbnByZWZpeGVkIHByb3BlcnR5IG5hbWUgdmFyaWFudCBvZiB5b3VyIGlucHV0XG4gICAgLy8gTW9kZXJuaXpyLnByZWZpeGVkKCdib3hTaXppbmcnKSAvLyAnTW96Qm94U2l6aW5nJ1xuXG4gICAgLy8gUHJvcGVydGllcyBtdXN0IGJlIHBhc3NlZCBhcyBkb20tc3R5bGUgY2FtZWxjYXNlLCByYXRoZXIgdGhhbiBgYm94LXNpemluZ2AgaHlwZW50YXRlZCBzdHlsZS5cbiAgICAvLyBSZXR1cm4gdmFsdWVzIHdpbGwgYWxzbyBiZSB0aGUgY2FtZWxDYXNlIHZhcmlhbnQsIGlmIHlvdSBuZWVkIHRvIHRyYW5zbGF0ZSB0aGF0IHRvIGh5cGVuYXRlZCBzdHlsZSB1c2U6XG4gICAgLy9cbiAgICAvLyAgICAgc3RyLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oc3RyLG0xKXsgcmV0dXJuICctJyArIG0xLnRvTG93ZXJDYXNlKCk7IH0pLnJlcGxhY2UoL15tcy0vLCctbXMtJyk7XG5cbiAgICAvLyBJZiB5b3UncmUgdHJ5aW5nIHRvIGFzY2VydGFpbiB3aGljaCB0cmFuc2l0aW9uIGVuZCBldmVudCB0byBiaW5kIHRvLCB5b3UgbWlnaHQgZG8gc29tZXRoaW5nIGxpa2UuLi5cbiAgICAvL1xuICAgIC8vICAgICB2YXIgdHJhbnNFbmRFdmVudE5hbWVzID0ge1xuICAgIC8vICAgICAgICdXZWJraXRUcmFuc2l0aW9uJyA6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAnTW96VHJhbnNpdGlvbicgICAgOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgLy8gICAgICAgJ09UcmFuc2l0aW9uJyAgICAgIDogJ29UcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAnbXNUcmFuc2l0aW9uJyAgICAgOiAnTVNUcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAndHJhbnNpdGlvbicgICAgICAgOiAndHJhbnNpdGlvbmVuZCdcbiAgICAvLyAgICAgfSxcbiAgICAvLyAgICAgdHJhbnNFbmRFdmVudE5hbWUgPSB0cmFuc0VuZEV2ZW50TmFtZXNbIE1vZGVybml6ci5wcmVmaXhlZCgndHJhbnNpdGlvbicpIF07XG5cbiAgICBNb2Rlcm5penIucHJlZml4ZWQgICAgICA9IGZ1bmN0aW9uKHByb3AsIG9iaiwgZWxlbSl7XG4gICAgICBpZighb2JqKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwocHJvcCwgJ3BmeCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGVzdGluZyBET00gcHJvcGVydHkgZS5nLiBNb2Rlcm5penIucHJlZml4ZWQoJ3JlcXVlc3RBbmltYXRpb25GcmFtZScsIHdpbmRvdykgLy8gJ21velJlcXVlc3RBbmltYXRpb25GcmFtZSdcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbChwcm9wLCBvYmosIGVsZW0pO1xuICAgICAgfVxuICAgIH07XG4gICAgLyo+PnByZWZpeGVkKi9cblxuXG4gICAgLyo+PmNzc2NsYXNzZXMqL1xuICAgIC8vIFJlbW92ZSBcIm5vLWpzXCIgY2xhc3MgZnJvbSA8aHRtbD4gZWxlbWVudCwgaWYgaXQgZXhpc3RzOlxuICAgIGRvY0VsZW1lbnQuY2xhc3NOYW1lID0gZG9jRWxlbWVudC5jbGFzc05hbWUucmVwbGFjZSgvKF58XFxzKW5vLWpzKFxcc3wkKS8sICckMSQyJykgK1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBuZXcgY2xhc3NlcyB0byB0aGUgPGh0bWw+IGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVuYWJsZUNsYXNzZXMgPyAnIGpzICcgKyBjbGFzc2VzLmpvaW4oJyAnKSA6ICcnKTtcbiAgICAvKj4+Y3NzY2xhc3NlcyovXG5cbiAgICByZXR1cm4gTW9kZXJuaXpyO1xuXG59KSh0aGlzLCB0aGlzLmRvY3VtZW50KTtcbiIsIi8qXG4gKiBqUXVlcnkgRmxleFNsaWRlciB2Mi4yLjJcbiAqIENvcHlyaWdodCAyMDEyIFdvb1RoZW1lc1xuICogQ29udHJpYnV0aW5nIEF1dGhvcjogVHlsZXIgU21pdGhcbiAqL1xuO1xuKGZ1bmN0aW9uICgkKSB7XG5cbiAgLy9GbGV4U2xpZGVyOiBPYmplY3QgSW5zdGFuY2VcbiAgJC5mbGV4c2xpZGVyID0gZnVuY3Rpb24oZWwsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2xpZGVyID0gJChlbCk7XG5cbiAgICAvLyBtYWtpbmcgdmFyaWFibGVzIHB1YmxpY1xuICAgIHNsaWRlci52YXJzID0gJC5leHRlbmQoe30sICQuZmxleHNsaWRlci5kZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICB2YXIgbmFtZXNwYWNlID0gc2xpZGVyLnZhcnMubmFtZXNwYWNlLFxuICAgICAgICBtc0dlc3R1cmUgPSB3aW5kb3cubmF2aWdhdG9yICYmIHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCAmJiB3aW5kb3cuTVNHZXN0dXJlLFxuICAgICAgICB0b3VjaCA9ICgoIFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93ICkgfHwgbXNHZXN0dXJlIHx8IHdpbmRvdy5Eb2N1bWVudFRvdWNoICYmIGRvY3VtZW50IGluc3RhbmNlb2YgRG9jdW1lbnRUb3VjaCkgJiYgc2xpZGVyLnZhcnMudG91Y2gsXG4gICAgICAgIC8vIGRlcHJpY2F0aW5nIHRoaXMgaWRlYSwgYXMgZGV2aWNlcyBhcmUgYmVpbmcgcmVsZWFzZWQgd2l0aCBib3RoIG9mIHRoZXNlIGV2ZW50c1xuICAgICAgICAvL2V2ZW50VHlwZSA9ICh0b3VjaCkgPyBcInRvdWNoZW5kXCIgOiBcImNsaWNrXCIsXG4gICAgICAgIGV2ZW50VHlwZSA9IFwiY2xpY2sgdG91Y2hlbmQgTVNQb2ludGVyVXBcIixcbiAgICAgICAgd2F0Y2hlZEV2ZW50ID0gXCJcIixcbiAgICAgICAgd2F0Y2hlZEV2ZW50Q2xlYXJUaW1lcixcbiAgICAgICAgdmVydGljYWwgPSBzbGlkZXIudmFycy5kaXJlY3Rpb24gPT09IFwidmVydGljYWxcIixcbiAgICAgICAgcmV2ZXJzZSA9IHNsaWRlci52YXJzLnJldmVyc2UsXG4gICAgICAgIGNhcm91c2VsID0gKHNsaWRlci52YXJzLml0ZW1XaWR0aCA+IDApLFxuICAgICAgICBmYWRlID0gc2xpZGVyLnZhcnMuYW5pbWF0aW9uID09PSBcImZhZGVcIixcbiAgICAgICAgYXNOYXYgPSBzbGlkZXIudmFycy5hc05hdkZvciAhPT0gXCJcIixcbiAgICAgICAgbWV0aG9kcyA9IHt9LFxuICAgICAgICBmb2N1c2VkID0gdHJ1ZTtcblxuICAgIC8vIFN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBzbGlkZXIgb2JqZWN0XG4gICAgJC5kYXRhKGVsLCBcImZsZXhzbGlkZXJcIiwgc2xpZGVyKTtcblxuICAgIC8vIFByaXZhdGUgc2xpZGVyIG1ldGhvZHNcbiAgICBtZXRob2RzID0ge1xuICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHNsaWRlci5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgLy8gR2V0IGN1cnJlbnQgc2xpZGUgYW5kIG1ha2Ugc3VyZSBpdCBpcyBhIG51bWJlclxuICAgICAgICBzbGlkZXIuY3VycmVudFNsaWRlID0gcGFyc2VJbnQoICggc2xpZGVyLnZhcnMuc3RhcnRBdCA/IHNsaWRlci52YXJzLnN0YXJ0QXQgOiAwKSwgMTAgKTtcbiAgICAgICAgaWYgKCBpc05hTiggc2xpZGVyLmN1cnJlbnRTbGlkZSApICkgc2xpZGVyLmN1cnJlbnRTbGlkZSA9IDA7XG4gICAgICAgIHNsaWRlci5hbmltYXRpbmdUbyA9IHNsaWRlci5jdXJyZW50U2xpZGU7XG4gICAgICAgIHNsaWRlci5hdEVuZCA9IChzbGlkZXIuY3VycmVudFNsaWRlID09PSAwIHx8IHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0KTtcbiAgICAgICAgc2xpZGVyLmNvbnRhaW5lclNlbGVjdG9yID0gc2xpZGVyLnZhcnMuc2VsZWN0b3Iuc3Vic3RyKDAsc2xpZGVyLnZhcnMuc2VsZWN0b3Iuc2VhcmNoKCcgJykpO1xuICAgICAgICBzbGlkZXIuc2xpZGVzID0gJChzbGlkZXIudmFycy5zZWxlY3Rvciwgc2xpZGVyKTtcbiAgICAgICAgc2xpZGVyLmNvbnRhaW5lciA9ICQoc2xpZGVyLmNvbnRhaW5lclNlbGVjdG9yLCBzbGlkZXIpO1xuICAgICAgICBzbGlkZXIuY291bnQgPSBzbGlkZXIuc2xpZGVzLmxlbmd0aDtcbiAgICAgICAgLy8gU1lOQzpcbiAgICAgICAgc2xpZGVyLnN5bmNFeGlzdHMgPSAkKHNsaWRlci52YXJzLnN5bmMpLmxlbmd0aCA+IDA7XG4gICAgICAgIC8vIFNMSURFOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuYW5pbWF0aW9uID09PSBcInNsaWRlXCIpIHNsaWRlci52YXJzLmFuaW1hdGlvbiA9IFwic3dpbmdcIjtcbiAgICAgICAgc2xpZGVyLnByb3AgPSAodmVydGljYWwpID8gXCJ0b3BcIiA6IFwibWFyZ2luTGVmdFwiO1xuICAgICAgICBzbGlkZXIuYXJncyA9IHt9O1xuICAgICAgICAvLyBTTElERVNIT1c6XG4gICAgICAgIHNsaWRlci5tYW51YWxQYXVzZSA9IGZhbHNlO1xuICAgICAgICBzbGlkZXIuc3RvcHBlZCA9IGZhbHNlO1xuICAgICAgICAvL1BBVVNFIFdIRU4gSU5WSVNJQkxFXG4gICAgICAgIHNsaWRlci5zdGFydGVkID0gZmFsc2U7XG4gICAgICAgIHNsaWRlci5zdGFydFRpbWVvdXQgPSBudWxsO1xuICAgICAgICAvLyBUT1VDSC9VU0VDU1M6XG4gICAgICAgIHNsaWRlci50cmFuc2l0aW9ucyA9ICFzbGlkZXIudmFycy52aWRlbyAmJiAhZmFkZSAmJiBzbGlkZXIudmFycy51c2VDU1MgJiYgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBvYmogPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgICAgICAgcHJvcHMgPSBbJ3BlcnNwZWN0aXZlUHJvcGVydHknLCAnV2Via2l0UGVyc3BlY3RpdmUnLCAnTW96UGVyc3BlY3RpdmUnLCAnT1BlcnNwZWN0aXZlJywgJ21zUGVyc3BlY3RpdmUnXTtcbiAgICAgICAgICBmb3IgKHZhciBpIGluIHByb3BzKSB7XG4gICAgICAgICAgICBpZiAoIG9iai5zdHlsZVsgcHJvcHNbaV0gXSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICBzbGlkZXIucGZ4ID0gcHJvcHNbaV0ucmVwbGFjZSgnUGVyc3BlY3RpdmUnLCcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICBzbGlkZXIucHJvcCA9IFwiLVwiICsgc2xpZGVyLnBmeCArIFwiLXRyYW5zZm9ybVwiO1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KCkpO1xuICAgICAgICAvLyBDT05UUk9MU0NPTlRBSU5FUjpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmNvbnRyb2xzQ29udGFpbmVyICE9PSBcIlwiKSBzbGlkZXIuY29udHJvbHNDb250YWluZXIgPSAkKHNsaWRlci52YXJzLmNvbnRyb2xzQ29udGFpbmVyKS5sZW5ndGggPiAwICYmICQoc2xpZGVyLnZhcnMuY29udHJvbHNDb250YWluZXIpO1xuICAgICAgICAvLyBNQU5VQUw6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5tYW51YWxDb250cm9scyAhPT0gXCJcIikgc2xpZGVyLm1hbnVhbENvbnRyb2xzID0gJChzbGlkZXIudmFycy5tYW51YWxDb250cm9scykubGVuZ3RoID4gMCAmJiAkKHNsaWRlci52YXJzLm1hbnVhbENvbnRyb2xzKTtcblxuICAgICAgICAvLyBSQU5ET01JWkU6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5yYW5kb21pemUpIHtcbiAgICAgICAgICBzbGlkZXIuc2xpZGVzLnNvcnQoZnVuY3Rpb24oKSB7IHJldHVybiAoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKS0wLjUpOyB9KTtcbiAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLmVtcHR5KCkuYXBwZW5kKHNsaWRlci5zbGlkZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuXG4gICAgICAgIC8vIElOSVRcbiAgICAgICAgc2xpZGVyLnNldHVwKFwiaW5pdFwiKTtcblxuICAgICAgICAvLyBDT05UUk9MTkFWOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuY29udHJvbE5hdikgbWV0aG9kcy5jb250cm9sTmF2LnNldHVwKCk7XG5cbiAgICAgICAgLy8gRElSRUNUSU9OTkFWOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuZGlyZWN0aW9uTmF2KSBtZXRob2RzLmRpcmVjdGlvbk5hdi5zZXR1cCgpO1xuXG4gICAgICAgIC8vIEtFWUJPQVJEOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMua2V5Ym9hcmQgJiYgKCQoc2xpZGVyLmNvbnRhaW5lclNlbGVjdG9yKS5sZW5ndGggPT09IDEgfHwgc2xpZGVyLnZhcnMubXVsdGlwbGVLZXlib2FyZCkpIHtcbiAgICAgICAgICAkKGRvY3VtZW50KS5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIga2V5Y29kZSA9IGV2ZW50LmtleUNvZGU7XG4gICAgICAgICAgICBpZiAoIXNsaWRlci5hbmltYXRpbmcgJiYgKGtleWNvZGUgPT09IDM5IHx8IGtleWNvZGUgPT09IDM3KSkge1xuICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gKGtleWNvZGUgPT09IDM5KSA/IHNsaWRlci5nZXRUYXJnZXQoJ25leHQnKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAoa2V5Y29kZSA9PT0gMzcpID8gc2xpZGVyLmdldFRhcmdldCgncHJldicpIDogZmFsc2U7XG4gICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIE1PVVNFV0hFRUw6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5tb3VzZXdoZWVsKSB7XG4gICAgICAgICAgc2xpZGVyLmJpbmQoJ21vdXNld2hlZWwnLCBmdW5jdGlvbihldmVudCwgZGVsdGEsIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IChkZWx0YSA8IDApID8gc2xpZGVyLmdldFRhcmdldCgnbmV4dCcpIDogc2xpZGVyLmdldFRhcmdldCgncHJldicpO1xuICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQQVVTRVBMQVlcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLnBhdXNlUGxheSkgbWV0aG9kcy5wYXVzZVBsYXkuc2V0dXAoKTtcblxuICAgICAgICAvL1BBVVNFIFdIRU4gSU5WSVNJQkxFXG4gICAgICAgIGlmIChzbGlkZXIudmFycy5zbGlkZXNob3cgJiYgc2xpZGVyLnZhcnMucGF1c2VJbnZpc2libGUpIG1ldGhvZHMucGF1c2VJbnZpc2libGUuaW5pdCgpO1xuXG4gICAgICAgIC8vIFNMSURTRVNIT1dcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLnNsaWRlc2hvdykge1xuICAgICAgICAgIGlmIChzbGlkZXIudmFycy5wYXVzZU9uSG92ZXIpIHtcbiAgICAgICAgICAgIHNsaWRlci5ob3ZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKCFzbGlkZXIubWFudWFsUGxheSAmJiAhc2xpZGVyLm1hbnVhbFBhdXNlKSBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAoIXNsaWRlci5tYW51YWxQYXVzZSAmJiAhc2xpZGVyLm1hbnVhbFBsYXkgJiYgIXNsaWRlci5zdG9wcGVkKSBzbGlkZXIucGxheSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGluaXRpYWxpemUgYW5pbWF0aW9uXG4gICAgICAgICAgLy9JZiB3ZSdyZSB2aXNpYmxlLCBvciB3ZSBkb24ndCB1c2UgUGFnZVZpc2liaWxpdHkgQVBJXG4gICAgICAgICAgaWYoIXNsaWRlci52YXJzLnBhdXNlSW52aXNpYmxlIHx8ICFtZXRob2RzLnBhdXNlSW52aXNpYmxlLmlzSGlkZGVuKCkpIHtcbiAgICAgICAgICAgIChzbGlkZXIudmFycy5pbml0RGVsYXkgPiAwKSA/IHNsaWRlci5zdGFydFRpbWVvdXQgPSBzZXRUaW1lb3V0KHNsaWRlci5wbGF5LCBzbGlkZXIudmFycy5pbml0RGVsYXkpIDogc2xpZGVyLnBsYXkoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBU05BVjpcbiAgICAgICAgaWYgKGFzTmF2KSBtZXRob2RzLmFzTmF2LnNldHVwKCk7XG5cbiAgICAgICAgLy8gVE9VQ0hcbiAgICAgICAgaWYgKHRvdWNoICYmIHNsaWRlci52YXJzLnRvdWNoKSBtZXRob2RzLnRvdWNoKCk7XG5cbiAgICAgICAgLy8gRkFERSYmU01PT1RISEVJR0hUIHx8IFNMSURFOlxuICAgICAgICBpZiAoIWZhZGUgfHwgKGZhZGUgJiYgc2xpZGVyLnZhcnMuc21vb3RoSGVpZ2h0KSkgJCh3aW5kb3cpLmJpbmQoXCJyZXNpemUgb3JpZW50YXRpb25jaGFuZ2UgZm9jdXNcIiwgbWV0aG9kcy5yZXNpemUpO1xuXG4gICAgICAgIHNsaWRlci5maW5kKFwiaW1nXCIpLmF0dHIoXCJkcmFnZ2FibGVcIiwgXCJmYWxzZVwiKTtcblxuICAgICAgICAvLyBBUEk6IHN0YXJ0KCkgQ2FsbGJhY2tcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIHNsaWRlci52YXJzLnN0YXJ0KHNsaWRlcik7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9LFxuICAgICAgYXNOYXY6IHtcbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNsaWRlci5hc05hdiA9IHRydWU7XG4gICAgICAgICAgc2xpZGVyLmFuaW1hdGluZ1RvID0gTWF0aC5mbG9vcihzbGlkZXIuY3VycmVudFNsaWRlL3NsaWRlci5tb3ZlKTtcbiAgICAgICAgICBzbGlkZXIuY3VycmVudEl0ZW0gPSBzbGlkZXIuY3VycmVudFNsaWRlO1xuICAgICAgICAgIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEoc2xpZGVyLmN1cnJlbnRJdGVtKS5hZGRDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKTtcbiAgICAgICAgICBpZighbXNHZXN0dXJlKXtcbiAgICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5vbihldmVudFR5cGUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgJHNsaWRlID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gJHNsaWRlLmluZGV4KCk7XG4gICAgICAgICAgICAgICAgdmFyIHBvc0Zyb21MZWZ0ID0gJHNsaWRlLm9mZnNldCgpLmxlZnQgLSAkKHNsaWRlcikuc2Nyb2xsTGVmdCgpOyAvLyBGaW5kIHBvc2l0aW9uIG9mIHNsaWRlIHJlbGF0aXZlIHRvIGxlZnQgb2Ygc2xpZGVyIGNvbnRhaW5lclxuICAgICAgICAgICAgICAgIGlmKCBwb3NGcm9tTGVmdCA8PSAwICYmICRzbGlkZS5oYXNDbGFzcyggbmFtZXNwYWNlICsgJ2FjdGl2ZS1zbGlkZScgKSApIHtcbiAgICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZShzbGlkZXIuZ2V0VGFyZ2V0KFwicHJldlwiKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghJChzbGlkZXIudmFycy5hc05hdkZvcikuZGF0YSgnZmxleHNsaWRlcicpLmFuaW1hdGluZyAmJiAhJHNsaWRlLmhhc0NsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpKSB7XG4gICAgICAgICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uID0gKHNsaWRlci5jdXJyZW50SXRlbSA8IHRhcmdldCkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbiwgZmFsc2UsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIGVsLl9zbGlkZXIgPSBzbGlkZXI7XG4gICAgICAgICAgICAgIHNsaWRlci5zbGlkZXMuZWFjaChmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgIHRoYXQuX2dlc3R1cmUgPSBuZXcgTVNHZXN0dXJlKCk7XG4gICAgICAgICAgICAgICAgICB0aGF0Ll9nZXN0dXJlLnRhcmdldCA9IHRoYXQ7XG4gICAgICAgICAgICAgICAgICB0aGF0LmFkZEV2ZW50TGlzdGVuZXIoXCJNU1BvaW50ZXJEb3duXCIsIGZ1bmN0aW9uIChlKXtcbiAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoZS5jdXJyZW50VGFyZ2V0Ll9nZXN0dXJlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuX2dlc3R1cmUuYWRkUG9pbnRlcihlLnBvaW50ZXJJZCk7XG4gICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICB0aGF0LmFkZEV2ZW50TGlzdGVuZXIoXCJNU0dlc3R1cmVUYXBcIiwgZnVuY3Rpb24gKGUpe1xuICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNsaWRlID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gJHNsaWRlLmluZGV4KCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCEkKHNsaWRlci52YXJzLmFzTmF2Rm9yKS5kYXRhKCdmbGV4c2xpZGVyJykuYW5pbWF0aW5nICYmICEkc2xpZGUuaGFzQ2xhc3MoJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb24gPSAoc2xpZGVyLmN1cnJlbnRJdGVtIDwgdGFyZ2V0KSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIGZhbHNlLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY29udHJvbE5hdjoge1xuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCFzbGlkZXIubWFudWFsQ29udHJvbHMpIHtcbiAgICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi5zZXR1cFBhZ2luZygpO1xuICAgICAgICAgIH0gZWxzZSB7IC8vIE1BTlVBTENPTlRST0xTOlxuICAgICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LnNldHVwTWFudWFsKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXR1cFBhZ2luZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHR5cGUgPSAoc2xpZGVyLnZhcnMuY29udHJvbE5hdiA9PT0gXCJ0aHVtYm5haWxzXCIpID8gJ2NvbnRyb2wtdGh1bWJzJyA6ICdjb250cm9sLXBhZ2luZycsXG4gICAgICAgICAgICAgIGogPSAxLFxuICAgICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgICBzbGlkZTtcblxuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQgPSAkKCc8b2wgY2xhc3M9XCInKyBuYW1lc3BhY2UgKyAnY29udHJvbC1uYXYgJyArIG5hbWVzcGFjZSArIHR5cGUgKyAnXCI+PC9vbD4nKTtcblxuICAgICAgICAgIGlmIChzbGlkZXIucGFnaW5nQ291bnQgPiAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWRlci5wYWdpbmdDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgIHNsaWRlID0gc2xpZGVyLnNsaWRlcy5lcShpKTtcbiAgICAgICAgICAgICAgaXRlbSA9IChzbGlkZXIudmFycy5jb250cm9sTmF2ID09PSBcInRodW1ibmFpbHNcIikgPyAnPGltZyBzcmM9XCInICsgc2xpZGUuYXR0ciggJ2RhdGEtdGh1bWInICkgKyAnXCIvPicgOiAnPGE+JyArIGogKyAnPC9hPic7XG4gICAgICAgICAgICAgIGlmICggJ3RodW1ibmFpbHMnID09PSBzbGlkZXIudmFycy5jb250cm9sTmF2ICYmIHRydWUgPT09IHNsaWRlci52YXJzLnRodW1iQ2FwdGlvbnMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhcHRuID0gc2xpZGUuYXR0ciggJ2RhdGEtdGh1bWJjYXB0aW9uJyApO1xuICAgICAgICAgICAgICAgIGlmICggJycgIT0gY2FwdG4gJiYgdW5kZWZpbmVkICE9IGNhcHRuICkgaXRlbSArPSAnPHNwYW4gY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ2NhcHRpb25cIj4nICsgY2FwdG4gKyAnPC9zcGFuPic7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXZTY2FmZm9sZC5hcHBlbmQoJzxsaT4nICsgaXRlbSArICc8L2xpPicpO1xuICAgICAgICAgICAgICBqKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ09OVFJPTFNDT05UQUlORVI6XG4gICAgICAgICAgKHNsaWRlci5jb250cm9sc0NvbnRhaW5lcikgPyAkKHNsaWRlci5jb250cm9sc0NvbnRhaW5lcikuYXBwZW5kKHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQpIDogc2xpZGVyLmFwcGVuZChzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkKTtcbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYuc2V0KCk7XG5cbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYuYWN0aXZlKCk7XG5cbiAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkLmRlbGVnYXRlKCdhLCBpbWcnLCBldmVudFR5cGUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiIHx8IHdhdGNoZWRFdmVudCA9PT0gZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gc2xpZGVyLmNvbnRyb2xOYXYuaW5kZXgoJHRoaXMpO1xuXG4gICAgICAgICAgICAgIGlmICghJHRoaXMuaGFzQ2xhc3MobmFtZXNwYWNlICsgJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9ICh0YXJnZXQgPiBzbGlkZXIuY3VycmVudFNsaWRlKSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2V0dXAgZmxhZ3MgdG8gcHJldmVudCBldmVudCBkdXBsaWNhdGlvblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBldmVudC50eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWV0aG9kcy5zZXRUb0NsZWFyV2F0Y2hlZEV2ZW50KCk7XG5cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0dXBNYW51YWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2ID0gc2xpZGVyLm1hbnVhbENvbnRyb2xzO1xuICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi5hY3RpdmUoKTtcblxuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2LmJpbmQoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIiB8fCB3YXRjaGVkRXZlbnQgPT09IGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHNsaWRlci5jb250cm9sTmF2LmluZGV4KCR0aGlzKTtcblxuICAgICAgICAgICAgICBpZiAoISR0aGlzLmhhc0NsYXNzKG5hbWVzcGFjZSArICdhY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgICh0YXJnZXQgPiBzbGlkZXIuY3VycmVudFNsaWRlKSA/IHNsaWRlci5kaXJlY3Rpb24gPSBcIm5leHRcIiA6IHNsaWRlci5kaXJlY3Rpb24gPSBcInByZXZcIjtcbiAgICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXR1cCBmbGFncyB0byBwcmV2ZW50IGV2ZW50IGR1cGxpY2F0aW9uXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgIHdhdGNoZWRFdmVudCA9IGV2ZW50LnR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXRob2RzLnNldFRvQ2xlYXJXYXRjaGVkRXZlbnQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgc2VsZWN0b3IgPSAoc2xpZGVyLnZhcnMuY29udHJvbE5hdiA9PT0gXCJ0aHVtYm5haWxzXCIpID8gJ2ltZycgOiAnYSc7XG4gICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXYgPSAkKCcuJyArIG5hbWVzcGFjZSArICdjb250cm9sLW5hdiBsaSAnICsgc2VsZWN0b3IsIChzbGlkZXIuY29udHJvbHNDb250YWluZXIpID8gc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyIDogc2xpZGVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdi5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZVwiKS5lcShzbGlkZXIuYW5pbWF0aW5nVG8pLmFkZENsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlXCIpO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGFjdGlvbiwgcG9zKSB7XG4gICAgICAgICAgaWYgKHNsaWRlci5wYWdpbmdDb3VudCA+IDEgJiYgYWN0aW9uID09PSBcImFkZFwiKSB7XG4gICAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkLmFwcGVuZCgkKCc8bGk+PGE+JyArIHNsaWRlci5jb3VudCArICc8L2E+PC9saT4nKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQuZmluZCgnbGknKS5yZW1vdmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXYuZXEocG9zKS5jbG9zZXN0KCdsaScpLnJlbW92ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYuc2V0KCk7XG4gICAgICAgICAgKHNsaWRlci5wYWdpbmdDb3VudCA+IDEgJiYgc2xpZGVyLnBhZ2luZ0NvdW50ICE9PSBzbGlkZXIuY29udHJvbE5hdi5sZW5ndGgpID8gc2xpZGVyLnVwZGF0ZShwb3MsIGFjdGlvbikgOiBtZXRob2RzLmNvbnRyb2xOYXYuYWN0aXZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkaXJlY3Rpb25OYXY6IHtcbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBkaXJlY3Rpb25OYXZTY2FmZm9sZCA9ICQoJzx1bCBjbGFzcz1cIicgKyBuYW1lc3BhY2UgKyAnZGlyZWN0aW9uLW5hdlwiPjxsaT48YSBjbGFzcz1cIicgKyBuYW1lc3BhY2UgKyAncHJldlwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS1jaGV2cm9uLWxlZnRcIj48L2k+PC9hPjwvbGk+PGxpPjxhIGNsYXNzPVwiJyArIG5hbWVzcGFjZSArICduZXh0XCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLWNoZXZyb24tcmlnaHRcIj48L2k+PC9hPjwvbGk+PC91bD4nKTtcblxuICAgICAgICAgIC8vIENPTlRST0xTQ09OVEFJTkVSOlxuICAgICAgICAgIGlmIChzbGlkZXIuY29udHJvbHNDb250YWluZXIpIHtcbiAgICAgICAgICAgICQoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKS5hcHBlbmQoZGlyZWN0aW9uTmF2U2NhZmZvbGQpO1xuICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdiA9ICQoJy4nICsgbmFtZXNwYWNlICsgJ2RpcmVjdGlvbi1uYXYgbGkgYScsIHNsaWRlci5jb250cm9sc0NvbnRhaW5lcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5hcHBlbmQoZGlyZWN0aW9uTmF2U2NhZmZvbGQpO1xuICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdiA9ICQoJy4nICsgbmFtZXNwYWNlICsgJ2RpcmVjdGlvbi1uYXYgbGkgYScsIHNsaWRlcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbWV0aG9kcy5kaXJlY3Rpb25OYXYudXBkYXRlKCk7XG5cbiAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LmJpbmQoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciB0YXJnZXQ7XG5cbiAgICAgICAgICAgIGlmICh3YXRjaGVkRXZlbnQgPT09IFwiXCIgfHwgd2F0Y2hlZEV2ZW50ID09PSBldmVudC50eXBlKSB7XG4gICAgICAgICAgICAgIHRhcmdldCA9ICgkKHRoaXMpLmhhc0NsYXNzKG5hbWVzcGFjZSArICduZXh0JykpID8gc2xpZGVyLmdldFRhcmdldCgnbmV4dCcpIDogc2xpZGVyLmdldFRhcmdldCgncHJldicpO1xuICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2V0dXAgZmxhZ3MgdG8gcHJldmVudCBldmVudCBkdXBsaWNhdGlvblxuICAgICAgICAgICAgaWYgKHdhdGNoZWRFdmVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBldmVudC50eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWV0aG9kcy5zZXRUb0NsZWFyV2F0Y2hlZEV2ZW50KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGRpc2FibGVkQ2xhc3MgPSBuYW1lc3BhY2UgKyAnZGlzYWJsZWQnO1xuICAgICAgICAgIGlmIChzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYuYWRkQ2xhc3MoZGlzYWJsZWRDbGFzcykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCFzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgICBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSAwKSB7XG4gICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYucmVtb3ZlQ2xhc3MoZGlzYWJsZWRDbGFzcykuZmlsdGVyKCcuJyArIG5hbWVzcGFjZSArIFwicHJldlwiKS5hZGRDbGFzcyhkaXNhYmxlZENsYXNzKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzbGlkZXIuYW5pbWF0aW5nVG8gPT09IHNsaWRlci5sYXN0KSB7XG4gICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYucmVtb3ZlQ2xhc3MoZGlzYWJsZWRDbGFzcykuZmlsdGVyKCcuJyArIG5hbWVzcGFjZSArIFwibmV4dFwiKS5hZGRDbGFzcyhkaXNhYmxlZENsYXNzKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdi5yZW1vdmVDbGFzcyhkaXNhYmxlZENsYXNzKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LnJlbW92ZUNsYXNzKGRpc2FibGVkQ2xhc3MpLnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcGF1c2VQbGF5OiB7XG4gICAgICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcGF1c2VQbGF5U2NhZmZvbGQgPSAkKCc8ZGl2IGNsYXNzPVwiJyArIG5hbWVzcGFjZSArICdwYXVzZXBsYXlcIj48YT48L2E+PC9kaXY+Jyk7XG5cbiAgICAgICAgICAvLyBDT05UUk9MU0NPTlRBSU5FUjpcbiAgICAgICAgICBpZiAoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICBzbGlkZXIuY29udHJvbHNDb250YWluZXIuYXBwZW5kKHBhdXNlUGxheVNjYWZmb2xkKTtcbiAgICAgICAgICAgIHNsaWRlci5wYXVzZVBsYXkgPSAkKCcuJyArIG5hbWVzcGFjZSArICdwYXVzZXBsYXkgYScsIHNsaWRlci5jb250cm9sc0NvbnRhaW5lcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5hcHBlbmQocGF1c2VQbGF5U2NhZmZvbGQpO1xuICAgICAgICAgICAgc2xpZGVyLnBhdXNlUGxheSA9ICQoJy4nICsgbmFtZXNwYWNlICsgJ3BhdXNlcGxheSBhJywgc2xpZGVyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBtZXRob2RzLnBhdXNlUGxheS51cGRhdGUoKHNsaWRlci52YXJzLnNsaWRlc2hvdykgPyBuYW1lc3BhY2UgKyAncGF1c2UnIDogbmFtZXNwYWNlICsgJ3BsYXknKTtcblxuICAgICAgICAgIHNsaWRlci5wYXVzZVBsYXkuYmluZChldmVudFR5cGUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiIHx8IHdhdGNoZWRFdmVudCA9PT0gZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhuYW1lc3BhY2UgKyAncGF1c2UnKSkge1xuICAgICAgICAgICAgICAgIHNsaWRlci5tYW51YWxQYXVzZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2xpZGVyLm1hbnVhbFBsYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzbGlkZXIubWFudWFsUGF1c2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzbGlkZXIubWFudWFsUGxheSA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2xpZGVyLnBsYXkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXR1cCBmbGFncyB0byBwcmV2ZW50IGV2ZW50IGR1cGxpY2F0aW9uXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgIHdhdGNoZWRFdmVudCA9IGV2ZW50LnR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXRob2RzLnNldFRvQ2xlYXJXYXRjaGVkRXZlbnQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICAgIChzdGF0ZSA9PT0gXCJwbGF5XCIpID8gc2xpZGVyLnBhdXNlUGxheS5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyAncGF1c2UnKS5hZGRDbGFzcyhuYW1lc3BhY2UgKyAncGxheScpLmh0bWwoc2xpZGVyLnZhcnMucGxheVRleHQpIDogc2xpZGVyLnBhdXNlUGxheS5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyAncGxheScpLmFkZENsYXNzKG5hbWVzcGFjZSArICdwYXVzZScpLmh0bWwoc2xpZGVyLnZhcnMucGF1c2VUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHRvdWNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXJ0WCxcbiAgICAgICAgICBzdGFydFksXG4gICAgICAgICAgb2Zmc2V0LFxuICAgICAgICAgIGN3aWR0aCxcbiAgICAgICAgICBkeCxcbiAgICAgICAgICBzdGFydFQsXG4gICAgICAgICAgc2Nyb2xsaW5nID0gZmFsc2UsXG4gICAgICAgICAgbG9jYWxYID0gMCxcbiAgICAgICAgICBsb2NhbFkgPSAwLFxuICAgICAgICAgIGFjY0R4ID0gMDtcblxuICAgICAgICBpZighbXNHZXN0dXJlKXtcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gb25Ub3VjaFN0YXJ0KGUpIHtcbiAgICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmcpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoICggd2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICkgfHwgZS50b3VjaGVzLmxlbmd0aCA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgICAgICAvLyBDQVJPVVNFTDpcbiAgICAgICAgICAgICAgICBjd2lkdGggPSAodmVydGljYWwpID8gc2xpZGVyLmggOiBzbGlkZXIuIHc7XG4gICAgICAgICAgICAgICAgc3RhcnRUID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgICAgICAgICAgICAgIC8vIENBUk9VU0VMOlxuXG4gICAgICAgICAgICAgICAgLy8gTG9jYWwgdmFycyBmb3IgWCBhbmQgWSBwb2ludHMuXG4gICAgICAgICAgICAgICAgbG9jYWxYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgICAgICAgIGxvY2FsWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcblxuICAgICAgICAgICAgICAgIG9mZnNldCA9IChjYXJvdXNlbCAmJiByZXZlcnNlICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmxhc3QpID8gMCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsICYmIHJldmVyc2UpID8gc2xpZGVyLmxpbWl0IC0gKCgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwgJiYgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpID8gc2xpZGVyLmxpbWl0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwpID8gKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5jdXJyZW50U2xpZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIChyZXZlcnNlKSA/IChzbGlkZXIubGFzdCAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoIDogKHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoO1xuICAgICAgICAgICAgICAgIHN0YXJ0WCA9ICh2ZXJ0aWNhbCkgPyBsb2NhbFkgOiBsb2NhbFg7XG4gICAgICAgICAgICAgICAgc3RhcnRZID0gKHZlcnRpY2FsKSA/IGxvY2FsWCA6IGxvY2FsWTtcblxuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gb25Ub3VjaE1vdmUoZSkge1xuICAgICAgICAgICAgICAvLyBMb2NhbCB2YXJzIGZvciBYIGFuZCBZIHBvaW50cy5cblxuICAgICAgICAgICAgICBsb2NhbFggPSBlLnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgICAgICAgIGxvY2FsWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcblxuICAgICAgICAgICAgICBkeCA9ICh2ZXJ0aWNhbCkgPyBzdGFydFggLSBsb2NhbFkgOiBzdGFydFggLSBsb2NhbFg7XG4gICAgICAgICAgICAgIHNjcm9sbGluZyA9ICh2ZXJ0aWNhbCkgPyAoTWF0aC5hYnMoZHgpIDwgTWF0aC5hYnMobG9jYWxYIC0gc3RhcnRZKSkgOiAoTWF0aC5hYnMoZHgpIDwgTWF0aC5hYnMobG9jYWxZIC0gc3RhcnRZKSk7XG5cbiAgICAgICAgICAgICAgdmFyIGZ4bXMgPSA1MDA7XG5cbiAgICAgICAgICAgICAgaWYgKCAhIHNjcm9sbGluZyB8fCBOdW1iZXIoIG5ldyBEYXRlKCkgKSAtIHN0YXJ0VCA+IGZ4bXMgKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGlmICghZmFkZSAmJiBzbGlkZXIudHJhbnNpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkge1xuICAgICAgICAgICAgICAgICAgICBkeCA9IGR4Lygoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gMCAmJiBkeCA8IDAgfHwgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgZHggPiAwKSA/IChNYXRoLmFicyhkeCkvY3dpZHRoKzIpIDogMSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMob2Zmc2V0ICsgZHgsIFwic2V0VG91Y2hcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uVG91Y2hFbmQoZSkge1xuICAgICAgICAgICAgICAvLyBmaW5pc2ggdGhlIHRvdWNoIGJ5IHVuZG9pbmcgdGhlIHRvdWNoIHNlc3Npb25cbiAgICAgICAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlKTtcblxuICAgICAgICAgICAgICBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIuY3VycmVudFNsaWRlICYmICFzY3JvbGxpbmcgJiYgIShkeCA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlRHggPSAocmV2ZXJzZSkgPyAtZHggOiBkeCxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gKHVwZGF0ZUR4ID4gMCkgPyBzbGlkZXIuZ2V0VGFyZ2V0KCduZXh0JykgOiBzbGlkZXIuZ2V0VGFyZ2V0KCdwcmV2Jyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0KSAmJiAoTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUIDwgNTUwICYmIE1hdGguYWJzKHVwZGF0ZUR4KSA+IDUwIHx8IE1hdGguYWJzKHVwZGF0ZUR4KSA+IGN3aWR0aC8yKSkge1xuICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGlmICghZmFkZSkgc2xpZGVyLmZsZXhBbmltYXRlKHNsaWRlci5jdXJyZW50U2xpZGUsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQsIGZhbHNlKTtcblxuICAgICAgICAgICAgICBzdGFydFggPSBudWxsO1xuICAgICAgICAgICAgICBzdGFydFkgPSBudWxsO1xuICAgICAgICAgICAgICBkeCA9IG51bGw7XG4gICAgICAgICAgICAgIG9mZnNldCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZWwuc3R5bGUubXNUb3VjaEFjdGlvbiA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZWwuX2dlc3R1cmUgPSBuZXcgTVNHZXN0dXJlKCk7XG4gICAgICAgICAgICBlbC5fZ2VzdHVyZS50YXJnZXQgPSBlbDtcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJNU1BvaW50ZXJEb3duXCIsIG9uTVNQb2ludGVyRG93biwgZmFsc2UpO1xuICAgICAgICAgICAgZWwuX3NsaWRlciA9IHNsaWRlcjtcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJNU0dlc3R1cmVDaGFuZ2VcIiwgb25NU0dlc3R1cmVDaGFuZ2UsIGZhbHNlKTtcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJNU0dlc3R1cmVFbmRcIiwgb25NU0dlc3R1cmVFbmQsIGZhbHNlKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gb25NU1BvaW50ZXJEb3duKGUpe1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgICAgICAgICAgZWwuX2dlc3R1cmUuYWRkUG9pbnRlcihlLnBvaW50ZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGFjY0R4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY3dpZHRoID0gKHZlcnRpY2FsKSA/IHNsaWRlci5oIDogc2xpZGVyLiB3O1xuICAgICAgICAgICAgICAgICAgICBzdGFydFQgPSBOdW1iZXIobmV3IERhdGUoKSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIENBUk9VU0VMOlxuXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IChjYXJvdXNlbCAmJiByZXZlcnNlICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmxhc3QpID8gMCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwgJiYgcmV2ZXJzZSkgPyBzbGlkZXIubGltaXQgLSAoKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5hbmltYXRpbmdUbykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjYXJvdXNlbCAmJiBzbGlkZXIuY3VycmVudFNsaWRlID09PSBzbGlkZXIubGFzdCkgPyBzbGlkZXIubGltaXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwpID8gKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5jdXJyZW50U2xpZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHJldmVyc2UpID8gKHNsaWRlci5sYXN0IC0gc2xpZGVyLmN1cnJlbnRTbGlkZSArIHNsaWRlci5jbG9uZU9mZnNldCkgKiBjd2lkdGggOiAoc2xpZGVyLmN1cnJlbnRTbGlkZSArIHNsaWRlci5jbG9uZU9mZnNldCkgKiBjd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvbk1TR2VzdHVyZUNoYW5nZShlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB2YXIgc2xpZGVyID0gZS50YXJnZXQuX3NsaWRlcjtcbiAgICAgICAgICAgICAgICBpZighc2xpZGVyKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdHJhbnNYID0gLWUudHJhbnNsYXRpb25YLFxuICAgICAgICAgICAgICAgICAgICB0cmFuc1kgPSAtZS50cmFuc2xhdGlvblk7XG5cbiAgICAgICAgICAgICAgICAvL0FjY3VtdWxhdGUgdHJhbnNsYXRpb25zLlxuICAgICAgICAgICAgICAgIGFjY0R4ID0gYWNjRHggKyAoKHZlcnRpY2FsKSA/IHRyYW5zWSA6IHRyYW5zWCk7XG4gICAgICAgICAgICAgICAgZHggPSBhY2NEeDtcbiAgICAgICAgICAgICAgICBzY3JvbGxpbmcgPSAodmVydGljYWwpID8gKE1hdGguYWJzKGFjY0R4KSA8IE1hdGguYWJzKC10cmFuc1gpKSA6IChNYXRoLmFicyhhY2NEeCkgPCBNYXRoLmFicygtdHJhbnNZKSk7XG5cbiAgICAgICAgICAgICAgICBpZihlLmRldGFpbCA9PT0gZS5NU0dFU1RVUkVfRkxBR19JTkVSVElBKXtcbiAgICAgICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwuX2dlc3R1cmUuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFzY3JvbGxpbmcgfHwgTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUID4gNTAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmYWRlICYmIHNsaWRlci50cmFuc2l0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHggPSBhY2NEeCAvICgoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gMCAmJiBhY2NEeCA8IDAgfHwgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgYWNjRHggPiAwKSA/IChNYXRoLmFicyhhY2NEeCkgLyBjd2lkdGggKyAyKSA6IDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKG9mZnNldCArIGR4LCBcInNldFRvdWNoXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvbk1TR2VzdHVyZUVuZChlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB2YXIgc2xpZGVyID0gZS50YXJnZXQuX3NsaWRlcjtcbiAgICAgICAgICAgICAgICBpZighc2xpZGVyKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIuY3VycmVudFNsaWRlICYmICFzY3JvbGxpbmcgJiYgIShkeCA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVwZGF0ZUR4ID0gKHJldmVyc2UpID8gLWR4IDogZHgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSAodXBkYXRlRHggPiAwKSA/IHNsaWRlci5nZXRUYXJnZXQoJ25leHQnKSA6IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0KSAmJiAoTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUIDwgNTUwICYmIE1hdGguYWJzKHVwZGF0ZUR4KSA+IDUwIHx8IE1hdGguYWJzKHVwZGF0ZUR4KSA+IGN3aWR0aC8yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZhZGUpIHNsaWRlci5mbGV4QW5pbWF0ZShzbGlkZXIuY3VycmVudFNsaWRlLCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN0YXJ0WCA9IG51bGw7XG4gICAgICAgICAgICAgICAgc3RhcnRZID0gbnVsbDtcbiAgICAgICAgICAgICAgICBkeCA9IG51bGw7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBhY2NEeCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZXNpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXNsaWRlci5hbmltYXRpbmcgJiYgc2xpZGVyLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgICAgaWYgKCFjYXJvdXNlbCkgc2xpZGVyLmRvTWF0aCgpO1xuXG4gICAgICAgICAgaWYgKGZhZGUpIHtcbiAgICAgICAgICAgIC8vIFNNT09USCBIRUlHSFQ6XG4gICAgICAgICAgICBtZXRob2RzLnNtb290aEhlaWdodCgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2Fyb3VzZWwpIHsgLy9DQVJPVVNFTDpcbiAgICAgICAgICAgIHNsaWRlci5zbGlkZXMud2lkdGgoc2xpZGVyLmNvbXB1dGVkVyk7XG4gICAgICAgICAgICBzbGlkZXIudXBkYXRlKHNsaWRlci5wYWdpbmdDb3VudCk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAodmVydGljYWwpIHsgLy9WRVJUSUNBTDpcbiAgICAgICAgICAgIHNsaWRlci52aWV3cG9ydC5oZWlnaHQoc2xpZGVyLmgpO1xuICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKHNsaWRlci5oLCBcInNldFRvdGFsXCIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTTU9PVEggSEVJR0hUOlxuICAgICAgICAgICAgaWYgKHNsaWRlci52YXJzLnNtb290aEhlaWdodCkgbWV0aG9kcy5zbW9vdGhIZWlnaHQoKTtcbiAgICAgICAgICAgIHNsaWRlci5uZXdTbGlkZXMud2lkdGgoc2xpZGVyLmNvbXB1dGVkVyk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVyLmNvbXB1dGVkVywgXCJzZXRUb3RhbFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzbW9vdGhIZWlnaHQ6IGZ1bmN0aW9uKGR1cikge1xuICAgICAgICBpZiAoIXZlcnRpY2FsIHx8IGZhZGUpIHtcbiAgICAgICAgICB2YXIgJG9iaiA9IChmYWRlKSA/IHNsaWRlciA6IHNsaWRlci52aWV3cG9ydDtcbiAgICAgICAgICAoZHVyKSA/ICRvYmouYW5pbWF0ZSh7XCJoZWlnaHRcIjogc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuYW5pbWF0aW5nVG8pLmhlaWdodCgpfSwgZHVyKSA6ICRvYmouaGVpZ2h0KHNsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmFuaW1hdGluZ1RvKS5oZWlnaHQoKSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzeW5jOiBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgICAgdmFyICRvYmogPSAkKHNsaWRlci52YXJzLnN5bmMpLmRhdGEoXCJmbGV4c2xpZGVyXCIpLFxuICAgICAgICAgICAgdGFyZ2V0ID0gc2xpZGVyLmFuaW1hdGluZ1RvO1xuXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgY2FzZSBcImFuaW1hdGVcIjogJG9iai5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIGZhbHNlLCB0cnVlKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBsYXlcIjogaWYgKCEkb2JqLnBsYXlpbmcgJiYgISRvYmouYXNOYXYpIHsgJG9iai5wbGF5KCk7IH0gYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBhdXNlXCI6ICRvYmoucGF1c2UoKTsgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB1bmlxdWVJRDogZnVuY3Rpb24oJGNsb25lKSB7XG4gICAgICAgICRjbG9uZS5maW5kKCAnW2lkXScgKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgICAgJHRoaXMuYXR0ciggJ2lkJywgJHRoaXMuYXR0ciggJ2lkJyApICsgJ19jbG9uZScgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAkY2xvbmU7XG4gICAgICB9LFxuICAgICAgcGF1c2VJbnZpc2libGU6IHtcbiAgICAgICAgdmlzUHJvcDogbnVsbCxcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHByZWZpeGVzID0gWyd3ZWJraXQnLCdtb3onLCdtcycsJ28nXTtcblxuICAgICAgICAgIGlmICgnaGlkZGVuJyBpbiBkb2N1bWVudCkgcmV0dXJuICdoaWRkZW4nO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICgocHJlZml4ZXNbaV0gKyAnSGlkZGVuJykgaW4gZG9jdW1lbnQpXG4gICAgICAgICAgICBtZXRob2RzLnBhdXNlSW52aXNpYmxlLnZpc1Byb3AgPSBwcmVmaXhlc1tpXSArICdIaWRkZW4nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWV0aG9kcy5wYXVzZUludmlzaWJsZS52aXNQcm9wKSB7XG4gICAgICAgICAgICB2YXIgZXZ0bmFtZSA9IG1ldGhvZHMucGF1c2VJbnZpc2libGUudmlzUHJvcC5yZXBsYWNlKC9bSHxoXWlkZGVuLywnJykgKyAndmlzaWJpbGl0eWNoYW5nZSc7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGV2dG5hbWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAobWV0aG9kcy5wYXVzZUludmlzaWJsZS5pc0hpZGRlbigpKSB7XG4gICAgICAgICAgICAgICAgaWYoc2xpZGVyLnN0YXJ0VGltZW91dCkgY2xlYXJUaW1lb3V0KHNsaWRlci5zdGFydFRpbWVvdXQpOyAvL0lmIGNsb2NrIGlzIHRpY2tpbmcsIHN0b3AgdGltZXIgYW5kIHByZXZlbnQgZnJvbSBzdGFydGluZyB3aGlsZSBpbnZpc2libGVcbiAgICAgICAgICAgICAgICBlbHNlIHNsaWRlci5wYXVzZSgpOyAvL09yIGp1c3QgcGF1c2VcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZihzbGlkZXIuc3RhcnRlZCkgc2xpZGVyLnBsYXkoKTsgLy9Jbml0aWF0ZWQgYmVmb3JlLCBqdXN0IHBsYXlcbiAgICAgICAgICAgICAgICBlbHNlIChzbGlkZXIudmFycy5pbml0RGVsYXkgPiAwKSA/IHNldFRpbWVvdXQoc2xpZGVyLnBsYXksIHNsaWRlci52YXJzLmluaXREZWxheSkgOiBzbGlkZXIucGxheSgpOyAvL0RpZG4ndCBpbml0IGJlZm9yZTogc2ltcGx5IGluaXQgb3Igd2FpdCBmb3IgaXRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpc0hpZGRlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGRvY3VtZW50W21ldGhvZHMucGF1c2VJbnZpc2libGUudmlzUHJvcF0gfHwgZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZXRUb0NsZWFyV2F0Y2hlZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHdhdGNoZWRFdmVudENsZWFyVGltZXIpO1xuICAgICAgICB3YXRjaGVkRXZlbnRDbGVhclRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBcIlwiO1xuICAgICAgICB9LCAzMDAwKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gcHVibGljIG1ldGhvZHNcbiAgICBzbGlkZXIuZmxleEFuaW1hdGUgPSBmdW5jdGlvbih0YXJnZXQsIHBhdXNlLCBvdmVycmlkZSwgd2l0aFN5bmMsIGZyb21OYXYpIHtcbiAgICAgIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCAmJiB0YXJnZXQgIT09IHNsaWRlci5jdXJyZW50U2xpZGUpIHtcbiAgICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9ICh0YXJnZXQgPiBzbGlkZXIuY3VycmVudFNsaWRlKSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICB9XG5cbiAgICAgIGlmIChhc05hdiAmJiBzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpIHNsaWRlci5kaXJlY3Rpb24gPSAoc2xpZGVyLmN1cnJlbnRJdGVtIDwgdGFyZ2V0KSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG5cbiAgICAgIGlmICghc2xpZGVyLmFuaW1hdGluZyAmJiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0LCBmcm9tTmF2KSB8fCBvdmVycmlkZSkgJiYgc2xpZGVyLmlzKFwiOnZpc2libGVcIikpIHtcbiAgICAgICAgaWYgKGFzTmF2ICYmIHdpdGhTeW5jKSB7XG4gICAgICAgICAgdmFyIG1hc3RlciA9ICQoc2xpZGVyLnZhcnMuYXNOYXZGb3IpLmRhdGEoJ2ZsZXhzbGlkZXInKTtcbiAgICAgICAgICBzbGlkZXIuYXRFbmQgPSB0YXJnZXQgPT09IDAgfHwgdGFyZ2V0ID09PSBzbGlkZXIuY291bnQgLSAxO1xuICAgICAgICAgIG1hc3Rlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHRydWUsIGZhbHNlLCB0cnVlLCBmcm9tTmF2KTtcbiAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uID0gKHNsaWRlci5jdXJyZW50SXRlbSA8IHRhcmdldCkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuICAgICAgICAgIG1hc3Rlci5kaXJlY3Rpb24gPSBzbGlkZXIuZGlyZWN0aW9uO1xuXG4gICAgICAgICAgaWYgKE1hdGguY2VpbCgodGFyZ2V0ICsgMSkvc2xpZGVyLnZpc2libGUpIC0gMSAhPT0gc2xpZGVyLmN1cnJlbnRTbGlkZSAmJiB0YXJnZXQgIT09IDApIHtcbiAgICAgICAgICAgIHNsaWRlci5jdXJyZW50SXRlbSA9IHRhcmdldDtcbiAgICAgICAgICAgIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEodGFyZ2V0KS5hZGRDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKTtcbiAgICAgICAgICAgIHRhcmdldCA9IE1hdGguZmxvb3IodGFyZ2V0L3NsaWRlci52aXNpYmxlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLmN1cnJlbnRJdGVtID0gdGFyZ2V0O1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKS5lcSh0YXJnZXQpLmFkZENsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNsaWRlci5hbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nVG8gPSB0YXJnZXQ7XG5cbiAgICAgICAgLy8gU0xJREVTSE9XOlxuICAgICAgICBpZiAocGF1c2UpIHNsaWRlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEFQSTogYmVmb3JlKCkgYW5pbWF0aW9uIENhbGxiYWNrXG4gICAgICAgIHNsaWRlci52YXJzLmJlZm9yZShzbGlkZXIpO1xuXG4gICAgICAgIC8vIFNZTkM6XG4gICAgICAgIGlmIChzbGlkZXIuc3luY0V4aXN0cyAmJiAhZnJvbU5hdikgbWV0aG9kcy5zeW5jKFwiYW5pbWF0ZVwiKTtcblxuICAgICAgICAvLyBDT05UUk9MTkFWXG4gICAgICAgIGlmIChzbGlkZXIudmFycy5jb250cm9sTmF2KSBtZXRob2RzLmNvbnRyb2xOYXYuYWN0aXZlKCk7XG5cbiAgICAgICAgLy8gIUNBUk9VU0VMOlxuICAgICAgICAvLyBDQU5ESURBVEU6IHNsaWRlIGFjdGl2ZSBjbGFzcyAoZm9yIGFkZC9yZW1vdmUgc2xpZGUpXG4gICAgICAgIGlmICghY2Fyb3VzZWwpIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgJ2FjdGl2ZS1zbGlkZScpLmVxKHRhcmdldCkuYWRkQ2xhc3MobmFtZXNwYWNlICsgJ2FjdGl2ZS1zbGlkZScpO1xuXG4gICAgICAgIC8vIElORklOSVRFIExPT1A6XG4gICAgICAgIC8vIENBTkRJREFURTogYXRFbmRcbiAgICAgICAgc2xpZGVyLmF0RW5kID0gdGFyZ2V0ID09PSAwIHx8IHRhcmdldCA9PT0gc2xpZGVyLmxhc3Q7XG5cbiAgICAgICAgLy8gRElSRUNUSU9OTkFWOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuZGlyZWN0aW9uTmF2KSBtZXRob2RzLmRpcmVjdGlvbk5hdi51cGRhdGUoKTtcblxuICAgICAgICBpZiAodGFyZ2V0ID09PSBzbGlkZXIubGFzdCkge1xuICAgICAgICAgIC8vIEFQSTogZW5kKCkgb2YgY3ljbGUgQ2FsbGJhY2tcbiAgICAgICAgICBzbGlkZXIudmFycy5lbmQoc2xpZGVyKTtcbiAgICAgICAgICAvLyBTTElERVNIT1cgJiYgIUlORklOSVRFIExPT1A6XG4gICAgICAgICAgaWYgKCFzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNMSURFOlxuICAgICAgICBpZiAoIWZhZGUpIHtcbiAgICAgICAgICB2YXIgZGltZW5zaW9uID0gKHZlcnRpY2FsKSA/IHNsaWRlci5zbGlkZXMuZmlsdGVyKCc6Zmlyc3QnKS5oZWlnaHQoKSA6IHNsaWRlci5jb21wdXRlZFcsXG4gICAgICAgICAgICAgIG1hcmdpbiwgc2xpZGVTdHJpbmcsIGNhbGNOZXh0O1xuXG4gICAgICAgICAgLy8gSU5GSU5JVEUgTE9PUCAvIFJFVkVSU0U6XG4gICAgICAgICAgaWYgKGNhcm91c2VsKSB7XG4gICAgICAgICAgICAvL21hcmdpbiA9IChzbGlkZXIudmFycy5pdGVtV2lkdGggPiBzbGlkZXIudykgPyBzbGlkZXIudmFycy5pdGVtTWFyZ2luICogMiA6IHNsaWRlci52YXJzLml0ZW1NYXJnaW47XG4gICAgICAgICAgICBtYXJnaW4gPSBzbGlkZXIudmFycy5pdGVtTWFyZ2luO1xuICAgICAgICAgICAgY2FsY05leHQgPSAoKHNsaWRlci5pdGVtVyArIG1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAgICAgICBzbGlkZVN0cmluZyA9IChjYWxjTmV4dCA+IHNsaWRlci5saW1pdCAmJiBzbGlkZXIudmlzaWJsZSAhPT0gMSkgPyBzbGlkZXIubGltaXQgOiBjYWxjTmV4dDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgdGFyZ2V0ID09PSBzbGlkZXIuY291bnQgLSAxICYmIHNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJuZXh0XCIpIHtcbiAgICAgICAgICAgIHNsaWRlU3RyaW5nID0gKHJldmVyc2UpID8gKHNsaWRlci5jb3VudCArIHNsaWRlci5jbG9uZU9mZnNldCkgKiBkaW1lbnNpb24gOiAwO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgdGFyZ2V0ID09PSAwICYmIHNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJwcmV2XCIpIHtcbiAgICAgICAgICAgIHNsaWRlU3RyaW5nID0gKHJldmVyc2UpID8gMCA6IChzbGlkZXIuY291bnQgKyAxKSAqIGRpbWVuc2lvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVTdHJpbmcgPSAocmV2ZXJzZSkgPyAoKHNsaWRlci5jb3VudCAtIDEpIC0gdGFyZ2V0ICsgc2xpZGVyLmNsb25lT2Zmc2V0KSAqIGRpbWVuc2lvbiA6ICh0YXJnZXQgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogZGltZW5zaW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVTdHJpbmcsIFwiXCIsIHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgICAgICBpZiAoc2xpZGVyLnRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIXNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgfHwgIXNsaWRlci5hdEVuZCkge1xuICAgICAgICAgICAgICBzbGlkZXIuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgPSBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLnVuYmluZChcIndlYmtpdFRyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZFwiKTtcbiAgICAgICAgICAgIHNsaWRlci5jb250YWluZXIuYmluZChcIndlYmtpdFRyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2xpZGVyLndyYXB1cChkaW1lbnNpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5jb250YWluZXIuYW5pbWF0ZShzbGlkZXIuYXJncywgc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsIHNsaWRlci52YXJzLmVhc2luZywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgc2xpZGVyLndyYXB1cChkaW1lbnNpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgeyAvLyBGQURFOlxuICAgICAgICAgIGlmICghdG91Y2gpIHtcbiAgICAgICAgICAgIC8vc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5mYWRlT3V0KHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcpO1xuICAgICAgICAgICAgLy9zbGlkZXIuc2xpZGVzLmVxKHRhcmdldCkuZmFkZUluKHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcsIHNsaWRlci53cmFwdXApO1xuXG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5jdXJyZW50U2xpZGUpLmNzcyh7XCJ6SW5kZXhcIjogMX0pLmFuaW1hdGUoe1wib3BhY2l0eVwiOiAwfSwgc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsIHNsaWRlci52YXJzLmVhc2luZyk7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmVxKHRhcmdldCkuY3NzKHtcInpJbmRleFwiOiAyfSkuYW5pbWF0ZSh7XCJvcGFjaXR5XCI6IDF9LCBzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCwgc2xpZGVyLnZhcnMuZWFzaW5nLCBzbGlkZXIud3JhcHVwKTtcblxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5jdXJyZW50U2xpZGUpLmNzcyh7IFwib3BhY2l0eVwiOiAwLCBcInpJbmRleFwiOiAxIH0pO1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5lcSh0YXJnZXQpLmNzcyh7IFwib3BhY2l0eVwiOiAxLCBcInpJbmRleFwiOiAyIH0pO1xuICAgICAgICAgICAgc2xpZGVyLndyYXB1cChkaW1lbnNpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBTTU9PVEggSEVJR0hUOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuc21vb3RoSGVpZ2h0KSBtZXRob2RzLnNtb290aEhlaWdodChzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBzbGlkZXIud3JhcHVwID0gZnVuY3Rpb24oZGltZW5zaW9uKSB7XG4gICAgICAvLyBTTElERTpcbiAgICAgIGlmICghZmFkZSAmJiAhY2Fyb3VzZWwpIHtcbiAgICAgICAgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCAmJiBzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgc2xpZGVyLnNldFByb3BzKGRpbWVuc2lvbiwgXCJqdW1wRW5kXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0ICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gMCAmJiBzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgc2xpZGVyLnNldFByb3BzKGRpbWVuc2lvbiwgXCJqdW1wU3RhcnRcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNsaWRlci5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgPSBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAvLyBBUEk6IGFmdGVyKCkgYW5pbWF0aW9uIENhbGxiYWNrXG4gICAgICBzbGlkZXIudmFycy5hZnRlcihzbGlkZXIpO1xuICAgIH07XG5cbiAgICAvLyBTTElERVNIT1c6XG4gICAgc2xpZGVyLmFuaW1hdGVTbGlkZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghc2xpZGVyLmFuaW1hdGluZyAmJiBmb2N1c2VkICkgc2xpZGVyLmZsZXhBbmltYXRlKHNsaWRlci5nZXRUYXJnZXQoXCJuZXh0XCIpKTtcbiAgICB9O1xuICAgIC8vIFNMSURFU0hPVzpcbiAgICBzbGlkZXIucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoc2xpZGVyLmFuaW1hdGVkU2xpZGVzKTtcbiAgICAgIHNsaWRlci5hbmltYXRlZFNsaWRlcyA9IG51bGw7XG4gICAgICBzbGlkZXIucGxheWluZyA9IGZhbHNlO1xuICAgICAgLy8gUEFVU0VQTEFZOlxuICAgICAgaWYgKHNsaWRlci52YXJzLnBhdXNlUGxheSkgbWV0aG9kcy5wYXVzZVBsYXkudXBkYXRlKFwicGxheVwiKTtcbiAgICAgIC8vIFNZTkM6XG4gICAgICBpZiAoc2xpZGVyLnN5bmNFeGlzdHMpIG1ldGhvZHMuc3luYyhcInBhdXNlXCIpO1xuICAgIH07XG4gICAgLy8gU0xJREVTSE9XOlxuICAgIHNsaWRlci5wbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc2xpZGVyLnBsYXlpbmcpIGNsZWFySW50ZXJ2YWwoc2xpZGVyLmFuaW1hdGVkU2xpZGVzKTtcbiAgICAgIHNsaWRlci5hbmltYXRlZFNsaWRlcyA9IHNsaWRlci5hbmltYXRlZFNsaWRlcyB8fCBzZXRJbnRlcnZhbChzbGlkZXIuYW5pbWF0ZVNsaWRlcywgc2xpZGVyLnZhcnMuc2xpZGVzaG93U3BlZWQpO1xuICAgICAgc2xpZGVyLnN0YXJ0ZWQgPSBzbGlkZXIucGxheWluZyA9IHRydWU7XG4gICAgICAvLyBQQVVTRVBMQVk6XG4gICAgICBpZiAoc2xpZGVyLnZhcnMucGF1c2VQbGF5KSBtZXRob2RzLnBhdXNlUGxheS51cGRhdGUoXCJwYXVzZVwiKTtcbiAgICAgIC8vIFNZTkM6XG4gICAgICBpZiAoc2xpZGVyLnN5bmNFeGlzdHMpIG1ldGhvZHMuc3luYyhcInBsYXlcIik7XG4gICAgfTtcbiAgICAvLyBTVE9QOlxuICAgIHNsaWRlci5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgc2xpZGVyLnBhdXNlKCk7XG4gICAgICBzbGlkZXIuc3RvcHBlZCA9IHRydWU7XG4gICAgfTtcbiAgICBzbGlkZXIuY2FuQWR2YW5jZSA9IGZ1bmN0aW9uKHRhcmdldCwgZnJvbU5hdikge1xuICAgICAgLy8gQVNOQVY6XG4gICAgICB2YXIgbGFzdCA9IChhc05hdikgPyBzbGlkZXIucGFnaW5nQ291bnQgLSAxIDogc2xpZGVyLmxhc3Q7XG4gICAgICByZXR1cm4gKGZyb21OYXYpID8gdHJ1ZSA6XG4gICAgICAgICAgICAgKGFzTmF2ICYmIHNsaWRlci5jdXJyZW50SXRlbSA9PT0gc2xpZGVyLmNvdW50IC0gMSAmJiB0YXJnZXQgPT09IDAgJiYgc2xpZGVyLmRpcmVjdGlvbiA9PT0gXCJwcmV2XCIpID8gdHJ1ZSA6XG4gICAgICAgICAgICAgKGFzTmF2ICYmIHNsaWRlci5jdXJyZW50SXRlbSA9PT0gMCAmJiB0YXJnZXQgPT09IHNsaWRlci5wYWdpbmdDb3VudCAtIDEgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJuZXh0XCIpID8gZmFsc2UgOlxuICAgICAgICAgICAgICh0YXJnZXQgPT09IHNsaWRlci5jdXJyZW50U2xpZGUgJiYgIWFzTmF2KSA/IGZhbHNlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkgPyB0cnVlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLmF0RW5kICYmIHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgdGFyZ2V0ID09PSBsYXN0ICYmIHNsaWRlci5kaXJlY3Rpb24gIT09IFwibmV4dFwiKSA/IGZhbHNlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLmF0RW5kICYmIHNsaWRlci5jdXJyZW50U2xpZGUgPT09IGxhc3QgJiYgdGFyZ2V0ID09PSAwICYmIHNsaWRlci5kaXJlY3Rpb24gPT09IFwibmV4dFwiKSA/IGZhbHNlIDpcbiAgICAgICAgICAgICB0cnVlO1xuICAgIH07XG4gICAgc2xpZGVyLmdldFRhcmdldCA9IGZ1bmN0aW9uKGRpcikge1xuICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9IGRpcjtcbiAgICAgIGlmIChkaXIgPT09IFwibmV4dFwiKSB7XG4gICAgICAgIHJldHVybiAoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpID8gMCA6IHNsaWRlci5jdXJyZW50U2xpZGUgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChzbGlkZXIuY3VycmVudFNsaWRlID09PSAwKSA/IHNsaWRlci5sYXN0IDogc2xpZGVyLmN1cnJlbnRTbGlkZSAtIDE7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIFNMSURFOlxuICAgIHNsaWRlci5zZXRQcm9wcyA9IGZ1bmN0aW9uKHBvcywgc3BlY2lhbCwgZHVyKSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcG9zQ2hlY2sgPSAocG9zKSA/IHBvcyA6ICgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8sXG4gICAgICAgICAgICBwb3NDYWxjID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAoY2Fyb3VzZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHNwZWNpYWwgPT09IFwic2V0VG91Y2hcIikgPyBwb3MgOlxuICAgICAgICAgICAgICAgICAgICAgICAocmV2ZXJzZSAmJiBzbGlkZXIuYW5pbWF0aW5nVG8gPT09IHNsaWRlci5sYXN0KSA/IDAgOlxuICAgICAgICAgICAgICAgICAgICAgICAocmV2ZXJzZSkgPyBzbGlkZXIubGltaXQgLSAoKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5hbmltYXRpbmdUbykgOlxuICAgICAgICAgICAgICAgICAgICAgICAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCkgPyBzbGlkZXIubGltaXQgOiBwb3NDaGVjaztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHNwZWNpYWwpIHtcbiAgICAgICAgICAgICAgICAgIGNhc2UgXCJzZXRUb3RhbFwiOiByZXR1cm4gKHJldmVyc2UpID8gKChzbGlkZXIuY291bnQgLSAxKSAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogcG9zIDogKHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogcG9zO1xuICAgICAgICAgICAgICAgICAgY2FzZSBcInNldFRvdWNoXCI6IHJldHVybiAocmV2ZXJzZSkgPyBwb3MgOiBwb3M7XG4gICAgICAgICAgICAgICAgICBjYXNlIFwianVtcEVuZFwiOiByZXR1cm4gKHJldmVyc2UpID8gcG9zIDogc2xpZGVyLmNvdW50ICogcG9zO1xuICAgICAgICAgICAgICAgICAgY2FzZSBcImp1bXBTdGFydFwiOiByZXR1cm4gKHJldmVyc2UpID8gc2xpZGVyLmNvdW50ICogcG9zIDogcG9zO1xuICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIHBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oKSk7XG5cbiAgICAgICAgICAgIHJldHVybiAocG9zQ2FsYyAqIC0xKSArIFwicHhcIjtcbiAgICAgICAgICB9KCkpO1xuXG4gICAgICBpZiAoc2xpZGVyLnRyYW5zaXRpb25zKSB7XG4gICAgICAgIHRhcmdldCA9ICh2ZXJ0aWNhbCkgPyBcInRyYW5zbGF0ZTNkKDAsXCIgKyB0YXJnZXQgKyBcIiwwKVwiIDogXCJ0cmFuc2xhdGUzZChcIiArIHRhcmdldCArIFwiLDAsMClcIjtcbiAgICAgICAgZHVyID0gKGR1ciAhPT0gdW5kZWZpbmVkKSA/IChkdXIvMTAwMCkgKyBcInNcIiA6IFwiMHNcIjtcbiAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5jc3MoXCItXCIgKyBzbGlkZXIucGZ4ICsgXCItdHJhbnNpdGlvbi1kdXJhdGlvblwiLCBkdXIpO1xuICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5jc3MoXCJ0cmFuc2l0aW9uLWR1cmF0aW9uXCIsIGR1cik7XG4gICAgICB9XG5cbiAgICAgIHNsaWRlci5hcmdzW3NsaWRlci5wcm9wXSA9IHRhcmdldDtcbiAgICAgIGlmIChzbGlkZXIudHJhbnNpdGlvbnMgfHwgZHVyID09PSB1bmRlZmluZWQpIHNsaWRlci5jb250YWluZXIuY3NzKHNsaWRlci5hcmdzKTtcblxuICAgICAgc2xpZGVyLmNvbnRhaW5lci5jc3MoJ3RyYW5zZm9ybScsdGFyZ2V0KTtcbiAgICB9O1xuXG4gICAgc2xpZGVyLnNldHVwID0gZnVuY3Rpb24odHlwZSkge1xuICAgICAgLy8gU0xJREU6XG4gICAgICBpZiAoIWZhZGUpIHtcbiAgICAgICAgdmFyIHNsaWRlck9mZnNldCwgYXJyO1xuXG4gICAgICAgIGlmICh0eXBlID09PSBcImluaXRcIikge1xuICAgICAgICAgIHNsaWRlci52aWV3cG9ydCA9ICQoJzxkaXYgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ3ZpZXdwb3J0XCI+PC9kaXY+JykuY3NzKHtcIm92ZXJmbG93XCI6IFwiaGlkZGVuXCIsIFwicG9zaXRpb25cIjogXCJyZWxhdGl2ZVwifSkuYXBwZW5kVG8oc2xpZGVyKS5hcHBlbmQoc2xpZGVyLmNvbnRhaW5lcik7XG4gICAgICAgICAgLy8gSU5GSU5JVEUgTE9PUDpcbiAgICAgICAgICBzbGlkZXIuY2xvbmVDb3VudCA9IDA7XG4gICAgICAgICAgc2xpZGVyLmNsb25lT2Zmc2V0ID0gMDtcbiAgICAgICAgICAvLyBSRVZFUlNFOlxuICAgICAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgICAgICBhcnIgPSAkLm1ha2VBcnJheShzbGlkZXIuc2xpZGVzKS5yZXZlcnNlKCk7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzID0gJChhcnIpO1xuICAgICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5lbXB0eSgpLmFwcGVuZChzbGlkZXIuc2xpZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSU5GSU5JVEUgTE9PUCAmJiAhQ0FST1VTRUw6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5hbmltYXRpb25Mb29wICYmICFjYXJvdXNlbCkge1xuICAgICAgICAgIHNsaWRlci5jbG9uZUNvdW50ID0gMjtcbiAgICAgICAgICBzbGlkZXIuY2xvbmVPZmZzZXQgPSAxO1xuICAgICAgICAgIC8vIGNsZWFyIG91dCBvbGQgY2xvbmVzXG4gICAgICAgICAgaWYgKHR5cGUgIT09IFwiaW5pdFwiKSBzbGlkZXIuY29udGFpbmVyLmZpbmQoJy5jbG9uZScpLnJlbW92ZSgpO1xuICAgICAgICAgIHNsaWRlci5jb250YWluZXIuYXBwZW5kKHNsaWRlci5zbGlkZXMuZmlyc3QoKS5jbG9uZSgpLmFkZENsYXNzKCdjbG9uZScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKSkucHJlcGVuZChzbGlkZXIuc2xpZGVzLmxhc3QoKS5jbG9uZSgpLmFkZENsYXNzKCdjbG9uZScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKSk7XG5cdFx0ICAgICAgbWV0aG9kcy51bmlxdWVJRCggc2xpZGVyLnNsaWRlcy5maXJzdCgpLmNsb25lKCkuYWRkQ2xhc3MoJ2Nsb25lJykgKS5hcHBlbmRUbyggc2xpZGVyLmNvbnRhaW5lciApO1xuXHRcdCAgICAgIG1ldGhvZHMudW5pcXVlSUQoIHNsaWRlci5zbGlkZXMubGFzdCgpLmNsb25lKCkuYWRkQ2xhc3MoJ2Nsb25lJykgKS5wcmVwZW5kVG8oIHNsaWRlci5jb250YWluZXIgKTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXIubmV3U2xpZGVzID0gJChzbGlkZXIudmFycy5zZWxlY3Rvciwgc2xpZGVyKTtcblxuICAgICAgICBzbGlkZXJPZmZzZXQgPSAocmV2ZXJzZSkgPyBzbGlkZXIuY291bnQgLSAxIC0gc2xpZGVyLmN1cnJlbnRTbGlkZSArIHNsaWRlci5jbG9uZU9mZnNldCA6IHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQ7XG4gICAgICAgIC8vIFZFUlRJQ0FMOlxuICAgICAgICBpZiAodmVydGljYWwgJiYgIWNhcm91c2VsKSB7XG4gICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5oZWlnaHQoKHNsaWRlci5jb3VudCArIHNsaWRlci5jbG9uZUNvdW50KSAqIDIwMCArIFwiJVwiKS5jc3MoXCJwb3NpdGlvblwiLCBcImFic29sdXRlXCIpLndpZHRoKFwiMTAwJVwiKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzbGlkZXIubmV3U2xpZGVzLmNzcyh7XCJkaXNwbGF5XCI6IFwiYmxvY2tcIn0pO1xuICAgICAgICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuICAgICAgICAgICAgc2xpZGVyLnZpZXdwb3J0LmhlaWdodChzbGlkZXIuaCk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVyT2Zmc2V0ICogc2xpZGVyLmgsIFwiaW5pdFwiKTtcbiAgICAgICAgICB9LCAodHlwZSA9PT0gXCJpbml0XCIpID8gMTAwIDogMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci53aWR0aCgoc2xpZGVyLmNvdW50ICsgc2xpZGVyLmNsb25lQ291bnQpICogMjAwICsgXCIlXCIpO1xuICAgICAgICAgIHNsaWRlci5zZXRQcm9wcyhzbGlkZXJPZmZzZXQgKiBzbGlkZXIuY29tcHV0ZWRXLCBcImluaXRcIik7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuICAgICAgICAgICAgc2xpZGVyLm5ld1NsaWRlcy5jc3Moe1wid2lkdGhcIjogc2xpZGVyLmNvbXB1dGVkVywgXCJmbG9hdFwiOiBcImxlZnRcIiwgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIn0pO1xuICAgICAgICAgICAgLy8gU01PT1RIIEhFSUdIVDpcbiAgICAgICAgICAgIGlmIChzbGlkZXIudmFycy5zbW9vdGhIZWlnaHQpIG1ldGhvZHMuc21vb3RoSGVpZ2h0KCk7XG4gICAgICAgICAgfSwgKHR5cGUgPT09IFwiaW5pdFwiKSA/IDEwMCA6IDApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBGQURFOlxuICAgICAgICBzbGlkZXIuc2xpZGVzLmNzcyh7XCJ3aWR0aFwiOiBcIjEwMCVcIiwgXCJmbG9hdFwiOiBcImxlZnRcIiwgXCJtYXJnaW5SaWdodFwiOiBcIi0xMDAlXCIsIFwicG9zaXRpb25cIjogXCJyZWxhdGl2ZVwifSk7XG4gICAgICAgIGlmICh0eXBlID09PSBcImluaXRcIikge1xuICAgICAgICAgIGlmICghdG91Y2gpIHtcbiAgICAgICAgICAgIC8vc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5mYWRlSW4oc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsIHNsaWRlci52YXJzLmVhc2luZyk7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmNzcyh7IFwib3BhY2l0eVwiOiAwLCBcImRpc3BsYXlcIjogXCJibG9ja1wiLCBcInpJbmRleFwiOiAxIH0pLmVxKHNsaWRlci5jdXJyZW50U2xpZGUpLmNzcyh7XCJ6SW5kZXhcIjogMn0pLmFuaW1hdGUoe1wib3BhY2l0eVwiOiAxfSxzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCxzbGlkZXIudmFycy5lYXNpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmNzcyh7IFwib3BhY2l0eVwiOiAwLCBcImRpc3BsYXlcIjogXCJibG9ja1wiLCBcIndlYmtpdFRyYW5zaXRpb25cIjogXCJvcGFjaXR5IFwiICsgc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQgLyAxMDAwICsgXCJzIGVhc2VcIiwgXCJ6SW5kZXhcIjogMSB9KS5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5jc3MoeyBcIm9wYWNpdHlcIjogMSwgXCJ6SW5kZXhcIjogMn0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBTTU9PVEggSEVJR0hUOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuc21vb3RoSGVpZ2h0KSBtZXRob2RzLnNtb290aEhlaWdodCgpO1xuICAgICAgfVxuICAgICAgLy8gIUNBUk9VU0VMOlxuICAgICAgLy8gQ0FORElEQVRFOiBhY3RpdmUgc2xpZGVcbiAgICAgIGlmICghY2Fyb3VzZWwpIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuYWRkQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIik7XG5cbiAgICAgIC8vRmxleFNsaWRlcjogaW5pdCgpIENhbGxiYWNrXG4gICAgICBzbGlkZXIudmFycy5pbml0KHNsaWRlcik7XG4gICAgfTtcblxuICAgIHNsaWRlci5kb01hdGggPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzbGlkZSA9IHNsaWRlci5zbGlkZXMuZmlyc3QoKSxcbiAgICAgICAgICBzbGlkZU1hcmdpbiA9IHNsaWRlci52YXJzLml0ZW1NYXJnaW4sXG4gICAgICAgICAgbWluSXRlbXMgPSBzbGlkZXIudmFycy5taW5JdGVtcyxcbiAgICAgICAgICBtYXhJdGVtcyA9IHNsaWRlci52YXJzLm1heEl0ZW1zO1xuXG4gICAgICBzbGlkZXIudyA9IChzbGlkZXIudmlld3BvcnQ9PT11bmRlZmluZWQpID8gc2xpZGVyLndpZHRoKCkgOiBzbGlkZXIudmlld3BvcnQud2lkdGgoKTtcbiAgICAgIHNsaWRlci5oID0gc2xpZGUuaGVpZ2h0KCk7XG4gICAgICBzbGlkZXIuYm94UGFkZGluZyA9IHNsaWRlLm91dGVyV2lkdGgoKSAtIHNsaWRlLndpZHRoKCk7XG5cbiAgICAgIC8vIENBUk9VU0VMOlxuICAgICAgaWYgKGNhcm91c2VsKSB7XG4gICAgICAgIHNsaWRlci5pdGVtVCA9IHNsaWRlci52YXJzLml0ZW1XaWR0aCArIHNsaWRlTWFyZ2luO1xuICAgICAgICBzbGlkZXIubWluVyA9IChtaW5JdGVtcykgPyBtaW5JdGVtcyAqIHNsaWRlci5pdGVtVCA6IHNsaWRlci53O1xuICAgICAgICBzbGlkZXIubWF4VyA9IChtYXhJdGVtcykgPyAobWF4SXRlbXMgKiBzbGlkZXIuaXRlbVQpIC0gc2xpZGVNYXJnaW4gOiBzbGlkZXIudztcbiAgICAgICAgc2xpZGVyLml0ZW1XID0gKHNsaWRlci5taW5XID4gc2xpZGVyLncpID8gKHNsaWRlci53IC0gKHNsaWRlTWFyZ2luICogKG1pbkl0ZW1zIC0gMSkpKS9taW5JdGVtcyA6XG4gICAgICAgICAgICAgICAgICAgICAgIChzbGlkZXIubWF4VyA8IHNsaWRlci53KSA/IChzbGlkZXIudyAtIChzbGlkZU1hcmdpbiAqIChtYXhJdGVtcyAtIDEpKSkvbWF4SXRlbXMgOlxuICAgICAgICAgICAgICAgICAgICAgICAoc2xpZGVyLnZhcnMuaXRlbVdpZHRoID4gc2xpZGVyLncpID8gc2xpZGVyLncgOiBzbGlkZXIudmFycy5pdGVtV2lkdGg7XG5cbiAgICAgICAgc2xpZGVyLnZpc2libGUgPSBNYXRoLmZsb29yKHNsaWRlci53LyhzbGlkZXIuaXRlbVcpKTtcbiAgICAgICAgc2xpZGVyLm1vdmUgPSAoc2xpZGVyLnZhcnMubW92ZSA+IDAgJiYgc2xpZGVyLnZhcnMubW92ZSA8IHNsaWRlci52aXNpYmxlICkgPyBzbGlkZXIudmFycy5tb3ZlIDogc2xpZGVyLnZpc2libGU7XG4gICAgICAgIHNsaWRlci5wYWdpbmdDb3VudCA9IE1hdGguY2VpbCgoKHNsaWRlci5jb3VudCAtIHNsaWRlci52aXNpYmxlKS9zbGlkZXIubW92ZSkgKyAxKTtcbiAgICAgICAgc2xpZGVyLmxhc3QgPSAgc2xpZGVyLnBhZ2luZ0NvdW50IC0gMTtcbiAgICAgICAgc2xpZGVyLmxpbWl0ID0gKHNsaWRlci5wYWdpbmdDb3VudCA9PT0gMSkgPyAwIDpcbiAgICAgICAgICAgICAgICAgICAgICAgKHNsaWRlci52YXJzLml0ZW1XaWR0aCA+IHNsaWRlci53KSA/IChzbGlkZXIuaXRlbVcgKiAoc2xpZGVyLmNvdW50IC0gMSkpICsgKHNsaWRlTWFyZ2luICogKHNsaWRlci5jb3VudCAtIDEpKSA6ICgoc2xpZGVyLml0ZW1XICsgc2xpZGVNYXJnaW4pICogc2xpZGVyLmNvdW50KSAtIHNsaWRlci53IC0gc2xpZGVNYXJnaW47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzbGlkZXIuaXRlbVcgPSBzbGlkZXIudztcbiAgICAgICAgc2xpZGVyLnBhZ2luZ0NvdW50ID0gc2xpZGVyLmNvdW50O1xuICAgICAgICBzbGlkZXIubGFzdCA9IHNsaWRlci5jb3VudCAtIDE7XG4gICAgICB9XG4gICAgICBzbGlkZXIuY29tcHV0ZWRXID0gc2xpZGVyLml0ZW1XIC0gc2xpZGVyLmJveFBhZGRpbmc7XG4gICAgfTtcblxuICAgIHNsaWRlci51cGRhdGUgPSBmdW5jdGlvbihwb3MsIGFjdGlvbikge1xuICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuXG4gICAgICAvLyB1cGRhdGUgY3VycmVudFNsaWRlIGFuZCBzbGlkZXIuYW5pbWF0aW5nVG8gaWYgbmVjZXNzYXJ5XG4gICAgICBpZiAoIWNhcm91c2VsKSB7XG4gICAgICAgIGlmIChwb3MgPCBzbGlkZXIuY3VycmVudFNsaWRlKSB7XG4gICAgICAgICAgc2xpZGVyLmN1cnJlbnRTbGlkZSArPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKHBvcyA8PSBzbGlkZXIuY3VycmVudFNsaWRlICYmIHBvcyAhPT0gMCkge1xuICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgLT0gMTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nVG8gPSBzbGlkZXIuY3VycmVudFNsaWRlO1xuICAgICAgfVxuXG4gICAgICAvLyB1cGRhdGUgY29udHJvbE5hdlxuICAgICAgaWYgKHNsaWRlci52YXJzLmNvbnRyb2xOYXYgJiYgIXNsaWRlci5tYW51YWxDb250cm9scykge1xuICAgICAgICBpZiAoKGFjdGlvbiA9PT0gXCJhZGRcIiAmJiAhY2Fyb3VzZWwpIHx8IHNsaWRlci5wYWdpbmdDb3VudCA+IHNsaWRlci5jb250cm9sTmF2Lmxlbmd0aCkge1xuICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi51cGRhdGUoXCJhZGRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoKGFjdGlvbiA9PT0gXCJyZW1vdmVcIiAmJiAhY2Fyb3VzZWwpIHx8IHNsaWRlci5wYWdpbmdDb3VudCA8IHNsaWRlci5jb250cm9sTmF2Lmxlbmd0aCkge1xuICAgICAgICAgIGlmIChjYXJvdXNlbCAmJiBzbGlkZXIuY3VycmVudFNsaWRlID4gc2xpZGVyLmxhc3QpIHtcbiAgICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgLT0gMTtcbiAgICAgICAgICAgIHNsaWRlci5hbmltYXRpbmdUbyAtPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYudXBkYXRlKFwicmVtb3ZlXCIsIHNsaWRlci5sYXN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIGRpcmVjdGlvbk5hdlxuICAgICAgaWYgKHNsaWRlci52YXJzLmRpcmVjdGlvbk5hdikgbWV0aG9kcy5kaXJlY3Rpb25OYXYudXBkYXRlKCk7XG5cbiAgICB9O1xuXG4gICAgc2xpZGVyLmFkZFNsaWRlID0gZnVuY3Rpb24ob2JqLCBwb3MpIHtcbiAgICAgIHZhciAkb2JqID0gJChvYmopO1xuXG4gICAgICBzbGlkZXIuY291bnQgKz0gMTtcbiAgICAgIHNsaWRlci5sYXN0ID0gc2xpZGVyLmNvdW50IC0gMTtcblxuICAgICAgLy8gYXBwZW5kIG5ldyBzbGlkZVxuICAgICAgaWYgKHZlcnRpY2FsICYmIHJldmVyc2UpIHtcbiAgICAgICAgKHBvcyAhPT0gdW5kZWZpbmVkKSA/IHNsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmNvdW50IC0gcG9zKS5hZnRlcigkb2JqKSA6IHNsaWRlci5jb250YWluZXIucHJlcGVuZCgkb2JqKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChwb3MgIT09IHVuZGVmaW5lZCkgPyBzbGlkZXIuc2xpZGVzLmVxKHBvcykuYmVmb3JlKCRvYmopIDogc2xpZGVyLmNvbnRhaW5lci5hcHBlbmQoJG9iaik7XG4gICAgICB9XG5cbiAgICAgIC8vIHVwZGF0ZSBjdXJyZW50U2xpZGUsIGFuaW1hdGluZ1RvLCBjb250cm9sTmF2LCBhbmQgZGlyZWN0aW9uTmF2XG4gICAgICBzbGlkZXIudXBkYXRlKHBvcywgXCJhZGRcIik7XG5cbiAgICAgIC8vIHVwZGF0ZSBzbGlkZXIuc2xpZGVzXG4gICAgICBzbGlkZXIuc2xpZGVzID0gJChzbGlkZXIudmFycy5zZWxlY3RvciArICc6bm90KC5jbG9uZSknLCBzbGlkZXIpO1xuICAgICAgLy8gcmUtc2V0dXAgdGhlIHNsaWRlciB0byBhY2NvbWRhdGUgbmV3IHNsaWRlXG4gICAgICBzbGlkZXIuc2V0dXAoKTtcblxuICAgICAgLy9GbGV4U2xpZGVyOiBhZGRlZCgpIENhbGxiYWNrXG4gICAgICBzbGlkZXIudmFycy5hZGRlZChzbGlkZXIpO1xuICAgIH07XG4gICAgc2xpZGVyLnJlbW92ZVNsaWRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgcG9zID0gKGlzTmFOKG9iaikpID8gc2xpZGVyLnNsaWRlcy5pbmRleCgkKG9iaikpIDogb2JqO1xuXG4gICAgICAvLyB1cGRhdGUgY291bnRcbiAgICAgIHNsaWRlci5jb3VudCAtPSAxO1xuICAgICAgc2xpZGVyLmxhc3QgPSBzbGlkZXIuY291bnQgLSAxO1xuXG4gICAgICAvLyByZW1vdmUgc2xpZGVcbiAgICAgIGlmIChpc05hTihvYmopKSB7XG4gICAgICAgICQob2JqLCBzbGlkZXIuc2xpZGVzKS5yZW1vdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICh2ZXJ0aWNhbCAmJiByZXZlcnNlKSA/IHNsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmxhc3QpLnJlbW92ZSgpIDogc2xpZGVyLnNsaWRlcy5lcShvYmopLnJlbW92ZSgpO1xuICAgICAgfVxuXG4gICAgICAvLyB1cGRhdGUgY3VycmVudFNsaWRlLCBhbmltYXRpbmdUbywgY29udHJvbE5hdiwgYW5kIGRpcmVjdGlvbk5hdlxuICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuICAgICAgc2xpZGVyLnVwZGF0ZShwb3MsIFwicmVtb3ZlXCIpO1xuXG4gICAgICAvLyB1cGRhdGUgc2xpZGVyLnNsaWRlc1xuICAgICAgc2xpZGVyLnNsaWRlcyA9ICQoc2xpZGVyLnZhcnMuc2VsZWN0b3IgKyAnOm5vdCguY2xvbmUpJywgc2xpZGVyKTtcbiAgICAgIC8vIHJlLXNldHVwIHRoZSBzbGlkZXIgdG8gYWNjb21kYXRlIG5ldyBzbGlkZVxuICAgICAgc2xpZGVyLnNldHVwKCk7XG5cbiAgICAgIC8vIEZsZXhTbGlkZXI6IHJlbW92ZWQoKSBDYWxsYmFja1xuICAgICAgc2xpZGVyLnZhcnMucmVtb3ZlZChzbGlkZXIpO1xuICAgIH07XG5cbiAgICAvL0ZsZXhTbGlkZXI6IEluaXRpYWxpemVcbiAgICBtZXRob2RzLmluaXQoKTtcbiAgfTtcblxuICAvLyBFbnN1cmUgdGhlIHNsaWRlciBpc24ndCBmb2N1c3NlZCBpZiB0aGUgd2luZG93IGxvc2VzIGZvY3VzLlxuICAkKCB3aW5kb3cgKS5ibHVyKCBmdW5jdGlvbiAoIGUgKSB7XG4gICAgZm9jdXNlZCA9IGZhbHNlO1xuICB9KS5mb2N1cyggZnVuY3Rpb24gKCBlICkge1xuICAgIGZvY3VzZWQgPSB0cnVlO1xuICB9KTtcblxuICAvL0ZsZXhTbGlkZXI6IERlZmF1bHQgU2V0dGluZ3NcbiAgJC5mbGV4c2xpZGVyLmRlZmF1bHRzID0ge1xuICAgIG5hbWVzcGFjZTogXCJmbGV4LVwiLCAgICAgICAgICAgICAvL3tORVd9IFN0cmluZzogUHJlZml4IHN0cmluZyBhdHRhY2hlZCB0byB0aGUgY2xhc3Mgb2YgZXZlcnkgZWxlbWVudCBnZW5lcmF0ZWQgYnkgdGhlIHBsdWdpblxuICAgIHNlbGVjdG9yOiBcIi5zbGlkZXMgPiBsaVwiLCAgICAgICAvL3tORVd9IFNlbGVjdG9yOiBNdXN0IG1hdGNoIGEgc2ltcGxlIHBhdHRlcm4uICd7Y29udGFpbmVyfSA+IHtzbGlkZX0nIC0tIElnbm9yZSBwYXR0ZXJuIGF0IHlvdXIgb3duIHBlcmlsXG4gICAgYW5pbWF0aW9uOiBcImZhZGVcIiwgICAgICAgICAgICAgIC8vU3RyaW5nOiBTZWxlY3QgeW91ciBhbmltYXRpb24gdHlwZSwgXCJmYWRlXCIgb3IgXCJzbGlkZVwiXG4gICAgZWFzaW5nOiBcInN3aW5nXCIsICAgICAgICAgICAgICAgIC8ve05FV30gU3RyaW5nOiBEZXRlcm1pbmVzIHRoZSBlYXNpbmcgbWV0aG9kIHVzZWQgaW4galF1ZXJ5IHRyYW5zaXRpb25zLiBqUXVlcnkgZWFzaW5nIHBsdWdpbiBpcyBzdXBwb3J0ZWQhXG4gICAgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiwgICAgICAgIC8vU3RyaW5nOiBTZWxlY3QgdGhlIHNsaWRpbmcgZGlyZWN0aW9uLCBcImhvcml6b250YWxcIiBvciBcInZlcnRpY2FsXCJcbiAgICByZXZlcnNlOiBmYWxzZSwgICAgICAgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogUmV2ZXJzZSB0aGUgYW5pbWF0aW9uIGRpcmVjdGlvblxuICAgIGFuaW1hdGlvbkxvb3A6IHRydWUsICAgICAgICAgICAgLy9Cb29sZWFuOiBTaG91bGQgdGhlIGFuaW1hdGlvbiBsb29wPyBJZiBmYWxzZSwgZGlyZWN0aW9uTmF2IHdpbGwgcmVjZWl2ZWQgXCJkaXNhYmxlXCIgY2xhc3NlcyBhdCBlaXRoZXIgZW5kXG4gICAgc21vb3RoSGVpZ2h0OiBmYWxzZSwgICAgICAgICAgICAvL3tORVd9IEJvb2xlYW46IEFsbG93IGhlaWdodCBvZiB0aGUgc2xpZGVyIHRvIGFuaW1hdGUgc21vb3RobHkgaW4gaG9yaXpvbnRhbCBtb2RlXG4gICAgc3RhcnRBdDogMCwgICAgICAgICAgICAgICAgICAgICAvL0ludGVnZXI6IFRoZSBzbGlkZSB0aGF0IHRoZSBzbGlkZXIgc2hvdWxkIHN0YXJ0IG9uLiBBcnJheSBub3RhdGlvbiAoMCA9IGZpcnN0IHNsaWRlKVxuICAgIHNsaWRlc2hvdzogdHJ1ZSwgICAgICAgICAgICAgICAgLy9Cb29sZWFuOiBBbmltYXRlIHNsaWRlciBhdXRvbWF0aWNhbGx5XG4gICAgc2xpZGVzaG93U3BlZWQ6IDcwMDAsICAgICAgICAgICAvL0ludGVnZXI6IFNldCB0aGUgc3BlZWQgb2YgdGhlIHNsaWRlc2hvdyBjeWNsaW5nLCBpbiBtaWxsaXNlY29uZHNcbiAgICBhbmltYXRpb25TcGVlZDogNjAwLCAgICAgICAgICAgIC8vSW50ZWdlcjogU2V0IHRoZSBzcGVlZCBvZiBhbmltYXRpb25zLCBpbiBtaWxsaXNlY29uZHNcbiAgICBpbml0RGVsYXk6IDAsICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogU2V0IGFuIGluaXRpYWxpemF0aW9uIGRlbGF5LCBpbiBtaWxsaXNlY29uZHNcbiAgICByYW5kb21pemU6IGZhbHNlLCAgICAgICAgICAgICAgIC8vQm9vbGVhbjogUmFuZG9taXplIHNsaWRlIG9yZGVyXG4gICAgdGh1bWJDYXB0aW9uczogZmFsc2UsICAgICAgICAgICAvL0Jvb2xlYW46IFdoZXRoZXIgb3Igbm90IHRvIHB1dCBjYXB0aW9ucyBvbiB0aHVtYm5haWxzIHdoZW4gdXNpbmcgdGhlIFwidGh1bWJuYWlsc1wiIGNvbnRyb2xOYXYuXG5cbiAgICAvLyBVc2FiaWxpdHkgZmVhdHVyZXNcbiAgICBwYXVzZU9uQWN0aW9uOiB0cnVlLCAgICAgICAgICAgIC8vQm9vbGVhbjogUGF1c2UgdGhlIHNsaWRlc2hvdyB3aGVuIGludGVyYWN0aW5nIHdpdGggY29udHJvbCBlbGVtZW50cywgaGlnaGx5IHJlY29tbWVuZGVkLlxuICAgIHBhdXNlT25Ib3ZlcjogZmFsc2UsICAgICAgICAgICAgLy9Cb29sZWFuOiBQYXVzZSB0aGUgc2xpZGVzaG93IHdoZW4gaG92ZXJpbmcgb3ZlciBzbGlkZXIsIHRoZW4gcmVzdW1lIHdoZW4gbm8gbG9uZ2VyIGhvdmVyaW5nXG4gICAgcGF1c2VJbnZpc2libGU6IHRydWUsICAgXHRcdC8ve05FV30gQm9vbGVhbjogUGF1c2UgdGhlIHNsaWRlc2hvdyB3aGVuIHRhYiBpcyBpbnZpc2libGUsIHJlc3VtZSB3aGVuIHZpc2libGUuIFByb3ZpZGVzIGJldHRlciBVWCwgbG93ZXIgQ1BVIHVzYWdlLlxuICAgIHVzZUNTUzogdHJ1ZSwgICAgICAgICAgICAgICAgICAgLy97TkVXfSBCb29sZWFuOiBTbGlkZXIgd2lsbCB1c2UgQ1NTMyB0cmFuc2l0aW9ucyBpZiBhdmFpbGFibGVcbiAgICB0b3VjaDogdHJ1ZSwgICAgICAgICAgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogQWxsb3cgdG91Y2ggc3dpcGUgbmF2aWdhdGlvbiBvZiB0aGUgc2xpZGVyIG9uIHRvdWNoLWVuYWJsZWQgZGV2aWNlc1xuICAgIHZpZGVvOiBmYWxzZSwgICAgICAgICAgICAgICAgICAgLy97TkVXfSBCb29sZWFuOiBJZiB1c2luZyB2aWRlbyBpbiB0aGUgc2xpZGVyLCB3aWxsIHByZXZlbnQgQ1NTMyAzRCBUcmFuc2Zvcm1zIHRvIGF2b2lkIGdyYXBoaWNhbCBnbGl0Y2hlc1xuXG4gICAgLy8gUHJpbWFyeSBDb250cm9sc1xuICAgIGNvbnRyb2xOYXY6IHRydWUsICAgICAgICAgICAgICAgLy9Cb29sZWFuOiBDcmVhdGUgbmF2aWdhdGlvbiBmb3IgcGFnaW5nIGNvbnRyb2wgb2YgZWFjaCBjbGlkZT8gTm90ZTogTGVhdmUgdHJ1ZSBmb3IgbWFudWFsQ29udHJvbHMgdXNhZ2VcbiAgICBkaXJlY3Rpb25OYXY6IHRydWUsICAgICAgICAgICAgIC8vQm9vbGVhbjogQ3JlYXRlIG5hdmlnYXRpb24gZm9yIHByZXZpb3VzL25leHQgbmF2aWdhdGlvbj8gKHRydWUvZmFsc2UpXG4gICAgcHJldlRleHQ6IFwiUHJldmlvdXNcIiwgICAgICAgICAgIC8vU3RyaW5nOiBTZXQgdGhlIHRleHQgZm9yIHRoZSBcInByZXZpb3VzXCIgZGlyZWN0aW9uTmF2IGl0ZW1cbiAgICBuZXh0VGV4dDogXCJOZXh0XCIsICAgICAgICAgICAgICAgLy9TdHJpbmc6IFNldCB0aGUgdGV4dCBmb3IgdGhlIFwibmV4dFwiIGRpcmVjdGlvbk5hdiBpdGVtXG5cbiAgICAvLyBTZWNvbmRhcnkgTmF2aWdhdGlvblxuICAgIGtleWJvYXJkOiB0cnVlLCAgICAgICAgICAgICAgICAgLy9Cb29sZWFuOiBBbGxvdyBzbGlkZXIgbmF2aWdhdGluZyB2aWEga2V5Ym9hcmQgbGVmdC9yaWdodCBrZXlzXG4gICAgbXVsdGlwbGVLZXlib2FyZDogZmFsc2UsICAgICAgICAvL3tORVd9IEJvb2xlYW46IEFsbG93IGtleWJvYXJkIG5hdmlnYXRpb24gdG8gYWZmZWN0IG11bHRpcGxlIHNsaWRlcnMuIERlZmF1bHQgYmVoYXZpb3IgY3V0cyBvdXQga2V5Ym9hcmQgbmF2aWdhdGlvbiB3aXRoIG1vcmUgdGhhbiBvbmUgc2xpZGVyIHByZXNlbnQuXG4gICAgbW91c2V3aGVlbDogZmFsc2UsICAgICAgICAgICAgICAvL3tVUERBVEVEfSBCb29sZWFuOiBSZXF1aXJlcyBqcXVlcnkubW91c2V3aGVlbC5qcyAoaHR0cHM6Ly9naXRodWIuY29tL2JyYW5kb25hYXJvbi9qcXVlcnktbW91c2V3aGVlbCkgLSBBbGxvd3Mgc2xpZGVyIG5hdmlnYXRpbmcgdmlhIG1vdXNld2hlZWxcbiAgICBwYXVzZVBsYXk6IGZhbHNlLCAgICAgICAgICAgICAgIC8vQm9vbGVhbjogQ3JlYXRlIHBhdXNlL3BsYXkgZHluYW1pYyBlbGVtZW50XG4gICAgcGF1c2VUZXh0OiBcIlBhdXNlXCIsICAgICAgICAgICAgIC8vU3RyaW5nOiBTZXQgdGhlIHRleHQgZm9yIHRoZSBcInBhdXNlXCIgcGF1c2VQbGF5IGl0ZW1cbiAgICBwbGF5VGV4dDogXCJQbGF5XCIsICAgICAgICAgICAgICAgLy9TdHJpbmc6IFNldCB0aGUgdGV4dCBmb3IgdGhlIFwicGxheVwiIHBhdXNlUGxheSBpdGVtXG5cbiAgICAvLyBTcGVjaWFsIHByb3BlcnRpZXNcbiAgICBjb250cm9sc0NvbnRhaW5lcjogXCJcIiwgICAgICAgICAgLy97VVBEQVRFRH0galF1ZXJ5IE9iamVjdC9TZWxlY3RvcjogRGVjbGFyZSB3aGljaCBjb250YWluZXIgdGhlIG5hdmlnYXRpb24gZWxlbWVudHMgc2hvdWxkIGJlIGFwcGVuZGVkIHRvby4gRGVmYXVsdCBjb250YWluZXIgaXMgdGhlIEZsZXhTbGlkZXIgZWxlbWVudC4gRXhhbXBsZSB1c2Ugd291bGQgYmUgJChcIi5mbGV4c2xpZGVyLWNvbnRhaW5lclwiKS4gUHJvcGVydHkgaXMgaWdub3JlZCBpZiBnaXZlbiBlbGVtZW50IGlzIG5vdCBmb3VuZC5cbiAgICBtYW51YWxDb250cm9sczogXCJcIiwgICAgICAgICAgICAgLy97VVBEQVRFRH0galF1ZXJ5IE9iamVjdC9TZWxlY3RvcjogRGVjbGFyZSBjdXN0b20gY29udHJvbCBuYXZpZ2F0aW9uLiBFeGFtcGxlcyB3b3VsZCBiZSAkKFwiLmZsZXgtY29udHJvbC1uYXYgbGlcIikgb3IgXCIjdGFicy1uYXYgbGkgaW1nXCIsIGV0Yy4gVGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiB5b3VyIGNvbnRyb2xOYXYgc2hvdWxkIG1hdGNoIHRoZSBudW1iZXIgb2Ygc2xpZGVzL3RhYnMuXG4gICAgc3luYzogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgIC8ve05FV30gU2VsZWN0b3I6IE1pcnJvciB0aGUgYWN0aW9ucyBwZXJmb3JtZWQgb24gdGhpcyBzbGlkZXIgd2l0aCBhbm90aGVyIHNsaWRlci4gVXNlIHdpdGggY2FyZS5cbiAgICBhc05hdkZvcjogXCJcIiwgICAgICAgICAgICAgICAgICAgLy97TkVXfSBTZWxlY3RvcjogSW50ZXJuYWwgcHJvcGVydHkgZXhwb3NlZCBmb3IgdHVybmluZyB0aGUgc2xpZGVyIGludG8gYSB0aHVtYm5haWwgbmF2aWdhdGlvbiBmb3IgYW5vdGhlciBzbGlkZXJcblxuICAgIC8vIENhcm91c2VsIE9wdGlvbnNcbiAgICBpdGVtV2lkdGg6IDAsICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogQm94LW1vZGVsIHdpZHRoIG9mIGluZGl2aWR1YWwgY2Fyb3VzZWwgaXRlbXMsIGluY2x1ZGluZyBob3Jpem9udGFsIGJvcmRlcnMgYW5kIHBhZGRpbmcuXG4gICAgaXRlbU1hcmdpbjogMCwgICAgICAgICAgICAgICAgICAvL3tORVd9IEludGVnZXI6IE1hcmdpbiBiZXR3ZWVuIGNhcm91c2VsIGl0ZW1zLlxuICAgIG1pbkl0ZW1zOiAxLCAgICAgICAgICAgICAgICAgICAgLy97TkVXfSBJbnRlZ2VyOiBNaW5pbXVtIG51bWJlciBvZiBjYXJvdXNlbCBpdGVtcyB0aGF0IHNob3VsZCBiZSB2aXNpYmxlLiBJdGVtcyB3aWxsIHJlc2l6ZSBmbHVpZGx5IHdoZW4gYmVsb3cgdGhpcy5cbiAgICBtYXhJdGVtczogMCwgICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogTWF4bWltdW0gbnVtYmVyIG9mIGNhcm91c2VsIGl0ZW1zIHRoYXQgc2hvdWxkIGJlIHZpc2libGUuIEl0ZW1zIHdpbGwgcmVzaXplIGZsdWlkbHkgd2hlbiBhYm92ZSB0aGlzIGxpbWl0LlxuICAgIG1vdmU6IDAsICAgICAgICAgICAgICAgICAgICAgICAgLy97TkVXfSBJbnRlZ2VyOiBOdW1iZXIgb2YgY2Fyb3VzZWwgaXRlbXMgdGhhdCBzaG91bGQgbW92ZSBvbiBhbmltYXRpb24uIElmIDAsIHNsaWRlciB3aWxsIG1vdmUgYWxsIHZpc2libGUgaXRlbXMuXG4gICAgYWxsb3dPbmVTbGlkZTogdHJ1ZSwgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogV2hldGhlciBvciBub3QgdG8gYWxsb3cgYSBzbGlkZXIgY29tcHJpc2VkIG9mIGEgc2luZ2xlIHNsaWRlXG5cbiAgICAvLyBDYWxsYmFjayBBUElcbiAgICBzdGFydDogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgIC8vQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyB3aGVuIHRoZSBzbGlkZXIgbG9hZHMgdGhlIGZpcnN0IHNsaWRlXG4gICAgYmVmb3JlOiBmdW5jdGlvbigpe30sICAgICAgICAgICAvL0NhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgYXN5bmNocm9ub3VzbHkgd2l0aCBlYWNoIHNsaWRlciBhbmltYXRpb25cbiAgICBhZnRlcjogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgIC8vQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyBhZnRlciBlYWNoIHNsaWRlciBhbmltYXRpb24gY29tcGxldGVzXG4gICAgZW5kOiBmdW5jdGlvbigpe30sICAgICAgICAgICAgICAvL0NhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgd2hlbiB0aGUgc2xpZGVyIHJlYWNoZXMgdGhlIGxhc3Qgc2xpZGUgKGFzeW5jaHJvbm91cylcbiAgICBhZGRlZDogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgIC8ve05FV30gQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyBhZnRlciBhIHNsaWRlIGlzIGFkZGVkXG4gICAgcmVtb3ZlZDogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgLy97TkVXfSBDYWxsYmFjazogZnVuY3Rpb24oc2xpZGVyKSAtIEZpcmVzIGFmdGVyIGEgc2xpZGUgaXMgcmVtb3ZlZFxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge30gICAgICAgICAgICAgLy97TkVXfSBDYWxsYmFjazogZnVuY3Rpb24oc2xpZGVyKSAtIEZpcmVzIGFmdGVyIHRoZSBzbGlkZXIgaXMgaW5pdGlhbGx5IHNldHVwXG4gIH07XG5cbiAgLy9GbGV4U2xpZGVyOiBQbHVnaW4gRnVuY3Rpb25cbiAgJC5mbi5mbGV4c2xpZGVyID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zID09PSB1bmRlZmluZWQpIG9wdGlvbnMgPSB7fTtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHNlbGVjdG9yID0gKG9wdGlvbnMuc2VsZWN0b3IpID8gb3B0aW9ucy5zZWxlY3RvciA6IFwiLnNsaWRlcyA+IGxpXCIsXG4gICAgICAgICAgICAkc2xpZGVzID0gJHRoaXMuZmluZChzZWxlY3Rvcik7XG5cbiAgICAgIGlmICggKCAkc2xpZGVzLmxlbmd0aCA9PT0gMSAmJiBvcHRpb25zLmFsbG93T25lU2xpZGUgPT09IHRydWUgKSB8fCAkc2xpZGVzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAkc2xpZGVzLmZhZGVJbig0MDApO1xuICAgICAgICAgIGlmIChvcHRpb25zLnN0YXJ0KSBvcHRpb25zLnN0YXJ0KCR0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmICgkdGhpcy5kYXRhKCdmbGV4c2xpZGVyJykgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG5ldyAkLmZsZXhzbGlkZXIodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBIZWxwZXIgc3RyaW5ncyB0byBxdWlja2x5IHBlcmZvcm0gZnVuY3Rpb25zIG9uIHRoZSBzbGlkZXJcbiAgICAgIHZhciAkc2xpZGVyID0gJCh0aGlzKS5kYXRhKCdmbGV4c2xpZGVyJyk7XG4gICAgICBzd2l0Y2ggKG9wdGlvbnMpIHtcbiAgICAgICAgY2FzZSBcInBsYXlcIjogJHNsaWRlci5wbGF5KCk7IGJyZWFrO1xuICAgICAgICBjYXNlIFwicGF1c2VcIjogJHNsaWRlci5wYXVzZSgpOyBicmVhaztcbiAgICAgICAgY2FzZSBcInN0b3BcIjogJHNsaWRlci5zdG9wKCk7IGJyZWFrO1xuICAgICAgICBjYXNlIFwibmV4dFwiOiAkc2xpZGVyLmZsZXhBbmltYXRlKCRzbGlkZXIuZ2V0VGFyZ2V0KFwibmV4dFwiKSwgdHJ1ZSk7IGJyZWFrO1xuICAgICAgICBjYXNlIFwicHJldlwiOlxuICAgICAgICBjYXNlIFwicHJldmlvdXNcIjogJHNsaWRlci5mbGV4QW5pbWF0ZSgkc2xpZGVyLmdldFRhcmdldChcInByZXZcIiksIHRydWUpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDogaWYgKHR5cGVvZiBvcHRpb25zID09PSBcIm51bWJlclwiKSAkc2xpZGVyLmZsZXhBbmltYXRlKG9wdGlvbnMsIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0pKGpRdWVyeSk7XG4iLCIvLyBTZWxlY3Qtd3JhcHBlciBmb3Igc2VsZWN0IGVsZW1lbnRzXG5cbmpRdWVyeShkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgalF1ZXJ5KFwic2VsZWN0XCIpLndyYXAoXCI8ZGl2IGNsYXNzPSdzZWxlY3Qtd3JhcHBlcic+PC9kaXY+XCIpO1xuICAgIGpRdWVyeShcInNlbGVjdFwiKS5hZnRlcihcIjxpIGNsYXNzPSdmYSBmYS1hbmdsZS1kb3duJz48L2k+XCIpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=