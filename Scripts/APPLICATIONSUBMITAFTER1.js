/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be 
|	    available to all master scripts
|
| Notes   :  
| Revision: 2/19/2014 	Hisham ElFangary	Added executeCheckInAfterSubmit() function
| Revision: 2/20/2014 	Hisham ElFangary	Added executeCheckOutAfterSubmit() function
| Revision: 2/23/2014 	Hisham ElFangary	Added editOccupancyASIT(capIDModel) function 
| Revision: 2/27/2014 	Hisham ElFangary	Added executeCheckInAfterSubmitACA() function   
| 						Hisham ElFangary	Added executeCheckOutAfterSubmitACA() function   
| Revision: 3/04/2014 	Hisham ElFangary	Updated createRoom() function to support Web Service calls (to Retreive Lic Prof from CapId if no online Public User)
| Revision: 3/06/2014 	Hisham ElFangary	Added executeCheckInAfterSubmitAA() function   
| 						Hisham ElFangary	Added executeCheckOutAfterSubmitAA() function   
| Revision: 3/09/2014 	Hisham ElFangary	Modified createRoom() function to update Unit Number & Bedrooms  
/------------------------------------------------------------------------------------------------------*/

/***** Associated Forms  **********/
function createChildCapsByASITableValues()
{
	var relationshipBizDomain = aa.bizDomain.getBizDomainByValue("ACA_CONFIGS",
	"ASSOCIATED_FORMS_ASIT_RELATIONSHIP_FIELD").getOutput();
	
	if (relationshipBizDomain == null
			|| relationshipBizDomain.getDescription() == null
			|| relationshipBizDomain.getDescription().length() <= 0) 
	{
		return;
	}
	
	var recordID1 = aa.env.getValue("PermitId1");
	var recordID2 = aa.env.getValue("PermitId2");
	var recordID3 = aa.env.getValue("PermitId3");

	if (recordID1 == null || recordID2 == null && recordID3 == null)
	{
		return;
	}
	
	var parentRecordID = aa.cap.createCapIDScriptModel(recordID1, recordID2, recordID3)
			.getCapID();
	
	if (parentRecordID == null)
	{
		return;
	}
	
	// This value is the ASITable column name which indicates Associated Forms's Record Type.
	var columnNameRecordType = "Permit Type";
	
	// Key of AssociatedForms.
	var associatedFormsFlag = "AssoForm";
	
	var capScriptModels = aa.cap.getProjectByChildCapID(parentRecordID, associatedFormsFlag, null).getOutput();

	if (capScriptModels != null && capScriptModels.length > 0 )
	{
		// Child Record can not create its child Records.
		return;
	}
	
	var asitgroupModel = aa.env.getValue("AppSpecificTableGroupModel");
	var addressModel = getAddress4AssociatedForms(parentRecordID);
	var parcelModel = getParcel4AssociatedForms(parentRecordID);
	var ownerModel = getOwner4AssociatedForms(parentRecordID);

	if (asitgroupModel != null && asitgroupModel != "") 
	{
		var availableRecordTypeList = null;
		var asitableMap = asitgroupModel.getTablesMap();
		if (asitableMap != null && asitableMap.size() > 0) 
		{
			var availableRecordTypesMap = getAllRecordTypes();

			var existingChildRecordsMap = getExistingChildsMap(parentRecordID,
					associatedFormsFlag);

			deleteHierarchyByASITableValue(asitableMap, availableRecordTypesMap, columnNameRecordType, parentRecordID,
					addressModel, parcelModel, ownerModel,
					existingChildRecordsMap);

			createChildRecordsFromASITableMap(asitableMap, availableRecordTypesMap, columnNameRecordType, parentRecordID,
					addressModel, parcelModel, ownerModel,
					existingChildRecordsMap, associatedFormsFlag);

		}
	}
}

/**
 * Get all Record Type from Database.
 */
function getAllRecordTypes() 
{
	var allRecordTypeMap = aa.util.newHashMap();
	var allRecordTypes = aa.cap.getCapTypeList(null).getOutput();
	if (allRecordTypes != null && allRecordTypes.length > 0) 
	{
		for ( var i = 0; i < allRecordTypes.length; i++) 
		{
			var recordType = allRecordTypes[i].getCapType();
			var alias = recordType.getAlias();
			allRecordTypeMap.put(alias, recordType);
		}
	}
	return allRecordTypeMap;
}

/**
 * Delete hierarchy by ASI Table value.
 */ 
function deleteHierarchyByASITableValue(asitableMap, availableRecordTypesMap, columnNameRecordType, parentRecordID, addressModel, parcelModel, ownerModel, existingChildRecordsMap)
{
	var valueIterator = asitableMap.values().iterator();
	var newRelationshipIDMap = aa.util.newHashMap();
	
	while (valueIterator.hasNext())
	{
		var tsm = valueIterator.next();
		if (tsm == null || tsm.getTableFields() == null || tsm.getColumns() == null)
		{
			continue;
		}
		
		// Define ASI Table's column name for Record type
		var recordTypeColumnNameList = aa.util.newArrayList();
		var relationshipBizDomain = aa.bizDomain.getBizDomainByValue("ACA_CONFIGS",
		"ASSOCIATED_FORMS_ASIT_RELATIONSHIP_FIELD").getOutput();
		var columnNameRelationshipID = relationshipBizDomain.getDescription();
		
		recordTypeColumnNameList.add(columnNameRecordType);
		recordTypeColumnNameList.add(columnNameRelationshipID);
		
		// Get the Form's ASI Table value data. 
		var newTempRelationshipIDMap = getNewRelationshipIDs(tsm, recordTypeColumnNameList, availableRecordTypesMap);

		if (newTempRelationshipIDMap != null && newTempRelationshipIDMap.size() > 0)
		{
			newRelationshipIDMap.putAll(newTempRelationshipIDMap);
		}
	}
	
	// Get Record IDs which need to be deleted.
	var deleteRecordIDs = getNeedDeleteRecordIDs(newRelationshipIDMap, existingChildRecordsMap);
	
	// Do delete them.
	deleteAssociatedFormHierarchy(deleteRecordIDs, parentRecordID);
	
	// Get Record IDs which need to be updated(APO information).
	var updateRecordIDs = getNeedUpdateRecordIDs(newRelationshipIDMap, existingChildRecordsMap);
	
	// Do update these Records APO information.
	updateAssociatedFormRecord(updateRecordIDs, parentRecordID, addressModel, parcelModel, ownerModel);
}

/**
 * Get form's ASI Table value data. 
 */ 
function getNewRelationshipIDs(asitModel, columnNameList, availableRecordTypesMap)
{
	var newRelationshipIDMap = aa.util.newHashMap();
	var fields = asitModel.getTableFields();
	var columns = asitModel.getColumns();
	var asitColumnNames = aa.util.newArrayList();
	for (var k = 0; k < columns.size(); k++)
	{
		if (columns.get(k) != null)
		{
			asitColumnNames.add(columns.get(k).getColumnName());
		}
	}
	
	if (asitColumnNames != null && asitColumnNames.size() >= columnNameList.size()
		&& asitColumnNames.contains(columnNameList.get(0))
		&& asitColumnNames.contains(columnNameList.get(1))
		) 
	{
		var rowIndexArray = getASITableRowIndexArray(fields);
		var recordTypeArray = aa.util.newArrayList();
		
		for (var ii = 0; ii < rowIndexArray.size(); ii++)
		{
			var rowIndexValue = rowIndexArray.get(ii);
			var currentRecordTypeValue = null;
			var currentRelationshipIDValue = null;
			
			for (var j = 0; j < fields.size(); j++)
			{
				if (rowIndexValue.equals(fields.get(j).getRowIndex()))
				{
					var label = fields.get(j).getFieldLabel();
					var value = fields.get(j).getInputValue();
					
					if (columnNameList.get(0).equals(label) 
							&& (value == null || value.equals("")))
					{
						break;
					}
					if (columnNameList.get(0).equals(label))
					{
						currentRecordTypeValue = value;
					}
					if (columnNameList.get(1).equals(label) && value != null && !value.equals(""))
					{
						currentRelationshipIDValue = value;
					}
				}
			}
			
			if (availableRecordTypesMap == null
				|| !availableRecordTypesMap.containsKey(currentRecordTypeValue)
				|| availableRecordTypesMap.get(currentRecordTypeValue) == null) 
			{
				continue;
			}
			
			if (currentRelationshipIDValue != null && currentRelationshipIDValue != "")
			{
				// This child Record has been created.
				newRelationshipIDMap.put(currentRecordTypeValue + "||"+ currentRelationshipIDValue, currentRecordTypeValue + "||"+ currentRelationshipIDValue);
				aa.print("PageData : " + currentRecordTypeValue + "||"+ currentRelationshipIDValue);
			}
		}
	}
	
	return newRelationshipIDMap;
}

/**
 * Get the existing Child Records by the relationship "AssoForm".
 */ 
function getExistingChildsMap(parentRecordID, associatedFormsFlag)
{
	var capScriptModels = aa.cap.getChildByMasterID(parentRecordID).getOutput();
	var existingRapTypeAndIDMap = aa.util.newHashMap();
	if (capScriptModels == null || capScriptModels.length <= 0 )
	{
		return null;
	}
	for (var i= 0; i< capScriptModels.length; i++)
	{
	      var capScriptModel = capScriptModels[i];
	      if (capScriptModel != null)
	      {
		  var project = capScriptModel.getProjectModel();
		  if (capScriptModel.getCapID()!= null && project != null && project.getProject() != null 
				  && associatedFormsFlag.equals(project.getProject().getRelationShip()))
		  {
			  existingRapTypeAndIDMap.put(capScriptModel.getCapType().getAlias() + "||" + capScriptModel.getCapID().toKey(), capScriptModel.getCapID());
			  aa.print("Existing : " + capScriptModel.getCapType().getAlias() + "||" + capScriptModel.getCapID().toKey());
		  }
	      }
	}

	return existingRapTypeAndIDMap;
}

/**
 * Get Record IDs which need to be deleted.
 */ 
function getNeedDeleteRecordIDs(newIDMap, existingIDMap)
{
	var recordIdList = aa.util.newArrayList();

	if (existingIDMap == null || existingIDMap.size() <= 0)
	{
		// need not delete.
		return null;
	}
	
	var existingIterator = existingIDMap.keySet().iterator();
	while(existingIterator.hasNext())
	{
		var needDeleteFlag = true;
		var key = existingIterator.next();
		if (key != null && newIDMap != null && newIDMap.containsKey(key))
		{
			needDeleteFlag = false;
		}
		
		if (needDeleteFlag)
		{
			recordIdList.add(existingIDMap.get(key));
		}
	}
	
	return recordIdList;
}

/**
 * Get Record IDs which need to be updated.
 */ 
function getNeedUpdateRecordIDs(newIDMap, existingIDMap)
{
	if (newIDMap == null || newIDMap.size() <= 0 || existingIDMap == null || existingIDMap.size() <= 0)
	{
		// need not update.
		return null;
	}
	var recordIdList = aa.util.newArrayList();
	
	var existingIterator = existingIDMap.keySet().iterator();
	while(existingIterator.hasNext())
	{
		var key = existingIterator.next();
		if (key != null && newIDMap.containsKey(key))
		{
			recordIdList.add(existingIDMap.get(key));
		}
	}
	
	return recordIdList;
}

/**
 * Delete Records hierarchy.
 */ 
function deleteAssociatedFormHierarchy(recordIDs, projectID)
{
	if (recordIDs != null && recordIDs.size() > 0)
	{
		for (var i = 0; i < recordIDs.size(); i++)
		{
			var recordID = recordIDs.get(i);
			if (recordID == null)
			{
				continue;
			}
			
			aa.print("Delete Record hierarchy : " + recordID.toKey());
			// remove hierarchy.
			aa.cap.removeAppHierarchy(projectID, recordID);
		}
	}
}

/**
 * Update Records(APO information).
 */ 
function updateAssociatedFormRecord(recordIDs, parentIDModel, addressModel, parcelModel, ownerModel)
{
	if (recordIDs != null && recordIDs.size() > 0)
	{
		for (var i = 0; i < recordIDs.size(); i++)
		{
			var capIDModel = recordIDs.get(i);
			if (capIDModel == null)
			{
				continue;
			}
	
			aa.print("Update Record's APO : " + capIDModel.toKey());
			if (addressModel != null) 
			{
				var oldAddresses = aa.address.getAddressByCapId(capIDModel, null).getOutput();
				if (oldAddresses != null && oldAddresses.length > 0 && oldAddresses[0] != null)
				{
					addressModel.setCapID(capIDModel);
					addressModel.setAddressId(oldAddresses[0].getAddressId());
					aa.address.editAddressWithAPOAttribute(capIDModel, addressModel);
				}
				else
				{
					var aResult = aa.address.createAddressWithAPOAttribute(capIDModel,
							addressModel).getOutput();
				}
			}

			if (parcelModel != null) 
			{
				var capParcelModel = aa.parcel.getCapParcelModel().getOutput();
				parcelModel.setCapID(capIDModel);
				capParcelModel.setParcelModel(parcelModel);
				capParcelModel.setParcelNo(parcelModel.getParcelNumber());
				capParcelModel.setCapIDModel(capIDModel);
				
				var oldParcels = aa.parcel.getParcelDailyByCapID(capIDModel, null).getOutput();
				if (oldParcels != null && oldParcels.length > 0 && oldParcels[0] != null)
				{
					capParcelModel.setParcelNo(oldParcels[0].getParcelNumber());
					aa.parcel.updateDailyParcelWithAPOAttribute(capParcelModel);
				}
				else
				{
					aa.parcel.createCapParcelWithAPOAttribute(capParcelModel).getOutput();
				}
			}

			if (ownerModel != null) 
			{
				ownerModel.setCapID(capIDModel);
				var childOwners = aa.owner.getOwnerByCapId(capIDModel).getOutput();
				if (childOwners != null && childOwners.length > 0 && childOwners[0] != null) 
				{
					ownerModel.setCapOwnerNumber(childOwners[0].getCapOwnerNumber());
					aa.owner.updateDailyOwnerWithAPOAttribute(ownerModel);
				}
				else
				{
					aa.owner.createCapOwnerWithAPOAttribute(ownerModel);
				}
			}
		}
	}
}

/**
 * Create Child Records.
 */ 
function createChildRecordsFromASITableMap(asitableMap, availableRecordTypesMap, columnNameRecordType, parentRecordID, addressModel, parcelModel, ownerModel, existingChildRecordsMap, associatedFormsFlag)
{
	var valueIterator = asitableMap.values().iterator();
	
	while (valueIterator.hasNext())
	{
		var tsm = valueIterator.next();
		if (tsm == null || tsm.getTableFields() == null || tsm.getColumns() == null)
		{
			continue;
		}
		
		// Define ASI Table's column name for Record type
		var recordTypeColumnNameList = aa.util.newArrayList();
		var relationshipBizDomain = aa.bizDomain.getBizDomainByValue("ACA_CONFIGS",
		"ASSOCIATED_FORMS_ASIT_RELATIONSHIP_FIELD").getOutput();
		var columnNameRelationshipID = relationshipBizDomain.getDescription();

		recordTypeColumnNameList.add(columnNameRecordType);
		recordTypeColumnNameList.add(columnNameRelationshipID);
		
		var recordTypes = getRecordTypeListFromASITableModel(tsm, recordTypeColumnNameList, availableRecordTypesMap, existingChildRecordsMap);
		
		createChildRecordsByInfo(recordTypes, parentRecordID, tsm, recordTypeColumnNameList, addressModel, parcelModel, ownerModel, associatedFormsFlag);
	}
}

/**
 * Get Record Type list from ASI Table model.
 */ 
function getRecordTypeListFromASITableModel(asitModel, columnNameList, availableRecordTypesMap, existingChildRecordsMap)
{
	var recordTypeList = aa.util.newArrayList();
	var fields = asitModel.getTableFields();
	var columns = asitModel.getColumns();
	var asitColumnNames = aa.util.newArrayList();
	for (var k = 0; k < columns.size(); k++)
	{
		if (columns.get(k) != null)
		{
			asitColumnNames.add(columns.get(k).getColumnName());
		}
	}
	
	if (asitColumnNames != null && asitColumnNames.size() >= columnNameList.size()
		&& asitColumnNames.contains(columnNameList.get(0))
		&& asitColumnNames.contains(columnNameList.get(1))
		) 
	{
		recordTypeList = getRecordTypeListFromASITableFields(fields, columnNameList, availableRecordTypesMap, existingChildRecordsMap);
	}
	
	return recordTypeList;
}

/**
 * Get ASI Table row index array from Fields.
 */
function getASITableRowIndexArray(fields)
{
	var rowIndexArray = aa.util.newArrayList();
	for (var j = 0; j < fields.size(); j++)
	{
		if (!rowIndexArray.contains(fields.get(j).getRowIndex()))
		{
			rowIndexArray.add(fields.get(j).getRowIndex());
		}
	}
	return rowIndexArray;
}

/**
 * Create Record Type instance.
 */ 
function getRecordTypeInstance(group, type, subType, category)
{
	var capTypeModelResult = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.CapTypeModel");
	var capTypeModel = capTypeModelResult.getOutput();
	capTypeModel.setGroup(group);
	capTypeModel.setType(type);
	capTypeModel.setSubType(subType);
	capTypeModel.setCategory(category);
	
	return capTypeModel;
}

/**
 * Get Record Type list from ASI Table Fields.
 */ 
function getRecordTypeListFromASITableFields(fields, columnNameList, availableRecordTypesMap, existingChildRecordsMap)
{
	var rowIndexArray = getASITableRowIndexArray(fields);
	var recordTypeArray = aa.util.newArrayList();
	var existingRelationshipIDValues = aa.util.newArrayList();
	for (var ii = 0; ii < rowIndexArray.size(); ii++)
	{
		var rowIndexValue = rowIndexArray.get(ii);
		var currentRecordTypeValue = null;
		var currentRelationshipIDValue = null;
		
		for (var j = 0; j < fields.size(); j++)
		{
			if (rowIndexValue.equals(fields.get(j).getRowIndex()))
			{
				var label = fields.get(j).getFieldLabel();
				var value = fields.get(j).getInputValue();
				
				if (columnNameList.get(0).equals(label)
						&& (value == null || value.equals("")))
				{
					break;
				}
				
				if (columnNameList.get(0).equals(label))
				{
					currentRecordTypeValue = value;
				}
				if (columnNameList.get(1).equals(label) && value != null && !value.equals(""))
				{
					currentRelationshipIDValue = value;
				}
			}
		}
		if (availableRecordTypesMap == null
				|| !availableRecordTypesMap.containsKey(currentRecordTypeValue)
				|| availableRecordTypesMap.get(currentRecordTypeValue) == null) 
		{
			continue;
		}
		
		if (currentRelationshipIDValue != null
				&& currentRelationshipIDValue != ""
				&& existingChildRecordsMap != null
				&& existingChildRecordsMap.size() > 0
				&& existingChildRecordsMap.containsKey(currentRecordTypeValue
						+ "||" + currentRelationshipIDValue)) {
			continue;
		}
		
		var recordType = availableRecordTypesMap.get(currentRecordTypeValue);

		
		if (recordTypeArray != null && recordTypeArray.size() == 2)
		{
			recordTypeArray.get(0).add(recordType);
			recordTypeArray.get(1).add(rowIndexValue);
		}
		else 
		{
			var recordTypes = aa.util.newArrayList();
			recordTypes.add(recordType);
			var rowIndexValues = aa.util.newArrayList();
			rowIndexValues.add(rowIndexValue);
			
			recordTypeArray.add(recordTypes);
			recordTypeArray.add(rowIndexValues);
		}
	}
	
	return recordTypeArray;
}

/**
 * Create Child Records and their APO information.
 */
function createChildRecordsByInfo(recordTypes, parentRecordID, asitModel, columnNameList, addressModel, parcelModel, ownerModel, associatedFormsFlag)
{
	if (recordTypes != null && recordTypes.size() == 2)
	{
		var capTypeArrayList = recordTypes.get(0);
		var rowIndexValueArrayList = recordTypes.get(1);
		
		if (capTypeArrayList != null && capTypeArrayList.size() > 0 && rowIndexValueArrayList != null && rowIndexValueArrayList.size() > 0 && capTypeArrayList.size() == rowIndexValueArrayList.size())
		{
			for (var i = 0; i < capTypeArrayList.size(); i++)
			{
				var recordType = capTypeArrayList.get(i);
				aa.print("Create Record Type("+(i+1)+"): " + recordType.getGroup() + "/" + recordType.getType() + "/" + recordType.getSubType() + "/" + recordType.getCategory());
				
				var createdCapID = createRecordWithAPO(recordType, parentRecordID, addressModel, parcelModel, ownerModel, associatedFormsFlag);
                                if (createdCapID == null)
                                {
        	                        continue;
                                }
				var rowIndexValue = rowIndexValueArrayList.get(i);
				var fields = asitModel.getTableFields();
				var fieldValues = aa.util.newArrayList();
				
				for (var j = 0; j < fields.size(); j++)
				{
					if (rowIndexValue.equals(fields.get(j).getRowIndex()) && columnNameList.get(1).equals(fields.get(j).getFieldLabel()))
					{
						fields.get(j).setInputValue(createdCapID.toKey());
						aa.print("UpdateField: " + fields.get(j).getInputValue());
					}
					fieldValues.add(fields.get(j).getInputValue());
				}

				// Update ASI Table RelationshipID.
				var columnModels = asitModel.getColumns();
				var columnScriptModels = aa.util.newArrayList();
				for (var k = 0; k < columnModels.size(); k++)
				{
					var params = Array();
					params[0] = columnModels.get(k);
					params[1] = "Admin";

					var columnScriptObject = aa.proxyInvoker.newInstance("com.accela.aa.emse.dom.AppSpecificTableColumnScriptModel", params).getOutput();
					if (columnScriptObject != null)
					{
						columnScriptModels.add(columnScriptObject);
					}
				}
				asitModel.setColumns(columnScriptModels);
				asitModel.setTableField(fieldValues);
				aa.appSpecificTableScript.editAppSpecificTableInfos(asitModel, parentRecordID, "Admin");
			}
		}
	}
}

/** 
 * Create Record, Application Hierarchy and its APO information.
 */
