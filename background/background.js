window.spiderSlaveTabInfos = { 'locked': false, 'api': {}, 'tabs': {}, 'wins':{} };
window.spiderSlaveUrls = {};
window.setInterval_getHtml = {};
window.setInterval_waitToComplete = {};
window.tabLocked = {};
window.setTimeout_checkIsDie = {};
window.tabUrlIds = {};
window.baseWindow = undefined;
window.setInterval_getLinksCache_lastRunTime = new Date().getTime();
window.lockTabFlagToTab = {};

//health check
if(window.spiderSlaveHealthCheckApi !== undefined) {
	setInterval(function () {
		$.ajax({
			url: window.spiderSlaveHealthCheckApi,
			cache: false,
		});
	}, 300000);
}

function enabledProxy() {
	disabledProxy();
	$.ajax({
		url: window.spiderProxyFetchApi,
		cache: false,
		success: function (html) {
			var proxysTemp = html.split("\r\n");
			chrome.storage.local.get(['proxys'], function (proxys) {
				if (Object.keys(proxys).length == 0) {
					proxys = [];
				} else {
					proxys = proxys.proxys;
				}
				proxysTemp.forEach(function (v) {
					if (v != '') {
						proxys.push(v);
					}
				});

				chrome.storage.local.set({ 'proxys': proxys });
				console.log(proxysTemp, proxys);
			});
		}
	});

	var config = {
		mode: "pac_script",
		pacScript: {
			data: "function FindProxyForURL(url, host) {\n" +
				"  alert(url);\n" +
				"  if (host == 'www.baidu.com')\n" +
				"    return 'PROXY 127.0.0.1:1080';\n" +
				"  return 'DIRECT';\n" +
				"}"
			, mandatory: true
		}
	};

	chrome.proxy.settings.set(
		{
			value: config,
			scope: 'regular'
		},
		function (config) {
		}
	);
}

function disabledProxy() {
	var config = {
		mode: "system"
	};

	chrome.proxy.settings.set(
		{
			value: config,
			scope: 'regular'
		},
		function (config) {

		}
	);
}

var windowLeftOffset = 0;
var windowTopOffset = 0;
function autoCreateTab(url, cb, useBaseWindow, urlInfo) {
	function createOneTab(newWin, tabId) {
		var tabOption = { 'url': url };
		if (newWin) {
			tabOption['windowId'] = newWin.id;
		}

		if (tabId) {
			chrome.tabs.get(tabId, function (tab) {
				if(tab === undefined) {
					window.spiderSlaveTabInfos['allTabLocked'] = false;
					return ;
				}

				if(newWin) {
					tab['win'] = newWin;
					if(window.spiderSlaveTabInfos['wins'] && window.spiderSlaveTabInfos['wins'][newWin.id]) {
						window.spiderSlaveTabInfos['wins'][newWin.id]['useTabs'][tab['id']] = tab;
					}
				}
				//chrome://discards/ 
				chrome.tabs.update(tab.id, { autoDiscardable: false }, function () {
					cb && cb(tab);
				});
			});
		} else {
			chrome.tabs.create(tabOption, function (tab) {
				if(tab === undefined) {
					window.spiderSlaveTabInfos['allTabLocked'] = false;
					return ;
				}

				if(newWin) {
					tab['win'] = newWin;
					if(window.spiderSlaveTabInfos['wins'] && window.spiderSlaveTabInfos['wins'][newWin.id]) {
						window.spiderSlaveTabInfos['wins'][newWin.id]['useTabs'][tab['id']] = tab;
					}
				}

				//chrome://discards/ 
				chrome.tabs.update(tab.id, { autoDiscardable: false }, function () {
					cb && cb(tab);
				});
			});
		}
	}

	if (useBaseWindow) {
		createOneTab();
		return ;
	}

	windowLeftOffset += window.baseInfo['perWidth'];
	if (windowLeftOffset + window.baseInfo['perWidth'] - 10 >= window.baseInfo['width']) {
		windowLeftOffset = 0;
		windowTopOffset += window.baseInfo['perHeight'];
	}

	if(urlInfo && urlInfo['param'] && urlInfo['param']['fixed'] == 1) {
		if(window.spiderSlaveTabInfos['fixedWins'] === undefined) {
			window.spiderSlaveTabInfos['fixedWins'] = {};
		}

		chrome.windows.create({ focused: true, state: 'normal', 'url': url, top: 150, left: getObjectLen(window.spiderSlaveTabInfos['fixedWins'])*300, height: window.baseInfo['height']-150, width: 600 }, function (newWin) {
			window.spiderSlaveTabInfos['fixedWins'][newWin.id] = newWin;
			createOneTab(newWin, newWin.tabs.length > 0 ? newWin.tabs[0]['id'] : 0);
		});
		return ;
	}

	if(getObjectLen(window.spiderSlaveTabInfos['wins']) < window.spiderSlaveWinCount) {
		chrome.windows.create({ focused: true, state: 'normal', 'url': url, top: windowTopOffset, left: windowLeftOffset, height: window.baseInfo['perHeight'], width: window.baseInfo['perWidth'] }, function (newWin) {
			window.spiderSlaveTabInfos['wins'][newWin.id] = newWin;
			window.spiderSlaveTabInfos['wins'][newWin.id]['useTabs'] = {};
			createOneTab(newWin, newWin.tabs.length > 0 ? newWin.tabs[0]['id'] : 0);
		});
	}else{
		for (var i in window.spiderSlaveTabInfos['wins']) {
			if(getObjectLen(window.spiderSlaveTabInfos['wins'][i]['useTabs']) < window.spiderSlavePerWinTabCount) {
				createOneTab(window.spiderSlaveTabInfos['wins'][i], 0);
			}
		}
	}
}

