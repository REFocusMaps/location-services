import { getTimeZoneForAddress } from '.';

describe('Time Zone', () => {
    it('should get the result from the cache if available and not expired', async () => {
        // const address = '10229 longford, south lyon, michigan 48178';
        // const result = await getTimeZoneForAddress(address, true);
        // console.log(result);
        // TODO: Figure out how to mock dynamo doc client get
    });

    // it('should get the result from google if nothing is cached', async () => {
        // TODO: Figure out how to mock google client
    // });

    // it('should get the result from google if the cached item has expired', async () => {
 // TODO: Figure out how to mock google client
    // });

    // it('should store the address and results in the cache if fetched from google', async () => {
// TODO: Figure out how to mock dynamo doc client put
    // });
});