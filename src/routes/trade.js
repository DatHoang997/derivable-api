var express = require("express");
const contractsController = require("../controllers/contractsController");

var router = express.Router();

router.get("/contracts", contractsController.getContracts);
router.get("/orderbooks", contractsController.getOrderbooks)

module.exports = router;
