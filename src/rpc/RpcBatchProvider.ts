import DataLoader from "dataloader";
import { RpcProvider, type RpcProviderOptions, RPC, LibraryError, RpcChannel } from "starknet";
import type { DataLoaderOptions } from "../types";

import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";

/** Recursively copy `value`, sorting all plain-object keys. */
function deepSort<T>(value: T): T {
  if (Array.isArray(value)) return value.map(deepSort) as T;

  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.keys(value)
        .sort()
        .reduce<Record<string, unknown>>((o, k) => {
          o[k] = deepSort((value as any)[k]);
          return o;
        }, {}) as T;
  }
  return value;
}

/** First 10 hex chars of SHA-256 over the canonical JSON string. */
function playbackKey(payload: unknown): string {
  const bytes = sha256(utf8ToBytes(JSON.stringify(payload)));
  return bytesToHex(bytes).slice(0, 10);
}

type RpcRequest<T extends keyof RPC.Methods = keyof RPC.Methods> = {
  method: T;
  params: RPC.Methods[T]["params"];
};

export class RpcChannelBatch extends RpcChannel {
  private wait: number;
  private batchSize: number;
  // TODO: use correct type when exported from starknetjs
  private loader: DataLoader<RpcRequest, any /* RPC.ResponseBody[] */> | undefined;

  constructor({ batchInterval, maxBatchSize, ...optionsOrProvider }: DataLoaderOptions & RpcProviderOptions) {
    super(optionsOrProvider);
    this.wait = batchInterval ?? 0;
    this.batchSize = maxBatchSize ?? 20;
    this.loader = new DataLoader(this.batchRequests.bind(this), {
      batch: true,
      maxBatchSize: this.batchSize,
      cache: false, // Set cache to false if you don't want caching, or omit this line to enable caching
      batchScheduleFn: (cb) => setTimeout(cb, this.wait),
    });
  }

  // TODO: use correct type when exported from starknetjs
  private async batchRequests(requests: readonly RpcRequest[]): Promise<any /* RPC.ResponseBody[] */> {

    /* 1 · Create canonical request objects — keep the caller’s ids. */
    const canonicalRequests = requests.map(({ method, params }, i) => ({
      id: i,
      jsonrpc: "2.0",
      method,
      params: params ?? [],
    }));

    /* 2 · Sort the array so element order is deterministic. */
    canonicalRequests.sort((a, b) => a.method.localeCompare(b.method) || a.id - b.id);

    /* 3 · Canonical-JSON each object so key order is deterministic. */
    const bodyCanonical = deepSort(canonicalRequests);

    /* 4 · Stringify once — this exact string is what HAR matching uses. */
    const bodyString = JSON.stringify(bodyCanonical);

    /* 5 · Attach the deterministic header. */
    const extraHeaders = {
    ...(process.env.IS_PLAYWRIGHT === "true" && {"X-Playback-Key": playbackKey(bodyCanonical)}),
      ...(process.env.IS_PLAYWRIGHT === "true" && { IS_PLAYWRIGHT: "true" }),
    };

    const response = await fetch(this.nodeUrl, {
      method: "POST",
      body: bodyString,
      headers: { ...(this.headers as Record<string, string>), ...extraHeaders },
    });

    if (!response.ok) {
      const data = await response.text();
      throw new Error(`Failed to fetch, status: ${response.status}, body:\n${JSON.stringify(data)}`);
    }

    const responseErrorClone = response.clone();
    // TODO: use correct type when exported from starknetjs
    const data: any /* RPC.Response[] */ | unknown = await response.json().catch(async () => {
      const errorText = await responseErrorClone.text();
      throw new Error(
        `Failed to parse response as JSON

        method: POST
        url: ${this.nodeUrl}
        headers: ${JSON.stringify(this.headers)}
        requestBody: ${JSON.stringify(canonicalRequests)}
        responseBody:\n${JSON.stringify(errorText)}`
      );
    });

    if (!Array.isArray(data)) {
      throw new Error("unknown error");
    }
    const sortedData = data.sort((a, b) => a.id - b.id); // Sort the response to match the order of the requests

    return sortedData;
  }

  protected errorHandler(method: string, params: any, rpcError?: RPC.JRPC.Error, otherError?: any) {
    if (rpcError) {
      const { code, message, data } = rpcError;
      throw new LibraryError(
        `RPC: ${method} with params ${JSON.stringify(params)}\n ${code}: ${message}: ${JSON.stringify(data)}`
      );
    }
    if (otherError instanceof LibraryError) {
      throw otherError;
    }
    if (otherError) {
      throw Error(otherError.message);
    }
  }

  protected async fetchEndpoint<T extends keyof RPC.Methods>(
    method: T,
    params: RPC.Methods[T]["params"]
  ): Promise<RPC.Methods[T]["result"]> {
    const request = { method, params };
    const response = await (this.loader?.load(request) ?? this.batchRequests([request]).then((res) => res[0]));
    const { error, result } = response;
    this.errorHandler(error, params);
    return result;
  }
}

export class RpcBatchProvider extends RpcProvider {
  constructor({ batchInterval, maxBatchSize, ...optionsOrProvider }: DataLoaderOptions & RpcProviderOptions) {
    super({
      channel: new RpcChannelBatch({ batchInterval, maxBatchSize, ...optionsOrProvider }),
      ...optionsOrProvider,
    });
  }
}