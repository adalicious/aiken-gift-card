import { Validators, applyParams, readValidators } from "@/utils";
import { Constr, Data, Kupmios, Lucid, Network, fromText } from "lucid-cardano";
import type { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";

export async function getServerSideProps(context: {
  query: { lockAddress: string; txHash: string; outputIndex: string; tokenName: string };
}) {
  const { lockAddress, txHash, outputIndex, tokenName } = context.query;

  const validators = readValidators();

  // Gets the env variables for Kupo and Ogmios URL
  const ENV = {
    KUPO_URL: process.env.KUPO_RUL as string,
    OGMIOS_URL: process.env.OGMIOS_URL as string,
    NETWORK: process.env.NETWORK as string,
  };

  return {
    props: {
      ENV,
      lockAddress,
      txHash,
      outputIndex: Number(outputIndex),
      tokenName,
      validators,
    },
  };
}

type State = {
  lucid: Lucid | undefined;
  lockAddress: string;
  txHash: string;
  outputIndex: number;
  tokenName: string;
  unlockTxHash: string | undefined;
  waitingUnlockTx: boolean;
  error: string | undefined;
};

const Home: NextPage<{
  ENV: Record<string, string>;
  lockAddress: string;
  txHash: string;
  outputIndex: number;
  tokenName: string;
  validators: Validators;
}> = ({ ENV, lockAddress, txHash, outputIndex, tokenName, validators }) => {
  const [state, setState] = useState<State>({
    lucid: undefined,
    lockAddress,
    txHash,
    outputIndex,
    tokenName,
    unlockTxHash: undefined,
    waitingUnlockTx: false,
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

  const makeContracts = async () => {
    const outputReference = {
      txHash: state.txHash,
      outputIndex: state.outputIndex,
    };

    const contracts = applyParams(state.tokenName, outputReference, validators, state.lucid!);

    return contracts;
  };

  const redeemGiftCard = async (e: Event) => {
    e.preventDefault();

    mergeSpecs({ error: "", waitingUnlockTx: true });

    try {
      const contracts = await makeContracts();

      if (!contracts) throw new Error(`unable to initialize contracts`);

      const assetName = `${contracts.policyId}${fromText(state.tokenName || "")}`;

      // Action::Burn
      const burnRedeemer = Data.to(new Constr(1, []));

      const utxos = await state.lucid!.utxosAt(state.lockAddress);

      console.log(utxos);

      if (!utxos.length) throw new Error(`gift card is empty`);

      const tx = await state
        .lucid!.newTx()
        .collectFrom(utxos, Data.void())
        .attachMintingPolicy(contracts.giftCard)
        .attachSpendingValidator(contracts.redeem)
        .mintAssets({ [assetName]: BigInt(-1) }, burnRedeemer)
        .complete();

      const txSigned = await tx.sign().complete();

      const txHash = await txSigned.submit();

      const success = await state.lucid!.awaitTx(txHash);

      mergeSpecs({ waitingUnlockTx: false });

      if (success) mergeSpecs({ unlockTxHash: txHash });
    } catch (err: any) {
      mergeSpecs({ error: err, waitingUnlockTx: false });
    }
  };

  return (
    <>
      <div className="h-fill flex flex-col items-center pt-24 pb-24">
        <h2 className="text-gray-600 title-lg">Redeem your Gift Card</h2>

        {state.lucid ? (
          <>
            <div className="wrapper-wide box-slate flex flex-col text-center items-center p-12 mt-6">
              <button
                className="btn-primary mx-auto"
                type="button"
                onClick={(e: any) => redeemGiftCard(e)}
                disabled={!!state.unlockTxHash || state.waitingUnlockTx}
              >
                {state.waitingUnlockTx ? "Waiting for Tx..." : "Redeem Gift Card (Unlocks ADA)"}
              </button>

              {state.unlockTxHash && (
                <>
                  <h3 className="mt-12 mb-2 text-gray-400">ADA Unlocked</h3>
                  <pre className="bg-slate-200 p-2 rounded overflow-x-scroll">{state.unlockTxHash}</pre>
                </>
              )}
            </div>
          </>
        ) : (
          <>{state.error ? <></> : <p className="bg-slate-100 p-6 rounded-md m-12">Initializing</p>}</>
        )}
        {state.error && (
          <div className="box-red mt-4">
            <p className="text-red-500">{state.error}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
