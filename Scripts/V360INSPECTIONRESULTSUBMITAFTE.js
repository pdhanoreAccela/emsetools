/*------------------------------------------------------------------------------------------------------/
| SVN $Id: V360InspectionResultSubmitAfterV1.4.js 1051 2007-12-18 17:58:36Z john.schomp $
| Program : V360InspectionResultSubmitAfterV1.5.js
| Event   : V360InspectionResultSubmitAfter
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   : Makes an assumption that all inspections are resulted on the same CAP
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
var showMessage = false;						// Set to true to see results in popup window
var showDebug = true;							// Set to true to see debug messages in popup window
var controlString = "InspectionResultSubmitAfter"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents"				// Standard choice to execute first (for globals, etc)
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps
var disableTokens = false;						// turn off tokenizing of std choices (enables use of "{} and []")
var useAppSpecificGroupName = false;					// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;					// Use Group name when populating Task Specific Info Values
var enableVariableBranching = false;					// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99;							// Maximum number of std choice entries.  Entries must be Left Zero Padded
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";							// Message String
var debug = "";								// Debug String
var br = "<BR>";					// Break Tag
var li = "<li>";					// List Start
var endli = "</li>";					// List end
var feeSeqList = new Array();						// invoicing fee list
var paymentPeriodList = new Array();					// invoicing pay periods

if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}

//
// Special for this V360 event that passes an array of cap ids.  We assume that only one CAP is being resulted
//
var s_id1 = aa.env.getValue("PermitId1Array");
var s_id2 = aa.env.getValue("PermitId2Array");
var s_id3 = aa.env.getValue("PermitId3Array");
var s_capResult = aa.cap.getCapID(s_id1[0], s_id2[0], s_id3[0]);
if(s_capResult.getSuccess())
	capId = s_capResult.getOutput();
else
	logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
//
//
// var capId = getCapId();						// CapId object
//
var cap = aa.cap.getCap(capId).getOutput();				// Cap object
var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code
var currentUserID = aa.env.getValue("CurrentUserID");   		// Current User
var capIDString = capId.getCustomID();					// alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString();				// Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/");				// Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var fileDateObj = cap.getFileDate();					// File Date scriptdatetime
var fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
var fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(),fileDateObj.getDayOfMonth(),fileDateObj.getYear(),"YYYY-MM-DD");
var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"YYYY-MM-DD");
var parcelArea = 0;

var estValue = 0; var calcValue = 0; var feeFactor			// Init Valuations
var valobj = aa.finance.getContractorSuppliedValuation(capId,null).getOutput();	// Calculated valuation
if (valobj.length) {
	estValue = valobj[0].getEstimatedValue();
	calcValue = valobj[0].getCalculatedValue();
	feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
	}

var balanceDue = 0 ; var houseCount = 0; feesInvoicedTotal = 0;		// Init detail Data
var capDetail = "";
var capDetailObjResult = aa.cap.getCapDetail(capId);			// Detail
if (capDetailObjResult.getSuccess())
	{
	capDetail = capDetailObjResult.getOutput();
	var houseCount = capDetail.getHouseCount();
	var feesInvoicedTotal = capDetail.getTotalFee();
	var balanceDue = capDetail.getBalance();
	}

/*****************Script Text Start*************************/
//define a object
var FieldInfo = function(columnName, fieldValue, readOnly) {
	this.columnName = columnName;
	this.fieldValue = fieldValue;
	this.readOnly = readOnly;
};

var AInfo = new Array();						// Create array for tokenized variables
loadAppSpecific(AInfo); 						// Add AppSpecific Info
loadTaskSpecific(AInfo);						// Add task specific info
loadParcelAttributes(AInfo);						// Add parcel attributes
loadASITables();

logDebug("<B>EMSE Script Results for " + capIDString + "</B>");
logDebug("capId = " + capId.getClass());
logDebug("cap = " + cap.getClass());
logDebug("currentUserID = " + currentUserID);
logDebug("currentUserGroup = " + currentUserGroup);
logDebug("systemUserObj = " + systemUserObj.getClass());
logDebug("appTypeString = " + appTypeString);
logDebug("capName = " + capName);
logDebug("capStatus = " + capStatus);
logDebug("fileDate = " + fileDate);
logDebug("fileDateYYYYMMDD = " + fileDateYYYYMMDD);
logDebug("sysDate = " + sysDate.getClass());
logDebug("parcelArea = " + parcelArea);
logDebug("estValue = " + estValue);
logDebug("calcValue = " + calcValue);
logDebug("feeFactor = " + feeFactor);

logDebug("houseCount = " + houseCount);
logDebug("feesInvoicedTotal = " + feesInvoicedTotal);
logDebug("balanceDue = " + balanceDue);

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

var inspTypeArr = aa.env.getValue("InspectionTypeArray")
var inspResultArr = aa.env.getValue("InspectionResultArray")
var inspIdArr = aa.env.getValue("InspectionIdArray")

// Main Loop is affected by number of inspections, see below

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
for (inspCount in inspIdArr)
	{
	inspId = inspIdArr[inspCount];
	inspResult = inspResultArr[inspCount];
	inspType = inspTypeArr[inspCount];
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspComment = inspObj.getInspection().getResultComment();
	inspGroup = inspObj.getInspection().getInspectionGroup();
	inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	inspInspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	logDebug("Inspection #" + inspCount);
	logDebug("inspId " + inspIdArr[inspCount]);
	logDebug("inspResult = " + inspResultArr[inspCount]);
	logDebug("inspResultComment = " + inspComment);
	logDebug("inspResultDate = " + inspResultDate);
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspType = " + inspType);
	logDebug("inspSchedDate = " + inspSchedDate);
	doStandardChoiceActions(controlString,true,0);
	}

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

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
		tempObject[tcol.getColumnName()] = tval;
		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	  eval(copyStr);  // move to table name
	  }

	}

function loadParcelAttributes(thisArr) {
	//
	// Returns an associative array of Parcel Attributes
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var fcapParcelObj = null;
	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
	if (capParcelResult.getSuccess())
		var fcapParcelObj = capParcelResult.getOutput().toArray();
	else
		logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())

	for (i in fcapParcelObj)
		{
		parcelArea += fcapParcelObj[i].getParcelArea()
		var parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
		for (z in parcelAttrObj)
			thisArr["ParcelAttribute." + parcelAttrObj[z].getB1AttributeName()]=parcelAttrObj[z].getB1AttributeValue();

		// Explicitly load some standard values
		thisArr["ParcelAttribute.Block"] = fcapParcelObj[i].getBlock();
		thisArr["ParcelAttribute.Book"] = fcapParcelObj[i].getBook();
		thisArr["ParcelAttribute.CensusTract"] = fcapParcelObj[i].getCensusTract();
		thisArr["ParcelAttribute.CouncilDistrict"] = fcapParcelObj[i].getCouncilDistrict();
		thisArr["ParcelAttribute.ExemptValue"] = fcapParcelObj[i].getExemptValue();
		thisArr["ParcelAttribute.ImprovedValue"] = fcapParcelObj[i].getImprovedValue();
		thisArr["ParcelAttribute.InspectionDistrict"] = fcapParcelObj[i].getInspectionDistrict();
		thisArr["ParcelAttribute.LandValue"] = fcapParcelObj[i].getLandValue();
		thisArr["ParcelAttribute.LegalDesc"] = fcapParcelObj[i].getLegalDesc();
		thisArr["ParcelAttribute.Lot"] = fcapParcelObj[i].getLot();
		thisArr["ParcelAttribute.MapNo"] = fcapParcelObj[i].getMapNo();
		thisArr["ParcelAttribute.MapRef"] = fcapParcelObj[i].getMapRef();
		thisArr["ParcelAttribute.ParcelStatus"] = fcapParcelObj[i].getParcelStatus();
		thisArr["ParcelAttribute.SupervisorDistrict"] = fcapParcelObj[i].getSupervisorDistrict();
		thisArr["ParcelAttribute.Tract"] = fcapParcelObj[i].getTract();
		thisArr["ParcelAttribute.PlanArea"] = fcapParcelObj[i].getPlanArea();
		}
	}

function loadTaskSpecific(thisArr)
	{
 	//
 	// Appends the Task Specific Info to App Specific Array
 	// If useTaskSpecificGroupName==true, appends wf process code.wftask. to TSI field label
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		var wfObj = workflowResult.getOutput();
 	else
 		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()) ; return false; }

 	for (i in wfObj)
 		{
 		var fTask = wfObj[i];
 		var stepnumber = fTask.getStepNumber();
 		var processID = fTask.getProcessID();
 		var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(itemCap, processID, stepnumber)
 		if (TSIResult.getSuccess())
 			{
 			var TSI = TSIResult.getOutput();
 			for (a1 in TSI)
  				{
  				if (useTaskSpecificGroupName)
  	  				thisArr[fTask.getProcessCode() + "." + fTask.getTaskDescription() + "." + TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
  	  			else
	  				thisArr[TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
				}
 			}
 		}
	}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;

	for (var count=1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
		{
		var countstr = "000000" + count;
		countstr = String(countstr).substring(countstr.length,countstr.length - maxLength);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			bizDomScriptObj = bizDomScriptResult.getOutput();
			var myObj= new pairObj(bizDomScriptObj.getBizdomainValue());
			myObj.load(bizDomScriptObj.getDescription());
			if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		else
			{
			break;
			}
		}
	return actArray;
	}

function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {
                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                    logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                    eval(token(doObj.act));
                    lastEvalTrue = true;
                }
                else {
                    if (doObj.elseact) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                        eval(token(doObj.elseact));
                    }
                    lastEvalTrue = false;
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
}

function docWrite(dstr,header,indent)
	{
	var istr = "";
	for (i = 0 ; i < indent ; i++)
		istr+="|  ";
	if (header && dstr)
		aa.print(istr + "------------------------------------------------");
	if (dstr) aa.print(istr + dstr);
	if (header)
		aa.print(istr + "------------------------------------------------");
	}


function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
  	}

function pairObj(actID)
	{
	this.ID = actID;
	this.cri = null;
	this.act = null;
	this.elseact = null;
	this.enabled = true;
	this.continuation = false;
	this.branch = new Array();

	this.load = function(loadStr) {
		//
		// load() : tokenizes and loades the criteria and action
		//
		loadArr = loadStr.split("\\^");
		if (loadArr.length < 2 || loadArr.length > 3)
			{
			logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (!enableVariableBranching && bb >= 0)
			  {
			  var cc = a.substring(bb);
			  var dd = cc.indexOf("\")");
			  this.branch.push(cc.substring(8,dd));
			  a = cc.substring(dd);
			  bb = a.indexOf("branch");
			  }

			}
		}
	}

function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}


function logDebug(dstr) {


    vLevel = 1
    if (arguments.length > 1)
        vLevel = arguments[1]

    if ((showDebug & vLevel) == vLevel || vLevel == 1)
        debug += dstr + br;

    if ((showDebug & vLevel) == vLevel)
        aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}

function logMessage(dstr)
	{
	message+=li + dstr + endli;
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/


function activateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}



