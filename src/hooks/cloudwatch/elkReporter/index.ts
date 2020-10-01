import { CloudWatchLogsEvent, CloudWatchLogsDecodedData, CloudWatchLogsLogEvent } from 'aws-lambda';
import * as zlib from 'zlib';

export const handler = async (
    event: CloudWatchLogsEvent
): Promise<void> => {
    const compressedPayload = Buffer.from(event.awslogs.data, 'base64');
    const jsonPayload = zlib.gunzipSync(compressedPayload).toString('utf8');
    const payload: CloudWatchLogsDecodedData = JSON.parse(jsonPayload);

    const service = payload.logGroup.split('/').slice(-1)
    Promise.all(payload.logEvents.map(async (logEvent: CloudWatchLogsLogEvent) => {
        if (logEvent.message.includes('START RequestId') || logEvent.message.includes('END RequestId')) {
            // We dont need to report these messages as they contain no useful information
            return;
        }
        const timestamp = new Date(logEvent.timestamp);
        console.log(`Timestamp: ${timestamp.toISOString()}`);

        if (logEvent.message.includes('REPORT RequestId')) {
            const messageParts = logEvent.message.split('\t');
            console.log(messageParts);
        } else {
            const messageParts = logEvent.message.split('\t');
            console.log(messageParts);
        }
        return;
    }));
};