function createRecordWithAPO(capTypeModel, parentIDModel, addressModel, parcelModel, ownerModel, associatedFormsFlag)
{
	// Associated Forms Open status : "INCOMPLETE TMP".
	var capIDModel = aa.cap.createSimplePartialRecord(capTypeModel, null,
			"INCOMPLETE TMP").getOutput();
	if (capIDModel == null)
	{
		return null;
	}
	//aa.print(capIDModel.toKey());

	aa.cap.createAssociatedFormsHierarchy(parentIDModel, capIDModel);

	if (addressModel != null) 
	{
		var aResult = aa.address.createAddressWithAPOAttribute(capIDModel,
				addressModel).getOutput();
	}

	if (parcelModel != null) 
	{
		var capParcelModel = aa.parcel.getCapParcelModel().getOutput();
		parcelModel.setCapID(capIDModel);
		capParcelModel.setParcelModel(parcelModel);
		capParcelModel.setParcelNo(parcelModel.getParcelNumber());
		capParcelModel.setCapIDModel(capIDModel);
		aa.parcel.createCapParcelWithAPOAttribute(capParcelModel).getOutput();
	}

	if (ownerModel != null) 
	{
		ownerModel.setCapID(capIDModel);
		aa.owner.createCapOwnerWithAPOAttribute(ownerModel);
	}
	
	//createLicenseProfessionsForChildRecord(parentIDModel, capIDModel);

	return capIDModel;
}

function getAddress4AssociatedForms(capId)
{
	capAddresses = null;
	var s_result = aa.address.getAddressByCapId(capId);
	if(s_result.getSuccess())
	{
		capAddresses = s_result.getOutput();
		if (capAddresses == null || capAddresses.length == 0)
		{
			capAddresses = null;
		}
	}
	else
	{
		capAddresses = null;	
	}

	if (capAddresses != null && capAddresses.length > 0)
	{
		return capAddresses[0];
	}
	else
	{
		return null;
	}
}

function getParcel4AssociatedForms(capId)
{
	capParcelArr = null;
	var s_result = aa.parcel.getParcelandAttribute(capId, null);
	if(s_result.getSuccess())
	{
		capParcelArr = s_result.getOutput();
		if (capParcelArr == null || capParcelArr.size() == 0)
		{
			capParcelArr = null;
		}
	}
	else
	{
		capParcelArr = null;	
	}

	if (capParcelArr != null && capParcelArr.size()  > 0)
	{
		return capParcelArr.get(0);
	}
	else
	{
		return null;
	}
}

function getOwner4AssociatedForms(capId)
{
	capOwnerArr = null;
	var s_result = aa.owner.getOwnerByCapId(capId);
	if(s_result.getSuccess())
	{
		capOwnerArr = s_result.getOutput();
		if (capOwnerArr == null || capOwnerArr.length == 0)
		{
			capOwnerArr = null;
		}
	}
	else
	{
		capOwnerArr = null;	
	}

	if (capOwnerArr != null && capOwnerArr.length > 0)
	{
		return capOwnerArr[0];
	}
	else
	{
		return null;
	}
}

function getLicenseProfessional4AssociatedForms(capId)
{
	capLicenseArr = null;
	var s_result = aa.licenseProfessional.getLicenseProf(capId);
	if(s_result.getSuccess())
	{
		capLicenseArr = s_result.getOutput();
		if (capLicenseArr == null || capLicenseArr.length == 0)
		{
			capLicenseArr = null;
		}
	}
	else
	{
		capLicenseArr = null;
	}
	return capLicenseArr;
}

function createLicenseProfessionsForChildRecord(parentIDModel, capIDModel) 
{
	var licenseProfessionArray = getLicenseProfessional4AssociatedForms(parentIDModel);
	if (licenseProfessionArray != null && licenseProfessionArray.length > 0) 
	{
		for ( var i = 0; i < licenseProfessionArray.length; i++) 
		{
			var lpModel = licenseProfessionArray[i];
			if (lpModel != null) 
			{
				lpModel.setCapID(capIDModel);
				aa.licenseProfessional.createLicensedProfessional(lpModel);
			}
		}
	} 
}

function assignCapDept(assignDept) // option CapId
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	cd = cdScriptObj.getCapDetailModel();

	cd.setAsgnDept(assignDept);
	
	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("Assigned CAP to " + assignDept) }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}
	
function invoiceAllFeesExcept()
    {
    //invoices all assessed fees having fperiod, optional fee code(s) to exclude

	var invFeeSeqList = new Array();
	var invPaymentPeriodList = new Array();


	var skipArray = new Array();
	var invoiceAll = false;
	if (arguments.length > 0)
		{
		for (var i=0; i<arguments.length; i++)
			skipArray.push(arguments[i]);
		}
	else
		invoiceAll = true;


	var feeA = loadFees(capId)

	for (var x in feeA)
		{
		thisFee = feeA[x];
		if (!invoiceAll && exists(thisFee.accCodeL1,skipArray)) continue;

		if (thisFee.status.equals("NEW"))
			{
			invFeeSeqList.push(thisFee.sequence);
			invPaymentPeriodList.push(thisFee.period);
            logDebug("Assessed fee "+thisFee.code+" found and tagged for invoicing");
            }
        }

	if (invFeeSeqList.length)
		{
		invoiceResult = aa.finance.createInvoice(capId, invFeeSeqList, invPaymentPeriodList);
		if (invoiceResult.getSuccess())
			{
			logDebug("Invoicing assessed fee items is successful.");
			balanceDue = aa.cap.getCapDetail(capId).getOutput().getBalance();
			logDebug("Updated balanceDue to " + balanceDue);
			}
		else
			logDebug("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
		}
    }

function removeAllFees(itemCap) // Removes all non-invoiced fee items for a CAP ID
	{
	getFeeResult = aa.finance.getFeeItemByCapID(itemCap);
	if (getFeeResult.getSuccess())
		{
		var feeList = getFeeResult.getOutput();
		for (feeNum in feeList)
			{
			if (feeList[feeNum].getFeeitemStatus().equals("NEW"))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();

				var editResult = aa.finance.removeFeeItem(itemCap, feeSeq);
				if (editResult.getSuccess())
					{
					logDebug("Removed existing Fee Item: " + feeList[feeNum].getFeeCod());
					}
				else
					{ logDebug( "**ERROR: removing fee item (" + feeList[feeNum].getFeeCod() + "): " + editResult.getErrorMessage()); break }
				}
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
				logDebug("Invoiced fee "+feeList[feeNum].getFeeCod()+" found, not removed");
				}
			}
		}
	else
		{ logDebug( "**ERROR: getting fee items (" + feeList[feeNum].getFeeCod() + "): " + getFeeResult.getErrorMessage())}

	}

function addCustomFee(feeSched, feeCode, feeDescr, feeAm, feeAcc) {

	var feeCap = capId;
	


	var newFeeResult = aa.finance.createFeeItem(feeCap, feeSched, feeCode, "FINAL", feeAm);
	if (newFeeResult.getSuccess()) {
	var feeSeq = newFeeResult.getOutput();

	var newFee = aa.finance.getFeeItemByPK(feeCap, feeSeq).getOutput().getF4FeeItem();


                     newFee.setFeeDescription(feeDescr);
	if (feeAcc) newFee.setAccCodeL1(feeAcc);

	aa.finance.editFeeItem(newFee);
      }
}

function feeAmountAllActivity(feeCapId, feeAccCode, licPeriod)
	{
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(feeCapId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		//only grab fees that have a certain account code, have a number fee item code, and are less than 6000
		if (feeObjArr[ff].getAccCodeL1() == feeAccCode && feeObjArr[ff].getFeeCod() == 'ACTIVITY' && (feeObjArr[ff].getFee()/licPeriod) < "6001")
		{
		feeTotal+=feeObjArr[ff].getFee()
		}


	return feeTotal;
	}

function feeAmountAllExemptActivity(feeCapId, feeAccCode, licPeriod)
	{
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(feeCapId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		//only grab fees that have are activities and are greater than 6000
		if (feeObjArr[ff].getFeeCod() == "ACTIVITY" && (feeObjArr[ff].getFee()/licPeriod) > 6000)
		{
		feeTotal+=feeObjArr[ff].getFee()
		}


	return feeTotal;
	}

function feeAmountActivityCode(feeCapId, feeCode, licPeriod)
	{
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(feeCapId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		//only grab fees that have a certain account code, have a number fee item code, and are less than 6000
		if (feeObjArr[ff].getFeeCod() == feeCode)
		{
			if (feeObjArr[ff].getFee()/licPeriod < "6001")
			{
			feeTotal+=(feeObjArr[ff].getFee()/licPeriod)
		    }
		    else 
		    {
		    feeTotal = 6000
		    }
		}

	return feeTotal;
	}
	
function isScheduledAfterDate(inspType,dateToCheck,itemCap)
	{
	var found = false;
	var inspResultObj = aa.inspection.getInspections(itemCap);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(inspType).equals(inspList[xx].getInspectionType()))
				{
                                sDate = convertDate(inspList[xx].getScheduledDate());
				tDate = new Date(dateToCheck);
                                if (sDate.getTime() > tDate.getTime())
				     found = true;
                                }
		}
	return found;
	}

function deleteTaskWithSub(targetCapId,deleteTaskName)
{
	//
	// Get the target Task
	//
	var workflowResult = aa.workflow.getTasks(targetCapId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	
	var tTask = null;

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if (fTask.getTaskDescription().toUpperCase().equals(deleteTaskName.toUpperCase()))
  			{
			var tTask = wfObj[i];
			}

		}

	if (!tTask)
  	  	{ logDebug("**WARNING: Task not found: " + deleteTaskName); return false; }


	logDebug("Removing sub tasks for " + tTask.getTaskDescription());
	var resultSub = aa.workflow.removeSubProcess(tTask)

	if (!resultSub.getSuccess())
		{ logDebug("error " + resultSub.getErrorMessage()); return false; }

aa.print("Removing task " + tTask.getTaskDescription());

	var result = aa.workflow.removeTask(tTask)

	if (!result.getSuccess())
		{ logDebug("error " + result.getErrorMessage()); return false; }

}

function loadSubProcesses(parentTask, taskNameEn, taskNameAr, taskOrder, taskSLA, taskAssign, taskWorkflow) {
//Requires Tasks in the Workflow called Generic1, Generic2, etc.

    var initialTaskStatus = "In Progress";
    
    var wfObj = getChildTasks(parentTask);

    var wfObj2 = getChildTasks(parentTask);
    
    var tTask = null;

    for (i in wfObj) {
        fTask = wfObj[i];

   	if (fTask.getTaskDescription().toUpperCase().equals(taskNameEn.toUpperCase()))
		  	{
			logDebug("New Task Name : " + taskNameEn.toUpperCase() + " already exists, cancelling workflow copy");
			return false;
			}

        if (fTask.getTaskDescription().toUpperCase().equals("GENERIC" + taskOrder)) {
            tTask = wfObj[i];
            nTask = wfObj2[i];
        }

    }

 if (!tTask)
    { logDebug("**WARNING: Task not found"); return false; }


    //
    // Copy the destination task
    //
    var systemUserObj = aa.person.getUser(currentUserID).getOutput();  	
    if (taskAssign) {
	var dpt = aa.people.getDepartmentList(null).getOutput();
	for (var thisdpt in dpt)
	  	{
	  	var m = dpt[thisdpt];
	  	if (m.getDeptName() != null) {
                	if (m.getDeptName().toUpperCase().equals(taskAssign.toUpperCase())){
			systemUserObj.setAgencyCode(m.getAgencyCode());
			systemUserObj.setBureauCode(m.getBureauCode());
			systemUserObj.setDivisionCode(m.getDivisionCode());
			systemUserObj.setSectionCode(m.getSectionCode());
			systemUserObj.setGroupCode(m.getGroupCode());
			systemUserObj.setOfficeCode(m.getOfficeCode());
			}
                }
		}


    }
    arabicObj = aa.bizDomain.getBizDomainByValue("Authorities",taskNameAr,"ar_AE").getOutput();
    if (arabicObj) arabicValue = arabicObj.getDispBizdomainValue(); else arabicValue = taskNameEn;


    nTask.setTaskDescription(taskNameEn);
    nTask.setResLangID("ar_AE");
    nTask.setResTaskDescription(arabicValue);
    nTask.setDaysDue(parseInt(taskSLA));
    nTask.setAssignedUser(systemUserObj);
    nTask.setActiveFlag("N");

    result = aa.workflow.insertTaskWithResourceData(nTask, "P")
    if (result.getSuccess())
    { logDebug("sub task added:" + taskNameEn); }

    if (!result.getSuccess())
    { logDebug("sub task error " + result.getErrorMessage()); return false; }


     logDebug("Attaching subprocess " + taskWorkflow.toUpperCase() + " to " + nTask.getTaskDescription());
     var result = aa.workflow.insertSubProcess(nTask,taskWorkflow.toUpperCase(),true)
	if (!result.getSuccess())
		{ logDebug("error " + result.getErrorMessage()); return false; }

    logDebug("all done");

}

function deleteTaskContains(parentTask,taskContains)
{
	//
	// Get the target Task
	//
	var wfObj = getChildTasks(parentTask);

	var tTask = null;

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if (fTask.getTaskDescription().toUpperCase().indexOf(taskContains.toUpperCase()) != -1)
  			{
			var tTask = wfObj[i];
                        var result = aa.workflow.removeTask(tTask)
			}

		}

}

function copyConditionsByStatus(fromCapId, condStatus) {
    var newCondStatus = "Unverified";
    var getFromCondResult = aa.capCondition.getCapConditions(fromCapId);
    if (getFromCondResult.getSuccess())
        var condA = getFromCondResult.getOutput();
    else
    { logDebug("**WARNING: getting cap conditions: " + getFromCondResult.getErrorMessage()); return false }

    for (cc in condA) {
        var thisC = condA[cc];
         if (thisC.getConditionStatus() == condStatus && thisC.getConditionType().indexOf("Fee") == -1) { // JHS 12/26/10 do not copy fees
		var oldNum = thisC.getConditionNumber();
		var capCondArr = new Array();

		var arSourceCond = aa.condition.getCondition(thisC,"ar_AE").getOutput();
		var arCond = aa.capCondition.getNewConditionScriptModel().getOutput();
		
		arCond.setResLangId("ar_AE");
         	arCond.setConditionDescription(arSourceCond.getResConditionDescription());
         	arCond.setConditionComment(arSourceCond.getResConditionComment());
         	arCond.setLongDescripton(arSourceCond.getResLongDescripton());  
         	arCond.setResolutionAction(arSourceCond.getResResolutionAction());
         	arCond.setPublicDisplayMessage(arSourceCond.getResPublicDisplayMessage());

		var enSourceCond = aa.condition.getCondition(thisC,"en_US").getOutput();
		var enCond = aa.capCondition.getNewConditionScriptModel().getOutput();
		
		thisC.setResLangId("en_US");
		capCondArr.push(thisC);
		capCondArr.push(arCond);

		thisC.setCapID(capId);
		thisC.setConditionStatus("Unverified");

		var addCapCondResult = aa.condition.createConditionWithMulLangs(capCondArr,thisC);
		
        if (addCapCondResult.getSuccess())
        	{
               	logDebug("Successfully added condition " + addCapCondResult.getOutput() + " from condition " + oldNum);
     		}
               	else
            		logDebug("**WARNING: couldn't add a copy of condition (" + thisC.getConditionNumber() + "): " + addCapCondResult.getErrorMessage());
      		}
    	}
     }

function replaceNode(fString,fName,fContents)
        {
         var fValue = "";
        var startTag = "<"+fName;
         var endTag = "</"+fName+">";
		// Added from taking on consideration the length of the node attribute
		var attributeNodeLen = 75;
                 startPos = fString.indexOf(startTag) +attributeNodeLen+ startTag.length;
                 endPos = fString.indexOf(endTag);
                 // make sure startPos and endPos are valid before using them
                 if (startPos > 0 && startPos <= endPos)
                                {
                                  fValue = fString.substring(0,startPos) + fContents  + fString.substring(endPos);
                                        return unescape(fValue);
                        }

        }


function getActivityNameById(actId,lang)
	{

	var bz = aa.bizDomain.getBizDomain("Activity Code").getOutput();
	lang = "" + lang;

	if (bz) bz = bz.toArray();

	if (bz)
		{
		for (var thisBz in bz)
			if (bz[thisBz] && bz[thisBz].getDescription() && bz[thisBz].getDescription().equals(actId))
				if (lang.equals("ar_AE"))
					{
               		var arObj = aa.bizDomain.getBizDomainByValue("Activity Code",bz[thisBz].getBizdomainValue(),"ar_AE").getOutput();
               		if (arObj) return arObj.getDispBizdomainValue();
					}
				else
					{
					return bz[thisBz].getBizdomainValue()
					}
		}

	return null;
	}

function composeSearchData(param) {
    var searchDataModel = aa.specialSearch.newSearchDataModel().getOutput();
    searchDataModel.setEntityType(param.entityType);
    searchDataModel.setAuditID(currentUserID);
    if (param) {
        // englishTradeName,arabicTradeName,groupID
        if (param.capID != undefined) {
            searchDataModel.setServiceProviderCode(param.capID.getServiceProviderCode());
            searchDataModel.setCapID(param.capID);
        }
        if (param.entityID != undefined) {
            searchDataModel.setEntityID(param.entityID);
        }
        if (param.englishFieldValue != undefined) {
            searchDataModel.setSearchData1(param.englishFieldValue);
        }
        if (param.originalEnglishTradeName != undefined) {
            searchDataModel.setOriginData1(param.originalEnglishTradeName);
        }
        if (param.arabicFieldValue != undefined) {
            searchDataModel.setSearchData2(param.arabicFieldValue);
        }
        if (param.originalArabicTradeName != undefined) {
            searchDataModel.setOriginData2(param.originalArabicTradeName);
        }
        if (param.groupID != undefined) {
            searchDataModel.setSearchGroupID(param.groupID);
        }
    }
    return searchDataModel;
}

function createTNSearchEntries(itemCapId, asiArray) {
    var englishTNList = new Array("English Prefered Name", "English Alternate 1", "English Alternate 2", "English Alternate 3", "English Alternate 4", "English Alternate 5", "English Alternate 6", "English Alternate 7", "English Alternate 8", "English Alternate 9", "English Alternate 10")
    var arabicTNList = new Array("Arabic Prefered Name", "Arabic Alternate 1", "Arabic Alternate 2", "Arabic Alternate 3", "Arabic Alternate 4", "Arabic Alternate 5", "Arabic Alternate 6", "Arabic Alternate 7", "Arabic Alternate 8", "Arabic Alternate 9", "Arabic Alternate 10")

    var altID = itemCapId.getCustomID();

    var searchObjs = [];

    for (var i in englishTNList) {
        thisEng = englishTNList[i]
        thisAra = arabicTNList[i]

        if (asiArray[thisEng] || asiArray[thisAra]) {
            var searchDataModel = composeSearchData({
                englishFieldValue: aa.specialSearch.getPureEnglishText(asiArray[thisEng]).getOutput(),
                arabicFieldValue: aa.specialSearch.getPureArabicText(asiArray[thisAra]).getOutput(),
                groupID: parseInt(i),
                originalEnglishTradeName: asiArray[thisEng],
                originalArabicTradeName: asiArray[thisAra],
                entityID: altID,
                capID: itemCapId,
                entityType: 'TRADENAME'
            });

            searchObjs.push(searchDataModel);
        }
    }

    aa.specialSearch.recreateBatchSearchData(itemCapId, searchObjs);
}

function createLicenseSearchEntries(itemCapId) {
    var scriptResult = aa.licenseProfessional.getLicensedProfessionalsByCapID(itemCapId);
    if (scriptResult.success) {
        var licenseList = scriptResult.getOutput();
        if (licenseList == null) return;
        //aa.print(licenseList);
        var searchDataList = [];
        var index = 0;
        for (var i = 0; i < licenseList.length; ++i) {
            var license = licenseList[i];
            if (license.businessName == null && license.busName2 == null) {
                continue;
            }

			searchDataList[index] = composeSearchData({
			capID: itemCapId,
			entityID: license.getLicenseNbr(),
			englishFieldValue: aa.specialSearch.getPureEnglishText(license.getBusinessName()).getOutput(),
			originalEnglishTradeName: license.getBusinessName(),
			arabicFieldValue: aa.specialSearch.getPureArabicText(license.getBusName2()).getOutput(),
			originalArabicTradeName: license.getBusName2(),
			groupID: index,
			entityType: 'TRADELICENSE'
			});


            index++;
        }
        aa.specialSearch.removeSearchDataByCapID(itemCapId);
        aa.specialSearch.createBatchSearchData(searchDataList);
    }
}

function copyASIFieldsAndData(srcCapId, targetCapId) // optional groups to ignore
{
    var ignoreArray = new Array();
    for (var i = 2; i < arguments.length; i++)
        ignoreArray.push(arguments[i])

    var appSpecificInfo = null;
    var s_result = aa.appSpecificInfo.getByCapID(srcCapId);
    if (s_result.getSuccess()) {
        var appSpecificInfo = s_result.getOutput();
        if (appSpecificInfo == null || appSpecificInfo.length == 0) {
            logDebug("WARNING: no appSpecificInfo on this CAP:" + srcCapId);
            return null;
        }
    }
    else {
        logDebug("**WARNING: Failed to get appSpecificInfo: " + s_result.getErrorMessage());
        return null;
    }

    for (var loopk in appSpecificInfo)
        if (!exists(appSpecificInfo[loopk].getCheckboxType(), ignoreArray)) {
        var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
        sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
        sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
        sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());
        //3. Edit ASI on target CAP (Copy info from source to target)
        aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
    }
}


function copyASITableFieldsAndData(srcCapId, targetCapId) {
    var tableNameArray = null;
    var result = aa.appSpecificTableScript.getAppSpecificGroupTableNames(capId);
    if (result.getSuccess()) {
        tableNameArray = result.getOutput();
    }
    else {
        logDebug("WARNING: no ASI Tables on this CAP:" + srcCapId);
        return null;
    }

    for (var loopk in tableNameArray) {
        var tableName = tableNameArray[loopk];
        var appSpecificTable = null;

        //1. Get appSpecificTableModel with source CAPID
        var s_result = aa.appSpecificTableScript.getAppSpecificTableModel(srcCapId, tableName);
        if (s_result.getSuccess()) {
            var appSpecificTable = s_result.getOutput();
            if (appSpecificTable == null || appSpecificTable.length == 0) {
                logDebug("WARNING: null table on this CAP:" + capId);
                continue;
            }
        }
        else {
            logDebug("WARNING: Failed to appSpecificTable: " + s_result.getErrorMessage());
            continue;
        }


        //2. Edit AppSpecificTableInfos with target CAPID

        var aSTableModel = appSpecificTable.getAppSpecificTableModel();

        aa.appSpecificTableScript.editAppSpecificTableInfos(aSTableModel, targetCapId, null);
    }
}

