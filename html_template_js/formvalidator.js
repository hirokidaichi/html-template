


/*

*/
var FormValidator = FormValidator || {};

(function(){
    var _DEFAULT_OPTION = {
        test_option : 1
    };
    function _createObject(key,value,query){
        return {
            target : [key].flatten().map(function(k){
                var ret ={};ret[k]=query[k];
                return ret;
            }),
            checker: $A(value).map(function(funcs){
                if(Object.isString(funcs)){
                    return {func:funcs,args:[]};
                }else if(Object.isArray(funcs)){
                    return {func:funcs.shift(),args:funcs};
                }
            })
        };
    }
    this.Simple = Class.create({
        initialize:function(option){
            this.option = Object.extend(_DEFAULT_OPTION,option);
        },
        check :function(query,condition){
            var obj = {};
            
            for(var i = 0,cl = condition.length;i<cl;){
                var key   = condition[i++];
                var value = condition[i++];
                if(Object.isString(key)){
                    obj[key] = _createObject(key,value,query);
                }else{
                    for(var prop in key) break;//get first prop
                    obj[prop] =  _createObject(key,value,query);

                }
            }
            return this.evaluate(query,obj);
        },
        evaluate:function(query,obj){
            var _self = this;
            $H(obj).each(function(e){
                console.log(e[1]);
                var data = e[1]
                $A(data.checker || []).each(function(f){
                
                });
            });
        }
    });
    (function(){
        this.Results = Class.create({});
        this.Message = Class.create({});
        
        Object.extend( this,{
            DEFAULT_OPTION :_DEFAULT_OPTION,
            check : this.prototype.check.bind(new this),
            addPlugin : function(obj){
                this.Plugin = this.Plugin || {};
                Object.extend(this.Plugin,obj);
            }.bind(this)
        });
        
    }).apply(this.Simple);

}).apply(FormValidator);

FormValidator.Simple.setMessages = function(){
    
    
}

FormValidator.Simple.addPlugin({
    'NOT_BLANK':function(){
        
    },
    'ASCII'    :function(){
        
    },
    'LENGTH'   :function(){
        
    },
    'INT'      :function(){
        
    },
    'UINT'     :function(){
    
    },
    'DUPLICATION':function(){
        
    },
    'DATE':function(){
        
    },
    'GREATER_THAN':function(){
        
    },
    'LESS_THAN':function(){
        
    },
    
});

var obj = FormValidator.Simple.check({
        'param1':'1111',
        'mail2' :'2222',
        'mail2' :'3333',
        'year'  :'4444',
        'month' :'5555',
        'day'   :'6666'
    },
    [
        "param1"    ,   ["NOT_BLANK","ASCII",["LENGTH",2,5]],
        "param2"    ,   ["NOT_BLANK","INT"],
        "mail1"     ,   ["NOT_BLANK","EMAIL_LOOSE"],
        "mail2"     ,   ["NOT_BLANK","EMAIL_LOOSE"],
        {"mails":["mail1","mail2"]}     ,   ["DUPLICATION"],
        {"date":["year","month","day"]} ,   ["DATE"]
    ]
);

console.log(obj);
