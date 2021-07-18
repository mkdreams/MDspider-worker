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
	+jsStr + '})();\
	textToBase64(r==undefined?0:r,function(base64){\
		this.innerHTML = base64;\
	}.bind(this))')
	.replace(/"/g,'&quot;')+"')\"></div>");
	$("body").append(tempDom);
	tempDom.click();
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
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
					break;
				default:
					break;
			}
		}else if(request.actiontype) {
			switch(request.actiontype) {
				//get html 
				case 1:
					if(window.spiderData != undefined && window.scrollIsEnd) {
						var data = {'html':window.spiderData,'scrollIsEnd':window.scrollIsEnd};
						sendResponse(data);
						return ;
					}
					
					//1:a,2:js,4:css,8:image,16:others,100:run js,101:ajax,102:a without scroll	
					console.log('request',request);
					switch(request.info.type) {
						case 2:
						case 4:
						case 8:
						case 16:
						case 100:
							var tempDom = $('#MDspider-help-dom-result');
							window.spiderData = tempDom.html();
							tempDom[0].remove();
						case 101:
							break;
						case 102:
						default:
							textToBase64(document.getElementsByTagName('html')[0].innerHTML,function(base64){
								window.spiderData = base64;
							});
							break;
					}
			        sendResponse({'html':'','scrollIsEnd':false});
					return ;
					break;
				//jump
				case 2:
					if(request.info.url) {
						//1:a,2:js,4:css,8:image,16:others,100:runjs
						window.spiderData = undefined;
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
											window.spiderData = base64;
										});
									}if (this.readyState == 4) {
										textToBase64(this.status,function(base64){
											window.spiderData = base64;
										});
									}
								}
								xhr.open('GET', request.info.url)
								xhr.responseType = 'blob'
								xhr.send()
								break;
							case 100:
								pageRunJs(request.info.url);
								break;
							case 102:
							default:
								window.location.href=request.info.url;
								break;
						}
					}
					break;
				//scroll
				case 3:
					if(request.info && request.info.type && request.info.type == 1) {
						var maxHeight = document.body.scrollHeight;
						var clientHeight = document.body.clientHeight*0.8;
						var offset = document.body.clientHeight*-1;
						window.scrollIsEnd = false;
						window.setInterval_scroll = setInterval(function() {
							window.scroll(0,offset);
							offset += clientHeight;
							if(offset > maxHeight) {
					        	window.scrollIsEnd = true;
								clearInterval(window.setInterval_scroll);
							}
							
							if(document.body.scrollHeight > maxHeight){
								maxHeight = document.body.scrollHeight;
							}
						},1500);
					}else{
						window.scrollIsEnd = true;
					}
					break;
				default:
					break;
			}
		}
		
		sendResponse('content: got it!');
	}
);