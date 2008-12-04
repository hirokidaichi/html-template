


if( !('Prototype' in window) ) throw ;

(function(namespace){
    var namespace = window[namespace] = {};
    Object.extend(namespace,{
        getParameter:function(){
            return $A(document.getElementsByTagName('script')).last().src;
        }
    });    
})('ScriptSetting');
