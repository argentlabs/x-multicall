import { describe, expect, spyOn, test } from "bun:test";
import { RpcProvider } from "starknet";
import { filterError } from "./utils.test";
import { ContractBatchProvider } from ".";
import { MinimalProviderInterface } from "./types";

function getBatchProvider(provider: MinimalProviderInterface) {
  if (!process.env.TEST_RPC_PROVIDER) {
    throw new Error("TEST_RPC_PROVIDER env variable is not set");
  }

  return new ContractBatchProvider(provider);
}

describe("getBatchProvider", () => {
  test("one call fails in a batch with ContractBatchProvider", async () => {
    const provider = new RpcProvider({
      nodeUrl: process.env.TEST_RPC_PROVIDER,
    });
    const callContractSpy = spyOn(provider, "callContract");
    const mc = getBatchProvider(provider as any);

    // wait 400ms to make sure the batch is sent
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(callContractSpy.mock.calls.length).toEqual(1);

    const responses = await Promise.allSettled(
      new Array(4).fill(null).map((_, i) => {
        if (i === 2) {
          return mc.callContract({
            contractAddress: `0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7`,
            entrypoint: "balance_of",
            calldata: [`0xdeadbeef${i}`],
          });
        }
        return mc.callContract({
          contractAddress: `0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7`,
          entrypoint: "balanceOf",
          calldata: [`0xdeadbeef${i}`],
        });
      })
    );

    expect(filterError(responses)).toMatchSnapshot();
    expect(callContractSpy.mock.calls.length).toEqual(2);

    // cleanup
    callContractSpy.mockRestore();
  });
  test("one call fails in a batch with RpcProvider", async () => {
    if (!process.env.TEST_RPC_PROVIDER) {
      throw new Error("TEST_RPC_PROVIDER env variable is not set");
    }
    const fetchSpy = spyOn(global, "fetch");
    const provider = new RpcProvider({
      nodeUrl: process.env.TEST_RPC_PROVIDER,
    });
    const mc = getBatchProvider(provider);

    // wait 400ms to make sure the batch is sent
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(fetchSpy.mock.calls.length).toEqual(1); // rpc provider sends a request on initialization

    const responses = await Promise.allSettled(
      new Array(4).fill(null).map((_, i) => {
        if (i === 2) {
          return mc.callContract({
            contractAddress: `0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7`,
            entrypoint: "balance_of",
            calldata: [`0xdeadbeef${i}`],
          });
        }
        return mc.callContract({
          contractAddress: `0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7`,
          entrypoint: "balanceOf",
          calldata: [`0xdeadbeef${i}`],
        });
      })
    );

    expect(filterError(responses)).toMatchSnapshot();
    expect(fetchSpy.mock.calls.length).toEqual(2);
    // cleanup
    fetchSpy.mockRestore();
  });
});
