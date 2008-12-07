

if( !Prototype ) throw('');
(function(namespace){
    var namespace = window[namespace] = (window[namespace])?window[namespace]: {};
    Object.extend(namespace,{
        getParameter:function(){
            return $A(document.getElementsByTagName('script')).last().src.toQueryParams();
        }
    });    
})('HTMLScriptElement');
