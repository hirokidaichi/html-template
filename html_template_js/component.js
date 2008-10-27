
if (!Prototype)throw ('HTML.Template require prototype.js');
if (!HTML.Template)throw ('HTML.Component require HTML.Template');

HTML.DEFAULT_TMPL = new HTML.Template({type:'text',source:'  '});

HTML.Component = Class.create({
    initialize:function(option){
        this.modes = {};
        this.currentMode =  'main';
        this.topElement =$(option);
        this.topElement._component = this;
        $H(this).each(function(e){
            if(e[0].match(/(mode|message):(.*)/)){
                this['register'+(RegExp.$1).capitalize()](RegExp.$2,e[1]);
            }
        }.bind(this));
    },
    param:function(obj){
        if(this.viewMode().view)
            return this.viewMode().view.param(obj);
    },
    registerFunction:function(name,func){
        if(this.viewMode().view)
            return this.viewMode().view.registerFunction(name,func);
    },
    registerMode:function(modeName,object){
        var tmplFunc = object['view'];
        var init     = object['initialize'] || function(){};
        this.modes[modeName] = {
            view: tmplFunc,
            initialize:init,
            events : $H(object).select(function(e){return !$w('view initialize').include(e[0])}).map(function(e){
                var item =e[0].split('--');
                if(item.length > 1){
                    return {selector:item[0],event:item[1],func:e[1]};
                }else{
                    throw('not include selector');
                }
            })
        };
    },
    registerMessage:function(messageName,func){
        this.topElement.observe('component-message:'+messageName,function(evt){func.apply(this,evt.memo)}.bind(this));
    },
    send:function(){
        var args =$A(arguments);
        var name =args.shift();
        this.topElement.fire('component-message:'+name,args);
    },
    _bindEvent:function(){
        var self = this;
        if(this.viewMode().events)
        this.viewMode().events.each(function(e){
            var selector  = e.selector;
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
        this.viewMode().initialize();
    },
    render:function(param,functions){
        var mode = this.viewMode();
        if(mode && mode.view){
            if(param)     this.param(param);
            if(functions)this.registerFuction(functions);
            this.topElement.innerHTML=mode.view.output();
            this._bindEvent();
        }else{
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
});
Object.extend(Object,{
    isComponent:function(target){
        return (Object.isElement(target) && target._component)?true:false;
    }
});

HTML.Component.attatch=function(){
    $A(arguments).each(function(e){
        if(e.component && e.element){
            new e.component($(e.element));
        }
    });
};
Element.addMethods({
    component:function(element){
        if(Object.isElement(element) && element._component){
            return element._component;
        }
    },
    send:function(){
        var args = $A(arguments);
        var elem = args.shift();
        if('_component' in elem){
            console.log(elem._component.send);
            var component =elem._component;
            component.send.apply(component,args);
        }
    }
});
