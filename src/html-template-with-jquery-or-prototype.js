
var HTML = HTML || {};

(function () {
    var jQuery = window.jQuery || undefined;
    var meta = {   
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    };
    var domIdentifier = 0;

    var compat = {
        capitalize : function (s) {
            if (!(s && compat.isString(s))) {
                return s;
            }
            return (s.charAt(0).toUpperCase() + s.substring(1).toLowerCase());
        },
        defer : function (func, args) {
            return setTimeout(function () {
                return func(args); 
            }, 0);
        },
        defineClass : function (object) {
            var initializer = object.initialize || function (){};
            var F = function () {
                initializer.apply(this, arguments);
            };
            for (var p in object) {
                if (!object.hasOwnProperty(p)) {
                    continue;
                }
                F.prototype[p] = object[p];
            }

            return F;
        },
        identify : function (element) {
            if (element.id) {
                return element.id;
            }
            var id = 'anonymous_element_' + (domIdentifier++);
            element.id = id;

            return id;
        },
        isString : function (object) {
            return (typeof object == 'string');
        },
        isUndefined : function (object) {
            return (typeof object == 'undefined');
        },
        isElement : function (object) {
            return (object && (object.nodeType == 1));
        },
        extend : (jQuery) ? jQuery.extend : Object.extend,
        isFunction : (jQuery) ? jQuery.isFunction : Object.isFunction,
        isArray : (jQuery) ? jQuery.isArray : Object.isArray,
        quote : function(str) {
            var chars = str.split('');
            for (var i = 0, e = chars.length; i < e; i++) {
                if (meta[chars[i]]) {
                    chars[i] = meta[chars[i]];
                }
            }
            return '"' + chars.join('') + '"';
        },
        toArray : (jQuery) ? jQuery.makeArray : $A,
        idSelector : (jQuery) ? (function (id) {
            if (compat.isElement(id)) { return id; }
            return jQuery('#' + id).get(0);
        }) : $,
        cssSelector : (jQuery) ? (function (cssRule) {
                return jQuery(cssRule).get();
        }) : $$,
        ready : (jQuery) ? (function (f) { 
            jQuery(document).ready(f); 
        }) : (function (f) { 
            if (!compat.isFunction (document.observe)) {
                return ;
            }
            document.observe('dom:loaded', f); 
        })
    };

    HTML.Template = compat.defineClass({
        _guessOption:function(option){
            if ( compat.isString(option) ){
                var pos = option.indexOf(':');
                if(pos > 0 && pos < 10 ){
                    return {type:'name',source:option};
                }else{
                    return {type:'text',source:option};
                }
            }
            else if ( compat.isFunction(option) ){
                return {type:'function',source:option};
            }
            else if ( compat.isElement(option) ){
                return {type:'element',source:option};
            }
            if (! (option['type'] && option['source'])) {
                throw ('option needs {type:~~,source:~~}');
            }
            return option;
        },
        _initText:function( source ){
            this._source = compat.isString(source)?
                           source:
                               (source.toString)?
                                   source.toString():
                                        '';

            this.compile();
        },
        _initFunction:function( source ){
            if (compat.isFunction(source)) {
                this._output = source;
                this.isCompiled = true;
            }else{
                throw(new Error('in case type is function, source must be function object.'));
            }
        },
        _initElement:function( source ){
                var elem = compat.idSelector(source);
            if ( compat.isElement(elem) && !this.isCompiled) {
                var nodes = compat.toArray(elem.childNodes);

                var tmpl = '';
                for (var i = 0, e = nodes.length; i < e; i++) {
                    if (nodes[i].nodeType != 8) { continue ; }
                    tmpl += nodes[i].data;
                }

                this.storedName = 'dom:'+compat.identify(elem);
                this._source    = tmpl;
                this.compile();
                this.isCompiled = true;
            }
        },
        _initLoad:function(){
            if(!this.option['name']) throw('need name');
            this._source    = this.option['source'];
            this.storedName = this.option['name'];
            this.compile();
            this.isCompiled = true;
        },
        _initName:function( source ){
            this.source = '';
            this.storedName = source;
            if (HTML.Template.Cache[this.storedName]) {
                this._output = HTML.Template.Cache[this.storedName];
                this.isCompiled = true;
            }
            var segment = source.split(':');
            var _self   = this;
            ({
                dom:function(){
                    var element = segment[1];
                    _self._initElement(element);
                },
                autocache:function(){
                    throw(new Error(' not in cache '));
                }
            })[segment[0]]();
        },
        initialize: function(option) {
            this._param  = {};
            this._funcs  = compat.extend({},HTML.Template.GLOBAL_FUNC);
            this.isCompiled = false;
            this.option     = this._guessOption(option);
            var initializer = this['_init'+compat.capitalize(this.option['type'])];
            if( initializer ){
                initializer.apply(this,[this.option['source']]);
            }else{
                throw('invalid type');
            }
        },
        _uniqHash: function() {
            return "autocache:" + HTML.Template.hashFunction(this.getSource());
        },
        registerFunction: function(name, func) {
            this._funcs[name] = func;
        },
        getSource:function(){
            return ( compat.isFunction(this.option.filter)?
                this.option.filter:
                (function (k) { return k; })
            )(this._source);
        },
        functionize: function() {
            var _func = this._output;
            return function(param, functions) {
                var _tmp = new HTML.Template({
                    type: 'function',
                    source: _func
                });
                _tmp.param(param);
                _tmp._funcs = functions;
                return _tmp.output();
            };
        },
        clearParams:function(){
            this._param = {};
        },
        clearFunctions:function(){
            this._funcs = {};
        },
        clear: function(){
            this.clearParam();
            this.clearFunction();
        },
        param: function(obj) {
            if (compat.isArray(obj)) {
                throw ('template.param not array');
            }
            if (compat.isUndefined(obj)){
                var result = [];
                for (var o in this._param) {
                    if (!this._param.hasOwnProperty(o)) {
                        continue;
                    }
                    result.push(o);
                }
                return result;
            }
            if (compat.isString(obj)){
                return this._param[obj];
            }
            for (var prop in obj) {
                this._param[prop] = obj[prop];
            }
            return null;
        },
        compile: function() {
            if( this.isCompiled ) return;
            var uniq = this.storedName || this._uniqHash();
            if (HTML.Template.Cache[uniq]) {
                this._output = HTML.Template.Cache[uniq];
                this.isCompiled = true;
                return;
            }
            var functionBody = HTML.Template.Core.getFunctionText( this._source );
            this._output =  HTML.Template.Core.compileFunctionText( functionBody );
            HTML.Template.Cache[uniq] = this._output;
            this.isCompiled = true;
        },
        output: function() {
            return this._output( this._param , this._funcs );
        },
        toString:function(){
            return this.output() || '__UNCOMPILED__';
        },
        toHTML: function(){
            return this.output();
        }
    });


    compat.extend(HTML.Template,{
        VERSION           : '0.8',
        DEFAULT_SELECTOR  : '.HTML_TEMPLATE',
        DEFERRED_SELECTOR : '.HTML_TEMPLATE_DEFERRED',
        GLOBAL_FUNC     :{
            __escapeHTML:function(str){
                return (str
                    .toString()
                    .replace(/&/g,'&amp;')
                    .replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;')
                    .replace(/'/g, '&#039;')
                    .replace(/"/g, '&quot;'));
            },
            __escapeJS:function(str){
                return compat.quote(str);
            },
            __escapeURL:function(str){
                return encodeURI(str);
            },
            __escapeNONE:function(str){
                return str;
            },
            __include : function(name,param,func){
                var tmpl = new HTML.Template(name);
                tmpl.param(param);
                tmpl.registerFunction(func);
                return tmpl.output();
            }
        },
        Cache : {},
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
        registerFunction : function(name, func) {
            HTML.Template.GLOBAL_FUNC[name] = func;
        },
        precompileBySelector:function(selector){
            var selected = compat.cssSelector(selector);
            for (var e in selected) {
                if (!selected.hasOwnProperty(e)) {
                    continue ;
                }

                new HTML.Template({
                    type:'element',
                    source:e
                });
            }
        },
        Core : (function(){
            var module = { exports : {}};
//include<src/html-template-core.js>
            return module.exports;
        })()
    });

    compat.ready(function(){
        HTML.Template.precompileBySelector(HTML.Template.DEFAULT_SELECTOR);
        compat.defer(HTML.Template.precompileBySelector, HTML.Template.DEFERRED_SELECTOR);
    });
})();



