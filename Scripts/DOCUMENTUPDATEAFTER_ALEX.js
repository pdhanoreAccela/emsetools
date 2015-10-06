var docModel = aa.env.getValue("DocumentModel");
var templateName = "DOCUMENT UPLOAD AFTER";
	//get check-in template params

	var reportFiles = new Array();
	reportFiles[0] = "C:\\Users\\alex.zheng\\Downloads\\uploadFile\\ACC1.pdf";
	//get check-in template params
							
	sendNotification("alex.zheng@beyondsoft.com", templateName, null, reportFiles);


/*
 * Send notification
 */
function sendNotification(userEmailTo,templateName,params,reportFile)
{
	var result = null;
	result = aa.document.sendEmailAndSaveAsDocument("alex.zheng@beyondsoft.com", userEmailTo, "alex.zheng@beyondsoft.com", templateName, params, getCapID(), reportFile);
	if(result.getSuccess())
	{
		aa.log("Send email successfully!");
aa.print("Send email successfully!22222222222222");
		return true;
	}
	else
	{
		aa.log("Fail to send mail.");
		return false;
	}
}


function getCapID()
{
	
	var id1 = "14CAP";
	var id2 = "00000";
	var id3 = "00BBK";
	return aa.cap.createCapIDScriptModel(id1, id2, id3);
}