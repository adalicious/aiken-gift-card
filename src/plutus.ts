export const PLUTUS_JSON = {
  "preamble": {
    "title": "aiken-lang/gift_card",
    "description": "Create a gift card that can be used to redeem locked assets",
    "version": "0.0.0",
    "plutusVersion": "v2",
    "license": "Apache-2.0"
  },
  "validators": [
    {
      "title": "oneshot.gift_card",
      "redeemer": {
        "title": "rdmr",
        "schema": {
          "$ref": "#/definitions/oneshot~1Action"
        }
      },
      "parameters": [
        {
          "title": "token_name",
          "schema": {
            "$ref": "#/definitions/ByteArray"
          }
        },
        {
          "title": "utxo_ref",
          "schema": {
            "$ref": "#/definitions/aiken~1transaction~1OutputReference"
          }
        }
      ],
      "compiledCode": "590288010000323232323232323232323232323232232222533300c323232323232323232323232323232533302030230021323232533301e3370e9000000899299980f99b87003480084cdc780200b8a50301c32533301f3370e9000180f00088008a99810a492a4578706563746564206f6e20696e636f727265637420636f6e7374727563746f722076617269616e742e001632323300100d23375e6603a603e002900000c18008009112999813001099ba5480092f5c026464a6660466006004266e952000330290024bd700999802802800801981500198140010a99980f19b8700233702900024004266e3c00c058528180e0099bad3020002375c603c0022a6603a9201334c6973742f5475706c652f436f6e73747220636f6e7461696e73206d6f7265206974656d73207468616e206578706563746564001630210013200132323232533301d3370e90010008a5eb7bdb1804c8c8004dd59812800980d801180d8009980080180518008009112999810801099ba5480092f5c0264646464a66604066e3c0140044cdd2a40006604c6e980092f5c0266600e00e00600a6eb8c08800cdd59811001181280198118011bab301f001301f001301e001301d001301c00237586034002602000a6eb8c060004c0394ccc040cdc3a4000601e00220022a660249212a4578706563746564206f6e20696e636f727265637420636f6e7374727563746f722076617269616e742e0016301600130160023014001300a001149858dd7000980080091129998068010a4c2660126002601e00466600600660200040026600200290001111199980399b8700100300e233330050053370000890011808000801001118039baa001230053754002ae695cdab9c5573aaae7955cfaba05742ae89",
      "hash": "502ff5bb41c7b02e4950ad25572391efc87205cd6ab17b5826e625cb"
    },
    {
      "title": "oneshot.redeem",
      "datum": {
        "title": "_d",
        "schema": {
          "$ref": "#/definitions/Data"
        }
      },
      "redeemer": {
        "title": "_r",
        "schema": {
          "$ref": "#/definitions/Data"
        }
      },
      "parameters": [
        {
          "title": "token_name",
          "schema": {
            "$ref": "#/definitions/ByteArray"
          }
        },
        {
          "title": "policy_id",
          "schema": {
            "$ref": "#/definitions/ByteArray"
          }
        }
      ],
      "compiledCode": "5901830100003232323232323232323232323232232232222533300d32323232323232323232533301c301f0021323253330193370e00266e052000480084cdc78010090a50375a60380046eb8c06800454cc0652401334c6973742f5475706c652f436f6e73747220636f6e7461696e73206d6f7265206974656d73207468616e2065787065637465640016301d001320013232323253330193370e90010008a5eb7bdb1804c8c8004dd59810800980c001180d9baa0013300100300e3001001222533301d00213374a900125eb804c8c8c8c94ccc070cdc7802800899ba548000cc088dd300125eb804ccc01c01c00c014dd7180f0019bab301e0023021003301f002375660360026036002603400260320026030002601c002602a00260180022930b1bae001375c0026002002444a66601800429309980418009807001199801801980780100099800800a40004444666600c66e1c00400c0348cccc014014cdc000224004601e0020040044600c6ea80055cd2b9b5738aae7555cf2ab9f5740ae855d11",
      "hash": "f58be496ad6e6233bfc241e35ba089cc6eb167945df2f62373d16b51"
    }
  ],
  "definitions": {
    "ByteArray": {
      "dataType": "bytes"
    },
    "Data": {
      "title": "Data",
      "description": "Any Plutus data."
    },
    "Int": {
      "dataType": "integer"
    },
    "aiken/transaction/OutputReference": {
      "title": "OutputReference",
      "description": "An `OutputReference` is a unique reference to an output on-chain. The `output_index`\n corresponds to the position in the output list of the transaction (identified by its id)\n that produced that output",
      "anyOf": [
        {
          "title": "OutputReference",
          "dataType": "constructor",
          "index": 0,
          "fields": [
            {
              "title": "transaction_id",
              "$ref": "#/definitions/aiken~1transaction~1TransactionId"
            },
            {
              "title": "output_index",
              "$ref": "#/definitions/Int"
            }
          ]
        }
      ]
    },
    "aiken/transaction/TransactionId": {
      "title": "TransactionId",
      "description": "A unique transaction identifier, as the hash of a transaction body. Note that the transaction id\n isn't a direct hash of the `Transaction` as visible on-chain. Rather, they correspond to hash\n digests of transaction body as they are serialized on the network.",
      "anyOf": [
        {
          "title": "TransactionId",
          "dataType": "constructor",
          "index": 0,
          "fields": [
            {
              "title": "hash",
              "$ref": "#/definitions/ByteArray"
            }
          ]
        }
      ]
    },
    "oneshot/Action": {
      "title": "Action",
      "anyOf": [
        {
          "title": "Mint",
          "dataType": "constructor",
          "index": 0,
          "fields": []
        },
        {
          "title": "Burn",
          "dataType": "constructor",
          "index": 1,
          "fields": []
        }
      ]
    }
  }
}
