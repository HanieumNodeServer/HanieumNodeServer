const jwt = require("jsonwebtoken");
const { response, errResponse } = require("./response");
const baseResponse = require("./baseResponseDict");
const secret = require("./secret");
const logger = require("loglevel");
const cookie = require("./app");
const { verifyToken } = require("../config/jwtVerify");
const { pool } = require("../config/database");
const userDao = require("../src/DAO/users");

const jwtMiddleware = async (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!req.cookies.accessToken) {
    return res.send(errResponse(baseResponse.ACCESS_TOKEN_EXPIRED));
    // 로그인으로 리다이렉트
  }

  const accessToken = verifyToken(req.cookies.accessToken);
  const refreshToken = verifyToken(req.cookies.refreshToken); // DB 조회

  console.log(refreshToken);

  if (accessToken === null) {
    if (refreshToken === undefined) {
      // case1: access token과 refresh token 모두가 만료된 경우
      res.send(errResponse(baseResponse.TOKEN_EXPIRED));
      // 로그인 리다이렉트
    }
    // case2: access token은 만료됐지만, refresh token은 유효한 경우
    // TODO: DB 조회해서 payload에 담을 값 가져오기

    const userRefreshToken = req.cookies.refreshToken;
    const connection = await pool.getConnection(async (conn) => conn);

    const isValid = await userDao.getRefreshToken(connection, userRefreshToken);

    if (isValid[0][0] !== undefined) {
      const newAccessToken = jwt.sign({ userId }, secret.key, {
        expiresIn: "1h",
        issuer: "cdragon",
      });
      res.cookie("accessToken", newAccessToken);
      req.cookies.accessToken = newAccessToken;
      next();
    } else {
      res.send(errResponse(baseResponse.TOKEN_EXPIRED));
    }
  } else {
    if (refreshToken === undefined) {
      // case3: access token은 유효하지만, refresh token은 만료된 경우
      const newRefreshToken = jwt.sign({ userId }, secret.key, {
        expiresIn: "1h",
        issuer: "cdragon",
      });
      res.cookie("refreshToken", newRefreshToken);
      req.cookies.refreshToken = newRefreshToken;
      next();
    } else {
      next();
    }
  }

  //   const p = new Promise((resolve, reject) => {
  //     jwt.verify(accessToken, secret.key, (err, verifiedToken) => {
  //       if (err) reject(err);
  //       resolve(verifiedToken);
  //     });
  //   });

  //   // if it has failed to verify, it will return an error message
  //   const onError = (error) => {
  //     // jwt 유효 기간 만료
  //     if (error.message === "jwt expired")
  //       return res.send(errResponse(baseResponse.TOKEN_EXPIRED));
  //     logger.warn(error + "에러 발생");
  //     return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
  //   };
  //   // process the promise
  //   p.then((verifiedToken) => {
  //     //비밀 번호 바뀌었을 때 검증 부분 추가 할 곳
  //     req.verifiedToken = verifiedToken;
  //     next();
  //   }).catch(onError);
};

module.exports = jwtMiddleware;
