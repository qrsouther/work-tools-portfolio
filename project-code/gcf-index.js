/**
 * Google Cloud Function entry point
 * This file wraps our main application for Cloud Functions
 *
 * Triggered by Cloud Scheduler via HTTP request
 */

const { main } = require('./dist/index.js');

/**
 * HTTP Cloud Function that runs the Blueprint tracker
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.runBlueprintTracker = async (req, res) => {
  console.log('🚀 Blueprint Tracker Cloud Function triggered at:', new Date().toISOString());

  try {
    // Run the main application
    await main();

    // Send success response
    res.status(200).send({
      status: 'success',
      message: 'Blueprint tracker completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error running Blueprint tracker:', error);

    // Send error response
    res.status(500).send({
      status: 'error',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
};
