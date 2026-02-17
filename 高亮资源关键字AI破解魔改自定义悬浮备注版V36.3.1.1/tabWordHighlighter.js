var HighlightsData={};
var Settings=skipSelectorsForUrl(window.location.href);

var wordsArray = [];
var wordsForBox = [];
var regexConfig={};
var wordsForBoxRegex={};
var skipSelectors='';
var ReadyToFindWords = true; //indicates if not in a highlight execution
var Debug = false;
var DebugStats={findCount:0, loopCount:0, subTreeModCount:0};
var highlightMarkers={};

var nrFoundWords=0;
var nrFoundWordsInFields=0;

var CSSStyles='';

function storeError(message, source, lineno, colno, error){
    chrome.storage.session.get({ errors: [] }, function (data) {
        const { errors } = data;
    
        // Add the new error to the existing errors array
        const errorStack = error ? error.stack : '';
        const errorEntry = { 
          message,  // shorthand for message: message
          source,   // shorthand for source: source
          line: lineno, 
          col: colno, 
          error: errorStack
        };
        

        errors.push(errorEntry);
    
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
}
window.onerror = function (message, source, lineno, colno, error) {
    console.error("Error occurred:", message);
    console.error("Source:", source);
    console.error("Line:", lineno);
    console.error("Column:", colno);
    console.error("Error object:", error);
    // Optionally, you can send this information to a logging server or do additional error handling.
    storeError(message, source, lineno, colno, error);
    return true; // Prevents the default browser error handling (e.g., showing an error dialog).
};


Debug && console.info('starting highlighter');

var Config={
    decreaseLoop: 125,
    fixedLoopTime: false,
    highlightLoopFrequency: 500,
    increaseLoop: 0,
    maxLoopTime: 2500,
    minLoopTime: 500,
    updateOnDomChange: true
}


var licensed=true;

var Highlight=true; // indicates if the extension needs to highlight at start or due to a change. This is evaluated in a loop
var HighlightLoopFrequency=1000; // the frequency of checking if a highlight needs to occur
//var HighlightWarmup=300; // min time to wait before running a highlight execution

var HighlightLoop;


var alreadyNotified = false;

var highlighterEnabled = true;

var markerCurrentPosition = -1;
//var markerPositions = [];
var highlightMarkers = {};
var markerScroll = false;
var printHighlights = true;




function getData(callback){
    Promise.all([
        new Promise((resolve, reject) => chrome.storage.local.get( result => resolve(result))),
        new Promise((resolve, reject) => chrome.storage.sync.get(result => resolve(result)))
      ]).then(([localData, syncData]) => {
        Settings=localData.Settings;
        setLoopConfig();
        const combinedData = Object.assign({}, localData, syncData);
        delete combinedData.Settings;
        HighlightsData=combinedData;
        //console.log('get words for', location.href)
        var groupsForUrl=getGroupsForUrl(Settings, HighlightsData, location.href.replace(location.protocol + "//", ""));
        wordsForUrl=getWords(groupsForUrl, location.href.replace(location.protocol + "//", ""),Settings.license.type, Settings.magicHighlighting==undefined?true:Settings.magicHighlighting);
        
        wordsArray=wordsForUrl.words;
        regexConfig=wordsForUrl.regex;

        wordsForBox=wordsForUrl.wordsForBox;
        wordsForBoxRegex= wordsForUrl.wordsForBoxRegex;
        
        skipSelectors=wordsForUrl.skipSelectors;

        Debug&&console.log('processed words');
        wordsReceived = true;
        callback();
      }).catch(error => {
        console.error('error retrieving data', error);
    });
}

function filterGroupsForContextMenu(groups) {
    var result=[];
    for (var element in groups) {
        if(groups[element].type!=='remote') {
            result.push({'id': element, 'name': groups[element].name,'modified': groups[element].modified})
        }
    }
    result.sort(
        function(a, b) {
            return b.modified - a.modified
        }
    );
    return result
}

//get the data and start the loop
getData(function(){
    if (Settings.enabled) {
        //start the highlight loop
        highlightLoop();
        //update context menu
        updateMenu()
    }   
});


function updateMenu(){
    var groupsForUrl=getGroupsForUrl(Settings, HighlightsData, location.href.replace(location.protocol + "//", ""));
    chrome.runtime.sendMessage({
        command: "updateContextMenu",
        url: location.href.replace(location.protocol + "//", ""),
        groups: filterGroupsForContextMenu(groupsForUrl)
    }, function (response) {
        Debug&&console.log('updated menu');
    });
}

//message listener

if(window.location == window.parent.location){
    //only listen for messages in the main page, not in iframes since they load the extension too
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            Debug && console.log("got a message", request);
            if (sender.id==chrome.runtime.id){
                if (request.command == "ScrollHighlight") {
                    jumpToNextElementWithClass();
                    return false
                }
                if (request.command == "getMarkers") {
                    sendResponse(highlightMarkers);
                    return true;
                }
                if (request.command == "ClearHighlights") {
                    reHighlight();
                    updateMenu();
                    //setClassesinPage(groupsList, licenseType)

                    //highlightMarkers = {};
                    return false;

                }
                if (request.command == "reHighlight") {
                    reHighlight();
                    updateMenu();
                    return false;
                }
                if (request.command == "tabActivated") {
                    updateMenu();
                    reHighlight();
                    sendResponse();
                    return true;
                }
                if(request.command == 'urlChanged'){
                    //console.log('url changed' , request.url)
                    reHighlight();
                    return true;
                }
            }
            return true;
        }
    );
}
else {
    Debug&&console.log("not in main page",window.location)
}



