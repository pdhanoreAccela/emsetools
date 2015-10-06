/*------------------------------------------------------------------------------------------------------/
| Set Generation 
|
| 0615/2011 - DMH 
|SETGENERATIONPERMITSTATEMENTS
|setGenerationPermitStatements
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
aa.env.setValue("emailAddress", "zeal.liu@achievo.com");
aa.env.setValue("financeEmail", "zeal.liu@achievo.com");
aa.env.setValue("showDebug", "Y");
aa.env.setValue("asiField", "Finance Enabled");
aa.env.setValue("asiValue", "Yes");
aa.env.setValue("setNumber", "0202");
aa.env.setValue("setAgency", "DES");
aa.env.setValue("setType", "PERMITS");
	
aa.env.setValue("emailAddress", "zeal.liu@achievo.com");
aa.env.setValue("financeEmail", "zeal.liu@achievo.com");
aa.env.setValue("showDebug", "Y");
aa.env.setValue("asiField", "CE Billing Enabled");
aa.env.setValue("asiValue", "Yes");
aa.env.setValue("setNumber", "9");
aa.env.setValue("setAgency", "DDES");
aa.env.setValue("setType", "PERMITS_FINAL");

/------------------------------------------------------------------------------------------------------*/

var showDebug = false;				// Set to true to see debug messages in email confirmation
var maxSeconds = 3000;				// number of seconds allowed for batch processing
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");

batchJobID = 0;
if (batchJobResult.getSuccess()) {
	batchJobID = batchJobResult.getOutput();
  	logMessage("START","Batch Job " + batchJobName + " Job ID is " + batchJobID);
}
else
  	logMessage("WARNING","Batch job ID not found " + batchJobResult.getErrorMessage());

/*----------------------------------------------------------------------------------------------------/
| BATCH PARAMETERS
/------------------------------------------------------------------------------------------------------*/
var emailAddress = getParam("emailAddress");		// email to send batch job log
var financeEmail = getParam("financeEmail");		// email to send bad TA job log
var showDebugParam = getParam("showDebug");
if (showDebugParam.equals("Y")) showDebug = true; 
var asiField = getParam("asiField");
var asiValue = getParam("asiValue");
var setNumber = getParam("setNumber");
var setAgency = getParam("setAgency");
var setType = getParam("setType");

/*----------------------------------------------------------------------------------------------------/
| SETUP
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var timeExpired = false;
var startTime = startDate.getTime();			// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var br = "<BR>";							// Break Tag
var useAppSpecificGroupName = false;
var emailText = "";
var emailTAText = "";
var finBadTAemail = false;
var debugText = "";
var errorText = "";
var gltyText = "The following tasks have incorrect time accounting records for the listed tasks.  These must be resolved TODAY as billing statements will be run today and this record WILL NOT be included." + br + br;

var stdChoiceName = "FIN_" + setAgency + "_" + setType + "_" + setNumber;
logDebug("Std choice for criteria is " + stdChoiceName);
var criteriaHash = new Hash();
loadCriteria(criteriaHash, stdChoiceName);
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
| 
/-----------------------------------------------------------------------------------------------------*/

logMessage("START","Start of Job");

if (criteriaHash.length > 0)
	mainProcess();
else
	logDebug("No set criteria found");

logMessage("END","End of Job: Elapsed Time : " + elapsed() + " Seconds");

if (emailAddress.length) { 
	if (showDebug)
		aa.sendMail("accela_noreply@kingcounty.gov", emailAddress, "", batchJobName + " Set Gen Results", emailText);
	else
		aa.sendMail("accela_noreply@kingcounty.gov", emailAddress, "", batchJobName + " Set Gen Results", errorText);
}

if (financeEmail.length && finBadTAemail)
{ 
		aa.sendMail("accela_noreply@kingco.com", financeEmail, "", batchJobName + ": Records with Bad Time Accounting records", emailTAText);
}



if (showDebug)
	aa.print(debugText);		
