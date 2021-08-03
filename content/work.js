window.scrollIsEnd = true;

function pageRunJs(jsStr) {
	var tempDom = $("<div id=\"MDspider-help-dom-result\" style=\"display:none;\" onclick=\"eval('\
	"+
	('function blobToBase64(blob, callback) {\
		var reader = new FileReader();\
		reader.readAsDataURL(blob);\
		reader.onload = function (e) {\
			callback(e.target.result.replace(/data\\\\:[\\\\s\\\\S]+?;base64,/,""));\
		}\
	 };\
	 var textToBase64 = function(text, callback) {\
		var blob = new Blob([text]);\
		blobToBase64(blob,callback);\
	};\
	var r = (function () {'
	+jsStr.replace(/'/g,"\\'") + '})();\
	textToBase64(r==undefined?0:r,function(base64){\
		this.innerHTML = base64;\
	}.bind(this))')
	.replace(/"/g,'&quot;')+"')\"></div>");
	$("body").append(tempDom);
	tempDom.click();
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
					console.log(request)
					$.ajax({
						type: 'POST',
						url: request.url,
						data: request.data,
						success: function(data){
							if(request.admintype === 1) {
								chrome.runtime.sendMessage({'type':2,'tab':request.tab,'data':data});
							}
						},
					});
					break;
				case 3://console log from background
					console.log('background',request.obj);
					sendResponse('content: got it!');
					break;
				default:
					break;
			}
		}else if(request.actiontype) {
			switch(request.actiontype) {
				//get html 
				case 1:
					if(window.spiderData[request.info.id] != undefined && window.scrollIsEnd != undefined) {
						var data = {'html':window.spiderData[request.info.id],'scrollIsEnd':window.scrollIsEnd};
						sendResponse(data);
						return ;
					}
					
					//1:a,2:js,4:css,8:image,16:others,100:run js,101:ajax,102:a without scroll	
					switch(request.info.type) {
						case 2:
						case 4:
						case 8:
						case 16:
							break;
						case 100:
							var tempDom = $('#MDspider-help-dom-result');
							if(tempDom.length > 0) {
								window.spiderData[request.info.id] = tempDom.html();
								tempDom[0].remove();
							}
							break;
						case 101:
							break;
						case 103:
							break;
						case 102:
						default:
							textToBase64(document.getElementsByTagName('html')[0].innerHTML,function(base64){
								window.spiderData[request.info.id] = base64;
							}.bind(this));
							break;
					}
			        sendResponse({'html':'','scrollIsEnd':false});
					return ;
					break;
				//jump
				case 2:
					if(request.info.url) {
						//1:a,2:js,4:css,8:image,16:others,100:runjs
						switch(request.info.type) {
							case 2:
							case 4:
							case 8:
							case 16:
							case 101:
								var xhr = new XMLHttpRequest()
								xhr.onreadystatechange = function () {
									if (this.readyState == 4 && this.status == 200) {
										blobToBase64(this.response,function(base64){
											window.spiderData[request.info.id] = base64;
										}.bind(this));
									}if (this.readyState == 4) {
										textToBase64(this.status,function(base64){
											window.spiderData[request.info.id] = base64;
										}.bind(this));
									}
								}
								xhr.open('GET', request.info.url)
								xhr.responseType = 'blob'
								xhr.send()
								break;
							case 100:
								if(request.info.param && request.info.param.delay) {
									setTimeout(() => {
										pageRunJs(request.info.url);
									}, request.info.param.delay);
								}else{
									pageRunJs(request.info.url);
								}
								break;
							case 102:
								window.scrollIsEnd = false;
								//default 1000
								var scrollMaxCount = 1000;
								if(request.info.param && request.info.param.scrollMaxCount) {
									var scrollMaxCount = request.info.param.scrollMaxCount;
								}

								var count = 0;

								var func_go = function() {
									var maxHeight = document.body.scrollHeight;
									var clientHeight = document.body.clientHeight*0.8;
									var offset = document.body.clientHeight*-1;

									if(request.info.param && request.info.param.clientHeight) {
										clientHeight = request.info.param.clientHeight;
									}

									window.setInterval_scroll = setInterval(function() {
										window.scroll(0,offset);
										offset += clientHeight;
										if(offset > maxHeight || count++ > scrollMaxCount) {
											window.scrollIsEnd = true;
											clearInterval(window.setInterval_scroll);
										}
										
										if(document.body.scrollHeight > maxHeight){
											maxHeight = document.body.scrollHeight;
										}
									},1500);
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
								var linkNodes = document.querySelectorAll("a");
								for(var i = 0; i < linkNodes.length; i++) {
									if(linkNodes[i].href.indexOf(request.info.url) > -1) {
										var pos = Position.getAbsolute(document,linkNodes[i]);

										var xhr = new XMLHttpRequest()
										xhr.onreadystatechange = function () {
											if (this.readyState == 4 && this.status == 200) {
												blobToBase64(this.response,function(base64){
													window.spiderData[request.info.id] = base64;
												}.bind(this));
											}
										}
										xhr.open('POST', request.info.spiderSlaveHumanBehaviorApi)
										xhr.responseType = 'blob'
										xhr.send(JSON.stringify(pos))
										break;
									}
								}
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