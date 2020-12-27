window.spiderSlaveTabInfos = {};
window.siteIdToTab = {};
window.tabUseStatus = {};
window.spiderSlaveUrls = [];
window.spiderSlaveUrlsMd5 = {};

//chrome://discards/ 
function autoDiscardable(tabId) {
	chrome.tabs.update(tabId, {autoDiscardable: false});
}

//init
chrome.tabs.create({'url':window.spiderSlaveApi},function(tab) {
	window.apiTab = tab;
	autoDiscardable(tab.id);
	
	window.setInterval_getHtmlRun = setInterval(function() {
		backgroundConsole('getHtmlRun',window.spiderSlaveUrls);
		backgroundConsole('siteIdToTab',window.siteIdToTab);
		if(window.spiderSlaveUrls.length > 0) {
			getHtmlRun();
		}else{
			sendMessageToTabs(window.apiTab,{'admintype':1,'url':window.spiderSlaveApi+'data/getLinksCache','data':{'sFlag':window.spiderSlaveFlag}});
		}
	},window.spiderSlaveDelay);
});



chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
	var tab = sender.tab;
	switch (req.type) {
		case 3://background 
			if(window.tabUrlIds[tab.id]) {
				sendMessageToTabs(window.apiTab,{'admintype':2,'tab':tab,'url':window.spiderSlaveApi+'data/recordLinkCacheIsDone','data':{'id':window.tabUrlIds[tab.id],'sResponse':req.html}});
				window.tabUrlIds[tab.id] = undefined;
			}
			break;
			
		case 2://api result
			if(!(req.data.data instanceof Array)) {
				break;
			}
			req.data.data.forEach(function(v) {
				backgroundConsole('v',v);
				if(!window.spiderSlaveUrlsMd5[v['code']]) {
					window.spiderSlaveUrlsMd5[v['code']] = 1;
					window.spiderSlaveUrls.push(v);
				}
			});
			break;
		default:
			break;
	}
})


function backgroundConsole(pre,obj) {
	sendMessageToTabs(window.apiTab,{'admintype':3,'obj':[pre,obj]});
}

function getHtmlRun() {
	var index = Math.floor((Math.random()*window.spiderSlaveUrls.length));
	var info = window.spiderSlaveUrls[index];
	var iSiteId = info['domain_flag'];
	
	if(window.tabUseStatus[iSiteId] && window.tabUseStatus[iSiteId] === 1) {
		return ;
	}
	
	
	//create tab 
	window.tabUseStatus[iSiteId] = 1;
	
	//get html after window.spiderSlaveDelay seconds
	function getHml(tab) {
		setTimeout(function() {
			sendMessageToTabs(window.siteIdToTab[iSiteId],{'actiontype':1},function(res) {
				if(res && res['html']) {
					sendMessageToTabs(window.apiTab,{'admintype':2,'tab':tab,'url':window.spiderSlaveApi+'data/recordLinkCacheIsDone','data':{'id':info['id'],'sResponse':res.html}});
				}
				window.tabUseStatus[iSiteId] = 2;
			});
		},window.spiderSlaveDelay);
	}
	
	function createTabAndGetHml() {
		chrome.tabs.create({'url': info['url']},function(tab) {
			window.siteIdToTab[iSiteId] = tab;
			autoDiscardable(tab.id);
			getHml(tab);
		});
	}
	
	
	if(!window.siteIdToTab[iSiteId]) {
		createTabAndGetHml();
	}else{//use old tab
		chrome.tabs.get(window.siteIdToTab[iSiteId].id,function(tab) {
			backgroundConsole('tab info',tab); 
			if(tab === undefined) {
				createTabAndGetHml();
			}else{
				var tab = window.siteIdToTab[iSiteId]; 
				//jump 
				sendMessageToTabs(tab,{'actiontype':2,'info':info});
				getHml(tab);
			}
		});
	}
	
	window.spiderSlaveUrls.splice(index,1);
	window.spiderSlaveUrlsMd5[info['code']] = undefined;
}
