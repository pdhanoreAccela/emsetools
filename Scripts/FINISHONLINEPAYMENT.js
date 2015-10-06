/***************************************************************
 * This is EMSE script template for complete online payment.
 * 1. Input parameters:
 * consolidatorID: consolidator ID of online payment
 * id1: CAP ID1
 * id2: CAP ID2
 * id3: CAP ID3
 * acaModel: ACAModel
 * publicUserSeq: public user sequence number
 * 2. Output parameters:
 * ScriptReturnCode: 0 means operation succeed, other value means failed.
 * ScriptReturnMessage: operation result message
 * capID: CAP ID string value
 * customID: customized CAP ID
 * receiptNumber: payment receipt sequence number
 ***************************************************************/

// ------------------------- Constants -------------------------
var E_TRANSACTION_STATUS_PENDING = 0;
var E_TRANSACTION_STATUS_AUTHORIZED_AND_CAPTURED = 1;
var E_TRANSACTION_STATUS_AUTHORIZED = 3;
var E_TRANSACTION_STATUS_REVERSED = 4;
var E_TRANSACTION_CAPTURE_SUCCESS = 0;
var E_TRANSACTION_REVERSE_SUCCESS = 0;
var DEPARTMENT = "Economy";
var PROVIDER = "Economy";
var DATE_FORMAT = "MM/dd/yyyy HH:mm:ss";
var mailFrom = "Auto_Sender@Accela.com";
var mailCC = "salawieh@accela.com";
// ----------------------- Error Code ---------------------------
var OPERATION_STATUS_MEET_BUSINESS_TROUBLE = "-5"; // Means meet some troubles during payment.
var OPERATION_STATUS_TRANSACTION_HAS_APPROVED = "-6"; // Means given transaction has paid.
var OPERATION_STATUS_FEE_CHANGED = "-7"; // Means payment amount has been changed, user need to register again.
var OPERATION_STATUS_TRANSACTION_EXPIRED = "-8"; // Means transaction has expired.
var OPERATION_STATUS_TRANSACTION_STILL_IN_PENDING = "-9"; // Means transaction still in pending status.
var OPERATION_STATUS_INVALID_CAP = "-10"; // Means CAP is invalid.
var OPERATION_STATUS_TRANSACTION_HAS_BEEN_PROCESSED = "-11"; // Means this transaction has been processed before.
// --------------------------------------------------------------
var operationErrorMessage = "";
var operationErrorCode = null;

//store the gateway transaction status.
//var gatewayTransactionStatus = "";

//web service URL of 3rd site.
var webServiceAddress = 'https://aa.achievo.com/service.asmx';

main();

/**
 * Function entrance.
 */
function main()
{
	var isBatchJob = (aa.env.getValue("isBatchJob") == "Y" ? true : false);
	if (startupPayment(isBatchJob))
	{
		aa.env.setValue("ScriptReturnCode", "0");
	}
	else
	{
		operationErrorCode = (operationErrorCode == null ? OPERATION_STATUS_MEET_BUSINESS_TROUBLE : operationErrorCode);
		aa.log(operationErrorMessage);
		aa.env.setValue("ScriptReturnMessage", operationErrorMessage);		
		aa.env.setValue("ScriptReturnCode", operationErrorCode); // -5 means meet business trouble.
	}
	if (isBatchJob)
	{
		aa.debug("Complete payment from batch Job: ", aa.getDebugOutput()); // Print debug info to console when it is come from batch job.
	}
}

/**
 * Include under steps:
 * 1. Init input parameters.
 * 2. Complete payment.
 * 3. Send mail and output after payment.
 */
function startupPayment(isBatchJob)
{
	aa.log("Startup payment.");
	// 1. Init input parameters.
	aa.log("Init input parameters: ");
	
	var consolidatorID = aa.env.getValue("CONID");
	var id1 = aa.env.getValue("id1");
	var id2 = aa.env.getValue("id2");
	var id3 = aa.env.getValue("id3");
	var acaModel = aa.env.getValue("ACAModel");
	var publicUserSeq = aa.env.getValue("userSeqNum");
	var batchTransactionID = aa.env.getValue("batchTransID");
	var customID = aa.env.getValue("customID");
	var entityID = id1 + "-" + id2 + "-" + id3;
	
	aa.log("Public user seqence number: " + publicUserSeq);
	aa.log("Consolidator ID: " + consolidatorID);
	aa.log("Batch transaction ID: " + batchTransactionID);
	aa.log("Action source: " + acaModel.getStrAction());
	aa.log("CAP ID: " + entityID);
	
	var publicUser = getPublicUser(publicUserSeq);
	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
	var condidateCAPIDModel = capIDScriptModel.getCapID();
	condidateCAPIDModel.setCustomID(customID);
	var capModel = getCAPModel(condidateCAPIDModel);
	var transactions = getTransactions(consolidatorID, entityID, null);
	
	// 2. Complete payment.
	var paymentResult = completePayment(consolidatorID, transactions, capModel, acaModel);
	
	// 3. Send mail and output after payment.
	return handlePaymentResult(isBatchJob, consolidatorID, publicUser, transactions, condidateCAPIDModel, paymentResult);
}

/**
 * Complete payment include under steps:
 * 1. Check whether this payment is valid.
 * 2. Commit payment.
 */
function completePayment(consolidatorID, transactions, capModel, acaModel)
{
	// 1. Check whether this payment is valid.
	if (!checkPayment(consolidatorID, transactions, capModel, acaModel))
	{
		return null;
	}
	
	// 2. Commit payment.
	var paymentResult = commitPayment(consolidatorID, transactions, capModel, acaModel);
	if (paymentResult == null)
	{
		aa.log("Start to do void transaction after commit payment failed.");
		doVoid(consolidatorID, transactions);
		return null;
	}
	
	return paymentResult;
}

/**
 * Check payment status include under steps:
 * 1. Check whether transaction has paided.
 * 2. Check whether transaction has authorized.
 * 3. Check whether transaction has voided.
 * 4. Check whether transaction has failed.
 * 5. Check whether transaction is in pending status.
 * 6. Check given CAP whether is valid.
 * 7. Check Etisalat transaction status.
 * 8. Check whether fee has been change.
 */
