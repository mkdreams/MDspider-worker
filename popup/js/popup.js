
async function restoreData(form, $) {
	form.val('workerStatus', {
		"spiderSlaveOn": await getWindowValue('spiderSlaveOn')
	});

	form.val('workerConfig', {
		"spiderSlaveFlag": await getWindowValue('spiderSlaveFlag')
		, "spiderSlaveApi": await getWindowValue('spiderSlaveApi')
		, "spiderSlaveApiActionList": await getWindowValue('spiderSlaveApiActionList')
		, "spiderSlaveApiCb": await getWindowValue('spiderSlaveApiCb')
		, "spiderSlaveWinCount": await getWindowValue('spiderSlaveWinCount')
		, "spiderSlavePerWinTabCount": await getWindowValue('spiderSlavePerWinTabCount')
		, "spiderSlaveActionCountChangeUser": await getWindowValue('spiderSlaveActionCountChangeUser')
		, "spiderSlaveInitStatus": await getWindowValue('spiderSlaveInitStatus')
		, "spiderSlaveGetUrlsDelay": await getWindowValue('spiderSlaveGetUrlsDelay')
		, "spiderSlaveDelay": await getWindowValue('spiderSlaveDelay')
		, "spiderSlaveOn": await getWindowValue('spiderSlaveOn')
	});

	form.val('proxyConfig', {
		"spiderProxyChangePerReqCount": await getWindowValue('spiderProxyChangePerReqCount')
		, "spiderProxyFetchApi": await getWindowValue('spiderProxyFetchApi')
	});

	form.val('debugConfig', {
		"debugType": await getWindowValue('debugType')
		, "debugActions": await getWindowValue('debugActions')
	});

	$('#userDataPath').html(await getWindowValue('userDataPath'));
	$('#workCreateFlag').html(await getWindowValue('workCreateFlag'));
	$('#spiderReqSlaveFlag').html(await getWindowValue('spiderReqSlaveFlag'));

	var now = new Date();
	var Ymd = Math.ceil(now.getTime()/1000/await getWindowValue('spiderSlavePerDayMaxRunTimesFrequencyRang'));
	$('#spiderSlaveStackRunActionCount').html(await getWindowValue('spiderSlaveStackRunActionCount',[Ymd])===null?0:await getWindowValue('spiderSlaveStackRunActionCount',[Ymd]));
	$('#spiderSlaveActionCountChangeUser').html(await getWindowValue('spiderSlaveActionCountChangeUser'));
	$('#spiderSlavePerDayMaxRunTimes').html(await getWindowValue('spiderSlavePerDayMaxRunTimes'));
	$('#spiderSlavePerDayMaxRunTimesFrequencyRang').html(parseFloat((await getWindowValue('spiderSlavePerDayMaxRunTimesFrequencyRang')/3600).toFixed(2)));
	$('#spiderSlaveUserName').html(await getWindowValue('userName'));
}

