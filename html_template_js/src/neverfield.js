
(function() {
    return new (Class.create({
        initialize:function(){
            this._plugin = {};
        },
        appendModule:function(name,module){
            if(!this[name]){
                this[name] = {};
                module.apply(this[name],[this]);
            }
            return this;
        },
        appendPlugin:function(name,plugin){
            if(!this._plugin[name]){
                this._plugin[name] = {};
                plugin.apply(this[name],[this]);
            }
            return this;
        },
        isLoadedPlugin:function(name){
            return !!(this._plugin[name]);
        },
        getPlugin:function(name){
            return this._plugin[name] || {};
        }
    }));
})()
.appendPlugin('scriptQuery',function(topLevel){
    function export_queryParams(){
        var src = $A(document.getElementsByTagName('script')).last().src;
        var obj = (src.indexOf('?'))?src.toQueryParams():{};
        obj.src = src.split("?")[0];
        return obj;
    }
    Object.extend(topLevel,{
        getQueryParams:export_queryParams,
        QUERY_PARAMS:export_queryParams()
    });
})
.appendPlugin('applicationInfo',function(topLevel){
    var meta  = $$('meta[name^="APPLICATION_INFO"]')[0];
    var applicationInfo = ( meta )? meta.getAttribute('content').evalJSON():({});

    Object.extend(topLevel,{
        APPLICATION_INFO:Object.extend({
            ROOT:'/static/js/',
            DEPENDS:[],
            REQUIRE:[],
            NAME:'__PACKAGE__'
        },applicationInfo)
    });
})
.appendPlugin('scriptLoad',function(topLevel){
    var INFO = topLevel.APPLICATION_INFO;
    var head = $$('head')[0];
    var appendHeader = function(e){
        var name,query;
        if( Object.isString(e) ){
            name  = e.replace(/\./g,'::').underscore();
        }else{
            name  = e[0].replace(/\./g,'::').underscore();
            query = $H(e[1]).toQueryString();
        }
        head.appendChild(new Element('script',{src:INFO.ROOT+name+".js"+((query)? '?'+query :'')}));
    };
    $A(INFO.DEPENDS).each(appendHeader);
    document.observe('dom:loaded',function(){
        $A(INFO.REQUIRE).each(appendHeader);
    });
})
.appendModule('Model',function(topLevel){
    //必要なモデル定義の追加
    var INFO = topLevel.APPLICATION_INFO;
    if(INFO['MODEL']){
        var head   = $$('head')[0];
        var target = INFO['model'].TARGET || [];
        var root   = INFO['model'].ROOT   || '/';
        var suffix = INFO['model'].SUFFIX || '';
        $A(TARGET).each(function(e){
            head.appendChild(new Element('script',{src:ROOT+e+SUFFIX}));
        });
    }
    var MethodRegister = Class.create({
        initialize:function(model){
            this.model = model;
            this.url   = '';
            this.cache = {};
            this.beforeReturnValue = {};
            this.beforeRequest = [];
            this.afterRequest  = [];
            //this.eventList = {};
        },
        endMethod:function(){
            return this.model;
        },
        commit:function(args,callback){
            var _self = this;
            this.beforeRequest.inject({args:args,callback:callback},function(ret,e){
                return e.apply(_self,ret);
            });
            var request = new Ajax.Request(this.url,this.option);
            this.afterRequest.inject({args:args,callback:callback,request:request},function(ret,e){
                return e.apply(_self,ret);
            });
        }
    });
    MethodRegister.addPluginMethod = function(name,method){
        var obj;
        if(Object.isString(name) && Object.isFunction(method)){
            var obj = $H((tmp ={},tmp[name] = method,tmp));
        }else{    var cache = {};
            var obj = $H(name);
        }
        var v = {};
        obj.each(function(elem){
            v[elem.key] = function(){
                var returnValue = elem.value.apply(this,$A(arguments))
                if(returnValue) this.beforeReturnValue[elem.key] = returnValue ;
                return this;
            };
        });
        MethodRegister.addMethods(v); 
    }
    MethodRegister.addPluginMethod({
        setBaseURI:function(url){
            this.url = url;
        },
        setInitialCache:function(cache){
            this.cache = cache;
        },
        popEvent:function(eventType,func){
            
        },
        pushEvent:function(eventType,func){
        
        },
        shiftEvent:function(eventType,func){
        
        },
        unshiftEvent:function(eventType,func){
        
        },
        enableCache:function(){
        
        },
        disableCache:function(){
        
        },
        parseData:function(){
        
        },
        setHTTPHeader:function(name,value){
            this.option.requestHeaders[name] = value;
        },
        setHTTPMethod:function(method){
            this.option.method = method;
        },
        argumentsFilter:function(){
        
        },
        inputValidate:function(){
        
        },
        outputValidate:function(){
        
        }
    });
    var Model = Class.create({
        initialize:function(name){
            this.name     = name;
            this.methods  = {};
        },
        method:function(methodName){
            if(this.methods[methodName]){
                return this.methods[methodName];
            }else{
                this.methods[methodName] = new MethodRegister(this);
                this[methodName]         = this.methods[methodName].commit;
                return this.methods[methodName];
            }
        }
    });
    Object.extend(this,{
        create:function export_create(modelName){
            if(!Object.isString(modelName)){
                throw('modelName must be string');
            }
            return this[modelName] || (this[modelName] = new Model({name : modelName}));
        },
        register :MethodRegister,
        addPlugin:MethodRegister.addPluginMethod
    });

})
.appendModule('Namespace',function(topLevel){
    var INFO    = topLevel.APPLICATION_INFO;
    var MESSAGE ={
        NOREF : ':: namespace error ::not found\t',
        EXIST : ':: namespace error ::overiding\t',
        REQUIRE:':: namespace error ::require\t',
        DYNAMIC:':: namespace error ::dynamic'
    };
    var cache    = {};
    var fileRoot = INFO.ROOT ;
    this.Global  = {};

    Object.extend(this.Global,{
        create      : export_createNamespace,
        isLoaded    : export_isLoaded,
        depends     : export_depends,
        dynamic     : export_dynamic,
        using       : export_using,
        dumpCache   : export_dumpCache,
    });
    
    Object.extend(this,$H(this.Global).inject({},function(wrapped,e){
        wrapped[e.key] =e.value.wrap(function(){
            var args = $A(arguments);
            var original = args.shift();
            args[0]=INFO.NAME+"."+args[0];
            return original.apply(this,args);
        });
        return wrapped;
    }));

    this.Global.create(INFO.NAME,Prototype.emptyFunction,topLevel);
    function _truncateFQN(fqn, n) {
        var leaves = fqn.split(".");
        var ret = [];
        for (var i = 0; i < n+1 ; i++) {
            ret.push(leaves[i]);
        }
        return ret.join('.');
    };
    function _createOrUse(fqn){
        try{
            return export_createNamespace(fqn);
        }catch(e){
            if(e.toString().match(new RegExp(MESSAGE.EXIST))){
                return export_using(fqn);
            }
        }
    }
    function _getNamespace(fqn) {
        if (cache[fqn]) return cache[fqn];
        try{
            var ns =eval('('+fqn+')');
            if(_canBeNamespace(ns)){
                return ns;
            }
            throw('');
        }catch(e){
            throw(new Error(MESSAGE.NOREF));
        }
    };

    function export_dumpCache(){
        console.log(cache);
    }
    function _canBeNamespace(obj){
        return (
            Object.isUndefined(obj) || // undefined である
            typeof obj == 'object'  || // 普通のhashオブジェクトである
            ( Object.isFunction(obj) && obj.toString() == Class.create().toString()) // prototype.jsによるクラスである
        )? true:false;
    }
    function export_createNamespace(fqn, func, initialValue) {
        if(cache[fqn]) throw(new Error(MESSAGE.EXIST));
        var leaves = fqn.split(".");
        var tmpTop = window;
        var length = leaves.length;
        var ns = leaves.map(function(e,i){
            if(_canBeNamespace(tmpTop[e]) ){
                // namespaceになれる
                var tmpFQN = _truncateFQN(fqn,i);
                if((i == length -1) && !Object.isUndefined(tmpTop[e])){
                    throw(new Error(MESSAGE.EXIST));
                }else{
                    tmpTop[e] = tmpTop[e] || initialValue || {__SELF_NAMESPACE :tmpFQN};
                }
                cache[tmpFQN] = tmpTop[e];
                tmpTop = tmpTop[e];
                
            }else{
                // namespaceになれない
                throw(new Error(MESSAGE.EXIST));
            }
            return tmpTop; 
        });

        if (func) {
            return func.apply(ns.last(),ns);
        } else {
            return ns;
        }
    }

    function export_dynamic(fqn,func){
        var ns;
        try{
           return export_using(fqn,func);
        }catch(e){
            var url = INFO.ROOT +fqn.replace(/\./g,'::').underscore()+'.js';
            new Ajax.Request(url,{
                method :'get',
                onComplete:function(r){
                    ns = export_using(fqn,func);
                },
                onException:function(r,a){
                    throw new Error(  MESSAGE.DYNAMIC + fqn );
                }
            
            })
        }
    }
    function _getExportedObject(list,ns){
        var obj = {};
        var flag = false;
        $A(list).each(function(arg){
            flag = true;
            if(ns[arg]){
                obj[arg] = ns[arg];
            }else{
                throw(new Error('cant export'));
            }
        });
        return (flag)?obj:ns;
    }
    function export_using(fqn,funcOrExport) {
        var ns = _getNamespace(fqn);
        if(funcOrExport){
            if(Object.isFunction(funcOrExport)){
                var func = funcOrExport;
                var obj  = _getExportedObject( func.argumentNames(),ns );
                return func.apply(obj,func.argumentNames().map(function(arg){return obj[arg];}));
            }
            if(Object.isArray(funcOrExport)){
                return _getExportedObject(funcOrExport,ns);
            }
            
        }else{
            return ns;
        }
    };
    function export_isLoaded(){
        try{
            return export_depends.apply(this,arguments);
        }catch(e){
            return false;
        }
    }
    function export_depends() {
        var fqn = $A(arguments).flatten();
        var ret = [];
        try{
            for(var i=0,l = fqn.length;i<l;i++){
                if (_getNamespace(fqn[i])) {
                    ret.push( _getNamespace(fqn[i]));
                }
            }
        }
        catch(e){
            throw new Error(  MESSAGE.REQUIRE + fqn.join(",")+"/"+e.message );
        }
        if(ret.length == 1){
            return ret[0];
        }else{
            return ret;
        }
    };
})
.appendModule('View',function(topLevel){
    var _self = this;

    Element.Methods.update['__SYMBOL__']  = 'update';
    Element.Methods.insert['__SYMBOL__']  = 'insert';
    Element.Methods.replace['__SYMBOL__'] = 'replace';
    $w('update insert replace hide show').each(function(t){
        Element.Methods[t] = Element.Methods[t].wrap(function(before){
            
        });
    });
    Element.addMethods({
        isAssigned:function(){
            return !!(this.element.parentNode);
        }
    })
    /*
     * 
     *
     */
    var DOMTemplate = Class.create({
        initialize:function(instance){
            this.element = instance;
        }
    });
    var ViewWrapper = Class.create({
        initialize:function(viewModule){
            this.view = viewModule;
            this.actionList = {
                update :[],
                insert :[],
                replace:[]
            };
        },
        _getCallerElement:function(){
            var limit = 5;
            var now   = arguments.callee;
            for(;limit;limit--){
                now = now.caller;
                if(!now){
                    return ;
                }
                if(now.__SYMBOL__){
                    return {
                        element:now.arguments[0],
                        type   :now.__SYMBOL__
                    };
                }
            }
            return ;
        },
        render:function(){
            return this.view.toString();
        },
        addActionHandler:function(eventType,handler){
            this.actionList[eventType].push(handler);
            return this;
        },
        setParameter:function(params){
           this.params = params;
        },
        toHTML:function(){
            var env   = this._getCallerElement();
            var _self = this;
            if(env){
                (function(){
                    _self.actionList[env.type].each(function(action){
                        action.apply(_self,[((env.type == 'replace')?env.element.parentNode:env.element)]);
                    });
                }).defer();
            }
            return this.render();
        }
    });
    var viewCache    = {};
    var recentViewId = 1;
    Object.extend( _self ,{
        addModule:function(module,mixinObject){
            module = (Object.isString(module)) ? topLevel.Namespace.Global.using(module) : module;
            if(!Object.isFunction(module)){
                throw('e');
            }
            if( module.__VIEW_ID && viewCache[module.__VIEW_ID] ){
                viewCache[module.__VIEW_ID] = Object.extend(viewCache[module.__VIEW_ID],mixinObject);
                return _self;
            }else{
                module.__VIEW_ID = module.__VIEW_ID || recentViewId++;
                viewCache[module.__VIEW_ID] = Class.create(ViewWrapper,mixinObject);
                return _self;
            }
        },
        create:function(instance){
            var module = viewCache[
                (Object.isElement(instance))
                ? DOMTemplate
                : instance.constructor.__VIEW_ID
            ];
            if(module){
                return new module(instance);
            }
        }
    });
    _self.addModule(DOMTemplate,{
        render:function(){
            return this.element;
        },
        toElement:function(){
            var env   = this._getCallerElement();
            var _self = this;
            if(env){
                (function(){
                    _self.actionList[env.type].each(function(action){
                        action.apply(_self,[env.element]);
                    });
                }).defer();
                if(env.element && env.element === this.element){
                    
                }else{
                    
                }
            }
         }
     });
     _self.addModule(Template,{
        setParameter:function( params ){
            this.params = params;
        },
        render:function(){
            return this.view.evaluate( this.params );
        }
    });
    
})
.appendModule('UIComponent',function(){


});
console.log('framework compile\t'+((new Date).getTime()-test));
document.observe('dom:loaded',function(){
    console.log('dom:loaded\t'+((new Date).getTime()-test));
});
Event.observe(window,'load',function(){
    console.log('window load\t'+((new Date).getTime()-test));
});