function checkPayment(consolidatorID, transactions, capModel, acaModel)
{
	var etisalatTransStatus = checkEtisalatTransStatus(consolidatorID);
	var actionSource = acaModel.getStrAction();
	var isPay4New = "CreatePermit" == actionSource || "RenewLicense" == actionSource || "Amendment CAP" == actionSource;

	// 1. Check whether transaction has paid.
	if (isApprovedTransaction(transactions))
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_has_approved");
		operationErrorCode = OPERATION_STATUS_TRANSACTION_HAS_APPROVED;
		return false;
	}

	// 2. Check whether transaction has authorized.
	if (isAuthorizedTransaction(transactions))
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_has_authorized");
		operationErrorCode = OPERATION_STATUS_TRANSACTION_HAS_BEEN_PROCESSED;
		return false;
	}

	// 3. Check whether transaction has voided.
	if (isVoidedTransaction(transactions))
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_has_voided");
		operationErrorCode = OPERATION_STATUS_TRANSACTION_HAS_BEEN_PROCESSED;
		return false;
	}

	// 4. Check whether transaction has failed.
	if (isFailedTransaction(transactions))
	{
		raiseHasFailedTransaction(consolidatorID, transactions, etisalatTransStatus);
		return false;
	}
	
	// 5. Check whether transaction is in pending status.
	if (!isPendingTransaction(transactions))
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		return false;
	}

	// 6. Check given CAP whether is valid.
	if (!isValidCAP(capModel, acaModel))
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.invalid_CAP");
		operationErrorCode = OPERATION_STATUS_INVALID_CAP;
		raiseInvalidCAP(consolidatorID, transactions, etisalatTransStatus);
		return false;
	}
	
	// 7. Check Etisalat transaction status.
	if (E_TRANSACTION_STATUS_AUTHORIZED != etisalatTransStatus)
	{
		aa.log("Check failed: " + consolidatorID + " is invalid.");
		raiseInvalidEtisalatTrans(consolidatorID, transactions, etisalatTransStatus);
		return false;
	}
	aa.log("Check passed: " + consolidatorID + " is authorized.");
	
	// 8. Check whether fee has been change.
	if (isTotalFeeChange(capModel, transactions, !isPay4New))
	{
		// Do void if CAP's fee has been changed.
		aa.log("Do void because CAP's fee has been changed.");
		doVoid(consolidatorID, transactions);
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.fee_has_changed");
		operationErrorCode = OPERATION_STATUS_FEE_CHANGED;
		return false;
	}
	
	return true;
}

/**
 * Commit payment include under steps:
 * 1. Convert to real CAP when this action source is renew license or new CAP.
 * 2. Finish local payment.
 *    a) Make invoice when this action source is renew license or new CAP.
 *    b) Create payment.
 *    c) Apply payment.
 *    d) Generate receipt.
 *    e) Update ACA status when this action source is renew license or new CAP.
 * 3. Update local transaction after payment
 */
function commitPayment(consolidatorID, transactions, capModel, acaModel)
{
	// 1. Convert to real CAP when this action source is renew license or new CAP.
	var actionSource = acaModel.getStrAction();
	var isPay4New = "CreatePermit" == actionSource || "RenewLicense" == actionSource || "Amendment CAP" == actionSource;
	var isCreateAmendment = "Amendment CAP".equals(actionSource);
	if (isCreateAmendment)
	{
		var parentProjectResult = aa.cap.getProjectByChildCapID(capModel.getCapID(), "Amendment", "Incomplete");
		if (parentProjectResult.getSuccess())
		{
			var parentProject = parentProjectResult.getOutput()[0];
			capModel.setParentCapID(parentProject.getProjectID());
		}
		else
		{
			aa.log("Get parent project failed.");
			aa.log(parentProjectResult.getErrorMessage())
			return null;
		}
	}
	if (isPay4New)
	{
		var updateCAPModel = convert2RealCAP(capModel, transactions);
		if (updateCAPModel == null)
		{
			return null;
		}
		
		capModel = updateCAPModel;
	}
	
	// 2. Finish local payment.
	var paymentResult = makeLocalPayment(consolidatorID, transactions, capModel, acaModel);
	
	if (paymentResult == null)
	{
		return null;
	}
	
	paymentResult.setCapID(capModel.getCapID());

	var isAutoIssuanceSuccess = "Yes".equals(aa.env.getValue("isAutoIssuanceSuccess"));
	aa.log("Is auto issuance success: " + isAutoIssuanceSuccess);
	if (isAutoIssuanceSuccess)
	{
		if (!captureTransaction(consolidatorID))
		{
			return null;
		}

		if (!approveLocalTransAfterCapture(consolidatorID, transactions, capModel))
		{
			return null;
		}
	}
	else
	{
		// 3. Enquire Etisalat transaction autor code and gateway transaction ID.
		if (!updateTransactionAfterPayment(consolidatorID, transactions, capModel))
		{
			return null;
		}
	}
	
	return paymentResult;
}

function getPublicUser(publicUserSeq)
{
	aa.log("Init: Find out public user model.");
	var publicUser = null;
	var publicUserResult = aa.publicUser.getPublicUser(publicUserSeq);
	if (!publicUserResult.getSuccess())
	{
		aa.log("Error occur during finding public user./n");
		aa.log(publicUserResult.getErrorMessage());
		return null;
	}
	
	publicUser = publicUserResult.getOutput();
	if (publicUser == null)
	{
		aa.log("Non invalid public user found: " + publicUserSeq);
		return null;
	}
	
	aa.log("Public user name: " + publicUser.getUserID());
	
	return publicUser;
}

function getCAPModel(capIDModel)
{
	aa.log("Init: Find out CAP information.");
	var capModel = aa.cap.getCapViewBySingle4ACA(capIDModel);
	if (capModel == null)
	{
		aa.log("Fail to get CAP model: " + capIDModel.toString());
		return null;
	}
	
	return capModel;
}

