var express = require("express")
var router = express.Router()
const index = require("../controller")

/* GET home page. */
// 첫번째 param = URL 정의 || 두번째 param = 해당 URL에서 할 작업 → req: URL에 담긴 요청정보 res: 작업 수행 후 보내줄 정보
router.get("/index", index.indexTest)

router.get("/test/jk", index.test)

router.get("/test/cd", index.test2)

module.exports = router
