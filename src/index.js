// src/index.js

require('dotenv').config();
const { ethers } = require('ethers');
// Import getRandomInt for the delay
const { logger, delay, getRandomInt } = require('./utils');
const { injectiveConfig } = require('./config');
const { runTestSequence } = require('./modules/injectiveTest');

// --- SCHEDULER CONFIGURATION ---
const ITERATIONS_PER_CYCLE = 5;
const CYCLE_INTERVAL_HOURS = 24;
// Define a range for the delay between iterations (in milliseconds)
const MIN_DELAY_MS = 15000; // 15 seconds
const MAX_DELAY_MS = 60000; // 60 seconds
const CYCLE_INTERVAL_MS = CYCLE_INTERVAL_HOURS * 60 * 60 * 1000;
// --------------------------------

async function runFullTestCycle() {
  logger.header(`STARTING NEW TEST CYCLE: ${ITERATIONS_PER_CYCLE} iterations.`);
  
  const privateKey = process.env.TESTNET_PRIVATE_KEY;
  if (!privateKey) {
    logger.error("TESTNET_PRIVATE_KEY is not set in the .env file. Exiting.");
    process.exit(1);
  }
  
  const provider = new ethers.JsonRpcProvider(injectiveConfig.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  for (let i = 1; i <= ITERATIONS_PER_CYCLE; i++) {
    logger.header(`Running Injective Test - Iteration ${i} of ${ITERATIONS_PER_CYCLE}`);
    try {
      await runTestSequence(wallet);
      logger.success(`Iteration ${i} completed successfully.`);
    } catch (error) {
      logger.error(`Iteration ${i} failed: ${error.message}`);
    }
    
    if (i < ITERATIONS_PER_CYCLE) {
      // Generate a random delay within the defined range
      const randomDelay = getRandomInt(MIN_DELAY_MS, MAX_DELAY_MS);
      logger.info(`Waiting for a random delay of ${Math.round(randomDelay / 1000)} seconds before next iteration...`);
      await delay(randomDelay);
    }
  }

  logger.header(`TEST CYCLE COMPLETED.`);
}

function schedule() {
  const runAndReschedule = async () => {
    await runFullTestCycle();
    logger.info(`Next test cycle is scheduled to run in ${CYCLE_INTERVAL_HOURS} hours.`);
    setTimeout(runAndReschedule, CYCLE_INTERVAL_MS);
  };

  logger.info("Starting the first test cycle now...");
  runAndReschedule();
}

schedule();