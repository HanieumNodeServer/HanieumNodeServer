const crypto = require("crypto");
const { pool } = require("../../config/database");
const { response, errResponse } = require("../../config/response");
const secretConfig = require("../../config/secret");
const baseResponse = require("../../config/baseResponseDict");
const logger = require("loglevel");
const jwt = require("jsonwebtoken");
const jwtMiddleware = require("../../config/jwtMiddleware");
const userDao = require("../DAO/users");
const moment = require("moment");
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

exports.signup = async function (req, res, next) {
  const { name, idNumber, year } = req.body;

  //   const hashedIdNumber = await crypto
  //     .createHash("sha512")
  //     .update(idNumber)
  //     .digest("hex");

  const connection = await pool.getConnection(async (conn) => conn);

  const userId = await userDao.getUserId(connection, idNumber);

  // refresh token 발급
  const refreshToken = jwt.sign({}, secretConfig.key, {
    expiresIn: "60d",
    issuer: "cdragon",
  });

  const insertUserInfoParams = [name, idNumber, refreshToken, year];

  try {
    // TODO: response 만들기(이미 있는 계정 처리)
    if (userId[0][0] !== undefined) {
      await userDao.updateRefreshToken(connection, refreshToken, idNumber);
      console.log("이미 있는 계정 refresh token 재발급");
    } else {
      // DB에 유저 정보 및 refresh Token 삽입
      const signupResponse = await userDao.insertUserInfo(
        connection,
        insertUserInfoParams
      );
      console.log("회원 정보 삽입 성공");

      // TODO: 인증 확인 절차 로직 구현
      console.log("인증 성공");
    }

    const resultUserId = await userDao.getUserId(connection, idNumber);

    // access 토큰 세팅
    const accessToken = jwt.sign({ resultUserId }, secretConfig.key, {
      expiresIn: "1h",
      issuer: "cdragon",
    });

    res.cookie("accessToken", accessToken);
    res.cookie("refreshToken", refreshToken);

    res.send(response(baseResponse.SUCCESS("로그인 성공")));
  } catch (e) {
    await connection.rollback();
    next(e);
  } finally {
    connection.release();
  }
};

exports.userTest = async function (req, res, next) {
  try {
    let result = {
      type: "json",
      message: "함수 처리 결과입니다.",
    };

    return res.send(
      response(baseResponse.SUCCESS("성공 메세지를 입력하세요"), result)
    );
  } catch (err) {
    logger.error("응답 실패 : " + err);
    return res.send(errResponse(baseResponse.FAIL));
  }
};

exports.getReserveInfo = async function (req, res) {
  // TODO : 회원가입 & 로그인 기능 완료되면 수정
  /*const token = req.verifiedToken;
    const userId = token.userId;*/

  const userId = req.query.userId;
  const date = moment();

  const connection = await pool.getConnection((conn) => conn);

  try {


    const isUser = await userDao.checkUserStatus(connection, userId);

    if (isUser[0] === undefined || isUser[0].status !== "Y") {
      return res.send(errResponse(baseResponse.USER_STATUS_FAIL));
    }

    await userDao.updateReservationStatus(connection, userId);
    const temp = await userDao.getUserReservation(connection, userId);

    if (!temp) {
      return res.send(errResponse(baseResponse.USER_RESERVATION_EMPTY));
    }

    // 현재 유저가 예약하고 있는 정보가 지금 시각과 맞는가

    /*// 취소된 상태가 아니면 탑승 중으로 변경
    if((moment().format("YYYYMMDDHHmmss")) > (moment(temp[0].startTime).format("YYYYMMDDHHmmss")) ){
      console.log("지났는데요?");
      const type = 'T'
      const reservationUpdate = await userDao.updateReservationStatus(connection,userId,type);

    }

    // 탑승 중에서 도착 시간이 지나면 사용 완료로 변경
    if((moment().format("YYYYMMDDHHmmss")) > (moment(temp[0].arrivalTime).format("YYYYMMDDHHmmss")) ){
      console.log("지났는데요?");

      const type = 'U'
      const reservationUpdate = await userDao.updateReservationStatus(connection,userId,type);

    }
*/
    console.log()


    // 예약 정보가
    let info = temp.filter(
      (element) => element.status === "Reserving" || element.status === "Onboarding"
    );

    if (info.length === 0) {
      return res.send(errResponse(baseResponse.USER_RESERVATION_EMPTY));
    }

    let resultRow = {
      userName: isUser[0].name,
      result: info,
    };

    connection.release();

    return res.send(response(baseResponse.SUCCESS("성공입니다."), resultRow));


  } catch (err) {
    logger.warn("[에러발생]" + err);
    return res.send(errResponse(baseResponse.FAIL));
  }
};
