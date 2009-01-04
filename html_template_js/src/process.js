
/*
    Process.js
    
    iterator��p���������������ɓ��삷��P��֐��ɕϊ����R���p�C������
    ���W���[���B

*/
/*
Boolean ��Ԃ�enumerable method

all
any
include
member
detect
find

������Array��Ԃ�enumerable method

collect
map
pluck

���肵������Array��Ԃ�enumerable method


select
findAll
reject

�J��Ԃ�����
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
