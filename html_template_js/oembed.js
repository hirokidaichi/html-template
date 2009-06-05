"use strict";

if (!Prototype){
    throw ('HTML.Template require prototype.js');
}

if (! 
    Prototype.Version.
    split('.').
    zip([1,6,0]).
    all(function(e){
        return ( parseInt( e[0],10 ) >= ( e[1] || 0 ) );
    })
){
    throw(new Error('HTML.Template require prototype 1.6.0 or later'));
}
if ( ! Object.isUndefined(window.oEmbed) ){
    throw('oEmbed is already loaded');
}
var oEmbed = Class.create(
(function(){
    /*
     * private utils
     */
    var chainize = function (F){
        return function(){
            F.apply(this,arguments);
            return this;
        };
    };

    return {
        VERSION        : '0.1',
        API_MODE       : $w('INTERNAL EXTERNAL'),
        DATA_FORMAT    : $w('json xml'),
        REQUIRE_PARAMS : $w('endpointURL mode format listOfURISchema targetSelector'),

        initialize : function( endpointURL ,option){
            this.option = Object.extend({
                limit : 5,
                endpointURL : endpointURL
            },option);
            if(/\.(xml|json)$/.test(endpointURL)){
                this.format(RegExp.$1,true);
            }
        },
        invoke:function(){
            var anchorTable = {};
            var uriList     = [];
            this.getAnchorList().each(function(a){
                uriList.push(a.href);
                anchorTable[a.href] = a;
            });
            this.anchorTable = anchorTable;
            this[this.option.mode.toLowerCase()+'Request'](uriList);
        },
        getParameter:function(url){
            var parameter = {};
            if(! this.option.noparam){
                parameter.format = this.option.format;
            }
            parameter.url = url;
            Object.extend(parameter,this.option.requestOption);
            return parameter;
        },
        /*
         * XMLHTTPRequest
         */
        internalRequest:function(uriList){
            $A(uriList).each(function(uri){
                 var request = new Ajax.Request(this.option.endpointURL,{
                    method:'POST',
                    parameters:this.getParameter(uri),
                    onSuccess:function(res){
                        this.callBack(uri,res.responseJSON || this.convertXMLToJSON(res.responseXML) );
                    }.bind(this)
                });
            }.bind(this));
        },
        convertXMLToJSON:function(xml){
            return this._convertXMLElementToJSON($A(xml.getElementsByTagName('oembed')).first());
        },
        _convertXMLElementToJSON:function(oembed){
            return $A(oembed.childNodes).select(Object.isElement).inject({},function(result,element){
                result[element.tagName] = element.textContent;
                return result;
            });
        },
        /*
         * JSONP Callback
         */
        externalRequest:function(uriList){ 
            $A(uriList).each(function(uri){
                var parameter = this.getParameter(uri);
                parameter.callback = oEmbed.registCallBack(this,uri);
                var script = new Element('script',{
                    src : this.option.endpointURL + "?" + $H(parameter).toQueryString()
                });
                document.body.appendChild(script);
            }.bind(this));
        },
        callBack:function(uri,json){ 
            this.constructor.Parser.create(this.anchorTable[uri],json).parse();
        },
        getInvoker:function(){
            var _self = this;
            //console.log(_self);
            if(_self.REQUIRE_PARAMS.all(function(e){
                return ( ! Object.isUndefined(_self.option[e]) ); 
            })){
                return _self.invoke.bind(_self);
            }else{
                return function(){
                    throw('fillin require params');
                };
            }
        },
        getAnchorList:function(){
            var _self = this;
            return $A(this.option.targetSelector).map(function(e){
                return e+" a";
            }).map($$).flatten().select(function(a){
                try{
                    return _self.option.listOfURISchema.any(function(schema){
                        return schema.match(a.href);
                    });
                }catch(e){
                    return false;
                }
            }).splice(0,this.option.limit);
         },
        /* 
         * method chainized setter methods 
         */
        mode:chainize(function(mode){
            if(!this.API_MODE.include(mode)){
                throw('unexpected  api mode');
            }
            this.option.mode = mode;
        }),
        format:chainize(function(format,noparam){
            if(!this.DATA_FORMAT.include(format)){
                throw('unexpected data format');
            }
            this.option.format  = format;
            this.option.noparam = Boolean(noparam); 
        }),
        limit:chainize(function(limit){
            this.option.limit = parseInt(limit,10);
        }),
        requestOption : chainize(function(option){
            this.option.requestOption = Object.extend(this.option.requestOption||{},option );
        }),
        addEffect:chainize(function(){
            
        }),
        addURISchema:chainize(function(){
            if( !this.option.listOfURISchema){
                this.option.listOfURISchema = [];
            }
            Array.prototype.push.apply(
                this.option.listOfURISchema,$A(arguments).flatten().map(function(r){
                    return new oEmbed.URISchema(r);
                })
            );
        }),
        targetSelector:chainize(function(){
            if( !this.option.targetSelector){
                this.option.targetSelector = [];
            }
            Array.prototype.push.apply(this.option.targetSelector,$A(arguments).flatten());
        })
    };
})());

