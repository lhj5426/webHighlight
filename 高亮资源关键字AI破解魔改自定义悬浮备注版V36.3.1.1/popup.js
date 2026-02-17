var wordsToAdd = [];
var HighlightsData;
var Settings;
var TotalWords;
var Colors = [["#FFFFFF", "#000000","#FFFF66","#FFD700","#FF8C00","#00FF00","#32CD32","#228B22", "#00BFFF","#1E90FF","#0000CD", "#FF0000"]];
var FColors = [["#FFFFFF", "#000000","#FFFF66","#FFD700","#FF8C00","#00FF00","#32CD32","#228B22", "#00BFFF","#1E90FF","#0000CD", "#FF0000"]];

var currentUrl;

chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    if(tabs.length>0)
    currentUrl=tabs[0].url;
 });

var Collapsed=true;

var enableSaveButton=false;
var Debug=false;

window.onerror = function (message, source, lineno, colno, error) {
    console.error("Error occurred:", message);
    console.error("Source:", source);
    console.error("Line:", lineno);
    console.error("Column:", colno);
    console.error("Error object:", error);
    // Optionally, you can send this information to a logging server or do additional error handling.
    chrome.storage.session.get({ errors: [] }, function (data) {
        const { errors } = data;
    
        // Add the new error to the existing errors array
        errors.push({ message: message,  source: source, line: lineno, col:colno, error: error.stack });
    
        const maxErrorsToKeep = 50;
        const errorsToStore = errors.slice(-maxErrorsToKeep);

        // Store the updated errors array back in chrome.storage.session
        chrome.storage.session.set({ errors: errorsToStore }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error storing errors:", chrome.runtime.lastError);
          } else {
            console.log("Error stored successfully.");
          }
        });
    });
    return true; // Prevents the default browser error handling (e.g., showing an error dialog).
};

retrieveSettings();

/*var Colors=[
        ["#FFFFFF", "#000000","#9e9e9e","#ffeb3b","#2196F3","#4CAF50","#f44336"],
        ["#FFFF66","#FFD700","#FF8C00","#00FF00","#32CD32","#228B22", "#00BFFF","#1E90FF","#0000CD", "#FF0000"], 
        ["#FDDFDF", "#FCF7DE","#DEFDE0","#DEF3FD","#F0DEFD"]
    ];*/


// get params from url
const urlParams = new URLSearchParams(window.location.search);

String.prototype.format = function() {
    a = this;
    for (k in arguments) {
      a = a.replace('{' + k + '}', arguments[k])
    }
    return a
  }

document.addEventListener('DOMContentLoaded', function () {
    
    Debug && console.log('DOM loaded');

    //set the width of the page as specified in the params
    if(urlParams.get('width')){
        document.body.style.width=urlParams.get('width');
    }

    //fill labels on UI
    fillLiterals();
    createLimitationOptionList();

    //register for UI events
    registerEventListeners();

    //get the list contents and draw on screen
    getLists(function(){
        onPage();
    });
});

function displayActionOptions(action){
    if (['1', '2', '3'].includes(action)) {
        document.getElementById("action1Attributes").style.display="block";
        return;
    }
    document.getElementById("action1Attributes").style.display="none";
}

function actionURLValidation(url){
    var valid=true;
    var validationErrors= [];
    if(!isUrl(encodeURI(url))){
        validationErrors.push(getLiteral("url_invalid"));
    };
    if(validationErrors.length>0){
        document.getElementById("actionLinkValidation").style.display="block";
        document.getElementById("actionLinkValidation").innerText=validationErrors.join("<br />");
        document.getElementById('actionExample').style.display="none";

    }
    else{
        document.getElementById("actionLinkValidation").style.display="none";
        document.getElementById('actionExampleUrl').innerHTML=constructActionUrl(url,'Highlight', 'Hi?hL*');
        document.getElementById('actionExample').style.display="block";

    }
}

function hintNonUnicodeChar(value){
    const cjkRegex = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF65-\uFFDC]/

    if(cjkRegex.test(value)&&document.getElementById("findwords").checked){
        document.getElementById("hintNonUnicode").style.display="block";
    }
    else{
        document.getElementById("hintNonUnicode").style.display="none";
    }
}

function acceptedLengthForSyncStorage(){
    var estimatedLength=500;
    //TODO
    
   /* estimatedLength+=editorToWords().toString().length; //document.getElementById("words").value.length;
    estimatedLength+=document.getElementById("highlightOnSites").value.length;
    estimatedLength+=document.getElementById("dontHighlightOnSites").value.length;
    */
    estimatedLength=JSON.stringify(formToObject()).length;

    if(estimatedLength>chrome.storage.sync.QUOTA_BYTES_PER_ITEM){
        return false;
    }

    return true;
}

function lengthLimitSyncStorage(){
    
    if(document.getElementById("field_storage").value=='sync' && !acceptedLengthForSyncStorage()){

        document.getElementById("formSubmitButton").disabled=true;
    }
    else {
        document.getElementById("formSubmitButton").disabled=false;
    }
    
}


