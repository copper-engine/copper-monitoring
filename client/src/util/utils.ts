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