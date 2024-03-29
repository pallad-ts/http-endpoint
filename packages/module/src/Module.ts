import {Module as _Module, StandardActions} from '@pallad/modules';
import {HealthCheckEndpoint} from '@pallad/http-endpoint-health-check';
import {Container, Definition} from '@pallad/container';
import * as express from 'express';
import {AtPathEndpoint, HTTPEndpoint, mount} from '@pallad/http-endpoint';
import {annotation} from './annotation';
import * as http from 'http';
import {promisify} from 'util';
import * as https from 'https';
import {ErrorMapperBuilder} from '@pallad/error-mapper';
import {ErrorOutput} from "./ErrorOutput";
import {createErrorHandlerWithErrorMapper} from "./createErrorHandlerWithErrorMapper";

export class Module extends _Module<{ container: Container }> {
	private server?: http.Server;

	constructor(private options?: Module.Options) {
		super('@pallad/http-endpoint');
	}

	init() {
		const discoveryEnabled = this.options?.discoverEndpointsInContainer ?? true;

		this.registerAction(StandardActions.INITIALIZATION, ({container}) => {

			container.registerDefinition(
				Definition.useFactory(async () => {
					const app = express();

					const moduleEndpoints = this.createModuleEndpoints();
					const registeredEndpoints = discoveryEnabled ? await container.resolveByAnnotation<HTTPEndpoint, typeof annotation>(annotation.predicate) : [];

					const endpoints = [
						...moduleEndpoints,
						...registeredEndpoints.map(x => x[0])
					];

					this.dispatchAppEvent(this.options?.onBeforeSetupListeners, app);
					this.mountMiddlewares(app, this.options?.beforeMiddlewares || [])
					await mount(app, endpoints);
					this.mountMiddlewares(app, this.options?.afterMiddlewares || []);
					app.use(this.createErrorHandler());
					this.dispatchAppEvent(this.options?.onAfterSetupListeners, app);
					return app;
				}, this.serviceName)
			)
		});

		this.registerAction(StandardActions.APPLICATION_START, ({container}) => this.start(container));
		this.registerAction(StandardActions.APPLICATION_STOP, () => this.stop());
	}

	private dispatchAppEvent(listeners: Module.OnAppListener[] | undefined, app: express.Application) {
		if (listeners) {
			for (const listener of listeners) {
				listener(app);
			}
		}
	}

	private mountMiddlewares(app: express.Application, middlewares: express.RequestHandler[]) {
		for (const middleware of middlewares) {
			app.use(middleware);
		}
	}

	private get serviceName() {
		return 'HTTP_APP';
	}

	/**
	 * Starts server and the module
	 */
	async start(container: Container) {
		if (this.server) {
			throw new Error('The module has started already');
		}

		const app = await container.resolve<express.Application>(this.serviceName);
		const port = this.options?.port ?? 80;

		if (this.options?.tls) {
			this.server = https.createServer(this.options.tls, app)
				.listen(port, () => {
					for (const listener of (this.options?.onStartListeners || [])) {
						listener(port);
					}
				});
		} else {
			this.server = app.listen(port, () => {
				for (const listener of (this.options?.onStartListeners || [])) {
					listener(port);
				}
			});
		}
	}

	/**
	 * Stops server
	 */
	async stop() {
		if (!this.server) {
			throw new Error('The module has not started yet');
		}
		await promisify(this.server.close.bind(this.server))();
	}

	private createModuleEndpoints() {
		const endpoints: HTTPEndpoint[] = [];
		if (this.options?.healthCheck || this.options?.healthCheck === undefined) {
			endpoints.push(
				new AtPathEndpoint(
					this.options?.healthCheck?.path || '/_health',
					new HealthCheckEndpoint(this.options?.healthCheck)
				)
			);
		}
		return endpoints;
	}

	private createErrorHandler() {
		const errorMapperBuilder = this.options?.errorMapperBuilder ?? ErrorMapperBuilder.fromEnv<ErrorOutput>();
		return createErrorHandlerWithErrorMapper(errorMapperBuilder.get());
	}
}

export namespace Module {
	export interface Options {
		/**
		 * Port at which server starts
		 */
		port?: number;
		/**
		 * Health check config.
		 *
		 * Provide "false" to disable it
		 */
		healthCheck?: false | Options.HealthCheck,
		/**
		 * Customizes error mapper builder for error handling
		 */
		errorMapperBuilder?: ErrorMapperBuilder<ErrorOutput>,
		/**
		 * List of middlewares to register before endpoints
		 */
		beforeMiddlewares?: express.RequestHandler[];
		/**
		 * List of middlewares to register after endpoints but before error handler
		 */
		afterMiddlewares?: express.RequestHandler[];
		/**
		 * Listeners to call upon server start
		 */
		onStartListeners?: OnStartListener[];

		/**
		 * Callbacks to call before application setup
		 */
		onBeforeSetupListeners?: OnAppListener[];

		/**
		 * Callbacks to call after application setup
		 */
		onAfterSetupListeners?: OnAppListener[];

		/**
		 * Enabled endpoints discovery in dependency injection container
		 *
		 * Enabled by default.
		 */
		discoverEndpointsInContainer?: boolean;

		/**
		 * TLS options. Setting them makes app run through TLS
		 */
		tls?: https.ServerOptions
	}

	export namespace Options {
		export interface HealthCheck extends HealthCheckEndpoint.Options.FromUser {
			/**
			 * Health check path. Default: "_health"
			 */
			path?: string;
		}
	}

	export type OnStartListener = (port: number) => void;

	export type OnAppListener = (app: express.Application) => void;
}
