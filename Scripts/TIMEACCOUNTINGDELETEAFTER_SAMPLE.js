/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2013
|
| SVN $Id : TimeAccountingDeleteAfter.js $
| Program : TimeAccountingDeleteAfter2.0.js
| Event   : TimeAccountingDeleteAfter
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
var controlString = "TimeAccountingDeleteAfter"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents";				// Standard choice to execute first (for globals, etc)
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/

var SCRIPT_VERSION = 2.0;

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}
	
function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

var timeLogList = aa.env.getValue("TimeLogModelList");

if (timeLogList)
{
	var it=timeLogList.iterator();
	while(it.hasNext())
	{
		var timeLog=it.next();
		var capId = timeLog.getCapIDModel();
		var timeLogSeq		= timeLog.getTimeLogSeq(); 
		var timeGroupSeq	= timeLog.getTimeGroupSeq(); 
		var timeTypeSeq		= timeLog.getTimeTypeSeq();
		var reference		= "" + timeLog.getReference();  
		
		var dateLogged		= timeLog.getDateLogged(); 
		var startTime 		= timeLog.getStartTime(); 
		var endTime		= timeLog.getEndTime(); 
		var timeElapsedHours	= timeLog.getTimeElapsed().getHours();
		var timeElapsedMin	= timeLog.getTimeElapsed().getMinutes();
		var totalMinutes	= timeLog.getTotalMinutes(); 
		var billable		= timeLog.getBillable(); 
		var materials		= timeLog.getMaterials(); 
		var materialsCost	= timeLog.getMaterialsCost(); 
		var mileageStart	= timeLog.getMileageStart(); 
		var mileageEnd		= timeLog.getMileageEnd(); 
		var milageTotal		= timeLog.getMilageTotal();
		var vehicleId		= timeLog.getVehicleId();
		var entryRate		= timeLog.getEntryRate(); 
		var entryPct		= timeLog.getEntryPct(); 
		var entryCost		= timeLog.getEntryCost(); 
		var createdDate		= timeLog.getCreatedDate(); 
		var createdBy		= timeLog.getCreatedBy(); 
		var notation		= timeLog.getNotation(); 
		var lastChangeDate	= timeLog.getLastChangeDate(); 
		var lastChangeUser	= timeLog.getLastChangeUser();
		var timeTypeModel	= timeLog.getTimeTypeModel();


		logDebug("<B>EMSE Script Results for Time Log</B>");
		logDebug("capId = " + capId);
		logDebug("timeLog= " 	+ timeLog.getClass());
		logDebug("timeLogSeq = " + timeLogSeq);
		logDebug("timeGroupSeq = " + timeGroupSeq);
		logDebug("timeTypeSeq = " + timeTypeSeq);
		logDebug("reference = " + reference);
		logDebug("dateLogged = " + dateLogged);
		logDebug("startTime = " + startTime);
		logDebug("endTime = " + endTime);
		logDebug("timeElapsedHours = " + timeElapsedHours);
		logDebug("timeElapsedMin = " + timeElapsedMin);
		logDebug("totalMinutes = " + totalMinutes);
		logDebug("billable = " + billable);
		logDebug("materials = " + materials);
		logDebug("materialsCost = " + materialsCost);
		logDebug("mileageStart = " + mileageStart);
		logDebug("mileageEnd = " + mileageEnd);
		logDebug("milageTotal = " + milageTotal);
		logDebug("vehicleId = " + vehicleId);
		logDebug("entryRate = " + entryRate);
		logDebug("entryPct = " + entryPct);
		logDebug("entryCost = " + entryCost);
		logDebug("createdDate = " + createdDate);
		logDebug("createdBy = " + createdBy);
		logDebug("notation = " + notation);
		logDebug("lastChangeDate = " + lastChangeDate);
		logDebug("lastChangeUser = " + lastChangeUser);
		logDebug("timeTypeModel = " + timeTypeModel);
		
		var servProvCode = timeLog.getServProvCode();

		if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

		doStandardChoiceActions(controlString,true,0);
	}
}

/*---------------------------------------------------------------------------------------------------------------/
| <===========Start=Sync Time Accounting and Time Accounting Costing to Assignments and Costs================>
/--------------------------------------------------------------------------------------------------------------*/
function checkCapCondition(capIDModel)
{
	var isLockedResult = aa.capCondition.isCapLocked(capIDModel);
	if(isLockedResult.getSuccess())
	{
		if("true".equals(isLockedResult.getOutput().toString())) return true;
		else return false;
	}
	else
	{
		logMessage("**ERROR: Check cap condition failed" + isLockedResult.getErrorMessage());
		return false;
	}
}

