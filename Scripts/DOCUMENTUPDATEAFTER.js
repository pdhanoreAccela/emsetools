//===================================================================
//This script is a sample script for DocumentUploadAfter event.
//It is used to download the document from EDMS server, and then send out as an attachment by email.
//===================================================================

var from = "alvin.li@missionsky.com";
var to = "feng.xuan@missionsky.com";
var cc = "alvin.li@missionsky.com";
var templateName = "DOCUMENT UPLOAD AFTER";
var templateParams = null;
//Whether use the pre-defined EMDS user name & password.
var useDefaultUserPassword = true;
//If useDefaultUserPassword = true, there is no need to set user name & password, but if useDefaultUserPassword = false, we need define EDMS user name & password.
var EMDSUsername = null;
var EMDSPassword = null;

var docModelList = aa.env.getValue("DocumentModelList");


if(docModelList!="" && docModelList!=null)
{
	aa.env.setValue("ScriptReturnMessage", "Prepare to upload document..11");
	if(isCheckInDoc())
	{
	  var it = docModelList.iterator();

	  var size = docModelList.size();
	  aa.env.setValue("ScriptReturnMessage", "Prepare to upload document..12 : size: "+ size);

	
	//aa.document.sendEmailByTemplateName(from, to, cc, templateName, null, null);

	  if(it.hasNext())
	  {
	  	aa.env.setValue("ScriptReturnMessage", "Prepare to upload document..13");
		var documentModel = it.next();
		//Download the document from DB to disk.
		var downloadResult = aa.document.downloadFile2Disk(documentModel, documentModel.getModuleName(), EMDSUsername, EMDSPassword, useDefaultUserPassword);
		if(downloadResult.getSuccess())
		{
			aa.env.setValue("ScriptReturnMessage", "Prepare to upload document..22");
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
	  //aa.env.setValue("ScriptReturnMessage", "Prepare to upload document..")
	  aa.env.setValue("ScriptReturnCode","0");
  }
}

//aa.env.setValue("ScriptReturnCode","0");
//aa.env.setValue("ScriptReturnMessage", "V360DocumentUploadAfter End");

//Judging document's operate.
function isCheckInDoc()
{
	if(true){
		return true;
	}
	var docModel = docModelList.iterator().next();
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