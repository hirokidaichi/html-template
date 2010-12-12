
var HTML = HTML || {};

HTML.Template = Class.create({
    _guessOption:function(option){
        if ( Object.isString(option) ){
            var pos = option.indexOf(':');
            if(pos > 0 && pos < 10 ){
                return {type:'name',source:option};
            }else{
                return {type:'text',source:option};
            }
        }
        else if ( Object.isFunction(option) ){
            return {type:'function',source:option};
        }
        else if ( Object.isElement(option) ){
            return {type:'element',source:option};
        }
        if (! (option['type'] && option['source'])) {
            throw ('option needs {type:~~,source:~~}');
        }
        return option;
    },
    _initUrl:function(source){
        this._source = 'contentUnload';
        if(this.option['element'] && (Object.isElement(this.option['element']) || this.option['element'] === document )){
            this.assignElement = this.option['element'];
        }
        this.storedName = "url:"+source;
        if(this.isCompiled && this.assignElement ){
            var _self = this;
            (function(){
                _self.assignElement.fire('htmltemplate:compiled',_self);
            }).defer();
            return ;
        }
        new Ajax.Request(source, {
            method: 'get',
            onSuccess  : function(req) {
                this._source = req.responseText;
                this.compile();
                this.isCompiled = true;
                if(this.assignElement){
                    this.assignElement.fire('htmltemplate:compiled',this);
                }
            }.bind(this),
            onFailure  : function(){
                if(this.assignElement){
                    this.assignElement.fire('htmltemplate:failure',this);
                }else{
                    throw(new Error('can not load tmpl.'));
                }
            },
            onException: function() {
                if(this.assignElement){
                    this.assignElement.fire('htmltemplate:invalid_tmpl',this);
                }else{
                    throw(new Error('invalid tmpl.'));
                }
            }
        });
    },
    _initText:function( source ){
        this._source = Object.isString(source)?
                       source:
                           (source.toString)?
                               source.toString():
                                    '';

        this.compile();
    },
    _initFunction:function( source ){
        if (Object.isFunction(source)) {
            this._output = source;
            this.isCompiled = true;
        }else{
            throw(new Error('in case type is function, source must be function object.'));
        }
    },
    _initElement:function( source ){
        var elem = $(source);
        if ( Object.isElement(elem) && !this.isCompiled) {
            var tmpl = $A(elem.childNodes)
                .select(function(m){return (m.nodeType==8);})
                .map(function(m){return m.data;}).join('');
            this.storedName = 'dom:'+elem.identify();
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
            url:function(){
                var url = segment[1];
                _self.option['element'] = document;
                _self._initUrl(url);
            },
            autocache:function(){
                throw(new Error(' not in cache '));
            }
        })[segment[0]]();
    },
    initialize: function(option) {
        this._param  = {};
        this._funcs  = Object.extend({},HTML.Template.GLOBAL_FUNC);
        this.isCompiled = false;
        this.option     = this._guessOption(option);
        var initializer = this['_init'+this.option['type'].capitalize()];
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
        return ( Object.isFunction(this.option.filter)?
            this.option.filter:
            Prototype.K
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
        if (Object.isArray(obj)) {
            throw ('template.param not array');
        }
        if (Object.isUndefined(obj)){
            return $H(this._param).keys();
        }
        if (Object.isString(obj)){
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
        try{
            var functionBody = HTML.Template.Core.getFunctionText( this._source );
            this._output =  HTML.Template.Core.compileFunctionText( functionBody );
        }catch(e){
            throw( new Error("HTML_TEMPLATE_ERROR:"+uniq+" can't compile.") );
        }
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


Object.extend(HTML.Template,{
    VERSION           : '0.8',
    DEFAULT_SELECTOR  : '.HTML_TEMPLATE',
    DEFERRED_SELECTOR : '.HTML_TEMPLATE_DEFERRED',
    GLOBAL_FUNC     :{
        __escapeHTML:function(str){
            return str.toString().escapeHTML();
        },
        __escapeJS:function(str){
            return Object.toJSON(str);
        },
        __escapeURL:function(str){
            return encodeURI(str);
        },
        __escapeNONE:function(str){
            return str;
        },
        __include : function(name,param,func){
            console.log(arguments);
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
        $$(selector).each(function(e){
            new HTML.Template({
                type:'element',
                source:e
            });
        });
    },
    Core : (function(){
        var module = { exports : {}};
//include<src/html-template-core.js>
        return module.exports;
    })()
});

if(Object.isFunction(document.observe))document.observe('dom:loaded',function(){
    HTML.Template.precompileBySelector(HTML.Template.DEFAULT_SELECTOR);
    HTML.Template.precompileBySelector.defer(HTML.Template.DEFERRED_SELECTOR);
});




