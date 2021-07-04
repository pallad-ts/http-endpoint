import {AsyncFunctionEndpoint} from '@pallad/http-endpoint';
import * as express from 'express';
import {Probe} from './Probe';
import {Either, Validation} from 'monet';

export class HealthCheckEndpoint extends AsyncFunctionEndpoint {
	static DEFAULT_OPTIONS: HealthCheckEndpoint.Options = {
		healthyStatusCode: 200,
		unhealthyStatusCode: 503,
		defaultResponse: {ok: 1}
	};

	private probes: Map<string, Probe> = new Map();

	private options: HealthCheckEndpoint.Options;

	constructor(options?: HealthCheckEndpoint.Options.FromUser) {
		super(async (req: express.Request, res: express.Response) => {
			if (this.probes.size === 0) {
				res.status(this.options.healthyStatusCode);
				res.json(this.options.defaultResponse);
			} else {
				const probesResult = await this.getProbesResult();
				if (probesResult.isSuccess()) {
					res.status(this.options.healthyStatusCode);
					res.json(probesResult.success());
				} else {
					res.status(this.options.unhealthyStatusCode);
					res.json({
						errorMessage: probesResult.fail().message
					});
				}
			}
		});

		this.options = {
			...(options || {}),
			...HealthCheckEndpoint.DEFAULT_OPTIONS,
		};

		if (options?.probes) {
			for (const [name, probe] of options.probes.entries()) {
				this.addProbe(name, probe);
			}
		}
	}

	private async getProbesResult(): Promise<Validation<Error, Record<string, any>>> {
		const probesResult: Record<string, any> = {};

		for (const [name, probe] of this.probes.entries()) {
			const singleResult = await Either.fromPromise<any>(probe());
			if (singleResult.isLeft()) {
				return singleResult.toValidation();
			}
			probesResult[name] = singleResult.right();
		}
		return Validation.Success(probesResult);
	}

	addProbe(name: string, probe: Probe): this {
		this.probes.set(name, probe);
		return this;
	}
}

export namespace HealthCheckEndpoint {
	export interface Options {
		healthyStatusCode: number;
		unhealthyStatusCode: number;
		defaultResponse: any;
	}

	export namespace Options {
		export interface FromUser extends Partial<Options> {
			probes?: Map<string, Probe>;
		}
	}
}