layui.use(['element', 'layer', 'form', 'jquery'],function () {
	var form = layui.form;
	var $ = layui.$;

	function copyText(text) {
		var oInput = document.createElement('input');
		oInput.value = text;
		document.body.appendChild(oInput);
		oInput.select();
		document.execCommand("Copy");
		oInput.remove();
		layer.msg('已复制: '+text);
	}

	restoreData(form, $);

	form.on('switch(spiderSlaveOn)', function (data) {
		chrome.storage.local.set({ 'spiderSlaveOn': data.elem.checked }, async function () {
			await getWindowValue('loadConfig');
			if (data.elem.checked) {
				await getWindowValue('workPlay');
			} else {
				await getWindowValue('workPause');
				if(await getWindowValue('spiderSlaveHelpmate') === true) {
					await getWindowValue('moveKeepLiveUser');
				}
			}
		});

	});

	$("input[name=spiderSlaveApi]").on("input",async function(e){
		form.val('workerConfig', {
			"spiderSlaveApiActionList": await getWindowValue('spiderSlaveApiActionList').replace(await getWindowValue('spiderSlaveApi'),$(this).val())
			, "spiderSlaveApiCb": await getWindowValue('spiderSlaveApiCb').replace(await getWindowValue('spiderSlaveApi'),$(this).val())
		});
	});

	$('#spiderSlaveApiTips').click(function () {
		layer.tips(
			'1、“拉取动作URL”和“上传结果URL”的请求，都是在“主页URL”页面下进行POST传输。<br/>' +
			'2、“主页URL”、拉取动作URL和上传结果URL必须同一域名下，防止出现跨域问题。<br/>'
			, '#spiderSlaveApiTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose: true,
			time: 30000
		});
	});
	$('.copy').on('click',function () {
		copyText($(this).text());
	});

	$('#spiderSlaveApiActionListTips').click(function () {
		var text = '{"code":0,"data":[{"id":1,"url":"https://gitee.com/colin_86/MDword","type":1,"code":1}]}';
		var jsonPretty = JSON.stringify(JSON.parse(text), null, 4);
		layer.tips(
			'<h2 style="line-height: 35px;">响应的JOSN格式:</h2>' +
			'<pre style="background-color:white;color:black;padding:5px;">' + jsonPretty + '</pre>'
			, '#spiderSlaveApiActionListTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose: true,
			time: 30000
		});
	});

	$('#spiderSlaveApiCbTips').click(function () {
		layer.tips(
			'<h2 style="line-height: 35px;">提交的POST数据:</h2>' +
			'<pre style="background-color:white;color:black;padding:5px;">id=1&sResponse=PGhlYWQ%2BCgk8bWV0YS..HTML BASE64..BjaGFyc2V0PSJ1dGYt</pre>'
			, '#spiderSlaveApiCbTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose: true,
			time: 30000
		});
	});

	//监听提交
	form.on('submit(workerConfig)', async function (data) {
		chrome.storage.local.set(data.field, function () {
			layer.msg('储存成功');
		});

		await getWindowValue('loadConfig');
		return false;
	});


	window.actionsTplF = {
		"code": 0,
		"data": "--data--"
	};

	window.actionsTpl_default = [
		{
			"id": "debug",
			"url": "https://www.baidu.com",
			"type": 1,
			"code": 1
		}
	];

	window.actionsTpl_201 = [
		{
			"id": "debug",
			"url": "https://www.baidu.com",
			"type": 1,
			"param": {
				'delay':1000
				,'lockTab':1
				,'save':0
				,sub:[
					{
						"id": "2",
						"url": "https://www.baidu.com",
						"action": "getCookies",
						"type": 200,
						"param": {
							'delay':2000,
							'save':1,
							'lockTab':1
						},
						"code": 1
					}
				]
			},
			"code": 1,
		}
	];

	window.actionsTpl_106 = [
		{
			"id": "debug",
			"url": "https://www.facebook.com/cnanewstaiwan/posts/526184426206794",
			"type": 1,
			"param": {
				'delay':1000
				,'lockTab':1
				,'save':0
				,sub:[
					{
						"id": "2",
						"url": "return new Promise(function(resolve,reject) {$('span[dir=auto]:contains(\"最相关\")').click();setTimeout(function(){$('span[dir=auto]:contains(\"包括疑似垃圾信息的内容\")').click();resolve(666)},5000);});",
						"type": 100,
						"param": {
							'background':1,
							'delay':2000,
							'save':1,
							'lockTab':1
						},
						"code": 1
					}
				]
			},
			"code": 1,
		}
	];

	window.actionsTpl_107 = [
		{
			"id":"RANDOM0",
			"url":"https://www.discuss.com.hk/viewthread.php?tid=31488423",
			"type":1,
			"param":{
				"lockTab":1,
				"lockTabFlag":"debug"
			},
			"code":1
		}
	];
	
	window.actionsTpl_108 = [
		{
			"url":"https://gitee.com/colin_86/MDword",
			"type":107,
			"param":{
				"lockTab":1,
				"lockTabFlag":"debug"
			},
			"code":1
		}
	];

	window.actionsTpl_202 = [
		{
			"id": "debug",
			"url": "https://www.baidu.com",
			"type": 1,
			"save":0,
			"param": {
				'delay':1000
				,'lockTab':1
				,'sub':[
					{
						"id": "2",
						"url": "https://www.baidu.com",
						"action": "createUser",
						"type": 200,
						"param": {
							'delay':2000,
							'save':1,
							'saveas':'createUserInfo',
							'lockTab':1
						},
						"code": 1
					},
					{
						"id": "2",
						"url": "N/A",
						"action": "deleteUser",
						"type": 200,
						"param": {
							'delay':10000,
							'preeval':"info['url'] = info['saveas']['createUserInfo']['result']['Data'];",
							'lockTab':1
						},
						"code": 1
					},
				]
			},
			"code": 1,
		}
	];

	window.actionsTpl_1 = [
		{
			"id": "debug",
			"url": "https://gitee.com/colin_86/MDword",
			"type": 1,
			"param": {
				'lockTab':1,
				'lockTabFlag':'debug',
			},
			"code": 1
		}
	];

	window.actionsTpl_100 = [
		{
			"id": "debug",
			"url": "https://gitee.com/colin_86/MDword",
			"type": 1,
			"param": {
				'lockTab':1,
				'lockTabFlag':'debug',
			},
			"code": 1
		},
		{
			"id": "debug2",
			"url": 'console.log("actionsTpl_100");return 999;',
			"type": 100,
			"param": {
				'lockTab':1,
				'lockTabFlag':'debug',
			},
			"code": 1
		}
	];
	window.actionsTpl_101 = [
		{
			"id": "debug",
			"url": `return new Promise(function(resolve,reject) {setTimeout(function() {resolve(1);},5000);})`,
			"type": 100,
			"param": {
				'lockTab':1,
				'lockTabFlag':'debug',
			},
			"code": 1
		}
	];

	var fbName = 'cc103';
	window.actionsTpl_103 = [
		{
			"id": "1",
			"url": "https://www.facebook.com/r.php?locale=zh_CN",
			"type": 1,
			"param": {
				'delay':3000
				,'lockTab':1
				,sub:[
					{
						"id": "2",
						"url": "$('input[name=lastname]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"input"
							,'text':"ni"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "3",
						"url": "$('input[name=firstname]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"input"
							,'text':"ga"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "3",
						"url": "$('input[name=reg_email__]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"input"
							,'text':"http://127.0.0.1:81/api/PostfixApi/newemail?name="+fbName
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "3",
						"url": "$('input[name=reg_email_confirmation__]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"input"
							,'text':fbName+"@igpartner.com"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "3",
						"url": "$('input[name=reg_passwd__]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"input"
							,'text':"Ccl1234"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "$('input[name=lastname]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"click"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "$('input[name=sex]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"click"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "$('select[name=birthday_year]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"select"
							,'index':22
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "$('select[name=birthday_year]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"click"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "$('button[name=websubmit]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"click"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "3",
						"url": "$('input[name=code]')[0]",
						"type": 103,
						"param": {
							'delay':15000
							,'predelay':20000
							,'method':"input"
							,'text':"http://127.0.0.1:81/api/PostfixApi/getFacebookCode?email="+fbName+"@igpartner.com"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "3",
						"url": "$('button[name=confirm]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"click"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "3",
						"url": "$('a[role=button]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"click"
							,'lockTab':1
						},
						"code": 1
					},
				]
			},
			"code": 1
		},
	];

	window.actionsTpl_104 = [
		{
			"id": "1",
			"url": "https://www.97caijing.com/article/119515",
			"type": 1,
			"param": {
				'delay':3000
				,'lockTab':1
				,'musave':1
				,sub:[
					{
						"id": "2",
						"url": "$('.stock-block-box')",
						"type": 104,
						"param": {
							'delay':3000
							,'lockTab':1
							,'save':1
						},
						"code": 1
					}
				]
			},
			"code": 1
		},
	];

	window.actionsTpl_105 = [
		{
			"id": "1",
			"url": "https://www.97caijing.com/article/119515",
			"type": 1,
			"param": {
				'delay':3000
				,'lockTab':1
				,"lockTabFlag":"debug"
				,'musave':1
				,sub:[
					{
						"id": "2",
						"url": "",
						"type": 105,
						"param": {
							'delay':3000
							,'lockTab':1
							,'save':1
							,'width':1920
							,'height':1080
							,'maxHeight':4000
							,'smartMaxHeight':1000
						},
						"code": 1
					}
				]
			},
			"code": 1
		},
	];

	window.actionsTpl_102 = [
		{
			"id": "1",
			"url": "https://news.baidu.com/",
			"type": 1,
			"param": {
				'scrollMaxCount':1
				,'clientHeight':400
				,'delay':3000
				,'lockTab':1
				,'fixed':1
				,sub:[
					{
						"id": "3",
						"url": "return false;",
						"type": 102,
						"param": {
							'scrollMaxCount':20
							,'clientHeight':400
							,'delay':1000
						},
						"code": 1
					}
				]
			},
			"code": 1
		}
	];

	window.actionsTpl_501 = [
		{
			"id": "1",
			"url": "https://www.facebook.com/?sk=favorites",
			"type": 1,
			"param": {
				'scrollMaxCount':1
				,'clientHeight':400
				,'delay':3000
				,'lockTab':1
				,'fixed':1
				,sub:[
					{
						"id": "2",
						"url": "https://www.facebook.com/%E6%9D%B1%E6%96%B9%E6%97%A5%E5%A0%B1-638924839545704/",
						"type": 1,
						"code": 1
					},
					{
						"id": "3",
						"url": "https://www.facebook.com/%E6%9D%B1%E6%96%B9%E6%97%A5%E5%A0%B1-638924839545704/",
						"type": 102,
						"param": {
							'scrollMaxCount':20
							,'clientHeight':400
							,'delay':3000
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "var more = document.evaluate('//div[text()=\"查看更多\"]', document, null, XPathResult.ANY_TYPE, null);var node = more.iterateNext();while(node) {node.click();node = more .iterateNext();}",
						"type": 100,
						"param": {
							'delay':1000
						},
						"code": 1
					},
				]
			},
			"code": 1
		},
		{
			"id": "5",
			"url": "https://www.facebook.com/?sk=favorites",
			"type": 1,
			"param": {
				'scrollMaxCount':3
				,'clientHeight':400
				,'delay':3000
				,'fixed':1
				,sub:[
					{
						"id": "6",
						"url": "https://www.facebook.com/mingpaoinews/",
						"type": 1,
						"code": 1
					},
					{
						"id": "7",
						"url": "var more = document.evaluate('//div[text()=\"查看更多\"]', document, null, XPathResult.ANY_TYPE, null);var node = more.iterateNext();while(node) {node.click();node = more .iterateNext();}",
						"type": 100,
						"param": {
							'delay':1000
						},
						"code": 1
					},
					{
						"id": "8",
						"url": "https://www.facebook.com/%E6%9D%B1%E6%96%B9%E6%97%A5%E5%A0%B1-638924839545704/",
						"type": 1,
						"code": 1
					},
					{
						"id": "9",
						"url": "https://www.facebook.com/%E6%9D%B1%E6%96%B9%E6%97%A5%E5%A0%B1-638924839545704/",
						"type": 102,
						"param": {
							'scrollMaxCount':30
							,'clientHeight':800
							,'delay':3000
						},
						"code": 1
					},
					{
						"id": "10",
						"url": 'var more = document.evaluate(\'//div[text()="查看更多"]\', document, null, XPathResult.ANY_TYPE, null);var node = more .iterateNext();while(node) {node.click();node = more .iterateNext();}',
						"type": 100,
						"param": {
							'delay':1000
						},
						"code": 1
					}
				]
			},
			"code": 1
		},
	];
	window.actionsTpl_502 = [
		{
			"id": "1",
			"url": "https://news.baidu.com/",
			"type": 1,
			"param": {'scrollMaxCount':200},
			"code": 1
		},
	];

	window.actionsTpl_503 = [
		{
			"id": "random",
			"url": "https://www.baidu.com",
			"type": 1,
			"param": {'lockTab':1,'fixed':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://news.baidu.com/",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://news.baidu.com/",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://stackoverflow.com/",
			"type": 1,
			"param": {'lockTab':0},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://stackoverflow.com/questions",
			"type": 1,
			"param": {'lockTab':0},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://stackoverflow.com/tags",
			"type": 1,
			"param": {'lockTab':0,'lockTabFlag':'https://stackoverflow.com'},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://baijiahao.baidu.com/s?id=1757872780458350980",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://baijiahao.baidu.com/s?id=1757872780458350980",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://baijiahao.baidu.com/s?id=1757874352432974125",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
	];

	window.actionsTpl_504 = [
		{
			"id": "random",
			"url": "https://lihkg.com",
			"type": 1,
			"param": {
				'scrollMaxCount':1,
				"lockTab": 1,
				"lockTabFlag": "siteId-43",
				"delay": 10000
			},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://lihkg.com/api_v2/thread/2715272/page/1?order=reply_time",
			"type": 101,
			"param": {
				"lockTab": 1,
				"lockTabFlag": "siteId-43",
				"delay": 10000
			},
			"code": "ed886b4525c3b66bcb546676ed4f3752"
		}
	];

	window.actionsTpl_505 = [
		{
			"id": "random",
			"url": "https://lihkg.com1",
			"type": 1,
			"param": {
				'scrollMaxCount':1,
				"lockTab": 1,
				"lockTabFlag": "siteId-43",
				"delay": 3000
			},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://lihkg.com",
			"type": 1,
			"param": {
				'scrollMaxCount':1,
				"lockTab": 1,
				"lockTabFlag": "siteId-43",
				"delay": 3000
			},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://lihkg.com/api_v2/thread/2715272/page/1?order=reply_time",
			"type": 101,
			"param": {
				"lockTab": 1,
				"lockTabFlag": "siteId-43",
				"delay": 10000
			},
			"code": "ed886b4525c3b66bcb546676ed4f3752"
		}
	];

	window.actionsTpl_506 = [
		{
			"id": "1",
			"url": "https://search.bilibili.com/video?keyword=%E6%9F%90%E8%99%8E&search_source=1",
			"type": 1,
			"param": {
				"delay":3000,
				"requestHeaderFilter":["web-interface/nav"]
			},
			"code": 1
		},
	];

	window.actionsTpl_507 = [
		{
			"id": "1",
			"url": "https://www.google.com/",
			"type": 1,
			"param": {
				'delay':3000
				,'lockTab':1
				,sub:[
					{
						"id": "2",
						"url": "$('textarea[aria-label=搜索]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"input"
							,'text':"阿里巴巴"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "$('textarea[aria-label=搜索]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"KeyTap"
							,'text':"enter"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "$('textarea[aria-label=搜索]')[0]",
						"type": 103,
						"param": {
							'predelay':5000
							,'method':"input"
							,'text':"国美"
							,'lockTab':1
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "$('textarea[aria-label=搜索]')[0]",
						"type": 103,
						"param": {
							'delay':3000
							,'method':"KeyTap"
							,'text':"enter"
							,'lockTab':1
						},
						"code": 1
					}
				]
			},
			"code": 1
		},
	];

	form.on('select(debugType)', function(data){
		loadTestActions(data.value);
	});

	$('#debugrefreshactions').click(function() {
		loadTestActions($('select[lay-filter=debugType]').val());
		return false;
	});

	function loadTestActions(value){
		console.log('actionsTpl_'+value,typeof(window['actionsTpl_'+value]));
		if(typeof(window['actionsTpl_'+value]) != "undefined") {
			var actions = window['actionsTpl_'+value];
		}else{
			actionsTpl_default[0]['type'] = parseInt(value);
			var actions = actionsTpl_default;
		}
		// if(eval('typeof(actionsTpl_'+value+') != "undefined"')) {
		// 	var actions = eval('actionsTpl_'+value);
		// }else{
		// 	actionsTpl_default[0]['type'] = parseInt(value);
		// 	var actions = actionsTpl_default;
		// }

		var actionsString = '';
		var index = 0;
		actions.forEach(v => {
			v.id = 'RANDOM'+index;
			actionsString += "        "+JSON.stringify(v);
			if(actions.length !== index+1) {
				actionsString += ",\r";
			}
			index++;
		});
		
		form.val('debugConfig',
			{
				'debugActions':JSON.stringify(window.actionsTplF,null,4).replace('"--data--"',["[\r"+actionsString+"\r    ]"])
			}
		);
	}

	form.on('submit(debugConfig)', function (data) {
		chrome.storage.local.set(data.field, async function () {
			layer.msg('正在执行');
			// await getWindowValue('loadConfig');

			await getWindowValue('debugRun',[JSON.parse(data.field['debugActions'])]);
		});
		return false;
	});

	form.on('submit(debugConfigReset)',function (data) {
		chrome.storage.local.set(data.field, async function () {
			layer.msg('已重置');
			await getWindowValue('loadConfig');

			await getWindowValue('debugRunReset',[JSON.parse(data.field['debugActions'])]);
		});
		return false;
	});


	async function reloadCookie() {
		var url = $('form[lay-filter=cookies] input[name=url]').val();

		if(url === '') {
			$('.sync-cookies-box').hidden();
			$('#sync-cookies').html('');
			return ;
		}

		base64 = await getWindowValue('getCookiesSync',[url])
		cookiesJson = await getWindowValue('base64ToString',[base64])
		$('.sync-cookies-box').show();
		$('#sync-cookies').html(cookiesJson);
	}

	/* form.on('submit(pullcookies)', function (data) {
		workArr = data.field.work.split('@',2);
		url = 'http://'+workArr[0]+':1236/slave/action';
		var formData = new FormData();
		formData.append("sWorkCreateFlag", workArr[1]);
		formData.append("Content", '{"type":1,"action":"getCookies","info":{"url":"'+data.field.url+'"}}');

		bg.xhrPost(url,formData,undefined,'json').then((v)=>{
			var cookiesJson = bg.base64ToString(v.Content);
			bg.setCookies(undefined, {"url":data.field.url,"param":{"cookies":cookiesJson}}, (c)=>{
				c = bg.base64ToString(c)
				if(c === '-1') {
					layer.msg("同步失败");
				}else{
					layer.msg('同步'+c+'个cookie');
					reloadCookie();
				}
			})
		});

		return false;
	});

	form.on('submit(pushcookies)', function (data) {
		workArr = data.field.work.split('@',2);
		url = 'http://'+workArr[0]+':1236/slave/action';

		reloadCookie();

		var formData = new FormData();
		formData.append("sWorkCreateFlag", workArr[1]);
		var content = {
			"type":1,
			"action":"setCookies",
			"info":{
				"url":data.field.url,
				"param":{
					"cookies":$('#sync-cookies').html()
				}
			},
		};
		formData.append("Content", JSON.stringify(content));

		bg.xhrPost(url,formData,undefined,'json').then((v)=>{
			layer.msg('同步'+bg.base64ToString(v)+'个cookie');
		});

		return false;
	}); */

	form.on('submit(clearcookies)', function (data) {
		layer.confirm('是否删除？', {
			title: "操作提示",
			icon: 0,
			btn: ['确定', '取消']
		}, async function () {
			c = await getWindowValue('clearCookiesSync',[undefined, { "url": data.field.url }]);
			layer.msg('删除' + c + '个cookie');
			reloadCookie();
		});

		return false;
	});

	$("form[lay-filter=cookies] input[name=url]").on("input",function(e){
		reloadCookie();
	});

	function storeData() {
		chrome.storage.local.set(data.field, function () {
			layer.msg('储存成功');
		});
	}

	function reStoreData() {
		chrome.storage.local.set(data.field, function () {
			layer.msg('储存成功');
		});
	}

	reloadCookie();
});