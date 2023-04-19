window.spiderSlaveTabInfos = { 'allTabLocked': false, 'api': {}, 'tabs': {}, 'wins':{} };
window.spiderSlaveUrls = {};
window.spiderSlaveDeletedUrls = {};
window.setInterval_getHtml = {};
window.setInterval_waitToComplete = {};
window.tabLocked = {};
window.setTimeout_checkIsDie = {};
window.tabUrlIds = {};
window.baseWindow = undefined;
window.setInterval_getLinksCache_lastRunTime = new Date().getTime();
window.lockTabFlagToTab = {};

//active time
window.spiderSlaveActiveLastTime = [0,0];
window.spiderSlaveActiveLastTime[0] = window.spiderSlaveActiveLastTime[1] = parseInt(new Date().getTime()/1000);

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

//stop content-security-policy
chrome.tabs.onCreated.addListener(function(tab) {
	var tabId = tab.id;
	var addRules = [],
		removeRuleIds = [];
	addRules.push({
		id:tabId,
		action: {
		  type: 'modifyHeaders',
		  responseHeaders: [{ header: 'content-security-policy', operation: 'set', value: '' }]
		},
		condition: {urlFilter: '*', resourceTypes: ['main_frame', 'sub_frame']}
	});

	chrome.declarativeNetRequest.updateSessionRules({addRules, removeRuleIds})
});

function workPlay(allCompeletedCb) {
	//up active time
	window.spiderSlaveActiveLastTime[0] = window.spiderSlaveActiveLastTime[1] = parseInt(new Date().getTime()/1000);

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

		console.log('close win!', winId);
		delete window.spiderSlaveTabInfos['wins'][winId];
	});

	clearInterval(window.setInterval_getHtmlRun);
	window.actionRunTime = 0;
	window.setInterval_getHtmlRun = setInterval(function () {
		window.actionRunTime++;
		if(window.actionRunTime > 600 && window.spiderSlaveTabInfos['allTabLocked'] === false) {
			tryCloseTab();
			window.actionRunTime = 0;
			window.spiderSlaveActiveLastTime[0] = parseInt(new Date().getTime()/1000);
		}else{
			if (Object.keys(window.spiderSlaveUrls).length > 0) {
				oneActionRun();
			}
		}
	}, 100);

	clearInterval(window.setInterval_getLinksCache);
	window.setInterval_getLinksCache = setInterval(function () {
		var len = Object.keys(window.spiderSlaveUrls).length;

		window.spiderSlaveActiveLastTime[1] = parseInt(new Date().getTime()/1000);

		if (len === 0) {
			if(allCompeletedCb) {
				allCompeletedCb();
			}else{
				pullActions();
			}
		}
	}, window.spiderSlaveGetUrlsDelay);


	//health check
	if(window.spiderSlaveHelpmate === true) {
		clearInterval(window.spiderSlaveHelpmateSetInterval);
		window.spiderSlaveHelpmateSetInterval = setInterval(function () {
			var nowTime = parseInt(new Date().getTime()/1000);
			if(window.spiderSlaveActiveLastTime[0] < nowTime - 300 || window.spiderSlaveActiveLastTime[1] < nowTime - 300) {
				workPlay();
			}else{
				pingUser()
			}
		}, 60000);
	}

	backgroundConsole('已开始', 1);
}

function workPause() {
	clearInterval(window.setInterval_getHtmlRun);
	clearInterval(window.setInterval_getLinksCache);
	clearInterval(window.spiderSlaveHelpmateSetInterval);

	backgroundConsole('已暂停', 1);
}

