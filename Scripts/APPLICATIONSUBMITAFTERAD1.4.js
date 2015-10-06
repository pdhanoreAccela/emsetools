/*------------------------------------------------------------------------------------------------------/
| SVN $Id: ApplicationSubmitAfter.js 1249 2008-01-10 18:57:01Z john.schomp $
| Program : ApplicationSubmitAfterV1.4.js
| Event   : ApplicationSubmitAfter
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : Abu Dhabi DPE
| Action# : N/A
|
| Notes   : Custom functions added for Abu Dhabi, see bottom
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| GLOBAL Constant do not change
/------------------------------------------------------------------------------------------------------*/
var LOG_DEBUG = 1
var LOG_TRACE = 2

/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false; 					// Set to true to see results in popup window
var showDebug = true; 						// Set to true to see debug messages in popup window
//var controlString = "ApplicationSubmitAfterStart"; 				// Standard choice for control
var controlString = "ApplicationSubmitAfter_TestDT"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents"				// Standard choice to execute first (for globals, etc)
var documentOnly = false; 					// Document Only -- displays hierarchy of std choice steps
var disableTokens = false; 					// turn off tokenizing of std choices (enables use of "{} and []")
var useAppSpecificGroupName = false; 				// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false; 				// Use Group name when populating Task Specific Info Values
var enableVariableBranching = false; 				// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99; 						// Maximum number of std choice entries.  Entries must be Left Zero Padded
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message = ""; 						// Message String
var debug = ""; 							// Debug String
var br = "<BR>"; 						// Break Tag
var feeSeqList = new Array(); 					// invoicing fee list
var paymentPeriodList = new Array(); 				// invoicing pay periods

if (documentOnly) {
    doStandardChoiceActions(controlString, false, 0);
    aa.env.setValue("ScriptReturnCode", "0");
    aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
    aa.abortScript();
}

var capId = getCapId();
var cap = aa.cap.getCap(capId).getOutput();
var servProvCode = capId.getServiceProviderCode();
var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
var parentCapId = null
var parentCapString = "" + aa.env.getValue("ParentCapID");
if (parentCapString.length > 0) { parentArray = parentCapString.split("-"); parentCapId = aa.cap.getCapID(parentArray[0], parentArray[1], parentArray[2]).getOutput(); }
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN"; publicUser = true }  // ignore public users
var partialCap = !cap.isCompleteCap();
var capIDString = capId.getCustomID();
var systemUserObj = aa.person.getUser(currentUserID).getOutput();
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString();
var appTypeArray = appTypeString.split("/");
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();

var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var fileDateObj = cap.getFileDate(); 				// File Date scriptdatetime
var fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
var fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(), fileDateObj.getDayOfMonth(), fileDateObj.getYear(), "YYYY-MM-DD");
var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"MM-DD-YYYY");
var parcelArea = 0;

var estValue = 0; var calcValue = 0; var feeFactor			// Init Valuations
var valobj = aa.finance.getContractorSuppliedValuation(capId, null).getOutput(); // Calculated valuation
if (valobj.length) {
    estValue = valobj[0].getEstimatedValue();
    calcValue = valobj[0].getCalculatedValue();
    feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
}

var balanceDue = 0; var houseCount = 0; feesInvoicedTotal = 0; 	// Init detail Data
var capDetail = "";
var capDetailObjResult = aa.cap.getCapDetail(capId); 		// Detail
if (capDetailObjResult.getSuccess()) {
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

var AInfo = new Array(); 					// Create array for tokenized variables
loadAppSpecific(AInfo); 						// Add AppSpecific Info
loadTaskSpecific(AInfo); 					// Add task specific info
loadParcelAttributes(AInfo); 					// Add parcel attributes
loadAddressAttributes(AInfo);					// Add address attributes
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
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute, true, 0); 	// run Pre-execution code

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

