/*------------------------------------------------------------------------------------------------------/
| SVN $Id: InspectionResultSubmitBefore.js 4687 2009-08-21 21:35:56Z john.schomp $
| Program : InspectionResultSubmitBefore.js
| Event   : InspectionResultSubmitBefore
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
var showMessage = false;			// Set to true to see results in popup window
var showDebug = true;				// Set to true to see debug messages in popup window
var controlString = "InspectionResultSubmitBefore"; // Standard choice for control
var preExecute = "PreExecuteForBeforeEvents"
var cancel = false ; 				// Setting cancel to true in standard choices will cancel the event
var documentOnly = false;			// Document Only -- displays hierarchy of std choice steps
var disableTokens = false;			// turn off tokenizing of App Specific and Parcel Attributes
var useAppSpecificGroupName = false;		// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;		// Use Group name when populating Task Specific Info Values
var enableVariableBranching = false;					// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99;				// Maximum number of std choice entries.  Must be Left Zero Padded
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

var capId = getCapId();							// CapId object
var cap = aa.cap.getCap(capId).getOutput();				// Cap object
var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code
var currentUserID = aa.env.getValue("CurrentUserID");   		// Current User
var capIDString = capId.getCustomID();					// alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString();				// Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/");				// Array of application type string
var currentUserGroup = null;
if(appTypeArray[0].substr(0,1) !="_") //Model Home Check
{
	var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
	if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
}

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

var InspectionDate = aa.env.getValue("InspectionDate");
var InspectionMode = aa.env.getValue("InspectionMode");
var InspectionTime = aa.env.getValue("InspectionTime");
var InspectionTypeList = aa.env.getValue("InspectionTypeList")
var inspTypeArr = InspectionTypeList.toString().split("\\|");
var InspectorFirstName = aa.env.getValue("InspectorFirstName");
var InspectorLastName = aa.env.getValue("InspectorLastName");
var InspectorMiddleName = aa.env.getValue("InspectorMiddleName");
var NumberOfInspections = aa.env.getValue("NumberOfInspections");

logDebug("InspectionDate = " + InspectionDate);
logDebug("InspectionMode = " + InspectionMode);
logDebug("InspectionTime = " + InspectionTime);
logDebug("NumberOfInspections = " + NumberOfInspections);
logDebug("InspectionTypeList = " + InspectionTypeList);
logDebug("InspectorLastName = " + InspectorLastName);
logDebug("InspectorFirstName = " + InspectorFirstName);

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

var inspIdArr

for (inspCount in inspTypeArr)
	{
	var InspectionType = inspTypeArr[inspCount];
	var inspType = InspectionType
	logDebug("InspectionType = " + inspTypeArr[inspCount]);  // Kept for old scripts
	logDebug("inspType = " + InspectionType);
	doStandardChoiceActions(controlString,true,0);
	}

// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
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





function addParcelAndOwnerFromRefAddress(refAddress)  // optional capID
	{

	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	// first add the primary parcel
	//
	var primaryParcelResult = aa.parcel.getPrimaryParcelByRefAddressID(refAddress,"Y");
	if (primaryParcelResult.getSuccess())
		var primaryParcel = primaryParcelResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get primary parcel for ref Address " + refAddress + " , " + primaryParcelResult.getErrorMessage()); return false; }

	var capParModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(capId,primaryParcel).getOutput()

	var createPMResult = aa.parcel.createCapParcel(capParModel);
	if (createPMResult.getSuccess())
		logDebug("created CAP Parcel");
	else
		{ logDebug("**WARNING: Failed to create the cap Parcel " + createPMResult.getErrorMessage()); }


	// Now the owners
	//

	var parcelListResult = aa.parcel.getParcelDailyByCapID(capId,null);
	if (parcelListResult.getSuccess())
		var parcelList = parcelListResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Parcel List " + parcelListResult.getErrorMessage()); return false; }


	for (var thisP in parcelList)
  		{
  		var ownerListResult = aa.owner.getOwnersByParcel(parcelList[thisP]);
		if (ownerListResult.getSuccess())
			var ownerList = ownerListResult.getOutput();
		else
			{ logDebug("**ERROR: Failed to get Owner List " + ownerListResult.getErrorMessage()); return false; }

  		for (var thisO in ownerList)
      			{
      			ownerList[thisO].setCapID(capId);
      			createOResult = aa.owner.createCapOwnerWithAPOAttribute(ownerList[thisO]);

			if (createOResult.getSuccess())
				logDebug("Created CAP Owner");
			else
				{ logDebug("**WARNING: Failed to create CAP Owner " + createOResult.getErrorMessage()); }
			}
	      	}
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
				logDebug("Successfully added condition to Parcel " + parcelNum + reateCapContactWithRefPeopleModel(capId, peopleObj[0]);
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
} function addressExistsOnCap()
{
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

	var fcapAddressObj = null;
	var capAddResult = aa.address.getAddressByCapId(capId);
	if (capAddResult.getSuccess())
		var fcapAddressObj = capAddResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Address object: " + capAddResult.getErrorType() + ":" + capAddResult.getErrorMessage()); return false; }

	for (i in fcapAddressObj)
	{
		return true;
	}

	return false;
}
function addStdCondition(cType,cDesc)
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


function asiTableValObj(columnName, fieldValue, readOnly) {
	this.columnName = columnName;
	this.fieldValue = fieldValue;
	this.readOnly = readOnly;

	asiTableValObj.prototype.toString=function(){ return this.fieldValue }
};


function assignCap(assignId) // option CapId
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDnt]);  // Kept for old scripts
	logDebug("inspType = " + InspectionType);
	doStandardChoiceActions(controlString,true,0);
	}

// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
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





function addParcelAndOwnerFromRefAddress(refAddress)  // optional capID
	{

	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	// first add the primary parcel
	//
	var primaryParcelResult = aa.parcel.getPrimaryParcelByRefAddressID(refAddress,"Y");
	if (primaryParcelResult.getSuccess())
		var primaryParcel = primaryParcelResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get primary parcel for ref Address " + refAddress + " , " + primaryParcelResult.getErrorMessage()); return false; }

	var capParModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(capId,primaryParcel).getOutput()

	var createPMResult = aa.parcel.createCapParcel(capParModel);
	if (createPMResult.getSuccess())
		logDebug("created CAP Parcel");
	else
		{ logDebug("**WARNING: Failed to create the cap Parcel " + createPMResult.getErrorMessage()); }


	// Now the owners
	//

	var parcelListResult = aa.parcel.getParcelDailyByCapID(capId,null);
	if (parcelListResult.getSuccess())
		var parcelList = parcelListResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Parcel List " + parcelListResult.getErrorMessage()); return false; }


	for (var thisP in parcelList)
  		{
  		var ownerListResult = aa.owner.getOwnersByParcel(parcelList[thisP]);
		if (ownerListResult.getSuccess())
			var ownerList = ownerListResult.getOutput();
		else
			{ logDebug("**ERROR: Failed to get Owner List " + ownerListResult.getErrorMessage()); return false; }

  		for (var thisO in ownerList)
      			{
      			ownerList[thisO].setCapID(capId);
      			createOResult = aa.owner.createCapOwnerWithAPOAttribute(ownerList[thisO]);

			if (createOResult.getSuccess())
				logDebug("Created CAP Owner");
			else
				{ logDebug("**WARNING: Failed to create CAP Owner " + createOResult.getErrorMessage()); }
			}
	      	}
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
				logDebug("Successfully added condition to Parcel " + parcelNum + Message());
			return false;
			}
		}
	}


function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}

function convertStringToPhone(theString)
	{
	var n = "22233344455566677778889999";

	var compString = String(theString.toUpperCase());
	var retString = "";

	for (var x=0 ; x< compString.length ; x++)
   		{
   		if (compString[x] >= "A" && compString[x] <= "Z")
   			retString += n[compString.charCodeAt(x)-65]
  		 else
   			retString += compString[x];
  		}
   	return retString;
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
	  	editAppSpecific(asi,AInfo[asi],newCap)
	}

function copyASIFields(sourceCapId,targetCapId)  // optional groups to ignore
	{
	var ignoreArray = new Array();
	for (var i=2; i<arguments.length;i++)
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
		var bcv = valArray[thisCV];
		bcv.setCapID(newcap);
		createResult = aa.finance.createBCalcValuatn(bcv);
		if (!createResult.getSuccess())
			{ logMessage("**ERROR: Creating new calc valuatn on target cap ID: " + createResult.getErrorMessage()); return false; }
		}
	}
function copyConditions(fromCapId)
	{
	var getFromCondResult = aa.capCondition.getCapConditions(fromCapId);
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
	}function copyFees(sourceCapId,targetCapId)
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
			var invoiceResult_L = aa.finance.createInvoice(sourceCapId, feeSeqArray, paymennt]);  // Kept for old scripts
	logDebug("inspType = " + InspectionType);
	doStandardChoiceActions(controlString,true,0);
	}

// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
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





function addParcelAndOwnerFromRefAddress(refAddress)  // optional capID
	{

	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	// first add the primary parcel
	//
	var primaryParcelResult = aa.parcel.getPrimaryParcelByRefAddressID(refAddress,"Y");
	if (primaryParcelResult.getSuccess())
		var primaryParcel = primaryParcelResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get primary parcel for ref Address " + refAddress + " , " + primaryParcelResult.getErrorMessage()); return false; }

	var capParModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(capId,primaryParcel).getOutput()

	var createPMResult = aa.parcel.createCapParcel(capParModel);
	if (createPMResult.getSuccess())
		logDebug("created CAP Parcel");
	else
		{ logDebug("**WARNING: Failed to create the cap Parcel " + createPMResult.getErrorMessage()); }


	// Now the owners
	//

	var parcelListResult = aa.parcel.getParcelDailyByCapID(capId,null);
	if (parcelListResult.getSuccess())
		var parcelList = parcelListResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Parcel List " + parcelListResult.getErrorMessage()); return false; }


	for (var thisP in parcelList)
  		{
  		var ownerListResult = aa.owner.getOwnersByParcel(parcelList[thisP]);
		if (ownerListResult.getSuccess())
			var ownerList = ownerListResult.getOutput();
		else
			{ logDebug("**ERROR: Failed to get Owner List " + ownerListResult.getErrorMessage()); return false; }

  		for (var thisO in ownerList)
      			{
      			ownerList[thisO].setCapID(capId);
      			createOResult = aa.owner.createCapOwnerWithAPOAttribute(ownerList[thisO]);

			if (createOResult.getSuccess())
				logDebug("Created CAP Owner");
			else
				{ logDebug("**WARNING: Failed to create CAP Owner " + createOResult.getErrorMessage()); }
			}
	      	}
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
				logDebug("Successfully added condition to Parcel " + parcelNum + odel.getCity());
	newLic.setCityCode(licProfScriptModel.getCityCode());
	newLic.setContactFirstName(licProfScriptModel.getContactFirstName());
	newLic.setContactLastName(licProfScriptModel.getContactLastName());
	newLic.setContactMiddleName(licProfScriptModel.getContactMiddleName());
	newLic.setContryCode(licProfScriptModel.getCountryCode());
	newLic.setCountry(licProfScriptModel.getCountry());
	newLic.setEinSs(licProfScriptModel.getEinSs());
	newLic.setEMailAddress(licProfScriptModel.getEmail());
	newLic.setFax(licProfScriptModel.getFax());
	newLic.setLicenseType(licProfScriptModel.getLicenseType());
	newLic.setLicOrigIssDate(licProfScriptModel.getLicesnseOrigIssueDate());
	newLic.setPhone1(licProfScriptModel.getPhone1());
	newLic.setPhone2(licProfScriptModel.getPhone2());
	newLic.setSelfIns(licProfScriptModel.getSelfIns());
	newLic.setState(licProfScriptModel.getState());
	newLic.setLicState(licProfScriptModel.getState());
	newLic.setSuffixName(licProfScriptModel.getSuffixName());
	newLic.setWcExempt(licProfScriptModel.getWorkCompExempt());
	newLic.setZip(licProfScriptModel.getZip());

	if (updating)
		myResult = aa.licenseScript.editRefLicenseProf(newLic);
	else
		myResult = aa.licenseScript.createRefLicenseProf(newLic);

	if (myResult.getSuccess())
		{
		logDebug("Successfully added/updated License ID : " + rlpId)
		return rlpId;
		}
	else
		{ logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage()); }
	}

function dateAdd(td,amt)
	// perform date arithmetic on a string
	// td can be "mm/dd/yyyy" (or any string that will convert to JS date)
	// amt can be positive or negative (5, -3) days
	// if optional parameter #3 is present, use working days only
	{

	var useWorking = false;
	if (arguments.length == 3)
		useWorking = true;

	if (!td)
		dDate = new Date();
	else
		dDate = new Date(td);
	var i = 0;
	if (useWorking)
		if (!aa.calendar.getNextWorkDay)
			{
			logDebug("getNextWorkDay function is only available in Accela Automation 6.3.2 or higher.");
			while (i < Math.abs(amt))
				{
				dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * (amt > 0 ? 1 : -1)));
				if (dDate.getDay() > 0 && dDate.getDay() < 6)
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

function deleteTask(targetCapId,deleteTaskName)
{
	//
	// Get the target Task
	//
	var workflowResult = aa.workflow.getTasks(targetCapId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	var tTask = null;

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if (fTask.getTaskDescription().toUpperCase().equals(deleteTaskName.toUpperCase()))
  			{
			var tTask = wfObj[i];
			}

		}

	if (!tTask)
  	  	{ logDebug("**WARNING: Task not found: " + deleteTaskName); return false; }


	logDebug("Removing task " + tTask.getTaskDescription());
	var result = aa.workflow.removeTask(tTask)

	if (!result.getSuccess())
		{ logDebug("error " + result.getErrorMessage()); return false; }

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



function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds"nt]);  // Kept for old scripts
	logDebug("inspType = " + InspectionType);
	doStandardChoiceActions(controlString,true,0);
	}

// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
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





function addParcelAndOwnerFromRefAddress(refAddress)  // optional capID
	{

	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	// first add the primary parcel
	//
	var primaryParcelResult = aa.parcel.getPrimaryParcelByRefAddressID(refAddress,"Y");
	if (primaryParcelResult.getSuccess())
		var primaryParcel = primaryParcelResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get primary parcel for ref Address " + refAddress + " , " + primaryParcelResult.getErrorMessage()); return false; }

	var capParModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(capId,primaryParcel).getOutput()

	var createPMResult = aa.parcel.createCapParcel(capParModel);
	if (createPMResult.getSuccess())
		logDebug("created CAP Parcel");
	else
		{ logDebug("**WARNING: Failed to create the cap Parcel " + createPMResult.getErrorMessage()); }


	// Now the owners
	//

	var parcelListResult = aa.parcel.getParcelDailyByCapID(capId,null);
	if (parcelListResult.getSuccess())
		var parcelList = parcelListResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Parcel List " + parcelListResult.getErrorMessage()); return false; }


	for (var thisP in parcelList)
  		{
  		var ownerListResult = aa.owner.getOwnersByParcel(parcelList[thisP]);
		if (ownerListResult.getSuccess())
			var ownerList = ownerListResult.getOutput();
		else
			{ logDebug("**ERROR: Failed to get Owner List " + ownerListResult.getErrorMessage()); return false; }

  		for (var thisO in ownerList)
      			{
      			ownerList[thisO].setCapID(capId);
      			createOResult = aa.owner.createCapOwnerWithAPOAttribute(ownerList[thisO]);

			if (createOResult.getSuccess())
				logDebug("Created CAP Owner");
			else
				{ logDebug("**WARNING: Failed to create CAP Owner " + createOResult.getErrorMessage()); }
			}
	      	}
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
				logDebug("Successfully added condition to Parcel " + parcelNum + (); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		if ( feestr.equals(feeObjArr[ff].getFeeCod()) && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray) ) )
			return true;

	return false;
	}

function feeGetTotByDateRange(pStartDate, pEndDate)
	// gets total for fees assessed during date range
	// optional fee statuses to check for
	{
	//get End and Start Dates
	var jsStartDate = new Date(pStartDate);
	jsStartDate.setHours(0,0,0,0); //Bring StartDate to 00:00 AM
	var jsEndDate = new Date(pEndDate);
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
			for (i in appspecObj)
				if( appspecObj[i].getCheckboxDesc() == itemName && (!useAppSpecificGroupName || appspecObj[i].getCheckboxType() == itemGroup) )
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

function getChildren(pCapType, pParentCapId)
	{
	// Returns an array of children capId objects whose cap type matches pCapType parameter
	// Wildcard * may be used in pCapType, e.g. "Building/Commercial/*/*"
	// Optional 3rd parameter pChnt]);  // Kept for old scripts
	logDebug("inspType = " + InspectionType);
	doStandardChoiceActions(controlString,true,0);
	}

// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
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





function addParcelAndOwnerFromRefAddress(refAddress)  // optional capID
	{

	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	// first add the primary parcel
	//
	var primaryParcelResult = aa.parcel.getPrimaryParcelByRefAddressID(refAddress,"Y");
	if (primaryParcelResult.getSuccess())
		var primaryParcel = primaryParcelResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get primary parcel for ref Address " + refAddress + " , " + primaryParcelResult.getErrorMessage()); return false; }

	var capParModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(capId,primaryParcel).getOutput()

	var createPMResult = aa.parcel.createCapParcel(capParModel);
	if (createPMResult.getSuccess())
		logDebug("created CAP Parcel");
	else
		{ logDebug("**WARNING: Failed to create the cap Parcel " + createPMResult.getErrorMessage()); }


	// Now the owners
	//

	var parcelListResult = aa.parcel.getParcelDailyByCapID(capId,null);
	if (parcelListResult.getSuccess())
		var parcelList = parcelListResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Parcel List " + parcelListResult.getErrorMessage()); return false; }


	for (var thisP in parcelList)
  		{
  		var ownerListResult = aa.owner.getOwnersByParcel(parcelList[thisP]);
		if (ownerListResult.getSuccess())
			var ownerList = ownerListResult.getOutput();
		else
			{ logDebug("**ERROR: Failed to get Owner List " + ownerListResult.getErrorMessage()); return false; }

  		for (var thisO in ownerList)
      			{
      			ownerList[thisO].setCapID(capId);
      			createOResult = aa.owner.createCapOwnerWithAPOAttribute(ownerList[thisO]);

			if (createOResult.getSuccess())
				logDebug("Created CAP Owner");
			else
				{ logDebug("**WARNING: Failed to create CAP Owner " + createOResult.getErrorMessage()); }
			}
	      	}
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
				logDebug("Successfully added condition to Parcel " + parcelNum + lt.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	cd = cdScriptObj.getCapDetailModel();

	var sReturn = cd.getShortNotes();

	if(sReturn != null)
		return sReturn;
	else
		return "";
}function getTaskDueDate(wfstr) // optional process name.
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
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*")  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var dueDate = wfObj[i].getDueDate();
			if (dueDate)
				return new Date(dueDate.getMonth() + "/" + dueDate.getDayOfMonth() + "/" + dueDate.getYear());
			}
		}
	}

