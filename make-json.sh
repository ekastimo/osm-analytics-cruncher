#!/bin/bash -ex

./oqt-to-json-collection/index.js $1 filters/$2.json | head -n -1 > results/json/$2.json
#Append Clossing brace
echo "]}" >> results/json/$2.json