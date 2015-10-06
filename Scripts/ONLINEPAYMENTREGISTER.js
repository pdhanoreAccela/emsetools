/**
	 * payment register.
	 * 
	 * @param capID     
	 * @param userSeqNum     
	 * @param actionSource		--PayFeeDue, RenewLicense, CreatePermit, Amendment CAP
	 * @param notificationURL	--uesd for back up.
	 
	 * @return ErrorCode, ErrorMessage, paidURL
*/
var errorMessage = ''; 
var reverseMessage = ''; 
var errorCode = '0';
var registerDate = null;
var expiry = '';

//------------parameter----start------------------------

var capID = aa.env.getValue('capID');
var userSeqNum = aa.env.getValue('userSeqNum');

var actionSource = aa.env.getValue('actionSource');	//PayFeeDue, RenewLicense, CreatePermit, Amendment CAP
var notificationURL = aa.env.getValue('notificationURL');
//------payment--register--start--------------------------------------------

//-----------------------------------1.  defind -varables--------------------------------------

//1.1  initialization varable
var isInvoiceBalance = false;	//the variable is true if and only if it used for pay fee due.
var currentDate = aa.util.now();
var dateFormat = 'yyyy-MM-dd HH:mm:ss';
var strDate = aa.util.formatDate(currentDate, dateFormat);

var transactionID = 0;  //be used as orderID.
var successfulStatus = '0'; //successful status code.

var expiration = getExpirationDay();  //expiration day.

var voidStatus = 'Voided';
var pendingStatus = 'Pending';

var isDuplicateRegister = false;   //if aleardy rigiser, and the cap's amount couldn't be change, the value should be false.

//1.2  for acounts XML.
var payAccelaRatio = 0.02;
var totalFee =0;		//total amount.
var accelaFee = 0;
var agencyFee = 0;

var accelaAccountID = '000000000000000';
var agencyAccountID = '000000000000000';

var accelaGLAccount = '01013';
var accelaGLBankAccount = '0101202021111201';

var agencyGLAccount = '01013';
var agencyGLBankAccount = '0101202021111201';

//1.3  for data XML.
var customer ='Economy';
var dept ='21101';

//1.4   for send email.
var publicUser = null;		//will be used to store user into for Email.
var mailTO = ''; 			//publicUser.geteMail();
var mailFROM = 'noreply@adeconomy.ae';
var mailCC = '';
var mailContentType = 'ACA_EMAIL_ETISALAT_PAYMENT_REGISTRATION_SUCCEEDED_CONTENT';
var mailSubjectType = 'ACA_EMAIL_ETISALAT_PAYMENT_REGISTRATION_SUCCEEDED_SUBJECT';

//1.5 for bakc up URL and 3rd web service URL.
var paidURL = 'https://aa.achievo.com/?CONID=';
var localSiteURL = 'https://aa.achievo.com/xinter-peng/ACA67iLocal/Payment/GoToPayment.aspx?url=';
var webServiceAddress = 'https://aa.achievo.com/service.asmx';

//------------------------------------------------------------------     register     start     ------------------------------------------------------------
//2. get total amount for each account. 
totalFee = getPaymentAmount4ACA(capID,isInvoiceBalance);
aa.log('Message: total fee: '+totalFee);
accelaFee = aa.util.doubleFormat(totalFee * payAccelaRatio);
agencyFee = totalFee-accelaFee;

var previousTransactionArray = getTransactionByCapID(capID, pendingStatus);

//3 Judge whether the Cap have been registered.
if(haveRegister(previousTransactionArray))
{
	//3.1 the total fee  has changed, should reverse these transactions and re-register for the current Cap.
	if(hasChangedFee(previousTransactionArray, totalFee))
	{
		reversePreviousTransaction(previousTransactionArray);
	}
	else
	{
		//3.2 the Cap has been registered, but the total fee  not yet be changed, should check whether have paid complete in 3rd part site.
		checkAndDealTransactionByStatus(previousTransactionArray);
	}
}