function removeTabCb(tabId) {
	if(window.spiderSlaveTabInfos['tabs'][tabId]) {
		clearTimeout(window.setTimeout_checkIsDie[window.spiderSlaveTabInfos['tabs'][tabId].id]);
		clearInterval(window.setInterval_getHtml[window.spiderSlaveTabInfos['tabs'][tabId].id]);
		clearInterval(window.setInterval_waitToComplete[window.spiderSlaveTabInfos['tabs'][tabId].id]);
		var winId = window.spiderSlaveTabInfos['tabs'][tabId]['win']['id'];
		if(window.spiderSlaveTabInfos['wins'][winId]) {
			delete window.spiderSlaveTabInfos['wins'][winId]['useTabs'][tabId];
		}
		if(window.spiderSlaveTabInfos['tabs'][tabId]) {
			delete window.spiderSlaveTabInfos['tabs'][tabId];
		}
		if(window.lockTabFlagToTab[tabId]) {
			delete window.lockTabFlagToTab[window.lockTabFlagToTab[tabId]];
			delete window.lockTabFlagToTab[tabId];
		}
	}

	console.log('close tab!', tabId);
}

function workPlay() {
	workPause();

	//close tab
	chrome.tabs.onRemoved.addListener(removeTabCb);


	//close win
	chrome.windows.onRemoved.addListener(function (winId) {
		if(window.spiderSlaveTabInfos['wins'][winId]) {
			for(var i in window.spiderSlaveTabInfos['wins'][winId]['useTabs']) {
				removeTabCb(window.spiderSlaveTabInfos['wins'][winId]['useTabs'][i]['id']);
			}
		}

		if(window.spiderSlaveTabInfos['fixedWins'][winId]) {
			delete window.spiderSlaveTabInfos['fixedWins'][winId];
		}

		console.log('close win!', winId);
		delete window.spiderSlaveTabInfos['wins'][winId];
	});

	clearInterval(window.setInterval_getHtmlRun);
	window.setInterval_getHtmlRun = setInterval(function () {
		if (Object.keys(window.spiderSlaveUrls).length > 0) {
			oneActionRun();
		}
	}, 100);

	clearInterval(window.setInterval_getLinksCache);
	window.setInterval_getLinksCache = setInterval(function () {
		var len = Object.keys(window.spiderSlaveUrls).length;
		if (len === 0) {
			pullActions();
		}
	}, window.spiderSlaveGetUrlsDelay);

	backgroundConsole('已开始', 1);
}

function workPause() {
	clearInterval(window.setInterval_getHtmlRun);
	clearInterval(window.setInterval_getLinksCache);
	backgroundConsole('已暂停', 1);
}

function pullActions() {
	var timestamp = new Date().getTime();
	if(timestamp - window.setInterval_getLinksCache_lastRunTime > window.spiderSlaveGetUrlsDelay) {
		window.setInterval_getLinksCache_lastRunTime = timestamp;
		sendMessageToTabs(window.spiderSlaveTabInfos['api'], { 'admintype': 1, 'url': window.spiderSlaveApiActionList, 'data': { 'sFlag': window.spiderSlaveFlag,'workCreateFlag':window.workCreateFlag } });
	}
}

