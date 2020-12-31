function blobToBase64(blob, callback) {
   var reader = new FileReader();
   reader.readAsDataURL(blob);
   reader.onload = function (e) {
       callback(e.target.result);
   }
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
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
					
					//1:a,2:js,4:css,8:image,16:others
					console.log('request',request);
					switch(request.info.type) {
						case 2:
						case 4:
						case 8:
						case 16:
							break;
						default:
							var blob = new Blob([document.getElementsByTagName('html')[0].innerHTML]);
							blobToBase64(blob,function(data){
								window.spiderData = data.replace(/data\:[\s\S]+?;base64,/,'');
							});
							break;
					}
			        sendResponse({'html':'','scrollIsEnd':false});
					return ;
					break;
				//jump
				case 2:
					if(request.info.url) {
						//1:a,2:js,4:css,8:image,16:others
						window.spiderData = undefined;
						switch(request.info.type) {
							case 2:
							case 4:
							case 8:
							case 16:
								window.setTimeout_get_blob = setTimeout(function() {
									var blob = new Blob(['timeout!']);
									blobToBase64(blob,function(data){
										window.spiderData = data.replace(/data\:[\s\S]+?;base64,/,'');
									});
								},30000);
								
								var xhr = new XMLHttpRequest()
								xhr.onreadystatechange = function () {
									if (this.readyState == 4 && this.status == 200) {
										blobToBase64(this.response,function(data){
											clearInterval(window.setTimeout_get_blob);
											window.spiderData = data.replace(/data\:[\s\S]+?;base64,/,'');
										});
									}
								}
								xhr.open('GET', request.info.url)
								xhr.responseType = 'blob'
								xhr.send()
								break;
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
						var clientHeight = document.body.clientHeight*0.5;
						var offset = 0;
						window.scrollIsEnd = false;
						window.setInterval_scroll = setInterval(function() {
							window.scroll(0,offset);
							offset += clientHeight;
							if(offset > maxHeight) {
					        	window.scrollIsEnd = true;
								clearInterval(window.setInterval_scroll);
							}
						},500);
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