var express = require("express");
const topVolumeController = require("../controllers/topVolumeController");

var router = express.Router();

router.get("/top-volume/:address?", topVolumeController.getVolume);
router.get("/health", (req, res) => {
	return res.status(200).json({ status: "ok" });
});

module.exports = router;