//4. Judge whether need to register for the current Cap, avoid duplicate register for one Cap.
if(!isDuplicateRegister)
{
	aa.log("Message: the Cap must be registered for paymant online !");	
	//4.1 Prepare transaction info.
	var transactionArray = prepareTransaction4ACA(capID, isInvoiceBalance);
	
	//4.2 register by web service.
	var registerResultXML = doRegister(totalFee, currentDate, agencyAccountID, agencyFee, agencyGLAccount, agencyGLBankAccount,accelaAccountID, accelaFee, accelaGLAccount, accelaGLBankAccount,dept, currentDate, customer);	
	
	//4.3 get the consolidator ID from the response data.
	var consolidatorID = getConsolidatorID(registerResultXML);
	
	//4.4 if register is successful, send email and create transactions.
	if(consolidatorID != null && consolidatorID !='')
	{
		sendEmailAndCreateTransactions(consolidatorID, transactionArray);
	}
	else
	{
		logError('ERROR: Payment register by WS is failed');
	}
}

//5. deal for register result and return this result to ACA page.
end();

//----------------------------------------------------  register   end      ---------------------------------------------
//send email and create transactions
function sendEmailAndCreateTransactions(consolidatorID,transactionArray)
{
	aa.log("Message: register successful, should send an email to notice user, and crate transactions !");	

	//send emial.
	paidURL = paidURL+consolidatorID;

	var emaiSendResult = getUserInfoAndSendEmail(userSeqNum, paidURL, consolidatorID)

	if(emaiSendResult)
	{
		//create transactions.
		createTransactions(transactionArray, consolidatorID, customer, actionSource ,accelaFee, agencyFee, "Credit Card");
		
		logSuccessFul();
	}
	else
	{
		logError('ERROR: Send notice email is failed');
	}
}

//check transaction status.
function checkAndDealTransactionByStatus(previousTransactionArray)
{
	consolidatorID = previousTransactionArray[0].getProcTransID();
	paidURL = paidURL+consolidatorID;	

	//the Cap has been registered, and aleardy paid for it.
	if(hasPaid(consolidatorID))
	{
		aa.log('WARNING: You have paid for the current Cap!');	
		errorCode = '3';			
		isDuplicateRegister = true;
	}
	else
	{
		//the Cap has been registered, but you need paid for it.	
		registerDate = previousTransactionArray[0].getAuditDate();

		errorCode = '1';
		logSuccessFul();

		aa.log('WARNING: the Cap is unnecessary to register again,you can paid now!');		
		isDuplicateRegister = true;
	}
}

//reverse previous transaction..
function reversePreviousTransaction(previousTransactionArray)
{
	//void the already exist transaction, and crate new transactions later.
	aa.log("Message: The Cap's total fee has been changed ,we need to reverse these transactions!");

	//1. do reverse transaction on thirdparty DB.		
	var oldConsolidatorID = previousTransactionArray[0].getProcTransID();		
	//if user have  paided complete in Etisalat, need to reverse transactions for both Etisalat and local DB.
	if(hasPaid(oldConsolidatorID))
	{
		aa.log('Message: you hvae paid complete for previous transacton,but not to complete your transaction!');
		var reverseResult = reverseEtisalatTransaction(oldConsolidatorID, webServiceAddress);

		//if reverse Transactions for Etisalat and local DB are successful,  continue to re-register, else throw Exception.
		if(dealReverseResult(reverseResult) && voidTransactions(previousTransactionArray, voidStatus))
		{
			aa.log('Message: reverse transactions for Etisalat and local DB are successful!');
		}
		else
		{
			aa.log('Error: reverse transactions for Etisalat or local DB is failed!');
			isDuplicateRegister = true;
		}
	}
	//need to reverse local DB only.
	else
	{
		aa.log('Message: you not yet paid for previous transaction,need reverse transaction in local DB only.');
		if(!voidTransactions(previousTransactionArray, 'Failed'))
		{
			aa.log('Error: reverse transactions for local DB is failed!');
			isDuplicateRegister = true;
		}
	}
}

//judge wether register.
function haveRegister(previousTransactionArray)
{
	if(previousTransactionArray != null && previousTransactionArray.length >0)
	{
		return true;
	}

	return false;
}

//deal response info, if register faild, should change varable of isSuccessful as false.
function dealReverseResult(reverseResponse)
{
	aa.log('Message: Reverse reponse:'+reverseResponse);
	var reverseResult = true;
	if(reverseResponse != null && reverseResponse != '')
	{
		var statusCode = aa.util.getValueFromXML("Status", reverseResponse);
		var resultMessage = aa.util.getValueFromXML("StatusDescription", reverseResponse);
		
		if(successfulStatus == statusCode)
		{
			//'Your transaction has been reversed on Etisalat,Since the total fee has been changed.<BR>';
			aa.log('Message: reverse Transaction is successful in thirdparty site');

			reverseMessage = aa.messageResources.getLocalMessage('aca_payment_reverse_transaction_notice')+ '<BR>';
		}
		else
		{
			reverseResult = false;
			logError('ERROR: reverse Etisalat Transaction is failed');
		}
	}
	else
	{				
		reverseResult = false;
		logError('ERROR: Meet Exception during reverse Etisalat Transaction');
	}
	
	return reverseResult;
}

