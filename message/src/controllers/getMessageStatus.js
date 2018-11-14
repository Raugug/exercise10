const getMessageStatus = require("../clients/getMessageStatus");

module.exports = function(req, res) {
  getMessageStatus(req.params.messageId).then(status => {
    res.status(200).send(status)
    .catch(err => console.log('Error getting status', err));
  });
};
