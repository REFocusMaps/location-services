import { logElkEvent, parseLoggedElkEvent } from '.';

describe('Log helper', () => {
    it('should pass', () => {
        console.log = jest.fn();
        logElkEvent('test event type', { test: 1, t: 'something' });
        // The first argument of the first call to the function was 'hello'
        const logString = '__ELK_JSON__:{"type":"test event type","data":{"test":1,"t":"something"}}';
        expect(console.log).toHaveBeenCalledWith(logString);

        const elkEvent = parseLoggedElkEvent(logString);
        expect(elkEvent.type).toEqual('test event type');
        expect(elkEvent.data.test).toEqual(1);
        expect(elkEvent.data.t).toEqual('something');
    });
});