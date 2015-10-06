/*------------------------------------------------------------------------------------------------------/
| Program : ACA_AMEND_ASI_After_V1.0.js
| Event   : ACA_AMEND_ASI_After
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false; 					// Set to true to see results in popup window
var showDebug = true; 						// Set to true to see debug messages in popup window
var preExecute = "PreExecuteForAfterEvents"				// Standard choice to execute first (for globals, etc)
var controlString = "ACA Amend PageFlowScript After ASI"; 			// Standard choice for control
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



var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code
var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN"; publicUser = true }  // ignore public users
var capIDString = capId.getCustomID(); 				// alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString(); 			// Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/"); 			// Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "YYYY-MM-DD");
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

var AInfo = new Array(); 					// Create array for tokenized variables
loadAppSpecific(AInfo); 						// Add AppSpecific Info
loadTaskSpecific(AInfo); 					// Add task specific info
loadParcelAttributes(AInfo); 					// Add parcel attributes
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
logDebug("sysDate = " + sysDate.getClass());
logDebug("sysDateMMDDYYYY = " + sysDateMMDDYYYY);
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
function exists(eVal, eArray) {
    for (ii in eArray)
        if (eArray[ii] == eVal) return true;
    return false;
}

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
            if (doObj.enabled)
                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                eval(token(doObj.act));
                lastEvalTrue = true;
            }
            else {
                if (doObj.elseact)
                    eval(token(doObj.elseact));
                lastEvalTrue = false;
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
    debug += dstr + br;
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

function addFee(fcode, fsched, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args
    if (arguments.length > 5) {
        feeCap = arguments[5]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 5) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 5) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
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
                    logDebug("**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
                }
            }
        }
    }
    else {
        var addParcelCondResult = aa.paperCase()) && (pImpact == null || pImpact.toUpperCase() == cImpact.toUpperCase())) {
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


function addToASITable(tableName, tableValues) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValues is an associative array of values.  All elements MUST be strings.
    itemCap = capId
    if (arguments.length > 2)
        itemCap = arguments[2]; // use cap ID specified in args

    var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName)

    if (!tssmResult.getSuccess())
    { logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()); return false }

    var tssm = tssmResult.getOutput();
    var tsm = tssm.getAppSpecificTableModel();
    var fld = tsm.getTableField()
    var col = tsm.getColumns()
    var coli = col.iterator();

    while (coli.hasNext()) {
        colname = coli.next();
        fld.add(tableValues[colname.getColumnName()]);
    }

    tsm.setTableField(fld);

    addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
    if (!addResult.getSuccess())
    { logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()); return false }
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
        var apsArray = getCapResult.getOutput();
    else
    { logDebug("**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()); return null }

    for (aps in apsArray) {
        var myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();
        if (myCap.getSpecialText())
            if (myCap.getSpecialText().toUpperCase().equals(gaName.toUpperCase()) && !capIDString.equals(apsArray[aps].getCapID().getCustomID()))
            return false;
    }
    return true;
}


function assignCap(assignId) // option CapId
{
    var itemCap = capId
    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
    if (!cdScriptObjResult.getSuccess())
    { logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()); return false; }

    var cdScriptObj = cdScriptObjResult.getOutput();

    if (!cdScriptObj)
    { logDebug("**ERROR: No cap detail script object"); return false; }

    cd = cdScriptObj.getCapDetailModel();

    iNameResult = aa.person.getUser(assignId);

    if (!iNameResult.getSuccess())
    { logDebug("**ERROR retrieving  user model " + assignId + " : " + iNameResult.getErrorMessage()); return false; }

    iName = iNameResult.getOutput();

    cd.setAsgnDept(iName.getDeptOfUser());
    cd.setAsgnStaff(assignId);

    cdWrite = aa.cap.editCapDetail(cd)

    if (cdWrite.getSuccess())
    { logDebug("Assigned CAP to " + assignId) }
    else
    { logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()); return false; }
} function assignInspection(iNumber, iName) {
    // updates the inspection and assigns to a new user
    // requires the inspection id and the user name
    //
    iObjResult = aa.inspection.getInspection(capId, iNumber);
    if (!iObjResult.getSuccess())
    { logDebug("**ERROR retrieving inspection " + iNumber + " : " + iObjResult.getErrorMessage()); return false; }

    iObj = iObjResult.getOutput();

    iNameResult = aa.person.getUser(iName);

    if (!iNameResult.getSuccess())
    { logDebug("**ERROR retrieving inspector user model " + iName + "     var day = "";
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
function exists(eVal, eArray) {
    for (ii in eArray)
        if (eArray[ii] == eVal) return true;
    return false;
}

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
            if (doObj.enabled)
                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                eval(token(doObj.act));
                lastEvalTrue = true;
            }
            else {
                if (doObj.elseact)
                    eval(token(doObj.elseact));
                lastEvalTrue = false;
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
    debug += dstr + br;
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

function addFee(fcode, fsched, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args
    if (arguments.length > 5) {
        feeCap = arguments[5]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 5) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 5) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
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
                    logDebug("**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
                }
            }
        }
    }
    else {
        var addParcelCondResult = aa.paalc valuatn on target cap ID: " + createResult.getErrorMessage()); return false; }
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
    //Copies all contacts from pFromCapId to pToCapId
    //07SSP-00037/SP5017
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
            var newContact = Contacts[yy].getCapContactModel();
            newContact.setCapID(vToCapId);
            aa.people.createCapContact(newContact);
            copied++;
            logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
        }
    }
    else {
        logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
        return false;
    }
    return copied;
} function copyParcelGisObjects() {
    var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
    if (capParcelResult.getSuccess()) {
        var Parcels = capParcelResult.getOutput().toArray();
        for (zz in Parcels) {
            var ParcelValidatedNumber = Parcels[zz].getParcelNumber();
            logDebug("Looking at parcel " + ParcelValidatedNumber);
            var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
            if (gisObjResult.getSuccess())
                var fGisObj = gisObjResult.getOutput();
            else
            { logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()); return false }

            for (a1 in fGisObj) // for each GIS object on the Cap
            {
                var gisTypeScriptModel = fGisObj[a1];
                var gisObjArray = gisTypeScriptModel.getGISObjects()
                for (b1 in gisObjArray) {
                    var gisObjScriptModel = gisObjArray[b1];
                    var gisObjModel = gisObjScriptModel.getGisObjectModel();

                    var retval = aa.gis.addCapGISObject(capId, gisObjModel.getServiceID(), gisObjModel.getLayerId(), gisObjModel.getGisId());

                    if (retval.getSuccess())
                    { logDebug("Successfully added Cap GIS object: " + gisObjModel.getGisId()) }
                    else
                    { logDebug("**ERROR: Could not add Cap GIS Object.  Reason is: " + retval.getErrorType() + ":" + retval.getErrorMessage()); return false }
                }
            }
        }
    }
    else
    { logDebug("**ERROR: Getting Parcels from Cap.  Reason is: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage()); return false }
}

function copyParcels(pFromCapId, pToCapId) {
    //Copies all parcels from pFromCapId to pToCapId
    //If pToCapId is null, copies to current CAP
    //07SSP-00037/SP5017
    //
    if (pToCapId == null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    var capParcelResult = aa.parcel.getParcelandAttribute(pFromCapId, null);
    var copied = 0;
    if (capParcelResult.getSuccess()) {
        var Parcels = capParcelResult.getOutput().toArray();
        for (zz in Parcels) {
            var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
            newCapParcel.setParcelModel(Parcels[zz]);
            newCapParcel.setCapIDModel(vToCapId);
            newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
            newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
            aa.parcel.createCapParcel(newCapParcel);
            logDebug("Copied parcel " + Parcels[zz].getParcelNumber() + " from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
            copied++;
        }
    }
    else {
        logMessage("**ERROR: Failed to get parcels: " + capParcelResult.getErrorMessage());
        return false;
    }
    return copied;
} function copySchedInspections(pFromCapId, pToCapId) {
    //Copies all scheduled inspections from pFromCapId to pToCapId
    //If pToCapId is null, copies to current CAP
    //07SSP-00037/SP5017
    //
    if (pToCapId == null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    var inspResultObj = aa.inspection.getInspections(pFromCapId);

    if (!inspResultObj.getSuccess()) {
        logMessage("**ERROR: Failed to get inspections: " + inspResultObj.getErrorMessage());
        return false;
    }

    var inspCount = 0;
    var schedRes;
    var inspector;
    var inspDate;
    var inspTime;
    var inspType;
    var inspComment;

    var inspList = inspResultObj.getOutput();
    for (xx in inspList) {
        if ("Insp Scheduled" == inspList[xx].getDocumentDescription()) {
            inspector = inspList[xx].getInspector();
            inspDate = inspList[xx].getScheduledDate();
            inspTime = inspList[xx].getScheduledTime();
            inspType = inspList[xx].getInspectionType();
            inspComment = inspList[xx].getInspectionComments();
            schedRes = aa.inspection.scheduleInspection(vToCapId, inspector, inspDate, inspTime, inspType, inspComment);
            if (schedRes.getSuccess()) {
                logDebug("Copied scheduled inspection from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
                inspCount++;
            }
            else
                logDebug("**ERROR: copying scheduling inspection (" + inspType + "): " + schedRes.getEr    var day = "";
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
function exists(eVal, eArray) {
    for (ii in eArray)
        if (eArray[ii] == eVal) return true;
    return false;
}

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
            if (doObj.enabled)
                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                eval(token(doObj.act));
                lastEvalTrue = true;
            }
            else {
                if (doObj.elseact)
                    eval(token(doObj.elseact));
                lastEvalTrue = false;
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
    debug += dstr + br;
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

function addFee(fcode, fsched, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args
    if (arguments.length > 5) {
        feeCap = arguments[5]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 5) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 5) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
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
                    logDebug("**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
                }
            }
        }
    }
    else {
        var addParcelCondResult = aa.paeType);

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
        var fTask = wfObj[i];
        if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*") && (!useProcess || fTask.getProcessCode().equals(processName))) {
            wfObj[i].setDueDate(aa.date.parseDate(wfdate));
            var fTaskModel = wfObj[i].getTaskItem();
            var tResult = aa.workflow.adjustTaskWithNoAudit(fTaskModel);
            if (tResult.getSuccess())
                logDebug("Set Workflow Task: " + fTask.getTaskDescription() + " due Date " + wfdate);
            else
            { logMessage("**ERROR: Failed to update due date on workflow: " + tResult.getErrorMessage()); return false; }
        }
    }
}

function editTaskSpecific(wfName, itemName, itemValue)  // optional: itemCap
{
    var updated = false;
    var i = 0;
    itemCap = capId;
    if (arguments.length == 4) itemCap = arguments[3]; // use cap ID specified in args
    //
    // Get the workflows
    //
    var workflowResult = aa.workflow.getTasks(itemCap);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
    { logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    //
    // Loop through workflow tasks
    //
    for (i in wfObj) {
        fTask = wfObj[i];
        stepnumber = fTask.getStepNumber();
        processID = fTask.getProcessID();
        if (wfName.equals(fTask.getTaskDescription())) // Found the right Workflow Task
        {
            TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(itemCap, processID, stepnumber, itemName);
            if (TSIResult.getSuccess()) {
                var TSI = TSIResult.getOutput();
                if (TSI != null) {
                    var TSIArray = new Array();
                    TSInfoModel = TSI.getTaskSpecificInfoModel();
                    TSInfoModel.setChecklistComment(itemValue);
                    TSIArray.push(TSInfoModel);
                    TSIUResult = aa.taskSpecificInfo.editTaskSpecInfos(TSIArray);
                    if (TSIUResult.getSuccess()) {
                        logDebug("Successfully updated TSI Task=" + wfName + " Item=" + itemName + " Value=" + itemValue);
                        AInfo[itemName] = itemValue;  // Update array used by this script
                    }
                    else
                    { logDebug("**ERROR: Failed to Update Task Specific Info : " + TSIUResult.getErrorMessage()); return false; }
                }
                else
                    logDebug("No task specific info field called " + itemName + " found for task " + wfName);
            }
            else {
                logDebug("**ERROR: Failed to get Task Specific Info objects: " + TSIUResult.getErrorMessage());
                return false;
            }
        }  // found workflow task
    } // each task
}

function email(pToEmail, pFromEmail, pSubject, pText) {
    //Sends email to specified address
    //06SSP-00221
    //
    aa.sendMail(pFromEmail, pToEmail, "", pSubject, pText);
    logDebug("Email sent to " + pToEmail);
    return true;
}

function emailContact(mSubj, mText)   // optional: Contact Type, default Applicant
{
    var replyTo = "noreply@accela.com";
    var contactType = "Applicant"
    var emailAddress = "";

    if (arguments.length == 3) contactType = arguments[2]; // use contact type specified

    var capContactResult = aa.people.getCapContactByCapID(capId);
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts)
            if (contactType.equals(Contacts[yy].getCapContactModel().getPeople().getContactType()))
            if (Contacts[yy].getEmail() != null)
            emailAddress = Contacts[yy].getEmail();
    }

    if (emailAddress.length) {
        aa.sendMail(replyTo, emailAddress, "", mSubj, mText);
        logDebug("Successfully sent email to " + contactType);
    }
    else
        logDebug("Couldn't send email to " + contactType + ", no email address");
}

function feeAmount(feestr) {
    var feeTotal = 0;
    var feeResult = aa.fee.getFeeItems(capId);
    if (feeResult.getSuccess())
    { var feeObjArr = feeResult.getOutput(); }
    else
    { logDebug("**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

    for (ff in feeObjArr)
        if (feestr.equals(feeObjArr[ff].getFeeCod()))
        feeTotal += feeObjArr[ff].getFee()

    return feeTotal;
}


function feeBalance(feestr) {
    // Searches payment fee items and returns the unpaid balance of a fee item
    // Sums fee items if more than one exists.  Optional second parameter fee schedule
    var amtFee = 0;
    var amtPaid = 0;
    var feeSch;

    if (arguments.length == 2) feeSch = arguments[1];

    var feeResult = aa.fee.getFeeItems(capId);
    if (feeResult.getSuccess())
    { var feeObjArr = feeResult.getOutput(); }
    else
    { logDebug("**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

    for (f    var day = "";
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
function exists(eVal, eArray) {
    for (ii in eArray)
        if (eArray[ii] == eVal) return true;
    return false;
}

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
            if (doObj.enabled)
                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                eval(token(doObj.act));
                lastEvalTrue = true;
            }
            else {
                if (doObj.elseact)
                    eval(token(doObj.elseact));
                lastEvalTrue = false;
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
    debug += dstr + br;
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

function addFee(fcode, fsched, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args
    if (arguments.length > 5) {
        feeCap = arguments[5]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 5) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 5) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
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
                    logDebug("**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
                }
            }
        }
    }
    else {
        var addParcelCondResult = aa.pa

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

    if (retArr.length > 0)
        return retArr;

}

function getScheduledInspId(insp2Check) {
    // warning, returns only the first scheduled occurrence
    var inspResultObj = aa.inspection.getInspections(capId);
    if (inspResultObj.getSuccess()) {
        var inspList = inspResultObj.getOutput();
        for (xx in inspList)
            if (String(insp2Check).equals(inspList[xx].getInspectionType()) && inspList[xx].getInspectionStatus().toUpperCase().equals("SCHEDULED"))
            return inspList[xx].getIdNumber();
    }
    return false;
}

function getTaskDueDate(wfstr) // optional process name.
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*") && (!useProcess || fTask.getProcessCode().equals(processName))) {
            var dueDate = wfObj[i].getDueDate();
            if (dueDate)
                return new Date(dueDate.getMonth() + "/" + dueDate.getDayOfMonth() + "/" + dueDate.getYear());
        }
    }
}

function getTaskStatusForEmail(stask) {
    // returns a string of task statuses for a workflow group
    var returnStr = ""
    var taskResult = aa.workflow.getTasks(capId);
    if (taskResult.getSuccess())
    { var taskArr = taskResult.getOutput(); }
    else
    { logDebug("**ERROR: getting tasks : " + taskResult.getErrorMessage()); return false }

    for (xx in taskArr)
        if (taskArr[xx].getProcessCode().equals(stask) && taskArr[xx].getCompleteFlag().equals("Y")) {
        returnStr += "Task Name: " + taskArr[xx].getTaskDescription() + "\n";
        returnStr += "Task Status: " + taskArr[xx].getDisposition() + "\n";
        if (taskArr[xx].getDispositionComment() != null)
            returnStr += "Task Comments: " + taskArr[xx].getDispositionComment() + "\n";
        returnStr += "\n";
    }
    logDebug(returnStr);
    return returnStr;
}

function inspCancelAll() {
    var isCancelled = false;
    var inspResults = aa.inspection.getInspections(capId);
    if (inspResults.getSuccess()) {
        var inspAll = inspResults.getOutput();
        var inspectionId;
        var cancelResult;
        for (ii in inspAll) {
            if (inspAll[ii].getDocumentDescription().equals("Insp Scheduled") && inspAll[ii].getAuditStatus().equals("A")) {
                inspectionId = inspAll[ii].getIdNumber(); 	// Inspection identifier
                cancelResult = aa.inspection.cancelInspection(capId, inspectionId);
                if (cancelResult.getSuccess()) {
                    logMessage("Cancelling inspection: " + inspAll[ii].getInspectionType());
                    isCancelled = true;
                }
                else
                    logMessage("**ERROR", "**ERROR: Cannot cancel inspection: " + inspAll[ii].getInspectionType() + ", " + cancelResult.getErrorMessage());
            }
        }
    }
    else
        logMessage("**ERROR: getting inspections: " + inspResults.getErrorMessage());

    return isCancelled;
}

function isScheduled(inspType) {
    var found = false;
    var inspResultObj = aa.inspection.getInspections(capId);
    if (inspResultObj.getSuccess()) {
        var inspList = inspResultObj.getOutput();
        for (xx in inspList)
            if (String(inspType).equals(inspList[xx].getInspectionType()))
            found = true;
    }
    return found;
}

function isTaskActive(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName)))
            if (fTask.getActiveFlag().equals("Y"))
            return true;
        else
            return false;
    }
}

function isTaskComplete(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        fTask = wfObj[i];
        if (f    var day = "";
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
function exists(eVal, eArray) {
    for (ii in eArray)
        if (eArray[ii] == eVal) return true;
    return false;
}

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
            if (doObj.enabled)
                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                eval(token(doObj.act));
                lastEvalTrue = true;
            }
            else {
                if (doObj.elseact)
                    eval(token(doObj.elseact));
                lastEvalTrue = false;
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
    debug += dstr + br;
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

function addFee(fcode, fsched, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args
    if (arguments.length > 5) {
        feeCap = arguments[5]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 5) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 5) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
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
                    logDebug("**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
                }
            }
        }
    }
    else {
        var addParcelCondResult = aa.paf","Parcels","50","feet","BOOK","107") ^ DoStuff...

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
    if (pLicNum == null || pLicNum.length == 0 || pAttributeName == null || pAttributeName.length == 0) {
        logDebug("Invalid license number or attribute name parameter");
        return ("INVALID PARAMETER");
    }

    //get reference License Professional record

    var newLic = getRefLicenseProf(pLicNum)

    //get reference License Professional's license seq num
    var licSeqNum = 0;
    var attributeType = "";
    if (newLic) {
        licSeqNum = newLic.getLicSeqNbr();
        attributeType = newLic.getLicenseType();
        logDebug("License Seq Num: " + licSeqNum + ", License Type: " + attributeType);
    }
    else {
        logMessage("No reference licensed professional found with state license number of " + pLicNum);
        logDebug("No reference licensed professional found with state license number of " + pLicNum);
        return ("NO LICENSE FOUND");
    }

    //get ref Lic Prof custom attribute using license seq num & attribute type
    if (!(licSeqNum == 0 || licSeqNum == null || attributeType == "" || attributeType == null)) {
        var peopAttrResult = aa.people.getPeopleAttributeByPeople(licSeqNum, attributeType);
        if (!peopAttrResult.getSuccess()) {
            logDebug("**ERROR retrieving reference license professional attribute: " + peopAttrResult.getErrorMessage());
            return false;
        }

        var peopAttrArray = peopAttrResult.getOutput();
        if (peopAttrArray) {
            for (i in peopAttrArray) {
                if (pAttributeName.equals(peopAttrArray[i].getAttributeName())) {
                    logDebug("Reference record for license " + pLicNum + ", attribute " + pAttributeName + ": " + peopAttrArray[i].getAttributeValue());
                    return peopAttrArray[i].getAttributeValue();
                }
            }
            logDebug("Reference record for license " + pLicNum + " has no attribute named " + pAttributeName);
            return ("ATTRIBUTE NOT FOUND");
        }
        else {
            logDebug("Reference record for license " + pLicNum + " has no custom attributes");
            return ("ATTRIBUTE NOT FOUND");
        }
    }
    else {
        logDebug("Missing seq nbr or license type");
        return false;
    }
}
function refLicProfGetDate(pLicNum, pDateType) {
    //Returns expiration date from reference licensed professional record.  Skips disabled reference licensed professionals.
    //pDateType parameter decides which date field is returned.  Options: "EXPIRE" (default), "RENEW","ISSUE","BUSINESS","INSURANCE"
    //Internal Functions needed: convertDate(), jsDateToMMDDYYYY()
    //07SSP-00033/SP5014  Edited for SR5054A.R70925
    //
    if (pDateType == null || pDateType == "")
        var dateType = "EXPIRE";
    else {
        var dateType = pDateType.toUpperCase();
        if (!(dateType == "ISSUE" || dateType == "RENEW" || dateType == "BUSINESS" || dateType == "INSURANCE"))
            dateType = "EXPIRE";
    }

    if (pLicNum == null || pLicNum == "") {
        logDebug("Invalid license number parameter");
        return ("INVALID PARAMETER");
    }

    var newLic = getRefLicenseProf(pLicNum)

    if (newLic) {
        var jsExpDate = new Date();

        if (dateType == "EXPIRE") {
            if (newLic.getLicenseExpirationDate()) {
                jsExpDate = convertDate(newLic.getLicenseExpirationDate());
                logDebug(pLicNum + " License Expiration Date: " + jsDateToMMDDYYYY(jsExpDate));
                return jsExpDate;
            }
            else {
                logDebug("Reference record for license " + pLicNum + " has no License Expiration Date");
                return ("NO DATE FOUND");
            }
        }
        else if (dateType == "INSURANCE") {
            if (newLic.getInsuranceExpDate()) {
                jsExpDate = convertDate(newLic.getInsuranceExpDate());
                logDebug(pLicNum + " Insurance Expiration Date: " + jsDateToMMDDYYYY(jsExpDate));
                return jsExpDate;
            }
            else {
                logDebug("Reference record for license " + pLicNum + " has no Insurance Expiration Date");
                return ("NO DATE FOUND");
            }
        }
        else if (dateType == "BUSINESS") {
            if (newLic.getBusinessLicExpDate()) {
                jsExpDate = convertDate(newLic.getBusinessLicExpDate());
                logDebug(pLicNum + " Business Lic Expiration Date: " + jsDateToMMDDYYYY(jsExpDate));
                return jsExpDate;
            }
            else {
                logDebug("Reference record for license " + pLicNum + " has no Business Lic Exp Date");
                return ("NO DATE FOUND");
            }
        }
        else if (dateType == "ISSUE") {
            if (newLic.getLicenseIssueDate()) {
                jsExpDate = convertDate(newLic.getLicenseIssueDate());
                logDebug(pLicNum + " License Issue Date: " + jsDateToMMDDYYYY(jsExpDate));
                return jsExpDate;
            }
            else {
                logDebug("Reference record for license " + pLicNum + " has no Issue Date");
                return ("NO DATE FOUND");
            }
        }
        else if (dateType == "RENEW") {
            if (newLic.getLicenseLastRenewalDate()) {
                jsExpDate = convertDate(newLic.getLicenseLastRenewalDate());
                logDebug(pLicNum + " License Last Renewal Date: " + jsDateToMMDDYYYY(jsExpDate));
                return jsExpDate;
            }
            else {
                logDebug("Reference record for license " + pLicNum + " has no Last Renewal Date");
                return ("NO DATE FOUND");
            }
        }
        else
            return ("NO DATE FOUND");
    }
} function removeASITable(tableName) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValues is an associative array of values.  All elements MUST be strings.
    var itemCap = capId
    if (arguments.length > 2)
        itemCap = arguments[2]; // use cap ID specified in args

    var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName)

    if (!tssmResult.getSuccess())
    { aa.print("**WARNING: error retrievi    var day = "";
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
function exists(eVal, eArray) {
    for (ii in eArray)
        if (eArray[ii] == eVal) return true;
    return false;
}

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
            if (doObj.enabled)
                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                eval(token(doObj.act));
                lastEvalTrue = true;
            }
            else {
                if (doObj.elseact)
                    eval(token(doObj.elseact));
                lastEvalTrue = false;
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
    debug += dstr + br;
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

function addFee(fcode, fsched, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args
    if (arguments.length > 5) {
        feeCap = arguments[5]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 5) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 5) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
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
                    logDebug("**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
                }
            }
        }
    }
    else {
        var addParcelCondResult = aa.pa  }

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





function executeASITable(tableArray) {
    // Executes an ASI table as if it were script commands
    // No capability for else or continuation statements
    // Assumes that there are at least three columns named "Enabled", "Criteria", "Action"
    // Will replace tokens in the controls

    //var thisDate = new Date();
    //var thisTime = thisDate.getTime();
    //logDebug("Executing ASI Table, Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

    for (xx in tableArray) {

        var doTableObj = tableArray[xx];
        var myCriteria = doTableObj["Criteria"]; aa.print("cri: " + myCriteria)
        var myAction = doTableObj["Action"]; aa.print("act: " + myAction)
        aa.print("enabled: " + doTableObj["Enabled"])

        if (doTableObj["Enabled"] == "Yes")
            if (eval(token(myCriteria)))
            eval(token(myAction));

    } // next action
    //var thisDate = new Date();
    //var thisTime = thisDate.getTime();
    //logDebug("Finished executing ASI Table, Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
}

function copyASIFields(sourceCapId, targetCapId)  // optional fields to ignore
{
    var ignoreArray = new Array();
    for (var i = 1; i < arguments.length; i++)
        ignoreArray.push(arguments[i])

    var targetCap = aa.cap.getCap(targetCapId).getOutput();
    var targetCapType = targetCap.getCapType();
    var targetCapTypeString = targetCapType.toString();
    var targetCapTypeArray = targetCapTypeString.split("/");

    var sourceASIResult = aa.appSpecificInfo.getByCapID(sourceCapId)

    if (sourceASIResult.getSuccess())
    { var sourceASI = sourceASIResult.getOutput(); }
    else
    { aa.print("**ERROR: getting source ASI: " + sourceASIResult.getErrorMessage()); return false }

    for (ASICount in sourceASI) {
        thisASI = sourceASI[ASICount];

        if (!exists(thisASI.getCheckboxType(), ignoreArray)) {
            thisASI.setPermitID1(targetCapId.getID1())
            thisASI.setPermitID2(targetCapId.getID2())
            thisASI.setPermitID3(targetCapId.getID3())
            thisASI.setPerType(targetCapTypeArray[1])
            thisASI.setPerSubType(targetCapTypeArray[2])
            aa.cap.createCheckbox(thisASI)
        }
    }
}


function copyWorkflow(sourceCapId, targetCapId, targetTaskName, newTaskName) {
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
        if (fTask.getTaskDescription().toUpperCase().equals(targetTaskName.toUpperCase())) {
            tTask = wfObj[i];
            nTask = wfObj2[i];
        }

    }

    if (!tTask)
    { logDebug("**ERROR: Task not found: " + targetTaskName); return false; }


    //
    // Get the source Process
    //
    var workflowResult = aa.workflow.getTasks(sourceCapId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    var tProcess = null;

    for (i in wfObj) {
        var fTask = wfObj[i];
        var tProcess = fTask.getProcessCode();
        break;
    }

    if (!tProcess)
    { logDebug("**ERROR: Process code of source workflow not found"); return false; }



    //
    // Copy the destination task
    //
    nTask.setTaskDescription(newTaskName);

    logDebug("Copying task " + tTask.getTaskDescription() + " to " + nTask.getTaskDescription());

    result = aa.workflow.copyTask(nTask, tTask, "N")
    if (!result.getSuccess())
    { logDebug("error " + result.getErrorMessage()); return false; }


    //
    // Add the subworkflow
    //

    logDebug("Attaching subprocess " + tProcess + " to " + nTask.getTaskDescription());

    var result = aa.workflow.insertSubProcess(nTask, tProcess, true)
    if (!result.getSuccess())
    { logDebug("error " + result.getErrorMessage()); return false; }

}


function deleteTask(targetCapId, deleteTaskName) {
    //
    // Get the target Task
    //
    var workflowResult = aa.workflow.getTasks(targetCapId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

    var tTask = null;

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(deleteTaskName.toUpperCase())) {
            var tTask = wfObj[i];
        }

    }

    if (!tTask)
    { logDebug("**ERROR: Task not found: " + deleteTaskName); return false; }


    logDebug("Removing task " + tTask.getTaskDescription());
    var result = aa.workflow.removeTask(tTask)

    if (!result.getSuccess())
    { logDebug("error " + result.getErrorMessage()); return false; }

}

function stripNN(fullStr) {
    var allowed = "0123456789.";
    var stripped = "";
    for (i = 0; i     var day = "";
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
function exists(eVal, eArray) {
    for (ii in eArray)
        if (eArray[ii] == eVal) return true;
    return false;
}

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
            if (doObj.enabled)
                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                eval(token(doObj.act));
                lastEvalTrue = true;
            }
            else {
                if (doObj.elseact)
                    eval(token(doObj.elseact));
                lastEvalTrue = false;
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
    debug += dstr + br;
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

function addFee(fcode, fsched, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args
    if (arguments.length > 5) {
        feeCap = arguments[5]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 5) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 5) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
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
                    logDebug("**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
                }
            }
        }
    }
    else {
        var addParcelCondResult = aa.pa