function countAmountOfWords(){
    return totalWords = Object.values(HighlightsData) // get an array of all sub-objects
  .reduce((acc, curr) => acc.concat(curr.words), []) // flatten the array of words
  .length;
}

function getPercentageFromLicenseMax(){

    const amounOfWordsConfigured=countAmountOfWords();

    if(Settings.license.type=='Unlimited' || Settings.license.type=='Ad'){
        return 0;
    }
    else{
        if(Settings.license.type=='500'){
            return amounOfWordsConfigured/500*100;
        }
        else {
            return amounOfWordsConfigured/200*100;
        }
    }
}

function displayIntroMessage(){
    // 禁用所有许可证提示消息 - 永久使用
    document.getElementById('homeMesssage').style.display='none';
    return;

    var percentageFromLicenseMax=getPercentageFromLicenseMax()
    if(percentageFromLicenseMax>99){
        document.getElementById('homeMesssage').style.display='flex';
        var message = getLiteral('maxwords_reached'); //'You are at {0}% of words. <a id="linkSubscription" style="text-decoration: underline">Change your subscription</a> to not miss any highlights';

        document.getElementById('homeMesssage-text').innerHTML=formatString(message, percentageFromLicenseMax);

            document.getElementById('linkSubscription').addEventListener('click', function(){
                showLicense();

            })
        return;
    }

    // show a message when license expires in 20 days or when you are in trial
    if(Settings.license.validUntil&&(Settings.license.type=='Temp'||Settings.license.type=='500'||Settings.license.type=='Unlimited')){

        let currentDate = new Date();
        let timeDiff = Math.abs(currentDate.getTime() - Settings.license.validUntil);
        let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (Settings.license.type=='Temp'){
            document.getElementById('homeMesssage').style.display='flex';
            var message = getLiteral('license_message_temp');
            document.getElementById('homeMesssage-text').innerHTML=formatString(message, daysDiff);
            document.getElementById('linkSubscription').addEventListener('click', function(){
                showLicense();
            })
            return;

        }
        if (daysDiff<20){
            document.getElementById('homeMesssage').style.display='flex';
            var message = getLiteral('license_expires');
            document.getElementById('homeMesssage-text').innerHTML=formatString(message, daysDiff);
            document.getElementById('linkSubscription').addEventListener('click', function(){
                showLicense();

            })
            return;

        }
    }



    document.getElementById('homeMesssage').style.display='none';


}

function collapseAll() {
    document.getElementById("collapseAll").innerText = getLiteral('popup_expandAll') ;
    var wordlists = document.getElementsByClassName("wordlist");
    for (var i = 0; i < wordlists.length; i++) {
        wordlists[i].style.display = "none";
    }
    Collapsed=true;
}

function expandAll() {
    document.getElementById("collapseAll").innerText = getLiteral('popup_collapseAll') ;
    var wordlists = document.getElementsByClassName("wordlist");
    for (var i = 0; i < wordlists.length; i++) {
        wordlists[i].style.display = "block";
    }
    Collapsed=false;
}


function switchTab(tabElement, tabName, group) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName(group+" tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName(group+" tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    tabElement.className += " active";
}

function browseHighlight() {
    //--TODO
    
    // user clicks on the browse highlights from the Words Found panel

    Debug && console.log("Browse highlight");

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {command: "ScrollHighlight"});
    });
}
function globStringToRegex(str) {
    return preg_quote(str).replace(/\\\*/g, '\\S*').replace(/\\\?/g, '.');
}
function preg_quote (str,delimiter) {
    // http://kevin.vanzonneveld.net
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&'); 
    //return str;
}
function onPage() {

    onPageShown = true;

 

    if (Settings.showFoundWords) {
        Debug && console.log('show found words');

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            Debug && console.log("active tabs",tabs);
            chrome.tabs.sendMessage(tabs[0].id, {command: "getMarkers"}, function (result) {
                Debug && console.log("got markers",result);

                if (result == undefined) {
                    //on a chrome page
                    drawInterface();
                }
                else {
                    Debug && console.log('there is a result');
                    if (result[0] != undefined) {
                        Debug && console.log('it has a page');
                        document.getElementById("menu").style.display = "none";
                        document.getElementById("wordDisplay").style.display = "none";
                        //document.getElementById("menu").style.display = "none";
                        document.getElementById("onPage").style.display = "block";
                        /*chrome.runtime.getPlatformInfo(
                            function (i) {
                                Debug && console.log('got platform id');
                                if (i.os == "mac") {
                                    document.getElementById("OSKey").innerHTML = "Command";
                                }
                                else {
                                    document.getElementById("OSKey").innerHTML = "Control";
                                }
                            });*/
                            Debug && console.log('about to render found words', result);
                        renderFoundWords(result);
                    }
                    else {
                        Debug && console.log('go to drawinterface');
                        drawInterface();
                    }
                }
            });
        });
    }
    else {
        drawInterface();
    }
}

