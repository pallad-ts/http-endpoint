import {ErrorMapperBuilder} from './ErrorMapperBuilder';
import * as express from 'express';

export function createErrorHandler(errorMapper: ErrorMapperBuilder.Mapper | ErrorMapperBuilder) {
	const finalErrorMapper = errorMapper instanceof ErrorMapperBuilder ? errorMapper.get() : errorMapper;

	return (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
		const errorOutput = finalErrorMapper(err);

		res.status(errorOutput.statusCode);
		if (errorOutput.headers) {
			for (const [headerName, headerValue] of Object.entries(errorOutput.headers)) {
				res.header(headerName, headerValue as any);
			}
		}
		res.json(errorOutput.payload);
	}
}
