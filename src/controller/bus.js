const { pool } = require("../../config/database")
const { response, errResponse } = require("../../config/response")
const baseResponse = require("../../config/baseResponseDict")
const logger = require("loglevel")
const busDao = require("../DAO/bus")

exports.getBusList = async function(req,res){

    try{
        const connection = await pool.getConnection((conn)=>conn);

        const resultRow = await busDao.getBusList(connection);

        res.send(response(baseResponse.SUCCESS("성공하였습니다."),resultRow));

    }catch (err){
        logger.warn(err + "에러 발생");
        res.send(errResponse(baseResponse.FAIL));
    }

}
