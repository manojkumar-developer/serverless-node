require("./global");

const { createApi,listApi,viewUserApi,viewApi,updateApi,deleteApi }  = require("./actions");
const { login,checkUser,verifyEmail } = require("./actions/others");
const { sendCode,getRefferUser,customerReports } = require("./actions/others");
const { handleError,handleSuccess } = require("./functions/common");
const { updateUserLogs } = require("./functions/logs");

const resouceApi = (event, context, callback) => { 
  const method = event.httpMethod; 
  const pathArray = event.path.split("/");
  const path = pathArray[1];
  const tableName = tabelList[path];
  const data = JSON.parse(event.body);
  const params = event.queryStringParameters;
  if (method === "POST" && tableName) {
    //create api 
    createApi(data,tableName,callback);
  } else if (method === "GET" && tableName) {
    //list api
    listApi(tableName,params,callback);        
  } else {
    const message = "This method is not defined";
    handleError(message,callback);
  }
}

const resouceWithParamsApi = (event, context, callback) => {
  const method = event.httpMethod;
  const pathArray = event.path.split("/");
  const path = pathArray[1];
  const tableName = tabelList[path];
  const data = JSON.parse(event.body);
  let currentId = "";
    
  if (pathArray[2]) {
    currentId = pathArray[2];
  }
  
  if (method === "GET" && currentId !== "" && tableName) {
    //view api
    viewApi(currentId,tableName,callback);
  } else if (method === "PUT" && currentId !== "" && tableName) {
    //update api
    updateApi(currentId,data,tableName,callback);
  } else if (method === "DELETE" && currentId !== "" && tableName) {
    //delete api
    deleteApi(currentId,tableName,callback);        
  } else {
    const message="This method is not defined";
    handleError(message,callback);
  }
}

const resouceUserParamsApi = (event, context, callback) => {
  const method = event.httpMethod;
  const pathArray = event.path.split("/");
  const path = pathArray[1];
  const tableName = tabelList[path];
  const params = event.queryStringParameters;
  let currentId = "";
  let userId = "";
  if (pathArray[2]=="user" && pathArray[3]) {
    userId = pathArray[3];
    currentId = pathArray[2];
  }         
  if (method === "GET" && currentId === "user" && userId!=="" && tableName) {
    //view api
    viewUserApi(userId,tableName,params,callback);
  } else {
    const message = "This method is not defined";
    handleError(message,callback);
  }
}

const commonApi = (event, context, callback) => {
  const method = event.httpMethod;
  const pathArray = event.path.split("/");
  const path = pathArray[1];
  const paramId = pathArray[2];
  const data = JSON.parse(event.body);
  const params = event.queryStringParameters;  
  if (method === "POST" && path === "login") {
    //login api 
    login(data,callback);
  } else if (method === "POST" && path === "addfavourite") {
    addFavCharity("users",data,callback);
  } else if (method === "POST" && path === "removefavourite") {
    removeFavCharity("users",data,callback);
  }  else if (method === "POST" && path === "checkuser") {
    //checkuser api 
    checkUser(data,callback);
  } else if (method === "POST" && path === "verifyreferral") {
    //verifyreferral api `
    verifyReferral(data,callback);
  } else if (method === "PUT" && path === "updatepassword" && paramId) {
    //customer reports api 
    updatePassword("users",paramId,data,callback);
  } else {
    const message = "This method is not defined";
    handleError(message,callback);
  }
}

module.exports = { 
  resouceApi,
  resouceWithParamsApi,
  resouceUserParamsApi,
  commonApi
};