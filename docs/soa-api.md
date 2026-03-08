# Geoarea SOA API

Short reference for the Geoarea SOA API. Full specs: [Swagger UI](https://geoarea.prod.aws.us-west-2.ojocore.com/geoarea/swagger-ui/index.html).

## Base

| Item | Value |
|------|--------|
| **Base URL** | `https://geoarea.prod.aws.us-west-2.ojocore.com/geoarea` (or `GEOAREA_API_DOMAIN` in `.env.local`) |
| **Auth header** | `X-MData-Key: <SOA_API_KEY>` |
| **Key in env** | `SOA_API_KEY` in `.env.local` |

## All APIs

Every endpoint from the Geoarea OpenAPI spec. Parameters and schemas: use Swagger UI.

| Method | Path | Deprecated |
|--------|------|------------|
| GET | `/{id}` | yes |
| DELETE | `/cacheEvict` | |
| DELETE | `/cacheEvict/{id}` | |
| GET | `/cities/{cityIds}/neighborhoods` | |
| GET | `/cities/{cityIds}/postalcodes` | |
| GET | `/city/{cityId}` | |
| GET | `/city/{cityId}/base-url` | yes |
| GET | `/city/{cityId}/nearbycities` | |
| GET | `/city/{cityId}/nearestcity` | yes |
| GET | `/city/{cityId}/neighborhoods` | |
| GET | `/city/{cityId}/postalcodes` | |
| GET | `/city/{cityId}/topnearbycities` | |
| GET | `/city/redirected-city-url` | |
| GET | `/city/v1/{cityId}/zipcodesbylistingcount` | |
| GET | `/citybaseurl/{cityBaseUrl}/city` | |
| GET | `/citybaseurl/{cityBaseUrl}/statisticsurl` | yes |
| GET | `/cityid/{cityId}/miles/{miles}/nearbyneighborhoods` | |
| GET | `/cityids/{cityIds}/cities` | |
| POST | `/counties/refresh/countyIds` | yes |
| GET | `/county/{countyId}/cities` | |
| GET | `/county/{countyId}/postalcodes` | |
| GET | `/countyids/{countyIds}/counties` | |
| GET | `/find/cities` | |
| GET | `/find/postcodes` | |
| GET | `/ip/{ipAddress}/citylocation` | |
| GET | `/lnglat/{lng},{lat}/neighborhoods` | |
| GET | `/match/city/{cityId}/postalcode/{postalCode}` | yes |
| GET | `/match/citynameurl/{cityNameUrl}/statecode/{stateCode}/neighborhoodnameurl/{neighborhoodNameUrl}/neighborhood` | |
| POST | `/match/citynameurl/stateCode/{stateCode}/neighborhoodnameurl/neighborhood` | yes |
| GET | `/match/state/{stateCode}/postalcodes/{postalCodes}` | |
| GET | `/neighborhdids/{neighborhdIds}/neighborhoods` | |
| GET | `/neighborhood/{cityId}/{neighborhoodType}/{numberOfResults}` | |
| GET | `/neighborhood/{neighborhoodId}/topnearbyneighborhoods` | |
| DELETE | `/neighborhood/cacheEvict` | |
| DELETE | `/neighborhood/cacheEvict/{id}` | |
| POST | `/neighborhoods/refresh/neighborhoodIds` | yes |
| POST | `/neighborhoods/refreshTopNearbyNeighborhoods` | |
| GET | `/pobox-postalcodes` | |
| GET | `/postalcode/{postalCode}/cities` | |
| GET | `/postalcodes/{postalCode}` | yes |
| GET | `/postalcodes/{postalCode}/topnearbypostalcodes` | |
| POST | `/refreshSearchInfo` | |
| GET | `/search/county` | |
| POST | `/search/info` | |
| DELETE | `/search/info/cacheEvict` | |
| GET | `/state/{state}/cities/total_listing_count_of_neighborhood` | |
| GET | `/state/{stateCode}/boroughs` | |
| GET | `/state/{stateCode}/cities` | |
| GET | `/state/{stateCode}/cities/neighborhood/count` | |
| GET | `/state/{stateCode}/counties` | |
| GET | `/state/{stateCode}/counties/cities` | yes |
| GET | `/state/{stateCode}/counties/v2` | |
| GET | `/state/{stateCode}/countynameforurl/{countyNameForUrl}/county` | |
| GET | `/state/{stateCode}/geoInfo/cities` | |
| GET | `/state/{stateCode}/geoInfo/counties` | |
| GET | `/state/{stateCode}/postalcodes` | |
| GET | `/state/{stateCode}/postalcodes/v2` | |
| GET | `/statecode/{stateCode}/countyid/{countyId}/nearcounties` | |
| GET | `/statecode/{stateCode}/nearstates` | |
| GET | `/statecode/{stateCode}/state` | |
| GET | `/states` | |
| GET | `/states/{state}/boroughs/listingCount` | |
| GET | `/type/{type}/code/{geoCode}` | yes |
| GET | `/zipcode/center` | yes |
| GET | `/zipcodes/boundaries` | yes |

## Schemas (for mapping)

Object shapes from the OpenAPI spec. Use when mapping API responses to the app’s geo model or building requests.

### LatLng

| Property | Type | Notes |
|----------|------|--------|
| lat | number | |
| lng | number | |

### SimpleBean

Base geo object (state, city, county, etc. may use this shape).

| Property | Type | Notes |
|----------|------|--------|
| id | integer (int32) | |
| cityBaseUrl | string | |
| cityNameForUrl | string | |
| stateNameForUrl | string | |
| name | string | |
| displayName | string | |
| nameForUrl | string | |
| baseUrl | string | |
| abbreviation | string | |
| code | string | |
| type | string | |
| hide | integer (int32) | |
| location | LatLng | |

### PostalCodeSimpleBean

Extends SimpleBean; used for zip/postal code responses.

| Property | Type | Notes |
|----------|------|--------|
| *(all SimpleBean)* | | |
| sitemapZipCodePageUrl | string | |
| demographicsPageUrl | string | |
| cityId | integer (int32) | |
| listingsCount | integer (int32) | |
| cityName | string | |
| cityDisplayName | string | |
| sitemapCityPropertyPageUrl | string | |
| cityType | string | |
| countyId | integer (int32) | |
| countyName | string | |
| countyDisplayName | string | |
| countyNameForUrl | string | |
| sitemapCountyPageUrl | string | |
| sitemapCityListForCountyPageUrl | string | |
| stateCode | string | |
| stateName | string | |
| stateDisplayName | string | |
| sitemapStatePageUrl | string | |
| sitemapCityListForStatePageUrl | string | |
| sitemapCityHomeValuesPageUrl | string | |
| sitemapZipcodeHomeValuesPageUrl | string | |
| zipCodeStatisticsPageUrl | string | |
| zipCodeSchoolPageUrl | string | |
| sitemapCitySummaryUrl | string | |
| sitemapZipcodeSummaryUrl | string | |
| listingMedianPrice | integer (int32) | |

### NeighborhoodSimpleBean

Extends SimpleBean; used for neighborhood responses.

| Property | Type | Notes |
|----------|------|--------|
| *(all SimpleBean)* | | |
| sitemapNeighborhoodPageUrl | string | |
| cityId | integer (int32) | |
| cityName | string | |
| cityDisplayName | string | |
| sitemapCityPropertyPageUrl | string | |
| countyId | integer (int32) | |
| countyName | string | |
| countyDisplayName | string | |
| countyNameForUrl | string | |
| sitemapCountyPageUrl | string | |
| sitemapCityListForCountyPageUrl | string | |
| stateCode | string | |
| stateName | string | |
| stateDisplayName | string | |
| sitemapStatePageUrl | string | |
| sitemapCityListForStatePageUrl | string | |
| neighborhoodStatisticsPageUrl | string | |
| neighborhoodSchoolPageUrl | string | |
| sitemapCitySummaryUrl | string | |
| sitemapNeighborhoodSummaryUrl | string | |
| listingsCount | integer (int32) | |

### CommaSeparatedIntegers

Path/query shape for comma-separated IDs (e.g. `cityIds`, `countyIds`).

| Property | Type | Notes |
|----------|------|--------|
| values | array of integer (int32) | minItems: 1, maxItems: 50 |

---

## POST request bodies

Use these schemas for POST `Content-Type: application/json` bodies.

### GeoSearchForm

Used by: `POST /search/info`, `POST /refreshSearchInfo`.

| Property | Type | Required | Notes |
|----------|------|----------|--------|
| input | string | yes | maxLength: 100, minLength: 0 |
| searchType | string | no | enum: `STATE`, `COUNTY`, `CITY`, `NEIGHBORHOOD`, `ZIPCODE`, `MLSNUMBER`, `COLLOQUIAL_AREA`, `BOROUGH` |

**Example:** `{ "input": "Lakewood", "searchType": "CITY" }`

### IdsForm

Used by: `POST /neighborhoods/refreshTopNearbyNeighborhoods`, `POST /neighborhoods/refresh/neighborhoodIds`, `POST /counties/refresh/countyIds`.

| Property | Type | Required | Notes |
|----------|------|----------|--------|
| ids | array of integer (int32) | no | minItems: 1, maxItems: 100 |

**Example:** `{ "ids": [5405, 5406] }`

### CityUrlsRequestForm

Used by: `POST /match/citynameurl/stateCode/{stateCode}/neighborhoodnameurl/neighborhood`.

| Property | Type | Required | Notes |
|----------|------|----------|--------|
| cityNameUrlList | array of string | no | |
| neighborhoodList | array of string | no | |

**Example:** `{ "cityNameUrlList": ["lakewood"], "neighborhoodList": ["downtown"] }`

---

## Test inputs

| Use as | Value |
|--------|--------|
| State | New Jersey / `NJ` |
| City | Lakewood |
| Zipcode / PostalCode | 08701 |
| City ID | 5405 |

## Example: GET /states

```bash
curl -s -H "X-MData-Key: YOUR_SOA_API_KEY" \
  "https://geoarea.prod.aws.us-west-2.ojocore.com/geoarea/states"
```

## App proxy

| App endpoint | Upstream | Notes |
|-------------|----------|--------|
| `GET /api/soa/states` | Geoarea `/states` | Needs `GEOAREA_API_DOMAIN` and `SOA_API_KEY` |

## UI geo model

Responses can be mapped to the app’s geo model via `helpers/soaGeoMapper.js`:

- **State**: `{ state, type: 'state' }`
- **City**: `{ state, city, type: 'city' }`
- **County**: `{ state, county, type: 'county' }`

Optional: `id`, `zipcode`, `path`. See mapper for field names from the API.
