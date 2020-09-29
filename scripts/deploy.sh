#!/bin/bash
# check that everything is committed first
# 
npm run lint
npm run test
# AWS_PROFILE=refm-prod sls deploy --env prod