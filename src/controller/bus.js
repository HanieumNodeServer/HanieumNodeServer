const { pool } = require("../../config/database");
const { response, errResponse } = require("../../config/response");
const baseResponse = require("../../config/baseResponseDict");
const logger = require("loglevel");
const busDao = require("../DAO/bus");
const axios = require("axios");
const haversine = require("haversine");
const dateUtils = require("date-utils");
// const qs = require('qs')

const serviceKey = "0ed92177-200d-4143-9d14-acd661a85535";

exports.getBusList = async function (req, res) {
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
};

exports.selectMyBus = async function (req, res) {
  let type = req.query.type;
  let terminalNm = req.query.terminalNm;
  let region = req.query.region;
  let arrivalNm = req.query.arrivalNm;

  let isStart;
  if(type === 's') isStart = true;
  else if(type === 'a') isStart = false;
  else return res.send(errResponse(baseResponse.URL_TYPE_ERROR));

  const itemName = isStart ? 'arrival' : 'departure';

  if (terminalNm === undefined) {
    terminalNm = "";
  }

  const connection = await pool.getConnection((conn) => conn);

  try {
    const deptBusInfo = await busDao.getBusId(connection, terminalNm);
    // console.log(deptBusInfo);

    for(let j in deptBusInfo){

      let url =
          "https://apigw.tmoney.co.kr:5556/gateway/xzzLinListGet/v1/lin_list/" +
          type +
          "/" +
          deptBusInfo[j].tmoneyTerId;

      const result = await axios
          .get(url, {
            headers: { "x-Gateway-APIKey": "0ed92177-200d-4143-9d14-acd661a85535" },
          })
          .then((result) => {
            const resultRow = result.data.response.TER_LIST;

            return resultRow;
          });

      let temp = [];
      for (let i in result) {
        temp[i] = await busDao.getCityName(connection, result[i].TER_COD);
      }

      if (region !== undefined) {
        deptBusInfo[j][itemName] = temp.filter(
            (element) => element[0].cityRegion === region
        );
      }else {

        deptBusInfo[j][itemName] = temp;
      }

    }

    // 지역까지 추가해서 response 하는게 너무 비효율일 때, 플랜 B = 이름만 표시하기
    /*
        for(let i in result){
            result[i] = result[i].stationName;
        }
        */
    connection.release();

    return res.send(
      response(baseResponse.SUCCESS("성공하였습니다"), deptBusInfo)
    );
  } catch (err) {
    logger.warn("[에러발생]" + err);
    connection.release();
    return res.send(errResponse(baseResponse.FAIL));
  }
};

// TODO : 배차리스트 조회 API 사용 승인 후 API key 및 내부 코드 수정
exports.getDepartArrival = async function (req, res) {
  const departure = req.params.departure;
  const arrival = req.params.arrival;

  let now = new Date();
  let date = req.query.date;
  let time = req.query.time;

  if (!date) {
    date = now.toFormat("YYYYMMDD");
  } else if (parseInt(date) > parseInt(now.toFormat("YYYYMMDD")) + 3000) {
    return res.send(errResponse(baseResponse.OUT_RANGE_DATE));
  }

  if (!time) {
    time = now.toFormat("HH24MI");
  }

  if (!departure || !arrival) {
    return res.send(errResponse(baseResponse.PARAM_EMPTY));
  }

  const connection = await pool.getConnection((conn) => conn);

  try {
    const departureID = await busDao.checkTerminalID(connection, departure);

    const arrivalID = await busDao.checkTerminalID(connection, arrival);

    if (departureID[0] === undefined || arrivalID[0] === undefined) {
      return res.send(errResponse(baseResponse.TERMINAL_NOT_FOUND));
    }

    let url =
      "https://apigw.tmoney.co.kr:5556/gateway/xzzIbtListGet/v1/ibt_list/" +
      date +
      "/" +
      time +
      "/" +
      departure +
      "/" +
      arrival +
      "/" +
      "9" +
      "/" +
      "2";

    await axios
      .get(url, {
        headers: { "x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1" },
      })
      .then((result) => {
        if (result.data.response === undefined) {
          return res.send(errResponse(baseResponse.ROUTE_NOT_FOUND));
        }

        let data = result.data.response.LINE_LIST;
        let temp = [];

        for (let i in data) {
          if (data[i].BUS_GRA_O === "IDG") {
            data[i].BUS_GRA_O = "일반";
          } else if (data[i].BUS_GRA_O === "IDP") {
            data[i].BUS_GRA_O = "우등";
          } else if (data[i].BUS_GRA_O === "ING") {
            data[i].BUS_GRA_O = "심야일반";
          }

          temp[i] = {
            time: [
              data[i].TIM_TIM_O.slice(0, 2),
              ":",
              data[i].TIM_TIM_O.slice(2, 4),
            ].join(""),
            corName: data[i].COR_NAM,
            estimated:
              ((data[i].LIN_TIM / 60) >> 0) +
              "시" +
              (data[i].LIN_TIM % 60) +
              "분 예상",
            reservableSeatCnt: data[i].REM_CNT,
            rotId: data[i].ROT_ID,
            rotSqno: data[i].ROT_SQNO,
            alcnDt: data[i].ALCN_DT,
            alcnSqno: data[i].ALCN_SQNO,
            BUS_GRA_O: data[i].BUS_GRA_O,
          };
        }

        let resultRow = {
          count: data.length,
          list: temp,
        };

        connection.release();
        return res.send(
          response(baseResponse.SUCCESS("성공입니다"), resultRow)
        );
      });
  } catch (err) {
    logger.warn("[에러발생]" + err);
    connection.release();
    return res.send(errResponse(baseResponse.FAIL));
  }
};

