import { describe, expect, test } from "bun:test";

type MaybeArray<T> = T | Array<T>;

export function filterError<T extends MaybeArray<PromiseSettledResult<any>>>(
  results: T
): T {
  const isInputArray = Array.isArray(results);
  const arrayResults = Array.isArray(results) ? results : [results];

  const filteredResults = arrayResults.map((result) => {
    if (result.status === "rejected") {
      return {
        status: "rejected",
      };
    }
    return result;
  });

  return isInputArray ? filteredResults : filteredResults[0];
}

describe("filterError", () => {
  // test when promises all are resolved
  test("filterError with all fulfilled promises", async () => {
    // setup
    const data = await Promise.allSettled([
      Promise.resolve(1),
      Promise.resolve(2),
    ]);
    const expected = [
      { status: "fulfilled", value: 1 },
      { status: "fulfilled", value: 2 },
    ];

    // action
    const result = filterError(data);

    // assertion
    expect(result).toEqual(expected);
  });

  // test when some promises are rejected
  test("filterError with some rejected promises", async () => {
    // setup
    const data = await Promise.allSettled([
      Promise.resolve(1),
      Promise.reject("Error"),
    ]);
    const expected = [
      { status: "fulfilled", value: 1 },
      { status: "rejected" },
    ];

    // action
    const result = filterError(data);

    // assertion
    expect(result).toEqual(expected);
  });

  // test when all promises are rejected
  test("filterError with all rejected promises", async () => {
    // setup
    const data = await Promise.allSettled([
      Promise.reject("Error"),
      Promise.reject("Another error"),
    ]);
    const expected = [{ status: "rejected" }, { status: "rejected" }];

    // action
    const result = filterError(data);

    // assertion
    expect(result).toEqual(expected);
  });

  // test on single promise
  test("filterError with single promise", async () => {
    // setup
    const [data] = await Promise.allSettled([Promise.resolve(1)]);
    const expected = { status: "fulfilled", value: 1 };

    // action
    const result = filterError(data);

    // assertion
    expect(result).toEqual(expected);
  });
});
