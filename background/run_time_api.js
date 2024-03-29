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
    let header = details.responseHeaders.find(e => e.name.toLowerCase() === 'content-security-policy');
	if(header != undefined) {
		header.value = '';
	}
    return {responseHeaders: details.responseHeaders};
}, {urls: ['*://*/*']}, ['blocking', 'responseHeaders']);
