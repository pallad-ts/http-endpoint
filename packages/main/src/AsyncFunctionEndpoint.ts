import {HTTPEndpoint} from './HTTPEndpoint';
import * as express from 'express';

const asyncHandler = require('express-async-handler')

export class AsyncFunctionEndpoint implements HTTPEndpoint {
	constructor(private handler: express.RequestHandler) {
	}

	register(router: express.Router): Promise<void> | void {
		router.use(asyncHandler(this.handler.bind(this)));
	}
}
