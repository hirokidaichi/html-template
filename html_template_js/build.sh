#!/bin/sh
echo 'create production code (./bin/minify)'

./bin/minify < template.js > template_production.js

echo 'create document html'
perl -MPod::Simple::HTML -e Pod::Simple::HTML::go template.js >docs.html


