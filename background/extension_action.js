function isSupportPartitionKey() {
	if(navigator && navigator.userAgentData && navigator.userAgentData.brands && navigator.userAgentData.brands[0] && parseInt(navigator.userAgentData.brands[0].version) >= 119) {
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

	navigator.userAgentData.brands[0].version
	chrome.cookies.getAll(option,function(cookies) {
		textToBase64(JSON.stringify(cookies),function(base64){
			cb(base64);
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
		cb(c);
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

	screenshotCount++;
	chrome.windows.update(tab.windowId, { focused: true, width: width, height: height }, function () {
		chrome.tabs.update(tab.id, { active: true }, function () {
			if (chrome.runtime.lastError) {
				console.error(chrome.runtime.lastError);
			}
			chrome.tabs.captureVisibleTab(null, {
				format: 'png'
			}, function (data) {
				//retry 3 times
				if(!data && screenshotCount <= 3) {
					setTimeout(()=>{
						screenshot(tab, info, cb,screenshotCount);
					},500);
				}else{
					cb(data);
				}
			});
		})
	})
}

function updateConfig(tab, info, cb) {
	configs = eval("("+info.url+")");
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
