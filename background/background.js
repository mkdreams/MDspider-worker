window.spiderSlaveTabInfos = { 'allTabLocked': false, 'api': {}, 'tabs': {}, 'wins':{} };
window.spiderSlaveUrls = {};
window.spiderSlaveDeletedUrls = {};
window.setInterval_getHtml = {};
window.setInterval_waitToComplete = {};
window.tabLocked = {};
window.setTimeout_checkIsDie = {};
window.tabUrlIds = {};
window.baseWindow = undefined;
window.lockTabFlagToTab = {};
window.tabError = {};
window.tabRemovedPending = {};

//定位 "Unchecked runtime.lastError"（例如 No tab with id: x）来源：在被调用的 chrome.tabs 回调开头加 logTabApiError('标记', tabId)
//读取 lastError 后浏览器就不再打 Unchecked 警告，定位完成后把调用删掉即可
function logTabApiError(site, tabId) {
	if(chrome.runtime.lastError) {
		console.warn("[tabApiError]", site, "tabId:"+tabId, "->", chrome.runtime.lastError.message);
	}
}

window.setInterval_getLinksCache_lastRunTime = new Date().getTime();

if(window.spiderSlavePerDayMaxRunTimesFrequencyRang === undefined) {
	window.spiderSlavePerDayMaxRunTimesFrequencyRang = 86400;
}

//active time
window.spiderSlaveActiveLastTime = [0,0];
window.spiderSlaveActiveLastTime[0] = window.spiderSlaveActiveLastTime[1] = parseInt(new Date().getTime()/1000);

// 1-create inti 2-reopen init
window.spiderSlaveInitStatus = 0;

window.debug = false;

window.helpmateEvents = {
    "create": [],
    "open": [],
    "done": {
	},
	"check": []
};

window.baseInfo = {};
setTimeout(function() {
		initDeviceInfo(function(){
			//init and create api tab
			if(window.debug) {
				console.warn("Debug模式：只打开浏览器并做初始化，不执行任务")
			}
			if(!window.spiderSlaveHelpmate) {
				console.warn("单机模式：不会自动开关浏览器")
			}

			//init run Frequency
			var frequencyTemp = (window.spiderSlavePerDayMaxRunTimes+"").split('/');
			window.spiderSlavePerDayMaxRunTimes = parseInt(frequencyTemp[0]);
			if(frequencyTemp[1]) {
				window.spiderSlavePerDayMaxRunTimesFrequencyRang = parseInt(frequencyTemp[1]);
			}

			if(window.spiderSlaveOn === true && !window.debug) {
				workPlay();
			}
		});
},3000);

function initDeviceInfo(cb) {
	loadConfig(function() {
		chrome.system.display.getInfo(function(info) {
			chrome.windows.getCurrent(function(win) {
				window.spiderSlaveTabInfos['wins'][win.id] = win;
				window.spiderSlaveTabInfos['wins'][win.id]['useTabs'] = {};

				chrome.tabs.query({windowId:win.id},function(tabs) {
					if(window.spiderSlaveHelpmate) {
						var syncProfile = new Promise(function(resolve,reject) {
							tabs.forEach(tab => {
								var title = tab['title'];

								if(title.indexOf('MDspider') > -1) {
									var userDataPath = getQueryString(title,'profile');
									if(userDataPath !== undefined) {
										window['userDataPath'] = userDataPath;
										chrome.storage.local.set({'userDataPath':window['userDataPath']});
									}

									var workCreateFlag = getQueryString(title,'sWorkCreateFlag');
									if(window['workCreateFlag'] === undefined || (workCreateFlag != undefined && window['workCreateFlag'] !== workCreateFlag)) {
										if(workCreateFlag === undefined) {
											workCreateFlag = randomStr();
										}

										window['workCreateFlag'] = workCreateFlag;
										chrome.storage.local.set({'workCreateFlag':window['workCreateFlag']});
									}

									var spiderSlaveFlag = getQueryString(title,'slaveFlag');
									if(spiderSlaveFlag !== undefined) {
										window['spiderSlaveFlag'] = spiderSlaveFlag;
										chrome.storage.local.set({'spiderSlaveFlag':window['spiderSlaveFlag']});
									}

									var spiderReqSlaveFlag = getQueryString(title,'reqSlaveFlag');
									if(spiderReqSlaveFlag === undefined) {
										spiderReqSlaveFlag = spiderSlaveFlag;
									}
									if(spiderReqSlaveFlag !== undefined) {
										window['spiderReqSlaveFlag'] = spiderReqSlaveFlag;
										chrome.storage.local.set({'spiderReqSlaveFlag':window['spiderReqSlaveFlag']});
									}

									var debug = getQueryString(title,'debug');
									if(debug !== undefined && debug === "1") {
										window['debug'] = true;
									}

									window['sEvents'] = getQueryString(title,'sEvents');
									if(window['sEvents'] !== undefined) {
										window['sEvents'] = base64ToString(window['sEvents']);
									}
									pingUser()
								}
							});

							if(window['sEvents'] !== undefined) {
								xhrPost(window['sEvents'],{},undefined,'json').then(function(sEvents){
									if(sEvents['create']) {
										window.helpmateEvents['create'] = sEvents['create'];
									}
									if(sEvents['open']) {
										window.helpmateEvents['open'] = sEvents['open'];
									}
									if(sEvents['done']) {
										window.helpmateEvents['done'] = sEvents['done'];
									}
									if(sEvents['check']) {
										window.helpmateEvents['check'] = sEvents['check'];
									}
									if(sEvents['config']) {
										for(var key in sEvents['config']) {
											window[key] = sEvents['config'][key];
										}
									}
									resolve(true);
								});
							}else{
								wsPost({
									id:4,
									method:"Robot.Events",
									params:[window.workCreateFlag]
								},undefined,'json').then(function(data){
									if (data.Data.indexOf("{") === 0) {
										window.helpmateEvents = JSON.parse(convertBackticksToEscapedQuotes(data.Data));
										if(window.helpmateEvents['create'] === undefined) {
											window.helpmateEvents['create'] = [];
										}

										if(window.helpmateEvents['open'] === undefined) {
											window.helpmateEvents['open'] = [];
										}
									}
									resolve(true);
								});
							}
							
						});

						syncProfile.then(function() {
							data = window.helpmateEvents['create'];
							if(data.length === 0 || (window.spiderSlaveInitStatus & 1) === 1){
								var subP = new Promise(function(resolve,reject) {
									resolve(true);
								});
							}else{
								data.forEach(function (v) {
									if (!window.spiderSlaveUrls[v['id']]) {
										window.spiderSlaveUrls[v['id']] = v;
									}
								});

								var subP = new Promise(function(resolve,reject) {
									workPlay(function() {
										resolve(true);
									});
								});
							}

							return subP;
						// open
						}).then(function() {
							window.spiderSlaveInitStatus = window.spiderSlaveInitStatus | 1;
							chrome.storage.local.set({'spiderSlaveInitStatus':window.spiderSlaveInitStatus});

							data = window.helpmateEvents['open'];

							if(data.length === 0){
								var subP = new Promise(function(resolve,reject) {
									resolve(true);
								});
							}else{
								data.forEach(function (v) {
									if (!window.spiderSlaveUrls[v['id']]) {
										window.spiderSlaveUrls[v['id']] = v;
									}
								});

								var subP = new Promise(function(resolve,reject) {
									workPlay(function() {
										resolve(true);
									});
								});
							}

							return subP;
						}).then(function(data) {
							window.spiderSlaveInitStatus = window.spiderSlaveInitStatus | 2;
							
							cb & cb();
						});
					}else{
						if(window['workCreateFlag'] === undefined) {
							workCreateFlag = randomStr();
							window['workCreateFlag'] = workCreateFlag;
							chrome.storage.local.set({'workCreateFlag':window['workCreateFlag']});
						}
						window.spiderSlaveInitStatus = 3;
						cb & cb();
					}
				})
			});
		});
	});
}

