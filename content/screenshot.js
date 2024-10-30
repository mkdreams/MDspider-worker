var doc,
  html,
  docW,
  docH,
  initScrollTop,
  initScrollLeft,
  clientH,
  clientW,
  wrapper,
  dragresize,
  isContentScriptLoaded = !0,
  scrollBar = {},
  counter = 1,
  entireScrollNumber = 0,
  scrollBarWidth = 0,
  bodyCssText = '',
  entireCaptureStyleChange = [],
  entireStopped = false,
  menu = {
    visible: { enable: 'false', key: 'V' },
    selected: { enable: 'false', key: 'S' },
    entire: { enable: 'false', key: 'E' }
  },
  fixedElements = [],
  wrapperHTML =
    '<div id="mdspider_screenshot_wrapper"><div id="mdspider_screenshot_top"></div><div id="mdspider_screenshot_right"></div><div id="mdspider_screenshot_bottom"></div><div id="mdspider_screenshot_left"></div><div id="mdspider_screenshot_center" class="drsElement drsMoveHandle"><div id="mdspider_screenshot_size" style="min-width:70px;"><span>0 X 0</span></div><div id="mdspider_screenshot_action"><a id="mdspider_screenshot_cancel"><span id="mdspider_screenshot_cancel_icon"></span>Cancel</a><a id="mdspider_screenshot_capture"><span id="mdspider_screenshot_capture_icon"></span>Capture</a></div></div></div>',
  isSelected = !1,
  hostname = document.location.hostname,
  delayInterval = null
