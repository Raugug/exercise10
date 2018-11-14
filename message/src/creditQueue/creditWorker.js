const Queue = require('bull');
const sendMessage = require("../controllers/sendMessage"); 


const queue = new Queue('message', 'redis://127.0.0.1:6379');

module.exports = queue.process((job) => {sendMessage(job.data)});