function createReferenceLP(rlpId,rlpType,pContactType,bizname1,bizname2)
	{
	// Custom for Abu Dhabi -- uses Trade Name application to populate reference LP
	var updating = false;

	//
	// get Contacts from the source CAP
	//
	var capContResult = aa.people.getCapContactByCapID(capId);
	if (capContResult.getSuccess())
		{ conArr = capContResult.getOutput();  }
	else
		{
		logDebug ("**ERROR: getting cap contact: " + capAddResult.getErrorMessage());
		return false;
		}

	if (!conArr.length)
		{
		logDebug ("**WARNING: No contact available");
		return false;
		}


	//
	// get Address from the source CAP
	//

	var useAddress = null;
	var capAddressResult = aa.address.getAddressByCapId(capId);
	if (capAddressResult.getSuccess())
		{
		var addressArr = capAddressResult.getOutput();
		for (var yy in addressArr)
			useAddress = addressArr[yy];  // get the last record, should only be one for AD
		}


	//
	// check to see if the licnese already exists...if not, create.
	//

	var newLic = getRefLicenseProf(rlpId)

	if (newLic)
		{
		updating = true;
		logDebug("Updating existing Ref Lic Prof : " + rlpId);
		}
	else
		var newLic = aa.licenseScript.createLicenseScriptModel();

	//
	//   get contact record
	//

	if (pContactType==null)
		var cont = conArr[0]; //if no contact type specified, use first contact
	else
		{
		var contFound = false;
		for (yy in conArr)
			{
			if (pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType()))
				{
				cont = conArr[yy];
				contFound = true;
				break;
				}
			}
		if (!contFound)
			{
			logDebug ("**WARNING: No Contact found of type: "+pContactType);
			return false;
			}
		}

	peop = cont.getPeople();
	addr = peop.getCompactAddress();


	//
	// now populate the fields
	//

	newLic.setContactFirstName(cont.getFirstName());
	//newLic.setContactMiddleName(cont.getMiddleName());  //method not available
	newLic.setContactLastName(cont.getLastName());
	newLic.setBusinessName(bizname1);
	newLic.setBusinessName2(bizname2);  // available only on 6.6.1i patch i

	if (useAddress)  // custom mappings per DB 07/16/2009
		{
		//aa.print("using address " + useAddress)
		newLic.setAddress1(useAddress.getAddressLine1());
		newLic.setAddress2(useAddress.getAddressLine2());
		newLic.setAddress3(useAddress.getStreetName());
		newLic.setCity(useAddress.getCity());
		newLic.setState(useAddress.getInspectionDistrict());
		//newLic.setZip(useAddress.getZip());

		if (useAddress.getInspectionDistrict())
			newLic.setLicState(useAddress.getInspectionDistrict());
		else
			newLic.setLicState("AD");


		}
	else
		{
		newLic.setAddress1(addr.getAddressLine1());
		newLic.setAddress2(addr.getAddressLine2());
		newLic.setAddress3(addr.getAddressLine3());
		newLic.setCity(addr.getCity());
		newLic.setState(addr.getState());
		newLic.setZip(addr.getZip());

		if (addr.getState())
			newLic.setLicState(addr.getState());
		else
			newLic.setLicState("AD");
		}


	newLic.setPhone1(peop.getPhone1());
	newLic.setPhone1CountryCode(peop.getPhone1CountryCode());
	newLic.setPhone2(peop.getPhone2());
	newLic.setPhone2CountryCode(peop.getPhone2CountryCode());
	newLic.setEMailAddress(peop.getEmail());
	newLic.setFax(peop.getFax());

	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setAuditID(currentUserID);
	newLic.setAuditStatus("A");

	newLic.setLicenseType(rlpType);


	newLic.setStateLicense(rlpId);

	if (updating)
		myResult = aa.licenseScript.editRefLicenseProf(newLic);
	else
		myResult = aa.licenseScript.createRefLicenseProf(newLic);


	if (!myResult.getSuccess())
		{
		logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		return null;
		}

	logDebug("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType + " Sequence Number " + myResult.getOutput());

	lpsmResult = aa.licenseScript.getRefLicenseProfBySeqNbr(servProvCode,myResult.getOutput())
	if (!lpsmResult.getSuccess())
		{ logDebug("**WARNING error retrieving the LP just created " + lpsmResult.getErrorMessage()) ; return null}

	lpsm = lpsmResult.getOutput();

	// Now add the LP to the CAP
	asCapResult= aa.licenseScript.associateLpWithCap(capId,lpsm)
	if (!asCapResult.getSuccess())
		{ logDebug("**WARNING error associating CAP to LP: " + asCapResult.getErrorMessage()) }
	else
		{ logDebug("Associated the CAP to the new LP") }


	// Now make the LP primary due to bug 09ACC-06791
	var capLps = getLicenseProfessional(capId);
	for (var thisCapLpNum in capLps)
		{
		logDebug("looking at license : " + capLps[thisCapLpNum].getLicenseNbr());
		if (capLps[thisCapLpNum].getLicenseNbr().equals(rlpId))
			{
			var thisCapLp = capLps[thisCapLpNum];
			thisCapLp.setPrintFlag("Y");
			aa.licenseProfessional.editLicensedProfessional(thisCapLp);
			logDebug("Updated primary flag on Cap LP : " + rlpId);
			}
		}


	// Find the public user by contact email address and attach
	puResult = aa.publicUser.getPublicUserByEmail(peop.getEmail())
	if (!puResult.getSuccess())
		{ logDebug("**WARNING finding public user via email address " + peop.getEmail() + " error: " + puResult.getErrorMessage()) }
	else
		{
		pu = puResult.getOutput();
		asResult = aa.licenseScript.associateLpWithPublicUser(pu,lpsm)
		if (!asResult.getSuccess())
			{logDebug("**WARNING error associating LP with Public User : " + asResult.getErrorMessage());}
		else
			{logDebug("Associated LP with public user " + peop.getEmail()) }
		}

	return lpsm;
	}

function copyWorkflow(sourceCapId, targetCapId, processName, targetTaskName, newTaskName, newTaskArabicName) {

    if (processName == null || processName == "")
    { logDebug("WARNING: processName is null"); return false; }

    //
    // Get the target Task
    //
    var workflowResult = aa.workflow.getTasks(targetCapId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    var workflowResult2 = aa.workflow.getTasks(targetCapId);
    if (workflowResult2.getSuccess())
        var wfObj2 = workflowResult2.getOutput();
    else
    { logDebug("**ERROR: Failed to get workflow object2: " + s_capResult.getErrorMessage()); return false; }


    var tTask = null;

    for (i in wfObj) {
        fTask = wfObj[i];

        if (fTask.getTaskDescription().toUpperCase().equals(newTaskName.toUpperCase())) {
            logDebug("New Task Name : " + newTaskName + " already exists, cancelling workflow copy");
            return false;
        }

        if (fTask.getTaskDescription().toUpperCase().equals(targetTaskName.toUpperCase())) {
            tTask = wfObj[i];
            nTask = wfObj2[i];
        }

    }

    if (!tTask)
    { logDebug("**ERROR: Task not found: " + targetTaskName); return false; }


    //
    // Copy the destination task
    //
    nTask.setTaskDescription(newTaskName);
    nTask.setResLangID("ar_AE");
    nTask.setResTaskDescription(newTaskArabicName);

    logDebug("Copying task " + tTask.getTaskDescription() + " to " + nTask.getTaskDescription());

    result = aa.workflow.insertTaskWithResourceData(nTask, "P")
    //result = aa.workflow.copyTask(nTask, tTask, "P")
    if (!result.getSuccess())
    { logDebug("error " + result.getErrorMessage()); return false; }


    //
    // Add the subworkflow
    //

    logDebug("Attaching subprocess " + processName + " to " + nTask.getTaskDescription());

    var result = aa.workflow.insertSubProcess(nTask, processName, true)
    if (!result.getSuccess())
    { logDebug("error " + result.getErrorMessage()); return false; }

}

function copyLicenseProfessional(srcCapId, targetCapId) {
    //1. Get license professionals with source CAPID.
    var capLicenses = getLicenseProfessional(srcCapId);
    if (capLicenses == null || capLicenses.length == 0) {
        return;
    }
    //2. Get license professionals with target CAPID.
    var targetLicenses = getLicenseProfessional(targetCapId);
    //3. Check to see which licProf is matched in both source and target.
    for (loopk in capLicenses) {
        sourcelicProfModel = capLicenses[loopk];
        //3.1 Set target CAPID to source lic prof.
        sourcelicProfModel.setCapID(targetCapId);
        targetLicProfModel = null;
        //3.2 Check to see if sourceLicProf exist.
        if (targetLicenses != null && targetLicenses.length > 0) {
            for (loop2 in targetLicenses) {
                if (isMatchLicenseProfessional(sourcelicProfModel, targetLicenses[loop2])) {
                    targetLicProfModel = targetLicenses[loop2];
                    break;
                }
            }
        }
        //3.3 It is a matched licProf model.
        if (targetLicProfModel != null) {
            //3.3.1 Copy information from source to target.
            aa.licenseProfessional.copyLicenseProfessionalScriptModel(sourcelicProfModel, targetLicProfModel);
            //3.3.2 Edit licProf with source licProf information.
            aa.licenseProfessional.editLicensedProfessional(targetLicProfModel);
        }
        //3.4 It is new licProf model.
        else {
            //3.4.1 Create new license professional.
            aa.licenseProfessional.createLicensedProfessional(sourcelicProfModel);
        }
    }
}





function getLicense(tradeNameID, licCapType, licCapStatus) {
    // returns the capId of a valid trade license
    var licCapArray = getChildren(licCapType, tradeNameID)

    if (licCapArray == null || licCapArray.length == 0) {
        return;
    }

    for (var aps in licCapArray) {

        myCap = aa.cap.getCap(licCapArray[aps]).getOutput();
        //aa.print(myCap.getCapStatus());
        if (myCap.getCapStatus() == licCapStatus) {
            //aa.print("License CAP found: Cap Type: " + licCapType + " App Status: " + licCapStatus + "   Cap ID: " + licCapArray[aps].getCustomID().toString());
            return licCapArray[aps];
        }
    }
}

function getLicenseCapId(licenseCapType) {
    var itemCap = capId
    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    var capLicenses = getLicenseProfessional(itemCap);
    if (capLicenses == null || capLicenses.length == 0) {
        return;
    }

    for (var capLic in capLicenses) {
        var LPNumber = capLicenses[capLic].getLicenseNbr()
        var lpCapResult = aa.cap.getCapID(LPNumber);
        if (!lpCapResult.getSuccess())
        { logDebug("**ERROR: No cap ID associated with License Number : " + LPNumber); continue; }
        licCapId = lpCapResult.getOutput();
        if (appMatch(licenseCapType, licCapId))
            return licCapId;
    }
}



function getLicenseProfessional(itemcapId) {
    capLicenseArr = null;
    var s_result = aa.licenseProfessional.getLicenseProf(itemcapId);
    if (s_result.getSuccess()) {
        capLicenseArr = s_result.getOutput();
        if (capLicenseArr == null || capLicenseArr.length == 0) {
            //aa.print("WARNING: no licensed professionals on this CAP:" + itemcapId);
            capLicenseArr = null;
        }
    }
    else {
        //aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
        capLicenseArr = null;
    }
    return capLicenseArr;
}

function getTemplateCap(moduleName, trxType, activityId, appStatus) {
    logDebug("looking for a " + moduleName + " Cap for activity ID: " + activityId + "  Transaction Type: " + trxType + "   App Status: " + appStatus);
    var getCapResult = aa.cap.getCapIDsByAppSpecificInfoField("Activity ID", activityId);
    if (getCapResult.getSuccess())
        var apsArray = getCapResult.getOutput();
    else
    { logDebug("**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()); return null }

    for (aps in apsArray) {
        myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();

        if (myCap.getCapType().getGroup() == moduleName) {
            if (myCap.getCapStatus() == appStatus) {
                var xTrxType = "" + getAppSpecific("Application Type", apsArray[aps].getCapID());
                if (xTrxType == trxType) {
                    logDebug("templateCap found for activity: " + activityId + "  Transaction Type: " + trxType + "   App Status: " + appStatus + "   Cap ID: " + apsArray[aps].getCapID().toString());
                    return apsArray[aps];
                }
            }
        }

    }
}

function getLegalFormCap(moduleName, trxType, legalFormType, appStatus) {
    logDebug("looking for a " + moduleName + " Cap for legal form: " + legalFormType + "  Transaction Type: " + trxType + "   App Status: " + appStatus);
    var getCapResult = aa.cap.getCapIDsByAppSpecificInfoField("Legal Form Template", legalFormType);
    if (getCapResult.getSuccess())
        var apsArray = getCapResult.getOutput();
    else
    { logDebug("**ERROR: getting caps by legal form: " + getCapResult.getErrorMessage()); return null }

    for (aps in apsArray) {
        myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();

        if (myCap.getCapType().getGroup() == moduleName) {
            if (myCap.getCapStatus() == appStatus) {
                var xTrxType = "" + getAppSpecific("Application Type", apsArray[aps].getCapID());
                if (xTrxType == trxType) {
                    logDebug("templateCap found for legal form: " + legalFormType + "  Transaction Type: " + trxType + "   App Status: " + appStatus + "   Cap ID: " + apsArray[aps].getCapID().toString());
                    return apsArray[aps];
                }
            }
        }

    }
}

function addStdCondition(cType, cDesc) {

    if (!aa.capCondition.getStandardConditions) {
        //aa.print("addStdCondition function is not available in this version of Accela Automation.");
    }
    else {
        standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
        for (i = 0; i < standardConditions.length; i++) {
            standardCondition = standardConditions[i]
            aa.capCondition.createCapConditionFromStdCondition(capId, standardCondition.getConditionNbr())
        }
    }
}

function assignTasksToDepartment(assignedDept) {
    var doAssignCap = true;
    var itemCap = capId;
    var checkAgency = "DED";

    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    //
    // Get capdetail
    //
    var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
    if (!cdScriptObjResult.getSuccess())
    { logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()); return false; }
    var cdScriptObj = cdScriptObjResult.getOutput();
    if (!cdScriptObj)
    { logDebug("**ERROR: No cap detail script object"); return false; }
    cd = cdScriptObj.getCapDetailModel();

    //
    // if newDept is null, assign tasks to either 1) assigned department in cap detail, or 2) department of user
    //
    if (!assignedDept) {
        assignedDept = cd.getAsgnDept()
        doAssignCap = false;

        if (!assignedDept) {
            doAssignCap = true;
            iNameResult = aa.person.getUser(currentUserID);
            if (!iNameResult.getSuccess())
            { logDebug("**ERROR retrieving  user model " + assignId + " : " + iNameResult.getErrorMessage()); return false; }
            iName = iNameResult.getOutput();
            assignedDept = iName.getDeptOfUser();
        }

        if (!assignedDept)
        { logDebug("**ERROR: Can't determine department to assign"); return false; }

    }

    var assignBureau = "" + assignedDept.split("/")[2];

    //
    // Assign the new department to the CAP, since the cap is unassigned.
    //
    if (doAssignCap) {
        cd.setAsgnDept(assignedDept);
        cdWrite = aa.cap.editCapDetail(cd)
        if (!cdWrite.getSuccess())
        { logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()); return false; }
    }

    //
    // Loop through all non-completed tasks.  If Agency == DPE  Change bureau to match assigned department
    //

    var workflowResult = aa.workflow.getTasks(itemCap);
    if (!workflowResult.getSuccess())
    { logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); return false; }

    wfObj = workflowResult.getOutput();
    for (var i in wfObj) {
        fTask = wfObj[i];
        if (fTask.getCompleteFlag() != "N") continue;

        var taskUserObj = fTask.getTaskItem().getAssignedUser()

        if (taskUserObj.getAgencyCode() != checkAgency) continue; 		// skip non-DPE tasks
        // if (taskUserObj.getBureauCode().equals(assignBureau)) continue; 	// already assigned

        taskUserObj.setBureauCode(assignBureau);

        fTask.setAssignedUser(taskUserObj);
        var taskItem = fTask.getTaskItem();
        var adjustResult = aa.workflow.assignTask(taskItem);
    }

}

function addMonthsToDate(startDate, numMonths) {
    var addYears = Math.floor(numMonths/12);
    var addMonths = numMonths - (addYears * 12);
    var newMonth = startDate.getMonth() + addMonths;
    if (startDate.getMonth() + addMonths > 11) {
      ++addYears;
      newMonth = startDate.getMonth() + addMonths - 12;
    }
    var newDate = new Date(startDate.getFullYear()+addYears,newMonth,startDate.getDate(),startDate.getHours(),startDate.getMinutes(),startDate.getSeconds());

    // adjust to correct month
    while (newDate.getMonth() != newMonth) {
      newDate = addMonthsToDate(newDate, -1);
    }

    return newDate;
}

function comparePeopleAbuDhabi(peop)
    {

    // this function will be passed as a parameter to the createRefContactsFromCapContactsAndLink function.
    //
    // takes a single peopleModel as a parameter, and will return the sequence number of the first G6Contact result
    //
    // returns null if there are no matches
    //
    // current search method is by email only.  In order to use attributes enhancement 09ACC-05048 must be implemented
    //

    peop.setAuditDate(null)
    peop.setAuditID(null)
    peop.setAuditStatus(null)
    peop.setBirthDate(null)
    // peop.setBusName2(null)
    // peop.setBusinessName(null)
    peop.setComment(null)
    peop.setCompactAddress(null)
    peop.setContactSeqNumber(null)
    //peop.setContactType(null)
    peop.setContactTypeFlag(null)
    peop.setCountry(null)
    peop.setCountryCode(null)
    peop.setEmail(null)   
    peop.setEndBirthDate(null)
    peop.setFax(null)
    peop.setFaxCountryCode(null)
    // peop.setFein(null)
    // peop.setFirstName(null)
    peop.setFlag(null)
    peop.setFullName(null)
    peop.setGender(null)
    peop.setHoldCode(null)
    peop.setHoldDescription(null)
    peop.setId(null)
    peop.setIvrPinNumber(null)
    peop.setIvrUserNumber(null)
    // peop.setLastName(null)
    peop.setMaskedSsn(null)
    // peop.setMiddleName(null)
    peop.setNamesuffix(null)
    peop.setPhone1(null)
    peop.setPhone1CountryCode(null)
    peop.setPhone2(null)
    peop.setPhone2CountryCode(null)
    peop.setPhone3(null)
    peop.setPhone3CountryCode(null)
    peop.setPostOfficeBox(null)
    peop.setPreferredChannel(null)
    peop.setPreferredChannelString(null)
    peop.setRate1(null)
    peop.setRelation(null)
    peop.setSalutation(null)
    //peop.setServiceProviderCode(null)
    peop.setSocialSecurityNumber(null)
    peop.setTitle(null)
    // peop.setTradeName(null)
    

    // Remove all attributes except the birthdate
        
    var a = peop.getAttributes();

    if (a)
        {
        //
        // Clear unwanted attributes
        var ai = a.iterator();
        while (ai.hasNext())
            {
            var xx = ai.next();
            if (!xx.getAttributeName().toUpperCase().equals("BIRTH DATE"))
                {
                aa.print("removing attribute : " + xx.getAttributeName());
                ai.remove();
                }
            }
        }

    var r = aa.people.getPeoplesByAttrs(peop, "", "N", null);

    if (!r.getSuccess())
            { logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

    var peopResult = r.getOutput();

    if (!peopResult || peopResult.length == 0)
        {
        logDebug("Searched for REF contact, no matches found, returing null");
        return null;
        }

    if (peopResult.length > 0)
        {
        logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
        return peopResult[0].getContactSeqNumber()
        }

}

function removeActivityFees(itemCap, feeAccCode) // Removes all non-invoiced fee items for a CAP ID  that are associated with an Activity or an Activity Credit
	{
	getFeeResult = aa.finance.getFeeItemByCapID(itemCap);
	if (getFeeResult.getSuccess())
		{
		var feeList = getFeeResult.getOutput();
		for (feeNum in feeList)
			{
			if (feeList[feeNum].getFeeitemStatus().equals("NEW") && feeList[feeNum].getAccCodeL1() == feeAccCode && (isNaN(feeList[feeNum].getFeeCod()) == false || feeList[feeNum].getFeeCod() == 'CREDIT'))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();

				var editResult = aa.finance.removeFeeItem(itemCap, feeSeq);
				if (editResult.getSuccess())
					{
					aa.print("Removed existing Fee Item: " + feeList[feeNum].getFeeCod());
					}
				else
					{ aa.print( "**ERROR: removing fee item (" + feeList[feeNum].getFeeCod() + "): " + editResult.getErrorMessage()); break }
				}
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
				aa.print("Invoiced fee "+feeList[feeNum].getFeeCod()+" found, not removed");
				}
			}
		}
	else
		{ aa.print( "**ERROR: getting fee items (" + feeList[feeNum].getFeeCod() + "): " + getFeeResult.getErrorMessage())}

	}

function loadTempTable(tname) {

 	//
 	// Returns a single ASI Table array of arrays
	// Optional parameter, cap ID to load from
	//

	var gm = aa.env.getValue("AppSpecificTableGroupModel");
	var ta = gm.getTablesMap();
	var tai = ta.values().iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();
	  var tn = tsm.getTableName();

      if (!tn.equals(tname)) continue;

	  if (tsm.rowIndex.isEmpty())
	  	{
			logDebug("Couldn't load ASI Table " + tname + " it is empty");
			return false;
		}

   	  var tempObject = new Array();
	  var tempArray = new Array();

  	  var tsmfldi = tsm.getTableField().iterator();
	  var tsmcoli = tsm.getColumns().iterator();
	  var numrows = 1;

	  while (tsmfldi.hasNext())  // cycle through fields
		{
		if (!tsmcoli.hasNext())  // cycle through columns
			{
			var tsmcoli = tsm.getColumns().iterator();
			tempArray.push(tempObject);  // end of record
			var tempObject = new Array();  // clear the temp obj
			numrows++;
			}
		var tcol = tsmcoli.next();
		var tval = tsmfldi.next();
		var readOnly = 'N';
		var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
		tempObject[tcol.getColumnName()] = fieldInfo;

		}
		tempArray.push(tempObject);  // end of record
	  }
	  return tempArray;
	}

