import * as express from 'express';

export interface HTTPEndpoint {
	register(router: express.Router): Promise<void> | void;
}
