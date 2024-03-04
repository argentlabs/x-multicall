import { RpcProvider } from "starknet";

import type { DataLoaderOptions, MinimalProviderInterface, MinimalProviderInterface5 } from "./types";
import { ContractBatcherProvider } from "./contractBatcher/ContractBatcherProvider";
import { RpcBatchProvider } from "./rpc/RpcBatchProvider";

export { RpcBatchProvider } from "./rpc/RpcBatchProvider";
export { ContractBatcherProvider } from "./contractBatcher/ContractBatcherProvider";

export type { DataLoaderOptions, MinimalProviderInterface };

export function getBatchProvider(
  provider: MinimalProviderInterface | MinimalProviderInterface5,
  dataloaderOptions?: DataLoaderOptions,
  multicallAddressIfSequencer?: string
): MinimalProviderInterface {
  if ("nodeUrl" in provider) {
    const rpcProvider: RpcProvider = provider as unknown as RpcProvider;
    return new RpcBatchProvider({
      nodeUrl: rpcProvider.channel.nodeUrl,
      headers: rpcProvider.channel.headers,
      ...dataloaderOptions,
    });
  }

  if ("baseUrl" in provider) {
    const contractBatcherProvider: ContractBatcherProvider = provider as unknown as ContractBatcherProvider;
    return new ContractBatcherProvider(contractBatcherProvider, multicallAddressIfSequencer, dataloaderOptions);
  }

  console.warn("[MC] Warning: Provider is not RpcProvider or ContractBatcherProvider, fallback to original provider");

  console.warn("[MC] Warning: Provider is not RpcProvider, fallback to original provider");
  return provider as MinimalProviderInterface;
}
