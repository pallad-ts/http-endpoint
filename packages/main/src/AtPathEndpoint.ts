import {HTTPEndpoint} from './HTTPEndpoint';
import * as express from 'express';
import {debugFn} from './debugFn';

const debug = debugFn();

export class AtPathEndpoint implements HTTPEndpoint {
	constructor(private path: string, private endpoint: HTTPEndpoint) {
	}

	async register(router: express.Router): Promise<void> {
		const subRouter = express.Router({mergeParams: true});

		debug(`Mounting endpoint at path: ${this.path}`);
		await this.endpoint.register(subRouter);
		router.use(this.path, subRouter);
	}
}
