/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var documentModelArray = aa.env.getValue("DocumentModelList");                   
logDebug("documentModelArray = " + documentModelArray);
var documentUploadedFrom = aa.env.getValue("From");                              
logDebug("documentUploadedFrom = " + documentUploadedFrom);
var documentUploadStatus =  aa.env.getValue("UploadStatus");                             
logDebug("documentUploadStatus : " + documentUploadStatus);
var capIdString = aa.env.getValue("CapID") ;
var startDate = new Date();
var startTime = startDate.getTime();
var message =   "";                                                                                                           
// Message String
var debug = "";                                                                                                               
// Debug String
var br = "<BR>"; 

// Service Provider Code
var currentUserID = aa.env.getValue("CurrentUserID");     
// alternate cap id string
var publicUser = false;
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN"; publicUser = true }

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

// Exit if triggered from anything other than ACA, since the CAPID is not populated
if (documentUploadedFrom != "ACA")
{
    aa.env.setValue("ScriptReturnCode", "0");
    aa.env.setValue("ScriptReturnMessage", "");
    aa.abortScript()
}

if(capIdString != null && capIdString != "") 
{                                                                                                        
	// Break Tag
	var sca = String(capIdString).split("-");
	var capId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput()
	var cap = aa.cap.getCap(capId).getOutput();                                                       
	// Cap object
	var servProvCode = capId.getServiceProviderCode()                                      
                          
	// Current User
	var capIDString = capId.getCustomID();                                                                 

	var partialCap = !cap.isCompleteCap();

	logDebug("partialCap = " + partialCap);

	if(partialCap && documentModelArray != null)
	{
		var documentModels = documentModelArray.toArray();
		var documentModel = null;
		var conditionNumber = 0;           
		logDebug("documentModels.length = " + documentModels.length);
		for(i = 0; i<documentModels.length;i++)
		{
			documentModel = documentModels[i];
			conditionNumber = documentModel.getConditionNumber();
			logDebug(" i = " + i);
			logDebug("Condition Number = " + conditionNumber);
			if(conditionNumber != null && conditionNumber != 0)
			{                                              
				var capConditionResult = aa.capCondition.getCapCondition(capId, conditionNumber);
				if(capConditionResult.getSuccess())
				{
					var capCondition = capConditionResult.getOutput();
					var conditionGroup = capCondition.getConditionGroup();
					var conditionName = capCondition.getConditionDescription();
					documentModel.setDocCategory(conditionName);
					documentModel.setDocDepartment(conditionGroup);
					logDebug("Condition Name - " + conditionName);
					logDebug("Condition Group - " + conditionGroup);
					var updateDocumentResult = aa.document.updateDocument(documentModel);
					if(updateDocumentResult.getSuccess())
					{
						logDebug("Update document model successfully - " + documentModel.getDocName());
					}
					else
					{
						logDebug("Update document model failed - " + documentModel.getDocName());
					}
				}
				else
				{
					logDebug("No condition number - " + documentModel.getDocName());
				}
			}
		}
	}
}

function logDebug(debug)
{
    aa.print(debug);
}