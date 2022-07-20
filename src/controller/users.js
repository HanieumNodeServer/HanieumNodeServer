const { pool } = require("../../config/database");
const {response,errResponse} = require('../../config/response');
const baseResponse = require('../../config/baseResponseDict');
const logger = require('loglevel');
const jwtMiddleware = require("../../config/jwtMiddleware");
const userDao = require("../DAO/users");
// TODO : userDAO 추가

exports.userTest = async function(req, res, next) {

    try{
        let result = {
            type : 'json',
            message : '함수 처리 결과입니다.'
        };

        return res.send(response(baseResponse.SUCCESS("성공 메세지를 입력하세요"),result));

    }catch (err){
        logger.error("응답 실패 : " + err);
        return res.send(errResponse(baseResponse.FAIL));
    }


}

exports.getReserveInfo = async function(req,res){

    // TODO : 회원가입 & 로그인 기능 완료되면 수정
    /*const token = req.verifiedToken;
    const userId = token.userId;*/

    const userId = req.query.userId;

    try{

    const connection = await pool.getConnection((conn)=>conn);

    const isUser = await userDao.checkUserStatus(connection,userId);

    if(isUser[0]===undefined || isUser[0].status !== 'Y'){

        return res.send(errResponse(baseResponse.USER_STATUS_FAIL));
    }

    const temp = await userDao.getUserReservation(connection,userId);

    if(!temp){
        return res.send(errResponse(baseResponse.USER_RESERVATION_EMPTY))
    }


    let info = temp.filter((element)=> element.status === '예약중' || element.status === '탑승중' );
    console.log(info);

    if(!info[0]){
        return res.send(errResponse(baseResponse.USER_RESERVATION_EMPTY));
    }

    let resultRow = {
        "userName" : isUser[0].name,
        "result" : info
    }

    return res.send(response(baseResponse.SUCCESS("성공입니다."),resultRow));

    }catch (err) {
        logger.warn("[에러발생]" + err );
        return res.send(errResponse(baseResponse.FAIL));
    }
}
