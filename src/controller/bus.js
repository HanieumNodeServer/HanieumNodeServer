const { pool } = require("../../config/database")
const { response, errResponse } = require("../../config/response")
const baseResponse = require("../../config/baseResponseDict")
const logger = require("loglevel")
const busDao = require("../DAO/bus")

exports.getBusList = async function(req,res){

    let regionNm = req.query.regionNm;
    let terminalNm = req.query.terminalNm;

    const temp = [regionNm, terminalNm];
    const busInfoParams = temp.filter((element)=> element !== undefined && element !== '');
    console.log(busInfoParams);

    if(regionNm === ''){
        regionNm = undefined;
    }else if(terminalNm === ''){
        terminalNm = undefined;
    }

    let sql;

    if(regionNm !== undefined && terminalNm !== undefined){
        sql = ` where cityRegion = `+ '\'' + regionNm + '\'' + `and TERMINAL.terminalName like '%` + terminalNm + `%' `;
    }else if(regionNm === undefined && terminalNm !== undefined){
        sql = ` where TERMINAL.terminalName like '%` + terminalNm + `%' `;
    }else if(regionNm !== undefined && terminalNm === undefined){
        sql = ` where cityRegion = `+ '\'' + regionNm + '\'' +` `;
    }else{
        sql = ` `;
    }


    try{
        const connection = await pool.getConnection((conn)=>conn);

        const resultRow = await busDao.getBusList(connection,busInfoParams,sql);

        res.send(response(baseResponse.SUCCESS("성공하였습니다."),resultRow));

    }catch (err){
        logger.warn(err + "에러 발생");
        res.send(errResponse(baseResponse.FAIL));
    }

}
