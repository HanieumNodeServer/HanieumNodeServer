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
select D.terminalName as '출발지' ,A.terminalName as '도착지',charge as '요금', corName as '운행회사',concat(seat,'번') as '좌석번호',
       time_format(startTime,'%h시%m분 %p') as '출발시간', time_format(arrivalTime,'%h시%m분 %p') as '도착시간',

       case
           when (TICKETING.status = 'R') then '예약중'
           when (TICKETING.status = 'T') then '탑승중'
           when (TICKETING.status = 'C') then '취소'
           when (TICKETING.status = 'U') then '사용 완료'
        else '조회 불가'
           end as status

from TICKETING
inner join TERMINAL A on TICKETING.arrivalTerId = A.tmoneyTerId
inner join TERMINAL D on TICKETING.departTerId = D.tmoneyTerId
where userId = '2';
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
    insert into USER(name, identificationId, refreshToken)
    values (?, ?, ?);
    `;

  const inserUserInfoRow = await connection.query(sql, insertUserInfoParams);
  console.log("sdf");
  await connection.commit();

  return inserUserInfoRow;
};
