
if (!Prototype) throw ('HTML.Template require prototype.js');
if (! 
    Prototype.Version
    .split('.')
    .zip([1,6,0])
    .all(function(e){return (parseInt(e[0]) >= (e[1]||0)); })
){
    throw(new Error('HTML.Template require prototype 1.6.0 or later'));
}
var HTML = HTML || {};

HTML.Template = Class.create({
    _guessOption:function(option){
        if ( Object.isString(option) ){
            var pos = option.indexOf(':');
            if(pos > 0 && pos < 10 ){
                return {type:'name',source:option}
            }else{
                return {type:'text',source:option}
            }
        }
        else if ( Object.isFunction(option) ){
            return {type:'function',source:option}
        }
        else if ( Object.isElement(option) ){
            return {type:'element',source:option}
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
                    throw(new Error('can not load tmpl.'))
                }
            },
            onException: function() {
                if(this.assignElement){
                    this.assignElement.fire('htmltemplate:invalid_tmpl',this);
                }else{
                    throw(new Error('invalid tmpl.'))
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
            throw(new Error('in case type is function, source must be function object.'))
        }
    },
    _initElement:function( source ){
        var elem = $(source);
        if ( Object.isElement(elem) && !this.isCompiled) {
            var tmpl = $A(elem.childNodes)
                .select(function(m){return (m.nodeType==8)})
                 .map(function(m){return m.data}).join('');
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
        this._funcs  = {};
        this._chunks = [];
        this.isCompiled = false;
        this.isParsed   = false;
        this.option     = this._guessOption(option);
        var initializer = this['_init'+this.option['type'].capitalize()];
        if( initializer ){
            initializer.apply(this,[this.option['source']]);
        }else{
            throw('invalid type');
        }
    },
    _uniqHash: function() {
        return "autocache:" + HTML.Template.hashFunction(this._source);
    },
    registerFunction: function(name, func) {
        this._funcs[name] = func;
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
        }
    },
    render :function(targetNode,option){
        // experimental function
        var tagName = (Object.isElement(targetNode))?targetNode.tagName:
                      (Object.isString(targetNode)) ?targetNode :'div';
        if(document.createDocumentFragment){
            var dfrag   = document.createDocumentFragment();
            Element._getContentFromAnonymousElement(tagName,this.output()).each(function(e){
                dfrag.appendChild(e);
            });
            
            this.toElement = function(){
                var tmp = dfrag.cloneNode(true);
                return tmp;
            }
        }
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
        for (var prop in obj) {
            this._param[prop] = obj[prop];
        }
    },
    parse: function() {
        var source = this._source;
        this.root  = HTML.Template.createElement('root', {
            closeTag: false
        });
        var matcher = (/ESCAPE=|DEFAULT=/.test(source))?HTML.Template.CHUNK_REGEXP_ATTRIBUTE:HTML.Template.CHUNK_REGEXP;
        this._chunks.push(this.root);
 
        while (source.length > 0) {
            var results = matcher(source);
            //最後までマッチしなかった
            if (!results) {
                this._chunks.push(HTML.Template.createElement('text', source));
                source = '';
                break;
            }
            var index = 0;
            if ((index = source.indexOf(results.fullText)) > 0) {
                var text = source.slice(0, index);
                this._chunks.push(HTML.Template.createElement('text', text));
                source = source.slice(index);
            };
            var attr,name,value;
            if ( results.attribute_name ) {
                name  = results.attribute_name.toLowerCase();
                value = results.attribute_value;
                attr  = {};
                attr[name]      = value;
                attr['default'] = results['default'];
                attr['escape']  = results['escape'];
            } else {
                attr = undefined;
            }
            this._chunks.push(HTML.Template.createElement(results.tag_name, {
                'attributes': attr,
                'closeTag'  : results.close,
                'parent'    : this
            }));
            source = source.slice(results.fullText.length);
        };
        this._chunks.push(HTML.Template.createElement('root', {
            closeTag: true
        }));
        this._functionText  = this._chunks.map(function(e){return e.getCode()});
        this.isParsed       = true;
        return this;
    },
    compile: function() {
        if (!this.isCompiled) {
            var uniq = this.storedName || this._uniqHash();
            if (HTML.Template.Cache[uniq]) {
                this._output = HTML.Template.Cache[uniq];
            } else {
                this.parse();
                var functionBody = this._chunks.map(function(e) {
                    return e.getCode();
                }).join('');
                try{
                    this._output = Function(functionBody);
                }catch(e){
                    throw( new Error("HTML_TEMPLATE_ERROR:"+uniq+" can't compile.") );
                }
                HTML.Template.Cache[uniq] = this._output;
            }
            this.isCompiled = true;
        }
    },
    checkCompiled:function(){
        if(this.isCompiled)return true;
        if(this.type == 'name' && this.storedName){
            if (HTML.Template.Cache[this.storedName]) {
                this._output = HTML.Template.Cache[this.storedName];
                this.isCompiled = true;
                return true;
            }
        }
        return false;
    },
    query : function(type,arg) {
        
    },
    output: function() {
        if (this.checkCompiled()) {
            return this._output();
        }
    },
    toString:function(){
        return this.output() || '__UNCOMPILED__';
    },
    toHTML: function(){
        return this.output();
    }
});

