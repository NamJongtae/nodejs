## JWT ?

> **JSON Web Token** 으로 JSON 객체를 암호화하여 안전하게 정보를 주고받을 수 있도록 설계된 토큰입니다. 세션 로그인 방식과 다르게 토큰 자체가 필요한 모든 정보를 포함하고 있어 별도의 세션 저장소가 필요 없습니다.

자세한 JWT 관련 내용은 https://velog.io/@njt6419/JWTJSONWebToken 을 참고해주세요.

<br/>

## Node.js JWT 로그인 구현하기

Node.js를 사용하여 **JWT(JSON Web Token)** 기반의 로그인 및 인증 시스템을 구현합니다.

### 프로젝트 구조

```bash
├── app.js
├── src
│   ├── middleware
│   │   └── authorization.js
│   ├── routes
│   │   ├── login-routes.js
│   │   ├── user-routes.js
│   │   └── refresh-routes.js
│   └── db
│       └── index.js
├── .env
└── package.json
```

### 1 ) 필요한 라이브러리 설치하기

- **express**: Node.js에서 웹 서버를 구축하기 위한 대표적인 프레임워크입니다.
- **dotenv**: `.env` 파일을 사용해 환경 변수를 쉽게 관리할 수 있도록 도와줍니다.
- **nodemon**: 개발 중에 파일 변경을 감지해 서버를 자동으로 재시작해주는 도구입니다.
- **jsonwebtoken**: JSON Web Token을 사용하여 인증 토큰을 생성하고 검증하는 데 사용됩니다.
- **mysql2**: MySQL 데이터베이스와 상호작용할 수 있게 도와주는 라이브러리입니다.
- **cors**: Cross-Origin Resource Sharing(CORS)를 지원해 다른 출처에서 오는 요청을 허용할 수 있게 해줍니다.

```bash
npm install express dotenv nodemon jsonwebtoken mysql2 cors
```

<br/>

### 2 ) 서버 코드 작성하기

**app.js**

```jsx
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
```

<br/>

**login-routes.js**

로그인 관련 라우트입니다. 사용자가 로그인 요청을 하면 데이터베이스에서 해당 사용자를 조회하고, 로그인 성공 시 JWT 토큰을 발급합니다.

```jsx
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
```

<br/>

**user-routes.js**

유저 정보를 확인하는 라우트로, JWT 토큰을 사용하여 유효성을 확인하고, 유저 정보를 반환합니다.

```jsx
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

```

<br/>

**refresh-routes.js**

Access Token이 만료되었을 때 Refresh Token을 사용해 새로운 Access Token을 발급받는 라우트입니다.

```jsx
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
```

<br/>

**auth-middleware.js**

JWT를 이용한 사용자 인증 미들웨어입니다. 웹 애플리케이션에서 보호된 라우트에 접근할 때, 요청에 포함된 JWT 토큰을 검증하여 유효한 사용자만 접근을 허용하는 역할을 합니다

```jsx
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
```

<br/>

**db**

MySQL 데이터베이스 연결을 위한 코드입니다. 데이터베이스와의 연결을 한 번만 생성하고 이를 재사용합니다.

```jsx
const mysql = require("mysql2/promise");

// MySQL에 한 번만 연결 생성
let connection;

const connectToDatabase = async () => {
  if (!connection) {
    try {
      connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: process.env.DB_PASSWORD,
        database: "testdb",
      });
      console.log("MySQL에 성공적으로 연결되었습니다.");
    } catch (error) {
      console.error("MySQL 연결 실패:", error.stack);
      throw error;
    }
  }
  return connection;
};

module.exports = connectToDatabase;

```

<br/>

### 3 ) Node.js 서버 실행하기

```bash
npm i nodemon app.js
```

<br/>

## 프론트 구현하기

### 프로젝트 구조

```
├── index.html
├── src
│   ├── js
│   │   └── login.js
│   |   └── main.js
│   ├── css
│   │   └── style.css
│   └── pages
│       └── login.html
├── .env
└── package.json
```

### 1 ) 필요한 라이브러리 설치하기

- **http-server** : 별도의 서버 코드를 작성할 필요 없이 정적 파일(HTML, CSS, JavaScript 등)을 제공하는 간단한 HTTP 서버를 실행 라이브러리입니다.

```bash
npm i http-server
```

<br/>

### 2 ) 코드 작성하기

**index.html**

```jsx
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Main Page</title>
  <link rel="stylesheet" href="/src/css/style.css">
</head>
<body>
  <div class="main-container">
    <h2>메인 페이지</h2>
    <p id="welcome-message"></p>
    <button id="logout">로그아웃</button>
  </div>
  
  // axios cdn 
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="src/js/main.js"></script>
</body>
</html>
```

<br/>

**login.html**

```jsx
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login</title>
    <link rel="stylesheet" href="../css/style.css" />
  </head>
  <body>
    <div class="login-container">
      <h2>로그인</h2>
      <form id="login-form">
        <label for="email">이메일</label>
        <input type="email" id="email" name="email" placeholder="Email" required />

        <label for="password">비밀번호</label>
        <input type="password" id="password" name="password" placeholder="Password" required />
        <button type="submit">로그인</button>
      </form>
      <div id="message"></div>
    </div>

		// axios cdn 
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="../js/login.js"></script>
  </body>
</html>
```

<br/>

**main.js**

