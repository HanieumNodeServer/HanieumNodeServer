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

exports.getDepartArriv = async function(req,res){

    const departure = req.params.departure;
    const arrival = req.params.arrival;

    // TODO : Path variable 값이 없을 경우 Validation 처리

    if(!departure || !arrival){
        return res.send(errResponse(baseResponse.PARAM_EMPTY));
    }

    try{

        const connection = await pool.getConnection((conn)=>conn);

        const departureID = await busDao.getTerminalID(connection,departure);

        const arrivalID = await busDao.getTerminalID(connection,arrival);


        if(departureID[0] === undefined || arrivalID[0] === undefined){
            return res.send(errResponse(baseResponse.TERMINAL_NOT_FOUND));
        }


        let url = 'https://api.odsay.com/v1/api/intercityServiceTime?lang=0' +
            '&apiKey=' +
            serviceKey +
            '&startStationID='+
            departureID[0].odseyTerId+
            '&endStationID='+
            arrivalID[0].odseyTerId+
            '&output=json';

        await axios.get(url).then((result)=>{

            if(result.data.result === undefined){
                console.log(result.data.result);
                return res.send(errResponse(baseResponse.ROUTE_NOT_FOUND));
            }

            let temp=[];
            for(let i in result.data.result.station){
                 temp[i] = {
                     "fare" : result.data.result.station[i].normalFare,
                     "firstTime": result.data.result.station[i].firstTime,
                     "lastTime": result.data.result.station[i].lastTime,
                     "schedule": result.data.result.station[i].schedule.split('/').join(',').split('\n').join(',').split(',')
                }

                if(result.data.result.station[i].nightSchedule !== ""){
                    let night = {
                        "nightSchedule" : result.data.result.station[i].nightSchedule,
                        "nightFare" : result.data.result.station[i].nightFare
                    }
                    temp[i] = Object.assign(temp[i],night);
                }
            }

            let resultRow = {
                "count" : result.data.result.count,
                "list" : temp
            }


            return res.send(response(baseResponse.SUCCESS("성공입니다"),resultRow));
        })


    }catch (err) {
        logger.warn("[에러발생]" + err );
        return res.send(errResponse(baseResponse.FAIL));
    }


}
