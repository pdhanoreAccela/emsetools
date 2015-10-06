/*------------------------------------------------------------------------------------------------------/
| Program : AddressAddAfterV1.5.js
| Event   : AddressAddAfter
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
var showMessage = false;						// Set to true to see results in popup window
var showDebug = true;							// Set to true to see debug messages in popup window
var controlString = "AddressAddAfter";	 				// Standard choice for control
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
var br = "<BR>";							// Break Tag
var feeSeqList = new Array();						// invoicing fee list
var paymentPeriodList = new Array();					// invoicing pay periods

if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}


capId= aa.env.getValue("CapIdModel")
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
else
	{
	logDebug("**ERROR getting cap detail : " + capDetailObjResult.getErrorMessage());
	}

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


if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables -- moved up here since we have to get the capid from the parcel model
/------------------------------------------------------------------------------------------------------*/

var addressModel = aa.env.getValue("AddressModel");
var addressAttribute  = aa.env.getValue("AddressAttribute");
logDebug("addressModel = " + addressModel.getClass());
logDebug("addressAttribute = " + addressAttribute.getClass());

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

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
				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						eval(token(doObj.elseact));
					lastEvalTrue = false;
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
	debug+=dstr + br;
	}

function logMessage(dstr)
	{
	message+=dstr + br;
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
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		aa.print( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

 

  function addASITable(tableName,tableValueArray) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField()

	for (thisrow in tableValueArray)
		{
		var col = tsm.getColumns()
		var coli = col.iterator();

		while (coli.hasNext())
			{
			var colname = coli.next();
			fld.add(tableValueArray[thisrow][colname.getColumnName()]);
			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()]);
			}

		tsm.setTableField(fld);

		if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

		}

	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

	// Even when this works it gives an index out of range error
	//if (!addResult .getSuccess())
	//	{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	//else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}

 
