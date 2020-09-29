import { APIGatewayEvent } from 'aws-lambda';
import { getTimeZoneForAddress } from '../../helpers/timezone';

interface RequestBody {
    address: string,
}

export const handler = async (
    event: APIGatewayEvent
): Promise<any> => {
    const eventBody: RequestBody = JSON.parse(event.body || '{}');

    const requestValid = isRequestValid(eventBody);
    if (!requestValid) {
        console.log(`Invalid request body: ${JSON.stringify(event.body)}`);
        return {
            statusCode: 400
        };
    }

    try {
        const result = await getTimeZoneForAddress(eventBody.address);
        if (result) {
            return {
                statusCode: 200,
                body: JSON.stringify(result),
            };
        } else {
            return {
                statusCode: 500,
                body: `Could not get timezone for address ${eventBody.address}`
            };
        }
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
        };
    }
};

function isRequestValid(reqBody: RequestBody) {
    return !!reqBody.address;
}