function pullActions() {
	var timestamp = new Date().getTime();
	if(timestamp - window.setInterval_getLinksCache_lastRunTime > window.spiderSlaveGetUrlsDelay && window.spiderSlaveInitStatus === 3) {
		window.setInterval_getLinksCache_lastRunTime = timestamp;
		//websocket
		if(window.spiderSlaveApiActionList.indexOf("ws") === 0) {
			if(window.pullactionsws === undefined) {
				window.pullactionsws = new WebSocket(window.spiderSlaveApiActionList);
				window.pullactionsws.onopen = function(evt) {
					console.log('ws',"Connection open ...",window.spiderSlaveApiActionList);
					window.pullactionsws.send(JSON.stringify({type:0,'sFlag': window.spiderSlaveFlag,'workCreateFlag':window.workCreateFlag}));
				};
				window.pullactionsws.onmessage = function(evt) {
					datas = evt.data.split("\n");
					datas.forEach(function (str) {
						v = JSON.parse(str)
						if(v['id'] == undefined) {
							v['id'] = Number(Math.random().toString().substr(3,5) + Date.now()).toString(36);
						}
						if (!window.spiderSlaveUrls[v['id']] && !window.spiderSlaveDeletedUrls[v['id']]) {
							window.spiderSlaveUrls[v['id']] = v;
						}
					});
		
					//clean deleted urls,keep 30 s
					var compareTime = new Date().getTime() - 30000;
					for(var id in window.spiderSlaveDeletedUrls) {
						if(window.spiderSlaveDeletedUrls[id] < compareTime) {
							delete window.spiderSlaveDeletedUrls[id];
						}
					}
				};
				window.pullactionsws.onclose = function(evt) {
					console.log('ws',"Connection closed.");
					window.pullactionsws = undefined;
				};
			}else{
				window.pullactionsws.send(JSON.stringify({type:1,'sFlag': window.spiderSlaveFlag,'workCreateFlag':window.workCreateFlag}));
			}
		}else{
			ajaxPost({ 'admintype': 1, 'url': window.spiderSlaveApiActionList, 'data': { 'sFlag': window.spiderSlaveFlag,'workCreateFlag':window.workCreateFlag } },function(data) {
				if (!(data.data instanceof Array)) {
					return;
				}
	
				data.data.forEach(function (v) {
					if (!window.spiderSlaveUrls[v['id']] && !window.spiderSlaveDeletedUrls[v['id']]) {
						window.spiderSlaveUrls[v['id']] = v;
					}
				});
	
				//clean deleted urls,keep 30 s
				var compareTime = new Date().getTime() - 30000;
				for(var id in window.spiderSlaveDeletedUrls) {
					if(window.spiderSlaveDeletedUrls[id] < compareTime) {
						delete window.spiderSlaveDeletedUrls[id];
					}
				}
			});
		}
	}
}

// 5 min before
function tryCloseTab() {
	window.spiderSlaveTabInfos['allTabLocked'] = true;

	var promiseArr = [];
	//clean tab && close tab
	var nowTime = new Date().getTime();
	var needCloseTabIds = [];
	for (var i in window.spiderSlaveTabInfos['tabs']) {
		// more than 30 min, init tab status.
		if(window.spiderSlaveTabInfos['tabs'][i]['iActiveTime'] !== undefined && window.spiderSlaveTabInfos['tabs'][i]['iActiveTime'] < nowTime-1800000) {
			window.spiderSlaveTabInfos['tabs'][i]['runStatus'] = 0;
		}


		if (window.spiderSlaveTabInfos['tabs'][i]['runStatus'] !== undefined  && window.spiderSlaveTabInfos['tabs'][i]['runStatus'] === 0 
			&& (window.spiderSlaveTabInfos['tabs'][i]['iActiveTime'] !== undefined && window.spiderSlaveTabInfos['tabs'][i]['iActiveTime'] < nowTime-300000)) {
				needCloseTabIds.push(i);
		}
	}

	needCloseTabIds.forEach(function(i) {
		(function(j){
			var p = new Promise(function(resolve,reject) {
				chrome.tabs.remove(window.spiderSlaveTabInfos['tabs'][j]['id'],function(){
					resolve(1);
				});
			});
			promiseArr.push(p);
		})(i);
	});

	Promise.all(promiseArr).then((result) => {
		window.spiderSlaveTabInfos['allTabLocked'] = false;
	});
}

function getUrlInfo(types,domain) {
	var nowTimeStamp = new Date().getTime();
	var needAgain = nowTimeStamp - 300000;
	var urlId = -1;
	var matched = false;
	for (var id in window.spiderSlaveUrls) {
		if(!window.spiderSlaveUrls[id]) {
			continue;
		}

		if(window.spiderSlaveUrls[id]['iSort'] === undefined) {
			window.spiderSlaveUrls[id]['iSort'] = 0;
		}

		//first run open new tab
		if(!domain && window.spiderSlaveUrls[id]['param'] && window.spiderSlaveUrls[id]['param']['lockTab'] && window.spiderSlaveUrls[id]['param']['lockTabFlag'] && !window.lockTabFlagToTab[window.spiderSlaveUrls[id]['param']['lockTabFlag']]) {
			if(urlId > -1) {
				window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
			}
			window.spiderSlaveUrls[id]['runStartTime'] = nowTimeStamp;
			urlId = id;
			break;
		}

		var canRun = checkCanRun(types,domain,id,needAgain);
		if (matched === false && canRun) {
			if(urlId > -1) {
				window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
			}

			window.spiderSlaveUrls[id]['runStartTime'] = nowTimeStamp;
			urlId = id;
			matched = true;
		}

		if(matched && canRun && window.spiderSlaveUrls[id]['iSort'] > window.spiderSlaveUrls[urlId]['iSort']){
			if(urlId > -1) {
				window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
			}
			window.spiderSlaveUrls[id]['runStartTime'] = nowTimeStamp;
			urlId = id;
		}
	}

	return urlId;
}

