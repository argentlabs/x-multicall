import DataLoader from "dataloader";
import type { Call, CallContractResponse } from "starknet";

import { type DataLoaderOptions, getDataLoader } from "./dataloader";
import type { MinimalProviderInterface } from "./types";

const DEFAULT_MULTICALL_ADDRESS =
  "0x05754af3760f3356da99aea5c3ec39ccac7783d925a19666ebbeca58ff0087f4";

export class Multicall implements MinimalProviderInterface {
  public readonly dataloader: DataLoader<Call, string[], Call>;

  constructor(
    public readonly provider: MinimalProviderInterface,
    public readonly address: string = DEFAULT_MULTICALL_ADDRESS,
    dataLoaderOptions?: DataLoaderOptions
  ) {
    this.dataloader = getDataLoader(provider, address, dataLoaderOptions);
  }

  public async callContract(call: Call): Promise<CallContractResponse> {
    const result = await this.dataloader.load(call);
    return { result };
  }
}
