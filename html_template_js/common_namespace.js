(function(ownNamespace) {
    var cache = {};
    var MESSAGE ={
        NOREF : ':: mixi namespace error ::not found\t',
        EXIST : ':: mixi namespace error ::overiding\t',
        REQUIRE:':: mixi namespace error ::require\t',
        DYNAMIC:':: mixi namespace error ::dynamic'
    };
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
            var url = '/static/js/'+fqn.replace(/\./g,'::').underscore()+'.js';
            new Ajax.Request(url,{
                method :'get',
                onComplete:function(r){
                    ns =export_using(fqn,func);
                },
                onException:function(r,a){
                    throw new Error(  MESSAGE.DYNAMIC + fqn );
                }
            
            })
        }
    }
    function export_using(fqn, func) {
        return (func)?func.apply(_getNamespace(fqn)):_getNamespace(fqn);
    };
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

    Object.extend(_createOrUse(ownNamespace),{
        createNamespace: export_createNamespace,
        depends : export_depends,
        using   : export_using,
        dynamic : export_dynamic
    });

})('Namespace');

