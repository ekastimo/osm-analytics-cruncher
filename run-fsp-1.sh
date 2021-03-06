#!/bin/bash -ex

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# this is an example script for how to invoke FSP crunching
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


# mobilemoney
./crunch.sh planet.mbtiles mobilemoney 32 FSP
cp mobilemoney.mbtiles $RESULTS_DIR/mobilemoney.mbtiles.tmp
rm $RESULTS_DIR/mobilemoney.mbtiles -f
mv $RESULTS_DIR/mobilemoney.mbtiles.tmp $RESULTS_DIR/mobilemoney.mbtiles