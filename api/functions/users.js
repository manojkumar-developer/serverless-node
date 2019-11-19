
const CryptoJS = require("crypto-js");
const { createDashbord,updateCredits } = require("./dashboard");
const { sendVerificationCode,sendTemporaryPassword } = require("./sendEmail");
const { createStellarRequest,getAccountDetailsByKey } = require("./stellar");
const { insertReferral } = require("./referral");
const { getrandomText,updateQuery,handleError,handleSuccess } = require("../functions/common");

const secretKey = "trueKarmaApi";

const createUserAccounts = (userData) => {
    const userId = userData.id.toString();
    createDashbord(userId,"dashboard");
    if (userData.inviteCode) {
        insertReferral(userData);
    }
    if (userData.secretKey) {        
        updateCredits(userId,"signup",undefined,"signup");
        createStellarRequest(userData.secretKey); 
    }
    sendVerificationCode(userData);
}

const verifyReferral = async (data,callback) => {
    if (data) {
      const userQuery = {};
      userQuery.TableName = "users";
      userQuery.Key = { id : data.referrerId };
      const userData = await dynamoDb.get(userQuery).promise().then(result=>result.Item).catch(error=>error);
      //update referral data
      const updateData = {};
      updateData.verified = true;
      updateData.updatedAt = Date.now();
      updateQuery(data.id, updateData, "referrals").then(result => {
        if(result) {
          updateCredits(userData.id, "referral", undefined, "referral");
          handleSuccess(result,undefined,callback);
        }
      }).catch(error => {
        handleError(error,callback);
      });
    }
  }

  const updatePassword = async (tableName,userId,inputData,callback) => {
    const userQuery = {};
    userQuery.TableName = tableName;
    userQuery.Key = { id : userId };
    const userData = await dynamoDb.get(userQuery).promise().then(result=>result.Item).catch(error=>error);    
    if(userData) {
      const oldPassword = CryptoJS.AES.encrypt(inputData.oldPassword,secretKey).toString();
      if(oldPassword === userData.password) {
      //update password data
      const updateData = {};
      updateData.password = CryptoJS.AES.encrypt(inputData.newPassword,secretKey).toString();
      updateData.updatedAt = Date.now();
      updateQuery(userId, updateData, tableName).then(result => {
        if(result) {
          handleSuccess(result,undefined,callback);
        }
      }).catch(error => {
        handleError(error,callback);
      });
    } else { 
          handleSuccess([],"user old password is not valid",callback);      
      }
  }
}

  const recoverPasswordByEmail = async (tableName,email,callback) => {
    const userQuery = {};
    userQuery.TableName = tableName;
    userQuery.FilterExpression = "email=:email and isActive=:isActive ";
    userQuery.ExpressionAttributeValues = { ":email": email,":isActive": "1" };
    const userData = await dynamoDb.scan(userQuery).promise().then(result=>result.Items).catch(error=>error);
    const rawPassword = getrandomText();
    const newPassword = CryptoJS.AES.encrypt(rawPassword,secretKey).toString();
    if(userData.length !== 0){
      //update user data
      const updateData = {};
      updateData.password = newPassword;
      updateData.updatedAt = Date.now();
      updateQuery(userData[0].id, updateData, "users").then(result => {
        if(result) {
          sendTemporaryPassword(userData[0], rawPassword);
          handleSuccess(userData[0],"Password send successfully",callback);
        }
      }).catch(error => {
        handleError(error,callback);
      });
    } else {
      const result = {};
      handleSuccess(result,"no data found",callback);
    }    
}

const addFavCharity = async (tableName,inputData,callback) => {
  const userQuery = {};
  userQuery.TableName = tableName;
  userQuery.FilterExpression = "id=:id and isActive=:isActive ";
  userQuery.ExpressionAttributeValues = { ":id": inputData.userId,":isActive": "1" };
  const userData = await dynamoDb.scan(userQuery).promise().then(result=>result.Items).catch(error=>error);
  if(userData.length !== 0){
    const charityList = userData[0].favouriteCharity || [];
    //update user data
    const updateData = {};
    charityList.push(inputData.charityId);
    updateData.favouriteCharity = charityList;
    userData.favouriteCharity = charityList;
    updateData.updatedAt = Date.now();
    updateQuery(inputData.userId, updateData, tableName).then(result => {
      if(result) {
        handleSuccess(userData,undefined,callback);
      }
    }).catch(error => {
      handleError(error,callback);
    });
  } else {
    const result = {};
    handleSuccess(result,"no data found",callback); 
  }    
}

const removeFavCharity = async (tableName,inputData,callback) => {
  const userQuery = {};
  userQuery.TableName = tableName;
  userQuery.FilterExpression = "id=:id and isActive=:isActive ";
  userQuery.ExpressionAttributeValues = { ":id": inputData.userId,":isActive": "1" };
  const userData = await dynamoDb.scan(userQuery).promise().then(result=>result.Items).catch(error=>error);
  if(userData.length !== 0){
    const charityList = userData[0].favouriteCharity || [];
    const index = charityList.indexOf(inputData.charityId);
    charityList.splice(index, 1);
    //update user data
    const updateData = {};
    updateData.favouriteCharity = charityList;
    userData.favouriteCharity = charityList;
    updateData.updatedAt = Date.now();
    updateQuery(inputData.userId, updateData, tableName).then(result => {
      if(result) {
        handleSuccess(userData,undefined,callback);
      }
    }).catch(error => {
      handleError(error,callback);
    });
  } else {
    const result = {};
    handleSuccess(result,"no data found",callback); 
  }    
}

const updateStellarByUser = async (tableName,userId,callback) => {
  const userQuery = {};
  userQuery.TableName = tableName;
  userQuery.Key = { id : userId };
  const userData = await dynamoDb.get(userQuery).promise().then(result=>result.Item).catch(error=>error);    
  if(userData && userData.walletAddress) {
    getAccountDetailsByKey(userData.walletAddress)
      .then(result => {
        if (result) {
          //update password data
          const updateData = {};
          updateData.stellarDetails = result;
          updateData.updatedAt = Date.now();
          updateQuery(userId, updateData, tableName)
          .then(data => {
            if(data) {
              handleSuccess(data,undefined,callback);
              }
          })
          .catch(error => {
            handleError(error,callback);
          })
        }
      }).catch(error => {
        handleError(error,callback);
      });    
  } else { 
        handleSuccess([],"user doesn't exist",callback);      
  }
}

module.exports = {
    createUserAccounts,
    recoverPasswordByEmail,
    updatePassword,
    verifyReferral,
    addFavCharity,
    removeFavCharity,
    updateStellarByUser
}