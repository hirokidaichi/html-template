#!/bin/sh
echo 'create production code (./bin/minify)'
cat license > template_production.js
cat event_wrapper.js template.js  |./bin/minify  >> template_production.js

echo 'create document html'

pod2text template.js > doc.txt

