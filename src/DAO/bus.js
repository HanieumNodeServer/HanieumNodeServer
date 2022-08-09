exports.indexTestQuery = async function(connection) {
    const query = `
    select *
    from test;
    `

    const [array] = await connection.query(query);
    return array;

}

exports.insertTestQuery = async function(connection,params){
    const sql = `
    INSERT INTO 
        test.user(userId, name, identificationId, phoneNum)
    VALUES (?, ?, ?, ?);
    `;

    const [array] = await connection.query(sql,params);
    return array;

}

exports.getBusList = async function (connection, busInfoParams, where) {
    const sql =
        `
select cityRegion,cityName,terminalName from TERMINAL` +
        where +
        `order by tmoneyTerId;`;

    const [resultRow] = await connection.query(sql);

    return resultRow;
};

exports.searchBusKeyword = async function(connection,terminalNm){
    const sql = `select cityRegion,cityName,tmoneyTerId,terminalName from TERMINAL where terminalName like` +
        " '%" +
        terminalNm +
        "%';";

    const [resultRow] = await connection.query(sql);

    return resultRow;

}

exports.getRouteDepart = async function(connection,terminalId){
    const sql = `
            select routeId,cityRegion,cityName,arrivalTerId,arrivalTerName 
                from route
                    inner join terminal t on route.arrivalTerId = t.tmoneyTerId
            where departTerId = ?;
    `;

    const [resultRow] = await connection.query(sql,terminalId);

    return resultRow;

}

exports.getRouteArrival = async function(connection,terminalId){
    const sql = `
            select routeId,cityRegion,cityName,departTerId,departTerName,latitude,longitude
                from route
                    inner join terminal t on route.departTerId = t.tmoneyTerId
            where arrivalTerId = ?;
    `;

    const [resultRow] = await connection.query(sql,terminalId);

    return resultRow;

}

exports.checkRouteID = async function(connection,routeId){
    const sql = `
        select routeId, departTerId, arrivalTerId, departTerName, arrivalTerName 
            from route 
        where routeId = ?;

    `;

    const [resultRow] = await connection.query(sql,routeId);

    return resultRow

}

exports.getRouteSchedule = async function(connection,routeId,date){
    const sql = `
            select corName,time,rotId,rotSqno,busGrade,alcnSqno,durationTime
                from schedule
            where routeId = ? and allocateDate = ?
            order by time;
    `;

    const [resultRow] = await connection.query(sql,[routeId,date]);

    return resultRow;
}

exports.getRequestParams = async function(connection,routeId,date,time){

    const sql = `
            select rotId,rotSqno,alcnSqno 
                from schedule
            where routeId = ? 
                and time = ? 
                and allocateDate = ?;
    `

    const [resultRow] = await connection.query(sql,[routeId,date,time]);

    return resultRow;

}

exports.getAllRoute = async function(connection){
    const sql = `
        select routeId from schedule
        group by routeId;
    `;

    const [resultRow] = await connection.query(sql);

    return resultRow;
}

exports.getRouteDepartAI = async function(connection, terminalId, arrivalKeyword){

    const sql = `
        select routeId,arrivalTerId,arrivalTerName 
            from route    
        where departTerId = ? and arrivalTerName like` + ' \'%'+ arrivalKeyword +'%\';';


    const [resultRow] = await connection.query(sql,terminalId);

    return resultRow;

}
