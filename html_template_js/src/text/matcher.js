
var Text = Text || {};
Object.extend(Text,{
    Matcher:(function(){
        var _Matcher = Class.create({
            initialize:function(filters){
                this.hash    = {};
                this.cache   = {};
                this.text    = "";
                this.filters = [filters].flatten() || [];
            },
            append:function(key,value){
                this.hash[key] = value;
                this.text+=key+"";
            },
            _searchByIndexOf:function(key){
                var a = [];
                if(this.text.indexOf(key)<0)
                   return [];
                for(var k in this.hash){
                    if(k.indexOf(key)>=0){
                        a.push(this.hash[k]);
                    }
                }
                return a;
            },
            search:function(key){
                return (this.cache[key])
                ? this.cache[key]
                : function(){
                    var value = this._searchByIndexOf(key);
                    this.cache[key] = value;
                    return value;
                }.apply(this);
            }
        });
        return _Matcher;
    })()
});