function getTransactions(consolidatorID, entityID, status)
{
	aa.log("Init: Find out pending transaction records according to consolidatorID and entityID.");
	aa.log("consolidatorID: " + consolidatorID);
	aa.log("entityID: " + entityID);
	var transactions = null;
	
	var transSearchModel = aa.finance.createTransactionScriptModel();	
	transSearchModel.setProvider(PROVIDER);
	transSearchModel.setProcTransID(consolidatorID);
	transSearchModel.setEntityID(entityID);
	if (status != null && status != "")
	{
		transSearchModel.setStatus(status);
	}
	transSearchModel.setAuditStatus("A");
	transSearchResult = aa.finance.getETransaction(transSearchModel, null);
	if (!transSearchResult.getSuccess())
	{
		aa.log("Error occur during searching transaction.\n");
		aa.log(transSearchResult.getErrorMessage());
		return null;
	}
	
	transactions = transSearchResult.getOutput();
	if (transactions == null || transactions.length == 0)
	{
		aa.log("Non invalid transactions found by given parameters:\n");
		aa.log("batch consolidator ID: " + consolidatorID + "\n");
		aa.log("entityID: " + entityID + "\n");
		aa.log("status: " + status + "\n");
		return null;
	}
	aa.log("Transactions size: " + transactions.length);
	
	return transactions;
}

function getAgencyTransaction(transactions)
{
	var agencyTransaction = null;
	for (var i = 0; i < transactions.length; i++)
	{
		if ("Permit" == transactions[i].getFeeType())
		{
			agencyTransaction = transactions[i];
			aa.log("Agency transaction: " + agencyTransaction.getTransactionNumber());
		}
	}
	
	if (agencyTransaction == null)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("Non invalid agency transaction found with consolidator ID: " + consolidatorID);
		return null;
	}

	return agencyTransaction;
}

function getAccelaTransaction(transactions)
{
	var accelaTransaction = null;
	for (var i = 0; i < transactions.length; i++)
	{
		if ("PROCESSING_FEE" == transactions[i].getFeeType())
		{
			accelaTransaction = transactions[i];
			aa.log("Accela transaction: " + accelaTransaction.getTransactionNumber());
		}
	}
	
	if (accelaTransaction == null)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("Non invalid accela transaction found with consolidator ID: " + consolidatorID);
		return null;
	}
	
	return accelaTransaction;
}

function getexpireDay()
{
	var bizResult = aa.bizDomain.getBizDomainByValue("ACA_ONLINE_PAYMENT_WEBSERVICE", "EXPIRATION_DAYS");
	var expireDay = null;
	if (bizResult.getSuccess())
	{
		var biz = bizResult.getOutput();
		aa.log("Expired day biz value: " + biz);
		if(biz == null || biz.getDescription() == "")
		{
			aa.log("WARNING: The expire day isn't set-up, it will be set as 3 day!");
			expireDay = "3";
		}
		else
		{
			expireDay = biz.getDescription();
			aa.log("The expire day is :" + expireDay);
		}
	}
	else
	{
		aa.log("WARNING: Exception occurs during fetch expire day, it will be set as 3 day!\n");
		aa.log(bizResult.getErrorMessage());
		expireDay = "3";
	}
	
	try
	{
		expireDay = aa.util.parseLong(expireDay);
	}
	catch (e)
	{
		aa.log("WARNING: Exception occurs, it will be set as 3 day!\n");
		aa.log(e);
		expireDay = 3;
	}
	
	return expireDay;
}

function isTransactionExpired(transaction)
{
	aa.log("Check payment: Check transaction is expired.");
	if (transaction == null || transaction.length == 0)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("transaction shouldn't be null or empty.");
		return false;
	}
	
	var expireDate = aa.util.dateDiff(transaction.getAuditDate(), "DAY", getexpireDay());
	var currentDate = aa.util.now();
	var compareResult = currentDate.compareTo(expireDate);
	
	if (compareResult > 0)
	{
		aa.log("Transaction has expired.");
		return true;
	}
	
	aa.log("Transaction hasn't expired.");
	return false;
}

function isAuthorizedTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Authorized"));
}

function isApprovedTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Approved"));
}

function isVoidedTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Voided"));
}

function isFailedTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Failed"));
}

function isPendingTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Pending"));
}

function equalTransactionStatus(transactions, status)
{
	if (transactions == null || transactions.length == 0)
	{
		aa.log("Transactions shouldn't be null or empty.");
		return false;
	}
	
	for (var i = 0; i < transactions.length; i++)
	{
		var condidatorTrans = transactions[i];
		if (!condidatorTrans.getStatus().equals(status))
		{
			aa.log("Transaction isn't " + status + " status.");
			return false;
		}
	}
	
	aa.log("Transactions are in " + status + " status.");
	
	return true;
}

function checkEtisalatTransStatus(consolidatorID)
{
	aa.log("Check payment: Check Etisalat transaction status.");
	var enquireRespondString = enquireEtisalatTransaction(consolidatorID);
	return aa.util.getValueFromXML("Status", enquireRespondString);
}

/**
 * Deal with invalid CAP.
 * 1. If Etisalat transaction has authorized, reverse it and void local transaction.
 * 2. Otherwise, failed local transaction.
 */
function raiseInvalidCAP(consolidatorID, transactions, etisalatTransStatus)
{
	doVoid(consolidatorID, transactions);
}

function raiseHasFailedTransaction(consolidatorID, transactions, etisalatTransStatus)
{
	var failedReason = getFailedReason(getAgencyTransaction(transactions));
	if (etisalatTransStatus == E_TRANSACTION_STATUS_AUTHORIZED)
	{
		doVoid(consolidatorID, transactions);
	}
	operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_has_voided") + ", " + failedReason;
	operationErrorCode = OPERATION_STATUS_TRANSACTION_HAS_BEEN_PROCESSED;
}

function getFailedReason(transaction)
{
	var reason = transaction.getProcRespMsg();
	if (reason == null || reason == "")
	{
		return "";
	}

	if (reason.indexOf(" ") == -1) // If this is a label key, get the message from resource.
	{
		reason = aa.messageResources.getLocalMessage(reason);
	}

	return reason;
}

/**
 * Deal with transaction that not in authorized status.
 * 1. If transaction still in pending status and exceed expire day, 
 *    do void this transaction.
 * 2. If transaction hasn't expired, ignore process.
 * 3. If transaction in other status, do void this transaction. In fact this case shouldn't happen in general process.
 */
