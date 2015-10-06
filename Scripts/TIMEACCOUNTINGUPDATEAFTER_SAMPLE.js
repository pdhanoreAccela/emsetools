/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2012-2013
|
| SVN $Id : TimeAccountingUpdateAfter.js 6438 2012-02-08 00:01:37Z dane.quatacker $
| Program : TimeAccountingUpdateAfterV2.0.js
| Event   : TimeAccountingUpdateAfter
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
var controlString = "TimeAccountingUpdateAfter"; 	// Standard choice for control
var preExecute = "PreExecuteForAfterEvents";			// Standard choice to execute first (for globals, etc)
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/

var SCRIPT_VERSION = 2.0

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


var timeLog = aa.env.getValue("TimeLogModel");

logDebug("<B>EMSE Script Results for Time Log</B>");
logDebug("timeLog= " 		      + timeLog.getClass());
logDebug("getServProvCode="           + timeLog.getServProvCode());
logDebug("getTimeLogSeq="             + timeLog.getTimeLogSeq()); 
logDebug("getTimeGroupSeq="           + timeLog.getTimeGroupSeq()); 
logDebug("getTimeTypeSeq="            + timeLog.getTimeTypeSeq());
logDebug("getReference="              + timeLog.getReference());  
logDebug("getDateLogged="             + timeLog.getDateLogged()); 
logDebug("getStartTime="              + timeLog.getStartTime()); 
logDebug("getEndTime="                + timeLog.getEndTime()); 
logDebug("TimeElapsed="   + timeLog.getTimeElapsed().getHours()+ ":" + timeLog.getTimeElapsed().getMinutes());  
logDebug("getTotalMinutes="           + timeLog.getTotalMinutes()); 
logDebug("getBillable="               + timeLog.getBillable()); 
logDebug("getMaterials="              + timeLog.getMaterials()); 
logDebug("getMaterialsCost="          + timeLog.getMaterialsCost()); 
logDebug("getMileageStart="           + timeLog.getMileageStart()); 
logDebug("getMileageEnd="             + timeLog.getMileageEnd()); 
logDebug("getMilageTotal="            + timeLog.getMilageTotal());
logDebug("getVehicleId="              + timeLog.getVehicleId());
logDebug("getEntryRate="              + timeLog.getEntryRate()); 
logDebug("getEntryPct="               + timeLog.getEntryPct()); 
logDebug("getEntryCost="              + timeLog.getEntryCost()); 
logDebug("getCreatedDate="            + timeLog.getCreatedDate()); 
logDebug("getCreatedBy="              + timeLog.getCreatedBy()); 
logDebug("getNotation="               + timeLog.getNotation()); 
logDebug("getLastChangeDate()="       + timeLog.getLastChangeDate()); 
logDebug("getLastChangeUser()="       + timeLog.getLastChangeUser());
logDebug("getTimeTypeModel()="        + timeLog.getTimeTypeModel());
logDebug("getTimeTypeModel().getTimeTypeName()=" + timeLog.getTimeTypeModel().getTimeTypeName());
logDebug("getTimeTypeModel().getTimeTypeDesc()=" + timeLog.getTimeTypeModel().getTimeTypeDesc());
logDebug("getTimeTypeModel().getDefaultPctAdj()=" + timeLog.getTimeTypeModel().getDefaultPctAdj());
logDebug("getTimeTypeModel().getDefaultRate()=" + timeLog.getTimeTypeModel().getDefaultRate());

var servProvCode = timeLog.getServProvCode();

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

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
	var timeLog = aa.env.getValue("TimeLogModel");
	if(timeLog == null) return;
	if(isNeedSyncData(timeLog)) doUpdate(timeLog, isCheckCapCondition);
}


function createWorkOrderCosting(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	var scriptResult = aa.workOrder.createWorkOrderCosting(costing);
	if(scriptResult.getSuccess() && scriptResult.getOutput() != null)
	{
		var model = scriptResult.getOutput();
		createSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, model.getCostingPK().getCostingCostID());
	}
}

function updateWorkOrderCosting(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	costing = populatePK(costing, entityTypeFrom, entityIDFrom, entityTypeTo);
	if(costing.getCostingCostID() == null ) return;
	aa.workOrder.updateWorkOrderCosting(costing);
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

function createCACosting(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	var scriptResult = aa.assetCA.createCACosting(costing);
	if(scriptResult.getSuccess())
	{
		var model = scriptResult.getOutput();
		createSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, model.getGenericCostingPKModel().getCostingID());
	}
}