function loadConfig(cb) {
	chrome.storage.local.get(null, function(result) {
		var promiseArr = [];

		for(var key in result) {
			window[key] = result[key];

			if(key === "spiderSlaveUrls") {
				console.log("key",key,result[key]);
				for (const urlId in window.spiderSlaveUrls) {
						window.spiderSlaveUrls[urlId]['runStartTime'] = undefined;
				}

				chrome.storage.local.remove(key);
			}

			if(key === "spiderSlaveTabInfos") {
				console.log("key",key,result[key]);
				for (const tabId in window.spiderSlaveTabInfos['tabs']) {
					var id = window.spiderSlaveTabInfos['tabs'][tabId]['id'];
					var p = new Promise(function(resolve,reject) {
						chrome.tabs.remove(id,function(){
							logTabApiError('resetTabs.remove', id);
							resolve(1);
						});
					});
					promiseArr.push(p);
				}

				window.spiderSlaveTabInfos = { 'allTabLocked': false, 'api': {}, 'tabs': {}, 'wins':{} };

				chrome.storage.local.remove(key);
			}
		}

		if(window['spiderReqSlaveFlag'] === undefined && window['spiderSlaveFlag'] !== undefined) {
			window['spiderReqSlaveFlag'] = window['spiderSlaveFlag'];
		}

		//清理浏览记录
		var p = new Promise(function(resolve,reject) {
			chrome.history.deleteAll(function() {
				resolve(1);
			});
		});
		promiseArr.push(p);

		Promise.all(promiseArr).then((result) => {
			cb && cb();
		});
	});
}

function closeUnusedTabs(cb) {
	var keepTabIds = {};

	if(window.spiderSlaveTabInfos && window.spiderSlaveTabInfos['tabs']) {
		for (var tabId in window.spiderSlaveTabInfos['tabs']) {
			keepTabIds[tabId] = true;
		}
	}

	chrome.tabs.query({}, function (tabs) {
		var httpTabs = [], closeTabIds = [], hasNonHttpTab = false;

		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			if (tab.url && tab.url.indexOf('http') === 0) {
				httpTabs.push(tab);
				if (!keepTabIds[tab.id]) {
					closeTabIds.push(tab.id);
				}
			} else {
				hasNonHttpTab = true;
			}
		}

		//最少保留一个：所有 http tab 都无记录且没有其他非 http tab 时，保留一个不关
		if (closeTabIds.length === httpTabs.length && httpTabs.length > 0 && !hasNonHttpTab) {
			closeTabIds.pop();
		}

		if (closeTabIds.length > 0) {
			chrome.tabs.remove(closeTabIds, function () {
				logTabApiError('closeUnusedTabs.remove', closeTabIds.join(','));
				cb && cb();
			});
		} else {
			cb && cb();
		}
	});
}

