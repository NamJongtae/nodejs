const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const connectToDatabase = require("../db");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

router.post("/", async (req, res) => {
  const body = req.body;
  const { email, password } = body;

  // 입력 값 검증
  if (!email.trim()) {
    return res.status(400).json({ message: "이메일을 입력해주세요." });
  }
  if (!password.trim()) {
    return res.status(400).json({ message: "비밀번호를 입력해주세요." });
  }

  let connection; // 데이터베이스 연결 변수

  try {
    connection = await connectToDatabase(); // MySQL 연결 생성
    const [rows] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // 사용자가 존재하지 않는 경우
    if (rows.length === 0) {
      return res.status(404).json({ message: "존재하지 않는 사용자입니다." });
    }

    const user = rows[0];

    // 입력된 비밀번호와 DB 비밀번호 비교 (여기서 실제 애플리케이션에서는 암호화된 비밀번호를 비교해야 함)
    if (password !== user.password) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // 비밀번호가 일치하면 Access Token과 Refresh Token 생성
    // 테스트를 위해 유효기간을 1분으로 설정
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      accessTokenSecret,
      { expiresIn: "1m" }
    );

	 // 테스트를 위해 유효기간을 3분으로 설정
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      refreshTokenSecret,
      { expiresIn: "3m" }
    );

    // 클라이언트에 토큰 응답
    res.status(200).json({
      message: "로그인 성공",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);

    // 그 외 모든 서버 오류 처리
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;