function hasClass(e, t) {
  return e.className.match(new RegExp('(\\s|^)' + t + '(\\s|$)'))
}
function addClass(e, t) {
  hasClass(e, t) || (e.className += ' ' + t)
}
function removeClass(e, t) {
  if (hasClass(e, t)) {
    var n = new RegExp('(\\s|^)' + t + '(\\s|$)')
    e.className = e.className.replace(n, ' ')
  }
}
function fixPosition(e) {
  switch (e) {
    case 'www.facebook.com':
      removeClass($('#pagelet_bluebar').find('[role=banner]')[0], '_50ti')
      break
    case 'pinterest.com':
      var t = document.getElementById('CategoriesBar'),
        n = document.getElementsByClassName('Nag')
      0 != n.length &&
        n[0].style.setProperty('position', 'absolute', 'important'),
        t.style.setProperty('position', 'absolute', 'important')
  }
}
function restorePosition(e) {
  switch (e) {
    case 'www.facebook.com':
      addClass($('#pagelet_bluebar').find('[role=banner]')[0], '_50ti')
      break
    case 'pinterest.com':
      var t = document.getElementById('CategoriesBar'),
        n = document.getElementsByClassName('Nag')
      0 != n.length && (n[0].style.position = ''), (t.style.position = '')
  }
}
function addCss(e, t) {
  var n = document.head,
    o = document.createElement('style')
  o.setAttribute('type', 'text/css'),
    o.setAttribute('id', e),
    o.appendChild(document.createTextNode(t)),
    n.appendChild(o)
}
function removeCss(e) {
  document.getElementById(e) && document.getElementById(e).remove()
}
function prepareBodyForEntireCapture() {
  entireCaptureStyleChange.push(
    new StyleChange('addStyle', {
      id: 'aws-entire-capture',
      css: 'html::-webkit-scroll-bar,body::-webkit-scrollbar{width: 0 !important; height: 0 !important}'
    })
  )
  var e = { position: 'relative' }
  'scroll' === window.getComputedStyle(document.body).overflowY &&
    (e.overflowY = 'visible'),
    entireCaptureStyleChange.push(
      new StyleChange('changeCssText', {
        element: document.documentElement,
        cssObj: { scrollBehavior: 'auto' }
      })
    ),
    (/coursera.org/.test(window.location.host) &&
      0 < $('.rc-QuizAttemptHeader').length &&
      0 <
      $('.rc-QuizAttemptHeader').parents('.c-open-single-page-attempt')
        .length) ||
    /www.frozenright.com/.test(window.location.host) ||
    entireCaptureStyleChange.push(
      new StyleChange('changeCssText', { element: document.body, cssObj: e })
    )
}
function restoreStyleForEntireCapture() {
  removeCss('aws-entire-capture'),
    entireCaptureStyleChange.forEach(function (e) {
      e.undo()
    }),
    (entireCaptureStyleChange = [])
}
function objTocssText(e) {
  var t = ''
  for (var n in e) {
    t +=
      n.replace(/([a-zA-Z](?=[A-Z]))/g, '$1-').toLowerCase() +
      ':' +
      e[n] +
      ' !important;'
  }
  return t
}
function StyleChange(e, t) {
  ; (this.type = e), (this.data = t), this.exec()
}
function findScrollElement() {
  var e = []
  if (
    document.scrollingElement.scrollHeight >
    document.scrollingElement.offsetHeight + 5
  )
    return document.scrollingElement
  for (
    var t,
    n = document.createNodeIterator(
      document.scrollingElement,
      NodeFilter.SHOW_ELEMENT,
      null,
      !1
    );
    (t = n.nextNode());

  )
    if (
      t.scrollHeight > t.offsetHeight + 5 &&
      50 < t.offsetHeight &&
      0 < t.scrollHeight &&
      40 < t.offsetWidth
    ) {
      var o = window.getComputedStyle(t).overflowY
      'hidden' !== o && 'visible' !== o && e.push(t)
    }
}
function handleAbsoluteHangings() {
  if (
    !/www.rest-ar.com/.test(window.location.href) &&
    !/mail.google.com/.test(window.location.href)
  ) {
    for (
      var o,
      n = [],
      e = document.createNodeIterator(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null,
        !1
      );
      (o = e.nextNode());

    ) {
      var t = window.getComputedStyle(o)
      if (!t) return
      if ('none' !== t.display && '' !== o.innerHTML) {
        var i = t.getPropertyValue('position')
        if (
          ('scroll' === t.overflowY &&
            parseInt(t.width) > 0.5 * window.innerWidth &&
            (o.scrollHeight > o.offsetHeight + 10 ||
              o.offsetHeight >= window.innerHeight) &&
            entireCaptureStyleChange.push(
              new StyleChange('changeCssText', {
                element: o,
                cssObj: { overflow: 'visible' }
              })
            ),
            !/mail.google.com/.test(window.location.host) && 'absolute' === i)
        ) {
          var s = o.nodeName.toLowerCase()
          'iframe' !== s &&
            'img' !== s &&
            'figure' !== s &&
            200 < parseInt(t.height) &&
            parseInt(t.width) > 0.5 * window.innerWidth &&
            (o.scrollHeight > o.offsetHeight + 10 ||
              o.offsetHeight >= window.innerHeight) &&
            o.offsetHeight > $(o).parent().height() &&
            (n.push({ element: o, style: t }),
              $(o)
                .parents()
                .each(function (e, t) {
                  'iframe' !== o.nodeName &&
                    'img' !== o.nodeName &&
                    'figure' !== s &&
                    'absolute' === window.getComputedStyle(t).position &&
                    n.push({ element: t, style: window.getComputedStyle(t) })
                }))
        }
        var l = o.getBoundingClientRect()
        l.width > 0.75 * window.innerWidth &&
          l.height > 0.75 * window.innerHeight &&
          ['::before', '::after'].forEach(function (e) {
            if ('fixed' === window.getComputedStyle(o, e).postion) {
              var t = o.id
                ? o.id
                : 'aws-entire-capture-' +
                Math.random().toString(36).substring(2, 15)
              entireCaptureStyleChange.push(
                new StyleChange('changeAttr', {
                  element: o,
                  attrName: 'id',
                  attrValue: t
                })
              )
              var n = '#' + window.CSS.escape(t) + e + ' {position: absolute;}'
              entireCaptureStyleChange.push(
                new StyleChange('addStyle', { id: 'fix-pseudos', css: n })
              )
            }
          })
      }
    }
    var r = document.body.getBoundingClientRect()
    r.left, window.scrollX, r.top, window.scrollY
    if (0 < n.length) {
      var a =
        'html{' +
        objTocssText({ overflow: 'visible', overflowY: 'visible' }) +
        '}body{' +
        objTocssText({ overflow: 'visible', overflowY: 'visible' }) +
        '}'
      entireCaptureStyleChange.push(
        new StyleChange('addStyle', { id: 'handing-abs-body', css: a })
      )
    }
    n.forEach(function (e) {
      var t = e.style.width,
        n = Math.max(e.element.scrollHeight, parseInt(e.style.height)) + 'px',
        o =
          (parseFloat(e.style.left),
            parseFloat(e.style.top),
            { position: 'relative', width: t, height: n, overflow: 'visible' })
      entireCaptureStyleChange.push(
        new StyleChange('changeCssText', { element: e.element, cssObj: o })
      )
    })
  }
}
function disableTransitions() {
  entireCaptureStyleChange.push(
    new StyleChange('addStyle', {
      id: 'disable-transition',
      css: '*{transition: none !important; transition-delay: 0s !important; animation-duration: 0s !important; animation-delay: 0s !important;}'
    })
  )
}
function specialSitesHacks() {
  ; /quora.com/.test(window.location.host)
    ? entireCaptureStyleChange.push(
      new StyleChange('addStyle', {
        id: 'quara-fix',
        css: '.Answer.ActionBar.sticky { position: static !important }'
      })
    )
    : /mail.google.com/.test(window.location.host)
      ? (entireCaptureStyleChange.push(
        new StyleChange('changeCssText', {
          element: document.documentElement,
          cssObj: { overflowY: 'visible', height: 'auto' }
        })
      ),
        entireCaptureStyleChange.push(
          new StyleChange('changeCssText', {
            element: document.body,
            cssObj: { overflowY: 'visible', height: 'auto' }
          })
        ),
        entireCaptureStyleChange.push(
          new StyleChange('changeCssText', {
            element: document.getElementById(':3'),
            cssObj: { overflowY: 'visible', height: 'auto' }
          })
        ))
      : /arosalenzerheide.ltibooking.com/.test(window.location.host)
        ? entireCaptureStyleChange.push(
          new StyleChange('changeCssText', {
            element: document.getElementsByClassName('cloudstore-top-bar')[0],
            cssObj: {
              top:
                '-' +
                window.getComputedStyle(
                  document.getElementsByClassName('cloudstore-top-bar')[0]
                ).height
            }
          })
        )
        : /www.rest-ar.com/.test(window.location.host)
          ? entireCaptureStyleChange.push(
            new StyleChange('changeCssText', {
              element: document.getElementById('app'),
              cssObj: { height: document.getElementById('app').scrollHeight + 'px' }
            })
          )
          : /designincubation.com/.test(window.location.href) &&
          entireCaptureStyleChange.push(
            new StyleChange('addStyle', {
              id: 'body-change',
              css: 'body:before, body:after {display:none !important;}'
            })
          ),
    entireCaptureStyleChange.push(
      new StyleChange('addStyle', {
        id: 'adwords-sticky',
        css: '[stickyclass="sticky"], ess-particle-table [role="row"], [acxscrollhost] .header-sticky-container  { transform: translate(0px, 0px) !important }'
      })
    )
}

