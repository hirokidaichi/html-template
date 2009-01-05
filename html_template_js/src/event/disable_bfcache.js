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



