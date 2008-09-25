if (!Prototype) throw ('HTML.Template require prototype.js');
if (parseInt(Prototype.Version) > 1.6) throw ('HTML.Template require prototype.js');

var HTML = {};
HTML.Template = Class.create();
HTML.Template.Version = '0.2';
HTML.Template.CHUNK_REGEXP = new RegExp('<(\\/)?TMPL_(VAR|LOOP|IF|ELSE|ELSIF|UNLESS)(\\s(NAME)=?(\\w+)|\\s(EXPR)="([^"]+)")?>');
HTML.Template.GLOBAL_FUNC = {};

HTML.Template.createElement = function(type, option) {
  return new HTML.Template[type.toUpperCase() + 'Element'](option);
};

HTML.Template.registerFunction = function(name, func) {
  HTML.Template.GLOBAL_FUNC[name] = func;
};
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
    return this.closeTag;
  },
  appendChild: function(child) {
    if (!this.children) this.children = [];
    this.children.push(child);
  },
  inspect: function() {
    return Object.toJSON(this);
  },
  getCode: function(e){
  	return "void(0);";
  },
  toString: function() {
    return '<' + ((this.closeTag) ? '/': '') + this.type + ((this.hasName) ? ' NAME=': '') + ((this.name) ? this.name: '') + '>';
  },
  getParam: function() {
    if (this.hasName) {
      return "((_TOP_LEVEL['"+this.name+"']) ? _TOP_LEVEL['"+this.name+"'] : '')";
    }
    if (this.hasExpr) {
      return "(function(){with(_GLOBAL_FUNCTION){with(this._funcs){with(_TOP_LEVEL){return "+this.expr+"}}}}).apply(this)";
    }

  }
};

Object.extend(HTML.Template, {
  ROOTElement: Class.create(HTML.Template.Element, {
    type: 'root',
    getCode:function(){
    	if(this.isClose()){
    		return 'return _RETURN_VALUE.join("");'
    	}else{
    		return [
    			'var _RETURN_VALUE=[];',
    			'var _GLOBAL_PARAM=this._param;',
    			'var _GLOBAL_FUNCTION=HTML.Template.GLOBAL_FUNC;',
    			'var _TOP_LEVEL=this._param;'
    		].join('');
    	}
    }
  }),
  LOOPElement: Class.create(HTML.Template.Element, {
    type: 'loop',
    execute: function(param) {
      var blank = '';
      var target = this.getParam(param);
      if (Object.isArray(target)) {
        var targetLength = target.length;
        return target.map(function(t, i) {
          t['__first__'] = (i == 0) ? true: false;
          t['__index__'] = i;
          t['__odd__']   = (i % 2) ? true: false;
          t['__last__']  = (i == (length - 1)) ? true: false;
          t['__inner__'] = (t['__first__']||t['__last__'])?false:true;
          return this.children.map(function(e) {
            return e.execute(t)
          }).join(blank);
        }.bind(this)).join(blank);
      }
      return blank;
    },
    getCode:function(){
    	if(this.isClose()){
    		return '}.bind(this));'
    	}else{
    		return [
    			'var _LOOP_LIST =$A('+this.getParam()+');',
    			'var _LOOP_LENGTH=_LOOP_LIST.length;',
    			'_LOOP_LIST.each(function(_TOP_LEVEL,i){',
            	"_TOP_LEVEL['__first__'] = (i == 0) ? true: false;",
          		"_TOP_LEVEL['__index__'] = i;",
          		"_TOP_LEVEL['__odd__']   = (i % 2) ? true: false;",
          		"_TOP_LEVEL['__last__']  = (i == (_LOOP_LENGTH - 1)) ? true: false;",
          		"_TOP_LEVEL['__inner__'] = (_TOP_LEVEL['__first__']||_TOP_LEVEL['__last__'])?false:true;"
    		].join('');
    	}
    }
  }),
  VARElement: Class.create(HTML.Template.Element, {
    type: 'var',
    getCode:function(){
    	if(this.isClose()){
    		//error
    	}else{
    		return '_RETURN_VALUE.push('+this.getParam()+');';
    	}
    }
  }),
  IFElement: Class.create(HTML.Template.Element, {
    type: 'if',
    getCondition: function(param) {
      return "!!"+this.getParam(param);
    },
    getCode:function(){
    	if(this.isClose()){
    		return '}'
    	}else{
    		return 'if('+this.getCondition()+'){';
    	}
    }
  }),
  ELSEElement: Class.create(HTML.Template.Element, {
    type: 'else',
    getCode:function(){
    	if(this.isClose()){
    		//error
    	}else{
    		return '}else{';
    	}
    },
  }),
  TEXTElement: Class.create(HTML.Template.Element, {
    type: 'text',
    closeTag: false,
    getCode:function(){
    	if(this.isClose()){
    		//error
    	}else{
    		return '_RETURN_VALUE.push('+Object.toJSON(this.value)+');';
    	}
    }
  })
});
HTML.Template.ELSIFElement = Class.create(HTML.Template.IFElement, {
  type: 'elsif',
  getCode:function(){
    	if(this.isClose()){
			//error
    	}else{
    		return '}else if('+this.getCondition()+'){';
    	}
  },
});
HTML.Template.UNLESSElement = Class.create(HTML.Template.IFElement, {
  type: 'unless',
  getCondition: function(param) {
      return "!"+this.getParam(param);
  }
});
HTML.Template.prototype = {
  initialize: function(option) {
    if (! (option['type'] && option['source'])) {
      throw ('option needs {type:~~,source:~~}');
    }
    if (option['type'] == 'text') {
      this._source = option['source'];
    }
    this._param = {};
    this._funcs = {};
    this._chunks = [];
    this.parse().compile();
  },
  registerFunction: function(name, func) {
    this._funcs[name] = func;
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
    this.root = HTML.Template.createElement('root', {
      closeTag: false
    });
    this._chunks.push(this.root);
    while (source.length > 0) {
      var results = source.match(HTML.Template.CHUNK_REGEXP);
      if (!results) {
        this._chunks.push(HTML.Template.createElement('text', source));
        source = '';
        break;
      }
      var index = 0;
      if ((index = source.indexOf(results[0])) > 0) {
        var text = source.slice(0, index);
        this._chunks.push(HTML.Template.createElement('text', text));
        source = source.slice(index);
      };
      this._chunks.push(HTML.Template.createElement(results[2], {
        hasName: (results[4]) ? true: false,
        name: results[5],
        closeTag: (results[1]) ? true: false,
        hasExpr: (results[6]) ? true: false,
        expr: results[7],
        parent: this
      }));
      source = source.slice(results[0].length);
    };
    this._chunks.push(HTML.Template.createElement('root', {
      closeTag: true
    }));
    return this;
  },
  compile: function() {
  	this.output=Function(this._chunks.map(function(e){return e.getCode()}).join('\n'));
  },
  output: function() {
    
  }
};