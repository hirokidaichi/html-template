
var template = require('../src/html-template-core');

var COMPLEX_TMPL =[
    '<h1>Test <TMPL_VAR NAME=name></h1>',
    '<p>',
    '<TMPL_LOOP NAME=loop>',
    '<TMPL_IF NAME=case1>',
    'Case-1<div>xx</div>',
    '<TMPL_ELSE>',
    '<TMPL_IF NAME=case2>',
    'Case-2<div>xx</div>',
    '<TMPL_ELSE>',
    '<TMPL_IF NAME=case3>',
    'Case-3<div>xx</div>',
    '<TMPL_ELSE>',
    'Other cases<div>xx</div>',
    '</TMPL_IF>',
    '</TMPL_IF>',
    '</TMPL_IF>',
    '</TMPL_LOOP>',
    '<img src="../../resources/test.jpg">',
    '</p>'
].join('\n');


var f1 = template.compileFunctionText(template.getFunctionText(COMPLEX_TMPL));


console.log(f1({
    name : "nodeTemplate",
    loop : [
        {case1 : false,case2 : false,case3 : true  },
        {case1 : false,case2 : false,case3 : false },
    ]
}));
