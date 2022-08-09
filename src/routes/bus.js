let express = require('express');
let router = express.Router();
const bus = require("../controller/bus");

/* GET home page. */
// 첫번째 param = URL 정의 || 두번째 param = 해당 URL에서 할 작업 → req: URL에 담긴 요청정보 res: 작업 수행 후 보내줄 정보
router.get("/bus/list", bus.getBusList);

router.get("/bus/list/selected", bus.selectMyBus);

router.get("/bus/list/:routeId", bus.getDepartArrival);

router.get("/bus/seat/list", bus.getSeatList);

router.get("/terminal/list/nearest", bus.getNearestTer);

router.get("/terminal/list/nearest/two", bus.getNearestTerTwo);

router.post("/bus/reservation/auto/ai", bus.autoReserveController);

router.get("/bus/reservation/auto/ai/depart", bus.autoReserveDepart);

router.get("/bus/reservation/auto/ai/no-depart", bus.autoReserveNoDepart);

module.exports = router;