function getUrlInfo(types,domain) {
	var nowTimeStamp = new Date().getTime();
	var needAgain = nowTimeStamp - 300000;
	for (var id in window.spiderSlaveUrls) {
		//js 阻塞式运行
		if (window.spiderSlaveUrls[id]['type'] == 100 && !window.spiderSlaveUrls[id]['param']['lockTab']) {
			if ((!types || types.indexOf(window.spiderSlaveUrls[id]['type']) > -1)
				&& (!window.spiderSlaveUrls[id]['runStartTime'] || window.spiderSlaveUrls[id]['runStartTime'] < needAgain)
				) {
				window.spiderSlaveUrls[id]['runStartTime'] = nowTimeStamp;
				return id;
			} else {
				return -2;
			}
		}

		if (window.spiderSlaveUrls[id]
			&& (!types || types.indexOf(window.spiderSlaveUrls[id]['type']) > -1)
			&& (!window.spiderSlaveUrls[id]['runStartTime'] || window.spiderSlaveUrls[id]['runStartTime'] < needAgain)
			&& (!domain || (window.spiderSlaveUrls[id]['param'] && window.spiderSlaveUrls[id]['param']['lockTab'] && window.spiderSlaveUrls[id]['param']['lockTabFlag'] && window.spiderSlaveUrls[id]['param']['lockTabFlag'].indexOf(domain) > -1) 
				|| (window.spiderSlaveUrls[id]['param'] && window.spiderSlaveUrls[id]['param']['lockTab'] && window.spiderSlaveUrls[id]['url'].indexOf(domain) > -1))
		) {
			window.spiderSlaveUrls[id]['runStartTime'] = nowTimeStamp;
			return id;
		}
	}

	return -1;
}

function getNextTab(urlId) {

	var urlNowRunTabId = getLockTabId(urlId);

	var needLock = (urlNowRunTabId !== false);

	//all is busy
	var index = -1;
	var tabLen = 0;

	var canRunTabs = [];
	for (var i in window.spiderSlaveTabInfos['tabs']) {
		tabLen++;
		if (window.spiderSlaveTabInfos['tabs'][i]['runStatus'] == 1) {
			continue;
		}

		if(window.lockTabFlagToTab[i]) {
			canRunTabs.push(i);
		}

		if(needLock && i != urlNowRunTabId) {
			continue;
		}

		if(!needLock && window.lockTabFlagToTab[i]) {
			continue;
		}

		index = i;
		break;
	}

	
	//need create tab
	if (index == -1 && (!needLock || urlNowRunTabId === 0) && tabLen < window.spiderSlaveWinCount*window.spiderSlavePerWinTabCount) {
		console.log('create tab',urlId,index);

		//restore start time
		if (window.spiderSlaveTabInfos['allTabLocked']) {
			window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
			return [urlId,-2];
		}

		if(!window.spiderSlaveUrls[urlId] || [1, 201].indexOf(window.spiderSlaveUrls[urlId]['type']) == -1) {
			//get one a,or get cookies url
			urlId = getUrlInfo([1, 201]);
		}

		if (urlId == -1) {
			pullActions();
			return [urlId,-2];
		}
		
		//block 
		if (urlId == -2) {
			return [urlId,-2];
		}

		window.spiderSlaveTabInfos['allTabLocked'] = true;
		autoCreateTab(window.spiderSlaveUrls[urlId]['url'], function (tab) {
			window.spiderSlaveTabInfos['tabs'][tab.id] = tab;
			window.spiderSlaveTabInfos['tabs'][tab.id]['runStatus'] = 1;
			window.spiderSlaveTabInfos['allTabLocked'] = false;

			//record lock tab info
			getLockTabId(urlId,tab.id)

			dealOneAction(window.spiderSlaveTabInfos['tabs'][tab.id], window.spiderSlaveUrls[urlId], true);
		},false,window.spiderSlaveUrls[urlId]);
	}else if(index == -1 && canRunTabs.length > 0) {
		//restore start time
		if (window.spiderSlaveTabInfos['allTabLocked']) {
			window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
			return [urlId,-2];
		}
		
		if(window.spiderSlaveUrls[urlId]) {
			window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
		}

		urlId = getUrlInfo(undefined,window.lockTabFlagToTab[canRunTabs[0]]);

		if (urlId == -1) {
			pullActions();
			return [urlId,-2];
		}

		return [urlId,canRunTabs[0]];
	}

	return [urlId,index];
}