function addAddressCondition(addNum, cType,cStatus,cDesc,cComment,cImpact)
//if addNum is null, condition is added to all addresses on CAP
	{
	if (!addNum)
		{
		var capAddResult = aa.address.getAddressByCapId(capId);
		if (capAddResult.getSuccess())
			{
			var Adds = capAddResult.getOutput();
			for (zz in Adds)
				{

				if (Adds[zz].getRefAddressId())
					{
					var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

						if (addAddCondResult.getSuccess())
							{
							logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
							}
						else
							{
							logDebug( "**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
							}
					}
				}
			}
		}
	else
		{
			var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


		        if (addAddCondResult.getSuccess())
		        	{
				logDebug("Succe
//if parcelNum is null, condition is added to all parcels on CAP
	{
	if (!parcelNum)
		{
		var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
		if (capParcelResult.getSuccess())
			{
			var Parcels = capParcelResult.getOutput().toArray();
			for (zz in Parcels)
				{
				logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
				var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
					if (addParcelCondResult.getSuccess())
					        	{
						logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
						logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
						}
					else
						{
						logDebug( "**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
						}
				}
			}
		}
	else
		{
			var addParcelCondResult = aa.parcelCondition.addParcelCondition(parcelNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

		        if (addParcelCondResult.getSuccess())
		        	{
				logMessage("Successfully added condition to Parcel " + parcelNum + "  (" + cImpact + ") " + cDesc);
				logDebug("Successfully added condition to Parcel " + parcelNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
			logDebug( "**ERROR: adding condition to Parcel " + parcelNum + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
				}
		}
	}


function addParcelDistrict(parcelNum, districtValue)
//if parcelNum is null, district is is added to all parcels on CAP
	{
	if (!parcelNum)
		{
		var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
		if (capParcelResult.getSuccess())
			{
			var Parcels = capParcelResult.getOutput().toArray();
			for (zz in Parcels)
				{
				apdResult = aa.parcel.addParceDistrictForDaily(capId.getID1(),capId.getID2(),capId.getID3(),Parcels[zz].getParcelNumber(),districtValue);

				if (!apdResult.getSuccess())
					{ logDebug("**ERROR Adding District " + districtValue + " to parcel #" + Parcels[zz].getParcelNumber() + " : " + apdResult.getErrorMessage()) ; return false ; }
				else
					logDebug("Successfully added district " + districtValue + " to parcel #" + Parcels[zz].getParcelNumber());

				}
			}
		}
	else
		{
		apdResult = aa.parcel.addParceDistrictForDaily(capId.getID1(),capId.getID2(),capId.getID3(),parcelNum,districtValue);

		if (!apdResult.getSuccess())
			{ logDebug("**ERROR Adding District " + districtValue + " to parcel #" + parcelNum + " : " + apdResult.getErrorMessage()) ; return false ; }
		else
			logDebug("Successfully added district " + districtValue + " to parcel #" + parcelNum);
		}
	}


function addParent(parentAppNum)
//
// adds the current application to the parent
//
	{
	var getCapResult = aa.cap.getCapID(parentAppNum);
	if (getCapResult.getSuccess())
		{
		var parentId = getCapResult.getOutput();
		var linkResult = aa.cap.createAppHierarchy(parentId, capId);
		if (linkResult.getSuccess())
			logDebug("Successfully linked to Parent Application : " + parentAppNum);
		else
			logDebug( "**ERROR: linking to parent application parent cap id (" + parentAppNum + "): " + linkResult.getErrorMessage());
		}
	else
		{ logDebug( "**ERROR: getting parent cap id (" + parentAppNum + "): " + getCapResult.getErrorMessage()) }
	}


function addrAddCondition(pAddrNum, pType, pStatus, pDesc, pComment, pImpact, pAllowDup)
	{
	//if pAddrNum is null, condition is added to all addresses on CAP
	//06SSP-00223
	//
	if (pAllowDup=="Y")
		var noDup = false;
	else
		var noDup = true;

	var condAdded = false;

	if (!pAddrNum) //no address num, add condition to all addresses on CAP
		{
		var capAddrResult = aa.address.getAddressByCapId(capId);
		if (capAddrResult.getSuccess())
			{
			var addCondResult;
			var addCondResult2;
			var getCondResult;
			var condArray;
			var addresses = capAddrResult.getOutput();

			addCondLoop:  //loop identifier
			for (zz in addresses)
				{
				var addrRefId = addresses[zz].getRefAddressId();
				if (addrRefId==null)
					{
					logDebug("No reference address ID found for Address "+zz);
					continue;
					}

				if (noDup) //Check if this address has duplicate condition
					{
					var cType;
					var cStatus;
					var cDesc;
					var cImpact;

					getCondResult = aa.addressCondition.getAddressConditions(addrRefId);
					condArray = getCondResult.getOutput();
					if (condArray.length>0)
						{
						for (bb in condArray)
							{
							cType = condArray[bb].getConditionType();
							cStatus = condArray[bb].getConditionStatus();
							cDesc = condArray[bb].getConditionDescription();
							cImpact = condArray[bb].getImpactCode();
							if (cType==null)
								cType = " ";
							if (cStatus==null)
								cStatus = " ";
							if (cDesc==null)
								cDesc = " ";
							if (cImpact==null)
								cImpact = " ";
							if ( (pType==null || pType.toUpperCase()==cType.toUpperCase()) && (pStatus==null || pStatus.toUpperCase()==cStatus.toUpperCase()) && (pDesc==null || pDesc.toUpperCase()==cDesc.toUpperCase()) && (pImpact==null || pImpact.toUpperCase()==cImpact.toUpperCase()) )
								{
								logMessage("Condition already exists: New condition not added to Address ID "+addrRefId);
								logDebug("Condition already exists: New condition not added to Address ID "+addrRefId);
								continue addCondLoop; //continue to next address without adding condition
								}
							}
						}
					}

				logDebug("Adding Condition to address " + zz + " = " + addrRefId);
				addCondResult = aa.addressCondition.addAddressCondition(addrRefId, pType, pDesc, pComment, null, null, pImpact, pStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
				if (addCondResult.getSuccess())
					{
					logMessage("Successfully added condition to Address ID " + addrRefId + "  (" + pImpact + ") " + pDesc);
					logDebug("Successfully added condition to Address ID " + addrRefId + "  (" + pImpact + ") " + pDesc);
					condAdded=true;
					}
				else
					{
					logDebug( "**ERROR: adding condition to Address " + addrRefId + "  (" + pImpact + "): " + addCondResult.getErrorMessage());
					}
				}
			}
		}
	else //add condition to specified address only
		{
		if (noDup) //Check if this address has duplicate condition
			{
			var cType;
			var cStatus;
			var cDesc;
			var cImpact;

			getCondResult = aa.addressCondition.getAddressConditions(pAddrNum);
			condArray = getCondResult.getOutput();
			if (condArray.length>0)
				{
				for (bb in condArray)
					{
					cType = condArray[bb].getConditionType();
					cStatus = condArray[bb].getConditionStatus();
					cDesc = condArray[bb].getConditionDescription();
					cImpact = condArray[bb].getImpactCode();
					if (cType==null)
						cType = " ";
					if (cStatus==null)
						cStatus = " ";
					if (cDesc==null)
						cDesc = " ";
					if (cImpact==null)
						cImpact = " ";
					if ( (pType==null || pType.toUpperCase()==cType.toUpperCase()) && (pStatus==null || pStatus.toUpperCase()==cStatus.toUpperCase()) && (pDesc==null || pDesc.toUpperCase()==cDesc.toUpperCase()) && (pImpact==null || pImpact.toUpperCase()==cImpact.toUpperCase()) )
						{
						logMessage("Condition already exists: New condition not added to Address ID "+pAddrNum);
						logDebug("Condition already exists: New condition not added to Address ID "+pAddrNum);
						return false;
						}
					}
				}
			}
		var addCondResult = aa.addressCondition.addAddressCondition(pAddrNum, pType, pDesc, pComment, null, null, pImpact, pStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
	  if (addCondResult.getSuccess())
		  {
			logMessage("Successfully added condition unt];
	inspResult = inspResultArr[inspCount];
	inspType = inspTypeArr[inspCount];
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspComment = inspObj.getInspection().getResultComment();
	inspGroup = inspObj.getInspection().getInspectionGroup();
	inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	inspInspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	logDebug("Inspection #" + inspCount);
	logDebug("inspId " + inspIdArr[inspCount]);
	logDebug("inspResult = " + inspResultArr[inspCount]);
	logDebug("inspResultComment = " + inspComment);
	logDebug("inspResultDate = " + inspResultDate);
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspType = " + inspType);
	logDebug("inspSchedDate = " + inspSchedDate);
	doStandardChoiceActions(controlString,true,0);
	}

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

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
		tempObject[tcol.getColumnName()] = tval;
		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	  eval(copyStr);  // move to table name
	  }

	}

function loadParcelAttributes(thisArr) {
	//
	// Returns an associative array of Parcel Attributes
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var fcapParcelObj = null;
	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
	if (capParcelResult.getSuccess())
		var fcapParcelObj = capParcelResult.getOutput().toArray();
	else
		logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())

	for (i in fcapParcelObj)
		{
		parcelArea += fcapParcelObj[i].getParcelArea()
		var parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
		for (z in parcelAttrObj)
			thisArr["ParcelAttribute." + parcelAttrObj[z].getB1AttributeName()]=parcelAttrObj[z].getB1AttributeValue();

		// Explicitly load some standard values
		thisArr["ParcelAttribute.Block"] = fcapParcelObj[i].getBlock();
		thisArr["ParcelAttribute.Book"] = fcapParcelObj[i].getBook();
		thisArr["ParcelAttribute.CensusTract"] = fcapParcelObj[i].getCensusTract();
		thisArr["ParcelAttribute.CouncilDistrict"] = fcapParcelObj[i].getCouncilDistrict();
		thisArr["ParcelAttribute.ExemptValue"] = fcapParcelObj[i].getExemptValue();
		thisArr["ParcelAttribute.ImprovedValue"] = fcapParcelObj[i].getImprovedValue();
		thisArr["ParcelAttribute.InspectionDistrict"] = fcapParcelObj[i].getInspectionDistrict();
		thisArr["ParcelAttribute.LandValue"] = fcapParcelObj[i].getLandValue();
		thisArr["ParcelAttribute.LegalDesc"] = fcapParcelObj[i].getLegalDesc();
		thisArr["ParcelAttribute.Lot"] = fcapParcelObj[i].getLot();
		thisArr["ParcelAttribute.MapNo"] = fcapParcelObj[i].getMapNo();
		thisArr["ParcelAttribute.MapRef"] = fcapParcelObj[i].getMapRef();
		thisArr["ParcelAttribute.ParcelStatus"] = fcapParcelObj[i].getParcelStatus();
		thisArr["ParcelAttribute.SupervisorDistrict"] = fcapParcelObj[i].getSupervisorDistrict();
		thisArr["ParcelAttribute.Tract"] = fcapParcelObj[i].getTract();
		thisArr["ParcelAttribute.PlanArea"] = fcapParcelObj[i].getPlanArea();
		}
	}

function loadTaskSpecific(thisArr)
	{
 	//
 	// Appends the Task Specific Info to App Specific Array
 	// If useTaskSpecificGroupName==true, appends wf process code.wftask. to TSI field label
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		var wfObj = workflowResult.getOutput();
 	else
 		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()) ; return false; }

 	for (i in wfObj)
 		{
 		var fTask = wfObj[i];
 		var stepnumber = fTask.getStepNumber();
 		var processID = fTask.getProcessID();
 		var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(itemCap, processID, stepnumber)
 		if (TSIResult.getSuccess())
 			{
 			var TSI = TSIResult.getOutput();
 			for (a1 in TSI)
  				{
  				if (useTaskSpecificGroupName)
  	  				thisArr[fTask.getProcessCode() + "." + fTask.getTaskDescription() + "." + TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
  	  			else
	  				thisArr[TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
				}
 			}
 		}
	}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;

	for (var count=1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
		{
		var countstr = "000000" + count;
		countstr = String(countstr).substring(countstr.length,countstr.length - maxLength);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			bizDomScriptObj = bizDomScriptResult.getOutput();
			var myObj= new pairObj(bizDomScriptObj.getBizdomainValue());
			myObj.load(bizDomScriptObj.getDescription());
			if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		else
			{
			break;
			}
		}
	return actArray;
	}

function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {
                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                    logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                    eval(token(doObj.act));
                    lastEvalTrue = true;
                }
                else {
                    if (doObj.elseact) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                        eval(token(doObj.elseact));
                    }
                    lastEvalTrue = false;
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
}

function docWrite(dstr,header,indent)
	{
	var istr = "";
	for (i = 0 ; i < indent ; i++)
		istr+="|  ";
	if (header && dstr)
		aa.print(istr + "------------------------------------------------");
	if (dstr) aa.print(istr + dstr);
	if (header)
		aa.print(istr + "------------------------------------------------");
	}


function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
  	}

function pairObj(actID)
	{
	this.ID = actID;
	this.cri = null;
	this.act = null;
	this.elseact = null;
	this.enabled = true;
	this.continuation = false;
	this.branch = new Array();

	this.load = function(loadStr) {
		//
		// load() : tokenizes and loades the criteria and action
		//
		loadArr = loadStr.split("\\^");
		if (loadArr.length < 2 || loadArr.length > 3)
			{
			logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (!enableVariableBranching && bb >= 0)
			  {
			  var cc = a.substring(bb);
			  var dd = cc.indexOf("\")");
			  this.branch.push(cc.substring(8,dd));
			  a = cc.substring(dd);
			  bb = a.indexOf("branch");
			  }

			}
		}
	}

function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}


function logDebug(dstr) {


    vLevel = 1
    if (arguments.length > 1)
        vLevel = arguments[1]

    if ((showDebug & vLevel) == vLevel || vLevel == 1)
        debug += dstr + br;

    if ((showDebug & vLevel) == vLevel)
        aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}

function logMessage(dstr)
	{
	message+=li + dstr + endli;
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/


function activateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}



function addAddressCondition(addNum, cType,cStatus,cDesc,cComment,cImpact)
//if addNum is null, condition is added to all addresses on CAP
	{
	if (!addNum)
		{
		var capAddResult = aa.address.getAddressByCapId(capId);
		if (capAddResult.getSuccess())
			{
			var Adds = capAddResult.getOutput();
			for (zz in Adds)
				{

				if (Adds[zz].getRefAddressId())
					{
					var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

						if (addAddCondResult.getSuccess())
							{
							logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
							}
						else
							{
							logDebug( "**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
							}
					}
				}
			}
		}
	else
		{
			var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


		        if (addAddCondResult.getSuccess())
		        	{
				logDebug("Succe.editCapDetail(cd)

	if (cdWrite.getSuccess())
	{
		logDebug("Set CAP *Completed by Staff* to " + userId) + "\nSet CAP *Completed by Dept* " + iName.getDeptOfUser() + "\nSet CAP *Completed Date* " + sysDate.toString();
	}
	else
	{
		logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ;
		return false ;
	}
}
function contactAddFromUser(pUserId)
	{
	// Retrieves user's reference Contact record and adds to CAP
	// Returns contact seq nbr or false if contact not added
	// 06SSP-00186
	//
	if (arguments.length==1) //use parameter user
		{
		var personResult = aa.person.getUser(pUserId);
		if (personResult.getSuccess())
			{
			var personObj = personResult.getOutput();
			//logDebug("personObj class: "+personObj.getClass());
			if (personObj==null) // no user found
				{
				logDebug("**ERROR: Failed to get User");
				return false;
				}
			}
		else
  	  {
			logDebug("**ERROR: Failed to get User: " + personResult.getErrorMessage());
			return false;
			}
		}
	else //use current user
		var personObj = systemUserObj;

	var userFirst = personObj.getFirstName();
	var userMiddle = personObj.getMiddleName();
	var userLast = personObj.getLastName();

	//Find PeopleModel object for user
	var peopleResult = aa.people.getPeopleByFMLName(userFirst, userMiddle, userLast);
	if (peopleResult.getSuccess())
		{
		var peopleObj = peopleResult.getOutput();
		//logDebug("peopleObj is "+peopleObj.getClass());
		if (peopleObj==null)
			{
			logDebug("No reference user found.");
			return false;
			}
		logDebug("No. of reference contacts found: "+peopleObj.length);
		}
	else
		{
			logDebug("**ERROR: Failed to get reference contact record: " + peopleResult.getErrorMessage());
			return false;
		}

	//Add the reference contact record to the current CAP
	var contactAddResult = aa.people.createCapContactWithRefPeopleModel(capId, peopleObj[0]);
	if (contactAddResult.getSuccess())
		{
		logDebug("Contact successfully added to CAP.");
		var capContactResult = aa.people.getCapContactByCapID(capId);
		if (capContactResult.getSuccess())
			{
			var Contacts = capContactResult.getOutput();
			var idx = Contacts.length;
			var contactNbr = Contacts[idx-1].getCapContactModel().getPeople().getContactSeqNumber();
			logDebug ("Contact Nbr = "+contactNbr);
			return contactNbr;
			}
		else
			{
			logDebug("**ERROR: Failed to get Contact Nbr: "+capContactResult.getErrorMessage());
			return false;
			}
		}
	else
		{
			logDebug("**ERROR: Cannot add contact: " + contactAddResult.getErrorMessage());
			return false;
		}
	}


function contactSetPrimary(pContactNbr)
	{
	// Makes contact the Primary Contact
	// 06SSP-00186
	//
	if (pContactNbr==null)
		{
		logDebug("**ERROR: ContactNbr parameter is null");
		return false;
		}
	else
		{
		var capContactResult = aa.people.getCapContactByPK(capId, pContactNbr);
		if (capContactResult.getSuccess())
			{
			var contact = capContactResult.getOutput();
			//logDebug("contact class is "+contact.getClass());
			var peopleObj=contact.getCapContactModel().getPeople();
			peopleObj.setFlag("Y");
			contact.getCapContactModel().setPeople(peopleObj);
			var editResult = aa.people.editCapContact(contact.getCapContactModel());
			if (editResult.getSuccess())
				{
				logDebug("Contact successfully set to Primary");
				return true;
				}
			else
				{
				logDebug("**ERROR: Could not set contact to Primary: "+editResult.getErrorMessage());
				return false;
				}
			}
		else
			{
			logDebug("**ERROR: Can't get contact: "+capContactResult.getErrorMessage());
			return false;
			}
		}
	}


function contactSetRelation(pContactNbr, pRelation)
	{
	// Edits Contact Relationship for specified Contact
	//06SSP-00186
	//
	if (pContactNbr==null)
		{
		logDebug("ContactNbr parameter is null");
		return false;
		}
	else
		{
		var capContactResult = aa.people.getCapContactByPK(capId, pContactNbr);
		if (capContactResult.getSuccess())
			{
			var contact = capContactResult.getOutput();
			//logDebug("contact class is "+contact.getClass());
			var peopleObj=contact.getCapContactModel().getPeople();
			peopleObj.setRelation(pRelation);
			contact.getCapContactModel().setPeople(peopleObj);
			var editResult = aa.people.editCapContact(contact.getCapContactModel());
			if (editResult.getSuccess())
				{
				logDebug("Contact relationship successfully changed to "+pRelation);
				return true;
				}
			else
				{
				logDebug("**ERROR: Could not change contact relationship: "+editResult.getErrorMessage());
				return false;
				}
			}
		else
			{
			logDebug("**ERROR: Can't get contact: "+capContactResult.getErrorMessage());
			return false;
			}
		}
	}


function copyAddresses(pFromCapId, pToCapId)
	{
	//Copies all property addresses from pFromCapId to pToCapId
	//If pToCapId is null, copies to current CAP
	//07SSP-00037/SP5017
	//
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	//check if target CAP has primary address
	var priAddrExists = false;
	var capAddressResult = aa.address.getAddressByCapId(vToCapId);
	if (capAddressResult.getSuccess())
		{
		Address = capAddressResult.getOutput();
		for (yy in Address)
			{
			if ("Y"==Address[yy].getPrimaryFlag())
				{
				priAddrExists = true;
				logDebug("Target CAP has primary address");
				break;
				}
			}
		}
	else
		{
		logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
		return false;
		}

	//get addresses from originating CAP
	var capAddressResult = aa.address.getAddressByCapId(pFromCapId);
	var copied = 0;
	if (capAddressResult.getSuccess())
		{
		Address = capAddressResult.getOutput();
		for (yy in Address)
			{
			newAddress = Address[yy];
			newAddress.setCapID(vToCapId);
			if (priAddrExists)
				newAddress.setPrimaryFlag("N"); //prevent target CAP from having more than 1 primary address
			aa.address.createAddress(newAddress);
			logDebug("Copied address from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
			copied++;
			}
		}
	else
		{
		logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
		return false;
		}
	return copied;
	}
function copyAppSpecific(newCap) // copy all App Specific info into new Cap
	{
	for (asi in AInfo)
	  	editAppSpecific(asi,AInfo[asi],newCap)
	}


function copyASIFields(sourceCapId,targetCapId)  // optional fields to ignore
	{
	var ignoreArray = new Array();
	for (var i=1; i<arguments.length;i++)
		ignoreArray.push(arguments[i])

	var targetCap = aa.cap.getCap(targetCapId).getOutput();
	var targetCapType = targetCap.getCapType();
	var targetCapTypeString = targetCapType.toString();
	var targetCapTypeArray = targetCapTypeString.split("/");

	var sourceASIResult = aa.appSpecificInfo.getByCapID(sourceCapId)

	if (sourceASIResult.getSuccess())
		{ var sourceASI = sourceASIResult.getOutput(); }
	else
		{ aa.print( "**ERROR: getting source ASI: " + sourceASIResult.getErrorMessage()); return false }

	for (ASICount in sourceASI)
		  {
		  thisASI = sourceASI[ASICount];

		  if (!exists(thisASI.getCheckboxType(),ignoreArray))
		       {
		       thisASI.setPermitID1(targetCapId.getID1())
		       thisASI.setPermitID2(targetCapId.getID2())
		       thisASI.setPermitID3(targetCapId.getID3())
		       thisASI.setPerType(targetCapTypeArray[1])
		       thisASI.setPerSubType(targetCapTypeArray[2])
		       aa.cap.createCheckbox(thisASI)
		       }
  		  }
	}

function copyCalcVal(fromcap,newcap)
	{
	// 8/8/2008 JHS  creatBCalcValuatn method began using the script model after 6.4  updated this function
	if (!newcap)
		{ logMessage("**WARNING: copyCalcVal was passed a null new cap ID"); return false; }

	var valResult = aa.finance.getCalculatedValuation(fromcap,null);
	if (valResult.getSuccess())
		var valArray = valResult.getOutput();
	else
		{ logMessage("**ERROR: Failed to get calc val array: " + valResult.getErrorMessage()); return false; }

	for (thisCV in valArray)
		{
		var bcunt];
	inspResult = inspResultArr[inspCount];
	inspType = inspTypeArr[inspCount];
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspComment = inspObj.getInspection().getResultComment();
	inspGroup = inspObj.getInspection().getInspectionGroup();
	inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	inspInspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	logDebug("Inspection #" + inspCount);
	logDebug("inspId " + inspIdArr[inspCount]);
	logDebug("inspResult = " + inspResultArr[inspCount]);
	logDebug("inspResultComment = " + inspComment);
	logDebug("inspResultDate = " + inspResultDate);
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspType = " + inspType);
	logDebug("inspSchedDate = " + inspSchedDate);
	doStandardChoiceActions(controlString,true,0);
	}

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

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
		tempObject[tcol.getColumnName()] = tval;
		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	  eval(copyStr);  // move to table name
	  }

	}

function loadParcelAttributes(thisArr) {
	//
	// Returns an associative array of Parcel Attributes
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var fcapParcelObj = null;
	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
	if (capParcelResult.getSuccess())
		var fcapParcelObj = capParcelResult.getOutput().toArray();
	else
		logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())

	for (i in fcapParcelObj)
		{
		parcelArea += fcapParcelObj[i].getParcelArea()
		var parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
		for (z in parcelAttrObj)
			thisArr["ParcelAttribute." + parcelAttrObj[z].getB1AttributeName()]=parcelAttrObj[z].getB1AttributeValue();

		// Explicitly load some standard values
		thisArr["ParcelAttribute.Block"] = fcapParcelObj[i].getBlock();
		thisArr["ParcelAttribute.Book"] = fcapParcelObj[i].getBook();
		thisArr["ParcelAttribute.CensusTract"] = fcapParcelObj[i].getCensusTract();
		thisArr["ParcelAttribute.CouncilDistrict"] = fcapParcelObj[i].getCouncilDistrict();
		thisArr["ParcelAttribute.ExemptValue"] = fcapParcelObj[i].getExemptValue();
		thisArr["ParcelAttribute.ImprovedValue"] = fcapParcelObj[i].getImprovedValue();
		thisArr["ParcelAttribute.InspectionDistrict"] = fcapParcelObj[i].getInspectionDistrict();
		thisArr["ParcelAttribute.LandValue"] = fcapParcelObj[i].getLandValue();
		thisArr["ParcelAttribute.LegalDesc"] = fcapParcelObj[i].getLegalDesc();
		thisArr["ParcelAttribute.Lot"] = fcapParcelObj[i].getLot();
		thisArr["ParcelAttribute.MapNo"] = fcapParcelObj[i].getMapNo();
		thisArr["ParcelAttribute.MapRef"] = fcapParcelObj[i].getMapRef();
		thisArr["ParcelAttribute.ParcelStatus"] = fcapParcelObj[i].getParcelStatus();
		thisArr["ParcelAttribute.SupervisorDistrict"] = fcapParcelObj[i].getSupervisorDistrict();
		thisArr["ParcelAttribute.Tract"] = fcapParcelObj[i].getTract();
		thisArr["ParcelAttribute.PlanArea"] = fcapParcelObj[i].getPlanArea();
		}
	}

function loadTaskSpecific(thisArr)
	{
 	//
 	// Appends the Task Specific Info to App Specific Array
 	// If useTaskSpecificGroupName==true, appends wf process code.wftask. to TSI field label
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		var wfObj = workflowResult.getOutput();
 	else
 		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()) ; return false; }

 	for (i in wfObj)
 		{
 		var fTask = wfObj[i];
 		var stepnumber = fTask.getStepNumber();
 		var processID = fTask.getProcessID();
 		var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(itemCap, processID, stepnumber)
 		if (TSIResult.getSuccess())
 			{
 			var TSI = TSIResult.getOutput();
 			for (a1 in TSI)
  				{
  				if (useTaskSpecificGroupName)
  	  				thisArr[fTask.getProcessCode() + "." + fTask.getTaskDescription() + "." + TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
  	  			else
	  				thisArr[TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
				}
 			}
 		}
	}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;

	for (var count=1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
		{
		var countstr = "000000" + count;
		countstr = String(countstr).substring(countstr.length,countstr.length - maxLength);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			bizDomScriptObj = bizDomScriptResult.getOutput();
			var myObj= new pairObj(bizDomScriptObj.getBizdomainValue());
			myObj.load(bizDomScriptObj.getDescription());
			if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		else
			{
			break;
			}
		}
	return actArray;
	}

function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {
                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                    logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                    eval(token(doObj.act));
                    lastEvalTrue = true;
                }
                else {
                    if (doObj.elseact) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                        eval(token(doObj.elseact));
                    }
                    lastEvalTrue = false;
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
}

function docWrite(dstr,header,indent)
	{
	var istr = "";
	for (i = 0 ; i < indent ; i++)
		istr+="|  ";
	if (header && dstr)
		aa.print(istr + "------------------------------------------------");
	if (dstr) aa.print(istr + dstr);
	if (header)
		aa.print(istr + "------------------------------------------------");
	}


function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
  	}

function pairObj(actID)
	{
	this.ID = actID;
	this.cri = null;
	this.act = null;
	this.elseact = null;
	this.enabled = true;
	this.continuation = false;
	this.branch = new Array();

	this.load = function(loadStr) {
		//
		// load() : tokenizes and loades the criteria and action
		//
		loadArr = loadStr.split("\\^");
		if (loadArr.length < 2 || loadArr.length > 3)
			{
			logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (!enableVariableBranching && bb >= 0)
			  {
			  var cc = a.substring(bb);
			  var dd = cc.indexOf("\")");
			  this.branch.push(cc.substring(8,dd));
			  a = cc.substring(dd);
			  bb = a.indexOf("branch");
			  }

			}
		}
	}

function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}


function logDebug(dstr) {


    vLevel = 1
    if (arguments.length > 1)
        vLevel = arguments[1]

    if ((showDebug & vLevel) == vLevel || vLevel == 1)
        debug += dstr + br;

    if ((showDebug & vLevel) == vLevel)
        aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}

function logMessage(dstr)
	{
	message+=li + dstr + endli;
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/


function activateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}



function addAddressCondition(addNum, cType,cStatus,cDesc,cComment,cImpact)
//if addNum is null, condition is added to all addresses on CAP
	{
	if (!addNum)
		{
		var capAddResult = aa.address.getAddressByCapId(capId);
		if (capAddResult.getSuccess())
			{
			var Adds = capAddResult.getOutput();
			for (zz in Adds)
				{

				if (Adds[zz].getRefAddressId())
					{
					var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

						if (addAddCondResult.getSuccess())
							{
							logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
							}
						else
							{
							logDebug( "**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
							}
					}
				}
			}
		}
	else
		{
			var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


		        if (addAddCondResult.getSuccess())
		        	{
				logDebug("Succe) < 6)
					i++
				}
			}
		else
			{
			while (i < Math.abs(amt))
				{
				dDate = new Date(aa.calendar.getNextWorkDay(aa.date.parseDate(dDate.getMonth()+1 + "/" + dDate.getDate() + "/" + dDate.getFullYear())).getOutput().getTime());
				i++;
				}
			}
	else
		dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * amt));

	return (dDate.getMonth()+1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();
	}


function dateAddMonths(pDate, pMonths)
	{
	// Adds specified # of months (pMonths) to pDate and returns new date as string in format MM/DD/YYYY
	// If pDate is null, uses current date
	// pMonths can be positive (to add) or negative (to subtract) integer
	// If pDate is on the last day of the month, the new date will also be end of month.
	// If pDate is not the last day of the month, the new date will have the same day of month, unless such a day doesn't exist in the month, in which case the new date will be on the last day of the month
	//
	if (!pDate)
		baseDate = new Date();
	else
		baseDate = new Date(pDate);

	var day = baseDate.getDate();
	baseDate.setMonth(baseDate.getMonth() + pMonths);
	if (baseDate.getDate() < day)
		{
		baseDate.setDate(1);
		baseDate.setDate(baseDate.getDate() - 1);
		}
	return ((baseDate.getMonth() + 1) + "/" + baseDate.getDate() + "/" + baseDate.getFullYear());
	}


function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 9)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 9)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function dateNextOccur (pMonth, pDay, pDate)
	//optional 4th param pOddEven:
	//'ODD' specifies that return date must be next odd year, 'EVEN' means return date is next even year.
	//allows wfDate variable to be used as pDate parameter
	{
	var vDate = new String(pDate);
	if (vDate.length==10 && vDate.indexOf("-")==4 && vDate.indexOf("-",7)==7) //is format YYYY-MM-DD
		var vBaseDate = new Date(vDate.substr(5,2)+"/"+vDate.substr(8,2)+"/"+vDate.substr(0,4));
	else
		var vBaseDate = new Date(vDate);

	var vCurrentYr = vBaseDate.getFullYear().toString();
	var vTestDate = new Date(pMonth+"/"+pDay+"/"+vCurrentYr);
	var vUseOddEven = false;
	var vOddEven;
	var vReturnDate = vTestDate;
	if (arguments.length>3) //optional 4th parameter is used
		{
		var vOddEven = arguments[3].toUpperCase(); //return odd or even year
		vUseOddEven = true;
		}

	if (vTestDate > vBaseDate)
		vReturnDate = vTestDate;
	else
		{
		vTestDate.setFullYear(vTestDate.getFullYear()+1);
		vReturnDate = vTestDate;
		}

	if (vUseOddEven) // use next ODD or EVEN year
		{
		if (vOddEven=="ODD" && vReturnDate.getFullYear()%2==0) //vReturnDate is EVEN year
			vReturnDate.setFullYear(vReturnDate.getFullYear()+1);

		if (vOddEven=="EVEN" && vReturnDate.getFullYear()%2)    //vReturnDate is ODD year
			vReturnDate.setFullYear(vReturnDate.getFullYear()+1);
		}

	return (vReturnDate.getMonth()+1) + "/" + vReturnDate.getDate() + "/" + vReturnDate.getFullYear();
	}


function deactivateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			var completeFlag = fTask.getCompleteFlag();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "N", completeFlag, null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "N", completeFlag, null, null)

			logMessage("deactivating Workflow Task: " + wfstr);
			logDebug("deactivating Workflow Task: " + wfstr);
			}
		}
	}


function editAppName(newname)
	{
	// 4/30/08 - DQ - Corrected Error where option parameter was ignored
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	capResult = aa.cap.getCap(itemCap)

	if (!capResult.getSuccess())
		{logDebug("**WARNING: error getting cap : " + capResult.getErrorMessage()) ; return false }

	capModel = capResult.getOutput().getCapModel()

	capModel.setSpecialText(newname)

	setNameResult = aa.cap.editCapByPK(capModel)

	if (!setNameResult.getSuccess())
		{ logDebug("**WARNING: error setting cap name : " + setNameResult.getErrorMessage()) ; return false }


	return true;
	}


function editAppSpecific(itemName,itemValue)  // optional: itemCap
	{
	var updated = false;
	var i=0;
	itemCap = capId;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

  	if (useAppSpecificGroupName)
		{
		if (itemName.indexOf(".") < 0)
			{ logDebug("**WARNING: editAppSpecific requires group name prefix when useAppSpecificGroupName is true") ; return false }


		var itemGroup = itemName.substr(0,itemName.indexOf("."));
		var itemName = itemName.substr(itemName.indexOf(".")+1);
		}

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var appspecObj = appSpecInfoResult.getOutput();

		if (itemName != "")
			{
				while (i < appspecObj.length && !updated)
				{
					if (appspecObj[i].getCheckboxDesc() == itemName && (!useAppSpecificGroupName || appspecObj[i].getCheckboxType() == itemGroup))
					{
						appspecObj[i].setChecklistComment(itemValue);
						var actionResult = aa.appSpecificInfo.editAppSpecInfos(appspecObj);
						if (actionResult.getSuccess()) {
							logMessage("app spec info item " + itemName + " has been given a value of " + itemValue);
							logDebug("app spec info item " + itemName + " has been given a value of " + itemValue);
						} else {
							logDebug("**ERROR: Setting the app spec info item " + itemName + " to " + itemValue + " .\nReason is: " +   actionResult.getErrorType() + ":" + actionResult.getErrorMessage());
						}
						updated = true;
						AInfo[itemName] = itemValue;  // Update array used by this script
					}
					i++;
				} // while loop
			} // item name blank
		} // got app specific object
		else
		{ logDebug( "**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage()) }
	}


function editChannelReported(channel) // option CapId
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

	cd.setReportedChannel(channel);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("Updated channel reported to " + channel) }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}

function editContactType(existingType,newType)
//Function will change contact types from exsistingType to newType,
//optional paramter capID
{
	var updateCap = capId
	if (arguments.length==3)
		updateCap=arguments[2]

	capContactResult = aa.people.getCapContactByCapID(updateCap);
	if (capContactResult.getSuccess())
		{
		Contacts = capContactResult.getOutput()unt];
	inspResult = inspResultArr[inspCount];
	inspType = inspTypeArr[inspCount];
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspComment = inspObj.getInspection().getResultComment();
	inspGroup = inspObj.getInspection().getInspectionGroup();
	inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	inspInspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	logDebug("Inspection #" + inspCount);
	logDebug("inspId " + inspIdArr[inspCount]);
	logDebug("inspResult = " + inspResultArr[inspCount]);
	logDebug("inspResultComment = " + inspComment);
	logDebug("inspResultDate = " + inspResultDate);
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspType = " + inspType);
	logDebug("inspSchedDate = " + inspSchedDate);
	doStandardChoiceActions(controlString,true,0);
	}

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

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
		tempObject[tcol.getColumnName()] = tval;
		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	  eval(copyStr);  // move to table name
	  }

	}

