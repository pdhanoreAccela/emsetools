//Defiene the guidesheet item name, subgroup name and the checkboxe type fields names.
var itemName = "ItemA1ItemA1 ItemA1ItemA1 ItemA1ItemA1ItemA1ItemA1 ItemA1ItemA1ItemA1ItemA1ItemA1ItemA1ItemA1 ItemA1ItemA1ItemA1ItemA1ItemA1ItemA1ItemA1ItemA1";
var subgroupName = "RICHAR_SBG";
//Identify the checkbox names, if all checkboxes are checked, it will change the item status to "Failed" and set the score as 0.
var fieldArray = ["Column1", "Column2", "Column3", "Column4", "Column5"];
//Identify the updated status.
var updatedStatus = "Fail";

//Get the guidesheet model.
var guidesheetModel = aa.env.getValue("GuidesheetModel");
if(guidesheetModel != null)
{
	updateItemStatusAndScoreInModel(guidesheetModel);
	if(aa.env.getValue("updatedModel") != null && aa.env.getValue("updatedModel") != "")
	{
		var updatedModel = aa.env.getValue("updatedModel");
		var result = aa.guidesheet.updateGGuidesheet(updatedModel, updatedModel.getAuditID());
		if(result.getSuccess())
		{
			var returnMsg = "Update the guidesheet item \"" + itemName + "\" as \"" + updatedStatus + "\" status, and the item score is 0";
			aa.env.setValue("ScriptReturnCode","0");
			aa.env.setValue("ScriptReturnMessage", returnMsg);
		}
		else
		{
			aa.print("Update the guidesheet item \"" + itemName + "\" falied.");
		}
	}
}
else
{
	aa.print("ERROR: Cannot find the parameter 'GuidesheetModel'.");
}

function updateItemStatusAndScoreInModel(guidesheetModel)
{
	//Get the guidesheet items.
	var guidesheetItems = guidesheetModel.getItems();
	if(guidesheetItems != null)
	{
		var it=guidesheetItems.iterator();
		while(it.hasNext())
		{
			var guidesheetItem =it.next();
			//If the guidesheet item name equals the itemName identified, it will check the checkboxe statuses.
			if(itemName.equals(guidesheetItem.getGuideItemText()))
			{
				var updateFlag = false;
				var itemASISubGroupList = guidesheetItem.getItemASISubgroupList();
				//If there is no ASI subgroup, it will throw warning message.
				if(itemASISubGroupList != null)
				{
					var asiSubGroupIt = itemASISubGroupList.iterator();
					while(asiSubGroupIt.hasNext())
					{
						var asiSubGroup = asiSubGroupIt.next();
						//If the subgroup name for the item is the same as the subgroup name identified, it will check the asi checkboxes status.
						if(subgroupName.equals(asiSubGroup.getSubgroupCode()))
						{
							var asiItemList = asiSubGroup.getAsiList();
							//If there is no asi item, it will throw warning message.
							if(asiItemList != null)
							{
								//Check the ASI checkbox fields identified in "fieldArray", if all checked, return true.
								updateFlag = checkASIFields(asiItemList);
							}
							else
							{
								aa.print("ERROR: Cannot find the ASI item for subgroup \"" + subgroupName + "\".");
							}
							break;
						}
					}
				}
				else
				{
					aa.print("ERROR: Cannot find the ASI subgroup for guidesheet item \"" + itemName + "\".");
				}
				//If all ASI checkbox fields in "fieldArray" checked, it will update the item status as "updatedStatus" identified.
				//And update the item score as 0.
				if(updateFlag)
				{
					guidesheetItem.setGuideItemStatus(updatedStatus);
					guidesheetItem.setGuideItemScore(0);
					aa.env.setValue("updatedModel", guidesheetModel);
				}
				break;
			}
		}
	}
}

function checkASIFields(asiItemList)
{
	asiItemListIt = asiItemList.iterator();
	var count = 0;
	while(asiItemListIt.hasNext())
	{
		var asiItemModel = asiItemListIt.next();
		if(isValidateCheckboxField(asiItemModel))
		{
			if("CHECKED".equals(asiItemModel.getAttributeValue()))
			{
				count ++;
			}
			if(count == fieldArray.length)
			{
				return true;
			}
		}
	}
	return false;
}

function isValidateCheckboxField(asiItemModel)
{
	for(i = 0; i < fieldArray.length; i++)
	{
		if(fieldArray[i].equals(asiItemModel.getAsiName()))
		{
			return true;
		}
	}
	return false;
}