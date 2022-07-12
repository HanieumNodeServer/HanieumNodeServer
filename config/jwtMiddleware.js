const jwt = require('jsonwebtoken');
const {response,errResponse} = require("./response");
const baseResponse = require("/config/baseResponseDict");
const secret = require('/config/secret');
const logger = require('loglevel');

const jwtMiddleware = (req,res,next) => {
    const token = req.headers['x-access-token'];

    if(!token){
        return res.send(errResponse(baseResponse.TOKEN_EMPTY));
    }

    const p = new Promise(
        (resolve, reject) => {
            jwt.verify(token, secret.key , (err, verifiedToken) => {
                if(err) reject(err);
                resolve(verifiedToken)
            })
        }
    );

    // if it has failed to verify, it will return an error message
    const onError = (error) => {
        // jwt 유효 기간 만료
        if(error.message==='jwt expired')  return res.send(errResponse(baseResponse.TOKEN_EXPIRED));
        logger.warn(error + "에러 발생");
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE))
    };
    // process the promise
    p.then((verifiedToken)=>{
        //비밀 번호 바뀌었을 때 검증 부분 추가 할 곳
        req.verifiedToken = verifiedToken;
        next();
    }).catch(onError)
}


module.exports = jwtMiddleware;
