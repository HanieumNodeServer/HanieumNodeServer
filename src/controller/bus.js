const busFunction = require('../function/bus');
const { pool } = require("../../config/database");
const { response, errResponse } = require("../../config/response");
const baseResponse = require("../../config/baseResponseDict");
const logger = require("loglevel");
const busDao = require("../DAO/bus");
const axios = require("axios");
const haversine = require("haversine");
const dateUtils = require("date-utils");
const url = require("url");
const moment = require("moment");
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

exports.getBusList = async function(req,res){
  let regionNm = req.query.regionNm;
  let terminalNm = req.query.terminalNm;

  const temp = [regionNm, terminalNm];
  const busInfoParams = temp.filter(
      (element) => element !== undefined && element !== ""
  );

  if (regionNm === "") {
    regionNm = undefined;
  } else if (terminalNm === "") {
    terminalNm = undefined;
  }
  let sql;

  if (regionNm !== undefined && terminalNm !== undefined) {
    sql =
        ` where cityRegion = ` +
        "'" +
        regionNm +
        "'" +
        `and TERMINAL.terminalName like '%` +
        terminalNm +
        `%' `;
  } else if (regionNm === undefined && terminalNm !== undefined) {
    sql = ` where TERMINAL.terminalName like '%` + terminalNm + `%' `;
  } else if (regionNm !== undefined && terminalNm === undefined) {
    sql = ` where cityRegion = ` + "'" + regionNm + "'" + ` `;
  } else {
    sql = ` `;
  }

  const connection = await pool.getConnection((conn) => conn);

  try {
    const resultRow = await busDao.getBusList(connection, busInfoParams, sql);

    connection.release();

    return res.send(
        response(baseResponse.SUCCESS("성공하였습니다."), resultRow)
    );
  } catch (err) {
    logger.warn(err + "에러 발생");
    connection.release();
    return res.send(errResponse(baseResponse.FAIL));
  }

}

exports.selectMyBus = async function(req,res){
  let type = req.query.type;
  let terminalNm = req.query.terminalNm;
  let region = req.query.region;
  let arrivalNm = req.query.arrivalNm;

  if (type !== "s" && type !== "a")
    return res.send(errResponse(baseResponse.URL_TYPE_ERROR));

  const itemName = type === "s" ? "arrival" : "departure";

  if (terminalNm === undefined) {
    terminalNm = "";
  }

  const resultRow = await busFunction.getDepartArrival(type,terminalNm,region,itemName);

  return res.send(response(baseResponse.SUCCESS("성공입니다."),resultRow));


}

exports.getDepartArrival = async function(req,res){

  let routeId = req.params.routeId;

  let now = new Date();
  let date = req.query.date;
  let time = req.query.time;

  if (!date) {
    date = now.toFormat("YYYYMMDD");
  } else if (parseInt(date) > parseInt(moment().add(30,"days").format("YYYYMMDD"))) {
    return res.send(errResponse(baseResponse.OUT_RANGE_DATE));
  }

  if (!time) {
    time = now.toFormat("HH24MI");
  }

  if (!routeId) {
    return res.send(errResponse(baseResponse.PARAM_EMPTY));
  }

  const resultRow = await busFunction.getRouteSchedule(date,time,routeId);

  return res.send(resultRow);

}

exports.getSeatList = async function (req, res) {

  const { routeId,date,time } = req.query;

  if(!routeId || !date || !time)
    return res.send(errResponse(baseResponse.PARAM_EMPTY));

  let now = new Date();
  let present = now.toFormat("HH24MI");

  if(parseInt(date) < parseInt(moment().format("YYYYMMDD"))){

    if(parseInt(present) > parseInt(time)){
      return res.send(errResponse(baseResponse.WRONG_TIME_PAST));
    }

    return res.send(errResponse(baseResponse.OUT_RANGE_DATE));

  }

  const resultRow = await busFunction.getSeatInfo(routeId,date,time);

  return res.send(resultRow);

};
// 기존 방법
exports.getNearestTer = async function(req,res){

  let distance, resultRow;
  const type = 'a';
  const itemName = 'departure'

  const terminalNm = req.query.terminalNm; // 가고 싶은 터미널 이름

  const user = {
    latitude: Number(req.query.latitude),
    longitude: Number(req.query.longitude),
  };

  if (
      user.latitude > 90 ||
      user.latitude < -90 ||
      user.longitude > 180 ||
      user.longitude < -180
  ) {
    return res.send(errResponse(baseResponse.LAT_LONG_WRONG));
  }

  const temp = await busFunction.getDepartArrival(type,terminalNm,undefined,itemName);
  const arrival = await busFunction.determineArrival(temp);
  let list = arrival.departure

  const exist = await busFunction.checkExistRoute(list);

  for(let i in exist){
    const end = {
      latitude: Number(exist[i].latitude),
      longitude: Number(exist[i].longitude),
    }

    if (i === "0") {
      distance = haversine(user, end, { unit: "mile" });
      resultRow = {
        DepartureTerName: exist[i].departTerName,
        DepartureTerId: exist[i].departTerId,
      };
    } else if (distance >= haversine(user, end, { unit: "mile" })) {
      distance = haversine(user, end, { unit: "mile" });

      resultRow = {
        DepartureTerName: exist[i].departTerName,
        DepartureTerId: exist[i].departTerId,
      };
    }


  }

  return res.send(response(baseResponse.SUCCESS("현재 위치에서 출발할 수 있는 가장 가까운 터미널 정보입니다."),resultRow));

}

