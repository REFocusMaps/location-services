#!/bin/bash
npm run lint && npm run test

GIT_STATUS=$(git status)
GIT_HASH_SHORT=$(git rev-parse --short HEAD)

if [[ "$GIT_STATUS" =~ .*(nothing to commit, working tree clean).* ]] ; then
    echo "Clean and synced: $GIT_HASH_LONG"
    echo "Updating .env with git hash"
    sed -i '' "s/GIT_HASH=.*/GIT_HASH=$GIT_HASH_SHORT/" .env.prod
    git commit -am "Updated GIT_HASH to $GIT_HASH_SHORT for deployment"
    AWS_PROFILE=refm-prod sls deploy --env prod
else
    echo "Cannot deploy unless all changes are commited."
    exit 1
fi