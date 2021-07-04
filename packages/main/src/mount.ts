import * as express from 'express';
import {HTTPEndpoint} from './HTTPEndpoint';

export async function mount(app: express.Application, endpoints: HTTPEndpoint[]) {
	for (const endpoint of endpoints) {
		await endpoint.register(app);
	}
}
