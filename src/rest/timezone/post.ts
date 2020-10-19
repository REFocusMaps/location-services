import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getTimeZoneForAddress } from '../../helpers/timezone';
import { logElkEvent } from '../../helpers/log';
import { buildResponse } from '../../helpers/rest';

interface RequestBody {
    address: string,
}

export const handler = async (
    event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
    const eventBody: RequestBody = JSON.parse(event.body || '{}');

    const requestValid = isRequestValid(eventBody);
    if (!requestValid) {
        console.log(`Invalid request body: ${JSON.stringify(event.body)}`);
        buildResponse(400, `Invalid request body: ${JSON.stringify(event.body)}`);
    }

    try {
        const result = await getTimeZoneForAddress(eventBody.address);
        if (result) {
            logElkEvent('Cache Result', {
                cacheHit: result.cacheHit ? 1 : 0,
                cacheMiss: result.cacheHit ? 0 : 1
            });
            buildResponse(200, result);
        } else {
            console.log(`Could not geocode address ${eventBody.address}`);
            buildResponse(500, `Could not get timezone for address ${eventBody.address}`);
        }
    } catch (error) {
        console.log(error);
        buildResponse(500, error.message);
    }
};

function isRequestValid(reqBody: RequestBody) {
    return !!reqBody.address;
}