import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getTimeZoneForAddress } from '../../helpers/timezone';
import { logElkEvent } from '../../helpers/log';
import { buildResponse } from '../../helpers/rest';
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
        console.log(`Invalid request body: ${JSON.stringify(event.body)}`);
        return buildResponse(400, `Invalid request body: ${JSON.stringify(event.body)}`);
    }

    try {
        const result = await getTimeZoneForAddress(eventBody.address);
        if (result) {
            logElkEvent('Cache Result', {
                cacheHit: result.cacheHit ? 1 : 0,
                cacheMiss: result.cacheHit ? 0 : 1
            });
            return buildResponse(200, result);
        } else {
            console.log(`Could not geocode address ${eventBody.address}`);
            return buildResponse(500, `Could not get timezone for address ${eventBody.address}`);
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