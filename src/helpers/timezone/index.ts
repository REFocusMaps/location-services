import * as AWS from 'aws-sdk';
import * as googleMaps from '@google/maps';
import { geocodeAddress } from '../geocoder';
import { getOrThrowEnv, ENV_VARS } from '../env';

AWS.config.update({ region: 'us-east-1' });

const apiKeys = [
    'AIzaSyAYv3Dkn4JdZes4a1ViSfHrrXDda1PyAI8',
];

export interface TimeZoneResponse {
    address: string,
    formattedAddress: string,
    timeZoneId: string,
    cacheHit: boolean,
}

function getDocClient(): AWS.DynamoDB.DocumentClient {
    let docClient;
    if (getOrThrowEnv(ENV_VARS.ENV) === 'local') {
        AWS.config.update({ region: getOrThrowEnv(ENV_VARS.AWS_LOCAL_REGION) });
        docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', endpoint: getOrThrowEnv(ENV_VARS.DYNAMO_ENDPOINT) });
    } else {
        docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
    }
    return docClient;
}

export const getTimeZoneForAddress = async (address: string): Promise<TimeZoneResponse | undefined> => {
    let result = await getTimeZoneFromCache(address);

    if (result) {
        console.log(`CACHE HIT for ${address}`);
    } else {
        console.log(`CACHE MISS for ${address}`);
        result = await getTimeZoneFromGoogle(address);
    }

    return result;
};

async function getTimeZoneFromCache(address: string): Promise<TimeZoneResponse | undefined> {
    const docClient = getDocClient();

    const params = {
        TableName: getOrThrowEnv(ENV_VARS.TABLE_NAME),
        KeyConditionExpression: 'pk = :address',
        ExpressionAttributeValues: {
            ':address': `Address#${address.toLowerCase()}`
        }
    };

    let result: TimeZoneResponse | undefined = undefined;
    try {
        const doc = await docClient.query(params).promise();
        const item = doc.Items ? doc.Items[0] : undefined;
        if (item && item.TimeZoneId) {
            result = {
                address: (item.pk as string).split('#').slice(1).join('#'),
                formattedAddress: (item.sk as string).split('#').slice(1).join('#'),
                timeZoneId: item.TimeZoneId,
                cacheHit: true
            };
        }
    } catch (error) {
        console.log(error);
    }

    return result;
}

async function getTimeZoneFromGoogle(address: string): Promise<TimeZoneResponse | undefined> {
    let result: TimeZoneResponse | undefined = undefined;

    const geocodeResult = await geocodeAddress(address);
    if (!geocodeResult) {
        console.log(`No geocode result for ${address}`);
        return;
    }

    try {
        const response = await requestTimeZone(geocodeResult.lat, geocodeResult.lng);
        const timeZoneResult = response.json;
        if (timeZoneResult.status !== 'OK') {
            console.log(`Timezone not ok: ${JSON.stringify(response.json)}`);
            return;
        }

        await cacheTimeZoneResult(address, geocodeResult.formattedAddress, timeZoneResult.timeZoneId, JSON.stringify(timeZoneResult));

        result = {
            address,
            formattedAddress: geocodeResult.formattedAddress,
            timeZoneId: timeZoneResult.timeZoneId,
            cacheHit: false
        };
    } catch (error) {
        console.log(error);
    }

    return result;
}

function requestTimeZone(lat: number, lng: number): Promise<any> {
    return new Promise((resolve, reject) => {
        const client = googleMaps.createClient({
            key: apiKeys[Math.floor(Math.random() * apiKeys.length)]
        });
        client.timezone({
            location: {
                lat,
                lng,
            },
            timestamp: new Date().getTime() / 1000
        }, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}

async function cacheTimeZoneResult(address: string, formattedAddress: string, timeZoneId: string, fullResponseJson: string): Promise<void> {
    const docClient = getDocClient();

    const params = {
        TableName: getOrThrowEnv(ENV_VARS.TABLE_NAME),
        Key: {
            pk: `Address#${address.toLowerCase()}`,
            sk: `FormattedAddress#${formattedAddress.toLowerCase()}`
        },
        UpdateExpression: 'set #timeZoneId = :timeZoneId, #fullResponseJson = :fullResponseJson',
        ExpressionAttributeNames: {
            '#timeZoneId': 'TimeZoneId',
            '#fullResponseJson': 'FullTimeZoneResponseJSON'
        },
        ExpressionAttributeValues: {
            ':timeZoneId': timeZoneId,
            ':fullResponseJson': fullResponseJson
        }
    };
    await docClient.update(params).promise();
}


// {
//     "dstOffset": 0,
//     "rawOffset": -28800,
//     "status": "OK",
//     "timeZoneId": "America/Los_Angeles",
//     "timeZoneName": "Pacific Standard Time"
//  }