function renderFoundWords(markers) {
    html = "";
    wordsFound = {};

    for (marker in markers) {
        if (wordsFound[markers[marker].word]) {
            wordsFound[markers[marker].word] += 1;
        }
        else {
            wordsFound[markers[marker].word] = 1;
        }
    }

    for (wordfound in wordsFound) {
        html += "<tr><td style='min-width:100px;'>" + DOMPurify.sanitize(wordfound) + "</td><td>" + wordsFound[wordfound] + "</td></tr>";
    }
    document.getElementById("wordsfound").innerHTML = html;
}


function backToFirstScreen() {
    document.getElementById("secondScreen").style.display = "none";
    document.getElementById("thirdScreen").style.display = "none";
    document.getElementById("styleScreen").style.display = "none";
    document.getElementById("actionScreen").style.display = "none";
    document.getElementById("sendErrorsGroup").style.display = "none";
    document.getElementById("firstScreen").style.display = "block";
}

function showSettings() {
    document.getElementById("showFoundWords").checked=Settings.showFoundWords;
    document.getElementById("printHighlights").checked=Settings.printHighlights;

    document.getElementById("magicHighlighting").checked=Settings.magicHighlighting==undefined?true:Settings.magicHighlighting;

    document.getElementById("performance").value=(Settings.performanceSetting-100)/100;
   
    

    showPerformanceDescription(Settings.performanceSetting);
   
    if(Settings.neverHighlightOn && Settings.neverHighlightOn.length>0){
        document.getElementById("neverHighlightOn").value=Settings.neverHighlightOn.join("\n");
    }
    
    if(Settings.onlyHighlightOn && Settings.onlyHighlightOn.length>0){
        document.getElementById("onlyHighlightOn").value=Settings.onlyHighlightOn.join("\n");
    }

    document.getElementById("autoBackupFrequency").value=(Settings.backup)?Settings.backup.frequency:'never'


    document.getElementById("wordDisplay").style.display = "none";
    document.getElementById("onPage").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("secondScreen").style.display = "none";
    document.getElementById("firstScreen").style.display = "none";
    document.getElementById("newGroup").style.display = "none";
    document.getElementById("newGroupType").style.display = "none";
    document.getElementById("deleteGroup").style.display = "none";
    document.getElementById("settingsGroup").style.display = "block";
    document.getElementById("licenseGroup").style.display = "none";
    document.getElementById("sendErrorsGroup").style.display = "none";
    //renderLicenseTab();
}

function showBugReport(){
    document.getElementById("wordDisplay").style.display = "none";
    document.getElementById("onPage").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("secondScreen").style.display = "none";
    document.getElementById("firstScreen").style.display = "none";
    document.getElementById("newGroup").style.display = "none";
    document.getElementById("newGroupType").style.display = "none";
    document.getElementById("deleteGroup").style.display = "none";
    document.getElementById("settingsGroup").style.display = "none";
    document.getElementById("licenseGroup").style.display = "none";
    document.getElementById("tempLicense").style.display = "none";
    document.getElementById("sendErrorsGroup").style.display = "block";

}


function showLicense(){
    document.getElementById("wordDisplay").style.display = "none";
    document.getElementById("onPage").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("secondScreen").style.display = "none";
    document.getElementById("firstScreen").style.display = "none";
    document.getElementById("newGroup").style.display = "none";
    document.getElementById("newGroupType").style.display = "none";
    document.getElementById("deleteGroup").style.display = "none";
    document.getElementById("settingsGroup").style.display = "none";
    document.getElementById("licenseGroup").style.display = "block";
    document.getElementById("tempLicense").style.display = "none";
    document.getElementById("sendErrorsGroup").style.display = "none";

    document.getElementById("freeLicense").style.display = "none";
    document.getElementById("adLicense").style.display = "none";
    document.getElementById("500License").style.display = "none";
    document.getElementById("unlimitedLicense").style.display = "none";
    document.getElementById("changeLicense").style.display = "none";

    document.getElementById("changeLicenseAd").style.display = "none";
    document.getElementById("changeLicenseFree").style.display = "none";
    document.getElementById("changeLicensePaid").style.display = "none";
    
    switch (Settings.license.type){

        case 'Free':
            document.getElementById("freeLicense").style.display = "block";
            document.getElementById("changeLicense").style.display = "block";
            document.getElementById("changeLicenseAd").style.display = "block";
            document.getElementById("changeLicensePaid").style.display = "block";
            break;
        case 'Temp':

            let currentDate = new Date();
            let timeDiff = Math.abs(currentDate - Settings.license.validUntil);
            let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            var message = getLiteral('currentlicense_temp_title'); 
            document.getElementById('currentlicense-temp-title').innerHTML=formatString(message, daysDiff);

            document.getElementById("tempLicense").style.display = "block";
            document.getElementById("changeLicense").style.display = "block";
            document.getElementById("changeLicenseAd").style.display = "block";
            document.getElementById("changeLicenseFree").style.display = "block";
            document.getElementById("changeLicensePaid").style.display = "block";
            break;
        case '500':
            document.getElementById("500License").style.display = "block";
            document.getElementById("changeLicense").style.display = "block";
            document.getElementById("changeLicenseAd").style.display = "block";
            document.getElementById("changeLicensePaid").style.display = "block";
            break;
        case 'Unlimited':
            document.getElementById("unlimitedLicense").style.display = "block";

            break
        default:
            document.getElementById("adLicense").style.display = "block";
            document.getElementById("changeLicense").style.display = "block";
            document.getElementById("changeLicenseFree").style.display = "block";
            document.getElementById("changeLicensePaid").style.display = "block";

    }
}

