# @argent/x-multicall

This package provides batch request functionality for Starknet RPC providers.
It exports two classes: RpcBatchProvider and ContractBatchProvider.

## Installation

To install the package, use the following command:

```
pnpm add @argent/x-multicall
```

## Usage

Here is a basic usage example:

```typescript
import { RpcBatchProvider } from "@argent/x-multicall";
import { RpcProvider } from "starknet";

const provider = new RpcProvider({ nodeUrl: "your_node_url" });
const batchProvider = new RpcBatchProvider({
  nodeUrl: rpcProvider.nodeUrl,
  headers: rpcProvider.headers,
});

// Now you can use batchProvider to make batch requests
const result = batchProvider.callContract({
  contractAddress: "0x0",
  entrypoint: "0x0",
  calldata: ["0x0"],
});
```

## Development

To start development, clone the repository and install the dependencies:

```
git clone https://github.com/argentlabs/x-multicall.git
cd x-multicall
bun install
```

You can start the development server with:

```
bun dev
```

## Testing

To run the tests, use the following command:

```
bun run test
```

To run tests in watch mode, use:

```
bun run test:watch
```

## RpcBatchProvider

RpcBatchProvider is a class that extend the RpcProvider, adding batch request functionality.

```typescript
import { RpcBatchProvider } from "@argent/x-multicall";
import { RpcProvider } from "starknet";

const rpcProvider = new RpcProvider({ nodeUrl: "your_rpc_node_url" });
const rpcBatchProvider = new RpcBatchProvider({
  nodeUrl: rpcProvider.nodeUrl,
  headers: rpcProvider.headers,
  batchInterval: 200,
  maxBatchSize: 20,
});

const result = rpcBatchProvider.callContract({
  contractAddress: "0x0",
  entrypoint: "0x0",
  calldata: ["0x0"],
});
```

In the above example, batchInterval is the time interval (in ms) at which batch requests are sent and maxBatchSize is the maximum number of requests that can be included in a batch. These options can be adjusted according to your needs.

## ContractBatchProvider

ContractBatchProvider is a class that extend MinimalProviderInterface (requires a provider with `callContract`) and allows contract batching instead of json rpc batching.

```typescript
import { ContractBatchProvider } from "@argent/x-multicall";
import { RpcProvider } from "starknet";

const rpcProvider = new RpcProvider({ nodeUrl: "your_rpc_node_url" });
const contractBatchProvider = new ContractBatchProvider(rpcProvider, {
  batchInterval: 200,
  maxBatchSize: 20,
});

const result = contractBatchProvider.callContract({
  contractAddress: "0x0",
  entrypoint: "0x0",
  calldata: ["0x0"],
});
```

## License

This project is licensed under the [MIT license](LICENSE).
