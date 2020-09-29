import * as AWS from 'aws-sdk';
import * as googleMaps from '@google/maps';
import { getOrThrowEnv, ENV_VARS } from '../env';

const apiKeys = [
    'AIzaSyD4sjQUvz9jMu9C0rJO8nec-cjqPC-Im2E',
    'AIzaSyCZkDO6quk0SL5KtMsp8jGcKKH5e--lxBg',
    'AIzaSyDr5RQsmmBeksKtHOBNB3pZocYz09mWtWQ'
];

export interface GeocoderResponse {
    address: string,
    formattedAddress: string,
    lat: number,
    lng: number,
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

export const geocodeAddress = async (address: string, cacheTimeoutInDays?: number): Promise<GeocoderResponse | undefined> => {
    let result = await geocodeAddressFromCache(address, cacheTimeoutInDays);

    if (result) {
        console.log(`CACHE HIT for ${address}`);
    } else {
        console.log(`CACHE MISS for ${address}`);
        result = await geocodeAddressFromGoogle(address);
    }

    return result;
};

async function geocodeAddressFromCache(address: string, cacheTimeoutInDays?: number): Promise<GeocoderResponse | undefined> {
    console.log(getOrThrowEnv(ENV_VARS.TABLE_NAME));

    const docClient = getDocClient();
    const params = {
        TableName: getOrThrowEnv(ENV_VARS.TABLE_NAME),
        KeyConditionExpression: 'pk = :address',
        ExpressionAttributeValues: {
            ':address': `Address#${address.toLowerCase()}`
        }
    };

    let result: GeocoderResponse | undefined = undefined;
    try {
        const doc = await docClient.query(params).promise();
        const item = doc.Items ? doc.Items[0] : undefined;
        if (item && item.FullGeocoderResponseJSON && cachedItemValid(item.Timestamp, cacheTimeoutInDays)) {
            result = {
                address: (item.pk as string).split('#').slice(1).join('#'),
                formattedAddress: (item.sk as string).split('#').slice(1).join('#'),
                lat: item.Lat,
                lng: item.Lng,
                cacheHit: true
            };
        }
    } catch (error) {
        console.log(error);
    }

    return result;
}

function cachedItemValid(cacheTimestamp: number, cacheTimeoutInDays?: number) {
    const millisecondsPerDay = 8.64e+7;
    if (!cacheTimestamp) {
        return false;
    }

    if (!cacheTimeoutInDays) {
        return true;
    }

    const nowTime = new Date().getTime();
    const cachedTime = new Date(cacheTimestamp).getTime();
    const timeoutDate = cachedTime + (millisecondsPerDay * cacheTimeoutInDays);
    return nowTime < timeoutDate;
}

async function geocodeAddressFromGoogle(address: string): Promise<GeocoderResponse | undefined> {
    let result: GeocoderResponse | undefined = undefined;
    try {
        const response = await requestGeocode(address);
        if (response.json.status !== 'OK') {
            console.log(`Geocode not ok: ${JSON.stringify(response.json)}`);
            return;
        }

        const geocoderResult = response.json.results[0];
        const formattedAddress = geocoderResult.formatted_address.toLowerCase();
        const lat = geocoderResult.geometry.location.lat;
        const lng = geocoderResult.geometry.location.lng;

        await cacheGeocoderResult(address, formattedAddress, lat, lng, JSON.stringify(geocoderResult));

        result = {
            address,
            formattedAddress,
            lat,
            lng,
            cacheHit: false
        };
    } catch (error) {
        console.log(error);
    }

    return result;
}

function requestGeocode(address: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const client = googleMaps.createClient({
            key: apiKeys[Math.floor(Math.random() * apiKeys.length)]
        });
        client.geocode({ address }, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}

async function cacheGeocoderResult(address: string, formattedAddress: string, lat: number, lng: number, fullResponseJson: string): Promise<void> {
    const docClient = getDocClient();
    const params = {
        TableName: getOrThrowEnv(ENV_VARS.TABLE_NAME),
        Item: {
            pk: `Address#${address.toLowerCase()}`,
            sk: `FormattedAddress#${formattedAddress.toLowerCase()}`,
            Timestamp: new Date().getTime(),
            Lat: lat,
            Lng: lng,
            FullGeocoderResponseJSON: fullResponseJson,
        }
    };
    await docClient.put(params).promise();
}
