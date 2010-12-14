

Namespace('org.yabooo.template.core')
.define(function(ns){
    var module = { exports : {}};
//include<src/html-template-core.js>
    ns.provide( module.exports );
});

Namespace('org.yabooo.template')
.use('org.yabooo.template.core *')
.define(function(ns){
    var merge =  function(origin,target){
        for(var prop in target ){
            if( !target.hasOwnProperty(prop) )
                continue;
            origin[prop] = target[prop];
        }
    };
    var meta = {   
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    };
    var quote = function(str) {
        return '"' + str.split('').map(function(e){return meta[e] ? meta[e] : e ;}).join('') +'"';
    };
    var GLOBAL_FUNC = {
        __escapeHTML:function(str){
            return str
                .toString()
                .replace(/&/g,'&amp;')
                .replace(/</g,'&lt;')
                .replace(/>/g,'&gt;')
                .replace(/'/g, '&#039;')
                .replace(/"/g, '&quot;');
        },
        __escapeJS:function(str){
            return quote(str);
        },
        __escapeURL:function(str){
            return encodeURI(str);
        },
        __escapeNONE:function(str){
            return str;
        },
        __include : function(name,param,func){
            var tmpl = Klass.getByElementId(name);
            if( !tmpl ){
                return;
            }
            tmpl.param(param);
            tmpl.registerFunction(func);
            return tmpl.output();
        }
    };
    var Klass = function _HTMLTemplate(func){
        this._param  = {};
        this._funcs  = {};merge(this._funcs,GLOBAL_FUNC);
        this._output = func;
    };
    merge( Klass.prototype , {
        param : function(obj){
            merge( this._param , obj );
        },
        registerFunction :function(name,func){
            this._funcs[name] = func;
        },
        output : function(){
            return this._output( this._param , this._funcs );
        }
    } );

    merge( Klass , {
        cache : {},
        get : function(source){
            var uniqId = 'autocache:' + Klass.hashFunction(source);
            var func = Klass.resolve( uniqId );
            if( func )
                return new Klass( func );
            return new Klass( Klass.reserve( uniqId , source ) );
        },
        resolve : function(name){
            return Klass.cache[name];
        },
        reserve : function(name,source){
            var functionBody = ns.getFunctionText(source);
            Klass.cache[name] = ns.compileFunctionText(functionBody );
            return Klass.cache[name];
        },
        getByElementId : function(elementId){
            var uniqId = 'dom:' + elementId;
            var func   = Klass.resolve( uniqId );
            if( func ){ return new Klass( func ); }
            var element = document.getElementById( elementId );
            if( !element ){ return undefined;}

            var source = Array.prototype.slice.call( element.childNodes || [] )
                .filter(function(e){ return e.nodeType == Node.COMMENT_NODE })
                .map(function(e){return e.data;})
                .join('');

            return new Klass( Klass.reserve( uniqId , source ) );
        },
        hashFunction  : function(string){
            var max = (1 << 31);
            var length = string.length;
            var ret    = 34351;
            var pos    = 'x';
            for (var i = 0; i < length; i++) {
                var c = string.charCodeAt(i);
                ret *= 37;
                pos ^= c;
                ret += c;
                ret %= max;
            }
            return ret.toString(16)+'-'+(pos & 0x00ff).toString(16) ;
        },
        registerFunction : function(name,func){
            GLOBAL_FUNC[name] = func;
        }
    });

    
    ns.provide({
        HTMLTemplate : Klass
    });
});
