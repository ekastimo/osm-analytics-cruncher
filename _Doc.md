
Setting up the crucher
=============================

Make sure you are running on a linux environment, for a smooth setup

Install node Js
-----

 ```
 https://nodesource.com/blog/installing-node-js-tutorial-ubuntu/
 curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
 sudo apt-get install -y nodejs
 ```

Update NPM
----------

update npm version with the command:

 ```npm install -g npm@latest```
 
Install Tippecanoe
------------------

Setup environment to build tippecanoe

 ```
 sudo apt-get install build-essential libsqlite3-dev zlib1g-dev sqlite3 
 ```

Go to working directory and install node sqlite3

```npm install sqlite3 ```

  
Install from source

 ```
 git clone https://github.com/mapbox/tippecanoe.git 
 cd tippecanoe
 make 
 make install
 ```
 

Setting up the project
----------------------

Clone the server(Cruncher) from Github 
 `git clone https://github.com/ekastimo/osm-analytics-cruncher
 cd osm-analytics-cruncher`

make changes to the run file 
Update the Mbtiles path to download a smaller file instead of all the planet data
Download vecto tiles from
 
 `curl https://s3.amazonaws.com/mapbox/osm-qa-tiles/latest.country/uganda.mbtiles.gz --silent | gzip -d > planet.mbtiles`

Update Paths to point to your working directory
Set results directory to folder inside the working directory

Start crunching
 ./run.sh
 

Set up node mbtiles server
```
 cd server
 npm install
 node server.js # You can also start this as a background processs
 ```
 
 
The client
Clone the server(client) from Github 
```
 git clone https://github.com/ekastimo/osm-analytics-fsp
 cd osm-analytics-fsp
 ```
Edit the setting file and point the server to your local setup

Run the project in dev

 `npm start`

Build for production
 `npm run build`
 
Install htttp-server

 `npm install -g http-server`
 
 
Start process from background
  
  `http-server static/ -p 3000 2> /dev/null &`

Build the files for production 

 ` npm run build`
  
  
  
  
Typical Crunching process
=============================

Filtering
-----------
 1. Specify the required tag eg building
 2. Iterate over all the tiles, filtering out features with the required tag in its properties
	This is done by tile-reduce,
	The filtering process generates geojson with a FeatureCollection per line
 2. The filtered data is then enriched with extra properties eg user experience, and other props to be used in client analysis
 3.	this is then piped to tippecanoe wich generates mbtiles of the filtered data.
	Parameters are passed to tipecanoe to generate mbtile with only zoomlevel 12
	
Aggregation/Binning
-------------------

 1. Iterate over the new mbtile zoom12,
    for every tile, create smaller (bins) boxes using a binning factor (eg 64, this splits the tile into 64x64 bins)
 2. Iterate over the features in the tile choosing which bin are clipped by the bin.
    increment a count if a bin appears in multiple features
	Keep track of the features that each bin index has.
 3. For each of the 64x64 bins, aggregate the features, and create a polygon(square) with agregated features
 4. The out-put is then piped to tippecanoe to generate z12 bins
 
 
Downscaling
------------

 1. Iterate over the new mbtile zoom12,
    for every tile , sample the bin and group into one, 
	aggregate the properties of the sample bin to get one bin. 
	pipe results to tippecanoe to generate tiles of next (lower) zoom level
 2. Do this up to zoom0
 
 Merging.
 ---------
  Merge z0 to z12 mbtiles files
  
 Finacial service providers (FSP) Logic
 =======================================
  
Question1
-----------

Show coverage of mobile money agents in relation to [population density, economic activity]
 Required data
 1. Mobile money Agents >> amenity="mobile_money_agent"
 2. Buildings >> tag="building"
 3. Roads >> tag="road"
 4. Population >> available in [geojson]()
  the original data is from  [worldpop.org](http://www.worldpop.org.uk/data/summary/?doi=10.5258/SOTON/WP00283) 
  
 5. Economic Activity >> 
 
  ```log10(noOfbuldings, noOfRoads, population, noOfMMAgents)```
 
 **Methodology for economic activity data**
 
 OSM data was downloaded.
 
 It was checked to identify the datasets to be used for the project. The point datasets that were used were amenity, craft, leisure, office, shop, tourism.
 Sport and man-made were not used because the data they contained was not relevant for this study. The polygon datasets that were used were
 
 - Building polygon polygon
 - Building polygon polygon polygon 1
 - Building polygon polygon polygon 2
 - Building polygon polygon polygon 3.
 
 The data was clipped to the extent of Uganda.
 
 All the available data selected for use was grouped into 5 categories
  - All buildings
  - Residential
  - Commercial
  - Mobile-money
  - Financial institutions
 
 All this data was linked to the World Pop population dataset for Uganda.
 
 Primary roads were integrated into the dataset. The distance between each cell and the nearest primary road was measured and recorded in the grid.
 Based on data quality it was decided the certain datasets would not be used as the data was only available for specific areas and would skew the results. The below datasets have been included in this analysis.
  - All buildings
  - Commercial buildings
  - Distance to a primary road
  - Population
  
 The buildings and roads datasets were assigned a value ranging from 1-10 based on their economic impact with 10 being the highest impact.
 These values were added together and divided by three to get an overall economic rank between 1 and 10.
 The webmap is available at [World Pop](https://geointelligence.carto.com/builder/4ed3393c-4440-11e7-9bdd-0e3ebc282e83)
 
Question2
-----------
Show mobile money agents that are (at least) [--distance in km--] away from a [bank/atm, of a certain provider]
 Required data
 1. Mobile money Agents >> amenity="mobile_money_agent"
 2. Banks >> amenity="bank"
 3. ATMs >> amenity="atm"
 
 Each mobile_money_agent is then enriched with properties
 - Distance from bank
 - Distance from ATM
 - Distance(s) from each individual bank/atm
 
 Since the enriching of MM agents happens in the mapping step of tile-reduce, The bank/atm data needs to be readily available at this step.
 Thus the crunching phase of  question2 we process the bank/atm data and save it as JSON array of features. This data is the loaded at the mapping phase
 of tile-reduce and used to compute the distance of agents from banks.
 
 ### Distance Computation
 - Here we use turf.js to get the distances from all bank/atm features in the array, and retain the minimum.
