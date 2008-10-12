#!/bin/sh
echo 'create production code (./bin/minify)'

./bin/minify < template.js > template_production.js

echo 'create document html'
pod2text template.js > doc.txt