function gradeLicense() {
inspList = aa.inspection.getInspections(capId).getOutput();
totalItems = 0;
totalScore = 0;
totalMajor = 0;
criticalScore = 0;
nonCriticalScore = 0;
totalCritical = 0;
totalNon = 0;
riskScore = 0;
riskCount = 0;
for (x in inspList) { 
inspModel = inspList[x].getInspection();
var gs = inspModel.getGuideSheets();
if (gs) 
	{
	gsArray = gs.toArray();
	for (var loopk in gsArray)
		{
		if (gsArray[loopk].getGuideType() != "Risk Assessment") {
			var gsItems = gsArray[loopk].getItems().toArray()
			for (var loopi in gsItems) {
				if (gsItems[loopi].getGuideItemScore() != null ) {
					totalScore += gsItems[loopi].getGuideItemScore() * 1;
					totalItems += 1;
					if (gsItems[loopi].getLhsType() == "LHS") {
						criticalScore += gsItems[loopi].getGuideItemScore() *1;
						totalCritical += 1;
					} else {
						nonCriticalScore += gsItems[loopi].getGuideItemScore() *1;
						totalNon += 1;
					}
					if (gsItems[loopi].getMajorViolation() == "Y") totalMajor += 1;
					}
				}
			}
		else {
			var gsItems = gsArray[loopk].getItems().toArray()
			for (var loopi in gsItems) {
				if (gsItems[loopi].getGuideItemScore() != null ) {
					riskScore += gsItems[loopi].getGuideItemScore() * 1;
					riskCount += 1;
					}
				}
			}
		}
	}
}

averageScore = Math.round(totalScore/totalItems);
avgCritical = Math.round(criticalScore/totalCritical);
avgNon = Math.round(nonCriticalScore/totalNon);
appGrade = "";
riskScore = riskScore/riskCount;
if (avgNon > 89 && avgCritical > 94) appGrade = "Grade A";
if (averageScore > 89 && avgCritical < 95) appGrade = "Grade B";
if (averageScore < 90 && averageScore > 70 && avgCritical < 95 && avgCritical > 84) appGrade = "Grade B";
if (averageScore < 90 && averageScore > 70 && avgCritical < 85 && avgCritical > 74) appGrade = "Grade C";
if (averageScore < 70 || avgCritical < 75) appGrade = "Grade D";
updateMessage = "License received a " + appGrade + " due to a total inspection score of " + averageScore + " and a Critical Score of " + avgCritical + ". This License has a risk score of " + riskScore;
 
updateAppStatus(appGrade, updateMessage);
updateWorkDesc(updateMessage);
updateShortNotes(riskScore);
return appGrade;
}

function checkInspectionResultNumber(insp2Check,insp2Result)
	{
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()) && String(insp2Result).equals(inspList[xx].getInspectionStatus()))
				return inspList[xx].getIdNumber();
		}
	return false;
	}
	
function executeCheckInAfterSubmit(){
	// If Online Public User is logged in.... 
	if (publicUserID && String(publicUserID) != "" && publicUserID != null){
		executeCheckInAfterSubmitACA();
	}else{
		executeCheckInAfterSubmitAA();
	}
}

function executeCheckOutAfterSubmit(){
	// If Online Public User is logged in.... 
	logDebug("Runing executeCheckOutAfterSubmit");
	if (publicUserID && String(publicUserID) != "" && publicUserID != null){
		logDebug("Runing executeCheckOutAfterSubmitACA");
		executeCheckOutAfterSubmitACA();
	}else{
		logDebug("Runing executeCheckOutAfterSubmitAA");
		executeCheckOutAfterSubmitAA();
	}
}


function executeCheckInAfterSubmitACA(){
	logDebug( "Started Script!");
	logDebug( "publicUserID: " + publicUserID);
	// Get Cap Id
	
	var cap_id1 = aa.env.getValue("PermitId1");
    var cap_id2 = aa.env.getValue("PermitId2");
    var cap_id3 = aa.env.getValue("PermitId3");

	logDebug( "myCapID(first): " + cap_id1 + cap_id2 + cap_id3);
	
	// Get User Seq Number From Online Public UserID
	var myUserSeqNum = String(publicUserID).replace(/\D/g, '');
	logDebug( "myUserSeqNum: " + myUserSeqNum);
	
	// Get License Script Model From User Sequence Number
	var licScriptResult = aa.licenseScript.getRefLicProfByOnlineUser(myUserSeqNum);	
	//logDebug( "licScriptResult: " + licScriptResult);
	if (licScriptResult.getSuccess()){
		LicenseScriptModelList = licScriptResult.getOutput();
		var myLicenseScriptModel = LicenseScriptModelList[0];
		var myBusinessName = myLicenseScriptModel.getBusinessName();
		var myLicenseNo = myLicenseScriptModel.getStateLicense();
		//var myBusinessNameTruncated = String(myBusinessName).substring(0,20);

		logDebug( "License Number: " + myLicenseNo);
		// Get CapModel By CapId
		var myCapIDModel = aa.cap.getCapIDModel(cap_id1,cap_id2,cap_id3).getOutput();
		var myTempCapModel = aa.cap.getCapModel().getOutput();
		myTempCapModel.setCapID(myCapIDModel);
		logDebug( "myCapID: " + myCapIDModel);

		// ================= Associate License Professional to Cap
		var myCapList = aa.cap.getCapIDListByCapModel(myTempCapModel).getOutput();
		for (x in myCapList) {
			 thisCap = myCapList[x];
			 capId = thisCap.getCapID();
			 myCapScriptModel = aa.cap.getCap(capId).getOutput();
			 myCapModel = myCapScriptModel.getCapModel();
			 myCapIDModel = myCapModel.getCapID(); 
			 // Update Status to "Checked In"
			 updateStatusResults = aa.cap.updateAppStatus(myCapIDModel, "APPLICATION", "Checked In", sysDate, "Checked In", systemUserObj);
			if (updateStatusResults.getSuccess()){
				logDebug( "Success: Status for CAP " + myCapIDModel + " was updated to 'Checked In'.");
			} 	
			else
			{ logDebug( "**ERROR: Status for CAP " + myCapIDModel + " was not updated to 'Checked In'."); }
			 
			 // Associate License to CAP
			 associateResult = aa.licenseScript.associateLpWithCap(myCapIDModel, myLicenseScriptModel);
			 if (associateResult.getSuccess()){
				logDebug("Success: " + "License Professional Named '" + myBusinessName + "' Associated with Cap: " + myCapIDModel);
			
				// ===========   Associate Check In Application to Unit Registration		
				myRoomNumber = "";
				appSpecInfoResult = aa.appSpecificInfo.getByCapID(myCapIDModel);
				if (appSpecInfoResult.getSuccess()){
					fAppSpecInfoObj = appSpecInfoResult.getOutput();
					for (loopk in fAppSpecInfoObj){
						FieldDesc = fAppSpecInfoObj[loopk].checkboxDesc;
						if (String(FieldDesc).indexOf('Room or Unit Number') != -1){
							myRoomNumber = fAppSpecInfoObj[loopk].checklistComment;
						}
					}
					
					myAltID = myLicenseNo + "|" + myRoomNumber;
					logDebug("Parent's AltID: " + myAltID);
					
					// Get Parent Cap by AltID
					myParentCapModel = aa.cap.getCapModel().getOutput();
					myParentCapModel.setAltID(myAltID);
					myParentCapList = aa.cap.getCapIDListByCapModel(myParentCapModel).getOutput();
					// Cycle through altIDs, make sure they match EXACTLY (altID search seems to be returning wildcards).
					// Example: Search for 'HOTEL NAME|1' will also return 'HOTEL NAME|10' & 'HOTEL NAME|122' & .....
					myParentCapIDModel = null;
					for (x in myParentCapList) {
						 tempCapIDScriptModel = myParentCapList[x];
						 tempCapIDModel = tempCapIDScriptModel.getCapID();
						 tempCapScriptModel = aa.cap.getCap(tempCapIDModel).getOutput();
						 tempCapModel = tempCapScriptModel.getCapModel();
						 tempAltID = tempCapModel.getAltID();
						 tempAltID = String(tempAltID).toUpperCase();
						 myAltID = String(myAltID).toUpperCase();
						 if (tempAltID == myAltID){
							myParentCapIDModel = tempCapIDModel;
							myParentCapModel = tempCapModel;
							logDebug("Parent's CAPID (Room Registration): " + myParentCapIDModel);
							
						}
					}
					
					// Associate Child (Check In Application) to Parent (Room Registration)
					var linkResult = aa.cap.createAppHierarchy(myParentCapIDModel, myCapIDModel);
					if (linkResult.getSuccess()){
						logDebug("Successfully linked to Parent Application");
						myCheckInAltID = myLicenseNo + "|" + myRoomNumber + "|" + "In";
						altIdResults = aa.cap.updateCapAltID(myCapIDModel, myCheckInAltID);						
						if (altIdResults.getSuccess()){
							logDebug("Alt ID Updated: " + myCheckInAltID);
						}else{logDebug( "**ERROR: ALTID Update Failed: " + altIdResults.getErrorMessage());}
						
					}else{
						logDebug( "**ERROR: linking to parent application: " + linkResult.getErrorMessage());
					}
					
				}else {
					logDebug("**Error Finding AppSpecificInfo Group by CAP ID while attempting to retrieve Unit Number: " + appSpecInfoResult.getErrorMessage());
				}
				 
			}else {
				logDebug("**Error Associating Licensed Professional to the Current User: " + associateResult.getErrorMessage());
			}
		}
		
	}else{
		logDebug("**Error retreiving Licensed Professional related to the Current User: " + licScriptResult.getErrorMessage());
	}	
}	

function executeCheckInAfterSubmitAA(){
	logDebug("Started Script!");
	// Get Cap Id
	
	var cap_id1 = aa.env.getValue("PermitId1");
    var cap_id2 = aa.env.getValue("PermitId2");
    var cap_id3 = aa.env.getValue("PermitId3");
	
	// Get CapModel By CapId
	var myCapIDModel = aa.cap.getCapIDModel(cap_id1,cap_id2,cap_id3).getOutput();
	var myTempCapModel = aa.cap.getCapModel().getOutput();
	myTempCapModel.setCapID(myCapIDModel);

	// ================= Associate Unit Registration with Check In =========================
	// First get Licensed Professional to find Business Name and use it to find Alt Id.
	var myCapList = aa.cap.getCapIDListByCapModel(myTempCapModel).getOutput();
	for (x in myCapList) {
		 thisCap = myCapList[x];
		 capId = thisCap.getCapID();
		 myCapScriptModel = aa.cap.getCap(capId).getOutput();
		 myCapModel = myCapScriptModel.getCapModel();
		 myCapIDModel = myCapModel.getCapID(); 

		// Retrieve associated License Professional
		// Get License Script Model From Cap ID
		/*
		var licProResult = aa.licenseScript.getLicenseProf(myCapIDModel);	
		if (licProResult.getSuccess()){
			licProArray = licProResult.getOutput();
            licProScriptModel = licProArray[0];
            var myBusinessName = licProScriptModel.getBusinessName();
            logDebug("myBusinessName: " + myBusinessName);
			var myBusinessNameTruncated = String(myBusinessName).substring(0,20);				
		}else{
			logDebug("**Error retreiving Licensed Professional ");
		}		*/
		
// **CHANGED HERE		
		licNumber = getAppSpecific("LPNumber");				
		licenseListResult = aa.licenseScript.getRefLicensesProfByLicNbr(servProvCode, licNumber);
		if (licenseListResult.getSuccess()){
			licenseList = licenseListResult.getOutput();
			myLicense = licenseList[0];     //assume only 1 LP
		//		licenseType = myLicense.getLicenseType();

				
			var myBusinessName = myLicense.getBusinessName();
			var myLicenseNo = myLicense.getStateLicense();
			logDebug("myBusinessName: " + myBusinessName);
			//var myBusinessNameTruncated = String(myBusinessName).substring(0,20);

			// Associate License to CAP
			associateResult = aa.licenseScript.associateLpWithCap(myCapIDModel, myLicense);
			if (associateResult.getSuccess()){
				logDebug("Success: " + "License Professional Named '" + myBusinessName + "' Associated with Cap: " + myCapIDModel);
			}else {
				logDebug("** ERROR: " + "Failed to associate License Professional Named '" + myBusinessName + "' with Cap: " + myCapIDModel);
			}
			
			// Get Room Number		
			myRoomNumber = "";
			appSpecInfoResult = aa.appSpecificInfo.getByCapID(myCapIDModel);
			if (appSpecInfoResult.getSuccess()){
				fAppSpecInfoObj = appSpecInfoResult.getOutput();
				for (loopk in fAppSpecInfoObj){
					FieldDesc = fAppSpecInfoObj[loopk].checkboxDesc;
					if (String(FieldDesc).indexOf('Unit Number') != -1){
						myRoomNumber = fAppSpecInfoObj[loopk].checklistComment;
					}
				}
				
				myAltID = myLicenseNo + "|" + myRoomNumber;
				logDebug("Parent's AltID: " + myAltID);
				
				// Get Parent Cap by AltID
				myParentCapModel = aa.cap.getCapModel().getOutput();
				myParentCapModel.setAltID(myAltID);
				myParentCapList = aa.cap.getCapIDListByCapModel(myParentCapModel).getOutput();
				// Cycle through altIDs, make sure they match EXACTLY (altID search seems to be returning wildcards).
				// Example: Search for 'HOTEL NAME|1' will also return 'HOTEL NAME|10' & 'HOTEL NAME|122' & .....
				myParentCapIDModel = null;
				for (x in myParentCapList) {
					 tempCapIDScriptModel = myParentCapList[x];
					 tempCapIDModel = tempCapIDScriptModel.getCapID();
					 tempCapScriptModel = aa.cap.getCap(tempCapIDModel).getOutput();
					 tempCapModel = tempCapScriptModel.getCapModel();
					 tempAltID = tempCapModel.getAltID();
					 tempAltID = String(tempAltID).toUpperCase();
					 myAltID = String(myAltID).toUpperCase();
					 if (tempAltID == myAltID){
						myParentCapIDModel = tempCapIDModel;
						myParentCapModel = tempCapModel;
						logDebug("Parent's CAPID (Room Registration): " + myParentCapIDModel);
					}
				}
				
				// Associate Child (Check In Application) to Parent (Room Registration)
				var linkResult = aa.cap.createAppHierarchy(myParentCapIDModel, myCapIDModel);
				if (linkResult.getSuccess()){
					logDebug("Successfully linked to Parent Application");
					myCheckInAltID = myLicenseNo + "|" + myRoomNumber + "|" + "In";
					altIdResults = aa.cap.updateCapAltID(myCapIDModel, myCheckInAltID);						
					if (altIdResults.getSuccess()){
						logDebug("Alt ID Updated: " + myCheckInAltID);
					}else{logDebug( "**ERROR: ALTID Update Failed: " + altIdResults.getErrorMessage());}
					
				}else{
					logDebug( "**ERROR: linking to parent application: " + linkResult.getErrorMessage());
				}
				
			}else {
				logDebug("**Error Finding AppSpecificInfo Group by CAP ID while attempting to retrieve Unit Number: " + appSpecInfoResult.getErrorMessage());
			}
		}else{logDebug("**Error retreiving Licensed Professional for LPNumber: " + licNumber);}			
			
	}

}	

