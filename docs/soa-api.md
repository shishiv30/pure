# SOA APIs

Short reference for the SOA APIs (Geoarea, Property, School, User, POI). Full specs: use each service’s OpenAPI/Swagger docs.

## Auth (all services)

| Item | Value |
|------|--------|
| **Auth header** | `X-MData-Key: <SOA_API_KEY>` |
| **Key in env** | `SOA_API_KEY` in `.env.local` |

**Env vars (optional, in `.env.local`):**

| Var | Service |
|-----|---------|
| `GEOAREA_API_DOMAIN` | Geoarea |
| `PROPERTY_API_DOMAIN` | Property |
| `SCHOOL_API_DOMAIN` | School |
| `USER_API_DOMAIN` | User |
| `POI_API_DOMAIN` | POI |

---

## 1. Geoarea

| Item | Value |
|------|--------|
| **Base URL** | `GEOAREA_API_DOMAIN` |

### All APIs

Every endpoint from the Geoarea OpenAPI spec. Parameters and schemas: use the service’s OpenAPI docs.

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

### Schemas (for mapping)

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

### POST request bodies (Geoarea)

Use these schemas for POST `Content-Type: application/json` bodies.

#### GeoSearchForm

Used by: `POST /search/info`, `POST /refreshSearchInfo`.

| Property | Type | Required | Notes |
|----------|------|----------|--------|
| input | string | yes | maxLength: 100, minLength: 0 |
| searchType | string | no | enum: `STATE`, `COUNTY`, `CITY`, `NEIGHBORHOOD`, `ZIPCODE`, `MLSNUMBER`, `COLLOQUIAL_AREA`, `BOROUGH` |

**Example:** `{ "input": "Lakewood", "searchType": "CITY" }`

#### IdsForm

Used by: `POST /neighborhoods/refreshTopNearbyNeighborhoods`, `POST /neighborhoods/refresh/neighborhoodIds`, `POST /counties/refresh/countyIds`.

| Property | Type | Required | Notes |
|----------|------|----------|--------|
| ids | array of integer (int32) | no | minItems: 1, maxItems: 100 |

**Example:** `{ "ids": [5405, 5406] }`

#### CityUrlsRequestForm

Used by: `POST /match/citynameurl/stateCode/{stateCode}/neighborhoodnameurl/neighborhood`.

| Property | Type | Required | Notes |
|----------|------|----------|--------|
| cityNameUrlList | array of string | no | |
| neighborhoodList | array of string | no | |

**Example:** `{ "cityNameUrlList": ["lakewood"], "neighborhoodList": ["downtown"] }`

### Test inputs (Geoarea)

| Use as | Value |
|--------|--------|
| State | New Jersey / `NJ` |
| City | Lakewood |
| Zipcode / PostalCode | 08701 |
| City ID | 5405 |

### Example: GET /states

```bash
curl -s -H "X-MData-Key: YOUR_SOA_API_KEY" "$GEOAREA_API_DOMAIN/states"
```

### UI geo model (Geoarea)

Responses can be mapped to the app’s geo model via `helpers/soaGeoMapper.js`:

- **State**: `{ state, type: 'state' }`
- **City**: `{ state, city, type: 'city' }`
- **County**: `{ state, county, type: 'county' }`

Optional: `id`, `zipcode`, `path`. See mapper for field names from the API.

---

## 2. Property

| Item | Value |
|------|--------|
| **Base URL** | `PROPERTY_API_DOMAIN` |

### All APIs

