window.actionComplete = true;
window.ajaxRecordDebug = false;

function waitDomAddChildByText(dom,pattern,maxRunTime,minRunTime,watchAttrChange,watchDomRemove,checkDomCb) {
	var p = new Promise(function(resolve,reject) {
		var observer = undefined;
		var setTimeoutObj = undefined;
		var setTimeoutMinObj = undefined;
		var obMatched = false;

		//min run time
		if(minRunTime && minRunTime > 0) {
			setTimeoutMinObj = setTimeout(function() {
				setTimeoutMinObj = undefined;
				console.log('MutationObserver minRunTime',minRunTime);
				if(obMatched === true) {
					resolve(2);
				}
			},minRunTime);
		}

		if(dom !== undefined && pattern !== undefined) {
			var callback = function(mutationsList, observerTemp) {
				for(let mutation of mutationsList) {
					if (watchAttrChange && (mutation.type === 'attributes' || mutation.type === 'characterData')) {
						if(((mutation.type === 'attributes' && $(mutation.target).is(":visible")) || mutation.type === 'characterData') && pattern.test((checkDomCb !== undefined?checkDomCb(mutation.target):mutation.target.textContent))) {
							obMatched = true;
							if(setTimeoutObj !== undefined) {
								clearTimeout(setTimeoutObj);
								setTimeoutObj = undefined;
							}

							console.log('MutationObserver attr change matched',pattern);

							if(setTimeoutMinObj === undefined) {
								observerTemp.disconnect();
								resolve(1);
							}

							return;
						}

						continue;
					}

					//add dom
					if(mutation['addedNodes'].length > 0) {
						for(var addNodeIdx in mutation['addedNodes']) {
							if(pattern.test((checkDomCb !== undefined?checkDomCb(mutation['addedNodes'][addNodeIdx]):mutation['addedNodes'][addNodeIdx].textContent))) {
								obMatched = true;
								if(setTimeoutObj !== undefined) {
									clearTimeout(setTimeoutObj);
									setTimeoutObj = undefined;
								}

								console.log('MutationObserver matched',pattern);

								if(setTimeoutMinObj === undefined) {
									observerTemp.disconnect();
									resolve(1);
								}
								return;
							}
						}
					}

					//move dom
					if(watchDomRemove && mutation['removedNodes'].length > 0) {
						for(var addNodeIdx in mutation['removedNodes']) {
							if(pattern.test((checkDomCb !== undefined?checkDomCb(mutation['removedNodes'][addNodeIdx]):mutation['removedNodes'][addNodeIdx].textContent))) {
								obMatched = true;
								if(setTimeoutObj !== undefined) {
									clearTimeout(setTimeoutObj);
									setTimeoutObj = undefined;
								}

								console.log('MutationObserver move node matched',pattern);

								if(setTimeoutMinObj === undefined) {
									observerTemp.disconnect();
									resolve(1);
								}
								return;
							}
						}
					}
				}
			};
	
			console.log('MutationObserver start');
	
			observer = new MutationObserver(callback);
			var options = {childList: true, subtree: true};
			if(watchAttrChange) {
				options['characterData'] = true;
				options['attributes'] = true;
			}
			observer.observe(dom, options);
		}

		//max run time
		if(maxRunTime && maxRunTime > 0) {
			setTimeoutObj = setTimeout(function() {
				setTimeoutObj = undefined;
				console.log('MutationObserver maxRunTime',maxRunTime);
				if(observer !== undefined) {
					observer.disconnect();
				}
				resolve(0);
			},maxRunTime);
		}
	});

	return p;
}