function executeCheckOutAfterSubmitACA(){
	// Get Cap Id
	var cap_id1 = aa.env.getValue("PermitId1");
    var cap_id2 = aa.env.getValue("PermitId2");
    var cap_id3 = aa.env.getValue("PermitId3");
	logDebug("Script executeCheckOutAfterSubmitACA running for CAPID: " + cap_id1 + "-" + cap_id2 + "-" + cap_id3);
	// Get User Seq Number From Online Public UserID
	var myUserSeqNum = String(publicUserID).replace(/\D/g, '');
	
	// Get License Script Model From User Sequence Number
	var licScriptResult = aa.licenseScript.getRefLicProfByOnlineUser(myUserSeqNum);	
	if (licScriptResult.getSuccess()){
		LicenseScriptModelList = licScriptResult.getOutput();
		if (LicenseScriptModelList != null){
			var myLicenseScriptModel = LicenseScriptModelList[0];
			var myBusinessName = myLicenseScriptModel.getBusinessName();
			var myLicenseNo = myLicenseScriptModel.getStateLicense();
			//var myBusinessNameTruncated = String(myBusinessName).substring(0,20);
			// Get CapModel By CapId
			var myCapIDModel = aa.cap.getCapIDModel(cap_id1,cap_id2,cap_id3).getOutput();
			var myTempCapModel = aa.cap.getCapModel().getOutput();
			myTempCapModel.setCapID(myCapIDModel);

			// ================= Associate License Professional to Cap
			var myCapList = aa.cap.getCapIDListByCapModel(myTempCapModel).getOutput();
			for (x in myCapList) {
				 thisCap = myCapList[x];
				 capId = thisCap.getCapID();
				 myCapScriptModel = aa.cap.getCap(capId).getOutput();
				 myCapModel = myCapScriptModel.getCapModel();
				 myCapIDModel = myCapModel.getCapID(); 
				 associateResult = aa.licenseScript.associateLpWithCap(myCapIDModel, myLicenseScriptModel);
				 if (associateResult.getSuccess()){
					logDebug("Success! " + "License Professional Named : '" + myBusinessName + "' Associated with CheckOut Cap: " + myCapModel.getCapID());
				
					// ===========   Associate Check In Application to CheckOut			
					// Get CheckIn AltID
					myRoomNumber = "";
					myCheckOutDate = "";
					appSpecInfoResult = aa.appSpecificInfo.getByCapID(myCapIDModel);
					if (appSpecInfoResult.getSuccess()){
						fAppSpecInfoObj = appSpecInfoResult.getOutput();
						for (loopk in fAppSpecInfoObj){
							FieldDesc = fAppSpecInfoObj[loopk].checkboxDesc;
							if (String(FieldDesc).indexOf('Room or Unit Number') != -1){
								myRoomNumber = fAppSpecInfoObj[loopk].checklistComment;
							}
							if (String(FieldDesc).indexOf('Check Out Date') != -1){
								myCheckOutDate = fAppSpecInfoObj[loopk].checklistComment;
							}
						}
						
						myCheckInAltID = myLicenseNo + "|" + myRoomNumber + "|" + "In";
						logDebug("CheckIn's AltID: " + myCheckInAltID);

						// Get Check In CAP by AltID 			
						myTempCheckInCapModel = aa.cap.getCapModel().getOutput();
						myTempCheckInCapModel.setAltID(myCheckInAltID);
						myCheckInCapResults = aa.cap.getCapIDListByCapModel(myTempCheckInCapModel)
						
						if (myCheckInCapResults.getSuccess()){
							myCheckInCapList = myCheckInCapResults.getOutput();
							for (x in myCheckInCapList) {
								 myCheckInCapIDScriptModel = myCheckInCapList[x];
								 myCheckInCapIDModel = myCheckInCapIDScriptModel.getCapID();
								 logDebug("myCheckInCapIDModel: " + myCheckInCapIDModel);
								 myCheckInCapScriptModel = aa.cap.getCap(capId).getOutput();
								 myCheckInCapModel = myCapScriptModel.getCapModel();
								 
								 // Get Check In Start Date
								 /**/
								myStartDate = "";
								appSpecDate = aa.appSpecificInfo.getByCapID(myCheckInCapIDModel);
								if (appSpecDate.getSuccess()){
									fAppSpecInfoObj = appSpecDate.getOutput();
									for (loopk in fAppSpecInfoObj){
										FieldDesc = fAppSpecInfoObj[loopk].checkboxDesc;
										if (String(FieldDesc).indexOf('Start Date') != -1){
											myStartDate = fAppSpecInfoObj[loopk].checklistComment;
										}
									}
								}else{logDebug("**ERROR: Couldn't Get Start Date! " + appSpecDate.getErrorMessage())}
							}
							
		
							// Associate Check Out Application to Check In Application
							var linkResult = aa.cap.createAppHierarchy(myCheckInCapIDModel, myCapIDModel);
							if (linkResult.getSuccess()){
								logDebug("Successfully linked Check In to Check Out");
								
								// =========== Update Check In Application Status, Check Out Date, and Nights Stayed
								// Calculate Different in Nights between Start Date and End Date
								jsStartDate = new Date(String(myStartDate));
								jsEndDate = new Date(String(myCheckOutDate));
								logDebug( "myStartDate: " + jsStartDate);
								logDebug( "myEndDate: " + jsEndDate);
								diff = jsEndDate - jsStartDate;
								diff = Math.floor( diff / 86400000);
								nightsStayed = diff;
								
								// Guest can't stay 0 nights, default to 1
								if (nightsStayed == 0) {
									nightsStayed = 1;
								}
								
								// ===================== Update Room Registration ASI Table Occupancy
								
								registrationAltID = myLicenseNo + "|" + myRoomNumber;
								logDebug("Registration AltID: " + registrationAltID);
								
								// Get Registration Cap by AltID
								myRegistrationCapModel = aa.cap.getCapModel().getOutput();
								myRegistrationCapModel.setAltID(registrationAltID);
								myRegistrationCapList = aa.cap.getCapIDListByCapModel(myRegistrationCapModel).getOutput();
								
								// Cycle through altIDs, make sure they match EXACTLY (altID search seems to be returning wildcards).
								// Example: Search for 'HOTEL NAME|1' will also return 'HOTEL NAME|10' & 'HOTEL NAME|122' & .....
								myRegistrationCapIDModel = null;
								for (x in myRegistrationCapList) {
									 tempCapIDScriptModel = myRegistrationCapList[x];
									 tempCapIDModel = tempCapIDScriptModel.getCapID();
									 tempCapScriptModel = aa.cap.getCap(tempCapIDModel).getOutput();
									 tempCapModel = tempCapScriptModel.getCapModel();
									 tempAltID = tempCapModel.getAltID();
									 tempAltID = String(tempAltID).toUpperCase();
									 registrationAltID = String(registrationAltID).toUpperCase();
									 if (tempAltID == registrationAltID){
										myRegistrationCapIDModel = tempCapIDModel;
										//myParentCapModel = tempCapModel;
										logDebug("Registration CAPID (Room Registration): " + myRegistrationCapIDModel);
										
									}
								}							
							
								//Add Change Room Functionality
								checkOutType = getAppSpecific("Check Out Type");
								newRoomNum = getAppSpecific("New Room Number");
								newCheckInType = getAppSpecific("Check In Type",myCheckInCapIDModel);
								if (checkOutType == "Room Change") {
									logDebug("They Changed Room");
									newRoom = createCap("Services/Unit/Check In/New",newRoomNum); 
									copyLicensedProf(myCheckInCapIDModel, newRoom); 
									copyContactsByType(myCheckInCapIDModel, newRoom, "GUEST"); 
									editAppSpecific("Start Date",myCheckOutDate, newRoom); 
									editAppSpecific("Room or Unit Number",newRoomNum,newRoom);
									editAppSpecific("Check In Type",newCheckInType,newRoom);
									updateStatusResults = aa.cap.updateAppStatus(newRoom, "APPLICATION", "Checked In", sysDate, "Checked In", systemUserObj);
									myCheckInNewAltID = myLicenseNo + "|" + newRoomNum + "|In"; //licNo + "|" + newRoomNumber + "|" + "Out";
									altIdResults = aa.cap.updateCapAltID(newRoom, myCheckInNewAltID);
									 
									
									var newRoomCapIDModel = newRoom;
									var newRoomCapScriptModel = myCap = aa.cap.getCap(newRoomCapIDModel).getOutput();
									newRoomCapModel = newRoomCapScriptModel.getCapModel();

									capIdString = myCheckInCapIDModel.getID1() + "-" + myCheckInCapIDModel.getID2() + "-" + myCheckInCapIDModel.getID3();
									logDebug("Copying Documents from: " + capIdString);
									
									
								

									//var srcCapIDmodel = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.CapIDModel").getOutput();
									//srcCapIDmodel.setID1('14CAP');
									//srcCapIDmodel.setID2('00000');
									//srcCapIDmodel.setID3('003EX');
									//srcCapIDmodel.setServiceProviderCode('DTCM');
									
									copyDocuments(myCheckInCapIDModel, newRoomCapIDModel);
								
									// Associate Check In Application to Room Record
									var linkResult = aa.cap.createAppHierarchy(myRegistrationCapIDModel, newRoom);
									if (linkResult.getSuccess()){
										logDebug("Successfully linked Check In to Room");
									}
								}
							
								// Finally, Edit Occupancy 
								// First, Check if the room is exempted (i.e, exemption is checked or check in type is "in-house" on check in
								// or if the check out type is "Cancellation", or "Room Change" on same day as check in.
								var checkInAppSpecInfoResult = aa.appSpecificInfo.getByCapID(myCheckInCapIDModel);
								if (checkInAppSpecInfoResult.getSuccess()){
									var fAppSpecInfoObj = checkInAppSpecInfoResult.getOutput();
									for (loopk in fAppSpecInfoObj){
											FieldDesc = fAppSpecInfoObj[loopk].checkboxDesc;
											if (String(FieldDesc).indexOf('Exemption') != -1){
												exemption = fAppSpecInfoObj[loopk].checklistComment;
												//aa.print(FieldValue);
											}
											if (String(FieldDesc).indexOf('Check In Type') != -1){
												checkInType = fAppSpecInfoObj[loopk].checklistComment;
												//aa.print(FieldValue);
											}
											if (String(FieldDesc).indexOf('Start Date') != -1){
												checkInDate = fAppSpecInfoObj[loopk].checklistComment;
												//aa.print(FieldValue);
											}
									}
								}

								
								var checkOutAppSpecInfoResult = aa.appSpecificInfo.getByCapID(myCapIDModel);
								if (checkOutAppSpecInfoResult.getSuccess()){
									var fAppSpecInfoObj = checkOutAppSpecInfoResult.getOutput();
									for (loopl in fAppSpecInfoObj){
											FieldDesc = fAppSpecInfoObj[loopl].checkboxDesc;
											if (String(FieldDesc).indexOf('Check Out Type') != -1){
												checkOutType = fAppSpecInfoObj[loopl].checklistComment;
												//aa.print(FieldValue);
											}
											if (String(FieldDesc).indexOf('Check Out Date') != -1){
												checkOutDate = fAppSpecInfoObj[loopl].checklistComment;
												//aa.print(FieldValue);
											}
									}
								}
								
								exemption = String(exemption).toLowerCase();
								checkInType = String(checkInType).toLowerCase();
								checkOutType = String(checkOutType).toLowerCase();
								
								logDebug("Exemption: " + exemption);
								logDebug("checkInType: " + checkInType);
								logDebug("checkOutType: " + checkOutType);
								
								if (exemption == "checked" || checkInType == "in-house" || checkOutType == "cancelled" || (checkOutType == "room change" && (checkOutDate == checkInDate)) ){
									logDebug( "**No fee calculated! Exemption applied"); 
									//** Remove Number of Nights Stayed From the ASI Table
									if (checkOutType == "cancelled"){
										currMonth = new Date().getMonth() + 1;
										currYear = new Date().getFullYear();
										if (editOccupancyASITAccordingtoAmendment(myRegistrationCapIDModel, currMonth, currYear, -nightsStayed,"")){
											logDebug("Occupancy Edited Successfully," + nightsStayed + " nights subtracted from ASIT for capId: " + myRegistrationCapIDModel);
										}else{
											logDebug( "**ERROR: Occupancy Edit Failed! Couldn't Subtract " + nightsStayed + " nights from CapId: " + myRegistrationCapIDModel);
										}									
									}
								}else { 
									if (editOccupancyASIT(myRegistrationCapIDModel)){
										logDebug("Occupancy Edited Successfully!");
									}else{
										logDebug( "**ERROR: Occupancy Update Failed!");
									}
								}
								
								// Update Status							
								updateStatusResults = aa.cap.updateAppStatus(myCheckInCapIDModel, "APPLICATION", "Checked Out", sysDate, "Checked Out", systemUserObj);
								myCheckOutAltID = String(myCheckInCapIDModel); //myBusinessNameTruncated + "|" + myRoomNumber + "|" + "Out";
								altIdResults = aa.cap.updateCapAltID(myCheckInCapIDModel, myCheckOutAltID);
								if (altIdResults.getSuccess()){
									logDebug("Alt ID Updated: " + myCheckOutAltID);
								}else{logDebug( "**ERROR: ALTID Update Failed: " + altIdResults.getErrorMessage());}
								
								if (updateStatusResults.getSuccess()){
									logDebug( "Success: Updated Checked In Status to Checked Out!");
									// Update CheckOutDate & Nights Stayed
									var appSpecInfoResult1 = aa.appSpecificInfo.editSingleAppSpecific(myCheckInCapIDModel,"Check Out Date",String(myCheckOutDate),"CHECK IN INFO");
									var appSpecInfoResult2 = aa.appSpecificInfo.editSingleAppSpecific(myCheckInCapIDModel,"Nights Stayed",String(nightsStayed),"CHECK IN INFO");

									if (appSpecInfoResult1.getSuccess())
									 {
										logDebug( "SUCCESS: Check Out Date was updated."); 
									} 	
									else { logDebug( "WARNING: Check Out Date was not updated."); }								
									
									if (appSpecInfoResult2.getSuccess())
									 {
										logDebug( "SUCCESS: Nights Stayed was updated."); 
									} 	
									else { logDebug( "WARNING: Nights Stayed was not updated."); }

									
								}else{logDebug( "**ERROR: Updating Checked In Status to Checked Out: " + updateStatusResults.getErrorMessage());}
								
							}else{
								logDebug( "**ERROR: linking to parent application: " + linkResult.getErrorMessage());
							}
						}else{logDebug( "**ERROR: linking to parent application: " + myCheckInCapResults.getErrorMessage());}
						
					}else {
						logDebug("**Error Finding AppSpecificInfo Group by CAP ID while attempting to retrieve Unit Number: " + appSpecInfoResult.getErrorMessage());
					}
					 
				}else {
					logDebug("**Error Associating Licensed Professional to the Current User: " + associateResult.getErrorMessage());
				}
			}
		}else{
			logDebug("**Error Can't find Licensed Professional associated with the Current User: " + licScriptResult.getErrorMessage());
		}			
	}else{
		logDebug("**Error Can't find Licensed Professional associated with the Current User: " + licScriptResult.getErrorMessage());
	}	
}	


function executeCheckOutAfterSubmitAA(){
	logDebug( "Started Script: executeCheckOutAfterSubmitAA");
	// Get Cap Id
	var cap_id1 = aa.env.getValue("PermitId1");
    var cap_id2 = aa.env.getValue("PermitId2");
    var cap_id3 = aa.env.getValue("PermitId3");
		
	// Get CapModel By CapId
	var myCapIDModel = aa.cap.getCapIDModel(cap_id1,cap_id2,cap_id3).getOutput();
	var myTempCapModel = aa.cap.getCapModel().getOutput();
	myTempCapModel.setCapID(myCapIDModel);

	// ================= Associate License Professional to Cap
	var myCapList = aa.cap.getCapIDListByCapModel(myTempCapModel).getOutput();
	for (x in myCapList) {
		 thisCap = myCapList[x];
		 capId = thisCap.getCapID();
		 myCapScriptModel = aa.cap.getCap(capId).getOutput();
		 myCapModel = myCapScriptModel.getCapModel();
		 myCapIDModel = myCapModel.getCapID(); 		
	
		// Retrieve License Professional
		
// **CHANGED HERE	
		licNumber = getAppSpecific("LPNumber");				
		licenseListResult = aa.licenseScript.getRefLicensesProfByLicNbr(servProvCode, licNumber);
		if (licenseListResult.getSuccess()){
			licenseList = licenseListResult.getOutput();	
			if (licenseList != null){
				myLicense = licenseList[0];     //assume only 1 LP
				// licenseType = myLicense.getLicenseType();

				var myBusinessName = myLicense.getBusinessName();
				var myLicenseNo = myLicense.getStateLicense();
				logDebug("myBusinessName: " + myBusinessName);
				//var myBusinessNameTruncated = String(myBusinessName).substring(0,20);
				// Associate License to CAP
				associateResult = aa.licenseScript.associateLpWithCap(myCapIDModel, myLicense);
				if (associateResult.getSuccess()){
					logDebug("Success: " + "License Professional Named '" + myBusinessName + "' Associated with Cap: " + myCapIDModel);
				}else {
					logDebug("** ERROR: " + "Failed to associate License Professional Named '" + myBusinessName + "' with Cap: " + myCapIDModel);
				}
				

				// ===========   Associate Check In Application to CheckOut			
				// Get CheckIn AltID
				myRoomNumber = "";
				myCheckOutDate = "";
				appSpecInfoResult = aa.appSpecificInfo.getByCapID(myCapIDModel);
				if (appSpecInfoResult.getSuccess()){
					fAppSpecInfoObj = appSpecInfoResult.getOutput();
					for (loopk in fAppSpecInfoObj){
						FieldDesc = fAppSpecInfoObj[loopk].checkboxDesc;
						if (String(FieldDesc).indexOf('Unit Number') != -1){
							myRoomNumber = fAppSpecInfoObj[loopk].checklistComment;
						}
						if (String(FieldDesc).indexOf('Check Out Date') != -1){
							myCheckOutDate = fAppSpecInfoObj[loopk].checklistComment;
						}
					}
					
					myCheckInAltID = myLicenseNo + "|" + myRoomNumber + "|" + "In";
					logDebug("CheckIn's AltID: " + myCheckInAltID);

					// Get Check In CAP by AltID 			
					myTempCheckInCapModel = aa.cap.getCapModel().getOutput();
					myTempCheckInCapModel.setAltID(myCheckInAltID);
					myCheckInCapResults = aa.cap.getCapIDListByCapModel(myTempCheckInCapModel)
					
					if (myCheckInCapResults.getSuccess()){
						myCheckInCapList = myCheckInCapResults.getOutput();
						for (x in myCheckInCapList) {
							 myCheckInCapIDScriptModel = myCheckInCapList[x];
							 myCheckInCapIDModel = myCheckInCapIDScriptModel.getCapID();
							 logDebug("myCheckInCapIDModel: " + myCheckInCapIDModel);
							 myCheckInCapScriptModel = aa.cap.getCap(capId).getOutput();
							 myCheckInCapModel = myCapScriptModel.getCapModel();
							 
							 // Get Check In Start Date
							 /**/
							myStartDate = "";
							appSpecDate = aa.appSpecificInfo.getByCapID(myCheckInCapIDModel);
							if (appSpecDate.getSuccess()){
								fAppSpecInfoObj = appSpecDate.getOutput();
								for (loopk in fAppSpecInfoObj){
									FieldDesc = fAppSpecInfoObj[loopk].checkboxDesc;
									if (String(FieldDesc).indexOf('Start Date') != -1){
										myStartDate = fAppSpecInfoObj[loopk].checklistComment;
									}
								}
							}else{logDebug("**ERROR: Couldn't Get Start Date! " + appSpecDate.getErrorMessage())}
						}
						
						// Associate Check Out Application to Check In Application
						var linkResult = aa.cap.createAppHierarchy(myCheckInCapIDModel, myCapIDModel);
						if (linkResult.getSuccess()){
							logDebug("Successfully linked Check In to Check Out");
							
							// =========== Update Check In Application Status, Check Out Date, and Nights Stayed
							// Calculate Different in Nights between Start Date and End Date
							jsStartDate = new Date(String(myStartDate));
							jsEndDate = new Date(String(myCheckOutDate));
							logDebug( "myStartDate: " + jsStartDate);
							logDebug( "myEndDate: " + jsEndDate);
							diff = jsEndDate - jsStartDate;
							diff = Math.floor( diff / 86400000);
							nightsStayed = diff;
							
							// Guest can't stay 0 nights, default to 1
							if (nightsStayed == 0) {
								nightsStayed = 1;
							}
							
							// ===================== Update Room Registration ASI Table Occupancy
							
							registrationAltID = myLicenseNo + "|" + myRoomNumber;
							logDebug("Registration AltID: " + registrationAltID);
							
							// Get Registration Cap by AltID
							myRegistrationCapModel = aa.cap.getCapModel().getOutput();
							myRegistrationCapModel.setAltID(registrationAltID);
							myRegistrationCapList = aa.cap.getCapIDListByCapModel(myRegistrationCapModel).getOutput();
							
							// Cycle through altIDs, make sure they match EXACTLY (altID search seems to be returning wildcards).
							// Example: Search for 'HOTEL NAME|1' will also return 'HOTEL NAME|10' & 'HOTEL NAME|122' & .....
							myRegistrationCapIDModel = null;
							for (x in myRegistrationCapList) {
								 tempCapIDScriptModel = myRegistrationCapList[x];
								 tempCapIDModel = tempCapIDScriptModel.getCapID();
								 tempCapScriptModel = aa.cap.getCap(tempCapIDModel).getOutput();
								 tempCapModel = tempCapScriptModel.getCapModel();
								 tempAltID = tempCapModel.getAltID();
								 tempAltID = String(tempAltID).toUpperCase();
								 registrationAltID = String(registrationAltID).toUpperCase();
								 if (tempAltID == registrationAltID){
									myRegistrationCapIDModel = tempCapIDModel;
									//myParentCapModel = tempCapModel;
									logDebug("Registration CAPID (Room Registration): " + myRegistrationCapIDModel);
									
								}
							}			


							//Add Change Room Functionality
							checkOutType = getAppSpecific("Check Out Type");
							newRoomNum = getAppSpecific("New Room Number");
							newCheckInType = getAppSpecific("Check In Type",myCheckInCapIDModel);
							if (checkOutType == "Room Change") {
								logDebug("They Changed Room");
								newRoom = createCap("Services/Unit/Check In/New",newRoomNum); 
								copyLicensedProf(myCheckInCapIDModel, newRoom); 
								copyContactsByType(myCheckInCapIDModel, newRoom, "GUEST"); 
								editAppSpecific("Start Date",myCheckOutDate, newRoom); 
								editAppSpecific("Room or Unit Number",newRoomNum,newRoom);
								editAppSpecific("Check In Type",newCheckInType,newRoom);
								updateStatusResults = aa.cap.updateAppStatus(newRoom, "APPLICATION", "Checked In", sysDate, "Checked In", systemUserObj);
								myCheckInNewAltID = myLicenseNo + "|" + newRoomNum + "|In"; //licNo + "|" + newRoomNumber + "|" + "Out";
								altIdResults = aa.cap.updateCapAltID(newRoom, myCheckInNewAltID);
								 
								
								var newRoomCapIDModel = newRoom;
								var newRoomCapScriptModel = aa.cap.getCap(newRoomCapIDModel).getOutput();
								var newRoomCapModel = newRoomCapScriptModel.getCapModel();

								var capIdString = myCheckInCapIDModel.getID1() + "-" + myCheckInCapIDModel.getID2() + "-" + myCheckInCapIDModel.getID3();
								logDebug("Copying Documents from: " + capIdString);
								copyDocuments(capIdString, newRoomCapModel);
							
								// Associate Check In Application to Room Record
								var linkResult = aa.cap.createAppHierarchy(myRegistrationCapIDModel, newRoom);
								if (linkResult.getSuccess()){
									logDebug("Successfully linked Check In to Room");
								}
							}				
							// Finally, Edit Occupancy 
							// First, Check if the room is exempted (i.e, exemption is checked or check in type is "in-house" on check in
							// or if the check out type is "Cancellation", or "Room Change" on same day as check in.
							var checkInAppSpecInfoResult = aa.appSpecificInfo.getByCapID(myCheckInCapIDModel);
							if (checkInAppSpecInfoResult.getSuccess()){
								var fAppSpecInfoObj = checkInAppSpecInfoResult.getOutput();
								for (loopk in fAppSpecInfoObj){
										FieldDesc = fAppSpecInfoObj[loopk].checkboxDesc;
										if (String(FieldDesc).indexOf('Exemption') != -1){
											exemption = fAppSpecInfoObj[loopk].checklistComment;
											//aa.print(FieldValue);
										}
										if (String(FieldDesc).indexOf('Check In Type') != -1){
											checkInType = fAppSpecInfoObj[loopk].checklistComment;
											//aa.print(FieldValue);
										}
										if (String(FieldDesc).indexOf('Start Date') != -1){
											checkInDate = fAppSpecInfoObj[loopk].checklistComment;
											//aa.print(FieldValue);
										}
								}
							}

							
							var checkOutAppSpecInfoResult = aa.appSpecificInfo.getByCapID(myCapIDModel);
							if (checkOutAppSpecInfoResult.getSuccess()){
								var fAppSpecInfoObj = checkOutAppSpecInfoResult.getOutput();
								for (loopl in fAppSpecInfoObj){
										FieldDesc = fAppSpecInfoObj[loopl].checkboxDesc;
										if (String(FieldDesc).indexOf('Check Out Type') != -1){
											checkOutType = fAppSpecInfoObj[loopl].checklistComment;
											//aa.print(FieldValue);
										}
										if (String(FieldDesc).indexOf('Check Out Date') != -1){
											checkOutDate = fAppSpecInfoObj[loopl].checklistComment;
											//aa.print(FieldValue);
										}
								}
							}
							
							exemption = String(exemption).toLowerCase();
							checkInType = String(checkInType).toLowerCase();
							checkOutType = String(checkOutType).toLowerCase();
							
							logDebug("Exemption: " + exemption);
							logDebug("checkInType: " + checkInType);
							logDebug("checkOutType: " + checkOutType);
							
							
							if (exemption == "checked" || checkInType == "in-house" || checkOutType == "cancelled" || (checkOutType == "room change" && (checkOutDate == checkInDate)) ){
								logDebug( "**No fee calculated! Exemption applied"); 
								//** Remove The Number of Nights Stayed from the ASI Table in case of Cancellation
								if (checkOutType == "cancelled"){
									currMonth = new Date().getMonth() + 1;
									currYear = new Date().getFullYear();
									if (editOccupancyASITAccordingtoAmendment(myRegistrationCapIDModel, currMonth, currYear, -nightsStayed,"")){
										logDebug("Occupancy Edited Successfully," + nightsStayed + " nights subtracted from ASIT for capId: " + myRegistrationCapIDModel);
									}else{
										logDebug( "**ERROR: Occupancy Edit Failed! Couldn't Subtract " + nightsStayed + " nights from CapId: " + myRegistrationCapIDModel);
									}									
								}
							}else { 
								if (editOccupancyASIT(myRegistrationCapIDModel)){
									logDebug("Occupancy Edited Successfully!");
								}else{
									logDebug( "**ERROR: Occupancy Update Failed!");
								}
							}
								
							// Update Status							
							updateStatusResults = aa.cap.updateAppStatus(myCheckInCapIDModel, "APPLICATION", "Checked Out", sysDate, "Checked Out", systemUserObj);
							myCheckOutAltID = String(myCheckInCapIDModel); //myLicenseNo + "|" + myRoomNumber + "|" + "Out";
							altIdResults = aa.cap.updateCapAltID(myCheckInCapIDModel, myCheckOutAltID);
							if (altIdResults.getSuccess()){
								logDebug("Alt ID Updated: " + myCheckOutAltID);
							}else{logDebug( "**ERROR: ALTID Update Failed: " + altIdResults.getErrorMessage());}
							
							if (updateStatusResults.getSuccess()){
								logDebug( "Success: Updated Checked In Status to Checked Out!");
								// Update CheckOutDate & Nights Stayed
								var appSpecInfoResult1 = aa.appSpecificInfo.editSingleAppSpecific(myCheckInCapIDModel,"Check Out Date",String(myCheckOutDate),"CHECK IN INFO");
								var appSpecInfoResult2 = aa.appSpecificInfo.editSingleAppSpecific(myCheckInCapIDModel,"Nights Stayed",String(nightsStayed),"CHECK IN INFO");

								if (appSpecInfoResult1.getSuccess())
								 {
									logDebug( "SUCCESS: Check Out Date was updated."); 
								} 	
								else { logDebug( "WARNING: Check Out Date was not updated."); }								
								
								if (appSpecInfoResult2.getSuccess())
								 {
									logDebug( "SUCCESS: Nights Stayed was updated."); 
								} 	
								else { logDebug( "WARNING: Nights Stayed was not updated."); }
								
								//calling the Check Out Fee Calculation
								calculateCheckOutFee();
								
							}else{logDebug( "**ERROR: Updating Checked In Status to Checked Out: " + updateStatusResults.getErrorMessage());}
							
						}else{
							logDebug( "**ERROR: linking to parent application: " + linkResult.getErrorMessage());
						}
					}else{logDebug( "**ERROR: linking to parent application: " + myCheckInCapResults.getErrorMessage());}
					
				}else {
					logDebug("**Error Finding AppSpecificInfo Group by CAP ID while attempting to retrieve Unit Number: " + appSpecInfoResult.getErrorMessage());

				}
			}else{logDebug("**Error retreiving Licensed Professional for LPNumber: " + licNumber);}
		}else{logDebug("**Error retreiving Licensed Professional for LPNumber: " + licNumber);}

	}

}	

