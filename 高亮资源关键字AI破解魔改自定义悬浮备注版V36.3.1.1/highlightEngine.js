var observersMap = new Map();


function HighlightEngine() {

    var highlightTag = "EM";
    var highlightClassname = "Highlight";
    var skipTags = new RegExp("^(?:SCRIPT|HEAD|NOSCRIPT|STYLE|TEXTAREA)$"); //TEXTAREA

    var SkipSelectors = "";
    
    var wordColor = [];
    var magicRegex = "";
    var magicRegexCS = "";
    var matchRegex = "";
    var matchRegexEditable = "";
    var numberOfHighlights = 0; 
    var highlights = {}; 
    var notifyAnyway= false;
    var highlightMarkers = {};
    var notifyForWords= new Set();
    var RegexConfig={};

    var loopingTime=0;
    var loopingstartTime=0;
    var countLoops=0;

    //var featureFlagDetectDynamicUpdates=true;
    var featureFlagDetectDynamicUpdates = function() {
        const hostname = window.location.hostname;

        //return hostname.includes('salesforce');
        return false;
    }();


    const Debug=true;
    
    function containsShadowRoot(node) {
        if(node.nodeType !== 1) { return false; }
        const allElements = node.querySelectorAll('*');
    
        for (const element of allElements) {
            if (element.shadowRoot) {
                return true; 
            }
        }
        return false; 
    }

    this.stopObservingHighlightElement = function (element) {
        var observer = observersMap.get(element);
        Debug && console.log('stopObserving', observer)
        if (observer) {
            observer.disconnect();
            observersMap.delete(element);
            Debug&&console.log('Stopped observing the element.');
        } else {
            Debug&&console.log('Element was not being observed.');
        }
    }


    this.observeHighlightElement=function (element) {
        if (observersMap.has(element)) {
            Debug&&console.log('avoided duplicate observer');
            return;
        }

        if(element.parentNode){
            if(!element.parentNode.getAttribute('htTxtElements')){
                element.parentNode.setAttribute('htTxtElements',1);
            }
        }
        Debug&&console.log('observing',element);

        var observer = new MutationObserver(function(mutations) {     
            Debug && console.log(mutations)
            p=this;
            mutations.forEach(function(mutation) {
                Debug&&console.log('observer',mutation)
                const t=mutation.target;

                do {
                    //p.stopObservingHighlightElement(t.nextSibling);
                    t.nextSibling?.remove()
                } while (t.nextSibling instanceof Text ||  t.nextSibling?.className.startsWith(highlightClassname));


                   /* const t=mutation.target
                    if(t.nextSibling){
                        console.log(t)
                        if (t instanceof Text && t.textContent && t.nextSibling?.className.startsWith(highlightClassname))
                            do {
                                t.nextSibling?.remove()
                            } while (t.nextSibling instanceof Text);
                        
                    }*/
            });
        });
    
        var config = { characterData: true, childList: true, subtree: true};

        observer.observe(element, config);    
        observersMap.set(element, observer);
        Debug && console.log('Observer added for', element, 'with config', config);


    }
    


    
     
    // recursively apply word highlighting
    this.highlightWords = function (node, printHighlights, inContentEditable, loopNumber) {
        
        if (node == undefined || !node) return;

        if (node.nodeType === Node.ELEMENT_NODE && (skipTags.test(node.nodeName)||node.matches(SkipSelectors))) {
            
            return;
        }
        // check if there is any shadow-root element, if so dive deeper
       

        if (node.nodeName == highlightTag && node.classList.contains(highlightClassname)){
            //text was already highlighted
            //console.log("skip highlighting",node)
            if(node.getAttribute('htloopNumber')!==loopNumber.toString()) {
                highlightMarkers[numberOfHighlights] = {
                    "word": node.getAttribute('htmatch')
                };

                numberOfHighlights += 1;
            }
            return
        }     

        if(node.nodeType !== 3 /*&& node.nodeName !== highlightTag && !node.classList.contains(highlightClassname)*/){
            
            if(node.shadowRoot){
                
                if (!node.shadowRoot.querySelector('style[data-stylename="HighlightThisStyles"]')){
                    const style = document.createElement('style');
                    style.setAttribute('data-stylename', 'HighlightThisStyles')
                    style.textContent = CSSStyles;
                    node.shadowRoot.appendChild(style);
                }

                for (const childNode of node.shadowRoot.childNodes) {
                    this.highlightWords(childNode, printHighlights, inContentEditable || node.isContentEditable, loopNumber);
                }

            }
            var textContent=node.textContent;

            if(RegexConfig.useMagicRegex && textContent.length<5000 ){
                //console.time("inUseMagicRegex")
                //console.log("text length",textContent.length)
                RegexConfig.doMagicRegex?(regs = magicRegex.exec(textContent)):regs=undefined;
                RegexConfig.doMagicRegexCS?(regsCS = magicRegexCS.exec(textContent)):regsCS=undefined;
                //console.timeEnd("inUseMagicRegex")
                var boolContainsShadowRoot=containsShadowRoot(node)
                
                if(!regs&&!regsCS&&!boolContainsShadowRoot){
                    return;
                }
            }
            
            for (const childNode of node.childNodes) {
                this.highlightWords(childNode, printHighlights, inContentEditable || node.isContentEditable, loopNumber);
            }

        }

        
        if (node.nodeType == 3) {
            //only act on text nodes
            
            var nv = node.nodeValue;
            if(nv.trim()!=''){
                if(node.parentElement&&!(node.parentElement.tagName==highlightTag&&node.parentElement.getAttribute(highlightClassname))){
                    //if we compare 2 regex's eg Case Sensity / Insensitive. Take the one with the lowest index from the exec, if equal take the longest string in [0]


                        if(inContentEditable) {
                            RegexConfig.doMatchRegexEditable?(regs = matchRegexEditable.exec(nv)):regs=undefined;
                            RegexConfig.doMatchRegexEditableCS?(regsCS = matchRegexEditableCS.exec(nv)):regsCS=undefined;
                        } 
                        else {
                            RegexConfig.doMatchRegex?(regs = matchRegex.exec(nv)):regs=undefined;
                            RegexConfig.doMatchRegexCS?(regsCS = matchRegexCS.exec(nv)):regsCS=undefined;
                        }
              
                        if(regs&&regsCS){
                            if(regs.index>regsCS.index||(regs.index==regsCS.index&& regsCS[1] && regs[1]&&regsCS[1].length>regs[1].length)){regs=regsCS} 
                        } else {
                            regs=regs||regsCS;
                        }
                        
    
                        if (regs) {
                            var wordfound = "";

                            if(regs[1]){
                                regResult=regs[1];
                                startIndex=regs.index+regs[0].indexOf(regs[1]);
                            }
                            else{
                                regResult=regs[0];
                                startIndex=regs.index;
                            }
                                  
                            //find back the longest word that matches the found word 
                            for (word in wordColor) {
                                let currentWordColor=wordColor[word];

                                if ((currentWordColor.regexTokens || regResult.length>=currentWordColor.wordLengthForCompare) &&  (currentWordColor.containerSelector=='' || node.parentElement.matches(currentWordColor.containerSelector)) ){
                                    var pattern = currentWordColor.compiledRegex ;
                                    if ((!currentWordColor.findBackAgainstContent && pattern.test(regResult)) ) {
                                        wordfound = word;
                                        break;
                                    }
        
                                    //check back regexes
                                    if (  ((currentWordColor.findBackAgainstContent &&pattern.test(regs.input)))) {
                                        regsRegex=pattern.exec(regs.input);
                                        if(regsRegex[0]==regs[1]){
                                            regResult=regs[1];
                                            startIndex=regsRegex.index;
                                            //startIndex=regs.index;
                                            wordfound = word;
                                            break;
                                        }

                                    }
                                }
                            }

                            if (wordColor[wordfound] != undefined ) {
                                if (!inContentEditable || (inContentEditable && wordColor[wordfound].showInEditableFields)) {    
                                    try {
                                        var match = document.createElement(highlightTag);

                                        // the flex control does not work eg on https://www.ebay.com/sch/i.html?_from=R40&_nkw=tire&_sacat=0&_odkw=tire&_osacat=0 
                                        // highlight the word "tire" with a container filter on ".x-refine__item__title-container"
                                        // it breaks teh clicking in the facet title
                                        
                                        if (window.getComputedStyle(node.parentElement).display === 'flex') {
                                            var newSpan = document.createElement('span');
                                            newSpan.textContent=node.textContent;
                                            node.parentElement.replaceChild(newSpan, node);
                                            node=newSpan.childNodes[0];
                                        } 


                                        match.classList.add(highlightClassname,wordColor[wordfound].cssClass );

                                        match.setAttribute(highlightClassname, true);
                                        match.setAttribute('htmatch', wordColor[wordfound].word);
                                        match.setAttribute('htloopnumber', loopNumber);
                                        match.style.fontStyle = "inherit";

                                        // 直接设置内联样式以确保最高优先级
                                        if(wordColor[wordfound].color) {
                                            match.style.setProperty('background-color', wordColor[wordfound].color, 'important');
                                        }
                                        if(wordColor[wordfound].fColor) {
                                            match.style.setProperty('color', wordColor[wordfound].fColor, 'important');
                                        }

                                        // 添加自定义 tooltip
                                        if(wordColor[wordfound].note && wordColor[wordfound].note.trim() !== '') {
                                            match.setAttribute('data-note', wordColor[wordfound].note);
                                            match.setAttribute('data-note-text-color', wordColor[wordfound].noteTextColor || '#FFFFFF');
                                            match.setAttribute('data-note-bg-color', wordColor[wordfound].noteBgColor || '#333333');
                                            match.style.position = 'relative';
                                            match.style.cursor = 'help';

                                            match.addEventListener('mouseenter', function(e) {
                                                showCustomTooltip(e.target);
                                            });
                                            match.addEventListener('mouseleave', function(e) {
                                                hideCustomTooltip();
                                            });
                                        }

                                        if(wordColor[wordfound].action.type!=0){
                                                match.onclick=function () {
                                                clickHandler(this);
                                            };
                                        }
                                                                
                                        featureFlagDetectDynamicUpdates && this.stopObservingHighlightElement(node);
                                        Debug && console.log('highlighting', node, match)
                                        // Split the text node at the start of the capturing group match
                                        var matchStart = node.splitText(startIndex);
                                        
                                        // Split the 'matchStart' node at the end of the capturing group match, isolating it in its own node
                                        var matchEnd = matchStart.splitText(regResult.length);
                                        featureFlagDetectDynamicUpdates && this.observeHighlightElement(matchEnd);

                                        // Create the new element to wrap the capturing group match
                                        match.textContent = matchStart.nodeValue; // Set the capturing group match as the content of the new element

                                        // Replace the matched text node with the new element
                                        matchStart.parentNode.replaceChild(match, matchStart);
                                        featureFlagDetectDynamicUpdates && this.observeHighlightElement(node);
                                    }
                                    catch (error) {
                                        // Manually report the error to window.onerror
                                        if (window.onerror) {
                                            
                                            const message = (error.message || "An error occurred") + "-[" + regs + "]-" + window.location;
                                            const source = error.fileName || "unknown file"; // Note: error.fileName is non-standard
                                            const lineno = error.lineNumber || 0; // Note: error.lineNumber is non-standard
                                            const colno = error.columnNumber || 0; // Note: error.columnNumber is non-standard
                                            window.onerror(message, source, lineno, colno, error);
                                        } else {
                                            // Fallback error handling if window.onerror is not available
                                            console.error(error);
                                            storeError('an error occured during highlighting', 'HighlightEngine', 0, 0, error)
                                        }
                                        return true;
                                    }
                                }
                                
                                if(wordColor[wordfound].notifyOnHighlight) {
                                    notifyForWords.add(wordColor[wordfound].word);
                                    if (wordColor[wordfound].notifyFrequency=="2"){
                                        notifyAnyway=true;
                                    }
                                }
                                                                                        
                                highlightMarkers[numberOfHighlights] = {
                                    "word": wordColor[wordfound].word
                                };
                                
                                numberOfHighlights += 1; 
                            }
                        }
                    
                } 
            }
        }
    };


    // start highlighting at target node
    this.highlight = function (words, printHighlights, regexConfig, skipSelectors, loopNumber) {
        wordColor = words;
        numberOfHighlights = 0;


            RegexConfig=regexConfig;

            matchRegex = new RegExp(regexConfig.matchRegex,"i");
            matchRegexCS = new RegExp(regexConfig.matchRegexCS,"");
            matchRegexEditable = new RegExp(regexConfig.matchRegexEditable,"i");
            matchRegexEditableCS = new RegExp(regexConfig.matchRegexEditableCS,"");
    
            magicRegex = new RegExp(regexConfig.magicRegex,"i");
            magicRegexCS = new RegExp(regexConfig.magicRegexCS,"");

        SkipSelectors = skipSelectors;

        if (matchRegex||matchRegexCS) {
            this.highlightWords(document.body, printHighlights, false, loopNumber);
        }  

        return {numberOfHighlights: numberOfHighlights,  markers: highlightMarkers, notify: Array.from(notifyForWords), notifyAnyway: notifyAnyway};
    };

}

