/*------------------------------------------------------------------------------------------------------/
| SVN $Id: ApplicationSubmitBefore.js 3600 2008-10-27 21:36:24Z dane.quatacker $
| Program : ApplicationSubmitBeforeV1.5.js
| Event   : ApplicationSubmitBefore
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   : Custom loadASITablesBefore for Abu Dhabi
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
var controlString = "ApplicationSubmitBefore"; 	// Standard choice for control
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
var message =	"";					// Message String
var debug = "";
var br = "<BR>";					// Break Tag
//////////////////////////////////////
var SCRIPT_VERSION = 2.0
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));
//////////////////////////////////////////////////////
if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}

logDebug("<B>EMSE Script Results</B>");
/////////////////////////////////////////////////////
function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}
////////////////////////////////////////////////////////

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

var AdditionalInfoBuildingCount 	= aa.env.getValue("AdditionalInfoBuildingCount");
var AdditionalInfoConstructionTypeCode 	= aa.env.getValue("AdditionalInfoConstructionTypeCode");
var AdditionalInfoHouseCount 		= aa.env.getValue("AdditionalInfoHouseCount");
var AdditionalInfoPublicOwnedFlag 	= aa.env.getValue("AdditionalInfoPublicOwnedFlag");
var AdditionalInfoValuation 		= aa.env.getValue("AdditionalInfoValuation");
var AdditionalInfoWorkDescription 	= aa.env.getValue("AdditionalInfoWorkDescription");
var AddressCity 			= aa.env.getValue("AddressCity");
var AddressHouseFraction 		= aa.env.getValue("AddressHouseFraction");
var AddressHouseNumber 			= aa.env.getValue("AddressHouseNumber");
var AddressPrimaryFlag 			= aa.env.getValue("AddressPrimaryFlag");
var AddressState 			= aa.env.getValue("AddressState");
var AddressStreetDirection 		= aa.env.getValue("AddressStreetDirection");
var AddressStreetName 			= aa.env.getValue("AddressStreetName");
var AddressStreetSuffix 		= aa.env.getValue("AddressStreetSuffix");
var AddressUnitNumber 			= aa.env.getValue("AddressUnitNumber");
var AddressUnitType 			= aa.env.getValue("AddressUnitType");
var AddressValidatedNumber 		= aa.env.getValue("AddressValidatedNumber");
var AddressZip 				= aa.env.getValue("AddressZip");
var AppSpecificInfoModels 		= aa.env.getValue("AppSpecificInfoModels");
var ApplicantAddressLine1 		= aa.env.getValue("ApplicantAddressLine1");
var ApplicantAddressLine2 		= aa.env.getValue("ApplicantAddressLine2");
var ApplicantAddressLine3 		= aa.env.getValue("ApplicantAddressLine3");
var ApplicantBusinessName 		= aa.env.getValue("ApplicantBusinessName");
var ApplicantCity 			= aa.env.getValue("ApplicantCity");
var ApplicantContactType 		= aa.env.getValue("ApplicantContactType");
var ApplicantCountry 			= aa.env.getValue("ApplicantCountry");
var ApplicantEmail 			= aa.env.getValue("ApplicantEmail");
var ApplicantFirstName 			= aa.env.getValue("ApplicantFirstName");
var ApplicantId 			= aa.env.getValue("ApplicantId");
var ApplicantLastName 			= aa.env.getValue("ApplicantLastName");
var ApplicantMiddleName 		= aa.env.getValue("ApplicantMiddleName");
var ApplicantPhone1 			= aa.env.getValue("ApplicantPhone1");
var ApplicantPhone2 			= aa.env.getValue("ApplicantPhone2");
var ApplicantRelation 			= aa.env.getValue("ApplicantRelation");
var ApplicantState 			= aa.env.getValue("ApplicantState");
var ApplicantZip 			= aa.env.getValue("ApplicantZip");
var ApplicationSubmitMode 		= aa.env.getValue("ApplicationSubmitMode");
var ApplicationName 			= aa.env.getValue("AppSpecialText");
var ApplicationTypeLevel1 		= aa.env.getValue("ApplicationTypeLevel1");
var ApplicationTypeLevel2 		= aa.env.getValue("ApplicationTypeLevel2");
var ApplicationTypeLevel3 		= aa.env.getValue("ApplicationTypeLevel3");
var ApplicationTypeLevel4 		= aa.env.getValue("ApplicationTypeLevel4");
var CAEAddressLine1 			= aa.env.getValue("CAEAddressLine1");
var CAEAddressLine2 			= aa.env.getValue("CAEAddressLine2");
var CAEAddressLine3 			= aa.env.getValue("CAEAddressLine3");
var CAEBusinessName 			= aa.env.getValue("CAEBusinessName");
var CAECity 				= aa.env.getValue("CAECity");
var CAEEmail 				= aa.env.getValue("CAEEmail");
var CAEFirstName 			= aa.env.getValue("CAEFirstName");
var CAELastName 			= aa.env.getValue("CAELastName");
var CAELienseNumber 			= aa.env.getValue("CAELienseNumber");
var CAELienseType 			= aa.env.getValue("CAELienseType");
var CAEMiddleName 			= aa.env.getValue("CAEMiddleName");
var CAEPhone1 				= aa.env.getValue("CAEPhone1");
var CAEPhone2 				= aa.env.getValue("CAEPhone2");
var CAEState 				= aa.env.getValue("CAEState");
var CAEValidatedNumber 			= aa.env.getValue("CAEValidatedNumber");
var CAEZip 				= aa.env.getValue("CAEZip");
var ComplainantAddressLine1 		= aa.env.getValue("ComplainantAddressLine1");
var ComplainantAddressLine2 		= aa.env.getValue("ComplainantAddressLine2");
var ComplainantAddressLine3 		= aa.env.getValue("ComplainantAddressLine3");
var ComplainantBusinessName 		= aa.env.getValue("ComplainantBusinessName");
var ComplainantCity 			= aa.env.getValue("ComplainantCity");
var ComplainantContactType 		= aa.env.getValue("ComplainantContactType");
var ComplainantCountry 			= aa.env.getValue("ComplainantCountry");
var ComplainantEmail 			= aa.env.getValue("ComplainantEmail");
var ComplainantFax 			= aa.env.getValue("ComplainantFax");
var ComplainantFirstName 		= aa.env.getValue("ComplainantFirstName");
var ComplainantId 			= aa.env.getValue("ComplainantId");
var ComplainantLastName 		= aa.env.getValue("ComplainantLastName");
var ComplainantMiddleName 		= aa.env.getValue("ComplainantMiddleName");
var ComplainantPhone1 			= aa.env.getValue("ComplainantPhone1");
var ComplainantRelation 		= aa.env.getValue("ComplainantRelation");
var ComplainantState 			= aa.env.getValue("ComplainantState");
var ComplainantZip 			= aa.env.getValue("ComplainantZip");
var ComplaintDate 			= aa.env.getValue("ComplaintDate");
var ComplaintReferenceId1 		= aa.env.getValue("ComplaintReferenceId1");
var ComplaintReferenceId2 		= aa.env.getValue("ComplaintReferenceId2");
var ComplaintReferenceId3 		= aa.env.getValue("ComplaintReferenceId3");
var ComplaintReferenceSource 		= aa.env.getValue("ComplaintReferenceSource");
var ComplaintReferenceType 		= aa.env.getValue("ComplaintReferenceType");
var CurrentUserID 			= aa.env.getValue("CurrentUserID");
var OwnerFirstName 			= aa.env.getValue("OwnerFirstName");
var OwnerFullName 			= aa.env.getValue("OwnerFullName");
var OwnerLastName 			= aa.env.getValue("OwnerLastName");
var OwnerMailAddressLine1 		= aa.env.getValue("OwnerMailAddressLine1");
var OwnerMailAddressLine2 		= aa.env.getValue("OwnerMailAddressLine2");
var OwnerMailAddressLine3 		= aa.env.getValue("OwnerMailAddressLine3");
var OwnerMailCity 			= aa.env.getValue("OwnerMailCity");
var OwnerMailState 			= aa.env.getValue("OwnerMailState");
var OwnerMailZip 			= aa.env.getValue("OwnerMailZip");
var OwnerMiddleName 			= aa.env.getValue("OwnerMiddleName");
var OwnerPhone 				= aa.env.getValue("OwnerPhone");
var OwnerPrimaryFlag 			= aa.env.getValue("OwnerPrimaryFlag");
var OwnerValidatedNumber 		= aa.env.getValue("OwnerValidatedNumber");
var ParcelArea 				= aa.env.getValue("ParcelArea");
var ParcelBlock 			= aa.env.getValue("ParcelBlock");
var ParcelBook 				= aa.env.getValue("ParcelBook");
var ParcelExcemptValue 			= aa.env.getValue("ParcelExcemptValue");
var ParcelImprovedValue 		= aa.env.getValue("ParcelImprovedValue");
var ParcelLandValue 			= aa.env.getValue("ParcelLandValue");
var ParcelLegalDescription 		= aa.env.getValue("ParcelLegalDescription");
var ParcelLot 				= aa.env.getValue("ParcelLot");
var ParcelPage 				= aa.env.getValue("ParcelPage");
var ParcelParcel 			= aa.env.getValue("ParcelParcel");
var ParcelTract 			= aa.env.getValue("ParcelTract");
var ParcelValidatedNumber 		= aa.env.getValue("ParcelValidatedNumber");
var ViolationAddressLine1 		= aa.env.getValue("ViolationAddressLine1");
var ViolationAddressLine2 		= aa.env.getValue("ViolationAddressLine2");
var ViolationCity 			= aa.env.getValue("ViolationCity");
var ViolationComment 			= aa.env.getValue("ViolationComment");
var ViolationLocation 			= aa.env.getValue("ViolationLocation");
var ViolationState 			= aa.env.getValue("ViolationState");
var ViolationZip  			= aa.env.getValue("ViolationZip");

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var appTypeString = ApplicationTypeLevel1 + "/" + ApplicationTypeLevel2 + "/" + ApplicationTypeLevel3 + "/" + ApplicationTypeLevel4;
var appTypeArray = appTypeString.split("/");		// Array of application type string
var currentUserID = aa.env.getValue("CurrentUserID");
var parentCapId = aa.env.getValue("ParentCapID");
var publicUser = false;
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN" ; publicUser = true }  // ignore public users
var AppSpecificInfoModels = aa.env.getValue("AppSpecificInfoModels");
var servProvCode = aa.getServiceProviderCode();
var CAENumber = parseInt(CAEValidatedNumber);
var CAE;
var CAEAtt;

var AInfo = new Array()					// Associative array of appspecifc info
loadAppSpecificBefore(AInfo);
if (!publicUser) loadASITablesBefore();   				// custom for abu dhabi.  only works in V360

// Get CAE Attributes


if (CAENumber > 0)
	{
	var CAEResult = aa.licenseScript.getRefLicenseProfBySeqNbr(servProvCode,CAENumber)
	if (CAEResult.getSuccess())
		{ CAE=CAEResult.getOutput(); }
	else
		{ logDebug("**ERROR: getting CAE : " + CAEResult.getErrorMessage()); }
	}

if (CAE)
	CAEAtt = CAE.getLicenseModel().getAttributes();

if (CAEAtt)
	{
	itr = CAEAtt.values().iterator();
	while(itr.hasNext())
		{
		y = itr.next()
		itr2 = y.iterator();
		while (itr2.hasNext())
			{
			pam = itr2.next();
			AInfo["CAEAttribute." + pam.getAttributeName()] = pam.getAttributeValue();
			}
		}
	}

var systemUserObj = aa.person.getUser(currentUserID).getOutput();  // Current User Object
var sysDate = aa.date.getCurrentDate();

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
//
//  Get the Standard choices entry we'll use for this App type
//  Then, get the action/criteria pairs for this app
//

doStandardChoiceActions(controlString,true,0);

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
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
	}

function loadAppSpecificBefore(thisArr) {
	//
	// Returns an associative array of App Specific Info
	//
	for (loopk in AppSpecificInfoModels)
		{
		if (useAppSpecificGroupName)
			{
			thisArr[AppSpecificInfoModels[loopk].getCheckboxType() + "." + AppSpecificInfoModels[loopk].checkboxDesc] = AppSpecificInfoModels[loopk].checklistComment;
			logDebug("{" + AppSpecificInfoModels[loopk].getCheckboxType() + "." + AppSpecificInfoModels[loopk].checkboxDesc + "} = " + AppSpecificInfoModels[loopk].checklistComment);
			}
			else
			{
			thisArr[AppSpecificInfoModels[loopk].checkboxDesc] = AppSpecificInfoModels[loopk].checklistComment;
			logDebug("{" + AppSpecificInfoModels[loopk].checkboxDesc + "} = " + AppSpecificInfoModels[loopk].checklistComment);
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
	message+=dstr + br;
	}


/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

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


function branch(stdChoice)
	{
	doStandardChoiceActions(stdChoice,true,0);
	}

function comment(cstr)
	{
	if (showDebug) logDebug(cstr);
	if (showMessage) logMessage(cstr);
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

function lookup(stdChoice,stdValue)
	{
	var strControl;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);

   	if (bizDomScriptResult.getSuccess())
   		{
		bizDomScriptObj = bizDomScriptResult.getOutput();
		var strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
		logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
		}
	else
		{
		logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
		}
	return strControl;
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


function getGISInfo(svc,layer,attributename)
{
	// use buffer info to get info on the current object by using distance 0
	// usage:
	//
	// x = getGISInfo("flagstaff","Parcels","LOT_AREA");
	//
	// to be used with ApplicationSubmitBefore only

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

	var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Parcel.  We'll only send the last value
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
	}

	return retString
}
function getRelatedCapsByAddressBefore(ats)
//
// returns the capId object of the parent.  Assumes only one parent!
//
	{
	var retArr = new Array();


	if (AddressValidatedNumber > 0) // get the address info from lookup table
	  {
	  addObj = aa.address.getRefAddressByPK(parseInt(AddressValidatedNumber)).getOutput();
	  AddressStreetName = addObj.getStreetName();
	  AddressHouseNumber = addObj.getHouseNumberStart();
	  AddressStreetSuffix = addObj.getStreetSuffix();
	  AddressZip = addObj.getZip();
	  AddressStreetDirection = addObj.getStreetDirection();
	  }

	 if (AddressStreetDirection == "") AddressStreetDirection = null;
	 if (AddressHouseNumber == "") AddressHouseNumber = 0;
	 if (AddressStreetSuffix == "") AddressStreetSuffix = null;
	 if (AddressZip == "") AddressZip = null;

 	// get caps with same address
 	capAddResult = aa.cap.getCapListByDetailAddress(AddressStreetName,parseInt(AddressHouseNumber),AddressStreetSuffix,AddressZip,AddressStreetDirection,null);
	if (capAddResult.getSuccess())
		{ var capIdArray=capAddResult.getOutput(); }
	else
		{ logDebug("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());  return false; }


	// loop through related caps
	for (cappy in capIdArray)
		{
		// get file date
		relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();

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

	if (retArr.length > 0)
		return retArr;

	}

function getRelatedCapsByParcelBefore(ats)
//
// appsubmitBefore script only.  Returns an array of capids that match the parcelValidatedNumber
// ats, app type string to check for
//
	{
	var retArr = new Array();


	// get caps with same parcel
	var capAddResult = aa.cap.getCapListByParcelID(ParcelValidatedNumber,null);
	if (capAddResult.getSuccess())
		{ var capIdArray=capAddResult.getOutput(); }
	else
		{ logDebug("**ERROR: getting similar parcels: " + capAddResult.getErrorMessage());  return false; }

	// loop through related caps
	for (cappy in capIdArray)
		{
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

	if (retArr.length > 0)
		return retArr;

	}

function jsDateToMMDDYYYY(pJavaScriptDate)
	{
	//converts javascript date to string in MM/DD/YYYY format
	//
	if (pJavaScriptDate != null)
		{
		if (Date.prototype.isPrototypeOf(pJavaScriptDate))
	return (pJavaScriptDate.getMonth()+1).toString()+"/"+pJavaScriptDate.getDate()+"/"+pJavaScriptDate.getFullYear();
		else
			{
			logDebug("Parameter is not a javascript date");
			return ("INVALID JAVASCRIPT DATE");
			}
		}
	else
		{
		logDebug("Parameter is null");
		return ("NULL PARAMETER VALUE");
		}
	}
function proximity(svc,layer,numDistance)  // optional: distanceType
	{
	// returns true if the app has a gis object in proximity
	// to be used with ApplicationSubmitBefore only

	var distanceType = "feet"
	if (arguments.length == 4) distanceType = arguments[3]; // use distance type in arg list

	bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		buf = bufferTargetResult.getOutput();
		buf.addAttributeName(layer + "_ID");
		}
	else
		{ logDebug("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }


	var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

		for (a2 in proxArr)
			{
			proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			if (proxObj.length)
				{
				return true;
				}
			}
		}
	}


function proximityToAttribute(svc,layer,numDistance,distanceType,attributeName,attributeValue)
	{
	// returns true if the app has a gis object in proximity that contains the attributeName = attributeValue
	// use with all events except ApplicationSubmitBefore
	// example usage:
	// 01 proximityToAttribute("flagstaff","Parcels","50","feet","BOOK","107") ^ DoStuff...

	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		buf = bufferTargetResult.getOutput();
		buf.addAttributeName(attributeName);
		}
	else
		{ logDebug("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

	var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }
	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

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
				if (retString && retString.equals(attributeValue))
					return true;
				}

			}
		}
	}

function refLicProfGetDate (pLicNum, pDateType)
	{
	//Returns expiration date from reference licensed professional record
	//pDateType parameter decides which date field is returned.  Options: "EXPIRE" (default), "RENEW","ISSUE","BUSINESS","INSURANCE"
	//Internal Functions needed: convertDate(), jsDateToMMDDYYYY()
	//07SSP-00033/SP5014
	//
	if (pDateType==null || pDateType.length==0)
		var dateType = "EXPIRE";
	else
		{
		var dateType = pDateType.toUpperCase();
		if ( !(dateType=="ISSUE" || dateType=="RENEW" || dateType=="BUSINESS" || dateType=="INSURANCE") )
			dateType = "EXPIRE";
		}

	if (pLicNum==null || pLicNum.length==0)
		{
		logDebug("Invalid license number parameter");
		return ("INVALID PARAMETER");
		}

	var refLicenseResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(),pLicNum);
	if (!refLicenseResult.getSuccess())
		{
		logDebug("**ERROR retrieving reference license professional: " + refLicenseResult.getErrorMessage());
		return false;
		}

	var newLicArray = refLicenseResult.getOutput();
	if (newLicArray)
		{
		newLic = newLicArray[0];
		var jsExpDate = new Date();
		if (dateType=="EXPIRE")
			{
			if (newLic.getLicenseExpirationDate())
				{
				jsExpDate = convertDate(newLic.getLicenseExpirationDate());
				logDebug(pLicNum+" License Expiration Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no License Expiration Date");
				return ("NO DATE FOUND");
				}
			}
		else if (dateType=="INSURANCE")
			{
			if (newLic.getInsuranceExpDate())
				{
				jsExpDate = convertDate(newLic.getInsuranceExpDate());
				logDebug(pLicNum+" Insurance Expiration Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no Insurance Expiration Date");
				return ("NO DATE FOUND");
				}
			}
		else if (dateType=="BUSINESS")
			{
			if (newLic.getBusinessLicExpDate())
				{
				jsExpDate = convertDate(newLic.getBusinessLicExpDate());
				logDebug(pLicNum+" Business Lic Expiration Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no Business Lic Exp Date");
				return ("NO DATE FOUND");
				}
			}
		else if (dateType=="ISSUE")
			{
			if (newLic.getLicenseIssueDate())
				{
				jsExpDate = convertDate(newLic.getLicenseIssueDate());
				logDebug(pLicNum+" License Issue Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no Issue Date");
				return ("NO DATE FOUND");
				}
			}
		else if (dateType=="RENEW")
			{
			if (newLic.getLicenseLastRenewalDate())
				{
				jsExpDate = convertDate(newLic.getLicenseLastRenewalDate());
				logDebug(pLicNum+" License Last Renewal Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no Last Renewal Date");
				return ("NO DATE FOUND");
				}
			}
		else
			return ("NO DATE FOUND");
		}
	else
		{
		logMessage("No reference licensed professional found with state license number of "+pLicNum);
		logDebug("No reference licensed professional found with state license number of "+pLicNum);
		return ("NO LICENSE FOUND");
		}
	}

function getChildren(pCapType, pParentCapId)
	{
	// Returns an array of children capId objects whose cap type matches pCapType parameter
	// Wildcard * may be used in pCapType, e.g. "Building/Commercial/*/*"
	// Optional 3rd parameter pChildCapIdSkip: capId of child to skip

	var retArray = new Array();
		var vCapId = pParentCapId;

	if (arguments.length>2)
		var childCapIdSkip = arguments[2];
	else
		var childCapIdSkip = null;

	var typeArray = pCapType.split("/");
	if (typeArray.length != 4)
		logDebug("**ERROR in childGetByCapType function parameter.  The following cap type parameter is incorrectly formatted: " + pCapType);

	var getCapResult = aa.cap.getChildByMasterID(vCapId);
	if (!getCapResult.getSuccess())
		{ logDebug("**WARNING: getChildren returned an error: " + getCapResult.getErrorMessage()); return null }

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
			if (!typeArray[yy].equals(childTypeArray[yy]) && !typeArray[yy].equals("*"))
				{
				isMatch = false;
				continue;
				}
			}
		if (isMatch)
			retArray.push(childCapId);
		}

	logDebug("getChildren returned " + retArray.length + " capIds");
	return retArray;

	}

