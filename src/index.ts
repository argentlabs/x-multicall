import { RpcProvider } from "starknet";

import type { DataLoaderOptions, MinimalProviderInterface } from "./types";
import { RpcBatchProvider } from "./rpc/RpcBatchProvider";

export { RpcBatchProvider } from "./rpc/RpcBatchProvider";

export type { DataLoaderOptions, MinimalProviderInterface };

export function getBatchProvider(
  provider: MinimalProviderInterface,
  dataloaderOptions?: DataLoaderOptions
): MinimalProviderInterface {
  if ("nodeUrl" in provider) {
    const rpcProvider: RpcProvider = provider as unknown as RpcProvider;
    return new RpcBatchProvider({
      nodeUrl: rpcProvider.channel.nodeUrl,
      headers: rpcProvider.channel.headers,
      ...dataloaderOptions,
    });
  }

  console.warn("[MC] Warning: Provider is not RpcProvider, fallback to original provider");
  return provider;
}
