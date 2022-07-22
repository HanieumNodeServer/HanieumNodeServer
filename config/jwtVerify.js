const jwt = require("jsonwebtoken");
const secret = require("../config/secret");

module.exports = {
  verifyToken(token) {
    try {
      return jwt.verify(token, secret.key);
    } catch (e) {
      /**
             * 다음과 같은 형태로 특정 에러에 대해서 핸들링. 
             if (e.name === 'TokenExpiredError') {
                return null
             }
             *
             */
      return null;
    }
  },
};
