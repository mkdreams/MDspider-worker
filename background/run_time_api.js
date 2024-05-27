//向当前tab发送请求
function sendMessageToNowTabs(sendInfoObj,callBack) {
	chrome.tabs.query({active:true, currentWindow:true}, function (tab) {//获取当前tab
		if (tab[0] != undefined) {
			var gettingAllFrames = chrome.webNavigation.getAllFrames({tabId: tab[0].id},function(frames) {
				sendMessageAction(tab[0].id,sendInfoObj,callBack,frames);
			});
		}
	});
}

function sendMessageAction(tabId,sendInfoObj,callBack,frames) {
	if(frames != undefined) {
		this.allFrames = frames;
		this.response = undefined;
	}
	
	chrome.tabs.sendMessage(tabId, sendBeforeClean(sendInfoObj),{frameId: 0}, function(msg) {
		if(callBack) {
	        callBack(msg);
		}
	});
}

function sendBeforeClean(sendInfoObj) {
	sendInfoObjNew = JSON.parse(JSON.stringify(sendInfoObj));
	if(sendInfoObjNew['info'] && sendInfoObjNew['info']['results']) {
		delete sendInfoObjNew['info']['results'];
	}

	if(sendInfoObjNew['info'] && sendInfoObjNew['info']['param'] && sendInfoObjNew['info']['param']['sub']) {
		sendInfoObjNew['info']['param']['sub'].forEach(function(sub) {
			if(sub['results']) {
				delete sub['results'];
			}
		});
		delete sendInfoObjNew['info']['results'];
	}

	return sendInfoObjNew;
}

//向指定tab发送请求
function sendMessageToTabs(tab,sendInfoObj,callBack) {
	var gettingAllFrames = chrome.webNavigation.getAllFrames({tabId: tab.id},function(frames) {
		sendMessageAction(tab.id,sendInfoObj,callBack,frames);
	});
}

chrome.webRequest.onHeadersReceived.addListener(details => {
    for (var i = 0; i < details.responseHeaders.length; i++) {
		if ('content-security-policy' === details.responseHeaders[i].name.toLowerCase() || 'content-security-policy-report-only' === details.responseHeaders[i].name.toLowerCase()) {
			details.responseHeaders[i].value = '';
		}
	}
    return {responseHeaders: details.responseHeaders};
}, {urls: ['*://*/*']}, ['blocking', 'responseHeaders']);

window.requestIdToUUID = {};
chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details) {
		if(window.requestIdToUUID[details.requestId] !== undefined) {
			var uuid = window.requestIdToUUID[details.requestId];
			delete window.requestIdToUUID[details.requestId];
			var headers = [];
			for (var i = 0; i < details.requestHeaders.length; i++) {
				headers.push(details.requestHeaders[i].name+": "+details.requestHeaders[i].value)
			}
			sendMessageToTabs({id:details.tabId}, { 'actiontype': 3, 'info': {
				"id": "MDspider-UUID-"+uuid,
				"url": "window.ajaxRecordListRestultMap[\""+uuid+"\"] = [decodeURIComponent(\""+encodeURIComponent(headers.join(`\r\n`))+"\")];window.ajaxRecordListRestultMap[\""+uuid+"\"] = window.ajaxRecordListRestultMap[\""+uuid+"\"][0].split(\"\\\\r\\\\n\");",
				"type": 100
			}});
		} 

		return {requestHeaders: details.requestHeaders};
	},
	{
		urls: ["<all_urls>"],
		types: ['main_frame', 'sub_frame', 'xmlhttprequest']
	},
	["requestHeaders","extraHeaders"]
);


chrome.webRequest.onBeforeRequest.addListener(
	function(details) {
	  if (details.url.includes('UUID=')) {
		uuidInfo = details.url.split(/(?:\?|\&)UUID\=/);
		newUrl = uuidInfo[0];
		window.requestIdToUUID[details.requestId] = uuidInfo[1];
		return { redirectUrl: newUrl };
	  }
	},
	{
	  urls: ['<all_urls>'],
	  types: ['main_frame', 'sub_frame', 'xmlhttprequest']
	},
	['blocking']
  );
  