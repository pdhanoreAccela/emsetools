//Set CAPID (CAP id)  for test.
//Unit Test Parameters --> begin
//aa.env.setValue("PermitId1", "07WEN");
//aa.env.setValue("PermitId2", "00000");
//aa.env.setValue("PermitId3", "00005");
//set workflow task info for test.
//aa.env.setValue("WorkflowTask", "License status");	
//aa.env.setValue("WorkflowStatus", "Active");	
//aa.env.setValue("ProcessID", "10382");
//aa.env.setValue("SD_STP_NUM", "5");
//Unit Test Parameters --> end

// -------------------------------------------------------------------------------------------------
// Transaction section.
// -------------------------------------------------------------------------------------------------
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
var mailCC = "brook.huang@achievo.com";
// -------------------------------------------------------------------------------------------------

var capID = getCapId();

//web service URL of 3rd site.
var webServiceAddress = 'https://aa.achievo.com/service.asmx';

if (isApproveEtisalatPayment(capID, 
	aa.env.getValue("WorkflowTask"), //workflow task
	aa.env.getValue("SD_STP_NUM"), //task step number
	aa.env.getValue("ProcessID"),  //process ID
	aa.env.getValue("WorkflowStatus"))) //task status
{
	// Approve authorized transactions.
	ApproveAuthorizedTransaction(capID);
}
else if (isVoidEtisalatPayment(capID, 
	aa.env.getValue("WorkflowTask"), //workflow task
	aa.env.getValue("SD_STP_NUM"), //task step number
	aa.env.getValue("ProcessID"),  //process ID
	aa.env.getValue("WorkflowStatus"))) //task status
{
	// Void authorized transactions.
	voidAuthorizedTransaction(capID, aa.messageResources.getLocalMessage("payment.gateway.review.void_transaction_for_deny"));
}

//1. Check to see if the license reviewing was approved by agency user.
if (isWorkflowApproveForReview(capID, 
	aa.env.getValue("WorkflowTask"), //workflow task
	aa.env.getValue("SD_STP_NUM"), //task step number
	aa.env.getValue("ProcessID"),  //process ID
	aa.env.getValue("WorkflowStatus"))) //task status
{
	//2. Get parent license CAPID
	var parentLicenseCAPID = getParentCapIDForReview(capID)
	aa.print("parent capid :" + parentLicenseCAPID);
	var partialCapID = getPartialCapID(capID);

	if (parentLicenseCAPID != null)
	{
		// 3. Check to see if license is ready for renew.
		if (isReadyRenew(parentLicenseCAPID))
		{
			//3.1 Get projectScriptModel of renewal CAP.	
			renewalCapProject = getRenewalCapByParentCapIDForReview(parentLicenseCAPID);
			if (renewalCapProject != null)
			{
				//4. Set B1PERMIT.B1_ACCESS_BY_ACA to "N" for partial CAP to not allow that it is searched by ACA user.
				aa.cap.updateAccessByACA(capID, "N");			
				//5. Set parent license to "Active"
				if (activeLicense(parentLicenseCAPID))
				{
					//6. Set renewal CAP status to "Complete"
					renewalCapProject.setStatus("Complete");
					aa.print("license(" + parentLicenseCAPID + ") is activated.");
					aa.cap.updateProject(renewalCapProject);
					//7. Copy key information from child CAP to parent CAP.
					copyKeyInfo(capID, parentLicenseCAPID);
					
					//8. Send approved license email to public user
					aa.expiration.sendApprovedNoticEmailToCitizenUser(parentLicenseCAPID)
					aa.print("send approved license email to citizen user.");
					
					//9. move renew document to parent cap
					aa.cap.transferRenewCapDocument(partialCapID, parentLicenseCAPID);
					aa.print("Transfer document for renew cap. Source Cap: " + partialCapID + ", target Cap: " + parentLicenseCAPID);
				}
			}
		}
	}
}
else if (isWorkflowDenyForReview(capID, 
	aa.env.getValue("WorkflowTask"), //workflow task
	aa.env.getValue("SD_STP_NUM"), //task step number
	aa.env.getValue("ProcessID"),  //process ID
	aa.env.getValue("WorkflowStatus"))) //task status)
{

	//1.1. Get parent license CAPID
	var parentLicenseCAPID = getParentCapIDForReview(capID)
	aa.print("parent capid :" + parentLicenseCAPID);
	if (parentLicenseCAPID != null)
	{
		//1.2. Check to see if license is ready for renew.
		if (isReadyRenew(parentLicenseCAPID))
		{
			//1.3 Get projectScriptModel of renewal CAP.	
			renewalCapProject = getRenewalCapByParentCapIDForReview(parentLicenseCAPID);
			if (renewalCapProject != null)
			{
				//1.4 Send denied license email to public user
				aa.expiration.sendDeniedNoticeEmailToCitizenUser(parentLicenseCAPID)
				aa.print("send denied license email to citizen user.");
			}
		}
	}
}
aa.env.setValue("ScriptReturnCode", "0"); 
aa.env.setValue("ScriptReturnMessage", "WorkflowTaskUpdateAfter for Renewal process.");

function isApproveEtisalatPayment(capID, wfTask, stepNum, processID, taskStatus)
{
	if (capID == null || aa.util.instanceOfString(capID) 
		|| stepNum == null || processID == null 
		|| wfTask == null || taskStatus == null)
	{
		return false;
	}

	var taskItem = getTaskItem(capID, stepNum, processID);

	if (taskItem == null)
	{
		return false;
	}

	if (taskItem.getTaskDescription().equals(wfTask)
		&& "Approve-Payment".equals(wfTask)
		&& "Approve".equals(taskStatus))
	{
		return true;
	}

	return false;
}

function isVoidEtisalatPayment(capID, wfTask, stepNum, processID, taskStatus)
{
	if (capID == null || aa.util.instanceOfString(capID) 
		|| stepNum == null || processID == null 
		|| wfTask == null || taskStatus == null)
	{
		return false;
	}

	var taskItem = getTaskItem(capID, stepNum, processID);

	if (taskItem == null)
	{
		return false;
	}

	if (taskItem.getTaskDescription().equals(wfTask)
		&& "Approve-Payment".equals(wfTask)
		&& "Void".equals(taskStatus))
	{
		return true;
	}
	return false;
}