else
	aa.print(errorText);
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/
function mainProcess() {
	var capFilterType = 0
	var capFilterStatus = 0;
	var capFilterClosed = 0;
    var capClassType = 0;
	var capCount = 0;
	var capStatCount = 0;
    var custType = "INTERNAL";

	logDebug("asiField is: " + asiField);
	logDebug("asiValue is: " + asiValue);
	var capResult = aa.cap.getCapIDsByAppSpecificInfoField(asiField, asiValue);
	if (capResult.getSuccess()) {
		myCaps = capResult.getOutput();
	}
	else { 
		logError("ERROR: Getting records, reason is: " + capResult.getErrorMessage()) ;
		return false
	} 
	var capsToInclude = new Array();
	for (myCapsXX in myCaps) {
		if (elapsed() > maxSeconds) { // only continue if time hasn't expired
			logError("WARNING","A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
			timeExpired = true ;
			break; 
		}

     	var thisCapId = myCaps[myCapsXX].getCapID();
   		capId = getCapId(thisCapId.getID1(), thisCapId.getID2(), thisCapId.getID3()); 
		altId = capId.getCustomID();
		if (!capId) {
			logError("Could not get Cap ID");
			continue;
		}
		cap = aa.cap.getCap(capId).getOutput();		

		switch ("" + setType) {
			case "PERMITS_FINAL":
				if (!appHasCondition("Finance", "Applied", "Finalization", null)) {
					logMessage("INFO", "Skipping " + altId + " because finalized condition does not exist");
					continue;
				}
				if (isTaskStatus("Completion", "Finalized - Zero Balance Stmt")) {
					logMessage("INFO", "Skipping " + altId + " because Completion task has status of Finalized - zero balance statement generated");
					continue;
				}
				if (matches(setAgency, "DES", "DOT")) {
					appTypeResult = cap.getCapType();	
					appTypeString = appTypeResult.toString();	
					appTypeArray = appTypeString.split("/");

					if (!appMatch("RealEstateSvcs/*/*/*")) {
						logMessage("INFO", "Skipping " + altId + " because not a RealEstateSvc record");
						continue;
					}
				}
				if (matches(setAgency, "DDES")) {
					appTypeResult = cap.getCapType();	
					appTypeString = appTypeResult.toString();	
					appTypeArray = appTypeString.split("/");

					if (appMatch("RealEstateSvcs/*/*/*")) {
						logMessage("INFO", "Skipping " + altId + " because a RealEstateSvc record");
						continue;
					}
				}
				var capDetailResult = aa.cap.getCapDetail(capId);
				if (capDetailResult.getSuccess()) {
					var capDetail = capDetailResult.getOutput();
					var balanceDue = capDetail.getBalance();
					if (balanceDue != 0)
					{
						logMessage("INFO", "Skipping " + altId + " because balance is not zero.");
						continue;
					}
				}
				var availUnapplied = getAvailMoney("Unapplied");
				var availTrust = getAvailMoney("Trust");
				if (parseFloat(availUnapplied) + parseFloat(availTrust) != 0)
				{
					logMessage("INFO", "Skipping " + altId + " because there is money on the account.");
					continue;
				}
				break;
			case "PERMITS":
				if (matches(setAgency, "DES", "DOT")) {
					appTypeResult = cap.getCapType();	
					appTypeString = appTypeResult.toString();	
					appTypeArray = appTypeString.split("/");

					if (!appMatch("RealEstateSvcs/*/*/*")) {
						logMessage("INFO", "Skipping " + altId + " because not a RealEstateSvc record");
						continue;
					}
				}
				if (matches(setAgency, "DDES")) {
					appTypeResult = cap.getCapType();	
					appTypeString = appTypeResult.toString();	
					appTypeArray = appTypeString.split("/");

					if (appMatch("RealEstateSvcs/*/*/*")) {
						logMessage("INFO", "Skipping " + altId + " because a RealEstateSvc record");
						continue;
					}
				}				break;
			default:
				logDebug("I dunno what to do with set type " + setType);
				break;
		}

		criteriaKeys = criteriaHash.getKeys();
		for (yy in criteriaKeys) {
			var excludeThisCap = false;
			thisKey = "" + criteriaKeys[yy];
			switch (thisKey.toUpperCase()) {
				case "CUSTOMER NAME":
					var includedCustomers = criteriaHash.getItem(thisKey);
					var includeCap = false;
					for (custIndex in includedCustomers) {
						if (appHasCustomer("" + includedCustomers[custIndex])) {
							includeCap = true;
							break; // stop looking for the customer
						}
					}
					if (!includeCap) {
						logMessage("INFO", "Skipping " + altId + " due to customer not being associated with CAP");
						excludeThisCap = true;
					}
					break;
				case "STATUS":
					var capStatus = "" + cap.getCapStatus();
					if (!exists(capStatus, criteriaHash.getItem(thisKey))) {
						logMessage("INFO", "Skipping " + altId + " due to disallowed application status");
						excludeThisCap = true;	
					}
					break;
				case "CONDITIONS":
				case "CONDITION":
					var excludedConditions = criteriaHash.getItem(thisKey);
					var disallowCap = false;
					for (var zz in excludedConditions) {
                        if (appHasCondition(null, null, excludedConditions[zz], null)) {
							logMessage("INFO", "Skipping " +  altId + " due to disallowed condition of " + excludedConditions[zz]);
							disallowCap = true;
							break; // stop processing the excluded conditions
						}
					}
					if (disallowCap) {
						excludeThisCap = true;
					}
					break;
				case "BALANCE":
					var capDetailResult = aa.cap.getCapDetail(capId);
					if (capDetailResult.getSuccess()) {
						var capDetail = capDetailResult.getOutput();
						var balanceDue = capDetail.getBalance();
						var bFilter = "" + criteriaHash.getItem(thisKey);
						if ((bFilter.toUpperCase() == "NEGATIVE") && (balanceDue > 0 || balanceDue == 0)) {
							logMessage("INFO", "Skipping " + altId + " due to disallowed balance of " + balanceDue);
							excludeThisCap = true;
						}
						if ((bFilter.toUpperCase() == "POSITIVE") && (balanceDue < 0  || balanceDue == 0)) {
							logMessage("INFO", "Skipping " + altId + " due to disallowed balance of " + balanceDue);
							excludeThisCap = true;
						}
						if ((bFilter.toUpperCase() == "ZERO") && (balanceDue == 0)) {
							logMessage("INFO", "Skipping " + altId + " due to disallowed balance of " + balanceDue);
							excludeThisCap = true;
						}
					}
					else {
						logError("Error getting cap detail " + capDetailResult.getErrorMessage());
					}
					break;	
				case "RECORD TYPE":
				case "RECORDTYPE":
				case "RECORDTYPES":
				case "RECORD TYPES":
					appTypeResult = cap.getCapType();	
					appTypeString = appTypeResult.toString();	
					appTypeArray = appTypeString.split("/");
					var excludedCapTypes = criteriaHash.getItem(thisKey);
					var includeCap = true;
					for (typeIndex in excludedCapTypes) {
						if (appMatch("" + excludedCapTypes[typeIndex])) {
							includeCap = false;
							break;
						}
					}
					if (!includeCap) {
						logMessage("INFO", "Skipping " + altId + " because cap type not included");
						excludeThisCap = true;
					}
					break;	
				case "CUSTOMER TYPE":
				case "CUSTOMERTYPE":
					var cTypeValue = "" + criteriaHash.getItem(thisKey);
					var interAgencyRecordNumber =  getAppSpecific("POETA-Project Number");
					if ((cTypeValue.toUpperCase() != "INTERNAL") && (interAgencyRecordNumber && interAgencyRecordNumber != "")) {
						logMessage("INFO", "Skipping " + altId + " due to customer type internal");
						excludeThisCap = true;
					}
					if ((cTypeValue.toUpperCase() != "EXTERNAL") && (!interAgencyRecordNumber || !interAgencyRecordNumber != "")) {
						logMessage("INFO", "Skipping " + altId + " due to customer type external");
						excludeThisCap = true;
					}
					
					custType = cTypeValue; //get global variable for later use
					break;
				case "PM/NON-PM":
					var pTypeValue = "" + criteriaHash.getItem(thisKey);
					var projectManaged = "" + getAppSpecific("Project Managed");
					if (pTypeValue == "PM" && projectManaged == "No") {
						logMessage("INFO", "Skipping " + altId + " due to project managed");
						excludeThisCap = true;
					}
					if (pTypeValue == "NON-PM" && projectManaged == "Yes") {
						logMessage("INFO", "Skipping " + altId + " due to project managed");
						excludeThisCap = true;
					}
					break;
				case "APPLICATION AS-OF DATE":
				case "APPLICATION ASOF DATE":
					var aDateArr = criteriaHash.getItem(thisKey);
					if (aDateArr.length != 2) {
						logDebug("Application As-Of Date criteria not proper format");
					}
					else {
						var fromDate = "" + aDateArr[0];
						var toDate = "" + aDateArr[1];
						var fileDate = cap.getFileDate();
						var validDateRegEx = "^[0-1]{0,1}[0-9]{0,1}[-/.][0-3]{0,1}[1-9]{0,1}[-/.][1-2][0-9]{3}$";
						var validDate = true;
						if (!fromDate.match(validDateRegEx)) {
							logMessage("INFO", "Application As-Of Date From Date invalid format: " + fromDate);
							validDate = false;
						}
						if (!toDate.match(validDateRegEx)) {
							logMessage("INFO", "Application As-Of Date To Date invalid format: " + toDate);
							validDate = false;
						}
						if (validDate) {
							var includeCap = false;
							var fromAADate = aa.date.parseDate(fromDate);
							var toAADate = aa.date.parseDate(toDate);
							logMessage("INFO", "fromAADate is: " + fromAADate.getMonth() + "/" + fromAADate.getDayOfMonth() + "/" + fromAADate.getYear() + " toAADate is: " +  toAADate.getMonth() + "/" + toAADate.getDayOfMonth() + "/" + toAADate.getYear());
							if (!(fileDate.getEpochMilliseconds() > fromAADate.getEpochMilliseconds() && fileDate.getEpochMilliseconds() < toAADate.getEpochMilliseconds())) {
								logMessage("INFO", "Skipping " + altId + " because file date is not in range: " + fileDate.getMonth() + "/" + fileDate.getDayOfMonth() + "/" + fileDate.getYear());
								excludeThisCap = true;
							}
						}
	
					}
					break;
				case "BILLINGSTATUS":
				case "BILLING STATUS":
					var cBillStatus  = "" + criteriaHash.getItem(thisKey);
					if (cBillStatus.toUpperCase() == "NEVER BILLED") {
						asitStatements = loadASITable("STATEMENTS");
						if (asitStatements && asitStatements.length > 0) {
							logMessage("INFO", "Skipping " + altId + " because of billing status");
							excludeThisCap = true;
						}
					}
					break;
				case "AGENCY":
					var agencyFees = "" + lookup("FIN_FEE_AGENCY", ("" + criteriaHash.getItem(thisKey)));
					var agencyFeeArr = agencyFees.split("|");
					if (agencyFeeArr && agencyFeeArr.length > 0) {
						var includeCap = false;
						for (var ef in agencyFeeArr) {
							if (feeExists(agencyFeeArr[ef])) {
								includeCap = true;
								break;
							}
						}

						if (!includeCap) {
							logMessage("INFO", "Skipping " + altId + " because fee code not included");
							excludeThisCap = true;
						}
					}
					break;
				default:
					logDebug("I dunno what to do with criteria key " + thisKey);
					break;
			} // end switch

			if (excludeThisCap)
				break;	// stop processing the criteria

		} // end for each criteria
		if (!excludeThisCap) {
			var excludeThisCap = checkForBadTArecds(thisCapId);
			//logMessage("INFO", "Checking " + altId + " for exclusion: " + excludeThisCap);
		}
		if (excludeThisCap)
			continue;
		else {	
			// if I get here I am going to put this cap in the set
			capCount++;
			capsToInclude.push(capId);	
		}
	}  // end for each cap

	if (custType.toUpperCase()=="INTERNAL") 
		custType="INTERNAL";
	else
		custType="EXTERNAL";
	if (capsToInclude.length > 0) {
		setCreated = createSet(setAgency, setType, setNumber, custType);
		if (setCreated) {
			for (capIndex in capsToInclude) {
				logDebug("capsToInclude[capIndex] is: " + capsToInclude[capIndex]);
				aa.set.add(setCreated, capsToInclude[capIndex]);
			}
		}

	}
 	logMessage("INFO","Total records retrieved: " + myCaps.length);
 	logMessage("INFO","Total records qualified: " + capCount);
} // end function body


function checkForBadTArecds(capId)
{ 
	var gltyEmail = "";
	var itemCap = capId;
	//finBadTAemail=false;
	var excludeCap=false;
	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
	{
  	 	var wfObj = workflowResult.getOutput();
		for (i in wfObj)
		{
   			var fTask = wfObj[i];
			var entityID = "" + fTask.getStepNumber() + ":" + fTask.getProcessID();
			taResult = aa.timeAccounting.getTimeLogModelByEntity(capId, entityID, "WORKFLOW", null, null);
			if (taResult.getSuccess()) 
			{
				timeLogModelList = taResult.getOutput();
				if (timeLogModelList.size() > 0)
				{
					tlmlIterator = timeLogModelList.iterator();
					while (tlmlIterator.hasNext()) 
					{
						timeLogModel = tlmlIterator.next();
						// for some reason this timeLogModel has null for the timeTypeModel
						timeLogSeq = timeLogModel.getTimeLogSeq();
						// so get it again, using the seq
						var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
						if (tResult.getSuccess()) 
						{
							var timeLogModel = tResult.getOutput();
							var timeTypeModel = timeLogModel.getTimeTypeModel();
							var thisTimeType = "" + timeTypeModel.getDispTimeTypeName();
							var thisTimeGroupName = "" + getTimeGroupName(timeLogModel);
							if (thisTimeType=="Error" || thisTimeGroupName=="Error")
							{
								finBadTAemail=true;
								excludeCap=true;
								var gltyPty1 = timeLogModel.getCreatedBy(); 
								var gltyPty = aa.person.getUser(gltyPty1).getOutput();
								var gltyName = gltyPty.getFirstName() +" "+ gltyPty.getLastName();
								if (gltyPty.getEmail() > "")
									{gltyEmail  += gltyPty.getEmail() + "; ";}
								var taskName= fTask.getTaskDescription()
								var recdAdmin=getAppSpecific("Record Administrator");
								logBadTA(altId, taskName, gltyName, recdAdmin);
								if (gltyEmail!=null) {
									gltyText +="Task: " + taskName + "; User: " + gltyName + br; 
								}
								else {
									gltyText += "Task: " + taskName + "; User: Unknown" + br; 
								} 
							} 
						}
					} // end while
				}
			}
			else  {
				logDebug("Error getting ta entries: " + taResult.getErrorMessage());
			}
			//break;
		} // end for each task
	}
	else {
		logDebug("Error getting tasks : " + workflowResult.getErrorMessage());
	}
	var str=getAppSpecific("Record Administrator");
	if (str != null && str != "")
	{
		//logMessage("INFO", "str is : " + str);
		var eMail=str.replace(" ",".") + '@kingcounty.gov'; 
		var emailSubj= "Time Accounting Corrections Required for Record " + altId ; 
		if (gltyEmail!="" && finBadTAemail)
		{
			//logMessage("INFO", "email " + eMail + " gltyEmail " + gltyEmail + " subject " + emailSubj + " Text " + gltyText);
			aa.sendMail( "accela_noreply@kingcounty.gov",eMail, gltyEmail,emailSubj,gltyText);
		}
		if (gltyEmail=="" && finBadTAemail)
		{
			//logMessage("INFO", "email " + eMail + " gltyEmail " + gltyEmail + " subject " + emailSubj + " Text " + gltyText);
			aa.sendMail( "accela_noreply@kingcounty.gov",eMail, "",emailSubj,gltyText);
		} 
	}
	if (excludeCap)
		{return true;}
	else
		{return false;}
}

function getTimeGroupName(timeLogModel) {

	var timeGroupSeq = timeLogModel.getTimeGroupSeq();
        //logDebug("Group seq = " + timeGroupSeq);
	var timeTypeSeq = timeLogModel.getTimeTypeSeq();
	timeGroupTypeModelResult = aa.timeAccounting.getTimeGroupTypeModel();
        if (timeGroupTypeModelResult.getSuccess()) {
        	timeGroupTypeModel = timeGroupTypeModelResult.getOutput();
	     	timeGroupTypeModel.setTimeTypeSeq(timeTypeSeq);
		timeGroupTypeModel.setTimeGroupSeq(timeGroupSeq);

		tgResult = aa.timeAccounting.getTimeGroupTypeModels(timeGroupTypeModel);
		if (tgResult.getSuccess()) {
			tg = tgResult.getOutput();
			if (tg.length > 0) {
                        	tg1 = tg[0];
				return tg1.getTimeGroupName();
			}
                }
		else 
			logDebug("Error getting time group models " + tgResult.getErrorMessage());
	}
	else 
		logDebug("Error getting time group models " + timeGroupTypeModelResult.getErrorMessage());
	
	return null;
}

function loadCriteria(cHash, stdChoice) {

	var bizResult = aa.bizDomain.getBizDomain(stdChoice);
	if (bizResult.getSuccess()) {
		var bizDomArr = bizResult.getOutput();
		if (bizDomArr) {
			var bizDomArr = bizDomArr.toArray();
			for (xx in bizDomArr) {
				var bizDom =  "" + bizDomArr[xx].getBizDomain();
				var bizDomValues = bizDomArr[xx].getDescription();
				if (bizDomValues && bizDomValues != "") {
					bizDomValues = "" + bizDomValues;
					var valArray = bizDomValues.split("|");
					if (valArray && valArray.length > 0) {
						cHash.setItem("" + bizDomArr[xx].getBizdomainValue(), valArray);
					}
				}
			}
		}
	}
	else {
		logError("Error getting standard choice for criteria " + bizResult.getErrorMessage());
	}
}

function appHasCustomer(cName) {

	var custFound = false;

	// look for a contact
	var capContactResult = aa.people.getCapContactByCapID(capId);
	if (capContactResult.getSuccess()) {
		capContacts = capContactResult.getOutput();
		if (capContacts) {
			for (ccIndex in capContacts) {
				var thisContact = capContacts[ccIndex].getCapContactModel();
				var thisCName = "" + thisContact.getPeople().getFullName();
				if (thisCName == "" && thisContact.GetLastName() != "")
					thisCName = "" + thisContact.getFirstName() + " " + thisContact.getLastName();
				if (thisCName == "" && thisContact.GetLastName() == "")
					thisCName = "" + thisContact.getOrganizationName();
				if (thisCName == cName)
					return true;
			}
		}
	}
	else {
		logError("Error getting cap contacts " + altId + " " + capContactResult.getErrorMessage());
	}

	// look for a lp
	var licProfResult = aa.licenseScript.getLicenseProf(capId);
	if (licProfResult.getSuccess()) {
		var licProfArr = licProfResult.getOutput();
		if (licProfArr) {
			for (lpIndex in licProfArr) {
				var licProfScriptModel = licProfArr[lpIndex];
				var thisLPName = "" + licProfScriptModel.getContactFirstName() + " " + licProfScriptModel.getContactLastName();
				if (thisLPName == cName)
					return true;
			}
		}
	}
	else {
		logError("Error getting lic profs " + altId + " " + licProfResult.getErrorMessage());
	}
	return custFound;

}

function createSet(agencyName, setType, setNumber, custType) {

	var dayNumber = 1;
	var maxAttempts = 100;

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
	
	var setTypeCode = "";
	switch ("" + setType) {
		case "PERMITS_FINAL":
			setTypeCode = "PF";
			break;
		case "PERMITS":
			setTypeCode = "P";
			break;
		default:
			break;
			
	}

	var agencyNumber = "";
	switch ("" + agencyName) {
		case "DDES":
			agencyNumber = "1";
			break;
		case "DES":
			agencyNumber = "2";
			break;
		case "DOT":
			agencyNumber = "3";
			break;
		default:
			break;
	}

	var setCodePrefix = "" + yy + mm + dd + "." + agencyNumber + "_"; 
	var setName = setAgency + " " + setType;
	if (custType.toUpperCase()=="INTERNAL") 
		setName += "-INT";
	else
		setName += "-EXT";
	var setCreated = false;
	while (!setCreated) {
		setCode = setCodePrefix + dayNumber + setTypeCode + setNumber;

		var setCreateResult= aa.set.createSet(setCode, setName)
		if (setCreateResult.getSuccess()) {
			logMessage("INFO", "Successfully created set " + setCode + ":" + setName);
			setCreated = true;
		}
		else {
			dayNumber++;
			if (dayNumber > maxAttempts)
				break;
	
		}
	}
	
	if (setCreated)
		return setCode;
	else
		return false;
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
	
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000) 
}	

