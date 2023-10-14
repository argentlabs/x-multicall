import { describe, expect, mock, test } from "bun:test";
import { Multicall } from "./index";
import { MinimalProviderInterface } from "./types";

function getMockProvider(responses: string[][]): MinimalProviderInterface {
  const blockNumber = "0x1";
  const flatResponsesWithLength = responses.flatMap((r) => [
    r.length.toString(),
    ...r,
  ]);
  const totalLength = flatResponsesWithLength.length.toString();
  return {
    callContract: mock(async () => ({
      result: [blockNumber, totalLength, ...flatResponsesWithLength],
    })),
  };
}

describe("Multicall", () => {
  test("should return the correct result for one call", async () => {
    const provider = getMockProvider([["0x1337"]]);
    const mc = new Multicall(provider);

    const { result } = await mc.callContract({
      contractAddress: "0x1",
      entrypoint: "0x2",
      calldata: [],
    });

    expect(result).toEqual(["0x1337"]);
    expect(provider.callContract).toHaveBeenCalledTimes(1);
  });

  test("should return the correct result for multiple calls with one request", async () => {
    const provider = getMockProvider([
      ["0x1337"],
      ["0x1338"],
      ["0x1339"],
      ["0x133a"],
    ]);
    const mc = new Multicall(provider);

    const responses = await Promise.all(
      new Array(4).fill(null).map((_, i) =>
        mc.callContract({
          contractAddress: `0x${i}`,
          entrypoint: "0x2",
          calldata: [],
        })
      )
    );

    expect(responses).toEqual([
      { result: ["0x1337"] },
      { result: ["0x1338"] },
      { result: ["0x1339"] },
      { result: ["0x133a"] },
    ]);
    expect(provider.callContract).toHaveBeenCalledTimes(1);
  });
});