function closeSettings(){
    document.getElementById("settingsGroup").style.display = "none";
    document.getElementById("wordDisplay").style.display = "block";
    document.getElementById("menu").style.display = "block  ";
}

function showHome(){
    document.getElementById("onPage").style.display = "none";
    document.getElementById("newGroup").style.display = "none";
    document.getElementById("newGroupType").style.display = "none";
    document.getElementById("deleteGroup").style.display = "none";
    document.getElementById("settingsGroup").style.display = "none";
    document.getElementById("settingsGroup").style.display = "none";
    document.getElementById("licenseGroup").style.display = "none";
    document.getElementById("wordDisplay").style.display = "block";
    document.getElementById("menu").style.display = "block  ";
    document.getElementById("sendErrorsGroup").style.display = "none";
}

/*function showDonate() {
    document.getElementById("wordDisplay").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("donateGroup").style.display = "block";
}*/


function showConfig() {
    document.getElementById("onPage").style.display = "none";
    document.getElementById("wordDisplay").style.display = "block";
    document.getElementById("menu").style.display = "block  ";
}


function showPerformanceDescription(performance){
    document.getElementById("perfomanceDescription").innerHTML= getLiteral("perf_"+performance);
}

function displayMigrateStorage(groupId){
    //Migrate button and text
    if(HighlightsData[groupId] && HighlightsData[groupId].type=='local'){
        //only available when the type is local
        document.getElementById("migrateSuggestionButton").disabled=false;
        if(HighlightsData[groupId].storage=='local'){
            //suggest migrate to sync
            if(acceptedLengthForSyncStorage()){
                document.getElementById("migrateSuggestionText").innerHTML=getLiteral("migrate_sync_text");
            }
            else{
                //avoid making a synced list
                document.getElementById("migrateSuggestionButton").disabled=true;
                document.getElementById("migrateSuggestionText").innerHTML=getLiteral("migrate_sync_toobig_text");
            }
            document.getElementById("migrateSuggestionButton").innerHTML=getLiteral("migrate_sync_button");
        }
        else {
            //suggest migrate to local
            document.getElementById("migrateSuggestionText").innerHTML=getLiteral("migrate_local_text");
            document.getElementById("migrateSuggestionButton").innerHTML=getLiteral("migrate_local_button");

        }
        document.getElementById('migrateSuggestion').style.display='block';
    }
    else {
        document.getElementById('migrateSuggestion').style.display='none';
    }
}



function onOff() {
    if (Settings.enabled) {
        setSetting('enabled', false);
    }
    else {
        setSetting('enabled', true);
    }
    renderOnOff();
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        Debug&&("clearing highlights from tab");
        if(tabs[0].url.indexOf('chrome://')==-1) {
            chrome.tabs.sendMessage(tabs[0].id, {command: "ClearHighlights"});
        }        
    });
}

function renderOnOff() {
    document.getElementById('myonoffswitch').checked = Settings.enabled;
    if (!Settings.enabled) {
        document.getElementById('header').style.backgroundColor = "grey";
    }
    else {
        document.getElementById('offDesc').innerHTML = "";
        document.getElementById('header').style.backgroundColor = "#fff";
    }

}

function clearHighlightsFromTab() {
    //--TODO
    Debug && console.log('clearHighlightsFromTab');
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        Debug&&console.log("clearing highlights from tab");
        if(tabs[0].url.indexOf('chrome://')==-1) {
            chrome.tabs.sendMessage(tabs[0].id, {command: "ClearHighlights"});
        }        
    });
}

function getLists(callback){
    Promise.all([
        new Promise((resolve, reject) => chrome.storage.local.get( result => resolve(result))),
        new Promise((resolve, reject) => chrome.storage.sync.get(result => resolve(result)))
      ]).then(([localData, syncData]) => {
        delete syncData.Settings;
        const combinedData = Object.assign({}, localData, syncData);
        // Do something with the combined data...
        delete combinedData.Settings;
        HighlightsData=combinedData;
        callback();
      }).catch(error => {
        console.error('error retrieving groups', error);
    });
}

