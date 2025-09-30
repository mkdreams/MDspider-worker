
var evalLastModifieds = {};
function listenFilesChange(files,changeCb) {
  files.forEach(file => {
    setInterval(()=>{
      const url = chrome.runtime.getURL(file);
      fetch(url,{
          method: 'HEAD',
          cache: 'no-store'
      }).then((response)=>{
        return response.headers.get('last-modified');
      }).then(async (lastmodified)=>{
        if(evalLastModifieds[file] === undefined) {
          evalLastModifieds[file] = lastmodified;
          return ;
        }else if(evalLastModifieds[file] != lastmodified && changeCb) {
          await changeCb();
        }
      });
    },500);
  });
}