```jsx
document.addEventListener("DOMContentLoaded", async function () {
  const welcomeMessage = document.getElementById("welcome-message");

  // 로컬 스토리지에서 토큰 가져오기
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  let user;

  if (!accessToken) {
    // 토큰이 없으면 로그인 페이지로 이동
    window.location.href = "/src/pages/login.html";
    return;
  }

  // axios 인터셉터 설정
  axios.interceptors.response.use(
    (response) => {
      // 요청이 성공했을 때는 그대로 반환
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // 401에러, 에러 메세지가 "유효하지 않은 토큰입니다."인 경우, 리프레시 토큰이 있을 경우
      if (
        error.response &&
        error.response.status === 401 &&
        error.response.data.message === "유효하지 않은 토큰입니다." &&
        refreshToken
      ) {
        try {
          // 리프레시 토큰으로 새 액세스 토큰 발급 요청
          const tokenResponse = await axios.get(
            "http://localhost:8080/refresh",
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`, // refreshToken을 Authorization 헤더에 추가
              },
            }
          );

          const newAccessToken = tokenResponse.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);

          // 원래 요청에 새 토큰 추가
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // 실패했던 원래 요청을 다시 시도
          return axios(originalRequest);
        } catch (refreshError) {
          console.error("리프레시 토큰 발급 실패:", refreshError);
          // 리프레시 토큰이 유효하지 않다면 로그아웃 처리
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/src/pages/login.html";
        }
      }

      // 그 외의 에러는 그대로 리턴
      return Promise.reject(error);
    }
  );

  try {
    // Access Token을 헤더에 추가하여 서버에 요청
    const response = await axios.get("http://localhost:8080/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Authorization 헤더에 토큰 추가
      },
    });
    user = response.data.user; // 서버에서 받은 사용자 정보
  } catch (error) {
    console.error(error);
    // 인증이 실패하거나 토큰이 유효하지 않으면 로그인 페이지로 리디렉션
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/src/pages/login.html";
    }
  }

  // 토큰이 있을 경우 인증된 사용자로 간주
  welcomeMessage.textContent = `${user}님 환영합니다!`;

  // 로그아웃 버튼 처리
  document.getElementById("logout").addEventListener("click", function () {
    // 토큰 삭제 및 로그인 페이지로 리디렉션
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/src/pages/login.html";
  });
});

```

- 페이지가 로드되면 로컬 스토리지에서 저장된 **Access Token**과 **Refresh Token**을 확인합니다.
- **Access Token**이 없거나 유효하지 않으면 로그인 페이지로 리디렉션합니다.
- `axios` **인터셉터**를 통해, **401 오류**(토큰 만료)가 발생하면 **Refresh Token**으로 새로운 Access Token을 요청합니다.
- 요청에 성공하면 유저 정보(이메일)를 받아와 메시지를 출력하고, **로그아웃 버튼**을 통해 토큰을 삭제한 후 로그인 페이지로 이동합니다.

<br/>

**login.js**

```jsx
document.addEventListener("DOMContentLoaded", function () {
  // 로그인된 상태에서 로그인 페이지로 접근하려고 하면, 메인 페이지로 리디렉션
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    window.location.href = "/index.html"; // 메인 페이지로 리디렉션
    return;
  }

  document
    .getElementById("login-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const messageDiv = document.getElementById("message");

      try {
        const response = await axios.post("http://localhost:8080/login", {
          email,
          password,
        });

        // 로그인 성공 시, 토큰 저장 및 메인 페이지로 이동
        if (response.data.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("refreshToken", response.data.refreshToken);
          window.location.href = "/index.html"; // 메인 페이지로 리디렉션
        } else {
          messageDiv.textContent = "로그인 실패: 서버 오류";
        }
      } catch (error) {
        if (error.response) {
          // 서버에서 반환된 오류 메시지 출력
          messageDiv.textContent = `로그인 실패: ${error.response.data.message}`;
        } else {
          messageDiv.textContent = "로그인 실패: 네트워크 오류";
        }
      }
    });
});

```

- **AccessToken**이 존재하면 메인 페이지로 리디렉션합니다.
- **로그인 폼**이 제출되면, 유저가 입력한 이메일과 비밀번호를 서버로 보냅니다.
- 서버로부터 **Access Token**과 **Refresh Token**을 받으면 이를 로컬 스토리지에 저장하고, 메인 페이지로 이동합니다.
- 로그인 실패 시, 적절한 오류 메시지를 화면에 출력합니다.

<br/>

**style.css**

```css
body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
  margin: 0;
  padding: 0;
}

.login-container,
.main-container {
  width: 300px;
  margin: 100px auto;
  padding: 20px;
  background-color: white;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #218838;
}

label {
  clip: rect(1px, 1px, 1px, 1px);
  clip-path: inset(50%);
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
}

#message {
  color: red;
  margin-top: 10px;
}
```

<br/>

### 3 ) 프론트 서버 실행하기

```bash
npx http-server -p 3000
```

<br/>

### 전체 흐름 요약

- 로그인 ⇒ 서버 AccessToken 및 RefreshToken 발급
- 클라이언트 측에서 AccessToken 및 RefreshToken를 로컬 스토리지에 저장
- 이후 클라이언트 측에서 서버로 요청을 보낼 때 마다 header에 Authorization Bearer token를 설정하여 토큰 전송
- 서버에서는 request.headers에서 토큰을 확인 하고 검증
- 토큰이 만료될 경우 클라이언트 측에서 서버에 RefreshToken를 보내어 AccessToken을 재발급
- 만약, RefreshToken이 만료된 경우 로컬스토리지에서 AccessToken과 RefreshToken를 삭제하고 로그아웃 처리