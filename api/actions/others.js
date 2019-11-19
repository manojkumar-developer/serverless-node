const CryptoJS = require("crypto-js");
const secretKey = "trueKarmaApi";

const { updateQuery,handleSuccess,handleError } = require("../functions/common");
const { sendVerificationCode } = require("../functions/sendEmail");
const { updateCredits } = require("../functions/dashboard");

const addGrantsApi = async (inputData,tableName,callback) => {
    const conunterQuery = {};
    conunterQuery.TableName = "counters";
    conunterQuery.Key = { id : tableName };
    await sleep(1000);
    //check counter data already exist in the database
    dynamoDb.get(conunterQuery, function(err, conuterData) {
        if(conuterData && conuterData.Item){
            const countId = parseInt(conuterData.Item.countData,10)+1;
            const updateParams = {
                TableName: "counters",
                Key: {
                  "id": tableName
                },
                UpdateExpression: "SET countData = :_countData",
                ExpressionAttributeValues: { 
                  ":_countData": countId
                },
                ReturnValues: "UPDATED_NEW"
            };
            dynamoDb.update(updateParams,function(err, data) {
               inserData(inputData,tableName,countId,callback);
            });
        } else {
            const insertCounter = {};
            insertCounter.id = tableName;
            insertCounter.countData = 1;
            insertCounter.isActive = "1";
            insertCounter.createdAt = Date.now();
            const insertParams = {
                 TableName: "counters",
                 Item: insertCounter
            };
            dynamoDb.put(insertParams, function(err, data) {
              inserData(inputData,tableName,1,callback);
            });
        }  
    });
}

const login = (inputData,callback) => {
    const insertData = inputData;
    const tableName  = "users";
    if(insertData.password) {
        const params = {
            TableName: tableName,
            FilterExpression: "email=:email",
            ExpressionAttributeValues: {
                 ":email": insertData.email
            }
        };
        return dynamoDb.scan(params).promise().then(result => {
            if(result && result.Items[0]){
                const userData = result.Items[0]; 
                const decrypted = CryptoJS.AES.decrypt(userData.password,secretKey);
                const password = decrypted.toString(CryptoJS.enc.Utf8);
                if(password === inputData.password){
                    const message = "Logged in successfully";
                    handleSuccess(result.Items[0],message,callback);
                } else {
                    const message = "Invalid credentials";
                    handleSuccess([],message,callback);    
                }
            } else {
                const message = "Invalid credentials";
                handleSuccess([],message,callback);
            }
        }).catch(error=> {
            if(error) {
                handleError(error,callback);                
            }
        });
    }      
}

const checkUser = (inputData,callback) => {
    const tableName  = "users";
        const params = {
            TableName: tableName,
            FilterExpression: "email=:email OR nickName=:nickName",
            ExpressionAttributeValues: {
                 ":email": inputData.email,
                 ":nickName": inputData.nickName
            }
        };
        return dynamoDb.scan(params).promise().then(result => {
            if(result.Count !== 0) {
                const message = "Email or nickaname already Exist";
                handleSuccess(result.Items[0],message,callback);
            } else {
                const message = "User Available";
                handleSuccess([],message,callback);                
            }
        }).catch(error=> {
            if(error) {
                handleError(error,callback);                
            }
        });
}

const verifyEmail = (tableName,verificationCode,callback) => {
    if(verificationCode) {
        const params = {
            TableName: tableName,
            FilterExpression: "verificationCode=:verificationCode and verified =:status",
            ExpressionAttributeValues: {
                 ":verificationCode": verificationCode,
                 ":status" : false
            }
        };
        return dynamoDb.scan(params).promise().then(result => {
            if(result.Count !== 0) {
                const data = result.Items[0];
                const updateData =  {};
                updateData.verified = true;
                data.verified = true;
                updateQuery(data.id,updateData,tableName).then(result=> {
                    if(result) {                        
                        updateCredits(data.id,"emailVerification",undefined,"email_verified");
                        const message = "Verified in successfully";
                        handleSuccess(data,message,callback);
                    }
                }).catch(error=> {
                    if(error) {
                        handleError(error,callback);                
                    }
                });
            } else {
                const message = "Invalid code";
                handleSuccess([],message,callback);                
            }
        }).catch(error=> {
            if(error) {
                handleError(error,callback);                
            }
        });
    }
}

