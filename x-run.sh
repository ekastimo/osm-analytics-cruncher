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

# clean up
#trap cleanup EXIT
function cleanup {
  rm -rf $WORKING_DIR/osm-analytics-cruncher
}

# init repo
#cd $WORKING_DIR
#git clone https://github.com/hotosm/osm-analytics-cruncher
#cd osm-analytics-cruncher
#npm install --silent

# update hot projects data
#./hotprojects.sh || true

# download latest planet from osm-qa-tiles
#curl https://s3.amazonaws.com/mapbox/osm-qa-tiles/latest.planet.mbtiles.gz --silent | gzip -d > planet.mbtiles

# config
PROJECT_DIR=.
WORKING_DIR=$PROJECT_DIR/build
RESULTS_DIR=$PROJECT_DIR/results
SERVER_SCRIPT=$PROJECT_DIR/server/serve.js
FILTERS_DIR=$PROJECT_DIR/filters-osm
CONFIG_FILE=$FILTERS_DIR/config-all.json

# Automatically generate config from available filters
./create-config.sh $FILTERS_DIR $CONFIG_FILE

# generate user experience data
./experiences.sh planet.mbtiles

for row in $(jq -r -c .[] $CONFIG_FILE); do  
   _jq() {
     echo ${row} | jq -r ${1}
    }
  name=$(_jq '.name')
  factor=$(_jq '.factor')

  # Start crunching
  ./crunch.sh planet.mbtiles $name $factor
  cp $name.mbtiles $RESULTS_DIR/$name.mbtiles.tmp
  rm $RESULTS_DIR/$name.mbtiles -f
  mv $RESULTS_DIR/$name.mbtiles.tmp $RESULTS_DIR/$name.mbtiles
  #forever restart $SERVER_SCRIPT
  #rm $name.mbtiles
done

./run-fsp.sh