function logMessage(etype,edesc) {
	//aa.print(etype + " : " + edesc);
	emailText+=etype + " : " + edesc + br;
	if (showDebug)
		debugText +="INFO : " + edesc + br; 
}

function logDebug(edesc) {
	if (showDebug) {
	//	aa.print("DEBUG : " + edesc);
		debugText +="DEBUG : " + edesc + br; 
		emailText+="DEBUG : " + edesc + br; 
	}
}

function logError(edesc) {
	//aa.print("DEBUG : " + edesc);
	debugText +="DEBUG : " + edesc + br; 
	emailText+="DEBUG : " + edesc + br; 
	errorText += "" + edesc + br;
}
function logBadTA(capId, wfTask, wfUser, recdAdmin) {
	if (showDebug) {
	//	aa.print("Bad : " + edesc);
		//debugText   +="Record: " + capId + "; Record Admin: " + recdAdmin + "; Task: " + wfTask + "; User: " + wfUser + br; 
		emailTAText +="Record: " + capId + "; Record Admin: " + recdAdmin + "; Task: " + wfTask + "; User: " + wfUser + br; 
	}
}
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

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
      logError("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
  }	

function getParam(pParamName) { //gets parameter value and logs message showing param value
	var ret = "" + aa.env.getValue(pParamName);	
	return ret;
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
		{ logError( "**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage()) }
}


function DateDiff(intervalType, d1, d2) {
	var retValue = null;

       	d2.setHours(0);
	d2.setMinutes(0);
	d2.setSeconds(0);	
       	d1.setHours(0);
	d1.setMinutes(0);
	d1.setSeconds(0);	
	switch (intervalType.toUpperCase()) {
		case "D":
			var t2 = d2.getTime();
        		var t1 = d1.getTime();
                        var fValue = (t2-t1)/(24*3600*1000);
                        retValue = Math.ceil(fValue);
			break;
		case "W":
        		var t2 = d2.getTime();
        		var t1 = d1.getTime();
        		retValue = parseInt((t2-t1)/(24*3600*1000*7));
			break;
		case "M":
        		var d1Y = d1.getFullYear();
        		var d2Y = d2.getFullYear();
       			var d1M = d1.getMonth();
        		var d2M = d2.getMonth();
        		retValue =  (d2M+12*d2Y)-(d1M+12*d1Y);
			break;
		case "Y":	
        		retValue =  d2.getFullYear()-d1.getFullYear();
			break;
		default :
			break;
	}
	return retValue;
}
	
function isTaskStatus(wfstr,wfstat) {// optional process name
	var useProcess = false;
	var processName = "";
	if (arguments.length > 2) 
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ 
		logError("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); 
		return false; 
		}
	
	for (i in wfObj)
		{
   		fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			if (fTask.getDisposition()!=null)
				{
				if (fTask.getDisposition().toUpperCase().equals(wfstat.toUpperCase()))
					return true;
				else
					return false;
				}
		}
	return false;
}

function Hash() {
	this.length = 0;
	this.items = new Array();
	for (var i = 0; i < arguments.length; i += 2) {
		if (typeof(arguments[i + 1]) != 'undefined') {
			this.items[arguments[i]] = arguments[i + 1];
			this.length++;
		}
	}
   
	this.removeItem = function(in_key) {
		var tmp_previous;
		if (typeof(this.items[in_key]) != 'undefined') {
			this.length--;
			var tmp_previous = this.items[in_key];
			delete this.items[in_key];
		}
	   
		return tmp_previous;
	}

	this.getItem = function(in_key) {
		return this.items[in_key];
	}

	this.setItem = function(in_key, in_value) {
		var tmp_previous;
		if (typeof(in_value) != 'undefined') {
			if (typeof(this.items[in_key]) == 'undefined') {
				this.length++;
			}
			else {
				tmp_previous = this.items[in_key];
			}

			this.items[in_key] = in_value;
		}
	   
		return tmp_previous;
	}

	this.hasItem = function(in_key) {
		return typeof(this.items[in_key]) != 'undefined';
	}

	this.hasKey = function(in_key) {
		for (xx in this.items) {
			if (xx.equals(in_key))
				return true;
		}
		return false;
	}

	this.getKeys = function() {
		keys = new Array();
		for (xx in this.items)
			keys.push(xx);
		return keys;	
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
		//logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
		}
	else
		{
		logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
		}
	return strControl;
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
		var readOnly = 'N';
		if (readOnlyi.hasNext()) {
			readOnly = readOnlyi.next();
		}
		var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
		tempObject[tcol.getColumnName()] = fieldInfo;

		}
		tempArray.push(tempObject);  // end of record
	  }
	  return tempArray;
	}


