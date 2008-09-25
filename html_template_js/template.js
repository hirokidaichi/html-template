if (!Prototype) throw ('HTML.Template require prototype.js');
if (parseInt(Prototype.Version) > 1.6) throw ('HTML.Template require prototype.js');

var HTML = {};
HTML.Template = Class.create();
HTML.Template.Version = '0.2';
HTML.Template.CHUNK_REGEXP = new RegExp('<(\\/)?TMPL_(VAR|LOOP|IF|ELSE|ELSIF|UNLESS)(\\s(NAME)=?(\\w+)|\\s(EXPR)="([^"]+)")?>');
HTML.Template.TRUE_FUNC = function() {
  return true;
}
HTML.Template.FALSE_FUNC = function() {
  return false;
}
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
      if (this.hasExpr) {
        var func = new Function('param', ['with(HTML.Template.GLOBAL_FUNC){with(this.parent._funcs){with(param){', 'var retValue =' + this.expr + ';', 'if(Object.isUndefined(retValue))return false;', 'return retValue;', '}}}'].join(''));
        this.exprFunc = func;
      }
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
  toString: function() {
    return '<' + ((this.closeTag) ? '/': '') + this.type + ((this.hasName) ? ' NAME=': '') + ((this.name) ? this.name: '') + '>';
  },
  getParam: function(param) {
    if (this.hasName) {
      return (param[this.name]) ? param[this.name] : '';
    }
    if (this.hasExpr) {
      return this.exprFunc(param);
    }
  }
};

Object.extend(HTML.Template, {
  ROOTElement: Class.create(HTML.Template.Element, {
    type: 'root',
    isParent: HTML.Template.TRUE_FUNC,
    execute: function(param) {
      return this.children.map(function(e) {
        return e.execute(param)
      }).join('');
    }
  }),
  LOOPElement: Class.create(HTML.Template.Element, {
    type: 'loop',
    isParent: HTML.Template.TRUE_FUNC,
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
    }
  }),
  VARElement: Class.create(HTML.Template.Element, {
    type: 'var',
    isParent: HTML.Template.FALSE_FUNC,
    execute: function(param) {
      return this.getParam(param).toString();
    }
  }),
  IFElement: Class.create(HTML.Template.Element, {
    type: 'if',
    isParent: HTML.Template.TRUE_FUNC,
    getCondition: function(param) {
      return !! this.getParam(param);
    },
    execute: function(param) {
      var retValue = "";
      var ELSE = 'else';
      var ELSIF = 'elsif'
      var condition = this.getCondition(param);

      var length = this.children.length;
      for (var i = 0; i < length; i++) {
        var child = this.children[i];
        if (child.type == ELSIF) {
          if (condition) {
            break;
          } else {
            condition = child.getCondition(param);
          }
        } else if (child.type ==
        ELSE) {
          if (condition) {
            break;
          } else {
            condition = true;
          }
        } else {
          if (condition) {
            retValue += child.execute(param);
          } else {
            continue;
          }
        }
      }
      return retValue;
    }
  }),
  ELSEElement: Class.create(HTML.Template.Element, {
    type: 'else',
    isParent: HTML.Template.FALSE_FUNC
  }),
  ELSIFElement: Class.create(HTML.Template.Element, {
    type: 'elsif',
    isParent: HTML.Template.FALSE_FUNC,
    getCondition: function(param) {
      return !! this.getParam(param);
    }
  }),
  TEXTElement: Class.create(HTML.Template.Element, {
    type: 'text',
    closeTag: false,
    isParent: HTML.Template.FALSE_FUNC,
    execute: function() {
      return this.value;
    }
  })
});
HTML.Template.UNLESSElement = Class.create(HTML.Template.IFElement, {
  type: 'unless',
  getCondition: function(param) {
    return ! this.getParam(param);
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
    var context = [];
    this._chunks.each(function(e) {
      if (e.isParent()) {
        if (e.isClose()) {
          var parent = context.pop();
          if (parent.type != e.type) {
            throw ('invalid');
          }
        } else {
          var parent = context.last();
          if (parent) {
            parent.appendChild(e);
          }
          context.push(e);
        }
      } else {
        var parent = context.last();
        parent.appendChild(e);
      }
    });
  },
  output: function() {
    return this.root.execute(this._param);
  }
};