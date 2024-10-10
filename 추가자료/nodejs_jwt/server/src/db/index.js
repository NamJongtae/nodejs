// db/index.js

const mysql = require("mysql2/promise");

// MySQL에 한 번만 연결 생성
let connection;

const connectToDatabase = async () => {
  if (!connection) {
    try {
      connection = await mysql.createConnection({
        host: "localhost", // host 입력
        user: "root", // user 입력
        password: process.env.DB_PASSWORD, // password 입력
        database: "testdb", // 사용할 db 입력
      });
      console.log("MySQL에 성공적으로 연결되었습니다.");
    } catch (err) {
      console.error("MySQL 연결 실패:", err.stack);
      throw err;
    }
  }
  return connection;
};

module.exports = connectToDatabase;
