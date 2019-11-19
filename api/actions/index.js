'use strict';

require("../global");

const { common } = require("./common");
const { handleSuccess,handleError } =require("../functions/common");
const { calculateContribution, updateCredits } = require("../functions/dashboard");
const { plusLedgerAmount } = require("../functions/ledger");

const createApi = (data,tableName,callback) => {
    common.create(data,tableName,callback);
}

const listApi = (tableName,params,callback) => {
    common.list(tableName,params,callback);
}

const viewApi = (currentId,tableName,callback) => {
    if(tableName === "pools_transactions") {
       return common.viewGroup(currentId,tableName)
       .then(result => {
        if(result) {
            handleSuccess(result,undefined,callback);
         }  
        }).catch(error=> {
            if(error) {
                handleError(error,callback);
            }
        });
    } else {
        return common.view(currentId,tableName)
        .then(result => {
            if(result) {
                handleSuccess(result,undefined,callback);
            }  
        }).catch(error=> {
            if(error) {
                handleError(error,callback);
            }
        });
   }    
}

const viewUserApi = (currentId,tableName,params,callback) => {
    common.viewUser(currentId,tableName,params)
    .then(result => {
        if(result) {
            handleSuccess(result,undefined,callback);
        } 
    })
    .catch(error=> {
        if(error) {
            handleError(error,callback);
        }
    });
}

const updateApi = (currentId,updateData,tableName,callback) => {
    common.update(currentId,updateData,tableName)
    .then(result => {
        if(result) {
            //update non cash contributions
            if (tableName === "contributions" && result.Attributes.verified && updateData.mode_type === "non_cash_contributions") {
                updateCredits(updateData.userId,"contributionOneDollar",updateData.marketValue,updateData.mode_type);
                plusLedgerAmount(updateData);
                calculateContribution(updateData);               
            } 
            handleSuccess(updateData,undefined,callback);
        } 
    })
    .catch(error=> {
        if(error) {
            handleError(error,callback);
        }
    });
}

const deleteApi = (currentId,tableName, callback) => {
    const updateData = {};
    updateData.isActive = "0";
    updateData.updatedAt = Date.now();
    common.update(currentId,updateData,tableName)
    .then(result => {
        if(result) {
            handleSuccess(result,undefined,callback);
        } 
     })
     .catch(error=> {
        if(error) {
            handleError(error,callback);
        }
    });
}

module.exports = { 
    createApi,
    listApi,
    viewApi,
    viewUserApi,
    updateApi,
    deleteApi
};