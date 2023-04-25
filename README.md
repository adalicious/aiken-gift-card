<hr>

<h1 align="center">
  <br>
  <a href="http://txpipe.io"><img src="public/adalicious.png" alt="Adalicious" width="100"></a>
  <br>
  Adalicious - Aiken Gift Card
  <br>
</h1>

<h4 align="center">Make a one shot minting and lock contract</h4>

<p align="center">
  <a href="#whats-this">What's This</a> •
  <a href="#tech">Tech</a> •
  <a href="#usage">usage</a> •
  <a href="#license">License</a>
</p>
<hr>

## What's This?

This is an example of a gift card. With these contracts you can lock anything and have it be unlockable only with a simultaneously minted NFT. This minted NFT holds the power to unlock the assets and is considered the "gift card".

This starter kit is based on the `Gift Card` example provided in the [Aiken documentation](https://aiken-lang.org/), adapted to work seamless with the Ogmios and Kupo instance provided by [Demeter](https://demeter.run) and implemented as a NextJS application. 

Reference the official documentation for details about how this starter kit was implemented and the logic behind the validators at the [Gift Card example](https://aiken-lang.org/example--gift-card).

## Tech

- [Aiken](https://aiken-lang.org)
- [Demeter](https://demeter.run)
- [lucid](https://github.com/spacebudz/lucid)
- [Kupo](https://hub.docker.com/r/cardanosolutions/kupo)
- [Ogmios](https://ogmios.dev/)
- [NextJs](https://nextjs.org/)

## Usage

Setup the required ENV variables for initializing Lucid with Kupos and Ogmios. If you are running this on Demeter you can get those variables by enabling the required Extensions and exposing the Port or using the Private DNS if you are running from a Cardano Workspace.

`KUPO_RUL`
`OGMIOS_URL`
`NETWORK`

Once you configuration is set you can start the project:

```
npm run build
npm run dev
```

You can access the front-end application in your browser at `localhost:3000` 

<img src="public/home.png"  alt="home">

### Create Gift Card

For creating a Gift Card first you need to input a name for your token so you can make the contracts:

<img src="public/make-contracts.png" alt="make-contracts">

Once the contracts are applied you will get the Gift Card and Redeem Scripts and you can select how much ADA you want to lock into the gift card

<img src="public/lock-ada.png" alt="lock-ada">

Once you are ready press the `CREATE GIFT CARD` button. You will be prompted to sign the transaction and the app will wait for the tx to be confirmed. 

Once confirmed you will get the `tx hash` and the `redeem URL`. The owner of the minted NFT can unlock the ADA in the contract by accessing this URL.

<img src="public/ada-locked.png" alt="ada-locked">


### Redeem Gift Card

For redeeming a Gift card you can access the URL generated at the moment of locking ADA, if you are the owner of the minted NFT you will be able to unlock the ADA in the contract.

<img src="public/redeem.png" alt="redeem">

Press the `REDEEM GIFT CARD` button. You will be prompted to sign the transaction and the ADA will be unlocked to your wallet. The application will show the `tx hash` of the generated transaction.

<img src="public/redeemed.png" alt="redeemed">



## License

[MIT](LICENSE)
