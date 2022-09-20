/*
const {pool} = require("./database");
const axios = require('axios');
const moment = require('moment');
const cron = require('node-cron');

require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

const today = moment().add(30,"days").format("YYYYMMDD")

/!*cron.schedule('0 14 0 * * * ',async function(){
    console.log("배치 시작222222");
    init().then(() => console.log("Batch Completed"));
});*!/

exports.start = async function(){
    init();
}

async function init(){

    await prepareBatch(today);
}


let insertSchedule = async function insertSchedule(j, terminalId, today, connection, sql){

    let url = 'https://apigw.tmoney.co.kr:5556/gateway/xzzIbtListGet/v1/ibt_list/' +
        today + '/' +
        '0000' + '/' +
        terminalId[0][j].departTerId + '/' +
        terminalId[0][j].arrivalTerId + '/' +
        '9' + '/' +
        '0';

    // const promises2 = [];

    // promises2.push(axios.get(url,{headers:{"x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1"}}));

    let result = await axios.get(url,{headers:{"x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1"}})
        .then((result)=>{

            console.log(j + " 번째 진행중..");

            return result.data.response;
        }).catch((err)=> {
        console.log(err);
    })

    // Promise.all(promises2).then

    if(result !== null){
        for(let k in result.LINE_LIST){ // 20
            await connection.query(sql,[terminalId[0][j].routeId,today,
                result.LINE_LIST[k].COR_NAM,result.LINE_LIST[k].TIM_TIM_O,
                result.LINE_LIST[k].ROT_ID,result.LINE_LIST[k].ROT_SQNO,
                result.LINE_LIST[k].BUS_GRA_O,result.LINE_LIST[k].ALCN_SQNO,
                result.LINE_LIST[k].LIN_TIM])

        }
    }
}

async function prepareBatch(today){

    const connection = await pool.getConnection((conn)=>conn);

    let terminalId = await connection.query(`select routeId,departTerId,arrivalTerId from route;`);

    let sql = `insert into
    schedule(routeId, allocateDate, corName, time, rotId, rotSqno, busGrade, alcnSqno, durationTime)
        values  (?,?,?,?,?,?,?,?,?);`

    let promises = [];

    for(let j in terminalId[0]){ // 12480

        promises.push(insertSchedule(j, terminalId, today, connection, sql));

    }

    connection.release();

    Promise.allSettled(promises)
        .then((results) => {
            /!*results.forEach((result) => {
                console.log(result)
            })*!/

            console.log("Hi");
        })

}
*/

const secret = require("./secret")
const { pool } = require("./database");
const axios = require('axios');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

exports.start = function(){
    init();
}

function init(){

    getSchedule();

}

async function getTerminalIdList () {

    const sql = `select tmoneyTerId,terminalName from TERMINAL;`;
    const connection = await pool.getConnection((conn)=>conn);
    let result = await connection.query(sql);
    connection.release();
    return result;

}

async function getRouteData (temp) {

    const connection = await pool.getConnection((conn)=>conn);
    let url = [];

    for(let i in temp[0]){
        url[i] = "https://apigw.tmoney.co.kr:5556/gateway/xzzLinListGet/v1/lin_list/" +
            "s/" +
            temp[0][i].tmoneyTerId;

        await axios({
            method : 'get',
            url: url[i],
            headers: { "x-Gateway-APIKey": secret.ROUTE_INFO_LIST }
        }).then((result)=>{

            let sql = `insert into ROUTE(departTerId, arrivalTerId, departTerName, arrivalTerName) values (?,?,?,?);`;

            let departureTerName = temp[0][i].terminalName;
            let departureTerID = temp[0][i].tmoneyTerId
            let arrivalTerList = result.data.response.TER_LIST;
            console.log(i + " 번째 입력 중.....")
            // console.log(arrivalTerList)
            for(let j in arrivalTerList){
                connection.query(sql,[departureTerID,arrivalTerList[j].TER_COD,departureTerName,arrivalTerList[j].TER_NAM]);
            }
        });
    }

    connection.release();

    console.log("------------Complete-------------")

}

async function getSchedule(){
    let dateArray = ["20221017"];

    // dateArray[0] = moment().add(30,"days").format("YYYYMMDD");


    // console.log(dateArray);
    const promises = [];

    const connection = await pool.getConnection((conn)=>conn);

    let terminalId = await connection.query(`select routeId,departTerId,arrivalTerId from ROUTE;`);

    let sql = `insert into 
    SCHEDULE(routeId, allocateDate, corName, time, rotId, rotSqno, busGrade, alcnSqno, durationTime) 
        values  (?,?,?,?,?,?,?,?,?);`

    // console.log(terminalId[0]);



    promises.push(insertSchedule(terminalId, dateArray, connection, sql));


    Promise.allSettled(promises)
        .then(() => {
            console.log('completed');
        })
}

const insertSchedule = async function (terminalId, dateArray, connection, sql) {

    for(let j in terminalId[0]){ // 31
        // console.log(terminalId[0])
        let url = 'https://apigw.tmoney.co.kr:5556/gateway/xzzIbtListGet/v1/ibt_list/' +
            dateArray[0] + '/' +
            '0000' + '/' +
            terminalId[0][j].departTerId + '/' +
            terminalId[0][j].arrivalTerId + '/' +
            '9' + '/' +
            '0';

        // const promises2 = [];

        // promises2.push(axios.get(url,{headers:{"x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1"}}));

        let result = await axios.get(url,{headers:{"x-Gateway-APIKey": secret.DISPATCH_INFO_LIST}})
            .then((result)=>{

                console.log(j +" 번째");

                return result.data.response;
            })

        // Promise.all(promises2).then

        if(result !== null){
            for(let k in result.LINE_LIST){ // 20
                await connection.query(sql,[terminalId[0][j].routeId,dateArray[0],
                    result.LINE_LIST[k].COR_NAM,result.LINE_LIST[k].TIM_TIM_O,
                    result.LINE_LIST[k].ROT_ID,result.LINE_LIST[k].ROT_SQNO,
                    result.LINE_LIST[k].BUS_GRA_O,result.LINE_LIST[k].ALCN_SQNO,
                    result.LINE_LIST[k].LIN_TIM])

            }
        }

    }
}
