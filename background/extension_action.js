function isSupportPartitionKey() {
	if(navigator && navigator.userAgentData && navigator.userAgentData.brands && parseInt(navigator.userAgentData.brands.find((v)=>{return v.brand === "Chromium";}).version) >= 119) {
		return true;
	}else{
		return false;
	}
}

function tabUpdate(tab, info, cb) {
	//{active: true ,autoDiscardable: false } info.param.tabProperties
	chrome.tabs.update(tab.id, info.param.tabProperties, function () {
		textToBase64(true,function(base64){
			cb && cb(base64);
		});
	});
}

// get cookies
function getCookies(tab, info, cb) {
	var option = {"url":info.url};
	if(isSupportPartitionKey()) {
		option["partitionKey"] = {};
	}else{
		console.warn("浏览器版本小于119，getCookies可能存在不完整");
	}

	chrome.cookies.getAll(option,function(cookies) {
		textToBase64(JSON.stringify(cookies),function(base64){
			cb(base64);
		});
	});
}

// get cookies await
async function getCookiesSync(url) {
	return await new Promise(function(resolve,reject) {
		getCookies(undefined,{'url':url},(base64)=>{
			resolve(base64)
		});
	});
}

//delete cookies
function clearCookies(tab, info, cb) {
	var c = 0;
	var option = {"url":info.url};
	if(isSupportPartitionKey()) {
		option["partitionKey"] = {};
	}else{
		console.warn("浏览器版本小于119，clearCookies可能存在不完整");
	}

	console.log("option",option);

	chrome.cookies.getAll(option,function(cookies) {
		cookies.forEach(function(cookie) {
			if(isSupportPartitionKey()) {
				chrome.cookies.remove({
					'url':info.url,
					'name':cookie.name,
					'storeId':cookie.storeId,
					'partitionKey':{}
				});
			}else{
				chrome.cookies.remove({
					'url':info.url,
					'name':cookie.name,
					'storeId':cookie.storeId
				});
			}
			c++;
		});

		console.log("clearCookies "+info.url+" => "+c);
		cb(c);
	});
}

async function clearCookiesSync(tab, info) {
	return await new Promise(function(resolve,reject) {
		clearCookies(tab, info ,(c)=>{
			resolve(c)
		});
	});
}

// set cookies
function setCookies(tab, info, cb) {
	var c = -1;
	if (!info.param.cookies){
		textToBase64(c,function(base64){
			cb(base64);
		});
	}

	c++;

	let cookies = JSON.parse(info.param.cookies)
	cookies.forEach(function(cookie) {
		c++;
		chrome.cookies.set(fullCookie(info.url,cookie));
	})

	textToBase64(c,function(base64){
		cb(base64);
	});
}

// set cookies
function waiteComplete(tab, info, cb) {
	var delay = 3000;
	if(info && info.param && info.param.delay) {
		delay = info.param.delay;
	}

	var maxTimes = 20;
	if(info && info.param && info.param.maxTimes) {
		maxTimes = info.param.maxTimes;
	}

	(async ()=>{
		while(true) {
			var canBreak = false;
			if(info && info.param && info.param.preAction) {
				var doneCheckAction = info.param.preAction;
				delete doneCheckAction["results"];
				if(!doneCheckAction.param) {
					doneCheckAction.param = {};
				}
				doneCheckAction.param["skipRecaptcha"] = true;

				if(doneCheckAction.param && doneCheckAction.param.sub) {
					doneCheckAction.param.sub.forEach((subAction)=>{
						if(!subAction.param) {
							subAction.param = {};
						}
						delete subAction["results"];
						subAction.param["skipRecaptcha"] = true;
					});
				}
			}else{
				var doneCheckAction = {
					"url":"return '<'+window.location.href+'>'+document.getElementsByTagName('html')[0].innerHTML;",
					"type":100,
					"param": {
						"delay":delay,
						"background":true,
						"skipRecaptcha":true,
					}
				};
			}

			var data = await new Promise(function(doneCheckActionPromiseResolve,reject) {
				doneCheckAction['doneCheckActionPromiseResolve'] = doneCheckActionPromiseResolve;
				sendAction(tab, doneCheckAction, function(){
					runActionComplete(tab, doneCheckAction, function(tab, infoTemp) {
						runSub(tab, infoTemp, function(tab, infoTemp) {
							getHml(tab, infoTemp);
						},0)
					});
				});
			});

			var response = data[1];
			if(info && info.param && info.param.match && !await myEval(info.param.match,{data,response})) {
				canBreak = true;
				console.log("canBreak",canBreak);
			}

			console.log("maxTimes",maxTimes,canBreak);
			if(--maxTimes <= 0 || canBreak) {
				if(maxTimes <= 0 && info && info.param && info.param.timeOutCb) {
					await myEval(info.param.timeOutCb,{data,response});
				}
				textToBase64('1',function(base64){
					cb(base64);
				});
				break;
			}
		}
	})();
}

