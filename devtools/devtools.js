window.allSources = [];
chrome.devtools.network.onRequestFinished.addListener(function (request) {
  if (["document", "xhr", "fetch"].indexOf(request._resourceType) > -1) {
    request.getContent((content, encode) => {
      window.allSources.push({
        request: request.request,
        content: content,
        response: request.response,
      });
    });
  }
});

const port = chrome.runtime.connect({
  name: "devtools-" + chrome.devtools.inspectedWindow.tabId,
  includeTlsChannelId: true,
});
port.onMessage.addListener(function (request) {
  if (request.devtype) {
    switch (request.devtype) {
      //重新加载
      case 1:
        window.allSources = [];
        chrome.devtools.inspectedWindow.reload();
        break;
      //获取加载资源
      case 2:
        port.postMessage(window.allSources);
        break;
    }
  }

  return true;
});
