# @argent/x-multicall

This package provides batch request functionality for Starknet RPC and Sequencer providers. It exports two classes RpcBatchProvider and SequencerBatchProvider for RPC and Sequencer providers respectively. It also exports a default function getBatchProvider which returns an instance of either RpcBatchProvider or SequencerBatchProvider based on the provider type passed to it.

## Installation

To install the package, use the following command:

```
pnpm add @argent/x-multicall
```

## Usage

Here is a basic usage example:

```typescript
import { getBatchProvider } from "@argent/x-multicall";
import { RpcProvider } from "starknet";

const provider = new RpcProvider({ nodeUrl: "your_node_url" });
const batchProvider = getBatchProvider(provider);

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

## RpcBatchProvider and SequencerBatchProvider

RpcBatchProvider and SequencerBatchProvider are classes that extend the RpcProvider and SequencerProvider respectively, adding batch request functionality. They can be used as follows:

```typescript
import { RpcBatchProvider, SequencerBatchProvider } from "@argent/x-multicall";
import { RpcProvider, SequencerProvider } from "starknet";

const rpcProvider = new RpcProvider({ nodeUrl: "your_rpc_node_url" });
const rpcBatchProvider = new RpcBatchProvider({
  nodeUrl: rpcProvider.nodeUrl,
  headers: rpcProvider.headers,
  batchInterval: 200,
  maxBatchSize: 20,
});

const sequencerProvider = new SequencerProvider({
  network: "your_network_name",
});
const sequencerBatchProvider = new SequencerBatchProvider(sequencerProvider);
```

In the above example, batchInterval is the time interval (in ms) at which batch requests are sent and maxBatchSize is the maximum number of requests that can be included in a batch. These options can be adjusted according to your needs.

## License

This project is licensed under the [MIT license](LICENSE).