function isWorkflowApproveForReview(capID, wfTask, stepNum, processID, taskStatus)
{
	if (capID == null || aa.util.instanceOfString(capID) 
		|| stepNum == null || processID == null 
		|| wfTask == null || taskStatus == null)
	{
		return false;
	}
	if (wfTask.length()  == 0)
	{
		return false;
	}
	//1. Get workflow task item
	var result = aa.workflow.getTask(capID, stepNum, processID);
    if(result.getSuccess())
	{
		taskItemScriptModel = result.getOutput();
		if (taskItemScriptModel == null)
		{
			aa.print("ERROR: Failed to get workflow task with CAPID(" + capID + ") for review");
			return false;
		}
		//2. Check to see if the agency user approve renewal application .
		if (taskItemScriptModel.getTaskDescription().equals(wfTask)
			&& "L-License Status".equals(wfTask)
			&& "L-LS-Active".equals(taskStatus))
		{
			return true;
		}	
		else
		{
			aa.print("Issuing license (" + wfTask +") don't have been approved");
		}
	}  
    else 
    {
      aa.print("ERROR: Failed to get workflow task(" + capID + ") for review: " + result.getErrorMessage());
    }
	return false;
}

function isWorkflowDenyForReview(capID, wfTask, stepNum, processID, taskStatus)
{
	if (capID == null || aa.util.instanceOfString(capID) 
		|| stepNum == null || processID == null 
		|| wfTask == null || taskStatus == null)
	{
		return false;
	}
	if (wfTask.length()  == 0)
	{
		return false;
	}
	//1. Get workflow task item
	var result = aa.workflow.getTask(capID, stepNum, processID);
    if(result.getSuccess())
	{
		taskItemScriptModel = result.getOutput();
		if (taskItemScriptModel == null)
		{
			aa.print("ERROR: Failed to get workflow task with CAPID(" + capID + ") for review");
			return false;
		}
		//2. Check to see if the agency user approve renewal application .
		if (taskItemScriptModel.getTaskDescription().equals(wfTask)
			&& "L-License Status".equals(wfTask)
			&& "L-LS-About To Expire".equals(taskStatus))
		{
			return true;
		}	
		else
		{
			aa.print("Issuing license (" + wfTask +") don't have been approved");
		}
	}  
    else 
    {
      aa.print("ERROR: Failed to get workflow task(" + capID + ") for review: " + result.getErrorMessage());
    }
	return false;
}


function isReadyRenew(capid)
{
	if (capid == null || aa.util.instanceOfString(capid))
	{
		return false;
	}
	var result = aa.expiration.isExpiredLicenses(capid);
    if(result.getSuccess())
	{
		return true;
	}  
    else 
    {
      aa.print("ERROR: Failed to get expiration with CAP(" + capid + "): " + result.getErrorMessage());
    }
	return false;
}

function getB1ExpirationScriptModel(capid)
{
	if (capid == null || aa.util.instanceOfString(capid))
	{
		return null;
	}
	var result = aa.expiration.getLicensesByCapID(capid);
    if(result.getSuccess())
	{
		return result.getOutput();
	}  
    else 
    {
      aa.print("ERROR: Failed to get expiration with CAP(" + capid + "): " + result.getErrorMessage());
      return null;
    }
}

function activeLicense(capid)
{
	if (capid == null || aa.util.instanceOfString(capid))
	{
		return false;
	}
	//1. Set status to "Active", and update expired date.
	var result = aa.expiration.activeLicensesByCapID(capid);
	if(result.getSuccess())
	{
		return true;
	}  
	else 
	{
	  aa.print("ERROR: Failed to activate License with CAP(" + capid + "): " + result.getErrorMessage());
	}
	return false;
}

function getParentCapIDForReview(capid)
{
	if (capid == null || aa.util.instanceOfString(capid))
	{
		return null;
	}
	//1. Get parent license for review
	var result = aa.cap.getProjectByChildCapID(capid, "Renewal", "Review");
    if(result.getSuccess())
	{
		projectScriptModels = result.getOutput();
		if (projectScriptModels == null || projectScriptModels.length == 0)
		{
			aa.print("ERROR: Failed to get parent CAP with CAPID(" + capid + ") for review");
			return null;
		}
		//2. return parent CAPID.
		projectScriptModel = projectScriptModels[0];
		return projectScriptModel.getProjectID();
	}  
    else 
    {
      aa.print("ERROR: Failed to get parent CAP by child CAP(" + capid + ") for review: " + result.getErrorMessage());
      return null;
    }
}

function getRenewalCapByParentCapIDForReview(parentCapid)
{
	if (parentCapid == null || aa.util.instanceOfString(parentCapid))
	{
		return null;
	}
	//1. Get parent license for review
	var result = aa.cap.getProjectByMasterID(parentCapid, "Renewal", "Review");
    if(result.getSuccess())
	{
		projectScriptModels = result.getOutput();
		if (projectScriptModels == null || projectScriptModels.length == 0)
		{
			aa.print("ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ") for review");
			return null;
		}
		//2. return parent CAPID.
		projectScriptModel = projectScriptModels[0];
		return projectScriptModel;
	}  
    else 
    {
      aa.print("ERROR: Failed to get renewal CAP by parent CAP(" + parentCapid + ") for review: " + result.getErrorMessage());
      return null;
    }
}

function copyKeyInfo(srcCapId, targetCapId)
{
	//copy ASI infomation
	copyAppSpecificInfo(srcCapId, targetCapId);
	//copy License infomation
	copyLicenseProfessional(srcCapId, targetCapId);
	//copy Address infomation
	copyAddress(srcCapId, targetCapId);
	//copy AST infomation
	copyAppSpecificTable(srcCapId, targetCapId);
	//copy Parcel infomation
	copyParcel(srcCapId, targetCapId);
	//copy People infomation
	copyPeople(srcCapId, targetCapId);
	//copy Owner infomation
	copyOwner(srcCapId, targetCapId);
	//Copy CAP condition information
	copyCapCondition(srcCapId, targetCapId);
	//Copy additional info.
	copyAdditionalInfo(srcCapId, targetCapId);
}

