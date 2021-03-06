#!/bin/bash -ex

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# this is an example script for how to invoke  osm-analytics-cruncher to
# regenerate vector tiles for osm-analytics from osm-qa-tiles
#
# config parameters:
# * WORKING_DIR - working directory where intermediate data is stored
#                 (requires at least around ~160 GB for planet wide calc.)
# * RESULTS_DIR - directory where resulting .mbtiles files are stored
# * SERVER_SCRIPT - node script that serves the .mbtiles (assumed to be already
#                   started with `forever`)
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# config
PROJECT_DIR=.
WORKING_DIR=$PROJECT_DIR/build
RESULTS_DIR=$PROJECT_DIR/results
SERVER_SCRIPT=$PROJECT_DIR/server/serve.js
TIPPECANOE="tippecanoe -b0 -d20 -psfk -fP -t . -l osm -q"


./crunch.sh planet.mbtiles mmdistbanks 32 FSP
cp mmdistbanks.mbtiles $RESULTS_DIR/mmdistbanks.mbtiles.tmp
rm $RESULTS_DIR/mmdistbanks.mbtiles -f
mv $RESULTS_DIR/mmdistbanks.mbtiles.tmp $RESULTS_DIR/mmdistbanks.mbtiles


# make temporary directory for intermediate results
mkdir -p intermediate
# Generate enriched mobile money agents
FILTER_FILE="mm-bank-dist"
./oqt-filter/index.js results/mmdistbanks.mbtiles mm-bank-dist.json FSP | $TIPPECANOE -z 12 -Z 12 -o intermediate/$FILTER_FILE.mbtiles
# Generate JSON array
./oqt-to-json-collection/index.js  intermediate/$FILTER_FILE.mbtiles | head -n -1 > results/json/$FILTER_FILE.json
#Append Clossing brace
echo "]}" >> results/json/$FILTER_FILE.json
# clean up temporary data
rm intermediate/*
rmdir intermediate




