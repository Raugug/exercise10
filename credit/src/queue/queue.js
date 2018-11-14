const Bull = require('bull');
const creditQueue = new Bull('credit-queue', 'redis://localhost:6379');
const messageQueue = new Bull('message-queue', 'redis://localhost:6379');
const rollbackQueue = new Bull('rollback-queue', 'redis://localhost:6379');
const updateCredit = require('../clients/updateCredit');

const getCredit = require('../clients/getCredit');

creditQueue.process((job, done) => {
    const { cost } = job.data.location;
    getCredit()
        .then(credit => {
            let { amount } = credit[0];
            if (amount > 0) {
                amount -= cost;
                updateCredit({
                    amount,
                    status: "ok"
                }, function (_result, error) {
                    if (error) {
                        console.log('Error 500 Updating credit:', error);
                    }
                    console.log(`Message charged. Credit: ${amount}`);
                });
                return amount;
            } else {
                return 'No credit';
            };
        })
        .then(credit => messageQueue.add({ message: job.data, credit }))
        .then(() => done())
        .catch(error => console.log('Queue Error: ', error))
});

rollbackQueue.process((job, done) => {
    const { cost } = job.data.message.location;
    getCredit()
        .then(function(credit) {
            let { amount } = credit[0];
            amount += cost;
            return updateCredit({
                amount,
                status: "ok"
            }, function (_result, error) {
                if (error) {
                    console.log('Error 500 in rollback', error);
                }
                console.log(`Charge back. Credit: ${amount}`);
            })
        })
        .then(() => done()); 
});