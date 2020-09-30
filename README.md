# location-services

Middle man for geocoder and timezone requests

## Geocoder

## Timezone

## Deploy Prod

All changes must be commited then run the following

``` bash
./scripts/deploy.sh
```

## TODO

- Finish unit tests
- Make E2E tests running locally
  - Wait for local instance to spin up
  - Geocode address once, check that it was a cache miss
  - Geocode address again, check that is was a cache hit
  - Same for timezone
- Integrate GIT_HASH into logs
- Setup lambda for reporting to elk
- Finish deployment script
  - run e2e tests
  - (if any of those fail, fail build)
- Integrate into other parts of system
  