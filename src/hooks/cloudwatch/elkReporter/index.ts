import { CloudWatchLogsLogEvent } from 'aws-lambda';

export const handler = async (
    event: any
): Promise<void> => {
    const decodedPayload = Buffer.from(event.awslogs.data, 'base64').toString();
    console.log(decodedPayload);
};