Object.extend(oEmbed, {
    CALLBACK_POOL: [],
    registCallBack: function(oembed,uri) {
        oEmbed.CALLBACK_POOL.push(oembed.callBack.bind(oembed,uri));
        return new Template("oEmbed.CALLBACK_POOL[#{number}]").evaluate({
            number : oEmbed.CALLBACK_POOL.length - 1
        });
    }
});

RegExp.quoteMeta = function(str){
    var backslash  = String.fromCharCode(92);
    var unsafe     = ".+*?[^]$(){}=!<>|:";
    for (i=0;i<unsafe.length;++i){  
        str=str.replace(new RegExp("\\"+unsafe.charAt(i),"g"),backslash+unsafe.charAt(i)); 
    }
    return str;

};

oEmbed.URISchema = Class.create({
    PROTOCOL  : '([^:\/?#]+:)?',
    HOST      : '(([^\/?#:]*):?(\\d*))?',
    AFTERHOST : '(([^?#]*)(\\?[^#]*)?(#.*)?)',
    initialize :function(_uri){
        var uri    = String(_uri);
        var parser = new RegExp(['^',this.PROTOCOL,'\/\/',this.HOST,this.AFTERHOST,'$'].join(''));
        var m = uri.match(parser);
        if (!m){
            throw new URIError("malformed URI given");
        }
        Object.extend( this ,{
            href     :   m[0],
            protocol : ( m[1] || "" ),
            host     : ( m[2] || "" ),
            hostname : ( m[3] || "" ),
            port     : ( m[4] || "" ),
            afterhost: ( m[5] || "" ),
            pathname : ( m[6] || "" ),
            search   : ((m[7] === "?") ? "" : m[7] || ""),
            hash     : ( m[8] || "" )
        });
    },
    includeWildCard:function(){
        if(this.href.indexOf('*')>=0){
            return true;
        }else{
            return false;
        }
    },
    match : function(_uri){
        if(this.includeWildCard()){
            var uri = new oEmbed.URISchema(_uri);
            if(uri.includeWildCard()){
                return false;
            }
            return ( this._matchHost(uri.hostname) && this._matchAfterHost(uri.afterhost) );
        }else{
            return ( this.href === _uri );
        }
    },
    _matchHost: function(targetHost){
        var hostRegex = new RegExp(this.host.replace(/(?:(\*)|([^\*]+))/g,function(match){
            if(match === '*'){
                return "[0-9a-zA-Z\\-]+";
            }else{
                return RegExp.quoteMeta(match);
            }
        }));
        return (hostRegex.test(targetHost))? true : false;
    },
    _matchAfterHost : function(targetAfterhost){
        var afterhostRegex = new RegExp(this.afterhost.replace(/(?:(\*)|([^\*]+))/g,function(match){
            if(match === '*'){
                return ".+";
            }else{
                return RegExp.quoteMeta(match);
            }
        }));
        return (afterhostRegex.test(targetAfterhost))? true : false;
    }
});

oEmbed.Parser = Class.create({
    initialize:function(type){
    
    },
    parse:function(){
    
    }
});

Object.extend(oEmbed.Parser,{
    Photo : Class.create({},oEmbed.Parser),
    Link  : Class.create({},oEmbed.Parser),
    Video : Class.create({},oEmbed.Parser),
    Rich  : Class.create({},oEmbed.Parser)
});

oEmbed.Parser.create = function(anchor,json){
    console.log(anchor,json);
    if(json && json.type && Object.isString(json.type)){
        var typeName = json.type.camelize();
        return new oEmbed.Parser[typeName](anchor,json);
    }else{
        return false;
    }
};
(function(){
    document.observe('dom:loaded',
        (new oEmbed('/.pl')).
            mode('INTERNAL').
            format('xml').
            addURISchema('http://mixi.jp/*').
            addURISchema('http://music.mixi.jp/*').
            targetSelector('#diary_body').
            limit(10).
            addEffect(function(){
                
            }).
            getInvoker()
    );
})();
(function(){
    document.observe('dom:loaded',
        (new oEmbed('http://vimeo.com/api/oembed.json')).
            mode('EXTERNAL').
            addURISchema('http://vimeo.com/*').
            targetSelector('#diary_body').
            limit(10).
            addEffect(function(){
                
            }).
            getInvoker()
    );
})();

