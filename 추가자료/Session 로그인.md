## Session ?

> 세션은 **서버 측에서 사용자의 상태나 데이터를 유지하기 위한 방법**입니다. 사용자가 서버에 접속할 때 서버는 세션을 생성하고 이를 통해 각 사용자의 정보를 서버에 저장합니다. 세션은 로그인 정보와 같은 데이터를 저장하여 사용자가 웹사이트를 이동할 때마다 다시 로그인할 필요가 없도록 합니다.

<br/>

### 세션의 동작 방식

<div align="center">
  <img src="https://velog.velcdn.com/images/njt6419/post/d256b265-e400-4986-bacd-a8c9420ca797/image.png" width="800"/>
</div>

<br/>

- 사용자가 서버에 처음 접속하면 서버는 고유한 세션 ID를 생성하고 이를 쿠키에 저장하여 클라이언트에게 전달합니다.
- 클라이언트는 이후 요청마다 이 세션 ID를 서버에 전달하여, 서버는 저장된 데이터를 참조해 사용자를 식별합니다.

<br/>

### 세션의 특징

**1 ) 서버 측 저장**

- 세션 데이터는 **서버 측에 저장**됩니다. 각 사용자가 서버에 연결할 때 고유한 세션 ID가 생성되고, 서버는 이 세션 ID와 관련된 데이터를 유지합니다.
- **클라이언트**는 이 세션 ID만을 쿠키 형태로 유지하며, 서버로의 요청마다 세션 ID를 전송하여 서버가 사용자를 식별할 수 있도록 합니다.

**2 ) 보안성**

- 세션은 클라이언트가 직접 데이터를 저장하지 않고 서버에 저장하므로, 쿠키에 민감한 정보를 저장하는 것보다 **보안성이 높습니다**.
- 클라이언트는 서버에서 발행한 세션 ID를 가지고 있을 뿐, 실제 데이터는 서버 측에만 존재합니다. 따라서 XSS(Cross-Site Scripting) 공격으로부터 상대적으로 안전합니다.

**3 ) 세션 ID와 쿠키의 관계**

- 세션을 사용하기 위해서는 클라이언트에 **세션 ID**를 저장해야 하며, 보통 이 세션 ID는 쿠키에 저장됩니다.
- 클라이언트는 서버에 요청할 때마다 이 세션 ID를 함께 보내어 서버가 각 사용자의 상태를 식별하고 유지할 수 있게 됩니다.

**4 ) 유효 기간**

- 세션은 **유효 기간**이 있으며, 기본적으로 사용자가 브라우저를 닫으면 만료됩니다. 다만, 서버 설정에 따라 특정 시간 동안 비활성화된 세션을 자동으로 삭제할 수 있습니다.
- 세션은 일반적으로 사용자의 비활성화 시간이 길어지거나, 설정된 만료 시간이 경과하면 삭제됩니다.

**5 ) 서버의 자원 사용**

- 세션은 서버에 저장되기 때문에, **사용자 수가 많아지면 서버의 메모리나 저장소에 부담**이 될 수 있습니다.
- 이를 해결하기 위해 많은 시스템에서 메모리 이외에 **Redis**, **데이터베이스** 등 외부 스토리지를 세션 저장소로 사용하기도 합니다.

**6 ) 사용자 별 고유성**

- 세션은 사용자가 처음 서버에 접속할 때마다 **고유한 세션 ID**를 발행합니다. 이 세션 ID는 사용자를 식별하기 위해 사용되며, 서버는 이 ID와 연결된 데이터를 사용하여 사용자 상태를 관리합니다.

세션과 쿠키에 대한 자세한 설명은 https://velog.io/@njt6419/Node.js-cookie%EC%99%80-session 을 참고해주세요.

<br/>

## Node.js 서버 구현하기

### 폴더구조

```
├── app.js
├── src
│   ├── middleware
│   │   └── auth-middleware.js
│   ├── routes
│   │   ├── login-routes.js
│   │   ├── logout-routes.js
│   │   ├── user-routes.js
│   │   └── check-login-routes.js
└── └── db
        └── user.json

```

<br/>

### 1 ) 필요한 라이브러리 설치하기

- **express**: Node.js에서 웹 서버를 구축하기 위한 대표적인 프레임워크입니다.
- **nodemon**: 개발 중에 파일 변경을 감지해 서버를 자동으로 재시작해주는 도구입니다.
- **cors**: Cross-Origin Resource Sharing(CORS)를 지원해 다른 출처에서 오는 요청을 허용할 수 있게 해줍니다.
- **express-session**: **세션 관리**를 위한 미들웨어입니다.
- **bcrypt**: 비밀번호를 안전하게 **해시(hashing)** 처리하고, 이를 비교할 수 있도록 도와주는 라이브러리입니다.