function asiTableValObj(columnName, fieldValue, readOnly) {
	this.columnName = columnName;
	this.fieldValue = fieldValue;
	this.readOnly = readOnly;

	asiTableValObj.prototype.toString=function(){ return this.fieldValue }
};


function feeExists(feestr) // optional statuses to check for
	{
	var checkStatus = false;
	var statusArray = new Array(); 

	//get optional arguments 
	if (arguments.length > 1)
		{
		checkStatus = true;
		for (var i=1; i<arguments.length; i++)
			statusArray.push(arguments[i]);
		}

	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }
	
	for (ff in feeObjArr)
		if ( feestr.equals(feeObjArr[ff].getFeeCod()) && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray) ) )
			return true;
			
	return false;
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
				logDebug("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
				}
			else
				{
				logDebug( "**ERROR: adding condition (" + standardCondition.getConditionDesc() + "): " + addCapCondResult.getErrorMessage());
				}
			}
		}
	}
function getAvailMoney(moneyType)
{
	var ttlAvailMoney = 0;
	if (moneyType=="Trust")
	{
		var tPAcctResult = aa.trustAccount.getPrimaryTrustAccountByCAP(capId);
		if (tPAcctResult.getSuccess())
		{
			TAccount = tPAcctResult.getOutput();
			if (TAccount== null || TAccount.getTrustAccountModel() == null) 
				{ }//aa.print("WARNING: no trust account") ; }
			else 
			{
				tAccountID = tPAcctResult.getOutput().getAcctID();
				//logDebug("Made it Here: " + tAccountID);
				tAcctResult = aa.trustAccount.getTrustAccountByAccountID(tAccountID);
				if (tAcctResult.getSuccess())
				{
					tAcct = tAcctResult.getOutput();
					if (tAcct.getOverdraft == "Y")
					{
						//logDebug("Overdraft allowed");
						ttlAvailMoney =(tAcct.getAcctBalance() + tAcct.getOverdraftLimit())
					}
					else
					{
						//logDebug("Overdraft Not allowed");
						ttlAvailMoney = tAcct.getAcctBalance();
					}
				}
			}
		} 
	}
	else
		{var ttlAvailMoney = paymentGetNotAppliedTot(capId);	}
	return ttlAvailMoney;
}

function paymentGetNotAppliedTot(capId) //gets total Amount Not Applied on current CAP
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