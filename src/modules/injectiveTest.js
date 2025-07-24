// src/modules/injectiveTest.js

const { ethers } = require('ethers');
const { injectiveConfig } = require('../config');
const { logger, getRandomFloatString } = require('../utils'); // We no longer need getRandomInt here

/**
 * Executes the full test sequence for WINJ on Injective Testnet with randomized behavior.
 * @param {ethers.Wallet} wallet - The wallet instance to use for transactions.
 */
async function runTestSequence(wallet) {
  logger.info(`Connecting to Injective Testnet via RPC: ${injectiveConfig.rpcUrl}`);
  const provider = wallet.provider;
  const winjContract = new ethers.Contract(injectiveConfig.winjContractAddress, injectiveConfig.winjAbi, wallet);

  logger.info(`Using Wallet: ${wallet.address}`);
  logger.info(`WINJ Contract Address: ${await winjContract.getAddress()}`);
  
  const logBalances = async (walletAddress, message) => {
    const injBalance = await provider.getBalance(walletAddress);
    const winjBalance = await winjContract.balanceOf(walletAddress);
    logger.info(`--- Balance Check: ${message} ---`);
    logger.info(`Address : ${walletAddress}`);
    logger.info(`INJ Balance: ${ethers.formatEther(injBalance)} INJ`);
    logger.info(`WINJ Balance: ${ethers.formatEther(winjBalance)} WINJ`);
    logger.info(`--------------------------------------`);
  };

  // === STEP 1: CHECK INITIAL BALANCES ===
  await logBalances(wallet.address, "Initial State");

  // === STEP 2: DEPOSIT (WRAP INJ TO WINJ) WITH RANDOM AMOUNT ===
  const randomAmountWrapStr = getRandomFloatString(0.01, 0.025, 4);
  const amountToWrap = ethers.parseEther(randomAmountWrapStr);
  logger.info(`>>> STEP 2: Depositing (wrapping) a random amount of ${randomAmountWrapStr} INJ to WINJ...`);
  
  try {
    const txDeposit = await winjContract.deposit({ value: amountToWrap });
    logger.info(`Deposit transaction sent. Hash: ${txDeposit.hash}`);
    logger.info(`View on Explorer: ${injectiveConfig.explorerUrl}/tx/${txDeposit.hash}`);
    await txDeposit.wait();
    logger.success("Deposit completed successfully.");
  } catch (err) {
    logger.error(`Deposit failed: ${err.reason || err.message}`);
    throw new Error("Deposit failed, stopping sequence.");
  }
  await logBalances(wallet.address, "After Deposit");

  // === STEP 3: TRANSFER A RANDOM PORTION OF THE WRAPPED WINJ ===
  // We'll keep this logic simple: transfer roughly half of what was just wrapped.
  const amountToTransfer = amountToWrap / 2n; // Using BigInt division for safety
  const amountToTransferStr = ethers.formatEther(amountToTransfer);
  logger.info(`>>> STEP 3: Transferring ~50% of wrapped amount (${amountToTransferStr} WINJ) to a random address...`);
  const recipientWallet = ethers.Wallet.createRandom();
  const recipientAddress = recipientWallet.address;
  logger.info(`Recipient Address: ${recipientAddress}`);

  try {
    const txTransfer = await winjContract.transfer(recipientAddress, amountToTransfer);
    logger.info(`Transfer transaction sent. Hash: ${txTransfer.hash}`);
    logger.info(`View on Explorer: ${injectiveConfig.explorerUrl}/tx/${txTransfer.hash}`);
    await txTransfer.wait();
    logger.success("Transfer completed successfully.");
  } catch (err) {
    logger.error(`Transfer failed: ${err.reason || err.message}`);
  }
  await logBalances(wallet.address, "Sender State After Transfer");
  await logBalances(recipientAddress, "Recipient State After Transfer");

  // ======================================================================
  // === PERUBAHAN UTAMA DI SINI / MAIN CHANGE IS HERE ===
  // ======================================================================
  // === STEP 4: WITHDRAW A SMALL, RANDOM AMOUNT (PARTIAL WITHDRAW) ===
  logger.info(">>> STEP 4: Withdrawing a small, random amount of WINJ back to INJ...");
  try {
    const currentWinjBalance = await winjContract.balanceOf(wallet.address);
    
    if (currentWinjBalance > 0) {
      // Define a small, random range for withdrawal, similar to wrapping.
      // e.g., 0.005 to 0.020 WINJ.
      const randomAmountWithdrawStr = getRandomFloatString(0.005, 0.020, 4);
      const amountToWithdraw = ethers.parseEther(randomAmountWithdrawStr);

      // CRUCIAL CHECK: Ensure we have enough balance to withdraw the random amount.
      if (amountToWithdraw <= currentWinjBalance) {
        logger.info(`Current WINJ balance is ${ethers.formatEther(currentWinjBalance)}. Attempting to withdraw ${randomAmountWithdrawStr} WINJ.`);
        
        const txWithdraw = await winjContract.withdraw(amountToWithdraw);
        logger.info(`Withdraw transaction sent. Hash: ${txWithdraw.hash}`);
        logger.info(`View on Explorer: ${injectiveConfig.explorerUrl}/tx/${txWithdraw.hash}`);
        await txWithdraw.wait();
        logger.success("Partial withdraw completed successfully.");

      } else {
        // The random amount is more than we have. Skip this withdrawal to avoid errors.
        logger.info(`Want to withdraw ${randomAmountWithdrawStr} WINJ, but only have ${ethers.formatEther(currentWinjBalance)}. Skipping withdrawal for this iteration.`);
      }
    } else {
      logger.info("No WINJ balance to withdraw.");
    }
  } catch (err) {
    logger.error(`Withdraw failed: ${err.reason || err.message}`);
    // No need to throw an error, just log and continue the cycle.
  }
  await logBalances(wallet.address, "Final State");
}

module.exports = { runTestSequence };