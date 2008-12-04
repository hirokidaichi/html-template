


/*

*/
var FormValidator = FormValidator || {};

(function(){ // Namespace in FormValidator
    var _DEFAULT_OPTION = {
        test_option : 1
    };
    var asParam = function(param){
        return function(f){return f[param];};
    };
    var Record = Class.create({
        initialize:function(key,value,query){
            this.data = {
                target :[key].flatten().map(function(k){
                    return query[k];
                }),
                checker: $A(value).map(function(funcs){
                    if(Object.isString(funcs)){
                        return {func:funcs,args:[]};
                    }else if(Object.isArray(funcs)){
                        return {func:funcs.shift(),args:funcs};
                    }
                })
            };
        },
        target:function(){
            var target = this.data.target;
            return (target.length==1)?target.first():target;
        },
        evaluate:function(checker){
            if(!checker)return true;
            if(checker && checker.result != undefined ){
                console.log(['cached',checker.func,checker.result].join('/'));
                return checker.result;
            }
            var func = FormValidator.Simple.Plugin[(checker.func)];
            
            if(Object.isFunction(func)){
                var a=[0,checker.args].flatten();
                a[0]=this.target();
                
                var result;
                try{
                    result = (func.apply(this,a))?true:false;
                }catch(e){
                    result = false;
                }
                checker.result = result;
                console.log([checker.func,result].join('/'));
                return result;
            }
            throw('invalid function');
        },
        invalid:function(val){
            var checkList =[];
            if(val){
                val = [val].flatten();
                checkList = this.data.checker.select(function(f){return val.include(f.func) });
            }else{
                checkList = this.data.checker.reject(function(f){return f.func == 'NOT_BLANK'});
            }
            return checkList.select(function(f){
                return !this.evaluate(f);
            }.bind(this)).map(function(f){return f.func});
            
        },
        isBlank:function(){
            // NOT_BLANK のみ
            return !this.evaluate( 
                this.data.checker.find(function(f){return (f.func == 'NOT_BLANK')}) 
            );
        },
        isValid:function(){
            return !this.isInvalid();
        },
        isInvalid:function(){
            return (this.data.checker.reject(function(f){return f.func == 'NOT_BLANK'}).find(function(f){
                return !this.evaluate(f);
            }.bind(this)))?true:false;
        }
    });

    this.Simple = Class.create({
        initialize:function(option){
            this.option = Object.extend(_DEFAULT_OPTION,option);
            this._results = new FormValidator.Simple.Results();
        },
        results:function(){
            return this._results;
        },
        check :function(query,condition){
            for(var i = 0,cl = condition.length;i<cl;){
                var key   = condition[i++];
                var value = condition[i++];
                if(Object.isString(key)){
                    this.results().setRecord(key,new Record(key,value,query));
                }else{
                    for(var prop in key){ break;}//get first prop
                    this.results().setRecord(prop,new Record(key[prop],value,query));
                }
            }
            return this.results();
        },
        setMessages:function(obj){
            this._messages =obj;
            this._results.messages(obj);
        }
    });
    (function(){ // namespace as FormValidator.Simple

        this.Results = Class.create({
            initialize:function(message){
                this._data={};
            },
            setRecord:function(key,result){
                this._data[key] = result;
            },
            messages:function(m){
                if(m.constructor == Object){
                    // object
                    this._messages = m;
                    return ;
                }
                if(Object.isString(m)){
                    var msgs  = this._messages[m] || this._messages['DEFAULT'] || [];
                    var _self = this;
                    var ret   = {};
                    // それぞれのparamに対してinvalidを集める。
                    var errors =$H(msgs).map(function(e){return {key:e.key,value:_self.error(e.key)}});
                    // エラーからメッセージを取得する
                    var retMessage = errors.map(function(e){
                        return e.value.map(function(v){
                            return msgs[e.key][v] || msgs[e.key]['DEFAULT'] || v;
                        });
                    }).flatten();
                    return retMessage;
                }
            },
            fieldMessages:function(){
            
            },
            hasBlank:function(){
                // NOT_BLANK
                var data = this._data;
                for( var key in data ){
                    if(data[key].isBlank())return true ;
                }
                return false;
            },
            hasInvalid:function(){
                // NOT_BLANK以外
                var data = this._data;
                for( var key in data ){
                    if(data[key].isInvalid())return true ;
                }
                return false;
            },
            hasError:function(){
                // すべて
                return ( this.hasBlank() || this.hasInvalid() )? true : false;
            },
            success:function(){
                // inverse of hasError
                return ( this.hasBlank() || this.hasInvalid() )? false : true;
            },
            // BLANK
            missing:function(obj){
                if(!obj){// no arguments
                    return $H(this._data).select(function(dat){
                        return dat[1].isBlank();
                    }).map(function(dat){return dat[0]});
                } 
                if(Object.isString(obj)){
                    var key = obj;
                    return this._data[key].isBlank();
                }
            },
            // 
            invalid:function(obj){
                if(!obj){
                    // invalid な keyのリストを返す。
                    return $H(this._data).select(function(dat){
                        return dat[1].isInvalid();
                    }).map(function(dat){return dat[0]});
                } 
                if(Object.isString(obj)){
                    var key = obj;
                    //そのkeyのinvalidなオペレーションを返す.
                    return this._data[key].invalid();
                }
                if(obj.constructor == Object){
                    for(var firstKey in obj){ break;}
                    var value = obj[firstKey];
                    return (this._data[firstKey].isInvalid(value))?true:false;
                }
            },
            error:function(obj){
                if(!obj){// no arguments
                    var mis = this.missing();
                    var inv = $H(this._data).keys().reject(function(f){return mis.include(f)}).select(function(k){
                        return this._data[k].isInvalid();
                    }.bind(this));
                    return [mis,inv].flatten();
                } 
                if(Object.isString(obj)){
                    if(this.missing(obj)){
                        return ['NOT_BLANK'];
                    }else{
                        return this.invalid(obj);
                    }
                    
                }
                if(obj.constructor == Object){
                    for(var firstKey in obj){ break;}

                    return (this.missing(firstKey))
                        ?true
                        :(this.invalid(obj));
                }
            }
        });
        var defaultInstance = new this;
        Object.extend( this,{
            DEFAULT_OPTION :_DEFAULT_OPTION,
            setMessages:this.prototype.setMessages.bind(defaultInstance),
            check : this.prototype.check.bind(defaultInstance),
            addPlugin : function(obj){
                this.Plugin = this.Plugin || {};
                Object.extend(this.Plugin,obj);
            }.bind(this)
        });
    }).apply(this.Simple);

}).apply(FormValidator);