// 自定义 tooltip 功能
var customTooltip = null;

function showCustomTooltip(element) {
    hideCustomTooltip();

    var note = element.getAttribute('data-note');
    var textColor = element.getAttribute('data-note-text-color') || '#FFFFFF';
    var bgColor = element.getAttribute('data-note-bg-color') || '#333333';

    if (!note) return;

    customTooltip = document.createElement('div');
    customTooltip.className = 'highlight-custom-tooltip';
    customTooltip.textContent = note;
    customTooltip.style.cssText = `
        position: absolute;
        z-index: 999999;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        line-height: 1.4;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        pointer-events: none;
        color: ${textColor};
        background-color: ${bgColor};
        border: 1px solid rgba(255,255,255,0.2);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    document.body.appendChild(customTooltip);

    // 定位 tooltip
    var rect = element.getBoundingClientRect();
    var tooltipRect = customTooltip.getBoundingClientRect();

    var left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    var top = rect.top - tooltipRect.height - 8;

    // 确保 tooltip 不超出屏幕
    if (left < 5) left = 5;
    if (left + tooltipRect.width > window.innerWidth - 5) {
        left = window.innerWidth - tooltipRect.width - 5;
    }
    if (top < 5) {
        top = rect.bottom + 8;
    }

    customTooltip.style.left = (left + window.scrollX) + 'px';
    customTooltip.style.top = (top + window.scrollY) + 'px';
}

function hideCustomTooltip() {
    if (customTooltip && customTooltip.parentNode) {
        customTooltip.parentNode.removeChild(customTooltip);
        customTooltip = null;
    }
}
