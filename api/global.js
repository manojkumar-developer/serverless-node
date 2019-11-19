

const AWS = require("aws-sdk");

const IS_OFFLINE  = false;

if (IS_OFFLINE === true) {
  global.dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: "localhost",
    endpoint: "http://localhost:8000",
    apiVersion: '2012-08-10'
  });
} else {
  global.dynamoDb = new AWS.DynamoDB.DocumentClient(); 
  global.dynamoConnect = new AWS.DynamoDB();  
}

global.tabelList = {
  "news": "news",
  "users": "users"
}
