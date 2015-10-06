/*------------------------------------------------------------------------------------------------------/
| SVN $Id: WorkflowTaskUpdateAfter.js 1249 2008-01-10 18:57:01Z john.schomp $
| Program : WorkflowTaskUpdateAfterV1.4.js
| Event   : WorkflowTaskUpdateAfter
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   : DQ-2/11/09 - Added editCompletedDate
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
var controlString = "WorkflowTaskUpdateAfter"; 				// Standard choice for control
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

var capId = getCapId();							// CapId object
var cap = aa.cap.getCap(capId).getOutput();				// Cap object
var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code
var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
var parentCapId = null
var parentCapString = "" + aa.env.getValue("ParentCapID");
if (parentCapString.length > 0) { parentArray = parentCapString.split("-") ; parentCapId = aa.cap.getCapID(parentArray[0],parentArray[1],parentArray[2]).getOutput(); }
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN" ; publicUser = true }  // ignore public users
var partialCap = !cap.isCompleteCap();
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
var wfTask = aa.env.getValue("WorkflowTask");				// Workflow Task Triggered event
var wfStatus = aa.env.getValue("WorkflowStatus");			// Status of workflow that triggered event
var wfDate = aa.env.getValue("WorkflowStatusDate");			// date of status of workflow that triggered event
var wfDateMMDDYYYY = wfDate.substr(5,2) + "/" + wfDate.substr(8,2) + "/" + wfDate.substr(0,4);	// date of status of workflow that triggered event in format MM/DD/YYYY
var wfProcessID = aa.env.getValue("ProcessID");				// Process ID of workflow
var wfStep ; var wfComment ; var wfNote ; var wfDue ;			// Initialize
var wfProcess ; 							// Initialize
// Go get other task details
var wfObj = aa.workflow.getTasks(capId).getOutput();
for (i in wfObj)
	{
	fTask = wfObj[i];
	if (fTask.getTaskDescription().equals(wfTask) && (fTask.getProcessID() == wfProcessID))
		{
		wfStep = fTask.getStepNumber();
		wfProcess = fTask.getProcessCode();
		wfComment = fTask.getDispositionComment();
		wfNote = fTask.getDispositionNote();
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
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

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function logDebug(dstr)
	{


	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

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
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
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
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
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
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue,==null)
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
			logMessage("Successfully added condition to Address ID " + pAddrNum + "  (" + pImpact + ") " + pDesc);
			logDebug("Successfully added condition to Address ID " + pAddrNum + "  (" + pImpact + ") " + pDesc);
			condAdded=true;
			}
		else
			{
			logDebug( "**ERROR: adding condition to Address " + pAddrNum + "  (" + pImpact + "): " + addCondResult.getErrorMessage());
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
	for (var i=1; i<arguments.length;i++)
		ignoreArray.push(arguments[i])

	// returns true if any of the subtasks are active
	var taskResult = aa.workflow.getTasks(capId);
	if (taskResult.getSuccess())
		{ taskArr = taskResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting tasks : " + taskResult.getErrorMessage()); return false }

	for (xx in taskArr)
		if (taskArr[xx].getProcessCode().equals(stask) && taskArr[xx].getActiveFlag().equals("Y") && !exists(taskArr[xx].getTaskDescription(),ignoreArray))
			return false;
	return true;
	}

function appHasCondition(pType,pStatus,pDesc,pImpact)
	{
	// Checks to see if conditions have been added to CAP
	// 06SSP-00223
	//
	if (pType==null)
		var condResult = aa.capCondition.getCapConditions(capId);
	else
		var condResult = aa.capCondition.getCapConditions(capId,pType);

	if (condResult.getSuccess())
		var capConds = condResult.getOutput();
	else
		{
		logMessage("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
		logDebug("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
		return false;
		}

	var cStatus;
	var cDesc;
	var cImpact;

	for (cc in capConds)
		{
		var thisCond = capConds[cc];
		var cStatus = thisCond.getConditionStatus();
		var cDesc = thisCond.getConditionDescription();
		var cImpact = thisCond.getImpactCode();
		var cType = thisCond.getConditionType();
		if (cStatus==null)
			cStatus = " ";
		if (cDesc==null)
			cDesc = " ";
		if (cImpact==null)
			cImpact = " ";
		//Look for matching condition

		if ( (pStatus==null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
			return true; //matching condition found
		}
	return false; //no matching condition found
	} //function

function appMatch(ats) // optional capId or CapID string
	{
	var matchArray = appTypeArray //default to current app
	if (arguments.length == 2)
		{
		matchCapParm = arguments[1]
		if (typeof(matchCapParm) == "string")
			matchCapId = aa.cap.getCapID(matchCapParm).getOutput();   // Cap ID to check
		else
			matchCapId = matchCapParm;
		if (!matchCapId)
			{
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


function appNameIsUnique(gaGroup,gaType,gaName)
//
// returns true if gaName application name has not been used in CAPs of gaGroup and gaType
// Bypasses current CAP
	{
	var getCapResult = aa.cap.getByAppType(gaGroup,gaType);
	if (getCapResult.getSuccess())
		var apsArray = getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()) ; return null }

	for (aps in apsArray)
		{
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
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	cd = cdScriptObj.getCapDetailModel();

	iNameResult  = aa.person.getUser(assignId);

	if (!iNameResult.getSuccess())
		{ logDebug("**ERROR retrieving  user model " + assignId + " : " + iNameResult.getErrorMessage()) ; return false ; }

	iName = iNameResult.getOutput();

	cd.setAsgnDept(iName.getDeptOfUser());
	cd.setAsgnStaff(assignId);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("Assigned CAP to " + assignId) }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}function assignInspection(iNumber,iName)
	{
	// updates the inspection and assigns to a new user
	// requires the inspection id and the user name
	//
	iObjResult = aa.inspection.getInspection(capId,iNumber);
	if (!iObjResult.getSuccess())
		{ logDebug("**ERROR retrieving inspection " + iNumber + " : " + iObjResult.getErrorMessage()) ; return false ; }

	iObj = iObjResult.getOutput();

	iNameResult  = aa.person.getUser(iName);

	if (!iNameResult.getSuccess())
		{ logDebug("**ERROR retrieving inspector user model " + iName + " : " + iNameResult.getErrorMessage()) ; return false ; }

	iInspector = iNameResult.getOutput();

	iObj.setInspector(iInspector);

	aa.inspect);
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
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

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function logDebug(dstr)
	{


	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

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
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
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
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
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
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue,etSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
            var newContact = Contacts[yy].getCapContactModel();
            newContact.setCapID(vToCapId);
            aa.people.createCapContactWithAttribute(newContact);
            copied++;
            logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
        }
    }
    else {
        logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
        return false;
    }
    return copied;
}
function copyParcelGisObjects()
	{
	var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
	if (capParcelResult.getSuccess())
		{
		var Parcels = capParcelResult.getOutput().toArray();
		for (zz in Parcels)
			{
			var ParcelValidatedNumber = Parcels[zz].getParcelNumber();
			logDebug("Looking at parcel " + ParcelValidatedNumber);
			var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
			if (gisObjResult.getSuccess())
				var fGisObj = gisObjResult.getOutput();
			else
				{ logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

			for (a1 in fGisObj) // for each GIS object on the Cap
				{
				var gisTypeScriptModel = fGisObj[a1];
                                var gisObjArray = gisTypeScriptModel.getGISObjects()
                                for (b1 in gisObjArray)
                                	{
  					var gisObjScriptModel = gisObjArray[b1];
  					var gisObjModel = gisObjScriptModel.getGisObjectModel() ;

					var retval = aa.gis.addCapGISObject(capId,gisObjModel.getServiceID(),gisObjModel.getLayerId(),gisObjModel.getGisId());

					if (retval.getSuccess())
						{ logDebug("Successfully added Cap GIS object: " + gisObjModel.getGisId())}
					else
						{ logDebug("**ERROR: Could not add Cap GIS Object.  Reason is: " + retval.getErrorType() + ":" + retval.getErrorMessage()) ; return false }
					}
				}
			}
		}
	else
		{ logDebug("**ERROR: Getting Parcels from Cap.  Reason is: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage()) ; return false }
	}

function copyParcels(pFromCapId, pToCapId)
	{
	//Copies all parcels from pFromCapId to pToCapId
	//If pToCapId is null, copies to current CAP
	//07SSP-00037/SP5017
	//
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	var capParcelResult = aa.parcel.getParcelandAttribute(pFromCapId,null);
	var copied = 0;
	if (capParcelResult.getSuccess())
		{
		var Parcels = capParcelResult.getOutput().toArray();
		for (zz in Parcels)
			{
			var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
			newCapParcel.setParcelModel(Parcels[zz]);
			newCapParcel.setCapIDModel(vToCapId);
			newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
			newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
			aa.parcel.createCapParcel(newCapParcel);
			logDebug("Copied parcel "+Parcels[zz].getParcelNumber()+" from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
			copied++;
			}
		}
	else
		{
		logMessage("**ERROR: Failed to get parcels: " + capParcelResult.getErrorMessage());
		return false;
		}
	return copied;
	}function copySchedInspections(pFromCapId, pToCapId)
	{
	//Copies all scheduled inspections from pFromCapId to pToCapId
	//If pToCapId is null, copies to current CAP
	//07SSP-00037/SP5017
	//
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	var inspResultObj = aa.inspection.getInspections(pFromCapId);

	if (!inspResultObj.getSuccess())
		{
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
	for (xx in inspList)
		{
		if ("Insp Scheduled"==inspList[xx].getDocumentDescription())
			{
			inspector = inspList[xx].getInspector();
			inspDate = inspList[xx].getScheduledDate();
			inspTime = inspList[xx].getScheduledTime();
			inspType = inspList[xx].getInspectionType();
			inspComment = inspList[xx].getInspectionComments();
			schedRes = aa.inspection.scheduleInspection(vToCapId, inspector, inspDate, inspTime, inspType, inspComment);
			if (schedRes.getSuccess())
				{
				logDebug("Copied scheduled inspection from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
				inspCount++;
				}
			else
				logDebug( "**ERROR: copying scheduling inspection (" + inspType + "): " + schedRes.getErrorMessage());
			}
		}
	return inspCount;
	}


function countActiveTasks(processName)
	{
	// counts the number of active tasks on a given process
        var numOpen = 0;

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		fTask = wfObj[i];
		if (fTask.getProcessCode().equals(processName))
			if (fTask.getActiveFlag().equals("Y"))
				numOpen++;
		}
	return numOpen;
	}

function countIdenticalInspections()
	{
	var cntResult = 0;
	var oldDateStr = "01/01/1900";  // inspections older than this date count as 1
	if (arguments.length > 0) oldDateStr = arguments[0]; // Option to override olddate in the parameter
	oldDate = new Date("oldDateStr");

	var oldInspectionFound = false;
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();
		for (xx in inspList)
			{
			if (String(inspType).equals(inspList[xx].getInspectionType()) && String(inspResult).equals(inspList[xx].getInspectionStatus()))
				{
				if (convertDate(inspList[xx].getInspectionStatusDate()) < oldDate)
					{
					if (!oldInspectionFound) { cntResult++ ; oldInspectionFound = true }
					}
				else
					{
					cntResult++
					}
				}
			}
		}
	logDebug("countIdenticalInspections(" + inspType + "," + inspResult + ", " + oldDateStr +  ") Returns " + cntResult);
	return cntResult;
	}
	function createCap(pCapType, pAppName)
	{
	// creates a new application and returns the capID object
	// 07SSP-00037/SP5017
	//
	var aCapType = pCapType.split("/");
	if (aCapType.length != 4)
		{
		logDebug("**ERROR in createCap.  The following Application Type String is incorrectly formatted: " + pCapType);
		return ("INVALID PARAMETER");
		}

	var appCreateResult = aa.cap.createApp(aCapType[0],aCapType[1],aCapType[2],aCapType[3],pAppName);
	logDebug("Creating cap " + pCapType);

	if (!appCreateResult.getSuccess())
		{
		logDebug( "**ERROR: creating CAP " + appCreateResult.getErrorMessage());
		return false;
		}

	var newId = appCreateResult.getOutput();
	logDebug("CAP of type " + pCapType + " created successfully ");
	var newObj = aa.cap.getCap(newId).getOutput();	//Cap object

	return newId;
	}

function createChild(grp,typ,stype,cat,desc)
//
// creates the new application and returns the capID object
//
	{
	var appCreateResult = aa.cap.createApp(grp,typ,stype,cat,desc);
	logDebug("creating cap " + grp + "/" + typ + "/" + stype + "/" + cat);
	if (appCreateResult.getSuccess())
		{
		var newId = appCreateResult.getOutput();
		logDebug("cap " + grp + "/" + typ + "/" + stype + "/" + cat + " created successfully ");

		// create Detail Record
		capModel = aa.cap.newCapScriptModel().getOutput();
		capDetailModel = capModel.getCapModel().getCapDetailModel();
		capDetailModel.setCapID(newId);
		aa.cap.createCapDetail(capDetailModel);

		var newObj = aa.cap.getCap(newId).getOutput();	//Cap object
		var result = aa.cap.createAppHierarchy(capId, newId);
		if (result.getSuccess())
			logDebug("Child application successfully linked");
		else
			logDebug("Could not link applications");

		// Copy Parcels

	);
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
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

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function logDebug(dstr)
	{


	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

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
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
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
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
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
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue,= new Date(pEndDate);
	jsEndDate.setHours(23,59,59,999); //Bring EndDate close to midnight

	//logDebug("Start Date: "+ (jsStartDate.getMonth()+1).toString() +"/"+jsStartDate.getDate()+"/"+jsStartDate.getFullYear() + " End Date: " + (jsEndDate.getMonth()+1).toString() +"/"+jsEndDate.getDate()+"/"+jsEndDate.getFullYear());

	//get optional arguments
	var checkStatus = false;
	var statusArray = new Array();
	if (arguments.length > 2)
		{
		checkStatus = true;
		for (var i=2; i<arguments.length; i++)
			statusArray.push(arguments[i]);
		}

	//get all feeitems on CAP
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	//get total applicable fees
	var feesTotal = 0;
	var jsFeeDate = new Date();
	for (ff in feeObjArr)
		{
		jsFeeDate.setTime(feeObjArr[ff].getApplyDate().getEpochMilliseconds());
		//logDebug("Fee Apply Date: "+(jsFeeDate.getMonth()+1).toString() +"/"+ jsFeeDate.getDate()+"/"+jsFeeDate.getFullYear());
		if (jsFeeDate  >= jsStartDate && jsFeeDate <= jsEndDate && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray) ) )
			{
			feesTotal += feeObjArr[ff].getFee();
			//logDebug("Added to Total: "+feeObjArr[ff].getFee());
			}
		}

	return feesTotal;
	}

function feeQty(feestr)
	{
	var feeQty = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		if (feestr.equals(feeObjArr[ff].getFeeCod()))
			feeQty+=feeObjArr[ff].getFeeUnit();

	return feeQty;
	}

function getAppIdByASI(ASIName,ASIValue,ats)
	//
	// returns the cap Id string of an application based on App-Specific Info and applicationtype.  Returns first result only!
	//
	{
	var ata = ats.split("/");
	if (ata.length != 4)
		logDebug("**ERROR: getAppIdByASI in appMatch.  The following Application Type String is incorrectly formatted: " + ats);

	var getCapResult = aa.cap.getCapIDsByAppSpecificInfoField(ASIName,ASIValue);
	if (getCapResult.getSuccess())
		var apsArray = getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()) ; return null }


	for (aps in apsArray)
		{
		myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();
		myAppTypeString = myCap.getCapType().toString();
		myAppTypeArray = myAppTypeString.split("/");

		isMatch = true;
		for (xx in ata)
			if (!ata[xx].equals(myAppTypeArray[xx]) && !ata[xx].equals("*"))
				isMatch = false;

		if (isMatch)
			{
			logDebug("getAppIdByName(" + ASIName + "," + ASIValue + "," + ats + ") Returns " + apsArray[aps].getCapID().toString());
			return apsArray[aps].getCapID().toString()
			}
		}
	}

function getAppIdByName(gaGroup,gaType,gaName)
//
// returns the cap Id string of an application that has group,type,and name
//
	{
	getCapResult = aa.cap.getByAppType(gaGroup,gaType);
	if (getCapResult.getSuccess())
		var apsArray = getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()) ; return null }


	for (aps in apsArray)
		{
		var myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();
		if (myCap.getSpecialText().equals(gaName))
			{
			logDebug("getAppIdByName(" + gaGroup + "," + gaType + "," + gaName + ") Returns " + apsArray[aps].getCapID().toString());
			return apsArray[aps].getCapID().toString()
			}
		}
	}
function getApplication(appNum)
//
// returns the capId object of an application
//
	{
	var getCapResult = aa.cap.getCapID(appNum);
	if (getCapResult.getSuccess())
		return getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting cap id (" + appNum + "): " + getCapResult.getErrorMessage()) }
	}

function getAppSpecific(itemName)  // optional: itemCap
	{
	var updated = false;
	var i=0;
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var appspecObj = appSpecInfoResult.getOutput();

		if (itemName != "")
			{
			for (i in appspecObj)
				if (appspecObj[i].getCheckboxDesc() == itemName)
					{
					return appspecObj[i].getChecklistComment();
					break;
					}
			} // item name blank
		}
	else
		{ logDebug( "**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage()) }
	}

function getCapByAddress(ats)
//
// returns the capid that matches the current address and app type string
// if multiple records will return the first and warning.
//
	{
	var retArr = new Array();

	// get address data
	var addResult = aa.address.getAddressByCapId(capId);
	if (addResult.getSuccess())
		{ var aoArray = addResult.getOutput(); }
	else
		{ logDebug("**ERROR: getting address by cap ID: " + addResult.getErrorMessage()); return false; }

	if (aoArray.length)
		{ var ao = aoArray[0]; }
	else
		{ logDebug("**WARNING: no address for comparison:"); return false; }

	// get caps with same address
	var capAddResult = aa.cap.getCapListByDetailAddress(ao.getStreetName(),ao.getHouseNumberStart(),ao.getStreetSuffix(),ao.getZip(),ao.getStreetDirection(),null);
	if (capAddResult.getSuccess())
	 	{ var capIdArray=capAddResult.getOutput(); }
	else
	 	{ logDebug("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());  return false; }


	// loop through related caps
	for (cappy in capIdArray)
		{
		// get file date
		var relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();

		// get cap type

		reltype = relcap.getCapType().toString();

		var isMatch = true;
		var ata = ats.split("/");
		if (ata.length != 4)
			logDebug("**ERROR: The following Application Type String is incorrectly formatted: " + ats);
		else
			for (xx in ata)
				if (!ata[xx].equals(appTypeArray[xx]) && !ata[xx].equals("*"))
					isMatch = false;

		if (isMatch)
			retArr.push(capIdArray[cappy]);

		} // loop through related caps

	if (retArr.length > 1)
		{
		logDebug("**WARNING: Multiple caps returned for this address/apptype") ; return retArr[0]
		}

	if (retArr.length == 0)
		return retArr[0];

	}

function getChildren(pCapType, pParentCapId)
	{
	// Returns an array of children capId objects whose cap type matches pCapType parameter
	// Wildcard * may be used in pCapType, e.g. "Building/Commercial/*/*"
	// Optional 3rd parameter pChildCapIdSkip: capId of child to skip

	var retArray = new Array();
	if (pParentCapId!=null) //use cap in parameter
		var vCapId = pParentCapId;
	else // use current cap
		var vCapId = capId;

	if (arguments.length>2)
		var childCapIdSkip = arguments[2];
	else
		var childCapIdSkip = null;

	var typeArray = pCapType.split("/");
	if (typeArray.length != 4)
		logDebug("**ERROR in childGetByCapType function parameter.  The following cap type parameter is incorrectly formatted: " + pCapType);

	var getCapResult = aa.cap.getChildByMasterID(vCapId);
	if (!getCapResult.getSuccess())
		{ logDebug("**WARNING: getChildren returned an error"); return false; }

	var childArray = getCapResult.getOutput();
	if (!childArray.length)
		{ logDebug( "**WARNING: getChildren function found no children"); return null ; }

	var childCapId;
	var capTypeStr = "";
	var childTypeArray;
	var isMatch;
	for (xx in childArray)
		{
		childCapId = childArray[xx].getCapID();
		if (childCapIdSkip!=null && childCapIdSkip.getCustomID().equals(childCapId.getCustomID())) //skip over this child
			continue;

		capTypeStr = aa.cap.getCap(childCapId).getOutput().getCapType().toString();	// Convert cap type to string ("Building/A/B/C")
		childTypeArray = capTypeStr.split("/");
		isMatch = true;
		for (yy in childTypeArray) //looking for matching cap type
			{
			if (!typeArray[yy].equals(childTypeArray[yy]) && !typeArra);
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
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

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function logDebug(dstr)
	{


	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

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
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
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
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
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
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue,r expAADate = aa.date.parseDate(expDate);

		if (this.refProf) {
			this.refProf.setLicenseIssueDate(expAADate);
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



function copyLicenseProfessional(srcCapId, targetCapId)
{
	//1. Get license professionals with source CAPID.
	var capLicenses = getLicenseProfessional(srcCapId);
	if (capLicenses == null || capLicenses.length == 0)
	{
		return;
	}
	//2. Get license professionals with target CAPID.
	var targetLicenses = getLicenseProfessional(targetCapId);
	//3. Check to see which licProf is matched in both source and target.
	for (loopk in capLicenses)
	{
		sourcelicProfModel = capLicenses[loopk];
		//3.1 Set target CAPID to source lic prof.
		sourcelicProfModel.setCapID(targetCapId);
		targetLicProfModel = null;
		//3.2 Check to see if sourceLicProf exist.
		if (targetLicenses != null && targetLicenses.length > 0)
		{
			for (loop2 in targetLicenses)
			{
				if (isMatchLicenseProfessional(sourcelicProfModel, targetLicenses[loop2]))
				{
					targetLicProfModel = targetLicenses[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched licProf model.
		if (targetLicProfModel != null)
		{
			//3.3.1 Copy information from source to target.
			aa.licenseProfessional.copyLicenseProfessionalScriptModel(sourcelicProfModel, targetLicProfModel);
			//3.3.2 Edit licProf with source licProf information.
			aa.licenseProfessional.editLicensedProfessional(targetLicProfModel);
		}
		//3.4 It is new licProf model.
		else
		{
			//3.4.1 Create new license professional.
			aa.licenseProfessional.createLicensedProfessional(sourcelicProfModel);
		}
	}
}

function isMatchLicenseProfessional(licProfScriptModel1, licProfScriptModel2)
{
	if (licProfScriptModel1 == null || licProfScriptModel2 == null)
	{
		return false;
	}
	if (licProfScriptModel1.getLicenseType().equals(licProfScriptModel2.getLicenseType())
		&& licProfScriptModel1.getLicenseNbr().equals(licProfScriptModel2.getLicenseNbr()))
	{
		return true;
	}
	return	false;
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
);
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
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

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function logDebug(dstr)
	{


	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

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
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
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
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
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
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, condition to Parcel " + parcelNum + "  (" + cType + ") " + cDesc);
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

function scheduleInspectDate(iType,DateToSched) // optional inspector ID.  This function requires dateAdd function
	{
	var inspectorObj = null;
	if (arguments.length == 3)
		{
		var inspRes = aa.person.getUser(arguments[2])
		if (inspRes.getSuccess())
			inspectorObj = inspRes.getOutput();
		}

	var schedRes = aa.inspection.scheduleInspection(capId, inspectorObj, aa.date.parseDate(DateToSched), null, iType, "Scheduled via Script")

	if (schedRes.getSuccess())
		logDebug("Successfully scheduled inspection : " + iType + " for " + DateToSched);
	else
		logDebug( "**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
	}

function scheduleInspection(iType,DaysAhead) // optional inspector ID.  This function requires dateAdd function
	{
	var inspectorObj = null;
	if (arguments.length == 3)
		{
		var inspRes = aa.person.getUser(arguments[2])
		if (inspRes.getSuccess())
			var inspectorObj = inspRes.getOutput();
		}

	var schedRes = aa.inspection.scheduleInspection(capId, inspectorObj, aa.date.parseDate(dateAdd(null,DaysAhead)), null, iType, "Scheduled via Script")

	if (schedRes.getSuccess())
		logDebug("Successfully scheduled inspection : " + iType + " for " + dateAdd(null,DaysAhead));
	else
		logDebug( "**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
	}

function taskCloseAllExcept(pStatus,pComment)
	{
	// Closes all tasks in CAP with specified status and comment
	// Optional task names to exclude
	// 06SSP-00152
	//
	var taskArray = new Array();
	var closeAll = false;
	if (arguments.length > 2) //Check for task names to exclude
		{
		for (var i=2; i<arguments.length; i++)
			taskArray.push(arguments[i]);
		}
	else
		closeAll = true;

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  else
  	{
		logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
		return false;
		}

	var fTask;
	var stepnumber;
	var processID;
	var dispositionDate = aa.date.getCurrentDate();
	var wfnote = " ";
	var wftask;

	for (i in wfObj)
		{
   	fTask = wfObj[i];
		wftask = fTask.getTaskDescription();
		stepnumber = fTask.getStepNumber();
		//processID = fTask.getProcessID();
		if (closeAll)
			{
			aa.workflow.handleDisposition(capId,stepnumber,pStatus,dispositionDate,wfnote,pComment,systemUserObj,"Y");
			logMessage("Closing Workflow Task " + wftask + " with status " + pStatus);
			logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
			}
		else
			{
			if (!exists(wftask,taskArray))
				{
				aa.workflow.handleDisposition(capId,stepnumber,pStatus,dispositionDate,wfnote,pComment,systemUserObj,"Y");
				logMessage("Closing Workflow Task " + wftask + " with status " + pStatus);
				logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
				}
			}
		}
	}

function taskStatus(wfstr) // optional process name
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
			return fTask.getDisposition()
		}
	}

function transferFunds(parentAppNum,dollarAmount)
// does fund transfer from current app to parentAppNum, but only if current app has enough non-applied funds
// needs function paymentGetNotAppliedTot()
	{
	//validate dollarAmount is number
	var checkNum = parseFloat(dollarAmount);
	if (isNaN(checkNum))
		{
		logDebug("dollarAmount parameter is not a number, no funds will be transferred");
		return false;
		}

	//check that enough non-applied funds are available
	var fundsAvail = paymentGetNotAppliedTot();
	if (fundsAvail < parseFloat(dollarAmount))
		{
		logDebug("Insufficient funds $"+fundsAvail.toString()+ " available. Fund transfer of $"+dollarAmount.toString()+" not done.");
		logMessage("Insufficient funds available. No funds transferred.");
		return false;
		}

	//enough funds - proceed with transfer
	var getCapResult = aa.cap.getCapID(parentAppNum);
	if (getCapResult.getSuccess())
		{
		var parentId = getCapResult.getOutput();

		var xferResult = aa.finance.makeFundTransfer(capId, parentId, currentUserID, "", "", sysDate, sysDate, "", sysDate, dollarAmount, "NA", "Fund Transfer", "NA", "R", null, "", "NA", "");


		if (xferResult.getSuccess())
			logDebug("Successfully did fund transfer to : " + parentAppNum);
		else
			logDebug( "**ERROR: doing fund transfer to (" + parentAppNum + "): " + xferResult.getErrorMessage());
		}
	else
		{
		logDebug( "**ERROR: getting parent cap id (" + parentAppNum + "): " + getCapResult.getErrorMessage())
		}
	}

function updateAppStatus(stat,cmt) // optional cap id
	{

	var itemCap = capId;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

	var updateStatusResult = aa.cap.updateAppStatus(itemCap,"APPLICATION",stat, sysDate, cmt ,systemUserObj);
	if (updateStatusResult.getSuccess())
		logDebug("Updated application status to " + stat + " successfully.");
	else
		logDebug("**ERROR: application status update to " + stat + " was unsuccessful.  The reason is "  + updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage());
	}


function updateFee(fcode,fsched,fperiod,fqty,finvoice) // Updates an assessed fee with a new Qty.  If it is not found, adds it
	{
	feeUpdated = false;
	getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
	if (getFeeResult.g);
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
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

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function logDebug(dstr)
	{


	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

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
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
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
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
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
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue,

	for (var loopk in appSpecificInfo)
			  if (!exists(appSpecificInfo[loopk].getCheckboxType(),ignoreArray))
			       {
					var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
					sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
					sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
					sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());
					//3. Edit ASI on target CAP (Copy info from source to target)
					aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
				}
	}

function copyASITableFieldsAndData(srcCapId, targetCapId)
	{
	var tableNameArray = null;
	var result = aa.appSpecificTableScript.getAppSpecificGroupTableNames(capId);
	if(result.getSuccess())
		{
		tableNameArray = result.getOutput();
		}
	else
		{
		logDebug("WARNING: no ASI Tables on this CAP:" + srcCapId);
		return null;
		}

	for (var loopk in tableNameArray)
		{
		var tableName = tableNameArray[loopk];
		var appSpecificTable = null;

		//1. Get appSpecificTableModel with source CAPID
		var s_result = aa.appSpecificTableScript.getAppSpecificTableModel(srcCapId,tableName);
		if(s_result.getSuccess())
			{
			var appSpecificTable = s_result.getOutput();
			if (appSpecificTable == null || appSpecificTable.length == 0)
				{
				logDebug("WARNING: null table on this CAP:" + capId);
				continue;
				}
			}
		else
			{
			logDebug("WARNING: Failed to appSpecificTable: " + s_result.getErrorMessage());
			continue;
			}


		//2. Edit AppSpecificTableInfos with target CAPID

	    var aSTableModel = appSpecificTable.getAppSpecificTableModel();

		aa.appSpecificTableScript.editAppSpecificTableInfos(aSTableModel,targetCapId,null);
		}
	}


function closeSubWorkflow(thisProcessID,wfStat) // optional capId
	{
	var itemCap = capId;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args


	var isCompleted = true;

	var workflowResult = aa.workflow.getTasks(itemCap);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else
		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
		var fTaskSM = wfObj[i];
		if (fTaskSM.getProcessID() == thisProcessID && fTaskSM.getCompleteFlag() != "Y")
			{
			logDebug("closeSubWorkflow: found an incomplete task processID #" + thisProcessID + " , Step# " + fTaskSM.getStepNumber(),3);
			isCompleted = false
			}
		}

	if (!isCompleted) return false;


	// get the parent task

	var relationArray = aa.workflow.getProcessRelationByCapID(itemCap,null).getOutput()

	var relRecord = null;

	for (thisRel in relationArray)
		if (relationArray[thisRel].getProcessID() == thisProcessID)
			relRecord = relationArray[thisRel];

	if (!relRecord)
		{
		logDebug("closeSubWorkflow: did not find a process relation, exiting",3);
		return false;
		}

	logDebug("executing handleDisposition:" + relRecord.getStepNumber() + "," + relRecord.getParentProcessID() + "," + wfStat,3);

	var handleResult = aa.workflow.handleDisposition(itemCap,relRecord.getStepNumber(),relRecord.getParentProcessID(),wfStat,sysDate,"Closed via script","Closed via script",systemUserObj ,"Y");

	if (!handleResult.getSuccess())
		logDebug("**WARNING: closing parent task: " + handleResult.getErrorMessage());
	else
		logDebug("Closed parent task");
	}

function closeAllOpenProcessTasks(thisProcessID,taskStat,taskComment) // optional capId
	{
	var itemCap = capId;
	if (arguments.length == 4) itemCap = arguments[3]; // use cap ID specified in args


	var workflowResult = aa.workflow.getTasks(itemCap);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
		var fTaskSM = wfObj[i];
		if (fTaskSM.getProcessID() == thisProcessID && fTaskSM.getActiveFlag() == "Y")
			{
			aa.print("found an active task: " + stepnumber + " , " + thisProcessID);
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTaskSM.getStepNumber();
			aa.workflow.handleDisposition(itemCap,stepnumber,thisProcessID,taskStat,dispositionDate, taskComment,taskComment,systemUserObj ,"Y");
			}
		}
	}




function doCustomNotifications(notStdChoice,notType)
	{

	var tmpNots = aa.bizDomain.getBizDomain(notStdChoice).getOutput().toArray()
	for (tmpNot in tmpNots)
	   {
	   bd = tmpNots[tmpNot]
	   crit = bd.getBizdomainValue().split("\\|")

	   if (crit.length == 5)
	         {
	         noteTypeCri	= String(crit[0]);
	         appTypeCri 	= String(crit[1]);
	         processCri 	= String(crit[2]);
	         taskCri 		= String(crit[3]);
	         taskStatCri	= String(crit[4]);

	         if (!noteTypeCri.equals(notType)) continue;

	         if (!appMatch(appTypeCri)) continue;

	         if (taskCri.toUpperCase() != wfTask.toUpperCase() && taskCri != "*") continue;

	         if (taskStatCri.toUpperCase() != wfStatus.toUpperCase() && taskStatCri != "*") continue;

	         // custom *Activity* logic for AD looks for a process code that starts with "1" to determine if it is an activity workflow

	         if ((processCri.toUpperCase() == "*ACTIVITY*" && wfProcess.substr(0,1) == "1") || processCri == "*" || processCri.toUpperCase() == wfProcess.toUpperCase())
	         	{
	         	sendMessage("email.workflow.genericSubject",bd.getDescription());
				}
	        }
	  	}
 	}


function sendMessage(subjKey,messageKey)
	{

	var mSubj = aa.messageResources.getLocalMessage(subjKey);
	var mMesg = aa.messageResources.getLocalMessage(messageKey);

	var SMSSend = false;
	var SMSAddr = null;
	var emailSend = false;
	var emailAddr = null;

	var contactType = "Applicant";

	var replyTo = "noreply@adeconomy.ae";
	var contactType = "Applicant"
	var emailAddress = "";

	// check to see if ACA user?  do we pull from here or the contact

   	var publicUser = aa.licenseScript.getPublicUserByUserName(cap.getAuditID()); //PublicUser Object

	if (publicUser)
		{
		if (publicUser.getReceiveSMS() == "Y")
			{
			SMSAddr = publicUser.getCellPhone()
			if (SMSAddr) SMSSend = true;
			}
		else
			{
			emailAddr = publicUser.getEmail();
			if (emailAddr) emailSend = true;
			}
		}
	else

	//  Use the contact.   Not sure where the SMS would be on here.  TBD

		{
		var capContactResult = aa.people.getCapContactByCapID(capId);
		if (capContactResult.getSuccess())
			{
			var Contacts = capContactResult.getOutput();
			for (yy in Contacts)
				if (contactType.equals(Contacts[yy].getCapContactModel().getPeople().getContactType()))
					if (Contacts[yy].getEmail() != null)
						{
						emailAddr = Contacts[yy].getEmail();
						customerFullName = Contacts[yy].getFirstName() + " " + Contacts[yy].getLastName();
						if (emailAddr) emailSend = true;
						}
			}
		}



	if (mSubj) mSubj = replaceMessageTokens(mSubj);	else { logDebug("**WARNING Message subject missing " + subjKey); return false;}

	if (mMesg) mMesg = replaceMessageTokens(mMesg); else { logDebug("**WARNING Message missing " + messageKey); return false;}


	if (emailSend)
		{
		aa.sendMail(replyTo, emailAddr, "", mSubj, mMesg);
		logDebug("Successfully sent email to " + contactType);
		logDebug("Successfully sent email to " + emailAddr + ": Subject:" + mSubj + " Message:" + mMesg);
		}

	if (SMSSend)
		{
		// need SMS routine
		logDebug("I would have sent an SMS to " + SMSAddr + " If I could.  Text: " + mMesg);
		}
	}

function replaceMessageTokens(m)
	{
	//  tokens in pipes will attempt to interpret as script variables
	//  tokens in curly braces will attempt to replace from AInfo (ASI, etc)
	//
	//  e.g.   |capId|  or |wfTask|  or |wfStatus|
	//
	//  e.g.   {Expiration Date}  or  {Number of Electrical Outlets}
	//
	//  e.g.   m = "Your recent license application (|capIdString|) has successfully passed |wfTask| with a status of |wfStatus|"

	while (m.indexOf("|"))
	  {
	  var s = m.indexOf("|")
);
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
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

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function logDebug(dstr)
	{


	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

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
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
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
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
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
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue,Array();
						var paymentPeriodArray = new Array();

						feeSeqArray.push(targetFee.sequence);
						paymentPeriodArray.push(targetFee.period);
						var invoiceResult_L = aa.finance.createInvoice(itemCap, feeSeqArray, paymentPeriodArray);

						if (!invoiceResult_L.getSuccess())
							{
							logDebug("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
							return false;
							}

						break;  // done with this payment
						}



					if (targetFee.status == "NEW")
						{
						// delete the fee
						var editResult = aa.finance.removeFeeItem(itemCap, targetFee.sequence);

						if (editResult.getSuccess())
							logDebug("Removed existing Fee Item: " + targetFee.code);
						else
							{ logDebug( "**ERROR: removing fee item (" + targetFee.code + "): " + editResult.getErrorMessage()); return false; }

						break;  // done with this payment
						}

					} // each matching fee
				}  // each license fee
			}  // each template fee
		}  // function

function editCompletedDate(vDate)
{
	var vCapId = capId
	if (arguments.length > 1)
		vCapId = arguments[1];

	var cdo = aa.cap.getCapDetail(vCapId);
	if (cdo.getSuccess())
	{
		var cd = cdo.getOutput();
		cd.setCompleteDate( aa.date.parseDate(vDate) );
		aa.cap.editCapDetail(cd.getCapDetailModel());
		logDebug("Completed date set to: " + vDate);
	}
	else
		logDebug("Could not set completed date");
}

function getChildTasks(taskName) {
    var childTasks = new Array();
    var childId = null;
    var itemCap = capId
    if (arguments.length > 1)
        itemCap = arguments[1]; // use cap ID specified in args

    var workflowResult = aa.workflow.getTasks(itemCap);
    var wfObj = workflowResult.getOutput();
    for (i in wfObj) {
        var fTaskSM = wfObj[i];
        if (fTaskSM.getTaskDescription().equals(taskName)) {
            var relationArray = aa.workflow.getProcessRelationByCapID(itemCap, null).getOutput()
            for (thisRel in relationArray) {
                y = relationArray[thisRel]
                if (y.getParentTaskName() && y.getParentTaskName().equals(fTaskSM.getTaskDescription()))
                    childId = y.getProcessID()
            }
        }
    }

    for (i in wfObj) {
        var fTaskSM = wfObj[i];
        if (fTaskSM.getProcessID() == childId)
            childTasks.push(fTaskSM)
    }

    return childTasks;

}

function addFeeWithExtraData(fcode, fsched, fperiod, fqty, finvoice, feeCap, feeComment, UDF1, UDF2) {
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        fsm = aa.finance.getFeeItemByPK(feeCap, feeSeq).getOutput().getF4FeeItem();

        if (feeComment) fsm.setFeeNotes(feeComment);
        if (UDF1) fsm.setUdf1(UDF1);
        if (UDF2) fsm.setUdf2(UDF2);

        aa.finance.editFeeItem(fsm)


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
                logMessage("Invoicing assessed fee items is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
        return null;
    }

    return feeSeq;

}

function copyFees(sourceCapId, targetCapId, activityID, period) {

    forceInvoice = false;  //follow the fee invoice flag
    forceInvoiceYes = false;

    if (arguments.length > 4) // optional parameter to force invoicing on or off
    {
        forceInvoice = true;
        forceInvoiceYes = arguments[4];
    }

    var feeSeqArray = new Array();
    var invoiceNbrArray = new Array();
    var feeAllocationArray = new Array();

    var feeA = loadFees(sourceCapId)

    for (x in feeA) {
        thisFee = feeA[x];

        if (thisFee.status != "INVOICED" && thisFee.status != "NEW") continue;

        aa.print("We have a fee " + thisFee.code + " status : " + thisFee.status);
	feeQuantity = (period * thisFee.unit)

        if (forceInvoice && forceInvoiceYes) {
            addFeeWithExtraData(thisFee.code, thisFee.sched, thisFee.period, feeQuantity, "Y", targetCapId, activityID, null, activityID)

            aa.print("We are invoicing the fee " + thisFee.code + " status : " + thisFee.status);
            var feeSeqArray = new Array();
            var paymentPeriodArray = new Array();

            feeSeqArray.push(thisFee.sequence);
            paymentPeriodArray.push(thisFee.period);
            var invoiceResult_L = aa.finance.createInvoice(sourceCapId, feeSeqArray, paymentPeriodArray);

            if (!invoiceResult_L.getSuccess())
                aa.print("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
        }
        else {
            addFeeWithExtraData(thisFee.code, thisFee.sched, thisFee.period, feeQuantity, "N", targetCapId, activityID, null, activityID)

        }

    }

}

function createSearchData(itemCapId, englishTradeName, arabicTradeName) {
    var itemCap = aa.cap.getCap(itemCapId).getOutput();
    var capType = itemCap.getCapType();
    var filterName = aa.cap.getCapTypeFilterName(capType).getOutput();
    var altID = itemCapId.getCustomID();


    var scriptResult = aa.specialSearch.isTradeNameExist(englishTradeName, arabicTradeName);
    if (!scriptResult.getSuccess()) {
        logDebug("**ERROR: when execute isTradeNameExist");
        return "-1";
    }

    if (!String(scriptResult.getOutput()) == 'false') {
        logDebug("**ERROR: Trade Name already exists");
        return false;
    }

    var removeResult = aa.specialSearch.removeSearchDataByCapID(capId);
    if (!removeResult.getSuccess()) {
        logDebug("**ERROR: Failed to remove generic search data : " + removeResult.getErrorMessage());
        return false;
    }

    var searchDataModel = aa.specialSearch.newSearchDataModel().getOutput();
    searchDataModel.setEntityType(filterName);
    searchDataModel.setSearchGroupID(0);
    searchDataModel.setEntityID(altID.toUpperCase());
    searchDataModel.setAuditID(currentUserID);
    searchDataModel.setCapID(itemCapId);
    searchDataModel.setServiceProviderCode(itemCapId.getServiceProviderCode());

    searchDataModel.setOriginData1(englishTradeName);
    searchDataModel.setOriginData2(arabicTradeName);
    englishTradeName = aa.specialSearch.getPureEnglishText(englishTradeName).getOutput();
    arabicTradeName = aa.specialSearch.getPureArabicText(arabicTradeName).getOutput();
    searchDataModel.setSearchData1(englishTradeName);
    searchDataModel.setSearchData2(arabicTradeName);



    var createResult = aa.specialSearch.createSearchData(searchDataModel);
    if (!createResult.getSuccess()) {
        logDebug("**ERROR: Failed to created generic search data : " + createResult.getErrorMessage());
        return false;
    }

    return true;

}


function createLicenseSearchEntries(itemCapId) {
    var scriptResult = aa.licenseProfessional.getLicensedProfessionalsByCapID(itemCapId);
  );
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

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


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
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

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function logDebug(dstr)
	{


	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

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
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
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
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
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
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue,ernate 10")

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

function copyAEFees(sourceCapId, targetCapId, activityID, period) {

    forceInvoice = false;  //follow the fee invoice flag
    forceInvoiceYes = false;

    if (arguments.length > 4) // optional parameter to force invoicing on or off
    {
        forceInvoice = true;
        forceInvoiceYes = arguments[4];
    }

    var feeSeqArray = new Array();
    var invoiceNbrArray = new Array();
    var feeAllocationArray = new Array();

    var feeA = loadFees(sourceCapId)

    for (x in feeA) {
        thisFee = feeA[x];

        if (thisFee.accCodeL1 == null) {

        feeQuantity = (period * thisFee.unit)

        addFeeWithExtraData(thisFee.code, thisFee.sched, thisFee.period, feeQuantity, "N", targetCapId, activityID, null, activityID)

        }

    }

}