function autoCreateTab(url, cb, useBaseWindow, urlInfo) {
	function createOneTab(newWin, tabId) {
		closeUnusedTabs(function () {
			createOneTabInner(newWin, tabId);
		});
	}

	function createOneTabInner(newWin, tabId) {
		var tabOption = { 'url': url };
		if (newWin) {
			tabOption['windowId'] = newWin.id;
		}

		if (tabId) {
			chrome.tabs.get(tabId, function (tab) {
				logTabApiError('createOneTabInner.get', tabId);
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
					logTabApiError('createOneTabInner.update.get', tab.id);
					cb && cb(tab);
				});
			});
		} else {
			chrome.tabs.create(tabOption, function (tab) {
				logTabApiError('createOneTabInner.create', tabOption && tabOption.windowId);
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
					logTabApiError('createOneTabInner.update.create', tab.id);
					cb && cb(tab);
				});
			});
		}
	}

	if (useBaseWindow) {
		createOneTab();
		return ;
	}

	if(getObjectLen(window.spiderSlaveTabInfos['wins']) < window.spiderSlaveWinCount) {
		chrome.windows.create({ focused: true, state: 'normal', 'url': url}, function (newWin) {
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
	//tab 创建过程中（allTabLocked）不执行移除逻辑，等创建流程结束后再补执行，避免清理完 tab 又被登记回 tabs
	console.log('allTabLocked',window.spiderSlaveTabInfos['allTabLocked']);
	if(window.spiderSlaveTabInfos['allTabLocked'] === true) {
		window.tabRemovedPending[tabId] = new Date().getTime();
		return ;
	}

	removeTabCbInner(tabId);
}

//allTabLocked 释放后补执行挂起的移除
function flushRemovedTabs() {
	if(window.spiderSlaveTabInfos['allTabLocked'] === true) {
		return ;
	}

	for (var tabId in window.tabRemovedPending) {
		delete window.tabRemovedPending[tabId];
		removeTabCbInner(tabId);
	}
}

function removeTabCbInner(tabId) {
	if(window.tabError[tabId]) {
		delete window.tabError[tabId];
	}

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
	// if(window.tabError[tabId] === undefined) {
	// 	window.tabError[tabId] = "tab closed";
	// }
}

//stop content-security-policy
chrome.tabs.onCreated.addListener(function(tab) {
	var tabId = tab.id;
	var addRules = [],removeRuleIds = [];
	addRules.push({
		id:tabId,
		action: {
		  type: 'modifyHeaders',
		  responseHeaders: [{ header: 'content-security-policy', operation: 'set', value: '' },{ header: 'content-security-policy-report-only', operation: 'set', value: '' }]
		},
		condition: {urlFilter: '*', resourceTypes: ['main_frame', 'sub_frame']}
	});

	chrome.declarativeNetRequest.updateSessionRules({addRules, removeRuleIds})
});

function workPlay(allCompeletedCb) {
	window.spiderSlaveTabInfos['allTabLocked'] = false;
	window.spiderReqSlaveFlagArr = window.spiderReqSlaveFlag.split(',');
	
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

	websocketKeep("pullactionws");

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
	if(timestamp - window.setInterval_getLinksCache_lastRunTime > window.spiderSlaveGetUrlsDelay && window.spiderSlaveInitStatus == 3) {
		window.setInterval_getLinksCache_lastRunTime = timestamp;
		window.spiderReqSlaveFlagArr.forEach(function(sFlag) {
			ajaxPost({ 'admintype': 1, 'url': window.spiderSlaveApiActionList, 'data': { 'sFlag': sFlag,'workCreateFlag':window.workCreateFlag } },function(data) {
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
		});
	}
}

window["parseAction"] = function(data) {
	v = JSON.parse(data);
	if (!v["type"]) {
		v["type"] = 1;
	}

	if (v['id'] == 0) {
		v['id'] = randomStr();
	}else{
		v['id'] = ""+v['id'];
	}

	if (v["param"]) {
		for(var key in v["param"]) {
			if (v["param"][key] === "") {
				delete v["param"][key];
			}
		}
	}

	if (v["param"] && v["param"]["sync"] === "1") {
		var p = new Promise(function(resolve,reject) {
			v['parseActionPromiseResolve'] = resolve;
		});
	}else{
		var p = new Promise(function(resolve,reject) {
			resolve([v,'ok']);
		});
	}


	if (!window.spiderSlaveUrls[v['id']] && !window.spiderSlaveDeletedUrls[v['id']]) {
		console.log("parseAction",v);
		window.spiderSlaveUrls[v['id']] = v;
	}else{
		var p = new Promise(function(resolve,reject) {
			resolve([v,'Repeat req']);
		});
	}

	return p;
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
					logTabApiError('tryCloseTab.remove', j);
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

		if(!window.spiderSlaveUrls[urlId] || [1,107].indexOf(window.spiderSlaveUrls[urlId]['type']) == -1) {
			//get one a,or get cookies url
			urlId = getUrlInfo([1,107]);
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
			flushRemovedTabs();

			//record lock tab info
			getLockTabId(urlId,tab.id)

			dealOneAction(tab, window.spiderSlaveUrls[urlId], true);
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
		if(window.spiderSlaveUrls[urlId]['param']['lockTabFlag'] !== undefined) {
			var lockTabFlag = window.spiderSlaveUrls[urlId]['param']['lockTabFlag'];
		}else{
			var res = window.spiderSlaveUrls[urlId]['url'].match(/^(http|https)\:\/\/([^\/$]+?)(?=[\/|$])/g);
			if(res && res[1]) {
				var lockTabFlag = res[1];
			}else{
				var lockTabFlag = 'tempLockTabFlag';
			}
			window.spiderSlaveUrls[urlId]['param']['lockTabFlag'] = lockTabFlag;
		}


		if(lockTabFlag === "") {
			return false;
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
	if(window.spiderSlaveTabInfos['tabs'][tab.id]) {
		window.spiderSlaveTabInfos['tabs'][tab.id]['iActiveTime'] = new Date().getTime();
	}

	if(window.spiderSlaveUrls[info['id']] === undefined) {
		return ;
	}

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

		var maxErrorCount = 5;
		if(info && info.param && info.param.maxErrorCount !== undefined) {
			maxErrorCount = info.param.maxErrorCount;
		}

		//try times
		if(window.spiderSlaveUrls[info['id']]['runCount'] > maxErrorCount) {
			ajaxPost({ 'admintype': 2, 'tab': {id:tab.id}, 'url': window.spiderSlaveApiCb, 'data': { 'id': info['id'], 'sResponse': 'ZmFsc2U=','sFlag': window.spiderSlaveFlag,'workCreateFlag':window.workCreateFlag } },function() {
				var clearInfo = function(tab,info) {
					if (window.spiderSlaveTabInfos['tabs'][tab.id] && window.spiderSlaveTabInfos['tabs'][tab.id]['doneResolve']) {
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
						logTabApiError('clearInfo.remove.win>1', tab.id);
					});
				}else{
					chrome.tabs.query({windowId:tab.windowId},function(tabs) {
						if(tabs && tabs.length > 1) {
							clearInfo(tab,info);
							chrome.tabs.remove(tab.id,function() {
								logTabApiError('clearInfo.remove.win>1.query', tab.id);
							});
						}else{
							clearInfo(tab,info);
						}
					})
				}

			});
		}else{
			if(window.spiderSlaveTabInfos['tabs'][tab.id]) {
				window.spiderSlaveTabInfos['tabs'][tab.id]['runStatus'] = 0;
			}

			//关闭完成后才释放任务，避免旧tab未关时任务被重复选中
			var releaseTask = function() {
				if(window.spiderSlaveUrls[info['id']]) {
					window.spiderSlaveUrls[info['id']]['runStartTime'] = undefined;
				}
			};

			//关tab失败（tab已不存在、参数非法等）也要释放任务，否则任务会一直卡到超时才重试
			var removeTabAndRelease = function() {
				try {
					chrome.tabs.remove(tab.id, function() {
						if(chrome.runtime.lastError) {
							console.warn("close tab error[tab:"+tab.id+"]:", chrome.runtime.lastError.message);
						}

						releaseTask();
					});
				}catch(e) {
					console.warn("close tab error[tab:"+tab.id+"]:", e);
					releaseTask();
				}
			};

			if(getObjectLen(window.spiderSlaveTabInfos['wins']) > 1) {
					removeTabAndRelease();
			}else{
				chrome.tabs.query({windowId:tab.windowId},function(tabs) {
					if(tabs && tabs.length > 1) {
						removeTabAndRelease();
					}else{
						//最后一个tab不能关闭，任务仍需释放，否则无法重试
						releaseTask();
					}
				});
			}
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
						res['html'] = response;
						cb(tab, info, res);
					},'json');
				}else{
					cb(tab, info, res);
				}
			}

			if(res === undefined) {
				if(info && info.param && info.param.skipRecaptcha) {
					clearInterval(window.setInterval_getHtml[tab.id]);
					cb(tab, info, res);
				}else{
					clearInterval(window.setInterval_getHtml[tab.id]);
					isDone(tab, info, true);
				}
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
				if(!info['results']) {
					info['results'] = [];
				}
				info['doneCheckActionPromiseResolve']([
					info,
					((info.param && info.param.musave)?JSON.stringify(base64ToString(info['results'])):base64ToString(info['results'][info['results'].length-1]??'')),
					tab,
					((info.param && info.param.musave)?deleteBase64Pre(info['results']):deleteBase64Pre(info['results'][info['results'].length-1])),
				]);
				return;
			}

			if(info['parseActionPromiseResolve']) {
				if(!info['results']) {
					info['results'] = [];
				}
				info['parseActionPromiseResolve']([info,((info.param && info.param.musave)?JSON.stringify(base64ToString(info['results'])):base64ToString(info['results'][info['results'].length-1]??'')),tab]);
			}

			function maincb() {
				var sResponse = ((info.param && info.param.musave)?JSON.stringify(deleteBase64Pre(info['results'])):deleteBase64Pre(info['results'][info['results'].length-1]));
				var url = window.spiderSlaveApiCb;
				if(info.param && info.param.reportUrl) {
					url = info.param.reportUrl;
				}

				if(info.isDebugRun === true) {
					console.warn(info['id'], "sResponse", info['results']);
				}

				ajaxPost({ 'admintype': 2, 'tab': {id:tab.id}, 'url': url, 'data': { 'id': info['id'], 'sResponse': uint8ArrayToBlob(pako.gzip(sResponse)),'sFlag': window.spiderSlaveFlag,'workCreateFlag':window.workCreateFlag,'userDataPath':window.userDataPath,'userName':(window.userName?window.userName:'')} },async function(data) {
					isDone(tab, info);
					if(typeof(data) == 'string' && data[0] === '{') {
						data = JSON.parse(convertBackticksToEscapedQuotes(data));
					}
					
					if(data['cb'] != undefined) {
						await myEval(data['cb'],{});
					}

					if(data['data'] != undefined) {
						data['data'].forEach(function (v) {
							if (!window.spiderSlaveUrls[v['id']] && !window.spiderSlaveDeletedUrls[v['id']]) {
								window.spiderSlaveUrls[v['id']] = v;
							}
						});
					}
				},function() {
					isDone(tab, info, true);
				});
			}

			if(info.param && info.param.lockTabFlag && window.helpmateEvents && window.helpmateEvents['done'] && window.helpmateEvents['done'][info.param.lockTabFlag]) {
				var doneCheckActions = window.helpmateEvents['done'][info.param.lockTabFlag];
				function doneForEach() {
					var doneCheckActionIndex = info['doneCheckActionIndex'] = info['doneCheckActionIndex']!==undefined?(info['doneCheckActionIndex']+1):0;
					if(doneCheckActions.length > doneCheckActionIndex) {
						// var doneCheckAction = $.extend(true, {}, doneCheckActions[doneCheckActionIndex]);
						var doneCheckAction = JSON.parse(JSON.stringify(doneCheckActions[doneCheckActionIndex]));
						
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
						
						p.then(async function(data) {
							var info = data[0];
							var response = data[1];
							await myEval(info['then'],{info,response});
							doneForEach();
						});
					}else{
						maincb();
					}
				}

				doneForEach();
			}else{
				maincb();
			}

		}
	});
}