function getLockTabId(urlId,tabId) {
	if(window.spiderSlaveUrls[urlId] && window.spiderSlaveUrls[urlId]['param'] && window.spiderSlaveUrls[urlId]['param']['lockTab']) {
		if(window.spiderSlaveUrls[urlId]['param']['lockTabFlag']) {
			var lockTabFlag = window.spiderSlaveUrls[urlId]['param']['lockTabFlag'];
		}else{
			var res = window.spiderSlaveUrls[urlId]['url'].match(/^(http|https)\:\/\/[^\/$]+?(?=[\/|$])/g);
			if(res && res[0]) {
				var lockTabFlag = res[0];
			}else{
				var lockTabFlag = 'tempLockTabFlag';
			}
		}

		if(window.lockTabFlagToTab[lockTabFlag]) {
			var r = window.lockTabFlagToTab[lockTabFlag];
		}else{
			var r = 0;
		}

		if(tabId) {
			window.lockTabFlagToTab[lockTabFlag] = tabId;
			window.lockTabFlagToTab[tabId] = lockTabFlag;
		}

		return r;
	}

	return false;
}

function oneActionRun() {
	var urlId = getUrlInfo();
	var runInfo = getNextTab(urlId);
	urlId = runInfo[0];
	var tabId = runInfo[1];

	//block
	if (urlId == -2 || tabId == -2) {
		return;
	}


	//get more actions
	if (urlId == -1) {
		pullActions();
		return;
	}

	//now tab is runing 
	if (tabId < 0 || window.spiderSlaveTabInfos['tabs'][tabId]['runStatus'] == 1) {
		window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
		return;
	}


	//mark this tab,that is runing
	window.spiderSlaveTabInfos['tabs'][tabId]['runStatus'] = 1

	//try agin after 3min
	clearTimeout(window.setTimeout_checkIsDie[window.spiderSlaveTabInfos['tabs'][tabId].id]);
	window.setTimeout_checkIsDie[window.spiderSlaveTabInfos['tabs'][tabId].id] = setTimeout(function () {
		window.spiderSlaveTabInfos['tabs'][tabId]['runStatus'] = 0;
		clearInterval(window.setInterval_getHtml[window.spiderSlaveTabInfos['tabs'][tabId].id]);
		clearInterval(window.setInterval_waitToComplete[window.spiderSlaveTabInfos['tabs'][tabId].id]);
	}, 180000);


	if(window.spiderSlaveHumanBehavior) {
		if (window.spiderSlaveUrls[urlId]['type'] == 103) {
			chrome.windows.update(window.spiderSlaveTabInfos['tabs'][tabId]['win']['id'],{'focused':true,'state':'fullscreen'},function() {
				window.spiderSlaveUrls[urlId]['spiderSlaveHumanBehaviorApi'] = window.spiderSlaveHumanBehaviorApi;
				window.spiderSlaveUrls[urlId]['win'] = window.spiderSlaveTabInfos['tabs'][tabId]['win'];
				dealOneAction(window.spiderSlaveTabInfos['tabs'][tabId], window.spiderSlaveUrls[urlId]);
			})
		}else{
			dealOneAction(window.spiderSlaveTabInfos['tabs'][tabId], window.spiderSlaveUrls[urlId]);
		}
	}else{
		dealOneAction(window.spiderSlaveTabInfos['tabs'][tabId], window.spiderSlaveUrls[urlId]);
	}
}


function isDone(tab, info, isError) {
	if(isError === undefined) {
		window.spiderSlaveTabInfos['tabs'][tab.id]['runStatus'] = 0;
		delete window.spiderSlaveUrls[info['id']];
		clearTimeout(window.setTimeout_checkIsDie[tab.id]);
	}else{
		if(window.spiderSlaveUrls[info['id']]['runCount'] === undefined) {
			window.spiderSlaveUrls[info['id']]['runCount'] = 0;
		}
		window.spiderSlaveUrls[info['id']]['runCount']++;

		//try 5 times
		if(window.spiderSlaveUrls[info['id']]['runCount'] > 5) {
			sendMessageToTabs(window.spiderSlaveTabInfos['api'], { 'admintype': 2, 'tab': {id:tab.id}, 'url': window.spiderSlaveApiCb, 'data': { 'id': info['id'], 'sResponse': 'ZmFsc2U=' } },function() {
				var clearInfo = function(tab,info) {
					removeTabCb(tab.id);
					
					delete window.spiderSlaveUrls[info['id']];
					clearTimeout(window.setTimeout_checkIsDie[tab.id]);
				}

				chrome.tabs.query({windowId:tab.windowId},function(tabs) {
					if(tabs && tabs.length > 1) {
						chrome.tabs.remove(tab.id,function() {
							clearInfo(tab,info);
						});
					}else{
						clearInfo(tab,info);
					}
				})
			});
		}else{
			window.spiderSlaveTabInfos['tabs'][tab.id]['runStatus'] = 0;
			window.spiderSlaveUrls[info['id']]['runStartTime'] = undefined;
		}

	}
}