function loadParcelAttributes(thisArr) {
	//
	// Returns an associative array of Parcel Attributes
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var fcapParcelObj = null;
	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
	if (capParcelResult.getSuccess())
		var fcapParcelObj = capParcelResult.getOutput().toArray();
	else
		logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())

	for (i in fcapParcelObj)
		{
		parcelArea += fcapParcelObj[i].getParcelArea()
		var parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
		for (z in parcelAttrObj)
			thisArr["ParcelAttribute." + parcelAttrObj[z].getB1AttributeName()]=parcelAttrObj[z].getB1AttributeValue();

		// Explicitly load some standard values
		thisArr["ParcelAttribute.Block"] = fcapParcelObj[i].getBlock();
		thisArr["ParcelAttribute.Book"] = fcapParcelObj[i].getBook();
		thisArr["ParcelAttribute.CensusTract"] = fcapParcelObj[i].getCensusTract();
		thisArr["ParcelAttribute.CouncilDistrict"] = fcapParcelObj[i].getCouncilDistrict();
		thisArr["ParcelAttribute.ExemptValue"] = fcapParcelObj[i].getExemptValue();
		thisArr["ParcelAttribute.ImprovedValue"] = fcapParcelObj[i].getImprovedValue();
		thisArr["ParcelAttribute.InspectionDistrict"] = fcapParcelObj[i].getInspectionDistrict();
		thisArr["ParcelAttribute.LandValue"] = fcapParcelObj[i].getLandValue();
		thisArr["ParcelAttribute.LegalDesc"] = fcapParcelObj[i].getLegalDesc();
		thisArr["ParcelAttribute.Lot"] = fcapParcelObj[i].getLot();
		thisArr["ParcelAttribute.MapNo"] = fcapParcelObj[i].getMapNo();
		thisArr["ParcelAttribute.MapRef"] = fcapParcelObj[i].getMapRef();
		thisArr["ParcelAttribute.ParcelStatus"] = fcapParcelObj[i].getParcelStatus();
		thisArr["ParcelAttribute.SupervisorDistrict"] = fcapParcelObj[i].getSupervisorDistrict();
		thisArr["ParcelAttribute.Tract"] = fcapParcelObj[i].getTract();
		thisArr["ParcelAttribute.PlanArea"] = fcapParcelObj[i].getPlanArea();
		}
	}

