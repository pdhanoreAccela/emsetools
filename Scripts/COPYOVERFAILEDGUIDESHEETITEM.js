/*------------------------------------------------------------------------------------------------------/
1. The CopyFailedGuideSheetItemsToRecord script supports the following use case:
1)Record 1 has an inspection with failed 5 guidesheet items. 
2)Based on the inspection result, 2 children records (A and B) are created (with EMSE),
each with a pending inspection and failed guidesheet items from Record 1. 

Child A 
Pending Inspection 
Failed GS Item 1, 2, 3 (from Parent Record 1) 

Child B 
Pending Inspection 
Failed GS Item 4,5 (from Parent Record 1) 


2. The CopyFailedGuideSheetItemsToRecord script support all of below events to make this script executed if the inspection is resulted:
1)V360InspectionResultSubmitAfter -- Result inspection.
2) InspectionResultModifyAfter -- Supervisor update inspection.
3)InspectionResultSubmitAfter -- Triggered by GovXML.
/------------------------------------------------------------------------------------------------------*/


/*------------------------------------------------------------------------------------------------------/
| <===========Prepare Parameters And Main Logic
/------------------------------------------------------------------------------------------------------*/
var error = "";
var message = "";
var br = "<br>";
var standardFieldName = "CaseType";
var isCheckGuideItemCarryOver = "Y";

//Trigger event InspectionResultModifyAfter or InspectionResultSubmitAfter.
var s_id1 = aa.env.getValue("PermitId1");
var s_id2 = aa.env.getValue("PermitId2");
var s_id3 = aa.env.getValue("PermitId3");
var oldCapID =  aa.cap.getCapID(s_id1, s_id2, s_id3).getOutput();
var oldInspectionID = aa.env.getValue("InspectionId");	
var currentUserID = aa.env.getValue("CurrentUserID");

//Copy the fail guideSheet items to the cap.
copyFailGuidesheetItemsToRecord(oldCapID, oldInspectionID, currentUserID, isCheckGuideItemCarryOver);



//Trigger event V360InspectionResultSubmitAfter.
/** var s_id1 = aa.env.getValue("PermitId1Array");
var s_id2 = aa.env.getValue("PermitId2Array");
var s_id3 = aa.env.getValue("PermitId3Array");
var inspIdArr = aa.env.getValue("InspectionIdArray");
var currentUserID = aa.env.getValue("CurrentUserId");

for (thisElement in s_id1)
{
    var oldCapID = aa.cap.getCapID(s_id1[thisElement], s_id2[thisElement], s_id3[thisElement]).getOutput();
	var oldInspectionID = inspIdArr[thisElement];

	//Copy the fail guideSheet items to the cap.
    copyFailGuidesheetItemsToRecord(oldCapID, oldInspectionID, currentUserID, isCheckGuideItemCarryOver);
} 
**/

if (error && error.length > 0)
{
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", error);
}
else
{
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", message);
}
aa.print(message);
aa.print(error);

/*------------------------------------------------------------------------------------------------------/
| <===========Main Function
/------------------------------------------------------------------------------------------------------*/
function copyFailGuidesheetItemsToRecord(capID, inspectionID, currentUserID, isCheckGuideItemCarryOver)
{
	//Get the failed guideSheetItem list from the inspection and cap.
	var failGuideSheetItemList = getFailGuideSheetItemList(capID,inspectionID,isCheckGuideItemCarryOver);

	//Get the guideSheetNumber list from the failed guideSheetItems.
	var failGuideSheetNumberList = getGuideSheetNumberList(failGuideSheetItemList);

	//Get the failed guideSheetItem Map according to failGuideSheetItems and failGuideSheetNumbers.
	var failGuideSheetItemMap = getGuideSheetItemMap(failGuideSheetNumberList,failGuideSheetItemList);

	//Get failed guideSheet list from the inspection and the failGuideSheetItemMap.
	var failGuideSheetList = getFailGuideSheetList(capID,inspectionID,failGuideSheetItemMap);

	//Get the recordTypeList according to the guideSheetItem ASI field value.
	var recordTypeList = getRecordTypeListFromGuideSheets(failGuideSheetList,standardFieldName);


	if(recordTypeList != null && recordTypeList.size() > 0)
	{
		for(var i = 0; i < recordTypeList.size(); i++)
		{
			var recordType = recordTypeList.get(i);

			//Create a new cap.
			var newCapID = createNewCap(recordType);

			//Get the InspSequenceNumber
			var inspSequenceNumber = getInspSequenceNumber(capID,inspectionID); 

			//Create a pending Inspection on the new cap.
			var newInspectionID = getPendingInspection(newCapID,inspSequenceNumber);

			//Get the GuideSheetModels according to the capType.
			var guideSheetModels = getGuideSheetListByCapType(failGuideSheetList,standardFieldName,recordType);

			//Copy failed guidesheet items to the new cap.
			var copyResult = aa.guidesheet.copyGGuideSheetItems(guideSheetModels, newCapID, newInspectionID, currentUserID);
			if (copyResult.getSuccess())
			{
				logMessage("Copy guideSheet items to cap successfully: " + newCapID );
			}
			else
			{
				logError("**ERROR copy guideSheet items to cap: " + copyResult.getErrorMessage());
			}	
			logMessage("*********************************************************************************");
		}
	}
}

