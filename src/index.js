// src/index.js

require('dotenv').config();
const { ethers, FetchRequest } = require('ethers');
const { logger, delay, getRandomInt, getRandomUserAgent } = require('./utils');
const { injectiveConfig } = require('./config');
const { runTestSequence } = require('./modules/injectiveTest');

// --- CONFIGURATION ---
// Random delay between each successful transaction cycle (in milliseconds)
const MIN_DELAY_SUCCESS_MS = 60 * 1000;      // 1 minute
const MAX_DELAY_SUCCESS_MS = 10 * 60 * 1000; // 10 minutes

// Delay in case of an error
const ERROR_DELAY_MS = 5 * 60 * 1000;       // 5 minutes for general errors
const INSUFFICIENT_FUNDS_DELAY_MS = 60 * 60 * 1000; // 1 hour if tokens are depleted
// --------------------------------

async function main() {
  logger.header("🚀 STARTING INJECTIVE HUMANIZED BOT 🚀");

  const privateKey = process.env.TESTNET_PRIVATE_KEY;
  if (!privateKey) {
    logger.error("TESTNET_PRIVATE_KEY is not set in the .env file. Exiting.");
    process.exit(1);
  }

  // --- Setup Provider with Random User-Agent ---
  const customFetch = new FetchRequest(injectiveConfig.rpcUrl);
  customFetch.setHeader('User-Agent', getRandomUserAgent());
  
  const provider = new ethers.JsonRpcProvider(customFetch);
  const wallet = new ethers.Wallet(privateKey, provider);

  logger.info(`Wallet Address: ${wallet.address}`);
  logger.info("Bot will run continuously. Press CTRL+C to stop.");

  // --- Main Loop ---
  while (true) {
    try {
      // On each iteration, use a new User-Agent to disguise the request
      customFetch.setHeader('User-Agent', getRandomUserAgent());
      
      logger.header("Starting a new transaction cycle...");
      await runTestSequence(wallet);
      logger.success("Transaction cycle completed successfully.");

      // Wait for a random duration before the next cycle
      const randomDelay = getRandomInt(MIN_DELAY_SUCCESS_MS, MAX_DELAY_SUCCESS_MS);
      logger.info(`Waiting for a random delay of ${Math.round(randomDelay / 1000 / 60)} minutes before next cycle...`);
      await delay(randomDelay);

    } catch (error) {
      const errorMessage = error.message.toLowerCase();
      logger.error(`An error occurred in the transaction cycle: ${error.message}`);

      if (errorMessage.includes("insufficient funds")) {
        logger.error("Detected insufficient funds. Pausing for 1 hour...");
        await delay(INSUFFICIENT_FUNDS_DELAY_MS);
      } else {
        logger.error(`An unexpected error occurred. Pausing for ${ERROR_DELAY_MS / 1000 / 60} minutes before retrying...`);
        await delay(ERROR_DELAY_MS);
      }
    }
  }
}

main().catch(err => {
  logger.error("A fatal error occurred. The bot will exit.");
  logger.error(err);
  process.exit(1);
});
