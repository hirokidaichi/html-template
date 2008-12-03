#!/bin/sh
echo 'create production code (./bin/minify)'
cat license > template_production.js
cat ./src/event_wrapper.js ./src/template.js  | ./bin/minify  >> production/html/template.js


