if (!Prototype) throw ('ModelDriver require prototype.js');
if (parseInt(Prototype.Version) > 1.6) throw ('ModelDriver require prototype.js v1.6 or later');

var ModelDriver = ModelDriver || {};

(function(){
    // EXPORT FUNCTIONS
    Object.extend(this,{
        create     : export_create
    });
    this.Driver = Class.create({
        initialize:function(baseUrl,option){
            this._url = baseUrl;
            this._method    = option['method_param']    || 'method';
            this._request   = option['request_method']  || 'get';
            this._prepare   = option['prepare']   || function(){};
            this._finish    = option['finish']     || function(){};
            this._exception = option['exception'] || function(){};
            this._dataObject= {};
        },
        addMethods:function(methods){
            $H(methods).each(function(e){
                this[e[0]]=this._createWrapper(e[0],e[1]);
            }.bind(this));
        },
        retrieveData:function(){
            var args = $A(arguments);
            var data = this._dataObject;
            var flag = false;
            args.each(function(prop){
                if(data[prop]){
                    data = data[prop];
                }else{
                    flag = true;
                    throw $break;
                }
            });
            if(flag){
                return undefined;
            }
            return data;
        },
        modifyData:function(){

        },
        storeData:function(name,data){
            this._dataObject[name] = data;
        },
        deleteData:function(name){

        },
        _createWrapper:function(methodName,handler){
            if( !(
                Object.isString(methodName) &&
                Object.isFunction(handler)
                )
             ){
                throw(new Error('error'));
            }
            var methodParam = methodName.underscore();
            var args   = handler.argumentNames().map(function(f){return f.underscore()});
            return function(){
                var _relayList = $A(arguments);
                var list = $A(arguments);
                var param = {};
                args.each(function(arg){
                    param[arg] = list.shift();
                });
                param[this._method] = methodParam;
                this._prepare.apply(this,_relayList);
                new Ajax.Request(this._url,{
                    method:this._request,
                    parameters:$H(param).toQueryString(),
                    onSuccess:function(r){
                        handler.apply(r,_relayList.concat($A(arguments)));
                        this._finish();
                    }.bind(this),
                    onException:function(r,e){
                        console.log(e); 
                    }
                });
                
            }.bind(this)
        }
    });
    function export_create(url,option){
        return new this.Driver(url,option);
    }


}).apply(ModelDriver);