// 수정 방법
exports.getNearestTerTwo = async function(req,res){

  let distance;
  let list = [];
  const type = 'a';
  const itemName = 'departure'

  const terminalNm = req.query.terminalNm; // 가고 싶은 터미널 이름

  const user = {
    latitude: Number(req.query.latitude),
    longitude: Number(req.query.longitude),
  };

  if (
      user.latitude > 90 ||
      user.latitude < -90 ||
      user.longitude > 180 ||
      user.longitude < -180
  ) {
    return res.send(errResponse(baseResponse.LAT_LONG_WRONG));
  }

  const temp = await busFunction.getDepartArrival(type,terminalNm,undefined,itemName);

  for(let i in temp){
    list[i] = temp[i].departure;
  }

  const array = await busFunction.checkExistRoute(list);

  const resultRow = await busFunction.getNearestTerminal(array,user);

  if(resultRow === undefined){
    return errResponse(baseResponse.TERMINAL_NOT_FOUND);
  }

  return res.send(response(baseResponse.SUCCESS("현재 위치에서 출발할 수 있는 가장 가까운 터미널 정보입니다."),resultRow));

}

exports.autoReserveController = async function(req,res){

  const user = {
    latitude: req.query.latitude,
    longitude: req.query.longitude,
  };



  let terSfr, terSto, date, time, arrTime;

  let object = {
    "terSfr" : "",
    "terSto" : "",
    "date" : "",
    "time" : "",
    "arrTime" : ""
  }

  const string = req.body.string;
  const body = req.body.body;
  console.log(body);



  let stringSearch = string.search('예약')
  console.log(stringSearch)

  const filteringData = await axios.post("http://127.0.0.1:5001",{
    string : string,
    object : object
  }).then((result)=>{

    terSfr = result.data.response.terSfr;
    terSto = result.data.response.terSto;
    date = result.data.response.date;
    time = result.data.response.time;
    arrTime = result.data.response.arrTime;

  })



  if ((!terSfr || terSfr === "") && (terSto !== undefined || terSto !== "")) {
    res.redirect(
        url.format({
          pathname: "/bus/reservation/auto/ai/no-depart",
          query: {
            arrivalKeyword: terSto,
            time: time,
            latitude: user.latitude,
            longitude: user.longitude,
            date: date,
            arrTime : arrTime
          },
        })
    );
  } else {
    res.redirect(
        url.format({
          pathname: "/bus/reservation/auto/ai/depart",
          query: {
            departKeyword: terSfr,
            arrivalKeyword: terSto,
            time: time,
            date: date,
            arrTime : arrTime
          },
        })
    );
  }

}

exports.autoReserveNoDepart = async function(req,res){

  let {arrivalKeyword, time, date, arrTime} = req.query;

  let list = [];

  let now = new Date();

  let params = {
    arrivalKeyword : arrivalKeyword,
    time : time,
    date : date,
    arr_time : arrTime
  };

  if(parseInt(moment().format("YYYYMMDD")) < date && !time && !arrTime){
    return res.send(response(baseResponse.SUCCESS("원하시는 시간이 있으신가요?"),params));
  }

  if(time !== "" && arrTime !== "")
    return res.send(errResponse(baseResponse.WRONG_TIME_PARAMS));



  const user = {
    latitude: Number(req.query.latitude),
    longitude: Number(req.query.longitude),
  };


  if (!date) {
    date = now.toFormat("YYYYMMDD");
  } else if (parseInt(date) > parseInt(moment().add(30,"days").format("YYYYMMDD"))) {
    return res.send(errResponse(baseResponse.OUT_RANGE_DATE));
  }

  if (!time && (parseInt(date) > parseInt(moment().format("YYYYMMDD"))) ) {
    time = "0000";
  }else if(!time && (parseInt(date) === parseInt(moment().format("YYYYMMDD"))) ) {
    time = now.toFormat("HH24MI");
  }

  const temp = await busFunction.getDepartArrival('a',arrivalKeyword,undefined,"departure");

  for(let i in temp){
    list[i] = temp[i].departure;
  }

  const array = await busFunction.checkExistRoute(list);

  const routeRow = await busFunction.getNearestTerminal(array,user);

  if(routeRow === undefined){

    return res.send(errResponse(baseResponse.TERMINAL_NOT_FOUND));

  }

  const dispatch = await busFunction.getRouteSchedule(date,time,routeRow[0].routeId);

  if(arrTime !== ""){

    const arrTimeDispatch = await busFunction.getArrTimeDispatch(arrTime,dispatch);

    return res.send(arrTimeDispatch);
  }

  if(!dispatch.result.LINE[0]){
    return res.send(errResponse(baseResponse.TERMINAL_NOT_FOUND));
  }



  const resultRow = {
    routeId : routeRow[0].routeId,
    date : date,
    departure: dispatch.result.departure,
    arrival: dispatch.result.arrival,
    LINE: dispatch.result.LINE[0]
  }


  return res.send(response(baseResponse.SUCCESS("말씀하신 요청사항에 따른 배차 정보입니다."),resultRow));

}