function copyAppSpecificInfo(srcCapId, targetCapId)
{
	//1. Get Application Specific Information with source CAPID.
	var  appSpecificInfo = getAppSpecificInfo(srcCapId);
	if (appSpecificInfo == null || appSpecificInfo.length == 0)
	{
		return;
	}
	//2. Set target CAPID to source Specific Information.
	for (loopk in appSpecificInfo)
	{
		var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
		
		sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
		sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
		sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());	
		//3. Edit ASI on target CAP (Copy info from source to target)
		aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
	}
}


function getAppSpecificInfo(capId)
{
	capAppSpecificInfo = null;
	var s_result = aa.appSpecificInfo.getByCapID(capId);
	if(s_result.getSuccess())
	{
		capAppSpecificInfo = s_result.getOutput();
		if (capAppSpecificInfo == null || capAppSpecificInfo.length == 0)
		{
			aa.print("WARNING: no appSpecificInfo on this CAP:" + capId);
			capAppSpecificInfo = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to appSpecificInfo: " + s_result.getErrorMessage());
		capAppSpecificInfo = null;	
	}
	// Return AppSpecificInfoModel[] 
	return capAppSpecificInfo;
}

function copyLicenseProfessional(srcCapId, targetCapId)
{
	//1. Get license professionals with source CAPID.
	var capLicenses = getLicenseProfessional(srcCapId);
	if (capLicenses == null || capLicenses.length == 0)
	{
		return;
	}
	//2. Get license professionals with target CAPID.
	var targetLicenses = getLicenseProfessional(targetCapId);
	//3. Check to see which licProf is matched in both source and target.
	for (loopk in capLicenses)
	{
		sourcelicProfModel = capLicenses[loopk];
		//3.1 Set target CAPID to source lic prof.
		sourcelicProfModel.setCapID(targetCapId);
		targetLicProfModel = null;
		//3.2 Check to see if sourceLicProf exist.
		if (targetLicenses != null && targetLicenses.length > 0)
		{
			for (loop2 in targetLicenses)
			{
				if (isMatchLicenseProfessional(sourcelicProfModel, targetLicenses[loop2]))
				{
					targetLicProfModel = targetLicenses[loop2];

					break;
				}
			}
		}
		//3.3 It is a matched licProf model.
		if (targetLicProfModel != null)
		{
			//3.3.1 Copy information from source to target.
			aa.licenseProfessional.copyLicenseProfessionalScriptModel(sourcelicProfModel, targetLicProfModel);
			//3.3.2 Edit licProf with source licProf information. 
			aa.licenseProfessional.editLicensedProfessional(targetLicProfModel);
		}
		//3.4 It is new licProf model.
		else
		{
			//3.4.1 Create new license professional.
			aa.licenseProfessional.createLicensedProfessional(sourcelicProfModel);
		}
	}
}

function isMatchLicenseProfessional(licProfScriptModel1, licProfScriptModel2)
{
	if (licProfScriptModel1 == null || licProfScriptModel2 == null)
	{
		return false;
	}
	if (licProfScriptModel1.getLicenseType().equals(licProfScriptModel2.getLicenseType())
		&& licProfScriptModel1.getLicenseNbr().equals(licProfScriptModel2.getLicenseNbr()))
	{
		return true;
	}
	return	false;
}

function getLicenseProfessional(capId)
{
	capLicenseArr = null;
	var s_result = aa.licenseProfessional.getLicenseProf(capId);
	if(s_result.getSuccess())
	{
		capLicenseArr = s_result.getOutput();
		if (capLicenseArr == null || capLicenseArr.length == 0)
		{
			aa.print("WARNING: no licensed professionals on this CAP:" + capId);
			capLicenseArr = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
		capLicenseArr = null;	
	}
	return capLicenseArr;
}


function copyAddress(srcCapId, targetCapId)
{
	//1. Get address with source CAPID.
	var capAddresses = getAddress(srcCapId);
	if (capAddresses == null || capAddresses.length == 0)
	{
		return;
	}
	//2. Get addresses with target CAPID.
	var targetAddresses = getAddress(targetCapId);
	//3. Check to see which address is matched in both source and target.
	for (loopk in capAddresses)
	{
		sourceAddressfModel = capAddresses[loopk];
		//3.1 Set target CAPID to source address.
		sourceAddressfModel.setCapID(targetCapId);
		targetAddressfModel = null;
		//3.2 Check to see if sourceAddress exist.
		if (targetAddresses != null && targetAddresses.length > 0)
		{
			for (loop2 in targetAddresses)
			{
				if (isMatchAddress(sourceAddressfModel, targetAddresses[loop2]))
				{
					targetAddressfModel = targetAddresses[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched address model.
		if (targetAddressfModel != null)
		{
		
			//3.3.1 Copy information from source to target.
			aa.address.copyAddressModel(sourceAddressfModel, targetAddressfModel);
			//3.3.2 Edit address with source address information. 
			aa.address.editAddressWithAPOAttribute(targetCapId, targetAddressfModel);
		}
		//3.4 It is new address model.
		else
		{	
			//3.4.1 Create new address.
			aa.address.createAddressWithAPOAttribute(targetCapId, sourceAddressfModel);
		}
	}
}

function isMatchAddress(addressScriptModel1, addressScriptModel2)
{
	if (addressScriptModel1 == null || addressScriptModel2 == null)
	{
		return false;
	}
	var streetName1 = addressScriptModel1.getStreetName();
	var streetName2 = addressScriptModel2.getStreetName();
	if ((streetName1 == null && streetName2 != null) 
		|| (streetName1 != null && streetName2 == null))
	{
		return false;
	}
	if (streetName1 != null && !streetName1.equals(streetName2))
	{
		return false;
	}
	return true;
}

function getAddress(capId)
{
	capAddresses = null;
	var s_result = aa.address.getAddressByCapId(capId);
	if(s_result.getSuccess())
	{
		capAddresses = s_result.getOutput();
		if (capAddresses == null || capAddresses.length == 0)
		{
			aa.print("WARNING: no addresses on this CAP:" + capId);
			capAddresses = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to address: " + s_result.getErrorMessage());
		capAddresses = null;	
	}
	return capAddresses;
}

function copyAppSpecificTable(srcCapId, targetCapId)
{
	var tableNameArray = getTableName(srcCapId);
	if (tableNameArray == null)
	{
		return;
	}
	for (loopk in tableNameArray)
	{
		var tableName = tableNameArray[loopk];
		//1. Get appSpecificTableModel with source CAPID
		var targetAppSpecificTable = getAppSpecificTable(srcCapId,tableName);
		
		//2. Edit AppSpecificTableInfos with target CAPID
		var aSTableModel = null;
		if(targetAppSpecificTable == null)
		{
			return;
		}
		else
		{
		    aSTableModel = targetAppSpecificTable.getAppSpecificTableModel();
		}
		aa.appSpecificTableScript.editAppSpecificTableInfos(aSTableModel,
								targetCapId,
								null);
	}
	
}

function getTableName(capId)
{
	var tableName = null;
	var result = aa.appSpecificTableScript.getAppSpecificGroupTableNames(capId);
	if(result.getSuccess())
	{
		tableName = result.getOutput();
		if(tableName!=null)
		{
			return tableName;
		}
	}
	return tableName;
}

function getAppSpecificTable(capId,tableName)
{
	appSpecificTable = null;
	var s_result = aa.appSpecificTableScript.getAppSpecificTableModel(capId,tableName);
	if(s_result.getSuccess())
	{
		appSpecificTable = s_result.getOutput();
		if (appSpecificTable == null || appSpecificTable.length == 0)
		{
			aa.print("WARNING: no appSpecificTable on this CAP:" + capId);
			appSpecificTable = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to appSpecificTable: " + s_result.getErrorMessage());
		appSpecificTable = null;	
	}
	return appSpecificTable;
}

function copyParcel(srcCapId, targetCapId)
{
	//1. Get parcels with source CAPID.
	var copyParcels = getParcel(srcCapId);
	if (copyParcels == null || copyParcels.length == 0)
	{
		return;
	}
	//2. Get parcel with target CAPID.
	var targetParcels = getParcel(targetCapId);
	//3. Check to see which parcel is matched in both source and target.
	for (i = 0; i < copyParcels.size(); i++)
	{
		sourceParcelModel = copyParcels.get(i);
		//3.1 Set target CAPID to source parcel.
		sourceParcelModel.setCapID(targetCapId);
		targetParcelModel = null;
		//3.2 Check to see if sourceParcel exist.
		if (targetParcels != null && targetParcels.size() > 0)
		{
			for (j = 0; j < targetParcels.size(); j++)
			{
				if (isMatchParcel(sourceParcelModel, targetParcels.get(j)))
				{
					targetParcelModel = targetParcels.get(j);
					break;
				}
			}
		}
		//3.3 It is a matched parcel model.
		if (targetParcelModel != null)
		{
			//3.3.1 Copy information from source to target.
			var tempCapSourceParcel = aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, sourceParcelModel).getOutput();
			var tempCapTargetParcel = aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, targetParcelModel).getOutput();
			aa.parcel.copyCapParcelModel(tempCapSourceParcel, tempCapTargetParcel);
			//3.3.2 Edit parcel with sourceparcel. 
			aa.parcel.updateDailyParcelWithAPOAttribute(tempCapTargetParcel);
		}
		//3.4 It is new parcel model.
		else
		{
			//3.4.1 Create new parcel.
			aa.parcel.createCapParcelWithAPOAttribute(aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, sourceParcelModel).getOutput());
		}
	}
}

function isMatchParcel(parcelScriptModel1, parcelScriptModel2)
{
	if (parcelScriptModel1 == null || parcelScriptModel2 == null)
	{
		return false;
	}
	if (parcelScriptModel1.getParcelNumber().equals(parcelScriptModel2.getParcelNumber()))
	{
		return true;
	}
	return	false;
}

function getParcel(capId)
{
	capParcelArr = null;
	var s_result = aa.parcel.getParcelandAttribute(capId, null);
	if(s_result.getSuccess())
	{
		capParcelArr = s_result.getOutput();
		if (capParcelArr == null || capParcelArr.length == 0)
		{
			aa.print("WARNING: no parcel on this CAP:" + capId);
			capParcelArr = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to parcel: " + s_result.getErrorMessage());
		capParcelArr = null;	
	}
	return capParcelArr;
}

function copyPeople(srcCapId, targetCapId)
{
	//1. Get people with source CAPID.
	var capPeoples = getPeople(srcCapId);
	if (capPeoples == null || capPeoples.length == 0)
	{
		return;
	}
	//2. Get people with target CAPID.
	var targetPeople = getPeople(targetCapId);
	//3. Check to see which people is matched in both source and target.
	for (loopk in capPeoples)
	{
		sourcePeopleModel = capPeoples[loopk];
		//3.1 Set target CAPID to source people.
		sourcePeopleModel.getCapContactModel().setCapID(targetCapId);
		targetPeopleModel = null;
		//3.2 Check to see if sourcePeople exist.
		if (targetPeople != null && targetPeople.length > 0)
		{
			for (loop2 in targetPeople)
			{
				if (isMatchPeople(sourcePeopleModel, targetPeople[loop2]))
				{
					targetPeopleModel = targetPeople[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched people model.
		if (targetPeopleModel != null)
		{
			//3.3.1 Copy information from source to target.
			aa.people.copyCapContactModel(sourcePeopleModel.getCapContactModel(), targetPeopleModel.getCapContactModel());
			//3.3.2 Edit People with source People information. 
			aa.people.editCapContactWithAttribute(targetPeopleModel.getCapContactModel());
		}
		//3.4 It is new People model.
		else
		{
			//3.4.1 Create new people.
			aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
		}
	}
}

function isMatchPeople(capContactScriptModel, capContactScriptModel2)
{
	if (capContactScriptModel == null || capContactScriptModel2 == null)
	{
		return false;
	}
	var contactType1 = capContactScriptModel.getCapContactModel().getPeople().getContactType();
	var contactType2 = capContactScriptModel2.getCapContactModel().getPeople().getContactType();
	var firstName1 = capContactScriptModel.getCapContactModel().getPeople().getFirstName();
	var firstName2 = capContactScriptModel2.getCapContactModel().getPeople().getFirstName();
	var lastName1 = capContactScriptModel.getCapContactModel().getPeople().getLastName();
	var lastName2 = capContactScriptModel2.getCapContactModel().getPeople().getLastName();
	var fullName1 = capContactScriptModel.getCapContactModel().getPeople().getFullName();
	var fullName2 = capContactScriptModel2.getCapContactModel().getPeople().getFullName();
	if ((contactType1 == null && contactType2 != null) 
		|| (contactType1 != null && contactType2 == null))
	{
		return false;
	}
	if (contactType1 != null && !contactType1.equals(contactType2))
	{
		return false;
	}
	if ((firstName1 == null && firstName2 != null) 
		|| (firstName1 != null && firstName2 == null))
	{
		return false;
	}
	if (firstName1 != null && !firstName1.equals(firstName2))
	{
		return false;
	}
	if ((lastName1 == null && lastName2 != null) 
		|| (lastName1 != null && lastName2 == null))
	{
		return false;
	}
	if (lastName1 != null && !lastName1.equals(lastName2))
	{
		return false;
	}
	if ((fullName1 == null && fullName2 != null) = aa.cap.getCapIDModel(id1, id2, id3);
    if(s_capResult.getSuccess())
	{
      return s_capResult.getOutput();
	}  
    else 
    {
      aa.print("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
}

function getTaskItem(capID, stepNum, processID)
{
	var taskItemScriptModel = null;
	var result = aa.workflow.getTask(capID, stepNum, processID);
	if(result.getSuccess())
	{
		taskItemScriptModel = result.getOutput();
		if (taskItemScriptModel == null)
		{
			aa.print("ERROR: Failed to get workflow task with CAPID(" + capID + ")");
		}
	}  
	else 
	{
		aa.print("ERROR: Failed to get workflow task(" + capID + ") for review: " + result.getErrorMessage());
	}

	return taskItemScriptModel;
}

// -------------------------------------------------------------------------------------------------
// Transaction section.
// -------------------------------------------------------------------------------------------------

/**
 * Iterator to approve all authorized transactions.
 * 1. Capture Etisalat transactions.
 * 2. Void all authorized transactions if capture is failed.
 * 3. Approve local transactions if capture is success.
 * 4. Reverse all authorized transactions if approve is failed.
 * 5. Send remider email if capture is success.
 */
function ApproveAuthorizedTransaction(capID)
{
	var entityID = capID.toString();
	var authorizedTransactions = getAllAuthorizedTransactions(entityID);
	aa.log("Start to approve authorized transactions.");
	aa.log("CAP ID: " + entityID);
	if (authorizedTransactions == null || authorizedTransactions.length == 0)
	{
		aa.log("Not any authorized transaction found for this CAP: " + entityID);
		return false;
	}
	aa.log("Transaction size: " + authorizedTransactions.length);

	aa.log("Iterate transactions.");
	// Iterate all authorized transactions of this CAP to approve.
	for (var i = 0; i < authorizedTransactions.length; i++)
	{
		var condidateTrans = authorizedTransactions[i];
		var consolidatorID = condidateTrans.getProcTransID();
		var publicUserSeq = condidateTrans.getClientNumber();
		aa.log("ConsolidatorID: " + consolidatorID);
		aa.log("publicUserSeq: " + publicUserSeq);
		// 1. Capture Etisalat transactions.
		if (!captureTransaction(consolidatorID))
		{
			aa.log("Capture Etisalat transaction failed, start to reverse all authorized transactions.");
			// 2. Reverse all authorized transactions if capture is failed.
			voidAuthorizedTransaction(capID, aa.messageResources.getLocalMessage("payment.gateway.review.void_transaction_for_capture_failed"));
			return false;
		}

		var publicUser = getPublicUser(publicUserSeq);
		var transactions = getTransactionsByConIDAndEntityID(consolidatorID, entityID);
		// 3. Approve local transactions if capture is success.
		if (!approveLocalTransAfterCapture(consolidatorID, transactions))
		{
			aa.log("Approve local transaction failed, start to reverse all authorized transactions.");
			// 4. Reverse all authorized transactions if approve is failed.
			voidAuthorizedTransaction(capID, aa.messageResources.getLocalMessage("payment.gateway.review.void_transaction_for_approve_failed"));
			return false;
		}

		// 5. Send remider email if capture is success.
		sendRemiderEmailAfterApprove(consolidatorID, publicUser, transactions, capID);
	}

	return true;
}

/**
 * Iterator to void all authorized transactions.
 * 1. Void transactions.
 *    a) Reverse Etisalat transactions.
 *    b) Void local transactions if reverse is success.
 *    c) Cancel local transaction if reverse is failed.
 * 2. Void payment.
 * 3. Send remider email if capture is success.
 */
function voidAuthorizedTransaction(capID, voidReason)
{
	var entityID = capID.toString();
	var customID = getCustomID(capID);
	capID.setCustomID(customID);
	var authorizedTransactions = getAllAuthorizedTransactions(entityID);
	aa.log("Start to reverse authorized transactions.");
	aa.log("CAP ID: " + entityID);
	if (authorizedTransactions == null || authorizedTransactions.length == 0)
	{
		aa.log("Not any authorized transaction found for this CAP: " + entityID);
		return false;
	}

	aa.log("Transaction size: " + authorizedTransactions.length);
	aa.log("Iterate transactions.");
	for (var i = 0; i < authorizedTransactions.length; i++)
	{
		var condidateTrans = authorizedTransactions[i];
		var consolidatorID = condidateTrans.getProcTransID();
		var batchNumber = condidateTrans.getBatchTransCode();
		var publicUserSeq = condidateTrans.getClientNumber();
		aa.log("ConsolidatorID: " + consolidatorID);
		aa.log("publicUserSeq: " + publicUserSeq);
		var publicUser = getPublicUser(publicUserSeq);
		var transactions = getTransactionsByConIDAndEntityID(consolidatorID, entityID);
		// 1. Void transactions.
		doVoid(consolidatorID, transactions);
		// 2. Void payment.
		doVoidPayment(capID, batchNumber);
		// 3. Send remider email if capture is success.
		sendRemiderEmailAfterVoid(consolidatorID, publicUser, transactions, capID, voidReason);
	}

	return true;
}

function sendRemiderEmailAfterApprove(consolidatorID, publicUser, transactions, capIDModel)
{
	var capModel = getCAPModel(capIDModel);
	capIDModel = capModel.getCapID();
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

function sendRemiderEmailAfterVoid(consolidatorID, publicUser, transactions, capIDModel, voidReason)
{
	var capModel = getCAPModel(capIDModel);
	capIDModel = capModel.getCapID();
	var paymentAmount = getTotalTransactionFee(transactions);
	var agencyTransaction = getAgencyTransaction(transactions);
	var auditDate = aa.util.formatDate(agencyTransaction.getAuditDate(), DATE_FORMAT);
	var capType = null;
	var capTypeResult = aa.cap.getCapTypeModelByCapID(capIDModel); 
	if (capTypeResult.getSuccess())
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
	addParameter(contentParameters, "$$Amount$$", aa.util.formatFee(paymentAmount));
	addParameter(contentParameters, "$$capID$$", capIDModel.getCustomID());
	addParameter(contentParameters, "$$capType$$", capType);
	addParameter(contentParameters, "$$FirstName$$", publicUser.getFirstName());
	addParameter(contentParameters, "$$LastName$$", publicUser.getLastName());
	addParameter(contentParameters, "$$mmddyy$$", expireDate);
	addParamete  aa.print("ERROR: Failed to get workflow task(" + capID + ") for review: " + result.getErrorMessage());
    }
	return false;
}


function isReadyRenew(capid)
{
	if (capid == null || aa.util.instanceOfString(capid))
	{
		return false;
	}
	var result = aa.expiration.isExpiredLicenses(capid);
    if(result.getSuccess())
	{
		return true;
	}  
    else 
    {
      aa.print("ERROR: Failed to get expiration with CAP(" + capid + "): " + result.getErrorMessage());
    }
	return false;
}

function getB1ExpirationScriptModel(capid)
{
	if (capid == null || aa.util.instanceOfString(capid))
	{
		return null;
	}
	var result = aa.expiration.getLicensesByCapID(capid);
    if(result.getSuccess())
	{
		return result.getOutput();
	}  
    else 
    {
      aa.print("ERROR: Failed to get expiration with CAP(" + capid + "): " + result.getErrorMessage());
      return null;
    }
}

function activeLicense(capid)
{
	if (capid == null || aa.util.instanceOfString(capid))
	{
		return false;
	}
	//1. Set status to "Active", and update expired date.
	var result = aa.expiration.activeLicensesByCapID(capid);
	if(result.getSuccess())
	{
		return true;
	}  
	else 
	{
	  aa.print("ERROR: Failed to activate License with CAP(" + capid + "): " + result.getErrorMessage());
	}
	return false;
}

function getParentCapIDForReview(capid)
{
	if (capid == null || aa.util.instanceOfString(capid))
	{
		return null;
	}
	//1. Get parent license for review
	var result = aa.cap.getProjectByChildCapID(capid, "Renewal", "Review");
    if(result.getSuccess())
	{
		projectScriptModels = result.getOutput();
		if (projectScriptModels == null || projectScriptModels.length == 0)
		{
			aa.print("ERROR: Failed to get parent CAP with CAPID(" + capid + ") for review");
			return null;
		}
		//2. return parent CAPID.
		projectScriptModel = projectScriptModels[0];
		return projectScriptModel.getProjectID();
	}  
    else 
    {
      aa.print("ERROR: Failed to get parent CAP by child CAP(" + capid + ") for review: " + result.getErrorMessage());
      return null;
    }
}

function getRenewalCapByParentCapIDForReview(parentCapid)
{
	if (parentCapid == null || aa.util.instanceOfString(parentCapid))
	{
		return null;
	}
	//1. Get parent license for review
	var result = aa.cap.getProjectByMasterID(parentCapid, "Renewal", "Review");
    if(result.getSuccess())
	{
		projectScriptModels = result.getOutput();
		if (projectScriptModels == null || projectScriptModels.length == 0)
		{
			aa.print("ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ") for review");
			return null;
		}
		//2. return parent CAPID.
		projectScriptModel = projectScriptModels[0];
		return projectScriptModel;
	}  
    else 
    {
      aa.print("ERROR: Failed to get renewal CAP by parent CAP(" + parentCapid + ") for review: " + result.getErrorMessage());
      return null;
    }
}

function copyKeyInfo(srcCapId, targetCapId)
{
	//copy ASI infomation
	copyAppSpecificInfo(srcCapId, targetCapId);
	//copy License infomation
	copyLicenseProfessional(srcCapId, targetCapId);
	//copy Address infomation
	copyAddress(srcCapId, targetCapId);
	//copy AST infomation
	copyAppSpecificTable(srcCapId, targetCapId);
	//copy Parcel infomation
	copyParcel(srcCapId, targetCapId);
	//copy People infomation
	copyPeople(srcCapId, targetCapId);
	//copy Owner infomation
	copyOwner(srcCapId, targetCapId);
	//Copy CAP condition information
	copyCapCondition(srcCapId, targetCapId);
	//Copy additional info.
	copyAdditionalInfo(srcCapId, targetCapId);
}

function copyAppSpecificInfo(srcCapId, targetCapId)
{
	//1. Get Application Specific Information with source CAPID.
	var  appSpecificInfo = getAppSpecificInfo(srcCapId);
	if (appSpecificInfo == null || appSpecificInfo.length == 0)
	{
		return;
	}
	//2. Set target CAPID to source Specific Information.
	for (loopk in appSpecificInfo)
	{
		var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
		
		sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
		sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
		sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());	
		//3. Edit ASI on target CAP (Copy info from source to target)
		aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
	}
}


function getAppSpecificInfo(capId)
{
	capAppSpecificInfo = null;
	var s_result = aa.appSpecificInfo.getByCapID(capId);
	if(s_result.getSuccess())
	{
		capAppSpecificInfo = s_result.getOutput();
		if (capAppSpecificInfo == null || capAppSpecificInfo.length == 0)
		{
			aa.print("WARNING: no appSpecificInfo on this CAP:" + capId);
			capAppSpecificInfo = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to appSpecificInfo: " + s_result.getErrorMessage());
		capAppSpecificInfo = null;	
	}
	// Return AppSpecificInfoModel[] 
	return capAppSpecificInfo;
}

function copyLicenseProfessional(srcCapId, targetCapId)
{
	//1. Get license professionals with source CAPID.
	var capLicenses = getLicenseProfessional(srcCapId);
	if (capLicenses == null || capLicenses.length == 0)
	{
		return;
	}
	//2. Get license professionals with target CAPID.
	var targetLicenses = getLicenseProfessional(targetCapId);
	//3. Check to see which licProf is matched in both source and target.
	for (loopk in capLicenses)
	{
		sourcelicProfModel = capLicenses[loopk];
		//3.1 Set target CAPID to source lic prof.
		sourcelicProfModel.setCapID(targetCapId);
		targetLicProfModel = null;
		//3.2 Check to see if sourceLicProf exist.
		if (targetLicenses != null && targetLicenses.length > 0)
		{
			for (loop2 in targetLicenses)
			{
				if (isMatchLicenseProfessional(sourcelicProfModel, targetLicenses[loop2]))
				{
					targetLicProfModel = targetLicenses[loop2];

					break;
				}
			}
		}
		//3.3 It is a matched licProf model.
		if (targetLicProfModel != null)
		{
			//3.3.1 Copy information from source to target.
			aa.licenseProfessional.copyLicenseProfessionalScriptModel(sourcelicProfModel, targetLicProfModel);
			//3.3.2 Edit licProf with source licProf information. 
			aa.licenseProfessional.editLicensedProfessional(targetLicProfModel);
		}
		//3.4 It is new licProf model.
		else
		{
			//3.4.1 Create new license professional.
			aa.licenseProfessional.createLicensedProfessional(sourcelicProfModel);
		}
	}
}

function isMatchLicenseProfessional(licProfScriptModel1, licProfScriptModel2)
{
	if (licProfScriptModel1 == null || licProfScriptModel2 == null)
	{
		return false;
	}
	if (licProfScriptModel1.getLicenseType().equals(licProfScriptModel2.getLicenseType())
		&& licProfScriptModel1.getLicenseNbr().equals(licProfScriptModel2.getLicenseNbr()))
	{
		return true;
	}
	return	false;
}

function getLicenseProfessional(capId)
{
	capLicenseArr = null;
	var s_result = aa.licenseProfessional.getLicenseProf(capId);
	if(s_result.getSuccess())
	{
		capLicenseArr = s_result.getOutput();
		if (capLicenseArr == null || capLicenseArr.length == 0)
		{
			aa.print("WARNING: no licensed professionals on this CAP:" + capId);
			capLicenseArr = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
		capLicenseArr = null;	
	}
	return capLicenseArr;
}


function copyAddress(srcCapId, targetCapId)
{
	//1. Get address with source CAPID.
	var capAddresses = getAddress(srcCapId);
	if (capAddresses == null || capAddresses.length == 0)
	{
		return;
	}
	//2. Get addresses with target CAPID.
	var targetAddresses = getAddress(targetCapId);
	//3. Check to see which address is matched in both source and target.
	for (loopk in capAddresses)
	{
		sourceAddressfModel = capAddresses[loopk];
		//3.1 Set target CAPID to source address.
		sourceAddressfModel.setCapID(targetCapId);
		targetAddressfModel = null;
		//3.2 Check to see if sourceAddress exist.
		if (targetAddresses != null && targetAddresses.length > 0)
		{
			for (loop2 in targetAddresses)
			{
				if (isMatchAddress(sourceAddressfModel, targetAddresses[loop2]))
				{
					targetAddressfModel = targetAddresses[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched address model.
		if (targetAddressfModel != null)
		{
		
			//3.3.1 Copy information from source to target.
			aa.address.copyAddressModel(sourceAddressfModel, targetAddressfModel);
			//3.3.2 Edit address with source address information. 
			aa.address.editAddressWithAPOAttribute(targetCapId, targetAddressfModel);
		}
		//3.4 It is new address model.
		else
		{	
			//3.4.1 Create new address.
			aa.address.createAddressWithAPOAttribute(targetCapId, sourceAddressfModel);
		}
	}
}

function isMatchAddress(addressScriptModel1, addressScriptModel2)
{
	if (addressScriptModel1 == null || addressScriptModel2 == null)
	{
		return false;
	}
	var streetName1 = addressScriptModel1.getStreetName();
	var streetName2 = addressScriptModel2.getStreetName();
	if ((streetName1 == null && streetName2 != null) 
		|| (streetName1 != null && streetName2 == null))
	{
		return false;
	}
	if (streetName1 != null && !streetName1.equals(streetName2))
	{
		return false;
	}
	return true;
}

function getAddress(capId)
{
	capAddresses = null;
	var s_result = aa.address.getAddressByCapId(capId);
	if(s_result.getSuccess())
	{
		capAddresses = s_result.getOutput();
		if (capAddresses == null || capAddresses.length == 0)
		{
			aa.print("WARNING: no addresses on this CAP:" + capId);
			capAddresses = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to address: " + s_result.getErrorMessage());
		capAddresses = null;	
	}
	return capAddresses;
}

function copyAppSpecificTable(srcCapId, targetCapId)
{
	var tableNameArray = getTableName(srcCapId);
	if (tableNameArray == null)
	{
		return;
	}
	for (loopk in tableNameArray)
	{
		var tableName = tableNameArray[loopk];
		//1. Get appSpecificTableModel with source CAPID
		var targetAppSpecificTable = getAppSpecificTable(srcCapId,tableName);
		
		//2. Edit AppSpecificTableInfos with target CAPID
		var aSTableModel = null;
		if(targetAppSpecificTable == null)
		{
			return;
		}
		else
		{
		    aSTableModel = targetAppSpecificTable.getAppSpecificTableModel();
		}
		aa.appSpecificTableScript.editAppSpecificTableInfos(aSTableModel,
								targetCapId,
								null);
	}
	
}

function getTableName(capId)
{
	var tableName = null;
	var result = aa.appSpecificTableScript.getAppSpecificGroupTableNames(capId);
	if(result.getSuccess())
	{
		tableName = result.getOutput();
		if(tableName!=null)
		{
			return tableName;
		}
	}
	return tableName;
}

function getAppSpecificTable(capId,tableName)
{
	appSpecificTable = null;
	var s_result = aa.appSpecificTableScript.getAppSpecificTableModel(capId,tableName);
	if(s_result.getSuccess())
	{
		appSpecificTable = s_result.getOutput();
		if (appSpecificTable == null || appSpecificTable.length == 0)
		{
			aa.print("WARNING: no appSpecificTable on this CAP:" + capId);
			appSpecificTable = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to appSpecificTable: " + s_result.getErrorMessage());
		appSpecificTable = null;	
	}
	return appSpecificTable;
}

function copyParcel(srcCapId, targetCapId)
{
	//1. Get parcels with source CAPID.
	var copyParcels = getParcel(srcCapId);
	if (copyParcels == null || copyParcels.length == 0)
	{
		return;
	}
	//2. Get parcel with target CAPID.
	var targetParcels = getParcel(targetCapId);
	//3. Check to see which parcel is matched in both source and target.
	for (i = 0; i < copyParcels.size(); i++)
	{
		sourceParcelModel = copyParcels.get(i);
		//3.1 Set target CAPID to source parcel.
		sourceParcelModel.setCapID(targetCapId);
		targetParcelModel = null;
		//3.2 Check to see if sourceParcel exist.
		if (targetParcels != null && targetParcels.size() > 0)
		{
			for (j = 0; j < targetParcels.size(); j++)
			{
				if (isMatchParcel(sourceParcelModel, targetParcels.get(j)))
				{
					targetParcelModel = targetParcels.get(j);
					break;
				}
			}
		}
		//3.3 It is a matched parcel model.
		if (targetParcelModel != null)
		{
			//3.3.1 Copy information from source to target.
			var tempCapSourceParcel = aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, sourceParcelModel).getOutput();
			var tempCapTargetParcel = aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, targetParcelModel).getOutput();
			aa.parcel.copyCapParcelModel(tempCapSourceParcel, tempCapTargetParcel);
			//3.3.2 Edit parcel with sourceparcel. 
			aa.parcel.updateDailyParcelWithAPOAttribute(tempCapTargetParcel);
		}
		//3.4 It is new parcel model.
		else
		{
			//3.4.1 Create new parcel.
			aa.parcel.createCapParcelWithAPOAttribute(aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, sourceParcelModel).getOutput());
		}
	}
}

function isMatchParcel(parcelScriptModel1, parcelScriptModel2)
{
	if (parcelScriptModel1 == null || parcelScriptModel2 == null)
	{
		return false;
	}
	if (parcelScriptModel1.getParcelNumber().equals(parcelScriptModel2.getParcelNumber()))
	{
		return true;
	}
	return	false;
}

function getParcel(capId)
{
	capParcelArr = null;
	var s_result = aa.parcel.getParcelandAttribute(capId, null);
	if(s_result.getSuccess())
	{
		capParcelArr = s_result.getOutput();
		if (capParcelArr == null || capParcelArr.length == 0)
		{
			aa.print("WARNING: no parcel on this CAP:" + capId);
			capParcelArr = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to parcel: " + s_result.getErrorMessage());
		capParcelArr = null;	
	}
	return capParcelArr;
}

function copyPeople(srcCapId, targetCapId)
{
	//1. Get people with source CAPID.
	var capPeoples = getPeople(srcCapId);
	if (capPeoples == null || capPeoples.length == 0)
	{
		return;
	}
	//2. Get people with target CAPID.
	var targetPeople = getPeople(targetCapId);
	//3. Check to see which people is matched in both source and target.
	for (loopk in capPeoples)
	{
		sourcePeopleModel = capPeoples[loopk];
		//3.1 Set target CAPID to source people.
		sourcePeopleModel.getCapContactModel().setCapID(targetCapId);
		targetPeopleModel = null;
		//3.2 Check to see if sourcePeople exist.
		if (targetPeople != null && targetPeople.length > 0)
		{
			for (loop2 in targetPeople)
			{
				if (isMatchPeople(sourcePeopleModel, targetPeople[loop2]))
				{
					targetPeopleModel = targetPeople[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched people model.
		if (targetPeopleModel != null)
		{
			//3.3.1 Copy information from source to target.
			aa.people.copyCapContactModel(sourcePeopleModel.getCapContactModel(), targetPeopleModel.getCapContactModel());
			//3.3.2 Edit People with source People information. 
			aa.people.editCapContactWithAttribute(targetPeopleModel.getCapContactModel());
		}
		//3.4 It is new People model.
		else
		{
			//3.4.1 Create new people.
			aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
		}
	}
}

function isMatchPeople(capContactScriptModel, capContactScriptModel2)
{
	if (capContactScriptModel == null || capContactScriptModel2 == null)
	{
		return false;
	}
	var contactType1 = capContactScriptModel.getCapContactModel().getPeople().getContactType();
	var contactType2 = capContactScriptModel2.getCapContactModel().getPeople().getContactType();
	var firstName1 = capContactScriptModel.getCapContactModel().getPeople().getFirstName();
	var firstName2 = capContactScriptModel2.getCapContactModel().getPeople().getFirstName();
	var lastName1 = capContactScriptModel.getCapContactModel().getPeople().getLastName();
	var lastName2 = capContactScriptModel2.getCapContactModel().getPeople().getLastName();
	var fullName1 = capContactScriptModel.getCapContactModel().getPeople().getFullName();
	var fullName2 = capContactScriptModel2.getCapContactModel().getPeople().getFullName();
	if ((contactType1 == null && contactType2 != null) 
		|| (contactType1 != null && contactType2 == null))
	{
		return false;
	}
	if (contactType1 != null && !contactType1.equals(contactType2))
	{
		return false;
	}
	if ((firstName1 == null && firstName2 != null) 
		|| (firstName1 != null && firstName2 == null))
	{
		return false;
	}
	if (firstName1 != null && !firstName1.equals(firstName2))
	{
		return false;
	}
	if ((lastName1 == null && lastName2 != null) 
		|| (lastName1 != null && lastName2 == null))
	{
		return false;
	}
	if (lastName1 != null && !lastName1.equals(lastName2))
	{
		return false;
	}
	if ((fullName1 == null && fullName2 != null)