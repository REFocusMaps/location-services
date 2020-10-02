export function logElkEvent(eventType: string, data: any): void {
    const elkEventObj = {
        type: eventType,
        data
    };

    const logStr = `__ELK_JSON__:${JSON.stringify(elkEventObj)}`;
    console.log(logStr);
}