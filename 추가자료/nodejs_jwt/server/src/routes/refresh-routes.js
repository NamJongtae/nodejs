const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

router.get("/", (req, res) => {
  // Authorization 헤더에서 Bearer 형식으로 제공된 리프레시 토큰 추출
  const refreshToken = req.headers["authorization"]?.split(" ")[1];

  try {
    // 리프레시 토큰 검증
    const decode = jwt.verify(refreshToken, refreshTokenSecret);

    // 검증 성공 시, 새로운 액세스 토큰 생성 (사용자 ID와 이메일 포함)
    const accessToken = jwt.sign(
      { id: decode.id, email: decode.email }, // 리프레시 토큰에서 얻은 사용자 정보
      accessTokenSecret,
      {
        expiresIn: "1m", // 액세스 토큰 만료 시간 (여기서는 1분으로 설정)
      }
    );
    res.status(200).json({ message: "토큰 재발급 성공", accessToken });
  } catch (error) {
    console.error(error);
    // 토큰이 만료된 경우 => 로그인 만료(로그아웃 처리)
    if (error.name === "TokenExpiredError") {
      return res.status(419).json({
        message: "로그인 만료",
      });
    }
    // 이외의 에러 처리
    return res.status(401).json({
      message: "유효하지 않은 토큰",
    });
  }
});

module.exports = router;