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
                from ROUTE
                    inner join TERMINAL t on ROUTE.arrivalTerId = t.tmoneyTerId
            where departTerId = ?;
    `;

    const [resultRow] = await connection.query(sql,terminalId);

    return resultRow;

}

exports.getRouteArrival = async function(connection,terminalId){
    const sql = `
            select routeId,cityRegion,cityName,departTerId,departTerName,latitude,longitude
                from ROUTE
                    inner join TERMINAL t on ROUTE.departTerId = t.tmoneyTerId
            where arrivalTerId = ?;
    `;

    const [resultRow] = await connection.query(sql,terminalId);

    return resultRow;

}

exports.checkRouteID = async function(connection,routeId){
    const sql = `
        select routeId, departTerId, arrivalTerId, departTerName, arrivalTerName 
            from ROUTE 
        where routeId = ?;

    `;

    const [resultRow] = await connection.query(sql,routeId);

    return resultRow

}

exports.getRouteSchedule = async function(connection,routeId,date){
    const sql = `
            select corName,time,rotId,rotSqno,busGrade,alcnSqno,durationTime
                from SCHEDULE
            where routeId = ? and allocateDate = ?
            order by time;
    `;

    const [resultRow] = await connection.query(sql,[routeId,date]);

    return resultRow;
}

exports.getRequestParams = async function(connection,routeId,date,time){

    const sql = `
            select rotId,rotSqno,alcnSqno 
                from SCHEDULE
            where routeId = ? 
                and time = ? 
                and allocateDate = ?;
    `

    const [resultRow] = await connection.query(sql,[routeId,date,time]);

    return resultRow;

}

exports.getAllRoute = async function(connection){
    const sql = `
        select routeId from SCHEDULE
        group by routeId;
    `;

    const [resultRow] = await connection.query(sql);

    return resultRow;
}

exports.getRouteDepartAI = async function(connection, terminalId, arrivalKeyword){

    const sql = `
        select routeId,arrivalTerId,arrivalTerName 
            from ROUTE    
        where departTerId = ? and arrivalTerName like` + ' \'%'+ arrivalKeyword +'%\';';


    const [resultRow] = await connection.query(sql,terminalId);

    return resultRow;

}

exports.insertTicketingInfo = async function(connection,params){

    const sql = `
    insert into TICKETING(userId, departTerId, arrivalTerId, startTime, arrivalTime, corName, charge, seat) 
    values (?, ?, ?, ?, ?, ?, ?, ?);
    `;


    const [resultRow] = await connection.query(sql,params);

    return resultRow;

}