```bash
npm i nodemon express cors express-session bcrypt
```

<br/>

### 2 )  Node.js 서버 코드 작성

**app.js**

```jsx
const express = require("express");
const cors = require("cors");
const session = require("express-session");

const loginRouter = require("./src/routes/login-router");
const logoutRouter = require("./src/routes/logout-router");
const userRouter = require("./src/routes/user-router");
const checkLoginRouter = require("./src/routes/check-login-router");
const {
  isAuthenticated, // 인증된 사용자만 접근 가능한 미들웨어
  isNotAuthenticated, // 인증되지 않은 사용자만 접근 가능한 미들웨어
} = require("./src/middleware/auth-middleware");

const app = express();
const PORT = 8080;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(
  session({
    secret: "mysecretkey", // 세션 암호화를 위한 비밀키 (필수)
    resave: false, // 세션을 변경하지 않는 한 매 요청마다 다시 저장하지 않음
    saveUninitialized: false, // 초기화되지 않은 세션도 저장 (로그인하지 않아도 세션 생성 가능)
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 쿠키 유효기간: 24시간
      secure: false, // HTTPS 환경에서만 쿠키 전송, 여기서는 HTTP이므로 false로 설정
      httpOnly: true, // 브라우저의 JavaScript로 쿠키에 접근하지 못하도록 설정
    },
  })
);

// 라우터 설정
app.use("/login", isNotAuthenticated, loginRouter); // 로그인되지 않은 사용자만 접근 가능
app.use("/logout", logoutRouter); // 로그아웃
app.use("/user", isAuthenticated, userRouter); // 유저 조회 로그인된 사용자만 접근 가능
app.use("/check-login", checkLoginRouter); // 로그인 확인 => 클라이언트 측에서 로그인 상태를 확인하고 접근 설정을 위해

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something wrong!");
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`); // 서버가 정상적으로 실행되었을 때 콘솔에 출력
});
```

<br/>

**login-router.js**

- **로그인 처리**: 사용자가 제출한 이메일과 비밀번호를 검증하여 맞으면 세션에 사용자 정보를 저장합니다. 비밀번호는 **bcrypt**를 이용해 암호화된 상태에서 비교합니다.
- **세션에 사용자 정보 저장**: 로그인 성공 시 세션에 `req.session.user`로 사용자 이메일을 저장합니다. 이를 통해 로그인 상태를 유지합니다.

```jsx
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

// 로그인 처리
router.post("/", (req, res) => {
  const { email, password } = req.body;

  // 유저 데이터 불러오기 (유저: email: 'test@gmail.com'  password:'123123')
  const dataPath = path.join(__dirname, "../db/users.json");
  const fileData = fs.readFileSync(dataPath, "utf-8");
  const users = JSON.parse(fileData).users;

  // 사용자 찾기
  const user = users.find((user) => user.email === email);
  if (!user) {
    return res
      .status(400)
      .json({ message: "이메일 혹은 비밀번호가 일치하지 않습니다." });
  }

  // 비밀번호 비교
  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err) throw err;
    if (isMatch) {
      // 로그인 성공, 세션에 사용자 정보 저장
      req.session.user = user.email;
      req.session.save((err) => {
        if (err) {
          console.log(err);
          throw err;
        }
        return res.status(200).json({ message: "로그인 성공" });
      });
    } else {
      return res
        .status(400)
        .json({ message: "이메일 혹은 비밀번호가 일치하지 않습니다." });
    }
  });
});

module.exports = router;
```

<br/>

**logout-router.js**

`req.session.destroy()`로 세션을 파괴하고 클라이언트 측 쿠키도 삭제한 후, 로그아웃 성공 메시지를 반환합니다.

```jsx
const express = require("express");
const router = express.Router();

// 로그아웃 처리
router.get("/", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      throw err;
    }
    res.clearCookie("connect.sid"); // 세션 쿠키 삭제
    res.status(200).json({ message: "로그아웃 성공" });
  });
});

module.exports = router;

```

<br/>

**user-router.js**

사용자의 세션 정보가 존재할 경우, 해당 사용자 정보를 클라이언트에 전달합니다.

```jsx
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res
    .status(200)
    .json({ message: "유저 조회 성공", user: req.session.user });
});

module.exports = router;
```

<br/>

**check-login-router.js**

세션에 사용자가 있는지 확인하여, 로그인된 상태인지 아닌지를 클라이언트에 응답합니다.

```jsx
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  if (req.session && req.session.user) {
    // 세션에 사용자가 존재하면 로그인된 상태로 간주
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    // 로그인되지 않은 상태
    res.json({ loggedIn: false });
  }
});

