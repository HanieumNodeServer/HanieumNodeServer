const { pool } = require("./database");
const axios = require('axios');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

init();

function init(){

    const init = new Promise((resolve, reject) => {
        let temp = getTerminalIdList();

        resolve(temp);

        reject(new Error("실패"));
    })

    init.then( temp => {
        // console.log(temp);
        //getRouteData(temp);
        getSchedule();
    }).catch(error =>{
        console.log(error);
    })

}

async function getTerminalIdList () {

    const sql = `select tmoneyTerId,terminalName from terminal;`;
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
            headers: { "x-Gateway-APIKey": "0ed92177-200d-4143-9d14-acd661a85535" }
        }).then((result)=>{

            let sql = `insert into route(departTerId, arrivalTerId, departTerName, arrivalTerName) values (?,?,?,?);`;

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
    let dateArray = [];

    dateArray[0] = moment().add(30,"days").format("YYYYMMDD");


    // console.log(dateArray);
    const promises = [];

    const connection = await pool.getConnection((conn)=>conn);

    let terminalId = await connection.query(`select routeId,departTerId,arrivalTerId from route;`);

    let sql = `insert into 
    schedule(routeId, allocateDate, corName, time, rotId, rotSqno, busGrade, alcnSqno, durationTime) 
        values  (?,?,?,?,?,?,?,?,?);`

    // console.log(terminalId[0]);


    for(let i in dateArray){ // 31
        promises.push(insertSchedule(i, terminalId, dateArray, connection, sql));

/*        for(let i in terminalId[0]){ // 12480
            let url = 'https://apigw.tmoney.co.kr:5556/gateway/xzzIbtListGet/v1/ibt_list/' +
                dateArray[j] + '/' +
                '0000' + '/' +
                terminalId[0][i].departTerId + '/' +
                terminalId[0][i].arrivalTerId + '/' +
                '9' + '/' +
                '0';

            let result = await axios.get(url,{headers:{"x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1"}})
                .then((result)=>{
                    console.log(i +' 의 '+ j +" 번째");
                    // console.log(result.data.response);
                    return result.data.response;
                })

            if(result === null){
                break;
            }else{
                for(let k in result.LINE_LIST){ // 20
                    await connection.query(sql,[terminalId[0][i].routeId,dateArray[j],
                        result.LINE_LIST[k].COR_NAM,result.LINE_LIST[k].TIM_TIM_O,
                    result.LINE_LIST[k].ROT_ID,result.LINE_LIST[k].ROT_SQNO,
                    result.LINE_LIST[k].BUS_GRA_O,result.LINE_LIST[k].ALCN_SQNO,
                    result.LINE_LIST[k].LIN_TIM])
                    console.log(k + " 번째 입력");
                }
            }

        }*/

    }

    Promise.allSettled(promises)
        .then(() => {
            console.log('completed');
        })
}

const insertSchedule = async function (i, terminalId, dateArray, connection, sql) {

    for(let j in terminalId[0]){ // 31
        // console.log(terminalId[0])
        let url = 'https://apigw.tmoney.co.kr:5556/gateway/xzzIbtListGet/v1/ibt_list/' +
            dateArray[i] + '/' +
            '0000' + '/' +
            terminalId[0][j].departTerId + '/' +
            terminalId[0][j].arrivalTerId + '/' +
            '9' + '/' +
            '0';

        // const promises2 = [];

        // promises2.push(axios.get(url,{headers:{"x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1"}}));

        let result = await axios.get(url,{headers:{"x-Gateway-APIKey": "42e5892b-0e48-4b0b-8cdc-6b9bc8699bc1"}})
            .then((result)=>{

                console.log(i +' 의 '+ j +" 번째");

                return result.data.response;
            })

        // Promise.all(promises2).then

        if(result !== null){
            for(let k in result.LINE_LIST){ // 20
                await connection.query(sql,[terminalId[0][j].routeId,dateArray[i],
                    result.LINE_LIST[k].COR_NAM,result.LINE_LIST[k].TIM_TIM_O,
                    result.LINE_LIST[k].ROT_ID,result.LINE_LIST[k].ROT_SQNO,
                    result.LINE_LIST[k].BUS_GRA_O,result.LINE_LIST[k].ALCN_SQNO,
                    result.LINE_LIST[k].LIN_TIM])

            }
        }

    }
}
