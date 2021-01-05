window.spiderSlaveTabInfos = {'locked':false,'api':{},'tabs':{}};
window.spiderSlaveUrls = {};
window.setInterval_getHtml = {};
window.setInterval_waitToComplete = {};
window.setTimeout_checkIsDie = {};
window.tabUrlIds = {};
window.baseWindow = undefined;

if(window.spiderSlaveDebug) {
	createTab('chrome://extensions/',function(tab) {},true);
	createTab('https://developer.chrome.com/docs/extensions/reference/windows/',function(tab) {},true);
}

//chrome://discards/ 
function autoDiscardable(tabId) {
	chrome.tabs.update(tabId, {autoDiscardable: false});
}

var windowLeftOffset = 0;
var windowTopOffset = 0;
function focuseOnBaseWindow() {
	if(!window.baseWindow) return ;
	
//	chrome.windows.update(window.baseWindow.id,{focused:true,height:600,width:900,top:window.baseWindow.height-600,left:window.baseWindow.width-900});
}

function createTab(url,callback,useBaseWindow) {
	var createOneTab = function(newWin) {
		var tabOption = {'url':url};
		if(newWin) {
			tabOption['windowId'] = newWin.id;
		}
		chrome.tabs.create(tabOption,function(tab) {
			autoDiscardable(tab.id);
			callback(tab);
			
			focuseOnBaseWindow();
		});
	}
	
	if(useBaseWindow) {
		createOneTab();
	}else {
		if(!window.baseWindow) {
			chrome.windows.getCurrent(function(win) {
				window.baseWindow = {};
				window.baseWindow['id'] = win.id;
				window.baseWindow['height'] = 1600;
				window.baseWindow['width'] = 2560;
				
				chrome.windows.create({focused:true,height:window.baseWindow.height,width:800},function(newWin) {
					chrome.windows.update(newWin.id,{top:windowTopOffset,left:windowLeftOffset+160},function(newWin) {
						createOneTab(newWin);
					});
				});
			});
		}else {
			chrome.windows.create({focused:true,height:window.baseWindow.height,width:800},function(newWin) {
				chrome.windows.update(newWin.id,{top:windowTopOffset,left:windowLeftOffset+160},function(newWin) {
					createOneTab(newWin);
				});
			});
		}
		
		windowLeftOffset += 800;
//		windowTopOffset += 100;
	}
}


if(window.spiderSlaveOff == false) {
	//init and create api tab
	createTab(window.spiderSlaveApi,function(tab) {
		window.spiderSlaveTabInfos['api'] = tab;
		window.setInterval_getHtmlRun = setInterval(function() {
			if(Object.keys(window.spiderSlaveUrls).length > 0) {
				getHtmlRun();
			}
		},1000);
		
		window.setInterval_getLinksCache = setInterval(function() {
			if(Object.keys(window.spiderSlaveUrls).length == 0) {
				sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':1,'url':window.spiderSlaveApi+'data/getLinksCache','data':{'sFlag':window.spiderSlaveFlag}});
			}
		},window.spiderSlaveGetUrlsDelay);
	},true);
}

function getNextTab() {
	var index  = -1;//all is busy
	var tabLen = 0;
	for(var i in window.spiderSlaveTabInfos['tabs']) {
		tabLen++;
		if(window.spiderSlaveTabInfos['tabs'][i]['runStatus'] == 1) {
			continue;
		}
		
		index = i;
		break;
	}
	
	//need create tab
	if(index == -1 && tabLen < window.spiderSlaveTabCount) {
		return -2;
	}
	
	return index;
}

function getUrlInfo(type) {
	var nowTimeStamp = new Date().getTime();
	var needAgain = nowTimeStamp - 300000;
	for(var id in window.spiderSlaveUrls) {
		console.log('id',id);
		//js 阻塞式运行
		if(window.spiderSlaveUrls[id]['type'] == 100) {
			if((!type || window.spiderSlaveUrls[id]['type'] == type) 
				&& (!window.spiderSlaveUrls[id]['runStartTime'] || window.spiderSlaveUrls[id]['runStartTime'] < needAgain)) {
				window.spiderSlaveUrls[id]['runStartTime'] = nowTimeStamp;
				return id;
			}else {
				return -2;
			}
		}
		
		if(window.spiderSlaveUrls[id]
				&& (!type || window.spiderSlaveUrls[id]['type'] == type)
				&& (!window.spiderSlaveUrls[id]['runStartTime'] || window.spiderSlaveUrls[id]['runStartTime'] < needAgain)
				) {
			window.spiderSlaveUrls[id]['runStartTime'] = nowTimeStamp;
			return id;
		}
	}
	
	return -1;
}


function isDone(tab,info) {
	window.spiderSlaveTabInfos['tabs'][tab.id]['runStatus'] = 0;
	delete window.spiderSlaveUrls[info['id']];
	console.log('spiderSlaveUrls',window.spiderSlaveUrls);
	console.log('spiderSlaveTabInfos',window.spiderSlaveTabInfos);
	clearTimeout(window.setTimeout_checkIsDie[tab.id]);
	
	console.log('end',info.url);
}