function getConsolidatorID(registerResultXML)
{
	if(registerResultXML == null || registerResultXML =='')
	{
		return null;
		logError('ERROR: Register result is failed');
	}
	//get and judge register result.
	var registerStatus = getValueFromXML('Status', registerResultXML);
	//gatewayTransactionStatus = aa.util.getValueFromXML("StatusDescription", registerResultXML);
	//register faild.
	if(registerStatus != successfulStatus)
	{
		aa.log("Warning: register faild, should be exit !");	
			
		//logError(gatewayTransactionStatus);		
		return null;
	}
	
	return getValueFromXML('ConsolidatorID', registerResultXML);;
}

//do register.
function doRegister(totalFee, currentDate, agencyAccountID, agencyFee, agencyGLAccount, agencyGLBankAccount,accelaAccountID, accelaFee, accelaGLAccount, accelaGLBankAccount,dept, currentDate, customer)
{
	if(transactionArray != null && transactionArray.length >0)
	{
		transactionID = transactionArray[0].getBatchTransCode();
	}

	//----------------------------1. invoke ws to register.------------------------------

	//1.1 generate XML for agency account.
	//--AccountID, Amount , GLAccount, GLBankAccount
	var agencyAccountXML = getAccountXML(agencyAccountID, agencyFee, agencyGLAccount, agencyGLBankAccount);

	//1.2 generate XML for accela account.
	var accelaAccountXML = "";
	if(accelaFee != 0)
	{
		accelaAccountXML = getAccountXML(accelaAccountID, accelaFee, accelaGLAccount, accelaGLBankAccount);
	}

	//1.3 generate data XML,  A mandatory block of data (set of properties) which a department would like to store in Consolidator for reference/reconciliation purposes. 
	//--dept, TransDate, Customer
	var dataXML = getDataXML(dept, strDate, customer);

	//1.4 generate whole register XML.
	var registerXML = getRegisterXML(totalFee, currentDate, transactionID, agencyAccountXML, accelaAccountXML, dataXML);
	
	//4.5 invoke WS to payment register.
	var service = getWebServiceInstance(webServiceAddress);
	var registerResultXML = null;
	if(service == null)
	{
		return null;
	}
	else
	{
		registerResultXML =  service.register(registerXML);
		aa.log('registerXML:'+registerXML);
	}
		
	return registerResultXML;
}

//reverse transaction on Etisalat site.
function reverseEtisalatTransaction(consolidatorID, webServiceAddress)
{
	aa.log('Message: reverse Etisalat transaction by consolidator ID:'+consolidatorID);
	
	var service = getWebServiceInstance(webServiceAddress);
	var reverseResult = null;
	
	if (service == null)
	{
		logError('Exception: Create Web Service client Instance is failing!');
		return service;
	}
	
	var reverseReqestXML = 
	'<ReverseTransaction>'+
		'<Customer>' + customer + '</Customer>'+
		'<ConsolidatorID>' + consolidatorID + '</ConsolidatorID>'+
	'</ReverseTransaction>';
	
	var reverseResult = service.reverseTransaction(reverseReqestXML);

	return reverseResult;
}

//get web service instance.
function getWebServiceInstance(webServiceAddress)
{
	var s_result = aa.proxyInvoker.newInstance('com.accela.epayment.wsclient.PaymentClientImpl');
	
	if(s_result.getSuccess())
	{
		service = s_result.getOutput();
		service.setWebServiceEndPoint(webServiceAddress);

		return service;
	}else
	{
		logError('Exception: Create Web Service client Instance is failing!');
		service = null;
	}
	
	return service;
}

function getUserInfoAndSendEmail(userSeqNum, paidURL, consolidatorID)
{
	//-----------------------------------1.  get public user.--------------------------
	publicUser = getPublicUser(userSeqNum);
	mailTO = publicUser.getEmail();
	aa.log('Message: Notice email will be sended to ' +mailTO);

	//----------------------------------2 send email.-------------------------------------
	return sendEmail(publicUser, mailTO, mailFROM, mailCC, mailContentType, mailSubjectType,  capID, paidURL);	
}

