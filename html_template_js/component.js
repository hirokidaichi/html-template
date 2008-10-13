
if (!Prototype)throw ('HTML.Template require prototype.js');
if (!HTML.Template)throw ('HTML.Component require HTML.Template');

HTML.DEFAULT_TMPL = new HTML.Template({type:'text',source:'DEFAULT_TEMPLATE'});
HTML.Component = Class.create({
    initialize:function(option){
        this.modes = {};
        this.currentMode =  'main';
        this.topElement = new Element('div');
       
        $H(this).each(function(e){
            if(e[0].match(/mode:(.*)/)){
                this.registerMode(RegExp.$1,e[1]);
            }
        }.bind(this));
    },
    observe:function(){
    	this.topElement.observe.apply(arguments);
    },
    param:function(){
    	return this.viewMode().view.param.apply(arguments);
    },
    registerFunction:function(){
    	return this.viewMode().view.registerFunction.apply(arguments);
    },
    registerMode:function(modeName,object){
		var tmplFunc = object['view'];
        this.modes[modeName] = {
        	view: tmplFunc,
        	events : $H(object).select(function(e){return e[0]!='view'}).map(function(e){
	        	var item =e[0].split('/');
	        	if(item.length > 1){
	        		return {selector:item[0],event:item[1],func:e[1]};
	        	}else{
	        		throw('not include selector');
	        	}
        	})
        };
    },
    _bindEvent:function(){
    	var self = this;
    	this.viewMode().events.each(function(e){
    		var selector = e.selector;
    		var eventName = e.event;
    		var func = e.func;
    		if(selector){
	    		Element.select(self.topElemenmt,e.selector).each(function(item){
	    			item.observe(eventName,func.bind(self));
	    		});
    		}else{
    			self.topElement.observe(eventName,func.bind(self));	
    		}
    	});
    },
    render:function(param,functions){
        var mode = this.viewMode();
        if(mode){
        	if(param)	 this.param(param);
        	if(functions)this.registerFuction(functions);
            this.topElement.innerHTML=mode.view.output();
            this._bindEvent();
        }
    },
    viewMode:function(){
        if(arguments.length > 0){
            this.currentMode = arguments[0].toString();
        }else{
            return this.modes[this.currentMode];
        }
    }
    ,
    'mode:main':{
        view: new HTML.Template('dom:test01_tmpl'),
        '.test/click':function(){
        	this.viewMode('list');
        	this.render();
        }
    },
    'mode:list':{
        view: new HTML.Template('dom:test02_tmpl'),
        '.test/click':function(){
        	this.viewMode('main');
        	this.render();
        }
    }
	
});

Element.addMethods({
	appendComponent:function(element,component){
		if(Object.isElement(component.topElement)){
			element.appendChild(component.topElement);
			component.render();
		}
	}
});