function runActionComplete(tab,info,cb) {
	//存在请求头记录，马上执行一次
	if(info.param && info.param.requestHeaderFilter) {
		if(window.spiderSlaveTabInfos['tabs'][tab.id]) {
			window.spiderSlaveTabInfos['tabs'][tab.id]['contentReadyCb'] = function () {
				sendMessageToTabs(tab, { 'actiontype': 4, 'info': info });
			};
		}
	}

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
				logTabApiError('resultIsOkWaitComplete.get', tab.id);
				window.tabLocked[tab.id] = false;

				if(nowTab === undefined) {
					clearInterval(window.setInterval_waitToComplete[tab.id]);
					isDone(tab, info, true);
				//max run time: 30 s
				}else if (nowTab.status == 'complete' || (runActionCompleteRunCount > 300)) {
					clearInterval(window.setInterval_waitToComplete[tab.id]);

					//check recaptcha
					if(info.param && info.param.skipRecaptcha) {
						var pRecaptcha = new Promise(function(resolve,reject) {
							resolve(true);
						});
					}else{
						var pRecaptcha = new Promise(function(resolve,reject) {
							if(info.isEnd) {
								resultIsOk(nowTab, info, function(nowTab, info, res) {
									recaptcha(resolve,nowTab,info,res);
								});
							}else{
								resolve(true);
							}
						});
					}

					pRecaptcha.then((r)=>{
						if(r === true) {
							resultIsOk(nowTab, info, function(nowTab, info, res) {
								cb(nowTab,info);
							});
						}
					});

				}
			});
		}, 100);
	}, delay);
};

