
/*
    Process.js
    
    iteratorを用いた処理を高速に動作する単一関数に変換しコンパイルする
    モジュール。

*/
/*
Boolean を返すenumerable method

all
any
include
member
detect
find

等価なArrayを返すenumerable method

collect
map
pluck

限定した個数のArrayを返すenumerable method


select
findAll
reject

繰り返し処理
each
invoke

*/

var Process = Class.create({
    initialize:function(options){
        this.context = 'array';
        this.stack   = [];
    },
    compile:function(){
        var body = [
            '',
            '',
            this._sta
            '',
        ].join('\n');
        try{
            this.execute = new Function(body);
        }
        catch(e){
            throw(new Error(':compile error:'));
        }
    },
    execute:function(){
    
    }
});
$w('collect map pluck select findAll reject').each(function(methodName){
    Process.prototype[methodName] = function(proc){
        if(this.context == 'array'){
            this.stack.push({method:methodName,proc:proc});
            this.context = 'array';
            return this;
        }else{
            throw('error');
        }
    }
});
$w('min max').each(function(methodName){
    Process.prototype[methodName] = function(proc){
        if(this.context == 'array'){
            this.stack.push({method:methodName,proc:proc});
            this.context = 'element';
            return this;
        }else{
            throw('error');
        }
    }
});

$w('all any include member detect').each(function(methodName){
    Process.prototype[methodName] = function(proc){
        if(this.context == 'array'){
            this.stack.push({method:methodName,proc:proc});
            this.context = 'boolean';
            return this;
        }else{
            throw('error');
        }
    }
});
/*
var x=(new Process({
    async:true,
    callback:function(){
        
    }
}))
.map(function(e){})
.select(function(){})
.invoke()
.compile();

x.execute([array]);

*/
