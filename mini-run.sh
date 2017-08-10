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
PROJECT_DIR=/home/timothy/Desktop/osm-analytics-cruncher
WORKING_DIR=$PROJECT_DIR/build
RESULTS_DIR=$PROJECT_DIR/results
SERVER_SCRIPT=$PROJECT_DIR/server/serve.js

# mmdistbanks
./crunch.sh planet.mbtiles mmdistbanks 32
cp mmdistbanks.mbtiles $RESULTS_DIR/mmdistbanks.mbtiles.tmp
rm $RESULTS_DIR/mmdistbanks.mbtiles -f
mv $RESULTS_DIR/mmdistbanks.mbtiles.tmp $RESULTS_DIR/mmdistbanks.mbtiles

