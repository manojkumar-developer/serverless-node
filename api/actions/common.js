
const uuid = require("uuid");
const CryptoJS = require("crypto-js");
const TokenGenerator = require("uuid-token-generator");
const secretKey = "trueKarmaApi";
const { createUserAccounts } = require("../functions/users");
const {  getSequence, handleError,handleSuccess } = require("../functions/common");
const {  timeCredits } = require("../functions/dashboard");

const tokgen = new TokenGenerator();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const create = (inputData,tableName,callback) => {
    const insertData = inputData;
    let isTrans = "no";
    if(tableName === "pools") {
        isTrans = "yes";
    }
    return getSequence(tableName,isTrans).then(counterId => {
        //password update 
        if(tableName === "users" && insertData.password) {
            insertData.password = CryptoJS.AES.encrypt(insertData.password,secretKey).toString();
            insertData.verificationCode = tokgen.generate();
            insertData.referralCode = tokgen.generate();
            insertData.isProfileImage = false;
            insertData.inviteCode = insertData.inviteCode || null;
            insertData.verified = false;
            insertData.address1 = null;
            insertData.address2 = null;
            insertData.annualIncome = null;
            insertData.city = null;
            insertData.gender = null;
            insertData.stateId  = null;
            insertData.zipcode  = null;
            insertData.stellarDetails = {};
            insertData.favouriteCharity = [];            
        } else if(tableName === "charities") {
            insertData.isProfileImage = false;
        }
        insertData.id = counterId.toString();
        insertData.isActive = "1";
        insertData.createdAt = Date.now();
        insertData.updatedAt = Date.now();
        const params = {
            TableName: tableName,
            Item: insertData
        };
        dynamoDb.put(params).promise().then(result => {
            if(result) {
                if(tableName === "users") {
                    createUserAccounts(insertData);
                } else if(tableName === "my_times") {
                    timeCredits(insertData.userId,"contributionOneHour",insertData.duration,"volunteer_time");
                }
                handleSuccess(params.Item,undefined,callback);                
            }                                    
        })
        .catch(error=> {
            handleError(error,callback);
        });
     }).catch(error=> {
        handleError(error,callback);
    });
}

