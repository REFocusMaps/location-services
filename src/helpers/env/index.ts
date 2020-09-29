export const ENV_VARS = {
    ENV: 'ENV',
    AWS_PROFILE: 'AWS_PROFILE',
    AWS_REGION: 'AWS_PROFILE',
    AWS_LOCAL_REGION: 'AWS_LOCAL_REGION',
    API_KEY_VALUE: 'API_KEY_VALUE',
    TABLE_NAME: 'TABLE_NAME',
    DYNAMO_ENDPOINT: 'DYNAMO_ENDPOINT',
    GIT_HASH: 'GIT_HASH',
};

export const getOrThrowEnv = (varName: string): string => {
    const v = process.env[varName];
    if (!v) {
        throw new Error(`${varName} not found in env!`);
    }
    return v;
};