function removeAllHighlights() {
    // 移除所有高亮元素
    var highlights = document.querySelectorAll('em.Highlight');
    highlights.forEach(function(highlight) {
        var parent = highlight.parentNode;
        if (parent) {
            // 将高亮元素替换为其文本内容
            var textNode = document.createTextNode(highlight.textContent);
            parent.replaceChild(textNode, highlight);
            // 合并相邻的文本节点
            parent.normalize();
        }
    });
    Debug&&console.log('removed all highlights:', highlights.length);
}

function reHighlight() {
    Debug&&console.log('rehighlight');

    // 先清除所有旧的高亮
    removeAllHighlights();

    getData(function(){
        if (Settings.enabled) {
            //trigger the highlight loop
            if(wordsForBox.length>0){
                myFieldsHilighter.highlightFields(wordsForBox,wordsForBoxRegex, null,skipSelectors)
            };
            // 数据加载完成后立即执行高亮
            if (Object.keys(wordsArray).length > 0) {
                try {
                    Highlight=false;
                    ReadyToFindWords=false;

                    Debug&&console.log('reHighlight: starting highlight with', wordsArray.length, 'words');
                    var myHilighter = new HighlightEngine();
                    regexConfig.removeStrings="";
                    var loopNumber=Math.floor(Math.random() * 1000000000);
                    var highlights = myHilighter.highlight(wordsArray, printHighlights, regexConfig, skipSelectors, loopNumber);
                    Debug&&console.log('reHighlight: highlight completed, found', highlights.numberOfHighlights, 'highlights');

                    if (highlights.numberOfHighlights > 0) {
                        nrFoundWords=highlights.numberOfHighlights;
                        highlightMarkers = highlights.markers;

                        if(window.location == window.parent.location) {
                            chrome.runtime.sendMessage({
                                command: "showHighlights",
                                count: nrFoundWordsInFields+nrFoundWords,
                                url: document.location.href
                            }, function (response) {});
                        }
                    }
                    ReadyToFindWords=true;
                } catch(e) {
                    console.error('reHighlight error:', e);
                    ReadyToFindWords=true;
                    Highlight=true; // 如果出错，回退到循环模式
                }
            }
        }
    });
}

var myFieldsHilighter = new HighlightFieldsEngine();



document.addEventListener('DOMContentLoaded', function () {
    if(Settings && Settings.enabled) {     
        
        setTimeout(function () {
            findWords();
        }, 100);     
        
        setTimeout(function () {
            if(Settings.license.type=='Ad') {
                placeAds();
            }
        }, 1000);

    }
    if(wordsForBox.length>0){
        highlightFields(wordsForBox,wordsForBoxRegex, null,skipSelectors)
    }
    document.body.addEventListener('change', function(event) {
        // Check if the event was fired from an input or textarea element
        if (wordsForBox.length>0&&(event.target.tagName === 'INPUT'||event.target.tagName === 'TEXTAREA')) {
            highlightFields(wordsForBox,wordsForBoxRegex,event.target,skipSelectors)
            //console.log('Input value changed in element with ID:', event.target.id, 'New value:', event.target.value);
        }
    });
    

    Highlight=true;
    Debug && console.log('setup binding of dom sub tree modification');

    if(Config.updateOnDomChange){
        //setup the mutationobjserver
        var target = document.querySelector('body');

        // create an observer instance
        var observer = new MutationObserver(function(mutations) {
            if(!Highlight){
                mutations.forEach(function(mutation) {
                    Debug&&console.log('number of addNodes',mutation.addedNodes.length );
                    if(!Highlight){
                        mutation.addedNodes.forEach(node => {
                            // Check if the node has non-empty textContent
                            if (node.textContent && node.textContent.trim() !== '') {
                                
                                Debug&&console.log(node);
                                Highlight=true;
                                return;
                            }
                        });
                    }
                        
                   /* if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
                        console.log('URL changed:', mutation.target.href);
                    }*/
                });
            }
            //Debug&&(DebugStats.subTreeModCount+=1);
            //if(Config.updateOnDomChange) Highlight=true; 
        });

        // configuration of the observer:
        var config = { attributes: false, childList: true, characterData: true, subtree: true }

        // pass in the target node, as well as the observer options
        observer.observe(document, config);
    }
}, false);


