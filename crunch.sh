#!/bin/bash -ex

## todo: make it run in another directory
## todo: drop unneccessary osm tags

TIPPECANOE="tippecanoe -b0 -d20 -psfk -fP -t . -l osm -q"
BINNINGFACTOR=${3:-64}

# make temporary directory for intermediate results
mkdir -p intermediate

# apply filter, merge with user experience data
./oqt-filter/index.js $1 $2.json | $TIPPECANOE -z 12 -Z 12 -o intermediate/$2.mbtiles

# aggregate to bins
./oqt-aggregate/index.js intermediate/$2.mbtiles $BINNINGFACTOR | $TIPPECANOE -z 12 -Z 12 -o intermediate/$2.z12.mbtiles

# downscale bins to zoom levels 11 to 0
for i in {11..0}; do
    ./oqt-aggregate/downscale.js intermediate/$2.z$((i+1)).mbtiles $BINNINGFACTOR | $TIPPECANOE -z $i -Z $i -o intermediate/$2.z$i.mbtiles
done

# create z13-z14 tiles for raw data and merge in aggredate data zoom levels
./oqt-to-geojson/index.js intermediate/$2.mbtiles | tippecanoe -b0 -d18 -psfk -fP -t . -l osm -q -z 14 -Z 13 -o $2.mbtiles
for i in {12..0}; do
    echo "merge in zoom $i"
    sqlite3 $2.mbtiles "attach 'intermediate/$2.z$i.mbtiles' as tomerge; BEGIN; insert into tiles select * from tomerge.tiles; COMMIT;"
done

# clean up temporary data
#rm intermediate/*
#rmdir intermediate
