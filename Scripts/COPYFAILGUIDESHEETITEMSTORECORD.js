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
var debug = "";
var br = "<br>";
var standardFieldName = "CaseType";

/**
 * When the current inspection copy fail guidesheetItem to another inspection via V360,
 * change the current inspection fail guidesheetItem GUIDE_ITEM_CARRY_OVER_FLAG='N',
 * however the fail guidesheetItem GUIDE_ITEM_CARRY_OVER_FLAG original value via configurating on classic admin.
 * Then running the CopyFailedGuideSheetItemsToRecord script will failed on the current inspection. 
 *
 * So the script whether to check the failed guidesheetItem carryOverFlag value via the variable isCheckGuideItemCarryOverFlag value.
 * 1. If isCheckGuideItemCarryOverFlag is true, check the failed guidesheetItem carryOverFlag value in inspection.
 * 2. If isCheckGuideItemCarryOverFlag is false, don't check the failed guidesheetItem carryOverFlag value in inspection.
 */
var isCheckGuideItemCarryOverFlag = true;

//Trigger event InspectionResultModifyAfter or InspectionResultSubmitAfter.
var s_id1 = aa.env.getValue("PermitId1");
var s_id2 = aa.env.getValue("PermitId2");
var s_id3 = aa.env.getValue("PermitId3");
var oldCapID =  aa.cap.getCapID(s_id1, s_id2, s_id3).getOutput();
var oldInspectionID = aa.env.getValue("InspectionId");	
var currentUserID = aa.env.getValue("CurrentUserID");

//Copy the fail guideSheet items to the cap.
copyFailGuidesheetItemsToRecord(oldCapID, oldInspectionID, currentUserID, isCheckGuideItemCarryOverFlag);



//Trigger event V360InspectionResultSubmitAfter.
/** var s_id1 = aa.env.getValue("PermitId1Array");
var s_id2 = aa.env.getValue("PermitId2Array");
var s_id3 = aa.env.getValue("PermitId3Array");
var inspIdArr = aa.env.getValue("InspectionIdArray");
var currentUserID = aa.env.getValue("CurrentUserID");

for (thisElement in s_id1)
{
    var oldCapID = aa.cap.getCapID(s_id1[thisElement], s_id2[thisElement], s_id3[thisElement]).getOutput();
	var oldInspectionID = inspIdArr[thisElement];

	//Copy the fail guideSheet items to the cap.
    copyFailGuidesheetItemsToRecord(oldCapID, oldInspectionID, currentUserID, isCheckGuideItemCarryOverFlag);
} **/

if (debug.indexOf("**ERROR") > 0)
{
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", debug);
}
else
{
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", debug);
}
aa.print(debug);

/*------------------------------------------------------------------------------------------------------/
| <===========Main Function
/------------------------------------------------------------------------------------------------------*/
function copyFailGuidesheetItemsToRecord(capID, inspectionID, currentUserID, isCheckGuideItemCarryOverFlag)
{
	//Get the failed guideSheetItem list from the inspection and cap.
	var failGuideSheetItemList = getFailGuideSheetItemList(capID,inspectionID,isCheckGuideItemCarryOverFlag);

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
			var newCapID = createChildRecord(capID, recordType);

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
				logDebug("Successfully copy guideSheet items to cap : " + newCapID );
			}
			else
			{
				logDebug("Failed copy guideSheet items to cap: " + copyResult.getErrorMessage());
			}	
			logDebug("*********************************************************************************");
		}
	}
}

/*------------------------------------------------------------------------------------------------------/
| <===========Helper Functions
/------------------------------------------------------------------------------------------------------*/
 // Get failed guideSheet item list from the inspection. 
function getFailGuideSheetItemList(capID, inspectionID, isCheckGuideItemCarryOverFlag)
{
	var guideSheetItemList =  aa.util.newArrayList();
	var itemsResult = aa.guidesheet.getFailGGuideSheetItemsByCapIDAndInspID(capID, inspectionID, isCheckGuideItemCarryOverFlag);
	if(itemsResult.getSuccess())
	{
	    guideSheetItemList = itemsResult.getOutput();
	}
	if(guideSheetItemList == null || guideSheetItemList.size() == 0)
	{
		logDebug("There is no failed guideSheetItems from the cap(" + capID + ") inspection(" + inspectionID +").");
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
					logDebug("There is no guideSheets from this inspection: " + inspectionID);
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

//create a child record 
function createChildRecord(parentRecordID, recordType)
{
	var newRecordID = null;
	if(recordType)
	{
		var recordTypeArray = recordType.split("/");
		if(recordTypeArray.length == 4)
		{
			var appCreateResult = aa.cap.createApp(recordTypeArray[0], recordTypeArray[1], recordTypeArray[2], recordTypeArray[3], null);
			if(appCreateResult.getSuccess())
			{
				newRecordID = appCreateResult.getOutput();			
				// create Detail Record
				capModel = aa.cap.newCapScriptModel().getOutput();
				capDetailModel = capModel.getCapModel().getCapDetailModel();
				capDetailModel.setCapID(newRecordID);
				aa.cap.createCapDetail(capDetailModel);

				//Child record linked parent record
				var linkResult = aa.cap.createAppHierarchy(parentRecordID, newRecordID); 
				if (linkResult.getSuccess())
				{
					// Copy Parcels
					var recordParcelResult = aa.parcel.getParcelandAttribute(parentRecordID,null);
					if (recordParcelResult.getSuccess())
					{
						var parcels = recordParcelResult.getOutput().toArray();
						for(var i in parcels)
						{		
							var newParcel = aa.parcel.getCapParcelModel().getOutput();
							newParcel.setParcelModel(parcels[i]);
							newParcel.setCapIDModel(newRecordID);
							newParcel.setL1ParcelNo(parcels[i].getParcelNumber());
							newParcel.setParcelNo(parcels[i].getParcelNumber());
							aa.parcel.createCapParcel(newParcel);
						}
					}

					// Copy Contacts
					recordContactResult = aa.people.getCapContactByCapID(parentRecordID);
					if (recordContactResult.getSuccess())
					{
						var contacts = recordContactResult.getOutput();
						for(var j in contacts)
						{
							var newContact = contacts[j].getCapContactModel();
							newContact.setCapID(newRecordID);
							aa.people.createCapContact(newContact);
						}
					}	

					// Copy Addresses
					recordAddressResult = aa.address.getAddressByCapId(parentRecordID);
					if (recordAddressResult.getSuccess())
					{
						var address = recordAddressResult.getOutput();
						for(var k in address)
						{
							var newAddress = address[k];
							newAddress.setCapID(newRecordID);
							aa.address.createAddress(newAddress);
						}
					}
					logDebug("Successfully create child record : " + newRecordID);
				}
				else
				{
					logDebug("Failed link new record: " + linkResult.getErrorMessage());
				}
				
			}
			else
			{
				logDebug("Failed creating new record: " + appCreateResult.getErrorMessage());
			}
		}
		else
		{
			logDebug("Failed create child record. The Record Type is incorrectly formatted: " + recordType);
		}
	}
	return newRecordID;
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
			logDebug("Failed retrieving inspection Type: " + inspectionTypesResult.getErrorMessage());
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
		logDebug("Successfully create pending inspection: " + newInspectionID);
	}
	else
	{
		logDebug("Failed create pending inspection: " + pendingResult.getErrorMessage());
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


function logDebug(str)
{
	debug += str + br;
}