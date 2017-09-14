# fsp-filter

Filters out specific features from [osm-qa-tiles](http://osmlab.github.io/osm-qa-tiles/) and generates a geojson collection
The tags and amenities can be obtained from [here](https://taginfo.openstreetmap.org/)

Usage:

```json
{
"composite": true,
"tags": [
    "banking_agent"
],
"amenities": [
    "bank"
]
}
```

See `filter.json.example` for how to set up a filter