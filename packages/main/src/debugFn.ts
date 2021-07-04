import debugModule = require('debug');

export function debugFn(suffix?: string) {
	return debugModule('http-endpoint' + (suffix ? ':' + suffix : ''));
}
