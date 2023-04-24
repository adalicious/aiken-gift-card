/* eslint-disable @next/next/no-img-element */

import { Constr, Data, Kupmios, Lucid, Network, fromText } from "lucid-cardano";
import type { NextPage } from "next";
import { verify } from "njwt";
import { useCallback, useEffect, useState } from "react";

export async function getServerSideProps(context: { query: { token: string } }) {
  const { token } = context.query;

  // Verifies token signature for getting the encoded claims
  const jwt = verify(token, process.env.SIGNING_SECRET);

  const body = jwt?.body.toJSON();

  if (!body) return;

  // Gets the env variables for Kupo and Ogmios URL
  const ENV = {
    KUPO_URL: (process.env.KUPO_RUL as string) || "https://kupo-preview-api-alala-f98d7b.us1.demeter.builders",
    OGMIOS_URL: (process.env.OGMIOS_URL as string) || "wss://ogmios-preview-api-alala-f98d7b.us1.demeter.builders",
    NETWORK: (process.env.NETWORK as string) || "Preview",
  };

  return {
    props: {
      ENV,
      lockAddress: body["lockAddress"]?.toString(),
      tokenName: body["tokenName"]?.toString(),
      giftCard: body["giftCard"]?.toString(),
      redeem: body["redeem"]?.toString(),
      policyId: body["policyId"]?.toString(),
    },
  };
}

type State = {
  lucid: Lucid | undefined;
  lockAddress: string;
  tokenName: string;
  giftCard: string;
  redeem: string;
  policyId: string;
  unlockTxHash: string | undefined;
  waitingUnlockTx: boolean;
  error: string | undefined;
};

const Home: NextPage<{
  ENV: Record<string, string>;
  lockAddress: string;
  tokenName: string;
  giftCard: string;
  redeem: string;
  policyId: string;
}> = ({ ENV, lockAddress, tokenName, giftCard, redeem, policyId }) => {
  const [state, setState] = useState<State>({
    lucid: undefined,
    lockAddress,
    tokenName,
    giftCard,
    redeem,
    policyId,
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

  const redeemGiftCard = async (e: Event) => {
    e.preventDefault();

    mergeSpecs({ waitingUnlockTx: true });

    try {
      const utxos = await state.lucid!.utxosAt(state.lockAddress);

      const assetName = `${state.policyId}${fromText(state.tokenName || "")}`;

      // Action::Burn
      const burnRedeemer = Data.to(new Constr(1, []));

      const tx = await state
        .lucid!.newTx()
        .collectFrom(utxos, Data.void())
        .attachMintingPolicy({ type: "PlutusV2", script: state.giftCard })
        .attachSpendingValidator({ type: "PlutusV2", script: state.redeem })
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
      <div className="h-fill flex flex-col items-center pt-24 pb-24">
        <h2 className="text-gray-600 title-lg">Redeem your Gift Card</h2>

        {state.lucid ? (
          <>
            <div className="box-border mt-6 wrapper-wide p-12 items-center">
              <button
                className="btn-primary mt-4 mx-auto"
                type="button"
                onClick={(e: any) => redeemGiftCard(e)}
                disabled={!!state.unlockTxHash}
              >
                {state.waitingUnlockTx ? "Waiting for Tx..." : "Redeem Gift Card (Unlocks ADA)"}
              </button>
            </div>

            {state.unlockTxHash && (
              <div className="box-border mt-6 wrapper-wide p-12">
                <h3 className="mt-4 mb-2 text-gray-400">ADA Unlocked</h3>
                <p>{state.unlockTxHash}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {state.error ? (
              <div className="box-red mt-4">
                <p className="text-red-500">{state.error}</p>
              </div>
            ) : (
              <p className="bg-slate-100 p-6 rounded-md m-12">Initializing</p>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Home;
