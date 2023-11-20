import { RpcProvider, SequencerProvider } from "starknet";

import type { DataLoaderOptions, MinimalProviderInterface } from "./types";
import { RpcBatchProvider } from "./rpc/RpcBatchProvider";
import { SequencerBatchProvider } from "./sequencer/index";

export { RpcBatchProvider } from "./rpc/RpcBatchProvider";
export { SequencerBatchProvider } from "./sequencer/index";

export type { DataLoaderOptions, MinimalProviderInterface };

export function getBatchProvider(
  provider: MinimalProviderInterface,
  dataloaderOptions?: DataLoaderOptions,
  multicallAddressIfSequencer?: string
): MinimalProviderInterface {
  if ("nodeUrl" in provider) {
    const rpcProvider: RpcProvider = provider as RpcProvider;
    return new RpcBatchProvider({
      nodeUrl: rpcProvider.nodeUrl,
      headers: rpcProvider.headers,
      ...dataloaderOptions,
    });
  }
  if ("baseUrl" in provider) {
    const sequencerProvider: SequencerProvider = provider as SequencerProvider;
    return new SequencerBatchProvider(
      sequencerProvider,
      multicallAddressIfSequencer,
      dataloaderOptions
    );
  }
  console.warn(
    "[MC] Warning: Provider is not RpcProvider or SequencerProvider, fallback to original provider"
  );
  return provider;
}
