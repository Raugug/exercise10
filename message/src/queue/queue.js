const Bull = require('bull');
const creditQueue = new Bull('credit-queue', 'redis://redis:6379');
const messageQueue = new Bull('message-queue', 'redis://redis:6379');
const rollbackQueue = new Bull('rollback-queue', 'redis://redis:6379');
const uuid = require('uuid');
const sendMessage = require('../controllers/sendMessage');
const saveMessage = require('../transactions/saveMessage');
const port = process.env.PORT;

const messagePrice = 1;

const checkCredit = (req, res, next) => {
    const { destination, body } = req.body;
    const messageId = uuid();
    return creditQueue
        .add({ destination, body, messageId, status: "PENDING", location: { cost: messagePrice, name: 'Default' } })
        .then(() => jobsNumber(creditQueue))
        .then(() => res.status(200).send(`{"message status": http://localhost:${port}/message/${message.uuid}/status`))
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