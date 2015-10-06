//Web service URL to connect to the WRRS web service system.
var webServiceAddress = "https://aa.achievo.com/upload.asmx";

var PROVIDER = "Economy";
//ProjectId - assigned by WRRS Administration and will be provided to the clients on request
var PROJECT_ID = 9;

//DataStoreId - the ID of the physical table in which data would be imported. The value would be provided to the clients on request.
var DATA_STORE_ID = 40;

//UserName to connect to the WRRS web service system.
var USERNAME = "economy1";

//Password for authentication purpose.
var PASSWORD = "dof123economy1";

//Switch generate CSV file on local disk or FTP server.
// true - Put the csv file into FTP server. It's fit for cluster biz server environment. 
//        If set it to true then user must have an FTP server and set values for the rest 5 FTP_xxx constant.
// false - The default value, saving CSV files on the local disk.
var UPLOAD_FILE_TO_FTP = false;

//Indication saving the CSV files on which location on the biz server local disk.
//It's only fit for the single biz server environment.
//To take it effect, the UPLOAD_FILE_TO_FTP must be false.
var LOCAL_DISK_FOLDER= "C:\\economy";

// FTP_SITE: FTP site, domain name or IP address, e.g. ftp.accela.com
var FTP_SITE = "ftpsz.achievo.com";
	
// FTP_USER_NAME: user name to login FTP
var FTP_USER_NAME = "vincent.xu";

// FTP_PASSWORD: password to login FTP
var FTP_PASSWORD = "abc123";
	
// FTP_PORT: FTP port number defaulted as 21.
var FTP_PORT = "21";
	
// FTP_FOLDER: the folder to place the upload file in ftp site
var FTP_FOLDER  = "/vincent.xu";

//From address of email.
var FROM_ADDRESS_OF_MAIL = "Auto_Sender@Accela.com";

//To address of email.
var TO_ADDRESS_OF_MAIL = "salawieh@accela.com";

//CC address of email.
var CC_ADDRESS_OF_MAIL = "";

//The subject of email.
var SUBJECT_OF_MAIL = "ACA_EMAIL_ETISALAT_PAYMENT_RECONCILIATION_UPLOAD_SUBJECT";

//The content type of email template.
var CONTENT_TYPE_OF_MAIL = "ACA_EMAIL_ETISALAT_PAYMENT_RECONCILIATION_UPLOAD_CONTENT";

var servProvCode = aa.reconciliationScript.getServiceProviderCode();
var currentDate = aa.reconciliationScript.getCurrentDate();


initialProperties();

main();

/**
* Main function for generating transaction files
**/
function main()
{
	var message = "";
	var isSuccess = false;
	
	aa.log("start to generate transaction file: ");
	var scriptSuccessResult = aa.reconciliationScript.generateApprovedTransactionFile();
	aa.log("Result of generating success transaction file: " + scriptSuccessResult.getOutput());
	
	message = scriptSuccessResult.getOutput();
	isSuccess = scriptSuccessResult.getSuccess();
	
	if (scriptSuccessResult.getSuccess())
	{
		var scriptFailedResult = aa.reconciliationScript.generateFailedTransactionFile();
		aa.log("Result of generating failed transaction file: " + scriptFailedResult.getOutput());
		message = scriptSuccessResult.getOutput() + " " + scriptFailedResult.getOutput();
		isSuccess = scriptSuccessResult.getSuccess() && scriptFailedResult.getSuccess();
	}
	
	
	if (sendMail(message) && isSuccess)
	{
		aa.env.setValue("ScriptReturnCode", "0");
		aa.env.setValue("ScriptReturnMessage", "Success to generate transaction file.");	
	}
	else
	{
		aa.env.setValue("ScriptReturnCode", "-1");
		aa.env.setValue("ScriptReturnMessage", "Fail to generate transaction file.");	
	}
}

/**
* Initial properties for generating transaction files
**/
function initialProperties()
{
	aa.reconciliationScript.setProvider(PROVIDER);

	aa.reconciliationScript.setUploadToFTP(UPLOAD_FILE_TO_FTP);
	aa.reconciliationScript.setLocalDiskFolder(LOCAL_DISK_FOLDER);
	aa.reconciliationScript.setFtpSite(FTP_SITE);
	aa.reconciliationScript.setFtpPort(FTP_PORT);
	aa.reconciliationScript.setFtpUserName(FTP_USER_NAME);
	aa.reconciliationScript.setFtpPassword(FTP_PASSWORD);
	aa.reconciliationScript.setFtpFolder(FTP_FOLDER);


	aa.reconciliationScript.setWSProjectId(PROJECT_ID);
	aa.reconciliationScript.setWSDateStoreId(DATA_STORE_ID);
	aa.reconciliationScript.setWSUserName(USERNAME);
	aa.reconciliationScript.setWSPassword(PASSWORD);
	aa.reconciliationScript.setWSEndPoint(webServiceAddress);
}

/**
*
* Send mail with attached files to adminstator
**/
function sendMail(message)
{
	if (message == null || message.equals(""))
	{
		return true;
	}
	var result;
	aa.log("Send reconciliation information to adminstrator.");

	aa.reconciliationScript.setToMailAddress(TO_ADDRESS_OF_MAIL);
	aa.reconciliationScript.setFromMailAddress(FROM_ADDRESS_OF_MAIL);
	aa.reconciliationScript.setCcMailAddress(CC_ADDRESS_OF_MAIL);
	aa.reconciliationScript.setSubject(getEmailSubject(servProvCode,SUBJECT_OF_MAIL));
	aa.reconciliationScript.setContent(getEmailContent(servProvCode,CONTENT_TYPE_OF_MAIL,message));

	result = aa.reconciliationScript.sendMail();
	if(result.getSuccess())
	{
	aa.log("Successful to send mail.");
	 return true;
	}
	else
	{
	aa.log("Fail to send mail.");
	 return false;
	}
}

/**
* Get email content for payment register successful
**/
function getEmailContent(servProvCode,mailContentType,message)
{         
	var pamaremeters = aa.util.newHashtable();
	addParameter(pamaremeters, "$$servProvCode$$", servProvCode);
	addParameter(pamaremeters, "$$Date$$", currentDate);
	addParameter(pamaremeters, "$$processResult$$", message);

	var mailcontent = aa.util.getCustomContentByType(mailContentType, pamaremeters);

	var emailContent = aa.util.newStringBuffer();
	emailContent.append("<meta http-equiv=Content-Type content=text/html; charset=UTF-8>"); 
	emailContent.append(mailcontent);

	return emailContent.toString();
}

/**
* Get email subject for payment register successful
**/
function getEmailSubject(servProvCode,mailContentType)
{
	var pamaremeters = aa.util.newHashtable();
	addParameter(pamaremeters, "$$servProvCode$$", servProvCode);
	addParameter(pamaremeters, "$$Date$$", currentDate);
	var mailsubject = aa.util.getCustomContentByType(mailContentType, pamaremeters);
	return mailsubject;
}

/**
* Add parameter to map
**/
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