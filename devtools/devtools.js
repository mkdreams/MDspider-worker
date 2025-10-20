window.allSources = [];
window.allSourcesUrls = {};
chrome.devtools.network.onRequestFinished.addListener(function (request) {
  if (["document", "xhr", "fetch"].indexOf(request._resourceType) > -1 && request.response.content.mimeType.indexOf('image/') === -1 && request.response.content.mimeType.indexOf('text/css') === -1 && request.response.content.mimeType.indexOf('javascript') === -1) {
    request.getContent((content, encode) => {
      if(window.allSourcesUrls[request.request.url] === undefined) {
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
      //重新加载
      case 1:
        window.allSources = [];
        window.allSourcesUrls = {};
        chrome.devtools.inspectedWindow.reload();
        break;
      //获取加载资源
      case 2:
        var url = request.url;
        var allSourcesTemp = [];

        var canInsert = false;
        window.allSources.sort((a, b) => {
          if (a.startedDateTime < b.startedDateTime) return -1;
          if (a.startedDateTime > b.startedDateTime) return 1;
          return 0;
        }).slice(0,100).forEach(source => {
          if(source.request.url === url) {
            canInsert = true;
          }

          if(canInsert === true) {
            allSourcesTemp.push(source);
          }
        });

        port.postMessage(allSourcesTemp.slice(0,50));
        break;
    }
  }

  return true;
});
