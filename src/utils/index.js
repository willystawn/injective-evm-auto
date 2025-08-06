// src/utils/index.js

const randomUseragent = require('random-useragent');

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (msg) => console.log(`[${getTimestamp()}] [INFO] ${msg}`),
  success: (msg) => console.log(`[${getTimestamp()}] [SUCCESS] ${msg}`),
  error: (msg) => console.error(`[${getTimestamp()}] [ERROR] ${msg}`),
  header: (msg) => console.log(`
==================== ${msg} ====================
`),
};

/**
 * Pauses execution for a given amount of time.
 * @param {number} ms - The number of milliseconds to wait.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a random integer between a min and max value (inclusive).
 * @param {number} min - The minimum possible value.
 * @param {number} max - The maximum possible value.
 * @returns {number} A random integer.
 */
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random float string between a min and max value, with fixed precision.
 * This is safer for converting to wei than using raw floats.
 * @param {number} min - The minimum possible value.
 * @param {number} max - The maximum possible value.
 * @param {number} precision - The number of decimal places.
 * @returns {string} A random float as a string.
 */
const getRandomFloatString = (min, max, precision) => {
  return (Math.random() * (max - min) + min).toFixed(precision);
};

/**
 * Generates a random user-agent string.
 * @returns {string} A random user-agent string.
 */
const getRandomUserAgent = () => {
    return randomUseragent.getRandom();
};

/**
 * Retries an async function with exponential backoff.
 * @param {Function} asyncFn - The async function to retry.
 * @param {number} maxRetries - The maximum number of retries.
 * @param {number} delayMs - The initial delay in milliseconds.
 * @param {string} operationName - A descriptive name for the operation being retried.
 * @returns {Promise<any>} The result of the async function if successful.
 */
const withRetry = async (asyncFn, maxRetries = 3, delayMs = 1000, operationName = 'operation') => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Attempt to execute the function
      return await asyncFn();
    } catch (error) {
      lastError = error;
      const errorMessage = error.message ? error.message.toLowerCase() : '';

      // Define what constitutes a retryable error.
      // Ethers.js provides specific error codes for transient issues.
      const isRetryable =
        error.code === 'SERVER_ERROR' ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        errorMessage.includes('503') ||
        errorMessage.includes('service temporarily unavailable');

      if (isRetryable) {
        const waitTime = delayMs * Math.pow(2, i); // Exponential backoff
        logger.error(`[${operationName}] Attempt ${i + 1}/${maxRetries} failed with a retryable error (${error.code || 'N/A'}). Retrying in ${waitTime / 1000}s...`);
        await delay(waitTime);
      } else {
        // If the error is not retryable (e.g., "insufficient funds"), throw it immediately.
        throw error;
      }
    }
  }

  // If the loop completes, all retries have failed.
  logger.error(`[${operationName}] All ${maxRetries} retries failed.`);
  throw lastError; // Throw the last error that occurred.
};


module.exports = { logger, delay, getRandomInt, getRandomFloatString, getRandomUserAgent, withRetry };