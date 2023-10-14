import { describe, expect, mock, Mock, test } from "bun:test";
import { Multicall } from "./index";
import { Call, CallContractResponse, RpcProvider } from "starknet";

interface MinimalMockProviderInterface {
  callContract: Mock<(request: Call) => Promise<CallContractResponse>>;
}

function getIntegrationProvider(): MinimalMockProviderInterface {
  const provider = new RpcProvider({ nodeUrl: "http://localhost:5050/" });
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

describe("Multicall", () => {
  test("should return the correct result for one call", async () => {
    const provider = getIntegrationProvider();
    const mc = new Multicall(provider);
    expect(provider.callContract.mock.calls.length).toEqual(0);

    const { result } = await mc.callContract({
      contractAddress:
        "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
      entrypoint: "balanceOf",
      calldata: ["0x012"],
    });

    expect(result).toEqual(["0x0", "0x0"]);
    expect(provider.callContract.mock.calls.length).toEqual(1);
  });

  test("should return the correct result for multiple calls with one request", async () => {
    const provider = getIntegrationProvider();
    const mc = new Multicall(provider);

    const responses = await Promise.all(
      new Array(4).fill(null).map((_, i) =>
        mc.callContract({
          contractAddress: `0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7`,
          entrypoint: "balanceOf",
          calldata: [`0x0${i}`],
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
});
