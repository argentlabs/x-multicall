import type { Provider } from "starknet";

export type MinimalProviderInterface = Pick<Provider, "callContract">;

export interface DataLoaderOptions {
  maxBatchSize?: number;
  batchInterval?: number;
}
