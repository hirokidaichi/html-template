

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
            return JSON.stringify(str);
            //return Object.toJSON(str);
        },
        __escapeURL:function(str){
            return encodeURI(str);
        },
        __escapeNONE:function(str){
            return str;
        },
        __include : function(name,param,func){
            var tmpl = new HTMLTemplate(name);
            tmpl.param(param);
            tmpl.registerFunction(func);
            return tmpl.output();
        }
    };
    var HTMLTemplate = function _HTMLTemplate(source){
        this._source = source;
        this._param = {};
        this._funcs = {};merge(this._funcs,GLOBAL_FUNC);
        var functionBody = ns.getFunctionText( source );
        this._output =  ns.compileFunctionText( functionBody );
    };
    merge( HTMLTemplate.prototype , {
        param : function(obj){
            merge( this._param , obj );
        },
        registerFunction :function(obj){
            merge( this._funcs , obj );
        },
        output : function(){
            console.log(this);
            return this._output( this._param , this._funcs );
        }
    } );
    ns.provide({
        HTMLTemplate : HTMLTemplate
    });
});
