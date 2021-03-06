/*
 *   Creating child Records by ASI Table values(Only for Record type alias).
 *   Updated 2011-03-24
 *   10ACC-06148
 */
createChildCapsByASITableValues();

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
	var columnNameRecordType = "Record Type";
	
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
			var recordIDList = batchCreateRecordsWithAPO(capTypeArrayList, parentRecordID);
			for (var i = 0; i < capTypeArrayList.size(); i++)
			{
				var recordType = capTypeArrayList.get(i);
				aa.print("Create Record Type("+(i+1)+"): " + recordType.getGroup() + "/" + recordType.getType() + "/" + recordType.getSubType() + "/" + recordType.getCategory());
				
				
				var rowIndexValue = rowIndexValueArrayList.get(i);
				var fields = asitModel.getTableFields();
				var fieldValues = aa.util.newArrayList();
				
				for (var j = 0; j < fields.size(); j++)
				{
					if (rowIndexValue.equals(fields.get(j).getRowIndex()) && columnNameList.get(1).equals(fields.get(j).getFieldLabel()))
					{
						if (recordIDList != null && recordIDList.size() > i && recordIDList.get(i) != null)
						{
							fields.get(j).setInputValue(recordIDList.get(i).toKey());
						}
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
function batchCreateRecordsWithAPO(capTypeList, parentIDModel)
{
	var sectionNameList = aa.util.newArrayList();
 	sectionNameList.add("Address");
 	sectionNameList.add("Parcel");
 	sectionNameList.add("Owner");
 	//sectionNameList.add("License");

 	var recordIDList = aa.cap.batchCreateChildRecords(parentIDModel, capTypeList, sectionNameList).getOutput();

	return recordIDList;
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