const Message = require("../models/message");

module.exports = function(messageId) {
  return Message().find({messageId}, {_id:0, status: 1});
};