function getLicense(tradeNameID,licCapType,licCapStatus)
	{
	// returns the capId of a valid trade license
	var licCapArray = getChildren(licCapType, tradeNameID)

	if (licCapArray == null || licCapArray.length == 0)
		{
		return;
		}

	for (var aps in licCapArray)
		{

		myCap = aa.cap.getCap(licCapArray[aps]).getOutput();
		aa.print(myCap.getCapStatus());
		if (myCap.getCapStatus() == licCapStatus)
			{
			aa.print("License CAP found: Cap Type: " + licCapType + " App Status: " + licCapStatus + "   Cap ID: " + licCapArray[aps].getCustomID().toString());
			return licCapArray[aps];
			}
		}
	}


//// Custom for Abu Dhabi


function loadASITablesBefore() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	//

	var gm =  aa.env.getValue("AppSpecificTableGroupModel");
	var ta = gm.getTablesMap().values()
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

function getDepartmentName(username) {
    var suo = aa.person.getUser(username).getOutput();
    var dpt = aa.people.getDepartmentList(null).getOutput();
    for (var thisdpt in dpt) {
        var m = dpt[thisdpt]
        var n = m.getServiceProviderCode() + "/" + m.getAgencyCode() + "/" + m.getBureauCode() + "/" + m.getDivisionCode() + "/" + m.getSectionCode() + "/" + m.getGroupCode() + "/" + m.getOfficeCode()

        if (n.equals(suo.deptOfUser))
            return (m.getDeptName())
    }
}


