// src/utils/index.js

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (msg) => console.log(`[${getTimestamp()}] [INFO] ${msg}`),
  success: (msg) => console.log(`[${getTimestamp()}] [✅ SUCCESS] ${msg}`),
  error: (msg) => console.error(`[${getTimestamp()}] [❌ ERROR] ${msg}`),
  header: (msg) => console.log(`\n==================== ${msg} ====================\n`),
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

module.exports = { logger, delay, getRandomInt, getRandomFloatString };