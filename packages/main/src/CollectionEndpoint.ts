import {HTTPEndpoint} from './HTTPEndpoint';
import * as express from 'express';

export class CollectionEndpoint implements HTTPEndpoint {
	constructor(private endpoints: HTTPEndpoint[]) {
	}

	async register(router: express.Router): Promise<void> {
		const newRouter = express.Router({mergeParams: true});

		for (const endpoint of this.endpoints) {
			await endpoint.register(newRouter);
		}

		router.use(newRouter);
	}
}
