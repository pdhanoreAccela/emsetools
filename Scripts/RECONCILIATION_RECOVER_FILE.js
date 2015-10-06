//Web service URL to connect to the WRRS web service system.
var webServiceAddress = "https://aa.achievo.com/upload.asmx";

//recoverFileName - the file name to be recovered tranaction file
var recoverFileName = aa.env.getValue("FileName");

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

initialProperties();

main();

/**
* Main function for recovering transaction file
**/
function main()
{
	aa.log("start to recover transaction file: " + recoverFileName);

	var scriptResult = aa.reconciliationScript.recoverTransactionFile(recoverFileName);

	aa.log("Result of recovering transaction file: " + scriptResult.getOutput());

	if (scriptResult.getSuccess())
	{
		aa.env.setValue("ScriptReturnCode", "0");
		aa.env.setValue("ScriptReturnMessage", "Success to recover transaction file.");	
	}
	else
	{
		aa.env.setValue("ScriptReturnCode", "-1");
		aa.env.setValue("ScriptReturnMessage", "Fail to recover transaction file.");	
	}
}

/**
* Initial properties for recovering transaction file
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