import {ErrorOutput as BaseErrorOutput} from '@pallad/error-mapper';

export interface ErrorOutput extends BaseErrorOutput {
	statusCode: number;
	headers?: { [header: string]: string | string[] | number | undefined }
}
