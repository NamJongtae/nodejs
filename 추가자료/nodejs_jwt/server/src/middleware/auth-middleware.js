const jwt = require("jsonwebtoken");

function checkAuth(req, res, next) {
  const accessToken = req.headers["authorization"]?.split(" ")[1];
  // accessToken이 없는 경우 또는 "null" 문자열인 경우
  if (!accessToken || accessToken === "null") {
    return res
      .status(401)
      .json({ message: "로그인 정보가 존재하지 않습니다." });
  }

  try {
    // JWT 토큰 검증
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    next(); // 검증 성공 시 다음 미들웨어로 진행
  } catch (error) {
    console.error(error);
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
}

module.exports = checkAuth;