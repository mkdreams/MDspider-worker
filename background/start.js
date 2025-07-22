importScripts(
  "/common.js",
  "/config.js",
  "/common/pako.min.js",
  "/common/base64.min.js",
  "/common/function.js",
  "/common/cat_wampy.js",
  "/background/extension_action.js",
  "/background/background.js",
  "/background/run_time_api.js"
);

// async function checkAlarmState() {
//   const alarm = await chrome.alarms.get("wake-alarm");

//   if (!alarm) {
//     await chrome.alarms.create("wake-alarm",{delayInMinutes: 0});
//   }
// }

// checkAlarmState();

console.log('Service Worker 启动');