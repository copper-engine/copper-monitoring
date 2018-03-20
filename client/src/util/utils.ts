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