function resultIsOk(tab, info, cb) {
	window.tabLocked[tab.id] = false;
	clearInterval(window.setInterval_getHtml[tab.id]);
	window.setInterval_getHtml[tab.id] = setInterval(function () {
		if(window.tabLocked[tab.id] === true) {
			return ;
		}
		window.tabLocked[tab.id] = true;

		sendMessageToTabs(tab, { 'actiontype': 1, 'info': info }, function (res) {
			window.tabLocked[tab.id] = false;
			console.log('res111',res);
			if (res && res['actionComplete'] == true) {
				clearInterval(window.setInterval_getHtml[tab.id]);

				cb(tab, info, res);
			}

			if(res === undefined) {
				clearInterval(window.setInterval_getHtml[tab.id]);

				isDone(tab, info, true);
			}
		}.bind(this));
	}.bind(this), 50);
}

//try every 50 ms
function getHml(tab, info) {
	resultIsOk(tab, info, function(tab, info, res) {
		if (res && res['html']) {
			//sub save data
			if(!info['results']) {
				info['results'] = [];
			}

			info['results'].push(res['html']);
		}

		if(info['cb']) {
			info['cb'](info);
		}
		
		if(info['isEnd'] === true) {
			var maxLen = 2621440;
			if(info['results'][0].length > maxLen) {
				var totalLen = info['results'][0].length;
				for(var i = 0;i <= totalLen;i = i+maxLen) {
					sendMessageToTabs(window.spiderSlaveTabInfos['api'], { 'admintype': 4, 'tab': {id:tab.id}, 'url': window.spiderSlaveApiCb, 'data': { 'id': info['id'],'betch':i, 'sResponse': info['results'][0].slice(i,i+maxLen) } });
				}
				sendMessageToTabs(window.spiderSlaveTabInfos['api'], { 'admintype': 4, 'tab': {id:tab.id}, 'url': window.spiderSlaveApiCb, 'data': { 'id': info['id'] } },function() {
					isDone(tab, info);
				});
			}else{
				sendMessageToTabs(window.spiderSlaveTabInfos['api'], { 'admintype': 2, 'tab': {id:tab.id}, 'url': window.spiderSlaveApiCb, 'data': { 'id': info['id'], 'sResponse': info['results'][0] } },function() {
					isDone(tab, info);
				});
			}
		}
	}.bind(this));
}

function runActionComplete(tab,info,cb) {
	if(info.param && info.param.delay) {
		var delay = info.param.delay;
	}else{
		var delay = 50;
	}

	var commingTime = new Date().getTime();
	setTimeout(function () {
		window.tabLocked[tab.id] = false;
		clearInterval(window.setInterval_waitToComplete[tab.id]);
		window.setInterval_waitToComplete[tab.id] = setInterval(function () {
			if(window.tabLocked[tab.id] === true) {
				return ;
			}
			window.tabLocked[tab.id] = true;

			chrome.tabs.get(tab.id, function (nowTab) {
				window.tabLocked[tab.id] = false;
				
				if(nowTab === undefined) {
					clearInterval(window.setInterval_waitToComplete[tab.id]);
					isDone(tab, info, true);
				//max run time: 30 s
				}else if (nowTab.status == 'complete' || (new Date().getTime() - commingTime > 30000)) {
					clearInterval(window.setInterval_waitToComplete[tab.id]);
					resultIsOk(nowTab, info, function(nowTab, info, res) {
						cb(nowTab,info);
					});
				}
			});
		}, 100);
	}, delay);
};