function isNeedSyncData(timeLogModel)
{
	var result = false;
	if("CONDITION ASSESSMENT".equals(timeLogModel.getEntityType()))
	{
		result = true;
	}
	else if("RECORD".equals(timeLogModel.getEntityType()))
	{
		result = true;
	}
	else if("WORKORDERTASK".equals(timeLogModel.getEntityType()))
	{
		result = true;
	}
	else if("N/A".equals(timeLogModel.getEntityType()))
	{
		result = true;
	}
	return result;
}

function syncTimeAccountingData(isCheckCapCondition)
{
	if(timeLogList == null || timeLogList.size() == 0) return;
	for(var i=0; i<timeLogList.size();i++)
	{
		var timeLogModel = timeLogList.get(i);
		if(isNeedSyncData(timeLogModel)) doDelete(timeLogModel, isCheckCapCondition);
	}
}

function populatePK(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	var mapping = aa.timeAccounting.getTimeAccountingSyncMappingList(entityTypeFrom, entityIDFrom, entityTypeTo, null);
	if(mapping.getSuccess() && mapping.getOutput().size() > 0)
	{
		costing.getCostingPK().setCostingCostID(aa.util.parseLong(mapping.getOutput().get(0).getEntityIDTo()));
		costing.setCostingCostID(aa.util.parseLong(mapping.getOutput().get(0).getEntityIDTo()));
	}
	return costing;
}

function populatePKForCA(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	var mapping = aa.timeAccounting.getTimeAccountingSyncMappingList(entityTypeFrom, entityIDFrom, entityTypeTo, null);
	if(mapping.getSuccess() && mapping.getOutput().size() > 0)
	{
		costing.getGenericCostingPKModel().setCostingID(aa.util.parseLong(mapping.getOutput().get(0).getEntityIDTo()));
	}
	return costing;
}

function deleteWorkOrderCosting(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	costing = populatePK(costing, entityTypeFrom, entityIDFrom, entityTypeTo);
	if(costing.getCostingCostID() == null ) return;
	var scriptResult = aa.workOrder.deleteWorkOrderCosting(costing);
	if(scriptResult.getSuccess())
	{
		var model = scriptResult.getOutput();
		deleteSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, model.getCostingPK().getCostingCostID());
	}
}

function deleteCACosting(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	costing = populatePKForCA(costing, entityTypeFrom, entityIDFrom, entityTypeTo);
	if(costing.getGenericCostingPKModel().getCostingID() == null ) return;
	var scriptResult = aa.assetCA.deleteCACosting(costing);
	if(scriptResult.getSuccess())
	{
		var model = scriptResult.getOutput();
		deleteSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, model.getGenericCostingPKModel().getCostingID());
	}
}

function deleteSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, entityIDTo)
{
	aa.timeAccounting.deleteTimeAccountingSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, entityIDTo);
}

function doDelete(timeLogModel, isCheckCapCondition)
{
	var reference = timeLogModel.getReference();
	var entityType = timeLogModel.getEntityType();
	var entityId = timeLogModel.getEntityId();
	var entityTypeFrom = "COSTING";
	if("CONDITION ASSESSMENT".equals(entityType))
	{
		if(entityId == null) return;
		var costing = aa.timeAccounting.convTimeAccountingToGenericCosting(timeLogModel);
		if(costing.getSuccess())
		{
			deleteCACosting(costing.getOutput(), "TIME ACCOUNTING", timeLogModel.getTimeLogSeq(), entityType);
		}
	}
	else 
	{
		if((reference == null || "N/A".equals(reference)) && timeLogModel.getCapIDModel() == null) return;
		var humanResource = aa.timeAccounting.convTimeAccountingToHumaning(timeLogModel);
		if(humanResource.getSuccess())
		{
			if((isCheckCapCondition && checkCapCondition(humanResource.getOutput().getCapID()))) return;
			deleteWorkOrderCosting(humanResource.getOutput(), "TIME ACCOUNTING", timeLogModel.getTimeLogSeq(), "RECORD");
		}
	}
	
	if(timeLogModel.getCostingModelList() != null && timeLogModel.getCostingModelList().size() > 0)
	{
		for(var i=0; i < timeLogModel.getCostingModelList().size(); i++)
		{
			var model = timeLogModel.getCostingModelList().get(i);
			if("CONDITION ASSESSMENT".equals(entityType))
			{
				model.setEntityType(entityType);
				model.setEntityID(entityId);
				deleteCACosting(model, entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), entityType);
			}
			else
			{
				var costing = aa.timeAccounting.convGenericCostingToCosting(model, reference, entityType, entityId);
				if(costing.getSuccess())
				{
					deleteWorkOrderCosting(costing.getOutput(), entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), "RECORD");
				}
			}
		}
	}
}
syncTimeAccountingData(true);
/*-------------------------------------------------------------------------------------------------------------/
| <===========End=Sync Time Accounting and Time Accounting Costing to Assignments and Costs================>
/------------------------------------------------------------------------------------------------------------*/	

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
	
/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/