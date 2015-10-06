/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2012-2013
|
| SVN $Id : TimeAccountingAddAfter.js 6438 2012-02-08 00:01:37Z dane.quatacker $
| Program : TimeAccountingAddAfterV2.0.js
| Event   : TimeAccountingAddAfter
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
var controlString = "TimeAccountingAddAfter"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents"				// Standard choice to execute first (for globals, etc)
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

var timeLogList = aa.env.getValue("TimeLogModelList");

if (timeLogList)
	{
	var it=timeLogList.iterator();
		while(it.hasNext())
		{
		var timeLog=it.next();
		var capId = null;
		var timeLogSeq		= timeLog.getTimeLogSeq(); 
		var timeGroupSeq	= timeLog.getTimeGroupSeq(); 
		var timeTypeSeq		= timeLog.getTimeTypeSeq();
		var reference		= "" + timeLog.getReference();  
		if (reference != null && reference != "N/A" && reference.substr("-") )
			{
			var sca = String(reference).split("-");
			var capId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput();
			}
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
		return isLockedResult.getOutput();
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
		if(!"N/A".equalsIgnoreCase(timeLogModel.getReference() && timeLogModel.getCapIDModel() != null)
		{
			result = true;
		}
	}
	return result;
}

function syncTimeAccountingData(isCheckCapCondition)
{
	if(timeLogList == null || timeLogList.size() == 0) return;
	for(var i=0; i<timeLogList.size();i++)
	{
		var timeLogModel = timeLogList.get(i);		
		if(isCheckCapCondition && !checkCapCondition(timeLogModel.getCapIDModel()) continue;
		if(isNeedSyncData(timeLogModel)) doAdd(timeLogModel);
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

function createWorkOrderCosting(costing, entityTypeFrom, entityIDFrom, entityTypeTo)
{
	var scriptResult = aa.workOrder.createWorkOrderCosting(costing);
	if(scriptResult.getSuccess())
	{	
		var model = scriptResult.getOutput();
		createSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, model.getCostingCostID());	
	}
}

function createSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, entityIDTo)
{
	aa.timeAccounting.createTimeAccountingSyncMapping(entityTypeFrom, entityIDFrom, entityTypeTo, entityIDTo);
}

function doAdd(timeLogModel)
{
	var entityTypeFrom = "COSTING";
	var reference = timeLogModel.getReference();
	var entityType = timeLogModel.getEntityType();
	var entityId = timeLogModel.getEntityId();
	
	if("CONDITION ASSESSMENT".equals(entityType))
	{
		if(entityId == null) return;
		var costing = aa.timeAccounting.convTimeAccountingToGenericCosting(timeLogModel);
		if(costing.getSuccess())
		{
			createCACosting(costing.getOutput(), "TIME ACCOUNTING", timeLogModel.getTimeLogSeq(), entityType);
		}
	}
	else 
	{
		if(reference == null || "N/A".equals(reference)) return;
		var humanResource = aa.timeAccounting.convTimeAccountingToHumaning(timeLogModel);
		if(humanResource.getSuccess())
		{
			createWorkOrderCosting(humanResource.getOutput(), "TIME ACCOUNTING", timeLogModel.getTimeLogSeq(), "RECORD");
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
				createCACosting(model, entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), entityType);
			}
			else
			{
				var costing = aa.timeAccounting.convGenericCostingToCosting(model, reference, entityType, entityId);
				if(costing.getSuccess())
				{
					createWorkOrderCosting(costing.getOutput(), entityTypeFrom, model.getGenericCostingPKModel().getCostingID(), "RECORD");
				}
			}
		}
	}
}

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