function raiseInvalidEtisalatTrans(consolidatorID, transactions, transactionStatus)
{
	if (E_TRANSACTION_STATUS_PENDING == transactionStatus)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_still_in_pending");
		operationErrorCode = OPERATION_STATUS_TRANSACTION_STILL_IN_PENDING;
		aa.log("Check failed: " + consolidatorID + " is still in pending status.");
		var agencyTransaction = getAgencyTransaction(transactions);
		// If transaction is expired, update transaction to failed in local.
		if (isTransactionExpired(agencyTransaction))
		{
			doVoid(consolidatorID, transactions);
			operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_expired");
			operationErrorCode = OPERATION_STATUS_TRANSACTION_EXPIRED;
		}
		return;
	}
	
	doVoid(consolidatorID, transactions);
}

/**
 * Check whether given CAP is valid.
 * 1. CAP should be found.
 * 2. If is pay for new, it should be partial CAP.
 */
function isValidCAP(capModel, acaModel)
{
	var actionSource = acaModel.getStrAction();
	var isPay4New = "CreatePermit" == actionSource || "RenewLicense" == actionSource || "Amendment CAP" == actionSource;
	if (capModel == null)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_INVALID_CAP;
		aa.log("Check failed: CAP isn't exist.");
		return false;
	}
	
	if (isPay4New)
	{
		if (capModel.isCompleteCap())
		{
			aa.log("Check failed: Invalid CAP, it should be partial CAP in this proccess.");
			return false;
		}
	}
	
	return true;
}

function isTotalFeeChange(capModel, transactions, isInvoiceBalance)
{
	var totalFeeResult = aa.finance.getPaymentAmount4ACA(capModel.getCapID(), isInvoiceBalance);
	var totalFee = totalFeeResult.getOutput();
	aa.log("Current total fee is " + totalFee);
	var isFeeChange = true;
	for (var i = 0; i < transactions.length; i++)
	{
		totalFee = totalFee - transactions[i].getTotalFee();
	}
	
	aa.log("Fee balance is " + totalFee);
	
	if (totalFee == 0 || Math.abs(totalFee)<0.0000001)
	{
		isFeeChange = false;
		aa.log("Check passed: The Cap's total fee not be changed!");	
	}
	else
	{
		aa.log("Check failed: CAP's fee has been changed during this payment. We will void this transaction, please register again.");
	}
	
	return isFeeChange;
}

/**
 * 1. Get out tempalte.
 * 2. Convert asi group.
 * 3. Convert as table.
 * 4. Triger event before convert to real CAP.
 * 5. Convert to real CAP.
 * 6. Create template after convert to real CAP.
 * 7. Create amendment CAP.
 */
function convert2RealCAP(capModel, transactions)
{
	var originalCAPID = capModel.getCapID().getCustomID();
	var originalCAP = capModel;
	aa.log("Commit payment: Convert to real CAP when this action source is renew license or new CAP.");
	// 1. Get out tempalte.
	var capWithTemplateResult = aa.cap.getCapWithTemplateAttributes(capModel);
	var capWithTemplate = null;
	if (capWithTemplateResult.getSuccess())
	{
		capWithTemplate = capWithTemplateResult.getOutput();
	}
	else
	{
		aa.log("Commit payment failed: Error occurs during get template from original cap./n");
		aa.log(capWithTemplateResult.getErrorMessage());
		return null;
	}
	
	// 2. Convert asi group.
	aa.cap.convertAppSpecificInfoGroups2appSpecificInfos4ACA(capModel);
	if (capModel.getAppSpecificTableGroupModel() != null)
	{
		// 3. Convert as table.
		aa.cap.convertAppSpecTableField2Value4ACA(capModel);
	}
	// 4. Triger event before convert to real CAP.
	aa.cap.runEMSEScriptBeforeCreateRealCap(capModel, null);
	// 5. Convert to real CAP.
	convertResult = aa.cap.createRegularCapModel4ACA(capModel, null, false, false);
	if (convertResult.getSuccess())
	{
		capModel = convertResult.getOutput();
		aa.log("Commit OK: Convert partial CAP to real CAP successful: " + originalCAPID + " to " + capModel.getCapID().getCustomID());
	}
	else
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("Commit payment failed: Error occurs during convert partial CAP to real CAP./n");
		aa.log(convertResult.getErrorMessage());
		return null;
	}
	
	// 6. Create template after convert to real CAP.
	aa.cap.createTemplateAttributes(capWithTemplate, capModel);
	
	// Triger event after convert to real CAP.
	aa.cap.runEMSEScriptAfterCreateRealCap(capModel, null);
	
	if (originalCAP.getParentCapID() != null)
	{
		// 7. Create amendment CAP.
		aa.cap.createAmendmentCap(originalCAP.getParentCapID(), capModel.getCapID(), false);
	}
	
	return capModel;
}

function makeLocalPayment(consolidatorID, transactions, capModel, acaModel)
{
	var actionSource = acaModel.getStrAction();
	var isPay4New = "CreatePermit" == actionSource || "RenewLicense" == actionSource || "Amendment CAP" == actionSource;
	// Check whether total fee has been changed after convert to real CAP but before making local payment.
	if (isTotalFeeChange(capModel, transactions, !isPay4New))
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.fee_has_changed");
		operationErrorCode = OPERATION_STATUS_FEE_CHANGED;
		return null;
	}

	var agencyTransaction = getAgencyTransaction(transactions);
	var accelaTransaction = getAgencyTransaction(transactions);
	var paymentResultModel = null;
	var capIDModel = capModel.getCapID();
	aa.log("Commit payment: Finish local payment for CAP: " + capIDModel.getCustomID());
	var paymentScriptModel = aa.finance.createPaymentScriptModel();
	paymentScriptModel.setBatchTransCode(agencyTransaction.getBatchTransCode());
	paymentScriptModel.setTranCode(agencyTransaction.getProcTransID());
	paymentScriptModel.setPaymentMethod(agencyTransaction.getProcTransType());
	paymentScriptModel.setPaymentDate(aa.date.getCurrentDate());
	paymentScriptModel.setCashierID("ACA System"); // Only indicates the payment is from ACA system.
	paymentScriptModel.setPaymentStatus("Paid");
	var actionSource = acaModel.getStrAction();
	var invoiceAmountr enquireStatus = aa.util.getValueFromXML("Status", enquireRespondString);
	aa.log("Etisalat transaction status: " + enquireStatus);
	if (E_TRANSACTION_STATUS_AUTHORIZED_AND_CAPTURED != enquireStatus)
	{
		aa.log("Invalid Etisalat transaction status for approve.");
		return false;
	}
	
	var gateWayTransactionID = aa.util.getValueFromXML("PaymentGatewayTransactionID", enquireRespondString);
	var bankAuthorCode = aa.util.getValueFromXML("BankAuthorizationCode", enquireRespondString);

	aa.log("Start to approve transaction.");
	for (var i = 0; i < transactions.length; i++)
	{
		transactions[i].setEntityID(capModel.getCapID().toString());
		transactions[i].setGateWayTransactionID(gateWayTransactionID);
		transactions[i].setAuthCode(bankAuthorCode);
		transactions[i].setStatus("Approved");
		
		var gatewayTransactionStatus = getEtisalatStransStatus(transactions[i].getProcTransID());
		transactions[i].setGatewayTransTtatus(gatewayTransactionStatus);
		aa.finance.updateETransaction4ACA(transactions[i]);
	}
	aa.log("Commit OK: Approve local transaction succeed.");
	
	return true;
}