function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	// Updated Script will return feeSeq number or null if error encountered (SR5112) 
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	var feeSeq = null;
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
		feeSeq = null;
		}
	
	return feeSeq;
	   
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

 
function addParcelCondition(parcelNum, cType,cStatus,cDesc,cComment,cImpact)
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
						logDebug("Successfully added condition to ParceCondition(cType,cDesc)
	{

	if (!aa.capCondition.getStandardConditions)
		{
		logDebug("addStdCondition function is not available in this version of Accela Automation.");
		}
        else
		{
		standardConditions = aa.capCondition.getStandardConditions(cType,cDesc).getOutput();
		for(i = 0; i<standardConditions.length;i++)
			{
			standardCondition = standardConditions[i]
			var addCapCondResult = aa.capCondition.addCapCondition(capId, standardCondition.getConditionType(), standardCondition.getConditionDesc(), standardCondition.getConditionComment(), sysDate, null, sysDate, null, null, standardCondition.getImpactCode(), systemUserObj, systemUserObj, "Applied", currentUserID, "A")
	        	if (addCapCondResult.getSuccess())
	        		{
				logMessage("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
				logDebug("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
				}
			else
				{
				logDebug( "**ERROR: adding condition (" + standardCondition.getConditionDesc() + "): " + addCapCondResult.getErrorMessage());
				}
			}
		}
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
	var fld = tsm.getTableField()
	var col = tsm.getColumns()
	var coli = col.iterator();

	while (coli.hasNext())
		{
		colname = coli.next();
		fld.add(tableValues[colname.getColumnName()]);
		}

	tsm.setTableField(fld);

	if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

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
	} 
function assignInspection(iNumber,iName)
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

	aa.inspection.editInspection(iObj)
	}

 
function assignTask(wfstr,username) // optional process name
	{
	// Assigns the task to a user.  No audit.
	//
	var useProcess = false;
	var processName = "";
	if (arguments.length =;
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
				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						eval(token(doObj.elseact));
					lastEvalTrue = false;
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
	debug+=dstr + br;
	}

function logMessage(dstr)
	{
	message+=dstr + br;
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
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		aa.print( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

 

  function addASITable(tableName,tableValueArray) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField()

	for (thisrow in tableValueArray)
		{
		var col = tsm.getColumns()
		var coli = col.iterator();

		while (coli.hasNext())
			{
			var colname = coli.next();
			fld.add(tableValueArray[thisrow][colname.getColumnName()]);
			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()]);
			}

		tsm.setTableField(fld);

		if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

		}

	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

	// Even when this works it gives an index out of range error
	//if (!addResult .getSuccess())
	//	{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	//else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}

 
function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	// Updated Script will return feeSeq number or null if error encountered (SR5112) 
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	var feeSeq = null;
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
		feeSeq = null;
		}
	
	return feeSeq;
	   
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

 
function addParcelCondition(parcelNum, cType,cStatus,cDesc,cComment,cImpact)
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
						logDebug("Successfully added condition to Parceion.getCapConditions(fromCapId);
	if (getFromCondResult.getSuccess())
		var condA = getFromCondResult.getOutput();
	else
		{ logDebug( "**ERROR: getting cap conditions: " + getFromCondResult.getErrorMessage()) ; return false}
		
	for (cc in condA)
		{
		var thisC = condA[cc];
		
		var addCapCondResult = aa.capCondition.addCapCondition(capId, thisC.getConditionType(), thisC.getConditionDescription(), thisC.getConditionComment(), thisC.getEffectDate(), thisC.getExpireDate(), sysDate, thisC.getRefNumber1(),thisC.getRefNumber2(), thisC.getImpactCode(), thisC.getIssuedByUser(), thisC.getStatusByUser(), thisC.getConditionStatus(), currentUserID, "A")
		if (addCapCondResult.getSuccess())
			logDebug("Successfully added condition (" +  thisC.getImpactCode() + ") " +  thisC.getConditionDescription());
		else
			logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

 
function copyConditionsFromParcel(parcelIdString)
		{
		var getFromCondResult = aa.parcelCondition.getParcelConditions(parcelIdString)
		if (getFromCondResult.getSuccess())
			var condA = getFromCondResult.getOutput();
		else
			{ logDebug( "**WARNING: getting parcel conditions: " + getFromCondResult.getErrorMessage()) ; return false}
			
		for (cc in condA)
			{
			var thisC = condA[cc];
			
			if (!appHasCondition(thisC.getConditionType(),null,thisC.getConditionDescription(),thisC.getImpactCode()))
				{
				var addCapCondResult = aa.capCondition.addCapCondition(capId, thisC.getConditionType(), thisC.getConditionDescription(), thisC.getConditionComment(), thisC.getEffectDate(), thisC.getExpireDate(), sysDate, thisC.getRefNumber1(),thisC.getRefNumber2(), thisC.getImpactCode(), thisC.getIssuedByUser(), thisC.getStatusByUser(), thisC.getConditionStatus(), currentUserID, "A")
				if (addCapCondResult.getSuccess())
					logDebug("Successfully added condition (" +  thisC.getImpactCode() + ") " +  thisC.getConditionDescription());
				else
					logDebug( "**ERROR: adding condition (" + thisC.getImpactCode() + "): " + addCapCondResult.getErrorMessage());
				}
			else
				logDebug( "**WARNING: adding condition (" + thisC.getImpactCode() + "): condition already exists");
				
			}
		}
 
function copyContacts(pFromCapId, pToCapId)
	{
	//Copies all contacts from pFromCapId to pToCapId
	//07SSP-00037/SP5017
	//
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;
		
	var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
	var copied = 0;
	if (capContactResult.getSuccess())
		{
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts)
			{
			var newContact = Contacts[yy].getCapContactModel();
			newContact.setCapID(vToCapId);
			aa.people.createCapContact(newContact);
			copied++;
			logDebug("Copied contact from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
			}
		}
	else
		{
		logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage()); 
		return false; 
		}
	return copied;
	} 
function copyFees(sourceCapId,targetCapId)
	{

	var feeSeqArray = new Array();
	var invoiceNbrArray = new Array();
	var feeAllocationArray = new Array();

	var feeA = loadFees(sourceCapId)

	for (x in feeA)
		{
		thisFee = feeA[x];
		
		logMessage("We have a fee " + thisFee.code + " status : " + thisFee.status);
		
		if (thisFee.status == "INVOICED")
			{
			addFee(thisFee.code,thisFee.sched,thisFee.period,thisFee.unit,"Y",targetCapId)

			var feeSeqArray = new Array();
			var paymentPeriodArray = new Array();

			feeSeqArray.push(thisFee.sequence);
			paymentPeriodArray.push(thisFee.period);
			var invoiceResult_L = aa.finance.createInvoice(sourceCapId, feeSeqArray, paymentPeriodArray);

			if (!invoiceResult_L.getSuccess())
				aa.print("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
			}


		if (thisFee.status == "NEW")
			{
			addFee(thisFee.code,thisFee.sched,thisFee.period,thisFee.unit,"N",targetCapId)
			}

		}

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
	} 
function copySchedInspections(pFromCapId, pToCapId)
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
				logDebug("Copied scheduled inspection fro;
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
				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						eval(token(doObj.elseact));
					lastEvalTrue = false;
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
	debug+=dstr + br;
	}

function logMessage(dstr)
	{
	message+=dstr + br;
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
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		aa.print( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

 

  function addASITable(tableName,tableValueArray) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField()

	for (thisrow in tableValueArray)
		{
		var col = tsm.getColumns()
		var coli = col.iterator();

		while (coli.hasNext())
			{
			var colname = coli.next();
			fld.add(tableValueArray[thisrow][colname.getColumnName()]);
			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()]);
			}

		tsm.setTableField(fld);

		if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

		}

	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

	// Even when this works it gives an index out of range error
	//if (!addResult .getSuccess())
	//	{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	//else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}

 
function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	// Updated Script will return feeSeq number or null if error encountered (SR5112) 
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	var feeSeq = null;
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
		feeSeq = null;
		}
	
	return feeSeq;
	   
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

 
function addParcelCondition(parcelNum, cType,cStatus,cDesc,cComment,cImpact)
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
						logDebug("Successfully added condition to ParcegDebug("**ERROR: No cap detail script object") ; return false; }
		
	cd = cdScriptObj.getCapDetailModel();
	
	cd.setHouseCount(parseFloat(numHouse));
		
	cdWrite = aa.cap.editCapDetail(cd)
	
	if (cdWrite.getSuccess())
		{ logDebug("Updated house count to " + numHouse); return true; }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	} 

function editLookup(stdChoice,stdValue,stdDesc) 
	{
	//check if stdChoice and stdValue already exist; if they do, update;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		bds = bizDomScriptResult.getOutput();
		}
	else
		{
		logDebug("Std Choice(" + stdChoice + "," + stdValue + ") does not exist to edit, adding...");
		addLookup(stdChoice,stdValue,stdDesc);
		return false;
		}
	var bd = bds.getBizDomain()
		
	bd.setDescription(stdDesc);
	var editResult = aa.bizDomain.editBizDomain(bd)
	
	if (editResult.getSuccess())
		logDebug("Successfully edited Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
	else
		logDebug("**ERROR editing Std Choice " + editResult.getErrorMessage());
	}

 
function editPriority(priority) // option CapId
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

	cd.setPriority(priority);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("updated priority to " + priority) ; return true; }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
} 

function editRefLicProfAttribute(pLicNum,pAttributeName,pNewAttributeValue)
	{

	var attrfound = false;
	var oldValue = null;

	licObj = getRefLicenseProf(pLicNum)

	if (!licObj)
		{ logDebug("**WARNING Licensed Professional : " + pLicNum + " not found") ; return false }

	licSeqNum = licObj.getLicSeqNbr();
	attributeType = licObj.getLicenseType();

	if (licSeqNum==0 || licSeqNum==null || attributeType=="" || attributeType==null)
		{ logDebug("**WARNING Licensed Professional Sequence Number or Attribute Type missing") ; return false }

	var peopAttrResult = aa.people.getPeopleAttributeByPeople(licSeqNum, attributeType);

	if (!peopAttrResult.getSuccess())
		{ logDebug("**WARNING retrieving reference license professional attribute: " + peopAttrResult.getErrorMessage()); return false }

	var peopAttrArray = peopAttrResult.getOutput();

	for (i in peopAttrArray)
		{
		if ( pAttributeName.equals(peopAttrArray[i].getAttributeName()))
			{
			oldValue = peopAttrArray[i].getAttributeValue()
			attrfound = true;
			break;
			}
		}

	if (attrfound)
		{
		logDebug("Updated Ref Lic Prof: " + pLicNum + ", attribute: " + pAttributeName + " from: " + oldValue + " to: " + pNewAttributeValue)
		peopAttrArray[i].setAttributeValue(pNewAttributeValue);
		aa.people.editPeopleAttribute(peopAttrArray[i].getPeopleAttributeModel());
		}
	else
		{
		logDebug("**WARNING attribute: " + pAttributeName + " not found for Ref Lic Prof: "+ pLicNum)
		/* make a new one with the last model.  Not optimal but it should work
		newPAM = peopAttrArray[i].getPeopleAttributeModel();
		newPAM.setAttributeName(pAttributeName);
		newPAM.setAttributeValue(pNewAttributeValue);
		newPAM.setAttributeValueDataType("Number");
		aa.people.createPeopleAttribute(newPAM);
		*/
		}
	} 
function editReportedChannel(reportedChannel) // option CapId
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

	cd.setReportedChannel(reportedChannel);

	cdWrite = aa.cap.editCapDetail(cd);

	if (cdWrite.getSuccess())
		{ logDebug("updated reported channel to " + reportedChannel) ; return true; }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
} 
function editTaskComment(wfstr,wfcomment) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 3) 
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
	
	for (i in wfObj)
		{
   		fTask = wfObj[i];
  		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
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

 
function editTaskDueDate(wfstr,wfdate) // optional process name.  if wfstr == "*", set for all tasks
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 3) 
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
	
	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*")  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
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

 
function editTaskSpecific(wfName,itemName,itemValue)  // optional: itemCap
	{
	var updated = false;
	var i=0;
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
 	for (i in wfObj)
 		{
 		fTask = wfObj[i];
 		stepnumber = fTask.getStepNumber();
 		processID = fTask.getProcessID();
 		if (wfName.equals(fTask.getTaskDescription())) // Found the right Workflow Task
 			{
  		TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(itemCap,processID,stepnumber,itemName);
 			if (TSIResult.getSuccess())
 				{
	 			var TSI = TSIResult.getOutput();
				if (TSI != null)
					{
					var TSIArray = new Array();
					TSInfoModel = TSI.getTaskSpecificInfoModel();
					TSInfoModel.setChecklistComment(itemValue);
					TSIArray.push(TSInfoModel);
					TSIUResult = aa.taskSpecificInfo.editTaskSpecInf;
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
				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						eval(token(doObj.elseact));
					lastEvalTrue = false;
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
	debug+=dstr + br;
	}

function logMessage(dstr)
	{
	message+=dstr + br;
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
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		aa.print( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

 

  function addASITable(tableName,tableValueArray) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField()

	for (thisrow in tableValueArray)
		{
		var col = tsm.getColumns()
		var coli = col.iterator();

		while (coli.hasNext())
			{
			var colname = coli.next();
			fld.add(tableValueArray[thisrow][colname.getColumnName()]);
			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()]);
			}

		tsm.setTableField(fld);

		if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

		}

	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

	// Even when this works it gives an index out of range error
	//if (!addResult .getSuccess())
	//	{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	//else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}

 
function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	// Updated Script will return feeSeq number or null if error encountered (SR5112) 
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	var feeSeq = null;
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
		feeSeq = null;
		}
	
	return feeSeq;
	   
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

 
function addParcelCondition(parcelNum, cType,cStatus,cDesc,cComment,cImpact)
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
						logDebug("Successfully added condition to Parce+ ":" + bufferTargetResult.getErrorMessage()) ; return false }
			
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
				var v = proxObj[z1].getAttributeValues();
				retArray.push(v[0]);
				}
			
			}
		}
	return retArray;
	}

 