//create transaction
function createTransactions(transactionArray, consolidatorID, customer, actionSource ,accelaFee, agencyFee, processType)
{
	if(transactionArray != null && transactionArray.length >0)
	{
		var amount = 0;
		for(var i=0; i<transactionArray.length; i++)
		{
			amount = (i == 1 ? accelaFee:agencyFee)
			
			var result = createETransaction(transactionArray[i], consolidatorID, customer, actionSource, amount, i+1, processType);
			
			//if create transaction is failded, should to rollback.
			if(!result)
			{
				logError('Exception: create transactions are failed!');
				aa.env.setValue('ScriptReturnCode', '-1');
			}
		}
	}
}

//get value from XML string by tag.
function getValueFromXML(tag, registerResultXML)
{
	return aa.util.getValueFromXML(tag, registerResultXML);
}

//get expiration day.
function getExpirationDay()
{
	var s_result = aa.bizDomain.getBizDomainByValue('ACA_ONLINE_PAYMENT_WEBSERVICE','EXPIRATION_DAYS');
	
	var expirationDay = null;
	if(s_result.getSuccess())
	{
	  var bizDomainModel = s_result.getOutput();
	  
	  if(bizDomainModel == null)
	  {
		aa.log('WARNING: the expirationDay is No set-up, It will be set as 3 day!');
		expirationDay = '3';  
	  }
	  else if(bizDomainModel.getDescription() !=null && bizDomainModel.getDescription() !='')
	  {
		expirationDay = bizDomainModel.getDescription();
	  }
	}
	else
	{
	  aa.log('ERROR: Failed to get expiration Day setting, It will be set as 3 day!: ' + s_result.getErrorMessage());
	  expirationDay = '3';   
	}
	
	aa.log('Message: the expiration day is :'+expirationDay);
	return expirationDay;
}

//create Transaction 
function createETransaction(transactionModel,consolidatorID, customer, actionSource, amount, accountSequenctNumber, processType)
{
	transactionModel.setProcTransID(consolidatorID);
	transactionModel.setProvider(customer);
	transactionModel.setActionSource(actionSource);
	transactionModel.setAccountNumber(accountSequenctNumber);
	transactionModel.setAuditDate(currentDate);
	transactionModel.setTotalFee(amount);
	transactionModel.setStatus('Pending');
	transactionModel.setProcTransType(processType);
	
	var gatewayTransactionStatus = getEtisalatStransStatus(consolidatorID);
	transactionModel.setGatewayTransTtatus(gatewayTransactionStatus);
	
	var s_result = aa.finance.createETransaction(transactionModel);
	if(s_result.getSuccess())
	{
		return true;
	}
	
	return false;
}

//get transaction model array, in order to get transaction id < order id > to be used for payment register.
function prepareTransaction4ACA(capID, isInvoiceBalance)
{
	var s_result = aa.finance.prepareTransaction4ACA(capID,isInvoiceBalance);
	var transactionArray = null;
	if(s_result.getSuccess())
	{
	  var onlinePaymentWrapper = s_result.getOutput();
	  transactionArray = onlinePaymentWrapper.getTransactions();
	  if(transactionArray == null || transactionArray.length ==0)
	  {
		logError('WARNING: the transactionArray is empty!');
	  }
	}
	else
	{
	  logError('ERROR: Failed to OnlinePaymentModelWrapper: ' + s_result.getErrorMessage());
	  transactionArray = null;   
	}
		
	return transactionArray;
}

//create XML, the XML would be used for payment register parameter.
function getRegisterXML(totalFee, currentDate, transactionID, agencyAccountXML, accelaAccountXML, dataXML)
{
	var accountsXML = new Array();
	
	//1. get agency account.
	accountsXML[0] = agencyAccountXML;
	//1.1  get accela account.
	accountsXML[1] = accelaAccountXML;
	
	//2. get generate data XML.
	var dataXML = dataXML;
	
	//generate XML.
	//1. customer, 2. ExternalReference, 3. totalAmount, 4. currency, 5 expiration day, 6. TransactionHint ,  
	//7.transactionID,  8. orderName, 9. notificationURL, 10. AccountsXMLs,  11. dataXML
	var totalFeeStr = aa.util.numberFormat(totalFee);
	
	notificationURL = notificationURL + "%7cbatchTransID%7c" + transactionID;
	
	var s_result = aa.finance.getEtisalatRegisterModel(customer, '1002726', totalFeeStr,'AED', expiration, 'CPT:N', transactionID, transactionID, currentDate, notificationURL, accountsXML, dataXML);
			
	var registerModel = null;
	if(s_result.getSuccess())
	{
	  registerModel = s_result.getOutput();
	  expiry = registerModel.getExpiry();
	  
	  return registerModel.toXMLString();
	  
	}
	else
	{
	  logError('ERROR: Failed to register XML: ' + s_result.getErrorMessage()); 
	}
	
	return null;
}