function loadTaskSpecific(thisArr)
	{
 	//
 	// Appends the Task Specific Info to App Specific Array
 	// If useTaskSpecificGroupName==true, appends wf process code.wftask. to TSI field label
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		var wfObj = workflowResult.getOutput();
 	else
 		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()) ; return false; }

 	for (i in wfObj)
 		{
 		var fTask = wfObj[i];
 		var stepnumber = fTask.getStepNumber();
 		var processID = fTask.getProcessID();
 		var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(itemCap, processID, stepnumber)
 		if (TSIResult.getSuccess())
 			{
 			var TSI = TSIResult.getOutput();
 			for (a1 in TSI)
  				{
  				if (useTaskSpecificGroupName)
  	  				thisArr[fTask.getProcessCode() + "." + fTask.getTaskDescription() + "." + TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
  	  			else
	  				thisArr[TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
				}
 			}
 		}
	}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;

	for (var count=1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
		{
		var countstr = "000000" + count;
		countstr = String(countstr).substring(countstr.length,countstr.length - maxLength);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			bizDomScriptObj = bizDomScriptResult.getOutput();
			var myObj= new pairObj(bizDomScriptObj.getBizdomainValue());
			myObj.load(bizDomScriptObj.getDescription());
			if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		else
			{
			break;
			}
		}
	return actArray;
	}

function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {
                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                    logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                    eval(token(doObj.act));
                    lastEvalTrue = true;
                }
                else {
                    if (doObj.elseact) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                        eval(token(doObj.elseact));
                    }
                    lastEvalTrue = false;
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
}

