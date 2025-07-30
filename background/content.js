chrome.userScripts.configureWorld({
  csp: "script-src 'self' 'unsafe-eval'; object-src 'self'",
  messaging: true
});

chrome.userScripts.register([{
  id: 'content',
  matches: ['*://*/*'],
  js: [
		{"file":"common.js"},
		{"file":"common/jquery-2.0.3.js"},
		{"file":"common/base64.min.js"},
		{"file":"common/function.js"},
		{"file":"common/cat_wampy.js"},
		{"file":"content/js.cookie.min.js"},
		{"file":"content/html2canvas.min.js"},
		{"file":"content/work.js"},
		{"file":"content/screenshot.js"},
		{"file":"content/ajax.record.js"},
	],
	allFrames: false,
	runAt:"document_start"
}]);