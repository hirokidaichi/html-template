(function() {
    var cache = {};
    var meta = $$('meta[name^="APPLICATION_INFO"]')[0];
    var applicationInfo = ( meta )? meta.getAttribute('content').evalJSON():(export_queryParams() || {});
    
    var MESSAGE ={
        NOREF : ':: namespace error ::not found\t',
        EXIST : ':: namespace error ::overiding\t',
        REQUIRE:':: namespace error ::require\t',
        DYNAMIC:':: namespace error ::dynamic'
    };
    var ownNamespace  = _createOrUse(applicationInfo.name || '__PACKAGE__');
    var fileRoot      = applicationInfo.root || '/static/js/';
    Object.extend(ownNamespace,{
        createNamespace: export_createNamespace,
        isLoaded    : export_isLoaded,
        depends     : export_depends,
        dynamic     : export_dynamic,
        using       : export_using,
        dumpCache   : export_dumpCache,
        queryParams : export_queryParams,
        INCLUDE     : fileRoot,
        INFO        : applicationInfo
    });

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
    function export_queryParams(){
        var src = $A(document.getElementsByTagName('script')).last().src;
        var obj = src.toQueryParams();
        obj.src = src.split("?")[0];
        return obj;
    }
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
    function export_createNamespace(fqn, func) {
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
                    tmpTop[e] = tmpTop[e] || {__SELF_NAMESPACE :tmpFQN};
                }
                cache[tmpFQN] = tmpTop[e];
                tmpTop = tmpTop[e];
                
            }else{
                // namespaceになれない
                throw(new Error(MESSAGE.EXIST));
            }
            return tmpTop; 
        }).last();

        if (func) {
            return func.apply(ns);
        } else {
            return ns;
        }
    }

    function export_dynamic(fqn,func){
        var ns;
        try{
           return export_using(fqn,func);
        }catch(e){
            var url = ownNamespace.INCLUDE +fqn.replace(/\./g,'::').underscore()+'.js';
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
    //必要となるJSファイルの追加
    if(applicationInfo['depends']){
        var head = $$('head')[0];
        $A(applicationInfo['depends']).each(function(e){
            var name,query;
            if( Object.isString(e) ){
                name  = e.replace(/\./g,'::').underscore();
            }else{
                name  = e[0].replace(/\./g,'::').underscore();
                query = $H(e[1]).toQueryString();
            }
            head.appendChild(new Element('script',{src:ownNamespace.INCLUDE+name+".js"+((query)? '?'+query :'')}));
        });
    }
    //必要なモデル定義の追加
    if(applicationInfo['model']){
        var head   = $$('head')[0];
        var target = applicationInfo['model'].target || [];
        var root   = applicationInfo['model'].root   || '/';
        var suffix = applicationInfo['model'].suffix || '';
        $A(target).each(function(e){
            head.appendChild(new Element('script',{src:root+e+suffix}));
        });
    }
    //必要なアプリケーションの追加　dom:loaded後
    if(applicationInfo['require']){
        document.observe('dom:loaded',function(){
            var head = $$('head')[0];
            $A(applicationInfo['require']).each(function(e){
                var name,query;
                if( Object.isString(e) ){
                    name  = e.replace(/\./g,'::').underscore();
                }else{
                    name  = e[0].replace(/\./g,'::').underscore();
                    query = $H(e[1]).toQueryString();
                }
                head.appendChild(new Element('script',{src:ownNamespace.INCLUDE+name+".js"+((query)? '?'+query :'')}));
            });
        });
    }
    //モデルインタフェース
    ownNamespace.createNamespace(ownNamespace.__SELF_NAMESPACE+".Model",function(){
        var MethodRegister = Class.create({
            initialize:function(model){
                this.model = model;
            },
            commit:function(){
            
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
            addMethodPlugin:function(){
                //
            }
        });
    });
    // UIコンポーネントインタフェース
    ownNamespace.createNamespace(ownNamespace.__SELF_NAMESPACE+".UIComponent",function(){
        Object.extend(this,{
            regist:function export_regist(){
                
            }
        });
    });
    // メッセージハンドラ
    ownNamespace.createNamespace(ownNamespace.__SELF_NAMESPACE+".Message",function(){
        Object.extend(this,{
            regist:function export_regist(){
                
            }
        });
    });
})();