// function getInspector: returns the inspector ID (string) of the scheduled inspection.  Returns the first result
//
function getInspector(insp2Check)
	{
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()))
				{
				// have to re-grab the user since the id won't show up in this object.
				inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(),inspList[xx].getInspector().getMiddleName(),inspList[xx].getInspector().getLastName()).getOutput();
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
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();
		
		inspList.sort(compareInspDateDesc)
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()) && !inspList[xx].getInspectionStatus().equals("Scheduled"))
				{
				// have to re-grab the user since the id won't show up in this object.
				inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(),inspList[xx].getInspector().getMiddleName(),inspList[xx].getInspector().getLastName()).getOutput();
				return inspUserObj.getUserID();
				}
		}
	return null;
	}

function compareInspDateDesc(a,b) { return (a.getScheduledDate().getEpochMilliseconds() < b.getScheduledDate().getEpochMilliseconds()); }
 
function getNode(fString,fName)
	{
	 var fValue = "";
	 var startTag = "<"+fName+">";
	 var endTag = "</"+fName+">";

	 startPos = fString.indexOf(startTag) + startTag.length;
	 endPos = fString.indexOf(endTag);
	 // make sure startPos and endPos are valid before using them
	 if (startPos > 0 && startPos < endPos)
		  fValue = fString.substring(startPos,endPos);

	 return unescape(fValue);
	}
	
 
