module.exports = {

    SUCCESS : function successSet (message) {
        return {"isSuccess" : true, "code" : 0, "message" : message}
    },

    FAIL : {"isSuccess" : false, "code" : -1 , "message" : "실패입니다."},
    TOKEN_EMPTY : {"isSuccess" : false, "code" : -1 , "message" : "토큰이 비어있습니다."},
    TOKEN_EXPIRED : {"isSuccess" : false, "code" : -1 , "message" : "토큰이 만료되었습니다."},
    TOKEN_VERIFICATION_FAILURE : {"isSuccess" : false, "code" : -1 , "message" : "토큰 처리에 실패하였습니다."},

};
