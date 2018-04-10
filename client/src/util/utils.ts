import { ConnectionSettings } from '../models/connectionSettings';

export function parseBoolean(value: String) {
    if (value === 'true') {
        return true;
    }
    else if (value === 'false') {
        return false;
    }
    else {
        return null;
    }
}
export function parseSourceCode(srcCode: String) {
    let lines = srcCode.split('\n');
    let finalSrcCode: String = '';
    lines.forEach((line, index) => {
        finalSrcCode = finalSrcCode + String(index + 1) + ':  ' + line + '\n';
    });
    return finalSrcCode;
}
export function checkDuplicateConnection(newConnection: ConnectionSettings, currentConnections: ConnectionSettings[]) {
    let duplicate = false;
    for (let i = 0; i < currentConnections.length; i++) {
        if ((newConnection.host === currentConnections[i].host) && (newConnection.port === currentConnections[i].port)) {
            duplicate = true;
        }
    }
    return duplicate;
}