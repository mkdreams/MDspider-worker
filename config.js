window.notify_tips = false;
window.spiderSlaveOn = true;
window.spiderSlaveFlag = 'slave3';
window.spiderSlaveApiActionList = "http://corp.admin.com/ir/NewsBase/getLinksCache";
window.spiderSlaveApiCb = "http://corp.admin.com/ir/NewsBase/recordLinkCacheIsDone";

var spiderSlaveApiInfo = window.spiderSlaveApiActionList.match(/^(http|https|ws)\:\/\/[^\/$]+?(?=[\/|$])/g);
window.spiderSlaveApi = spiderSlaveApiInfo[0];

window.spiderSlaveGetUrlsDelay = 5000;
window.spiderSlaveWinCount = 1;
window.spiderSlavePerWinTabCount = 5;

window.spiderSlaveRunActionCount = 0;
window.spiderSlaveActionCountChangeUser = 0;

window.spiderSlaveStackRunActionCount = {};
window.spiderSlaveLockTabTimeout = 180000;
window.spiderSlavePerDayMaxRunTimes = 0;

window.spiderSlaveHelpmate = true;
window.spiderSlaveHelpmateApi = 'http://127.0.0.1:1234/rpc';
	
