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
