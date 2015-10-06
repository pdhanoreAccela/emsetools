/*** Payment Transaction Reconciliation EMSE for Abu Dhabi.* 1. Getting successful/failed transaction list and convert to CSV files. * 2. Invoke reconciliation Web Service to upload successful transaction CSV file to WRRS.* 3. Send mail to notice adminstrator the result.* 4. Return result;**//**************** Setting constants *********************/var PROVIDER = "Economy";//ProjectId - assigned by WRRS Administration and will be provided to the clients on requestvar PROJECT_ID = 9;//DataStoreId - the ID of the physical table in which data would be imported. The value would be provided to the clients on request.var DATA_STORE_ID = 40;//UserName to connect to the WRRS web service system.var USERNAME = "economy1";//Password for authentication purpose.var PASSWORD = "dof123economy1";//WRRS web service Address.var WRRS_ENDPOINT = "https://aa.achievo.com/upload.asmx";//The transactions that how may days will be reconciliated.var CHECKING_INTERVAL_DAYS = aa.env.getValue("CheckIntervalDays");//The date for fail to run reconciliation job.var FAILED_JOB_DATE = aa.env.getValue("FailedJobDate");//From address of email.var FROM_ADDRESS_OF_MAIL = "Auto_Sender@Accela.com";//To address of email.var TO_ADDRESS_OF_MAIL = "david.wang@achievo.com";//CC address of email.var CC_ADDRESS_OF_MAIL = "david.wang@achievo.com";//The subject of email.var SUBJECT_OF_MAIL = "ACA_EMAIL_ETISALAT_PAYMENT_RECONCILIATION_UPLOAD_SUBJECT";//The content type of email template.var CONTENT_TYPE_OF_MAIL = "ACA_EMAIL_ETISALAT_PAYMENT_RECONCILIATION_UPLOAD_CONTENT";//Below is exporting fields for successful transactions, begin.//All fileds Title - Define column titles for reconciliation CSV file. Using ',' character to seperate each column name .var EXPORT_SUCCESS_CSV_FILE_TITLE = new Array("DepartmentID","ConsolidatorID","TransactionID","AuthorizationCode","TransactionDate","Amount","Currency","OrderID","OrderName");//All fileds Name - Define which columns will export into reconciliation CSV file. Using ',' character to seperate each column name .var EXPORT_SUCCESS_CSV_FILE_MAPPING_MODEL_FIELDS = new Array("departmentId","procTransID","gateWayTransactionID","authCode","auditDate","totalFee","currency","batchTransCode","batchTransCode");//All fileds default value - Define field values,if getting field value from mapping model by file name is null,//then use default value to export.Using ',' character to seperate each column name .var EXPORT_SUCCESS_CSV_FILE_VALUE = new Array("11111","","","","","","AED","","");//Below is exporting fields for successful transactions, end.//Below is exporting fields for failed transactions, begin.//All fileds Title - Define column titles for reconciliation CSV file. Using ',' character to seperate each column name .var EXPORT_FAILED_CSV_FILE_TITLE = new Array("DepartmentID","ConsolidatorID","TransactionID","AuthorizationCode","TransactionDate","Amount","Currency","OrderID","OrderName","ResponseMessage");//All fileds Name - Define which columns will export into reconciliation CSV file. Using ',' character to seperate each column name .var EXPORT_FAILED_CSV_FILE_MAPPING_MODEL_FIELDS = new Array("departmentId","procTransID","gateWayTransactionID","authCode","auditDate","totalFee","currency","batchTransCode","batchTransCode","procRespMsg");//All fileds default value - Define field values,if getting field value from mapping model by file name is null,//then use default value to export.Using ',' character to seperate each column name .var EXPORT_FAILED_CSV_FILE_VALUE = new Array("11111","","","","","","AED","","","");//Below is exporting fields for failed transactions, end./**************** Initial Variables *********************/aa.reconciliationScript.setCheckInternalDays(CHECKING_INTERVAL_DAYS);aa.reconciliationScript.setJobDate(FAILED_JOB_DATE);//Setting export format for successful transaction list.aa.reconciliationScript.setSuccessfulFileFieldTitles(EXPORT_SUCCESS_CSV_FILE_TITLE);aa.reconciliationScript.setSuccessfulFileFieldNames(EXPORT_SUCCESS_CSV_FILE_MAPPING_MODEL_FIELDS);aa.reconciliationScript.setSuccessfulFileFieldValues(EXPORT_SUCCESS_CSV_FILE_VALUE);//Setting export format for failed transaction list.aa.reconciliationScript.setFailedFileFieldTitles(EXPORT_FAILED_CSV_FILE_TITLE);aa.reconciliationScript.setFailedFileFieldNames(EXPORT_FAILED_CSV_FILE_MAPPING_MODEL_FIELDS);aa.reconciliationScript.setFailedFileFieldValues(EXPORT_FAILED_CSV_FILE_VALUE);//Getting WRRS webservice client instance.var uploadLocator=aa.proxyInvoker.newInstance("com.accela.epayment.wsclient.ReconciliationClientImpl").getOutput();var successfulFileName = aa.reconciliationScript.getSuccessfulFileName();var servProvCode = aa.reconciliationScript.getServiceProviderCode();var startDate = aa.reconciliationScript.getStartDate();var endDate = aa.reconciliationScript.getEndDate();var reconciliationDate = aa.reconciliationScript.getJobDate();/**************** Execute Reconciliation *********************//*** ESME entrance**/if(main()){	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Success to execute reconciliation.");}else{	aa.env.setValue("ScriptReturnCode", "-1");	aa.env.setValue("ScriptReturnMessage", "Fail to execute reconciliation.");}/*** Main function **/function main(){	aa.log("Start to execute online payment reconciliation.");		//Getting success transaction list.	var successTransModels = getTransactionModelList("Approved");		//Getting failed transaction list.	var failedTransModels = getTransactionModelList("Failed");		//execute upload file to WRRS for reconciliation.	var message = doReconciliaton(successTransModels);		//Send reconciliation result to system adminstrator.	return sendMail(successTransModels,failedTransModels,message);}/*** 1. Getting successful and failed transaction list.* 2. Sum all fees for transaction models.**/function getTransactionModelList(status){    //Getting successfultransaction list.    aa.log("Getting successful transaction list");	var transactionModel = aa.finance.createTransactionScriptModel();	transactionModel.setProvider(PROVIDER);	transactionModel.setStartDate(startDate);	transactionModel.setEndDate(endDate);		transactionModel.setStatus(status);	var transactionModelList = aa.finance.getETransaction(transactionModel,null);		//Sum all fees for transaction models.	if(transactionModelList!=null&&transactionModelList.getSuccess())	{	   transactionModelList = aa.reconciliationScript.sumTransactionsTotalFees(transactionModelList.getOutput());	}	return transactionModelList;}/*** Call Web Service and upload successful transactions.**/function doReconciliaton(successTransModels){    //If fail to get successful transaction list or getting empty list, then return;    if(successTransModels==null)    {       aa.log("Don't upload file: Successful transactions list is empty.");       return "Don't upload file: Successful transactions list is empty.";    }    if(!successTransModels.getSuccess()||successTransModels.getOutput().size()==0)    {	       aa.log("Don't upload file: " + successTransModels.getErrorMessage());	       return "Don't upload file: " + successTransModels.getErrorMessage();    }        //If fail to generate CSV stream,then return;    var binaryStream = aa.reconciliationScript.getCSVBinary(successTransModels.getOutput());    if(!binaryStream.getSuccess())    {       aa.log("Fail to generate CSV.");       return "Fail to generate CSV.";    }        aa.log("Call WRRS Web service to upload successful transactions.");	uploadLocator.setWebServiceEndPoint(WRRS_ENDPOINT);	var uploadStatus = uploadLocator.saveFile(PROJECT_ID, DATA_STORE_ID, USERNAME, PASSWORD,successfulFileName, binaryStream.getOutput());    //If file is already uploaded,delete it in first.//  if(""==uploadStatus)//  {//     aa.log("File has been already uploaded,delete file:" + successfulFileName);//     uploadStatus = uploadLocator.deleteFile(successfulFileName,USERNAME,PASSWORD);//     if(""==uploadStatus)//     {//          aa.log("Reload file again after delete file.");//			    uploadStatus = uploadLocator.saveFile(PROJECT_ID, DATA_STORE_ID, USERNAME, PASSWORD,successfulFileName, binaryStream.getOutput());//     }//   }	 aa.log("Upload transactions CSV result:" + uploadStatus);	 return uploadStatus;}/**** Send mail with attached files to adminstator**/function sendMail(successTransModels,failedTransModels,message){   var result;   aa.log("Send reconciliation information to adminstrator.");   if(message!=null)   {      message = "Upload file result: " + message;   }   else   {      message = "There is no any transactions file to be uploaded.";   }   var content = getEmailContent(servProvCode,CONTENT_TYPE_OF_MAIL,message);   var subject = getEmailSubject(servProvCode,SUBJECT_OF_MAIL);   var successfulfile = null;   if(successTransModels!=null)   {     successfulfile = successTransModels.getOutput();   }      var failedfile = null;   if(failedTransModels!=null)   {     failedfile = failedTransModels.getOutput();   }      result = aa.reconciliationScript.sendMailwithAttachedFiles(			                  FROM_ADDRESS_OF_MAIL,			                  TO_ADDRESS_OF_MAIL,			                  CC_ADDRESS_OF_MAIL,			                  subject,			                  content,						      successfulfile,						      failedfile);   if(result.getSuccess())   {     aa.log("Successful to send mail.");	 return true;   }   else   {     aa.log("Fail to send mail.");	 return false;   }}//get email content for payment register successful,function getEmailContent(servProvCode,mailContentType,message){              var pamaremeters = aa.util.newHashtable();     addParameter(pamaremeters, "$$servProvCode$$", servProvCode);     addParameter(pamaremeters, "$$Date: 2009-01-15 13:54:46 +0800 (Thu, 15 Jan 2009) $$", reconciliationDate);     addParameter(pamaremeters, "$$FileName$$", successfulFileName);     addParameter(pamaremeters, "$$WRRS_URL$$", WRRS_ENDPOINT);     addParameter(pamaremeters, "$$processResult$$", message);          var mailcontent = aa.util.getCustomContentByType(mailContentType, pamaremeters);          var emailContent = aa.util.newStringBuffer();     emailContent.append("<meta http-equiv=Content-Type content=text/html; charset=UTF-8>");      emailContent.append(mailcontent);          return emailContent.toString();}function getEmailSubject(servProvCode,mailContentType){     var pamaremeters = aa.util.newHashtable();     addParameter(pamaremeters, "$$servProvCode$$", servProvCode);     addParameter(pamaremeters, "$$Date: 2009-01-15 13:54:46 +0800 (Thu, 15 Jan 2009) $$", reconciliationDate);     var mailsubject = aa.util.getCustomContentByType(mailContentType, pamaremeters);     return mailsubject;}//add parameter to map.function addParameter(pamaremeters, key, value){     if(key != null)     {         if(value == null)         {             value = '';         }                            pamaremeters.put(key, value);     }}