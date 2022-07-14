exports.getBusList = async function(connection) {
    const sql = `
    select r.cityRegion,r.cityName,terminalName 
      from TERMINAL
        inner join REGION r on TERMINAL.cityCode = r.cityCode
    order by r.cityCode;
    `;

    const [resultRow] = await connection.query(sql);

    return resultRow;

}