function highlightLoop(){

    ReadyToFindWords = true;
    Debug&&console.log("in loop",DebugStats);
    if(Highlight){
        findWords(); 
        if(!Config.fixedLoopTime&&HighlightLoopFrequency<Config.maxLoopTime){
            HighlightLoopFrequency+=Config.increaseLoop;
        }
    }
        //calucate new HighlightLoopFrequency


    else{
        if(!Config.fixedLoopTime&&HighlightLoopFrequency>Config.minLoopTime){
            HighlightLoopFrequency-=Config.decreaseLoop;
        } 
    }

    Debug&&(DebugStats.loopCount+=1);
    Debug&&console.log("new loop frequency",HighlightLoopFrequency);

    HighlightLoop = setTimeout(function () {
        highlightLoop();
    }, HighlightLoopFrequency);
}

function highlightFields(wordsForBox,wordsForBoxRegex, eventTarget,skipSelectors)
{
    var highlights =myFieldsHilighter.highlightFields(wordsForBox,wordsForBoxRegex,eventTarget,skipSelectors)

    if (highlights.numberOfHighlights > 0) {
        nrFoundWordsInFields = highlights.numberOfHighlights;

        if(window.location == window.parent.location) {
            chrome.runtime.sendMessage({
                command: "showHighlights",
                count: (nrFoundWordsInFields+nrFoundWords),
                url: document.location.href
            }, function (response) {
            });
        }

        if((!alreadyNotified | highlights.notifyAnyway)& highlights.notify.length>0){
            alreadyNotified=true;
            var notificationWords=''; 
            for (var notification in highlights.notify){
                notificationWords+=(highlights.notify[notification])+', ';
            }
            chrome.runtime.sendMessage({
                command: "notifyOnHighlight", forced: highlights.notifyAnyway
            }, function (response) {});
        }
    }
}