// [
// 	{
// 		selector: 
// 			'somediv:contains("最相关"),'
// 			+'somediv:contains("从旧到新"),'
// 			,
//		click: function(node) {node.click();},//点击动作自定义
//		autoDomCenter: false,//dom自当移动至中间
//		scrollSelector: window,//滚动条
// 		canBetch: false,//批量执行
// 		minRunTime: 0,//最小执行时间
// 		maxRunTime: 5000,//最大执行时间
// 		renderTime: 0,//渲染时间，也就是数据加载出来后再等会儿
// 		maxTimes: 1,//连续执行次数
// 		checkSelector: 'body',//监听字节点的父节点
// 		checkDomCb: function(target) {return target.textContent;},//监听内容，checkDomCb为undefined监听target.textContent，target.textContent：文字；target.outerHTML：html
// 		watchAttrChange: true,//监听attr改变，并判断dom是否可见，再进行checkContentRegExp判断
// 		watchDomRemove: true,//监听dom移除，再进行checkContentRegExp判断
// 		remark: "点击最相关",//备注文字
// 		checkContentRegExp: /显示所有评论/,//新增子节点文字是否能通过这个正则，用于判断内容是否加载完成
// 	}
// ]
function autoClicks(clicks) {
	var p = new Promise(async function(autoClicksResolve,autoClicksReject) {
		outer: for(var itemIdx in clicks){
			var click = clicks[itemIdx];
			
			if(typeof(click.selector) == 'string') {
				if(click.selector[click.selector.length-1] === ',') {
					click.selector = click.selector.slice(0,-1);
				}
			}
			console.log('开始点击' + click.selector);
	
			if(click['minRunTime'] === undefined) {
				click['minRunTime'] = 0;
			}

			if(click['watchAttrChange'] === undefined) {
				click['watchAttrChange'] = false;
			}
	
			if(click['maxTimes'] === undefined) {
				click['maxTimes'] = 1;
			}
	
			if(click['maxTimes'] === 0) {
				click['maxTimes'] = 10;
			}
	
			if(click['beforeClickTime'] === undefined) {
				click['beforeClickTime'] = 0;
			}

			if(click['renderTime'] === undefined) {
				click['renderTime'] = 0;
			}
	
			if(click['canBetch'] === undefined) {
				click['canBetch'] = false;
			}
	
			if(click['autoDomCenter'] === undefined) {
				click['autoDomCenter'] = true;
			}
	
			for(var times = 0;times < click['maxTimes'];times++) {
				if(click['beforeClickTime'] > 0 && r === 1) {
					await new Promise(function(resolve,reject) {setTimeout(function() {resolve(1)},click['renderTime'])});
				}

				//字符串：临时获取；函数：执行回调
				if(click.selector && typeof(click.selector) == 'function') {
					var nodes = click.selector(click,times);
				}else{
					var nodes = $(click.selector);
				}
				
				if(nodes.length <= 0){
					continue outer;
				}
				
				var scrollSelector = click.scrollSelector;
				//字符串：临时获取；函数：执行回调；其他：直传
				if(click.scrollSelector && typeof(click.scrollSelector) == 'string') {
					scrollSelector = $(click.scrollSelector)[0];
				}else if(click.scrollSelector && typeof(click.scrollSelector) == 'function'){
					scrollSelector = click.scrollSelector(click,times);
				}else{
					scrollSelector = click.scrollSelector;
				}
	
				if(click['autoDomCenter'] === true) {
					domCenter(nodes[0],'smooth',scrollSelector);
				}
	
				var r = undefined;
				if(click['canBetch']) {
					console.log('times',times,nodes.length);
					var p = waitDomAddChildByText($(click['checkSelector'])[0], click['checkContentRegExp'],click['maxRunTime'],click['minRunTime'],click['watchAttrChange'],click['watchDomRemove'],click['checkDomCb']);
					await new Promise(function(resolve,reject) {setTimeout(function() {resolve(1)},100)});
					for(var nodeIdx = 0;nodeIdx < nodes.length;nodeIdx++){
						if(click['click'] === undefined) {
							nodes[nodeIdx].click();
						}else{
							click['click'](nodes[nodeIdx],times);
						}
					}
					r = await p;
				}else{
					console.log('times',times,nodes.length);
					var p = waitDomAddChildByText($(click['checkSelector'])[0], click['checkContentRegExp'],click['maxRunTime'],click['minRunTime'],click['watchAttrChange'],click['watchDomRemove'],click['checkDomCb']);
					await new Promise(function(resolve,reject) {setTimeout(function() {resolve(1)},100)});
					if(click['click'] === undefined) {
						nodes[0].click();
					}else{
						click['click'](nodes[0],times);
					}
					r = await p;
				}
	
				if(click['renderTime'] > 0 && r === 1) {
					await new Promise(function(resolve,reject) {setTimeout(function() {resolve(1)},click['renderTime'])});
				}
			}
		}
	
		console.log('全部结束');
		autoClicksResolve(1);
	});

	return p;
}

function topRunJs(jsStr) {
	var p = new Promise(function(resolve,reject) {
		pageRunJs(jsStr,function(base64){
			resolve(base64ToString(base64))
		});
	});
	return p;
}

