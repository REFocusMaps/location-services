import { CloudWatchLogsEvent, CloudWatchLogsDecodedData, CloudWatchLogsLogEvent } from 'aws-lambda';
import * as zlib from 'zlib';
import { Client } from '@elastic/elasticsearch';

const { ELASTIC_URL, ELASTIC_USER, ELASTIC_PASS } = process.env;

const elasticClient = getElasticClient();

interface InvokeReport {
    initDuration?: string;
    billedDuration?: string;
    runDuration?: string;
    maxMemUsed?: string;
}

export const handler = async (
    event: CloudWatchLogsEvent
): Promise<void> => {
    const compressedPayload = Buffer.from(event.awslogs.data, 'base64');
    const jsonPayload = zlib.gunzipSync(compressedPayload).toString('utf8');
    const payload: CloudWatchLogsDecodedData = JSON.parse(jsonPayload);

    const serviceName = payload.logGroup.split('/').slice(-1)[0];

    await Promise.all(payload.logEvents.map(async (logEvent: CloudWatchLogsLogEvent) => {
        if (logEvent.message.includes('START RequestId') || logEvent.message.includes('END RequestId')) {
            // We dont need to report these messages as they contain no useful information
            return;
        }
        const timestamp = new Date(logEvent.timestamp);
        const messageParts = logEvent.message.split('\t');
        const logMessage = messageParts.slice(3).join('\t');

        if (logEvent.message.includes('REPORT RequestId')) {
            const eventData = messageParts.reduce((acc: InvokeReport, curr) => {
                if (curr.includes('Init Duration')) {
                    acc.initDuration = curr.split(' ').slice(-2, -1)[0];
                } else if (curr.includes('Billed Duration')) {
                    acc.billedDuration = curr.split(' ').slice(-2, -1)[0];
                } else if (curr.includes('Duration')) {
                    acc.runDuration = curr.split(' ').slice(-2, -1)[0];
                } else if (curr.includes('Max Memory Used')) {
                    acc.maxMemUsed = curr.split(' ').slice(-2, -1)[0];
                }
                return acc;
            }, {});
            await reportEvent(serviceName, timestamp, 'Invoke Report', eventData);
        } else if (logEvent.message.includes('__ELK_JSON__:')) {
            const elkJson = logMessage.split('__ELK_JSON__:')[1];
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
        if (elasticClient) {
            await elasticClient.index({
                index: `${serviceName}_log`,
                body: {
                    timestamp: timestamp.toISOString(),
                    message,
                },
            });
        }
    } catch (error) {
        console.log(error);
    }
}

async function reportEvent(serviceName: string, timestamp: Date, eventType: string, data: any): Promise<void> {
    try {
        if (elasticClient) {
            await elasticClient.index({
                index: `${serviceName}_event`,
                body: {
                    type: eventType,
                    timestamp: timestamp.toISOString(),
                    data,
                },
            });
        }
    } catch (error) {
        console.log(error);
    }
}
