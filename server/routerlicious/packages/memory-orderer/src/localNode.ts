/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import assert from "assert";
import { EventEmitter } from "events";

import type { IDocumentMessage } from "@fluidframework/protocol-definitions";
import {
	type IDatabaseManager,
	type IDocumentStorage,
	type INode,
	type IOrderer,
	type IOrdererConnection,
	type IWebSocketServer,
	type ILogger,
	DefaultServiceConfiguration,
	type IDocumentRepository,
	type ICheckpointRepository,
	type CheckpointService,
} from "@fluidframework/server-services-core";
import { Lumberjack, getLumberBaseProperties } from "@fluidframework/server-services-telemetry";
import * as _ from "lodash";
import sillyname from "sillyname";
import { v4 as uuid } from "uuid";

import { debug } from "./debug";
import type {
	IConcreteNode,
	IConnectedMessage,
	IConnectMessage,
	INodeMessage,
	IOpMessage,
} from "./interfaces";
import { LocalOrderer } from "./localOrderer";
import type { ISubscriber } from "./pubsub";
import { Socket } from "./socket";

// Can I treat each Alfred as a mini-Kafka. And consolidate all the deli logic together?
// Rather than creating one per? I'm in some ways on this path.

class RemoteSubscriber implements ISubscriber {
	public id = uuid();

	constructor(private readonly socket: Socket<INodeMessage>) {}

	public send(topic: string, event: string, ...args: any[]): void {
		const opMessage: IOpMessage = {
			data: args,
			op: event,
			topic,
		};

		const message: INodeMessage = {
			cid: -1,
			payload: opMessage,
			type: "op",
		};

		this.socket.send(message);
	}
}

// Local node manages maintaining the reservation. As well as handling managing the local orderers.
// Messages sent to it are directly routed.
export class LocalNode extends EventEmitter implements IConcreteNode {
	public static async connect(
		id: string,
		address: string,
		storage: IDocumentStorage,
		databaseManager: IDatabaseManager,
		documentRepository: IDocumentRepository,
		deliCheckpointRepository: ICheckpointRepository,
		scribeCheckpointRepository: ICheckpointRepository,
		deliCheckpointService: CheckpointService,
		scribeCheckpointService: CheckpointService,
		timeoutLength: number,
		webSocketServerFactory: () => IWebSocketServer,
		maxMessageSize: number,
		logger: ILogger,
	) {
		// Look up any existing information for the node or create a new one
		const node = await LocalNode.create(id, address, databaseManager, timeoutLength);

		return new LocalNode(
			webSocketServerFactory,
			node,
			storage,
			databaseManager,
			documentRepository,
			deliCheckpointRepository,
			scribeCheckpointRepository,
			deliCheckpointService,
			scribeCheckpointService,
			timeoutLength,
			maxMessageSize,
			logger,
		);
	}

	private static async create(
		id: string,
		address: string,
		databaseManager: IDatabaseManager,
		timeoutLength: number,
	): Promise<INode> {
		debug("Creating node", id);
		Lumberjack.debug(`Creating node: ${id}`);

		const nodeCollection = await databaseManager.getNodeCollection();
		const node = {
			_id: id,
			address,
			expiration: Date.now() + timeoutLength,
		};
		await nodeCollection.insertOne(node);

		return node;
	}

	private static async updateExpiration(
		existing: INode,
		databaseManager: IDatabaseManager,
		timeoutLength: number,
	): Promise<INode> {
		const nodeCollection = await databaseManager.getNodeCollection();
		const newExpiration = Date.now() + timeoutLength;

		await nodeCollection.update(
			{
				_id: existing._id,
				expiration: existing.expiration,
			},
			{
				expiration: newExpiration,
			},
			null,
		);

		// eslint-disable-next-line import/namespace
		const result = _.clone(existing);
		result.expiration = newExpiration;

		return result;
	}

	public get id(): string {
		return this.node._id;
	}

	public readonly valid = true;

	private readonly webSocketServer: IWebSocketServer;
	private readonly orderMap = new Map<string, LocalOrderer>();
	private readonly connectionMap = new Map<number, IOrdererConnection>();