function checkCanRun(types,domain,id,needAgain) {
	if((!types || types.indexOf(window.spiderSlaveUrls[id]['type']) > -1)
		&& (!window.spiderSlaveUrls[id]['runStartTime'] || window.spiderSlaveUrls[id]['runStartTime'] < needAgain)
		&& (!domain || (window.spiderSlaveUrls[id]['param'] && window.spiderSlaveUrls[id]['param']['lockTab'] && window.spiderSlaveUrls[id]['param']['lockTabFlag'] && window.spiderSlaveUrls[id]['param']['lockTabFlag'] === domain) 
			|| (window.spiderSlaveUrls[id]['param'] && window.spiderSlaveUrls[id]['param']['lockTab'] && window.spiderSlaveUrls[id]['url'].indexOf(domain) > -1))) {
		return true;
	}else{
		return false;
	}
}

function getNextTab(urlId) {
	if(window.spiderSlaveUrls[urlId] === undefined) {
		return [urlId,-2];
	}

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
		//restore start time
		if (window.spiderSlaveTabInfos['allTabLocked']) {
			window.spiderSlaveUrls[urlId]['runStartTime'] = 0;

			return [urlId,-2];
		}

		if(!window.spiderSlaveUrls[urlId] || [1].indexOf(window.spiderSlaveUrls[urlId]['type']) == -1) {
			//get one a,or get cookies url
			urlId = getUrlInfo([1]);
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
			window.spiderSlaveTabInfos['tabs'][tab.id]['iActiveTime'] = new Date().getTime();
			window.spiderSlaveTabInfos['allTabLocked'] = false;

			//record lock tab info
			getLockTabId(urlId,tab.id)

			dealOneAction(window.spiderSlaveTabInfos['tabs'][tab.id], window.spiderSlaveUrls[urlId], true);
		},false,window.spiderSlaveUrls[urlId]);

		return [urlId,-2];
	}else if(index == -1 && canRunTabs.length > 0) {
		//restore start time
		if (window.spiderSlaveTabInfos['allTabLocked']) {
			window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
			return [urlId,-2];
		}
		
		if(window.spiderSlaveUrls[urlId]) {
			window.spiderSlaveUrls[urlId]['runStartTime'] = 0;
		}

		for(var tabFlagIdx in canRunTabs) {
			urlId = getUrlInfo(undefined,window.lockTabFlagToTab[canRunTabs[tabFlagIdx]]);

			if (urlId == -1) {
				pullActions();
				continue;
			}

			tabFlag = canRunTabs[tabFlagIdx];
			break;
		}

		if (urlId == -1) {
			return [urlId, -2];
		}

		return [urlId,tabFlag];
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
			window.spiderSlaveUrls[urlId]['param']['lockTabFlag'] = lockTabFlag;
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
	window.spiderSlaveTabInfos['tabs'][tabId]['runStatus'] = 1;
	window.spiderSlaveTabInfos['tabs'][tabId]['iActiveTime'] = new Date().getTime();

	//try agin after 3min
	clearTimeout(window.setTimeout_checkIsDie[window.spiderSlaveTabInfos['tabs'][tabId].id]);
	window.setTimeout_checkIsDie[window.spiderSlaveTabInfos['tabs'][tabId].id] = setTimeout(function () {
		window.spiderSlaveTabInfos['tabs'][tabId]['runStatus'] = 0;
		clearInterval(window.setInterval_getHtml[window.spiderSlaveTabInfos['tabs'][tabId].id]);
		clearInterval(window.setInterval_waitToComplete[window.spiderSlaveTabInfos['tabs'][tabId].id]);
	}, 600000);

	dealOneAction(window.spiderSlaveTabInfos['tabs'][tabId], window.spiderSlaveUrls[urlId]);

	return new Promise(function(resolve,reject) {
		window.spiderSlaveTabInfos['tabs'][tabId]['doneResolve'] = resolve;
	});
}