exports.autoReserveDepart = async function(req,res){

  let {departKeyword, arrivalKeyword, time, date, arrTime} = req.query;

  let list = [];

  let now = new Date();

  let params = {
    departKeyword : departKeyword,
    arrivalKeyword : arrivalKeyword,
    time : time,
    date : date,
    arr_time : arrTime
  };

  if(parseInt(moment().format("YYYYMMDD")) < date && !time && !arrTime){
    return res.send(response(baseResponse.SUCCESS("원하시는 시간이 있으신가요?"),params));
  }

  if(time !== "" && arrTime !== "")
    return res.send(errResponse(baseResponse.WRONG_TIME_PARAMS));

  const user = {
    latitude: Number(req.query.latitude),
    longitude: Number(req.query.longitude),
  };

  if (!date) {
    date = now.toFormat("YYYYMMDD");
  } else if (parseInt(date) > parseInt(moment().add(30,"days").format("YYYYMMDD"))) {
    return res.send(errResponse(baseResponse.OUT_RANGE_DATE));
  }

  if (!time && (parseInt(date) > parseInt(moment().format("YYYYMMDD"))) ) {
    time = "0000";
  }else if(!time && (parseInt(date) === parseInt(moment().format("YYYYMMDD"))) ) {
    time = now.toFormat("HH24MI");
  }


  const allRouteList = await busFunction.getDepartListAI(departKeyword,arrivalKeyword);

  let routeList = allRouteList.filter((element)=> element.arrival[0] !== undefined);

  if(routeList[0] === undefined){
    return res.send(errResponse(baseResponse.EMPTY_ROUTE_ID));
  }

  let arr = [];
  for(let i in routeList){
    arr[i] = routeList[i].arrival;
  }

  const existRoute = await busFunction.checkExistRoute(arr);
  // console.log(existRoute);

  let dispatch = [];
  let resultRow = [];
  for(let i in existRoute){
    dispatch[i] = await busFunction.getRouteSchedule(date,time,existRoute[i].routeId);

    if(arrTime !== ""){

      const arrTimeDispatch = await busFunction.getArrTimeDispatch(arrTime,dispatch[i],i);

      return res.send(arrTimeDispatch);

    }

    if(!dispatch[i].result.LINE[0]){
      return res.send(errResponse(baseResponse.TERMINAL_NOT_FOUND));
    }


    resultRow[i] = {
      departure: dispatch[i].result.departure,
      arrival: dispatch[i].result.arrival,
      LINE: dispatch[i].result.LINE[0]
    }
  }

  return res.send(response(
      baseResponse.SUCCESS("말씀하신 요청사항에 따른 배차 정보입니다. 원하시는 배차 정보를 선택해주세요"+resultRow)));


}

exports.reserveTicket = async function(req,res){

  const userId = '1'; // 나중에 바꾸기

  const {routeId, date ,startTime, rotId, charge, seat, duration} = req.body;

  const terminalId = await busFunction.getTerminalId(routeId);

  const corName = await busFunction.getCorName(routeId,date,startTime,rotId);

  const arrivalTime = await busFunction.calculateArrivalTime(startTime,duration);

  const startTimeDate = date.concat('',startTime)+"00";

  const arrivalTimeDate = date.concat('',arrivalTime)+"00";

  const params = [userId, terminalId[0].departTerId ,
    terminalId[0].arrivalTerId, startTimeDate,
    arrivalTimeDate, corName[0].corName, charge, seat];


  if(!terminalId[0].departTerId  || !terminalId[0].arrivalTerId){
    return res.send(errResponse(baseResponse.EMPTY_TERMINAL_PARAMS))
  }
  else if(!startTimeDate || !arrivalTimeDate){

    return res.send(errResponse(baseResponse.EMPTY_TIME_PARAMS))

  }else if(!corName || !charge || !seat){

    return res.send(errResponse(baseResponse.EMPTY_BUSINFO_PARAMS))

  }

  const connection = await pool.getConnection((conn)=>conn);

  try{

    await connection.beginTransaction();

    const resultRow = await busDao.insertTicketingInfo(connection,params);

    await connection.commit();

    connection.release();

    return res.send(response(baseResponse.SUCCESS("예매에 성공했습니다.")));
  }catch (err){

    await connection.rollback();
    logger.warn(err + "에러 발생");
    connection.release();
    return errResponse(baseResponse.FAIL);

  }

}
