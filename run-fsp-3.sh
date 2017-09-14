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


# popnbankatm
./crunch.sh planet.mbtiles popnbankatm 32 FSP
cp popnbankatm.mbtiles $RESULTS_DIR/popnbankatm.mbtiles.tmp
rm $RESULTS_DIR/popnbankatm.mbtiles -f
mv $RESULTS_DIR/popnbankatm.mbtiles.tmp $RESULTS_DIR/popnbankatm.mbtiles