module.exports = router;
```

<br/>

**auth-middleware.js**

사용자가 로그인된 상태인지 아닌지를 확인하고, 로그인된 사용자는 특정 페이지에 접근할 수 없게 제한하거나 로그인되지 않은 사용자는 로그인 페이지로 리디렉션합니다.

```jsx
// 로그인 확인 미들웨어
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // 로그인되어 있으면 요청을 계속 처리
  } else {
    return res.status(403).json({ message: "로그인이 필요합니다." }); // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  }
}

// 접근 제한 미들웨어
function isNotAuthenticated(req, res, next) {
  if (!req.session.user) {
    return next(); // 로그인되지 않은 경우 요청을 계속 처리
  } else {
    return res.status(403).json({ message: "이미 로그인되어 있습니다." }); // 이미 로그인된 경우 메인 페이지로 리다이렉트
  }
}

module.exports = { isAuthenticated, isNotAuthenticated };
```

<br/>

**users.json**

해시 처리된 비밀번호는 ‘123123’입니다.

```jsx
{
  "users": [
    {
      "id": 1,
      "email": "test@gmail.com",
      "password": "$2b$12$0aqbU8z3KKir9ApMcpxxP.LekvVNQyXxZ9vRyOMLwH80LqixwM592"
    }
  ]
}
```

<br/>

### 3 ) Node.js 서버 실행하기
```bash
nodemon app.js
```

<br/>

## 프론트 구현하기

### 폴더구조

```
├── index.html
├── src
│   ├── js
│   │   └── login.js
│   |   └── main.js
│   ├── css
│   │   └── style.css
└── └── pages
          └── login.html
```

<br/>

### 1 ) 필요한 라이브러리 설치
- **http-server** : 별도의 서버 코드를 작성할 필요 없이 정적 파일(HTML, CSS, JavaScript 등)을 제공하는 간단한 HTTP 서버를 실행 라이브러리입니다.
```bash
npm i http-server
```

<br/>

### 2 ) 프론트 코드 작성하기

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
    
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="../js/login.js"></script>
  </body>
</html>
```

<br/>

**main.js**

페이지가 로드될 때 서버에 로그인 상태를 확인하여 로그인되지 않은 경우 로그인 페이지로 리디렉션합니다. 로그아웃 버튼을 클릭하면 로그아웃 요청을 보내고, 로그인 페이지로 이동합니다.

```jsx
document.addEventListener("DOMContentLoaded", async function () {
  const welcomeMessage = document.getElementById("welcome-message");
  let user;

  // 서버에 로그인 상태 확인 요청
  try {
    const response = await axios.get("http://localhost:8080/check-login", {
      withCredentials: true,
    });
     // 로그인 상태가 아니라면 로그인 페이지로 리디렉션
    if (!response.data.loggedIn) {
      window.location.href = "/src/pages/login.html";
    }
  } catch (error) {
    console.error(error);
  }

  // 유저 데이터 조회
  try {
    const response = await axios.get("http://localhost:8080/user", {
      withCredentials: true,
    });
    user = response.data.user;
  } catch (error) {
    console.error(error);
    // 만약 로그인 상태가 아닌 경우 로그인 페이지로 리디렉션
    if (error.response.status === 403) {
      window.location.href = "/src/pages/login.html";
    }
  }

  welcomeMessage.textContent = `${user}님 환영합니다!`;

  // 로그아웃 버튼 처리
  document
    .getElementById("logout")
    .addEventListener("click", async function () {
      try {
        await axios.get("http://localhost:8080/logout", {
          withCredentials: true,
        });
        window.location.href = "/src/pages/login.html";
      } catch (error) {
        console.error(error);
      }
    });
});
```

<br/>

**login.js**

사용자가 로그인 폼을 제출하면 서버에 이메일과 비밀번호를 전송하여 로그인을 시도합니다. 성공 시 메인 페이지로 리디렉션하고, 실패 시 오류 메시지를 화면에 표시합니다.

```jsx
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // 서버에 로그인 상태 확인 요청
    const response = await axios.get("http://localhost:8080/check-login", {
      withCredentials: true, // 세션 쿠키 포함
    });

    // 로그인 상태라면 메인 페이지로 리디렉션
    if (response.data.loggedIn) {
      window.location.href = "/index.html";
    }
  } catch (error) {
    console.error(error);
  }

  document
    .getElementById("login-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const messageDiv = document.getElementById("message");

      try {
        await axios.post(
          "http://localhost:8080/login",
          {
            email,
            password,
          },
          {
            withCredentials: true,
          }
        );
  
        // 로그인 성공 시
        window.location.href = "/index.html"; // 메인 페이지로 리디렉션
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
  font-size: 11px;
}
```

<br/>

### 3 ) 프론트 서버 실행하기
```bash
npx http-server -p 3000
```
