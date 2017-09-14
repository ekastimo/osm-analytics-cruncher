#!/bin/bash -ex

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# this script takes JSON filters witl tags and/or amenities 
# and generates a features collection of the same from mbtiles
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

./oqt-to-json-collection/index.js $1 $2.json | head -n -1 > results/json/$2.json
#Append Clossing brace
echo "]}" >> results/json/$2.json