function getOnlinePaymentWebService()
{
	var result = aa.proxyInvoker.newInstance('com.accela.epayment.wsclient.PaymentClientImpl');
	
	if(result.getSuccess())
	{
		service = result.getOutput();
		service.setWebServiceEndPoint(webServiceAddress);

		return service;
	}else
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("Error occurs during fetch web service client.\n");
		aa.log(result.getErrorMessage());		

		service = null;
	}
	
	return service;
}

function enquireEtisalatTransaction(consolidatorID)
{
	aa.log("Enquire Etisalat transaction.");
	var onlinePaymentWebService = getOnlinePaymentWebService();
	if (onlinePaymentWebService == null)
	{
		return null;
	}
	var enquireReqestString = "<Enquire><Customer>" + DEPARTMENT + "</Customer><ConsolidatorID>" + consolidatorID + "</ConsolidatorID></Enquire>";
	aa.log("Start to enquire Etisalat transaction: " + enquireReqestString);
	var enquireRespondString = onlinePaymentWebService.enquire(enquireReqestString);
	aa.log("Online payment web service respond result: " + enquireRespondString);

	return enquireRespondString;
}

function captureEtisalatTransaction(consolidatorID)
{
	var onlinePaymentWebService = getOnlinePaymentWebService();
	if (onlinePaymentWebService == null)
	{
		return null;
	}
	var captureRequestString = "<CaptureTransaction><Customer>" + DEPARTMENT + "</Customer><ConsolidatorID>" + consolidatorID + "</ConsolidatorID></CaptureTransaction >";
	aa.log("Start to capture Etisalat transaction: " + captureRequestString);
	var captureRespondString = onlinePaymentWebService.captureTransaction(captureRequestString);
	aa.log("Online payment web service respond result: " + captureRespondString);
	
	return captureRespondString;
}

function reverseEtisalatTransaction(consolidatorID)
{
	aa.log("Reverse Etisalat transaction.");
	var onlinePaymentWebService = getOnlinePaymentWebService();
	if (onlinePaymentWebService == null)
	{
		return null;
	}
	var reverseReqestString = "<ReverseTransaction><Customer>" + DEPARTMENT + "</Customer><ConsolidatorID>" + consolidatorID + "</ConsolidatorID></ReverseTransaction>";
	aa.log("Start to reverse Etisalat transaction: " + reverseReqestString);
	var reverseRespondString = onlinePaymentWebService.reverseTransaction(reverseReqestString);
	aa.log("Online payment web service respond result: " + reverseRespondString);

	return reverseRespondString;
}

function getTotalTransactionFee(transactions)
{
	if (transactions == null || transactions.length == 0)
	{
		return 0.00;
	}
	
	var paymentAmount = 0.00;
	for (var i = 0; i < transactions.length; i++)
	{
		paymentAmount += transactions[i].getTotalFee().doubleValue();
	}
	
	return paymentAmount;
}

function sendSucceedEmail(consolidatorID, publicUser, transactions, paymentResult)
{
	var capIDModel = paymentResult.getCapID();
	var agencyTransaction = getAgencyTransaction(transactions);
	var capType = null;
	var capTypeModelResult = aa.cap.getCapTypeModelByCapID(capIDModel);
	if (capTypeModelResult.getSuccess())
	{
		capType = capTypeModelResult.getOutput().getAlias();
	}
	else
	{
		aa.log("Get CAP type failed, set CAP type to empty.");
		aa.log(capTypeModelResult.getErrorMessage());
		capType = "";
	}
	var expireDate = aa.util.formatDate(aa.util.dateDiff(agencyTransaction.getAuditDate(), "DAY", getexpireDay()), DATE_FORMAT);
	
	var subjectParameters = aa.util.newHashtable(); 
	var contentParameters = aa.util.newHashtable();
	
	addParameter(contentParameters, "$$servProvCode$$", agencyTransaction.getServiceProviderCode());
	addParameter(contentParameters, "$$capID$$", capIDModel.getCustomID());
	addParameter(contentParameters, "$$capType$$", capType);
	addParameter(contentParameters, "$$FirstName$$", publicUser.getFirstName());
	addParameter(contentParameters, "$$LastName$$", publicUser.getLastName());
	addParameter(contentParameters, "$$mmddyy$$", expireDate);
	sendEmail(mailFrom, publicUser.getEmail(), mailCC, "ACA_EMAIL_ETISALAT_PAYMENT_COMPLETION_SUCCEEDED_SUBJECT", subjectParameters, "ACA_EMAIL_ETISALAT_PAYMENT_COMPLETION_SUCCEEDED_CONTENT", contentParameters);
}