const list = (tableName,params,callback) => {
    const recordLimit = 100;
    const pageLimit = params && params.limit ? parseInt(params.limit,10) : recordLimit;
    const filterValues = {};
    const queryData = {};
    const countQuery = {};
    const resultArray = {};
    resultArray.noRecords = 0;
    resultArray.records = [];
    let filterQuery = "";

    queryData.TableName = tableName;
    countQuery.TableName = tableName;
    queryData.IndexName = "ACTIVEINDEX";
    queryData.KeyConditionExpression = "isActive = :isActive";
    filterValues[":isActive"] = "1";

    // continue scanning if we have more items
    if(params && params.lastKey && tableName === "charities"){
        queryData.ExclusiveStartKey = {"id": params.lastKey,"isActive":"1","charityId":parseInt(params.lastKey)};
    } else if(params && params.lastKey) {
        queryData.ExclusiveStartKey = {"id": params.lastKey,"isActive":"1"};
    }
    
    //filter expression
    if(params && tableName === "charities") {
        if(params.search && params.category){
            filterQuery += "contains (charityName, :charityName) and category=:category";
            filterValues[":charityName"] = params.search;
            filterValues[":category"] = params.category;
        } else if(params.search){
            filterQuery += "contains (charityName, :charityName)";
            filterValues[":charityName"] = params.search;
        } else if(params.category){
            filterQuery += "category=:category";
            filterValues[":category"] = params.category;
        } 
    } else if(params && tableName === "news") {
        if(params.search && params.category ){
            filterQuery += "contains (title, :title) and category=:category";
            filterValues[":title"] = params.search;
            filterValues[":category"] = params.category;
        } else if(params.search){
            filterQuery += "contains (title, :title)";
            filterValues[":title"] = params.search;
        } else if(params.category){
            filterQuery += "category=:category";
            filterValues[":category"] = params.category;
        }            
    } else if(params && params.search && tableName === "causes") {
        filterQuery += "contains (causeName, :title)";
        filterValues[":title"] = params.search.toLowerCase();            
    } else if(params && params.search && tableName === "categories") {
        filterQuery += "contains (categoryName, :title)";
        filterValues[":title"] = params.search.toLowerCase();            
    } else if(params && params.search && tableName === "blogs") {
        filterQuery += "contains (title, :title)";
        filterValues[":title"] = params.search.toLowerCase();            
    } else if(params && params.search && tableName === "pools") {
        filterQuery += "contains (poolName, :title)";
        filterValues[":title"] = params.search.toLowerCase();            
    } else if(params && params.search && tableName === "ads") {
        filterQuery += "contains (title, :title)";
        filterValues[":title"] = params.search.toLowerCase();            
    }  else if(params && params.closed && tableName === "pools" ) {
        const closed = params.closed === "yes" ? true : false;
        filterQuery += "isClosed=:isClosed ";
        filterValues[":isClosed"] = closed; 
    } else if(params && params.approval === "yes" && tableName === "contributions") {
        filterQuery += "verified=:verified ";
        filterValues[":verified"] = false;
    }    
    
    if(filterQuery!="")
    queryData.FilterExpression = filterQuery;
    
    queryData.ExpressionAttributeValues = filterValues;
    queryData.ScanIndexForward = true;
    queryData.returnConsumedCapacity ="INDEXES";
    queryData.Limit  = recordLimit;

    return dynamoConnect.describeTable(countQuery).promise().then(countData => {
        const totalRecords = countData.Table.ItemCount;
        return totalRecords;        
    }).then(totalRecords => {
        resultArray.totalRecords = totalRecords;
        return dynamoDb.query(queryData, function scanUntilDone(error, fetchedData) {
            if (error) {
                handleError(error,callback);
            } else {
                if(resultArray.noRecords + fetchedData.Count < pageLimit ){
                    const tempList = resultArray.records;
                    resultArray.noRecords = resultArray.noRecords + fetchedData.Count;     
                    resultArray.records = tempList.concat(fetchedData.Items);
                } else if(resultArray.noRecords + fetchedData.Count > pageLimit ){
                    let balanceLimit = pageLimit - resultArray.noRecords;
                    let balanceCount = balanceLimit;
                    const tempList = fetchedData.Items;
                    const existRecords = resultArray.records;
                    const tempArray = [];
                    tempList.forEach(element => {
                        if(balanceCount!==0){
                            tempArray.push(element);
                            --balanceCount;
                        }                   
                    });                
                    resultArray.noRecords = pageLimit;
                    resultArray.records = existRecords.concat(tempArray);
                    resultArray.LastEvaluatedKey = tempList[balanceLimit-1].id;
                } else {
                    resultArray.noRecords = fetchedData.Count;
                    resultArray.records = fetchedData.Items;
                    resultArray.LastEvaluatedKey = fetchedData.LastEvaluatedKey;
                }       
                //check is have last key
                if (resultArray.records < pageLimit && fetchedData.LastEvaluatedKey){
                    queryData.ExclusiveStartKey = fetchedData.LastEvaluatedKey;
                    //check limit of the data
                    dynamoDb.query(queryData, scanUntilDone);
                } else {
                    handleSuccess(resultArray,undefined,callback);
                }              
              } 
            });
    }).catch(error => {
        return error;
    });
}

const view = (id,tableName) => {
    const getQuery = {};
    getQuery.TableName = tableName;
    getQuery.Key = {}    
    getQuery.Key["id"] = id;
    if(tableName === "charities")
    getQuery.Key["charityId"] = parseInt(id,10);
    return dynamoDb.get(getQuery).promise();    
};

const viewGroup = (currentId,tableName) => {
    const query = {};
    query.TableName = tableName;
    query.FilterExpression = "poolId=:currentId";
    query.ExpressionAttributeValues = { ":currentId": currentId }
    return dynamoDb.scan(query).promise();
};

const viewUser = (currentId,tableName,params) => {
    const query = {};
    query.TableName = tableName;
    if(tableName === "referrals") {
        let verified = false;
        if(params && params.verified ==="yes")
        verified = true;
        query.FilterExpression = "referrId=:referrId and verified=:verified";
        query.ExpressionAttributeValues = { ":referrId": currentId,":verified":verified };
    } else {
        query.FilterExpression = "userId=:currentId";
        query.ExpressionAttributeValues = { ":currentId": currentId };
    }
    return dynamoDb.scan(query).promise();
};

const update = (currentId,inputData,tableName) => {
    let updateQuery = " SET";
    const valueObjects = {};

    Object.keys(inputData).map(function(key,i){
        const keyName = ":"+key;
        if(i!=0) {
          updateQuery += ",";
        }
        valueObjects[keyName] = inputData[key];
        updateQuery += " "+key+"="+keyName;     
    });

    const params = {
        TableName: tableName,
        Key: { 
            id: currentId,
        },
        UpdateExpression: updateQuery,
        ExpressionAttributeValues: valueObjects,
        ReturnValues:"UPDATED_NEW"
    };
    return dynamoDb.update(params).promise().then(result=>result).catch(err=>err);
};

exports.common = { create, list, view, viewGroup, viewUser, update };