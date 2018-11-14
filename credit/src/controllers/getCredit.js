const getCredit = require('../clients/getCredit');

module.exports = function (req, res, next) {
    return getCredit()
        .then(message => {
            res.status(200).json(message);
        })
}