/**
*this method is called after submitting a check out record from AA
*/
function calculateCheckOutFee(){
	//var cap_id1="14CAP";
	//var cap_id2="00000";
	//var cap_id3="000HI";

	var cap_id1 = aa.env.getValue("PermitId1");
	var cap_id2 = aa.env.getValue("PermitId2");
	var cap_id3 = aa.env.getValue("PermitId3");
		

	var roomNumber;
	var startDate;
	var checkOutDate;
	var checkInType;
	var checkOutDate;
	var isCheckInExemption;
	var checkOutType;


	//getting Check Out Cap
	var capID=aa.cap.getCap(cap_id1, cap_id2, cap_id3);
	var capIDModel=capID.getOutput().getCapID();

	logDebug(capIDModel);

	//loading the Check Out ASI
	var checkOutASIGroups=aa.appSpecificInfo.getByCapID(capIDModel).getOutput();

	if(checkOutASIGroups){
		for(y in checkOutASIGroups){
			var myCheckOutASIGroup=checkOutASIGroups[y];
			var fieldDescription=myCheckOutASIGroup.checkboxDesc;
			if(fieldDescription.toString()=="Check Out Type"){
				checkOutType=myCheckOutASIGroup.checklistComment;
			}
		}
	}
	logDebug("the Check Out Type is : "+checkOutType)

	//getting the Check In Cap
	var checkInCap = aa.cap.getProjectParents(capIDModel,1);
	var checkInCapModel=checkInCap.getOutput()[0].getCapID();
	var ASIGroups=aa.appSpecificInfo.getByCapID(checkInCapModel).getOutput();
	if(ASIGroups){
		for(x in ASIGroups){
			var myCapASIGroup=ASIGroups[x];
			var FieldDescription=myCapASIGroup.checkboxDesc;
			if(FieldDescription.toString()=="Room or Unit Number"){
				roomNumber=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Start Date"){
				startDate=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Check In Type"){
				checkInType=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Check Out Date"){
				checkOutDate=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Exemption"){
				isCheckInExemption=myCapASIGroup.checklistComment;
			}
		}
	}

	logDebug("The room number : "+roomNumber);
	logDebug("Check In Date is :"+startDate);
	logDebug("Check Out Date is : "+checkOutDate);
	logDebug("Check In Type is : "+checkInType);
	logDebug("Check Out Date is :"+checkOutDate);
	logDebug("Check In Exemption :"+isCheckInExemption);


	//getting the Unit cap
	var roomCap=aa.cap.getProjectParents(checkInCapModel,1);
	var roomCapModel=roomCap.getOutput()[0].getCapID();
	logDebug("room capID is : "+roomCapModel);


	//Getting the license Professional by the cap Model 
	var licenseProfessional=getLicenseProfessional4AssociatedForms(roomCapModel);

	var roomFee=0;
	if(licenseProfessional){
	var hotelLicense=licenseProfessional[0];
		var licenseSeqNbr=hotelLicense.getLicenseProfessionalModel().getLicSeqNbr();
		var licenseProfessionalModel=hotelLicense.getLicenseProfessionalModel();
		var licenseProfessionalModelType=licenseProfessionalModel.getLicenseType();
		var peopleAttributes =aa.people.getPeopleAttributeByPeople(licenseSeqNbr,licenseProfessionalModelType).getOutput();
		for(v in peopleAttributes){
			var attributeName=peopleAttributes[v].getAttributeName();
			var attributeValue=peopleAttributes[v].getAttributeValue();
			
			//getting the hotel classification and the corresponding fee from the standard choice
			if(attributeName=="CLASSIFICATION" && attributeValue){
				roomFee=aa.bizDomain.getBizDomainByValue("Classification",attributeValue).getOutput().getDescription();
			}
		}

	//getting the hotel name
	var hotelName=hotelLicense.getBusinessName();
	var occupancyDays=getOccupancyDays(startDate,checkOutDate);


	var bedRoomsNumber=getRoomBedsNumber(roomCapModel);
	logDebug("Number of Occupancy Days :"+occupancyDays);
	logDebug("the room classification fee is :"+roomFee);
	logDebug("Bedroom number is :"+bedRoomsNumber);


	feeEnabled=isFeeEnabled(isCheckInExemption,checkInType,checkOutType,occupancyDays);
	occupancyDays=(occupancyDays==0)?1:occupancyDays;
	var checkOutFee=occupancyDays*roomFee*bedRoomsNumber
	checkOutFee=feeEnabled?checkOutFee:0;
	logDebug("Updating the ASI Check out Tourism Dirham Fee to : "+checkOutFee);

	aa.appSpecificInfo.editSingleAppSpecific(capIDModel,"Tourism Dirham Fee",checkOutFee,"CHECK OUT INFO");
	logDebug("Tourism Dirham Fee is updated in ASI");

	//edit the occupancy days accordingly
	//editOccupancyASITAccordingly(roomCapModel,occupancyDays,"SET");


	}else{
		logDebug("There is no License Professional attached")
	}

}
/**/
function editOccupancyASITAccordingly(roomCapModel,occupancyDays,type){
var currentDate=aa.util.now();
var currentClientDate=new Date();

currentClientDate.setTime(currentDate.getTime());
currentMonth=currentClientDate.getMonth()+1;
currentYear=currentClientDate.getFullYear();
//editOccupancyASITAccordingtoAmendment(roomCapModel,currentMonth,currentYear,occupancyDays)
editOccupancyASITAccordingtoAmendment(roomCapModel,currentMonth,currentYear,occupancyDays,type)
}

/**/
function isFeeEnabled(chkInExemption,checkInType,chckOuttype,occupancy){
	var isFeeEnabled=false;
		if(chkInExemption=="CHECKED"){
			isFeeEnabled=false;
		}
		else if(checkInType=="In-House"){
			isFeeEnabled=false;
		}
		else if(chckOuttype=="Normal"){
			isFeeEnabled=true;
		}
		else if(chckOuttype=="Cancelled"){
			isFeeEnabled=false;
		}
		else if(chckOuttype=="Room Change" && occupancy>0){
			isFeeEnabled=true;
		}
		else if(chckOuttype=="Room Change" && occupancy==0){
			isFeeEnabled=false;
		}
	return isFeeEnabled;
}

/**this method return the occupancy days by calculating the difference between Check In Date and Check Out Date **/
/*
function getOccupancyDays(capID){


		//Getting the related ASI Tables by the CAP ID
		var occupancyDays=0;
		ASIT=aa.appSpecificTableScript.getAppSpecificTableGroupModel(capID).getOutput();
		var ta = ASIT.getTablesArray();

		var tai=ta.iterator();

		while (tai.hasNext())
		{
                
			var tsm = tai.next();
			var tn = tsm.getTableName();
				if(tn=="OCCUPANCY"){
					
					var tempColValuesObject=new Array();
					var tsmfldi = tsm.getTableField().iterator();
					var tsmcoli = tsm.getColumns().iterator();
					var numrows = 0;
					var fieldsValues=new Array();
					while (tsmfldi.hasNext()){
																											
						var tval = tsmfldi.next();
						fieldsValues.push(tval)
						numrows++;
						if(numrows==3){
							tempColValuesObject.push(fieldsValues);
							numrows=0;
							fieldsValues=new Array()
						}
				}



				for(var j=0;j<tempColValuesObject.length;j++){
					var occupancyASITObject=new occupancyASIT(tempColValuesObject[j]);
					if(occupancyASITObject.month==aa.util.now().getMonth()){
						occupancyDays=occupancyASITObject.occupancy;
						return occupancyDays;
					}
				}
		}
}

return occupancyDays;
}
*/
/**this method return the occupancy days by calculating the difference between Check In Date and Check Out Date **/
function getOccupancyDays(checkInDate,checkOutDate){

	var occupancyDays=0;
	if(checkInDate && checkOutDate){
					var checkInDate=aa.util.parseDate(checkInDate);
					var checkOutDate=aa.util.parseDate(checkOutDate);

					var dateDifference=checkOutDate.getTime()-checkInDate.getTime();
					occupancyDays=dateDifference/1000/60/60/24;
	}
	return occupancyDays;
}



/** this method return the number of BedRooms for a single unit**/
function getRoomBedsNumber(myCapIDModel){
var roomBedsNumber=0;
var ASIGroups=aa.appSpecificInfo.getByCapID(myCapIDModel).getOutput();
if(ASIGroups){
	for(x in ASIGroups){
		var myCapASIGroup=ASIGroups[x];
		 var FieldDescription=myCapASIGroup.checkboxDesc;
		if(FieldDescription.toString()=="Bedrooms"){
		  roomBedsNumber=myCapASIGroup.checklistComment;
		  if(!roomBedsNumber){roomBedsNumber=0;}
		}
	}
}

return roomBedsNumber;
}

function editOccupancyASIT(capIDModel){

	//Description:
	//ASIT in Accela is made up of 2 ArrayLists, one for columns and one for cells with
	//no connection between the 2 arrays to know which value in the cell array corresponds 
	//to which column and row.
	
	//set itemCap to parameter.
	var itemCap = capIDModel;
	
	var tableName = "OCCUPANCY";
	var colName = "Occupancy";
	var currMonth = new Date().getMonth() + 1;
	var currYear = new Date().getFullYear();

	//Get the specific table object.
	var tsm = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName);
	//**
	
	//Check to make sure the API call was successful, if not, return false;
	if (!tsm.getSuccess())
	{ 
		logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tsm.getErrorMessage()) ; 
		return false; 
	}
	//**
	
	//Perform some validation on input data
	if(colName == null || colName == "")
	{
		logDebug("**WARNING: Error the column name to edit cannot be empty or null");
		return false;
	}

	//**
	
	//Get column arrayList, field arrayList
	var tsm = tsm.getOutput();
	var tsm = tsm.getAppSpecificTableModel();
	var cells = tsm.getTableField();
	var col = tsm.getColumns();
	//**
	
	// 
	
	// Get Row index for both Coditions
	// Conditions: Month = Current Month 
	// Year = Current Year
	var NumberOfColumns = col.size();
	var NumberOfCells = cells.size();
	var NumberOfRows = Math.ceil(NumberOfCells / NumberOfColumns);
	
	
	var occColIndex = -1;
	var monthColIndex = -1;
	var yearColIndex = -1;
	var cIndex = 0;
	j = col.iterator();
	while (j.hasNext())
	{
		objCol = j.next();
		if(objCol.getColumnName().toUpperCase() == "OCCUPANCY"){
			occColIndex = cIndex;
		}else if (objCol.getColumnName().toUpperCase() == "MONTH"){
			monthColIndex = cIndex;
		}else if (objCol.getColumnName().toUpperCase() == "YEAR"){
			yearColIndex = cIndex;		
		}
		cIndex ++;
	}
	if (occColIndex < 0)
	{
		logDebug("**WARNING: error the specified column name (" + colName + ")does not exist");
		return false;
	}
	
	//Get Row Number where Month and Year conditions are met
	var rowIndex = -1;
	var index = 0;

	for (r=0;r<NumberOfRows;r++)
	{
		// Find where Month & Year Match current Month & Year
		currMonthCellIndex = (r*NumberOfColumns) + monthColIndex;
		monthCell = cells.get(currMonthCellIndex);

		currYearCellIndex = (r*NumberOfColumns) + yearColIndex;
		yearCell = cells.get(currYearCellIndex);
		
		if (String(monthCell) == String(currMonth)){
			if (String(yearCell) == String(currYear)){
				rowIndex = r;
			}
		}
	}
	
	if (rowIndex < 0)
	{
		logDebug("**Cannot Find Entry for Month: " + currMonth + ", and Year: " + currYear + " for CAPID: " + capIDModel);
		logDebug("Adding new entry...");
		
		newValue = 1;
		cells.add(String(newValue));
		cells.add(String(currMonth));
		cells.add(String(currYear));

	}else{
	
		//Change specified cell
		//The specified cell index is equal to (the row number * number of columns) + occColIndex
		occCell = (rowIndex * NumberOfColumns) + occColIndex;
		newValue = parseInt(cells.get(occCell));
		newValue += 1; // Increment by 1
		cells.set(occCell, String(newValue));
	}
	
	//**
	
	//Finally set the table back after editing
	tsm.setTableField(cells);
	editResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
	if (!editResult .getSuccess())
	{ 
		logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + editResult.getErrorMessage()); 
		return false;
	}
	else
	{
		logDebug("Successfully edited record(s) in ASI Table: " + tableName + ", New Occupancy Value = " + newValue);
		return true;
	}
	//**
}


function MonthEndCreateFees()
{

var cap_id1 = aa.env.getValue("PermitId1");
    var cap_id2 = aa.env.getValue("PermitId2");
    var cap_id3 = aa.env.getValue("PermitId3");
	
	var parentCapId  = aa.cap.getCapID(cap_id1,cap_id2,cap_id3).getOutput();
	var currentUser = aa.env.getValue("CurrentUserID");
	var emailAddy=aa.person.getUser(currentUser).getOutput().getEmail();

//var emailAddy = "hotel@hotelname.com";
//getting the user license sequence Number
var myPU = aa.publicUser.getPublicUserByEmail(emailAddy).getOutput();
if(myPU!=null){
var userSeq = myPU.getUserSeqNum();
var LicenseProfessionalList= aa.licenseProfessional.getRefLicProfByOnlineUser(userSeq).getOutput();
var myLicenseProf = LicenseProfessionalList[0]; 
}
//Getting Cap Type Model
var capTypeModel = aa.cap.getCapTypeModel().getOutput();
capTypeModel.setGroup("Services");
capTypeModel.setType("Unit");
capTypeModel.setSubType("Hotel Room");
capTypeModel.setCategory("New");

//Getting Cap Model
var capModel = aa.cap.getCapModel().getOutput();
var globalObject=new Array();
if(myLicenseProf){
capModel.setLicenseProfessionalModel(myLicenseProf.getLicenseProfessionalModel());
capModel.setCapType(capTypeModel);
var capIDList = aa.cap.getCapIDListByCapModel(capModel).getOutput();
var colNameAndValues=new Array();


var globalFeesPerUnit=new Array();

for(x in capIDList){
	var unitFees;
	var amount;
	var myCapRecord=capIDList[x];
	capID=myCapRecord.getCapID();
	var roomNumber = getCustomId(myCapRecord.getID1(),myCapRecord.getID2(),myCapRecord.getID3());
	//Getting the related ASI Tables by the CAP ID
	ASIT=aa.appSpecificTableScript.getAppSpecificTableGroupModel(capID).getOutput();
	var ta = ASIT.getTablesArray();

	var tai=ta.iterator();

	while (tai.hasNext())
	 {
	 
		var tsm = tai.next();
	    var tn = tsm.getTableName();
		if(tn=="OCCUPANCY"){
		
		var tempColValuesObject=new Array();
	    var tsmfldi = tsm.getTableField().iterator();
		var tsmcoli = tsm.getColumns().iterator();
		var numrows = 0;
		var fieldsValues=new Array();
		while (tsmfldi.hasNext()){
								
			var tval = tsmfldi.next();
								fieldsValues.push(tval)
								numrows++;
								if(numrows==3){
									tempColValuesObject.push(fieldsValues);
									numrows=0;
									fieldsValues=new Array()
								}
		}



		for(var j=0;j<tempColValuesObject.length;j++){
			var occupancyASITObject=new occupancyASIT(tempColValuesObject[j]);
			if(occupancyASITObject.month==aa.util.now().getMonth()+1){
				globalFeesPerUnit.push(unitFees);
				globalObject.push(occupancyASITObject);
				var busName="";
				if(myLicenseProf){
					busName = myLicenseProf.getBusinessName().slice(0,20);
					myLicenseNo = myLicenseProf.getStateLicense(); //myLicenseProf.getBusinessName().slice(0,20);
					
				}
				roomNumber = roomNumber.substring(roomNumber.lastIndexOf('-'));
				unitFees= busName+roomNumber;
				amount = parseInt(occupancyASITObject.occupancy)*20;
				var newFeeResult = aa.finance.createFeeItem(parentCapId,'UNITFEE','TOURISMFEE','FINAL',amount);
				if (newFeeResult.getSuccess()) {
					var feeSeq = newFeeResult.getOutput();
	
					var newFee = aa.finance.getFeeItemByPK(parentCapId, feeSeq).getOutput().getF4FeeItem();


					newFee.setFeeDescription(unitFees);
					aa.finance.editFeeItem(newFee);

				}
			}
		}
	}
}

}
}




}
function getCustomId(s_id1,s_id2,s_id3)  {

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput().getCustomID();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
  }
  
  
/**
*this object store the ASIT column values
@tempColValuesObjec: Array of ASIT column values
*/
function occupancyASIT(tempColValuesObject){
	this.occupancy=tempColValuesObject[0];
	this.month=tempColValuesObject[1];
	this.year=tempColValuesObject[2];
}

