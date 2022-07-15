let express = require('express');
let router = express.Router();
const bus = require("../controller/bus");
const jwtMiddleware = require("../../config/jwtMiddleware");

router.get('/bus/list',bus.getBusList);

router.get('/bus/list/selected',bus.selectMyBus);

module.exports = router;