function licenseObject(licnumber,itemCap)
{

    this.refProf = null; 	// licenseScriptModel (reference licensed professional)
    this.b1Exp = null; 	// b1Expiration record (renewal status on application)
    this.b1ExpDate = null;
    this.b1ExpCode = null;
    this.b1Status = null;
    this.refExpDate = null;
    this.licNum = licnumber; // License Number


    // Load the reference License Professional if we're linking the two
    if (licnumber) // we're linking
    {
        var newLic = getRefLicenseProf(licnumber)
        if (newLic) {
            this.refProf = newLic;
            tmpDate = newLic.getLicenseExpirationDate();
            if (tmpDate)
                this.refExpDate = tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + tmpDate.getYear();
            logDebug("Loaded reference license professional with Expiration of " + this.refExpDate);
        }
    }

    // Load the renewal info (B1 Expiration)

    b1ExpResult = aa.expiration.getLicensesByCapID(itemCap)
    if (b1ExpResult.getSuccess()) {
        this.b1Exp = b1ExpResult.getOutput();
        tmpDate = this.b1Exp.getExpDate();
        if (tmpDate)
            this.b1ExpDate = tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + tmpDate.getYear();
        this.b1Status = this.b1Exp.getExpStatus();
        logDebug("Found renewal record of status : " + this.b1Status + ", Expires on " + this.b1ExpDate);
    }
    else
    { logDebug("**ERROR: Getting B1Expiration Object for Cap.  Reason is: " + b1ExpResult.getErrorType() + ":" + gisObjResult.getErrorMessage()); return false }


    this.setExpiration = function(expDate)
    // Update expiration date
    {
        var expAADate = aa.date.parseDate(expDate);

        if (this.refProf) {
            this.refProf.setLicenseExpirationDate(expAADate);
            aa.licenseScript.editRefLicenseProf(this.refProf);
            logDebug("Updated reference license expiration to " + expDate);
        }

        if (this.b1Exp) {
            this.b1Exp.setExpDate(expAADate);
            aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
            logDebug("Updated renewal to " + expDate);
        }
    }

    this.setIssued = function(expDate)
    // Update Issued date
    {
        var expAADate = aa.date.parseDate(expDate);

        if (this.refProf) {
            this.refProf.setLicenseIssueDate(expAADate);
            aa.licenseScript.editRefLicenseProf(this.refProf);
            logDebug("Updated reference license issued to " + expDate);
        }

    }
    this.setLastRenewal = function(expDate)
    // Update expiration date
    {
        var expAADate = aa.date.parseDate(expDate)

        if (this.refProf) {
            this.refProf.setLicenseLastRenewalDate(expAADate);
            aa.licenseScript.editRefLicenseProf(this.refProf);
            logDebug("Updated reference license issued to " + expDate);
        }
    }

    this.setStatus = function(licStat)
    // Update expiration status
    {
        if (this.b1Exp) {
            this.b1Exp.setExpStatus(licStat);
            aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
            logDebug("Updated renewal to status " + licStat);
        }
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

function allInspectionsComplete(itemCap)
{
	var inspResultObj = aa.inspection.getInspections(itemCap);
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();
		for (xx in inspList)
		   if (inspList[xx].getInspectionStatus().toUpperCase().equals("SCHEDULED"))
			return false;
		}
	return true;
}

function getAppSpecific(itemName,itemCap)
{
    var updated = false;
    var i = 0;

    var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
    if (appSpecInfoResult.getSuccess()) {
        var appspecObj = appSpecInfoResult.getOutput();

        if (itemName != "") {
            for (i in appspecObj)
                if (appspecObj[i].getCheckboxDesc() == itemName) {
                return appspecObj[i].getChecklistComment();
                break;
            }
        } // item name blank
    }
    else
    { logDebug("**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage()) }
}

function taskStatus(wfstr) // optional process name and capID
	{
	var useProcess = false;
	var processName = "";
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

function getParent(itemCap) {
    // returns the capId object of the parent.  Assumes only one parent!
    //
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

function getLicenseCapId(licenseCapType) {
    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    var capLicenses = getLicenseProfessional(itemCap);
    if (capLicenses == null || capLicenses.length == 0) {
        return;
    }

    for (var capLic in capLicenses) {
        var LPNumber = capLicenses[capLic].getLicenseNbr()
        var lpCapResult = aa.cap.getCapID(LPNumber);
        if (!lpCapResult.getSuccess())
        { logDebug("**ERROR: No cap ID associated with License Number : " + LPNumber); continue; }
        licCapId = lpCapResult.getOutput();
        if (appMatch(licenseCapType, licCapId))
            return licCapId;
    }
}

function getLicenseProfessional(itemcapId) {
    capLicenseArr = null;
    var s_result = aa.licenseProfessional.getLicenseProf(itemcapId);
    if (s_result.getSuccess()) {
        capLicenseArr = s_result.getOutput();
        if (capLicenseArr == null || capLicenseArr.length == 0) {
            aa.print("WARNING: no licensed professionals on this CAP:" + itemcapId);
            capLicenseArr = null;
        }
    }
    else {
        aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
        capLicenseArr = null;
    }
    return capLicenseArr;
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
			aArray["fullName"] = peopleModel.getFullName();
			aArray["businessName2"] = peopleModel.getTradeName();
            aArray["middleName"] = peopleModel.getMiddleName();

			var pa = peopleModel.getAttributes().toArray();
				for (xx1 in pa)
							aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
			cArray.push(aArray);
		}
	}
	return cArray;

}

function getContactArrayBefore(clist)
	{
	// Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
	// optional capid

	var cArray = new Array();

	capContactArray = clist.toArray();

	for (yy in capContactArray)
			{
			logDebug("contactclass : " + capContactArray[yy].getClass());
			var aArray = new Array();
			aArray["lastName"] = capContactArray[yy].getPeople().lastName;
			aArray["firstName"] = capContactArray[yy].getPeople().firstName;
			aArray["businessName"] = capContactArray[yy].getPeople().businessName;
			aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
			aArray["contactType"] =capContactArray[yy].getPeople().contactType;
			aArray["relation"] = capContactArray[yy].getPeople().relation;
			aArray["phone1"] = capContactArray[yy].getPeople().phone1;
			aArray["phone2"] = capContactArray[yy].getPeople().phone2;
			aArray["email"] = capContactArray[yy].getPeople().email;
			aArray["addressLine1"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine1();
			aArray["addressLine2"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine2();
			aArray["city"] = capContactArray[yy].getPeople().getCompactAddress().getCity();
			aArray["state"] = capContactArray[yy].getPeople().getCompactAddress().getState();
			aArray["zip"] = capContactArray[yy].getPeople().getCompactAddress().getZip();
			aArray["fax"] = capContactArray[yy].getPeople().fax;
			aArray["businessName2"] = capContactArray[yy].getPeople().getTradeName();
			aArray["country"] = capContactArray[yy].getPeople().getCompactAddress().getCountry();
			aArray["fullName"] = capContactArray[yy].getPeople().fullName;
			aArray["middleName"] = capContactArray[yy].getPeople().getMiddleName();
			aArray["salutation"] = capContactArray[yy].getPeople().getSalutation();


			var pa = capContactArray[yy].getPeople().getAttributes().toArray();
	                for (xx1 in pa)
	                        {
            				aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
            				logDebug("attribute " + pa[xx1].attributeName + " value: " + pa[xx1].attributeValue);
						    }
			cArray.push(aArray);
			}

	return cArray;
	}

function tradeNameExistsAtAddress(emirate, island, city, primaryArea, secondaryArea, streetOrBlock, buildingType, unitType,
  buildingName, buildingOwnerName, buildingOrPieceNumber, unitSurfaceArea, primary, unitNumber, numberOfSections, sectionNumber) { 
   var address = aa.proxyInvoker.newInstance("com.accela.aa.aamain.address.AddressModel").getOutput();
   address.setServiceProviderCode(aa.getServiceProviderCode());
   address.setInspectionDistrict(emirate.toUpperCase());
   address.setInspectionDistrictPrefix(island.toUpperCase());
   address.setCity(city.toUpperCase());
   address.setAddressLine1(primaryArea.toUpperCase());
   address.setAddressLine2(secondaryArea.toUpperCase());
   address.setStreetName(streetOrBlock.toUpperCase());
   address.setNeighborhood(buildingName.toUpperCase()); 
   address.setCounty(buildingOwnerName.toUpperCase());
   address.setHouseFractionStart(buildingOrPieceNumber.toUpperCase());
   address.setUnitStart(unitNumber);
   address.setPrimaryFlag(primary);
   address.setUnitEnd(numberOfSections);
   address.setZip(sectionNumber);
   if(unitSurfaceArea != "")
      address.setDistance(parseFloat(unitSurfaceArea));

   var retObj = aa.address.getCapIdByAddress(address);
   var capIdArray = retObj.getOutput();
   if(capIdArray.length == 0)
   {
      return false;
   }

   for(i=0; i<capIdArray.length; i++)
   {
      var capType = aa.cap.getCapTypeModelByCapID(capIdArray[i]).getOutput();
      if(!capType.getType() == "Trade Name")
         continue;

      var addyArray = aa.address.getAddressByCapId(capIdArray[i]).getOutput();
      for(j=0; j<addyArray.length; j++)
      {
        var address = addyArray[j];
        // check that this is the same address
        if(emirate == address.getInspectionDistrict() && island == address.getInspectionDistrictPrefix() &&
           city == address.getCity() && primaryArea == address.getAddressLine1() &&
           secondaryArea == address.getAddressLine2() && streetOrBlock == address.getStreetName() &&
           buildingName == convertNullToEmptyString(address.getNeighborhood()) &&
           buildingOwnerName == convertNullToEmptyString(address.getCounty()) &&
           buildingOrPieceNumber == convertNullToEmptyString(address.getHouseNumberStart()) &&
           unitSurfaceArea == convertNullToEmptyString(address.getDistance()) &&
           unitNumber == convertNullToEmptyString(address.getUnitStart()) &&
           primary == convertNullToEmptyString(address.getPrimaryFlag()) &&
           numberOfSections == convertNullToEmptyString(address.getUnitEnd()) &&
           sectionNumber == convertNullToEmptyString(address.getZip()))
        {
           var buildingTypeMatch;
           var unitTypeMatch;
           var attributes = address.getAttributes().toArray();
           for(k=0; k<attributes.length; k++)
           {
             var attribute = attributes[k];
             attrValue = attribute.getB1AttributeValue();
             if(attrValue == null)
                attrValue = "";
             
             if("BUILDING TYPE" == attribute.getB1AttributeName() && buildingType == attrValue)
                 buildingTypeMatch = true;            
             else if("UNIT TYPE" == attribute.getB1AttributeName() && unitType == attrValue)
               unitTypeMatch = true;
           }

           if(buildingTypeMatch && unitTypeMatch)
           {
              return true;
           }
        }
      }
   }

   return false;
}

function convertNullToEmptyString(value) {
  if(value == null)
    return "";

  return value;
}

function getf(thisCap) {
    // Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
    // -- for Before scripts!
    
    var cArray = new Array();

    var capContactResult = aa.people.getCapContactByCapID(thisCap);
    if (capContactResult.getSuccess()) {
        var capContactArray = capContactResult.getOutput();
        for (yy in capContactArray) {
            var aArray = new Array();
            aArray["lastName"] = capContactArray[yy].getPeople().lastName;
            aArray["firstName"] = capContactArray[yy].getPeople().firstName;
            aArray["businessName"] = capContactArray[yy].getPeople().businessName;
            aArray["contactSeqNumber"] = capContactArray[yy].getPeople().contactSeqNumber;
            aArray["contactType"] = capContactArray[yy].getPeople().contactType;
            aArray["relation"] = capContactArray[yy].getPeople().relation;
            aArray["phone1"] = capContactArray[yy].getPeople().phone1;
            aArray["phone2"] = capContactArray[yy].getPeople().phone2;


            var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
            for (xx1 in pa)
                aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
            cArray.push(aArray);
        }
    }
    return cArray;
}

function appHasCondition(pType,pStatus,pDesc,pImpact,itemCAP)
	{
	// Checks to see if conditions have been added to CAP
	// 06SSP-00223
	//

	if (pType==null)
		var condResult = aa.capCondition.getCapConditions(itemCAP);
	else
		var condResult = aa.capCondition.getCapConditions(itemCAP,pType);

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
	}

function feeBalanceAll(itemCap)
	{
	// Searches payment fee items and returns the unpaid balance of a CAP
	var amtFee = 0;
	var amtPaid = 0;
	var feeSch;

	if (arguments.length == 2) feeSch = arguments[1];

	var feeResult=aa.fee.getFeeItems(itemCap);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
			{
			amtFee+=feeObjArr[ff].getFee();
			var pfResult = aa.finance.getPaymentFeeItems(itemCap, null);
			if (pfResult.getSuccess())
				{
				var pfObj = pfResult.getOutput();
				for (ij in pfObj)
					if (feeObjArr[ff].getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
						amtPaid+=pfObj[ij].getFeeAllocation()
				}
			}
	return amtFee - amtPaid;
	}

function Left(str, n){
	if (n <= 0)
	    return "";
	else if (n > String(str).length)
	    return str;
	else
	    return String(str).substring(0,n);
}


function isReconcileAlreadyOpen(checkFromDate,checkToDate,userBranch)
	{

	aa.print(checkFromDate);
	var checkFromDate = new Date(checkFromDate).getTime()+1;  
	aa.print(checkFromDate);
	aa.print(checkToDate);
	var checkToDate = new Date(checkToDate).getTime()+1;
	aa.print(checkToDate);
	
	fromDt = aa.date.parseDate(dateAdd(null,-30)); // look 30 days back for a reconcilation record
	toDt = aa.date.parseDate(dateAdd(null,1));
	emptyGISArray = new Array();

	var emptyCm = aa.cap.getCapModel().getOutput();
	var emptyCt = emptyCm.getCapType();
	emptyCt.setGroup("Financial");
	emptyCt.setType("Reconcile");
	emptyCt.setSubType("Supervisor");
	emptyCm.setCapType(emptyCt);

	todayCaps = aa.cap.getCapListByCollection(emptyCm, null, null, fromDt,toDt,null, emptyGISArray).getOutput();

	if (todayCaps)
		for (var y in todayCaps)
			if (aa.cap.getCap(todayCaps[y].getCapID()).getOutput().getCapStatus() != "Void")
					{
					recCapId = todayCaps[y].getCapID();
					recCap = aa.cap.getCap(recCapId).getOutput();
					recDet = aa.cap.getCapDetail(recCapId).getOutput();

					var fDate = null; var tDate = null;
					var fromDate = recDet.getAsgnDate();
					var toDate = recDet.getAppearanceDate();
					if (fromDate) { fDate = new Date(); fDate.setTime(fromDate.getEpochMilliseconds()); }
					if (toDate) { tDate = new Date(); tDate.setTime(toDate.getTime()); }

					
					if (fDate && tDate && (checkFromDate >= fDate && checkFromDate <= tDate) || (checkToDate >= fDate && checkToDate <= tDate))
						{
						if (userBranch.equals(getAppSpecific("Branch",recCapId)))
							{
							aa.print(fDate) ; aa.print(fDate.getTime()) ; aa.print(tDate) ; aa.print(tDate.getTime()); aa.print ("==============="); 
							return true;
							}
						}
					}
	return false;
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

    addFee("ZXL","ACA","FINAL","10.23564215484211","Y");
	