const Bull = require('bull');
const creditQueue = new Bull('credit-queue', 'redis://localhost:6379');
const messageQueue = new Bull('message-queue', 'redis://localhost:6379');
const rollbackQueue = new Bull('rollback-queue', 'redis://localhost:6379');
const uuid = require('uuid');
const sendMessage = require('../controllers/sendMessage');
const saveMessage = require('../transactions/saveMessage');
const circuitBraker = require('../circuitBraker/braker');
let blockedQueue = false

//const port = process.env.PORT;
const port = 9010;

const messagePrice = 1;

if (circuitBraker.isOpen()) { messageQueue.pause() }
else { messageQueue.resume() }

circuitBraker.on('circuitOpen', () => {
    messageQueue.pause();
    console.log('Pause queue');
})
circuitBraker.on('circuitClosed', () => {
    messageQueue.resume();
    console.log('Resume queue');
})

const checkCredit = (req, res, next) => {
    const { destination, body } = req.body;
    const messageId = uuid();
   
        return creditQueue.count()
            .then(jobs => {
                if (jobs >= 10) blockedQueue = true;
                if (jobs <= 5) blockedQueue = false;
                return blockedQueue;
            })
            .then(() => {
              if (!blockedQueue){
                creditQueue.add({ destination, body, messageId, status: "PENDING", location: { cost: messagePrice, name: 'Default' } })
                return false;
              } else {
                  return true;
              }  
            })
            .then((blocked) => {
                if (blocked) {
                    res.status(500).send(`{"message status": Service is blocked. Try again later}`)
                } else {
                    res.status(200).send(`{"message status": http://localhost:${port}/message/${messageId}/status`)
                }
            })
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

const queueJobsNumber = (queue) => {
    return queue.count()
        .then(jobs => console.log(`Jobs in queue: ${jobs}`))
}

const rollbackCharge = (message) => {
    return rollbackQueue
        .add({ message })
        .then(() => console.log('Message delivery failed. Rollback of charge'))
}

const handleCredit = (data) => {
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

function isQueueBlocked() {
    return messageQueue
        .count()
        .then(jobs => {
            if(jobs <= 5) {
                blockedQueue = false;
            }
            if(jobs >= 10) {
                blockedQueue = true;
            }
        });
};

setInterval(() => {
    isQueueBlocked()
})

setInterval(() => queueJobsNumber(messageQueue), 4000)
module.exports = { checkCredit, rollbackCharge, queueJobsNumber };