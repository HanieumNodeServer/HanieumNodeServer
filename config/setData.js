const { pool } = require("./database");
const axios = require('axios');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

init();

function init(){
    getSchedule();

    // const init = new Promise((resolve, reject) => {
    //     let temp = getTerminalIdList();
    //
    //     resolve(temp);
    // })
    //
    // init.then( temp => {
    //     getSchedule();
    // }).catch(error =>{
    //     console.log(error);
    // })

}

async function getTerminalIdList () {

    const sql = `select tmoneyTerId,terminalName from TERMINAL;`;
    const connection = await pool.getConnection((conn)=>conn);
    let result = await connection.query(sql);
    connection.release();
    // console.log(result)
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
            headers: { "x-Gateway-APIKey": "0ed92177-200d-4143-9d14-acd661a85535" }
        }).then((result)=>{

            let sql = `insert into route(departTerId, arrivalTerId, departTerName, arrivalTerName) values (?,?,?,?);`;

            let departureTerName = temp[0][i].terminalName;
            let departureTerID = temp[0][i].tmoneyTerId
            let arrivalTerList = result.data.response.TER_LIST;
            // console.log(i + " 번째 입력 중.....")
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
    let dateArray = [];

    for(let i=0; i<31;i++){
        dateArray[i] = moment().add(i,"days").format("YYYYMMDD");
    }

    // console.log(dateArray);
    let promises = [];

    const connection = await pool.getConnection((conn)=>conn);

    let terminalId = await connection.query(`select routeId,departTerId,arrivalTerId from ROUTE;`);

    let sql = `insert into 
    SCHEDULE(routeId, allocateDate, corName, time, rotId, rotSqno, busGrade, alcnSqno, durationTime) 
        values  (?,?,?,?,?,?,?,?,?);`

    // console.log(terminalId[0]);
    console.log(dateArray)

    for(let i in dateArray){ // 31
        promises.push(insertSchedule(i, terminalId, dateArray, connection, sql));
    }

//    console.log(promises);

    Promise.allSettled(promises)
        .then((result) => {
            console.log(result);
        })
}

let insertSchedule = async function (i, terminalId, dateArray, connection, sql) {

    for(let j in terminalId[0]){ // 31

        let url = 'https://apigw.tmoney.co.kr:5556/gateway/xzzIbtListGet/v1/ibt_list/' +
            dateArray[i] + '/' +
            '0000' + '/' +
            terminalId[0][j].departTerId + '/' +
            terminalId[0][j].arrivalTerId + '/' +
            '9' + '/' +
            '0';

        // console.log(url);

        let result = await axios.get(url,{headers:{"x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1"}})
            .then((result)=>{

                console.log(i +' 의 '+ j +" 번째");
                return result.data.response;
            })

        // console.log(result);

        if(result){

            for(let k in result.LINE_LIST){ // 20
                await connection.query(sql,[terminalId[0][j].routeId,dateArray[i],
                    result.LINE_LIST[k].COR_NAM,result.LINE_LIST[k].TIM_TIM_O,
                    result.LINE_LIST[k].ROT_ID,result.LINE_LIST[k].ROT_SQNO,
                    result.LINE_LIST[k].BUS_GRA_O,result.LINE_LIST[k].ALCN_SQNO,
                    result.LINE_LIST[k].LIN_TIM])

                //console.log(resultRow);
            }
        }

    }
}