function showNoHighlightWarning(){
    let NoHighlightWarning = false;
    if (Settings.onlyHighlightOn && Settings.onlyHighlightOn.length > 0) {
        NoHighlightWarning=true
        let isMatchFound = Settings.onlyHighlightOn.some(pattern => {
            return currentUrl.match(globStringToRegex(pattern));
        });

        if (isMatchFound) {
            NoHighlightWarning=false
        }
    }

    for(var neverShowOn in Settings.neverHighlightOn){
        if (currentUrl.match(globStringToRegex(Settings.neverHighlightOn[neverShowOn]))){
            NoHighlightWarning=true;
        }
    }
    /*if(showNoHighlightWarning){
        document.getElementById("menu").style.display = "none";
        document.getElementById("wordDisplay").style.display = "none";
        document.getElementById("onPage").style.display = "block";
        document.getElementById("wordsfound").innerHTML='limitations'
        return
    }*/
    return NoHighlightWarning;
}






function drawInterface() {
    Debug && console.log('draw interface');
    displayIntroMessage();
    var htmlContent = "";
    var groupNumber = 0;
    var linkNumber = 0;

    var arrGroups=[];
    //var syncNeedsRepair


        for (var element in HighlightsData) {
            if((!HighlightsData[element].name&&HighlightsData[element].storage=='sync')){
                //check if storage needs an upgrade
                chrome.runtime.sendMessage({command: "detectAndRepairSync"}, function (result) {window.close()});
                break;
            }
            arrGroups.push({'id': element, 'name': HighlightsData[element].name,'modified': HighlightsData[element].modified})
        }
       /*arrGroups=arrGroups.sort(
            function(a, b) {
                if (a.name.toUpperCase() < b.name.toUpperCase()) {
                    return -1;
                }
                if (a.name.toUpperCase() > b.name.toUpperCase()) {
                    return 1;
                }
                return 0;              
            }
        );*/
    

       arrGroups=arrGroups.sort(

             
            function(a, b) {
                if(Settings.order){
                    const indexA = Settings.order.indexOf(a.id);
                    const indexB = Settings.order.indexOf(b.id);
                
                    // Both elements are in array2, sort by their order in array2
                    if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                    }
                
                    // Only a is in array2, so a comes first
                    if (indexA !== -1) {
                    return -1;
                    }
                
                    // Only b is in array2, so b comes first
                    if (indexB !== -1) {
                    return 1;
                    }
                }
                // Neither element is in array2, sort alphabetically
                if (a.name.toUpperCase() < b.name.toUpperCase()) {
                    return -1;
                }
                if (a.name.toUpperCase() > b.name.toUpperCase()) {
                    return 1;
                }
                return 0;    
              // return a.name.toUpperCase().localeCompare(b.name.toUpperCase);          
            }
        );

        if (showNoHighlightWarning()){
            htmlContent+='<div class="limitationsWarning">Highlights are not showing on the current site due to global limitations</div>';
        }
        var groupId;
        for (groupId in arrGroups){
            group=HighlightsData[arrGroups[groupId].id];
            htmlContent += '<div draggable="true" class="wordListContainer" groupId="'+ arrGroups[groupId].id +'">';
            htmlContent += '<div class="groupTitle" id="groupHeader' + groupNumber + '">'
            if (group.storage=='sync') {
            // htmlContent += '<div class="list-icon"><i class="list-icon fa fa-exchange-alt" aria-hidden="true"></i></div>';
                htmlContent += '<div class="list-icon material-symbols-outlined">sync_alt</div>';
            
            }
            if (group.type=='remote') {
            // htmlContent += '<div class="list-icon"><i class="fa fa-globe" aria-hidden="true"></i></div>';
                htmlContent += '<div class="list-icon material-symbols-outlined">cloud_download</div>';
            }
            if (group.enabled) {
                htmlContent += '<div class="groupColor" style="background-color:' + group.color + '; color:' + group.fColor + ';">' + group.name.substr(0, 1) + '</div><div class="groupHeader">' + group.name + '</div>';
            }
            else {
                htmlContent += '<div class="groupColor" style=" background-color: #ccc;color:#fff;">' + group.name.substr(0, 1) + '</div><div class="groupHeader groupDisabled">' + group.name + '</div>';
            }
            htmlContent += '</div>';
            if ((group.showOn && group.showOn.length > 0)||(group.dontShowOn && group.dontShowOn.length > 0)||group.containerSelector!=='') {
                htmlContent += '<span style="margin-left: 5px;">('+getLiteral("popup_limitations")+')</span>';
            }
            if (group.enabled) {
                htmlContent += '<a id="flipGroup' + groupNumber + '" class="flipGroup" tooltip="Disable group" group="' + arrGroups[groupId].id + '" action="disable" ><span class="material-symbols-outlined">pause</span></a>';
               // htmlContent += '<div class="onoffswitch"><input type="checkbox" name="onoffswitch' + groupNumber + '" class="onoffswitch-checkbox" id="flipGroup' + groupNumber + '" checked><label class="onoffswitch-label" for="flipGroup' + groupNumber + '"><div class="onoffswitch-inner"></div><div class="onoffswitch-switch"></div></label></div>';
            }
            else {
                htmlContent += '<a id="flipGroup' + groupNumber + '" class="flipGroup" tooltip="Enable group" group="' + arrGroups[groupId].id + '" action="enable" ><span class="material-symbols-outlined">play_arrow</span></a>';
               // htmlContent += '<div class="onoffswitch"><input type="checkbox" name="onoffswitch' + groupNumber + '" class="onoffswitch-checkbox" id="flipGroup' + groupNumber + '" checked><label class="onoffswitch-label" for="flipGroup' + groupNumber + '"><div class="onoffswitch-inner"></div><div class="onoffswitch-switch"></div></label></div>';
            }
            htmlContent += '<a id="deleteGroup' + groupNumber + '" class="deleteGroup" tooltip="Delete group" group="' + arrGroups[groupId].id + '"  ><span class="material-symbols-outlined">delete</span></a>';

            htmlContent += '<a id="editGroup' + groupNumber + '" class="editGroup" tooltip="Edit group" group="' + arrGroups[groupId].id + '"  ><span class="material-symbols-outlined">edit</span></a>';




            htmlContent += '<div class="clearfix"></div><ul id="wordList' + groupNumber + '" class="wordlist">';
            for (word in group.words) {
                htmlContent += '<li>' + DOMPurify.sanitize(group.words[word]) + '</li>';
            }
            htmlContent += '</ul>';
            htmlContent += '</div>';
            groupNumber += 1;
        }
   
        if (groupNumber == 0) {
            document.getElementById("intro").style.display = "block";
            document.getElementById("wordlistmenu").style.display = "none";
        }
        else {
            document.getElementById("intro").style.display = "none";
            document.getElementById("wordlistmenu").style.display = "block";
        }

        htmlContent += '<div style="text-align: center;width: 100%;position: fixed;bottom: 0px;background: white;"></div>';

        document.getElementById('wordData').innerHTML=htmlContent;
        if (Collapsed) {
            collapseAll();
        }
        else {
            expandAll();
        }
        const draggables = document.querySelectorAll('.wordListContainer');
        draggables.forEach(draggable => {
          draggable.addEventListener('dragstart', () => {
            draggableBeingDragged = draggable;
            originalParent = draggable.parentNode;
            nextSibling = draggable.nextElementSibling; // Store the next sibling
            draggable.classList.add('dragging');
          });
        
          draggable.addEventListener('dragend', () => {
            endDrag();
            //draggable.classList.remove('dragging');
          });
        });
        // Register for UI events on the word lists
        for (var i = 0; i < groupNumber; i++) {
            var editGroupId = "editGroup" + i;
            var deleteGroupId = "deleteGroup" + i;
            var flipGroupId = "flipGroup" + i;
            var groupHeaderId = "groupHeader" + i;

            document.getElementById(editGroupId).addEventListener('click', function () {
                editGroup(this.getAttribute("group"));
                return false;
            });
            document.getElementById(deleteGroupId).addEventListener('click', function () {
                deleteGroup(this.getAttribute("group"));
                return false;
            });
            document.getElementById(flipGroupId).addEventListener('click', function () {
                flipGroup(this.getAttribute("group"), this.getAttribute("action"));
                return false;
            });

            //--TODO: remove the childnodes 5
            document.getElementById(groupHeaderId).addEventListener('click',function(e){
                if(e.target.parentElement.parentElement.querySelector('ul.wordList').style.display=="block"){
                    e.target.parentElement.parentElement.querySelector('ul.wordList').style.display="none";
                }
                else {
                    e.target.parentElement.parentElement.querySelector('ul.wordList').style.display="block";
                }
                return false
            })

        }
    

    renderOnOff();

}