/*


*/


FormValidator.Simple.addPlugin({
    'NOT_BLANK':function(target){
        return (Object.isUndefined(target) || target == '')?false:true;
    },
    'ASCII'    :function(target){
        return /^[\x21-\x7E]+$/.test(target.toString());
    },
    'LENGTH'   :function(target,from,till){
        var l=target.toString().length;
        if(!till){till=from;}
        
        return (l >= from && l <=till)?true:false;
    },
    'INT'      :function(target){
        return (target.toString().match(/^-?\d+$/gm)) ? true : false;
    },
    'UINT'     :function(){
        return (target.toString().match(/^\d+$/gm))?true:false;
    },
    'DUPLICATION':function(target){
        if(Object.isArray(target) && target.length == 2){
            return (target[0].toString() == target[1].toString())? true : false;
        }else{
            return false;
        }
    },
    'TIME':function(target){
    
    },
    'DATE':function(target){
        
    },
    'DATETIME':function(target){
    
    },
    'ANY':function(target){
    
    },
    'ALL':function(target){
        
    },
    'IN_ARRAY':function(target,array){
    
    },
    'BETWEEN':function(target,from,to){
    
    },
    'EQUAL_TO':function(target,comp){
    
    },
    'GREATER_THAN':function(target,radix){

    },
    'LESS_THAN':function(target,radix){

    },
    'SELECTED_AT_LEASET':function(target){
    
    },
    'HTTP_URL':function(target){
        /^s?https?:\/\/[-_.!~*'()a-zA-Z0-9;\/?:\@&=+\$,%#]+$/.test('');
        
    },
    'EMAIL_LOOSE':function(){

    }
});



