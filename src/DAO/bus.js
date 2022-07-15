exports.getBusList = async function(connection,busInfoParams,where) {
    const sql = `
    select r.cityRegion,r.cityName,terminalName 
      from TERMINAL
        inner join REGION r on TERMINAL.cityCode = r.cityCode` +
        where +
        `order by r.cityCode;`;

    const [resultRow] = await connection.query(sql);

    return resultRow;

}

exports.getBusId = async function(connection,deptBus){

    const sql = `select odseyTerId,terminalName from TERMINAL where terminalName like` + ' \'%' + deptBus + '%\';';

    const [resultRow] = await connection.query(sql,deptBus);
    return resultRow;

}

exports.getCityName = async function(connection,id){

    const sql = `
    select R.cityRegion, R.cityName, terminalName from TERMINAL
    inner join REGION R on TERMINAL.cityCode = R.cityCode
    where odseyTerId = ?;
    `;

    const [resultRow] = await connection.query(sql,id);
    return resultRow;

}
