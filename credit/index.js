const express = require("express");
const bodyParser = require("body-parser");
const {
  Validator,
  ValidationError
} = require("express-json-validator-middleware");
const updateCredit = require("./src/controllers/updateCredit");
const getCredit = require("./src/controllers/getCredit");

const app = express();
const port = 9020;


const validator = new Validator({ allErrors: true });
const { validate } = validator;
require ('./src/queue/queue');

const creditSchema = {
  type: "object",
  required: ["amount"],
  properties: {
    location: {
      type: "string"
    },
    amount: {
      type: "number"
    }
  }
};

app.post(
  "/credit",
  bodyParser.json(),
  validate({ body: creditSchema }),
  updateCredit
);

app.get("/credit",getCredit);

app.use(function(err, req, res, next) {
  console.log(res.body);
  if (err instanceof ValidationError) {
    res.sendStatus(400);
  } else {
    res.sendStatus(500);
  }
});

app.listen(port, function() {
  console.log(`App credit started on PORT ${port}`);
});
