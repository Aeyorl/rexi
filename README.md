# Rexi

Robinhood-first token launchpad, live on Robinhood Chain Testnet:
<https://rexi-launchpad.vercel.app>

Launch a token, fund it with a reward asset, and every holder accrues that reward
pro-rata to their balance and claims it whenever they like.

## Running locally

```sh
npm install
npm run server   # backend API on http://localhost:4000
npm run dev      # frontend on http://localhost:5173, proxies /api to the backend
```

## Chain integration

- Canonical testnet addresses, live transactions and the verification recipe:
  [`DEPLOYMENTS.md`](DEPLOYMENTS.md)
- Contract source and build notes: [`contracts/README.md`](contracts/README.md)
- Shared address/config module: [`src/services/deployments.js`](src/services/deployments.js)

Frontend wiring lives in [`src/services/rexiChain.js`](src/services/rexiChain.js)
(writes + reads) and [`server/routes/chain.mjs`](server/routes/chain.mjs) (event
index used by the Explore and Rewards pages).

## Verifying the deployment

```powershell
powershell -ExecutionPolicy Bypass -File script/verify-deployment.ps1   # bytecode matches source
node script/check-reads.mjs                                            # live state vs frontend reads
```

## Deploying the contract

Copy `.env.example` to `.env`, set the three treasury addresses and a funded
throwaway testnet `PRIVATE_KEY`, then run `script/deploy-testnet.ps1`. Never
commit a private key.

## Status

Testnet only. The reward-accounting accumulator is an initial prototype and has
not had an independent security review; mainnet is out of scope until it has.

---

This project is a Vite + React template. For the template documentation
(plugins, React Compiler, lint rules) see the sections below.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