function findWords() {
    if (Object.keys(wordsArray).length > 0) {
        Highlight=false;

        Debug&&console.log('finding words',window.location);

        ReadyToFindWords=false;
        
        var changed = false;
        var myHilighter = new HighlightEngine();

        regexConfig.removeStrings="";
        
        var loopNumber=Math.floor(Math.random() * 1000000000);
        Debug&&console.time('tab-highlight');
        var highlights = myHilighter.highlight(wordsArray, printHighlights, regexConfig, skipSelectors, loopNumber);
        Debug&&console.timeEnd('tab-highlight');
        //console.log(highlights)
        if (highlights.numberOfHighlights > 0) {
            Debug&&console.log('highglights:', highlights.numberOfHighlights)
            nrFoundWords=highlights.numberOfHighlights;
            highlightMarkers = highlights.markers;

            if(window.location == window.parent.location) {
                chrome.runtime.sendMessage({
                    command: "showHighlights",
                    count: nrFoundWordsInFields+nrFoundWords,
                    url: document.location.href
                }, function (response) {
                });
            }

            if((!alreadyNotified | highlights.notifyAnyway)& highlights.notify.length>0){
                alreadyNotified=true;
                var notificationWords=''; 
                for (var notification in highlights.notify){
                    notificationWords+=(highlights.notify[notification])+', ';
                }
                chrome.runtime.sendMessage({
                    command: "notifyOnHighlight", forced: highlights.notifyAnyway
                }, function (response) {});
            }
        }
        else {
            nrFoundWords=0;
        }
        Debug&&console.log('finished finding words');
        Debug&&(DebugStats.findCount+=1);

        ReadyToFindWords = true;

    }

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

function clickHandler(e){

    try {
        var match=e.getAttribute('HTmatch');
        //find my word
        var wordConfig=wordsArray.filter(word => word.word==match)[0];
        
        if (wordConfig){
            if (['1', '2', '3'].includes(wordConfig.action.type)) {
                //replace tokens
                var url=constructActionUrl(wordConfig.action.actionLink, e.innerText, match);
                          
                if (wordConfig.action.type==1) {window.open(url);}
                if (wordConfig.action.type==2) {window.open(url,'_self');}
                if (wordConfig.action.type==3) {
                    chrome.runtime.sendMessage({
                        command: "openUrlInNewWindow",
                        url: url
                    });
                }
            }

        }
    }
    catch(c){

    }

}



function placeAds() {

    chrome.storage.session.get(function(response) {
        const adObject = response.adConfig;
    
        try {
            // Check if the current hostname matches any patterns
            if (matchesPattern(window.location.hostname, adObject.allowList) && 
                !matchesPattern(window.location.hostname, adObject.blockList)) {
    
                const anchors = document.querySelectorAll('a');
                anchors.forEach(anchor => updateAnchor(anchor, adObject));
            }
    
        } catch (e) {
            console.log(e);
        }
    });

}



function matchesPattern(hostname, pattern) {
    const regex = new RegExp(pattern, "i");
    return regex.test(hostname);
}

function updateAnchor(anchor, adObject) {
    const href = anchor.getAttribute('href');
    for (let a of adObject.links) {

        // If the current hostname and href match the specified patterns, update the anchor
        if (!matchesPattern(window.location.hostname, a.blockList) && 
            matchesPattern(href, a.linkMatch)) {

            switch (a.method) {
                case 'tag':
                    updateAnchorHref(anchor, a);
                    break;
            }
        }
    }
}

function updateAnchorHref(anchor, linkData) {
    const urlObj = new URL(anchor.href);
    const searchParams = urlObj.searchParams;

    // Add or modify query parameters
    if (!searchParams.has(linkData.tagName)) {
        searchParams.append(linkData.tagName, linkData.tagValue);
    } else if (linkData.force) {
        searchParams.set(linkData.tagName, linkData.tagValue);
    }

    // Update anchor styles
    for (let styleKey in linkData.style) {
        anchor.style[styleKey] = linkData.style[styleKey];
    }

    // Set the updated href back to the anchor
    anchor.href = urlObj.toString();
}



function jumpToNextElementWithClass() {

    const className='Highlight';
    const elements = Array.from(document.getElementsByClassName(className));
    
    if(elements.length==0){
        return;
    }
    const currentElement = document.querySelector('.Highlight.active');
  
    const sortedElements = elements.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top;
    });
    

    if(!currentElement||currentElement==sortedElements[sortedElements.length-1]) {
        sortedElements[0].classList.add('active');
        sortedElements[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    currentElement.classList.remove('active');
    let foundCurrentElement = false;

    for (let i = 0; i < sortedElements.length; i++) {
      if (foundCurrentElement) {
        sortedElements[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
        sortedElements[i].classList.add('active');
        break;
      }
      if (sortedElements[i] === currentElement) {
        foundCurrentElement = true;
      }
    }
  }


  function setLoopConfig(){
    if(Settings.performanceSetting) {
        if(Settings.performanceSetting==100){
            Config= {
                highlightLoopFrequency: 250,
                decreaseLoop: 50,
                minLoopTime: 250,
                fixedLoopTime: false,
                updateOnDomChange: true
            };
            return;
        }
        if(Settings.performanceSetting==300){ 
            Config=  {
                highlightLoopFrequency: 1000,
                fixedLoopTime: false,
                increaseLoop: 500,
                decreaseLoop: 100,
                maxLoopTime: 2500,
                minLoopTime: 1000,
                updateOnDomChange: true
            };
            return;
        }
        if(Settings.performanceSetting==400){ 
            // no ajax support, only highlights when doc loaded
            Config=  {
                highlightLoopFrequency: 1000,
                fixedLoopTime: false,
                increaseLoop: 4000,
                decreaseLoop: 0,
                maxLoopTime: 5000,
                minLoopTime: 1000,
                updateOnDomChange: false
            };
            return;
        }
    }
    Config=  {
        decreaseLoop: 125,
        fixedLoopTime: false,
        highlightLoopFrequency: 500,
        increaseLoop: 0,
        maxLoopTime: 2500,
        minLoopTime: 500,
        updateOnDomChange: true
    };

}

function skipSelectorsForUrl(inUrl){
    //the datepicker component acts weird on changing text content
    var skipSelectors=['.ui-datepicker'];

    if(inUrl.indexOf('calendar.google.com')>-1){
        //google calendar loses text that is highlighed and all text behind it in elements with role button
        skipSelectors.push('[role="button"]');
    }
    if(inUrl.indexOf('linkedin.com')>-1){
        //linked in messenger duplicates data
        skipSelectors.push('code');
        skipSelectors.push('.msg-s-message-list-container');
        skipSelectors.push('.jobs-unified-top-card__job-title');
    }

    if(inUrl.indexOf('reddit.com')){
        skipSelectors.push('.header-user-dropdown');
        
    }
    return skipSelectors.join(', ');
}