/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/Button";
import { TextField } from "@/components/Input";
import { AppliedValidators, Validators, applyParams, readValidators } from "@/utils";
import { Constr, Data, Kupmios, Lucid, Network, fromText } from "lucid-cardano";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export async function getServerSideProps() {
  // Gets the env variables for Kupo and Ogmios URL
  const ENV = {
    KUPO_URL: process.env.KUPO_RUL as string,
    OGMIOS_URL: process.env.OGMIOS_URL as string,
    NETWORK: (process.env.NETWORK as string) || "Preprod",
  };

  const validators = readValidators();

  return {
    props: {
      ENV,
      validators,
    },
  };
}

type State = {
  lucid: Lucid | undefined;
  tokenName: string;
  giftADA: string | undefined;
  lockTxHash: string | undefined;
  waitingLockTx: boolean;
  unlockTxHash: string | undefined;
  waitingUnlockTx: boolean;
  parameterizedContracts: AppliedValidators | null;
};

const Home: NextPage<{
  ENV: Record<string, string>;
  validators: Validators;
}> = ({ ENV, validators }) => {
  const router = useRouter();

  const [state, setState] = useState<State>({
    lucid: undefined,
    tokenName: "",
    giftADA: undefined,
    lockTxHash: undefined,
    waitingLockTx: false,
    unlockTxHash: undefined,
    waitingUnlockTx: false,
    parameterizedContracts: null,
  });

  const mergeSpecs = useCallback((delta: Partial<State>) => {
    setState((prev: any) => ({ ...prev, ...delta }));
  }, []);

  useEffect(() => {
    async function initLucid() {
      try {
        // Initializes the lucid library with Ogmios and Kupo as providers
        const lucid = await Lucid.new(new Kupmios(ENV.KUPO_URL, ENV.OGMIOS_URL), ENV.NETWORK as Network);
        // Sets lucid with eternl wallet - this could be improved to handle errors or more wallets
        window.cardano.eternl.enable().then((wallet) => {
          lucid.selectWallet(wallet);
        });
        mergeSpecs({ lucid });
      } catch (e) {
        console.log(e);
      }
    }
    initLucid();
  }, [ENV, mergeSpecs]);

  const submitTokenName = async (e: Event) => {
    e.preventDefault();

    const utxos = await state.lucid?.wallet.getUtxos()!;

    const utxo = utxos[0];
    const outputReference = {
      txHash: utxo.txHash,
      outputIndex: utxo.outputIndex,
    };

    const contracts = applyParams(state.tokenName, outputReference, validators, state.lucid!);

    mergeSpecs({ parameterizedContracts: contracts });
  };

  const createGiftCard = async (e: Event) => {
    e.preventDefault();

    mergeSpecs({ waitingLockTx: true });

    try {
      const lovelace = Number(state.giftADA) * 1000000;

      const assetName = `${state.parameterizedContracts!.policyId}${fromText(state.tokenName)}`;

      // Action::Mint
      const mintRedeemer = Data.to(new Constr(0, []));

      const utxos = await state.lucid?.wallet.getUtxos()!;
      const utxo = utxos[0];

      try {
        const tx = await state
          .lucid!.newTx()
          .collectFrom([utxo])
          .attachMintingPolicy(state.parameterizedContracts!.giftCard)
          .mintAssets({ [assetName]: BigInt(1) }, mintRedeemer)
          .payToContract(
            state.parameterizedContracts!.lockAddress,
            { inline: Data.void() },
            { lovelace: BigInt(lovelace) }
          )
          .complete();

        const txSigned = await tx.sign().complete();

        const txHash = await txSigned.submit();

        const success = await state.lucid!.awaitTx(txHash);

        // Wait a little bit longer so ExhaustedUTxOError doesn't happen
        // in the next Tx
        setTimeout(() => {
          mergeSpecs({ waitingLockTx: false });

          if (success) {
            mergeSpecs({ lockTxHash: txHash });
          }
        }, 3000);
      } catch {
        mergeSpecs({ waitingLockTx: false });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const redeemGiftCard = async (e: Event) => {
    e.preventDefault();

    mergeSpecs({ waitingUnlockTx: true });

    try {
      const utxos = await state.lucid!.utxosAt(state.parameterizedContracts!.lockAddress);

      const assetName = `${state.parameterizedContracts!.policyId}${fromText(state.tokenName)}`;

      // Action::Burn
      const burnRedeemer = Data.to(new Constr(1, []));

      const tx = await state
        .lucid!.newTx()
        .collectFrom(utxos, Data.void())
        .attachMintingPolicy(state.parameterizedContracts!.giftCard)
        .attachSpendingValidator(state.parameterizedContracts!.redeem)
        .mintAssets({ [assetName]: BigInt(-1) }, burnRedeemer)
        .complete();

      const txSigned = await tx.sign().complete();

      const txHash = await txSigned.submit();

      const success = await state.lucid!.awaitTx(txHash);

      mergeSpecs({ waitingUnlockTx: false });

      if (success) {
        mergeSpecs({ unlockTxHash: txHash });
      }
    } catch {
      mergeSpecs({ waitingUnlockTx: false });
    }
  };

  return (
    <>
      <div className="h-fill flex flex-col items-center pt-24">
        <div className="box-slate flex flex-col text-center items-center p-12">
          <h2 className="text-gray-600 title-lg">Make a one shot minting and lock contract</h2>

          <div className="mb-10 max-w-2xl mx-auto box-border mt-6">
            <h3 className="mt-4 mb-2 text-gray-400">Redeem</h3>
            <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">{validators.redeem.script}</pre>

            <h3 className="mt-4 mb-2 text-gray-400">Gift Card</h3>
            <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">{validators.giftCard.script}</pre>
          </div>

          {state.lucid ? (
            <div className="box-border mt-6 w-full">
              <form className="mt-10" onSubmit={(e: any) => submitTokenName(e)}>
                <TextField
                  name="tokenName"
                  label="Token Name"
                  placeholder=""
                  description=""
                  onInput={(e: any) => mergeSpecs({ tokenName: e.currentTarget.value })}
                />

                {state.tokenName && (
                  <button className="btn-primary mt-4" type="submit">
                    Make Contracts
                  </button>
                )}
              </form>
            </div>
          ) : (
            <>
              <div className="box-red mt-4">
                <p className="text-red-500">Unable to initialize Lucid check your connection params</p>
              </div>
            </>
          )}
          {state.lucid && state.parameterizedContracts && (
            <>
              <div className="mb-10 max-w-2xl mx-auto box-border mt-6">
                <h3 className="mt-4 mb-2 text-gray-400">Redeem</h3>
                <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">
                  {state.parameterizedContracts.redeem.script}
                </pre>

                <h3 className="mt-4 mb-2 text-gray-400">Gift Card</h3>
                <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">
                  {state.parameterizedContracts.giftCard.script}
                </pre>
              </div>
              <div className="box-border mt-6 w-full">
                <TextField
                  name="giftADA"
                  label="ADA Amount"
                  placeholder=""
                  description=""
                  onInput={(e: any) => mergeSpecs({ giftADA: e.currentTarget.value })}
                />

                <button
                  className="btn-primary mt-4"
                  type="button"
                  onClick={(e: any) => createGiftCard(e)}
                  disabled={state.waitingLockTx || !!state.lockTxHash}
                >
                  {state.waitingLockTx ? "Waiting for Tx..." : "Create Gift Card (Locks ADA)"}
                </button>

                {state.lockTxHash && (
                  <>
                    <div className="box-border mt-6 w-full">
                      <h3 className="mt-4 mb-2 text-gray-400">ADA Locked</h3>

                      <a
                        className="mb-2"
                        target="_blank"
                        href={`https://preprod.cardanoscan.io/transaction/${state.lockTxHash}`}
                      >
                        {state.lockTxHash}
                      </a>

                      <button
                        className="btn-primary mt-4"
                        type="button"
                        onClick={(e: any) => redeemGiftCard(e)}
                        disabled={state.waitingLockTx || !!state.unlockTxHash}
                      >
                        {state.waitingUnlockTx ? "Waiting for Tx..." : "Redeem Gift Card (Unlocks ADA)"}
                      </button>
                    </div>
                  </>
                )}

                {state.unlockTxHash && (
                  <>
                    <div className="box-border mt-6 w-full">
                      <h3 className="mt-4 mb-2 text-gray-400">ADA Unlocked</h3>

                      <a
                        className="mb-2"
                        target="_blank"
                        href={`https://preprod.cardanoscan.io/transaction/${state.unlockTxHash}`}
                      >
                        {state.unlockTxHash}
                      </a>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex mt-4 items-center">
          <p className="text-gray-400 ">
            Powered by
            <span className="hover:text-txpink ml-1">
              <a href="https://github.com/txpipe/adalicious-starter-kit">Adalicious</a>
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;