function recaptcha(resolve,tab,info,res) {
	let doneCheckAction = {
		"url":"return '<'+window.location.href+'>'+document.getElementsByTagName('html')[0].innerHTML;",
		"type":100,
		"param": {
			"skipRecaptcha":true,
			"background":true,
		}
	};
        
	new Promise(function(doneCheckActionPromiseResolve,reject) {
		doneCheckAction['doneCheckActionPromiseResolve'] = doneCheckActionPromiseResolve;
		sendAction(tab, doneCheckAction, function(){
			runActionComplete(tab, doneCheckAction, function(tab, infoTemp) {
				runSub(tab, infoTemp, function(tab, infoTemp) {
					getHml(tab, infoTemp);
				},0)
			});
		});
	}).then(async function(data) {
		var response = data[1];

		var checked = false;
		for(var i in window.helpmateEvents['check']) {
			var checkActionInfo = window.helpmateEvents['check'][i];
			if(await myEval(checkActionInfo['match'],{data,response})) {
				console.log('check '+checkActionInfo['name']);
				checked = true;
				return new Promise(function(doneCheckActionPromiseResolve,reject) {
					checkActionInfoSubTemp = checkActionInfo['sub'];
					for(var subIdx in checkActionInfoSubTemp) {
						checkActionInfoSubTemp[subIdx]['recaptchaPInfo'] = {"url":info.url};
					}
					var infoTemp = {
						"doneCheckActionPromiseResolve": doneCheckActionPromiseResolve,
						"param": {
							"skipRecaptcha":true,
							"sub":checkActionInfoSubTemp
						}
					};
	
					runSub(tab, infoTemp, function(tab, infoTemp) {
						isDone(tab, info, true);
						resolve(false);
						console.log('check '+checkActionInfo['name']+' end!',tab.id, info.id);
					},0);
				});
			}
		}

		if(checked === false) {
			console.log('check default');
			resolve(true);
		}
	});
}

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
						subInfo['spiderSlaveFlag'] = window.spiderSlaveFlag;
						subInfo['workCreateFlag'] = window.workCreateFlag;
						subInfo['spiderSlaveHelpmateApi'] = window.spiderSlaveHelpmateApi;
						subInfo['spiderSlaveBaseInfo'] = {"left":win['left'],"top":win['top'],"width":win['width'],"height":win['height']};
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
						if(subCount === index) {
							info['isEnd'] = true;
						}

						runActionComplete(tab, info, function(tab, info) {
							if(subInfo.param && subInfo.param.saveas) {
								if(info['saveas'] === undefined) {
									info['saveas'] = {};
								}
								info['saveas'][subInfo.param.saveas] = result;
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
	if(!info.id) {
		info.id = randomStr();
	}

	//200 background action do not need send to tab run
	if(info['pinfo']) {
		info['saveas'] = info['pinfo']['saveas'];
		delete info['pinfo'];
	}

	info.windowId = tab['windowId'];
	//200 run 内置函数
	//201 run js
	if(info.type === 200) {
		if(info.param && info.param.delay) {
			setTimeout(function(){
				window[info.action](tab, info, function(result){cb(result)});
			},info.param.delay);
		}else{
			window[info.action](tab, info, function(result){cb(result)});
		}
	}else if(info.type === 201) {
		if(info.param && info.param.delay) {
			setTimeout(function(){
				runAction201(tab,info,cb);
			},info.param.delay);
		}else{
			runAction201(tab,info,cb);
		}
	}else if(info.type === 107) {
			runAction107(tab,info,cb);
	}else{
		sendMessageToTabs(tab, { 'actiontype': 2, 'info': info },function() {
			cb();
		});
	}
}

async function runAction201(tab,info,cb) {
	var r = await myEval(info.url,{tab,info,cb});
		if(isPromise(r)) {
			r.then((result)=>{
				cb(result);
			});
		}else{
			cb(r);
		}
}

// ---------- action 107: 通过 CDP(Network/Runtime) 采集页面资源，替代原 DevTools 面板 ----------
// 返回给 cb 的数组结构/过滤规则与 devtools/devtools.js 完全一致：
// {startedDateTime, request(HAR), content, response(HAR), resourceType, renderedContent?, currentUrl?, characterSet?, getBetchSelectorByTextsResult?}

function cdp107LastError() {
	return (chrome.runtime.lastError && chrome.runtime.lastError.message) || "";
}

function cdp107Send(tabId, method, params) {
	return new Promise(function(resolve, reject) {
		chrome.debugger.sendCommand({ 'tabId': tabId }, method, params || {}, function(result) {
			var err = cdp107LastError();
			if(err) {
				reject(new Error(method + ": " + err));
				return ;
			}
			resolve(result);
		});
	});
}

//返回 true 表示由本次流程 attach；false 表示复用扩展内其他流程（如 screenshot）已建立的会话
function cdp107Attach(tabId) {
	return new Promise(function(resolve, reject) {
		chrome.debugger.attach({ 'tabId': tabId }, "1.3", function() {
			var err = cdp107LastError();
			if(!err) {
				resolve(true);
				return ;
			}

			//扩展内其他流程已附加时 attach 也会报这个错；用无害命令探测：
			//能执行说明是我们自己的会话可以复用，否则是 DevTools/其他扩展占用
			if(/Another debugger is already attached/i.test(err)) {
				chrome.debugger.sendCommand({ 'tabId': tabId }, 'Runtime.evaluate', { 'expression': '1' }, function() {
					var probeErr = cdp107LastError();
					if(probeErr) {
						reject(new Error(err + " (" + probeErr + ")"));
					}else{
						resolve(false);
					}
				});
				return ;
			}

			reject(new Error(err));
		});
	});
}

var cdp107SelectorSourcePromise = null;
function cdp107GetSelectorSource() {
	if(cdp107SelectorSourcePromise === null) {
		cdp107SelectorSourcePromise = fetch(chrome.runtime.getURL('content/selector.js')).then(function(resp) {
			return resp.text();
		});
	}
	return cdp107SelectorSourcePromise;
}

function cdp107HeaderList(headers) {
	var list = [];
	for (var name in (headers || {})) {
		list.push({ 'name': name, 'value': String(headers[name]) });
	}
	return list;
}

function cdp107HeaderValue(headers, name) {
	for (var key in (headers || {})) {
		if(key.toLowerCase() === name) {
			return String(headers[key]);
		}
	}
	return "";
}

function cdp107QueryString(url) {
	var list = [];
	var start = String(url).indexOf('?');
	if(start === -1) {
		return list;
	}
	var qs = String(url).substring(start + 1);
	var hashIdx = qs.indexOf('#');
	if(hashIdx > -1) {
		qs = qs.substring(0, hashIdx);
	}
	qs.split('&').forEach(function(part) {
		if(part === "") {
			return ;
		}
		var eq = part.indexOf('=');
		var name = eq === -1 ? part : part.substring(0, eq);
		var value = eq === -1 ? "" : part.substring(eq + 1);
		try { name = decodeURIComponent(name.replace(/\+/g, ' ')); } catch(e) {}
		try { value = decodeURIComponent(value.replace(/\+/g, ' ')); } catch(e) {}
		list.push({ 'name': name, 'value': value });
	});
	return list;
}

function cdp107RequestCookies(cookieHeader) {
	var cookies = [];
	String(cookieHeader || "").split(';').forEach(function(part) {
		part = part.trim();
		var eq = part.indexOf('=');
		if(eq <= 0) {
			return ;
		}
		cookies.push({ 'name': part.substring(0, eq), 'value': part.substring(eq + 1) });
	});
	return cookies;
}

function cdp107ResponseCookies(setCookieHeader) {
	var cookies = [];
	String(setCookieHeader || "").split('\n').forEach(function(line) {
		line = line.trim();
		if(line === "") {
			return ;
		}
		var parts = line.split(';');
		var pair = parts.shift();
		var eq = pair.indexOf('=');
		if(eq <= 0) {
			return ;
		}
		var cookie = { 'name': pair.substring(0, eq).trim(), 'value': pair.substring(eq + 1).trim() };
		parts.forEach(function(attr) {
			var aeq = attr.indexOf('=');
			var aname = (aeq === -1 ? attr : attr.substring(0, aeq)).trim().toLowerCase();
			var avalue = aeq === -1 ? "" : attr.substring(aeq + 1).trim();
			if(aname === 'path') {
				cookie['path'] = avalue;
			}else if(aname === 'domain') {
				cookie['domain'] = avalue;
			}else if(aname === 'expires') {
				var expires = Date.parse(avalue);
				if(!isNaN(expires)) {
					cookie['expires'] = new Date(expires).toISOString();
				}
			}else if(aname === 'httponly') {
				cookie['httpOnly'] = true;
			}else if(aname === 'secure') {
				cookie['secure'] = true;
			}
		});
		cookies.push(cookie);
	});
	return cookies;
}

function cdp107ByteLength(str) {
	str = str === undefined || str === null ? "" : String(str);
	try {
		return new TextEncoder().encode(str).length;
	}catch(e) {
		return str.length;
	}
}

function cdp107NormalizeMime(mime) {
	return String(mime || "").split(';')[0].trim();
}

//与 devtools.js 的过滤条件逐条对应：资源类型白名单 + MIME 子串黑名单
function cdp107PassFilter(rec) {
	if(["document", "xhr", "fetch", "script"].indexOf(rec.resourceType) === -1) {
		return false;
	}
	var mime = cdp107NormalizeMime(rec.response && rec.response.mimeType);
	if(mime.indexOf("image/") > -1 || mime.indexOf("text/css") > -1 || mime.indexOf("video/") > -1 || mime.indexOf("javascript") > -1) {
		return false;
	}
	return true;
}

function cdp107BuildRequest(rec) {
	var headers = rec.requestHeaders || {};
	var postData = rec.postData;
	var requestObj = {
		'method': rec.method,
		'url': rec.url,
		'httpVersion': (rec.response && rec.response.protocol) || "",
		'headers': cdp107HeaderList(headers),
		'queryString': cdp107QueryString(rec.url),
		'cookies': cdp107RequestCookies(cdp107HeaderValue(headers, 'cookie')),
		'headersSize': -1,
		'bodySize': postData === undefined ? 0 : cdp107ByteLength(postData)
	};
	if(postData !== undefined) {
		requestObj['postData'] = {
			'mimeType': cdp107HeaderValue(headers, 'content-type'),
			'text': postData
		};
	}
	return requestObj;
}

function cdp107BuildResponse(rec, body) {
	var headers = (rec.response && rec.response.headers) || {};
	var bodySize = cdp107ByteLength(body);
	return {
		'status': rec.response ? rec.response.status : 0,
		'statusText': rec.response ? (rec.response.statusText || "") : "",
		'httpVersion': (rec.response && rec.response.protocol) || "",
		'headers': cdp107HeaderList(headers),
		'cookies': cdp107ResponseCookies(cdp107HeaderValue(headers, 'set-cookie')),
		'content': {
			'size': bodySize,
			'mimeType': cdp107NormalizeMime(rec.response && rec.response.mimeType)
		},
		'redirectURL': rec.redirectURL || "",
		'headersSize': -1,
		'bodySize': bodySize,
		'_transferSize': rec.encodedDataLength === undefined ? 0 : rec.encodedDataLength
	};
}

function cdp107BuildEntry(rec, body) {
	return {
		'startedDateTime': rec.startedDateTime,
		'request': cdp107BuildRequest(rec),
		'content': body,
		'response': cdp107BuildResponse(rec, body),
		'resourceType': rec.resourceType
	};
}

//重定向分片：同一个 requestId 的前一跳在 requestWillBeSent(带 redirectResponse) 时定稿，与 DevTools HAR 一致
function cdp107FinalizeRedirect(state, params) {
	var rec = state.requests[params.requestId];
	if(!rec) {
		return ;
	}
	rec.response = params.redirectResponse;
	rec.redirectURL = (params.request && params.request.url) || "";
	if(!cdp107PassFilter(rec) || state.seenUrls[rec.url]) {
		return ;
	}
	state.seenUrls[rec.url] = true;
	state.entries.push(cdp107BuildEntry(rec, ""));
}

function cdp107FetchBody(state, rec) {
	chrome.debugger.sendCommand({ 'tabId': state.tab.id }, 'Network.getResponseBody', { 'requestId': rec.requestId }, function(result) {
		var err = cdp107LastError();
		if(state.finished) {
			return ;
		}
		delete state.requests[rec.requestId];

		var body = "";
		if(!err && result && result.body !== undefined) {
			//与面板 getContent 忽略 encoding 的行为一致：二进制内容保持 base64 字符串
			body = result.body;
		}

		//与旧面板一致：正文回调完成的先后决定 URL 去重谁胜出
		if(state.seenUrls[rec.url]) {
			return ;
		}
		state.seenUrls[rec.url] = true;
		state.entries.push(cdp107BuildEntry(rec, body));
	});
}

function cdp107OnEvent(state, method, params) {
	if(method === 'Network.requestWillBeSent') {
		if(params.redirectResponse) {
			cdp107FinalizeRedirect(state, params);
		}

		var request = params.request || {};
		state.requests[params.requestId] = {
			'requestId': params.requestId,
			'url': request.url,
			'method': request.method,
			'requestHeaders': request.headers || {},
			'postData': request.postData,
			'resourceType': String(params.type || 'Other').toLowerCase(),
			'startedDateTime': params.wallTime ? new Date(params.wallTime * 1000).toISOString() : new Date().toISOString(),
			'response': null,
			'redirectURL': ''
		};

		//重定向复用同一 requestId，Set 语义天然幂等
		if(params.type === 'XHR' || params.type === 'Fetch') {
			state.inflight[params.requestId] = true;
		}
		return ;
	}

	if(method === 'Network.responseReceived') {
		var rec = state.requests[params.requestId];
		if(!rec) {
			return ;
		}
		rec.response = params.response;
		if(params.type) {
			rec.resourceType = String(params.type).toLowerCase();
		}
		return ;
	}

	if(method === 'Network.loadingFinished') {
		var rec = state.requests[params.requestId];
		delete state.inflight[params.requestId];
		if(!rec || !rec.response) {
			return ;
		}
		rec.encodedDataLength = params.encodedDataLength;
		if(!cdp107PassFilter(rec)) {
			delete state.requests[params.requestId];
			return ;
		}
		cdp107FetchBody(state, rec);
		return ;
	}

	if(method === 'Network.loadingFailed') {
		delete state.inflight[params.requestId];
		return ;
	}
}

function runAction107(tab, info, cb) {
	var tabId = tab.id;
	var state = {
		'tab': tab,
		'info': info,
		'cb': cb,
		'finished': false,
		'attachedByUs': false,
		'entries': [],
		'seenUrls': {},
		'requests': {},
		'inflight': {},
		'matchUrl': undefined,
		'snapshot': undefined,
		'onEvent': null,
		'onDetach': null,
		'watchdog': null
	};

	function cleanup(detach) {
		if(state.watchdog) {
			clearTimeout(state.watchdog);
			state.watchdog = null;
		}
		if(state.onEvent) {
			chrome.debugger.onEvent.removeListener(state.onEvent);
			state.onEvent = null;
		}
		if(state.onDetach) {
			chrome.debugger.onDetach.removeListener(state.onDetach);
			state.onDetach = null;
		}
		if(detach && state.attachedByUs) {
			state.attachedByUs = false;
			try {
				chrome.debugger.detach({ 'tabId': tabId }, function() {
					//忽略 "Debugger is not attached" / "No tab with id"
					void chrome.runtime.lastError;
				});
			}catch(e) {
				console.warn("runAction107 detach error:", e);
			}
		}
	}

	function fail(reason) {
		if(state.finished) {
			return ;
		}
		state.finished = true;
		console.warn("runAction107[tab:"+tabId+"]", info && info.url, "失败:", reason);
		cleanup(true);
		isDone(tab, info, true);
	}

	function succeed(list) {
		if(state.finished) {
			return ;
		}
		state.finished = true;
		cleanup(true);
		textToBase64(JSON.stringify(list), function(base64) {
			cb(base64);
		});
	}

	//前置检查与旧实现一致：tab 已关闭/页面加载失败不再重试
	if(window.spiderSlaveTabInfos['tabs'][tabId] === undefined) {
		console.warn("runAction107[tab:"+tabId+"]tab不存在:",window.tabError[tabId]);
		if(window.spiderSlaveUrls[info['id']]) {
			window.spiderSlaveUrls[info['id']]['runCount'] = 6;
		}
		state.finished = true;
		isDone(tab, info, true);
		return ;
	}
	if(window.tabError[tabId] !== undefined) {
		console.warn("runAction107[tab:"+tabId+"]页面加载失败:",window.tabError[tabId]);
		if(window.spiderSlaveUrls[info['id']]) {
			window.spiderSlaveUrls[info['id']]['runCount'] = 6;
		}
		state.finished = true;
		isDone(tab, info, true);
		return ;
	}

	state.watchdog = setTimeout(function() {
		fail("timeout");
	}, 120000);

	state.onDetach = function(source, reason) {
		if(source.tabId !== tabId || state.finished) {
			return ;
		}
		fail("debugger detached: " + reason);
	};
	chrome.debugger.onDetach.addListener(state.onDetach);

	state.onEvent = function(source, method, params) {
		if(source.tabId !== tabId || state.finished) {
			return ;
		}
		cdp107OnEvent(state, method, params);
	};
	chrome.debugger.onEvent.addListener(state.onEvent);

	function waitXhrFetchQuiet(done) {
		var startTime = new Date().getTime();

		function check() {
			if(state.finished) {
				return ;
			}
			var running = getObjectLen(state.inflight);
			if(running > 0) {
				console.log("runAction107 等待页面请求完成，剩余", running, "个");
			}
			if(running > 0 && new Date().getTime() - startTime < 30000) {
				setTimeout(check, 500);
			}else{
				//与旧面板一致：空闲/超时后再等 500ms
				setTimeout(done, 500);
			}
		}
		check();
	}

	function takeRenderedSnapshot(done) {
		cdp107Send(tabId, 'Runtime.evaluate', {
			'expression': 'JSON.stringify({html: document.documentElement.outerHTML, url: location.href, characterSet: document.characterSet})',
			'returnByValue': true
		}).then(function(result) {
			if(result && !result.exceptionDetails && result.result && typeof result.result.value === 'string') {
				try {
					state.snapshot = JSON.parse(result.result.value);
				}catch(e) {
					console.warn("runAction107 解析渲染HTML失败:", e);
				}
			}else{
				console.warn("runAction107 获取JS渲染HTML失败，将使用原始HTML");
			}
			done();
		}, function(e) {
			console.warn("runAction107 获取JS渲染HTML失败，将使用原始HTML:", e && e.message);
			done();
		});
	}

	function getSelectorTexts() {
		if(!(info.param && info.param.getBetchSelectorTextsBase64)) {
			return undefined;
		}
		try {
			return JSON.parse(base64ToString(info.param.getBetchSelectorTextsBase64));
		}catch(e) {
			console.warn("runAction107 解析 getBetchSelectorTexts 失败:", e);
			return undefined;
		}
	}

	//在页面主世界执行 selector.js，但用伪造的 document/window 包裹，
	//保证 iframe 兜底分支与 scrollX/scrollY 与旧 DevTools 页面执行时一致
	function attachSelectorResult(source, texts, done) {
		cdp107GetSelectorSource().then(function(sourceCode) {
			var content = source.content === undefined ? "undefined" : String(source.content);
			var expression =
				"(function(){" +
				"var __fakeDocument = document.implementation.createHTMLDocument('');" +
				"var __fakeWindow = { scrollX: 0, scrollY: 0 };" +
				"var __content = " + JSON.stringify(content) + ";" +
				"var __texts = " + JSON.stringify(texts) + ";" +
				"return (function(document, window, DOMParser) {" +
				sourceCode +
				"\nDOMParserHtml(__content);" +
				"var __result = getBetchSelectorByTexts(__texts);" +
				"Object.keys(__result).forEach(function(k){" +
				"  (__result[k] || []).forEach(function(item){ if(item && item.length > 6) item[6] = {}; });" +
				"});" +
				"return JSON.stringify(__result);" +
				"})(__fakeDocument, __fakeWindow, DOMParser);" +
				"})()";
			return cdp107Send(tabId, 'Runtime.evaluate', { 'expression': expression, 'returnByValue': true });
		}).then(function(result) {
			if(result && !result.exceptionDetails && result.result && typeof result.result.value === 'string') {
				try {
					source.getBetchSelectorByTextsResult = JSON.parse(result.result.value);
				}catch(e) {
					console.warn("runAction107 解析 getBetchSelectorByTexts 结果失败:", e);
				}
			}else{
				console.warn("runAction107 getBetchSelectorByTexts 执行失败:", result && result.exceptionDetails);
			}
			done();
		}, function(e) {
			console.warn("runAction107 getBetchSelectorByTexts 执行失败:", e && e.message);
			done();
		});
	}

	function assembleResult() {
		var url = state.matchUrl;
		var texts = getSelectorTexts();

		if(state.snapshot) {
			var currentUrl = state.snapshot.url || url;
			var renderedHtml = '<!doctype html>\n' + state.snapshot.html;
			state.entries.forEach(function(source) {
				if(source.resourceType === 'document' && source.request.url === url) {
					source.renderedContent = renderedHtml;
					source.currentUrl = currentUrl;
					source.characterSet = state.snapshot.characterSet;
				}
			});
		}

		var sorted = state.entries.slice().sort(function(a, b) {
			if(a.startedDateTime < b.startedDateTime) {
				return -1;
			}
			if(a.startedDateTime > b.startedDateTime) {
				return 1;
			}
			return 0;
		});

		//与 devtools.js 一致：只扫描排序后前 100 条，从命中目标 url 的条目开始收集，最终最多 50 条
		var scanned = sorted.slice(0, 100);
		var matchIndex = -1;
		for (var i = 0; i < scanned.length; i++) {
			if(scanned[i].request.url === url) {
				matchIndex = i;
				break;
			}
		}

		if(matchIndex === -1) {
			succeed([]);
			return ;
		}

		var picked = scanned.slice(matchIndex, matchIndex + 50);
		if(texts === undefined) {
			succeed(picked);
			return ;
		}

		attachSelectorResult(scanned[matchIndex], texts, function() {
			succeed(picked);
		});
	}

	function startPageCompleteWait() {
		if(state.finished) {
			return ;
		}
		chrome.tabs.get(tabId, function(tabInfo) {
			logTabApiError('runAction107.tabsGet', tabId);
			if(state.finished) {
				return ;
			}
			if(tabInfo === undefined) {
				fail("tab不存在");
				return ;
			}
			state.matchUrl = tabInfo.url;

			//runActionComplete 的 cb 在极端并发下可能触发多次，这里只认第一次
			var completeCalled = false;
			runActionComplete(tab, info, function() {
				if(completeCalled || state.finished) {
					return ;
				}
				completeCalled = true;

				waitXhrFetchQuiet(function() {
					if(state.finished) {
						return ;
					}
					takeRenderedSnapshot(function() {
						if(state.finished) {
							return ;
						}
						assembleResult();
					});
				});
			});
		});
	}

	cdp107Attach(tabId).then(function(attachedByUs) {
		state.attachedByUs = attachedByUs;

		//必须先 enable 再导航，否则抓不到主文档请求；显式给足缓冲，保证 getResponseBody 能取到正文
		return cdp107Send(tabId, 'Network.enable', {
			'maxTotalBufferSize': 64 * 1024 * 1024,
			'maxResourceBufferSize': 16 * 1024 * 1024,
			'maxPostDataSize': 8 * 1024 * 1024
		});
	}).then(function() {
		if(state.finished) {
			return ;
		}

		//只采集本次导航产生的请求（与旧面板 devtype:1 清空缓存的时机一致）
		state.entries = [];
		state.seenUrls = {};
		state.requests = {};
		state.inflight = {};

		//与旧面板 inspectedWindow.eval('location.href="..."') 完全一致，转义规则也一致
		return cdp107Send(tabId, 'Runtime.evaluate', {
			'expression': 'location.href="' + String(info.url).replace(/["\\]/g, '\\$&') + '"'
		});
	}).catch(function(e) {
		//导航后执行上下文被销毁时该命令可能报错，忽略；导航已经发起
		if(/context was destroyed|Cannot find context|navigated or closed/i.test(e && e.message || "")) {
			return ;
		}
		throw e;
	}).then(function() {
		if(state.finished) {
			return ;
		}
		var delay = 500;
		if(info.param && info.param.delay) {
			delay = info.param.delay;
		}
		setTimeout(startPageCompleteWait, delay);
	}).catch(function(e) {
		fail(e && e.message || String(e));
	});
}

function dealOneAction(tab, info, needJump) {
	if(window.spiderSlaveActionCountChangeUser > 0 && window.spiderSlaveHelpmate) {
		window.spiderSlaveRunActionCount++;
		if(window.spiderSlaveRunActionCount > window.spiderSlaveActionCountChangeUser) {
			window.spiderSlaveRunActionCount = 0;

			workPause();
			
			var now = new Date();
			var Ymd = Math.ceil(now.getTime()/1000/window.spiderSlavePerDayMaxRunTimesFrequencyRang);
			if(window.spiderSlaveStackRunActionCount[Ymd] === undefined) {
				window.spiderSlaveStackRunActionCount = {};
				window.spiderSlaveStackRunActionCount[Ymd] = 0;
			}
			window.spiderSlaveStackRunActionCount[Ymd] += 1;
			chrome.storage.local.set({'spiderSlaveStackRunActionCount':window.spiderSlaveStackRunActionCount});

			if(window.spiderSlavePerDayMaxRunTimes > 0) {
				if(window.spiderSlaveStackRunActionCount[Ymd] > window.spiderSlavePerDayMaxRunTimes) {
					PauseNowUser(undefined,{'pauseMs':parseInt(Ymd*window.spiderSlavePerDayMaxRunTimesFrequencyRang - now.getTime()/1000)});
					return;
				}
			}
			
			ReplaceNowUser();
			return ;
		}
	}

	if(window.spiderSlavePerDayMaxRunTimes > 0) {
		var now = new Date();
		var Ymd = Math.ceil(now.getTime()/1000/window.spiderSlavePerDayMaxRunTimesFrequencyRang);
		if(window.spiderSlaveStackRunActionCount[Ymd] === undefined) {
			window.spiderSlaveStackRunActionCount = {};
			window.spiderSlaveStackRunActionCount[Ymd] = 0;
		}
		window.spiderSlaveStackRunActionCount[Ymd] += 1;
		chrome.storage.local.set({'spiderSlaveStackRunActionCount':window.spiderSlaveStackRunActionCount});

		if(window.spiderSlavePerDayMaxRunTimes > 0) {
			if(window.spiderSlaveStackRunActionCount[Ymd] > window.spiderSlavePerDayMaxRunTimes) {
				PauseNowUser(undefined,{'pauseMs':parseInt(Ymd*window.spiderSlavePerDayMaxRunTimesFrequencyRang - now.getTime()/1000)});
				return;
			}
		}
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
				if(!(info.param && info.param.sub)){
					info['isEnd'] = true;
				}
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

	if(info.param && info.param.preeval) {
		myEval(info.param.preeval,{});
	}

	if (!needJump || info['type'] === 107) {//jump
		sendAction(tab, info, actionDoneCb);
	}else{
		actionDoneCb();
	}
}

function listen(req, sender, sendResponse) {
	switch (req.type) {
		case 1:
			break;
		//screenshot
		case 2:
			screenshot(sender.tab,req,(img)=>{
				sendResponse(img);
			})
			
			return true;
			break;
		//wsPostForWork
		case 3:
			wsPost(req.post,function(resolve,reject,details) {
				sendResponse(details);
				resolve(true);
			},undefined,req.heades)
			
			return true;
			break;
		//MAIN world 获取扩展资源 URL
		case 5:
			sendResponse(chrome.runtime.getURL(req.path));
			break;
		//pop
		case 4:
			if(req.data !== undefined) {
				req.data = JSON.parse(convertBackticksToEscapedQuotes(req.data));
			}
			if(typeof window[req.name] === 'function') {
				var p = window[req.name](...req.data);
				if(isPromise(p)) {
					p.then((data) => {
						sendResponse(data);
					});
				}else{
					sendResponse(p===undefined?'ok':p);
				}
			}else if(typeof window[req.name] === 'object') {
				sendResponse(window[req.name][req.data[0]]);
			}else{
				sendResponse(window[req.name]);
			}
			return true;
			break;
		default:
			break;
	}
}

var tabErrorOccurredListener = function(details) {
	if(details.frameId === 0) {
		window.tabError[details.tabId] = details.error;
	}
};
chrome.webNavigation.onErrorOccurred.addListener(tabErrorOccurredListener);
chrome.webNavigation.onCompleted.addListener(function(details) {
	if(details.frameId === 0) {
		delete window.tabError[details.tabId];
	}
});

chrome.runtime.onMessage.addListener(listen)
chrome.runtime.onUserScriptMessage.addListener(listen)

function debugRun(debugActions) {
	debugActions.data.forEach(function (v) {
		if (!window.spiderSlaveUrls[v['id']]) {
			v['isDebugRun'] = true;
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
	var formData = new FormData();
	//blob default use gzip
	var BlobFields = [];
	for(var k in request.data) {
		if(isBlob(request.data[k])) {
			BlobFields.push(k);
		}
		formData.append(k, request.data[k]);
	}

	fetch(request.url, {
    method: 'POST',
    headers: {
        'BlobFields': BlobFields.join(',')
    },
		body: formData,
	})
	.then(response => {
		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status}`);
		}

		const contentType = response.headers.get('content-type');
		if (contentType.includes('application/json')) {
			return response.json();
		} else if (contentType.includes('text/')) {
			return response.text();
		} else if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
			return response.blob();
		} else {
			return response.text();
		}
	})
	.then(data => {
		if(typeof(data) == 'string') {
			actionRecords(request.url +' :'+data.substr(0,50), 'BACKEND AJAX', 'POST DATA');
		}else{
			actionRecords(request.url +' :'+JSON.stringify(data).substr(0,50), 'BACKEND AJAX', 'POST DATA');
		}

		if(cb !== undefined) {
			cb(data);
		}
	})
	.catch(error => {
			if(errorcb !== undefined) {
				errorcb();
			}
	});


	/* $.ajax({
		url: request.url,
		type: 'POST',
		timeout: 60000,
		headers: {
			BlobFields: BlobFields.join(',')
		},
		data: formData,
		processData: false,
		contentType: false,
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
	}); */
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

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
    id: "saveUserName",  // Unique ID for the context menu item
    title: contextMenusTitle,
    contexts: ['selection']
  });

});

chrome.contextMenus.onClicked.addListener((params) => {
  if (params.menuItemId === "saveUserName" && params.selectionText) {
    window.userName = params['selectionText'];
		chrome.storage.local.set({'userName': window.userName});
  }
});

var Eval = {};
async function myEval(jsStr,args,obj_this) {
  var funcName = "_"+SparkMD5.hash(jsStr);
  // var funcName = 'demoTemp';

  if(Eval[funcName] === undefined) {
    
    if(window.spiderSlaveHelpmate !== true) {
      console.error("执行失败: ",jsStr);

			console.warn("请添加下面代码至eval.js，保存后将自动执行 :========"+funcName+" start========");
			console.log(`Eval.`+funcName+` = function(args){
				return `+jsStr+`
			};`);
			console.warn("========"+funcName+" end========");
      return ;
    }

    console.log("myEval auto creatFunc",funcName);

    await wsPost({
			id:4,
			method:"Robot.BuildFuncByJs",
			params:[window.spiderSlaveFlag,funcName,jsStr]
		},undefined,'json');
    return;
  }else{
    var r = Eval[funcName](args);
    if (isPromise(r)) {
      r = await r;
    }
    console.log("myEval result:",r,jsStr);
    return r;
  }
}