function sendFailedEmail(consolidatorID, publicUser, transactions, condidateCAPIDModel)
{
	var paymentAmount = getTotalTransactionFee(transactions);
	var agencyTransaction = getAgencyTransaction(transactions);
	var auditDate = aa.util.formatDate(agencyTransaction.getAuditDate(), DATE_FORMAT);
	var capType = null;
	var capTypeResult = aa.cap.getCapTypeModelByCapID(condidateCAPIDModel); 
	if (capTypeResult.getSuccess() && capTypeResult.getOutput()!= null)
	{
		capType = capTypeResult.getOutput().getAlias();
		aa.log("Get CAP type successful: " + capType);
	}
	else
	{
		aa.log("Get CAP type model failed, set CAP type to empty.");
		aa.log(capTypeResult.getErrorMessage());
		capType = "";
	}
	var expireDate = aa.util.formatDate(aa.util.dateDiff(agencyTransaction.getAuditDate(), "DAY", getexpireDay()), DATE_FORMAT);

	var subjectParameters = aa.util.newHashtable(); 
	var contentParameters = aa.util.newHashtable();
	
	addParameter(contentParameters, "$$servProvCode$$", agencyTransaction.getServiceProviderCode());
	addParameter(contentParameters, "$$Date$$", auditDate);
	addParameter(contentParameters, "$$Amount$$", aa.util.numberFormat(paymentAmount));
	addParameter(contentParameters, "$$capID$$", condidateCAPIDModel.getCustomID());
	addParameter(contentParameters, "$$capType$$", capType);
	addParameter(contentParameters, "$$FirstName$$", publicUser.getFirstName());
	addParameter(contentParameters, "$$LastName$$", publicUser.getLastName());
	addParameter(contentParameters, "$$mmddyy$$", expireDate);
	addParameter(contentParameters, "$$processResult$$", operationErrorMessage);
	sendEmail(mailFrom, publicUser.getEmail(), mailCC, "ACA_EMAIL_ETISALAT_PAYMENT_COMPLETION_FAILED_SUBJECT", subjectParameters, "ACA_EMAIL_ETISALAT_PAYMENT_COMPLETION_FAILED_CONTENT", contentParameters);
}

function sendEmail(from, to, cc, subjectTempKey, subjectParameters, contentTempKey, contentParameters)
{
	aa.log("Start to send email using tempalte: " + subjectTempKey + " " + contentTempKey);
	var subject = aa.util.getCustomContentByType(subjectTempKey, subjectParameters);
	var content = aa.util.getCustomContentByType(contentTempKey, contentParameters);
	aa.sendMail(from, to, cc, subject, content);
	aa.log("Send email successful.");
}

// Add value to map.
function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = "";
		}
		
		pamaremeters.put(key, value);
	}
}

/*
* Get Etisalat Stransaction Status string
*/
function getEtisalatStransStatus(consolidatorID)
{
   var queryResultXML = enquireEtisalatTransaction(consolidatorID)
   if(queryResultXML != null && queryResultXML!="")
	 {
		  return aa.util.getValueFromXML('StatusDescripvoid because CAP's fee has been changed.");
		doVoid(consolidatorID, transactions);
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.fee_has_changed");
		operationErrorCode = OPERATION_STATUS_FEE_CHANGED;
		return false;
	}
	
	return true;
}

/**
 * Commit payment include under steps:
 * 1. Convert to real CAP when this action source is renew license or new CAP.
 * 2. Finish local payment.
 *    a) Make invoice when this action source is renew license or new CAP.
 *    b) Create payment.
 *    c) Apply payment.
 *    d) Generate receipt.
 *    e) Update ACA status when this action source is renew license or new CAP.
 * 3. Update local transaction after payment
 */
function commitPayment(consolidatorID, transactions, capModel, acaModel)
{
	// 1. Convert to real CAP when this action source is renew license or new CAP.
	var actionSource = acaModel.getStrAction();
	var isPay4New = "CreatePermit" == actionSource || "RenewLicense" == actionSource || "Amendment CAP" == actionSource;
	var isCreateAmendment = "Amendment CAP".equals(actionSource);
	if (isCreateAmendment)
	{
		var parentProjectResult = aa.cap.getProjectByChildCapID(capModel.getCapID(), "Amendment", "Incomplete");
		if (parentProjectResult.getSuccess())
		{
			var parentProject = parentProjectResult.getOutput()[0];
			capModel.setParentCapID(parentProject.getProjectID());
		}
		else
		{
			aa.log("Get parent project failed.");
			aa.log(parentProjectResult.getErrorMessage())
			return null;
		}
	}
	if (isPay4New)
	{
		var updateCAPModel = convert2RealCAP(capModel, transactions);
		if (updateCAPModel == null)
		{
			return null;
		}
		
		capModel = updateCAPModel;
	}
	
	// 2. Finish local payment.
	var paymentResult = makeLocalPayment(consolidatorID, transactions, capModel, acaModel);
	
	if (paymentResult == null)
	{
		return null;
	}
	
	paymentResult.setCapID(capModel.getCapID());

	var isAutoIssuanceSuccess = "Yes".equals(aa.env.getValue("isAutoIssuanceSuccess"));
	aa.log("Is auto issuance success: " + isAutoIssuanceSuccess);
	if (isAutoIssuanceSuccess)
	{
		if (!captureTransaction(consolidatorID))
		{
			return null;
		}

		if (!approveLocalTransAfterCapture(consolidatorID, transactions, capModel))
		{
			return null;
		}
	}
	else
	{
		// 3. Enquire Etisalat transaction autor code and gateway transaction ID.
		if (!updateTransactionAfterPayment(consolidatorID, transactions, capModel))
		{
			return null;
		}
	}
	
	return paymentResult;
}

function getPublicUser(publicUserSeq)
{
	aa.log("Init: Find out public user model.");
	var publicUser = null;
	var publicUserResult = aa.publicUser.getPublicUser(publicUserSeq);
	if (!publicUserResult.getSuccess())
	{
		aa.log("Error occur during finding public user./n");
		aa.log(publicUserResult.getErrorMessage());
		return null;
	}
	
	publicUser = publicUserResult.getOutput();
	if (publicUser == null)
	{
		aa.log("Non invalid public user found: " + publicUserSeq);
		return null;
	}
	
	aa.log("Public user name: " + publicUser.getUserID());
	
	return publicUser;
}

function getCAPModel(capIDModel)
{
	aa.log("Init: Find out CAP information.");
	var capModel = aa.cap.getCapViewBySingle4ACA(capIDModel);
	if (capModel == null)
	{
		aa.log("Fail to get CAP model: " + capIDModel.toString());
		return null;
	}
	
	return capModel;
}

function getTransactions(consolidatorID, entityID, status)
{
	aa.log("Init: Find out pending transaction records according to consolidatorID and entityID.");
	aa.log("consolidatorID: " + consolidatorID);
	aa.log("entityID: " + entityID);
	var transactions = null;
	
	var transSearchModel = aa.finance.createTransactionScriptModel();	
	transSearchModel.setProvider(PROVIDER);
	transSearchModel.setProcTransID(consolidatorID);
	transSearchModel.setEntityID(entityID);
	if (status != null && status != "")
	{
		transSearchModel.setStatus(status);
	}
	transSearchModel.setAuditStatus("A");
	transSearchResult = aa.finance.getETransaction(transSearchModel, null);
	if (!transSearchResult.getSuccess())
	{
		aa.log("Error occur during searching transaction.\n");
		aa.log(transSearchResult.getErrorMessage());
		return null;
	}
	
	transactions = transSearchResult.getOutput();
	if (transactions == null || transactions.length == 0)
	{
		aa.log("Non invalid transactions found by given parameters:\n");
		aa.log("batch consolidator ID: " + consolidatorID + "\n");
		aa.log("entityID: " + entityID + "\n");
		aa.log("status: " + status + "\n");
		return null;
	}
	aa.log("Transactions size: " + transactions.length);
	
	return transactions;
}

function getAgencyTransaction(transactions)
{
	var agencyTransaction = null;
	for (var i = 0; i < transactions.length; i++)
	{
		if ("Permit" == transactions[i].getFeeType())
		{
			agencyTransaction = transactions[i];
			aa.log("Agency transaction: " + agencyTransaction.getTransactionNumber());
		}
	}
	
	if (agencyTransaction == null)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("Non invalid agency transaction found with consolidator ID: " + consolidatorID);
		return null;
	}

	return agencyTransaction;
}