function updateCACosting(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	costing = populatePKForCA(costing, entityTypeFrom, entityIDFrom, entityTypeTo);
	if(costing.getGenericCostingPKModel().getCostingID() == null ) return;
	aa.assetCA.updateCACosting(costing);
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

function populatePK(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	var mapping = aa.timeAccounting.getTimeAccountingSyncMappingList(entityTypeFrom, entityIDFrom.toString(), entityTypeTo, " ");
	if(mapping.getSuccess() && mapping.getOutput().size() > 0)
	{
		costing.getCostingPK().setCostingCostID(aa.util.parseLong(mapping.getOutput().get(0).getEntityIDTo()));
		costing.setCostingCostID(aa.util.parseLong(mapping.getOutput().get(0).getEntityIDTo()));
	}
	return costing;
}

function createSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, entityIDTo)
{
	aa.timeAccounting.createTimeAccountingSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, entityIDTo);
}

function deleteSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, entityIDTo)
{
	aa.timeAccounting.deleteTimeAccountingSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, entityIDTo);
}

function doUpdate(timeLogModel, isCheckCapCondition)
{
	var reference = timeLogModel.getReference();
	var entityType = timeLogModel.getEntityType();
	var entityId = timeLogModel.getEntityId();
	var entityTypeFrom = "COSTING";
	if("CONDITION ASSESSMENT".equals(entityType))
	{	if(entityId == null) return;
		var costing = aa.timeAccounting.convTimeAccountingToGenericCosting(timeLogModel);
		if(costing.getSuccess())
		{
			updateCACosting(costing.getOutput(), "TIME ACCOUNTING", timeLogModel.getTimeLogSeq(), entityType);
		}
	}
	else
	{
		if(reference == null || "N/A".equals(reference)) return;
		var humanResource = aa.timeAccounting.convTimeAccountingToHumaning(timeLogModel);
		if(humanResource.getSuccess())
		{
			if(isCheckCapCondition && checkCapCondition(humanResource.getOutput().getCapID())) return;
			updateWorkOrderCosting(humanResource.getOutput(), "TIME ACCOUNTING", timeLogModel.getTimeLogSeq(), "RECORD");
		}
	}
	
	if(timeLogModel.getCostingModelList() != null && timeLogModel.getCostingModelList().size() > 0)
	{
		for(var i=0; i < timeLogModel.getCostingModelList().size(); i++)
		{
			var model = timeLogModel.getCostingModelList().get(i);
			if("edit".equals(model.getOperation()))
			{
				if("CONDITION ASSESSMENT".equals(entityType))
				{
					model.setEntityType(entityType);
					model.setEntityID(entityId);
					updateCACosting(model, entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), entityType);
				}
				else
				{
					var costing = aa.timeAccounting.convGenericCostingToCosting(model, reference, entityType, timeLogModel.getEntityId());
					if(costing.getSuccess()) 
					{
						updateWorkOrderCosting(costing.getOutput(), entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), "RECORD");
					}
				}
			}
			else if("add".equals(model.getOperation()))
			{
				if("CONDITION ASSESSMENT".equals(entityType))
				{
					model.setEntityType(entityType);
					model.setEntityID(entityId);
					createCACosting(model, entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), entityType);
				}
				else
				{
					var costing = aa.timeAccounting.convGenericCostingToCosting(model, reference, entityType, timeLogModel.getEntityId());
					if(costing.getSuccess()) 
					{
						createWorkOrderCosting(costing.getOutput(), entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), "RECORD");
					}
				}
			}
			else if("delete".equals(model.getOperation()))
			{
				if("CONDITION ASSESSMENT".equals(entityType))
				{
					model.setEntityType(entityType);
					model.setEntityID(entityId);
					deleteCACosting(model, entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), entityType);
				}
				else
				{
					var costing = aa.timeAccounting.convGenericCostingToCosting(model, reference, entityType, timeLogModel.getEntityId());
					if(costing.getSuccess()) 
					{
						deleteWorkOrderCosting(costing.getOutput(), entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), "RECORD");
					}
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