function docWrite(dstr,header,indent)
	{
	var istr = "";
	for (i = 0 ; i < indent ; i++)
		istr+="|  ";
	if (header && dstr)
		aa.print(istr + "------------------------------------------------");
	if (dstr) aa.print(istr + dstr);
	if (header)
		aa.print(istr + "------------------------------------------------");
	}


function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
  	}

function pairObj(actID)
	{
	this.ID = actID;
	this.cri = null;
	this.act = null;
	this.elseact = null;
	this.enabled = true;
	this.continuation = false;
	this.branch = new Array();

	this.load = function(loadStr) {
		//
		// load() : tokenizes and loades the criteria and action
		//
		loadArr = loadStr.split("\\^");
		if (loadArr.length < 2 || loadArr.length > 3)
			{
			logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (!enableVariableBranching && bb >= 0)
			  {
			  var cc = a.substring(bb);
			  var dd = cc.indexOf("\")");
			  this.branch.push(cc.substring(8,dd));
			  a = cc.substring(dd);
			  bb = a.indexOf("branch");
			  }

			}
		}
	}

function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}


function logDebug(dstr) {


    vLevel = 1
    if (arguments.length > 1)
        vLevel = arguments[1]

    if ((showDebug & vLevel) == vLevel || vLevel == 1)
        debug += dstr + br;

    if ((showDebug & vLevel) == vLevel)
        aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}

function logMessage(dstr)
	{
	message+=li + dstr + endli;
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/


function activateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}



function addAddressCondition(addNum, cType,cStatus,cDesc,cComment,cImpact)
//if addNum is null, condition is added to all addresses on CAP
	{
	if (!addNum)
		{
		var capAddResult = aa.address.getAddressByCapId(capId);
		if (capAddResult.getSuccess())
			{
			var Adds = capAddResult.getOutput();
			for (zz in Adds)
				{

				if (Adds[zz].getRefAddressId())
					{
					var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

						if (addAddCondResult.getSuccess())
							{
							logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
							}
						else
							{
							logDebug( "**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
							}
					}
				}
			}
		}
	else
		{
			var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


		        if (addAddCondResult.getSuccess())
		        	{
				logDebug("Succerycode"] = capContactArray[yy].getCapContactModel().getPeople().getPhone2CountryCode();
			aArray["email"] = capContactArray[yy].getPeople().email;
			aArray["addressLine1"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine1();
			aArray["addressLine2"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine2();
			aArray["city"] = capContactArray[yy].getPeople().getCompactAddress().getCity();
			aArray["state"] = capContactArray[yy].getPeople().getCompactAddress().getState();
			aArray["zip"] = capContactArray[yy].getPeople().getCompactAddress().getZip();
			aArray["fax"] = capContactArray[yy].getPeople().fax;
			aArray["notes"] = capContactArray[yy].getPeople().notes;
			aArray["country"] = capContactArray[yy].getPeople().getCompactAddress().getCountry();
			aArray["fullName"] = capContactArray[yy].getPeople().fullName;


			var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
	                for (xx1 in pa)
                   		aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
			cArray.push(aArray);
			}
		}
	return cArray;
	}


function getCSLBInfo(doPop,doWarning)   // doPop = true populate the cap lic prof with this data
					// doWarning = true, message if license is expired.
	{
	// Requires getNode and getProp functions.
	//
	// Get the first lic prof from the app
	//
	var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
	if (capLicenseResult.getSuccess())
		{ var capLicenseArr = capLicenseResult.getOutput();  }
	else
		{ logDebug("**ERROR: getting lic prof: " + capLicenseResult.getErrorMessage()); return false; }

	if (capLicenseArr == null || !capLicenseArr.length)
		{ logDebug("**WARNING: no licensed professionals on this CAP"); return false; }

	var licProfScriptModel = capLicenseArr[0];
	var rlpId = licProfScriptModel.getLicenseNbr();

	//
	// Now make the call to the California State License Board
	//

	var getout = aa.util.httpPost("https://aa.achievo.com/License+Detail.asp?LicNum=" + rlpId,"");
	if (getout.getSuccess())
	  var lpXML = getout.getOutput();
	else
	   { logDebug("**ERROR: communicating with CSLB: " + getout.getErrorMessage()); return false; }

	// Check to see if error message in the XML:

	if (lpXML.indexOf("<Error>") > 0 )
		{
		logDebug("**ERROR: CSLB information returned an error: " + getNode(getNode(lpXML,"License"),"**ERROR"))
		return false;
		}

	var lpBiz = getNode(lpXML,"BusinessInfo");
	var lpStatus = getNode(lpXML,"PrimaryStatus");
	var lpClass = getNode(lpXML,"Classifications");
	var lpBonds = getNode(lpXML,"ContractorBond");
	var lpWC = getNode(lpXML,"WorkersComp");

	if (doWarning)
		{
		var expDate = new Date(getNode(lpBiz,"ExpireDt"));
		if (expDate < startDate)
			{
			showMessage = true ;
			comment("**WARNING: Professional License expired on " + expDate.toString());
			}
		}

	if (doPop)
		{
		licProfScriptModel.setAddress1(getNode(lpBiz,"Addr1").replace(/\+/g," "));
		licProfScriptModel.setAddress2(getNode(lpBiz,"Addr2").replace(/\+/g," "));
		licProfScriptModel.setBusinessName(getNode(lpBiz,"Name").replace(/\+/g," "));
		licProfScriptModel.setCity(getNode(lpBiz,"City").replace(/\+/g," "));
		licProfScriptModel.setLicenseExpirDate(aa.date.parseDate(getNode(lpBiz,"ExpireDt")))
		licProfScriptModel.setLicesnseOrigIssueDate(aa.date.parseDate(getNode(lpBiz,"IssueDt")))
		licProfScriptModel.setState(getNode(lpBiz,"State").replace(/\+/g," "))
		licProfScriptModel.setPhone1(getNode(lpBiz,"BusinessPhoneNum"))
		licProfScriptModel.setState(getNode(lpBiz,"State").replace(/\+/g," "))
		licProfScriptModel.setZip(getNode(lpBiz,"Zip"))
		aa.m_licenseProfessional.editLicensedProfessional(licProfScriptModel);
		}
	}


function getDepartmentName(username)
	{
	var suo = aa.person.getUser(username).getOutput();
	var dpt = aa.people.getDepartmentList(null).getOutput();
	for (var thisdpt in dpt)
	  	{
	  	var m = dpt[thisdpt]
	  	var  n = m.getServiceProviderCode() + "/" + m.getAgencyCode() + "/" + m.getBureauCode() + "/" + m.getDivisionCode() + "/" + m.getSectionCode() + "/" + m.getGroupCode() + "/" + m.getOfficeCode()

	  	if (n.equals(suo.deptOfUser))
	  	return(m.getDeptName())
  		}
  	}


function getGISBufferInfo(svc,layer,numDistance)
	{
	// returns an array of associative arrays
	// each additional parameter will return another value in the array
	//x = getGISBufferInfo("flagstaff","Parcels","50","PARCEL_ID1","MAP","BOOK","PARCEL","LOT_AREA");
	//
	//for (x1 in x)
	//   {
	//   aa.print("Object " + x1)
	//   for (x2 in x[x1])
	//      aa.print("  " + x2 + " = " + x[x1][x2])
	//   }

	var distanceType = "feet";
	var retArray = new Array();

	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		for (argnum = 3; argnum < arguments.length ; argnum++)
			buf.addAttributeName(arguments[argnum]);
		}
	else
		{ aa.print("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ aa.print("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ aa.print("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			for (z1 in proxObj)
				{
				var n = proxObj[z1].getAttributeNames();
				var v = proxObj[z1].getAttributeValues();

				var valArray = new Array();

				//
				// 09/18/08 JHS Explicitly adding the key field of the object, since getBufferByRadius will not pull down the key field
				// hardcoded this to GIS_ID
				//

				valArray["GIS_ID"] = proxObj[z1].getGisId()
				for (n1 in n)
					{
					valArray[n[n1]] = v[n1];
					}
				retArray.push(valArray);
				}

			}
		}
	return retArray
	}


function getGISInfo(svc,layer,attributename)
	{
	// use buffer info to get info on the current object by using distance 0
	// usage:
	//
	// x = getGISInfo("flagstaff","Parcels","LOT_AREA");
	//

	var distanceType = "feet";
	var retString;

	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		buf.addAttributeName(attributename);
		}
	else
		{ logDebug("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "0", distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			for (z1 in proxObj)
				{
				var v = proxObj[z1].getAttributeValues()
				retString = v[0];
				}

			}
	unt];
	inspResult = inspResultArr[inspCount];
	inspType = inspTypeArr[inspCount];
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspComment = inspObj.getInspection().getResultComment();
	inspGroup = inspObj.getInspection().getInspectionGroup();
	inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	inspInspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	logDebug("Inspection #" + inspCount);
	logDebug("inspId " + inspIdArr[inspCount]);
	logDebug("inspResult = " + inspResultArr[inspCount]);
	logDebug("inspResultComment = " + inspComment);
	logDebug("inspResultDate = " + inspResultDate);
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspType = " + inspType);
	logDebug("inspSchedDate = " + inspSchedDate);
	doStandardChoiceActions(controlString,true,0);
	}

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

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
		tempObject[tcol.getColumnName()] = tval;
		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	  eval(copyStr);  // move to table name
	  }

	}

