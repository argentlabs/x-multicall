import type { Provider } from "starknet";

export type MinimalProviderInterface = Pick<Provider, "callContract">;
