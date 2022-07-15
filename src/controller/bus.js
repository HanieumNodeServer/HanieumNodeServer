const { pool } = require("../../config/database")
const { response, errResponse } = require("../../config/response")
const baseResponse = require("../../config/baseResponseDict")
const logger = require("loglevel")
const busDao = require("../DAO/bus")
const axios = require('axios')

const serviceKey = encodeURIComponent('HdCqR2fdx9sP+ae1CKFoosB6FRTKbZEluSjHXTbKcyY');

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

exports.selectMyBus = async function(req,res){

    let departure = req.query.departure;
    let region = req.query.region;

    if(departure === undefined){
        departure = '';
    }

    try{
        const connection = await pool.getConnection((conn)=>conn);

        const deptBusInfo = await busDao.getBusId(connection,departure);

        let url = 'https://api.odsay.com/v1/api/intercityBusTerminals?lang=0&' +
            '&terminalName='+
            encodeURI(deptBusInfo[0].terminalName) +
            '&apiKey=' +
            serviceKey +
            '&output=json';

        const result = await axios.get(url).then((result)=>{

            const resultRow = result.data.result[0].destinationTerminals;
            return resultRow;
        });

        let temp =[];
        for(let i in result){
           temp[i] = await busDao.getCityName(connection,result[i].stationID);
        }

        if(region !== undefined){
            deptBusInfo[0]["arrival"] = temp.filter((element) => element[0].cityRegion === region);

        }else{
            deptBusInfo[0]["arrival"] = temp;
        }

        // 지역까지 추가해서 response 하는게 너무 비효율일 때, 플랜 B = 이름만 표시하기
        /*
        for(let i in result){
            result[i] = result[i].stationName;
        }
        */


    return res.send(response(baseResponse.SUCCESS("성공하였습니다"),deptBusInfo));


    }catch (err){
        logger.warn("[에러발생]" + err );
    return res.send(errResponse(baseResponse.FAIL));
    }
}
