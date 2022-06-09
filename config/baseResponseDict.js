module.exports = {

    SUCCESS : function successSet (message) {
        return {"isSuccess" : true, "code" : 0, "message" : message}
    },

    FAIL : {"isSuccess" : false, "code" : -1 , "message" : "실패입니다."}

};