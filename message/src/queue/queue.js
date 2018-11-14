const Bull = require('bull');
const creditQueue = new Bull('credit-queue', 'redis://redis:6379');
const messageQueue = new Bull('message-queue', 'redis://redis:6379');
const rollbackQueue = new Bull('rollback-queue', 'redis://redis:6379');

const uuid = require('uuid');

const sendMessage = require('../controllers/sendMessage');
const saveMessage = require('../transactions/saveMessage');

const messagePrice = 1;

const checkCredit = (req, res, next) => {
    const { destination, body } = req.body;
    const messageId = uuid();
    return creditQueue
        .add({ destination, body, messageId, status: "PENDING", location: { cost: messagePrice, name: 'Default' } })
        .then(() => jobsNumber(creditQueue))
        .then(() => res.status(200).send(`Check status of message ${messageId}`))
        .then(() => saveMessage({
            ...req.body,
            status: "PENDING",
            messageId
        },
            function (_result, error) {
                if (error) {
                    console.log('Error 500.', error);
                } else {
                    console.log('Successfully saved');
                }
            })
        )
}

const jobsNumber = queue => {
    return queue.count()
        .then(jobs => console.log(`Jobs in queue: ${jobs}`))
}

const rollbackCharge = message => {
    return rollbackQueue
        .add({ message })
        .then(() => console.log('Message delivery failed. Rollback of charge'))
}

const handleCredit = data => {
    const { credit } = data;
    if(typeof credit == 'number') {
        return sendMessage(data)
    } else {
        return console.log('Error: ', credit);
    }
}

messageQueue.process(async (job, done) => {
    Promise.resolve(handleCredit(job.data))
        .then(() => done())
});

module.exports = { checkCredit, rollbackCharge };

/* const Queue = require("bull");
const queue = new Queue("message", "redis://127.0.0.1:6379");
const uuidv1 = require("uuid/v1");
const sendMessage = require("../controllers/sendMessage");
const createMessage = require("../controllers/createMessage");

module.exports = (req, res) => {
  let message = req.body;
  message.uuid = uuidv1();

  Promise.resolve(createMessage(message)).then(() => {
    queue.add(message).then(job => {
      res.end(`{"message status": http://localhost:9006/message/${message.uuid}/status`);
      sendMessage(body)
    });
  });
}; */
