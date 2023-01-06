window.actionComplete = true;

function pageRunJs(jsStr,cb) {
	var tempDom = $("<div id=\"MDspider-help-dom-result\" style=\"display:none;\" onclick=\"eval('\
	"+
	('function blobToBase64(blob, callback) {\
		var reader = new FileReader();\
		reader.readAsDataURL(blob);\
		reader.onload = function (e) {\
			callback(e.target.result);\
		}\
	 };\
	 function isPromise(obj) {\
		return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";\
	 };\
	 var textToBase64 = function(text, callback) {\
		var blob = new Blob([text]);\
		blobToBase64(blob,callback);\
	};\
	var r = (function () {'
	+jsStr.replace(/'/g,"\\'").replace(/[\r\n]/g,"") + '})();\
	if(isPromise(r)) {\
		r.then(function(promiseR){\
			textToBase64(promiseR==undefined?0:promiseR,function(base64){\
				this.innerHTML = base64;\
				this.setAttribute("isDone",1);\
			}.bind(this));\
		}.bind(this));\
	}else{\
		textToBase64(r==undefined?0:r,function(base64){\
			this.innerHTML = base64;\
			this.setAttribute("isDone",1);\
		}.bind(this));\
	}\
	')
	.replace(/"/g,'&quot;')+"')\"></div>");
	$("html").append(tempDom);
	tempDom.click();

	if(cb) {
		window.setInterval_pageRunJs = setInterval(function() {
			var tempDom = $('#MDspider-help-dom-result');
			if(tempDom.length > 0) {
				if(tempDom[0].getAttribute('isDone') == '1') {
					var html = tempDom.html();
					clearInterval(window.setInterval_pageRunJs);
					cb(html);
					tempDom[0].remove();
				}
			}else{
				clearInterval(window.setInterval_pageRunJs);
				cb();
			}
		},200);
	}
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if(window.spiderData === undefined) {
			window.spiderData = {};
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
						var data = {'html':window.spiderData[request.info.id],'actionComplete':window.actionComplete};
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
								break;
							case 101:
								break;
							case 103:
								break;
							case 102:
							default:
								var promiseArr = [];
								var p = new Promise(function(resolve,reject) {
									textToBase64(document.getElementsByTagName('html')[0].innerHTML,function(base64){
										resolve(base64)
									}.bind(this));
								});
								promiseArr.push(p);

								if(request.info.includeIframe) {
									var iframes = document.getElementsByTagName('iframe');
									console.log(iframes)
									for(var iframeIdx=0; iframeIdx<iframes.length; iframeIdx++) {
										var p = new Promise(function(resolve,reject) {
											pageRunJs("return document.getElementsByTagName('iframe')["+iframeIdx+"].contentDocument.getElementsByTagName('html')[0].innerHTML;",function(base64) {
												resolve(base64)
											});
										});
										promiseArr.push(p);
									}
								}

								Promise.all(promiseArr).then((result) => {
									console.log("result",result);
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
					window.spiderData = {};//clean data before run action

					if(request.info.url) {
						//1:a,
						// 2:js,
						// 4:css,
						// 8:image,
						// 16:others,
						// 100:runjs
						// 103:human action
						// 104:html screenshot
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
								if(request.info.param && request.info.param.delay) {
									setTimeout(() => {
										pageRunJs(request.info.url,function(base64) {
											window.actionComplete = true;
											window.spiderData[request.info.id] = base64;
										});
									}, request.info.param.delay);
								}else{
									pageRunJs(request.info.url, function(base64) {
										window.actionComplete = true;
										window.spiderData[request.info.id] = base64;
									});
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

									console.log("scroll",offset);
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
								window.spiderSlaveHelpmateApi = request.info.spiderSlaveHelpmateApi;
								var func_go = function() {
									var pos = getRandomPos(domCenter(eval(request.info.url)),request.info.spiderSlaveBaseInfo);
									if(pos === false) {
										textToBase64("false",function(base64){
											window.spiderData[request.info.id] = base64;
											window.actionComplete = true;
										}.bind(this));
									}else if(request.info.param && request.info.param.method) {
										switch(request.info.param.method) {
											case 'click':
												xhrPost(window.spiderSlaveHelpmateApi,{
													id:4,
													method:"Robot.MoveSmooth",
													params:[[pos[0],pos[1]]]
												}).then(function(response){
													return xhrPost(window.spiderSlaveHelpmateApi,{
														id:4,
														method:"Robot.Click",
														params:[['left',false]]
													})
												}).then(function(response){
													blobToBase64(response,function(base64){
														window.spiderData[request.info.id] = base64;
														window.actionComplete = true;
													}.bind(this));
												});
												break;
											case 'input':
												xhrPost(window.spiderSlaveHelpmateApi,{
													id:4,
													method:"Robot.MoveSmooth",
													params:[[pos[0],pos[1]]]
												}).then(function(response){
													return xhrPost(window.spiderSlaveHelpmateApi,{
														id:4,
														method:"Robot.Click",
														params:[['left',false]]
													})
												}).then(function(response){
													//动态输入内容
													if(request.info.param.text && request.info.param.text.indexOf("http") === 0) {
														return xhrPost(request.info.param.text,{},function(resolve,reject,nowresponse){
															xhrPost(window.spiderSlaveHelpmateApi,{
																id:4,
																method:"Robot.TypeStr",
																params:[[nowresponse.result.Data]]
															}).then(function(response){
																resolve(response);
															});
														},'json',true)
													}else{
														return xhrPost(window.spiderSlaveHelpmateApi,{
															id:4,
															method:"Robot.TypeStr",
															params:[[request.info.param.text?request.info.param.text:'']]
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
												xhrPost(window.spiderSlaveHelpmateApi,{
													id:4,
													method:"Robot.MoveSmooth",
													params:[[pos[0],pos[1]]]
												}).then(function(response){
													return xhrPost(window.spiderSlaveHelpmateApi,{
														id:4,
														method:"Robot.Click",
														params:[['left',false]]
													})
												}).then(function(response){
													return xhrPost(window.spiderSlaveHelpmateApi,{
														id:4,
														method:"Robot.KeyTap",
														params:[['down',request.info.param.index?request.info.param.index:1]]
													})
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
							default:
								window.location.href=request.info.url;
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