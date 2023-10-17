import { describe, expect, mock, Mock, test } from "bun:test";
import { SequencerBatchProvider } from "./index";
import {
  Call,
  CallContractResponse,
  constants,
  SequencerProvider,
} from "starknet";
import { filterError } from "../utils.test";

interface MinimalMockProviderInterface {
  callContract: Mock<(request: Call) => Promise<CallContractResponse>>;
}

function getIntegrationProvider(): MinimalMockProviderInterface {
  const provider = new SequencerProvider({
    network: constants.NetworkName.SN_MAIN,
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

describe("SequencerBatchProvider", () => {
  test("should return the correct result for one call", async () => {
    const provider = getIntegrationProvider();
    const mc = new SequencerBatchProvider(provider);
    expect(provider.callContract.mock.calls.length).toEqual(0);

    const { result } = await mc.callContract({
      contractAddress:
        "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
      entrypoint: "balanceOf",
      calldata: ["0xdeadbeef0"],
    });

    expect(result).toEqual(["0x0", "0x0"]);
    expect(provider.callContract.mock.calls.length).toEqual(1);
  });

  test("should return the correct result for multiple calls with one request", async () => {
    const provider = getIntegrationProvider();
    const mc = new SequencerBatchProvider(provider);

    const responses = await Promise.all(
      new Array(4).fill(null).map((_, i) =>
        mc.callContract({
          contractAddress: `0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7`,
          entrypoint: "balanceOf",
          calldata: [`0xdeadbeef${i}`],
        })
      )
    );

    expect(responses).toEqual([
      { result: ["0x0", "0x0"] },
      { result: ["0x0", "0x0"] },
      { result: ["0x0", "0x0"] },
      { result: ["0x0", "0x0"] },
    ]);
    expect(provider.callContract.mock.calls.length).toEqual(1);
  });

  test("one call fails in a batch", async () => {
    const provider = getIntegrationProvider();
    const mc = new SequencerBatchProvider(provider);

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
    expect(provider.callContract.mock.calls.length).toEqual(2);
  });

  test("two call fails in a batch", async () => {
    const provider = getIntegrationProvider();
    const mc = new SequencerBatchProvider(provider);

    const responses = await Promise.allSettled(
      new Array(4).fill(null).map((_, i) => {
        if (i === 0 || i === 2) {
          return mc.callContract({
            contractAddress: `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8`,
            entrypoint: "balance_of",
            calldata: [`0xdeadbeef${i}`],
          });
        }
        return mc.callContract({
          contractAddress: `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8`,
          entrypoint: "balanceOf",
          calldata: [`0xdeadbeef${i}`],
        });
      })
    );

    expect(filterError(responses)).toMatchSnapshot();
    expect(provider.callContract.mock.calls.length).toEqual(3);
  });
});
