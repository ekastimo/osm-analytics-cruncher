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

# generate user experience data
#./experiences.sh planet.mbtiles

# generate osm-analytics data
# buildings
#./crunch.sh planet.mbtiles buildings 64
#cp buildings.mbtiles $RESULTS_DIR/buildings.mbtiles.tmp
#rm $RESULTS_DIR/buildings.mbtiles -f
#mv $RESULTS_DIR/buildings.mbtiles.tmp $RESULTS_DIR/buildings.mbtiles
#forever restart $SERVER_SCRIPT
#rm buildings.mbtiles
# highways
./crunch.sh planet.mbtiles highways 32
cp highways.mbtiles $RESULTS_DIR/highways.mbtiles.tmp
rm $RESULTS_DIR/highways.mbtiles -f
mv $RESULTS_DIR/highways.mbtiles.tmp $RESULTS_DIR/highways.mbtiles
#forever restart $SERVER_SCRIPT
#rm highways.mbtiles


# waterways
./crunch.sh planet.mbtiles waterways 32
cp waterways.mbtiles $RESULTS_DIR/waterways.mbtiles.tmp
rm $RESULTS_DIR/waterways.mbtiles -f
mv $RESULTS_DIR/waterways.mbtiles.tmp $RESULTS_DIR/waterways.mbtiles
#forever restart $SERVER_SCRIPT
#rm waterways.mbtiles

# mobilemoney
./crunch.sh planet.mbtiles mobilemoney 32
cp mobilemoney.mbtiles $RESULTS_DIR/mobilemoney.mbtiles.tmp
rm $RESULTS_DIR/mobilemoney.mbtiles -f
mv $RESULTS_DIR/mobilemoney.mbtiles.tmp $RESULTS_DIR/mobilemoney.mbtiles


# mmdistbanks

#Generate Banks and ATM json
FILTER_FILE="banks-atms"
./oqt-filter/index.js planet.mbtiles $FILTER_FILE.json | $TIPPECANOE -z 12 -Z 12 -o intermediate/$FILTER_FILE.mbtiles
# Generate JSON array
./oqt-to-json-array/index.js  intermediate/$FILTER_FILE.mbtiles | head -n -1 > $FILTER_FILE-data.json
#Append Clossing brace
echo "]" >> $FILTER_FILE-data.json


FILTER_FILE="mobilemoneyagents"
./oqt-filter/index.js results/mmdistbanks.mbtiles $FILTER_FILE.json | $TIPPECANOE -z 12 -Z 12 -o intermediate/$FILTER_FILE.mbtiles
# Generate JSON array
./oqt-to-json-array/index.js  intermediate/$FILTER_FILE.mbtiles | head -n -1 > $FILTER_FILE-data.json
#Append Clossing brace
echo "]" >> $FILTER_FILE-data.json

./oqt-custom/mmBankDistance.js | head -n -1  > $FILTER_FILE-data-enriched.json
#Append Clossing brace
echo "]" >> $FILTER_FILE-data-enriched.json


./crunch.sh planet.mbtiles mmdistbanks 32
cp mmdistbanks.mbtiles $RESULTS_DIR/mmdistbanks.mbtiles.tmp
rm $RESULTS_DIR/mmdistbanks.mbtiles -f
mv $RESULTS_DIR/mmdistbanks.mbtiles.tmp $RESULTS_DIR/mmdistbanks.mbtiles


# fspdistribution
./crunch.sh planet.mbtiles fspdistribution 64
cp fspdistribution.mbtiles $RESULTS_DIR/fspdistribution.mbtiles.tmp
rm $RESULTS_DIR/fspdistribution.mbtiles -f
mv $RESULTS_DIR/fspdistribution.mbtiles.tmp $RESULTS_DIR/fspdistribution.mbtiles

#rm planet.mbtiles
