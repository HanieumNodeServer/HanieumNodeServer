let express = require('express');
let router = express.Router();
const bus = require("../controller/bus");
const jwtMiddleware = require("../../config/jwtMiddleware");

// 버스 전체 리스트 조회 (regionNm = 지역 이름 검색,terminalNm = 터미널 이름 검색)
router.get('/bus/list',bus.getBusList);

// 출발지 기준 도착가능 터미널 검색 (departure = 출발 터미널 검색,region = 도착 가능 터미널 중 지역 이름으로 검색)
router.get('/bus/list/selected',bus.selectMyBus);

// 출발지 도착지 설정에 따른 시간 및 요금 정보 검색 (departure = 출발 터미널 , arrival = 도착 터미널)
router.get('/bus/list/:departure/:arrival', bus.getDepartArriv);

module.exports = router;
