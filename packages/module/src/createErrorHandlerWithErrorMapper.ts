import {ErrorMapper} from '@pallad/error-mapper';
import {ErrorOutput} from "./ErrorOutput";
import * as express from "express";

export function createErrorHandlerWithErrorMapper(errorMapper: ErrorMapper<ErrorOutput>) {

	return (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
		const {statusCode, headers, ...payload} = errorMapper(err);

		res.status(statusCode);
		if (headers) {
			for (const [headerName, headerValue] of Object.entries(headers)) {
				res.header(headerName, headerValue as any);
			}
		}

		res.json(payload);
	}
}
