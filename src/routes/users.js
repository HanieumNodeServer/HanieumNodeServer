var express = require('express');
var router = express.Router();
const user = require("../controller/users");
const jwtMiddleware = require("../../config/jwtMiddleware");

router.get('/user', user.userTest);

module.exports = router;
