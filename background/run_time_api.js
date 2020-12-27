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
	
	
	chrome.tabs.sendMessage(tabId, sendInfoObj,{frameId: 0}, function(msg) {
		console.log(msg,'msg');
		if(callBack) {
	        callBack(msg);
		}
	}.bind(this));
}

//向指定tab发送请求
function sendMessageToTabs(tab,sendInfoObj,callBack) {
	var gettingAllFrames = chrome.webNavigation.getAllFrames({tabId: tab.id},function(frames) {
		sendMessageAction(tab.id,sendInfoObj,callBack,frames);
	});
}