	private constructor(
		private readonly webSocketServerFactory: () => IWebSocketServer,
		private node: INode,
		private readonly storage: IDocumentStorage,
		private readonly databaseManager: IDatabaseManager,
		private readonly documentRepository: IDocumentRepository,
		private readonly deliCheckpointRepository: ICheckpointRepository,
		private readonly scribeCheckpointRepository: ICheckpointRepository,
		private readonly deliCheckpointService: CheckpointService,
		private readonly scribeCheckpointService: CheckpointService,
		private readonly timeoutLength: number,
		private readonly maxMessageSize: number,
		private readonly logger: ILogger,
	) {
		super();

		// Schedule the first heartbeat to update the reservation
		this.scheduleHeartbeat();

		// Start up the peer-to-peer socket server to listen to inbound messages
		this.webSocketServer = this.webSocketServerFactory();

		// Connections will arrive from remote nodes
		this.webSocketServer.on("connection", (wsSocket, request) => {
			debug(`New inbound web socket connection ${request.url}`);
			Lumberjack.debug(`New inbound web socket connection ${request.url}`);
			const socket = new Socket<INodeMessage>(wsSocket);
			const subscriber = new RemoteSubscriber(socket);

			// Messages will be inbound from the remote server
			socket.on("message", (message) => {
				switch (message.type) {
					case "connect": {
						const connectMessage = message.payload as IConnectMessage;
						const fullId = `${connectMessage.tenantId}/${connectMessage.documentId}`;
						const orderer = this.orderMap.get(fullId);
						assert(orderer);

						// Create a new socket and bind it to a relay on the node
						const connection = orderer.connectInternal(
							subscriber,
							(sillyname() as string).toLowerCase().split(" ").join("-"),
							connectMessage.client,
						);

						connection.connect().catch((err) => {
							Lumberjack.error(
								"Error handling connect message",
								{
									...getLumberBaseProperties(
										connectMessage.documentId,
										connectMessage.tenantId,
									),
								},
								err,
							);
						});

						// Need to subscribe to both channels. Then broadcast subscription across pipe
						// on receiving a message
						this.connectionMap.set(message.cid, connection);

						// Emit connected message
						const connected: IConnectedMessage = {
							clientId: connection.clientId,
							existing: true,
							maxMessageSize: this.maxMessageSize,
							serviceConfiguration: DefaultServiceConfiguration,
						};
						socket.send({ cid: message.cid, type: "connected", payload: connected });

						break;
					}

					case "disconnect": {
						const connection = this.connectionMap.get(message.cid);
						assert(connection);
						connection.disconnect().catch((err) => {
							Lumberjack.error("Error handling disconnect message", undefined, err);
						});
						this.connectionMap.delete(message.cid);

						break;
					}

					case "order": {
						const orderMessage = message.payload as IDocumentMessage;
						const connection = this.connectionMap.get(message.cid);
						assert(connection);
						connection.order([orderMessage]).catch((err) => {
							Lumberjack.error("Error handling order message", undefined, err);
						});
						break;
					}

					default:
						break;
				}
			});
		});

		this.webSocketServer.on("error", (error) => {
			debug("wss error", error);
			Lumberjack.error("wss error", undefined, error);
		});
	}

	public async connectOrderer(tenantId: string, documentId: string): Promise<IOrderer> {
		const fullId = `${tenantId}/${documentId}`;
		// Our node is responsible for sequencing messages
		debug(`${this.id} Becoming leader for ${fullId}`);
		Lumberjack.debug(`${this.id} Becoming leader for ${fullId}`);
		const orderer = await LocalOrderer.load(
			this.storage,
			this.databaseManager,
			tenantId,
			documentId,
			this.logger,
			this.documentRepository,
			this.deliCheckpointRepository,
			this.scribeCheckpointRepository,
			this.deliCheckpointService,
			this.scribeCheckpointService,
		);
		assert(!this.orderMap.has(fullId));
		this.orderMap.set(fullId, orderer);

		return orderer;
	}

	private scheduleHeartbeat() {
		const now = Date.now();

		// Check to see if we can even renew at this point
		if (now > this.node.expiration) {
			// Have lost the node. Need to shutdown everything and close down
			debug(`${this.node._id} did not renew before expiration`);
			Lumberjack.debug(`${this.node._id} did not renew before expiration`);
			this.emit("expired");

			// TODO close the web socket server
		} else {
			// Schedule a heartbeat at the midpoint of the timeout length
			const targetTime = this.node.expiration - this.timeoutLength / 2;
			const delta = Math.max(0, targetTime - Date.now());

			setTimeout(() => {
				const updateP = LocalNode.updateExpiration(
					this.node,
					this.databaseManager,
					this.timeoutLength,
				);
				updateP
					.then((newNode) => {
						// Debug(`Successfully renewed expiration for ${this.node._id}`);
						this.node = newNode;
						this.scheduleHeartbeat();
					})
					.catch((error) => {
						// Try again immediately.
						debug(`Failed to renew expiration for ${this.node._id}`, error);
						Lumberjack.error(
							`Failed to renew expiration for ${this.node._id}`,
							undefined,
							error,
						);
						this.scheduleHeartbeat();
					});
			}, delta);
		}
	}
}