function isDone(tab, info, isError) {
	window.spiderSlaveTabInfos['tabs'][tab.id]['iActiveTime'] = new Date().getTime();

	if(isError === undefined) {
		window.spiderSlaveTabInfos['tabs'][tab.id]['runStatus'] = 0;
		window.spiderSlaveDeletedUrls[info['id']] = new Date().getTime();
		delete window.spiderSlaveUrls[info['id']];
		if (window.spiderSlaveTabInfos['tabs'][tab.id]['doneResolve']) {
			window.spiderSlaveTabInfos['tabs'][tab.id]['doneResolve'](true);
		}
		clearTimeout(window.setTimeout_checkIsDie[tab.id]);
	}else{
		if(window.spiderSlaveUrls[info['id']]['runCount'] === undefined) {
			window.spiderSlaveUrls[info['id']]['runCount'] = 0;
		}
		window.spiderSlaveUrls[info['id']]['runCount']++;

		//try 5 times
		if(window.spiderSlaveUrls[info['id']]['runCount'] > 5) {
			ajaxPost({ 'admintype': 2, 'tab': {id:tab.id}, 'url': window.spiderSlaveApiCb, 'data': { 'id': info['id'], 'sResponse': 'ZmFsc2U=','sFlag': window.spiderSlaveFlag,'workCreateFlag':window.workCreateFlag } },function() {
				var clearInfo = function(tab,info) {
					if (window.spiderSlaveTabInfos['tabs'][tab.id]['doneResolve']) {
						window.spiderSlaveTabInfos['tabs'][tab.id]['doneResolve'](true);
					}
					window.spiderSlaveDeletedUrls[info['id']] = new Date().getTime();
					delete window.spiderSlaveUrls[info['id']];
					removeTabCb(tab.id);
					clearTimeout(window.setTimeout_checkIsDie[tab.id]);
				}

				if(getObjectLen(window.spiderSlaveTabInfos['wins']) > 1) {
					clearInfo(tab,info);
					chrome.tabs.remove(tab.id,function() {
					});
				}else{
					chrome.tabs.query({windowId:tab.windowId},function(tabs) {
						if(tabs && tabs.length > 1) {
							clearInfo(tab,info);
							chrome.tabs.remove(tab.id,function() {
							});
						}else{
							clearInfo(tab,info);
						}
					})
				}

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
	var resultIsOkCount = 0;
	window.setInterval_getHtml[tab.id] = setInterval(function () {
		resultIsOkCount++;
		if(resultIsOkCount > 6000) {
			clearInterval(window.setInterval_getHtml[tab.id]);
			isDone(tab, info, true);
			window.tabLocked[tab.id] = false;
			return ;
		}

		if(resultIsOkCount%600 === 0) {
			window.spiderSlaveTabInfos['tabs'][tab.id]['iActiveTime'] = new Date().getTime();
		}

		if(window.tabLocked[tab.id] === true) {
			return ;
		}
		window.tabLocked[tab.id] = true;

		sendMessageToTabs(tab, { 'actiontype': 1, 'info': info }, function (res) {
			window.tabLocked[tab.id] = false;
			if (res && res['actionComplete'] == true) {
				clearInterval(window.setInterval_getHtml[tab.id]);
				if(res['html'].indexOf("blob:") === 0){
					xhrPost(res['html'],undefined,function(resolve,reject,response){
						window.URL.revokeObjectURL(res['html']);
						res['html'] = response;
						cb(tab, info, res);
					},'json');
				}else{
					cb(tab, info, res);
				}
			}

			if(res === undefined) {
				clearInterval(window.setInterval_getHtml[tab.id]);
				isDone(tab, info, true);
			}
		});
	}, 100);
}

//try every 50 ms
function getHml(tab, info, result) {
	if(result === undefined) {
		var resultIsOkPromise = new Promise(function(resolve,reject) {
			resultIsOk(tab, info, function(tab, info, res) {
				resolve(res);
			});
		})
	}else{
		var resultIsOkPromise = new Promise(function(resolve,reject) {
			resolve({"html":result});
		})
	}

	resultIsOkPromise.then(function(res) {
		if (res && res['html'] && (!info.param || (info.param.save === undefined) || info.param.save)) {
			//sub save data
			if(!info['results']) {
				info['results'] = [];
			}

			if (res['html'] instanceof Array) {
				var htmls = res['html'];
				if(info['isEnd'] === true) {
					htmls = htmls.reverse();
				}
			}else{
				var htmls = [res['html']];
			}

			htmls.forEach(function(html){
				if(info['isEnd'] === true) {
					info['results'].unshift(html);
				}else{
					info['results'].push(html);
				}
			});
		}

		if(info['cb']) {
			info['cb'](info);
		}
		
		if(info['isEnd'] === true) {
			
			if(info['doneCheckActionPromiseResolve']) {
				info['doneCheckActionPromiseResolve']([info,((info.param && info.param.musave)?JSON.stringify(base64ToString(info['results'])):base64ToString(info['results'][info['results'].length-1]))]);
			}

			function maincb() {
				var sResponse = ((info.param && info.param.musave)?JSON.stringify(deleteBase64Pre(info['results'])):deleteBase64Pre(info['results'][info['results'].length-1]));
				var url = window.spiderSlaveApiCb;
				if(info.param && info.param.reportUrl) {
					url = info.param.reportUrl;
				}
				ajaxPost({ 'admintype': 2, 'tab': {id:tab.id}, 'url': url, 'data': { 'id': info['id'], 'sResponse': sResponse,'sFlag': window.spiderSlaveFlag,'workCreateFlag':window.workCreateFlag,'userDataPath':window.userDataPath,'userName':(window.userName?window.userName:'')} },function(data) {
					isDone(tab, info);
					if(data[0] === '{') {
						data = eval("("+data+")")
						if(data['cb'] != undefined) {
							eval(data['cb']);
						}

						if(data['data'] != undefined) {
							data['data'].forEach(function (v) {
								if (!window.spiderSlaveUrls[v['id']] && !window.spiderSlaveDeletedUrls[v['id']]) {
									window.spiderSlaveUrls[v['id']] = v;
								}
							});
						}
					}
				},function() {
					isDone(tab, info, true);
				});
			}

			if(info.param && info.param.lockTabFlag && window.helpmateEvents && window.helpmateEvents['done'] && window.helpmateEvents['done'][info.param.lockTabFlag]) {
				var doneCheckActions = window.helpmateEvents['done'][info.param.lockTabFlag];
				var doneCheckActionIndex = info['doneCheckActionIndex']!==undefined?(info['doneCheckActionIndex']+1):0;
				if(doneCheckActions.length > doneCheckActionIndex) {
					var doneCheckAction = $.extend(true, {}, doneCheckActions[doneCheckActionIndex]);

					if(doneCheckActionIndex === 0) {
						doneCheckAction['maincb'] = maincb
					}else{
						doneCheckAction['maincb'] = doneCheckActions[doneCheckActionIndex-1]['maincb'];
					}

					doneCheckAction['id'] = 'temp';
					doneCheckAction['doneCheckActionIndex'] = doneCheckActionIndex;
					doneCheckAction['isDoneCheckAction'] = true;
					if(doneCheckAction['param'] === undefined) {
						doneCheckAction['param'] = {};
					}
					if(doneCheckAction['param']['lockTabFlag'] === undefined) {
						doneCheckAction['param']['lockTabFlag'] = info.param.lockTabFlag;
					}

					var p = new Promise(function(resolve,reject) {
						doneCheckAction['doneCheckActionPromiseResolve'] = resolve;
						sendAction(tab, doneCheckAction, function(){
							runActionComplete(tab, doneCheckAction, function(tab, infoTemp) {
								runSub(tab, infoTemp, function(tab, infoTemp) {
									getHml(tab, infoTemp);
								},0)
							});
						});
					});
					
					p.then(function(data) {
						var info = data[0];
						var response = data[1];
						eval(info['then']);
					});
				}else{
					info['maincb']();
				}
			}else{
				maincb();
			}

		}
	});
}

function runActionComplete(tab,info,cb) {
	if(info.param && info.param.delay) {
		var delay = info.param.delay;
	}else{
		var delay = 50;
	}

	var maxRunTime = 0;
	if(info.param && info.param.maxRunTime) {
		maxRunTime = info.param.maxRunTime/100;
	}

	setTimeout(function () {
		window.tabLocked[tab.id] = false;
		clearInterval(window.setInterval_waitToComplete[tab.id]);
		var runActionCompleteRunCount = 0;
		window.setInterval_waitToComplete[tab.id] = setInterval(function () {
			runActionCompleteRunCount++;
			//try again after 35 seconds 
			if(runActionCompleteRunCount > 350) {
				clearInterval(window.setInterval_waitToComplete[tab.id]);
				isDone(tab, info, true);
				window.tabLocked[tab.id] = false;
				return ;
			}

			if(window.tabLocked[tab.id] === true) {
				return ;
			}

			//max run time
			if(maxRunTime > 0 && runActionCompleteRunCount > maxRunTime) {
				clearInterval(window.setInterval_waitToComplete[tab.id]);
				resultIsOk(tab, info, function(tab, info, res) {
					cb(tab,info);
				});
			}

			window.tabLocked[tab.id] = true;
			chrome.tabs.get(tab.id, function (nowTab) {
				window.tabLocked[tab.id] = false;

				if(nowTab === undefined) {
					clearInterval(window.setInterval_waitToComplete[tab.id]);
					isDone(tab, info, true);
				//max run time: 30 s
				}else if (nowTab.status == 'complete' || (runActionCompleteRunCount > 300)) {
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
			if (subInfo['type'] == 103) {
				var p = new Promise(function(resolve,reject) {
					chrome.windows.getCurrent(function(win) {
						subInfo['spiderSlaveHelpmateApi'] = window.spiderSlaveHelpmateApi;
						subInfo['spiderSlaveBaseInfo'] = {"left":win['left'],"offsetLeft":win['left']+window.baseInfo['leftWidth'],"top":win['top'],"offsetTop":win['top']+window.baseInfo['topHeight']};
						resolve(subInfo);
					})
				})
			}else{
				var p = new Promise(function(resolve,reject) {
					resolve(subInfo);
				})
			}

			p.then(function(subInfo) {
				if(subInfo.param && subInfo.param.predelay) {
					var timeout = new Promise(function(resolve,reject) {
						setTimeout(function() {
							resolve(1);
						},subInfo.param.predelay)
					});
				}else{
					var timeout = new Promise(function(resolve,reject) {
							resolve(1);
					});
				}

				timeout.then(function() {
					subInfo['pinfo'] = info;
					//run action
					sendAction(tab, subInfo, function(result) {
						runActionComplete(tab, info, function(tab, info) {
							if(subInfo.param && subInfo.param.saveas) {
								if(info['saveas'] === undefined) {
									info['saveas'] = {};
								}
								info['saveas'][subInfo.param.saveas] = subInfo[subInfo.param.saveas];
							}

							if(subInfo.param && subInfo.param.save) {
								subInfo['isEnd'] = false;
								if(info['results']) {
									subInfo['results'] = info['results'];
								}
								subInfo['cb'] = function(subInfo) {
									info['results'] = subInfo['results'];
									runSub(tab, info, cb, index);
								}.bind(this);
		
								getHml(tab, subInfo, result);
							}else{
								runSub(tab, info, cb, index);
							}
						});
					});
				});
			});
		}
	}else{
		info['isEnd'] = true;
		cb(tab, info);
	}
};

function sendAction(tab, info, cb) {
	//200 background action do not need send to tab run
	if(info['pinfo']) {
		info['saveas'] = info['pinfo']['saveas'];
		delete info['pinfo'];
	}

	if(info.param && info.param.preeval) {
		eval(info.param.preeval);
	}

	if(info.type === 200) {
		if(info.param && info.param.delay) {
			setTimeout(function(){
				eval(info.action+'(tab, info, function(result){cb(result)});');
			},info.param.delay);
		}else{
			eval(info.action+'(tab, info, function(result){cb(result)});');
		}
	}else{
		sendMessageToTabs(tab, { 'actiontype': 2, 'info': info },function() {
			cb();
		});
	}
}

function dealOneAction(tab, info, needJump) {
	if(window.spiderSlaveActionCountChangeUser > 0 && window.spiderSlaveHelpmate) {
		window.spiderSlaveRunActionCount++;
		if(window.spiderSlaveRunActionCount > window.spiderSlaveActionCountChangeUser) {
			window.spiderSlaveRunActionCount = 0;

			workPause();

			if(window.spiderSlavePerDayMaxRunTimes > 0) {
				var now = new Date();
				var Ymd = formatDate('Ymd',now.getTime());
				if(window.spiderSlaveStackRunActionCount[Ymd] === undefined) {
					window.spiderSlaveStackRunActionCount[Ymd] = 0;
				}else{
					var oldCount = window.spiderSlaveStackRunActionCount[Ymd];
					window.spiderSlaveStackRunActionCount = {};
					window.spiderSlaveStackRunActionCount[Ymd] = oldCount;
				}
				window.spiderSlaveStackRunActionCount[Ymd] += 1;
				chrome.storage.local.set({'spiderSlaveStackRunActionCount':window.spiderSlaveStackRunActionCount});
				if(window.spiderSlaveStackRunActionCount[Ymd] > window.spiderSlavePerDayMaxRunTimes) {
					PauseNowUser(undefined,{'pauseMs':strtotime(formatDate('Y-m-d',now.getTime())+' 00:00')+86400 - parseInt(now.getTime()/1000)});
					return;
				}
			}

			ReplaceNowUser();
			return ;
		}
	}

	if(window.spiderSlavePerDayMaxRunTimes > 0) {
		var now = new Date();
		var Ymd = formatDate('Ymd',now.getTime());
		if(window.spiderSlaveStackRunActionCount[Ymd] === undefined) {
			window.spiderSlaveStackRunActionCount[Ymd] = 0;
		}else{
			var oldCount = window.spiderSlaveStackRunActionCount[Ymd];
			window.spiderSlaveStackRunActionCount = {};
			window.spiderSlaveStackRunActionCount[Ymd] = oldCount;
		}
		window.spiderSlaveStackRunActionCount[Ymd] += 1;
	}

	// 1:a(jump and get data)
	//2:js,4:css,8:image,16:others(ajax get data by get method)
	//100:block run js,101:ajax,
	//102:scroll
	//200:some browser extension func
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
		200: "browser action"
	};

	function actionDoneCb(result) {
		switch(info.type) {
			case 1:
			case 101:
			case 200:
				runActionComplete(tab, info, function(tab, info) {
					runSub(tab, info, function(tab, info) {
						getHml(tab, info, result);
					},0)
				});
				break;
			default:
				setTimeout(function () {
					runSub(tab, info, function(tab, info) {
						getHml(tab, info, result);
					})
				}, 100);
				break;
		}
	}

	actionRecords(info['url'], typesToName[info['type']]);

	window.tabUrlIds[tab.id] = info['id'];
	if (!needJump) {//jump
		sendAction(tab, info, actionDoneCb);
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
				ajaxPost({ 'admintype': 2, 'tab': tab, 'url': window.spiderSlaveApiCb, 'data': { 'id': window.tabUrlIds[tab.id], 'sResponse': req.html } });
				window.tabUrlIds[tab.id] = undefined;
			}
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
	console.log(pre, obj);
}

function ajaxPost(request,cb,errorcb) {
	$.ajax({
		type: 'POST',
		url: request.url,
		data: request.data,
		success: function(data){
			if(typeof(data) == 'string') {
				actionRecords(request.url +' :'+data.substr(0,50), 'BACKEND AJAX', 'POST DATA');
			}else{
				actionRecords(request.url +' :'+JSON.stringify(data).substr(0,50), 'BACKEND AJAX', 'POST DATA');
			}

			if(cb !== undefined) {
				cb(data);
			}
		},
		error: function (xhr, textStatus, errorThrown) {
			if(errorcb !== undefined) {
				errorcb();
			}
		}
	});
}

function actionRecords(message, title, type) {
	if(window.MDspiderLogs === undefined) {
		window.MDspiderLogs = {};
	}

	if(type === undefined) {
		type = 'ACTIONS LOG';
	}

	if(window.MDspiderLogs[type] === undefined) {
		window.MDspiderLogs[type] = [];
	}

	if(window.MDspiderLogs[type].length > 50) {
		window.MDspiderLogs[type].shift();
	}

	window.MDspiderLogs[type].push({title:title,message:message,time:new Date()})
}

if(window.userName) {
	var contextMenusTitle = '更新用户为：“%s”';
}else{
	var contextMenusTitle = '记录用户为：“%s”';
}
chrome.contextMenus.create({
	title: contextMenusTitle,
	contexts: ['selection'],
	onclick: function(params){
		window.userName = params['selectionText'];
		chrome.storage.local.set({'userName': window.userName});
	}
});