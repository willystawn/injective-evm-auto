# Injective Testnet WINJ Interaction Bot

This is a simple Node.js bot for interacting with the WINJ (Wrapped Injective) token on the Injective Testnet. The bot performs a cycle of wrapping INJ to WINJ, transferring some WINJ to a random address, and then withdrawing a portion back to INJ.

## Features

- **Human-like Behavior**: The bot uses random delays between transactions to simulate human behavior.
- **Resilient**: The bot can handle common errors and will automatically retry after a delay.
- **Customizable**: You can easily configure the bot's behavior by modifying the constants in `src/index.js`.
- **Safe**: The bot uses a `.env` file to keep your private key secure.

## Prerequisites

- Node.js and npm installed on your machine.
- An Injective Testnet account with some testnet INJ tokens.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/injective-winj-test.git
   cd injective-winj-test
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file:**
   Create a file named `.env` in the root of the project and add your Injective Testnet private key:
   ```
   TESTNET_PRIVATE_KEY=your_private_key_here
   ```

## Usage

To start the bot, run the following command:

```bash
node src/index.js
```

The bot will then start running and will continue to perform the transaction cycle until you stop it.

## How it Works

The bot performs the following steps in a loop:

1. **Check Balance**: It checks the INJ balance to ensure there are enough funds to perform the transactions.
2. **Wrap INJ**: It wraps a random amount of INJ into WINJ.
3. **Transfer WINJ**: It transfers a random portion of the newly wrapped WINJ to a new, randomly generated address.
4. **Withdraw WINJ**: It withdraws a small, random amount of the remaining WINJ back to INJ.
5. **Random Delay**: It waits for a random amount of time before starting the next cycle.

## Disclaimer

This bot is for educational and testing purposes only. Use it at your own risk. The author is not responsible for any loss of funds or other damages.