doStandardChoiceActions(controlString, true, 0);
//
// Check for invoicing of fees
//
if (feeSeqList.length) {
    invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth, pDay, pYear, pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
{
    var mth = "";
    var day = "";
    var ret = "";
    if (pMonth > 10)
        mth = pMonth.toString();
    else
        mth = "0" + pMonth.toString();

    if (pDay > 10)
        day = pDay.toString();
    else
        day = "0" + pDay.toString();

    if (pFormat == "YYYY-MM-DD")
        ret = pYear.toString() + "-" + mth + "-" + day;
    else
        ret = "" + mth + "/" + day + "/" + pYear.toString();

    return ret;
}

function logGlobals(globArray) {

    for (loopGlob in globArray)
        logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
}

function getCapId() {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
        return true;

}

//
// exists:  return true if Value is in Array
//
//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl) {
    var actArray = new Array();
    var maxLength = String("" + maxEntries).length;

    for (var count = 1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
    {
        var countstr = "000000" + count;
        countstr = String(countstr).substring(countstr.length, countstr.length - maxLength);
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl, countstr);

        if (bizDomScriptResult.getSuccess()) {
            bizDomScriptObj = bizDomScriptResult.getOutput();
            var myObj = new pairObj(bizDomScriptObj.getBizdomainValue());
            myObj.load(bizDomScriptObj.getDescription());
            if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
            actArray.push(myObj);
        }
        else {
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

function docWrite(dstr, header, indent) {
    var istr = "";
    for (i = 0; i < indent; i++)
        istr += "|  ";
    if (header && dstr)
        aa.print(istr + "------------------------------------------------");
    if (dstr) aa.print(istr + dstr);
    if (header)
        aa.print(istr + "------------------------------------------------");
}


function token(tstr) {
    if (!disableTokens) {
        re = new RegExp("\\{", "g"); tstr = String(tstr).replace(re, "AInfo[\"");
        re = new RegExp("\\}", "g"); tstr = String(tstr).replace(re, "\"]");
    }
    return String(tstr);
}

function pairObj(actID) {
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
        if (loadArr.length < 2 || loadArr.length > 3) {
            logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
        }
        else {
            this.cri = loadArr[0];
            this.act = loadArr[1];
            this.elseact = loadArr[2];

            if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

            var a = loadArr[1];
            var bb = a.indexOf("branch");
            while (!enableVariableBranching && bb >= 0) {
                var cc = a.substring(bb);
                var dd = cc.indexOf("\")");
                this.branch.push(cc.substring(8, dd));
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

function logMessage(dstr) {
    message += dstr + br;
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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


function addAddressCondition(addNum, cType, cStatus, cDesc, cComment, cImpact)
//if addNum is null, condition is added to all addresses on CAP
{
    if (!addNum) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var Adds = capAddResult.getOutput();
            for (zz in Adds) {

                if (Adds[zz].getRefAddressId()) {
                    var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

                    if (addAddCondResult.getSuccess()) {
                        logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
                    }
                }
            }
        }
    }
    else {
        var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


        if (addAddCondResult.getSuccess()) {
            logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
        }
    }
}


function addAllFees(fsched, fperiod, fqty, finvoice) // Adds all fees for a given fee schedule
{
    var arrFees = aa.finance.getFeeItemList(null, fsched, null).getOutput();
    for (xx in arrFees) {
        var feeCod = arrFees[xx].getFeeCod();
        var assessFeeResult = aa.finance.createFeeItem(capId, fsched, feeCod, fperiod, fqty);
        if (assessFeeResult.getSuccess()) {
            var feeSeq = assessFeeResult.getOutput();
            logMessage("Added Fee " + feeCod + ", Qty " + fqty);
            logDebug("The assessed fee Sequence Number " + feeSeq);
            if (finvoice == "Y") {
                feeSeqList.push(feeSeq);
                paymentPeriodList.push(fperiod);
            }
        }
        else {
            logDebug("**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
        }
    } // for xx
} // function

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {
        logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact) {
    // Optional 6th argument is license number, otherwise add to all CAEs on CAP
    refLicArr = new Array();
    if (arguments.length == 6) // License Number provided
    {
        refLicArr.push(getRefLicenseProf(arguments[5]));
    }
    else // adding to cap lic profs
    {
        var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
        if (capLicenseResult.getSuccess())
        { var refLicArr = capLicenseResult.getOutput(); }
        else
        { logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
    }

    for (var refLic in refLicArr) {
        if (arguments.length == 6) // use sequence number
            licSeq = refLicArr[refLic].getLicSeqNbr();
        else
            licSeq = refLicArr[refLic].getLicenseNbr();

        var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

        if (addCAEResult.getSuccess()) {
            logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
        }
    }
}

function addLookup(stdChoice, stdValue, stdDesc) {
    //check if stdChoice and stdValue already exist; if they do, don't add
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        logDebug("Standard Choices Item " + stdChoice + " and Value " + stdValue + " already exist.  Lookup is not added or updated.");
        return false;
    }

    //Proceed to add
    var strControl;

    if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length) {
        var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

        if (bizDomScriptResult.getSuccess())

        //check if new Std Choice actually created



            logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        else
            logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
    }
    else
        logDebug("Could not create std choice, one or more null values");
}

function addParcelCondition(parcelNum, cType, cStatus, cDesc, cComment, cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
{
    if (!parcelNum) {
        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addParcelCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                    logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                }
                else {
                var addCondResult = aa.addressCondition.addAddressCondition(addrRefId, pType, pDesc, pComment, null, null, pImpact, pStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Address ID " + addrRefId + "  (" + pImpact + ") " + pDesc);
                    logDebug("Successfully added condition to Address ID " + addrRefId + "  (" + pImpact + ") " + pDesc);
                    condAdded = true;
                }
                else {
                    logDebug("**ERROR: adding condition to Address " + addrRefId + "  (" + pImpact + "): " + addCondResult.getErrorMessage());
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
            if (condArray.length > 0) {
                for (bb in condArray) {
                    cType = condArray[bb].getConditionType();
                    cStatus = condArray[bb].getConditionStatus();
                    cDesc = condArray[bb].getConditionDescription();
                    cImpact = condArray[bb].getImpactCode();
                    if (cType == null)
                        cType = " ";
                    if (cStatus == null)
                        cStatus = " ";
                    if (cDesc == null)
                        cDesc = " ";
                    if (cImpact == null)
                        cImpact = " ";
                    if ((pType == null || pType.toUpperCase() == cType.toUpperCase()) && (pStatus == null || pStatus.toUpperCase() == cStatus.toUpperCase()) && (pDesc == null || pDesc.toUpperCase() == cDesc.toUpperCase()) && (pImpact == null || pImpact.toUpperCase() == cImpact.toUpperCase())) {
                        logMessage("Condition already exists: New condition not added to Address ID " + pAddrNum);
                        logDebug("Condition already exists: New condition not added to Address ID " + pAddrNum);
                        return false;
                    }
                }
            }
        }
        var addCondResult = aa.addressCondition.addAddressCondition(pAddrNum, pType, pDesc, pComment, null, null, pImpact, pStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
        if (addCondResult.getSuccess()) {
            logMessage("Successfully added condition to Address ID " + pAddrNum + "  (" + pImpact + ") " + pDesc);
            logDebug("Successfully added condition to Address ID " + pAddrNum + "  (" + pImpact + ") " + pDesc);
            condAdded = true;
        }
        else {
            logDebug("**ERROR: adding condition to Address " + pAddrNum + "  (" + pImpact + "): " + addCondResult.getErrorMessage());
        }
    }
    return condAdded;
}


function addToASITable(tableName,tableValues) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValues is an associative array of values.  All elements MUST be strings.
  	itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField();
	var col = tsm.getColumns();
	var fld_readonly = tsm.getReadonlyField(); //get ReadOnly property
	var coli = col.iterator();

	while (coli.hasNext())
		{
		colname = coli.next();


		//fld.add(tableValues[colname.getColumnName()]);
		fld.add(tableValues[colname.getColumnName()].fieldValue);
		fld_readonly.add(tableValues[colname.getColumnName()].readOnly);

		}

	tsm.setTableField(fld);

	tsm.setReadonlyField(fld_readonly); // set readonly field

	addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
	if (!addResult .getSuccess())
		{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}


function allTasksComplete(stask) // optional tasks to ignore... for Sacramento
{
    var ignoreArray = new Array();
    for (var i = 1; i < arguments.length; i++)
        ignoreArray.push(arguments[i])

    // returns true if any of the subtasks are active
    var taskResult = aa.workflow.getTasks(capId);
    if (taskResult.getSuccess())
    { taskArr = taskResult.getOutput(); }
    else
    { logDebug("**ERROR: getting tasks : " + taskResult.getErrorMessage()); return false }

    for (xx in taskArr)
        if (taskArr[xx].getProcessCode().equals(stask) && taskArr[xx].getActiveFlag().equals("Y") && !exists(taskArr[xx].getTaskDescription(), ignoreArray))
        return false;
    return true;
}

function appHasCondition(pType, pStatus, pDesc, pImpact) {
    // Checks to see if conditions have been added to CAP
    // 06SSP-00223
    //
    if (pType == null)
        var condResult = aa.capCondition.getCapConditions(capId);
    else
        var condResult = aa.capCondition.getCapConditions(capId, pType);

    if (condResult.getSuccess())
        var capConds = condResult.getOutput();
    else {
        logMessage("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        logDebug("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        return false;
    }

    var cStatus;
    var cDesc;
    var cImpact;

    for (cc in capConds) {
        var thisCond = capConds[cc];
        var cStatus = thisCond.getConditionStatus();
        var cDesc = thisCond.getConditionDescription();
        var cImpact = thisCond.getImpactCode();
        var cType = thisCond.getConditionType();
        if (cStatus == null)
            cStatus = " ";
        if (cDesc == null)
            cDesc = " ";
        if (cImpact == null)
            cImpact = " ";
        //Look for matching condition

        if ((pStatus == null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc == null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact == null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
            return true; //matching condition found
    }
    return false; //no matching condition found
} //function

function appMatch(ats) // optional capId or CapID string
{
    var matchArray = appTypeArray //default to current app
    if (arguments.length == 2) {
        matchCapParm = arguments[1]
        if (typeof (matchCapParm) == "string")
            matchCapId = aa.cap.getCapID(matchCapParm).getOutput();   // Cap ID to check
        else
            matchCapId = matchCapParm;
        if (!matchCapId) {
            logDebug("**WARNING: CapId passed to appMatch was not valid: " + arguments[1]);
            return false
        }
        matchCap = aa.cap.getCap(matchCapId).getOutput();
        matchArray = matchCap.getCapType().toString().split("/");
    }

    var isMatch = true;
    var ata = ats.split("/");
    if (ata.length != 4)
        logDebug("**ERROR in appMatch.  The following Application Type String is incorrectly formatted: " + ats);
    else
        for (xx in ata)
        if (!ata[xx].equals(matchArray[xx]) && !ata[xx].equals("*"))
        isMatch = false;
    return isMatch;
}


function appNameIsUnique(gaGroup, gaType, gaName)
//
// returns true if gaName application name has not been used in CAPs of gaGroup and gaType
// Bypasses current CAP
{
    var getCapResult = aa.cap.getByAppType(gaGroup, gaType);
    if (getCapResult.getSuccess())
        var apsArray = getCapRes
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth, pDay, pYear, pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
{
    var mth = "";
    var day = "";
    var ret = "";
    if (pMonth > 10)
        mth = pMonth.toString();
    else
        mth = "0" + pMonth.toString();

    if (pDay > 10)
        day = pDay.toString();
    else
        day = "0" + pDay.toString();

    if (pFormat == "YYYY-MM-DD")
        ret = pYear.toString() + "-" + mth + "-" + day;
    else
        ret = "" + mth + "/" + day + "/" + pYear.toString();

    return ret;
}

function logGlobals(globArray) {

    for (loopGlob in globArray)
        logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
}

function getCapId() {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
        return true;

}

//
// exists:  return true if Value is in Array
//
//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl) {
    var actArray = new Array();
    var maxLength = String("" + maxEntries).length;

    for (var count = 1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
    {
        var countstr = "000000" + count;
        countstr = String(countstr).substring(countstr.length, countstr.length - maxLength);
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl, countstr);

        if (bizDomScriptResult.getSuccess()) {
            bizDomScriptObj = bizDomScriptResult.getOutput();
            var myObj = new pairObj(bizDomScriptObj.getBizdomainValue());
            myObj.load(bizDomScriptObj.getDescription());
            if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
            actArray.push(myObj);
        }
        else {
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

function docWrite(dstr, header, indent) {
    var istr = "";
    for (i = 0; i < indent; i++)
        istr += "|  ";
    if (header && dstr)
        aa.print(istr + "------------------------------------------------");
    if (dstr) aa.print(istr + dstr);
    if (header)
        aa.print(istr + "------------------------------------------------");
}


function token(tstr) {
    if (!disableTokens) {
        re = new RegExp("\\{", "g"); tstr = String(tstr).replace(re, "AInfo[\"");
        re = new RegExp("\\}", "g"); tstr = String(tstr).replace(re, "\"]");
    }
    return String(tstr);
}

function pairObj(actID) {
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
        if (loadArr.length < 2 || loadArr.length > 3) {
            logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
        }
        else {
            this.cri = loadArr[0];
            this.act = loadArr[1];
            this.elseact = loadArr[2];

            if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

            var a = loadArr[1];
            var bb = a.indexOf("branch");
            while (!enableVariableBranching && bb >= 0) {
                var cc = a.substring(bb);
                var dd = cc.indexOf("\")");
                this.branch.push(cc.substring(8, dd));
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

function logMessage(dstr) {
    message += dstr + br;
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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


function addAddressCondition(addNum, cType, cStatus, cDesc, cComment, cImpact)
//if addNum is null, condition is added to all addresses on CAP
{
    if (!addNum) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var Adds = capAddResult.getOutput();
            for (zz in Adds) {

                if (Adds[zz].getRefAddressId()) {
                    var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

                    if (addAddCondResult.getSuccess()) {
                        logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
                    }
                }
            }
        }
    }
    else {
        var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


        if (addAddCondResult.getSuccess()) {
            logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
        }
    }
}


function addAllFees(fsched, fperiod, fqty, finvoice) // Adds all fees for a given fee schedule
{
    var arrFees = aa.finance.getFeeItemList(null, fsched, null).getOutput();
    for (xx in arrFees) {
        var feeCod = arrFees[xx].getFeeCod();
        var assessFeeResult = aa.finance.createFeeItem(capId, fsched, feeCod, fperiod, fqty);
        if (assessFeeResult.getSuccess()) {
            var feeSeq = assessFeeResult.getOutput();
            logMessage("Added Fee " + feeCod + ", Qty " + fqty);
            logDebug("The assessed fee Sequence Number " + feeSeq);
            if (finvoice == "Y") {
                feeSeqList.push(feeSeq);
                paymentPeriodList.push(fperiod);
            }
        }
        else {
            logDebug("**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
        }
    } // for xx
} // function

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {
        logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact) {
    // Optional 6th argument is license number, otherwise add to all CAEs on CAP
    refLicArr = new Array();
    if (arguments.length == 6) // License Number provided
    {
        refLicArr.push(getRefLicenseProf(arguments[5]));
    }
    else // adding to cap lic profs
    {
        var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
        if (capLicenseResult.getSuccess())
        { var refLicArr = capLicenseResult.getOutput(); }
        else
        { logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
    }

    for (var refLic in refLicArr) {
        if (arguments.length == 6) // use sequence number
            licSeq = refLicArr[refLic].getLicSeqNbr();
        else
            licSeq = refLicArr[refLic].getLicenseNbr();

        var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

        if (addCAEResult.getSuccess()) {
            logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
        }
    }
}

function addLookup(stdChoice, stdValue, stdDesc) {
    //check if stdChoice and stdValue already exist; if they do, don't add
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        logDebug("Standard Choices Item " + stdChoice + " and Value " + stdValue + " already exist.  Lookup is not added or updated.");
        return false;
    }

    //Proceed to add
    var strControl;

    if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length) {
        var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

        if (bizDomScriptResult.getSuccess())

        //check if new Std Choice actually created



            logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        else
            logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
    }
    else
        logDebug("Could not create std choice, one or more null values");
}

function addParcelCondition(parcelNum, cType, cStatus, cDesc, cComment, cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
{
    if (!parcelNum) {
        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addParcelCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                    logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                }
                else {
                var capAddressResult = aa.address.getAddressWithAttributeByCapId(pFromCapId);
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
	var capAddressResult = aa.address.getAddressWithAttributeByCapId(pFromCapId);
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
			aa.address.createAddressWithAPOAttribute(vToCapId, newAddress);
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
        editAppSpecific(asi, AInfo[asi], newCap)
}

function copyCalcVal(newcap) {
    if (!newcap)
    { logMessage("**WARNING: copyCalcVal was passed a null new cap ID"); return false; }

    var valResult = aa.finance.getCalculatedValuation(capId, null);
    if (valResult.getSuccess())
        var valArray = valResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get calc val array: " + valResult.getErrorMessage()); return false; }

    for (thisCV in valArray) {
        var bcv = valArray[thisCV].getbCalcValuatn();
        bcv.setCapID(newcap);
        createResult = aa.finance.createBCalcValuatn(bcv);
        if (!createResult.getSuccess())
        { logMessage("**ERROR: Creating new calc valuatn on target cap ID: " + createResult.getErrorMessage()); return false; }
    }
}

function copyConditions(fromCapId) {
    var getFromCondResult = aa.capCondition.getCapConditions(fromCapId);
    if (getFromCondResult.getSuccess())
        var condA = getFromCondResult.getOutput();
    else
    { logDebug("**ERROR: getting cap conditions: " + getFromCondResult.getErrorMessage()); return false }

    for (cc in condA) {
        var thisC = condA[cc];

        var addCapCondResult = aa.capCondition.addCapCondition(capId, thisC.getConditionType(), thisC.getConditionDescription(), thisC.getConditionComment(), thisC.getEffectDate(), thisC.getExpireDate(), sysDate, thisC.getRefNumber1(), thisC.getRefNumber2(), thisC.getImpactCode(), thisC.getIssuedByUser(), thisC.getStatusByUser(), thisC.getConditionStatus(), currentUserID, "A")
        if (addCapCondResult.getSuccess())
            logDebug("Successfully added condition (" + thisC.getImpactCode() + ") " + thisC.getConditionDescription());
        else
            logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function copyConditionsFromParcel(parcelIdString) {
    var getFromCondResult = aa.parcelCondition.getParcelConditions(parcelIdString)
    if (getFromCondResult.getSuccess())
        var condA = getFromCondResult.getOutput();
    else
    { logDebug("**WARNING: getting parcel conditions: " + getFromCondResult.getErrorMessage()); return false }

    for (cc in condA) {
        var thisC = condA[cc];

        if (!appHasCondition(thisC.getConditionType(), null, thisC.getConditionDescription(), thisC.getImpactCode())) {
            var addCapCondResult = aa.capCondition.addCapCondition(capId, thisC.getConditionType(), thisC.getConditionDescription(), thisC.getConditionComment(), thisC.getEffectDate(), thisC.getExpireDate(), sysDate, thisC.getRefNumber1(), thisC.getRefNumber2(), thisC.getImpactCode(), thisC.getIssuedByUser(), thisC.getStatusByUser(), thisC.getConditionStatus(), currentUserID, "A")
            if (addCapCondResult.getSuccess())
                logDebug("Successfully added condition (" + thisC.getImpactCode() + ") " + thisC.getConditionDescription());
            else
                logDebug("**ERROR: adding condition (" + thisC.getImpactCode() + "): " + addCapCondResult.getErrorMessage());
        }
        else
            logDebug("**WARNING: adding condition (" + thisC.getImpactCode() + "): condition already exists");

    }
}

function copyContacts(pFromCapId, pToCapId) {
    //Copies all contacts from pFromCapId to pToCapId but using reference contact data except for two attributes
    //
    //
    if (pToCapId == null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
    var copied = 0;
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
			var baseContact = Contacts[yy].getCapContactModel();
            var newContact = Contacts[yy].getCapContactModel().getPeople();
			newContact.setAuditDate(null);
			newContact.setAuditID(null);
			newContact.setAuditStatus(null);
			newContact.setBirthDate(null);
			newContact.setComment(null);
			newContact.setCompactAddress(null);
			newContact.setContactSeqNumber(null);
			newContact.setContactType(null);
			newContact.setContactTypeFlag(null);
			newContact.setCountry(null);
			newContact.setCountryCode(null);
			newContact.setEndBirthDate(null);
			newContact.setFax(null);
			newContact.setFaxCountryCode(null);
			newContact.setFlag(null);
			newContact.setGender(null);
			newContact.setHoldCode(null);
			newContact.setHoldDescription(null);
			newContact.setId(null);
			newContact.setIvrPinNumber(null);
			newContact.setIvrUserNumber(null);
			newContact.setMaskedSsn(null);
			newContact.setNamesuffix(null);
			newContact.setPhone1(null);
			newContact.setPhone1CountryCode(null);
			newContact.setPhone2(null);
			newContact.setPhone2CountryCode(null);
			newContact.setPhone3(null);
			newContact.setPhone3CountryCode(null);
			newContact.setPostOfficeBox(null);
			newContact.setPreferredChannel(null);
			newContact.setPreferredChannelString(null);
			newContact.setRate1(null);
			newContact.setRelation(null);
			newContact.setSalutation(null);
			newContact.setServiceProviderCode(null);
			newContact.setSocialSecurityNumber(null);
			newContact.setTitle(null);

			baseAttrList = newContact.getAttributes();
			var contactAttributes= baseAttrList.toArray();
			baseAttrList.clear();

			for (xx in contactAttributes) {
				 eachAttr = contactAttributes[xx]
					if (eachAttr.getAttributeName() == "REPRESENTATIVE TYPE" || eachAttr.getAttributeName() == "SHARE PERCENTAGE"){
					baseAttrList.add(createContactAttribute(eachAttr.getAttributeName(), eachAttr.getAttributeValue(), "Text", "Y", "Y"));
					}
			}

			var referenceContact = aa.people.getPeopleByPeopleModel(newContact);
			if (referenceContact.getSuccess())
			{
			finalContact = referenceContact.getOutput()[0].getPeopleModel();
			finalAttributes = aa.people.getPeopleAttributeByPeople(finalContact.getContactSeqNumber(),finalContact.getContactType());
			attrArray = finalAttributes.getOutput();

				for (xx in attrArray) {
				if (attrArray[xx].getPeopleAttributeModel().getAttributeName() != "REPRESENTATIVE TYPE" && attrArray[xx].getPeopleAttributeModel().getAttributeName() != "SHARE PERCENTAGE") {
						baseAttrList.add(attrArray[xx].getPeopleAttributeModel());
					}
				}
			}
			else {
				finalContact = baseContact.getPeople();
				for (xx in contactAttributes) {
				    eachAttr = contactAttributes[xx]
					if (eachAttr.getAttributeName() != "REPRESENTATIVE TYPE" || eachAttr.getAttributeName() != "SHARE PERCENTAGE"){
					baseAttrList.add(createContactAttribute(eachAttr.getAttributeName(), eachAttr.getAttributeValue(), "Text", "Y", "Y"));
					}
				}
			}

			finalContact.setAttributes(baseAttrList);
			baseContact.setPeople(finalContact);

    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth, pDay, pYear, pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
{
    var mth = "";
    var day = "";
    var ret = "";
    if (pMonth > 10)
        mth = pMonth.toString();
    else
        mth = "0" + pMonth.toString();

    if (pDay > 10)
        day = pDay.toString();
    else
        day = "0" + pDay.toString();

    if (pFormat == "YYYY-MM-DD")
        ret = pYear.toString() + "-" + mth + "-" + day;
    else
        ret = "" + mth + "/" + day + "/" + pYear.toString();

    return ret;
}

function logGlobals(globArray) {

    for (loopGlob in globArray)
        logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
}

function getCapId() {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
        return true;

}

//
// exists:  return true if Value is in Array
//
//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl) {
    var actArray = new Array();
    var maxLength = String("" + maxEntries).length;

    for (var count = 1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
    {
        var countstr = "000000" + count;
        countstr = String(countstr).substring(countstr.length, countstr.length - maxLength);
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl, countstr);

        if (bizDomScriptResult.getSuccess()) {
            bizDomScriptObj = bizDomScriptResult.getOutput();
            var myObj = new pairObj(bizDomScriptObj.getBizdomainValue());
            myObj.load(bizDomScriptObj.getDescription());
            if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
            actArray.push(myObj);
        }
        else {
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

function docWrite(dstr, header, indent) {
    var istr = "";
    for (i = 0; i < indent; i++)
        istr += "|  ";
    if (header && dstr)
        aa.print(istr + "------------------------------------------------");
    if (dstr) aa.print(istr + dstr);
    if (header)
        aa.print(istr + "------------------------------------------------");
}


function token(tstr) {
    if (!disableTokens) {
        re = new RegExp("\\{", "g"); tstr = String(tstr).replace(re, "AInfo[\"");
        re = new RegExp("\\}", "g"); tstr = String(tstr).replace(re, "\"]");
    }
    return String(tstr);
}

function pairObj(actID) {
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
        if (loadArr.length < 2 || loadArr.length > 3) {
            logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
        }
        else {
            this.cri = loadArr[0];
            this.act = loadArr[1];
            this.elseact = loadArr[2];

            if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

            var a = loadArr[1];
            var bb = a.indexOf("branch");
            while (!enableVariableBranching && bb >= 0) {
                var cc = a.substring(bb);
                var dd = cc.indexOf("\")");
                this.branch.push(cc.substring(8, dd));
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

function logMessage(dstr) {
    message += dstr + br;
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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


function addAddressCondition(addNum, cType, cStatus, cDesc, cComment, cImpact)
//if addNum is null, condition is added to all addresses on CAP
{
    if (!addNum) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var Adds = capAddResult.getOutput();
            for (zz in Adds) {

                if (Adds[zz].getRefAddressId()) {
                    var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

                    if (addAddCondResult.getSuccess()) {
                        logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
                    }
                }
            }
        }
    }
    else {
        var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


        if (addAddCondResult.getSuccess()) {
            logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
        }
    }
}


function addAllFees(fsched, fperiod, fqty, finvoice) // Adds all fees for a given fee schedule
{
    var arrFees = aa.finance.getFeeItemList(null, fsched, null).getOutput();
    for (xx in arrFees) {
        var feeCod = arrFees[xx].getFeeCod();
        var assessFeeResult = aa.finance.createFeeItem(capId, fsched, feeCod, fperiod, fqty);
        if (assessFeeResult.getSuccess()) {
            var feeSeq = assessFeeResult.getOutput();
            logMessage("Added Fee " + feeCod + ", Qty " + fqty);
            logDebug("The assessed fee Sequence Number " + feeSeq);
            if (finvoice == "Y") {
                feeSeqList.push(feeSeq);
                paymentPeriodList.push(fperiod);
            }
        }
        else {
            logDebug("**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
        }
    } // for xx
} // function

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {
        logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact) {
    // Optional 6th argument is license number, otherwise add to all CAEs on CAP
    refLicArr = new Array();
    if (arguments.length == 6) // License Number provided
    {
        refLicArr.push(getRefLicenseProf(arguments[5]));
    }
    else // adding to cap lic profs
    {
        var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
        if (capLicenseResult.getSuccess())
        { var refLicArr = capLicenseResult.getOutput(); }
        else
        { logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
    }

    for (var refLic in refLicArr) {
        if (arguments.length == 6) // use sequence number
            licSeq = refLicArr[refLic].getLicSeqNbr();
        else
            licSeq = refLicArr[refLic].getLicenseNbr();

        var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

        if (addCAEResult.getSuccess()) {
            logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
        }
    }
}

function addLookup(stdChoice, stdValue, stdDesc) {
    //check if stdChoice and stdValue already exist; if they do, don't add
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        logDebug("Standard Choices Item " + stdChoice + " and Value " + stdValue + " already exist.  Lookup is not added or updated.");
        return false;
    }

    //Proceed to add
    var strControl;

    if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length) {
        var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

        if (bizDomScriptResult.getSuccess())

        //check if new Std Choice actually created



            logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        else
            logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
    }
    else
        logDebug("Could not create std choice, one or more null values");
}

function addParcelCondition(parcelNum, cType, cStatus, cDesc, cComment, cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
{
    if (!parcelNum) {
        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addParcelCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                    logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                }
                else {
                 // use next ODD or EVEN year
    {
        if (vOddEven == "ODD" && vReturnDate.getFullYear() % 2 == 0) //vReturnDate is EVEN year
            vReturnDate.setFullYear(vReturnDate.getFullYear() + 1);

        if (vOddEven == "EVEN" && vReturnDate.getFullYear() % 2)    //vReturnDate is ODD year
            vReturnDate.setFullYear(vReturnDate.getFullYear() + 1);
    }

    return (vReturnDate.getMonth() + 1) + "/" + vReturnDate.getDate() + "/" + vReturnDate.getFullYear();
}

function deactivateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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

function editAppName(newname) {
    var itemCap = capId;
    if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    capResult = aa.cap.getCap(itemCap)

    if (!capResult.getSuccess())
    { logDebug("**WARNING: error getting cap : " + capResult.getErrorMessage()); return false }

    capModel = capResult.getOutput().getCapModel()

    capModel.setSpecialText(newname)

    setNameResult = aa.cap.editCapByPK(capModel)

    if (!setNameResult.getSuccess())
    { logDebug("**WARNING: error setting cap name : " + setNameResult.getErrorMessage()); return false }


    return true;
}

function editAppSpecific(itemName, itemValue)  // optional: itemCap
{
    var updated = false;
    var i = 0;
    itemCap = capId;
    if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

    if (itemCap == null) {
        logDebug("Can't copy " + itemName + " to child application, child App ID is null"); return false;
    }

    if (useAppSpecificGroupName) {
        if (itemName.indexOf(".") < 0)
        { logDebug("**WARNING: editAppSpecific requires group name prefix when useAppSpecificGroupName is true"); return false }


        var itemGroup = itemName.substr(0, itemName.indexOf("."));
        var itemName = itemName.substr(itemName.indexOf(".") + 1);
    }

    var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
    if (appSpecInfoResult.getSuccess()) {
        var appspecObj = appSpecInfoResult.getOutput();

        if (itemName != "") {
            while (i < appspecObj.length && !updated) {
                if (appspecObj[i].getCheckboxDesc() == itemName && (!useAppSpecificGroupName || appspecObj[i].getCheckboxType() == itemGroup)) {
                    appspecObj[i].setChecklistComment(itemValue);
                    var actionResult = aa.appSpecificInfo.editAppSpecInfos(appspecObj);
                    if (actionResult.getSuccess()) {
                        logMessage("app spec info item " + itemName + " has been given a value of " + itemValue);
                        logDebug("app spec info item " + itemName + " has been given a value of " + itemValue);
                    } else {
                        logDebug("**ERROR: Setting the app spec info item " + itemName + " to " + itemValue + " .\nReason is: " + actionResult.getErrorType() + ":" + actionResult.getErrorMessage());
                    }
                    updated = true;
                    AInfo[itemName] = itemValue;  // Update array used by this script
                }
                i++;
            } // while loop
        } // item name blank
    } // got app specific object
}


function editRefLicProfAttribute(pLicNum, pAttributeName, pNewAttributeValue) {

    var attrfound = false;
    var oldValue = null;

    licObj = getRefLicenseProf(pLicNum)

    if (!licObj)
    { logDebug("**WARNING Licensed Professional : " + pLicNum + " not found"); return false }

    licSeqNum = licObj.getLicSeqNbr();
    attributeType = licObj.getLicenseType();

    if (licSeqNum == 0 || licSeqNum == null || attributeType == "" || attributeType == null)
    { logDebug("**WARNING Licensed Professional Sequence Number or Attribute Type missing"); return false }

    var peopAttrResult = aa.people.getPeopleAttributeByPeople(licSeqNum, attributeType);

    if (!peopAttrResult.getSuccess())
    { logDebug("**WARNING retrieving reference license professional attribute: " + peopAttrResult.getErrorMessage()); return false }

    var peopAttrArray = peopAttrResult.getOutput();

    for (i in peopAttrArray) {
        if (pAttributeName.equals(peopAttrArray[i].getAttributeName())) {
            oldValue = peopAttrArray[i].getAttributeValue()
            attrfound = true;
            break;
        }
    }

    if (attrfound) {
        logDebug("Updated Ref Lic Prof: " + pLicNum + ", attribute: " + pAttributeName + " from: " + oldValue + " to: " + pNewAttributeValue)
        peopAttrArray[i].setAttributeValue(pNewAttributeValue);
        aa.people.editPeopleAttribute(peopAttrArray[i].getPeopleAttributeModel());
    }
    else {
        logDebug("**WARNING attribute: " + pAttributeName + " not found for Ref Lic Prof: " + pLicNum)
        /* make a new one with the last model.  Not optimal but it should work
        newPAM = peopAttrArray[i].getPeopleAttributeModel();
        newPAM.setAttributeName(pAttributeName);
        newPAM.setAttributeValue(pNewAttributeValue);
        newPAM.setAttributeValueDataType("Number");
        aa.people.createPeopleAttribute(newPAM);
        */
    }
} function editTaskComment(wfstr, wfcomment) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 3) {
        processName = arguments[2]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
            wfObj[i].setDispositionComment(wfcomment);
            var fTaskModel = wfObj[i].getTaskItem();
            var tResult = aa.workflow.adjustTaskWithNoAudit(fTaskModel);
            if (tResult.getSuccess())
                logDebug("Set Workflow: " + wfstr + " comment " + wfcomment);
            else
            { logMessage("**ERROR: Failed to update comment on workflow task: " + tResult.getErrorMessage()); return false; }
        }
    }
}

function editTaskDueDate(wfstr, wfdate) // optional process name.  if wfstr == "*", set for all tasks
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 3) {
        processName = arguments[2]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
  
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth, pDay, pYear, pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
{
    var mth = "";
    var day = "";
    var ret = "";
    if (pMonth > 10)
        mth = pMonth.toString();
    else
        mth = "0" + pMonth.toString();

    if (pDay > 10)
        day = pDay.toString();
    else
        day = "0" + pDay.toString();

    if (pFormat == "YYYY-MM-DD")
        ret = pYear.toString() + "-" + mth + "-" + day;
    else
        ret = "" + mth + "/" + day + "/" + pYear.toString();

    return ret;
}

function logGlobals(globArray) {

    for (loopGlob in globArray)
        logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
}

function getCapId() {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
        return true;

}

//
// exists:  return true if Value is in Array
//
//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl) {
    var actArray = new Array();
    var maxLength = String("" + maxEntries).length;

    for (var count = 1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
    {
        var countstr = "000000" + count;
        countstr = String(countstr).substring(countstr.length, countstr.length - maxLength);
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl, countstr);

        if (bizDomScriptResult.getSuccess()) {
            bizDomScriptObj = bizDomScriptResult.getOutput();
            var myObj = new pairObj(bizDomScriptObj.getBizdomainValue());
            myObj.load(bizDomScriptObj.getDescription());
            if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
            actArray.push(myObj);
        }
        else {
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

function docWrite(dstr, header, indent) {
    var istr = "";
    for (i = 0; i < indent; i++)
        istr += "|  ";
    if (header && dstr)
        aa.print(istr + "------------------------------------------------");
    if (dstr) aa.print(istr + dstr);
    if (header)
        aa.print(istr + "------------------------------------------------");
}


function token(tstr) {
    if (!disableTokens) {
        re = new RegExp("\\{", "g"); tstr = String(tstr).replace(re, "AInfo[\"");
        re = new RegExp("\\}", "g"); tstr = String(tstr).replace(re, "\"]");
    }
    return String(tstr);
}

function pairObj(actID) {
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
        if (loadArr.length < 2 || loadArr.length > 3) {
            logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
        }
        else {
            this.cri = loadArr[0];
            this.act = loadArr[1];
            this.elseact = loadArr[2];

            if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

            var a = loadArr[1];
            var bb = a.indexOf("branch");
            while (!enableVariableBranching && bb >= 0) {
                var cc = a.substring(bb);
                var dd = cc.indexOf("\")");
                this.branch.push(cc.substring(8, dd));
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

function logMessage(dstr) {
    message += dstr + br;
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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


function addAddressCondition(addNum, cType, cStatus, cDesc, cComment, cImpact)
//if addNum is null, condition is added to all addresses on CAP
{
    if (!addNum) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var Adds = capAddResult.getOutput();
            for (zz in Adds) {

                if (Adds[zz].getRefAddressId()) {
                    var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

                    if (addAddCondResult.getSuccess()) {
                        logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
                    }
                }
            }
        }
    }
    else {
        var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


        if (addAddCondResult.getSuccess()) {
            logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
        }
    }
}


function addAllFees(fsched, fperiod, fqty, finvoice) // Adds all fees for a given fee schedule
{
    var arrFees = aa.finance.getFeeItemList(null, fsched, null).getOutput();
    for (xx in arrFees) {
        var feeCod = arrFees[xx].getFeeCod();
        var assessFeeResult = aa.finance.createFeeItem(capId, fsched, feeCod, fperiod, fqty);
        if (assessFeeResult.getSuccess()) {
            var feeSeq = assessFeeResult.getOutput();
            logMessage("Added Fee " + feeCod + ", Qty " + fqty);
            logDebug("The assessed fee Sequence Number " + feeSeq);
            if (finvoice == "Y") {
                feeSeqList.push(feeSeq);
                paymentPeriodList.push(fperiod);
            }
        }
        else {
            logDebug("**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
        }
    } // for xx
} // function

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {
        logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact) {
    // Optional 6th argument is license number, otherwise add to all CAEs on CAP
    refLicArr = new Array();
    if (arguments.length == 6) // License Number provided
    {
        refLicArr.push(getRefLicenseProf(arguments[5]));
    }
    else // adding to cap lic profs
    {
        var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
        if (capLicenseResult.getSuccess())
        { var refLicArr = capLicenseResult.getOutput(); }
        else
        { logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
    }

    for (var refLic in refLicArr) {
        if (arguments.length == 6) // use sequence number
            licSeq = refLicArr[refLic].getLicSeqNbr();
        else
            licSeq = refLicArr[refLic].getLicenseNbr();

        var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

        if (addCAEResult.getSuccess()) {
            logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
        }
    }
}

function addLookup(stdChoice, stdValue, stdDesc) {
    //check if stdChoice and stdValue already exist; if they do, don't add
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        logDebug("Standard Choices Item " + stdChoice + " and Value " + stdValue + " already exist.  Lookup is not added or updated.");
        return false;
    }

    //Proceed to add
    var strControl;

    if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length) {
        var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

        if (bizDomScriptResult.getSuccess())

        //check if new Std Choice actually created



            logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        else
            logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
    }
    else
        logDebug("Could not create std choice, one or more null values");
}

function addParcelCondition(parcelNum, cType, cStatus, cDesc, cComment, cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
{
    if (!parcelNum) {
        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addParcelCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                    logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                }
                else {
//                rr) {
//            var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
//            for (z1 in proxObj) {
//                var v = proxObj[z1].getAttributeValues()
//                retString = v[0];
            }

        }
    }
    return retString
}

// function getInspector: returns the inspector ID (string) of the scheduled inspection.  Returns the first result
//
function getInspector(insp2Check) {
    var inspResultObj = aa.inspection.getInspections(capId);
    if (inspResultObj.getSuccess()) {
        inspList = inspResultObj.getOutput();
        for (xx in inspList)
            if (String(insp2Check).equals(inspList[xx].getInspectionType())) {
            // have to re-grab the user since the id won't show up in this object.
            inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(), inspList[xx].getInspector().getMiddleName(), inspList[xx].getInspector().getLastName()).getOutput();
            return inspUserObj.getUserID();
        }
    }
    return false;
}

function getLastInspector(insp2Check)
// function getLastInspector: returns the inspector ID (string) of the last inspector to result the inspection.
//
{
    var inspResultObj = aa.inspection.getInspections(capId);
    if (inspResultObj.getSuccess()) {
        inspList = inspResultObj.getOutput();

        inspList.sort(compareInspDateDesc)
        for (xx in inspList)
            if (String(insp2Check).equals(inspList[xx].getInspectionType()) && !inspList[xx].getInspectionStatus().equals("Scheduled")) {
            // have to re-grab the user since the id won't show up in this object.
            inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(), inspList[xx].getInspector().getMiddleName(), inspList[xx].getInspector().getLastName()).getOutput();
            return inspUserObj.getUserID();
        }
    }
    return null;
}

function compareInspDateDesc(a, b) { return (a.getScheduledDate().getEpochMilliseconds() < b.getScheduledDate().getEpochMilliseconds()); }
function getNode(fString, fName) {
    var fValue = "";
    var startTag = "<" + fName + ">";
    var endTag = "</" + fName + ">";

    startPos = fString.indexOf(startTag) + startTag.length;
    endPos = fString.indexOf(endTag);
    // make sure startPos and endPos are valid before using them
    if (startPos > 0 && startPos < endPos)
        fValue = fString.substring(startPos, endPos);

    return unescape(fValue);
}

function getParent() {
    // returns the capId object of the parent.  Assumes only one parent!
    //
	var itemCap = capId;
	if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

    getCapResult = aa.cap.getProjectParents(itemCap, 1);
    if (getCapResult.getSuccess()) {
        parentArray = getCapResult.getOutput();
        if (parentArray.length)
            return parentArray[0].getCapID();
        else {
            logDebug("**WARNING: GetParent found no project parent for this application");
            return false;
        }
    }
    else {
        logDebug("**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
        return false;
    }
}

function getProp(fString, fName) {
    var fValue = "";
    var startTag = fName + "='";
    var endTag = "'";
    startPos = fString.indexOf(startTag) + startTag.length;
    if (startPos > 0)
        fValue = fString.substring(startPos);

    endPos = fValue.indexOf(endTag);
    if (endPos > 0)
        fValue = fValue.substring(0, endPos);

    return unescape(fValue);
}


function getRefLicenseProf(refstlic) {
    var refLicObj = null;
    var refLicenseResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(), refstlic);
    if (!refLicenseResult.getSuccess())
    { logDebug("**ERROR retrieving Ref Lic Profs : " + refLicenseResult.getErrorMessage()); return false; }
    else {
        var newLicArray = refLicenseResult.getOutput();
        if (!newLicArray) return null;
        for (var thisLic in newLicArray)
            if (refstlic && refstlic.toUpperCase().equals(newLicArray[thisLic].getStateLicense().toUpperCase()))
            refLicObj = newLicArray[thisLic];
    }

    return refLicObj;
}
function getRelatedCapsByAddress(ats)
//
// returns and array of capids that share the same address as the current cap
//
{
    var retArr = new Array();

    // get address data
    var addResult = aa.address.getAddressByCapId(capId);
    if (addResult.getSuccess())
    { var aoArray = addResult.getOutput(); }
    else
    { logDebug("**ERROR: getting address by cap ID: " + addResult.getErrorMessage()); return false; }

    for (zzz in aoArray) {
        var ao = aoArray[zzz];
        // get caps with same address
        capAddResult = aa.cap.getCapListByDetailAddress(ao.getStreetName(), ao.getHouseNumberStart(), ao.getStreetSuffix(), null, ao.getStreetDirection(), null);
        if (capAddResult.getSuccess())
        { var capIdArray = capAddResult.getOutput(); }
        else
        { logDebug("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage()); return false; }


        // loop through related caps
        for (cappy in capIdArray) {
            // skip if current cap
            if (capId.getCustomID().equals(capIdArray[cappy].getCustomID()))
                continue;

            // get cap id
            var relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();


            // get cap type

            var reltypeArray = relcap.getCapType().toString().split("/");

            var isMatch = true;
            var ata = ats.split("/");
            if (ata.length != 4)
                logDebug("**ERROR: The following Application Type String is incorrectly formatted: " + ats);
            else
                for (xx in ata)
                if (!ata[xx].equals(reltypeArray[xx]) && !ata[xx].equals("*"))
                isMatch = false;

            if (isMatch)
                retArr.push(capIdArray[cappy]);

        } // loop through related caps

    }
    if (retArr.length > 0)
        return retArr;

}


function getRelatedCapsByParcel(ats)
//
// returns and array of capids that match parcels on the current app.  Includes all parcels.
// ats, app type string to check for
//
{
    var retArr = new Array();

    var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
    if (capParcelResult.getSuccess())
    { var Parcels = capParcelResult.getOutput().toArray(); }
    else
    { logDebug("**ERROR: getting parcels by cap ID: " + capParcelResult.getErrorMessage()); return false; }

    for (zz in Parcels) {
        var ParcelValidatedNumber = Parcels[zz].getParcelNumber();

        // get caps with same parcel
        var capAddResult = aa.cap.getCapListByParcelID(ParcelValidatedNumber, null);
        if (capAddResult.getSuccess())
        { var capIdArray = capAddResult.getOutput(); }
        else
        { logDebug("**ERROR: getting similar parcels: " + capAddResult.getErrorMessage()); return false; }

        // loop through related caps
        for (cappy in capIdArray) {
            // skip if current cap
            if (capId.getCustomID().equals(capIdArray[cappy].getCustomID()))
                continue;

            // get cap ids
            var relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();
            // get cap type
            var reltypeArray = relcap.getCapType().toString().split("/");

            var isMatch = true;
            var ata = ats.split("/");
            if (ata.length != 4)
                logDebug("**ERROR: The following Application Type String is incorrectly formatted: " + ats);
            else
                for (xx in ata)
                if (!ata[xx].equals(reltypeArray[xx]) && !ata[xx].equals("*"))
                isMatch = false;

            if (isMatch)
                retArr.push(capIdArray[cappy]);

        } // loop through related caps
    }

    if (retArr.length > 0 )
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth, pDay, pYear, pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
{
    var mth = "";
    var day = "";
    var ret = "";
    if (pMonth > 10)
        mth = pMonth.toString();
    else
        mth = "0" + pMonth.toString();

    if (pDay > 10)
        day = pDay.toString();
    else
        day = "0" + pDay.toString();

    if (pFormat == "YYYY-MM-DD")
        ret = pYear.toString() + "-" + mth + "-" + day;
    else
        ret = "" + mth + "/" + day + "/" + pYear.toString();

    return ret;
}

function logGlobals(globArray) {

    for (loopGlob in globArray)
        logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
}

function getCapId() {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
        return true;

}

//
// exists:  return true if Value is in Array
//
//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl) {
    var actArray = new Array();
    var maxLength = String("" + maxEntries).length;

    for (var count = 1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
    {
        var countstr = "000000" + count;
        countstr = String(countstr).substring(countstr.length, countstr.length - maxLength);
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl, countstr);

        if (bizDomScriptResult.getSuccess()) {
            bizDomScriptObj = bizDomScriptResult.getOutput();
            var myObj = new pairObj(bizDomScriptObj.getBizdomainValue());
            myObj.load(bizDomScriptObj.getDescription());
            if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
            actArray.push(myObj);
        }
        else {
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

function docWrite(dstr, header, indent) {
    var istr = "";
    for (i = 0; i < indent; i++)
        istr += "|  ";
    if (header && dstr)
        aa.print(istr + "------------------------------------------------");
    if (dstr) aa.print(istr + dstr);
    if (header)
        aa.print(istr + "------------------------------------------------");
}


function token(tstr) {
    if (!disableTokens) {
        re = new RegExp("\\{", "g"); tstr = String(tstr).replace(re, "AInfo[\"");
        re = new RegExp("\\}", "g"); tstr = String(tstr).replace(re, "\"]");
    }
    return String(tstr);
}

function pairObj(actID) {
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
        if (loadArr.length < 2 || loadArr.length > 3) {
            logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
        }
        else {
            this.cri = loadArr[0];
            this.act = loadArr[1];
            this.elseact = loadArr[2];

            if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

            var a = loadArr[1];
            var bb = a.indexOf("branch");
            while (!enableVariableBranching && bb >= 0) {
                var cc = a.substring(bb);
                var dd = cc.indexOf("\")");
                this.branch.push(cc.substring(8, dd));
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

function logMessage(dstr) {
    message += dstr + br;
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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


function addAddressCondition(addNum, cType, cStatus, cDesc, cComment, cImpact)
//if addNum is null, condition is added to all addresses on CAP
{
    if (!addNum) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var Adds = capAddResult.getOutput();
            for (zz in Adds) {

                if (Adds[zz].getRefAddressId()) {
                    var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

                    if (addAddCondResult.getSuccess()) {
                        logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
                    }
                }
            }
        }
    }
    else {
        var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


        if (addAddCondResult.getSuccess()) {
            logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
        }
    }
}


function addAllFees(fsched, fperiod, fqty, finvoice) // Adds all fees for a given fee schedule
{
    var arrFees = aa.finance.getFeeItemList(null, fsched, null).getOutput();
    for (xx in arrFees) {
        var feeCod = arrFees[xx].getFeeCod();
        var assessFeeResult = aa.finance.createFeeItem(capId, fsched, feeCod, fperiod, fqty);
        if (assessFeeResult.getSuccess()) {
            var feeSeq = assessFeeResult.getOutput();
            logMessage("Added Fee " + feeCod + ", Qty " + fqty);
            logDebug("The assessed fee Sequence Number " + feeSeq);
            if (finvoice == "Y") {
                feeSeqList.push(feeSeq);
                paymentPeriodList.push(fperiod);
            }
        }
        else {
            logDebug("**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
        }
    } // for xx
} // function

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {
        logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact) {
    // Optional 6th argument is license number, otherwise add to all CAEs on CAP
    refLicArr = new Array();
    if (arguments.length == 6) // License Number provided
    {
        refLicArr.push(getRefLicenseProf(arguments[5]));
    }
    else // adding to cap lic profs
    {
        var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
        if (capLicenseResult.getSuccess())
        { var refLicArr = capLicenseResult.getOutput(); }
        else
        { logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
    }

    for (var refLic in refLicArr) {
        if (arguments.length == 6) // use sequence number
            licSeq = refLicArr[refLic].getLicSeqNbr();
        else
            licSeq = refLicArr[refLic].getLicenseNbr();

        var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

        if (addCAEResult.getSuccess()) {
            logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
        }
    }
}

function addLookup(stdChoice, stdValue, stdDesc) {
    //check if stdChoice and stdValue already exist; if they do, don't add
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        logDebug("Standard Choices Item " + stdChoice + " and Value " + stdValue + " already exist.  Lookup is not added or updated.");
        return false;
    }

    //Proceed to add
    var strControl;

    if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length) {
        var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

        if (bizDomScriptResult.getSuccess())

        //check if new Std Choice actually created



            logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        else
            logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
    }
    else
        logDebug("Could not create std choice, one or more null values");
}

function addParcelCondition(parcelNum, cType, cStatus, cDesc, cComment, cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
{
    if (!parcelNum) {
        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addParcelCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                    logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                }
                else {
                     if (workVals[0] > capval)
                return saveVal;
            else
                if (valNumber == 1)
                saveVal = workVals[valNumber];
            else {
                saveVal = parseInt((capval - workVals[0]) / 100);
                if ((capval - workVals[0]) % 100 > 0) saveVal++;
                saveVal = saveVal * workVals[valNumber];
            }
        }
    }
    return saveVal;
}


function loopTask(wfstr, wfstat, wfcomment, wfnote) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 5) {
        processName = arguments[4]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    if (!wfstat) wfstat = "NA";

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
            var dispositionDate = aa.date.getCurrentDate();
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();

            if (useProcess)
                aa.workflow.handleDisposition(capId, stepnumber, processID, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "L");
            else
                aa.workflow.handleDisposition(capId, stepnumber, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "L");

            logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Looping...");
            logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Looping...");
        }
    }
}

function nextWorkDay(td)
// uses app server to return the next work day.
// Only available in 6.3.2
// td can be "mm/dd/yyyy" (or anything that will convert to JS date)
{

    if (!td)
        dDate = new Date();
    else
        dDate = new Date(td);

    if (!aa.calendar.getNextWorkDay) {
        logDebug("getNextWorkDay function is only available in Accela Automation 6.3.2 or higher.");
    }
    else {
        var dDate = new Date(aa.calendar.getNextWorkDay(aa.date.parseDate(dDate.getMonth() + 1 + "/" + dDate.getDate() + "/" + dDate.getFullYear())).getOutput().getTime());
    }

    return (dDate.getMonth() + 1) + "/" + dDate.getDate() + "/" + dDate.getFullYear(); ;
}


function openUrlInNewWindow(myurl) {
    //
    // showDebug or showMessage must be true for this to work
    //
    newurl = "<SCRIPT LANGUAGE=\"JavaScript\">\r\n<!--\r\n newwin = window.open(\""
    newurl += myurl
    newurl += "\"); \r\n  //--> \r\n </SCRIPT>"

    comment(newurl)
}

function parcelConditionExists(condtype) {
    var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
    if (!capParcelResult.getSuccess())
    { logDebug("**WARNING: error getting cap parcels : " + capParcelResult.getErrorMessage()); return false }

    var Parcels = capParcelResult.getOutput().toArray();
    for (zz in Parcels) {
        pcResult = aa.parcelCondition.getParcelConditions(Parcels[zz].getParcelNumber());
        if (!pcResult.getSuccess())
        { logDebug("**WARNING: error getting parcel conditions : " + pcResult.getErrorMessage()); return false }
        pcs = pcResult.getOutput();
        for (pc1 in pcs)
            if (pcs[pc1].getConditionType().equals(condtype)) return true;
    }
}

function paymentGetNotAppliedTot() //gets total Amount Not Applied on current CAP
{
    var amtResult = aa.cashier.getSumNotAllocated(capId);
    if (amtResult.getSuccess()) {
        var appliedTot = amtResult.getOutput();
        //logDebug("Total Amount Not Applied = $"+appliedTot.toString());
        return parseFloat(appliedTot);
    }
    else {
        logDebug("**ERROR: Getting total not applied: " + amtResult.getErrorMessage());
        return false;
    }
    return false;
}

function proximity(svc, layer, numDistance)  // optional: distanceType
{
    // returns true if the app has a gis object in proximity
    // use with all events except ApplicationSubmitBefore
    // 6/20/07 JHS - Changed errors to Warnings in case GIS server unavailable.

    var distanceType = "feet"
    if (arguments.length == 4) distanceType = arguments[3]; // use distance type in arg list

    var bufferTargetResult = aa.gis.getGISType(svc, layer); // get the buffer target
    if (bufferTargetResult.getSuccess()) {
        var buf = bufferTargetResult.getOutput();
        buf.addAttributeName(layer + "_ID");
    }
    else
    { logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()); return false }

    var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
    if (gisObjResult.getSuccess())
        var fGisObj = gisObjResult.getOutput();
    else
    { logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()); return false }

    for (a1 in fGisObj) // for each GIS object on the Cap
    {
        var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

        if (bufchk.getSuccess())
            var proxArr = bufchk.getOutput();
        else
        { logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()); return false }

        for (a2 in proxArr) {
            var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
            if (proxObj.length) {
                return true;
            }
        }
    }
}

function proximityToAttribute(svc, layer, numDistance, distanceType, attributeName, attributeValue) {
    // returns true if the app has a gis object in proximity that contains the attributeName = attributeValue
    // use with all events except ApplicationSubmitBefore
    // example usage:
    // 01 proximityToAttribute("flagstaff","Parcels","50","feet","BOOK","107") ^ DoStuff...

    var bufferTargetResult = aa.gis.getGISType(svc, layer); // get the buffer target
    if (bufferTargetResult.getSuccess()) {
        var buf = bufferTargetResult.getOutput();
        buf.addAttributeName(attributeName);
    }
    else
    { logDebug("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()); return false }

    var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
    if (gisObjResult.getSuccess())
        var fGisObj = gisObjResult.getOutput();
    else
    { logDebug("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()); return false }

    for (a1 in fGisObj) // for each GIS object on the Cap
    {
        var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

        if (bufchk.getSuccess())
            var proxArr = bufchk.getOutput();
        else
        { logDebug("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()); return false }

        for (a2 in proxArr) {
            proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
            for (z1 in proxObj) {
                var v = proxObj[z1].getAttributeValues()
                retString = v[0];

                if (retString && retString.equals(attributeValue))
                    return true;
            }

        }
    }
}

function refLicProfGetAttribute(pLicNum, pAttributeName) {
    //Gets value of custom attribute from reference license prof record
    //07SSP-00033/SP5014

    //validate parameter values
    if (pLicNum == null || pLicNum.length ==0)
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth, pDay, pYear, pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
{
    var mth = "";
    var day = "";
    var ret = "";
    if (pMonth > 10)
        mth = pMonth.toString();
    else
        mth = "0" + pMonth.toString();

    if (pDay > 10)
        day = pDay.toString();
    else
        day = "0" + pDay.toString();

    if (pFormat == "YYYY-MM-DD")
        ret = pYear.toString() + "-" + mth + "-" + day;
    else
        ret = "" + mth + "/" + day + "/" + pYear.toString();

    return ret;
}

function logGlobals(globArray) {

    for (loopGlob in globArray)
        logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
}

function getCapId() {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
        return true;

}

//
// exists:  return true if Value is in Array
//
//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl) {
    var actArray = new Array();
    var maxLength = String("" + maxEntries).length;

    for (var count = 1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
    {
        var countstr = "000000" + count;
        countstr = String(countstr).substring(countstr.length, countstr.length - maxLength);
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl, countstr);

        if (bizDomScriptResult.getSuccess()) {
            bizDomScriptObj = bizDomScriptResult.getOutput();
            var myObj = new pairObj(bizDomScriptObj.getBizdomainValue());
            myObj.load(bizDomScriptObj.getDescription());
            if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
            actArray.push(myObj);
        }
        else {
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

function docWrite(dstr, header, indent) {
    var istr = "";
    for (i = 0; i < indent; i++)
        istr += "|  ";
    if (header && dstr)
        aa.print(istr + "------------------------------------------------");
    if (dstr) aa.print(istr + dstr);
    if (header)
        aa.print(istr + "------------------------------------------------");
}


function token(tstr) {
    if (!disableTokens) {
        re = new RegExp("\\{", "g"); tstr = String(tstr).replace(re, "AInfo[\"");
        re = new RegExp("\\}", "g"); tstr = String(tstr).replace(re, "\"]");
    }
    return String(tstr);
}

function pairObj(actID) {
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
        if (loadArr.length < 2 || loadArr.length > 3) {
            logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
        }
        else {
            this.cri = loadArr[0];
            this.act = loadArr[1];
            this.elseact = loadArr[2];

            if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

            var a = loadArr[1];
            var bb = a.indexOf("branch");
            while (!enableVariableBranching && bb >= 0) {
                var cc = a.substring(bb);
                var dd = cc.indexOf("\")");
                this.branch.push(cc.substring(8, dd));
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

function logMessage(dstr) {
    message += dstr + br;
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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


function addAddressCondition(addNum, cType, cStatus, cDesc, cComment, cImpact)
//if addNum is null, condition is added to all addresses on CAP
{
    if (!addNum) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var Adds = capAddResult.getOutput();
            for (zz in Adds) {

                if (Adds[zz].getRefAddressId()) {
                    var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

                    if (addAddCondResult.getSuccess()) {
                        logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
                    }
                }
            }
        }
    }
    else {
        var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


        if (addAddCondResult.getSuccess()) {
            logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
        }
    }
}


function addAllFees(fsched, fperiod, fqty, finvoice) // Adds all fees for a given fee schedule
{
    var arrFees = aa.finance.getFeeItemList(null, fsched, null).getOutput();
    for (xx in arrFees) {
        var feeCod = arrFees[xx].getFeeCod();
        var assessFeeResult = aa.finance.createFeeItem(capId, fsched, feeCod, fperiod, fqty);
        if (assessFeeResult.getSuccess()) {
            var feeSeq = assessFeeResult.getOutput();
            logMessage("Added Fee " + feeCod + ", Qty " + fqty);
            logDebug("The assessed fee Sequence Number " + feeSeq);
            if (finvoice == "Y") {
                feeSeqList.push(feeSeq);
                paymentPeriodList.push(fperiod);
            }
        }
        else {
            logDebug("**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
        }
    } // for xx
} // function

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {
        logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact) {
    // Optional 6th argument is license number, otherwise add to all CAEs on CAP
    refLicArr = new Array();
    if (arguments.length == 6) // License Number provided
    {
        refLicArr.push(getRefLicenseProf(arguments[5]));
    }
    else // adding to cap lic profs
    {
        var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
        if (capLicenseResult.getSuccess())
        { var refLicArr = capLicenseResult.getOutput(); }
        else
        { logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
    }

    for (var refLic in refLicArr) {
        if (arguments.length == 6) // use sequence number
            licSeq = refLicArr[refLic].getLicSeqNbr();
        else
            licSeq = refLicArr[refLic].getLicenseNbr();

        var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

        if (addCAEResult.getSuccess()) {
            logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
        }
    }
}

function addLookup(stdChoice, stdValue, stdDesc) {
    //check if stdChoice and stdValue already exist; if they do, don't add
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        logDebug("Standard Choices Item " + stdChoice + " and Value " + stdValue + " already exist.  Lookup is not added or updated.");
        return false;
    }

    //Proceed to add
    var strControl;

    if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length) {
        var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

        if (bizDomScriptResult.getSuccess())

        //check if new Std Choice actually created



            logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        else
            logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
    }
    else
        logDebug("Could not create std choice, one or more null values");
}

function addParcelCondition(parcelNum, cType, cStatus, cDesc, cComment, cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
{
    if (!parcelNum) {
        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addParcelCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                    logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                }
                else {
                t work description: " + workDescResult.getErrorMessage());
        return false;
    }

    var workDesScriptObj = workDescResult.getOutput();
    if (workDesScriptObj)
        workDesObj = workDesScriptObj.getCapWorkDesModel()
    else {
        aa.print("**ERROR: Failed to get workdes Obj: " + workDescResult.getErrorMessage());
        return false;
    }


    workDesObj.setDescription(newWorkDes);
    aa.cap.editCapWorkDes(workDesObj);

    aa.print("Updated Work Description to : " + newWorkDes);

}
function validateGisObjects() {
    // returns true if the app has GIS objects that validate in GIS
    //
    var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
    if (gisObjResult.getSuccess())
        var fGisObj = gisObjResult.getOutput();
    else
    { logDebug("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()); return false }

    for (a1 in fGisObj) // for each GIS object on the Cap
    {
        var gischk = aa.gis.getGISObjectAttributes(fGisObj[a1]);

        if (gischk.getSuccess())
            var gisres = gischk.getOutput();
        else
        { logDebug("**ERROR: Retrieving GIS Attributes.  Reason is: " + gischk.getErrorType() + ":" + gischk.getErrorMessage()); return false }

        if (gisres != null)
            return true;  // we have a gis object from GIS
    }
}

function workDescGet(pCapId) {
    //Gets work description
    //07SSP-00037/SP5017
    //
    var workDescResult = aa.cap.getCapWorkDesByPK(pCapId);

    if (!workDescResult.getSuccess()) {
        logMessage("**ERROR: Failed to get work description: " + workDescResult.getErrorMessage());
        return false;
    }

    var workDescObj = workDescResult.getOutput();
    var workDesc = workDescObj.getDescription();

    return workDesc;
}




function loadFees()  // option CapId
{
    //  load the fees into an array of objects.  Does not
    var itemCap = capId
    if (arguments.length > 0) {
        ltcapidstr = arguments[0]; // use cap ID specified in args
        if (typeof (ltcapidstr) == "string") {
            var ltresult = aa.cap.getCapID(ltcapidstr);
            if (ltresult.getSuccess())
                itemCap = ltresult.getOutput();
            else
            { aa.print("**ERROR: Failed to get cap ID: " + ltcapidstr + " error: " + ltresult.getErrorMessage()); return false; }
        }
        else
            itemCap = ltcapidstr;
    }

    aa.print("loading fees for cap " + itemCap.getCustomID());
    var feeArr = new Array();

    var feeResult = aa.fee.getFeeItems(itemCap);
    if (feeResult.getSuccess())
    { var feeObjArr = feeResult.getOutput(); }
    else
    { aa.print("**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

    for (ff in feeObjArr) {
        fFee = feeObjArr[ff];
        var myFee = new Fee();
        var amtPaid = 0;

        var pfResult = aa.finance.getPaymentFeeItems(itemCap, null);
        if (pfResult.getSuccess()) {
            var pfObj = pfResult.getOutput();
            for (ij in pfObj)
                if (fFee.getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
                amtPaid += pfObj[ij].getFeeAllocation()
        }

        myFee.sequence = fFee.getFeeSeqNbr();
        myFee.code = fFee.getFeeCod();
        myFee.sched = fFee.getF4FeeItemModel().getFeeSchudle();
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
        myFee.calcFlag = fFee.getCalcFlag(); ;
        myFee.calcProc = fFee.getFeeCalcProc();

        feeArr.push(myFee)
    }

    return feeArr;
}


//////////////////

function Fee() // Fee Object
{
    this.sequence = null;
    this.code = null;
    this.sched = null;
    this.description = null;  // getFeeDescription()
    this.unit = null; //  getFeeUnit()
    this.amount = null; //  getFee()
    this.amountPaid = null;
    this.applyDate = null; // getApplyDate()
    this.effectDate = null; // getEffectDate();
    this.expireDate = null; // getExpireDate();
    this.status = null; // getFeeitemStatus()
    this.recDate = null;
    this.period = null; // getPaymentPeriod()
    this.display = null; // getDisplay()
    this.accCodeL1 = null; // getAccCodeL1()
    this.accCodeL2 = null; // getAccCodeL2()
    this.accCodeL3 = null; // getAccCodeL3()
    this.formula = null; // getFormula()
    this.udes = null; // String getUdes()
    this.UDF1 = null; // getUdf1()
    this.UDF2 = null; // getUdf2()
    this.UDF3 = null; // getUdf3()
    this.UDF4 = null; // getUdf4()
    this.subGroup = null; // getSubGroup()
    this.calcFlag = null; // getCalcFlag();
    this.calcProc = null; // getFeeCalcProc()
    this.auditDate = null; // getAuditDate()
    this.auditID = null; // getAuditID()
    this.auditStatus = null; // getAuditStatus()
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Custom for Abu Dhabi
//
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth, pDay, pYear, pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
{
    var mth = "";
    var day = "";
    var ret = "";
    if (pMonth > 10)
        mth = pMonth.toString();
    else
        mth = "0" + pMonth.toString();

    if (pDay > 10)
        day = pDay.toString();
    else
        day = "0" + pDay.toString();

    if (pFormat == "YYYY-MM-DD")
        ret = pYear.toString() + "-" + mth + "-" + day;
    else
        ret = "" + mth + "/" + day + "/" + pYear.toString();

    return ret;
}

function logGlobals(globArray) {

    for (loopGlob in globArray)
        logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
}

function getCapId() {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
        return true;

}

//
// exists:  return true if Value is in Array
//
//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl) {
    var actArray = new Array();
    var maxLength = String("" + maxEntries).length;

    for (var count = 1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
    {
        var countstr = "000000" + count;
        countstr = String(countstr).substring(countstr.length, countstr.length - maxLength);
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl, countstr);

        if (bizDomScriptResult.getSuccess()) {
            bizDomScriptObj = bizDomScriptResult.getOutput();
            var myObj = new pairObj(bizDomScriptObj.getBizdomainValue());
            myObj.load(bizDomScriptObj.getDescription());
            if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
            actArray.push(myObj);
        }
        else {
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

function docWrite(dstr, header, indent) {
    var istr = "";
    for (i = 0; i < indent; i++)
        istr += "|  ";
    if (header && dstr)
        aa.print(istr + "------------------------------------------------");
    if (dstr) aa.print(istr + dstr);
    if (header)
        aa.print(istr + "------------------------------------------------");
}


function token(tstr) {
    if (!disableTokens) {
        re = new RegExp("\\{", "g"); tstr = String(tstr).replace(re, "AInfo[\"");
        re = new RegExp("\\}", "g"); tstr = String(tstr).replace(re, "\"]");
    }
    return String(tstr);
}

function pairObj(actID) {
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
        if (loadArr.length < 2 || loadArr.length > 3) {
            logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
        }
        else {
            this.cri = loadArr[0];
            this.act = loadArr[1];
            this.elseact = loadArr[2];

            if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

            var a = loadArr[1];
            var bb = a.indexOf("branch");
            while (!enableVariableBranching && bb >= 0) {
                var cc = a.substring(bb);
                var dd = cc.indexOf("\")");
                this.branch.push(cc.substring(8, dd));
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

function logMessage(dstr) {
    message += dstr + br;
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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


function addAddressCondition(addNum, cType, cStatus, cDesc, cComment, cImpact)
//if addNum is null, condition is added to all addresses on CAP
{
    if (!addNum) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var Adds = capAddResult.getOutput();
            for (zz in Adds) {

                if (Adds[zz].getRefAddressId()) {
                    var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

                    if (addAddCondResult.getSuccess()) {
                        logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
                    }
                }
            }
        }
    }
    else {
        var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


        if (addAddCondResult.getSuccess()) {
            logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
        }
    }
}


function addAllFees(fsched, fperiod, fqty, finvoice) // Adds all fees for a given fee schedule
{
    var arrFees = aa.finance.getFeeItemList(null, fsched, null).getOutput();
    for (xx in arrFees) {
        var feeCod = arrFees[xx].getFeeCod();
        var assessFeeResult = aa.finance.createFeeItem(capId, fsched, feeCod, fperiod, fqty);
        if (assessFeeResult.getSuccess()) {
            var feeSeq = assessFeeResult.getOutput();
            logMessage("Added Fee " + feeCod + ", Qty " + fqty);
            logDebug("The assessed fee Sequence Number " + feeSeq);
            if (finvoice == "Y") {
                feeSeqList.push(feeSeq);
                paymentPeriodList.push(fperiod);
            }
        }
        else {
            logDebug("**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
        }
    } // for xx
} // function

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {
        logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact) {
    // Optional 6th argument is license number, otherwise add to all CAEs on CAP
    refLicArr = new Array();
    if (arguments.length == 6) // License Number provided
    {
        refLicArr.push(getRefLicenseProf(arguments[5]));
    }
    else // adding to cap lic profs
    {
        var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
        if (capLicenseResult.getSuccess())
        { var refLicArr = capLicenseResult.getOutput(); }
        else
        { logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
    }

    for (var refLic in refLicArr) {
        if (arguments.length == 6) // use sequence number
            licSeq = refLicArr[refLic].getLicSeqNbr();
        else
            licSeq = refLicArr[refLic].getLicenseNbr();

        var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

        if (addCAEResult.getSuccess()) {
            logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
        }
    }
}

function addLookup(stdChoice, stdValue, stdDesc) {
    //check if stdChoice and stdValue already exist; if they do, don't add
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        logDebug("Standard Choices Item " + stdChoice + " and Value " + stdValue + " already exist.  Lookup is not added or updated.");
        return false;
    }

    //Proceed to add
    var strControl;

    if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length) {
        var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

        if (bizDomScriptResult.getSuccess())

        //check if new Std Choice actually created



            logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        else
            logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
    }
    else
        logDebug("Could not create std choice, one or more null values");
}

function addParcelCondition(parcelNum, cType, cStatus, cDesc, cComment, cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
{
    if (!parcelNum) {
        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addParcelCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                    logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                }
                else {
                nths = numMonths - (addYears * 12);
    var newMonth = startDate.getMonth() + addMonths;
    if (startDate.getMonth() + addMonths > 11) {
        ++addYears;
        newMonth = startDate.getMonth() + addMonths - 12;
    }
    var newDate = new Date(startDate.getFullYear() + addYears, newMonth, startDate.getDate(), startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());

    // adjust to correct month
    while (newDate.getMonth() != newMonth) {
        newDate = addMonthsToDate(newDate, -1);
    }

    return newDate;
}

function getParentLicenseCapID(capid) {
    if (capid == null || aa.util.instanceOfString(capid)) {
        return null;
    }
    var workingCapID = capid // use the cap id.  if this is ACA we will get the EST cap
    var result = aa.cap.getProjectByChildCapID(capid, "EST", null);
    if (result.getSuccess()) {
        projectScriptModels = result.getOutput();
        if (projectScriptModels == null || projectScriptModels.length == 0) {
            aa.print("ERROR: Failed to get partial CAP with CAPID(" + capid + ")");
            return null;
        }
        //2. Get original partial CAP ID from project Model
        projectScriptModel = projectScriptModels[0];
        workingCapID = projectScriptModel.getProjectID();
    }

    //3. Get parent license CAPID from renewal CAP table
    var result2 = aa.cap.getProjectByChildCapID(workingCapID, "Renewal", null);
    if (result2.getSuccess()) {
        licenseProjects = result2.getOutput();
        if (licenseProjects == null || licenseProjects.length == 0) {
            aa.print("ERROR: Failed to get parent CAP with partial CAPID(" + workingCapID + ")");
            return null;
        }
        licenseProject = licenseProjects[0];
        //4. Return parent license CAP ID.
        return licenseProject.getProjectID();
    }
    else {
        aa.print("ERROR: Failed to get partial CAP by child CAP(" + workingCapID + "): " + result2.getErrorMessage());
        return null;
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
		aa.print("using address " + useAddress)
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
            logDebug("WARN
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth, pDay, pYear, pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
{
    var mth = "";
    var day = "";
    var ret = "";
    if (pMonth > 10)
        mth = pMonth.toString();
    else
        mth = "0" + pMonth.toString();

    if (pDay > 10)
        day = pDay.toString();
    else
        day = "0" + pDay.toString();

    if (pFormat == "YYYY-MM-DD")
        ret = pYear.toString() + "-" + mth + "-" + day;
    else
        ret = "" + mth + "/" + day + "/" + pYear.toString();

    return ret;
}

function logGlobals(globArray) {

    for (loopGlob in globArray)
        logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
}

function getCapId() {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
        return true;

}

//
// exists:  return true if Value is in Array
//
//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl) {
    var actArray = new Array();
    var maxLength = String("" + maxEntries).length;

    for (var count = 1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
    {
        var countstr = "000000" + count;
        countstr = String(countstr).substring(countstr.length, countstr.length - maxLength);
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl, countstr);

        if (bizDomScriptResult.getSuccess()) {
            bizDomScriptObj = bizDomScriptResult.getOutput();
            var myObj = new pairObj(bizDomScriptObj.getBizdomainValue());
            myObj.load(bizDomScriptObj.getDescription());
            if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
            actArray.push(myObj);
        }
        else {
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

function docWrite(dstr, header, indent) {
    var istr = "";
    for (i = 0; i < indent; i++)
        istr += "|  ";
    if (header && dstr)
        aa.print(istr + "------------------------------------------------");
    if (dstr) aa.print(istr + dstr);
    if (header)
        aa.print(istr + "------------------------------------------------");
}


function token(tstr) {
    if (!disableTokens) {
        re = new RegExp("\\{", "g"); tstr = String(tstr).replace(re, "AInfo[\"");
        re = new RegExp("\\}", "g"); tstr = String(tstr).replace(re, "\"]");
    }
    return String(tstr);
}

function pairObj(actID) {
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
        if (loadArr.length < 2 || loadArr.length > 3) {
            logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
        }
        else {
            this.cri = loadArr[0];
            this.act = loadArr[1];
            this.elseact = loadArr[2];

            if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

            var a = loadArr[1];
            var bb = a.indexOf("branch");
            while (!enableVariableBranching && bb >= 0) {
                var cc = a.substring(bb);
                var dd = cc.indexOf("\")");
                this.branch.push(cc.substring(8, dd));
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

function logMessage(dstr) {
    message += dstr + br;
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
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


function addAddressCondition(addNum, cType, cStatus, cDesc, cComment, cImpact)
//if addNum is null, condition is added to all addresses on CAP
{
    if (!addNum) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var Adds = capAddResult.getOutput();
            for (zz in Adds) {

                if (Adds[zz].getRefAddressId()) {
                    var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

                    if (addAddCondResult.getSuccess()) {
                        logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
                    }
                }
            }
        }
    }
    else {
        var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


        if (addAddCondResult.getSuccess()) {
            logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
        }
    }
}


function addAllFees(fsched, fperiod, fqty, finvoice) // Adds all fees for a given fee schedule
{
    var arrFees = aa.finance.getFeeItemList(null, fsched, null).getOutput();
    for (xx in arrFees) {
        var feeCod = arrFees[xx].getFeeCod();
        var assessFeeResult = aa.finance.createFeeItem(capId, fsched, feeCod, fperiod, fqty);
        if (assessFeeResult.getSuccess()) {
            var feeSeq = assessFeeResult.getOutput();
            logMessage("Added Fee " + feeCod + ", Qty " + fqty);
            logDebug("The assessed fee Sequence Number " + feeSeq);
            if (finvoice == "Y") {
                feeSeqList.push(feeSeq);
                paymentPeriodList.push(fperiod);
            }
        }
        else {
            logDebug("**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
        }
    } // for xx
} // function

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {
        logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function addLicenseCondition(cType, cStatus, cDesc, cComment, cImpact) {
    // Optional 6th argument is license number, otherwise add to all CAEs on CAP
    refLicArr = new Array();
    if (arguments.length == 6) // License Number provided
    {
        refLicArr.push(getRefLicenseProf(arguments[5]));
    }
    else // adding to cap lic profs
    {
        var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
        if (capLicenseResult.getSuccess())
        { var refLicArr = capLicenseResult.getOutput(); }
        else
        { logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
    }

    for (var refLic in refLicArr) {
        if (arguments.length == 6) // use sequence number
            licSeq = refLicArr[refLic].getLicSeqNbr();
        else
            licSeq = refLicArr[refLic].getLicenseNbr();

        var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

        if (addCAEResult.getSuccess()) {
            logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
        }
        else {
            logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
        }
    }
}

function addLookup(stdChoice, stdValue, stdDesc) {
    //check if stdChoice and stdValue already exist; if they do, don't add
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        logDebug("Standard Choices Item " + stdChoice + " and Value " + stdValue + " already exist.  Lookup is not added or updated.");
        return false;
    }

    //Proceed to add
    var strControl;

    if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length) {
        var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

        if (bizDomScriptResult.getSuccess())

        //check if new Std Choice actually created



            logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        else
            logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
    }
    else
        logDebug("Could not create std choice, one or more null values");
}

function addParcelCondition(parcelNum, cType, cStatus, cDesc, cComment, cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
{
    if (!parcelNum) {
        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
                if (addParcelCondResult.getSuccess()) {
                    logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                    logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
                }
                else {
                hisFee.period);
            var invoiceResult_L = aa.finance.createInvoice(sourceCapId, feeSeqArray, paymentPeriodArray);

            if (!invoiceResult_L.getSuccess())
                aa.print("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
        }
        else {
            addFeeWithExtraData(thisFee.code, thisFee.sched, thisFee.period, thisFee.unit, "N", targetCapId, activityID, null, activityID)

        }

    }

}

function contactArray()
{
var contactList = aa.env.getValue("ContactList");
var cArray = new Array();
if(contactList != null)
	{
	var its = contactList.iterator();

	while(its.hasNext())
		{
			var aArray = new Array();
			var peopleModel = its.next().getPeople();
			aArray["firstName"] = peopleModel.getFirstName();
			aArray["lastName"] = peopleModel.getLastName();
			aArray["contactSeqNumber"] = peopleModel.getContactSeqNumber();
			aArray["contactType"] = peopleModel.getContactType();
			aArray["relation"] = peopleModel.getRelation();
			aArray["businessName"] = peopleModel.getBusinessName();
			aArray["email"] = peopleModel.getEmail();
			aArray["phone1"] = peopleModel.getPhone1();
			aArray["phone2"] = peopleModel.getPhone2();
			aArray["phone2countrycode"] = peopleModel.getPhone2CountryCode();
			aArray["addressLine1"] = peopleModel.getCompactAddress().getAddressLine1();
			aArray["addressLine2"] = peopleModel.getCompactAddress().getAddressLine2();
			aArray["city"] = peopleModel.getCompactAddress().getCity();
			aArray["state"] = peopleModel.getCompactAddress().getState();
			aArray["zip"] = peopleModel.getCompactAddress().getZip();
			aArray["country"] = peopleModel.getCompactAddress().getCountry();
			aArray["fullName"] = peopleModel.getFullName;

			var pa = peopleModel.getAttributes().toArray();
				for (xx1 in pa)
							aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
			cArray.push(aArray);
		}
	}
	return cArray;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

function Left(str, n){
	if (n <= 0)
	    return "";
	else if (n > String(str).length)
	    return str;
	else
	    return String(str).substring(0,n);
}

function sendSMS(messageReceiver,messageBody)
	{
	/*------------------------------------------------------------------------------------------------------/
	| START Location Configurable Parameters
	|
	/------------------------------------------------------------------------------------------------------*/
	var wsURL = "https://aa.achievo.com/SMSService.asmx?op=SendSMS";
	var wsUser = ""
	var wsPassword = "";
	var wsSOAPAction = "https://aa.achievo.com/SendSMS";

	var credAgentID = ""
	var credUserName = "system"
	var credPassword = "accela"
	var messageFrom = "DPE"
	var messageUnicode = "true"
	/*------------------------------------------------------------------------------------------------------/
	| END Location Configurable Parameters
	/------------------------------------------------------------------------------------------------------*/

	soapOut = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soapenv:Envelope xmlns:soapenv=\"https://aa.achievo.com/\" xmlns:ns=\"https://aa.achievo.com/5\" xmlns:ns1=\"https://aa.achievo.com/5\"><soapenv:Header/><soapenv:Body><ns:SendSMS><ns:SendSMSRequest><ns:MessageDataContractMessagePart><ns1:From></ns1:From><ns1:Receiver></ns1:Receiver><ns1:Body></ns1:Body><ns1:IsUniCode></ns1:IsUniCode></ns:MessageDataContractMessagePart><ns:CredentialsPart><ns1:AgentId></ns1:AgentId><ns1:UserName></ns1:UserName><ns1:Password></ns1:Password></ns:CredentialsPart></ns:SendSMSRequest></ns:SendSMS></soapenv:Body></soapenv:Envelope>"

	soapOut = replaceNode(soapOut,"ns1:AgentId",credAgentID)
	soapOut = replaceNode(soapOut,"ns1:UserName",credUserName)
	soapOut = replaceNode(soapOut,"ns1:Password",credPassword)
	soapOut = replaceNode(soapOut,"ns1:From",messageFrom)
	soapOut = replaceNode(soapOut,"ns1:Receiver",messageReceiver)
	soapOut = replaceNode(soapOut,"ns1:Body",messageBody)
	soapOut = replaceNode(soapOut,"ns1:IsUniCode",messageUnicode)

	logDebug("Outbound SOAP: " + soapOut);

	returnObj = aa.util.httpPostToSoapWebService(wsURL, soapOut, wsUser, wsPassword, wsSOAPAction);

	if (!returnObj.getSuccess())
		{
		logDebug("*SOAP ERROR Type******\n" + returnObj.getErrorType() + "\n");
		logDebug("*SOAP ERROR Message******\n" + returnObj.getErrorMessage() + "\n");
		}
	else
		{
		logDebug("****** SOAP Response ******\n" + returnObj.getOutput() + "\n");
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


function getActivityNameById(actId,lang)
	{

	var bz = aa.bizDomain.getBizDomain("Activity Code").getOutput();
	lang = "" + lang;

	if (bz) bz = bz.toArray();

	if (bz)
		{
		for (var thisBz in bz)
			if (bz[thisBz] && bz[thisBz].getDescription() && bz[thisBz].getDescription().equals(actId))
				if (lang.equals("ar"))
					{
               		var arObj = aa.bizDomain.getBizDomainByValue("Activity Code",bz[thisBz].getBizdomainValue(),"ar").getOutput();
               		if (arObj) return arObj.getDispBizdomainValue();
					}
				else
					{
					return bz[thisBz].getBizdomainValue()
					}
		}

	return null;
	}