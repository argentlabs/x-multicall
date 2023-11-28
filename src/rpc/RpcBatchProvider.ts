import DataLoader from "dataloader";
import { RpcProvider, type RpcProviderOptions, type RPC } from "starknet";
import type { DataLoaderOptions } from "../types";

type RpcRequest<T extends keyof RPC.Methods = keyof RPC.Methods> = {
  method: T;
  params: RPC.Methods[T]["params"];
};

export class RpcBatchProvider extends RpcProvider {
  private wait: number;
  private batchSize: number;
  private loader: DataLoader<RpcRequest, RPC.Response> | undefined;

  constructor({
    batchInterval,
    maxBatchSize,
    ...optionsOrProvider
  }: DataLoaderOptions & RpcProviderOptions) {
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

  private async batchRequests(
    requests: readonly RpcRequest[]
  ): Promise<RPC.Response[]> {
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
      throw new Error(
        `Failed to fetch, status: ${response.status}, body:\n${JSON.stringify(
          data
        )}`
      );
    }

    const data: RPC.Response[] = await response.json().catch(async () => {
      const data = await response.text();
      throw new Error(
        `Failed to parse response as JSON, body:\n${JSON.stringify(data)}`
      );
    });

    const sortedData = data.sort((a, b) => a.id - b.id); // Sort the response to match the order of the requests

    return sortedData;
  }

  protected async fetchEndpoint<T extends keyof RPC.Methods>(
    method: T,
    params: RPC.Methods[T]["params"]
  ): Promise<RPC.Methods[T]["result"]> {
    const request = { method, params };
    const response = await (this.loader?.load(request) ??
      this.batchRequests([request]).then((res) => res[0]));
    const { error, result } = response;
    this.errorHandler(error);
    return result;
  }
}
