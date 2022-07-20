var express = require('express');
var router = express.Router();
const user = require("../controller/users");
const jwtMiddleware = require("../../config/jwtMiddleware");

router.get('/user', user.userTest);


// TODO : 회원가입 & 로그인 기능 완료되면 수정
// 사용자가 예매한 티켓 정보 열람 API
router.get('/user/ticket/reservation/info',user.getReserveInfo);

module.exports = router;
