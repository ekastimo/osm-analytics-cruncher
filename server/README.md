

This server uses tile-live to dynamically load all the generated tiles in the `results` folder, these are then accessible to any UI with the URL formart
 "{{server}}/tag/{z}/{x}/{y}.pbf"
 
 
 The server also statically exposes JSON Files int the `results/json` directory wc can eb usesed for futher analysis.
 
 To demonstatrate the ease with which this data can be used with an API, we developed a simple api, to compute the number 
 of mobile money agent in an a given distance from a abank or atm
  `{{server}}/distance/${from}/${to}` 
  where from = Minimum distance, to= Maximum distance
