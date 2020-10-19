import { type } from "os";

export function buildResponse(statusCode: number, body: any) {
    return {
        headers: {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST',
        },
        statusCode,
        body: typeof body === 'string' ? body : JSON.stringify(body),
    };
}