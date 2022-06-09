var express = require('express');
var router = express.Router();
const user = require("../controller/users");


router.get('/user', user.userTest);

module.exports = router;
