//===================================================================
//This script is a sample script for DocumentUploadAfter event.
//It is used to download the document from EDMS server, and then send out as an attachment by email.
//===================================================================

var from = "cindy.qin@achievo.com";
var to = "carol.gong@beyondsoft..com";
var cc = richar.li@beyondsoft.com;
var templateName = "AA";
var templateParams = null;
//Whether use the pre-defined EMDS user name & password.
var useDefaultUserPassword = true;
//If useDefaultUserPassword = true, there is no need to set user name & password, but if useDefaultUserPassword = false, we need define EDMS user name & password.
var EMDSUsername = null;
var EMDSPassword = null;

var docModelList = aa.env.getValue("DocumentModelList");

if(docModelList != null && docModelList.get(0)!=null)
{
	if(isCheckInDoc())
	{
		var documentModel = docModelList.get(0);
		//Download the document from DB to disk.
		var downloadResult = aa.document.downloadFile2Disk(documentModel, documentModel.getModuleName(), EMDSUsername, EMDSPassword, useDefaultUserPassword);
		if(downloadResult.getSuccess())
		{
			var path = downloadResult.getOutput();
			var fileNames = new Array();
			fileNames[0] = path;
			//Send Email.
			var emailResult = aa.document.sendEmailByTemplateName(from, to, cc, templateName, templateParams, fileNames);
			if(emailResult.getSuccess())
			{
				aa.print("Successfully.");
			}
			else
			{
				aa.print(emailResult.getErrorMessage());
			}
		}
	}
}
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "V360DocumentUploadAfter End");

//Judging document's operate.
function isCheckInDoc()
{
	var docModel = docModelList.get(0);
	if(docModel == null)
	{
		aa.print("docModel is null");
		return false;
	}
	
	if("CHECK-IN".equals(docModel.getCategoryByAction()))
	{
		return true;
	}
	return false;
}