/*------------------------------------------------------------------------------------------------------/
| <===========Helper Functions
/------------------------------------------------------------------------------------------------------*/
 // Get failed guideSheet item list from the inspection. 
function getFailGuideSheetItemList(capID, inspectionID, isCheckGuideItemCarryOver)
{
	var guideSheetItemList =  aa.util.newArrayList();
	var itemsResult = aa.guidesheet.getFailGGuideSheetItemsByCapIDAndInspID(capID, inspectionID, isCheckGuideItemCarryOver);
	if(itemsResult.getSuccess())
	{
	    guideSheetItemList = itemsResult.getOutput();
	}
	if(guideSheetItemList == null || guideSheetItemList.size() == 0)
	{
		logMessage("There is no failed guideSheetItems from the cap(" + capID + ") inspection(" + inspectionID +").");
	}
	return guideSheetItemList;
}

// Get the guideSheetNumbers from failed guideSheet Item list.
function getGuideSheetNumberList(gGuideSheetItemList)
{
	var guideSheetNumberList = aa.util.newArrayList();
	if(gGuideSheetItemList)
	{
		for(var i = 0; i < gGuideSheetItemList.size(); i++)
		{
			var gGuideSheetItemModel = gGuideSheetItemList.get(i);
			var guideSheetNumber = gGuideSheetItemModel.getGuidesheetSeqNbr();
			if(guideSheetNumber)
			{
				if(guideSheetNumberList.size() == 0)
				{
					guideSheetNumberList.add(guideSheetNumber);
				}
				else
				{
					if(!guideSheetNumberList.contains(guideSheetNumber))
					{
						guideSheetNumberList.add(guideSheetNumber);
					}
				}
			}		
		}
	}
	return guideSheetNumberList;
}

//Get the failed guideSheetItem Map<guideSheetNumber,guideSheetItemNumberList>.
function getGuideSheetItemMap(guideSheetNumberList,gGuideSheetItemList)
{
	var guideSheetItemMap = aa.util.newHashMap();
	if(guideSheetNumberList)
	{
		for(var i = 0; i < guideSheetNumberList.size(); i++)
		{
			var guideSheetItemNumberList = aa.util.newArrayList();
			var guideSheetNumber = guideSheetNumberList.get(i);		
			if(gGuideSheetItemList)
			{
				for(var k = 0; k < gGuideSheetItemList.size(); k++)
				{
					var gGuideSheetItemModel = gGuideSheetItemList.get(k);
					if(Number(guideSheetNumber) == gGuideSheetItemModel.getGuidesheetSeqNbr())
					{
						guideSheetItemNumberList.add(gGuideSheetItemModel.getGuideItemSeqNbr());
					}
				}		
			}
			if(guideSheetItemNumberList.size() > 0)
			{
				guideSheetItemMap.put(guideSheetNumber,guideSheetItemNumberList);
			}								
		}  
	}
	return guideSheetItemMap;
}