function getAccelaTransaction(transactions)
{
	var accelaTransaction = null;
	for (var i = 0; i < transactions.length; i++)
	{
		if ("PROCESSING_FEE" == transactions[i].getFeeType())
		{
			accelaTransaction = transactions[i];
			aa.log("Accela transaction: " + accelaTransaction.getTransactionNumber());
		}
	}
	
	if (accelaTransaction == null)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("Non invalid accela transaction found with consolidator ID: " + consolidatorID);
		return null;
	}
	
	return accelaTransaction;
}

function getexpireDay()
{
	var bizResult = aa.bizDomain.getBizDomainByValue("ACA_ONLINE_PAYMENT_WEBSERVICE", "EXPIRATION_DAYS");
	var expireDay = null;
	if (bizResult.getSuccess())
	{
		var biz = bizResult.getOutput();
		aa.log("Expired day biz value: " + biz);
		if(biz == null || biz.getDescription() == "")
		{
			aa.log("WARNING: The expire day isn't set-up, it will be set as 3 day!");
			expireDay = "3";
		}
		else
		{
			expireDay = biz.getDescription();
			aa.log("The expire day is :" + expireDay);
		}
	}
	else
	{
		aa.log("WARNING: Exception occurs during fetch expire day, it will be set as 3 day!\n");
		aa.log(bizResult.getErrorMessage());
		expireDay = "3";
	}
	
	try
	{
		expireDay = aa.util.parseLong(expireDay);
	}
	catch (e)
	{
		aa.log("WARNING: Exception occurs, it will be set as 3 day!\n");
		aa.log(e);
		expireDay = 3;
	}
	
	return expireDay;
}

function isTransactionExpired(transaction)
{
	aa.log("Check payment: Check transaction is expired.");
	if (transaction == null || transaction.length == 0)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("transaction shouldn't be null or empty.");
		return false;
	}
	
	var expireDate = aa.util.dateDiff(transaction.getAuditDate(), "DAY", getexpireDay());
	var currentDate = aa.util.now();
	var compareResult = currentDate.compareTo(expireDate);
	
	if (compareResult > 0)
	{
		aa.log("Transaction has expired.");
		return true;
	}
	
	aa.log("Transaction hasn't expired.");
	return false;
}

function isAuthorizedTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Authorized"));
}

function isApprovedTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Approved"));
}

function isVoidedTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Voided"));
}

function isFailedTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Failed"));
}

function isPendingTransaction(transactions)
{
	return (equalTransactionStatus(transactions, "Pending"));
}

function equalTransactionStatus(transactions, status)
{
	if (transactions == null || transactions.length == 0)
	{
		aa.log("Transactions shouldn't be null or empty.");
		return false;
	}
	
	for (var i = 0; i < transactions.length; i++)
	{
		var condidatorTrans = transactions[i];
		if (!condidatorTrans.getStatus().equals(status))
		{
			aa.log("Transaction isn't " + status + " status.");
			return false;
		}
	}
	
	aa.log("Transactions are in " + status + " status.");
	
	return true;
}

function checkEtisalatTransStatus(consolidatorID)
{
	aa.log("Check payment: Check Etisalat transaction status.");
	var enquireRespondString = enquireEtisalatTransaction(consolidatorID);
	return aa.util.getValueFromXML("Status", enquireRespondString);
}

/**
 * Deal with invalid CAP.
 * 1. If Etisalat transaction has authorized, reverse it and void local transaction.
 * 2. Otherwise, failed local transaction.
 */
function raiseInvalidCAP(consolidatorID, transactions, etisalatTransStatus)
{
	doVoid(consolidatorID, transactions);
}

function raiseHasFailedTransaction(consolidatorID, transactions, etisalatTransStatus)
{
	var failedReason = getFailedReason(getAgencyTransaction(transactions));
	if (etisalatTransStatus == E_TRANSACTION_STATUS_AUTHORIZED)
	{
		doVoid(consolidatorID, transactions);
	}
	operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_has_voided") + ", " + failedReason;
	operationErrorCode = OPERATION_STATUS_TRANSACTION_HAS_BEEN_PROCESSED;
}

function getFailedReason(transaction)
{
	var reason = transaction.getProcRespMsg();
	if (reason == null || reason == "")
	{
		return "";
	}

	if (reason.indexOf(" ") == -1) // If this is a label key, get the message from resource.
	{
		reason = aa.messageResources.getLocalMessage(reason);
	}

	return reason;
}

/**
 * Deal with transaction that not in authorized status.
 * 1. If transaction still in pending status and exceed expire day, 
 *    do void this transaction.
 * 2. If transaction hasn't expired, ignore process.
 * 3. If transaction in other status, do void this transaction. In fact this case shouldn't happen in general process.
 */