function pageRunJs(jsStr,cb,background) {
	var domRandomId = "MDspider-help-dom-result-"+randomStr();

	const config = { attributes: true};

	var setInterval_pageRunJs = undefined;
	const callback = function(mutationsList, observer) {
		for(let mutation of mutationsList) {
			if (mutation.type === 'attributes') {
				if(mutation.attributeName === 'isdone') {
					if(cb) {
						var html = tempDom.html();
						if(setInterval_pageRunJs !== undefined) {
							clearInterval(setInterval_pageRunJs);
						}
						cb(html);
					}
					tempDom[0].remove();
				}
			}
		}
	};

	if(background === undefined) {
		try {
			var tempDom = $("<div id=\""+domRandomId+"\" style=\"display:none;\" onclick=\""+
			`window.domRandomId = &quot;`+domRandomId+`&quot;;
			window.ajaxRecordDebug = `+window.ajaxRecordDebug+`;
			function blobToBase64(blob, callback) {
				var reader = new FileReader();
				reader.readAsDataURL(blob);
				reader.onload = function (e) {
					callback(e.target.result);
				}
			 };
			 function isPromise(obj) {
				return !!obj && (typeof obj === &quot;object&quot; || typeof obj === &quot;function&quot;) && typeof obj.then === &quot;function&quot;;
			 };
			 var textToBase64 = function(text, callback) {
				var blob = new Blob([text]);
				blobToBase64(blob,callback);
			};

			try {
				`+('var r = (function () {'
				+jsStr.replace(/\\\\/g,"\\")//compatible with older versions
				.replace(/'/g,"\'").replace(/[\r\n]/g,"") + '})();'
				).replace(/"/g,'&quot;')+`
			} catch (e) {
				var js = `+('\''+jsStr.replace(/'/g,"\\'")+'\'').replace(/[\r\n]/g,"").replace(/"/g,'&quot;')+`;
				console.error(e,js);
				var r = &quot;ERROR: \r\n&quot;+JSON.stringify(e.stack)+&quot;\r\n\r\nRUN JS: \r\n&quot;+js;
			}
			if(isPromise(r)) {
				r.then(function(promiseR){
					textToBase64(promiseR==undefined?0:promiseR,function(base64){
						this.innerHTML = base64;
						this.setAttribute(&quot;isdone&quot;,1);
					}.bind(this));
				}.bind(this));
			}else{
				textToBase64(r==undefined?0:r,function(base64){
					this.innerHTML = base64;
					this.setAttribute(&quot;isdone&quot;,1);
				}.bind(this));
			}`.replace(/[\r\n]/g,"")+"\"></div>");
		} catch (e) {
			//have error ,force background
			background = true;
		}
	}

	if(background !== undefined) {
		var tempDom = $("<div id=\""+domRandomId+"\" style=\"display:none;\"></div>");
		$("html").append(tempDom);

		var observer = new MutationObserver(callback);
		observer.observe(tempDom[0], config);

		var js = '(function () {window.ajaxRecordDebug = '+window.ajaxRecordDebug+';'
		+jsStr.replace(/[\r\n]/g,"") + '})()';

		try {
			var r = eval(js);
		} catch (e) {
			console.error(e);
			var r = "ERROR: r\n"+JSON.stringify(e.stack)+"\r\n\r\nRUN JS: \r\n"+js;
		}
		
		if(isPromise(r)) {
			r.then(function(promiseR){
				textToBase64(promiseR==undefined?0:promiseR,function(base64){
					tempDom[0].innerHTML = base64;
					tempDom[0].setAttribute("isdone",1);
				}.bind(this));
			}.bind(this));
		}else{
			textToBase64(r==undefined?0:r,function(base64){
				tempDom[0].innerHTML = base64;
				tempDom[0].setAttribute("isdone",1);
			}.bind(this));
		}
	}else{
		$("html").append(tempDom);

		var observer = new MutationObserver(callback);
		observer.observe(tempDom[0], config);

		if($("#MDtopRunjsListion").length > 0) {
			$("#MDtopRunjsListion").attr("domid",domRandomId);
		}else{
			tempDom.click();
		}
	}

	if(cb) {
		var setInterval_pageRunJsCount = 0;
		setInterval_pageRunJs = setInterval(function() {
			setInterval_pageRunJsCount++;
			if(setInterval_pageRunJsCount > 10){
				if($('#'+domRandomId).length == 0) {
					clearInterval(setInterval_pageRunJs);
					cb('');
					tempDom[0].remove();
				}
			}
		},200);
	}
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if(window.spiderData === undefined) {
			window.spiderData = {};
			window.spiderDataLoading = {};
		}

		//api request
		if(request.admintype) {
			switch(request.admintype) {
				case 1:
				case 2:
					$.ajax({
						type: 'POST',
						url: request.url,
						data: request.data,
						success: function(data){
						},
					});
					break;
				case 3://console log from background
					sendResponse('content: got it!');
					break;
				default:
					break;
			}
		}else if(request.actiontype) {
			switch(request.actiontype) {
				//get html 
				case 1:
					if(window.spiderData[request.info.id] != undefined && window.actionComplete === true) {
						var blob = new Blob([JSON.stringify(window.spiderData[request.info.id])], { type: 'text/plain' });
						var file = URL.createObjectURL(blob);
						var data = {"id":request.info.id,'html':file,'actionComplete':window.actionComplete};
						//含有ID就是未跳转页面的结果，用于校验是否执行成功
						if(window.spiderDataLoading[request.info.id]) {
							data["id"] = request.info.id;
						}
						sendResponse(data);
						return ;
					}
					
					if(window.actionComplete === true) {
						//1:a,2:js,4:css,8:image,16:others,100:run js,101:ajax,102:scroll	
						switch(request.info.type) {
							case 2:
							case 4:
							case 8:
							case 16:
							case 100:
							case 101:
							case 103:
								//not lost req, break wait for response
								if(window.spiderDataLoading[request.info.id] != undefined) {
									break;
								}
							case 102:
							default:
								var promiseArr = [];
								var p = new Promise(function(resolve,reject) {
									textToBase64(document.getElementsByTagName('html')[0].innerHTML,function(base64){
										resolve(base64)
									});
								});
								promiseArr.push(p);

								if(request.info.includeIframe) {
									var iframes = document.getElementsByTagName('iframe');
									for(var iframeIdx=0; iframeIdx<iframes.length; iframeIdx++) {
										var p = new Promise(function(resolve,reject) {
											//get html max run time： 3s
											var setTimeoutGetHtml = setTimeout(()=>{
												textToBase64('time out!',function(base64){
													console.warn("获取frame html执行超时")
													resolve(base64);
												});
											},3000);

											pageRunJs("if (document.getElementsByTagName('iframe')["+iframeIdx+"] && document.getElementsByTagName('iframe')["+iframeIdx+"].contentDocument) {return document.getElementsByTagName('iframe')["+iframeIdx+"].contentDocument.getElementsByTagName('html')[0].innerHTML;}else{return false} ",function(base64) {
												clearTimeout(setTimeoutGetHtml);
												resolve(base64)
											});
										});
										promiseArr.push(p);
									}
								}

								Promise.all(promiseArr).then((result) => {
									if(result.length === 1) {
										window.spiderData[request.info.id] = result[0];
									}else{
										window.spiderData[request.info.id] = result;
									}
								})
								break;
						}
					}
					
			        sendResponse({'html':'','actionComplete':false});
					return ;
					break;
				//jump
				case 2:
					window.requestInfo = request.info;
					if(!(request.info && request.info.param && request.info.param.skipRecaptcha)) {
						window.spiderData = {};//clean data before run action
						window.spiderDataLoading = {};
					}
					window.spiderDataLoading[request.info.id] = true;

					if(request.info.url !== undefined) {
						//1:a,
						// 2:js,
						// 4:css,
						// 8:image,
						// 16:others,
						// 100:runjs
						// 103:human action
						// 104:screenshot html2canvas
						// 105:screenshot captureVisibleTab
						switch(request.info.type) {
							case 2:
							case 4:
							case 8:
							case 16:
							case 101:
								window.actionComplete = false;
								var xhr = new XMLHttpRequest()
								xhr.onreadystatechange = function () {
									if (this.readyState == 4 && this.status == 200) {
										blobToBase64(this.response,function(base64){
											window.spiderData[request.info.id] = base64;
											window.actionComplete = true;
										}.bind(this));
									}else if (this.readyState == 4) {
										textToBase64(this.status,function(base64){
											window.spiderData[request.info.id] = base64;
											window.actionComplete = true;
										}.bind(this));
									}
								}
								xhr.open('GET', request.info.url)
								xhr.responseType = 'blob'
								xhr.send()
								break;
							case 100:
								window.actionComplete = false;
								if(request.info.param && request.info.param.background !== undefined) {
									var background = request.info.param.background;
								}else{
									var background = undefined;
								}
								if(request.info.param && request.info.param.delay) {
									setTimeout(() => {
										pageRunJs(request.info.url,function(base64) {
											window.spiderData[request.info.id] = base64;
											window.actionComplete = true;
										},background);
									}, request.info.param.delay);
								}else{
									pageRunJs(request.info.url, function(base64) {
										window.spiderData[request.info.id] = base64;
										window.actionComplete = true;
									},background);
								}
								break;
							case 102:
								window.actionComplete = false;
								//default 1000
								var scrollMaxCount = 1000;
								if(request.info.param && request.info.param.scrollMaxCount) {
									var scrollMaxCount = request.info.param.scrollMaxCount;
								}

								var count = 0;

								var func_go = function() {
									var htmls = document.getElementsByTagName("html");
									if(htmls.length > 0) {
										var body = htmls[0];
									}else{
										var body = document.body;
									}

									var maxHeight = body.scrollHeight;
									var clientHeight = body.clientHeight*0.8;
									var offset = body.clientHeight*-1;

									if(request.info.param && request.info.param.clientHeight) {
										clientHeight = request.info.param.clientHeight;
										offset = 0;
									}

									window.setInterval_scroll = setInterval(function() {
										if(htmls.length > 0) {
											body.scrollTo(0,offset)
										}else{
											window.scroll(0,offset)
										}
										offset += clientHeight;
										pageRunJs(request.info.url,function(base64) {
											if(deleteBase64Pre(base64) === 'dHJ1ZQ==') {
												window.actionComplete = true;
												clearInterval(window.setInterval_scroll);
											}
										});

										if(offset > maxHeight || count++ > scrollMaxCount) {
											window.actionComplete = true;
											clearInterval(window.setInterval_scroll);
										}
										
										if(body.scrollHeight > maxHeight){
											maxHeight = body.scrollHeight;
										}
									},request.info.param.delay);
								}.bind(this);

								if(request.info.param && request.info.param.delay) {
									setTimeout(() => {
										func_go();
									}, request.info.param.delay);
								}else{
									func_go();
								}
								break;
							case 103:
								//click
								//input
								window.actionComplete = false;
								window.workCreateFlag = request.info.workCreateFlag;
								window.spiderSlaveFlag = request.info.spiderSlaveFlag;
								window.spiderSlaveHelpmateApi = request.info.spiderSlaveHelpmateApi;
								if(request.info.windowId) {
									window.MDspiderRandom = window.workCreateFlag+request.info.windowId;
								}else{
									window.MDspiderRandom = window.workCreateFlag+randomStr();
								}
								window.document.title = window.document.title+'&MDspiderRandom='+window.MDspiderRandom;
								var func_go = function() {
									//for wtop,wdefualt
									if(request.info.url === "") {
										var pos = [0,0];
									}else{
										var evalInfo = eval(request.info.url);
										if(Array.isArray(evalInfo)) {
											var pos = getRandomPos(domCenter(evalInfo[0]),request.info.spiderSlaveBaseInfo,evalInfo[1]);
										}else{
											var pos = getRandomPos(domCenter(evalInfo),request.info.spiderSlaveBaseInfo);
										}
									}

									if(pos === false) {
										console.error("dom lost: "+request.info.url);

										textToBase64("false",function(base64){
											window.spiderData[request.info.id] = base64;
											window.actionComplete = true;
										}.bind(this));
									}else if(request.info.param && request.info.param.method) {
										switch(request.info.param.method) {
											case 'click':
												wsPostForWork({
													id:4,
													method:"Robot.MoveClick",
													params:[pos[0],pos[1],'left',false]
												}).then(function(response){
													blobToBase64(response,function(base64){
														window.spiderData[request.info.id] = base64;
														window.actionComplete = true;
													}.bind(this));
												});
												break;
											case 'input':
												wsPostForWork({
													id:4,
													method:"Robot.MoveClick",
													params:[pos[0],pos[1],'left',false]
												}).then(function(response){
													//动态输入内容
													if(request.info.param.text && request.info.param.text.indexOf("http") === 0) {
														return xhrPost(request.info.param.text,{},function(resolve,reject,nowresponse){
															wsPostForWork({
																id:4,
																method:"Robot.TypeStr",
																params:[nowresponse.result.Data,1]
															}).then(function(response){
																resolve(response);
															});
														},'json',true)
													}else{
														return wsPostForWork({
															id:4,
															method:"Robot.TypeStr",
															params:[request.info.param.text?request.info.param.text:'',1]
														})
													}
												}).then(function(response){
													blobToBase64(response,function(base64){
														window.spiderData[request.info.id] = base64;
														window.actionComplete = true;
													}.bind(this));
												});
												break;
											case 'select':
												wsPostForWork({
													id:4,
													method:"Robot.MoveClick",
													params:[pos[0],pos[1],'left',false]
												}).then(function(response){
													return wsPostForWork({
														id:4,
														method:"Robot.KeyTap",
														params:['down',request.info.param.index?request.info.param.index:1]
													})
												}).then(function(response){
													blobToBase64(response,function(base64){
														window.spiderData[request.info.id] = base64;
														window.actionComplete = true;
													}.bind(this));
												});
												break;
											case 'KeyTap':
												wsPostForWork({
													id:4,
													method:"Robot.KeyTap",
													params:[request.info.param.text??"",1]
												}).then(function(response){
													blobToBase64(response,function(base64){
														window.spiderData[request.info.id] = base64;
														window.actionComplete = true;
													}.bind(this));
												});
												break;
											case 'wtop':
												wsPostForWork({
													id:4,
													method:"Robot.WindowTop",
													params:[pos[0],pos[1]]
												}).then(function(response){
													console.log(response);
													blobToBase64(response,function(base64){
														window.spiderData[request.info.id] = base64;
														window.actionComplete = true;
													}.bind(this));
												});
												break;
											case 'wdefault':
												wsPostForWork({
													id:4,
													method:"Robot.WindowDefault",
													params:[pos[0],pos[1]]
												}).then(function(response){
													blobToBase64(response,function(base64){
														window.spiderData[request.info.id] = base64;
														window.actionComplete = true;
													}.bind(this));
												});
												break;
										}
									}
								}

								if(request.info.param && request.info.param.delay) {
									setTimeout(() => {
										func_go();
									}, request.info.param.delay);
								}else{
									func_go();
								}
								break;
							case 104:
								window.actionComplete = false;
								if(request.info.param && request.info.param.delay) {
									var action = new Promise(function(resolve,reject) {
										setTimeout(function(){
											resolve(1);
										},request.info.param.delay)
									});
								}else{
									var action = new Promise(function(resolve,reject) {
										resolve(1);
									});
								}
								action.then(function() {
									var doms = eval(request.info.url);
									var promiseArr = [];
									for(var domidx in doms) {
										domTemp = doms[domidx];
										var isDOM = domTemp instanceof (HTMLElement);
										if(isDOM) {
											var p = new Promise(function(resolve,reject) {
												html2canvas(domTemp).then(function(canvas) {
													canvas.toBlob(function(blob) {
														blobToBase64(blob,function(base64){
															resolve(base64);
														}.bind(this));
													});
												});
											});

											promiseArr.push(p);
										}
									}

									Promise.all(promiseArr).then((result) => {
										window.spiderData[request.info.id] = result;
										window.actionComplete = true;
									})
								});
								break;		
							case 105:
								window.actionComplete = false;
								if(request.info.param && request.info.param.delay) {
									var action = new Promise(function(resolve,reject) {
										setTimeout(function(){
											resolve(1);
										},request.info.param.delay)
									});
								}else{
									var action = new Promise(function(resolve,reject) {
										resolve(1);
									});
								}
								action.then(function() {
									fullPageScreenShot(request.info).then((result)=>{
										window.spiderData[request.info.id] = result;
										window.actionComplete = true;
									});
								});
								break;		
							default:
								window.actionComplete = false;
								window.location.href=request.info.url;
								break;
						}
					}
					break;
				//set got request headers filter
				case 4:
					if(request.info && request.info.param && request.info.param.requestHeaderFilter) {
						pageRunJs("window.requestHeaderFilter = "+JSON.stringify(request.info.param.requestHeaderFilter));
					}
					break;
					//for got request headers
				case 3:
					if(request.info.url !== undefined) {
						// 100:runjs
						switch(request.info.type) {
							case 100:
								if(request.info.param && request.info.param.background !== undefined) {
									var background = request.info.param.background;
								}else{
									var background = undefined;
								}
								if(request.info.param && request.info.param.delay) {
									setTimeout(() => {
										pageRunJs(request.info.url,function(base64) {
										},background);
									}, request.info.param.delay);
								}else{
									pageRunJs(request.info.url, function(base64) {
									},background);
								}
								break;
						}
					}
					break;
				default:
					break;
			}
		}
		
		sendResponse('content: got it!');
	}
);

chrome.runtime.sendMessage(chrome.runtime.id,{"type":1},{"includeTlsChannelId":false},function() {});