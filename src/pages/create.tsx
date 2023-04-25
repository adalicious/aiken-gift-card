import { TextField } from "@/components/Input";
import { AppliedValidators, Validators, applyParams, readValidators } from "@/utils";
import { Constr, Data, Kupmios, Lucid, Network, fromText } from "lucid-cardano";
import type { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";

const BASE_URL = "http://localhost:3000/redeem";

export async function getServerSideProps() {
  const ENV = {
    KUPO_URL: process.env.KUPO_RUL as string,
    OGMIOS_URL: process.env.OGMIOS_URL as string,
    NETWORK: process.env.NETWORK as string,
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
  parameterizedContracts: AppliedValidators | null;
  utxoTxHash: string | undefined;
  utxoOutputIndex: number | undefined;
  url: string | undefined;
  error: string | undefined;
};

const Home: NextPage<{
  ENV: Record<string, string>;
  validators: Validators;
}> = ({ ENV, validators }) => {

  const [state, setState] = useState<State>({
    lucid: undefined,
    tokenName: "",
    giftADA: undefined,
    lockTxHash: undefined,
    waitingLockTx: false,
    parameterizedContracts: null,
    utxoTxHash: undefined,
    utxoOutputIndex: undefined,
    url: undefined,
    error: undefined,
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
        mergeSpecs({ error: "unable to initialize lucid. check your connection params" });
      }
    }
    initLucid();
  }, [ENV, mergeSpecs]);

  const submitTokenName = async (e: Event) => {
    e.preventDefault();

    // Selects an utxo as a reference to parametrize the contracts
    const utxos = await state.lucid?.wallet.getUtxos()!;

    const utxo = utxos[0];

    const outputReference = {
      txHash: utxo.txHash,
      outputIndex: utxo.outputIndex,
    };

    const contracts = applyParams(state.tokenName, outputReference, validators, state.lucid!);

    mergeSpecs({ utxoTxHash: utxo.txHash, utxoOutputIndex: utxo.outputIndex, parameterizedContracts: contracts });
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

        // builds the redeem url
        const url = new URL(BASE_URL);
        url.searchParams.append("lockAddress", state.parameterizedContracts!.lockAddress);
        url.searchParams.append("txHash", state.utxoTxHash!);
        url.searchParams.append("outputIndex", state.utxoOutputIndex?.toString()!);
        url.searchParams.append("tokenName", state.tokenName!);

        // Updates the state with the generated link
        mergeSpecs({ url: url.href });

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

  return (
    <>
      <div className="h-fill flex flex-col items-center pt-24 pb-24">
        <h2 className="text-gray-600 title-lg">Make a one-shot Minting and Lock Contract</h2>

        {state.lucid ? (
          <div className="box-slate mt-6 wrapper-wide p-12">
            <form onSubmit={(e: any) => submitTokenName(e)}>
              <TextField
                name="tokenName"
                label="Token Name"
                placeholder=""
                description=""
                onInput={(e: any) => mergeSpecs({ tokenName: e.currentTarget.value })}
              />

              <button className="btn-primary" type="submit" disabled={!state.tokenName}>
                Make Contracts
              </button>
            </form>
          </div>
        ) : (
          <>{state.error ? <></> : <p className="bg-slate-100 p-6 rounded-md m-12">Initializing</p>}</>
        )}
        {state.error && (
          <div className="box-red mt-4">
            <p className="text-red-500">{state.error}</p>
          </div>
        )}
        {state.lucid && state.parameterizedContracts && (
          <>
            <div className="box-slate mt-6 wrapper-wide p-12">
              <h3 className="mb-2 text-gray-400">Redeem</h3>
              <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">
                {state.parameterizedContracts.redeem.script}
              </pre>

              <h3 className="mt-4 mb-2 text-gray-400">Gift Card</h3>
              <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">
                {state.parameterizedContracts.giftCard.script}
              </pre>
            </div>
            <div className="box-slate mt-6 wrapper-wide p-12">
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
                  <h3 className="mt-4 mb-2 text-gray-400">ADA Locked</h3>
                  <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">{state.lockTxHash}</pre>
                </>
              )}

              {state.url && (
                <>
                  <h3 className="mt-4 mb-2 text-gray-400">Redeem with URL</h3>
                  <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">{state.url}</pre>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Home;
