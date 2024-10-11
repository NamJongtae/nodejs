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