function loadParcelAttributes(thisArr) {
	//
	// Returns an associative array of Parcel Attributes
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var fcapParcelObj = null;
	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
	if (capParcelResult.getSuccess())
		var fcapParcelObj = capParcelResult.getOutput().toArray();
	else
		logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())

	for (i in fcapParcelObj)
		{
		parcelArea += fcapParcelObj[i].getParcelArea()
		var parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
		for (z in parcelAttrObj)
			thisArr["ParcelAttribute." + parcelAttrObj[z].getB1AttributeName()]=parcelAttrObj[z].getB1AttributeValue();

		// Explicitly load some standard values
		thisArr["ParcelAttribute.Block"] = fcapParcelObj[i].getBlock();
		thisArr["ParcelAttribute.Book"] = fcapParcelObj[i].getBook();
		thisArr["ParcelAttribute.CensusTract"] = fcapParcelObj[i].getCensusTract();
		thisArr["ParcelAttribute.CouncilDistrict"] = fcapParcelObj[i].getCouncilDistrict();
		thisArr["ParcelAttribute.ExemptValue"] = fcapParcelObj[i].getExemptValue();
		thisArr["ParcelAttribute.ImprovedValue"] = fcapParcelObj[i].getImprovedValue();
		thisArr["ParcelAttribute.InspectionDistrict"] = fcapParcelObj[i].getInspectionDistrict();
		thisArr["ParcelAttribute.LandValue"] = fcapParcelObj[i].getLandValue();
		thisArr["ParcelAttribute.LegalDesc"] = fcapParcelObj[i].getLegalDesc();
		thisArr["ParcelAttribute.Lot"] = fcapParcelObj[i].getLot();
		thisArr["ParcelAttribute.MapNo"] = fcapParcelObj[i].getMapNo();
		thisArr["ParcelAttribute.MapRef"] = fcapParcelObj[i].getMapRef();
		thisArr["ParcelAttribute.ParcelStatus"] = fcapParcelObj[i].getParcelStatus();
		thisArr["ParcelAttribute.SupervisorDistrict"] = fcapParcelObj[i].getSupervisorDistrict();
		thisArr["ParcelAttribute.Tract"] = fcapParcelObj[i].getTract();
		thisArr["ParcelAttribute.PlanArea"] = fcapParcelObj[i].getPlanArea();
		}
	}

function loadTaskSpecific(thisArr)
	{
 	//
 	// Appends the Task Specific Info to App Specific Array
 	// If useTaskSpecificGroupName==true, appends wf process code.wftask. to TSI field label
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		var wfObj = workflowResult.getOutput();
 	else
 		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()) ; return false; }

 	for (i in wfObj)
 		{
 		var fTask = wfObj[i];
 		var stepnumber = fTask.getStepNumber();
 		var processID = fTask.getProcessID();
 		var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(itemCap, processID, stepnumber)
 		if (TSIResult.getSuccess())
 			{
 			var TSI = TSIResult.getOutput();
 			for (a1 in TSI)
  				{
  				if (useTaskSpecificGroupName)
  	  				thisArr[fTask.getProcessCode() + "." + fTask.getTaskDescription() + "." + TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
  	  			else
	  				thisArr[TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
				}
 			}
 		}
	}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;

	for (var count=1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
		{
		var countstr = "000000" + count;
		countstr = String(countstr).substring(countstr.length,countstr.length - maxLength);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			bizDomScriptObj = bizDomScriptResult.getOutput();
			var myObj= new pairObj(bizDomScriptObj.getBizdomainValue());
			myObj.load(bizDomScriptObj.getDescription());
			if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		else
			{
			break;
			}
		}
	return actArray;
	}

function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {
                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                    logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                    eval(token(doObj.act));
                    lastEvalTrue = true;
                }
                else {
                    if (doObj.elseact) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                        eval(token(doObj.elseact));
                    }
                    lastEvalTrue = false;
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
}

function docWrite(dstr,header,indent)
	{
	var istr = "";
	for (i = 0 ; i < indent ; i++)
		istr+="|  ";
	if (header && dstr)
		aa.print(istr + "------------------------------------------------");
	if (dstr) aa.print(istr + dstr);
	if (header)
		aa.print(istr + "------------------------------------------------");
	}


function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
  	}

function pairObj(actID)
	{
	this.ID = actID;
	this.cri = null;
	this.act = null;
	this.elseact = null;
	this.enabled = true;
	this.continuation = false;
	this.branch = new Array();

	this.load = function(loadStr) {
		//
		// load() : tokenizes and loades the criteria and action
		//
		loadArr = loadStr.split("\\^");
		if (loadArr.length < 2 || loadArr.length > 3)
			{
			logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (!enableVariableBranching && bb >= 0)
			  {
			  var cc = a.substring(bb);
			  var dd = cc.indexOf("\")");
			  this.branch.push(cc.substring(8,dd));
			  a = cc.substring(dd);
			  bb = a.indexOf("branch");
			  }

			}
		}
	}

function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}


function logDebug(dstr) {


    vLevel = 1
    if (arguments.length > 1)
        vLevel = arguments[1]

    if ((showDebug & vLevel) == vLevel || vLevel == 1)
        debug += dstr + br;

    if ((showDebug & vLevel) == vLevel)
        aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}

function logMessage(dstr)
	{
	message+=li + dstr + endli;
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/


function activateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}



function addAddressCondition(addNum, cType,cStatus,cDesc,cComment,cImpact)
//if addNum is null, condition is added to all addresses on CAP
	{
	if (!addNum)
		{
		var capAddResult = aa.address.getAddressByCapId(capId);
		if (capAddResult.getSuccess())
			{
			var Adds = capAddResult.getOutput();
			for (zz in Adds)
				{

				if (Adds[zz].getRefAddressId())
					{
					var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

						if (addAddCondResult.getSuccess())
							{
							logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
							}
						else
							{
							logDebug( "**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
							}
					}
				}
			}
		}
	else
		{
			var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


		        if (addAddCondResult.getSuccess())
		        	{
				logDebug("SucceLicenseIssueDate(expAADate);
			aa.licenseScript.editRefLicenseProf(this.refProf);
			logDebug("Updated reference license issued to " + expDate); }

		}
	this.setLastRenewal = function(expDate)
		// Update expiration date
		{
		var expAADate = aa.date.parseDate(expDate)

		if (this.refProf) {
			this.refProf.setLicenseLastRenewalDate(expAADate);
			aa.licenseScript.editRefLicenseProf(this.refProf);
			logDebug("Updated reference license issued to " + expDate); }
		}

	this.setStatus = function(licStat)
		// Update expiration status
		{
		if (this.b1Exp)  {
			this.b1Exp.setExpStatus(licStat);
			aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
			logDebug("Updated renewal to status " + licStat); }
		}

	this.getStatus = function()
		// Get Expiration Status
		{
		if (this.b1Exp) {
			return this.b1Exp.getExpStatus();
			}
		}

	this.getCode = function()
		// Get Expiration Status
		{
		if (this.b1Exp) {
			return this.b1Exp.getExpCode();
			}
		}
	}


function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}


function loadASITable(tname) {

 	//
 	// Returns a single ASI Table array of arrays
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

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
          var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
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
		//tempObject[tcol.getColumnName()] = tval;
                /********************Build Array<FieldInfo> start********************/
		//get this field readonly value
		var readOnly = 'N';
		if (readOnlyi.hasNext()) {
			readOnly = readOnlyi.next();
		}
		//set data to FieldInfo Object
		var fieldInfo = new FieldInfo(tcol.getColumnName(), tval, readOnly);
		tempObject[tcol.getColumnName()] = fieldInfo;
		/********************Build Array<FieldInfo> end********************/

		}
	  tempArray.push(tempObject);  // end of record
	  }
	  return tempArray;
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  if (tsm.rowIndex.isEmpty()) continue;  // empty table

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

	  if (!isNaN(tn.substring(0,1))) tn = "TBL" + tn  // prepend with TBL if it starts with a number

  	  var tsmfldi = tsm.getTableField().iterator();
	  var tsmcoli = tsm.getColumns().iterator();

	  var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator();

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
		//tempObject[tcol.getColumnName()] = tval;
                /********************Build Array<FieldInfo> start********************/
		//get this field readonly value
		var readOnly = 'N';
		if (readOnlyi.hasNext()) {
			readOnly = readOnlyi.next();
		}
		//set data to FieldInfo Object
		var fieldInfo = new FieldInfo(tcol.getColumnName(), tval, readOnly);
		tempObject[tcol.getColumnName()] = fieldInfo;
		/********************Build Array<FieldInfo> end********************/

		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  aa.print("ASI Table Array : " + tn + " (" + numrows + " Rows)");
          eval(copyStr);  // move to table name

	  }

	}



