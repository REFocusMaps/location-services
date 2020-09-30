import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { geocodeAddress } from '../../helpers/geocoder';

interface RequestBody {
    address: string,
}

export const handler = async (
    event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
    const eventBody: RequestBody = JSON.parse(event.body || '{}');

    const requestValid = isRequestValid(eventBody);
    if (!requestValid) {
        console.log(`Invalid request body: ${event.body}`);
        return {
            statusCode: 400,
            body: `Invalid request body: ${event.body}`
        };
    }

    try {
        const result = await geocodeAddress(eventBody.address);
        if (result) {
            return {
                statusCode: 200,
                body: JSON.stringify(result),
            };
        } else {
            return {
                statusCode: 500,
                body: `Could not geocode address ${eventBody.address}`
            };
        }
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: error.message
        };
    }
};

function isRequestValid(reqBody: RequestBody) {
    return !!reqBody.address;
}