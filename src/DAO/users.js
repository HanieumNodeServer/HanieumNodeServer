exports.checkUserStatus = async function (connection, userId) {
  const sql = `
    select userId,name,status 
    from USER
    where userId = ? and status = 'Y';
    `;

  const [resultRow] = await connection.query(sql, userId);
  return resultRow;
};

exports.getUserReservation = async function (connection, userId) {
  const sql = `
select userId,TICKETING.departTerId,TICKETING.arrivalTerId,routeId,D.terminalName as DepartTerminal ,A.terminalName as ArrivalTerminal,charge, corName,concat(seat,'번') as seat,
       startTime, arrivalTime,

       case
           when (TICKETING.status = 'R') then 'Reserving'
           when (TICKETING.status = 'T') then 'Onboarding'
           when (TICKETING.status = 'C') then 'Cancel'
           when (TICKETING.status = 'U') then 'Used'
        else '조회 불가'
           end as status

from TICKETING
inner join TERMINAL A on TICKETING.arrivalTerId = A.tmoneyTerId
inner join TERMINAL D on TICKETING.departTerId = D.tmoneyTerId
inner join ROUTE R on TICKETING.departTerId = R.departTerId and TICKETING.arrivalTerId = R.arrivalTerId
where userId = ?;
    `;

  const [resultRow] = await connection.query(sql, userId);
  return resultRow;
};

exports.getUserId = async function (connection, idNumber) {
  const sql = `
    select userId
    from USER
    where identificationId = ?;`;

  const userId = await connection.query(sql, idNumber);

  return userId;
};

exports.insertUserInfo = async function (connection, insertUserInfoParams) {
  await connection.beginTransaction();
  const sql = `
    insert into USER(name, identificationId, refreshToken, issuedYear)
    values (?, ?, ?, ?);
    `;

  const inserUserInfoRow = await connection.query(sql, insertUserInfoParams);

  await connection.commit();

  return inserUserInfoRow;
};

exports.updateRefreshToken = async function (
  connection,
  refreshToken,
  idNumber
) {
  const sql = `
  update USER set refreshToken = ?
  where identificationId = ?; 
  `;

  const resultRow = await connection.query(sql, [refreshToken, idNumber]);
  return resultRow;
};

exports.refreshRefreshToken = async function (
  connection,
  oldRefreshToken,
  newRefreshToken
) {
  const sql = `
  update USER set refreshToken = ?
  where refreshToken = ?; 
  `;

  const resultRow = await connection.query(sql, [
    newRefreshToken,
    oldRefreshToken,
  ]);
  return resultRow;
};

exports.getRefreshToken = async function (connection, userRefreshToken) {
  const sql = `
  select userId 
  from USER
  where refreshToken = ?; 
  `;

  const resultRow = await connection.query(sql, userRefreshToken);

  return resultRow;
};

exports.getUserIdByRefreshToken = async function (connection, refreshToken) {
  const sql = `
    select userId
    from USER
    where refreshToken = ?;`;

  const userId = await connection.query(sql, refreshToken);

  return userId;
};