//create XML for accounts, and return as a String.
function getAccountXML(accountID, amount, GLAccount, GLBankAccount)
{
	var amountStr = aa.util.formatFee(amount);
	var xmlString = 
	'<Account>'+
		'<AccountID>'+accountID+'</AccountID>'+
		'<Amount>'+amountStr+'</Amount>'+
		'<Data>'+
			'<GLAccount>'+GLAccount+'</GLAccount>'+
			'<GLBankAccount>'+GLBankAccount+'</GLBankAccount>'+
		'</Data>'+
	'</Account>';	
	
	return xmlString;
}

//create XML for data section, and return as a String.
function getDataXML(dept, strDate, customer)
{
	var xmlString = 
	'<Data>'+
		'<dept>'+dept+'</dept>'+
		'<TransDate>'+strDate+'</TransDate>'+
		'<Customer>'+customer+'</Customer>'+
	'</Data>';
	
	return xmlString;
}

// Status		Status Description
//  0			Pending
//  1			Authorized and Captured
//  3			Authorized
//  4			Reversed
function hasPaid(consolidatorID)
{
	var queryResultXML = enquireTransactionStatus(consolidatorID);
	if(queryResultXML != null && queryResultXML!="")
	{
		var transactionStatus = aa.util.getValueFromXML('Status' ,queryResultXML);
		
		errorMessage = aa.util.getValueFromXML('StatusDescription' ,queryResultXML);		

		if(transactionStatus == '3')
		{
			return true;
		}
		else
		{
			return false;
		}	
	}else
	{
		logError('ERROR: Failed to check the status of transaction');
	}
	
	return false;
}

/**
* Enquire transaction status
* Status    StatusDescription
*   0       Pending
*   1       Authorized and Captured
*   3       Authorized
*   4       Reversed
*/
function enquireTransactionStatus(consolidatorID)
{
   var queryResultXML = "";
   var service = getWebServiceInstance(webServiceAddress);
   if(service != null)
	{
		var enquireXML = 
		'<Enquire>'+
			'<Customer>'+customer+'</Customer>'+
			'<ConsolidatorID>'+consolidatorID+'</ConsolidatorID>'+
		'</Enquire>';
		
		queryResultXML =  service.enquire(enquireXML);
	}
	else
	{
	  logError('Enquire transaction error, the consolidatorID is:'+consolidatorID);
	}
	
	return queryResultXML;
}

/*
* Get Etisalat Stransaction Status string
*/
function getEtisalatStransStatus(consolidatorID)
{
   var queryResultXML = enquireTransactionStatus(consolidatorID)
   if(queryResultXML != null && queryResultXML!="")
	 {
		  return aa.util.getValueFromXML('StatusDescription' ,queryResultXML);
	 }
	 else
	 {
	    return "Failed";
	 }   
}


//get user info , the info will be used for email,
function getPublicUser(userSeqNum)
{
	var s_result = aa.publicUser.getPublicUser(userSeqNum);
	var publicUser = null;
	if(s_result.getSuccess())
	{
	  publicUser = s_result.getOutput();
	  if (publicUser == null)
	  {
		 logError('ERROR: no User on this userSeqNum:' + userSeqNum);
		 publicUser = null;
	  }
	}
	else
	{
	  logError('ERROR: Failed to User: ' + s_result.getErrorMessage());
	  publicUser = null;   
	}
	
	return publicUser;
}

//get email subject for payment register successful,
function getEmailSubject(publicUser, capID, mailSubjectType, paidURL)
{
	var pamaremeters = aa.util.newHashtable();		
	var mailSubject = aa.util.getCustomContentByType(mailSubjectType, pamaremeters);
	
	if(mailSubject == null)
	{
		mailSubject = '';
	}
	
	return mailSubject;
}