//--TODO : should we give some time before filtering between characters typed?
function filterWords(infilter){
    //wordListContainer
    var groupsToShow=[];
    var showGroup=false;
    var searchExp=new RegExp(infilter,'gi');
    if (infilter.length>0) {
        for (group in HighlightsData) {

            showGroup = false;
            if(HighlightsData[group].name.match(searchExp)){
                showGroup = true;
            }
            else {
                for (word in HighlightsData[group].words) {
                    if (HighlightsData[group].words[word].match(searchExp)) {
                        showGroup = true;
                    }
                }
            }
            if (showGroup) {
                groupsToShow.push(group);
            }
        }

    }
    else {groupsToShow=Object.keys(HighlightsData);}

    allGroups=document.getElementsByClassName("wordListContainer");


    for( var group = 0; group < allGroups.length; group++) {
        if(groupsToShow.indexOf(allGroups[group].getAttribute("groupId"))>-1){
            allGroups[group].style.display="block";
        }
        else{
            allGroups[group].style.display="none";
        }

    }
}

function setColor(colorSelected, colorSet) {
    if(colorSelected.attributes["ColorValue"].value!=''){
        document.getElementById(colorSet).jscolor.fromString( colorSelected.attributes["ColorValue"].value);
    }
    else {
        document.getElementById(colorSet).value='';
    }
    colorElements = document.getElementById(colorSet + "list").getElementsByClassName("color")

    for (var i = 0; i < colorElements.length; i++) {
        colorElements[i].className = "color";
    }
    colorSelected.className += ' selected';

    // 根据不同的颜色选择器更新不同的预览
    if(colorSet == 'notetextcolor' || colorSet == 'notebgcolor'){
        renderNoteExample();
    } else {
        renderColorExample();
    }
}

