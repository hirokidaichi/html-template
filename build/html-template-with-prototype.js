var HTML=HTML||{};HTML.Template=Class.create({_guessOption:function(option){if(Object.isString(option)){var pos=option.indexOf(':');if(pos>0&&pos<10){return{type:'name',source:option};}else{return{type:'text',source:option};}}
else if(Object.isFunction(option)){return{type:'function',source:option};}
else if(Object.isElement(option)){return{type:'element',source:option};}
if(!(option['type']&&option['source'])){throw('option needs {type:~~,source:~~}');}
return option;},_initUrl:function(source){this._source='contentUnload';if(this.option['element']&&(Object.isElement(this.option['element'])||this.option['element']===document)){this.assignElement=this.option['element'];}
this.storedName="url:"+source;if(this.isCompiled&&this.assignElement){var _self=this;(function(){_self.assignElement.fire('htmltemplate:compiled',_self);}).defer();return;}
new Ajax.Request(source,{method:'get',onSuccess:function(req){this._source=req.responseText;this.compile();this.isCompiled=true;if(this.assignElement){this.assignElement.fire('htmltemplate:compiled',this);}}.bind(this),onFailure:function(){if(this.assignElement){this.assignElement.fire('htmltemplate:failure',this);}else{throw(new Error('can not load tmpl.'));}},onException:function(){if(this.assignElement){this.assignElement.fire('htmltemplate:invalid_tmpl',this);}else{throw(new Error('invalid tmpl.'));}}});},_initText:function(source){this._source=Object.isString(source)?source:(source.toString)?source.toString():'';this.compile();},_initFunction:function(source){if(Object.isFunction(source)){this._output=source;this.isCompiled=true;}else{throw(new Error('in case type is function, source must be function object.'));}},_initElement:function(source){var elem=$(source);if(Object.isElement(elem)&&!this.isCompiled){var tmpl=$A(elem.childNodes)
.select(function(m){return(m.nodeType==8);})
.map(function(m){return m.data;}).join('');this.storedName='dom:'+elem.identify();this._source=tmpl;this.compile();this.isCompiled=true;}},_initLoad:function(){if(!this.option['name'])throw('need name');this._source=this.option['source'];this.storedName=this.option['name'];this.compile();this.isCompiled=true;},_initName:function(source){this.source='';this.storedName=source;if(HTML.Template.Cache[this.storedName]){this._output=HTML.Template.Cache[this.storedName];this.isCompiled=true;}
var segment=source.split(':');var _self=this;({dom:function(){var element=segment[1];_self._initElement(element);},url:function(){var url=segment[1];_self.option['element']=document;_self._initUrl(url);},autocache:function(){throw(new Error(' not in cache '));}})[segment[0]]();},initialize:function(option){this._param={};this._funcs=Object.extend({},HTML.Template.GLOBAL_FUNC);this.isCompiled=false;this.option=this._guessOption(option);var initializer=this['_init'+this.option['type'].capitalize()];if(initializer){initializer.apply(this,[this.option['source']]);}else{throw('invalid type');}},_uniqHash:function(){return"autocache:"+HTML.Template.hashFunction(this.getSource());},registerFunction:function(name,func){this._funcs[name]=func;},getSource:function(){return(Object.isFunction(this.option.filter)?this.option.filter:Prototype.K)(this._source);},functionize:function(){var _func=this._output;return function(param,functions){var _tmp=new HTML.Template({type:'function',source:_func});_tmp.param(param);_tmp._funcs=functions;return _tmp.output();};},clearParams:function(){this._param={};},clearFunctions:function(){this._funcs={};},clear:function(){this.clearParam();this.clearFunction();},param:function(obj){if(Object.isArray(obj)){throw('template.param not array');}
if(Object.isUndefined(obj)){return $H(this._param).keys();}
if(Object.isString(obj)){return this._param[obj];}
for(var prop in obj){this._param[prop]=obj[prop];}
return null;},compile:function(){if(this.isCompiled)return;var uniq=this.storedName||this._uniqHash();if(HTML.Template.Cache[uniq]){this._output=HTML.Template.Cache[uniq];this.isCompiled=true;return;}
try{var functionBody=HTML.Template.Core.getFunctionText(this._source);this._output=HTML.Template.Core.compileFunctionText(functionBody);}catch(e){throw(new Error("HTML_TEMPLATE_ERROR:"+uniq+" can't compile."));}
HTML.Template.Cache[uniq]=this._output;this.isCompiled=true;},output:function(){return this._output(this._param,this._funcs);},toString:function(){return this.output()||'__UNCOMPILED__';},toHTML:function(){return this.output();}});Object.extend(HTML.Template,{VERSION:'0.8',DEFAULT_SELECTOR:'.HTML_TEMPLATE',DEFERRED_SELECTOR:'.HTML_TEMPLATE_DEFERRED',GLOBAL_FUNC:{__escapeHTML:function(str){return str.toString().escapeHTML();},__escapeJS:function(str){return Object.toJSON(str);},__escapeURL:function(str){return encodeURI(str);},__escapeNONE:function(str){return str;},__include:function(name,param,func){console.log(arguments);var tmpl=new HTML.Template(name);tmpl.param(param);tmpl.registerFunction(func);return tmpl.output();}},Cache:{},hashFunction:function(string){var max=(1<<31);var length=string.length;var ret=34351;var pos='x';for(var i=0;i<length;i++){var c=string.charCodeAt(i);ret*=37;pos^=c;ret+=c;ret%=max;}
return ret.toString(16)+'-'+(pos&0x00ff).toString(16);},registerFunction:function(name,func){HTML.Template.GLOBAL_FUNC[name]=func;},precompileBySelector:function(selector){$$(selector).each(function(e){new HTML.Template({type:'element',source:e});});},Core:(function(){var module={exports:{}};var util={};util.defineClass=function(obj,superClass){var klass=function Klass(){this.initialize.apply(this,arguments);};if(superClass)klass.prototype=new superClass;for(var prop in obj){if(!obj.hasOwnProperty(prop))
continue;klass.prototype[prop]=obj[prop];}
if(!klass.prototype.initialize)
klass.prototype.initalize=function(){};return klass;};util.merge=function(origin,target){for(var prop in target){if(!target.hasOwnProperty(prop))
continue;origin[prop]=target[prop];}};util.k=function(k){return k};util.emptyFunction=function(){};util.listToArray=function(list){return Array.prototype.slice.call(list);};util.curry=function(){var args=util.listToArray(arguments);var f=args.shift();return function(){return f.apply(this,args.concat(util.listToArray(arguments)));}};util.merge(util,{isArray:function(object){return object!=null&&typeof object=="object"&&'splice'in object&&'join'in object;},isFunction:function(object){return typeof object=="function";},isString:function(object){return typeof object=="string";},isNumber:function(object){return typeof object=="number";},isUndefined:function(object){return typeof object=="undefined";}});util.createRegexMatcher=function(escapeChar,expArray){function _escape(regText){return(regText+'').replace(new RegExp(escapeChar,'g'),"\\");}
var count=0;var e;var regValues={mapping:{'fullText':[0]},text:[]};for(var i=0,l=expArray.length;i<l;i++){e=expArray[i];if(util.isString(e)){regValues.text.push(e);continue;}
if(!regValues.mapping[e.map]){regValues.mapping[e.map]=[];}
regValues.mapping[e.map].push(++count);}
var reg=undefined;regValues.text=_escape(regValues.text.join(''));return function matcher(matchingText){if(!reg){reg=new RegExp(regValues.text);}
var results=(matchingText||'').match(reg);if(results){var ret={};var prop=0,i=0,map=regValues.mapping;for(prop in map){var list=map[prop];var length=list.length;for(i=0;i<length;i++){if(results[list[i]]){ret[prop]=results[list[i]];break;}}}
return ret;}else{return undefined;}};};var CHUNK_REGEXP_ATTRIBUTE=util.createRegexMatcher('%',["<","(%/)?",{map:'close'},"TMPL_","(VAR|LOOP|IF|ELSE|ELSIF|UNLESS|INCLUDE)",{map:'tag_name'},"%s*","(?:","(?:DEFAULT)=","(?:","'([^'>]*)'|",{map:'default'},'"([^">]*)"|',{map:'default'},"([^%s=>]*)",{map:'default'},")",")?","%s*","(?:","(?:ESCAPE)=","(?:","(JS|URL|HTML|0|1|NONE)",{map:'escape'},")",")?","%s*","(?:","(?:DEFAULT)=","(?:","'([^'>]*)'|",{map:'default'},'"([^">]*)"|',{map:'default'},"([^%s=>]*)",{map:'default'},")",")?","%s*","(?:","(NAME|EXPR)=",{map:'attribute_name'},"(?:","'([^'>]*)'|",{map:'attribute_value'},'"([^">]*)"|',{map:'attribute_value'},"([^%s=>]*)",{map:'attribute_value'},")",")?",'%s*',"(?:","(?:DEFAULT)=","(?:","'([^'>]*)'|",{map:'default'},'"([^">]*)"|',{map:'default'},"([^%s=>]*)",{map:'default'},")",")?","%s*","(?:","(?:ESCAPE)=","(?:","(JS|URL|HTML|0|1|NONE)",{map:'escape'},")",")?","%s*","(?:","(?:DEFAULT)=","(?:","'([^'>]*)'|",{map:'default'},'"([^">]*)"|',{map:'default'},"([^%s=>]*)",{map:'default'},")",")?","%s*",">"]);var element={};element.Base=util.defineClass({initialize:function(option){this.mergeOption(option);},mergeOption:function(option){util.merge(this,option);this['closeTag']=(this['closeTag'])?true:false;},isParent:util.emptyFunction,execute:util.emptyFunction,isClose:function(){return this['closeTag']?true:false;},getCode:function(e){return"void(0);";},toString:function(){return['<',((this.closeTag)?'/':''),this.type,((this.hasName)?' NAME=':''),((this.name)?this.name:''),'>'].join('');},_pathLike:function(attribute,matched){var pos=(matched=='/')?'0':'$_C.length -'+(matched.split('..').length-1);return["(($_C["+pos+"]['",attribute,"']) ? $_C["+pos+"]['",attribute,"'] : undefined )"].join('');},getParam:function(){var ret="";if(this.attributes['name']){var matched=this.attributes['name'].match(/^(\/|(?:\.\.\/)+)(\w+)/);if(matched){return this._pathLike(matched[2],matched[1]);}
ret=["(($_T['",this.attributes['name'],"']) ? $_T['",this.attributes['name'],"'] : ",JSON.stringify(this.attributes['default'])||'undefined'," )"].join('');}
if(this.attributes['expr']){var operators={'gt':'>','lt':'<','eq':'==','ne':'!=','ge':'>=','le':'<='};var replaced=this.attributes['expr'].replace(/{(\/|(?:\.\.\/)+)(\w+)}/g,function(full,matched,param){return['$_C[',(matched=='/')?'0':'$_C.length -'+(matched.split('..').length-1),']["',param,'"]'].join('');}).replace(/\s+(gt|lt|eq|ne|ge|le|cmp)\s+/g,function(full,match){return" "+operators[match]+" ";});ret=["(function(){","    with($_F){","        with($_T){","            return (",replaced,');',"}}})()"].join('');}
if(this.attributes['escape']){var _escape={NONE:'NONE',0:'NONE',1:'HTML',HTML:'HTML',JS:'JS',URL:'URL'}[this.attributes['escape']];ret=['$_F.__escape'+_escape+'(',ret,')'].join('');}
return ret;}});var cache={STRING_FRAGMENT:[]};util.merge(element,{ROOTElement:util.defineClass({type:'root',getCode:function(){if(this.closeTag){return'return $_R.join("");';}else{return['var $_R  = [];','var $_C  = [param];','var $_F  = funcs||{};','var $_T  = param||{};','var $_S  = cache.STRING_FRAGMENT;',].join('');}}},element.Base),LOOPElement:util.defineClass({type:'loop',initialize:function(option){this.mergeOption(option);},getLoopId:function(){if(this._ID){return this._ID;}
if(!element.LOOPElement.instanceId){element.LOOPElement.instanceId=0;}
var id=element.LOOPElement.instanceId++;this._ID='$'+id.toString(16);return this._ID;},getCode:function(){if(this.closeTag){return['}','$_T = $_C.pop();'].join('');}else{var id=this.getLoopId();return['var $_L_'+id+' ='+this.getParam()+'|| [];','var $_LL_'+id+' = $_L_'+id+'.length;','$_C.push($_T);','for(var i_'+id+'=0;i_'+id+'<$_LL_'+id+';i_'+id+'++){','   $_T = (typeof $_L_'+id+'[i_'+id+'] == "object")?','                $_L_'+id+'[i_'+id+'] : {};',"$_T['__first__'] = (i_"+id+" == 0) ? true: false;","$_T['__counter__'] = i_"+id+"+1;","$_T['__odd__']   = ((i_"+id+"+1)% 2) ? true: false;","$_T['__last__']  = (i_"+id+" == ($_LL_"+id+" - 1)) ? true: false;","$_T['__inner__'] = ($_T['__first__']||$_T['__last__'])?false:true;"].join('');}}},element.Base),VARElement:util.defineClass({type:'var',getCode:function(){if(this.closeTag){throw(new Error('HTML.Template ParseError'));}else{return'$_R.push('+this.getParam()+');';}}},element.Base),IFElement:util.defineClass({type:'if',getCondition:function(param){return"!!"+this.getParam(param);},getCode:function(){if(this.closeTag){return'}';}else{return'if('+this.getCondition()+'){';}}},element.Base),ELSEElement:util.defineClass({type:'else',getCode:function(){if(this.closeTag){throw(new Error('HTML.Template ParseError'));}else{return'}else{';}}},element.Base),INCLUDEElement:util.defineClass({type:'include',getCode:function(){if(this.closeTag){throw(new Error('HTML.Template ParseError'));}else{var name='"'+(this.attributes['name'])+'"';return['$_R.push($_F.__include(',name,',$_T,$_F));'].join('\n');}}},element.Base),TEXTElement:util.defineClass({type:'text',closeTag:false,initialize:function(option){this.value=option;},getCode:function(){if(this.closeTag){throw(new Error('HTML.Template ParseError'));}else{cache.STRING_FRAGMENT.push(this.value);return'$_R.push($_S['+(cache.STRING_FRAGMENT.length-1)+']);';}}},element.Base)});element.ELSIFElement=util.defineClass({type:'elsif',getCode:function(){if(this.closeTag){throw(new Error('HTML.Template ParseError'));}else{return'}else if('+this.getCondition()+'){';}}},element.IFElement);element.UNLESSElement=util.defineClass({type:'unless',getCondition:function(param){return"!"+this.getParam(param);}},element.IFElement);element.createElement=function(type,option){return new element[type+'Element'](option);};var parseHTMLTemplate=function(source){var chunks=[];var createElement=element.createElement;var root=createElement('ROOT',{closeTag:false});var matcher=CHUNK_REGEXP_ATTRIBUTE;chunks.push(root);while(source.length>0){var results=matcher(source);if(!results){chunks.push(createElement('TEXT',source));source='';break;}
var index=0;var fullText=results.fullText;if((index=source.indexOf(fullText))>0){var text=source.slice(0,index);chunks.push(createElement('TEXT',text));source=source.slice(index);};var attr,name,value;if(results.attribute_name){name=results.attribute_name.toLowerCase();value=results.attribute_value;attr={};attr[name]=value;attr['default']=results['default'];attr['escape']=results['escape'];}else{attr=undefined;}
chunks.push(createElement(results.tag_name,{'attributes':attr,'closeTag':results.close,'parent':this}));source=source.slice(fullText.length);};chunks.push(createElement('ROOT',{closeTag:true}));return chunks;};module.exports.getFunctionText=function(chunksOrSource){var chunks=util.isString(chunksOrSource)?parseHTMLTemplate(chunksOrSource):chunksOrSource;var codes=[];for(var i=0,l=chunks.length;i<l;i++){codes.push(chunks[i].getCode());};return codes.join('\n');};module.exports.compileFunctionText=function(functionText){return util.curry(new Function('cache','param','funcs',functionText),cache);};return module.exports;})()});if(Object.isFunction(document.observe))document.observe('dom:loaded',function(){HTML.Template.precompileBySelector(HTML.Template.DEFAULT_SELECTOR);HTML.Template.precompileBySelector.defer(HTML.Template.DEFERRED_SELECTOR);});