function loadFees()  // option CapId
	{
	//  load the fees into an array of objects.  Does not
	var itemCap = capId
	if (arguments.length > 0)
		{
		ltcapidstr = arguments[0]; // use cap ID specified in args
		if (typeof(ltcapidstr) == "string")
                {
				var ltresult = aa.cap.getCapID(ltcapidstr);
	 			if (ltresult.getSuccess())
  				 	itemCap = ltresult.getOutput();
	  			else
  				  	{ logMessage("**ERROR: Failed to get cap ID: " + ltcapidstr + " error: " +  ltresult.getErrorMessage()); return false; }
                }
		else
			itemCap = ltcapidstr;
		}

  	var feeArr = new Array();

	var feeResult=aa.fee.getFeeItems(itemCap);
		if (feeResult.getSuccess())
			{ var feeObjArr = feeResult.getOutput(); }
		else
			{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

		for (ff in feeObjArr)
			{
			fFee = feeObjArr[ff];
			var myFee = new Fee();
			var amtPaid = 0;

			var pfResult = aa.finance.getPaymentFeeItems(itemCap, null);
			if (pfResult.getSuccess())
				{
				var pfObj = pfResult.getOutput();
				for (ij in pfObj)
					if (fFee.getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
						amtPaid+=pfObj[ij].getFeeAllocation()
				}

			myFee.sequence = fFee.getFeeSeqNbr();
			myFee.code =  fFee.getFeeCod();
			myFee.description = fFee.getFeeDescription();
			myFee.unit = fFee.getFeeUnit();
			myFee.amount = fFee.getFee();
			myFee.amountPaid = amtPaid;
			if (fFee.getApplyDate()) myFee.applyDate = convertDate(fFee.getApplyDate());
			if (fFee.getEffectDate()) myFee.effectDate = convertDate(fFee.getEffectDate());
			if (fFee.getExpireDate()) myFee.expireDate = convertDate(fFee.getExpireDate());
			myFee.status = fFee.getFeeitemStatus();
			myFee.period = fFee.getPaymentPeriod();
			myFee.display = fFee.getDisplay();
			myFee.accCodeL1 = fFee.getAccCodeL1();
			myFee.accCodeL2 = fFee.getAccCodeL2();
			myFee.accCodeL3 = fFee.getAccCodeL3();
			myFee.formula = fFee.getFormula();
			myFee.udes = fFee.getUdes();
			myFee.UDF1 = fFee.getUdf1();
			myFee.UDF2 = fFee.getUdf2();
			myFee.UDF3 = fFee.getUdf3();
			myFee.UDF4 = fFee.getUdf4();
			myFee.subGroup = fFee.getSubGroup();
			myFee.calcFlag = fFee.getCalcFlag();;
			myFee.calcProc = fFee.getFeeCalcProc();

			feeArr.push(myFee)
			}

		return feeArr;
		}


////////////unt];
	inspResult = inspResultArr[inspCount];
	inspType = inspTypeArr[inspCount];
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspComment = inspObj.getInspection().getResultComment();
	inspGroup = inspObj.getInspection().getInspectionGroup();
	inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	inspInspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	logDebug("Inspection #" + inspCount);
	logDebug("inspId " + inspIdArr[inspCount]);
	logDebug("inspResult = " + inspResultArr[inspCount]);
	logDebug("inspResultComment = " + inspComment);
	logDebug("inspResultDate = " + inspResultDate);
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspType = " + inspType);
	logDebug("inspSchedDate = " + inspSchedDate);
	doStandardChoiceActions(controlString,true,0);
	}

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

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
		tempObject[tcol.getColumnName()] = tval;
		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	  eval(copyStr);  // move to table name
	  }

	}

function loadParcelAttributes(thisArr) {
	//
	// Returns an associative array of Parcel Attributes
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var fcapParcelObj = null;
	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
	if (capParcelResult.getSuccess())
		var fcapParcelObj = capParcelResult.getOutput().toArray();
	else
		logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())

	for (i in fcapParcelObj)
		{
		parcelArea += fcapParcelObj[i].getParcelArea()
		var parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
		for (z in parcelAttrObj)
			thisArr["ParcelAttribute." + parcelAttrObj[z].getB1AttributeName()]=parcelAttrObj[z].getB1AttributeValue();

		// Explicitly load some standard values
		thisArr["ParcelAttribute.Block"] = fcapParcelObj[i].getBlock();
		thisArr["ParcelAttribute.Book"] = fcapParcelObj[i].getBook();
		thisArr["ParcelAttribute.CensusTract"] = fcapParcelObj[i].getCensusTract();
		thisArr["ParcelAttribute.CouncilDistrict"] = fcapParcelObj[i].getCouncilDistrict();
		thisArr["ParcelAttribute.ExemptValue"] = fcapParcelObj[i].getExemptValue();
		thisArr["ParcelAttribute.ImprovedValue"] = fcapParcelObj[i].getImprovedValue();
		thisArr["ParcelAttribute.InspectionDistrict"] = fcapParcelObj[i].getInspectionDistrict();
		thisArr["ParcelAttribute.LandValue"] = fcapParcelObj[i].getLandValue();
		thisArr["ParcelAttribute.LegalDesc"] = fcapParcelObj[i].getLegalDesc();
		thisArr["ParcelAttribute.Lot"] = fcapParcelObj[i].getLot();
		thisArr["ParcelAttribute.MapNo"] = fcapParcelObj[i].getMapNo();
		thisArr["ParcelAttribute.MapRef"] = fcapParcelObj[i].getMapRef();
		thisArr["ParcelAttribute.ParcelStatus"] = fcapParcelObj[i].getParcelStatus();
		thisArr["ParcelAttribute.SupervisorDistrict"] = fcapParcelObj[i].getSupervisorDistrict();
		thisArr["ParcelAttribute.Tract"] = fcapParcelObj[i].getTract();
		thisArr["ParcelAttribute.PlanArea"] = fcapParcelObj[i].getPlanArea();
		}
	}

function loadTaskSpecific(thisArr)
	{
 	//
 	// Appends the Task Specific Info to App Specific Array
 	// If useTaskSpecificGroupName==true, appends wf process code.wftask. to TSI field label
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		var wfObj = workflowResult.getOutput();
 	else
 		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()) ; return false; }

 	for (i in wfObj)
 		{
 		var fTask = wfObj[i];
 		var stepnumber = fTask.getStepNumber();
 		var processID = fTask.getProcessID();
 		var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(itemCap, processID, stepnumber)
 		if (TSIResult.getSuccess())
 			{
 			var TSI = TSIResult.getOutput();
 			for (a1 in TSI)
  				{
  				if (useTaskSpecificGroupName)
  	  				thisArr[fTask.getProcessCode() + "." + fTask.getTaskDescription() + "." + TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
  	  			else
	  				thisArr[TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
				}
 			}
 		}
	}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;

	for (var count=1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
		{
		var countstr = "000000" + count;
		countstr = String(countstr).substring(countstr.length,countstr.length - maxLength);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			bizDomScriptObj = bizDomScriptResult.getOutput();
			var myObj= new pairObj(bizDomScriptObj.getBizdomainValue());
			myObj.load(bizDomScriptObj.getDescription());
			if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		else
			{
			break;
			}
		}
	return actArray;
	}

function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {
                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                    logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                    eval(token(doObj.act));
                    lastEvalTrue = true;
                }
                else {
                    if (doObj.elseact) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                        eval(token(doObj.elseact));
                    }
                    lastEvalTrue = false;
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
}

function docWrite(dstr,header,indent)
	{
	var istr = "";
	for (i = 0 ; i < indent ; i++)
		istr+="|  ";
	if (header && dstr)
		aa.print(istr + "------------------------------------------------");
	if (dstr) aa.print(istr + dstr);
	if (header)
		aa.print(istr + "------------------------------------------------");
	}


function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
  	}

function pairObj(actID)
	{
	this.ID = actID;
	this.cri = null;
	this.act = null;
	this.elseact = null;
	this.enabled = true;
	this.continuation = false;
	this.branch = new Array();

	this.load = function(loadStr) {
		//
		// load() : tokenizes and loades the criteria and action
		//
		loadArr = loadStr.split("\\^");
		if (loadArr.length < 2 || loadArr.length > 3)
			{
			logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (!enableVariableBranching && bb >= 0)
			  {
			  var cc = a.substring(bb);
			  var dd = cc.indexOf("\")");
			  this.branch.push(cc.substring(8,dd));
			  a = cc.substring(dd);
			  bb = a.indexOf("branch");
			  }

			}
		}
	}

function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}


function logDebug(dstr) {


    vLevel = 1
    if (arguments.length > 1)
        vLevel = arguments[1]

    if ((showDebug & vLevel) == vLevel || vLevel == 1)
        debug += dstr + br;

    if ((showDebug & vLevel) == vLevel)
        aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}

function logMessage(dstr)
	{
	message+=li + dstr + endli;
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/


function activateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}



function addAddressCondition(addNum, cType,cStatus,cDesc,cComment,cImpact)
//if addNum is null, condition is added to all addresses on CAP
	{
	if (!addNum)
		{
		var capAddResult = aa.address.getAddressByCapId(capId);
		if (capAddResult.getSuccess())
			{
			var Adds = capAddResult.getOutput();
			for (zz in Adds)
				{

				if (Adds[zz].getRefAddressId())
					{
					var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

						if (addAddCondResult.getSuccess())
							{
							logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
							}
						else
							{
							logDebug( "**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
							}
					}
				}
			}
		}
	else
		{
			var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


		        if (addAddCondResult.getSuccess())
		        	{
				logDebug("Succe		if (rmParcelCondResult.getSuccess())
							logDebug("Successfully removed condition to Parcel " + parcelNum + "  (" + cType + ") " + cDesc);
						}
					else
						logDebug( "**ERROR: removing condition to Parcel " + parcelNum + "  (" + cType + "): " + addParcelCondResult.getErrorMessage());
					}
				}
			}
		}
	else
		{
		var pcResult = aa.parcelCondition.getParcelConditions(parcelNum);
		if (!pcResult.getSuccess())
			{ logDebug("**WARNING: error getting parcel conditions : " + pcResult.getErrorMessage()) ; return false }
		var pcs = pcResult.getOutput();
		for (pc1 in pcs)
			{
			if (pcs[pc1].getConditionType().equals(cType) && pcs[pc1].getConditionDescription().equals(cDesc))
				{
				var rmParcelCondResult = aa.parcelCondition.removeParcelCondition(pcs[pc1].getConditionNumber(),parcelNum);
			        if (rmParcelCondResult.getSuccess())
					logDebug("Successfully removed condition to Parcel " + parcelNum + "  (" + cType + ") " + cDesc);
				}
			else
				logDebug( "**ERROR: removing condition to Parcel " + parcelNum + "  (" + cType + "): " + addParcelCondResult.getErrorMessage());
			}
		}
	}




function replaceNode(fString,fName,fContents)
	{
	 var fValue = "";
	var startTag = "<"+fName+">";
	 var endTag = "</"+fName+">";

		 startPos = fString.indexOf(startTag) + startTag.length;
		 endPos = fString.indexOf(endTag);
		 // make sure startPos and endPos are valid before using them
		 if (startPos > 0 && startPos <= endPos)
		 		{
				  fValue = fString.substring(0,startPos) + fContents + fString.substring(endPos);
 					return unescape(fValue);
			}

	}


function resultInspection(inspType,inspStatus,resultDate,resultComment)  //optional capId
	{
	var itemCap = capId
	if (arguments.length > 4) itemCap = arguments[4]; // use cap ID specified in args

	var foundID;
	var inspResultObj = aa.inspection.getInspections(itemCap);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(inspType).equals(inspList[xx].getInspectionType()) && inspList[xx].getInspectionStatus().toUpperCase().equals("SCHEDULED"))
				foundID = inspList[xx].getIdNumber();
		}

	if (foundID)
		{
		resultResult = aa.inspection.resultInspection(itemCap, foundID, inspStatus, resultDate, resultComment, currentUserID)

		if (resultResult.getSuccess())
			logDebug("Successfully resulted inspection: " + inspType + " to Status: " + inspStatus)
		else
			logDebug("**WARNING could not result inspection : " + inspType + ", " + resultResult.getErrorMessage())
		}
	else
			logDebug("Could not result inspection : " + inspType + ", not scheduled")

	}


