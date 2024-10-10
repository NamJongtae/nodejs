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
      console.log(error.response);
      // 토큰 만료(419) 및 리프레시 토큰이 있을 경우
      if (
        error.response &&
        error.response.status === 419 &&
        error.response.data.message === "토큰 만료" &&
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
