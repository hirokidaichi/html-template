/*
 
 SELECTOR:(eventname)
 VIEWS:(main)
 Class.create(HTML.Component,
 });

 
*/
HTML.Component.regist=function(){


};

HTML.Component.create=function(){

};

HTML.Component = Class.create({
    initialize:function(){
        // register views
        this.views =$(this.views).map(function(view){
            return view.functionize();
        });
    },
    _registerEvents:function(){
        // register events
        $(this.events).each(function(){
        
        });
    },
    render:function(param,functions){
        var tmpl = this.views[this.mode];
        if(tmpl){
            
        }
    },
    assign:function(element){
        this.topElement = element;
    },
    viewMode:function(){
        if(arguments.length > 0){
            this.mode = arguments[0].toString();
        }else{
            return this.mode;
        }
    },
    'mode:main':{
        view:'',
    },
    'mode:list':{
        view: new HTML.Template('dom:tmpl'),
        '.test/click':function(){
        
        }
    }
});

