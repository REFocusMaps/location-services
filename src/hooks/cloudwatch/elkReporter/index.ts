import { CloudWatchLogsEvent, CloudWatchLogsDecodedData, CloudWatchLogsLogEvent } from 'aws-lambda';
import * as zlib from 'zlib';
import { Client } from '@elastic/elasticsearch';

const { API_STAGE, GIT_HASH, ELASTIC_URL, ELASTIC_USER, ELASTIC_PASS } = process.env;
const elasticClient = getElasticClient();

export const handler = async (
    event: CloudWatchLogsEvent
): Promise<void> => {
    const compressedPayload = Buffer.from(event.awslogs.data, 'base64');
    const jsonPayload = zlib.gunzipSync(compressedPayload).toString('utf8');
    const payload: CloudWatchLogsDecodedData = JSON.parse(jsonPayload);

    const serviceName = payload.logGroup.split('/').slice(-1)[0];

    Promise.all(payload.logEvents.map(async (logEvent: CloudWatchLogsLogEvent) => {
        if (logEvent.message.includes('START RequestId') || logEvent.message.includes('END RequestId')) {
            // We dont need to report these messages as they contain no useful information
            return;
        }
        const timestamp = new Date(logEvent.timestamp);
        const messageParts = logEvent.message.split('\t');
        const logMessage = messageParts.slice(3).join('\t');
        console.log(`Timestamp: ${timestamp.toISOString()}`);

        if (logEvent.message.includes('REPORT RequestId')) {
            const eventData = messageParts.reduce((acc: any, curr) => {
                if (curr.includes('Init Duration')) {
                    acc.initDuration = curr.split(' ')[2];
                } else if (curr.includes('Billed Duration')) {
                    acc.billedDuration = curr.split(' ')[2];
                } else if (curr.includes('Duration')) {
                    acc.runDuration = curr.split(' ')[2];
                } else if (curr.includes('Max Memory Used')) {
                    acc.maxMemUsed = curr.split(' ')[2];
                }
                return acc;
            }, {});
            console.log(eventData);
            await reportEvent(serviceName, timestamp, 'Invoke Report', eventData);
        } else if (logEvent.message.includes('__ELK_JSON__:')) {
            const elkJson = logMessage.split(':')[1];
            const elkEventData = JSON.parse(elkJson);
            await reportEvent(serviceName, timestamp, elkEventData.type, elkEventData.data);
        } else {
            await reportLog(serviceName, timestamp, logMessage);
        }

        return;
    }));
};

function getElasticClient(): Client | undefined {
    if (!(ELASTIC_URL && ELASTIC_USER && ELASTIC_PASS)) {
        console.log('CANNOT START ELASTIC CLIENT');
        console.log('Missing required env vars ELASTIC_URL | ELASTIC_USER | ELASTIC_PASS');
        return;
    }

    const client = new Client({
        node: ELASTIC_URL,
        auth: {
            username: ELASTIC_USER,
            password: ELASTIC_PASS,
        },
    });

    return client;
}

async function reportLog(serviceName: string, timestamp: Date, message: string): Promise<void> {
    try {
        const client = getElasticClient();
        client && await client.index({
            index: `${serviceName}_log`,
            body: {
                timestamp: timestamp.toISOString(),
                message,
            },
        });
    } catch (error) {
        console.log(error);
    }
}

async function reportEvent(serviceName: string, timestamp: Date, eventType: string, data: any): Promise<void> {
    try {
        const client = getElasticClient();
        client && await client.index({
            index: `${serviceName}_event`,
            body: {
                type: eventType,
                timestamp: timestamp.toISOString(),
                data,
            },
        });
    } catch (error) {
        console.log(error);
    }
}
[
    '2020-10-01T01:43:21.724Z',
    '94e7582d-8036-4f2f-b2d3-3c1d93959f32',
    'INFO',
    'CACHE HIT for 662 forestdale rd, royal oak, mi\n'
]

[
    'REPORT RequestId: 94e7582d-8036-4f2f-b2d3-3c1d93959f32',
    'Init Duration: 391.78 ms',
    'Billed Duration: 200 ms',
    'Duration: 103.70 ms',
    'Memory Size: 1024 MB',
    'Max Memory Used: 88 MB',
    '\n'
]