//get email content for payment register successful,
function getEmailContent(publicUser,capID, mailContentType, paidURL)
{
	var servProvCode = capID.getServiceProviderCode();
	
	var pamaremeters = aa.util.newHashtable();	

	addParameter(pamaremeters, "$$servProvCode$$", servProvCode);
	addParameter(pamaremeters, "$$firstName$$", publicUser.getFirstName());
	addParameter(pamaremeters, "$$lastName$$", publicUser.getLastName());
	addParameter(pamaremeters, "$$capType$$", getCapTypeName(capID));
	
	addParameter(pamaremeters, "$$mmddyy$$", expiry);
	
	var URL4mail = localSiteURL+paidURL;
	addParameter(pamaremeters, "$$URL$$", URL4mail);
	addParameter(pamaremeters, "$$capID$$", capID.getCustomID());
	addParameter(pamaremeters, "$$totalFee$$", aa.util.numberFormat(totalFee));
	
	var emailContent = aa.util.newStringBuffer();
	emailContent.append("<meta http-equiv=Content-Type content=text/html; charset=UTF-8>");
		
	var mailcontent = aa.util.getCustomContentByType(mailContentType, pamaremeters);
	emailContent.append(mailcontent);
	
	return emailContent.toString();
}

//get Cap type by cap id model.
function getCapTypeName(capID)
{
	var s_result = aa.cap.getCapTypeModelByCapID(capID);
	var capTypeModel = null;
	if(s_result.getSuccess())
	{
	  capTypeModel = s_result.getOutput();
	  
	  return capTypeModel.getAlias();
	}
	
	return '';
}

//add parameter to map.
function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = '';
		}
		
		pamaremeters.put(key, value);
	}
}

//get total amount for current Cap.
function getPaymentAmount4ACA(capID,isInvoiceBalance)
{
	////deal  specific for pay fee due.
	if(actionSource == 'PayFeeDue')
	{
		isInvoiceBalance = true;
	}
	
	var s_result = aa.finance.getPaymentAmount4ACA(capID,isInvoiceBalance);
	var totalAmount = null;
	if(s_result.getSuccess())
	{
	  totalAmount = s_result.getOutput();
	 	  
	  return totalAmount;
	}
	else
	{
	  logError('ERROR: Failed to get total amount: ' + s_result.getErrorMessage());
	}
	
	return 0;
}

//send email for payment register successful,
function sendEmail(publicUser, mailTO, mailFROM, mailCC, mailContentType, mailSubjectType, capID, paidURL)
{
	var mailcontent = getEmailContent(publicUser,capID, mailContentType, paidURL);
	var mailsuject = getEmailSubject(publicUser, capID, mailSubjectType , paidURL);
	
	var s_result = aa.sendMail(mailFROM, mailTO, mailCC, mailsuject, mailcontent);
	if(!s_result.getSuccess())
	{
		aa.log('Message: notice eamil send faild!');
		return false;
	}
	
	return true;
	aa.log('Message: notice eamil send successful!');
}

//get all transactions by Cap id.
function getTransactionByCapID(capID, pendingStatus)
{
	var transSearchModel = aa.finance.createTransactionScriptModel();
	transSearchModel.setServiceProviderCode(capID.getServiceProviderCode());
	transSearchModel.setEntityID(capID.toString());
	transSearchModel.setAuditStatus("A");
	transSearchModel.setStatus(pendingStatus);
	var s_result = aa.finance.getETransaction(transSearchModel, null);
	
	if(s_result.getSuccess())
	{
		var transactions = s_result.getOutput();
		if (transactions == null || transactions.length == 0)
		{

			return null;
		}
		else
		{
			aa.log('Message: the Cap has registered for payment online!');
			return transactions	
		}
	}
	else
	{
	  logError('ERROR: Failed to get transactions by Cap ID: ' + s_result.getErrorMessage());
	  transactions = null;   
	}
	
	return null;	
}

//judge the total amount of the Cap if has changed.
function hasChangedFee(transactionArray, totalFee)
{
	var hasChangedFee = true;
	var oldFee =0;
	for(var i=0; i<transactionArray.length; i++)
	{
		var transactionModel = transactionArray[i];
		oldFee = transactionModel.getTotalFee();
		
		totalFee = totalFee - oldFee;
	}
	
	if(totalFee == 0)
	{
		hasChangedFee = false;
		aa.log("Message: The Cap's total fee could not be changed yet !");	
	}
	
	return hasChangedFee;
}

//void old transactions.
function voidTransactions(transactions, voidStatus)
{
	aa.log('Message: Void Transactions for local DB.');
	for(var i=0; i<transactions.length; i++)
	{
		var transactionModel = transactions[i];
		transactionModel.setStatus(voidStatus);
		reverseMessage = aa.messageResources.getLocalMessage('aca_payment_reverse_t