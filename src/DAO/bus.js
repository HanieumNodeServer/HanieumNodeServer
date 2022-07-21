exports.getBusList = async function(connection,busInfoParams,where) {
    const sql = `
select cityRegion,cityName,terminalName from TERMINAL` +
        where +
        `order by tmoneyTerId;`;

    const [resultRow] = await connection.query(sql);

    return resultRow;

}

exports.getBusId = async function(connection,deptBus){

    const sql = `select tmoneyTerId,terminalName from TERMINAL where terminalName like` + ' \'%' + deptBus + '%\';';

    const [resultRow] = await connection.query(sql,deptBus);
    return resultRow;

}

exports.getCityName = async function(connection,id){

    const sql = `
    select cityRegion, cityName, terminalName from TERMINAL
    where tmoneyTerId = ?;
    `;

    const [resultRow] = await connection.query(sql,id);
    return resultRow;

}

exports.getTerminalID = async function(connection,name){
    const sql = `
    select odseyTerId,terminalName 
        from TERMINAL
    where terminalName = ?;
    `;

    const [resultRow] = await connection.query(sql,name);
    return resultRow;

}

exports.getCoordinate = async function(connection,terminalName){
    const sql = `
        select terminalName,latitude as lat,longitude as lon 
            from TERMINAL
        where terminalName = ?;
    `;

    const [resultRow] = await connection.query(sql,terminalName);
    return resultRow;

}
