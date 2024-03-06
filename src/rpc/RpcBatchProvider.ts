import DataLoader from "dataloader";
import { RpcProvider, type RpcProviderOptions, RPC, LibraryError, Call, BlockIdentifier, RpcChannel } from "starknet";
import type { DataLoaderOptions } from "../types";

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
    const body = requests.map(({ method, params }, i) => ({
      method,
      params: params ?? [],
      jsonrpc: "2.0",
      id: i,
    }));

    const response = await fetch(this.nodeUrl, {
      method: "POST",
      body: JSON.stringify(body),
      headers: this.headers as Record<string, string>,
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
        requestBody: ${JSON.stringify(body)}
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
