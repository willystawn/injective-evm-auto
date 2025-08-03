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
      return await asyncFn();
    } catch (error) {
      lastError = error;
      if (error.message.includes('503')) {
        const waitTime = delayMs * Math.pow(2, i);
        logger.error(`[${operationName}] Attempt ${i + 1}/${maxRetries} failed with 503 error. Retrying in ${waitTime / 1000}s...`);
        await delay(waitTime);
      } else {
        // Don't retry on other errors
        throw error;
      }
    }
  }
  logger.error(`[${operationName}] All ${maxRetries} retries failed.`);
  throw lastError;
};


module.exports = { logger, delay, getRandomInt, getRandomFloatString, getRandomUserAgent, withRetry };
