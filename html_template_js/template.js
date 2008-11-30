
if (!Prototype) throw ('HTML.Template require prototype.js');
if (parseInt(Prototype.Version) > 1.6) throw ('HTML.Template require prototype.js v1.6 or later');

var HTML = {};

HTML.Template = Class.create({
    initialize: function(option) {
        if ( Object.isString(option) ){
            option = {type:'name',source:option}
        }
        else if ( Object.isFunction(option) ){
            option = {type:'function',source:option}
        }
        else if ( Object.isElement(option) ){
            option = {type:'element',source:option}
        }
        
        if (! (option['type'] && option['source'])) {
            throw ('option needs {type:~~,source:~~}');
        }
        
        this._param = {};
        this._funcs = {};
        this._chunks = [];
        this.isCompiled = false;
        this.type = option['type'];
        if (option['type'] == 'text') {
            this._source = option['source'];
            this.compile();
        }
        else if (option['type'] == 'url') {
            this._source = 'contentUnload';
            if(option['element'] && Object.isElement(option['element'])){
                this.assignElement = option['element'];
            }
            this.storedName = "url:"+option['source'];
            new Ajax.Request(option['source'], {
                method: 'get',
                onSuccess: function(req) {
                    this._source=req.responseText;
                    this.compile();
                    this.isCompiled = true;
                    if(this.assignElement){
                        this.assignElement.fire('htmltemplate:compiled',this);
                    }
                }.bind(this),
                onError: function() {
                    throw('cant get');
                }
            });
        }
        else if (option['type'] == 'function') {
            if (Object.isFunction(option['source'])) {
                this._output = option['source'];
                this.isCompiled = true;
            }
        }
        else if (option['type'] == 'element') {
            var elem = $(option['source']);
            if ( Object.isElement(elem) ) {
                var tmpl=$A(elem.childNodes).select(function(m){return (m.nodeType==8)}).map(function(m){return m.data}).join('');
                this.storedName = 'dom:'+elem.identify()
                this._source = tmpl;
                this.compile();
                this.isCompiled = true;
            }
        }
        else if (option['type'] == 'name') {
            this.source = '';
            this.storedName = option['source'];
            if (HTML.Template.Cache[this.storedName]) {
                this._output = HTML.Template.Cache[this.storedName];
                this.isCompiled = true;
            }
        }
        else if (option['type'] == 'load') {
            if(!option['name']) throw('need name');
            this._source    = option['source'];
            this.storedName = option['name'];
            this.compile();
            this.isCompile = true;
        }
        else {
            throw('invalid type');
        }
    },
    _uniqHash: function() {
        var source = this._source;
        var max = (1 << 30);
        var length = source.length;
        var ret = 34351;
        for (var i = 0; i < length; i++) {
            ret *= 37;
            ret += source.charCodeAt(i);
            ret %= max;
        }
        return "autocache:" + ret.toString();
    },
    registerFunction: function(name_or_obj, func) {
        if(Object.isString(name_or_obj) && Object.isFunction(func)){
            var name = name_or_obj;
            this._funcs[name] = func;
        }else{
            var obj = name_or_obj;
            for (var prop in obj) {
                this._funcs[prop] = obj[prop];
            }
        }
    },
    getFunctions:function(){
        return this._funcs;
    },
    functionize: function() {
        var _func = this._output;
        return function(param, functions) {
            var _tmp = new HTML.Template({
                type: 'function',
                source: _func
            });
            if( param )     _tmp.param(param);
            if( functions ) _tmp.registerFunction(functions);
            return _tmp.output();
        }
    },
    clearParam:function(){
        this._param = {};
    },
    clearFunctions:function(){
        this._funcs = {};
    },
    param: function(obj) {
        if (Object.isArray(obj)) {
            throw ('template.param not array');
        }

        for (var prop in obj) {
            this._param[prop] = (Object.isFunction(obj[prop]))?undefined:obj[prop];
        }
    },
    parse: function() {
        var source   = this._source;
        var createElement = HTML.Template.createElement;
        var chunk_regexp  = HTML.Template.CHUNK_REGEXP;
        this.root = createElement('root', {
            closeTag: false
        });
        this._chunks.push(this.root);
        while (source.length > 0) {
            var results = source.match(chunk_regexp);
            if (!results) {
                this._chunks.push(createElement('text', source));
                source = '';
                break;
            }
            var index = 0;
            if ((index = source.indexOf(results[0])) > 0) {
                var text = source.slice(0, index);
                this._chunks.push(createElement('text', text));
                source = source.slice(index);
            };
            var attrs;
            if (results[3]) {
                var name = results[3].toLowerCase();
                var value = [results[4], results[5], results[6]].join('');
                attr = {};
                attr[name] = value;
            } else {
                attr = undefined;
            }
            this._chunks.push(createElement(results[2], {
                'attributes': attr,
                'closeTag': results[1],
                'parent': this
            }));
            source = source.slice(results[0].length);
        };
        this._chunks.push(createElement('root', {
            closeTag: true
        }));
        return this;
    },
    getCode:function(e){return e.getCode();},
    compile: function() {
        if (!this.isCompiled) {
            var uniq = this.storedName || this._uniqHash();
            if (HTML.Template.Cache[uniq]) {
                this._output = HTML.Template.Cache[uniq];
            } else {
                this.parse();
                var functionBody = this._chunks.map(this.getCode).join('');
                try{
                	function nativeCompile(){
                		return Function(functionBody);
                	}
                	this._output = nativeCompile();
                }catch(e){
                	alert("HTML_TEMPLATE_ERROR:"+uniq+" can't compile.");
                	
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
    output: function() {
        if ( this.checkCompiled() && this._output ) {
        	//try{
            	return this._output();
            //}catch(e){
            //	return '';
            //}
        }
    }
});


Object.extend(HTML.Template,{
    VERSION:'0.4',
    DEFAULT_SELECTOR:'.HTML_TEMPLATE',
    CHUNK_REGEXP:(function(escapeChar,expArray){
        function _escape( regText){
            return (regText + '').replace(new RegExp(escapeChar,'g'), "\\");
        }
        var regText = $A(expArray).map(function(e){
            return _escape(e);
        }).join('');
        return new RegExp(regText);
    })('%',[
        "<",                // start
        "(%/)?",            // is CloseTag?
        "TMPL_",            // TMPL_ prefix
        "(VAR|LOOP|IF|ELSE|ELSIF|UNLESS|INCLUDE)",
        "%s*",                //
        "(?:",              // Attributes
            "(NAME|EXPR)=", //
            "(?:",            //
                "'([^'>]*)'|",//
                '"([^">]*)"|',//
                "([^%s=>]*)",//
            ")",//
        ")?",//
        ">"//
    ]),
    GLOBAL_FUNC : {},
    Cache :{},
    watchCache:function() {
        var ret = [];
        ret.push('HTML.Template.Cache={');
        for (var prop in HTML.Template.Cache) {
            var value = HTML.Template.Cache[prop];
            if (Object.isFunction(value)) ret.push("'" + prop + "':" + value.toString().replace(/(\n|^\s+)/mg, '') + ',');
        }
        ret.push('_fin_:undefined');
        ret.push('};');
        document.body.innerHTML = "<textarea style='width:100%;height:900px'>" + ret.join('') + "</textarea>";
        return ret.join('');
    },
    registerFunction : function(name, func) {
        HTML.Template.GLOBAL_FUNC[name] = func;
    },
    precompileBySelector:function(selector){
        $$(selector).each(function(e){
            var tmpl=$A(e.childNodes).select(function(m){return (m.nodeType==8)}).map(function(m){return m.data}).join('');
            HTML.Template.load('dom:'+e.identify(),tmpl);
        });
    }
});



HTML.Template.Element = Class.create();
HTML.Template.Element.prototype = {
    initialize: function(option) {
        if (this.type == 'text') {
            this.value = option;
        } else {
            $H(option).each(function(e) {
                this[e[0]] = e[1];
            }.bind(this));
        }
    },
    isParent: Prototype.emptyFunction,
    execute: Prototype.emptyFunction,
    isClose: function() {
        return this['closeTag'] ? true: false;
    },
    appendChild: function(child) {
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
        return '<' + ((this.isClose()) ? '/': '') + this.type + ((this.hasName) ? ' NAME=': '') + ((this.name) ? this.name: '') + '>';
    },
    getParam: function() {
        if (this.attributes['name']) {
            return "((_TOP_LEVEL['" + this.attributes['name'] + "']) ? _TOP_LEVEL['" + this.attributes['name'] + "'] : '')";
        }
        if (this.attributes['expr']) {
            return "(function(){with(_GLOBAL_FUNCTION){with(this._funcs){with(_TOP_LEVEL){return " + this.attributes['expr'] + "}}}}).apply(this)";
        }
    }
};

Object.extend(HTML.Template, {
  ROOTElement: Class.create(HTML.Template.Element, {
    type: 'root',
    getCode: function() {
      if (this.isClose()) {
        return 'return _RETURN_VALUE.join("");'
      } else {
        return ['var _RETURN_VALUE=[];', 'var _GLOBAL_PARAM=this._param;', 'var _GLOBAL_FUNCTION=HTML.Template.GLOBAL_FUNC;', 'var _TOP_LEVEL=this._param;'].join('');
      }
    }
  }),
  LOOPElement: Class.create(HTML.Template.Element, {
    type: 'loop',
    getCode: function() {
      if (this.isClose()) {
        return '}.bind(this));'
      } else {
        return ['var _LOOP_LIST =$A(' + this.getParam() + ')|| $A([]);', 'var _LOOP_LENGTH=_LOOP_LIST.length;',
        '_LOOP_LIST.each(function(_TOP_LEVEL,i){',
        '_TOP_LEVEL = (typeof _TOP_LEVEL == "object")?_TOP_LEVEL: {};',
        "_TOP_LEVEL['__first__'] = (i == 0) ? true: false;",
        "_TOP_LEVEL['__index__'] = i;", "_TOP_LEVEL['__odd__']   = (i % 2) ? true: false;", "_TOP_LEVEL['__last__']  = (i == (_LOOP_LENGTH - 1)) ? true: false;", "_TOP_LEVEL['__inner__'] = (_TOP_LEVEL['__first__']||_TOP_LEVEL['__last__'])?false:true;"].join('');
      }
    }
  }),
  VARElement: Class.create(HTML.Template.Element, {
    type: 'var',
    getCode: function() {
      if (this.isClose()) {
        //error
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
        //error
      } else {
        return '}else{';
      }
    }
  }),
  INCLUDEElement: Class.create(HTML.Template.Element, {
    type: 'include',
    getCode: function() {
      if (this.isClose()) {
        //error
      } else {
        //return '}else{';
        var name = '"'+(this.attributes['name'])+'"';
        return ['if(HTML.Template.Cache['+name+']){',
                'var _tmpl=new HTML.Template('+name+');',
                '_tmpl.registerFunction(this.getFunctions() );',
                '_tmpl.param(_TOP_LEVEL);',
                '_RETURN_VALUE.push(_tmpl.output());',
                //'alert(_tmpl.checkCompiled());',
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
        //error
      } else {
        return '_RETURN_VALUE.push(' + Object.toJSON(this.value) + ');';
      }
    }
  })
});

HTML.Template.ELSIFElement = Class.create(HTML.Template.IFElement, {
  type: 'elsif',
  getCode: function() {
    if (this.isClose()) {
      //error
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
HTML.Template.createElement = (function(){
	var _cache = {
		root    :HTML.Template.ROOTElement,
		text    :HTML.Template.TEXTElement,
		LOOP    :HTML.Template.LOOPElement,
		VAR     :HTML.Template.VARElement,
		INCLUDE :HTML.Template.INCLUDEElement,
		IF      :HTML.Template.IFElement,
		ELSE    :HTML.Template.ELSEElement,
		ELSIF   :HTML.Template.ELSIFElement,
		UNLESS  :HTML.Template.UNLESSElement
	};
    return function create(type, option) {
        return new _cache[type](option);
    }
})();

HTML.Template.load =function(name,value){
    new HTML.Template({
        type:'load',
        source:value,
        name:name
    });
};


document.observe('dom:loaded',function(){
    HTML.Template.precompileBySelector(HTML.Template.DEFAULT_SELECTOR);
});