| Method | Path |
|--------|------|
| DELETE | `/saved-searches/{savedSearchId}` |
| GET | `/allCompliance` |
| GET | `/attributes/listings/{listingId}` |
| GET | `/cities/{cityId}/neighborhoods/listingCount` |
| GET | `/cities/{cityId}/zipcodes/publicRecordCount` |
| GET | `/cities/{cityid}/neighborhoods/top` |
| GET | `/cities/{cityid}/zipcodes/top` |
| GET | `/clearComplianceRulesLocalCache` |
| GET | `/clearFeatureKeyTypesLocalCache` |
| GET | `/clearSearchStrategyCacheForAllGeoIDs` |
| GET | `/clearSearchStrategyCacheForGeoID/{geoId}` |
| GET | `/compliance` |
| GET | `/counties/{countyId}/cities/listingCount` |
| GET | `/getComplianceRulesLocalCache` |
| GET | `/getFeatureKeyTypesLocalCache` |
| GET | `/getSearchStrategyCacheForGeoID/{geoId}` |
| GET | `/listingcount/countyid/{countyid}/activelistinggroupbycounty` |
| GET | `/listings-count/new` |
| GET | `/listings/cityid/{cityId}/new` |
| GET | `/listings/cityid/{cityid}/sitemapactive` |
| GET | `/listings/cityid/{cityid}/sitemapopenhouse` |
| GET | `/listings/latest` |
| GET | `/listings/nearbysearch` |
| GET | `/listings/nearbysearch/v2` |
| GET | `/listings/nearbysoldsearch` |
| GET | `/listings/new` |
| GET | `/listings/propertyId` |
| GET | `/listings/state/{stateabbr}/sitemapactive` |
| GET | `/listings/{id}` |
| GET | `/mls/{mlsid}` |
| GET | `/mlsPublicRecordAssociations/url` |
| GET | `/mlsPublicRecordAssociations/url/v2` |
| GET | `/mlses/{mls_id}/timeinfo` |
| GET | `/mlsid/{mlsId}/mlsnumber/{mlsNumber}/listings` |
| GET | `/properties/{propertyId}/histories` |
| GET | `/properties/{propertyId}/primary-listing` |
| GET | `/properties/{propertyId}/primary-listing/v2` |
| GET | `/refreshstatusmap` |
| GET | `/saved-searches/{savedSearchId}` |
| GET | `/states/{state}/cities/listingCount` |
| GET | `/states/{state}/counties/top` |
| GET | `/states/{state}/zipcodes/listingCount` |
| POST | `/address-search/v1` |
| POST | `/cities/listingCount` |
| POST | `/cities/{cityId}/listings/averagePrice` |
| POST | `/city/titleDescription/summary` |
| POST | `/es/queries/translate` |
| POST | `/listing-basics` |
| POST | `/listings` |
| POST | `/listings/cache` |
| POST | `/listings/geo-area/count` |
| POST | `/listings/getPhotos` |
| POST | `/listings/inventory-count` |
| POST | `/listings/listing-descriptions` |
| POST | `/listings/nearbysearch` |
| POST | `/listings/nearbysearch/cache` |
| POST | `/listings/nearbysearch/esquery` |
| POST | `/listings/nearbysearch/geo-search` |
| POST | `/listings/nearbysearch/mapview` |
| POST | `/listings/nearbysearch/rss` |
| POST | `/listings/nearbysearch/statelist` |
| POST | `/listings/nearbysearch/v2` |
| POST | `/listings/nearbysearch/v3` |
| POST | `/listings/schools/v2` |
| POST | `/listings/updated` |
| POST | `/neighborhoods/listingCount` |
| POST | `/pricePerSqft` |
| POST | `/properties` |
| POST | `/propertyIds/priceEstimate` |
| POST | `/xml/search-listings/query` |
| POST | `/zipcodes/listingCount` |

---

## 3. School

| Item | Value |
|------|--------|
| **Base URL** | `SCHOOL_API_DOMAIN` |

### All APIs