function initEntireCapture() {
  prepareBodyForEntireCapture(),
    handleAbsoluteHangings(),
    disableTransitions(),
    specialSitesHacks(),
    fixPosition(hostname),
    restoreFixedElements(),
    (counter = 1),
    getDocumentNode(),
    (html = doc.documentElement),
    (initScrollTop = document.scrollingElement.scrollTop),
    (initScrollLeft = document.scrollingElement.scrollLeft),
    (clientH = getClientH()),
    (clientW = html.clientWidth),
    (document.scrollingElement.scrollTop = 0),
    (document.scrollingElement.scrollLeft = 0),
    checkScrollBar(),
    window.onresize = checkScrollBar
}

function restorEntireCapture() {
  restorePosition(hostname);
  restoreFixedElements();
  restoreStyleForEntireCapture();
  var o = document.getElementById('searchbar');
  null != o && ((o.style.display = 'block'), (document.body.id = 'searchbarshow'));
}

function initSelectedCapture() {
  var e = document.getElementById('searchbar')
  null !== e &&
    e.classList.contains('searchbar') &&
    ((e.style.display = 'none'), (document.body.id = ''))
  if (
    (getDocumentNode(),
      getDocumentDimension(),
      !document.getElementById('mdspider_screenshot_wrapper'))
  ) {
    var t = document.createElement('div')
    document.body.appendChild(t), (t.innerHTML += wrapperHTML)
  }
  ; (wrapper = document.getElementById('mdspider_screenshot_wrapper')),
    updateWrapper(),
    window.addEventListener('resize', windowResize, !1),
    document.body.addEventListener('keydown', selectedKeyDown, !1),
    wrapper.addEventListener('mousedown', wrapperMouseDown, !1)
}
function wrapperMouseDown(e) {
  if (0 == e.button) {
    var n,
      t,
      o = e.pageX,
      i = e.pageY,
      s = document.getElementById('mdspider_screenshot_size'),
      l = document.getElementById('mdspider_screenshot_action')
    function r(e) {
      setStyle(wrapper, 'background-color', 'rgba(0,0,0,0)'),
        (t = e.pageX - o),
        (n = e.pageY - i),
        (s.children[0].innerHTML = Math.abs(t) + ' X ' + Math.abs(n)),
        updateCorners(o, i, t, n),
        updateCenter(o, i, t, n),
        autoScroll(e)
    }
    wrapper.addEventListener('mousemove', r, !1),
      wrapper.addEventListener(
        'mouseup',
        function e(t) {
          ; (t.pageX - o != 0 && t.pageY - i != 0) ||
            0 != $('#mdspider_screenshot_center').width() ||
            (setStyle(wrapper, 'background-color', 'rgba(0,0,0,0)'),
              (s.children[0].innerHTML = Math.abs(200) + ' X ' + Math.abs(200)),
              updateCorners(o - 100, i - 100, 200, 200),
              updateCenter(o - 100, i - 100, 200, 200))
          wrapper.removeEventListener('mousedown', wrapperMouseDown, !1)
          wrapper.removeEventListener('mousemove', r, !1)
          wrapper.removeEventListener('mouseup', e, !1)
          setStyle(
            document.getElementById('mdspider_screenshot_action'),
            'display',
            'block'
          )
          i + n >
            document.documentElement.scrollTop +
            document.documentElement.clientHeight -
            46
            ? setStyle(l, 'bottom', '5px')
            : setStyle(l, 'bottom', '-46px')
          setStyle(s, 'display', 'block')
          bindCenter()
        },
        !1
      )
  }
}
function selectedKeyDown(e) {
  27 == e.keyCode && removeSelected()
}
function windowResize(e) {
  updateWrapper(), getDocumentDimension()
  var t = document.getElementById('mdspider_screenshot_center'),
    n = getStyle(t, 'width'),
    o = getStyle(t, 'height')
  n * o && updateCorners(getStyle(t, 'left'), getStyle(t, 'top'), n, o)
    ; (dragresize.maxLeft = docW), (dragresize.maxTop = docH)
}
function bindCenter() {
  var r = document.getElementById('mdspider_screenshot_center')
  dragresize = new DragResize('dragresize', { maxLeft: docW, maxTop: docH })
  var l = document.getElementById('mdspider_screenshot_size'),
    a = document.getElementById('mdspider_screenshot_action')
  function t() {
    var e = document.getElementById('mdspider_screenshot_size')
      ; (scrollBarWidth = (function () {
        var e = document.createElement('p')
          ; (e.style.width = '100%'), (e.style.height = '200px')
        var t = document.createElement('div')
          ; (t.style.position = 'absolute'),
            (t.style.top = '0px'),
            (t.style.left = '0px'),
            (t.style.visibility = 'hidden'),
            (t.style.width = '200px'),
            (t.style.height = '150px'),
            (t.style.overflow = 'hidden'),
            t.appendChild(e),
            document.body.appendChild(t)
        var n = e.offsetWidth
        t.style.overflow = 'scroll'
        var o = e.offsetWidth
        return n == o && (o = t.clientWidth), document.body.removeChild(t), n - o
      })()),
        setStyle(e, 'display', 'none'),
        fixPosition(hostname),
        dragresize.deselect(r),
        setStyle(r, 'outline', 'none'),
        enableFixedPosition(!1),
        entireCaptureStyleChange.push(
          new StyleChange('changeCssText', {
            element: document.scrollingElement,
            cssObj: { overflowX: 'hidden' }
          })
        ),
        (counter = 1),
        (html = document.documentElement),
        (initScrollTop = document.scrollingElement.scrollTop),
        (initScrollLeft = document.scrollingElement.scrollLeft),
        (clientH = getClientH()),
        (clientW = html.clientWidth),
        (isSelected = !0)
    var t = dragresize.elmX,
      n = dragresize.elmY,
      o = dragresize.elmW,
      i = dragresize.elmH,
      s = t - document.scrollingElement.scrollLeft,
      l = n - document.scrollingElement.scrollTop
    if (
      (n < initScrollTop &&
        (s <= 0
          ? (document.scrollingElement.scrollLeft = t)
          : ((wrapper.style.paddingRight = s + 'px'),
            (document.scrollingElement.scrollLeft += s)),
          l <= 0
            ? (document.scrollingElement.scrollTop = n)
            : ((wrapper.style.paddingTop = l + 'px'),
              (document.scrollingElement.scrollTop += l))),
        getDocumentDimension(),
        updateCorners(t, n, o, i),
        restorePosition(hostname),
        restoreFixedElements(),
        n < initScrollTop)
    ) {
      if (o <= clientW && i <= clientH)
        return void setTimeout(sendMessage, 300, {
          action: 'visible',
          counter: counter,
          ratio: (i % clientH) / clientH,
          scrollBar: { x: !1, y: !1 },
          centerW: o * window.devicePixelRatio,
          centerH: i * window.devicePixelRatio,
          menuType: 'selected'
        })
      setTimeout(sendMessage, 300, { action: 'scroll_next_done' })
    } else
      removeSelected(),
        setTimeout(function () {
          sendMessage({
            action: 'capture_selected_done',
            data: {
              x: s * window.devicePixelRatio,
              y: l * window.devicePixelRatio,
              w: o * window.devicePixelRatio,
              h: i * window.devicePixelRatio
            }
          })
        }, 100)
  }
  ; (dragresize.isElement = function (e) {
    if (e.className && -1 < e.className.indexOf('drsElement')) return !0
  }),
    (dragresize.isHandle = function (e) {
      if (e.className && -1 < e.className.indexOf('drsMoveHandle')) return !0
    }),
    (dragresize.ondragmove = function (e, t) {
      var n = dragresize.elmX,
        o = dragresize.elmY,
        i = dragresize.elmW,
        s = dragresize.elmH
        ; (l.children[0].innerHTML = Math.abs(i) + ' X ' + Math.abs(s)),
          setStyle(l, 'top', o < 30 ? '5px' : '-30px'),
          setStyle(a, 'right', i < 190 ? -(270 - i) / 2 + 'px' : '0px'),
          o + s >
            document.documentElement.scrollTop +
            document.documentElement.clientHeight -
            46
            ? setStyle(a, 'bottom', '5px')
            : setStyle(a, 'bottom', '-46px'),
          updateCorners(n, o, i, s),
          updateCenter(n, o, i, s),
          autoScroll(t)
    }),
    dragresize.apply(wrapper),
    dragresize.select(r),
    document.getElementById('mdspider_screenshot_action').addEventListener(
      'click',
      function (e) {
        switch (e.target.id) {
          case 'mdspider_screenshot_capture':
          case 'mdspider_screenshot_capture_icon':
            t()
            break
          case 'mdspider_screenshot_cancel':
          case 'mdspider_screenshot_cancel_icon':
            removeSelected()
        }
      },
      !1
    )
}
function removeSelected() {
  window.removeEventListener('resize', windowResize),
    document.body.removeEventListener('keydown', selectedKeyDown, !1),
    wrapper.parentNode && wrapper.parentNode.removeChild(wrapper),
    (isSelected = !1)
}
function autoScroll(e) {
  var t = e.clientY,
    n = e.clientX,
    o = window.innerHeight - t,
    i = window.innerWidth - n
  t < 20 && (document.scrollingElement.scrollTop -= 25),
    n < 40 && (document.scrollingElement.scrollLeft -= 25),
    o < 40 && (document.scrollingElement.scrollTop += 60 - o),
    i < 40 && (document.scrollingElement.scrollLeft += 60 - i)
}
function updateCorners(e, t, n, o) {
  var i = 0 <= n ? e + n : e,
    s = 0 <= o ? t : t + o,
    l = 0 <= n ? docW - e - n : docW - e,
    r = 0 <= o ? t + o : t,
    a = 0 <= n ? docW - e : docW - e - n,
    c = docH - r,
    d = docW - a,
    m = docH - s,
    u = document.getElementById('mdspider_screenshot_top'),
    p = document.getElementById('mdspider_screenshot_right'),
    h = document.getElementById('mdspider_screenshot_bottom'),
    g = document.getElementById('mdspider_screenshot_left')
  setStyle(u, 'width', i + 'px'),
    setStyle(u, 'height', s + 'px'),
    setStyle(p, 'width', l + 'px'),
    setStyle(p, 'height', r + 'px'),
    setStyle(h, 'width', a + 'px'),
    setStyle(h, 'height', c + 'px'),
    setStyle(g, 'width', d + 'px'),
    setStyle(g, 'height', m + 'px')
}
function updateCenter(e, t, n, o) {
  var i = 0 <= n ? e : e + n,
    s = 0 <= o ? t : t + o,
    l = document.getElementById('mdspider_screenshot_center')
  setStyle(l, 'width', Math.abs(n) + 'px'),
    setStyle(l, 'height', Math.abs(o) + 'px'),
    setStyle(l, 'top', s + 'px'),
    setStyle(l, 'left', i + 'px')
}
function updateWrapper() {
  setStyle(wrapper, 'display', 'none'),
    setStyle(wrapper, 'width', document.scrollingElement.scrollWidth + 'px'),
    setStyle(wrapper, 'height', document.scrollingElement.scrollHeight + 'px'),
    setStyle(wrapper, 'display', 'block')
}
function setStyle(e, t, n) {
  e.style.setProperty(t, n)
}
function getStyle(e, t) {
  return parseInt(e.style.getPropertyValue(t))
}

