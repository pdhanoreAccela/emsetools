//Web service URL to connect to the WRRS web service system.
var webServiceAddress = "https://aa.achievo.com/upload.asmx";

//recoverFileName - the file name to be updated
var fileName = aa.env.getValue("FileName");

var PROVIDER = "Economy";

//UserName to connect to the WRRS web service system.
var USERNAME = "economy1";

//Password for authentication purpose.
var PASSWORD = "dof123economy1";



aa.reconciliationScript.setProvider(PROVIDER);
aa.reconciliationScript.setWSUserName(USERNAME);
aa.reconciliationScript.setWSPassword(PASSWORD);
aa.reconciliationScript.setWSEndPoint(webServiceAddress);

aa.log("start to update upload status: " + fileName );
var result  = aa.reconciliationScript.updateUploadStatusLog(fileName);
aa.log(result.getOutput());