window.spiderSlaveTabInfos = {'api':{},'tabs':[]};
window.siteIdToTab = {};
window.tabUseStatus = {};
window.tabIndex = 0;
window.spiderSlaveUrls = {};

//chrome://discards/ 
function autoDiscardable(tabId) {
	chrome.tabs.update(tabId, {autoDiscardable: false});
}


function createTab(url,name,callback) {
	chrome.tabs.create({'url':url},function(tab) {
		window.spiderSlaveTabInfos[name] = tab;
		autoDiscardable(tab.id);
		callback(tab);
	});
}

//create api tab
createTab(window.spiderSlaveApi,'api',function(tab) {
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
});

function getNextTab() {
	var tabLen = window.spiderSlaveTabInfos['tabs'].length;
	//need create tab
	if(tabLen < window.spiderSlaveTabCount) {
		return -2;
	}
	
	var index  = -1;
	window.spiderSlaveTabInfos['tabs'].forEach(function(tab) {
		index++;
		backgroundConsole('tab',tab);
	});
	
	//all is busy
	return index;
}

function getUrlInfo(type) {
	var index = 0;
	var nowTimeStamp = new Date().getTime();
	var needAgain = nowTimeStamp - 300000;
//	var needAgain = nowTimeStamp - 30000;
	for(var id in window.spiderSlaveUrls) {
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

function getHtmlRun() {
	var urlIndex = getUrlInfo();
//	backgroundConsole('urlInfo',urlInfo);
//	return;
//	var domain_flag = urlInfo['domain_flag'];
	
	var tabIndex = getNextTab();
	
	if(tabIndex == -2) {
		
	}
	
	if(window.spiderSlaveTabInfos['tabs'][tabIndex]['runStatus']) {
		return ;
	}
	
	console.log('comming',info.url);
	
	//create tab 
	window.tabUseStatus[domain_flag][tabIndexTemp] = 1;
	
	function isDone() {
		window.tabUseStatus[domain_flag][tabIndexTemp] = 2;
		window.spiderSlaveUrls.splice(index,1);
		clearTimeout(window.setTimeout_getHtml);
		
		console.log('end',info.url);
	}
	
	//try agin
	clearTimeout(window.setTimeout_getHtml);
	window.setTimeout_getHtml = setTimeout(function() {
		window.tabUseStatus[domain_flag][tabIndexTemp] = 2;
		clearInterval(window.setInterval_getHtml);
		clearInterval(window.setInterval_waitToComplete);
		console.log('time out!',info);
	},180000);
	
	//get html after window.spiderSlaveDelay seconds
	function getHml(tab) {
		window.setInterval_getHtml = setInterval(function() {
			sendMessageToTabs(window.siteIdToTab[domain_flag],{'actiontype':1,'info':info},function(res) {
				if(res && res['scrollIsEnd'] == true) {
					clearInterval(window.setInterval_getHtml);
					if(res && res['html']) {
						sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':2,'tab':tab,'url':window.spiderSlaveApi+'data/recordLinkCacheIsDone','data':{'id':info['id'],'sResponse':res.html}});
					}
					isDone();
				}
			});
		},1000);
	}
	
	function createTabAndGetHml() {
		chrome.tabs.create({'url': info['url']},function(tab) {
			window.siteIdToTab[domain_flag] = tab;
			autoDiscardable(tab.id);
			
			setTimeout(function() {
					//scroll 
					sendMessageToTabs(tab,{'actiontype':3,'info':info});
					getHml(tab);
			},window.spiderSlaveDelay);
		});
	}
	
	if(!window.siteIdToTab[domain_flag]) {
		createTabAndGetHml();
	}else{//use old tab
		chrome.tabs.get(window.siteIdToTab[domain_flag].id,function(tab) {
			backgroundConsole('tab info',tab); 
			if(tab === undefined) {
				createTabAndGetHml();
			}else{
				var tab = window.siteIdToTab[domain_flag]; 
				//jump 
				sendMessageToTabs(tab,{'actiontype':2,'info':info});
				
				if(info.type == 100) {
					setTimeout(function() {
						sendMessageToTabs(window.spiderSlaveTabInfos['api'],{'admintype':2,'tab':tab,'url':window.spiderSlaveApi+'data/recordLinkCacheIsDone','data':{'id':info['id'],'sResponse':''}});
						isDone();
					},1000);
				}else if(info.type == 1) {
					setTimeout(function() {
						window.setInterval_waitToComplete = setInterval(function(callback) {
							chrome.tabs.get(window.siteIdToTab[domain_flag].id, function(nowTab) {
								console.log('tab info',nowTab.status);
								if(nowTab.status == 'complete') {
									clearInterval(window.setInterval_waitToComplete);
									//scroll 
									sendMessageToTabs(nowTab,{'actiontype':3,'info':info});
									getHml(nowTab);
								}
							});
						},500);
					},500);
				}else{
					setTimeout(function() {
						getHml(tab);
					},500);
				}
			}
		});
	}
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
