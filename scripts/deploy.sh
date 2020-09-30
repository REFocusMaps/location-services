#!/bin/bash
npm run lint && npm run test

GIT_STATUS=$(git status)
GIT_HASH_SHORT=$(git rev-parse --short HEAD)

if [[ "$GIT_STATUS" =~ .*(nothing to commit, working tree clean).* ]] ; then
    echo "Clean and synced: $GIT_HASH_LONG"
    echo "Updating .env with git hash"
    printf "GIT_HASH=${GIT_HASH_SHORT}\n" > .env.prod
else
    echo "Cannot deploy unless all changes are commited."
    exit 1
fi
# AWS_PROFILE=refm-prod sls deploy --env prod