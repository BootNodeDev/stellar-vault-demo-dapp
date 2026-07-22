import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CALK7NDPPIKT5DTHNFOZTXLJQWSNHWPFH4NIOX2D64CUOCT5UGTQWMAY",
  }
} as const


export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lee el contador sin modificarlo. Solo lectura: no escribe estado.
   */
  get: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a increment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Incrementa el contador y devuelve el nuevo valor.
   */
  increment: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAEFMZWUgZWwgY29udGFkb3Igc2luIG1vZGlmaWNhcmxvLiBTb2xvIGxlY3R1cmE6IG5vIGVzY3JpYmUgZXN0YWRvLgAAAAAAAANnZXQAAAAAAAAAAAEAAAAE",
        "AAAAAAAAADFJbmNyZW1lbnRhIGVsIGNvbnRhZG9yIHkgZGV2dWVsdmUgZWwgbnVldm8gdmFsb3IuAAAAAAAACWluY3JlbWVudAAAAAAAAAAAAAABAAAABA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<u32>,
        increment: this.txFromJSON<u32>
  }
}