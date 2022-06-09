exports.indexTestQuery = async function(connection) {
    const query = `
    select *
    from test;
    `

    const [array] = await connection.query(query);
    return array;

}