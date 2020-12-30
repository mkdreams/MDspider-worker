//setTimeout(function() {
//	$.ajax({
//		type: 'GET',
//		url: 'https://www.farseerbi.com/Application/Home/Static/images/logo.png?v=1.2',
////		url: 'https://www.farseerbi.com/Application/Home/Static/css/list.css?v=1.3',
//		success: function(data){
//			console.log('data',data);
//		}
//	});
//},10000);

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
					if(windows.spiderData != undefined) {
						var data = {'html':windows.spiderData,'scrollIsEnd':window.scrollIsEnd};
					}else{
						var data = {'html':document.getElementsByTagName('html')[0].innerHTML,'scrollIsEnd':window.scrollIsEnd};
					}
					sendResponse(data);
					return ;
					break;
				case 2:
					if(request.info.url) {
						//1:a,2:js,4:css,8:image,16:others
						windows.spiderData = undefined;
						switch(request.info.type) {
							case 1:
							case 16:
								window.location.href=request.info.url;
								break;
							case 2:
							case 4:
							case 8:
							case 16:
								$.ajax({
									type: 'GET',
									url: request.info.url,
									success: function(data){
										windows.spiderData = data;
//										console.log('data',data);
									}
								});
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
						var clientHeight = document.body.clientHeight/2;
						var offset = 0;
						window.scrollIsEnd = false;
						window.setInterval_scroll = setInterval(function() {
							window.scroll(0,offset);
							offset += clientHeight;
							if(offset > maxHeight) {
								window.scrollIsEnd = true;
								clearInterval(window.setInterval_scroll);
							}
						},1000);
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