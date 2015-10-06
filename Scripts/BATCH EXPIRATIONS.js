/*------------------------------------------------------------------------------------------------------/
| Program: Batch Expiration.js  Trigger: Batch
| Client: ADBCE
|
| Version 1.0 - Base Version. 11/01/08 JHS
| Version 1.1 - Updates based on config 02/21/09
| Version 1.2 - Only create sets if CAPS qualify 02/26/09
| Version 1.3 - Added ability to lock parent license (for adv permits) 1/12/10
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var emailText = "";
var showDebug = 3;									// Set to true to see debug messages in email confirmation
var maxSeconds = 4.5 * 60;							// number of seconds allowed for batch processing, usually < 5*60

/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");
wfObjArray = null;

batchJobID = 0;
if (batchJobResult.getSuccess())
  {
  batchJobID = batchJobResult.getOutput();
  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
  }
else
  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());


/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var fromDate = getParam("fromDate")
var toDate = getParam("toDate")
var dFromDate = aa.date.parseDate(fromDate);			//
var dToDate = aa.date.parseDate(toDate);				//
var lookAheadDays = aa.env.getValue("lookAheadDays");   // Number of days from today
var daySpan = aa.env.getValue("daySpan");				// Days to search (6 if run weekly, 0 if daily, etc.)
var appGroup = getParam("appGroup");					//   app Group to process {Licenses}
var appTypeType = getParam("appTypeType");				//   app type to process {Rental License}
var appSubtype = getParam("appSubtype");				//   app subtype to process {NA}
var appCategory = getParam("appCategory");				//   app category to process {NA}
var expStatus = getParam("expirationStatus")			//   test for this expiration status
var newExpStatus = getParam("newExpirationStatus")		//   update to this expiration status
var newAppStatus = getParam("newApplicationStatus")		//   update the CAP to this status
var gracePeriodDays = getParam("gracePeriodDays")		//	bump up expiration date by this many days
var setPrefix = getParam("setPrefix");					//   Prefix for set ID
var inspSched = getParam("inspSched");					//   Schedule Inspection
var skipAppStatusArray = getParam("skipAppStatus").split(",")
var emailAddress = getParam("emailAddress");			// email to send report
var sendEmailNotifications = getParam("sendEmailNotifications");	// send out emails?
var sendSMSNotifications = getParam("sendSMSNotifications");	// send out SMS?
var removeSearchEntries = getParam("removeSearchEntries"); // remove search entries from DB
var mSubjChoice = getParam("emailSubjectStdChoice");			// Message subject resource from "Batch_Job_Messages" Std Choice
var mMesgChoice = getParam("emailContentStdChoice");			// Message content resource from "Batch_Job_Messages" Std Choice
var deactivateLicense = getParam("deactivateLicense");			// deactivate the LP
var lockParentLicense = getParam("lockParentLicense");     // add this lock on the parent license
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var timeExpired = false;

if (!fromDate.length) // no "from" date, assume today + number of days to look ahead
	fromDate = dateAdd(null,parseInt(lookAheadDays))

if (!toDate.length)  // no "to" date, assume today + number of look ahead days + span
	toDate = dateAdd(null,parseInt(lookAheadDays)+parseInt(daySpan))

logDebug("Date Range -- fromDate: " + fromDate + ", toDate: " + toDate)

var mSubjEnConstant = null;
var mMesgEnConstant = null;
var mSubjArConstant = null;
var mMesgArConstant = null;

if (mSubjChoice) mSubjEnConstant = lookup("Batch Job Messages",mSubjChoice +" English");
if (mMesgChoice) mMesgEnConstant = lookup("Batch Job Messages",mMesgChoice +" English");
if (mSubjChoice) mSubjArConstant = lookup("Batch Job Messages",mSubjChoice +" Arabic");
if (mMesgChoice) mMesgArConstant = lookup("Batch Job Messages",mMesgChoice +" Arabic");


var startTime = startDate.getTime();			// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

if (appGroup=="")
	appGroup="*";
if (appTypeType=="")
	appTypeType="*";
if (appSubtype=="")
	appSubtype="*";
if (appCategory=="")
	appCategory="*";
var appType = appGroup+"/"+appTypeType+"/"+appSubtype+"/"+appCategory;

//Validate workflow parameters
var paramsOK = true;

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

if (paramsOK)
	{
	logDebug("Start of Job");

	if (!timeExpired) mainProcess();

	logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
	}

if (emailAddress.length)
	aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", emailText);


/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/


/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function mainProcess()
	{
	var capFilterType = 0
	var capFilterInactive = 0;
	var capFilterError = 0;
	var capFilterStatus = 0;
	var capCount = 0;
	var inspDate;
	var setName;
	var setDescription;

	var expResult = aa.expiration.getLicensesByDate(expStatus,fromDate,toDate);

	if (expResult.getSuccess())
		{
		myExp = expResult.getOutput();
		logDebug("Processing " + myExp.length + " expiration records");
		}
	else
		{ logDebug("ERROR: Getting Expirations, reason is: " + expResult.getErrorType() + ":" + expResult.getErrorMessage()) ; return false }

	for (thisExp in myExp)  // for each b1expiration (effectively, each license app)
		{
		if (elapsed() > maxSeconds) // only continue if time hasn't expired
			{
			logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
			timeExpired = true ;
			break;
			}

		b1Exp = myExp[thisExp];
		var	expDate = b1Exp.getExpDate();
		if (expDate) var b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
		var b1Status = b1Exp.getExpStatus();

		capId = aa.cap.getCapID(b1Exp.getCapID().getID1(),b1Exp.getCapID().getID2(),b1Exp.getCapID().getID3()).getOutput();

		if (!capId)
			{
			logDebug("Could not get a Cap ID for " + b1Exp.getCapID().getID1() + "-" + b1Exp.getCapID().getID2() + "-" + b1Exp.getCapID().getID3());
			logDebug("This is likely being caused by 09ACC-03874.   Please disable outgoing emails until this is resolved")
			continue;
		}

		altId = capId.getCustomID();

		logDebug(altId + ": Renewal Status : " + b1Status + ", Expires on " + b1ExpDate);

		cap = aa.cap.getCap(capId).getOutput();
		var capStatus = cap.getCapStatus();

		appTypeResult = cap.getCapType();		//create CapTypeModel object
		appTypeString = appTypeResult.toString();
		appTypeArray = appTypeString.split("/");

		// Filter by CAP Type
		if (appType.length && !appMatch(appType))
			{
			capFilterType++;
			logDebug(altId + ": Application Type does not match")
			continue;
			}

		// Filter by CAP Status
		if (exists(capStatus,skipAppStatusArray))
			{
			capFilterStatus++;
			logDebug(altId + ": skipping due to application status of " + capStatus)
			continue;
			}

		capCount++;


	// Create Set
		if (setPrefix != "" && capCount == 1)
			{
			var yy = startDate.getFullYear().toString().substr(2,2);
			var mm = (startDate.getMonth()+1).toString();
			if (mm.length<2)
				mm = "0"+mm;
			var dd = startDate.getDate().toString();
			if (dd.length<2)
				dd = "0"+dd;
			var hh = startDate.getHours().toString();
			if (hh.length<2)
				hh = "0"+hh;
			var mi = startDate.getMinutes().toString();
			if (mi.length<2)
				mi = "0"+mi;

			var setName = setPrefix.substr(0,5) + yy + mm + dd + hh + mi;

			setDescription = setPrefix + " : " + startDate.toLocaleString()
			var setCreateResult= aa.set.createSet(setName,setDescription)

			if (setCreateResult.getSuccess())
				logDebug("Set ID "+setName+" created for CAPs processed by this batch job.");
			else
				logDebug("ERROR: Unable to create new Set ID "+setName+" created for CAPs processed by this batch job.");

			}


		// Actions start here:

		var refLic = getRefLicenseProf(altId) // Load the reference License Professional

		if (refLic && deactivateLicense.substring(0,1).toUpperCase().equals("Y"))
			{
			refLic.setAuditStatus("I");
			aa.licenseScript.editRefLicenseProf(refLic);
			logDebug(altId + ": deactivated linked License");
			}

		// update expiration status


		if (newExpStatus.length > 0)
			{
			b1Exp.setExpStatus(newExpStatus);
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
			logDebug(altId + ": Update expiration status: " + newExpStatus);
			}

		// update expiration date based on interval

		if (parseInt(gracePeriodDays) != 0)
			{
			newExpDate = dateAdd(b1ExpDate,parseInt(gracePeriodDays));
			b1Exp.setExpDate(aa.date.parseDate(newExpDate));
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());

			logDebug(altId + ": updated CAP expiration to " + newExpDate);
			if (refLic)
				{
				refLic.setLicenseExpirationDate(aa.date.parseDate(newExpDate));
				aa.licenseScript.editRefLicenseProf(refLic);
				logDebug(altId + ": updated License expiration to " + newExpDate);
				}
			}

		// Send SMS and E-mail to Applicant

		if (mSubjEnConstant) 	{ mSubjEn = replaceMessageTokens(mSubjEnConstant); }
		if (mMesgEnConstant) 	{ mMesgEn = replaceMessageTokens(mMesgEnConstant); }
		if (mSubjArConstant) 	{ mSubjAr = replaceMessageTokens(mSubjArConstant); }
		if (mMesgArConstant) 	{ mMesgAr = replaceMessageTokens(mMesgArConstant); }

		conArray = getContactArray(capId)
		for (thisCon in conArray)
		{
			b3Contact = conArray[thisCon]
			if (b3Contact["contactType"] == "Applicant")
			{
				conPhone2 = b3Contact["phone2countrycode"] + b3Contact["phone2"];
				conEmail = b3Contact["email"];
				//
				// Eventually we need to get a language preference from the user profile
				//
				if (conPhone2 && sendSMSNotifications.substring(0,1).toUpperCase().equals("Y")) sendSMS(conPhone2, mMesgEn.substr(0,79));  // message length must be < 80
				if (conPhone2 && sendSMSNotifications.substring(0,1).toUpperCase().equals("Y")) sendSMS(conPhone2, mMesgAr.substr(0,79));
				if (conEmail && sendEmailNotifications.substring(0,1).toUpperCase().equals("Y")) aa.sendMail("noreply@accela.com", conEmail, "", mSubjEn + " " + mSubjAr,mMesgEn + " " +  mMesgAr);
			}

		}

		// update CAP status

		if (newAppStatus.length > 0)
			{
			updateAppStatus(newAppStatus,"");
			logDebug(altId + ": Updated Application Status to " + newAppStatus);
		}

		// schedule Inspection

		if (inspSched.length > 0)
			{
			scheduleInspection(inspSched,"1");
			inspId = getScheduledInspId(inspSched);
			if (inspId) autoAssignInspection(inspId);
			logDebug(altId + ": Scheduled " + inspSched + ", Inspection ID: " + inspId);
			}

		// remove search entries
		if (removeSearchEntries.substring(0,1).toUpperCase().equals("Y"))
			{
			aa.specialSearch.removeSearchDataByCapID(capId);
			logDebug(altId + ": Removed search entries");
		}

		// Add to Set

		if (setPrefix != "") aa.set.add(setName,capId)

		// lock Parent License
		
		if (lockParentLicense != "") 
			{
			licCap = getLicenseCapId("*/*/*/*"); 

			if (licCap)
				{
					logDebug(licCap + ": adding Lock : " + lockParentLicense);
					addStdCondition("Lock",lockParentLicense,licCap);
				}
			else
				logDebug(altId + ": Can't add Lock, no parent license found");
			}
		}

 	logDebug("Total CAPS qualified date range: " + myExp.length);
 	logDebug("Ignored due to application type: " + capFilterType);
 	logDebug("Ignored due to CAP Status: " + capFilterStatus);
 	logDebug("Total CAPS processed: " + capCount);
 	}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/


function appMatch(ats)
	{
	var isMatch = true;
	var ata = ats.split("/");
	if (ata.length != 4)
		logDebug("ERROR in appMatch.  The following Application Type String is incorrectly formatted: " + ats);
	else
		for (xx in ata)
			if (!ata[xx].equals(appTypeArray[xx]) && !ata[xx].equals("*"))
				isMatch = false;
	return isMatch;
	}

function updateAppStatus(stat,cmt)
	{
	updateStatusResult = aa.cap.updateAppStatus(capId,"APPLICATION",stat, sysDate, cmt ,systemUserObj);
	if (updateStatusResult.getSuccess())
		logDebug("Updated application status to " + stat + " successfully.");
	else
		logDebug("ERROR: application status update to " + stat + " was unsuccessful.  The reason is "  + updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage());
	}

function updateTask(wfstr,wfstat,wfcomment,wfnote)  // uses wfObjArray
	{
	if (!wfstat) wfstat = "NA";

	for (i in wfObjArray)
		{
   		fTask = wfObjArray[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()))
			{
			dispositionDate = aa.date.getCurrentDate();
			stepnumber = fTask.getStepNumber();
			// try status U here for disp flag?
			aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"U");
			logDebug("Updating Workflow Task: " + wfstr + " with status " + wfstat);
			}
		}
	}

function activateTask(wfstr) // uses wfObjArray
	{
	//optional 2nd param: wfstat.  Use if selecting by task and status.
	//SR5043
	var wfstat = "";
	var checkStatus = false;
	if (arguments.length==2)
		{
		wfstat = arguments[1];
		checkStatus = true;
		}

	for (i in wfObjArray)
		{
   		fTask = wfObjArray[i];
 		if ( !checkStatus && fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) ||
		     checkStatus && fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && wfstat.toUpperCase().equals(fTask.getDisposition().toUpperCase()) )
			{
			stepnumber = fTask.getStepNumber();
			aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			feeSeq = assessFeeResult.getOutput();

			logDebug("Added Fee " + feeCod + ", Qty " + fqty);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug("ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, returns the fee descriptitem
	{
	assessFeeResult = aa.finance.createFeeItem(capId,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
		feeSeq = assessFeeResult.getOutput();
		logDebug("Added Fee " + fcode + ", Qty " + fqty);
		if (finvoice == "Y")
			{
			feeSeqList.push(feeSeq);
			paymentPeriodList.push(fperiod);
			}
		return aa.finance.getFeeItemByPK(capId, feeSeq).getOutput()

		}
	else
		{
		logDebug("ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		return null
		}
	}

function updateFee(fcode,fsched,fperiod,fqty,finvoice) // Updates a fee with a new Qty.  If it doesn't exist, adds it
	{
	feeUpdated = false;
	getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
	if (getFeeResult.getSuccess())
		{
		feeListA = getFeeResult.getOutput();
		for (feeNum in feeListA)
			if (feeListA[feeNum].getFeeitemStatus().equals("NEW") && !feeUpdated)  // update this fee item
				{
				feeSeq = feeListA[feeNum].getFeeSeqNbr();
				editResult = aa.finance.editFeeItemUnit(capId, fqty, feeSeq);
				feeUpdated = true;
				if (editResult.getSuccess())
					{
					logDebug("Updated Qty on Existing Fee Item: " + fcode + " to Qty: " + fqty);
					//aa.finance.calculateFees(capId);
					if (finvoice == "Y")
						{
						feeSeqList.push(feeSeq);
						paymentPeriodList.push(fperiod);
						}
					}
				else
					{ logDebug("ERROR: updating qty on fee item (" + fcode + "): " + editResult.getErrorMessage()); break }
				}
		}
	else
		{ logDebug("ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage()) }

	if (!feeUpdated) // no existing fee, so update
		addFee(fcode,fsched,fperiod,fqty,finvoice);
	}


function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}

function logDebug(dstr)
	{
	if(showDebug)
		{
		aa.print(dstr)
		emailText+= dstr + "<br>";
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)
		}
	}


function appSpecific() {
	//
	// Returns an associative array of App Specific Info
	//
  	appArray = new Array();
    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(capId);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			appArray[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
		}
	return appArray;
}

function dateAdd(td,amt)
// perform date arithmetic on a string
// td can be "mm/dd/yyyy" (or any string that will convert to JS date)
// amt can be positive or negative (5, -3) days
// if optional parameter #3 is present, use working days only
	{

	useWorking = false;
	if (arguments.length == 3)
		useWorking = true;

	if (!td)
		dDate = new Date();
	else
		dDate = new Date(td);
	i = 0;
	if (useWorking)
		while (i < Math.abs(amt))
			{
			dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * (amt > 0 ? 1 : -1)));
			if (dDate.getDay() > 0 && dDate.getDay() < 6)
				i++
			}
	else
		dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * amt));

	return (dDate.getMonth()+1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();
	}

function getCapId(pid1,pid2,pid3)  {

    var s_capResult = aa.cap.getCapID(pid1, pid2, pid3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logDebug("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
  }

function loopTask(wfstr,wfstat,wfcomment,wfnote) // uses wfObjArray  -- optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 5)
		{
		processName = arguments[4]; // subprocess
		useProcess = true;
		}

	for (i in wfObjArray)
		{
   		fTask = wfObjArray[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			dispositionDate = aa.date.getCurrentDate();
			stepnumber = fTask.getStepNumber();
			processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.handleDisposition(capId,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"L");
			else
				aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"L");

			logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Looping...");
			}
		}
	}

function getParam(pParamName) //gets parameter value and logs message showing param value
	{
	var ret = "" + aa.env.getValue(pParamName);
	logDebug("Parameter : " + pParamName+" = "+ret);
	return ret;
	}

function isNull(pTestValue,pNewValue)
	{
	if (pTestValue==null || pTestValue=="")
		return pNewValue;
	else
		return pTestValue;
	}

function taskEditStatus(wfstr,wfstat,wfcomment,wfnote,pFlow,pProcess) //Batch version of function
	{
	//Needs isNull function
	//pProcess not coded yet
	//
	pFlow = isNull(pFlow,"U"); //If no flow control specified, flow is "U" (Unchanged)
	var dispositionDate = aa.date.getCurrentDate();

	for (i in wfObjArray)
		{
 		if ( wfstr.equals(wfObjArray[i].getTaskDescription()) )
			{
			var stepnumber = wfObjArray[i].getStepNumber();
			aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj,pFlow);
			logDebug("Updating Workflow Task: " + wfstr + " with status " + wfstat);
			}
		}
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

function jsDateToYYYYMMDD(pJavaScriptDate)
	{
	//converts javascript date to string in YYYY-MM-DD format
	//
	if (pJavaScriptDate != null)
		{
		if (Date.prototype.isPrototypeOf(pJavaScriptDate))
	return pJavaScriptDate.getFullYear() + "-" + (pJavaScriptDate.getMonth()+1).toString()+"-"+pJavaScriptDate.getDate();
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
function lookup(stdChoice,stdValue)
	{
	var strControl;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);

   	if (bizDomScriptResult.getSuccess())
   		{
		bizDomScriptObj = bizDomScriptResult.getOutput();
		var strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
		logDebug("getStandardChoice(" + stdChoice + "," + stdValue + ") = " + strControl);
		}
	else
		{
		logDebug("getStandardChoice(" + stdChoice + "," + stdValue + ") does not exist");
		}
	return strControl;
	}

function taskStatus(wfstr)
	{
	//Batch version of taskStatus -- uses global var wfObjArray
	// optional process name
	// returns false if task not found
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	for (i in wfObjArray)
		{
   		var fTask = wfObjArray[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			return fTask.getDisposition()
		}
	return false;
	}


function isTaskStatus(wfstr,wfstat) // optional process name...BATCH Version uses wfObjArray
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length > 2)
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	for (i in wfObjArray)
		{
   		fTask = wfObjArray[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
		an array of associative arrays with contact attributes.  Attributes are UPPER CASE
	// optional capid
	var thisCap = capId;
	if (arguments.length == 1) thisCap = arguments[0];

	var cArray = new Array();

	var capContactResult = aa.people.getCapContactByCapID(thisCap);
	if (capContactResult.getSuccess())
		{
		var capContactArray = capContactResult.getOutput();
		for (yy in capContactArray)
			{
			var aArray = new Array();
			aArray["lastName"] = capContactArray[yy].getPeople().lastName;
			aArray["firstName"] = capContactArray[yy].getPeople().firstName;
			aArray["businessName"] = capContactArray[yy].getPeople().businessName;
			aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
			aArray["contactType"] =capContactArray[yy].getPeople().contactType;
			aArray["relation"] = capContactArray[yy].getPeople().relation;
			aArray["phone1"] = capContactArray[yy].getPeople().phone1;
			aArray["phone2"] = capContactArray[yy].getPeople().phone2;
			aArray["phone2countrycode"] = capContactArray[yy].getCapContactModel().getPeople().getPhone2CountryCode();
			aArray["email"] = capContactArray[yy].getCapContactModel().getPeople().getEmail();


			var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
	                for (xx1 in pa)
                   		aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
			cArray.push(aArray);
			}
		}
	return cArray;
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
	  var e = m.indexOf("|",s+1)
	  if (e <= 0) break; // unmatched
	  var r = m.substring(s+1,e)

	  var evalstring = "typeof(" + r + ") != \"undefined\" ? " + r + " : \"undefined\""
	  var v = eval(evalstring)
	  var pattern = new RegExp("\\|" + r + "\\|","g")
	  m = String(m).replace(pattern,v)
	  }

	while (m.indexOf("{"))
	  {
	  var s = m.indexOf("{")
	  var e = m.indexOf("}",s+1)
	  if (e <= 0) break; // unmatched
	  var r = m.substring(s+1,e)

	  var evalstring = "AInfo[\"" + r + "\"]"
	  var v = eval(evalstring)
	  var pattern = new RegExp("\\{" + r + "\\}","g")
	  m = String(m).replace(pattern,v)

	  }

	 return m
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

function getLicenseCapId(licenseCapType)
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var capLicenses = getLicenseProfessional(itemCap);
	if (capLicenses == null || capLicenses.length == 0)
		{
		return;
		}

	for (var capLic in capLicenses)
		{
		var LPNumber = capLicenses[capLic].getLicenseNbr()
		var lpCapResult = aa.cap.getCapID(LPNumber);
		if (!lpCapResult.getSuccess())
			{ logDebug("**ERROR: No cap ID associated with License Number : " + LPNumber) ; continue; }
		licCapId = lpCapResult.getOutput();
		if (appMatch(licenseCapType,licCapId))
			return licCapId;
		}
	}

function addStdCondition(cType,cDesc)
	{
	var itemCap = capId;
	if (arguments.length > 2) itemCap = arguments[2]; // use cap ID specified in args

	if (!aa.capCondition.getStandardConditions)
		{
		aa.print("addStdCondition function is not available in this version of Accela Automation.");
		}
        else
		{
		standardConditions = aa.capCondition.getStandardConditions(cType,cDesc).getOutput();
		for(i = 0; i<standardConditions.length;i++)
			{
			standardCondition = standardConditions[i]
			aa.capCondition.createCapConditionFromStdCondition(itemCap, standardCondition.getConditionNbr())
			}
		}
	}
	
function getLicenseProfessional(itemcapId)
{
	capLicenseArr = null;
	var s_result = aa.licenseProfessional.getLicenseProf(itemcapId);
	if(s_result.getSuccess())
	{
		capLicenseArr = s_result.getOutput();
		if (capLicenseArr == null || capLicenseArr.length == 0)
		{
			aa.print("WARNING: no licensed professionals on this CAP:" + itemcapId);
			capLicenseArr = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
		capLicenseArr = null;
	}
	return capLicenseArr;
}

function getChildren(pCapType, pParentCapId)
	{
	// Returns an array of children capId objects whose cap type matches pCapType para b1Status + ", Expires on " + b1ExpDate);

		cap = aa.cap.getCap(capId).getOutput();
		var capStatus = cap.getCapStatus();

		appTypeResult = cap.getCapType();		//create CapTypeModel object
		appTypeString = appTypeResult.toString();
		appTypeArray = appTypeString.split("/");

		// Filter by CAP Type
		if (appType.length && !appMatch(appType))
			{
			capFilterType++;
			logDebug(altId + ": Application Type does not match")
			continue;
			}

		// Filter by CAP Status
		if (exists(capStatus,skipAppStatusArray))
			{
			capFilterStatus++;
			logDebug(altId + ": skipping due to application status of " + capStatus)
			continue;
			}

		capCount++;


	// Create Set
		if (setPrefix != "" && capCount == 1)
			{
			var yy = startDate.getFullYear().toString().substr(2,2);
			var mm = (startDate.getMonth()+1).toString();
			if (mm.length<2)
				mm = "0"+mm;
			var dd = startDate.getDate().toString();
			if (dd.length<2)
				dd = "0"+dd;
			var hh = startDate.getHours().toString();
			if (hh.length<2)
				hh = "0"+hh;
			var mi = startDate.getMinutes().toString();
			if (mi.length<2)
				mi = "0"+mi;

			var setName = setPrefix.substr(0,5) + yy + mm + dd + hh + mi;

			setDescription = setPrefix + " : " + startDate.toLocaleString()
			var setCreateResult= aa.set.createSet(setName,setDescription)

			if (setCreateResult.getSuccess())
				logDebug("Set ID "+setName+" created for CAPs processed by this batch job.");
			else
				logDebug("ERROR: Unable to create new Set ID "+setName+" created for CAPs processed by this batch job.");

			}


		// Actions start here:

		var refLic = getRefLicenseProf(altId) // Load the reference License Professional

		if (refLic && deactivateLicense.substring(0,1).toUpperCase().equals("Y"))
			{
			refLic.setAuditStatus("I");
			aa.licenseScript.editRefLicenseProf(refLic);
			logDebug(altId + ": deactivated linked License");
			}

		// update expiration status


		if (newExpStatus.length > 0)
			{
			b1Exp.setExpStatus(newExpStatus);
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
			logDebug(altId + ": Update expiration status: " + newExpStatus);
			}

		// update expiration date based on interval

		if (parseInt(gracePeriodDays) != 0)
			{
			newExpDate = dateAdd(b1ExpDate,parseInt(gracePeriodDays));
			b1Exp.setExpDate(aa.date.parseDate(newExpDate));
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());

			logDebug(altId + ": updated CAP expiration to " + newExpDate);
			if (refLic)
				{
				refLic.setLicenseExpirationDate(aa.date.parseDate(newExpDate));
				aa.licenseScript.editRefLicenseProf(refLic);
				logDebug(altId + ": updated License expiration to " + newExpDate);
				}
			}

		// Send SMS and E-mail to Applicant

		if (mSubjEnConstant) 	{ mSubjEn = replaceMessageTokens(mSubjEnConstant); }
		if (mMesgEnConstant) 	{ mMesgEn = replaceMessageTokens(mMesgEnConstant); }
		if (mSubjArConstant) 	{ mSubjAr = replaceMessageTokens(mSubjArConstant); }
		if (mMesgArConstant) 	{ mMesgAr = replaceMessageTokens(mMesgArConstant); }

		conArray = getContactArray(capId)
		for (thisCon in conArray)
		{
			b3Contact = conArray[thisCon]
			if (b3Contact["contactType"] == "Applicant")
			{
				conPhone2 = b3Contact["phone2countrycode"] + b3Contact["phone2"];
				conEmail = b3Contact["email"];
				//
				// Eventually we need to get a language preference from the user profile
				//
				if (conPhone2 && sendSMSNotifications.substring(0,1).toUpperCase().equals("Y")) sendSMS(conPhone2, mMesgEn.substr(0,79));  // message length must be < 80
				if (conPhone2 && sendSMSNotifications.substring(0,1).toUpperCase().equals("Y")) sendSMS(conPhone2, mMesgAr.substr(0,79));
				if (conEmail && sendEmailNotifications.substring(0,1).toUpperCase().equals("Y")) aa.sendMail("noreply@accela.com", conEmail, "", mSubjEn + " " + mSubjAr,mMesgEn + " " +  mMesgAr);
			}

		}

		// update CAP status

		if (newAppStatus.length > 0)
			{
			updateAppStatus(newAppStatus,"");
			logDebug(altId + ": Updated Application Status to " + newAppStatus);
		}

		// schedule Inspection

		if (inspSched.length > 0)
			{
			scheduleInspection(inspSched,"1");
			inspId = getScheduledInspId(inspSched);
			if (inspId) autoAssignInspection(inspId);
			logDebug(altId + ": Scheduled " + inspSched + ", Inspection ID: " + inspId);
			}

		// remove search entries
		if (removeSearchEntries.substring(0,1).toUpperCase().equals("Y"))
			{
			aa.specialSearch.removeSearchDataByCapID(capId);
			logDebug(altId + ": Removed search entries");
		}

		// Add to Set

		if (setPrefix != "") aa.set.add(setName,capId)

		// lock Parent License
		
		if (lockParentLicense != "") 
			{
			licCap = getLicenseCapId("*/*/*/*"); 

			if (licCap)
				{
					logDebug(licCap + ": adding Lock : " + lockParentLicense);
					addStdCondition("Lock",lockParentLicense,licCap);
				}
			else
				logDebug(altId + ": Can't add Lock, no parent license found");
			}
		}

 	logDebug("Total CAPS qualified date range: " + myExp.length);
 	logDebug("Ignored due to application type: " + capFilterType);
 	logDebug("Ignored due to CAP Status: " + capFilterStatus);
 	logDebug("Total CAPS processed: " + capCount);
 	}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/


function appMatch(ats)
	{
	var isMatch = true;
	var ata = ats.split("/");
	if (ata.length != 4)
		logDebug("ERROR in appMatch.  The following Application Type String is incorrectly formatted: " + ats);
	else
		for (xx in ata)
			if (!ata[xx].equals(appTypeArray[xx]) && !ata[xx].equals("*"))
				isMatch = false;
	return isMatch;
	}

function updateAppStatus(stat,cmt)
	{
	updateStatusResult = aa.cap.updateAppStatus(capId,"APPLICATION",stat, sysDate, cmt ,systemUserObj);
	if (updateStatusResult.getSuccess())
		logDebug("Updated application status to " + stat + " successfully.");
	else
		logDebug("ERROR: application status update to " + stat + " was unsuccessful.  The reason is "  + updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage());
	}

function updateTask(wfstr,wfstat,wfcomment,wfnote)  // uses wfObjArray
	{
	if (!wfstat) wfstat = "NA";

	for (i in wfObjArray)
		{
   		fTask = wfObjArray[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()))
			{
			dispositionDate = aa.date.getCurrentDate();
			stepnumber = fTask.getStepNumber();
			// try status U here for disp flag?
			aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"U");
			logDebug("Updating Workflow Task: " + wfstr + " with status " + wfstat);
			}
		}
	}

function activateTask(wfstr) // uses wfObjArray
	{
	//optional 2nd param: wfstat.  Use if selecting by task and status.
	//SR5043
	var wfstat = "";
	var checkStatus = false;
	if (arguments.length==2)
		{
		wfstat = arguments[1];
		checkStatus = true;
		}

	for (i in wfObjArray)
		{
   		fTask = wfObjArray[i];
 		if ( !checkStatus && fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) ||
		     checkStatus && fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && wfstat.toUpperCase().equals(fTask.getDisposition().toUpperCase()) )
			{
			stepnumber = fTask.getStepNumber();
			aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			feeSeq = assessFeeResult.getOutput();

			logDebug("Added Fee " + feeCod + ", Qty " + fqty);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug("ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, returns the fee descriptitem
	{
	assessFeeResult = aa.finance.createFeeItem(capId,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
		feeSeq = assessFeeResult.getOutput();
		logDebug("Added Fee " + fcode + ", Qty " + fqty);
		if (finvoice == "Y")
			{
			feeSeqList.push(feeSeq);
			paymentPeriodList.push(fperiod);
			}
		return aa.finance.getFeeItemByPK(capId, feeSeq).getOutput()

		}
	else
		{
		logDebug("ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		return null
		}
	}

function updateFee(fcode,fsched,fperiod,fqty,finvoice) // Updates a fee with a new Qty.  If it doesn't exist, adds it
	{
	feeUpdated = false;
	getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
	if (getFeeResult.getSuccess())
		{
		feeListA = getFeeResult.getOutput();
		for (feeNum in feeListA)
			if (feeListA[feeNum].getFeeitemStatus().equals("NEW") && !feeUpdated)  // update this fee item
				{
				feeSeq = feeListA[feeNum].getFeeSeqNbr();
				editResult = aa.finance.editFeeItemUnit(capId, fqty, feeSeq);
				feeUpdated = true;
				if (editResult.getSuccess())
					{
					logDebug("Updated Qty on Existing Fee Item: " + fcode + " to Qty: " + fqty);
					//aa.finance.calculateFees(capId);
					if (finvoice == "Y")
						{
						feeSeqList.push(feeSeq);
						paymentPeriodList.push(fperiod);
						}
					}
				else
					{ logDebug("ERROR: updating qty on fee item (" + fcode + "): " + editResult.getErrorMessage()); break }
				}
		}
	else
		{ logDebug("ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage()) }

	if (!feeUpdated) // no existing fee, so update
		addFee(fcode,fsched,fperiod,fqty,finvoice);
	}


function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}

function logDebug(dstr)
	{
	if(showDebug)
		{
		aa.print(dstr)
		emailText+= dstr + "<br>";
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)
		}
	}


function appSpecific() {
	//
	// Returns an associative array of App Specific Info
	//
  	appArray = new Array();
    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(capId);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			appArray[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
		}
	return appArray;
}

function dateAdd(td,amt)
// perform date arithmetic on a string
// td can be "mm/dd/yyyy" (or any string that will convert to JS date)
// amt can be positive or negative (5, -3) days
// if optional parameter #3 is present, use working days only
	{

	useWorking = false;
	if (arguments.length == 3)
		useWorking = true;

	if (!td)
		dDate = new Date();
	else
		dDate = new Date(td);
	i = 0;
	if (useWorking)
		while (i < Math.abs(amt))
			{
			dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * (amt > 0 ? 1 : -1)));
			if (dDate.getDay() > 0 && dDate.getDay() < 6)
				i++
			}
	else
		dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * amt));

	return (dDate.getMonth()+1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();
	}

function getCapId(pid1,pid2,pid3)  {

    var s_capResult = aa.cap.getCapID(pid1, pid2, pid3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logDebug("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
  }

function loopTask(wfstr,wfstat,wfcomment,wfnote) // uses wfObjArray  -- optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 5)
		{
		processName = arguments[4]; // subprocess
		useProcess = true;
		}

	for (i in wfObjArray)
		{
   		fTask = wfObjArray[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			dispositionDate = aa.date.getCurrentDate();
			stepnumber = fTask.getStepNumber();
			processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.handleDisposition(capId,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"L");
			else
				aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"L");

			logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Looping...");
			}
		}
	}

function getParam(pParamName) //gets parameter value and logs message showing param value
	{
	var ret = "" + aa.env.getValue(pParamName);
	logDebug("Parameter : " + pParamName+" = "+ret);
	return ret;
	}

function isNull(pTestValue,pNewValue)
	{
	if (pTestValue==null || pTestValue=="")
		return pNewValue;
	else
		return pTestValue;
	}

function taskEditStatus(wfstr,wfstat,wfcomment,wfnote,pFlow,pProcess) //Batch version of function
	{
	//Needs isNull function
	//pProcess not coded yet
	//
	pFlow = isNull(pFlow,"U"); //If no flow control specified, flow is "U" (Unchanged)
	var dispositionDate = aa.date.getCurrentDate();

	for (i in wfObjArray)
		{
 		if ( wfstr.equals(wfObjArray[i].getTaskDescription()) )
			{
			var stepnumber = wfObjArray[i].getStepNumber();
			aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj,pFlow);
			logDebug("Updating Workflow Task: " + wfstr + " with status " + wfstat);
			}
		}
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

function jsDateToYYYYMMDD(pJavaScriptDate)
	{
	//converts javascript date to string in YYYY-MM-DD format
	//
	if (pJavaScriptDate != null)
		{
		if (Date.prototype.isPrototypeOf(pJavaScriptDate))
	return pJavaScriptDate.getFullYear() + "-" + (pJavaScriptDate.getMonth()+1).toString()+"-"+pJavaScriptDate.getDate();
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
function lookup(stdChoice,stdValue)
	{
	var strControl;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);

   	if (bizDomScriptResult.getSuccess())
   		{
		bizDomScriptObj = bizDomScriptResult.getOutput();
		var strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
		logDebug("getStandardChoice(" + stdChoice + "," + stdValue + ") = " + strControl);
		}
	else
		{
		logDebug("getStandardChoice(" + stdChoice + "," + stdValue + ") does not exist");
		}
	return strControl;
	}

function taskStatus(wfstr)
	{
	//Batch version of taskStatus -- uses global var wfObjArray
	// optional process name
	// returns false if task not found
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	for (i in wfObjArray)
		{
   		var fTask = wfObjArray[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			return fTask.getDisposition()
		}
	return false;
	}


function isTaskStatus(wfstr,wfstat) // optional process name...BATCH Version uses wfObjArray
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length > 2)
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	for (i in wfObjArray)
		{
   		fTask = wfObjArray[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
		