function runSub(tab, info, cb, index) {
	if(index === undefined) {
		index = 0;
	}

	if(info.param && info.param.sub) {
		var subCount = info.param.sub.length;
		if(subCount === index) {
			info['isEnd'] = true;
			cb(tab, info);
		}else{
			var subInfo = info.param.sub[index++];
			//run action
			sendMessageToTabs(tab, { 'actiontype': 2, 'info': subInfo},function() {
				runActionComplete(tab, info, function(tab, info) {
					if(subInfo.param && subInfo.param.save) {
						subInfo['isEnd'] = false;
						if(info['results']) {
							subInfo['results'] = info['results'];
						}
						subInfo['cb'] = function(subInfo) {
							info['results'] = subInfo['results'];
							runSub(tab, info, cb, index);
						}.bind(this);

						getHml(tab, subInfo);
					}else{
						runSub(tab, info, cb, index);
					}

				});
			});
		}
	}else{
		info['isEnd'] = true;
		cb(tab, info);
	}
};

function dealOneAction(tab, info, needJump) {
	// 1:a(jump and get data)
	//2:js,4:css,8:image,16:others(ajax get data by get method)
	//100:block run js,101:ajax,
	//102:scroll
	//201:open the url,then read this url's cookies form the browser
	var typesToName = { 
		1: "a", 
		2: "js", 
		4: "css", 
		8: "image", 
		16: "others", 
		100: "run js block until all complete", 
		101: "ajax", 
		102: "scroll",
		103: "a by click",
		201: "get cookies"
	};

	function actionDoneCb() {
		switch(info.type) {
			case 1:
			case 101:
				runActionComplete(tab, info, function(tab, info) {
					runSub(tab, info, function(tab, info) {
						getHml(tab, info);
					},0)
				});
				break;
			case 201:
				runActionComplete(tab, info,function(tab, info) {
					runSub(tab, info, function(tab, info) {
						eval('backgroundAction'+info.type+'(tab, info);');
					})
				});
				break;
			default:
				setTimeout(function () {
					runSub(tab, info, function(tab, info) {
						getHml(tab, info);
					})
				}, 100);
				break;
		}
	}

	actionRecords(info['url'], typesToName[info['type']]);

	window.tabUrlIds[tab.id] = info['id'];
	if (!needJump) {//jump
		sendMessageToTabs(tab, { 'actiontype': 2, 'info': info },function() {
			actionDoneCb();
		});
	}else{
		actionDoneCb();
	}
}

//api tab interface
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
	var tab = sender.tab;
	switch (req.type) {
		//send html to api tab
		case 3:
			if (window.tabUrlIds[tab.id]) {
				sendMessageToTabs(window.spiderSlaveTabInfos['api'], { 'admintype': 2, 'tab': tab, 'url': window.spiderSlaveApiCb, 'data': { 'id': window.tabUrlIds[tab.id], 'sResponse': req.html } });
				window.tabUrlIds[tab.id] = undefined;
			}
			break;

		//push url
		case 2:
			if (!(req.data.data instanceof Array)) {
				break;
			}
			req.data.data.forEach(function (v) {
				if (!window.spiderSlaveUrls[v['id']]) {
					window.spiderSlaveUrls[v['id']] = v;
				}
			});
			break;
		default:
			break;
	}
})

function debugRun(debugActions) {
	debugActions.data.forEach(function (v) {
		if (!window.spiderSlaveUrls[v['id']]) {
			window.spiderSlaveUrls[v['id']] = v;
		}
	});
	workPlay();
}

function debugRunReset(debugActions) {
	for(var id in window.spiderSlaveTabInfos['tabs']) {
		window.spiderSlaveTabInfos['tabs'][id]['runStatus'] = 0;
	}
	window.spiderSlaveUrls = {};
}

//background console.log to api tab
function backgroundConsole(pre, obj) {
	sendMessageToTabs(window.spiderSlaveTabInfos['api'], { 'admintype': 3, 'obj': [pre, obj] });
}

function backgroundAction201(tab, info) {
	chrome.cookies.getAll({'url':info.url},function(cookies) {
		textToBase64(JSON.stringify(cookies),function(base64){
			sendMessageToTabs(window.spiderSlaveTabInfos['api'], { 'admintype': 2, 'tab': tab, 'url': window.spiderSlaveApiCb, 'data': { 'id': info['id'], 'sResponse': base64 } });
			isDone(tab, info);
		});
	});

}

function actionRecords(message, title) {
	if(window.notify_tips === false) {
		return ;
	}
	
	if (title == undefined) {
		var title = '当前事件';
	}

	chrome.notifications.clear('notify_tips', function () {
		chrome.notifications.create(
			'notify_tips', // notifyId
			{ "type": "basic", "iconUrl": "popup/images/colin.png", "title": title, "message": message },
			function (notifyId) {

			}
		);
	});
}