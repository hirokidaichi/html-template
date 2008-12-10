/* 
 * HistoryState
 *  
 */

var HistoryState = HistoryState || {};

(function(){
    // Private
    var _IFRAME_SRC  = $A(document.getElementsByTagName('script')).last().src.replace('.js','/iframe.html');
    var _handler     = Prototype.emptyFunction;
    var _iframe      = undefined;
    var _self       = this;
    // Export
    Object.extend(this,{
        IFRAME_SRC  : _IFRAME_SRC,
        SELECTOR    : "a",
        STATE_PARAM : "state",
        regist      : export_regist,
        change      : export_change,
        callHandler : export_callHandler
    });
    // Public 
    function export_regist(){
        if(!_iframe){
            enable();
        }
        
    }
    function export_callHandler(){
        console.log(xx);
    }
    function export_change(state){

        (getInnerWindow().document.body).insert('<div>hogehoge</div>');

 
        getInnerWindow().location.hash = '#'+state;

    }
    // Private Method
    function getInnerWindow(){
        return _iframe.contentWindow;
    }
    function enable(){
        _iframe = document.createElement('iframe');
        _iframe.setStyle({
            height   : 250  + 'px',
            width    : 250  + 'px',
            position : 'absolute',
            //top      : -500 +'px',
            //left     : -500 + 'px',
        });
        $(document.body).insert(_iframe);
        _iframe.src = _self.IFRAME_SRC;
    }


}).apply(HistoryState);

document.observe('dom:loaded',function(){
    HistoryState.regist({
        name : 'state1',
        begin: function(){
            
        },
        end  :function(){
            
        }
    });
});

