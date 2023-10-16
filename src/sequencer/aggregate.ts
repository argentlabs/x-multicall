import {
  type Call,
  GatewayError,
  LibraryError,
  num,
  transaction,
  CallData,
} from "starknet";
import type { MinimalProviderInterface } from "../types";

const partitionResponses = (responses: string[]): string[][] => {
  if (responses.length === 0) {
    return [];
  }

  const [responseLength, ...restResponses] = responses;
  const responseLengthInt = Number(num.toBigInt(responseLength));
  const response = restResponses.slice(0, responseLengthInt);
  const remainingResponses = restResponses.slice(responseLengthInt);

  return [response, ...partitionResponses(remainingResponses)];
};

const extractErrorCallIndex = (e: Error) => {
  try {
    const errorCallText = e.toString();

    const sequencerErrorIndex = errorCallText.match(
      /Error message: multicall (\d+) failed/
    )?.[1];
    if (sequencerErrorIndex) {
      return Number(sequencerErrorIndex);
    }
    throw e;
  } catch {
    throw e;
  }
};

const fallbackAggregate = async (
  provider: MinimalProviderInterface,
  calls: Call[]
): Promise<(string[] | Error)[]> => {
  const results = await Promise.allSettled(
    calls.map((call) =>
      provider
        .callContract({
          contractAddress: call.contractAddress,
          entrypoint: call.entrypoint,
          calldata: CallData.toCalldata(call.calldata),
        })
        .then((res) => res.result)
    )
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return result.reason;
  });
};

export const aggregate = async (
  provider: MinimalProviderInterface,
  multicallAddress: string,
  calls: Call[]
): Promise<(string[] | Error)[]> => {
  if (calls.length === 0) {
    return [];
  }
  try {
    const res = await provider.callContract({
      contractAddress: multicallAddress,
      entrypoint: "aggregate",
      calldata: transaction.fromCallsToExecuteCalldata([...calls]),
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_blockNumber, _totalLength, ...results] = res.result;

    return partitionResponses(results);
  } catch (e) {
    if (!(e instanceof Error)) {
      throw e;
    }

    if (
      // in case multicall contract is not deployed, fallback to calling each call separately
      (e instanceof GatewayError &&
        e.errorCode === "StarknetErrorCode.UNINITIALIZED_CONTRACT") || // Sequencer
      (e instanceof LibraryError && e.message === "20: Contract not found") // RPC
    ) {
      return fallbackAggregate(provider, calls);
    }

    const errorCallIndex = extractErrorCallIndex(e);
    const remainingCalls = calls.filter((_, i) => i !== errorCallIndex);
    const remainingResults = await aggregate(
      provider,
      multicallAddress,
      remainingCalls
    );
    return [
      ...remainingResults.slice(0, errorCallIndex),
      e,
      ...remainingResults.slice(errorCallIndex),
    ];
  }
};