//Get failed guideSheets from the inspection and the guideSheetItemMap.
function getFailGuideSheetList(capID,inspectionID,guideSheetItemMap)
{
	var guideSheetList =  aa.util.newArrayList();
	var itemsResult = aa.inspection.getInspections(capID);
	if(itemsResult.getSuccess() && guideSheetItemMap != null && guideSheetItemMap.size() > 0)
	{
		var inspectionScriptModels = itemsResult.getOutput();
		for(var k in inspectionScriptModels)
		{
			if (inspectionScriptModels[k].getIdNumber() == inspectionID)
			{
				var inspectionModel = inspectionScriptModels[k].getInspection();
				var gGuideSheetModels = inspectionModel.getGuideSheets();
				if(gGuideSheetModels)
				{
					for(var i = 0; i < gGuideSheetModels.size(); i++)
					{
						var guideSheetItemList = aa.util.newArrayList();
						var gGuideSheetModel = gGuideSheetModels.get(i);
                        var guideSheetNumber = gGuideSheetModel.getGuidesheetSeqNbr();
						if(guideSheetItemMap.containsKey(guideSheetNumber))
						{
							var guideSheetItemNumberList = guideSheetItemMap.get(guideSheetNumber);
							var gGuideSheetItemModels = gGuideSheetModel.getItems();
							if(gGuideSheetItemModels)
							{
								for(var j = 0; j < gGuideSheetItemModels.size(); j++)
								{
									var gGuideSheetItemModel = gGuideSheetItemModels.get(j);
									var guideSheetItemNumber = gGuideSheetItemModel.getGuideItemSeqNbr();
									if(guideSheetItemNumberList.contains(guideSheetItemNumber))
									{
										guideSheetItemList.add(gGuideSheetItemModel);
									}	
								}						
							}			
						}		
						if(guideSheetItemList.size() > 0)
						{
							var gGuideSheet = gGuideSheetModel.clone();
							gGuideSheet.setItems(guideSheetItemList);
							guideSheetList.add(gGuideSheet);
						}						
					}
				}
				else
				{
					logMessage("There is no guideSheets from this inspection: " + inspectionID);
				}
			}
		}
	}
	return guideSheetList;
}