/**
*this function is called on Amendment submit when the user update a Check-in Info
**/
function submitCheckInAmendment(){
logDebug("#######################into submitCheckInAmendment function###############");
    var cap_id1 = aa.env.getValue("PermitId1");
    var cap_id2 = aa.env.getValue("PermitId2");
    var cap_id3 = aa.env.getValue("PermitId3");

	var checkInDate="";
	var checkOutDate="";
	var nightsStayed;
	var updatedNightsStayed;
	var resultNightsStayed;
	var updatedExempted;
	var updatedCheckInType;
	
	//getting the updated info from the Amendment ASI
	var myCapIDModel=aa.cap.getCapID(cap_id1,cap_id2,cap_id3).getOutput();
	
	//getting the estimate or the temporary Cap ID in order to get the parent Cap  NOTE : using the getParent function didn't give any result)
	var estCapID=aa.cap.getProjectByChildCapID(myCapIDModel, "EST", null).getOutput()[0].getProjectID();
	var estCapIDProjectParents = aa.cap.getProjectParents(estCapID,1);
	var estParentCapIDModel=estCapIDProjectParents.getOutput()[0].getCapID();
	var ASIGroups=aa.appSpecificInfo.getByCapID(myCapIDModel).getOutput();
	
	if(ASIGroups){
		for(x in ASIGroups){
			var myCapASIGroup=ASIGroups[x];
			var FieldDescription=myCapASIGroup.checkboxDesc;
			if(FieldDescription.toString()=="Updated Check In Date"){
				checkInDate=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Updated Check Out Date"){
				checkOutDate=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Days Occupied"){
				nightsStayed=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Updated Days Occupied"){
			updatedNightsStayed=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Updated Exemption"){
			updatedExempted=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Check In Type"){
			updatedCheckInType=myCapASIGroup.checklistComment;
			}
		}
    }

	//getting the parent CAP Model and updating the related ASI Fields
      
    logDebug("********"+estParentCapIDModel+"***********")
    logDebug("Nights Stayed should be updated to "+nightsStayed);
	logDebug("Check Out date  should be updated to "+checkOutDate);
	logDebug("check in date should be updated to "+checkInDate);
	logDebug("system date is :"+sysDate);
	logDebug("systemobjectuser is : "+systemUserObj);
	var initialCheckInExemption=getCheckInASIFieldValue(estParentCapIDModel,"Exemption");
	var initialCheckInType=getCheckInASIFieldValue(estParentCapIDModel,"Check In Type");
	var initialNightsStayed=getCheckInASIFieldValue(estParentCapIDModel,"Nights Stayed");
	var initialCheckOutDate=getCheckInASIFieldValue(estParentCapIDModel,"Check Out Date");
	var initialCheckInDate=getCheckInASIFieldValue(estParentCapIDModel,"Start Date");
	logDebug("Initial Nights Stayed were: "+initialNightsStayed);
	logDebug("Initial Check In Type was: "+initialCheckInType);
	logDebug("Initial Exemption was : "+initialCheckInExemption);
	logDebug("Updated Exemption is :"+updatedExempted);
	logDebug("Updated Check In Type is :"+updatedCheckInType)
	
	
	var intialCheckOutDateFormated=aa.util.parseDate(initialCheckOutDate);
	var initialCheckOutDate=new Date();
	initialCheckOutDate.setTime(intialCheckOutDateFormated.getTime());
	
	var initialCheckInDateFormated=aa.util.parseDate(initialCheckInDate);
	var initialCheckInDate=new Date();
	initialCheckInDate.setTime(initialCheckInDateFormated.getTime());
	
	if(initialCheckInType=="In-House" && updatedCheckInType=="Normal" && updatedNightsStayed==0){
		if(initialNightsStayed!=0){
			updatedNightsStayed=initialNightsStayed;
		}else{
			updatedNightsStayed=getInitialOccupiedDays(initialCheckOutDate,initialCheckInDate)
		}
	}
	
	if(initialCheckInExemption=="CHECKED" && updatedExempted!="CHECKED" && updatedNightsStayed==0){
		if(initialNightsStayed!=0){
			updatedNightsStayed=initialNightsStayed;
		}else{
			updatedNightsStayed=getInitialOccupiedDays(initialCheckOutDate,initialCheckInDate)
		}
	}
	aa.appSpecificInfo.editSingleAppSpecific(estParentCapIDModel,"Nights Stayed",updatedNightsStayed,"CHECK IN INFO");
	aa.appSpecificInfo.editSingleAppSpecific(estParentCapIDModel,"Check Out Date",checkOutDate,"CHECK IN INFO");
	aa.appSpecificInfo.editSingleAppSpecific(estParentCapIDModel,"Start Date",checkInDate,"CHECK IN INFO");
	aa.appSpecificInfo.editSingleAppSpecific(estParentCapIDModel,"Exemption",updatedExempted,"CHECK IN INFO");
	aa.appSpecificInfo.editSingleAppSpecific(estParentCapIDModel,"Check In Type",updatedCheckInType,"CHECK IN INFO");
	//updateStatusResults = aa.cap.updateAppStatus(estParentCapIDModel, "APPLICATION", "Closed", sysDate, "Closed", systemUserObj);

	
	var currentDate=aa.util.now();
	var occupancyPreviousMonth=currentDate.getMonth();
	var occupancyCurrentMonth=currentDate.getMonth()+1;
	
	var checkedOutDateFormated=aa.util.parseDate(checkOutDate);
	var checkedOutDate=new Date();
	checkedOutDate.setTime(checkedOutDateFormated.getTime());
	
	var checkedInDateFormated=aa.util.parseDate(checkInDate);
	var checkedInDate=new Date();
	checkedInDate.setTime(checkedInDateFormated.getTime());
	
	
	
	logDebug("CHECK OUT DATE IS :"+checkedOutDate)
	logDebug("CHECK IN DATE IS :"+checkedInDate);
	var mainCapIDModelOutput=aa.cap.getProjectParents(estParentCapIDModel,1).getOutput();
    var mainCapIDModel=mainCapIDModelOutput[0].getCapID();
	
	var checkIndDateMonth=checkedInDate.getMonth()+1;
	var checkOutDateMonth=checkedOutDate.getMonth()+1;
	var initialCheckOutDateMonth=initialCheckOutDate.getMonth()+1;
	var initialCheckInDateMonth=initialCheckInDate.getMonth()+1
	var checkInDateYear=checkedInDate.getFullYear();
	var checkOutDateYear=checkedOutDate.getFullYear();
	var initialCheckOutDateYear=initialCheckOutDate.getFullYear();
	var intialCheckInDateYear=initialCheckInDate.getFullYear();
	
	logDebug("======== Check In Month is : "+checkIndDateMonth+" ==== and Check Out Month is :"+checkOutDateMonth);
	logDebug("======== the main Record ID is :"+mainCapIDModel+"=======");
	logDebug("======== the initial occupied days for this check in was : "+nightsStayed);
	logDebug("======== the updated occupied days for this check in is : "+updatedNightsStayed);
	
	
	logDebug("checkIndDateMonth is :"+checkIndDateMonth)
	logDebug("checkOutDateMonth is :"+checkOutDateMonth)
	logDebug("initialCheckOutDateMonth is :"+initialCheckOutDateMonth);
	
	var checkInMonthDays=daysInMonth(checkIndDateMonth,checkInDateYear);
	var checkOutMonthDays=daysInMonth(checkOutDateMonth,checkOutDateYear);
	var intialCheckOutDays=daysInMonth(initialCheckOutDateMonth,initialCheckOutDateYear);
	var initialCheckInDays=daysInMonth(initialCheckInDateMonth,intialCheckInDateYear);
	
	var checkInMonthDaysOccupied=checkInMonthDays-checkedInDate.getDate();
	var checkOutMonthDaysOccupied=checkedOutDate.getDate();
	var initialCheckoutDaysOccupied=initialCheckOutDate.getDate();
	var initialCheckInDaysOccupied=initialCheckInDate.getDate();
	
	logDebug("initial Check In day is : "+initialCheckInDaysOccupied+"=== and current Check In day is :"+checkedInDate.getDate());
	logDebug("initial Check Out day is :"+initialCheckoutDaysOccupied+"=== and current check Out day is :"+checkOutMonthDaysOccupied);
	
	if(checkIndDateMonth==checkOutDateMonth && checkOutDateMonth==initialCheckOutDateMonth && checkIndDateMonth==initialCheckInDateMonth){
	checkInMonthDaysOccupied=checkedInDate.getDate();
	if(initialCheckInExemption==updatedExempted && updatedExempted=="CHECKED"){
		logDebug("======== inside the first condition =========");	
		resultNightsStayed=0;
	}
	else if(initialCheckInExemption!=updatedExempted && updatedExempted=="CHECKED"){
		logDebug("======== inside the second condition =========");	
		resultNightsStayed=-initialNightsStayed;
	}
	else if(initialCheckInExemption!=updatedExempted && updatedExempted!="CHECKED" && updatedNightsStayed>0){
		logDebug("======== inside the second condition =========");	
		resultNightsStayed=updatedNightsStayed;
	}
	else if(initialCheckInExemption!=updatedExempted && updatedExempted!="CHECKED" && updatedNightsStayed<=0){
		logDebug("======== inside the second condition =========");	
		
		if(initialNightsStayed==0){
			initialNightsStayed=getInitialOccupiedDays(checkedOutDate,checkedInDate);
			logDebug("Getting the intial stayed nights :"+initialNightsStayed)
			resultNightsStayed=(initialNightsStayed!=0)?initialNightsStayed:1;//initialNightsStayed
				
		}else{
			resultNightsStayed=initialNightsStayed-updatedNightsStayed;	
		}
		
		
	}
	else if(initialCheckInType==updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed>=0){
		logDebug("======== inside the third condition =========");	
		logDebug("checkOutMonthDaysOccupied is :"+checkOutMonthDaysOccupied);
		logDebug("checkInMonthDaysOccupied is :"+checkInMonthDaysOccupied);
		logDebug("initialNightsStayed is :"+initialNightsStayed);
		if(checkOutMonthDaysOccupied!=checkInMonthDaysOccupied && initialNightsStayed==0){
			logDebug("========= inside the third first condition")
			initialNightsStayed=getInitialOccupiedDays(initialCheckOutDate,initialCheckInDate);
			resultNightsStayed=updatedNightsStayed-initialNightsStayed;
		}else{
			resultNightsStayed=updatedNightsStayed-initialNightsStayed;
		}
	}
	else if(initialCheckInType==updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed<0){
		logDebug("======== inside the fourth condition =========");	
		resultNightsStayed=0;
	}
	else if(initialCheckInType!=updatedCheckInType && updatedCheckInType=="In-House" && updatedNightsStayed>0){
		logDebug("======== inside the fifth condition =========");	
		resultNightsStayed=-initialNightsStayed;
	}
	else if(initialCheckInType!=updatedCheckInType && updatedCheckInType=="In-House" && updatedNightsStayed<=0){
		logDebug("======== inside the fifth condition =========");	
		if(initialNightsStayed==0){
			initialNightsStayed=getInitialOccupiedDays(checkedOutDate,checkedInDate);
			logDebug("Getting the intial stayed nights :"+initialNightsStayed)
			resultNightsStayed=(initialNightsStayed!=0)?initialNightsStayed:-1;//initialNightsStayed
				
		}else{
			resultNightsStayed=initialNightsStayed-updatedNightsStayed;	
		}
	}
	else if(initialCheckInType!=updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed>0){
		logDebug("======== inside the sixth condition =========");	
		resultNightsStayed=updatedNightsStayed;
	}
	else if(initialCheckInType!=updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed<=0){
		logDebug("======== inside the sixth condition =========");	
		//resultNightsStayed=initialNightsStayed;
		resultNightsStayed=(initialNightsStayed==0)?1:initialNightsStayed;
	}
	logDebug("======== the result occupied days for this check in is : "+resultNightsStayed);
		editOccupancyASITAccordingtoAmendment(mainCapIDModel,checkedOutDate.getMonth()+1,checkedOutDate.getFullYear(),resultNightsStayed,"");
	}else{
		
		var firstMonthOccDays=0;
		var secondMonthOccDays=0;
		
		if(initialCheckInExemption==updatedExempted && updatedExempted=="CHECKED"){
			logDebug("======== inside the first condition =========");	
			firstMonthOccDays=0;
			secondMonthOccDays=0;
		}
		else if(initialCheckInExemption!=updatedExempted && updatedExempted=="CHECKED"){
			logDebug("======== inside the second condition =========");	
			if(initialCheckoutDaysOccupied>initialNightsStayed){//if(checkOutMonthDaysOccupied>initialNightsStayed){
				firstMonthOccDays=0;
				secondMonthOccDays=-initialNightsStayed;
			}else{
				secondMonthOccDays=-initialCheckoutDaysOccupied;//-checkOutMonthDaysOccupied;
				firstMonthOccDays=initialCheckoutDaysOccupied-initialNightsStayed;//-(initialNightsStayed-checkOutMonthDaysOccupied);
				logDebug("removing :"+secondMonthOccDays+" from the second month and "+firstMonthOccDays+" from the first month")
			}
			
		}
		else if(initialCheckInExemption!=updatedExempted && updatedExempted!="CHECKED" && updatedNightsStayed>0){
			logDebug("======== inside the third condition =========");	
			if(updatedNightsStayed>checkOutMonthDaysOccupied){
				secondMonthOccDays=checkOutMonthDaysOccupied;
				firstMonthOccDays=updatedNightsStayed-secondMonthOccDays;
			}else{
				secondMonthOccDays=updatedNightsStayed;
				firstMonthOccDays=0;
			}
			logDebug("=== the first month will be incremented by : "+firstMonthOccDays);
			logDebug("==== the second month will be incremented by :"+secondMonthOccDays)
		}
		else if(initialCheckInExemption!=updatedExempted && updatedExempted!="CHECKED" && updatedNightsStayed<=0){
			logDebug("======== inside the fourth condition =========");	
		    
			if(checkIndDateMonth!=checkOutDateMonth && initialNightsStayed==0){
				initialNightsStayed=getInitialOccupiedDays(checkedOutDate,checkedInDate);
				logDebug("Getting the intial stayed nights :"+initialNightsStayed)
				if(initialNightsStayed>checkOutMonthDaysOccupied){
					secondMonthOccDays=checkOutMonthDaysOccupied;
					firstMonthOccDays=initialNightsStayed-secondMonthOccDays;
				}	
			}
			else if(initialNightsStayed>checkOutMonthDaysOccupied){
				secondMonthOccDays=checkOutMonthDaysOccupied-initialNightsStayed;
				firstMonthOccDays=initialNightsStayed-secondMonthOccDays;
			}else{
				secondMonthOccDays=initialNightsStayed;
				firstMonthOccDays=0;
			}
		}
		else if(initialCheckInType==updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed>0){
			logDebug("======== inside the fifth condition =========");	
			if(initialCheckOutDateMonth==checkOutDateMonth){
					logDebug("====== the initial month is equal then the current====")
				if(initialCheckInDateMonth!=checkIndDateMonth){
					if(initialCheckInDateMonth>checkIndDateMonth){
						if(updatedNightsStayed-initialNightsStayed>0){
							firstMonthOccDays=checkInMonthDaysOccupied;
							secondMonthOccDays=updatedNightsStayed-initialNightsStayed-firstMonthOccDays;
						}else{
							firstMonthOccDays=checkInMonthDaysOccupied;
							secondMonthOccDays=updatedNightsStayed-initialNightsStayed-firstMonthOccDays;
						}
					}else{
						if(updatedNightsStayed-initialNightsStayed>0){
							//firstMonthOccDays=checkInMonthDaysOccupied;
							//secondMonthOccDays=updatedNightsStayed-initialNightsStayed-firstMonthOccDays;
						}else{
							firstMonthOccDays=initialCheckInDaysOccupied-initialCheckInDays;
							secondMonthOccDays=updatedNightsStayed-initialNightsStayed-firstMonthOccDays;
						}
					
					
					}
				}else{
					if(updatedNightsStayed-initialNightsStayed-checkOutMonthDaysOccupied>0){
						secondMonthOccDays=checkOutMonthDaysOccupied-initialCheckoutDaysOccupied;
						firstMonthOccDays=updatedNightsStayed-initialNightsStayed-secondMonthOccDays;
					}else{
						secondMonthOccDays=checkOutMonthDaysOccupied-initialCheckoutDaysOccupied;
						firstMonthOccDays=initialCheckInDaysOccupied-checkedInDate.getDate();
					}
				}
				
			}else if(initialCheckOutDateMonth!= checkOutDateMonth || initialCheckInDateMonth!=checkIndDateMonth){
			    if(updatedNightsStayed-initialNightsStayed<0){
					secondMonthOccDays=-initialCheckoutDaysOccupied;
					firstMonthOccDays=initialNightsStayed-updatedNightsStayed-initialCheckoutDaysOccupied;
					firstMonthOccDays=(firstMonthOccDays==0)?0:-firstMonthOccDays
				}else{
					secondMonthOccDays=checkOutMonthDaysOccupied;//  updatedNightsStayed-initialNightsStayed;
					firstMonthOccDays=updatedNightsStayed-initialNightsStayed-secondMonthOccDays;
				}
			logDebug("removing "+secondMonthOccDays+" from the second month and "+firstMonthOccDays+" from the first month");
			
			
			}
			logDebug("=== the first month will be incremented by : "+firstMonthOccDays);
			logDebug("==== the second month will be incremented by :"+secondMonthOccDays)
		}else if(initialCheckInType==updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed==0){
			logDebug("======== inside the fifth second condition =========");	
			if(initialCheckOutDateMonth!= checkOutDateMonth){
			    if(updatedNightsStayed-initialNightsStayed<0){
					secondMonthOccDays=-initialCheckoutDaysOccupied;
					firstMonthOccDays=initialNightsStayed-updatedNightsStayed-initialCheckoutDaysOccupied;
					firstMonthOccDays=(firstMonthOccDays==0)?1:-firstMonthOccDays+1;
				}else{
					secondMonthOccDays=checkOutMonthDaysOccupied;//  updatedNightsStayed-initialNightsStayed;
					firstMonthOccDays=updatedNightsStayed-initialNightsStayed-secondMonthOccDays;
				}
			}else if(initialCheckInDateMonth!=checkIndDateMonth){
			    if(updatedNightsStayed-initialNightsStayed<0){
					secondMonthOccDays=-initialCheckoutDaysOccupied+1;
					firstMonthOccDays=initialNightsStayed-updatedNightsStayed-initialCheckoutDaysOccupied;
					firstMonthOccDays=(firstMonthOccDays==0)?0:-firstMonthOccDays;
				}else{
					secondMonthOccDays=checkOutMonthDaysOccupied;//  updatedNightsStayed-initialNightsStayed;
					firstMonthOccDays=updatedNightsStayed-initialNightsStayed-secondMonthOccDays;
				}
			logDebug("removing "+secondMonthOccDays+" from the second month and "+firstMonthOccDays+" from the first month");
			
			
			}
			logDebug("=== the first month will be incremented by : "+firstMonthOccDays);
			logDebug("==== the second month will be incremented by :"+secondMonthOccDays)
		
		}
		else if(initialCheckInType==updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed<0){
			logDebug("======== inside the sixth condition =========");	
			firstMonthOccDays=0;
			secondMonthOccDays=0;
		}
		else if(initialCheckInType!=updatedCheckInType && updatedCheckInType=="In-House"){
			logDebug("======== inside the seventh condition =========");	
			if(initialNightsStayed>initialCheckoutDaysOccupied){//checkOutMonthDaysOccupied){
				secondMonthOccDays=-initialCheckoutDaysOccupied;//secondMonthOccDays=-checkOutMonthDaysOccupied;
				firstMonthOccDays=initialCheckoutDaysOccupied-initialNightsStayed;//-(initialNightsStayed-initialCheckoutDaysOccupied);	
			}else{
				secondMonthOccDays=-initialNightsStayed;
				firstMonthOccDays=0;
			}	
		}
		else if(initialCheckInType!=updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed>0){
			logDebug("======== inside the eighth condition =========");	
			if(updatedNightsStayed>checkOutMonthDaysOccupied){
				secondMonthOccDays=checkOutMonthDaysOccupied;//-updatedNightsStayed;
				firstMonthOccDays=updatedNightsStayed-secondMonthOccDays;
			}else{
				secondMonthOccDays=updatedNightsStayed;
				firstMonthOccDays=initialCheckInDaysOccupied-checkedInDate.getDate();
			}
		}
		else if(initialCheckInType!=updatedCheckInType && updatedCheckInType=="Normal" && updatedNightsStayed<=0){
			logDebug("======== inside the ninth condition =========");	
			if(initialNightsStayed>checkOutMonthDaysOccupied){
				secondMonthOccDays=checkOutMonthDaysOccupied;//-initialNightsStayed;
				firstMonthOccDays=initialNightsStayed-secondMonthOccDays;
			}else{
				secondMonthOccDays=initialNightsStayed;
				firstMonthOccDays=0;
			}
			
		}
	    logDebug("======== the result occupied days for the previous month:"+firstMonthOccDays);
		logDebug("======== the result occupied days for the second month:"+secondMonthOccDays);
		
		
		//editOccupancyASITAccordingtoAmendment(mainCapIDModel,checkedInDate.getMonth()+1,checkedOutDate.getFullYear(),firstMonthOccDays,"");
		editOccupancyASITAccordingtoAmendment(mainCapIDModel,occupancyPreviousMonth,checkedOutDate.getFullYear(),firstMonthOccDays,"");
		editOccupancyASITAccordingtoAmendment(mainCapIDModel,occupancyCurrentMonth,checkedOutDate.getFullYear(),secondMonthOccDays,"");
	}

}

function getFormatedDate(n_stayed){
var nStayed=aa.util.formatDate(nStayed,"dd/MM/yyyy");

return nStayed;
}

function getInitialOccupiedDays(chk_out_date,chk_in_date){
var checkOutTime=chk_out_date.getTime();
var checkInTime=chk_in_date.getTime();
	occ_days=checkOutTime-checkInTime;
	aa.print(occ_days)
	occ_days=occ_days/1000/60/60/24;
	return occ_days;
}

/**
* this function returns the number of days of a specific month
* @ month: desired month (it should be always incremented by 1 as the months started with 0)
* @ year : desired year
*/
function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
}

/**
* this function returns the value of a specified ASI field that belong to specific Cap
* @ chk_In: the CapModelID of the record
* @ ASIField: the ASI field name  
*/
function getCheckInASIFieldValue(chk_In,ASIField){
var ASIFieldValue="";
var checkInCap=chk_In;
var ASIGroups=aa.appSpecificInfo.getByCapID(checkInCap).getOutput();
	
	if(ASIGroups){
		for(x in ASIGroups){
			var myCapASIGroup=ASIGroups[x];
			var FieldDescription=myCapASIGroup.checkboxDesc;
			if(FieldDescription.toString()==ASIField){
				ASIFieldValue=myCapASIGroup.checklistComment;
			}
		}
    }
return ASIFieldValue;
}

/**
*this function edit the room ALT ID after its creation
*/
function editRoomAltId(){
 logDebug("#######################into editRoomAltId function###############");
		var cap_id1 = aa.env.getValue("PermitId1");
		var cap_id2 = aa.env.getValue("PermitId2");
		var cap_id3 = aa.env.getValue("PermitId3");
		
		var roomNumber;
		
		var myCapIDModel=aa.cap.getCapID(cap_id1,cap_id2,cap_id3).getOutput();
		var ASIGroups=aa.appSpecificInfo.getByCapID(myCapIDModel).getOutput();
		if(ASIGroups){
		for(x in ASIGroups){
			var myCapASIGroup=ASIGroups[x];
			var FieldDescription=myCapASIGroup.checkboxDesc;
			if(FieldDescription.toString()=="Room Number"){
				roomNumber=myCapASIGroup.checklistComment;
			}
		}
		}
		
		logDebug("Using Public User ID: " + publicUserID);
		userSeq = String(publicUserID).replace(/\D/g, '');
		licenseList = aa.licenseScript.getRefLicProfByOnlineUser(userSeq).getOutput();
		if(licenseList){
			myLicense = licenseList[0];     //assume only 1 LP
			licenseType = myLicense.getLicenseType();
			//busName = String(myLicense.getBusinessName()).substring(0,20);
			myLicenseNo = String(myLicense.getStateLicense());
			var roomAltID=myLicenseNo+"|"+roomNumber;
			aa.cap.updateCapAltID(myCapIDModel,roomAltID);
			logDebug("Associating LP with Cap");
			aa.licenseScript.associateLpWithCap(myCapIDModel, myLicense);
		}else{
			logDebug("No associated license found for this record.");
		}
		
}
/**
*this function is called on Amendment submit when the user update Hotel Room Info
**/
function submitRoomAmendment(){
logDebug("#######################into submitRoomAmendment function###############");
    var cap_id1 = aa.env.getValue("PermitId1");
    var cap_id2 = aa.env.getValue("PermitId2");
    var cap_id3 = aa.env.getValue("PermitId3");

	var roomNumber;
	var bedRooms=0;
	//getting the updated info from the Amendment ASI
	var myCapIDModel=aa.cap.getCapID(cap_id1,cap_id2,cap_id3).getOutput();
	
	//getting the estimate or the temporary Cap ID in order to get the parent Cap  NOTE : using the getParent function didn't give any result)
	var estCapID=aa.cap.getProjectByChildCapID(myCapIDModel, "EST", null).getOutput()[0].getProjectID();
	var estCapIDProjectParents = aa.cap.getProjectParents(estCapID,1);
	var estParentCapIDModel=estCapIDProjectParents.getOutput()[0].getCapID();
	var ASIGroups=aa.appSpecificInfo.getByCapID(myCapIDModel).getOutput();
	
	if(ASIGroups){
		for(x in ASIGroups){
			var myCapASIGroup=ASIGroups[x];
			var FieldDescription=myCapASIGroup.checkboxDesc;
			if(FieldDescription.toString()=="Room Number"){
				roomNumber=myCapASIGroup.checklistComment;
			}
			if(FieldDescription.toString()=="Bedrooms"){
				bedRooms=myCapASIGroup.checklistComment;
			}
		}
    }

	//getting the parent CAP Model and updating the related ASI Fields
      
    logDebug("********"+estParentCapIDModel+"***********")
    logDebug("Room number should be updated to  "+roomNumber);
	logDebug("Bedrooms should be updated to "+bedRooms);
	aa.appSpecificInfo.editSingleAppSpecific(estParentCapIDModel,"Room Number",roomNumber,"HOTEL ROOM INFO");
	aa.appSpecificInfo.editSingleAppSpecific(estParentCapIDModel,"Bedrooms",bedRooms,"HOTEL ROOM INFO");
	//updateStatusResults = aa.cap.updateAppStatus(estParentCapIDModel, "APPLICATION", "Closed", sysDate, "Closed", systemUserObj);
}