function renderNoteExample(){
    var noteTextColor = '#FFFFFF';
    var noteBgColor = '#333333';

    if(document.getElementById("notetextcolor") && document.getElementById("notetextcolor").value !== ''){
        noteTextColor = document.getElementById("notetextcolor").jscolor.toHEXString();
    }
    if(document.getElementById("notebgcolor") && document.getElementById("notebgcolor").value !== ''){
        noteBgColor = document.getElementById("notebgcolor").jscolor.toHEXString();
    }

    var noteExample = document.getElementById('noteExampleTooltip');
    if(noteExample){
        noteExample.style.color = noteTextColor;
        noteExample.style.backgroundColor = noteBgColor;
    }
}

function renderColorExample(){
        document.getElementById("fcolor").value=='' ? document.getElementById('example').style.color='inital' : document.getElementById('example').style.color = document.getElementById("fcolor").jscolor.toHEXString();
        document.getElementById("color").value=='' ?  document.getElementById('example').style.backgroundColor='initial' : document.getElementById('example').style.backgroundColor = document.getElementById("color").jscolor.toHEXString();

        if(Settings.license.type=='Free'){
            document.getElementById('example').style.fontWeight='';
            document.getElementById('example').style.fontStyle='';
            document.getElementById('example').style.textDecoration='';
            document.getElementById('example').style.boxShadow='rgb(229, 229, 229) 1px 1px';
            document.getElementById('example').style.borderRadius='3px';
            document.getElementById('example').style.padding='1px';        
        }       
        else {
            document.getElementById('bold').checked ? document.getElementById('example').style.fontWeight='bold' : document.getElementById('example').style.fontWeight='';
            document.getElementById('italic').checked ? document.getElementById('example').style.fontStyle='italic' : document.getElementById('example').style.fontStyle='';
            document.getElementById('underline').checked ? document.getElementById('example').style.textDecoration='underline' : document.getElementById('example').style.textDecoration='';
            document.getElementById('border').checked ? document.getElementById('example').style.boxShadow='rgb(229, 229, 229) 1px 1px': document.getElementById('example').style.boxShadow='';
            document.getElementById('radius').checked ? document.getElementById('example').style.borderRadius='3px': document.getElementById('example').style.borderRadius='';
            document.getElementById('padding').checked ? document.getElementById('example').style.padding='1px' : document.getElementById('example').style.padding='0px';    
        }
}

function drawColorSelector(target, defaultColor, colorSet) {
    var colors;
    defaultColor = defaultColor || "";

    if (colorSet == "fcolor") {
        colors = FColors;
    }
    else if(colorSet =='boxcolor'){
        colors=FColors;
    }
    else if(colorSet == 'notetextcolor'){
        colors = FColors;
    }
    else if(colorSet == 'notebgcolor'){
        colors = Colors;
    }
    else {
        colors = Colors;
        colorSet = "color"
    }
    var htmlContent = '<ul id="' + colorSet + 'list" class="colorsList">';
    if ( "" == defaultColor) {
        htmlContent += '<li class="color selected" colorValue="" style="color:red; text-align:center;"><span>x</span></li>';
    }
    else {
        htmlContent += '<li class="color" colorValue="" style="color:red; text-align:center;"><span>x</span></li>';
    }
    var color;

    for(row in colors){
        for (color in colors[row]) {
            if(color==0&&row>0){var style="clear: both;"} else {var style='';} 
            if (colors[row][color] == defaultColor) {
                htmlContent += '<li class="color selected" colorValue="' + colors[row][color] + '" style="'+style+'background-color:' + colors[row][color] + '; color: ' + invertColor(colors[row][color],true) + ';"></li>';
            }
            else {
                htmlContent += '<li class="color" colorValue="' + colors[row][color] + '" style="'+style+'background-color:' + colors[row][color] + '; color: ' + invertColor(colors[row][color],true)+ ';"></li>';
            }
        }

    }
   
    htmlContent+='</ul>';
    document.getElementById(target).innerHTML = htmlContent;

    htmlContent = '<input id="' + colorSet + '" class="jscolor" placeholder="HTML颜色代码" value="' + defaultColor + '">';
    document.getElementById(target+'Input').innerHTML = htmlContent;

    var colorelements = document.getElementById(colorSet + "list").getElementsByClassName("color");

    // 根据不同的颜色选择器添加不同的事件监听器
    if(colorSet == 'notetextcolor' || colorSet == 'notebgcolor'){
        document.getElementById(colorSet).addEventListener('change', function(){renderNoteExample();});
    } else {
        document.getElementById(colorSet).addEventListener('change', function(){renderColorExample();});
    }

    for (var i = 0; i < colorelements.length; i++) {
        colorelements[i].addEventListener('click', function () {
            setColor(this, colorSet);
            return false;
        });
    }
    jscolor.installByClassName("jscolor");

}
function extractDomain(url) {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname; // Gets the domain name
  }


