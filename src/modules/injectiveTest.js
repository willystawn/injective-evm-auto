// src/modules/injectiveTest.js

const { ethers } = require('ethers');
const { injectiveConfig } = require('../config');
const { logger, getRandomFloatString, withRetry } = require('../utils');

/**
 * Executes a single, randomized test sequence for WINJ.
 * @param {ethers.Wallet} wallet - The wallet instance to use for transactions.
 */
async function runTestSequence(wallet) {
  logger.info(`Connecting to Injective Testnet via RPC: ${injectiveConfig.rpcUrl}`);
  const provider = wallet.provider;
  const winjContract = new ethers.Contract(injectiveConfig.winjContractAddress, injectiveConfig.winjAbi, wallet);

  logger.info(`Using Wallet: ${wallet.address}`);
  const contractAddress = await withRetry(() => winjContract.getAddress(), 3, 1000, 'getContractAddress');
  logger.info(`WINJ Contract Address: ${contractAddress}`);
  
  const logBalances = async (walletAddress, message) => {
    try {
      // Use withRetry for balance checks
      const injBalance = await withRetry(() => provider.getBalance(walletAddress), 3, 1000, `getBalance (${message})`);
      const winjBalance = await withRetry(() => winjContract.balanceOf(walletAddress), 3, 1000, `getBalanceOf (${message})`);
      
      logger.info(`--- Balance Check: ${message} ---`);
      logger.info(`Address : ${walletAddress}`);
      logger.info(`INJ Balance: ${ethers.formatEther(injBalance)} INJ`);
      logger.info(`WINJ Balance: ${ethers.formatEther(winjBalance)} WINJ`);
      logger.info(`--------------------------------------`);
    } catch (e) {
      // Log the error but don't crash the sequence, as this is a logging function.
      logger.error(`Failed to check balance for ${walletAddress} (${message}): ${e.message}`);
    }
  };

  // === STEP 1: CHECK INITIAL BALANCES ===
  await logBalances(wallet.address, "Initial State");
  
  // This balance check is critical, so we wrap it and let it throw on failure
  const initialInjBalance = await withRetry(() => provider.getBalance(wallet.address), 3, 1500, 'initialGetBalance');
  if (initialInjBalance < ethers.parseEther('0.05')) { // Minimum balance check
    throw new Error("Insufficient funds to start the cycle. INJ balance is too low.");
  }

  // === STEP 2: DEPOSIT (WRAP INJ TO WINJ) WITH RANDOM AMOUNT ===
  // Using a smaller, random amount for the deposit
  const randomAmountWrapStr = getRandomFloatString(0.005, 0.015, 5); // e.g., 0.00782
  const amountToWrap = ethers.parseEther(randomAmountWrapStr);
  logger.info(`>>> STEP 2: Depositing (wrapping) a random amount of ${randomAmountWrapStr} INJ to WINJ...`);
  
  try {
    // Wrap the transaction sending and waiting with retry logic
    const txDeposit = await withRetry(() => winjContract.deposit({ value: amountToWrap }), 3, 2000, 'deposit');
    logger.info(`Deposit transaction sent. Hash: ${txDeposit.hash}`);
    logger.info(`View on Explorer: ${injectiveConfig.explorerUrl}/tx/${txDeposit.hash}`);
    await withRetry(() => txDeposit.wait(), 3, 5000, 'deposit.wait');
    logger.success("Deposit completed successfully.");
  } catch (err) {
    logger.error(`Deposit failed: ${err.message}`);
    throw err; // Throw the error to the main loop to be handled
  }
  await logBalances(wallet.address, "After Deposit");

  // === STEP 3: TRANSFER A RANDOM PORTION OF THE WRAPPED WINJ ===
  const randomPortion = Math.random() * (0.7 - 0.3) + 0.3; // Randomly between 30% and 70%
  const amountToTransfer = (amountToWrap * BigInt(Math.floor(randomPortion * 100))) / 100n; // Safe BigInt calculation
  const amountToTransferStr = ethers.formatEther(amountToTransfer);
  logger.info(`>>> STEP 3: Transferring a random portion (~${(randomPortion * 100).toFixed(0)}% = ${amountToTransferStr} WINJ) to a new random address...`);
  
  const recipientWallet = ethers.Wallet.createRandom();
  const recipientAddress = recipientWallet.address;
  logger.info(`Recipient Address: ${recipientAddress}`);

  try {
    const txTransfer = await withRetry(() => winjContract.transfer(recipientAddress, amountToTransfer), 3, 2000, 'transfer');
    logger.info(`Transfer transaction sent. Hash: ${txTransfer.hash}`);
    logger.info(`View on Explorer: ${injectiveConfig.explorerUrl}/tx/${txTransfer.hash}`);
    await withRetry(() => txTransfer.wait(), 3, 5000, 'transfer.wait');
    logger.success("Transfer completed successfully.");
  } catch (err) {
    logger.error(`Transfer failed: ${err.message}`);
    // Don't throw an error, consider it a minor failure and continue
  }
  await logBalances(wallet.address, "Sender State After Transfer");
  
  // === STEP 4: WITHDRAW A SMALL, RANDOM AMOUNT OF WINJ ===
  logger.info(">>> STEP 4: Withdrawing a small, random amount of WINJ back to INJ...");
  try {
    const currentWinjBalance = await withRetry(() => winjContract.balanceOf(wallet.address), 3, 1000, 'getBalanceForWithdraw');
    if (currentWinjBalance === 0n) {
        logger.info("No WINJ balance to withdraw. Skipping withdrawal.");
        return; // Exit the function if there is no balance
    }

    // Take a small portion of the remaining WINJ balance to withdraw
    const withdrawPortion = Math.random() * (0.5 - 0.1) + 0.1; // Take 10%-50% of the remaining balance
    let amountToWithdraw = (currentWinjBalance * BigInt(Math.floor(withdrawPortion * 100))) / 100n;
    
    // Make sure not to try to withdraw 0
    if (amountToWithdraw > 0n) {
      const amountToWithdrawStr = ethers.formatEther(amountToWithdraw);
      logger.info(`Current WINJ balance is ${ethers.formatEther(currentWinjBalance)}. Attempting to withdraw ~${(withdrawPortion*100).toFixed(0)}% (${amountToWithdrawStr} WINJ).`);
      
      const txWithdraw = await withRetry(() => winjContract.withdraw(amountToWithdraw), 3, 2000, 'withdraw');
      logger.info(`Withdraw transaction sent. Hash: ${txWithdraw.hash}`);
      logger.info(`View on Explorer: ${injectiveConfig.explorerUrl}/tx/${txWithdraw.hash}`);
      await withRetry(() => txWithdraw.wait(), 3, 5000, 'withdraw.wait');
      logger.success("Partial withdraw completed successfully.");

    } else {
      logger.info(`Calculated withdrawal amount is too small. Skipping withdrawal.`);
    }
  } catch (err) {
    logger.error(`Withdraw failed: ${err.message}`);
    // Don't throw an error, just log it and let the cycle complete
  }
  await logBalances(wallet.address, "Final State for this Cycle");
}

module.exports = { runTestSequence };