exports.getNearestTer = async function (req, res) {
  const terminalNm = req.query.terminalNm;

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

  const connection = await pool.getConnection((conn) => conn);

  try {
    const terList = await axios
      .get("http://localhost:3000/bus/list/selected", {
        params: {
          terminalNm: terminalNm,
          type: "a",
        },
      })
      .then((result) => {

        return result.data.result;
      });

    if (terList === undefined) {
      return res.send(errResponse(baseResponse.TERMINAL_NOT_FOUND));
    }

    let terminalInfo = [];
    for (let i in terList[0].departure) {
      let terminalName = terList[0].departure[i][0].terminalName;
      terminalInfo[i] = await busDao.getCoordinate(connection, terminalName);
    }

    let distance, resultRow;

    for (let i in terminalInfo) {
      const end = {
        latitude: Number(terminalInfo[i][0].lat),
        longitude: Number(terminalInfo[i][0].lon),
      };

      if (i === "0") {
        distance = haversine(user, end, { unit: "mile" });
        resultRow = {
          terminalName: terminalInfo[i][0].terminalName,
        };
      } else if (distance >= haversine(user, end, { unit: "mile" })) {
        distance = haversine(user, end, { unit: "mile" });
        resultRow = {
          terminalName: terminalInfo[i][0].terminalName,
        };
      }
    }

    console.log(resultRow);

    connection.release();

    return res.send(response(baseResponse.SUCCESS("성공입니다."), resultRow));
  } catch (err) {
    logger.warn("[에러발생]" + err);
    connection.release();
    return res.send(errResponse(baseResponse.FAIL));
  }
};

exports.getSeatList = async function (req, res) {
  // const terminalNm = req.params.terminalNm;

  const { terSfr, terSto, rotId, rotSqno, alcnDt, alcnSqno } = req.body;

  // const seatCount = req.params.seatCount;

  try {
    let url =
      "https://apigw.tmoney.co.kr:5556/gateway/xzzIbtInfoGet/v1/ibt_info/" +
      terSfr +
      "/" +
      terSto +
      "/" +
      rotId +
      "/" +
      rotSqno +
      "/" +
      alcnDt +
      "/" +
      alcnSqno;

    await axios
      .get(url, {
        headers: {
          "x-Gateway-APIKey": "501f3526-d732-4562-a3a9-178a75690b44",
        },
      })
      .then((result) => {
        // console.log(seatList);
        /** response: {
      PRE_DC_RNG_TIM: '',
      TOT_CNT: '28',
      SEAT_DC_RTO: '',
      OCC_N_CNT: '15',
      IBT_SEAT_TYPE: '28A',
      OCC_Y_CNT: '13',
      SEAT_DC_TARGET: '',
      SEAT_LIST: [Array],
      BUS_CLS_PRIN_YN: 'Y',
      PRE_OCC_DC_RTO: '',
      JNT_DC_RTO: '',
      SEAT_DC_FEE: '',
      SATS_NO_PRIN_YN: 'Y',
      RND_DC_RTO: '',
      BUS_CACM_NM_PRIN_YN: 'Y',
      DIST: '86.835',
      LIN_LIST: [Array],
      TCK_FEE1: '7700',
      TCK_FEE2: '3900',
      PRE_OCC_DC_FEE: '',
      DC_PSB_YN: 'N',
      JNT_DC_FEE: '',
      TCK_FEE9: '0',
      DEPR_TIME_PRIN_YN: 'Y',
      TCK_FEE92: '6200',
      RND_DC_FEE: '',
      TAKE_DRTM: '70' */

        let resultRow = {
          TOTAL_SEAT_CNT: result.data.response.TOT_CNT,
          REST_SEAT_CNT: result.data.response.OCC_Y_CNT,
          SEAT_LIST: result.data.response.SEAT_LIST,
        };
        console.log(resultRow);
        return res.send(response(baseResponse.SUCCESS("성공"), resultRow));
      });
  } catch (e) {
    logger.warn("[에러발생]" + e);
    return res.send(errResponse(baseResponse.FAIL));
  }
};
