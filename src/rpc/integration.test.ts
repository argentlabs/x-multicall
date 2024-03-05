import { Mock, afterEach, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import { RpcBatchProvider } from "./RpcBatchProvider";
import { filterError } from "../utils.test";
import { Call, CallContractResponse, RpcProvider } from "starknet";

function getBatchProvider() {
  if (!process.env.TEST_RPC_PROVIDER) {
    throw new Error("TEST_RPC_PROVIDER env variable is not set");
  }

  return new RpcBatchProvider({
    nodeUrl: process.env.TEST_RPC_PROVIDER,
    batchInterval: 200,
    maxBatchSize: 20,
    waitMode: true,
  });
}

interface MinimalMockProviderInterface {
  callContract: Mock<(call: Call) => Promise<CallContractResponse>>;
}

function getIntegrationProvider(): MinimalMockProviderInterface {
  const provider = new RpcProvider({
    nodeUrl: process.env.TEST_RPC_PROVIDER,
  });
  return {
    callContract: mock(async (call) => {
      const { contractAddress, entrypoint, calldata = [] } = call;
      const result = await provider.callContract({
        contractAddress,
        entrypoint,
        calldata,
      });
      return result;
    }),
  };
}

describe("RpcBatchProvider", () => {
  let globalFetchMock: Mock<typeof fetch>;
  beforeAll(() => {
    const originalFetch = global.fetch;
    globalFetchMock = global.fetch = mock(originalFetch);
  });

  test("should return the correct result for one call", async () => {
    const provider = getBatchProvider();

    // wait 400ms to make sure the batch is sent
    await new Promise((resolve) => setTimeout(resolve, 400));

    const result = await provider.callContract({
      contractAddress: "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
      entrypoint: "balanceOf",
      calldata: ["0xdeadbeef0"],
    });

    expect(result).toEqual(["0x0", "0x0"]);
    expect(globalFetchMock.mock.calls.length).toEqual(1);
  });

  test("should return the correct result for multiple calls with one request", async () => {
    const provider = getBatchProvider();

    // wait 400ms to make sure the batch is sent
    await new Promise((resolve) => setTimeout(resolve, 400));

    const responses = await Promise.all(
      new Array(4).fill(null).map((_, i) =>
        provider.callContract({
          contractAddress: "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
          entrypoint: "balanceOf",
          calldata: [`0xdeadbeef${i}`],
        })
      )
    );

    expect(responses).toEqual([
      ["0x0", "0x0"],
      ["0x0", "0x0"],
      ["0x0", "0x0"],
      ["0x0", "0x0"],
    ]);

    expect(globalFetchMock.mock.calls.length).toEqual(1);
  });

  test("one call fails in a batch", async () => {
    const provider = getBatchProvider();

    // wait 400ms to make sure the batch is sent
    await new Promise((resolve) => setTimeout(resolve, 400));

    const responses = await Promise.allSettled(
      new Array(4).fill(null).map((_, i) => {
        if (i === 2) {
          return provider.callContract({
            contractAddress: `0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7`,
            entrypoint: "balance_of",
            calldata: [`0xdeadbeef${i}`],
          });
        }
        return provider.callContract({
          contractAddress: `0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7`,
          entrypoint: "balanceOf",
          calldata: [`0xdeadbeef${i}`],
        });
      })
    );

    console.log("result", filterError(responses));
    expect(filterError(responses)).toMatchSnapshot();
    expect(globalFetchMock.mock.calls.length).toEqual(1);
  });

  afterEach(() => {
    globalFetchMock.mockClear();
  });
});