const sendCode = (tableName,userId,callback) => {
    if(userId) {
        const params = {
            TableName: tableName,
            FilterExpression: "id=:userId",
            ExpressionAttributeValues: {
                 ":userId": userId
            }
        };
        return dynamoDb.scan(params).promise().then(result => {
            if(result.Count !== 0) {
                const userData = result.Items[0];
                sendVerificationCode(userData)
                const message = "Email send successfully";
                handleSuccess(result.Items[0],message,callback);
            } else {
                const message = "Invalid user";
                handleSuccess([],message,callback);                
            }
        }).catch(error=> {
            if(error) {
                handleError(error,callback);                
            }
        });
    }
}

const getRefferUser = (tableName,referralCode,callback) => {
    if(referralCode) {
        const params = {
            TableName: tableName,
            FilterExpression: "referralCode=:referralCode",
            ExpressionAttributeValues: {
                 ":referralCode": referralCode
            }
        };
        return dynamoDb.scan(params).promise().then(result => {
            const userData = result.Items;
            if(userData) {
                const message = "Email send successfully";
                handleSuccess(userData[0],message,callback);
            } else {
                const message = "Invalid user";
                handleSuccess([],message,callback);                
            }
        }).catch(error=> {
            if(error) {
                handleError(error,callback);                
            }
        });
    }
}

const customerReports = (tableName,params,callback) => {
    const query = {};
    query.TableName = tableName;
    query.Limit = 100;
    let fileterQuery = "";
    const expressionQuery = {};
    //fetch with pagination
    if(params) {
        //check limit has exist then set limit
        if (params.limit) {
            query.Limit = parseInt(params.limit,10);
        }
        // continue scanning if we have more items
        if (params.lastKey) {
            query.ExclusiveStartKey = {"id":params.lastKey};
        }

        //filter expression
        if(params.mode_type) {
            fileterQuery += fileterQuery !== "" ? " and " : "";
            fileterQuery +="mode_type=:mode_type";
            expressionQuery[':mode_type'] = params.mode_type;
        }

        if(params.from_date) {
            fileterQuery += fileterQuery !== "" ? " and " : "";
            fileterQuery +="actual_date > :from_date";
            expressionQuery[':from_date'] = params.from_date;
        }

        if(params.to_date) {
            fileterQuery += fileterQuery !== "" ? " and " : "";
            fileterQuery +="actual_date < :to_date";
            expressionQuery[':to_date'] = params.to_date;
        }

        if(fileterQuery !=="" && expressionQuery.length!==0) { 
            query.FilterExpression = fileterQuery;
            query.ExpressionAttributeValues = expressionQuery;            
        }
        
        return dynamoDb.scan(query).promise().then(fetchedData => {
            const resultArray = {};            
            resultArray.totalRecords = totalRecords;
            resultArray.noRecords = fetchedData.Count;
            resultArray.records = fetchedData.Items;
            //if last evaluated key is exist
            if(fetchedData.LastEvaluatedKey) {
                resultArray.lastKey = fetchedData.LastEvaluatedKey.id;
            }
            handleSuccess(resultArray,undefined,callback);
        }).catch(error=> {
            if(error)
            console.log(error);
        }); 

    } else { 
        return dynamoDb.scan(query).promise().then(fetchedData => {
            const resultArray = {};
            resultArray.noRecords = fetchedData.Count;
            resultArray.records = fetchedData.Items;
            resultArray.totalRecords = fetchedData.Count;
            handleSuccess(resultArray,undefined,callback);            
        });
    }
}

module.exports = { 
    addGrantsApi,
    login,
    checkUser,
    verifyEmail,
    sendCode,
    getRefferUser,
    customerReports
 };