function fullCookie(url,fullCookie) {
	var newCookie = {};
	newCookie.url = url;

	if (!fullCookie.hostOnly) {
		newCookie.domain = fullCookie.domain;
	}

	newCookie.httpOnly = fullCookie.httpOnly;

	newCookie.name = fullCookie.name;
	newCookie.path = fullCookie.path;

	if (fullCookie.sameSite !== undefined) {
		newCookie.sameSite = fullCookie.sameSite;
	}

	if (fullCookie.partitionKey !== undefined && isSupportPartitionKey()) {
		newCookie.partitionKey = fullCookie.partitionKey;
	}

	newCookie.secure = fullCookie.secure;

	if (!fullCookie.session) {
		newCookie.expirationDate = fullCookie.expirationDate;
	}

	newCookie.storeId = fullCookie.storeId;
	newCookie.value = fullCookie.value;

	return newCookie;
}

function screenshot(tab, info, cb,screenshotCount) {
	if(screenshotCount === undefined) {
		screenshotCount = 0;
	}

	var width = 1920;
	if(info && info.param && info.param.width) {
		width = info.param.width;
	}
	var height = 1920;
	if(info && info.param && info.param.height) {
		height = info.param.height;
	}

	var init = 0;
	if(info && info.param && info.param.init) {
		init = info.param.init;
	}

	screenshotCount++;
	new Promise(function(resolve,reject) {
		chrome.windows.update(tab.windowId, { focused: true, width: width, height: height }, function () {
			resolve(true);
		});
	}).then(function() {
		return new Promise(function(resolve,reject) {
			chrome.tabs.update(tab.id, { active: true }, function () {
				if(init === 1) {
					chrome.debugger.attach({ tabId: tab.id }, '1.3').then(function(){
						resolve(true);
					});
				}else{
					resolve(true);
				}
			});
		});
	}).then(function(){
		if(init === 1) {
			cb();
			return;
		}

		if(init === 2) {
			chrome.debugger.detach({ tabId: tab.id });

			cb();
			return;
		}

		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError);
		}

		chrome.debugger.sendCommand(
			{"tabId":tab.id},
			"Page.captureScreenshot",
			{"format": "png"},
		).then((data)=>{
			//retry 3 times
			if(!data.data && screenshotCount <= 3) {
				setTimeout(()=>{
					screenshot(tab, info, cb,screenshotCount);
				},500);
			}else{
				cb('data:image/png;base64,'+data.data);
			}
		}).catch((err) => {
				console.log(err);
				cb(err.toString());
		});

		chrome.debugger.sendCommand(
			{"tabId":tab.id},
			"Page.captureScreenshot",
			{"format": "png"},
		).then(data=>{
			//retry 3 times
			if(!data.data && screenshotCount <= 3) {
				setTimeout(()=>{
					screenshot(tab, info, cb,screenshotCount);
				},500);
			}else{
				cb('data:image/png;base64,'+data.data);
			}
		});
	});
}

function updateConfig(tab, info, cb) {
	configs = JSON.parse(convertBackticksToEscapedQuotes(info.url));
	for(var configName in configs) {
		window[configName] = configs[configName];
	}

	textToBase64("true",function(base64){
		cb(base64);
	});
}

function pingUser(tab, info, cb) {
	chrome.windows.getCurrent(function(win) {
		wsPost({
			id:4,
			method:"Robot.PingBrowserUser",
			params:[window.workCreateFlag,window.userDataPath,win.width,win.height,win.left,win.top]
		},undefined,'json').then(function(data) {
			if(cb) {
				textToBase64(JSON.stringify(data),function(base64){
					cb(base64);
				});
			}
		},'json');
	})
}

function ReplaceNowUser(tab, info, cb) {
	wsPost({
		id:4,
		method:"Robot.ReplaceNowUser",
		params:[window.workCreateFlag,window.userDataPath,window.spiderSlaveApiCb+'?isDelete=1&sFlag='+window.spiderSlaveFlag+'&workCreateFlag='+window.workCreateFlag+'&info='+encodeURIComponent(JSON.stringify(info))]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	},'json');
}

function PauseNowUser(tab, info, cb) {
	wsPost({
		id:4,
		method:"Robot.PauseNowUser",
		params:[window.workCreateFlag,window.userDataPath,window.spiderSlaveApiCb+'?isDelete=1&sFlag='+window.spiderSlaveFlag+'&workCreateFlag='+window.workCreateFlag+'&info='+encodeURIComponent(JSON.stringify(info)),info['pauseMs']]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	},'json');
}

function moveKeepLiveUser(tab, info, cb) {
	wsPost({
		id:4,
		method:"Robot.MoveKeepLiveBrowserUser",
		params:[window.workCreateFlag,window.userDataPath,window.spiderSlaveApiCb+'?isDelete=1&sFlag='+window.spiderSlaveFlag+'&workCreateFlag='+window.workCreateFlag+'&info='+encodeURIComponent(JSON.stringify(info))]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	},'json');
}

function createUser(tab, info, cb) {
	wsPost({
		id:4,
		method:"Robot.CreatBrowserUser",
		params:[randomStr()]
	},undefined,'json').then(function(data) {
		if(info.param && info.param.saveas) {
			info[info.param.saveas] = data;
		}
		
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	},'json');
}

function deleteUser(tab, info, cb) {
	wsPost({
		id:4,
		method:"Robot.DeleteBrowserUser",
		params:[info.url]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	});
}

function closeAllWind(tab, info) {
	wsPost({
		id:4,
		method:"Robot.CloseBrowserUser",
		params:[info.url]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64('true',function(base64){
				cb(base64);
			});
		}
	});
}
