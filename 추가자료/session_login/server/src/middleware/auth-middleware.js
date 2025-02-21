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
