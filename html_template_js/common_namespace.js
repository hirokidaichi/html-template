(function(ownNamespace) {
    var cache = {};
    var MESSAGE ={
        NOREF : ':: namespace error ::not found\t',
        EXIST : ':: namespace error ::overiding\t',
        REQUIRE:':: namespace error ::require\t',
        DYNAMIC:':: namespace error ::dynamic'
    };
    var onwNamespace = _createOrUse(ownNamespace)
    Object.extend(ownNamespace),{
        createNamespace: export_createNamespace,
        isLoaded: export_isLoaded,
        depends : export_depends,
        dynamic : export_dynamic,
        using   : export_using,
        wait    : export_wait,
        INCLUDE : '/static/js/'
    });

    function _truncateFQN(fqn, n) {
        var leaves = fqn.split(".");
        var ret = [];
        for (var i = 0; i < n ; i++) {
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
        var leaves = fqn.split(".");
        var headLeaf = leaves[0];
        var tmpTop = window;
        var leaveLength = leaves.length;

        for (var i = 0; i < leaveLength; i++) {
            if (!tmpTop[headLeaf]) {
                throw new Error(MESSAGE.NOREF + fqn)
            }
            tmpTop = tmpTop[headLeaf];
            headLeaf = leaves[i + 1];
        }
        return tmpTop;
    };
    function export_wait(condition,func){
        var cond = null
        if(Object.isFunction(condition)){
            cond = condition;
        }
        if(Object.isString(condition)){
            cond = function(){
                try{
                    return _getNamespace(condition);
                }catch(e){
                    return false;
                }
            }
        }
        var check = function(sync){
            var obj = null;
            if( obj = cond() ){
                
                if(!sync){
                    func.apply(obj);
                    clearInterval(id);
                }else{
                    return true;
                }
            }
        };
        if(check(true))return true;
        var id = setInterval( check, 30 );
    }
    function export_createNamespace(fqn, func) {
        var leaves = fqn.split(".");
        var headLeaf = leaves[0];
        var tmpTop = window;
        var leaveLength = leaves.length;
        if (cache[fqn]) throw (MESSAGE.EXIST + fqn);
        for (var i = 0; i < leaveLength; i++) {
            if (tmpTop[headLeaf] && typeof tmpTop[headLeaf] != "object") {
                throw new Error(MESSAGE.EXIST  + typeof tmpTop[headLeaf] + ". : " + fqn);
            }
            tmpTop[headLeaf] = tmpTop[headLeaf] || {};
            cache[_truncateFQN(fqn, i)] = tmpTop;
            tmpTop = tmpTop[headLeaf];
            headLeaf = leaves[i + 1];
        }
        if (func) {
            return func.apply(tmpTop);
        } else {
            return tmpTop;
        }
    }
    // 
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



})('Module');

