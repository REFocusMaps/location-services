import { CloudWatchLogsEvent } from 'aws-lambda';
import * as zlib from 'zlib';

export const handler = async (
    event: CloudWatchLogsEvent
): Promise<void> => {
    const compressedPayload = Buffer.from(event.awslogs.data, 'base64');
    const jsonPayload = zlib.gunzipSync(compressedPayload).toString('utf8');
    console.log(jsonPayload);
    const payload = JSON.parse(jsonPayload);

    console.log(payload);
};