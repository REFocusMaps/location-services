import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildResponse } from '../../helpers/rest';
import { geocodeAddress } from '../../helpers/geocoder';
import { logElkEvent } from '../../helpers/log';
import { ENV_VARS, getOrThrowEnv } from '../../helpers/env';

interface RequestBody {
    address: string,
}

export const handler = async (
    event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
    const apiKey = event.headers['x-api-key'];
    const eventBody: RequestBody = JSON.parse(event.body || '{}');

    const requestValid = isRequestValid(eventBody, apiKey);
    if (!requestValid) {
        console.log(`Invalid request body: ${event.body}`);
        return buildResponse(400, `Invalid request body: ${event.body}`);
    }

    try {
        const result = await geocodeAddress(eventBody.address);
        if (result) {
            logElkEvent('Cache Result', {
                cacheHit: result?.cacheHit ? 1 : 0,
                cacheMiss: result?.cacheHit ? 0 : 1
            });
            return buildResponse(200, result);
        } else {
            console.log(`Could not geocode address ${eventBody.address}`);
            return buildResponse(500, `Could not geocode address ${eventBody.address}`);
        }
    } catch (error) {
        console.log(error);
        return buildResponse(500, error.message);
    }
};

function isRequestValid(reqBody: RequestBody, apiKey: string) {
    if (apiKey !== getOrThrowEnv(ENV_VARS.API_KEY_VALUE)) {
        return false;
    }

    return !!reqBody.address;
}