async function fullPageScreenShot() {
  var tempDom = document.createElement('canvas');
  var tempCanvas = tempDom.getContext('2d');
  initEntireCapture();
  
  var imgs = [];
  await new Promise(function(resolve,reject) {
    setTimeout(()=>{
      chrome.runtime.sendMessage({"type":2,"params":{"action":"screenshot"}},(r)=>{
        var image = new Image();
        image.src = r;
        image.onload = function(){
          imgs.push(image);
          resolve(true);
          enableFixedPosition(false);
        }
      })
    },500);
  });

  while(true) {
    scrollInfo = scrollNext();

    if(scrollInfo !== true) {
      break;
    }
    
    await new Promise(function(resolve,reject) {
      setTimeout(()=>{
        enableFixedPosition(false);
        setTimeout(()=>{
          chrome.runtime.sendMessage({"type":2,"params":{"action":"screenshot"}},(r)=>{
            var image = new Image();
            image.src = r;
            image.onload = function(){
              imgs.push(image);
              resolve(true);
            }
          })
        },350);
      },150);
    });
  }

  //merge imgs
  var widthTemp = 0;
  var heightTemp = 0;
  for(var i=0;i<imgs.length;i++) {
    if(imgs[i].width>widthTemp) {
      widthTemp = imgs[i].width;
    }

    heightTemp += imgs[i].height;
  }

  tempDom.width = widthTemp;
  tempDom.height = (imgs.length-1+scrollInfo.ratio.y)*scrollInfo.clientH;

  var sumDy = 0;
  for(var i=0;i<imgs.length;i++) {
    var sx = 0;
    if(i === imgs.length-1) {
      var sy = (1-scrollInfo.ratio.y)*scrollInfo.clientH;
      var sw = imgs[i].width;
      var sh = scrollInfo.ratio.y*scrollInfo.clientH;
    }else{
      var sy = 0;
      var sw = imgs[i].width;
      var sh = imgs[i].height;
    }

    var dx = 0;
    var dy = sumDy;
    var dw = sw;
    var dh = sh;

    tempCanvas.drawImage(imgs[i], sx, sy, sw, sh, dx, dy, dw, dh);

    sumDy += sh;
  }

  return tempDom.toDataURL('png')
}

