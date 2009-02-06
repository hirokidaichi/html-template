
if (!Prototype) throw ('Event.Wrapper require prototype.js');

if(Prototype.Browser.IE)(function() {
    var eventCache   = {};
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
        var id     = getEventId(element);
        var length = getEventCache(id,eventName).push(func);
        if(length == 1){
            element.attachEvent('on'+eventName,createFixedOrderWrapper(id,eventName));
        }
    }
    function removeEventListenerIE(element,eventName,func,capture){
        var id    = getEventId(element);
        var cache = getEventCache(id,eventName);
        if(cache.length >0){
            eventCache[id][eventName]=cache.without(func);
            if(eventCache[id][eventName].length == 0){
                element.detachEvent(
                    'on'+eventName,
                    wrapperCache[id][eventName]
                );
            }
        }
    }
    
    Element.addMethods({
        addEventListener    : addEventListenerIE,
        removeEventListener : removeEventListenerIE
    });
    Object.extend(window, {
        addEventListener    : addEventListenerIE.methodize(),
        removeEventListener : removeEventListenerIE.methodize()
    });
    Object.extend(document, {
        addEventListener    : addEventListenerIE.methodize(),
        removeEventListener : removeEventListenerIE.methodize()
    });
    (function(){
        var flag = true;
        Event.observe(window,'load',function(){
            if(flag){
                document.fire('dom:loaded');
                document.stopObserving('dom:loaded');
            }
        });
        document.observe('dom:loaded',function(evt){
            flag = false;
        });
    })();
})();

/*
 *
 *
 * 
 */
if (Prototype.Browser.WebKit)(function() {
    Event._observe = Event.observe;
    function _search(hash,searchText){
        if(hash[searchText]){
            return (Object.isFunction(hash[searchText]))?hash[searchText]:Prototype.emptyFunction;
        }else{
            return (Object.isFunction(hash['_default']))?hash['_default']:Prototype.emptyFunction;
        }
    }
    var firstUnload  = true;
    Event.observe = function(element, name, func) {
        return _search({
            'beforeunload':function(){
                return element.addEventListener('beforeunload',function(evt) {
                    return func.bind(element)(evt);
                });
            },
            'unload':function(){
                if (firstUnload) Event._observe(window, 'unload', (function() {
                    var cache      = {};
                    var selector = $w('input option select textarea').join(':not(._marked),') + ':not(.marked)';
                    function storeCache() {
                        $$( selector ).each(function(e) {
                            cache[e.identify()] = e;
                            e.addClassName('_marked');
                        });
                    }
                    Event._observe(document.body,'DOMNodeInserted', storeCache);
                    Event._observe(window,'load', storeCache);
                    return function() {
                        var time = (new Date).getTime();
                        alert(Object.toJSON($H(cache).keys()));
                        $H(cache).each(function(e, i) {
                            e.value.name = time + "_" + i;
                        });
                    };
                })());
                firstUnload = false;
                return Event._observe(element, name, func);
            },
            '_default':function(){
                return Event._observe(element, name, func);
            }
        },name)();
    }
    Object.extend(window, {
        observe: Event.observe.methodize()
    });
})();