function getParent() 
	{
	// returns the capId object of the parent.  Assumes only one parent!
	//
	getCapResult = aa.cap.getProjectParents(capId,1);
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

 
function getParents(pAppType) 
	{
		// returns the capId array of all parent caps
	    //Dependency: appMatch function
		//
        
		var i = 1;
        while (true)
        {
			if (!(aa.cap.getProjectParents(capId,i).getSuccess()))
				break;
         
			i += 1;
        }
        i -= 1;

		getCapResult = aa.cap.getProjectParents(capId,i);
        myArray = new Array();

		if (getCapResult.getSuccess())
		{
			parentArray = getCapResult.getOutput();
			
			if (parentArray.length)
			{
				for(x in parentArray)
				{
					if (pAppType != null)
					{
						//If parent type matches apType pattern passed in, add to return array
						if ( appMatch( pAppType, parentArray[x].getCapID() ) )
							myArray.push(parentArray[x].getCapID());
					}
					else
						myArray.push(parentArray[x].getCapID());
				}		
				
				return myArray;
			}
			else
			{
				logDebug( "**WARNING: GetParent found no project parent for this application");
				return null;
			}
		}
		else
		{ 
			logDebug( "**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
			return null;
		}
	}

 
function getProp(fString,fName)
	{
	 var fValue = "";
	 var startTag = fName + "='";
	 var endTag = "'";
	 startPos = fString.indexOf(startTag) + startTag.length;
	 if (startPos > 0)
	   fValue = fString.substring(startPos);

	 endPos = fValue.indexOf(endTag);
	 if (endPos > 0)
	  fValue = fValue.substring(0,endPos);

	return unescape(fValue);
	}

 

function getRefLicenseProf(refstlic)
	{
	var refLicObj = null;
	var refLicenseResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(),refstlic);
	if (!refLicenseResult.getSuccess())
		{ logDebug("**ERROR retrieving Ref Lic Profs : " + refLicenseResult.getErrorMessage()); return false; }
	else
		{
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
	
	for (zzz in aoArray)
		{
		var ao = aoArray[zzz];
		// get caps with same address
		capAddResult = aa.cap.getCapListByDetailAddress(ao.getStreetName(),ao.getHouseNumberStart(),ao.getStreetSuffix(),null,ao.getStreetDirection(),null);
		if (capAddResult.getSuccess())
			{ var capIdArray=capAddResult.getOutput(); }
		else
			{ logDebug("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());  return false; }


		// loop through related caps
		for (cappy in capIdArray)
			{
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
	
	var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
	if (capParcelResult.getSuccess())
		{ var Parcels = capParcelResult.getOutput().toArray(); }
	else	
		{ logDebug("**ERROR: getting parcels by cap ID: " + capParcelResult.getErrorMessage()); return false; }

	for (zz in Parcels)
		{
		var ParcelValidatedNumber = Parcels[zz].getParcelNumber();

		// get caps ;
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
				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						eval(token(doObj.elseact));
					lastEvalTrue = false;
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
	debug+=dstr + br;
	}

function logMessage(dstr)
	{
	message+=dstr + br;
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
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		aa.print( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

 

  function addASITable(tableName,tableValueArray) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField()

	for (thisrow in tableValueArray)
		{
		var col = tsm.getColumns()
		var coli = col.iterator();

		while (coli.hasNext())
			{
			var colname = coli.next();
			fld.add(tableValueArray[thisrow][colname.getColumnName()]);
			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()]);
			}

		tsm.setTableField(fld);

		if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

		}

	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

	// Even when this works it gives an index out of range error
	//if (!addResult .getSuccess())
	//	{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	//else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}

 
function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	// Updated Script will return feeSeq number or null if error encountered (SR5112) 
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	var feeSeq = null;
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
		feeSeq = null;
		}
	
	return feeSeq;
	   
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

 
function addParcelCondition(parcelNum, cType,cStatus,cDesc,cComment,cImpact)
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
						logDebug("Successfully added condition to ParcelObj[i].getBook();
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
 
function loadTasks(ltcapidstr)
	{
	if (typeof(ltcapidstr) == "string")
                {
		var ltresult = aa.cap.getCapID(ltcapidstr); 
	 	if (ltresult.getSuccess())
  		 	ltCapId = ltresult.getOutput();
	  	else
  		  	{ logMessage("**ERROR: Failed to get cap ID: " + ltcapidstr + " error: " +  ltresult.getErrorMessage()); return false; }
                }
	else
		ltCapId = ltcapidstr;

  	var taskArr = new Array();
  	
	var workflowResult = aa.workflow.getTasks(ltCapId);
	if (workflowResult.getSuccess())
		wfObj = workflowResult.getOutput();
	else
		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
		fTask = wfObj[i];
		var myTask = new Task();
		myTask.status = fTask.getDisposition();
		myTask.comment = fTask.getDispositionComment();
		myTask.process = fTask.getProcessCode();
                if (fTask.getStatusDate()) myTask.statusdate = "" + fTask.getStatusDate().getMonth() + "/" + fTask.getStatusDate().getDate() + "/" + (fTask.getStatusDate().getYear() + 1900);
		myTask.processID = fTask.getProcessID();
		myTask.note = fTask.getDispositionNote();
		taskArr[fTask.getTaskDescription()] = myTask;
		}			
	return taskArr;
	}

function Task() // Task Object
	{
	this.status = null
	this.comment = null;
	this.note = null;
        this.statusdate = null;
	this.process = null;
	this.processID = null;
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
 
function lookup(stdChoice,stdValue) 
	{
	var strControl;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	
   	if (bizDomScriptResult.getSuccess())
   		{
		var bizDomScriptObj = bizDomScriptResult.getOutput();
		var strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
		logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
		}
	else
		{
		logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
		}
	return strControl;
	}

 
function lookupDateRange(stdChoiceEntry,dateValue) // optional val number 
	{
	var valNumber = 1;
	if (arguments.length == 3) valNumber = arguments[2];

	var compDate = new Date(dateValue);
	var domArr
	for (var count=1; count <= 9999; count++)  // Must be sequential from 01 up to 9999
		{
		var countstr = "0000" + count;
		var countstr = String(countstr).substring(countstr.length,countstr.length - 4);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoiceEntry,countstr);
	   	
	   	if (bizDomScriptResult.getSuccess())
	   		{
			var bizDomScriptObj = bizDomScriptResult.getOutput();
			var domVal = bizDomScriptObj.getDescription();
			if (bizDomScriptObj.getAuditStatus() != 'I')
				{
				var domOld = domArr;
				var domArr = domVal.split("\\^")
				var domDate = new Date(domArr[0])
				if (domDate >= compDate)     //  found the next tier, use the last value
					if (domOld)
						return domOld[valNumber];
					else
						break;
				}					
			}
		else
			if (domArr)
				return domArr[valNumber];
			else
				break;
		}
	}	
 
function lookupFeesByValuation(stdChoiceEntry,stdChoiceValue,capval) // optional arg number 
	{
	var valNumber = 1;
	if (arguments.length == 4) valNumber = arguments[3];

	var saveVal ; 
	var lookupStr = lookup(stdChoiceEntry,stdChoiceValue);
	
	if (lookupStr)
		{
		workArr = lookupStr.split("^");
		for (var i in workArr)
			{
                        aa.print(workArr[i]);
			workVals = workArr[i].split("|");
			if (workVals[0] > capval) 
				return saveVal;
			else
				if (valNumber == 1)
					saveVal = workVals[valNumber];
				else
					{
					saveVal = parseInt((capval - workVals[0])/100);
					if ((capval - workVals[0]) % 100 > 0) saveVal++;
					saveVal = saveVal * workVals[valNumber];
					}
			}
		}
	return saveVal;
	}


 
function loopTask(wfstr,wfstat,wfcomment,wfnote) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 5) 
		{
		processName = arguments[4]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
	
	if (!wfstat) wfstat = "NA";
	
	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.handleDisposition(capId,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"L");
			else
				aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"L");
			
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

	if (!aa.calendar.getNextWorkDay)
		{
		logDebug("getNextWorkDay function is only available in Accela Automation 6.3.2 or higher.");
		}
	else
		{
		var dDate = new Date(aa.calendar.getNextWorkDay(aa.date.parseDate(dDate.getMonth()+1 + "/" + dDate.getDate() + "/" + dDate.getFullYear())).getOutput().getTime());
		}

	re;
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
				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						eval(token(doObj.elseact));
					lastEvalTrue = false;
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
	debug+=dstr + br;
	}

function logMessage(dstr)
	{
	message+=dstr + br;
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
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		aa.print( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

 

  function addASITable(tableName,tableValueArray) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField()

	for (thisrow in tableValueArray)
		{
		var col = tsm.getColumns()
		var coli = col.iterator();

		while (coli.hasNext())
			{
			var colname = coli.next();
			fld.add(tableValueArray[thisrow][colname.getColumnName()]);
			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()]);
			}

		tsm.setTableField(fld);

		if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

		}

	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

	// Even when this works it gives an index out of range error
	//if (!addResult .getSuccess())
	//	{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	//else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}

 
function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	// Updated Script will return feeSeq number or null if error encountered (SR5112) 
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	var feeSeq = null;
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
		feeSeq = null;
		}
	
	return feeSeq;
	   
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

 
function addParcelCondition(parcelNum, cType,cStatus,cDesc,cComment,cImpact)
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
						logDebug("Successfully added condition to ParcendleDisposition(capId,stepnumber,pStatus,dispositionDate,wfnote,pComment,systemUserObj,"Y");
				logMessage("Closing Workflow Task " + wftask + " with status " + pStatus);
				logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
				}
			}
		}
	}

 
