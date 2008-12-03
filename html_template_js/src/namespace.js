(function(ownNamespace) {
    var cache = {};
    var MESSAGE ={
        NOREF : ':: namespace error ::not found\t',
        EXIST : ':: namespace error ::overiding\t',
        REQUIRE:':: namespace error ::require\t',
        DYNAMIC:':: namespace error ::dynamic'
    };
    var ownNamespace = _createOrUse(ownNamespace)

    Object.extend(ownNamespace,{
        createNamespace: export_createNamespace,
        isLoaded: export_isLoaded,
        depends : export_depends,
        dynamic : export_dynamic,
        using   : export_using,
        dumpCache:export_dumpCache,
        INCLUDE : '/static/js/'
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

})('JS.Namespace');

