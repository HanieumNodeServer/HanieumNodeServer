const { pool } = require("../config/database");
const { response, errResponse } = require("../config/response");
constbaseResponse = require("../config/baseResponseDict");
// const logger = require("loglevel")
const axios = require("axios");
/* eslint-disable */

async function main() {
  const config = {
    method: "GET",
    url: "https://apigw.tmoney.co.kr:5556/gateway/xzzLoadInfoGet/v1/load_info/00000000000000",
    headers: {
      "x-Gateway-APIKey": "7277ddad-a3ee-4a02-9c46-b3424481c604",
    },
  };

  const apiInfo = await getTmoneyAPI(config); //티머니 터미널 이름
  // console.log(apiInfo);
  const dbInfo = await insertDb(apiInfo);

  // TODO : 한이음 db에 terminalId, address(3 part), terminalName, is Departure, isArrival, longitude, latitude, createdAt, updatedAt, status
}

// 티머니 API에서 모든 터미널 관련 정보를 받아오는 함수
async function getTmoneyAPI(config) {
  const promise = await axios(config)
    .then((response) => {
      const result = response.data.response.TER_LIST;
      // console.log("API에서 object를 받아옵니다.");
      return result;
    })
    .catch(function (error) {
      console.log(error);
    });
  return promise;
}

async function insertDb(apiInfo) {
  const sql = `insert into TERMINAL (tmoneyTerId, cityRegion, cityName, address, terminalName, isDeparture, isArrival, longitude, latitude) values(?,?,?,?,?,?,?,?,?);`;

  const connection = await pool.getConnection((conn) => conn);
  for (i of apiInfo) {
    let totalAdr = i.TER_ADR;
    adrArr = totalAdr.split(" ");
    let city = adrArr[0];
    let region = adrArr[1];

    let address = adrArr.slice(2).join(" ");

    // console.log([
    //   i.TER_COD,
    //   city,
    //   region,
    //   address,
    //   i.TER_NAM,
    //   i.TER_FR_YN,
    //   i.TER_TO_YN,
    //   i.TER_LON,
    //   i.TER_LAT,
    // ]);

    await connection.query(sql, [
      i.TER_COD,
      city,
      region,
      address,
      i.TER_NAM,
      i.TER_FR_YN,
      i.TER_TO_YN,
      i.TER_LON,
      i.TER_LAT,
    ]);
  }
  connection.release();
  console.log("insert completion");
}

main();
