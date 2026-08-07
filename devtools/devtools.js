window.allSources = [];
window.allSourcesUrls = {};
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

        // 获取JS渲染后的HTML，替换document类型资源的原始内容
        chrome.devtools.inspectedWindow.eval(
          'document.documentElement.outerHTML',
          function (result, isException) {
            if (!isException && result) {
              // 添加doctype声明，另存为渲染后的HTML，不覆盖原始内容
              var renderedHtml = '<!doctype html>\n' + result;
              window.allSources.forEach(function (source) {
                if (
                  source.resourceType === 'document' &&
                  source.request.url === url
                ) {
                  source.renderedContent = renderedHtml;
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
        break;
    }
  }

  return true;
});