function scheduleInspectDate(iType,DateToSched) // optional inspector ID.
// DQ - Added Optional 4th parameter inspTime Valid format is HH12:MIAM or AM (SR5110)
// DQ - Added Optional 5th parameter inspComm
	{
	var inspectorObj = null;
	var inspTime = null;
	var inspComm = "E? ??? ???I C?E?E?O E??C??C";
	if (arguments.length >= 3)
		if (arguments[2] != null)
		{
		var inspRes = aa.person.getUser(arguments[2])
		if (inspRes.getSuccess())
			inspectorObj = inspRes.getOutput();
		}

        if (arguments.length >= 4)
            if(arguments[3] != null)
		        inspTime = arguments[3];

		if (arguments.length >= 5)
		    if(arguments[4] != null)
		        inspComm = arguments[4];

	var schedRes = aa.inspection.scheduleInspection(capId, inspectorObj, aa.date.parseDate(DateToSched), inspTime, iType, inspComm)

	if (schedRes.getSuccess())
		logDebug("Successfully scheduled inspection : " + iType + " for " + DateToSched);
	else
		logDebug( "**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
	}


function scheduleInspection(iType,DaysAhead) // optional inspector ID.  This function requires dateAdd function
	{
	// DQ - Added Optional 4th parameter inspTime Valid format is HH12:MIAM or AM (SR5110)
	// DQ - Added Optional 5th parameter inspComm ex. to call without specifying other options params scheduleInspection("Type",5,null,null,"Schedule Comment");
	var inspectorObj = null;
	var inspTime = null;
	var inspComm = "E? ??? ???I C?E?E?O E??C??C";
	if (arguments.length >= 3)
		if (arguments[2] != null)
		{
		var inspRes = aa.person.getUser(arguments[2])
		if (inspRes.getSuccess())
			var inspectorObj = inspRes.getOutput();
		}

	if (arguments.length >= 4)
	    if (arguments[3] != null)
		    inspTime = arguments[3];

	if (arguments.length == 5)
	    if (arguments[4] != null)
	        inspComm = arguments[4];

	var schedRes = aa.inspection.scheduleInspection(capId, inspectorObj, aa.date.parseDate(dateAdd(null,DaysAhead)), inspTime, iType, inspComm)

	if (schedRes.getSuccess())
		logDebug("Successfully scheduled inspection : " + iType + " for " + dateAdd(null,DaysAhead));
	else
		logDebug( "**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
	}



function searchProject(pProjType,pSearchType)
{
	// Searches Related Caps
	// pProjType = Application type marking highest point to search.  Ex. Building/Project/NA/NA
	// pSearchType = Application type to search for. Ex. Building/Permit/NA/NA
	// Returns CapID array of all unique matching SearchTypes

    var i = 1;
	var typeArray;
	var duplicate = false;
	var childArray = new Array();
	var tempArray = new Array();
	var temp2Array = new Array();
	var searchArray = new Array();
	var childrenFound = false;
	var isMatch;
        while (true)
        {
	 if (!(aa.cap.getProjectParents(capId,i).getSuccess()))
             break;
         i += 1;
        }
        i -= 1;

	getCapResult = aa.cap.getProjectParents(capId,i);
        myArray = new Array();
	myOutArray = new Array();

	if(pProjType != null)
	{
		var typeArray = pProjType.split("/");
		if (typeArray.length != 4)
			logDebug("**ERROR in childGetByCapType function parameter.  The following cap type parameter is incorrectly formatted: " + pCapType);
	}

	if (getCapResult.getSuccess())
	{
		parentArray = getCapResult.getOutput();
		if (parentArray.length)
		{
			for(x in parentArray)
				childTypeArray = parentArray[x].getCapType().toString().split("/");
				isMatch = true;
				for (yy in childTypeArray) //looking for matching cap type
				{
				if (!typeArray[yy].equals(childTypeArray[yy]) && !typeArray[yy].equals("*"))
					{
						isMatch = false;
						break;
					}
				}
				if(isMatch)
					myArray.push(parentArray[x].getCapID());
		}
	}

	if (!myArray.length)
		return childArray;

	searchArray = myArray;
	var temp = ""


	if(pSearchType != null)
	{
		typeArray = pSearchType.split("/");
		if (typeArray.length != 4)
			logDebug("**ERROR in childGetByCapType function parameter.  The following cap type parameter is incorrectly formatted: " + pSearchType);
	}


	while (true)
		{
			for(x in searchArray)
				{
					tempArray = getChildren("*/*/*/*",searchArray[x]);
					if (tempArray == null)
						continue;
					for(y in tempArray)
						{
							duplicate = false;
							for(z in childArray)
							{
								if ( childArray[z].getCustomID().equals(tempArray[y].getCustomID()) )
									{duplicate = true; break;}
							}
							if (!duplicate)
							{
								temp2Array.push(tempArray[y]);
								if(!capId.getCustomID().equals(tempArray[y].getCustomID()))
								{
									var chkTypeArray = aa.cap.getCap(tempArray[y]).getOutput().getCapType().toString().split("/");
									isMatch = true;
									for (p in chkTypeArray) //looking for matching cap type
									{
										if (typeArray[p] != chkTypeArray[p] && typeArray[p] != "*")
										{
											isMatch = false;
											break;
										}
									}
									if(isMatch)
										{childArray.push(tempArray[y]);}
								}
							}
						}

				}

			if(temp2Array.length)
				searchArray = temp2Array;
			else
				break;
			temp2Array = new Array();
		}
	return childArray;
}


function setIVR(ivrnum)
	{
	capModel = cap.getCapModel();
	capIDModel = capModel.getCapID();
	capunt];
	inspResult = inspResultArr[inspCount];
	inspType = inspTypeArr[inspCount];
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspComment = inspObj.getInspection().getResultComment();
	inspGroup = inspObj.getInspection().getInspectionGroup();
	inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	inspInspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	logDebug("Inspection #" + inspCount);
	logDebug("inspId " + inspIdArr[inspCount]);
	logDebug("inspResult = " + inspResultArr[inspCount]);
	logDebug("inspResultComment = " + inspComment);
	logDebug("inspResultDate = " + inspResultDate);
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspType = " + inspType);
	logDebug("inspSchedDate = " + inspSchedDate);
	doStandardChoiceActions(controlString,true,0);
	}

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

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
		tempObject[tcol.getColumnName()] = tval;
		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	  eval(copyStr);  // move to table name
	  }

	}

function loadParcelAttributes(thisArr) {
	//
	// Returns an associative array of Parcel Attributes
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var fcapParcelObj = null;
	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
	if (capParcelResult.getSuccess())
		var fcapParcelObj = capParcelResult.getOutput().toArray();
	else
		logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())

	for (i in fcapParcelObj)
		{
		parcelArea += fcapParcelObj[i].getParcelArea()
		var parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
		for (z in parcelAttrObj)
			thisArr["ParcelAttribute." + parcelAttrObj[z].getB1AttributeName()]=parcelAttrObj[z].getB1AttributeValue();

		// Explicitly load some standard values
		thisArr["ParcelAttribute.Block"] = fcapParcelObj[i].getBlock();
		thisArr["ParcelAttribute.Book"] = fcapParcelObj[i].getBook();
		thisArr["ParcelAttribute.CensusTract"] = fcapParcelObj[i].getCensusTract();
		thisArr["ParcelAttribute.CouncilDistrict"] = fcapParcelObj[i].getCouncilDistrict();
		thisArr["ParcelAttribute.ExemptValue"] = fcapParcelObj[i].getExemptValue();
		thisArr["ParcelAttribute.ImprovedValue"] = fcapParcelObj[i].getImprovedValue();
		thisArr["ParcelAttribute.InspectionDistrict"] = fcapParcelObj[i].getInspectionDistrict();
		thisArr["ParcelAttribute.LandValue"] = fcapParcelObj[i].getLandValue();
		thisArr["ParcelAttribute.LegalDesc"] = fcapParcelObj[i].getLegalDesc();
		thisArr["ParcelAttribute.Lot"] = fcapParcelObj[i].getLot();
		thisArr["ParcelAttribute.MapNo"] = fcapParcelObj[i].getMapNo();
		thisArr["ParcelAttribute.MapRef"] = fcapParcelObj[i].getMapRef();
		thisArr["ParcelAttribute.ParcelStatus"] = fcapParcelObj[i].getParcelStatus();
		thisArr["ParcelAttribute.SupervisorDistrict"] = fcapParcelObj[i].getSupervisorDistrict();
		thisArr["ParcelAttribute.Tract"] = fcapParcelObj[i].getTract();
		thisArr["ParcelAttribute.PlanArea"] = fcapParcelObj[i].getPlanArea();
		}
	}

function loadTaskSpecific(thisArr)
	{
 	//
 	// Appends the Task Specific Info to App Specific Array
 	// If useTaskSpecificGroupName==true, appends wf process code.wftask. to TSI field label
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		var wfObj = workflowResult.getOutput();
 	else
 		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()) ; return false; }

 	for (i in wfObj)
 		{
 		var fTask = wfObj[i];
 		var stepnumber = fTask.getStepNumber();
 		var processID = fTask.getProcessID();
 		var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(itemCap, processID, stepnumber)
 		if (TSIResult.getSuccess())
 			{
 			var TSI = TSIResult.getOutput();
 			for (a1 in TSI)
  				{
  				if (useTaskSpecificGroupName)
  	  				thisArr[fTask.getProcessCode() + "." + fTask.getTaskDescription() + "." + TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
  	  			else
	  				thisArr[TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
				}
 			}
 		}
	}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;

	for (var count=1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
		{
		var countstr = "000000" + count;
		countstr = String(countstr).substring(countstr.length,countstr.length - maxLength);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			bizDomScriptObj = bizDomScriptResult.getOutput();
			var myObj= new pairObj(bizDomScriptObj.getBizdomainValue());
			myObj.load(bizDomScriptObj.getDescription());
			if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		else
			{
			break;
			}
		}
	return actArray;
	}

function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {
                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                    logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                    eval(token(doObj.act));
                    lastEvalTrue = true;
                }
                else {
                    if (doObj.elseact) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                        eval(token(doObj.elseact));
                    }
                    lastEvalTrue = false;
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
}

function docWrite(dstr,header,indent)
	{
	var istr = "";
	for (i = 0 ; i < indent ; i++)
		istr+="|  ";
	if (header && dstr)
		aa.print(istr + "------------------------------------------------");
	if (dstr) aa.print(istr + dstr);
	if (header)
		aa.print(istr + "------------------------------------------------");
	}


function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
  	}

function pairObj(actID)
	{
	this.ID = actID;
	this.cri = null;
	this.act = null;
	this.elseact = null;
	this.enabled = true;
	this.continuation = false;
	this.branch = new Array();

	this.load = function(loadStr) {
		//
		// load() : tokenizes and loades the criteria and action
		//
		loadArr = loadStr.split("\\^");
		if (loadArr.length < 2 || loadArr.length > 3)
			{
			logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (!enableVariableBranching && bb >= 0)
			  {
			  var cc = a.substring(bb);
			  var dd = cc.indexOf("\")");
			  this.branch.push(cc.substring(8,dd));
			  a = cc.substring(dd);
			  bb = a.indexOf("branch");
			  }

			}
		}
	}

function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}


function logDebug(dstr) {


    vLevel = 1
    if (arguments.length > 1)
        vLevel = arguments[1]

    if ((showDebug & vLevel) == vLevel || vLevel == 1)
        debug += dstr + br;

    if ((showDebug & vLevel) == vLevel)
        aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}

function logMessage(dstr)
	{
	message+=li + dstr + endli;
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/


function activateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}



function addAddressCondition(addNum, cType,cStatus,cDesc,cComment,cImpact)
//if addNum is null, condition is added to all addresses on CAP
	{
	if (!addNum)
		{
		var capAddResult = aa.address.getAddressByCapId(capId);
		if (capAddResult.getSuccess())
			{
			var Adds = capAddResult.getOutput();
			for (zz in Adds)
				{

				if (Adds[zz].getRefAddressId())
					{
					var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

						if (addAddCondResult.getSuccess())
							{
							logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
							}
						else
							{
							logDebug( "**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
							}
					}
				}
			}
		}
	else
		{
			var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


		        if (addAddCondResult.getSuccess())
		        	{
				logDebug("Succe