function getLimitationOptions(){
    var listOfLimitationOptions=[];
    listOfLimitationOptions.push({"type":"+ 添加一个限制", "value": "select"});
    let url=currentUrl;
    if (url){
        if(url.indexOf('?')>0) {
            listOfLimitationOptions.push({"type":"pageWithParams", "value": url});
            url=url.split('?')[0];
        }
        
        listOfLimitationOptions.push({"type":"网页", "value": url});

        host=extractDomain(url);
        listOfLimitationOptions.push({"type":"域名", "value": host});

        splitHost=host.split('.')
        if(splitHost.length>2){
            const withoutFirst = splitHost.slice(1);
            domain=withoutFirst.join('.');
            listOfLimitationOptions.push({"type":"domain", "value": domain});
        }
    }
    return listOfLimitationOptions;
}

function renderLimitationSelector (target){
    const listOfLimitationOptions=getLimitationOptions();
    let htmlContent='';
    for(index in listOfLimitationOptions){
        htmlContent+='<option value="' + listOfLimitationOptions[index].value + '">' + listOfLimitationOptions[index].type + '</option>';
    }
    const targetElement= document.getElementById(target);
    targetElement.innerHTML = htmlContent;
    targetElement.addEventListener('click',function(e) {
        
    })
}

function createLimitationOptionList(){
    renderLimitationSelector('listLimitationHighlightOn');
    document.getElementById('listLimitationHighlightOn').addEventListener('change',function(e) {
        document.getElementById('highlightOnSites').value+='\n'+e.target.value;
        e.target.value="select";
    })
    renderLimitationSelector('listLimitationDontHighlightOn');
    document.getElementById('listLimitationDontHighlightOn').addEventListener('change',function(e) {
        document.getElementById('dontHighlightOnSites').value+='\n'+e.target.value;
        e.target.value="select";
    })
    renderLimitationSelector('globalLimitationHighlightOn');
    document.getElementById('globalLimitationHighlightOn').addEventListener('change',function(e) {
        document.getElementById('onlyHighlightOn').value+='\n'+e.target.value;
        e.target.value="select";
    })
    renderLimitationSelector('globalLimitationDontHighlightOn');
    document.getElementById('globalLimitationDontHighlightOn').addEventListener('change',function(e) {
        document.getElementById('neverHighlightOn').value+='\n'+e.target.value;
        e.target.value="select";
    })
}

function renderItalicCheckbox() {
    if (document.getElementById('italic').checked) {
        document.getElementById('italic-state-button').classList.add('checked');
      } else {
        document.getElementById('italic-state-button').classList.remove('checked');
      }
      renderColorExample();
}

function renderBoldCheckbox(){
    if (document.getElementById('bold').checked) {
        document.getElementById('bold-state-button').classList.add('checked');
      } else {
        document.getElementById('bold-state-button').classList.remove('checked');
      }
      renderColorExample();
}

function renderUnderlineCheckbox(){
    if (document.getElementById('underline').checked) {
        document.getElementById('underline-state-button').classList.add('checked');
      } else {
        document.getElementById('underline-state-button').classList.remove('checked');
      }
      renderColorExample();
}

function renderBorderCheckbox(){
    if (document.getElementById('border').checked) {
        document.getElementById('border-state-button').classList.add('checked');
      } else {
        document.getElementById('border-state-button').classList.remove('checked');
      }
      renderColorExample();
}

function renderRadiusCheckbox(){
    if (document.getElementById('radius').checked) {
        document.getElementById('radius-state-button').classList.add('checked');
      } else {
        document.getElementById('radius-state-button').classList.remove('checked');
      }
      renderColorExample();
}

function renderPaddingCheckbox(){
    if (document.getElementById('padding').checked) {
        document.getElementById('padding-state-button').classList.add('checked');
      } else {
        document.getElementById('padding-state-button').classList.remove('checked');
      }
      renderColorExample();
}

function enableDisableAdvancedStyle(){

        document.getElementById('italic-state-button').disabled = Settings.license.type=='Free';
        document.getElementById('bold-state-button').disabled = Settings.license.type=='Free';
        document.getElementById('underline-state-button').disabled = Settings.license.type=='Free';
        document.getElementById('border-state-button').disabled = Settings.license.type=='Free';
        document.getElementById('radius-state-button').disabled = Settings.license.type=='Free';
        document.getElementById('padding-state-button').disabled = Settings.license.type=='Free';
    
}