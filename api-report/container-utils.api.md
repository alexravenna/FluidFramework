## API Report File for "@fluidframework/container-utils"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { DataCorruptionError } from '@fluidframework/telemetry-utils';
import { DataProcessingError } from '@fluidframework/telemetry-utils';
import { EventForwarder } from '@fluid-internal/client-utils';
import { extractSafePropertiesFromMessage } from '@fluidframework/telemetry-utils';
import { GenericError } from '@fluidframework/telemetry-utils';
import { IClientConfiguration } from '@fluidframework/protocol-definitions';
import { IClientDetails } from '@fluidframework/protocol-definitions';
import { IDeltaManager } from '@fluidframework/container-definitions';
import { IDeltaManagerEvents } from '@fluidframework/container-definitions';
import { IDeltaQueue } from '@fluidframework/container-definitions';
import { IDeltaSender } from '@fluidframework/container-definitions';
import { IDocumentMessage } from '@fluidframework/protocol-definitions';
import { IFluidErrorBase } from '@fluidframework/telemetry-utils';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { ISignalMessage } from '@fluidframework/protocol-definitions';
import { ITelemetryLoggerExt } from '@fluidframework/telemetry-utils';
import { IThrottlingWarning } from '@fluidframework/core-interfaces';
import { LoggingError } from '@fluidframework/telemetry-utils';
import { ReadOnlyInfo } from '@fluidframework/container-definitions';
import { UsageError } from '@fluidframework/telemetry-utils';

// @public @deprecated
export class ClientSessionExpiredError extends LoggingError implements IFluidErrorBase {
    constructor(message: string, expiryMs: number);
    // (undocumented)
    readonly errorType: "clientSessionExpiredError";
    // (undocumented)
    readonly expiryMs: number;
}

export { DataCorruptionError }

export { DataProcessingError }

// @public @deprecated
export class DeltaManagerProxyBase extends EventForwarder<IDeltaManagerEvents> implements IDeltaManager<ISequencedDocumentMessage, IDocumentMessage> {
    constructor(deltaManager: IDeltaManager<ISequencedDocumentMessage, IDocumentMessage>);
    // (undocumented)
    get active(): boolean;
    // (undocumented)
    get clientDetails(): IClientDetails;
    // (undocumented)
    protected readonly deltaManager: IDeltaManager<ISequencedDocumentMessage, IDocumentMessage>;
    // (undocumented)
    dispose(): void;
    // (undocumented)
    flush(): void;
    // (undocumented)
    get hasCheckpointSequenceNumber(): boolean;
    // (undocumented)
    get IDeltaSender(): IDeltaSender;
    // (undocumented)
    get inbound(): IDeltaQueue<ISequencedDocumentMessage>;
    // (undocumented)
    get inboundSignal(): IDeltaQueue<ISignalMessage>;
    // (undocumented)
    get initialSequenceNumber(): number;
    // (undocumented)
    get lastKnownSeqNumber(): number;
    // (undocumented)
    get lastMessage(): ISequencedDocumentMessage | undefined;
    // (undocumented)
    get lastSequenceNumber(): number;
    // (undocumented)
    get maxMessageSize(): number;
    // (undocumented)
    get minimumSequenceNumber(): number;
    // (undocumented)
    get outbound(): IDeltaQueue<IDocumentMessage[]>;
    // (undocumented)
    get readOnlyInfo(): ReadOnlyInfo;
    // (undocumented)
    get serviceConfiguration(): IClientConfiguration | undefined;
    // (undocumented)
    submitSignal(content: any): void;
    // (undocumented)
    get version(): string;
}

export { extractSafePropertiesFromMessage }

export { GenericError }

// @public @deprecated
export class ThrottlingWarning extends LoggingError implements IThrottlingWarning, IFluidErrorBase {
    // (undocumented)
    readonly errorType: "throttlingError";
    // (undocumented)
    readonly retryAfterSeconds: number;
    static wrap(error: unknown, retryAfterSeconds: number, logger: ITelemetryLoggerExt): IThrottlingWarning;
}

export { UsageError }

```