function raiseInvalidEtisalatTrans(consolidatorID, transactions, transactionStatus)
{
	if (E_TRANSACTION_STATUS_PENDING == transactionStatus)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_still_in_pending");
		operationErrorCode = OPERATION_STATUS_TRANSACTION_STILL_IN_PENDING;
		aa.log("Check failed: " + consolidatorID + " is still in pending status.");
		var agencyTransaction = getAgencyTransaction(transactions);
		// If transaction is expired, update transaction to failed in local.
		if (isTransactionExpired(agencyTransaction))
		{
			doVoid(consolidatorID, transactions);
			operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.transaction_expired");
			operationErrorCode = OPERATION_STATUS_TRANSACTION_EXPIRED;
		}
		return;
	}
	
	doVoid(consolidatorID, transactions);
}

/**
 * Check whether given CAP is valid.
 * 1. CAP should be found.
 * 2. If is pay for new, it should be partial CAP.
 */
function isValidCAP(capModel, acaModel)
{
	var actionSource = acaModel.getStrAction();
	var isPay4New = "CreatePermit" == actionSource || "RenewLicense" == actionSource || "Amendment CAP" == actionSource;
	if (capModel == null)
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_INVALID_CAP;
		aa.log("Check failed: CAP isn't exist.");
		return false;
	}
	
	if (isPay4New)
	{
		if (capModel.isCompleteCap())
		{
			aa.log("Check failed: Invalid CAP, it should be partial CAP in this proccess.");
			return false;
		}
	}
	
	return true;
}

function isTotalFeeChange(capModel, transactions, isInvoiceBalance)
{
	var totalFeeResult = aa.finance.getPaymentAmount4ACA(capModel.getCapID(), isInvoiceBalance);
	var totalFee = totalFeeResult.getOutput();
	aa.log("Current total fee is " + totalFee);
	var isFeeChange = true;
	for (var i = 0; i < transactions.length; i++)
	{
		totalFee = totalFee - transactions[i].getTotalFee();
	}
	
	aa.log("Fee balance is " + totalFee);
	
	if (totalFee == 0 || Math.abs(totalFee)<0.0000001)
	{
		isFeeChange = false;
		aa.log("Check passed: The Cap's total fee not be changed!");	
	}
	else
	{
		aa.log("Check failed: CAP's fee has been changed during this payment. We will void this transaction, please register again.");
	}
	
	return isFeeChange;
}

/**
 * 1. Get out tempalte.
 * 2. Convert asi group.
 * 3. Convert as table.
 * 4. Triger event before convert to real CAP.
 * 5. Convert to real CAP.
 * 6. Create template after convert to real CAP.
 * 7. Create amendment CAP.
 */
function convert2RealCAP(capModel, transactions)
{
	var originalCAPID = capModel.getCapID().getCustomID();
	var originalCAP = capModel;
	aa.log("Commit payment: Convert to real CAP when this action source is renew license or new CAP.");
	// 1. Get out tempalte.
	var capWithTemplateResult = aa.cap.getCapWithTemplateAttributes(capModel);
	var capWithTemplate = null;
	if (capWithTemplateResult.getSuccess())
	{
		capWithTemplate = capWithTemplateResult.getOutput();
	}
	else
	{
		aa.log("Commit payment failed: Error occurs during get template from original cap./n");
		aa.log(capWithTemplateResult.getErrorMessage());
		return null;
	}
	
	// 2. Convert asi group.
	aa.cap.convertAppSpecificInfoGroups2appSpecificInfos4ACA(capModel);
	if (capModel.getAppSpecificTableGroupModel() != null)
	{
		// 3. Convert as table.
		aa.cap.convertAppSpecTableField2Value4ACA(capModel);
	}
	// 4. Triger event before convert to real CAP.
	aa.cap.runEMSEScriptBeforeCreateRealCap(capModel, null);
	// 5. Convert to real CAP.
	convertResult = aa.cap.createRegularCapModel4ACA(capModel, null, false, false);
	if (convertResult.getSuccess())
	{
		capModel = convertResult.getOutput();
		aa.log("Commit OK: Convert partial CAP to real CAP successful: " + originalCAPID + " to " + capModel.getCapID().getCustomID());
	}
	else
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.failed");
		operationErrorCode = OPERATION_STATUS_MEET_BUSINESS_TROUBLE;
		aa.log("Commit payment failed: Error occurs during convert partial CAP to real CAP./n");
		aa.log(convertResult.getErrorMessage());
		return null;
	}
	
	// 6. Create template after convert to real CAP.
	aa.cap.createTemplateAttributes(capWithTemplate, capModel);
	
	// Triger event after convert to real CAP.
	aa.cap.runEMSEScriptAfterCreateRealCap(capModel, null);
	
	if (originalCAP.getParentCapID() != null)
	{
		// 7. Create amendment CAP.
		aa.cap.createAmendmentCap(originalCAP.getParentCapID(), capModel.getCapID(), false);
	}
	
	return capModel;
}

function makeLocalPayment(consolidatorID, transactions, capModel, acaModel)
{
	var actionSource = acaModel.getStrAction();
	var isPay4New = "CreatePermit" == actionSource || "RenewLicense" == actionSource || "Amendment CAP" == actionSource;
	// Check whether total fee has been changed after convert to real CAP but before making local payment.
	if (isTotalFeeChange(capModel, transactions, !isPay4New))
	{
		operationErrorMessage = aa.messageResources.getLocalMessage("payment.gateway.complete_payment.fee_has_changed");
		operationErrorCode = OPERATION_STATUS_FEE_CHANGED;
		return null;
	}

	var agencyTransaction = getAgencyTransaction(transactions);
	var accelaTransaction = getAgencyTransaction(transactions);
	var paymentResultModel = null;
	var capIDModel = capModel.getCapID();
	aa.log("Commit payment: Finish local payment for CAP: " + capIDModel.getCustomID());
	var paymentScriptModel = aa.finance.createPaymentScriptModel();
	paymentScriptModel.setBatchTransCode(agencyTransaction.getBatchTransCode());
	paymentScriptModel.setTranCode(agencyTransaction.getProcTransID());
	paymentScriptModel.setPaymentMethod(agencyTransaction.getProcTransType());
	paymentScriptModel.setPaymentDate(aa.date.getCurrentDate());
	paymentScriptModel.setCashierID("ACA System"); // Only indicates the payment is from ACA system.
	paymentScriptModel.setPaymentStatus("Paid");
	var actionSource = acaModel.getStrAction();
	var invoiceAmount