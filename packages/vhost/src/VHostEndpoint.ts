import {HTTPEndpoint, debugFn} from '@pallad/http-endpoint';
import vhost = require('vhost');
import * as express from 'express';

const debug = debugFn('vhost')

export class VHostEndpoint implements HTTPEndpoint {
	constructor(private vhost: string | RegExp, private endpoint: HTTPEndpoint) {
	}

	register(router: express.Router): void {
		debug(`Mounting vhost: ${this.vhost}`);
		const newRouter = express.Router({mergeParams: true});
		this.endpoint.register(newRouter);
		router.use(vhost(this.vhost, newRouter as unknown as vhost.Handler));
	}
}
