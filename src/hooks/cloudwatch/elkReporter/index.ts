import { CloudWatchLogsLogEvent } from 'aws-lambda';

export const handler = async (
    event: CloudWatchLogsLogEvent
): Promise<void> => {
    console.log(event);
};