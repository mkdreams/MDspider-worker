window.allSources = [];
window.allSourcesUrls = {};

//注入页面hook：统计进行中的xhr/fetch请求数量（幂等）
var HOOK_CODE = [
  '(function() {',
  '  try {',
  '    if (window.__spiderHookInstalled) return;',
  '    window.__spiderHookInstalled = true;',
  '    window.__activeReqCount = 0;',
  "    var _open = XMLHttpRequest.prototype.open;",
  '    XMLHttpRequest.prototype.open = function() {',
  '      this.__spiderUrl = arguments[1];',
  '      return _open.apply(this, arguments);',
  '    };',
  "    var _send = XMLHttpRequest.prototype.send;",
  '    XMLHttpRequest.prototype.send = function() {',
  '      var xhr = this;',
  '      if (!xhr.__spiderHooked) {',
  '        xhr.__spiderHooked = true;',
  '        window.__activeReqCount++;',
  "        xhr.addEventListener('loadend', function() {",
  '          window.__activeReqCount = Math.max(0, window.__activeReqCount - 1);',
  '        });',
  '      }',
  '      return _send.apply(xhr, arguments);',
  '    };',
  '    var _fetch = window.fetch;',
  '    window.fetch = function() {',
  '      window.__activeReqCount++;',
  '      var p = _fetch.apply(this, arguments);',
  '      p.then(function() {',
  '        window.__activeReqCount = Math.max(0, window.__activeReqCount - 1);',
  '      }, function() {',
  '        window.__activeReqCount = Math.max(0, window.__activeReqCount - 1);',
  '      });',
  '      return p;',
  '    };',
  '  } catch (e) {}',
  '})();'
].join('\n');

//页面导航后重新注入hook，尽早覆盖页面发出的xhr/fetch
chrome.devtools.network.onNavigated.addListener(function () {
  chrome.devtools.inspectedWindow.eval(HOOK_CODE);
});

var waitForRequestsCompleteTimer = null;

//等待页面xhr/fetch请求全部完成，最多等待timeout毫秒
function waitForRequestsComplete(timeout, cb) {
  if (waitForRequestsCompleteTimer) {
    clearTimeout(waitForRequestsCompleteTimer);
    waitForRequestsCompleteTimer = null;
  }

  var startTime = Date.now();

  function check() {
    chrome.devtools.inspectedWindow.eval(
      'window.__activeReqCount',
      function (result, isException) {
        var running = !isException && typeof result === 'number' && result > 0;

        if (running) {
          console.log('等待页面请求完成，剩余', result, '个');
        }

        if (running && Date.now() - startTime < timeout) {
          waitForRequestsCompleteTimer = setTimeout(check, 500);
        } else {
          setTimeout(function() {
            cb();
          }, 500);
        }
      }
    );
  }

  check();
}

chrome.devtools.network.onRequestFinished.addListener(function (request) {
  // console.log(request.request.url, request);
  if (
    ["document", "xhr", "fetch", "script"].indexOf(request._resourceType) >
      -1 &&
    request.response.content.mimeType.indexOf("image/") === -1 &&
    request.response.content.mimeType.indexOf("text/css") === -1 &&
    request.response.content.mimeType.indexOf("video/") === -1 &&
    request.response.content.mimeType.indexOf("javascript") === -1
  ) {
    request.getContent((content, encode) => {
      if (window.allSourcesUrls[request.request.url] === undefined) {
        window.allSourcesUrls[request.request.url] = true;
        window.allSources.push({
          startedDateTime: request.startedDateTime,
          request: request.request,
          content: content,
          response: request.response,
          resourceType: request._resourceType,
        });
      }
    });
  }
});

var port = chrome.runtime.connect({
  name: "devtools-" + chrome.devtools.inspectedWindow.tabId,
});
port.onMessage.addListener(function (request) {
  if (request.devtype) {
    switch (request.devtype) {
      //重新加载（打开指定url或刷新当前页）
      case 1:
        window.allSources = [];
        window.allSourcesUrls = {};
        // 导航到指定url，让页面重新加载以捕获资源
        chrome.devtools.inspectedWindow.eval(
          'location.href="' + request.url.replace(/["\\]/g, '\\$&') + '"'
        );
        break;
      //获取加载资源
      case 2:
        var url = request.url;
        var allSourcesTemp = [];

        // 等待页面xhr/fetch请求完成（最多30秒），再获取资源
        waitForRequestsComplete(30000, function () {
          // 获取JS渲染后的HTML和当前url，替换document类型资源的原始内容
          chrome.devtools.inspectedWindow.eval(
            'JSON.stringify({html: document.documentElement.outerHTML, url: location.href, characterSet: document.characterSet})',
            function (result, isException) {
              var currentUrl = url;
              if (!isException && result) {
                var data = JSON.parse(result);
                // 添加doctype声明，另存为渲染后的HTML，不覆盖原始内容
                var renderedHtml = '<!doctype html>\n' + data.html;
                currentUrl = data.url || url;
                window.allSources.forEach(function (source) {
                  if (
                    source.resourceType === 'document' &&
                    source.request.url === url
                  ) {
                    source.renderedContent = renderedHtml;
                    // 新增字段保存当前跳转后的url，不覆盖原始request.url
                    source.currentUrl = currentUrl;
                    // 记录页面编码，如UTF-8、GBK等
                    source.characterSet = data.characterSet;
                  }
                });
              } else if (isException) {
                console.warn(
                  '获取JS渲染HTML失败，将使用原始HTML:',
                  isException
                );
              }

              var canInsert = false;
              window.allSources
                .sort((a, b) => {
                  if (a.startedDateTime < b.startedDateTime) return -1;
                  if (a.startedDateTime > b.startedDateTime) return 1;
                  return 0;
                })
                .slice(0, 100)
                .forEach((source) => {
                  if (source.request.url === url) {
                    if (request.getBetchSelectorTexts) {
                      DOMParserHtml(source.content);
                      source.getBetchSelectorByTextsResult =
                        getBetchSelectorByTexts(
                          request.getBetchSelectorTexts
                        );
                      console.log(
                        'getBetchSelectorByTextsResult',
                        source.getBetchSelectorByTextsResult
                      );
                    }
                    canInsert = true;
                  }

                  if (canInsert === true) {
                    allSourcesTemp.push(source);
                  }
                });

              port.postMessage(allSourcesTemp.slice(0, 50));
            }
          );
        });
        break;
    }
  }

  return true;
});
