export function buildResponse(statusCode: number, body: any) {
    return {
        headers: {
            'Access-Control-Expose-Headers': 'x-api-key',
            'Access-Control-Allow-Headers': 'Content-Type,Host,x-api-key',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST',
        },
        statusCode,
        body: typeof body === 'string' ? body : JSON.stringify(body),
    };
}