//Get the capTypeList  according to the guideSheetItem ASI field.
function getRecordTypeListFromGuideSheets(guideSheetList,standardFieldName)
{	
	var recordTypeList = aa.util.newArrayList();
	if(guideSheetList)
	{
		for(var i = 0; i < guideSheetList.size(); i++)
		{
			var gGuideSheetModel = guideSheetList.get(i);
			var gGuideSheetItemList = gGuideSheetModel.getItems();
			if(gGuideSheetItemList)
			{
				for(var j = 0; j < gGuideSheetItemList.size(); j++)
				{
					var gGuideSheetItemModel = gGuideSheetItemList.get(j);
					var gGSItemASISubGroupList = gGuideSheetItemModel.getItemASISubgroupList();
					if(gGSItemASISubGroupList)
					{
						for(var k = 0; k < gGSItemASISubGroupList.size(); k++)
						{
							var gGSItemASISubGroupModel = gGSItemASISubGroupList.get(k);
							var gGSItemASIList = gGSItemASISubGroupModel.getAsiList();
							if(gGSItemASIList)
							{
								for(var l = 0; l < gGSItemASIList.size(); l++)
								{
									var gGSItemASIModel = gGSItemASIList.get(l);
									if(String(standardFieldName) == gGSItemASIModel.getAsiName())
									{	
										var attributeValue = gGSItemASIModel.getAttributeValue();
										if(attributeValue)
										{
											if(recordTypeList.size() == 0)
											{
												recordTypeList.add(attributeValue);
											}
											else
											{
												if(!recordTypeList.contains(attributeValue))
												{
													recordTypeList.add(attributeValue);
												}
											}
										}													
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return recordTypeList;
}

//create a new cap
function createNewCap(capType)
{
	var capIDModel = null;
	if(capType)
	{
		var capTypeArray = capType.split("/");
		if(capTypeArray.length == 4)
		{
			var appCreateResult = aa.cap.createApp(capTypeArray[0], capTypeArray[1], capTypeArray[2], capTypeArray[3], null);
			if(appCreateResult.getSuccess())
			{
				capIDModel = appCreateResult.getOutput();
				logMessage("Create new CAP Successfully: " + capIDModel);
			}
			else
			{
				logError("**ERROR creating new CAP: " + appCreateResult.getErrorMessage());
			}
		}
		else
		{
			logError("**ERROR in create new CAP. The Cap Type is incorrectly formatted: " + capType);
		}
	}
	return capIDModel;
}

//get the InspSequenceNumber
function getInspSequenceNumber(capID,inspectionID)
{	
	var inspSequenceNumber = null;
	var inspectionResult = aa.inspection.getInspection(capID,inspectionID);
	if(inspectionResult.getSuccess())
	{
	    var inspectionModel = inspectionResult.getOutput().getInspection();	
		var inspectionGroup = inspectionModel.getActivity().getInspectionGroup();
		var inspectionType  = inspectionModel.getInspectionType();
		var inspectionTypesResult = aa.inspection.getInspectionType(inspectionGroup,inspectionType);	
		if (inspectionTypesResult.getSuccess())
		{
			var inspectionTypes = inspectionTypesResult.getOutput();
			if (inspectionTypes)
			{
				for (var i in inspectionTypes)
				{
					var inspectionTypeModel = inspectionTypes[i];
					if (inspectionTypeModel.getGroupCode().toUpperCase().equals(inspectionGroup.toUpperCase()) 
						&& inspectionTypeModel.getType().toUpperCase().equals(inspectionType.toUpperCase()))
					{
						inspSequenceNumber = inspectionTypeModel.getSequenceNumber();
					}
				}
			}
		}
		else
		{
			logError("**ERROR retrieving inspection Type " + inspectionTypesResult.getErrorMessage());
		}
	}
	return inspSequenceNumber;
}


//creat a new pending inspection
function getPendingInspection(capID,inspSequenceNumber)
{
	var newInspectionID = null;
    var inspectionModel = aa.inspection.getInspectionScriptModel().getOutput().getInspection();
	var activityModel = inspectionModel.getActivity();
	activityModel.setCapIDModel(capID);
	activityModel.setInspSequenceNumber(inspSequenceNumber);
	   
	var pendingResult = aa.inspection.pendingInspection(inspectionModel);
	if (pendingResult.getSuccess())
	{
		newInspectionID = pendingResult.getOutput();
		logMessage("Create pending inspection successfully: " + newInspectionID);
	}
	else
	{
		logError("**ERROR create pending inspection: " + pendingResult.getErrorMessage());
	}
	return newInspectionID;
}


//Get the GuideSheetModels according to the capType.
function getGuideSheetListByCapType(guideSheetModels,standardFieldName,capType)
{	
	var guideSheetList = aa.util.newArrayList();
	if(guideSheetModels)
	{
		for(var i = 0; i < guideSheetModels.size(); i++)
		{
			var guideSheetItemList = aa.util.newArrayList();
			var gGuideSheetModel = guideSheetModels.get(i);
			var gGuideSheetItemModels = gGuideSheetModel.getItems();
			if(gGuideSheetItemModels)
			{
				for(var j = 0; j < gGuideSheetItemModels.size(); j++)
				{
					var findCaseType = false;
					var gGuideSheetItemModel = gGuideSheetItemModels.get(j);
					var gGSItemASISubGroupModels = gGuideSheetItemModel.getItemASISubgroupList();
					if(gGSItemASISubGroupModels)
					{
						for(var k = 0; k < gGSItemASISubGroupModels.size(); k++)
						{				
							var gGSItemASISubGroupModel = gGSItemASISubGroupModels.get(k);
							var gGSItemASIModels = gGSItemASISubGroupModel.getAsiList();
							if(gGSItemASIModels)
							{
								for(var l = 0; l < gGSItemASIModels.size(); l++)
								{
									var gGSItemASIModel = gGSItemASIModels.get(l);
									var asiName = gGSItemASIModel.getAsiName();
									var attributeValue = gGSItemASIModel.getAttributeValue();
									if(String(standardFieldName) == asiName && String(capType) == attributeValue)
									{	
										findCaseType = true;
										break;
									}
								}								
							}
							if(findCaseType)
							{
								break;
							}	
						}							
					}
					if(findCaseType)
					{
						guideSheetItemList.add(gGuideSheetItemModel);
					}										
				}
				if(guideSheetItemList.size() > 0)
				{   
					var gGuideSheet = gGuideSheetModel.clone();
					gGuideSheet.setItems(guideSheetItemList);
					guideSheetList.add(gGuideSheet);
				}	
			}		
		}
	}
	return guideSheetList;
}


function logError(str)
{
	error += str + br;
}

function logMessage(str)
{
	message += str + br;
}
