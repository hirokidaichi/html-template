if (!Prototype) throw ('Event.Wrapper require prototype.js');
if (parseInt(Prototype.Version) > 1.6) throw ('Event.Wrapper require prototype.js v1.6 or later');

if(Prototype.Browser.IE)(function() {

    var eventCache ={};
    var wrapperCache = {};
    function getEventCache(elementID,eventName){
        if(!eventCache[elementID])eventCache[elementID]={};
        if(!eventCache[elementID][eventName])eventCache[elementID][eventName]=[];
        return eventCache[elementID][eventName];
    }
    function createFixedOrderWrapper(elementID,eventName){
        var wrapper= function(event){
            getEventCache(elementID,eventName).each(function(func){
                func(event);
            });
        };
        if(!wrapperCache[elementID])wrapperCache[elementID]= {};
        wrapperCache[elementID][eventName] = wrapper;
        return wrapper;
    }
    function getEventId(element) {
        return element._prototypeEventID || element._eventID;
    }
    function addEventListenerIE(element,eventName,func,capture){
        var id = getEventId(element);
        var length =getEventCache(id,eventName).push(func);
        if(length == 1){
            element.attachEvent('on'+eventName,createFixedOrderWrapper(id,eventName));
        }
    }
    function removeEventListenerIE(element,eventName,func,capture){
        var id = getEventId(element);
        var cache =getEventCache(id,eventName);
        if(cache.length >0){
            eventCache[id][eventName]=cache.without(func);
            if(eventCache[id][eventName].length == 0){
                element.detachEvent('on'+eventName,wrapperCache[id][eventName]);
            }
        }
    }
    
    Element.addMethods({
        addEventListener:addEventListenerIE,
        removeEventListener:removeEventListenerIE
    });
    Object.extend(window, {
        addEventListener: addEventListenerIE.methodize(),
        removeEventListener: removeEventListenerIE.methodize()
    });
    Object.extend(document, {
        addEventListener: addEventListenerIE.methodize(),
        removeEventListener: removeEventListenerIE.methodize()
    });
    (function(){
        var flag =true;
        Event.observe(window,'load',function(){
            if(flag){
                document.fire('dom:loaded');
                document.stopObserving('dom:loaded');
            }
        });
        document.observe('dom:loaded',function(evt){
            flag =false;
        });
    })();
})(); 

