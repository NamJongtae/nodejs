const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

router.get("/", (req, res) => {
  // Authorization 헤더에서 Bearer 토큰 추출
  const accessToken = req.headers["authorization"]?.split(" ")[1];

  try {
    // JWT 토큰 검증 (유효한 토큰인지 확인)
    const decode = jwt.verify(accessToken, accessTokenSecret);

    // 토큰이 유효하면 유저 정보 반환 (이메일 정보)
    res.status(200).json({ message: "유저 조회 성공", user: decode.email });
  } catch (error) {
    // 토큰이 만료된 경우
    if (error.name === "TokenExpiredError") {
      return res.status(419).json({
        message: "토큰 만료",
      });
    }
    // 이외의 에러 처리
    return res.status(401).json({
      message: "유효하지 않은 토큰",
    });
  }
});

module.exports = router; // 라우트를 모듈로 내보내기
