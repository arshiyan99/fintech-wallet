<div align="center">

# FinPay Wallet

**A responsive wallet dashboard concept built with HTML, CSS, and vanilla JavaScript.**

[View the project](https://github.com/arshiyan99/fintech-wallet)

</div>

---

## Overview

FinPay Wallet is a browser-based front-end demo for exploring a personal finance dashboard. It brings balances, transaction activity, transfer forms, and profile preferences together in a responsive interface.

> **Demo only:** This project is not a financial product. Transfers and top-ups update a locally stored demo balance; they do not move real money or connect to a bank or payment provider.

## Features

- **Wallet dashboard** — review the available demo balance and recent transactions.
- **Transfer and top-up flows** — try sending money or adding funds with amount validation.
- **Transaction history** — search transactions and filter by income or expense.
- **Profile preferences** — toggle notification and weekly-summary preferences.
- **Persistent demo state** — balance, transactions, and preferences are stored in the browser's `localStorage`.
- **Responsive interface** — layouts adapt to mobile and desktop screen sizes.

## Getting started

No dependencies, package installation, or build step are required.

1. Clone the repository:

   ```bash
   git clone https://github.com/arshiyan99/fintech-wallet.git
   cd fintech-wallet
   ```

2. Open `index.html` in a browser. Alternatively, serve the project directory with any static file server and open its local URL.

## Project structure

| Path | Description |
| --- | --- |
| `index.html` | Wallet dashboard |
| `transfer.html` | Send-money and top-up demo |
| `history.html` | Searchable and filterable transaction history |
| `profile.html` | Profile details and preferences |
| `contact.html` | Contact options |
| `css/style.css` | Shared styles and responsive layouts |
| `js/app.js` | Wallet state, persistence, and page interactions |
| `assets/images/` | Interface and transaction images |

## Data and privacy

The demo stores wallet state in the browser's `localStorage` under the `finpay-wallet-state` key. This is local browser storage, not secure financial storage. Clearing site data removes the saved demo state.

The sample profile and contact details in the interface are part of the project content. Review or replace them before redistributing or deploying the site publicly.

## License

This project is licensed under the [MIT License](./LICENSE).
