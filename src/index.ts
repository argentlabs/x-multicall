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
  if (provider instanceof RpcProvider) {
    return new RpcBatchProvider({
      nodeUrl: provider.nodeUrl,
      headers: provider.headers,
      ...dataloaderOptions,
    });
  }
  if (provider instanceof SequencerProvider) {
    return new SequencerBatchProvider(
      provider,
      multicallAddressIfSequencer,
      dataloaderOptions
    );
  }
  console.warn(
    "[MC] Warning: Provider is not RpcProvider or SequencerProvider, fallback to original provider"
  );
  return provider;
}
