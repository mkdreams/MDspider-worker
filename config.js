window.notify_tips = false;
window.spiderSlaveOn = true;
window.spiderSlaveFlag = 'slave3';
window.spiderSlaveApiActionList = "http://corp.admin.com/ir/NewsBase/getLinksCache";
window.spiderSlaveApiCb = "http://corp.admin.com/ir/NewsBase/recordLinkCacheIsDone";

var spiderSlaveApiInfo = window.spiderSlaveApiActionList.match(/^(http|https|ws)\:\/\/[^\/$]+?(?=[\/|$])/g);
window.spiderSlaveApi = spiderSlaveApiInfo[0];

window.spiderSlaveGetUrlsDelay = 5000;
window.spiderSlaveWinCount = 1;
window.spiderSlavePerWinTabCount = 5;
window.spiderSlaveRunActionCount = 0;
window.spiderSlaveActionCountChangeUser = 0;
window.spiderSlaveStackRunActionCount = {};
window.spiderSlaveLockTabTimeout = 180000;
window.spiderSlavePerDayMaxRunTimes = 0;

window.spiderProxyOn = false;
window.spiderProxyChangePerReqCount = 5;
window.spiderProxyFetchApi = "http.tiqu.alibabaapi.com/getip3?num=2&type=2&pack=62956&port=1&lb=1&pb=4&gm=4&regions=";

window.spiderSlaveHelpmate = true;
window.spiderSlaveHelpmateApi = 'http://127.0.0.1:1234/rpc';

// 1-create inti 2-reopen init
window.spiderSlaveInitStatus = 0;

window.helpmateEvents = {
    "create": [],
    "open": [],
    "done": {
	}
};

window.baseInfo = {};
setTimeout(function() {
		initDeviceInfo(function(){
			//init and create api tab
			if(window.spiderSlaveOn === true) {
				workPlay();
			}
		});
},3000);
	
function initDeviceInfo(cb) {
	loadConfig(function() {
		if(window.spiderProxyOn) {
			enabledProxy();
		}else {
			disabledProxy();
		}
		
		chrome.system.display.getInfo(function(info) {
			chrome.windows.getCurrent(function(win) {
				window.spiderSlaveTabInfos['wins'][win.id] = win;
				window.spiderSlaveTabInfos['wins'][win.id]['useTabs'] = {};

				chrome.tabs.query({windowId:win.id},function(tabs) {
					window.baseInfo['topHeight'] = win['height']-tabs[0]['height']+1-15;
					window.baseInfo['leftWidth'] = 1;
					if(window.spiderSlaveHelpmate) {

						//save userDataPath
						if(!window['userDataPath']) {
							var syncProfile = new Promise(function(resolve,reject) {
								tabs.forEach(tab => {
									var title = tab['title'];
									if(title.indexOf('MDspider') > -1) {
										var userDataPath = getQueryString(title,'profile');
										if(userDataPath !== undefined) {
											window['userDataPath'] = userDataPath;
											chrome.storage.local.set({'userDataPath':window['userDataPath']});
											pingUser()
										}
									}
									resolve(title);
								})
							});
						}else{
							var syncProfile = new Promise(function(resolve,reject) {
								pingUser()
								resolve(false);
							});
						}

						syncProfile.then(data => {
							var subP = xhrPost(window.spiderSlaveHelpmateApi,{
								id:4,
								method:"Robot.Events",
								params:[[window.workCreateFlag]]
							},undefined,'json');

							return subP;
						}).then(function(data) {
							if (data.result.Data.indexOf("{") === 0) {
								window.helpmateEvents = eval("["+data.result.Data+"]")[0];
								data = (window.helpmateEvents['create'] != undefined?window.helpmateEvents['create']:[]);
							}

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
						//open
						}).then(function(data) {
							window.spiderSlaveInitStatus = window.spiderSlaveInitStatus | 1;
							chrome.storage.local.set({'spiderSlaveInitStatus':window.spiderSlaveInitStatus});

							data = (window.helpmateEvents['open'] != undefined?window.helpmateEvents['open']:[]);

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
							cb & cb();
						});
					}else{
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
		for(var key in result) {
			window[key] = result[key];
		}

		if(!window['workCreateFlag']) {
			if(window.workCreateFlagDefault && window.workCreateFlagDefault !== '--workCreateFlagDefault--') {
				window['workCreateFlag'] = window.workCreateFlagDefault;
			}else{
				window['workCreateFlag'] = Number(Math.random().toString().substr(3,5) + Date.now()).toString(36);
			}
			chrome.storage.local.set({'workCreateFlag':window['workCreateFlag']});
		}
		
		cb && cb();
	});
}