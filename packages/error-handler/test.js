const stackTrace = require('stack-trace');

const err = new Error('test');
console.log(stackTrace.parse(err));