function taskStatus(wfstr) // optional process name and capID
	{
	var useProcess = false;
	var processName = "";
	var itemCap = capId;
	if (arguments.length >= 2)
		{
		processName = arguments[1]; // subprocess
		if (processName) useProcess = true;
		}

	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args



	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			return fTask.getDisposition()
		}
	}

 
function taskStatusDate(wfstr) // optional process name, capId
	{
    
    var itemCap = capId;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

	var useProcess = false;
	var processName = "";
	if (arguments.length > 1 && arguments[1] != null) 
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + wfObj.getErrorMessage()); return false; }
	
	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			return ""+(fTask.getStatusDate().getMonth()+1)+"/"+fTask.getStatusDate().getDate()+"/"+(parseInt(fTask.getStatusDate().getYear())+1900);
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

 
function updateFee(fcode,fsched,fperiod,fqty,finvoice,pDuplicate,pFeeSeq) 
	{
    // Updates an assessed fee with a new Qty.  If not found, adds it; else if invoiced fee found, adds another with adjusted qty.
    // optional param pDuplicate -if "N", won't add another if invoiced fee exists (SR5085)
    // Script will return fee sequence number if new fee is added otherwise it will return null (SR5112)
    // Optional param pSeqNumber, Will attempt to update the specified Fee Sequence Number or Add new (SR5112)
        
    // If optional argument is blank, use default logic (i.e. allow duplicate fee if invoiced fee is found)        
    if ( pDuplicate==null || pDuplicate.length==0 )
        pDuplicate = "Y";
    else
        pDuplicate = pDuplicate.toUpperCase();
        
    var invFeeFound=false;    
    var adjustedQty=fqty;
    var feeSeq = null;
	feeUpdated = false;

	if(pFeeSeq == null)
		getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
	else
		getFeeResult = aa.finance.getFeeItemByPK(capId,pFeeSeq);


	if (getFeeResult.getSuccess())
		{
		if(pFeeSeq == null)
			var feeList = getFeeResult.getOutput();
		else
		     {
			var feeList = new Array();
			feeList[0] = getFeeResult.getOutput();
		     }
		for (feeNum in feeList)
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
                    if (pDuplicate=="Y")
                        {
                        logDebug("Invoiced fee "+fcode+" found, subtracting invoiced amount from update qty.");
        				adjustedQty = fqty - feeList[feeNum].getFeeUnit();
                        invFeeFound=true;
                        }
                    else
                        {
                        invFeeFound=true;
                        logDebug("Invoiced fee "+fcode+" found.  Not updating this fee. Not assessing new fee "+fcode);
                        }
				}

		for (feeNum in feeList)
			if (feeList[feeNum].getFeeitemStatus().equals("NEW") && !feeUpdated)  // update this fee item
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();
				var editResult = aa.finance.editFeeItemUnit(capId, fqty, feeSeq);
				feeUpdated = true;
				if (editResult.getSuccess())
					{
					logDebug("Updated Qty on Existing Fee Item: " + fcode + " to Qty: " + fqty);
					if (finvoice == "Y")
						{
						feeSeqList.push(feeSeq);
						paymentPeriodList.push(fperiod);
						}
					}
				else
					{ logDebug( "**ERROR: updating qty on fee item (" + fcode + "): " + editResult.getErrorMessage()); break }
				}
		}
	else
		{ logDebug( "**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())}

    // Add fee if no fee has been updated OR invoiced fee already exists and duplicates are allowed
	if ( !feeUpdated && adjustedQty != 0 && (!invFeeFound || invFeeFound && pDuplicate=="Y") ) 
		feeSeq = addFee(fcode,fsched,fperiod,adjustedQty,finvoice);
	else
		feeSeq = null;
			
	return feeSeq;
	} 

function updateShortNotes(newSN) // option CapId
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

	cd.setShortNotes(newSN);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("updated short notes to " + newSN) }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	} 
function updateTask(wfstr,wfstat,wfcomment,wfnote) // optional process name, cap id
	{
	var useProcess = false;
	var processN;
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
				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						eval(token(doObj.elseact));
					lastEvalTrue = false;
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
	debug+=dstr + br;
	}

function logMessage(dstr)
	{
	message+=dstr + br;
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
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		aa.print( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

 

  function addASITable(tableName,tableValueArray) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField()

	for (thisrow in tableValueArray)
		{
		var col = tsm.getColumns()
		var coli = col.iterator();

		while (coli.hasNext())
			{
			var colname = coli.next();
			fld.add(tableValueArray[thisrow][colname.getColumnName()]);
			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()]);
			}

		tsm.setTableField(fld);

		if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

		}

	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

	// Even when this works it gives an index out of range error
	//if (!addResult .getSuccess())
	//	{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	//else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}

 
function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	// Updated Script will return feeSeq number or null if error encountered (SR5112) 
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	var feeSeq = null;
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
		feeSeq = null;
		}
	
	return feeSeq;
	   
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

 
function addParcelCondition(parcelNum, cType,cStatus,cDesc,cComment,cImpact)
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
						logDebug("Successfully added condition to Parce