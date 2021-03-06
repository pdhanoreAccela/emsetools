/***************************************************************
 * This is EMSE script template for complete online payment.
 ***************************************************************/

// ------------------------- Constants -------------------------
var COMPLETE_ONLINEPAYMENT_SCRIPT_NAME = "FINISHONLINEPAYMENT";
var PROVIDER = "Economy";
// --------------------------------------------------------------

handleDelayPayments();

/**
 * Handle delay payment.
 * 1. Found out all pending transactions in local.
 * 2. Complete payment according to pending transactions.
 */
function handleDelayPayments()
{
	aa.log("Start to handle delay payments at: " + aa.date.getCurrentDate());
	// 1. Found out all pending transaction.
	var delayTrans = getAllDelayTransactions();
	if (delayTrans == null || delayTrans.length == 0)
	{
		aa.log("Non invalid transaction found.");
		return false;
	}
	aa.log("Transactions size: " + delayTrans.length);
	
	// 2. Iterator to complete payment for all of them.
	for (var i = 0; i < delayTrans.length; i++)
	{
		prepareParameters4DelayHandler(delayTrans[i]);
		aa.runScriptInNewTransaction(COMPLETE_ONLINEPAYMENT_SCRIPT_NAME);
	}
}

function getAllDelayTransactions()
{
	var delayTrans = null;

	var transSearchModel = aa.finance.createTransactionScriptModel();	
	transSearchModel.setProvider(PROVIDER);
	transSearchModel.setStatus("Pending");
	transSearchModel.setFeeType("Permit");
	transSearchModel.setAuditStatus("A");
	transSearchResult = aa.finance.getETransaction(transSearchModel, null);
	if (transSearchResult.getSuccess())
	{
		delayTrans = transSearchResult.getOutput();
	}
	else
	{
		aa.log("Error occur during searching transaction: " + transSearchResult.getErrorMessage());
	}
	
	return delayTrans;
}

function prepareParameters4DelayHandler(delayTrans)
{
	aa.env.setValue("isBatchJob", "Y");
	var entityID = delayTrans.getEntityID()
	var ids = entityID.split("-"); 
	var id1 = ids[0];
	var id2 = ids[1];
	var id3 = ids[2];
	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
	var condidateCAPIDModel = capIDScriptModel.getCapID();
	var capModel = getCAPModel(condidateCAPIDModel);
	var customID = getCustomID(condidateCAPIDModel, capModel);

	aa.env.setValue("id1", id1);
	aa.env.setValue("id2", id2);
	aa.env.setValue("id3", id3);
	aa.env.setValue("CONID", delayTrans.getProcTransID());
	aa.env.setValue("userSeqNum", delayTrans.getClientNumber());	
	aa.env.setValue("customID", customID);	
	aa.env.setValue("batchTransID", delayTrans.getBatchTransCode());	
	aa.env.setValue("ACAModel", getACAModel(delayTrans, capModel));
}

/**
 * Get custom ID.
 */
function getCustomID(condidateCAPIDModel, capModel)
{
	var customID = null;
	if (capModel != null)
	{
		customID = capModel.getCapID().getCustomID();
	}
	if (customID == null) // This cap make be expired.
	{
		var expiredCapResult = aa.cap.getCapByPK(condidateCAPIDModel, false);
		if (expiredCapResult.getSuccess())
		{
			customID = expiredCapResult.getOutput().getCapID().getCustomID();
		}
		else
		{
			aa.log("Cannot found out custom ID for given CAP: " + condidateCAPIDModel.toString());
		}
	}
	
	return customID;
}

function getACAModel(transaction, capModel)
{
	var acaModel = null;
	if (capModel == null)
	{
		acaModel = aa.finance.createACAScriptModel();
	}
	else
	{
		var acaModelResult = aa.finance.getACAModel(capModel);
		acaModel = acaModelResult.getOutput();
	}
	acaModel.setServProvCode(transaction.getServiceProviderCode());
	acaModel.setCallerID(transaction.getAuditID());
	acaModel.setStrAction(transaction.getActionSource());
	
	var userSeqNum = transaction.getClientNumber();
	var publicUser = getPublicUser(userSeqNum);
	var sysUser = acaModel.getSuModel();
	sysUser.setFirstName(publicUser.getFirstName());
	sysUser.setLastName(publicUser.getLastName());
	sysUser.setAgencyCode(publicUser.getServProvCode());
	sysUser.setEmail(publicUser.getEmail());
	sysUser.setUserID(publicUser.getUserID());
	sysUser.setFullName(publicUser.getFullName());
	
	return acaModel;
}

function getCAPModel(condidateCAPIDModel)
{
	aa.log("Init: Find out CAP information.");
	var capModel = aa.cap.getCapViewBySingle4ACA(condidateCAPIDModel);
	if (capModel == null)
	{
		aa.log("Fail to get CAP model: " + condidateCAPIDModel.toString());
		return null;
	}
	
	return capModel;
}

function getPublicUser(publicUserSeq)
{
	aa.log("Init: Find out public user model.");
	var publicUser = null;
	var publicUserResult = aa.publicUser.getPublicUser(publicUserSeq);
	if (!publicUserResult.getSuccess())
	{
		aa.log("Error occur during finding public user.");
		aa.log(publicUserResult.getErrorMessage());
		return publicUser;
	}
	
	publicUser = publicUserResult.getOutput();
	if (publicUser == null)
	{
		aa.log("Non invalid public user found: " + publicUserSeq);
	}
	else
	{
		aa.log("Public user name: " + publicUser.getUserID());
	}
	
	return publicUser;
}