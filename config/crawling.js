const {pool} = require('../config/database');
const {response,errResponse} = require('../config/response');
constbaseResponse= require('../config/baseResponseDict');
constlogger= require('loglevel');
const axios = require('axios');

// Odsay ApiKey
const serviceKey =
    encodeURIComponent('HdCqR2fdx9sP+ae1CKFoosB6FRTKbZEluSjHXTbKcyY');


// 임시방편 대기 함수
function sleep(ms){
    const wakeUpTime =Date.now() + ms;
    while(Date.now() < wakeUpTime){}
}

function getCityCode(){

    // ODsay는 IP 주소 변경 시 설정 가서 추가해줘야함
    console.log("getCityCode 함수 시작");

    // Odsay 지역코드 API 링크
    let url = 'https://api.odsay.com/v1/api/searchCID?lang=0'
        + '&apiKey='
        + serviceKey
        + '&output=json'
    // API 요청
    axios.get(url).then((result) => {

        // Odsay에서 받아온 지역 코드
        const regionData = result.data.result.CID;
        // DB에 입력할 sql query 작성
        const sql = `insert into REGION(cityRegion,cityName,cityCode) values (?,?,?);`
        // 지역 코드 region 테이블에 입력
        //insertDb(sql,regionData);

        // 터미널 ID 입력을 위해 지역 코드 다음 함수로 전달
        getTerminalName(regionData);
    })

}

// 지역코드를 기반으로 하는 각 지역의 터미널 정보(Odsay 제공 기준)
async function getTerminalName(regionData){

    console.log("getTerminalName 시작");

    // 받은 지역 정보의 cityCode를 url에 입력하기 위한 for문
    for(let i in regionData){
        let url = 'https://api.odsay.com/v1/api/intercityBusTerminals?lang=0&' +
            'CID=' +
            regionData[i].cityCode +
            '&apiKey=' +
            serviceKey +
            '&output=json';

        // 생성한 url을 axios를 통해 api 요청
        await getOpenApi(regionData[i].cityCode,url);
        console.log("-----------------지역 코드 " + regionData[i].cityCode + "시작--------------------------" )
    }



}

// 지역코드에 해당하는 터미널 정보 DB에 입력하는 함수
async function getOpenApi(cityCode,url){

    await axios.get(url).then((result)=>{
        // 넘겨 받은 API 결과 DB에 입력
        const resultData = result.data.result;
        let sql = `insert into TERMINAL(cityCode,odseyTerId,terminalName,terminalX,terminalY) values (?,?,?,?,?);`;
        insertDb2(sql,resultData,cityCode);
    })
}

// 마지막으로 진행한 함수 = 지역코드에 해당하는 터미널 정보 입력 기능
async function insertDb(sql,data){
    const connection = await pool.getConnection((conn)=>conn);
    console.log(data);
    for(let i in data){
        await connection.query(sql,[data[i].cityRegion, data[i].cityName, data[i].cityCode]);
    }

    connection.release();
    console.log("입력 완료");

}

// 마지막으로 진행한 함수 = 지역코드에 해당하는 터미널 정보 입력 기능
async function insertDb2(sql,data,cityCode){
    const connection = await pool.getConnection((conn)=>conn);
    console.log(data);
    for(let i in data){
        await connection.query(sql,[cityCode,data[i].stationID,data[i].stationName,data[i].x,data[i].y]);
    }

    connection.release();
    console.log("입력 완료");

}

function init(){
    console.log("처음시작");
    getCityCode();

    return 0;
}
// 프로그램 시작
init();
