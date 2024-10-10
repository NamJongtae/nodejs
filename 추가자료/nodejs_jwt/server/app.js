require('dotenv').config();
const express = require("express");
const cors = require("cors");
const checkAuth = require("./src/middleware/auth-middleware");
const app = express();
const loginRoutes = require("./src/routes/login-routes");
const userRoutes = require("./src/routes/user-routes");
const refreshRoutes = require("./src/routes/refresh-routes");

app.set("PORT", 8080); // 서버 포트 설정
const PORT = app.get("PORT");

// 미들웨어 설정
app.use(express.json()); // JSON 파싱
app.use(cors({ origin: "*" })); // CORS 설정, 모든 출처 허용

// 라우트 설정
app.use("/login", loginRoutes); // 로그인 관련 라우트
app.use("/user", checkAuth, userRoutes); // JWT 인증 미들웨어 적용, 사용자 관련 라우트
app.use("/refresh", refreshRoutes); // 리프레쉬 토큰 관련 라우트

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err); // 에러 로그 출력
  res.status(500).json({
    message: "서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.",
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`server ${PORT} port listening!`);
});