| Method | Path |
|--------|------|
| DELETE | `/cacheEvict` |
| DELETE | `/cacheEvict/schoolSearch` |
| DELETE | `/cacheEvict/{cacheName}` |
| GET | `/baseInfo` |
| GET | `/cities/{cityId}/schoolCount` |
| GET | `/cities/{cityId}/schoolDistricts` |
| GET | `/cities/{cityId}/schools` |
| GET | `/cities/{cityId}/schools/count` |
| GET | `/cities/{cityId}/schools/sortable` |
| GET | `/confValue` |
| GET | `/counties/{countyId}/schoolDistricts` |
| GET | `/nearby/search` |
| GET | `/neighborhoods/{neighborhoodId}/schoolCount` |
| GET | `/neighborhoods/{neighborhoodId}/schoolDistricts` |
| GET | `/neighborhoods/{neighborhoodId}/schools/sortable` |
| GET | `/property/locations/{lat},{lng}/assignedSchools` |
| GET | `/property/locations/{lat},{lng}/assignedSchools/cache` |
| GET | `/schoolDistricts/{ncesId}` |
| GET | `/schoolDistricts/{schoolDistrictId}/schools` |
| GET | `/states/{state}/schoolDistricts` |
| GET | `/states/{state}/schools` |
| GET | `/version` |
| GET | `/warmup/assignedSchools` |
| GET | `/zipcodes/{zipcode}/schoolCount` |
| GET | `/zipcodes/{zipcode}/schoolDistricts` |
| GET | `/zipcodes/{zipcode}/schools` |
| GET | `/zipcodes/{zipcode}/schools/count` |
| GET | `/zipcodes/{zipcode}/schools/schoolDistricts` |
| GET | `/zipcodes/{zipcode}/schools/sortable` |
| GET | `/{schoolId}/baseInfo/testsAndRanks` |
| GET | `/{schoolId}/censusInfo` |
| GET | `/{schoolId}/reviewSummary` |
| GET | `/{schoolId}/reviews` |
| GET | `/{schoolId}/stateRating` |
| GET | `/{schoolId}/tests/{testId}/testScore` |
| POST | `/cities/school-districts/count` |
| POST | `/cities/schools/count` |
| POST | `/cities/search` |
| POST | `/neighborhoods/schools/count` |
| POST | `/schoolMetrics` |
| POST | `/search` |
| POST | `/topSchools` |

---

## 4. User

| Item | Value |
|------|--------|
| **Base URL** | `USER_API_DOMAIN` |

### All APIs

