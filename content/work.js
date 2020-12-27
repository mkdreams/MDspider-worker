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
					var data = {'html':document.getElementsByTagName('html')[0].innerHTML,'scrollIsEnd':window.scrollIsEnd};
					sendResponse(data);
					return ;
					break;
				case 2:
					if(request.info.url) {
						window.location.href=request.info.url;
					}
					break;
				//scroll
				case 3:
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
					break;
				default:
					break;
			}
		}
		
		sendResponse('content: got it!');
	}
);