HTML.Template.createMatcher = function(escapeChar,expArray){
    function _escape( regText){
        return (regText + '').replace(new RegExp(escapeChar,'g'), "\\");
    }
    var regValues = $A(expArray).inject({mapping:['fullText'],text:[]},function(val,e,i){
        if(Object.isString(e)){
            val.text.push(e);
        }else{
            val.mapping.push(e.map);
        }
        return val;
    });
    var reg = undefined;
    regValues.text = _escape(regValues.text.join(''));
    return function(matchingText){
        if(!reg){
            reg = new RegExp(regValues.text);
        }
        var results = (matchingText || '').match(reg);
        if(results){
            return  regValues.mapping.inject({},function(ret,v,i){
                if(!ret[v])ret[v] = results[i];
                return ret;
            });
        }else{
            return undefined;
        }
    }

};

Object.extend(HTML.Template,{
    VERSION           : '0.5',
    DEFAULT_SELECTOR  : '.HTML_TEMPLATE',
    DEFERRED_SELECTOR : '.HTML_TEMPLATE_DEFERRED',
    CHUNK_REGEXP:HTML.Template.createMatcher('%',[
        "<",
        "(%/)?",{map:'close'},
        "TMPL_",
        "(VAR|LOOP|IF|ELSE|ELSIF|UNLESS|INCLUDE)",{map:'tag_name'},
        "%s*",
        /*
            NAME or EXPR
        */
        "(?:",
            "(NAME|EXPR)=",{map:'attribute_name'},
            "(?:",
                "'([^'>]*)'|",{map:'attribute_value'},
                '"([^">]*)"|',{map:'attribute_value'},
                "([^%s=>]*)" ,{map:'attribute_value'},
            ")", 
        ")?",
        "%s*",
        ">"
    ]),
    CHUNK_REGEXP_ATTRIBUTE:HTML.Template.createMatcher('%',[
        "<",
        "(%/)?",{map:'close'},
        "TMPL_",
        "(VAR|LOOP|IF|ELSE|ELSIF|UNLESS|INCLUDE)",{map:'tag_name'},
        "%s*",

        "(?:",
            "(?:DEFAULT)=",
            "(?:",
                "'([^'>]*)'|",{map:'default'},
                '"([^">]*)"|',{map:'default'},
                "([^%s=>]*)" ,{map:'default'},
            ")", 
        ")?",
        "%s*",
        "(?:",
            "(?:ESCAPE)=",
            "(?:",
                "(JS|URL|HTML)",{map:'escape'},
            ")", 
        ")?",
        "%s*",
        "(?:",
            "(?:DEFAULT)=",
            "(?:",
                "'([^'>]*)'|",{map:'default'},
                '"([^">]*)"|',{map:'default'},
                "([^%s=>]*)" ,{map:'default'},
            ")",
        ")?",
        "%s*",
        /*
            NAME or EXPR
        */
        "(?:",
            "(NAME|EXPR)=",{map:'attribute_name'},
            "(?:",
                "'([^'>]*)'|",{map:'attribute_value'},
                '"([^">]*)"|',{map:'attribute_value'},
                "([^%s=>]*)" ,{map:'attribute_value'},
            ")", 
        ")?",
        /*
            DEFAULT or ESCAPE
        */
        '%s*',
        "(?:",
            "(?:DEFAULT)=",
            "(?:",
                "'([^'>]*)'|",{map:'default'},
                '"([^">]*)"|',{map:'default'},
                "([^%s=>]*)" ,{map:'default'},
            ")", 
        ")?",
        "%s*",
        "(?:",
            "(?:ESCAPE)=",
            "(?:",
                "(JS|URL|HTML)",{map:'escape'},
            ")", 
        ")?",
        "%s*",
        "(?:",
            "(?:DEFAULT)=",
            "(?:",
                "'([^'>]*)'|",{map:'default'},
                '"([^">]*)"|',{map:'default'},
                "([^%s=>]*)" ,{map:'default'},
            ")",
        ")?",
        "%s*",
        ">"
    ]),
    GLOBAL_FUNC     :{
        __escapeHTML:function(str){
            return str.escapeHTML();
        },
        __escapeJS:function(str){
            return Object.toJSON(str);
        },
        __escapeURL:function(str){
            return encodeURI(str);
        }
    },
    Cache           :{},
    useLoopVariable :true  ,// Loop中の__index__などを使用する/しない
    usePrerender    :true  ,// DocumentFragmentとしてDOMオブジェクトを事前作成しておく
    ElementCache    :{},
    watchCache:function() {
        var ret = [];
        ret.push('HTML.Template.Cache={');
        for (var prop in HTML.Template.Cache) {
            var value = HTML.Template.Cache[prop];
            if (Object.isFunction(value)) ret.push("'" + prop + "':" + value.toString() + ',');
        }
        ret.push('_fin_:undefined');
        ret.push('};');
        document.body.innerHTML = "<textarea style='width:100%;height:900px'>" + ret.join('') + "</textarea>";
        return ret.join('');
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

    createElement : function(type, option) {
        return new HTML.Template[type.toUpperCase() + 'Element'](option);
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
    }
});


HTML.Template.Element = Class.create({
    initialize: function(option) {
        if (this.type == 'text') {
            this.value = option;
        } else {
            Object.extend(this,option);
        }
    },
    isParent : Prototype.emptyFunction,
    execute  : Prototype.emptyFunction,
    isClose  : function() {
        return this['closeTag'] ? true: false;
    },
    appendChild : function(child) {
        if (!this.children) this.children = [];
        this.children.push(child);
    },
    inspect: function() {
        return Object.toJSON(this);
    },
    getCode: function(e) {
        return "void(0);";
    },
    toString: function() {
        return [
            '<' ,
            ((this.isClose()) ? '/': '') ,
            this.type ,
            ((this.hasName) ? ' NAME=': '') ,
            ((this.name) ? this.name: '') ,
            '>'
        ].join('');
    },
    // HTML::Template::Pro shigeki morimoto's extension
    _pathLike: function(attribute , matched){
        var pos = (matched == '/')?'0':'_CONTEXT.length -'+(matched.split('..').length-1);
        return  [
            "((_CONTEXT["+pos+"]['"        , 
            attribute ,
            "']) ? _CONTEXT["+pos+"]['"    ,
            attribute , 
            "'] : undefined )"
        ].join('');

    },
    getParam: function() {
        var ret = "";
        if (this.attributes['name']) {
            var matched = this.attributes['name'].match(/^(\/|(?:\.\.\/)+)(\w+)/);
            if(matched){
                return this._pathLike(matched[2],matched[1]);
            }
            ret =  [
                "((_TOP_LEVEL['"            , 
                    this.attributes['name'] ,
                "']) ? _TOP_LEVEL['"        ,
                    this.attributes['name'] , 
                "'] : ",
                    Object.toJSON(this.attributes['default'])  || 'undefined',
                " )"
            ].join('');
        }
        if (this.attributes['expr']) {
            var operators = {
                'gt' :'>',
                'lt' :'<',
                'eq' :'==',
                'ne' :'!=',
                'ge' :'>=',
                'le' :'<='
            };
            var replaced = this.attributes['expr'].replace(/{(\/|(?:\.\.\/)+)(\w+)}/g,function(full,matched,param){
                return [
                     '_CONTEXT[',
                     (matched == '/')?'0':'_CONTEXT.length -'+(matched.split('..').length-1),
                     ']["',param,'"]'
                ].join('');
            }).replace(/\s+(gt|lt|eq|ne|ge|le|cmp)\s+/g,function(full,match){
                return " "+operators[match]+" ";
            });
            ret = [
                "(function(){",
                "    with(_GLOBAL_FUNCTION){",
                "        with(this._funcs){",
                "            with(_TOP_LEVEL){",
                "                return (", replaced ,');',
                "}}}}).apply(this)"
            ].join('');
        }
        if(this.attributes['escape']){
            ret = [
                '_GLOBAL_FUNCTION.__escape'+this.attributes['escape']+'(',
                ret,
                ')'
            ].join('');
        }
        return ret;
    }
});

Object.extend(HTML.Template, {
    ROOTElement: Class.create(HTML.Template.Element, {
        type: 'root',
        getCode: function() {
            if (this.isClose()) {
                return 'return _RETURN_VALUE.join("");'
            } else {
                return [
                    'var _RETURN_VALUE    = [];',
                    'var _CONTEXT         = [this._param];',
                    'var _GLOBAL_FUNCTION = HTML.Template.GLOBAL_FUNC;',
                    'var _TOP_LEVEL       = this._param;',
                ].join('');
            }
        }
    }),

    LOOPElement: Class.create(HTML.Template.Element, {
        type: 'loop',
        getCode: function() {
            if (this.isClose()) {
                return ['}.bind(this));','_CONTEXT.pop();'].join('');
            } else {
                return [
                'var _LOOP_LIST =$A(' + this.getParam() + ')|| $A([]);', 
                'var _LOOP_LENGTH = _LOOP_LIST.length;',
                '_CONTEXT.push(_TOP_LEVEL);',
                '_LOOP_LIST.each(function(_TOP_LEVEL,i){',
                '   _TOP_LEVEL = (typeof _TOP_LEVEL == "object")?_TOP_LEVEL: {};',
                (HTML.Template.useLoopVariable)? [
                    "_TOP_LEVEL['__first__'] = (i == 0) ? true: false;",
                    "_TOP_LEVEL['__index__'] = i;",
                    "_TOP_LEVEL['__odd__']   = (i % 2) ? true: false;",
                    "_TOP_LEVEL['__last__']  = (i == (_LOOP_LENGTH - 1)) ? true: false;",
                    "_TOP_LEVEL['__inner__'] = (_TOP_LEVEL['__first__']||_TOP_LEVEL['__last__'])?false:true;"
                ].join(''):'',
                ].join('');
            }
        }
    }),

    VARElement: Class.create(HTML.Template.Element, {
        type: 'var',
        getCode: function() {
            if (this.isClose()) {
                throw(new Error('HTML.Template ParseError'));
            } else {
                return '_RETURN_VALUE.push(' + this.getParam() + ');';
            }
        }
    }),

    IFElement: Class.create(HTML.Template.Element, {
        type: 'if',
        getCondition: function(param) {
            return "!!" + this.getParam(param);
        },
        getCode: function() {
            if (this.isClose()) {
                return '}'
            } else {
                return 'if(' + this.getCondition() + '){';
            }
        }
    }),

    ELSEElement: Class.create(HTML.Template.Element, {
        type: 'else',
        getCode: function() {
            if (this.isClose()) {
                throw(new Error('HTML.Template ParseError'));
            } else {
                return '}else{';
            }
        }
    }),

    INCLUDEElement: Class.create(HTML.Template.Element, {
        type: 'include',
        getCode: function() {
            if (this.isClose()) {
                throw(new Error('HTML.Template ParseError'));
            } else {
                var name = '"'+(this.attributes['name'])+'"';
                return [
                    'if(HTML.Template.Cache['+name+']){',
                    '   var _tmpl = new HTML.Template('+name+');',
                    '   _tmpl.registerFunction(this._funcs );',
                    '   _tmpl.param(_TOP_LEVEL);',
                    '   _RETURN_VALUE.push(_tmpl.output());',
                    '}'
                ].join('\n');
            }
        }
    }),

    TEXTElement: Class.create(HTML.Template.Element, {
        type: 'text',
        closeTag: false,
        getCode: function() {
            if (this.isClose()) {
                throw(new Error('HTML.Template ParseError'));
            } else {
                if(!HTML.Template.TEXTElement._stringList){HTML.Template.TEXTElement._stringList=[];}
                HTML.Template.TEXTElement._stringList.push(this.value);
                return '_RETURN_VALUE.push(HTML.Template.TEXTElement._stringList['+(HTML.Template.TEXTElement._stringList.length-1)+']);';
            }
        }
    })
});

HTML.Template.ELSIFElement = Class.create(HTML.Template.IFElement, {
    type: 'elsif',
    getCode: function() {
        if (this.isClose()) {
            throw(new Error('HTML.Template ParseError'));
        } else {
            return '}else if(' + this.getCondition() + '){';
        }
    }
});

HTML.Template.UNLESSElement = Class.create(HTML.Template.IFElement, {
    type: 'unless',
    getCondition: function(param) {
        return "!" + this.getParam(param);
    }
});

if(HTML.Template.usePrerender){
    Object.extend(Object,{
        isDocumentFragment:function(object){
            return !!(object && object.nodeType == 11);
        },
        isElement:function(object){
            return !!(object && ( object.nodeType == 1 || object.nodeType == 11));
        }
    });
}

document.observe('dom:loaded',function(){
    HTML.Template.precompileBySelector(HTML.Template.DEFAULT_SELECTOR);
    HTML.Template.precompileBySelector.defer(HTML.Template.DEFERED_SELECTOR);
});


