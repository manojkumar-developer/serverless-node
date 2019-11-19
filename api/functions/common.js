/* 

function : common

*/

const insertCounter = async (tableName,count) => {
  const insertData = {};
    insertData.id = tableName;
    insertData.countData = count;
    insertData.isActive = "1";
    insertData.createdAt = Date.now();
    const params = {
        TableName: "counters",
        Item: insertData
    };
    const result = await dynamoDb.put(params).promise();
    return result;
};


const insertQuery = (tableName,insertData) => {
  const params = {
        TableName: tableName,
        Item: insertData
    };
    return dynamoDb.put(params).promise();
};

const updateCounter = async (tableName,count) => {
  const params = {
        TableName: "counters",
        Key: {
          "id": tableName
        },
        UpdateExpression: "SET countData = :_countData",
        ExpressionAttributeValues: { 
          ":_countData": count
        },
        ReturnValues: "UPDATED_NEW"
    };
   const result = await dynamoDb.update(params).promise();
   return result;
};

const getSequence = async (tableName,isTrans) => {
  const query = {};
  query.TableName = "counters";
  query.Key = { id : tableName.toString() }
  let result = await dynamoDb.get(query).promise();
  let count = isTrans === "yes" ? 1001 : 1;
  if(result.Item){
    count = result.Item.countData + 1;
    updateCounter(tableName,count);
  } else {
    insertCounter(tableName,count);
  }
  return count;
}

const updateQuery = (currentId,inputData,tableName) => {
  let updateStatement = " SET";
  const valueObjects = {};
  Object.keys(inputData).map(function(key,i){
      const keyName = ":_"+key;
      if(i!=0) {
        updateStatement += ",";
      }
      valueObjects[keyName] = inputData[key];
      updateStatement += " "+key+"="+keyName;     
  });

  const params = {
      TableName: tableName,
      Key: { 
          id: currentId,
      },
      UpdateExpression: updateStatement,
      ExpressionAttributeValues: valueObjects,
      ReturnValues:"UPDATED_NEW"
  };
  return dynamoDb.update(params).promise().then(result => result.Attributes);
};

const getrandomText = () => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

const handleError = (reason,callback) => {
    const response = { 
      headers: {
          "Access-Control-Allow-Origin" : "*",
          "Access-Control-Allow-Credentials" : true
      }, 
      body: JSON.stringify({ message: reason}) 
  };
  callback(null, response);
}


const handleSuccess =  (result,message="success",callback) => {
  if(result) {
    const response = { 
        headers: {
            "Access-Control-Allow-Origin" : "*", 
            "Access-Control-Allow-Credentials" : true,
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
        },
        body: JSON.stringify({
          data :result,
          message
        })
    };
    callback(null, response);
  }
}

module.exports = { 
  insertCounter,
  insertQuery,
  updateCounter, 
  updateQuery, 
  getSequence, 
  getrandomText,
  handleError,
  handleSuccess
};