function getParentCapIDModel(myCapId) 
	{
	// returns the capId object of the parent.  Assumes only one parent!
	//
	getCapResult = aa.cap.getProjectParents(myCapId,1);
	if (getCapResult.getSuccess())
		{
		parentArray = getCapResult.getOutput();
		if (parentArray.length)
			return parentArray[0].getCapID();
		else
			{
			logDebug( "**WARNING: GetParent found no project parent for this application");
			return false;
			}
		}
	else
		{ 
		logDebug( "**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
		return false;
		}
	}

function editOccupancyASITAccordingtoAmendment(capIDModel,currentMonth,currentYear,occupiedDays,type){

	//Description:
	//ASIT in Accela is made up of 2 ArrayLists, one for columns and one for cells with
	//no connection between the 2 arrays to know which value in the cell array corresponds 
	//to which column and row.
	
	//set itemCap to parameter.
	var itemCap = capIDModel;
	
	var tableName = "OCCUPANCY";
	var colName = "Occupancy";
	var currMonth = currentMonth;//new Date().getMonth() + 1;
	var currYear = currentYear;//new Date().getFullYear();

	//Get the specific table object.
	var tsm = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName);
	//**
	
	//Check to make sure the API call was successful, if not, return false;
	if (!tsm.getSuccess())
	{ 
		logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tsm.getErrorMessage()) ; 
		return false; 
	}
	//**
	
	//Perform some validation on input data
	if(colName == null || colName == "")
	{
		logDebug("**WARNING: Error the column name to edit cannot be empty or null");
		return false;
	}

	//**
	
	//Get column arrayList, field arrayList
	var tsm = tsm.getOutput();
	var tsm = tsm.getAppSpecificTableModel();
	var cells = tsm.getTableField();
	var col = tsm.getColumns();
	//**
	
	// 
	
	// Get Row index for both Coditions
	// Conditions: Month = Current Month 
	// Year = Current Year
	var NumberOfColumns = col.size();
	var NumberOfCells = cells.size();
	var NumberOfRows = Math.ceil(NumberOfCells / NumberOfColumns);
	
	
	var occColIndex = -1;
	var monthColIndex = -1;
	var yearColIndex = -1;
	var cIndex = 0;
	j = col.iterator();
	while (j.hasNext())
	{
		objCol = j.next();
		if(objCol.getColumnName().toUpperCase() == "OCCUPANCY"){
			occColIndex = cIndex;
		}else if (objCol.getColumnName().toUpperCase() == "MONTH"){
			monthColIndex = cIndex;
		}else if (objCol.getColumnName().toUpperCase() == "YEAR"){
			yearColIndex = cIndex;		
		}
		cIndex ++;
	}
	if (occColIndex < 0)
	{
		logDebug("**WARNING: error the specified column name (" + colName + ")does not exist");
		return false;
	}
	
	//Get Row Number where Month and Year conditions are met
	var rowIndex = -1;
	var index = 0;

	for (r=0;r<NumberOfRows;r++)
	{
		// Find where Month & Year Match current Month & Year
		currMonthCellIndex = (r*NumberOfColumns) + monthColIndex;
		monthCell = cells.get(currMonthCellIndex);

		currYearCellIndex = (r*NumberOfColumns) + yearColIndex;
		yearCell = cells.get(currYearCellIndex);
		
		if (String(monthCell) == String(currMonth)){
			if (String(yearCell) == String(currYear)){
				rowIndex = r;
			}
		}
	}
	
	if (rowIndex < 0)
	{
		aa.print("**WARNING: Cannot Find Entry for Month: " + currMonth + ", and Year: " + currYear + "!");
		aa.print("Adding new entry...");
		
		newValue = 1;
		cells.add(String(newValue));
		cells.add(String(currMonth));
		cells.add(String(currYear));

	}else{
	
		//Change specified cell
		//The specified cell index is equal to (the row number * number of columns) + occColIndex
		logDebug("**************** updating the Occupancy value **********");
		occCell = (rowIndex * NumberOfColumns) + occColIndex;
		newValue = parseInt(cells.get(occCell));
		logDebug("the number of occupied days : "+occupiedDays);
		logDebug("the number of initial occupied days : "+newValue);
		if(occupiedDays){
			var updatedOccupiedDays=parseInt(occupiedDays);
			if(type=="SET"){
				newValue=updatedOccupiedDays;
			}else{
				newValue=newValue+updatedOccupiedDays;
			}
			logDebug("the new value has been set to  : "+newValue);
			cells.set(occCell, String(newValue));
		}
		
	}
	
	//**
	
	//Finally set the table back after editing
	tsm.setTableField(cells);
	//var myPU = aa.publicUser.getPublicUserByEmail("hotel@hotelname.com").getOutput();
	//currentUserID=myPU.getUserID();
	editResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
	if (!editResult .getSuccess())
	{ 
		logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + editResult.getErrorMessage()); 
		return false;
	}
	else
	{
		logDebug("Successfully edited record(s) in ASI Table: " + tableName + ", New Occupancy Value = " + newValue);
		return true;
	}
	//**
}


function createRoom() {
	logDebug("Create Room Started!");
	var capType = "Services/Unit/Hotel Room/New";
	var licenseType = "";
	var busName = "";

	// If Online User is logged in.... i.e: using ACA, get Licensed Prof by Online User
	if (publicUserID && String(publicUserID) != "" && publicUserID != null){
		logDebug("Using Public User ID: " + publicUserID);
		userSeq = String(publicUserID).replace(/\D/g, '');
		licenseList = aa.licenseScript.getRefLicProfByOnlineUser(userSeq).getOutput();
		myLicense = licenseList[0];     //assume only 1 LP
		licenseType = myLicense.getLicenseType();
		busName = String(myLicense.getBusinessName());
		myLicenseNo = String(myLicense.getStateLicense());
	}
	else // If Through Web Service or AA, Get Licensed Professional from CapID
	{
		logDebug("Public User ID is empty/Null, searching for LicProf using CAPID!");
		var cap_id1 = aa.env.getValue("PermitId1");
		var cap_id2 = aa.env.getValue("PermitId2");
		var cap_id3 = aa.env.getValue("PermitId3");
		// Get CapModel By CapId
		var myCapIDModel = aa.cap.getCapIDModel(cap_id1,cap_id2,cap_id3).getOutput();
		// Retrieve associated License Professional
		licNumber = getAppSpecific("LPNumber");
		
		licenseRes = aa.licenseScript.getRefLicensesProfByLicNbr(servProvCode, licNumber);
		if (licenseRes.getSuccess()) {
			licenseList = licenseRes.getOutput();
			myLicense = licenseList[0];     //assume only 1 LP
				
			var myBusinessName = myLicense.getBusinessName();
			logDebug("myBusinessName: " + myBusinessName);
			//var myBusinessNameTruncated = String(myBusinessName).substring(0,20);
			licenseType = myLicense.getLicenseType();
			//busName = myBusinessNameTruncated;
			myLicenseNo = String(myLicense.getStateLicense());
				
		}else{
			logDebug("**Error retreiving Licensed Professional ");
		}		

	}
	
	roomNum = getAppSpecific("Room or Unit Number");
	userType = "";
	logDebug("RoomNum: " + roomNum);
	if (licenseType == "HOTEL") {
		userType = "Hotel";
	}
	else if (licenseType == "OPERATOR") {
		userType = "Operator";
	}
	else {
		userType = "Delegate";
	}

	if (userType == "Hotel") {
		roomName = myLicenseNo + "|" + roomNum;
		logDebug("RoomName: " + roomName);
				
		// Get Registration Cap by AltID
		myTempCapModel = aa.cap.getCapModel().getOutput();
		myTempCapModel.setAltID(roomName);
		myTempCapList = aa.cap.getCapIDListByCapModel(myTempCapModel).getOutput();

		// Cycle through altIDs, make sure they match EXACTLY (altID search seems to be returning wildcards).
		// Example: Search for 'HOTEL NAME|1' will also return 'HOTEL NAME|10' & 'HOTEL NAME|122' & .....
		myRegCapIDModel = null;
		for (x in myTempCapList) {
			 tempCapIDScriptModel = myTempCapList[x];
			 tempCapIDModel = tempCapIDScriptModel.getCapID();
			 tempCapScriptModel = aa.cap.getCap(tempCapIDModel).getOutput();
			 tempCapModel = tempCapScriptModel.getCapModel();
			 tempAltID = tempCapModel.getAltID();
			 tempAltID = String(tempAltID).toUpperCase();
			 myAltID = String(roomName).toUpperCase();			 
			 if (tempAltID == myAltID){
				myRegCapIDModel = tempCapIDModel;
				logDebug("Registration CAPID (Room Registration): " + myRegCapIDModel);
			}
		}							
		
		if (!myRegCapIDModel) {
			// Record NOT Found!
			logDebug("Room doesn't Exist, Create new");
			myRoomCapIDModel = createCap(capType, roomName);
			aa.cap.updateCapAltID(myRoomCapIDModel,roomName);
			updateStatusResults = aa.cap.updateAppStatus(myRoomCapIDModel, "APPLICATION", "Open", sysDate, "Open", systemUserObj);
			
			// Update Unit Number & Bedrooms
			bedrooms = getAppSpecific("Bedrooms");			
			var appSpecInfoResult1 = aa.appSpecificInfo.editSingleAppSpecific(myRoomCapIDModel,"Room Number",String(roomNum),"HOTEL ROOM INFO");
			if (appSpecInfoResult1.getSuccess()){
				logDebug("Unit Number Updated to : " + String(roomNum));
			}else{
				logDebug("**WARNING: Unit Number NOT updated to : " + String(roomNum) + ", Error Message: " + appSpecInfoResult1.getErrorMessage());
			}
			if (bedrooms != ""){
				bedrooms = parseInt(bedrooms);
				var appSpecInfoResult2 = aa.appSpecificInfo.editSingleAppSpecific(myRoomCapIDModel,"Bedrooms",bedrooms,"HOTEL ROOM INFO");			
				if (appSpecInfoResult2.getSuccess()){
					logDebug("Bedroom Number Updated to : " + bedrooms);
				}else{
					logDebug("**WARNING: Bedroom Number NOT updated to : " + bedrooms + ", Error Message: " + appSpecInfoResult2.getErrorMessage());
				}
				
			}
			editAppName(String(roomNum), myRoomCapIDModel);
/*
			// Optimized script for Creating the new Room with the updated bedroom Unit Number (instead of above method) - to be completed
			//Create New AppSpecificGroupModel
			myAppSpecModel = aa.AppSpecificInfoGroupScriptModel.getAppSpecificInfoGroup();
			
			//Create New Cap
			myNewCapModel = aa.cap.getCapModel().getOutput();
			myNewCapModel.setAltID(roomName);
			myNewCapModel.setAppSpecificInfoGroup(myAppSpecModel);
						
						
			
			// Add CAP to System
			myCapScriptModel = aa.cap.getCapScriptModel(myCapModel);
			myCapResult = aa.cap.createAppWithModel(myCapScriptModel);
			
*/					
			res = aa.licenseScript.associateLpWithCap(myRoomCapIDModel, myLicense);
			logDebug("created room: " + roomName);
		 }
		else logDebug("Room Exists");
	}
}

/**
*this function associate a license Professional to the room upon its creation from the Room Registration module
**/
/*
function associateLPWithRoom(){

    logDebug("****** Inside associateLPWithRoom function *******************");
	var cap_id1 = aa.env.getValue("PermitId1");
	var cap_id2 = aa.env.getValue("PermitId2");
	var cap_id3 = aa.env.getValue("PermitId3");
	
	// Get CapModel By CapId
	var myRoomCapIDModel = aa.cap.getCapIDModel(cap_id1,cap_id2,cap_id3).getOutput();

	logDebug("Using Public User ID: " + publicUserID);
	userSeq = String(publicUserID).replace(/\D/g, '');
	licenseList = aa.licenseScript.getRefLicProfByOnlineUser(userSeq).getOutput();
	if(licenseList){
		myLicense=licenseList[0];
		res = aa.licenseScript.associateLpWithCap(myRoomCapIDModel, myLicense);
		if(res){
			logDebug("License Professional has been associated to the room")
		}else{
			logDebug("License Professional hasn't been associated to the room");
		}
	}

	
}
*/
function updateContactsOfScan()
{
  
	var cap_id1 = aa.env.getValue("PermitId1");
	var cap_id2 = aa.env.getValue("PermitId2");
	var cap_id3 = aa.env.getValue("PermitId3");
	// Get CapModel By CapId
	var myCapIDModel = aa.cap.getCapIDModel(cap_id1,cap_id2,cap_id3).getOutput();
	var capContactResult = aa.people.getCapContactByCapID(myCapIDModel);
	if (capContactResult.getSuccess())
	{
        logDebug("in update contacts of scan");
	var Contacts = capContactResult.getOutput();
	for (var contactIdx in Contacts)
	  {
	  var theContact = Contacts[contactIdx].getCapContactModel();
	  var contactNbr = theContact.getPeople().getContactSeqNumber();
          logDebug("contactNbr=="+contactNbr);
          var passport =   theContact.getPeople().getCompactAddress().getAddressLine1();
	  logDebug("passport=="+passport);
          var country =   theContact.getPeople().getCompactAddress().getAddressLine2();
          logDebug("country=="+country);
          var birthDate =   theContact.getPeople().getCompactAddress().getAddressLine3();
          logDebug("birthDate =="+birthDate);
          birthdate = new Date(birthDate);
          theContact.getPeople().setFein(passport);
	 // theContact.getPeople().setCountry(country);
          theContact.getPeople().setBirthDate(birthdate);
          logDebug("after set birthdate");
          theContact.getPeople().setCountryCode(country);
          //theContact.getPeople().getCompactAddress().setAddressLine1("");
          //theContact.getPeople().getCompactAddress().setAddressLine2("");
         // theContact.getPeople().getCompactAddress().setAddressLine3("");
          aa.people.editCapContact(theContact);
	   }
	}
}

function createRefLicOperator(rlpId,pContactType,busName,add1,add2){
	//Creates/updates a reference licensed prof from a Contact and ASI
	logDebug("*************** Inside CreateRefLiceOperator ************");
	var capContResult = aa.people.getCapContactByCapID(capId);
	if (capContResult.getSuccess())
		{ conArr = capContResult.getOutput();  }
	else
		{
		logDebug ("**ERROR: getting cap contact: " + capAddResult.getErrorMessage());
		return false;
		}

	if (!conArr.length)
		{
		logDebug ("**WARNING: No contact available");
		return false;
		}


	var newLic = getRefLicenseProf(rlpId)

	if (newLic)
		{
		return false;
		logDebug("This License Is Already Registered : " + rlpId);
		}
	else
		var newLic = aa.licenseScript.createLicenseScriptModel();

	//get contact record
	if (pContactType==null)
		var cont = conArr[0]; //if no contact type specified, use first contact
	else
		{
		var contFound = false;
		for (yy in conArr)
			{
			if (pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType()))
				{
				cont = conArr[yy];
				contFound = true;
				break;
				}
			}
		if (!contFound)
			{
			logDebug ("**WARNING: No Contact found of type: "+pContactType);
			return false;
			}
		}

	peop = cont.getPeople();

	newLic.setContactFirstName(cont.getFirstName());
	newLic.setContactLastName(cont.getLastName());
	newLic.setBusinessName(busName);
	newLic.setAddress1(add1);
	newLic.setAddress2(add2);
	newLic.setCity("Dubai");
	newLic.setLicState("AE");
	newLic.setPhone1(peop.getPhone1());
	newLic.setPhone2(peop.getPhone2());
	newLic.setEMailAddress(peop.getEmail());

	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setAuditID(currentUserID);
	newLic.setAuditStatus("A");

	newLic.setLicenseType("OPERATOR");
	newLic.setStateLicense(rlpId);

	myResult = aa.licenseScript.createRefLicenseProf(newLic);

	if (myResult.getSuccess())
		{
		logDebug("Successfully added/updated License No. " + rlpId + ", Type: Operator");
		lpsmResult = aa.licenseScript.getRefLicenseProfBySeqNbr(servProvCode,myResult.getOutput())
		if (!lpsmResult.getSuccess()) {
			logDebug("**WARNING error retrieving the LP just created " + lpsmResult.getErrorMessage()) ; return null
		}
		lpsm = lpsmResult.getOutput();
		}
	else
		{
		logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		return false;
		}
		
	// Now add the LP to the CAP
	asCapResult= aa.licenseScript.associateLpWithCap(capId,lpsm)
	if (!asCapResult.getSuccess())
		{ logDebug("**WARNING error associating CAP to LP: " + asCapResult.getErrorMessage()) }
	else
		{ logDebug("Associated the CAP to the new LP") }


	// Now make the LP primary due to bug 09ACC-06791
	var capLps = getLicenseProfessional(capId);
	for (var thisCapLpNum in capLps)
		{
		logDebug("looking at license : " + capLps[thisCapLpNum].getLicenseNbr());
		if (capLps[thisCapLpNum].getLicenseNbr().equals(rlpId))
			{
			var thisCapLp = capLps[thisCapLpNum];
			thisCapLp.setPrintFlag("Y");
			aa.licenseProfessional.editLicensedProfessional(thisCapLp);
			logDebug("Updated primary flag on Cap LP : " + rlpId);
			}
		}


	// Find the public user by contact email address and attach
	puResult = aa.publicUser.getPublicUserByEmail(peop.getEmail())
	if (!puResult.getSuccess())
		{ logDebug("**WARNING finding public user via email address " + peop.getEmail() + " error: " + puResult.getErrorMessage()) }
	else
		{
		pu = puResult.getOutput();
		asResult = aa.licenseScript.associateLpWithPublicUser(pu,lpsm)
		if (!asResult.getSuccess())
			{logDebug("**WARNING error associating LP with Public User : " + asResult.getErrorMessage());}
		else
			{logDebug("Associated LP with public user " + peop.getEmail()) }
		}
		
	return lpsm;
}
function getFormatedDate(n_stayed){

var nStayed=aa.util.formatDate(nStayed,"dd/MM/yyyy");

return nStayed;
}


function copyDocuments(fromCapID, toCapModel) {
	
	var documentList= aa.document.getDocumentListByEntity(fromCapID ,'CAP').getOutput(); 

	logDebug("Copying Documents: " + documentList.size());
	//for(var i = 0; i <documentList.size(); i ++ )
	//{
		//var model = documentList.get(i);
		//logDebug("-----------filekey:" + model.getFileKey());
		//logDebug("-----------getEntityID:" + model.getEntityID());
		//logDebug("-----------getDocDescription:" + model.getDocDescription());
		//logDebug("-----------getDocCategory:" + model.getDocCategory());
		//logDebug("-----------getEntityType:" + model.getEntityType());
		//logDebug("-----------getDocumentNo:" + model.getDocumentNo());
		//logDebug("-----------getFileName:" + model.getFileName());
		//logDebug("-----------toCapModel ID String:" + toCapModel.getCapID().getID3());
		//logDebug("-----------module name:" + toCapModel.getModuleName());
		//logDebug("-----------document module name:" + model.getModuleName());
				 
       // }
	
	var edmseModel = aa.proxyInvoker.newInstance("com.accela.aa.policy.policy.EdmsPolicyModel").getOutput();
	var documentBiz= aa.proxyInvoker.newInstance("com.accela.aa.ads.ads.DocumentBusiness").getOutput();

	var bizDomain = aa.bizDomain.getBizDomainByValue('EDMS', 'SharePoint').getOutput();
	logDebug("BizDomian" + bizDomain.getDescription());
	edmseModel.setConfiguration(bizDomain.getDescription());
	edmseModel.setSourceName("STANDARD");
	//var result = documentBiz.copyDocuments('DTCM',documentList,edmseModel,toCapModel, 'ADMIN');
	
	fromCapID.setCustomID('');
	toCapModel.setCustomID('');
	logDebug("cap from: " + fromCapID.getID3());
	logDebug("cap from: " + toCapModel.getID3());
	logDebug("fromsetCustomID: " + fromCapID.getCustomID());
	var result = documentBiz.copyDocument4Renew(fromCapID, toCapModel, 'ADMIN');
	
	
	logDebug("documentupload: " + result);
	//for(var r = 0 ; r < result.size(); r++)
	//{
	//	var res = result.get(r);
	//	logDebug("Documents Copy command initiated." + res.getSuccess());
	//	logDebug("Documents Copy command initiated." + res.getOutput());
	//}
	
}


/*
function giveACAAccessToWS()
{
 
 var cap_id1 = aa.env.getValue("PermitId1");
 var cap_id2 = aa.env.getValue("PermitId2");
 var cap_id3 = aa.env.getValue("PermitId3");
 var capId = aa.cap.getCapIDModel(cap_id1,cap_id2,cap_id3).getOutput();
 var lic = aa.licenseScript.getLicenseProf(capId).getOutput();
 var licProf = lic[0].getLicenseProfessionalModel();
 var licNbr = licProf.getLicenseNbr();
 licMod = aa.licenseScript.getRefLicensesProfByLicNbr("DTCM",licNbr).getOutput();
 thisLic = licMod[0].getLicSeqNbr();
 userList = aa.publicUser.getPublicUserListByLicenseSeqNBR(thisLic).getOutput().toArray();
  for(x in userList)
  {
  seqNum = userList[x].getUserSeqNum();
  aa.cap.updateCreatedAccessBy4ACA(capId,"PUBLICUSER"+seqNum,"Y","Y");
  }	
  
}
*/


/*------------------------------------------------------------------------------------------------------/
| SVN $Id: ConvertToRealCapAfter.js 4381 2009-05-29 02:05:03Z roland.vonschoech $
| Program : ConvertToRealCapAfter2.0.js
| Event   : ConvertToRealCapAfter
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var controlString = "ConvertToRealCapAfter"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents"				// Standard choice to execute first (for globals, etc)
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 2.0

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));


if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}
	
function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";	
}

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
//
//
//  Get the Standard choices entry we'll use for this App type
//  Then, get the action/criteria pairs for this app
//

doStandardChoiceActions(controlString,true,0);
//
// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
	}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0)
	{
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", debug);
	}
else
	{
	aa.env.setValue("ScriptReturnCode", "0");
	if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
	if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
	}

var targetCapIDModel = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.CapIDModel").getOutput();
targetCapIDModel.setID1('14CAP');
targetCapIDModel.setID2('00000');
targetCapIDModel.setID3('003FP');
targetCapIDModel.setServiceProviderCode('ADDEV');

var srcCapIDmodel = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.CapIDModel").getOutput();
srcCapIDmodel.setID1('14CAP');
srcCapIDmodel.setID2('00000');
srcCapIDmodel.setID3('003F3');
srcCapIDmodel.setServiceProviderCode('ADDEV');




copyDocuments(srcCapIDmodel, targetCapIDModel);

function copyDocuments(srcCapIDmodel, targetCapIDModel) 
{
                

                
                var documentBiz= aa.proxyInvoker.newInstance("com.accela.aa.ads.ads.DocumentBusiness").getOutput();


                var result = documentBiz.copyDocument4Renew(srcCapIDmodel, targetCapIDModel, 'ADMIN');
                
                                                                if (result == true)
                                                                {
                                                                  aa.print("Documents Copy command success." );
                                                                }
              
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/