function getTaskStatusForEmail(stask)
	{
	// returns a string of task statuses for a workflow group
	var returnStr = ""
	var taskResult = aa.workflow.getTasks(capId);
	if (taskResult.getSuccess())
		{ var taskArr = taskResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting tasks : " + taskResult.getErrorMessage()); return false }

	for (xx in taskArr)
		if (taskArr[xx].getProcessCode().equals(stask) && taskArr[xx].getCompleteFlag().equals("Y"))
			{
			returnStr+="Task Name: " + taskArr[xx].getTaskDescription() + "\n";
			returnStr+="Task Status: " + taskArr[xx].getDisposition() + "\n";
			if (taskArr[xx].getDispositionComment() != null)
				returnStr+="Task Comments: " + taskArr[xx].getDispositionComment() + "\n" ;
			returnStr+="\n";
			}
	logDebug(returnStr);
	return returnStr;
	}


function xmlEscapeXMLToHTML(xmlData) {
    /*************************************************************************************
    Function:       xmlEscapeXMLToHTML

    author:         xwisdom@yahoo.com

    description:
        Encodes XML data for use in a web page

    ************************************************************************************/
    var gt;

    var str = xmlData;

    //replace & with &
    gt = -1;
    while (str.indexOf("&", gt + 1) > -1) {
        var gt = str.indexOf("&", gt + 1);
        var newStr = str.substr(0, gt);
        newStr += "&";
        newStr = newStr + str.substr(gt + 1, str.length);
        str = newStr;
    }

    //replace < with <
    gt = -1;
    while (str.indexOf("<", gt + 1) > -1) {
        var gt = str.indexOf("<", gt + 1);
        var newStr = str.substr(0, gt);
        newStr += "<";
        newStr = newStr + str.substr(gt + 1, str.length);
        str = newStr;
    }

    //replace > with >
    gt = -1;
    while (str.indexOf(">", gt + 1) > -1) {
        var gt = str.indexOf(">", gt + 1);
        var newStr = str.substr(0, gt);
        newStr += ">";
        newStr = newStr + str.substr(gt + 1, str.length);
        str = newStr;
    }

    //replace \n with <br>
    gt = -1;
    while (str.indexOf("\n", gt + 1) > -1) {
        var gt = str.indexOf("\n", gt + 1);
        var newStr = str.substr(0, gt);
        newStr += "<br>";
        newStr = newStr + str.substr(gt + 1, str.length);
        str = newStr;
    }

    return str

}  // end function xmlEscapeXMLToHTML

function inspCancelAll()
	{
	var isCancelled = false;
	var inspResults = aa.inspection.getInspections(capId);
	if (inspResults.getSuccess())
		{
		var inspAll = inspResults.getOutput();
		var inspectionId;
		var cancelResult;
		for (ii in inspAll)
			{
			if (inspAll[ii].getDocumentDescription().equals("Insp Scheduled") && inspAll[ii].getAuditStatus().equals("A"))
				{
				inspectionId = inspAll[ii].getIdNumber();		// Inspection identifier
				cancelResult = aa.inspection.cancelInspection(capId,inspectionId);
				if (cancelResult.getSuccess())
					{
					logMessage("Cancelling inspection: " + inspAll[ii].getInspectionType());
					isCancelled = true;
					}
				else
					logMessage("**ERROR","**ERROR: Cannot cancel inspection: "+inspAll[ii].getInspectionType()+", "+cancelResult.getErrorMessage());
				}
		  }
		}
	else
		logMessage("**ERROR: getting inspections: " + inspResults.getErrorMessage());

	return isCancelled;
	}

function invoiceFee(fcode,fperiod)
    {
    //invoices all assessed fees having fcode and fperiod
    // SR5085 LL
    var feeFound=false;
    getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
    if (getFeeResult.getSuccess())
        {
        var feeList = getFeeResult.getOutput();
        for (feeNum in feeList)
			if (feeList[feeNum].getFeeitemStatus().equals("NEW"))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
                feeFound=true;
                logDebug("Assessed fee "+fcode+" found and tagged for invoicing");
                }
        }
    else
		{ logDebug( "**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())}
    return feeFound;
    }function isReadyRenew(capid) {
    if (capid == null || aa.util.instanceOfString(capid)) {
        return false;
    }
    var result = aa.expiration.isExpiredLicenses(capid);
    if (result.getSuccess()) {
        return true;
    }
    else {
        logDebug("ERROR: Failed to get expiration with CAP(" + capid + "): " + result.getErrorMessage());
    }
    return false;
}

function isRenewProcess(parentCapID, partialCapID) {
    //1. Check to see parent CAP ID is null.
    if (parentCapID == null || partialCapID == null)
    { logDebug("ERROR: the parentCapID or the partialCap ID is null"); return false; }
    //2. Get CAPModel by PK for partialCAP.
    var result = aa.cap.getCap(partialCapID);
    if (result.getSuccess()) {
        capScriptModel = result.getOutput();
        //2.1. Check to see if it is partial CAP.
        if (capScriptModel.isCompleteCap()) {
            logDebug("ERROR: It is not partial CAP(" + capScriptModel.getCapID() + ")");
            return false;
        }
    }
    else {
        logDebug("ERROR: Fail to get CAPModel (" + partialCapID + "): " + result.getErrorMessage());
        return false;
    }
    //3.  Check to see if the renewal was initiated before.
    result = aa.cap.getProjectByMasterID(parentCapID, "Renewal", "Incomplete");
    if (result.getSuccess()) {
        partialProjects = result.getOutput();
        if (partialProjects != null && partialProjects.length > 0) {
            //Avoid to initiate renewal process multiple times.
            logDebug("Warning: Renewal process was initiated before. ( " + parentCapID + ")");
            return false;
        }

    }
    //4 . Check to see if parent CAP is ready for renew.
    return isReadyRenew(parentCapID);
}function isScheduled(inspType)
	{
	var found = false;
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
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
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processNant]);  // Kept for old scripts
	logDebug("inspType = " + InspectionType);
	doStandardChoiceActions(controlString,true,0);
	}

// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
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





function addParcelAndOwnerFromRefAddress(refAddress)  // optional capID
	{

	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	// first add the primary parcel
	//
	var primaryParcelResult = aa.parcel.getPrimaryParcelByRefAddressID(refAddress,"Y");
	if (primaryParcelResult.getSuccess())
		var primaryParcel = primaryParcelResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get primary parcel for ref Address " + refAddress + " , " + primaryParcelResult.getErrorMessage()); return false; }

	var capParModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(capId,primaryParcel).getOutput()

	var createPMResult = aa.parcel.createCapParcel(capParModel);
	if (createPMResult.getSuccess())
		logDebug("created CAP Parcel");
	else
		{ logDebug("**WARNING: Failed to create the cap Parcel " + createPMResult.getErrorMessage()); }


	// Now the owners
	//

	var parcelListResult = aa.parcel.getParcelDailyByCapID(capId,null);
	if (parcelListResult.getSuccess())
		var parcelList = parcelListResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Parcel List " + parcelListResult.getErrorMessage()); return false; }


	for (var thisP in parcelList)
  		{
  		var ownerListResult = aa.owner.getOwnersByParcel(parcelList[thisP]);
		if (ownerListResult.getSuccess())
			var ownerList = ownerListResult.getOutput();
		else
			{ logDebug("**ERROR: Failed to get Owner List " + ownerListResult.getErrorMessage()); return false; }

  		for (var thisO in ownerList)
      			{
      			ownerList[thisO].setCapID(capId);
      			createOResult = aa.owner.createCapOwnerWithAPOAttribute(ownerList[thisO]);

			if (createOResult.getSuccess())
				logDebug("Created CAP Owner");
			else
				{ logDebug("**WARNING: Failed to create CAP Owner " + createOResult.getErrorMessage()); }
			}
	      	}
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
				logDebug("Successfully added condition to Parcel " + parcelNum + ("lookup(" + stdChoice + "," + stdValue + ") does not exist");
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


function lookupFeesByValuationSlidingScale(stdChoiceEntry,stdChoiceValue,capval) // optional arg number
	{
	var valNumber = 2;
	if (arguments.length == 4) valNumber = (arguments[3] + 1);

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
				if (valNumber == 2)
					saveVal = workVals[valNumber];
				else
					{
					var divisor = workVals[1];
					saveVal = parseInt((capval - workVals[0])/divisor);
					if ((capval - workVals[0]) % divisor > 0) saveVal++;
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


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

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

	return (dDate.getMonth()+1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();;
	}


function openUrlInNewWindow(myurl)
 {
 //
 // showDebug or showMessage must be true for this to work
 //
 newurl = "<SCRIPT LANGUAGE=\"JavaScript\">\r\n<!--\r\n newwin = window.open(\""
 newurl+=myurl
 newurl+="\"); \r\n  //--> \r\n </SCRIPT>"

 comment(newurl)
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

function parcelConditionExists(condtype)
	{
	var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
	if (!capParcelResult.getSuccess())
		{ logDebug("**WARNING: error getting cap parcels : " + capParcelResult.getErrorMessage()) ; return false }

	var Parcels = capParcelResult.getOutput().toArray();
	for (zz in Parcels)
		{
		pcResult = aa.parcelCondition.getParcelConditions(Parcels[zz].getParcelNumber());
		if (!pcResult.getSuccess())
			{ logDebug("**WARNING: error getting parcel conditions : " + pcResult.getErrorMessage()) ; return false }
		pcs = pcResult.getOutput();
		for (pc1 in pcs)
			if (pcs[pc1].getConditionType().equals(condtype)) return true;
		}
	}

function parcelExistsOnCap()
{
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

	var fcapParcelObj = null;
	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
	if (capParcelResult.getSuccess())
		var fcapParcelObj = capParcelResult.getOutput().toArray();
	else
		{ logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage()); return false; }

	for (i in fcapParcelObj)
	{
		return true;
	}

	return false;
}function paymentGetNotAppliedTot() //gets total Amount Not Applied on current CAP
	{
	var amtResult = aa.cashier.getSumNotAllocated(capId);
	if (amtResult.getSuccess())
		{
		var appliedTot = amtResult.getOutput();
		//logDebug("Total Amount Not Applied = $"+appliedTot.toString());
		return parseFloat(appliedTot);
		}
	else
		{
		logDebug("**ERROR: Getting total not applied: " + amtResult.getErrorMessage());
		return false;
		}
	return false;
	}

funcnt]);  // Kept for old scripts
	logDebug("inspType = " + InspectionType);
	doStandardChoiceActions(controlString,true,0);
	}

// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
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





function addParcelAndOwnerFromRefAddress(refAddress)  // optional capID
	{

	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	// first add the primary parcel
	//
	var primaryParcelResult = aa.parcel.getPrimaryParcelByRefAddressID(refAddress,"Y");
	if (primaryParcelResult.getSuccess())
		var primaryParcel = primaryParcelResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get primary parcel for ref Address " + refAddress + " , " + primaryParcelResult.getErrorMessage()); return false; }

	var capParModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(capId,primaryParcel).getOutput()

	var createPMResult = aa.parcel.createCapParcel(capParModel);
	if (createPMResult.getSuccess())
		logDebug("created CAP Parcel");
	else
		{ logDebug("**WARNING: Failed to create the cap Parcel " + createPMResult.getErrorMessage()); }


	// Now the owners
	//

	var parcelListResult = aa.parcel.getParcelDailyByCapID(capId,null);
	if (parcelListResult.getSuccess())
		var parcelList = parcelListResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Parcel List " + parcelListResult.getErrorMessage()); return false; }


	for (var thisP in parcelList)
  		{
  		var ownerListResult = aa.owner.getOwnersByParcel(parcelList[thisP]);
		if (ownerListResult.getSuccess())
			var ownerList = ownerListResult.getOutput();
		else
			{ logDebug("**ERROR: Failed to get Owner List " + ownerListResult.getErrorMessage()); return false; }

  		for (var thisO in ownerList)
      			{
      			ownerList[thisO].setCapID(capId);
      			createOResult = aa.owner.createCapOwnerWithAPOAttribute(ownerList[thisO]);

			if (createOResult.getSuccess())
				logDebug("Created CAP Owner");
			else
				{ logDebug("**WARNING: Failed to create CAP Owner " + createOResult.getErrorMessage()); }
			}
	      	}
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
				logDebug("Successfully added condition to Parcel " + parcelNum +  in wfObj)
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
function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
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
    // 12/22/2008 - DQ - Correct Invoice loop to accumulate instead of reset each iteration

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
        				adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit();
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
function updateRefParcelToCap() //Takes Optional CapId
{
	var vCapId = null;
	if (arguments.length > 0)
		vCapId = arguments[0];
	else
nt]);  // Kept for old scripts
	logDebug("inspType = " + InspectionType);
	doStandardChoiceActions(controlString,true,0);
	}

// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
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





function addParcelAndOwnerFromRefAddress(refAddress)  // optional capID
	{

	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	// first add the primary parcel
	//
	var primaryParcelResult = aa.parcel.getPrimaryParcelByRefAddressID(refAddress,"Y");
	if (primaryParcelResult.getSuccess())
		var primaryParcel = primaryParcelResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get primary parcel for ref Address " + refAddress + " , " + primaryParcelResult.getErrorMessage()); return false; }

	var capParModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(capId,primaryParcel).getOutput()

	var createPMResult = aa.parcel.createCapParcel(capParModel);
	if (createPMResult.getSuccess())
		logDebug("created CAP Parcel");
	else
		{ logDebug("**WARNING: Failed to create the cap Parcel " + createPMResult.getErrorMessage()); }


	// Now the owners
	//

	var parcelListResult = aa.parcel.getParcelDailyByCapID(capId,null);
	if (parcelListResult.getSuccess())
		var parcelList = parcelListResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get Parcel List " + parcelListResult.getErrorMessage()); return false; }


	for (var thisP in parcelList)
  		{
  		var ownerListResult = aa.owner.getOwnersByParcel(parcelList[thisP]);
		if (ownerListResult.getSuccess())
			var ownerList = ownerListResult.getOutput();
		else
			{ logDebug("**ERROR: Failed to get Owner List " + ownerListResult.getErrorMessage()); return false; }

  		for (var thisO in ownerList)
      			{
      			ownerList[thisO].setCapID(capId);
      			createOResult = aa.owner.createCapOwnerWithAPOAttribute(ownerList[thisO]);

			if (createOResult.getSuccess())
				logDebug("Created CAP Owner");
			else
				{ logDebug("**WARNING: Failed to create CAP Owner " + createOResult.getErrorMessage()); }
			}
	      	}
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
				logDebug("Successfully added condition to Parcel " + parcelNum + 