import type { Provider } from "starknet";
import type { Provider as Provider5 } from "starknet5";

export type MinimalProviderInterface = Pick<Provider, "callContract">;
export type MinimalProviderInterface5 = Pick<Provider5, "callContract">;

export interface DataLoaderOptions {
  maxBatchSize?: number;
  batchInterval?: number;
}
