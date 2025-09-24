window['linkedin_sub_func1']= function() {
    var initResult = {};
    var ajaxArray = new Array();
    var codeArray = new Array();
    for(var i in window.ajaxRecordListRestult) {
        if(i.indexOf("voyager/api/feed/updatesV2") > 0 ) {
            try {commentArray.push(window.ajaxRecordListRestult[i][0])} catch (error) {}
        }
    }
    var aLi = window.document.getElementsByTagName("code");
    for(var i in aLi) {
        if(aLi[i].innerHTML && aLi[i].innerHTML.indexOf("searchDashClustersByAll") > 0) {
            try {JSON.parse(aLi[i].innerHTML);codeArray.push(aLi[i].innerHTML);} catch (error) {}
        }
    }

    initResult['ajax'] = ajaxArray;
    initResult['code'] = codeArray;

    return JSON.stringify(initResult);
};