export interface ElkEvent {
    type: string,
    data: any
}

export function logElkEvent(eventType: string, data: any): void {
    const elkEventObj: ElkEvent = {
        type: eventType,
        data
    };

    const logStr = `__ELK_JSON__:${JSON.stringify(elkEventObj)}`;
    console.log(logStr);
}

export function parseLoggedElkEvent(logStr: string): ElkEvent {
    const elkJson = logStr.split('__ELK_JSON__:')[1];
    const elkEventData: ElkEvent = JSON.parse(elkJson);
    return elkEventData;
}