function scrollNext() {
  var top = Math.ceil(document.scrollingElement.scrollTop);
  left = Math.ceil(document.scrollingElement.scrollLeft);

  document.scrollingElement.scrollTop = top + clientH;

  if (Math.ceil(document.scrollingElement.scrollTop) == top) {
    left = document.scrollingElement.scrollLeft;
    document.scrollingElement.scrollLeft = left + clientW;
    if (scrollBar.x && document.scrollingElement.scrollLeft != left) {
      counter++;
      document.scrollingElement.scrollTop = 0;
      
      return true;
    }

    var r = {};
    r.y = (top % clientH) / clientH;
    r.x = (left % clientW) / clientW;
    document.scrollingElement.scrollTop = initScrollTop;
    document.scrollingElement.scrollLeft = initScrollLeft;

    return {
      ratio: entireStopped ? { x: 1, y: 1 } : r,
      clientH: clientH,
    };
  }

  return true;
}
function sendMessage(e, t) {
  chrome.runtime.sendMessage({'type':2,"params":e}, t)
}
function bindShortcuts(e) {
  var t = document.body
  if (
    (t.removeEventListener('keydown', keydownHandler, !1),
      t.addEventListener('keydown', keydownHandler, !1),
      (msObj = e.msObj))
  )
    for (var n in ((msObj = JSON.parse(msObj)), msObj))
      (menu[n].enable = msObj[n].enable), (menu[n].key = msObj[n].key)
}
function keydownHandler(e) {
  switch (String.fromCharCode(e.which)) {
    case menu.visible.key:
      1 == menu.visible.enable &&
        e.shiftKey &&
        e.ctrlKey &&
        sendMessage({ action: 'visible' })
      break
    case menu.selected.key:
      1 == menu.selected.enable &&
        e.shiftKey &&
        e.ctrlKey &&
        sendMessage({ action: 'selected' })
      break
    case menu.entire.key:
      1 == menu.entire.enable &&
        e.shiftKey &&
        e.ctrlKey &&
        sendMessage({ action: 'entire' })
  }
}
// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// http://code.google.com/p/chrome-screen-capture/
function enableFixedPosition(e) {
  if (e)
    for (var t = 0, n = fixedElements.length; t < n; ++t) {
      var o = fixedElements[t]
      o.element.style.cssText = o.cssText
    }
  else
    for (
      var i,
      s = document.createNodeIterator(
        document.documentElement,
        NodeFilter.SHOW_ELEMENT,
        null,
        !1
      );
      (i = s.nextNode());

    ) {
      var l = document.defaultView.getComputedStyle(i, '')
      if (!l) return
      if (
        !(
          /www.facebook.com/.test(window.location.host) &&
          (/u_fetchstream_/.test(i.id) || /u_0_1/.test(i.id)) &&
          0 < $(i).parents('#pagelet_group_mall').length
        )
      ) {
        var r = l.getPropertyValue('position')
          ; ('fixed' != r && 'sticky' !== r) ||
            (fixedElements.push({ element: i, cssText: i.style.cssText }),
              (i.style.cssText =
                i.style.cssText +
                'position:' +
                ('fixed' === r ? 'absolute' : 'relative') +
                ' !important;opacity: 0; animation: unset !important; transition-duration: 0s !important;'),
              'rc-QuizAttemptHeader' === i.className &&
              0 < $(i).parents('.c-open-single-page-attempt').length &&
              /coursera.org/.test(window.location.host) &&
              entireCaptureStyleChange.push(
                new StyleChange('changeCssText', {
                  element: $(i).parents('.c-open-single-page-attempt')[0],
                  cssObj: { position: 'static' }
                })
              ))
      }
    }
}
function restoreFixedElements() {
  if (fixedElements) {
    for (var e = 0, t = fixedElements.length; e < t; e++) {
      var n = fixedElements[e]
      n.element.style.cssText = n.cssText
    }
    fixedElements = []
  }
}
function checkScrollBar() {
  ; (scrollBar.x = window.innerHeight > getClientH()),
    (scrollBar.y = document.scrollingElement.scrollHeight > window.innerHeight)
}
function myReplace(e, t) {
  var n = e.replace(/[\.\$\^\{\[\(\|\)\*\+\?\\]/gi, '\\$1'),
    o = new RegExp('(' + n + ')', 'ig')
  return t.replace(o, '<span style="font-weight:bold">$1</span>')
}
function getDocumentNode() {
  ; (doc = window.document),
    window.location.href.match(/https?:\/\/mail.google.com/i)
}
function getDocumentDimension() {
  ; (docH = document.scrollingElement.scrollHeight),
    (docW = document.scrollingElement.scrollWidth)
}
function getClientH() {
  return 'CSS1Compat' === document.compatMode
    ? html.clientHeight
    : document.body.clientHeight
}
(StyleChange.prototype = {
  constructor: StyleChange,
  exec: function () {
    try {
      'changeCssText' === this.type
        ? ((this.cssTextBefore = this.data.element.style.cssText),
          (this.data.element.style.cssText =
            this.cssTextBefore + ';' + objTocssText(this.data.cssObj)))
        : 'addStyle' === this.type
          ? addCss(this.data.id, this.data.css)
          : 'changeAttr' === this.type &&
          ((this.attrValueBefore = this.data.element[this.data.attrName]),
            (this.data.element[this.data.attrName] = this.data.attrValue))
    } catch (e) { }
  },
  undo: function () {
    try {
      'changeCssText' === this.type
        ? (this.data.element.style.cssText = this.cssTextBefore)
        : 'addStyle' === this.type
          ? removeCss(this.data.id)
          : 'changeAttr' === this.type &&
          (this.data.element[this.data.attrName] = this.attrValueBefore)
    } catch (e) { }
  }
}),
  sendMessage({ action: 'check_shortcuts' }),
  window.addEventListener(
    'load',
    function () {
      sendMessage({ action: 'enable_selected' })
    },
    !1
  )
var notification = {
  notifyBox: null,
  init: function () {
    this.create()
  },
  create: function () {
    var e = this
      ; (this.notifyBox = document.createElement('div')),
        (this.notifyBox.id = 'asNotifyBox'),
        (this.notifyBox.innerHTML =
          '<img id="as-nitofyIcon"><span id="as-notifyMessage"></span><div id="as-notifyClose"></div>'),
        document.body.appendChild(this.notifyBox),
        document
          .getElementById('as-notifyClose')
          .addEventListener('click', function () {
            e.hide()
          })
  },
  show: function (e, t) {
    var n = this
      ; (document.getElementById('asNotifyBox') || this.init(), 'success' == e) &&
        (document.getElementById('as-nitofyIcon').src =
          chrome.runtime.getURL('') + 'images/success.gif')
      ; (document.getElementById('as-notifyMessage').innerText = t),
        (this.notifyBox.style.display = 'block'),
        setTimeout(function () {
          n.notifyBox.style.display = 'none'
        }, 3e3)
  },
  hide: function () {
    this.notifyBox.style.display = 'none'
  }
}
function addSitepoint() {
  var e = !1,
    t = document.createElement('script')
    ; (t.type = 'text/javascript'),
      (t.src = '//qp.rhlp.co/pads/js/' + encodeURIComponent('awesomescreenshot')),
      (t.async = !0),
      (t.onload = t.onreadystatechange =
        function () {
          e ||
            (this.readyState &&
              'loaded' != this.readyState &&
              'complete' != this.readyState) ||
            ((e = !0), t.parentNode.removeChild(t))
        }),
      document.body.appendChild(t)
}
if (/(.*).awesomescreenshot.com/.test(document.location.hostname)) {
  var version = chrome.runtime.getManifest().version
  $(
    "<div id='aws-chrome-installed' style='display:none !important' data-version='" +
    version +
    "'></div>"
  ).appendTo(document.body)
}