| Method | Path |
|--------|------|
| DELETE | `/agents/{agentId}/users/{userId}/saved-searches/{searchId}` |
| DELETE | `/users/delete` |
| DELETE | `/users/{userId}/deleteUserAgentMapping` |
| DELETE | `/users/{userId}/saved-searches/{searchId}` |
| GET | `/agents/{agentId}/users/{userId}/saved-searches` |
| GET | `/agents/{agentId}/users/{userId}/saved-searches/{searchId}` |
| GET | `/clearLeadTypeSfdcLocalCache/{leadType}` |
| GET | `/confValue` |
| GET | `/favorites/{favoriteId}` |
| GET | `/password/status` |
| GET | `/saved-searches/{searchId}` |
| GET | `/testimonials` |
| GET | `/testimonials/random3testimonials` |
| GET | `/tokens/{token}/user` |
| GET | `/users/email/{email}/info` |
| GET | `/users/{userId}/details` |
| GET | `/users/{userId}/email/subscribe-status` |
| GET | `/users/{userId}/favorite/properties` |
| GET | `/users/{userId}/favorites` |
| GET | `/users/{userId}/getUserAgentMapping` |
| GET | `/users/{userId}/info` |
| GET | `/users/{userId}/og-user-id` |
| GET | `/users/{userId}/properties/{propertyId}` |
| GET | `/users/{userId}/questionnaires/count` |
| GET | `/users/{userId}/saved-searches` |
| GET | `/users/{userId}/saved-searches/{searchId}` |
| GET | `/users/{userId}/settings` |
| GET | `/users/{userId}/token` |
| GET | `/version` |
| GET | `/{userId}/claimedHomes` |
| POST | `/agents/{agentId}/email/{email}/saved-searches` |
| POST | `/agents/{agentId}/users/{userId}/saved-searches` |
| POST | `/authentication` |
| POST | `/claimedHome` |
| POST | `/claimedHome/importDigs` |
| POST | `/claimedHome/remove` |
| POST | `/contact-us` |
| POST | `/crm/password/update` |
| POST | `/crm/password/update_v2` |
| POST | `/email/{email}/saved-searches` |
| POST | `/hotleads` |
| POST | `/passwords/encryption` |
| POST | `/social/connection` |
| POST | `/social/disconnection` |
| POST | `/social/login` |
| POST | `/social/secure/apple/login` |
| POST | `/social/secure/apple/login/v2` |
| POST | `/social/secure/login` |
| POST | `/social/secure/login/v2` |
| POST | `/users` |
| POST | `/users/delete/bulk` |
| POST | `/users/deleteduserauditdata` |
| POST | `/users/{ngUserId}/user-mapping` |
| POST | `/users/{userId}/favorites` |
| POST | `/users/{userId}/favorites/filter` |
| POST | `/users/{userId}/questionnaires` |
| POST | `/users/{userId}/saved-searches` |
| PUT | `/agent/{userId}/email` |
| PUT | `/agents/{agentId}/users/{userId}/saved-searches/{searchId}` |
| PUT | `/agents/{agentId}/users/{userId}/saved-searches/{searchId}/undo` |
| PUT | `/client/agent/emailupdate` |
| PUT | `/email/activation` |
| PUT | `/email/reset-password` |
| PUT | `/email/send` |
| PUT | `/email/subscribe` |
| PUT | `/email/to-friend` |
| PUT | `/email/unsubscribe` |
| PUT | `/favorite/{status}/refresh` |
| PUT | `/favorites/{favoriteId}` |
| PUT | `/favorites/{favoriteId}/note` |
| PUT | `/favorites/{favoriteId}/status` |
| PUT | `/saved-searches/url` |
| PUT | `/tokens/{token}/activation` |
| PUT | `/tokens/{token}/password` |
| PUT | `/users/updateUserAgentMapping` |
| PUT | `/users/{userId}` |
| PUT | `/users/{userId}/drip-campaign/{dripCampaignId}/unsubscribe` |
| PUT | `/users/{userId}/favorites` |
| PUT | `/users/{userId}/properties/{propertyId}/viewcount` |
| PUT | `/users/{userId}/role` |
| PUT | `/users/{userId}/saved-searches/{searchId}` |
| PUT | `/users/{userId}/saved-searches/{searchId}/last-view` |
| PUT | `/users/{userId}/saved-searches/{searchId}/undo` |
| PUT | `/users/{userId}/settings` |
| PUT | `/users/{userId}/settings/app-notification/default` |

---

## 5. POI

| Item | Value |
|------|--------|
| **Base URL** | `POI_API_DOMAIN` |

### All APIs

| Method | Path |
|--------|------|
| GET | `/bbox/{minLat},{minLng},{maxLat},{maxLng}/msp/places` |
| GET | `/boundaryId/{boundaryIndexId}/places` |
| GET | `/clearsubcategoriesLocalCache` |
| GET | `/confValue` |
| GET | `/latlng/{lat},{lng}/radius/{radius}/categoryids/{categoryIds}/places` |
| GET | `/latlng/{lat},{lng}/radius/{radius}/places` |
| GET | `/property/{propertyId}/latlng/{lat},{lng}/places/v2` |
| GET | `/version` |

---

## App proxy

| App endpoint | Upstream | Notes |
|-------------|----------|--------|
| `GET /api/soa/states` | Geoarea `/states` | Needs `GEOAREA_API_DOMAIN` and `SOA_API_KEY` |
| `GET/POST /api/soa/property/*` | Property `/*` | Needs `PROPERTY_API_DOMAIN`. E.g. `GET /api/soa/property/soldListingsByLocation` |
| `GET/POST /api/soa/school/*` | School `/*` | Needs `SCHOOL_API_DOMAIN` |
| `GET/POST /api/soa/user/*` | User `/*` | Needs `USER_API_DOMAIN` |
| `GET/POST /api/soa/poi/*` | POI `/*` | Needs `POI_API_DOMAIN` |
