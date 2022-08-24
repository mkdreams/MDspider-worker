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
window.spiderSlaveLockTabTimeout = 180000;

window.spiderProxyOn = false;
window.spiderProxyChangePerReqCount = 5;
window.spiderProxyFetchApi = "http.tiqu.alibabaapi.com/getip3?num=2&type=2&pack=62956&port=1&lb=1&pb=4&gm=4&regions=";

window.spiderSlaveHelpmate = true;
window.spiderSlaveHelpmateApi = 'http://127.0.0.1:1234/rpc';

// 1-create inti 2-reopen init
window.spiderSlaveInitStatus = 0;

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

				window.baseInfo['windowId'] = win.id;
				window.baseInfo['height'] = info[0].bounds.height;
				window.baseInfo['width'] = info[0].bounds.width;
				
				window.spiderSlaveWinCount = parseInt(window.spiderSlaveWinCount);
				window.baseInfo['xCount'] = Math.ceil(Math.sqrt(window.spiderSlaveWinCount+1));
				if(window.baseInfo['xCount'] < 3) {
					window.baseInfo['xCount'] = window.spiderSlaveWinCount+1;
					window.baseInfo['yCount'] = 1;
				}else{
					window.baseInfo['yCount'] = Math.ceil((window.spiderSlaveWinCount+1)/window.baseInfo['xCount']);
				}
				window.baseInfo['perHeight'] = parseInt(window.baseInfo['height']/window.baseInfo['yCount'])-150;
				window.baseInfo['perWidth'] = parseInt(window.baseInfo['width']/window.baseInfo['xCount']);
				


				chrome.tabs.query({windowId:win.id},function(tabs) {
					window.baseInfo['topHeight'] = win['height']-tabs[0]['height']+1;
					window.baseInfo['leftWidth'] = 1;
					autoCreateTab(window['userDataPath']?'chrome://extensions/':'chrome://version/',function() {
						if(window.spiderSlaveHelpmate) {
							//get lock
							xhrPost(window.spiderSlaveHelpmateApi,{
								id:4,
								method:"Robot.Transaction",
								params:[[window.workCreateFlag]]
							},undefined,'json').then(function(data) {
								return new Promise(function(resolve,reject) {
									//match hwnd
									chrome.windows.getCurrent(function(nowWin) {
										xhrPost(window.spiderSlaveHelpmateApi,{
											id:4,
											method:"Robot.MatchHwndByLeft",
											params:[[window.workCreateFlag,nowWin.width,nowWin.height,nowWin.left,nowWin.top]]
										},undefined,'json').then(function(data) {
											resolve(nowWin);
										});
									});
								});
							}).then(function(nowWin) {
								if(!window['userDataPath']) {
									var p = xhrPost(window.spiderSlaveHelpmateApi,{
										id:4,
										method:"Robot.Copy",
										params:[[window.workCreateFlag,nowWin.width,nowWin.height,nowWin.left,nowWin.top]]
									},undefined,'json');
								}else{
									var p = new Promise(function(resolve,reject) {
										resolve(false);
									});
								}
								p.then(function(data) {
									console.log(1,data);
									if((window.spiderSlaveInitStatus & 1) === 0) {
										var subP = xhrPost(window.spiderSlaveHelpmateApi,{
											id:4,
											method:"Robot.CreateUserInit",
											params:[[window.workCreateFlag]]
										},undefined,'json');
									}else{
										var subP = new Promise(function(resolve,reject) {
											resolve(false);
										});
									}
	
									if (data === false){
										pingUser()
										return subP
									}
	
									var match = data.result.Data.match(new RegExp("User Data(?: MDpider helpmate)*?\\\\([ \\w]+)"))
									if(match && match[1]) {
										window['userDataPath'] = match[1];
										chrome.storage.local.set({'userDataPath':window['userDataPath']});
										pingUser()
									}
	
									return subP;
								}).then(function(data) {
									console.log(2,data);
									if (data === false) {
										var subP = new Promise(function(resolve,reject) {
											resolve(false);
										});
									}else {
										if (data.result.Data.indexOf("[") === 0) {
											data = eval(data.result.Data);
										}
	
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
									}
	
									return subP;
								}).then(function(data) {
									console.log(3,data);
									if((window.spiderSlaveInitStatus & 2) === 0) {
										var subP = xhrPost(window.spiderSlaveHelpmateApi,{
											id:4,
											method:"Robot.OpenUserInit",
											params:[[window.workCreateFlag]]
										},undefined,'json');
									}else{
										var subP = new Promise(function(resolve,reject) {
											resolve(false);
										});
									}
	
									if (data === false){
										return subP;
									}
	
									window.spiderSlaveInitStatus = window.spiderSlaveInitStatus | 1;
									chrome.storage.local.set({'spiderSlaveInitStatus':window.spiderSlaveInitStatus});
	
									return subP;
								}).then(function(data) {
									console.log(4,data);
									if (data === false) {
										var subP = new Promise(function(resolve,reject) {
											resolve(false);
										});
									}else {
										if (data.result.Data.indexOf("[") === 0) {
											data = eval(data.result.Data);
										}
	
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
									}
	
									return subP;
								}).then(function(data) {
									//open user not save
									window.spiderSlaveInitStatus = window.spiderSlaveInitStatus | 2;
	
									xhrPost(window.spiderSlaveHelpmateApi,{
										id:4,
										method:"Robot.Commit",
										params:[[window.workCreateFlag]]
									},undefined,'json').then(function(){
										cb & cb();
									})
									
								});
							});

						}else{
							window.spiderSlaveInitStatus = 3;
							xhrPost(window.spiderSlaveHelpmateApi,{
								id:4,
								method:"Robot.Commit",
								params:[[window.workCreateFlag]]
							},undefined,'json').then(function(){
								cb & cb();
							})
						}
						
						tabs.forEach(tab => {
							chrome.tabs.remove(tab.id,function() {
							});
						});
					},true);
					
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