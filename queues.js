require('dotenv').config();
const Queue = require('bull');

const queues = {
  feedbackQueue: new Queue('feedback', process.env.REDIS_URL),
  monoQueue: new Queue('mono', process.env.REDIS_URL)
};


module.exports = queues;