#!/bin/sh
echo 'create production code (./bin/minify)'
cat license > production/html/template.js
cat ./src/event_wrapper.js ./src/html/template.js  | ./bin/minify  >> production/html/template.js


