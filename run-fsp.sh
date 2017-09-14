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

mkdir -p results/json

./make-json.sh planet.mbtiles mobile_money_agent
./make-json.sh planet.mbtiles atm
./make-json.sh planet.mbtiles bank
./make-json.sh planet.mbtiles credit_institution
./make-json.sh planet.mbtiles microfinance_bank
./make-json.sh planet.mbtiles microfinance
./make-json.sh planet.mbtiles sacco
./make-json.sh planet.mbtiles bureau_de_change
./make-json.sh planet.mbtiles money_transfer
./make-json.sh planet.mbtiles post_office

# Do FSP Crunching
# TODO use loop for this
./run-fsp-1.sh
./run-fsp-2.sh
./run-fsp-3.sh
./run-fsp-4.sh
