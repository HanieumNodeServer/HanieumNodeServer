const { pool } = require("../../config/database");
const busDao = require("../DAO/bus");
const axios = require("axios");
const logger = require("loglevel");
const { response, errResponse } = require("../../config/response");
const baseResponse = require("../../config/baseResponseDict");
const haversine = require("haversine");

const selectMyBus = async function (terminalNm, type) {
  const itemName = "departure";

  if (terminalNm === undefined) {
    terminalNm = "";
  }

  const connection = await pool.getConnection((conn) => conn);

  try {
    const deptBusInfo = await busDao.getBusId(connection, terminalNm);

    for (let j in deptBusInfo) {
      let url =
        "https://apigw.tmoney.co.kr:5556/gateway/xzzLinListGet/v1/lin_list/" +
        type +
        "/" +
        deptBusInfo[j].tmoneyTerId;

      const result = await axios
        .get(url, {
          headers: {
            "x-Gateway-APIKey": "0ed92177-200d-4143-9d14-acd661a85535",
          },
        })
        .then((result) => {
          const resultRow = result.data.response.TER_LIST;

          return resultRow;
        });
      deptBusInfo[j][itemName] = result;
    }

    connection.release();
    return deptBusInfo;
  } catch (err) {
    logger.warn("[에러발생]" + err);
    connection.release();
    return undefined;
  }
};

exports.minimumLength = async function (terminalInfo) {
  const end = {
    latitude: Number(terminalInfo[i][0].lat),
    longitude: Number(terminalInfo[i][0].lon),
  };

  if (i === "0") {
    distance = haversine(user, end, { unit: "mile" });
    resultRow = {
      DepartureTerName: terminalInfo[i][0].terminalName,
      DepartureTerId: terminalInfo[i][0].tmoneyTerId,
    };
  } else if (distance >= haversine(user, end, { unit: "mile" })) {
    distance = haversine(user, end, { unit: "mile" });

    resultRow = {
      DepartureTerName: terminalInfo[i][0].terminalName,
      DepartureTerId: terminalInfo[i][0].tmoneyTerId,
    };
  }
};

const getNearestTer = async function (terminalNm, type, latitude, longitude) {
  let terminalInfo = [];
  let distance, resultRow;

  const user = {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };

  // if (
  //   user.latitude > 90 ||
  //   user.latitude < -90 ||
  //   user.longitude > 180 ||
  //   user.longitude < -180
  // ) {
  //   return res.send(errResponse(baseResponse.LAT_LONG_WRONG));
  // }

  const connection = await pool.getConnection((conn) => conn);

  try {
    let terList = await selectMyBus(terminalNm);
    let index = 0;

    for (let i in terList) {
      if (terList[index].departure.length <= terList[i].departure.length) {
        index = i;
      }
    }
    terList = terList[index];

    for (let i in terList.departure) {
      let terminalName = terList.departure[i].TER_NAM;

      terminalInfo[i] = await busDao.getCoordinate(connection, terminalName);
    }

    for (let i in terminalInfo) {
      const end = {
        latitude: Number(terminalInfo[i][0].lat),
        longitude: Number(terminalInfo[i][0].lon),
      };

      if (i === "0") {
        distance = haversine(user, end, { unit: "mile" });
        resultRow = {
          DepartureTerName: terminalInfo[i][0].terminalName,
          DepartureTerId: terminalInfo[i][0].tmoneyTerId,
        };
      } else if (distance >= haversine(user, end, { unit: "mile" })) {
        distance = haversine(user, end, { unit: "mile" });

        resultRow = {
          DepartureTerName: terminalInfo[i][0].terminalName,
          DepartureTerId: terminalInfo[i][0].tmoneyTerId,
        };
      }
    }

    let finalResultRow = Object.assign(resultRow, {
      arrivalTerName: terList.terminalName,
      arrivalTerId: terList.tmoneyTerId,
    });
    connection.release();

    // console.log(finalResultRow);
    return finalResultRow;
  } catch (err) {
    logger.warn("[에러발생]" + err);

    connection.release();

    return undefined;
  }
};

// TODO : 배차리스트 조회 API 사용 승인 후 API key 및 내부 코드 수정
const getDepartArrival = async function (departure, arrival, date, time) {
  let now = new Date();

  // if (!date) {
  //   date = now.toFormat("YYYYMMDD");
  // } else if (parseInt(date) > parseInt(now.toFormat("YYYYMMDD")) + 3000) {
  //   return res.send(errResponse(baseResponse.OUT_RANGE_DATE));
  // }

  console.log("설정 날짜 : " + date);

  if (!time) {
    time = now.toFormat("HH24MI");
  }

  console.log("설정 시간 : " + time);

  const connection = await pool.getConnection((conn) => conn);

  try {
    // const departureID = await busDao.checkTerminalID(connection, departure);

    // const arrivalID = await busDao.checkTerminalID(connection, arrival);

    // if (departureID[0] === undefined || arrivalID[0] === undefined) {
    //   return undefined;
    // }

    // const depID = departureID[0].tmoneyTerId;
    // const arrID = arrivalID[0].tmoneyTerId;

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

    const result = await axios
      .get(url, {
        headers: { "x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1" },
      })
      .then((result) => {
        if (
          result.data.response === undefined ||
          result.data.response === null
        ) {
          return undefined;
        }

        let data = result.data.response.LINE_LIST;
        // console.log(data);
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
        // console.log(resultRow);

        return resultRow;
      });
    return result;
  } catch (err) {
    logger.warn("[에러발생]" + err);
    connection.release();
    return undefined;
  }
};

const findHugeTerminal = async function (terList) {
  let index = 0;
  for (let i in terList) {
    if (terList[index].departure.length <= terList[i].departure.length) {
      index = i;
    }
  }
  return terList[index];
};

const findHugeTerminal2 = async function (terList) {
  let index = 0;
  for (let i in terList) {
    if (terList[index][0].departure.length <= terList[i][0].departure.length) {
      index = i;
    }
  }
  return terList[index][0];
};

module.exports = {
  selectMyBus,
  getNearestTer,
  getDepartArrival,
  findHugeTerminal,
  findHugeTerminal2,
};
