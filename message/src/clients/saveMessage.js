const Message = require("../models/message");
const saveMessageTransaction = require("../transactions/saveMessage");

module.exports = function(messageParams, cb) {
  const {rollbackCharge} = require('../queue/queue')

  if (messageParams.status == "OK") {
    //COBRAR
    saveMessageTransaction(messageParams, cb);
  } else {
      //rollback
      Promise.resolve(saveMessageTransaction(messageParams, cb)).then((message) => rollbackCharge(messageParams))
  }
};