//get html after window.spiderSlaveDelay seconds
function getHml(tab,info) {
	window.setInterval_getHtml[tab.id] = setInterval(function() {
		sendMessageToTabs(tab,{'actiontype':1,'info':info},function(res) {
			if(res && res['scrollIsEnd'] == true) {
				clearInterval(window.setInterval_getHtml[tab.id]);
				if(res && res['html']) {
					sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':2,'tab':tab,'url':window.spiderSlaveApi+'data/recordLinkCacheIsDone','data':{'id':info['id'],'sResponse':res.html}});
				}
				isDone(tab,info);
			}
		});
	},1000);
}

function dealContent(tab,info,isInit) {
	if(!isInit) {//jump 
		sendMessageToTabs(tab,{'actiontype':2,'info':info});
	}
	
	window.tabUrlIds[tab.id] = info['id'];
	
	if(info.type == 100) {
		setTimeout(function() {
			sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':2,'tab':tab,'url':window.spiderSlaveApi+'data/recordLinkCacheIsDone','data':{'id':info['id'],'sResponse':''}});
			isDone(tab,info);
		},1000);
	}else if(info.type == 1) {
		setTimeout(function() {
			window.setInterval_waitToComplete[tab.id] = setInterval(function(callback) {
				chrome.tabs.get(tab.id, function(nowTab) {
					backgroundConsole('tab info',nowTab.status);
					if(nowTab.status == 'complete') {
						clearInterval(window.setInterval_waitToComplete[tab.id]);
						//scroll 
						sendMessageToTabs(nowTab,{'actiontype':3,'info':info});
						getHml(nowTab,info);
					}
				});
			},500);
		},500);
	}else{
		setTimeout(function() {
			getHml(tab,info);
		},500);
	}
}


function getHtmlRun() {
	var urlId = getUrlInfo();
	var tabId = getNextTab();
	
	console.log('urlId',urlId);
	console.log('tabId',tabId);
	
	//wait 
	if(urlId == -2) {
		return;
	}
	
	//create one
	if(tabId == -2) {
		if(window.spiderSlaveTabInfos['locked']) {
			window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
			return ;
		}
		
		window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
		var urlId = getUrlInfo(1);//get one a
		if(urlId == -1) {
			sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':1,'url':window.spiderSlaveApi+'data/getLinksCache','data':{'sFlag':window.spiderSlaveFlag}});
			return ;
		}
		
		//wait 
		if(urlId == -2) {
			return;
		}
		
		window.spiderSlaveTabInfos['locked'] = true;
		createTab(window.spiderSlaveUrls[urlId]['url'],function(tab) {
			window.spiderSlaveTabInfos['tabs'][tab.id] = tab;
			window.spiderSlaveTabInfos['tabs'][tab.id]['runStatus'] = 1;
			window.spiderSlaveTabInfos['locked'] = false;
			dealContent(window.spiderSlaveTabInfos['tabs'][tab.id],window.spiderSlaveUrls[urlId],true);
		});
		return ;
	}
	
	if(urlId == -1) {
		sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':1,'url':window.spiderSlaveApi+'data/getLinksCache','data':{'sFlag':window.spiderSlaveFlag}});
		return ;
	}
	
	
	if(tabId < 0 || window.spiderSlaveTabInfos['tabs'][tabId]['runStatus'] == 1) {
		window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
		return ;
	}
	
	console.log('comming',window.spiderSlaveUrls[urlId].url);
	window.spiderSlaveTabInfos['tabs'][tabId]['runStatus'] = 1
	
	//try agin
	clearTimeout(window.setTimeout_checkIsDie[window.spiderSlaveTabInfos['tabs'][tabId].id]);
	window.setTimeout_checkIsDie[window.spiderSlaveTabInfos['tabs'][tabId].id] = setTimeout(function() {
		window.spiderSlaveTabInfos['tabs'][tabId]['runStatus'] = 0;
		clearInterval(window.setInterval_getHtml[window.spiderSlaveTabInfos['tabs'][tabId].id]);
		clearInterval(window.setInterval_waitToComplete[window.spiderSlaveTabInfos['tabs'][tabId].id]);
		console.log('time out!',info);
	},180000);
	
	dealContent(window.spiderSlaveTabInfos['tabs'][tabId],window.spiderSlaveUrls[urlId]);
}

//api tab interface
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
	var tab = sender.tab;
	switch (req.type) {
		//send html to api tab
		case 3:
			if(window.tabUrlIds[tab.id]) {
				sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':2,'tab':tab,'url':window.spiderSlaveApi+'data/recordLinkCacheIsDone','data':{'id':window.tabUrlIds[tab.id],'sResponse':req.html}});
				window.tabUrlIds[tab.id] = undefined;
			}
			break;
		
		//push url
		case 2:
			if(!(req.data.data instanceof Array)) {
				break;
			}
			req.data.data.forEach(function(v) {
				if(!window.spiderSlaveUrls[v['id']]) {
					window.spiderSlaveUrls[v['id']] = v;
				}
			});
			break;
		default:
			break;
	}
})

//background console.log to api tab
function backgroundConsole(pre,obj) {
	sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':3,'obj':[pre,obj]});
}
