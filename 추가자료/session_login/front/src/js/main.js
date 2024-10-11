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
