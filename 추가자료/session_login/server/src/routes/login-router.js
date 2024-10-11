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
