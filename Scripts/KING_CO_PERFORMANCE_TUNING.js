// JScript source code
/*------------------------------------------------------------------------------------------------------/
var SetMemberArray= aa.env.getValue("SetMemberArray");
SetMemberArray = new Array();
firstCap = aa.cap.getCapID("ENFR11-0089").getOutput();
SetMemberArray.push(firstCap);
var setCode = aa.env.getValue("SetID");
setCode = "110913.1_1C1"
| Program: FIN_Stmts_Main_Process.js  Client : KingCo
| Refer to the technical specifications for details on what this program does
| To install Script:
| 1) Add script to Event > Script area of Accela Administrator
| 3) Search for Standard Choice CAPSET_SCRIPT_LIST and add it if it does not exists
| 4) Add new Standard Choice value to CAPSET_SCRIPT_LIST. Value = <Name of script> Description = <Displayed name on SET execute Button>
| Note: Script can be added multiple times with different script names
|
| 05/29/2012 JHS:  Added Queue Set Capability.   Will accept a Queue Set and Recursively Execute
| 10.12.2012 ACK:  Added Administrative to fDef as null.
-------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = true;						// Set to true to see results in popup window
var showDebug = false;							// Set to true to see debug messages in popup window
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var sysDate = aa.date.getCurrentDate();
var batchJobID = aa.batchJob.getJobID().getOutput();
var batchJobName = "" + aa.env.getValue("BatchJobName");
var useAppSpecificGroupName = false;					// Use Group name when populating App Specific Info Values
var debug = "";								// Debug String
var br = "<BR>";							// Break Tag
var emailAddress = ("zeal.liu@achievo.com");	// email to send report
var emailText = "";
var currentUserID ="Admin"   		// Current User
var systemUserObj = aa.person.getUser(currentUserID).getOutput();
/* Code for queue Set */
var usingQueueSet = false;

/*----------------------------------------------------------------------------------------------------/
|
| END USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var debug = "";
var SetMemberArray= aa.env.getValue("SetMemberArray");
var setCode = "" + aa.env.getValue("SetID");

/* Code to test for queue set */
var queueSetId = "" + aa.env.getValue("QueueSetId");
if (queueSetId && queueSetId.length > 0) {
	usingQueueSet = true;
	logDebug("Using Queue Set " + queueSetId);
	setCode = aa.env.getValue("OriginalSetID");
	var scriptToRun = aa.env.getValue("ScriptToRun");
	logDebug("Script ID is " + scriptToRun);
	var queueSetMemberResult = aa.set.getSetSetMembersByPK(queueSetId);
	if (queueSetMemberResult.getSuccess()) {
		var queueSetMember = queueSetMemberResult.getOutput().toArray();
		if (queueSetMember.length > 0) {
			var workingSetCode = queueSetMember[0].getSetID();
			setMemberArrayResult = aa.set.getCAPSetMembersByPK(workingSetCode);
			if (setMemberArrayResult.getSuccess()) {
				SetMemberArray = setMemberArrayResult.getOutput().toArray();
				}

			logDebug("Processing Next Set from Queue Set: " + workingSetCode + " with " + SetMemberArray.length + " records");
			}
		}
	}
/* end queue set code */

logDebug("The Process Has Begun for batch " + setCode + " at " + startDate);

var agencyName="";
agencyNbr = setCode.charAt(7);
if (agencyNbr=="1")
	{agencyName = "DDES";}
if (agencyNbr=="2")
	{agencyName = "DES";}
if (agencyNbr=="3")
	{agencyName = "DOT";}
//var chgFin = lookup("FIN_FINANCE_CHARGE","Charge?");
//if (chgFin.toUpperCase().equals("NO"))
//{
//	var chgFinSC = false;
//	logDebug("Standard Choice says no finance charging");
//}
//else
//	var chgFinSC = true;
var mainProcessTotalTime = 0;
for (var ia = 0; ia < SetMemberArray.length; ia++)
{
	var id= SetMemberArray[ia];
	var capId = aa.cap.getCapID(id.getID1(), id.getID2(),id.getID3()).getOutput();
	var altId = capId.getCustomID();					// alternate cap id string
    logDebug("CAP ID BEING PROCESSED:  " + altId);
	var mainProcessStartTime = new Date().getTime();		
	
	mainProcess();
	var mainProcessEndTime = new Date().getTime();
	logMessage("ZEAL","End of mainProcess[" + ia + "] Elapsed Time : " + ((mainProcessEndTime - mainProcessStartTime)/1000) + " Seconds");
	mainProcessTotalTime = mainProcessTotalTime + ((mainProcessEndTime - mainProcessStartTime)/1000);
    logDebug("CAP ID COMPLETED PROCESSING:  " + altId);
	logDebug("");
	logDebug("");
}
logMessage("ZEAL","End of ALL mainProcess, Total Elapsed Time : " + mainProcessTotalTime + " Seconds");

if (!usingQueueSet) {
	if (agencyName=="DDES")
		{runReport("DDES Billing Statement","Batch Number",setCode);}
	else
		{runReport("DES Billing Statement","Batch Number",setCode);}
}

var endDate = new Date();
var endTime = endDate.getTime();
logDebug("The Process Has Ended for batch " + setCode + " at " + endDate);
logMessage("ZEAL","End of Job: Total Elapsed Time : " + ((endTime - startTime)/1000) + " Seconds");

/* queue set code finish */
if (usingQueueSet) {
	removeSetResult = aa.set.removeSetHeadersListByChild(queueSetId,workingSetCode);
	logDebug("Removed Temporary Set: " + workingSetCode + " from Queue Set " + queueSetId);
	var sb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.SetBusiness").getOutput();
	var setsToDelete = new Array(workingSetCode);
	sb.deleteSetBySetID(aa.getServiceProviderCode(),setsToDelete);
	logDebug("Deleted Temporary Set: " + workingSetCode);
	queueSetMemberResult = aa.set.getSetSetMembersByPK(queueSetId);
	if (queueSetMemberResult.getSuccess()) {
		queueSetMember = queueSetMemberResult.getOutput().toArray();
		if (queueSetMember.length > 0) {
			logDebug("Queue Set has " + queueSetMember.length + " more members, recursively executing script " + scriptToRun);
			aa.runScriptInNewTransaction(scriptToRun);
			}
		else {
			logDebug("Queue Set has no more members");
			var setsToDelete = new Array(queueSetId);
			sb.deleteSetBySetID(aa.getServiceProviderCode(),setsToDelete);
			logDebug("Deleted Queue Set " + queueSetId);
			logDebug("Finished processing, exiting all scripts");
		}
	}
}
/* end queue set code */



aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", debug);

if (emailAddress.length )
	aa.sendMail("accela_noreply@kingcounty.gov", emailAddress, "", setCode + " STMT:MAIN:ProcessFinChar Results", emailText);

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/
function mainProcess()
{
	var feeRelatedCostTimeStartTime = new Date().getTime();		

	//get total cost to date and what's left to charge
	var setNoMoneyCondition = false;
	var estimCost = parseFloat(getAppSpecific("Estimated Cost"));
	logDebug("The estCost is: " + estimCost);
	var ttlCost = getCost("Total");
	ttlCost += sumAllFees(null, "REVIEWHOURLY", "REVIEWHOURLY-AG", "REVIEWHOURLY_EXPEDITED", "FINANCE", "FINCHCKLOG");
	logDebug("The ttlCost is: " + ttlCost);
	var currCost = getCost("Current");
	logDebug("The currCost is: " + currCost);
	//var assCost = getCost("Assessed");
//	var assCost = sumFees(null, "REVIEWHOURLY", "REVIEWHOURLY_EXPEDITED", "REVIEWHOURLY-AG");
//	logDebug("sumFees is: " + assCost);
//	assCost += sumAllAssessedFees();
	var assCost = sumAllAssessedFees();
	logDebug("The assCost is: " + assCost);
	logDebug("The fixedCost is: " + sumAllAssessedFees(null, "REVIEWHOURLY", "REVIEWHOURLY_EXPEDITED", "REVIEWHOURLY-AG", "FINANCE", "FINCHCKLOG"));
	//get unapplied amount: unapplied plus trust account
	var availUnapplied = getAvailMoney("Unapplied");
	logDebug("The unapplied amount is: " + availUnapplied);
	var availTrust = getAvailMoney("Trust");
	logDebug("The trust amount is: " + availTrust);
	var availMoney = parseFloat(availUnapplied) + parseFloat(availTrust);
	logDebug("availMoney is " + availMoney);
	//compare to estimate amount and get total we're working with
	var ttlToPay = 0;
	var remEstimCost = estimCost - assCost;
	logDebug("remEstimCost is " + remEstimCost);
	var projectManaged = "" + getAppSpecific("Project Managed");
	logDebug("projectManaged is: " + projectManaged);
	if (projectManaged=="Yes" || projectManaged=="Y")
	{
		if (remEstimCost < 0)
			{ttlToPay = 0}
		else
		{
			if (remEstimCost < currCost)
				{ttlToPay = remEstimCost;}
			else
				{ttlToPay = currCost;}
		}
		if (availMoney < ttlToPay)
		{
			//ttlToPay = availMoney;
			setNoMoneyCondition = true;
		}
	}
	else
	{
		ttlToPay = currCost;
		if (availMoney < ttlToPay)
		{
			//ttlToPay = availMoney;
			setNoMoneyCondition = true;
		}
	}
	logDebug("ttl To Pay is "+ ttlToPay);
	//assess fees until we get to that total; mark hours as billed
	var keepPaying = true;
	if (ttlToPay > 0)
	{
		while ( keepPaying )
			{keepPaying = payByTARecd(ttlToPay, availUnapplied, availTrust);}
	}
	//see if 'out of money' condition is warranted
	if (setNoMoneyCondition && !appHasCondition("Finance","Applied","Out of Money",null))
	{
		addStdCondition("Finance", "Out of Money");
		//logDebug( "Record " + altId + " is out of money.");
	}
		
	var feeRelatedCostTimeEndTime = new Date().getTime();
	logMessage("ZEAL","End of feeRelatedCostTime, Elapsed Time : " + ((feeRelatedCostTimeEndTime - feeRelatedCostTimeStartTime)/1000) + " Seconds");
	
	var lockAllTARecdsStartTime = new Date().getTime();
	//lock all records
	lockAllTARecds();
	var lockAllTARecdsEndTime = new Date().getTime();
	logMessage("ZEAL","End of lockAllTARecds, Elapsed Time : " + ((lockAllTARecdsEndTime - lockAllTARecdsStartTime)/1000) + " Seconds");
	
	var chgFinAddASITStartTime = new Date().getTime();
	//charge finance charges and add record to the statements asit
	chgFinAddASIT();	
	var chgFinAddASITEndTime = new Date().getTime();
	logMessage("ZEAL","End of chgFinAddASIT, Elapsed Time : " + ((chgFinAddASITEndTime - chgFinAddASITStartTime)/1000) + " Seconds");
}

/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function chgFinAddASIT()
{
	var chgFin=false;
	var balNotDue=0;
	var ttlFeeBalance = 0;
	//var capDetail = "";
	//var capDetailObjResult = aa.cap.getCapDetail(capId);			// Detail
	//if (capDetailObjResult.getSuccess())
	//{
		//capDetail = capDetailObjResult.getOutput();
		//logDebug("parseFloat(capDetail.getBalance()) is: " + parseFloat(capDetail.getBalance()));
		//if ((parseFloat(capDetail.getBalance()) * .01) > 1)
		//{
			if (!appHasCondition("Finance","Applied","No Finance Charge",null))
			{
				var finStmtDate = getAppSpecific("Final Statement Aging Date");
				jsFinStmtDate = new Date(finStmtDate);
				//logDebug("jsFinStmtDate is: " + jsFinStmtDate);
				jsPastDueDate = new Date(dateAdd(startDate,-30));
				//logDebug("jsPastDueDate is: " + jsPastDueDate);
				if (jsFinStmtDate > "" && jsFinStmtDate < jsPastDueDate)
					{chgFin=true;}
			}
		//}
	//}
	//else
	//	{logDebug("no success");}
	var feeResult = aa.finance.getFeeItemByCapID(capId);
	var finCharBalance = 0;
	if (!feeResult.getSuccess())
		{ logDebug("**ERROR: error retrieving fee items " +  feeResult.getErrorMessage()) ; return false }
	var feeArray = feeResult.getOutput();
	for (feeNumber in feeArray)
	{
		var includeFee=false;
		if (agencyName=="DDES")
			{includeFee=true;}
		if (agencyName!="DDES")
		{
			logDebug("agencyName is: " + agencyName);
			var agencyFees = "" + lookup("FIN_FEE_AGENCY", ("" + agencyName));
			var agencyFeeArr = agencyFees.split("|");
			if (agencyFeeArr && agencyFeeArr.length > 0)
			{
				var includeCap = false;
				for (var ef in agencyFeeArr)
				{
					//logDebug ("agencyFeeArr[ef] is: " + agencyFeeArr[ef]);
					if (feeArray[feeNumber].getFeeCod().equals((agencyFeeArr[ef])))
						{includeFee=true;}
				}
			}
		}
		var feeItem = feeArray[feeNumber];
		var amtPaid = 0;
		var feeDesc=""+feeItem.getFeeDescription();
		var feeInfo = getFeeDefByDesc("REVIEWHOURLY", feeDesc);
		var feeComment="";
		if (feeInfo !=  null)
		{
			if (feeInfo.comments > "")
				{var feeComment = feeInfo.comments;}
		}
		else
		{
			var feeInfo = getFeeDefByDesc("FINFINGUAR", feeDesc);
			if (feeInfo !=  null)
			{
				if (feeInfo.comments > "")
					{var feeComment = feeInfo.comments;}
			}
			else
			{
				var feeInfo = getFeeDefByDesc("FINANCE", feeDesc);
				if (feeInfo !=  null)
				{
					if (feeInfo.comments > "")
						{var feeComment = feeInfo.comments;}
				}
				else
				{
					var feeInfo = getFeeDefByDesc("DES_FEE WAIVERS", feeDesc);
					if (feeInfo !=  null)
					{
						if (feeInfo.comments > "")
							{var feeComment = feeInfo.comments;}
					}
				}
			}
		}
		var pfResult = aa.finance.getPaymentFeeItems(capId, null);
		if (!pfResult.getSuccess())
			{ logDebug("**ERROR: error retrieving fee payment items items " +  pfResult.getErrorMessage()) ; }
		var pfObj = pfResult.getOutput();
		for (ij in pfObj)
		{
			if (feeItem.getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
				amtPaid+=pfObj[ij].getFeeAllocation();
		}
		feeBalance = (feeItem.getFee() - amtPaid);
		if (feeBalance != 0 && feeItem.getFeeitemStatus() == "INVOICED")
		{
			ttlFeeBalance += feeBalance;
			//logDebug("feeDesc is: " + feeDesc + " feeItem.getFeeCod() is: " + feeItem.getFeeCod() + " includeFee is: " + includeFee );
			if ( feeComment.indexOf("NOFINCHAR") == -1 && feeItem.getFeeCod() != 'FIN010' && includeFee)
			{
				finCharBalance += feeBalance;
			}
		}
		if (feeItem.getFeeitemStatus() == "NEW")
			{balNotDue += feeBalance;}
	}
	finCharBalance=Math.round(finCharBalance*Math.pow(10,2))/Math.pow(10,2);
	logDebug("finCharBalance is: " + finCharBalance);
	logDebug("chgFin is: " + chgFin);
	if (finCharBalance > 0 && chgFin)
	{
		if (agencyName=="DDES")
		{
			var finFeeSeq = addFee("FIN010","FINANCE","FINAL",finCharBalance,"Y");
		}
		else
		{
			var finFeeSeq = addFee("DESGEN04","DES_GENERAL","FINAL",finCharBalance,"Y");
		}
		logDebug("finFeeSeq is: " + finFeeSeq);
		if (finFeeSeq != null)
		{
			var feeSeq_L= new Array();
			var paymentPeriod_L = new Array();
			feeSeq_L.push(finFeeSeq);
			paymentPeriod_L.push("FINAL");
			var invoiceResult_L = aa.finance.createInvoice(capId, feeSeq_L, paymentPeriod_L);
			ttlFeeBalance += (finCharBalance *.01);
		}
	}

	ttlFeeBalance = Math.round(ttlFeeBalance*Math.pow(10,2))/Math.pow(10,2);
	logDebug("Stmt ASIT Amount is: " + ttlFeeBalance);
	balNotDue = Math.round(balNotDue*Math.pow(10,2))/Math.pow(10,2);
	var stmtNum= createStmtNbr();
	var newRow = new Array();
	newRow["Batch Number"]= new asiTableValObj("Batch Number",setCode.toString(),"N");
	newRow["Statement Number"]= new asiTableValObj("Statement Number",stmtNum,"N");
	newRow["Statement Date"]= new asiTableValObj("Statement Date",jsDateToMMDDYYYY(startDate),"N");    
	newRow["Amount"]= new asiTableValObj("Amount",  ttlFeeBalance.toString(),"N");   
	newRow["Status"]= new asiTableValObj("Status", "Unprinted","N");     
	newRow["Balance Not Due"]=  new asiTableValObj("Balance Not Due",balNotDue.toString(),"N");       
	addToASITable("STATEMENTS",newRow);
	//logDebug( altId + ": Added new row to STMT table.");
}

function createStmtNbr()
{
	var dayNumber = 1;
	var maxAttempts = 100;
	stmtNbr = parseInt(1) + parseInt(lookup("STATEMENT_NBR", "Stmt_Nbr"));
	editLookup("STATEMENT_NBR", "Stmt_Nbr",stmtNbr);
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
	var setCodePrefix = "" + agencyNbr + "P-" + mm + yy + "-" + stmtNbr;
	return setCodePrefix;
}


function lockAllTARecds()
{
	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
	{
  	 	var wfObj = workflowResult.getOutput();
		for (i in wfObj)
		{
   			var feeAmt = 0;
   			var feeQtyMin = 0;
			var fTask = wfObj[i];
			var taskName = fTask.getTaskDescription();
			if(taskName!="Estimate")
			{
				var entityID = "" + fTask.getStepNumber() + ":" + fTask.getProcessID();
				taResultP = aa.timeAccounting.getTimeLogModelByEntity(capId, entityID, "WORKFLOW", null, null);
				if (taResultP.getSuccess())
				{
					lockLogModelList = taResultP.getOutput();
					if (lockLogModelList.size() > 0)
					{
						tlmlIteratorP = lockLogModelList.iterator();
						while (tlmlIteratorP.hasNext())
						{
							lockLogModel = tlmlIteratorP.next();
							// for some reason this lockLogModel has null for the timeTypeModel
							timeLogSeq = lockLogModel.getTimeLogSeq();
							// so get it again, using the seq
							var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
							if (tResult.getSuccess())
							{
								//logDebug("tResult lockAllTARecds");
								var lockLogModel = tResult.getOutput();
								var timeTypeModel = lockLogModel.getTimeTypeModel();
								var thisTimeType = "" + timeTypeModel.getDispTimeTypeName();
								var thisTimeGroupName = "" + getTimeGroupName(lockLogModel);
								var thisTimeBillable = "" + lockLogModel.getBillable();
								var thisTimeLocked = "" + lockLogModel.getTimeLogModel().getTimeLogStatus();
								//logDebug("thisTimeGroupName is: " + thisTimeGroupName + "  thisTimeLocked is: " + thisTimeLocked);
								if (thisTimeGroupName=="Actual" && thisTimeLocked !="L")
								{
									lockLogModel.getTimeLogModel().setTimeLogStatus("L");
									aa.timeAccounting.updateTimeLogModel(lockLogModel);
									//logDebug("lockLogModel is: " + lockLogModel.getTimeLogModel().getTimeLogStatus());
								}
							}
						}
					}
				}
			}
		}
		var inspResultObj = aa.inspection.getInspections(capId);
		if (inspResultObj.getSuccess())
		{
			var inspList = inspResultObj.getOutput();
			for (xx in inspList)
			{
				var entityID = "" + inspList[xx].getIdNumber();
				taResultP = aa.timeAccounting.getTimeLogModelByEntity(capId, entityID, "INSPECTION", null, null);
				if (taResultP.getSuccess())
				{
					lockLogModelList = taResultP.getOutput();
					if (lockLogModelList.size() > 0)
					{
						tlmlIteratorP = lockLogModelList.iterator();
						while (tlmlIteratorP.hasNext())
						{
							lockLogModel = tlmlIteratorP.next();
							// for some reason this lockLogModel has null for the timeTypeModel
							timeLogSeq = lockLogModel.getTimeLogSeq();
							// so get it again, using the seq
							var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
							if (tResult.getSuccess())
							{
								//logDebug("tResult lockAllTARecds");
								var lockLogModel = tResult.getOutput();
								var timeTypeModel = lockLogModel.getTimeTypeModel();
								var thisTimeType = "" + timeTypeModel.getDispTimeTypeName();
								var thisTimeGroupName = "" + getTimeGroupName(lockLogModel);
								var thisTimeBillable = "" + lockLogModel.getBillable();
								var thisTimeLocked = "" + lockLogModel.getTimeLogModel().getTimeLogStatus();
								//logDebug("thisTimeGroupName is: " + thisTimeGroupName + "  thisTimeLocked is: " + thisTimeLocked);
								if (thisTimeGroupName=="Actual" && thisTimeLocked !="L")
								{
									lockLogModel.getTimeLogModel().setTimeLogStatus("L");
									aa.timeAccounting.updateTimeLogModel(lockLogModel);
									//logDebug("lockLogModel is: " + lockLogModel.getTimeLogModel().getTimeLogStatus());
								}
							}
						}
					}
				}
			}
		}
	}
}

function payByTARecd(ttlPay, ttlUnapplied, ttlTrust)
{
	keepPaying=true;
	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
	{
  	 	var wfObj = workflowResult.getOutput();
		for (i in wfObj)
		{
   			var feeAmt = 0;
   			var feeQtyMin = 0;
			var fTask = wfObj[i];
			var taskName = fTask.getTaskDescription();
			if(taskName!="Estimate")
			{
				var entityID = "" + fTask.getStepNumber() + ":" + fTask.getProcessID();
				taResultP = aa.timeAccounting.getTimeLogModelByEntity(capId, entityID, "WORKFLOW", null, null);
				if (taResultP.getSuccess())
				{
					payLogModelList = taResultP.getOutput();
					if (payLogModelList.size() > 0)
					{
						tlmlIteratorP = payLogModelList.iterator();
						while (tlmlIteratorP.hasNext())
						{
							payLogModel = tlmlIteratorP.next();
							// for some reason this payLogModel has null for the timeTypeModel
							timeLogSeq = payLogModel.getTimeLogSeq();
							// so get it again, using the seq
							var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
							if (tResult.getSuccess())
							{
								var payLogModel = tResult.getOutput();
								var timeTypeModel = payLogModel.getTimeTypeModel();
								var thisTimeType = "" + timeTypeModel.getDispTimeTypeName();
								var thisTimeGroupName = "" + getTimeGroupName(payLogModel);
								var thisTimeBillable = "" + payLogModel.getBillable();
								var thisTimeLocked = "" + payLogModel.getTimeLogModel().getTimeLogStatus();
								//logDebug("Est Lock " +  payLogModel.getTimeLogModel().getTimeLogStatus());
								//logDebug("thisTimeBillable is: " + thisTimeBillable);
								//logDebug("thisTimeGroupName is: " + thisTimeGroupName);
								var timeElapsed = payLogModel.getTimeElapsed();
								var realHours = timeElapsed.getHourOfDay();
								var realMin = timeElapsed.getMinute();
								realTtlMinutes = (realHours * 60) + realMin;
								//logDebug("taskName is: " + taskName +  " thisTimeGroupName is: " + thisTimeGroupName + " thisTimeBillable is: " + thisTimeBillable + " thisTimeLocked is: " + thisTimeLocked);
								if (thisTimeGroupName=="Actual" && (thisTimeBillable == "N") && thisTimeLocked=="U")
								{
									//logDebug("realTtlMinutes is: " + realTtlMinutes);
									feeAmt += getTAFeeAmt(thisTimeType, realTtlMinutes);
									feeQtyMin += realTtlMinutes;
									//logDebug("2feeAmt is: " + feeAmt);
									payLogModel.setBillable("Y");
									payLogModel.getTimeLogModel().setTimeLogStatus("L");
									aa.timeAccounting.updateTimeLogModel(payLogModel);
								}
							}
						}//end while
						//logDebug("total feeAmt is: " + feeAmt);
						//logDebug("ttlPay is: " + ttlPay);

						var fsched = getFeeSchedule(thisTimeType);
						//logDebug("fsched is " + fsched);
						if (fsched!="EMPTY")
						{
							logDebug("feeAmt is: " + feeAmt + " ttlPay is: " + ttlPay);
							if (feeAmt > ttlPay)
							{
								fqty= (Math.floor((ttlPay/fDef.formula)*100)/100);
								feeAmt=(Math.floor((fqty*fDef.formula)*100)/100);
							}
							else
								{fqty=feeQtyMin/60;}
							if (feeAmt > 0)
							{
								fcode=fDef.feeCode;
								fperiod="FINAL";
								finvoice="N";
								//logDebug("Fees: fcode,fsched,fperiod,fqty,finvoice: " + fcode + " " + fsched + " " + fperiod + " " + fqty + " " + finvoice);
								var fSeqNbr = addFee(fcode,fsched,fperiod,fqty,finvoice);
								if (fSeqNbr != null)
								{
									var feeSeq_L= new Array();
									var paymentPeriod_L = new Array();
									feeSeq_L.push(fSeqNbr);
									paymentPeriod_L.push("FINAL");
									var invoiceResult_L = aa.finance.createInvoice(capId, feeSeq_L, paymentPeriod_L);
									if (invoiceResult_L.getSuccess())
									{
										var fullPay = true;
										var remFeeAmt = feeAmt;
										if (ttlUnapplied < feeAmt && ttlUnapplied > 0)
										{
											pmtMade = paymentByUnapplied(fSeqNbr, ttlUnapplied);
											//logDebug("Unapplied Pmt: " + feeAmt);
											remFeeAmt= feeAmt - ttlUnapplied;
											ttlUnapplied =0;
											fullPay = false;
										}
										else
										{
											if (ttlUnapplied > 0)
											{
												pmtMade = paymentByUnapplied(fSeqNbr, feeAmt);
												//logDebug("Unapplied Pmt: " + feeAmt);
												ttlUnapplied += (feeAmt * -1);
												remFeeAmt=0;
											}
											else
												{fullPay=false;}
										}
										if (!fullPay)
										{
											if (ttlTrust < remFeeAmt && ttlTrust > 0)
												{remFeeAmt = ttlTrust;}
											if (ttlTrust > 0)
											{
												paymentByTrustAccount(fSeqNbr, remFeeAmt);
												ttlTrust = parseFloat(ttlTrust) + (remFeeAmt * -1);
												logDebug("ttlTrust is " + ttlTrust);
											}
										}
									}
								}
								ttlPay += (feeAmt * -1)
								logDebug("ttlPay IS: " + ttlPay);
								if (ttlPay <= 0)
								{
									keepPaying = false;
									return keepPaying;
								}
							}
						}
					}
				}
			}
		}//end for
	}
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
	{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
		{
			var entityID = "" + inspList[xx].getIdNumber();
			taResultP = aa.timeAccounting.getTimeLogModelByEntity(capId, entityID, "INSPECTION", null, null);
			if (taResultP.getSuccess())
			{
				payLogModelList = taResultP.getOutput();
				if (payLogModelList.size() > 0)
				{
					tlmlIteratorP = payLogModelList.iterator();
					while (tlmlIteratorP.hasNext())
					{
						payLogModel = tlmlIteratorP.next();
						// for some reason this payLogModel has null for the timeTypeModel
						timeLogSeq = payLogModel.getTimeLogSeq();
						// so get it again, using the seq
						var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
						if (tResult.getSuccess())
						{
							var payLogModel = tResult.getOutput();
							var timeTypeModel = payLogModel.getTimeTypeModel();
							var thisTimeType = "" + timeTypeModel.getDispTimeTypeName();
							var thisTimeGroupName = "" + getTimeGroupName(payLogModel);
							var thisTimeBillable = "" + payLogModel.getBillable();
							var thisTimeLocked = "" + payLogModel.getTimeLogModel().getTimeLogStatus();
							//logDebug("Est Lock " +  payLogModel.getTimeLogModel().getTimeLogStatus());
							//logDebug("thisTimeBillable is: " + thisTimeBillable);
							//logDebug("thisTimeGroupName is: " + thisTimeGroupName);
							var timeElapsed = payLogModel.getTimeElapsed();
							var realHours = timeElapsed.getHourOfDay();
							var realMin = timeElapsed.getMinute();
							realTtlMinutes = (realHours * 60) + realMin;
							//logDebug("taskName is: " + taskName +  " thisTimeGroupName is: " + thisTimeGroupName + " thisTimeBillable is: " + thisTimeBillable + " thisTimeLocked is: " + thisTimeLocked);
							if (thisTimeGroupName=="Actual" && (thisTimeBillable == "N") && thisTimeLocked=="U")
							{
								//logDebug("INSPECTION realTtlMinutes is: " + realTtlMinutes);
								feeAmt += getTAFeeAmt(thisTimeType, realTtlMinutes);
								feeQtyMin += realTtlMinutes;
								//logDebug("2feeAmt is: " + feeAmt);
								payLogModel.setBillable("Y");
								payLogModel.getTimeLogModel().setTimeLogStatus("L");
								aa.timeAccounting.updateTimeLogModel(payLogModel);
							}
						}
					}//end while
					//logDebug("total feeAmt is: " + feeAmt);
					//logDebug("ttlPay is: " + ttlPay);

					var fsched = getFeeSchedule(thisTimeType);
					//logDebug("fsched is " + fsched);
					if (fsched!="EMPTY")
					{
						logDebug("feeAmt is: " + feeAmt + " ttlPay is: " + ttlPay);
						if (feeAmt > ttlPay)
						{
							fqty= Math.round((ttlPay/fDef.formula)*Math.pow(10,2))/Math.pow(10,2);
							feeAmt=Math.round((fqty*fDef.formula)*Math.pow(10,2))/Math.pow(10,2);
						}
						else
							{fqty=feeQtyMin/60;}
						if (feeAmt > 0)
						{
							fcode=fDef.feeCode;
							fperiod="FINAL";
							finvoice="N";
							//logDebug("Fees: fcode,fsched,fperiod,fqty,finvoice: " + fcode + " " + fsched + " " + fperiod + " " + fqty + " " + finvoice);
							var fSeqNbr = addFee(fcode,fsched,fperiod,fqty,finvoice);
							if (fSeqNbr != null)
							{
								var feeSeq_L= new Array();
								var paymentPeriod_L = new Array();
								feeSeq_L.push(fSeqNbr);
								paymentPeriod_L.push("FINAL");
								var invoiceResult_L = aa.finance.createInvoice(capId, feeSeq_L, paymentPeriod_L);
								if (invoiceResult_L.getSuccess())
								{
									var fullPay = true;
									var remFeeAmt = feeAmt;
									if (ttlUnapplied < feeAmt && ttlUnapplied > 0)
									{
										pmtMade = paymentByUnapplied(fSeqNbr, ttlUnapplied);
										//logDebug("Unapplied Pmt: " + feeAmt);
										remFeeAmt= feeAmt - ttlUnapplied;
										ttlUnapplied =0;
										fullPay = false;
									}
									else
									{
										if (ttlUnapplied > 0)
										{
											pmtMade = paymentByUnapplied(fSeqNbr, feeAmt);
											//logDebug("Unapplied Pmt: " + feeAmt);
											ttlUnapplied += (feeAmt * -1);
											remFeeAmt=0;
										}
										else
											{fullPay=false;}
									}
									if (!fullPay)
									{
										if (ttlTrust < remFeeAmt && ttlTrust > 0)
											{remFeeAmt = ttlTrust;}
										if (ttlTrust > 0)
										{
											paymentByTrustAccount(fSeqNbr, remFeeAmt);
											ttlTrust = parseFloat(ttlTrust) + (remFeeAmt * -1);
											logDebug("ttlTrust is " + ttlTrust);
										}
									}
								}
							}
							ttlPay += (feeAmt * -1)
							logDebug("ttlPay IS: " + ttlPay);
							if (ttlPay <= 0)
							{
								keepPaying = false;
								return keepPaying;
							}
						}
					}
				}
			}
		}//end for
		keepPaying = false;
	}
	return keepPaying;
}

function paymentByUnapplied(feeSeqNbr, feeAmt)
{
	//logDebug("capId is: " +  capId);
	//logDebug("feeSeqNbr is: " + feeSeqNbr);
	iListResult = aa.finance.getInvoiceByCapID(capId,null);
	if (iListResult.getSuccess())
	{
		iList = iListResult.getOutput();
		invNbr = "";
		feeAmount = "";
		iFound = false;
		//find invoice by matching fee sequence numbers with one passed in
		for (iNum in iList)
		{
			fList = aa.invoice.getFeeItemInvoiceByInvoiceNbr(iList[iNum].getInvNbr()).getOutput()
			for (fNum in fList)
				if (fList[fNum].getFeeSeqNbr() == feeSeqNbr)
			    {
					invNbr = iList[iNum].getInvNbr();
					//feeAmount = fList[fNum].getFee();
					feeAmount=feeAmt;
					iFound = true;
					//logMessage("Invoice Number Found: " + invNbr);
					//logMessage("Fee Amount: " + feeAmount);
					break;
				}
		}
		if (!iFound)
		{
			logMessage("Invoice not found");
			return false;
		}
	  }
	else
	{
		logDebug("Error: could not retrieve invoice list: " + iListResult.getErrorMessage());
		return false;
	}
	var xx = aa.finance.getPaymentByCapID(capId,null);
	var maxSeq = 0;
	var maxPayDD = 0;
	var payments;
	var retPayment = false;
	if (xx.getSuccess())
	{
		payments = xx.getOutput();
		for (yy in payments)
			if ( payments[yy].getAmountNotAllocated() > 0 )// not sure about this: && payments[yy].getPaymentStatus() != "Paid")
			{
				maxSeq = payments[yy].getPaymentSeqNbr();
				cashierId = payments[yy].getCashierID();
				//logDebug("payments[yy].getAmountNotAllocated() is: " + payments[yy].getAmountNotAllocated() );
			}
	}
	//apply payment
	//need to figure out how to get payment script model of resulting payment, and paymentFeeStatus and paymentIvnStatus
	feeSeqNbrArray = new Array() ;
	feeSeqNbrArray.push(feeSeqNbr);

	invNbrArray = new Array();
	invNbrArray.push(invNbr);

	feeAllocArray = new Array();
	feeAllocArray.push(feeAmount);

	applyResult = aa.finance.applyPayment(capId,maxSeq,feeAmount,feeSeqNbrArray,invNbrArray,feeAllocArray,aa.date.getCurrentDate(),"Paid","Paid",cashierId,null);

	if (applyResult.getSuccess())
	  {
		//get additional payment information
		apply = applyResult.getOutput();
		//logDebug("Apply Payment Successful");
	  }
	else
	  {
		logDebug("error applying funds: " + applyResult.getErrorMessage());
		return false;
	  }


	//generate receipt
	receiptResult = aa.finance.generateReceipt(capId,aa.date.getCurrentDate(),maxSeq,cashierId,null);

	if (receiptResult.getSuccess())
	  {
		receipt = receiptResult.getOutput();
		//logDebug("Receipt successfully created: ");// + receipt.getReceiptNbr());
	  }
	else
	  {
		logDebug("error generating receipt: " + receiptResult.getErrorMessage());
		return false;
	  }

	 //everything committed successfully
	 return true;
  }

function paymentByTrustAccount(fSeqNbr,feeAmt)
 {
	// function  performs the following:
	// retrieve primary trust account on capId
	// initiates payment from identified trust account for the ammount of the fee associated with fseqNbr
	// if payment successful applies payment in full to fee associated with fseqNbr
	// generates receipt for payment for fee associated with fseqNbr
	// if any of the above fails returns false, otherwise will return true.
	// fee must be invoiced for function to work, use optional capId parameter with addFee() call to ensure fee is invoiced prior to this function being called.
	// 06/08/2011 - Joseph Cipriano - Truepoint Solutions: Made revision to function.  Alter call to pull Primary Trust Account on Cap to use method aa.trustAccount.getPrimaryTrustAccountByCAP().
    feeSeqNbr = fSeqNbr;
	itemCap = capId;
	//if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args
	//get fee details
	//retrieve a list of invoices by capID
	iListResult = aa.finance.getInvoiceByCapID(itemCap,null);
	if (iListResult.getSuccess())
	  {
		iList = iListResult.getOutput();
		invNbr = "";
		feeAmount = "";
		iFound = false;

		//find invoice by matching fee sequence numbers with one passed in
		for (iNum in iList)
		  {
			fList = aa.invoice.getFeeItemInvoiceByInvoiceNbr(iList[iNum].getInvNbr()).getOutput()
			for (fNum in fList)
        	  if (fList[fNum].getFeeSeqNbr() == feeSeqNbr)
			    {
				  invNbr = iList[iNum].getInvNbr();
				  //feeAmount = fList[fNum].getFee();
				  feeAmount=feeAmt;
				  iFound = true;
				  logMessage("Invoice Number Found: " + invNbr);
				  logMessage("Fee Amount: " + feeAmount);
				  break;
				}
		  }
		  if (!iFound)
			{
			  logMessage("Invoice not found");
			  return false;
			}
	  }
	else
	  {
		logDebug("Error: could not retrieve invoice list: " + iListResult.getErrorMessage());
		return false;
	  }


	//retrieve trust account
	//will likely need more logic here to select correct trust account
	//will select first account found on cap
        var tPAcctResult = aa.trustAccount.getPrimaryTrustAccountByCAP(itemCap);

	if (tPAcctResult.getSuccess())
	  {
		tAccountID = tPAcctResult.getOutput().getAcctID();
		tAcctResult = aa.trustAccount.getTrustAccountByAccountID(tAccountID);
		if (TAccount!= null && TAccount.getTrustAccountModel() != null)
		  {
			tAcct = tAcctResult.getOutput();
			if (tAcct.getOverdraft == "Y")
			 {
				logDebug("Overdraft allowed");
				if ((tAcct.getAcctBalance() + tAcct.getOverdraftLimit()) < feeAmount)
				  {
					logDebug("The trust account balance plus overdraft allowance is less than invoiced fee amount.")
					logMessage("Trust Account Balance: " + tAcct.getAcctBalance());
					logDebug("Trust Account Overlimit allowance: " + tAcct.getOverdraftLimit());
					return false;
				  }
			 }
			else
			{
				if (tAcct.getOverdraft == "N")
				{
					if (tAcct.getAcctBalance() < feeAmount)
					{
						logDebug("The trust account balance is less than invoiced fee amount.")
						logMessage("Trust Account Balance: " + tAcct.getAcctBalance());
						return false;
					}
				}
			}
			logDebug("Trust Account ID: " + tAcct.getAcctID());
			logDebug("Trust Account Balance: " + tAcct.getAcctBalance());
		  }

	  }
	else
	  {
		logDebug("Error: could not retrieve trust account object: " + tPAcctResult.getErrorMessage());
		return false;
	  }

	//prepare payment
	//create paymentscriptmodel
	p = aa.finance.createPaymentScriptModel();
	p.setAuditDate(aa.date.getCurrentDate());
	p.setAuditStatus("A");
	p.setCapID(itemCap);
	p.setCashierID(p.getAuditID());
	p.setPaymentSeqNbr(p.getPaymentSeqNbr());
	p.setPaymentAmount(feeAmount);
	p.setAmountNotAllocated(feeAmount);
	p.setPaymentChange(0);
	p.setPaymentComment("Trust Account Auto-Deduct: " + tAccountID);
	p.setPaymentDate(aa.date.getCurrentDate());
	p.setPaymentMethod("Trust Account");
	p.setPaymentStatus("Paid");
	p.setAcctID(tAccountID);

	//create payment
	presult = aa.finance.makePayment(p);
	if (presult.getSuccess())
	  {
		//get additional payment information
		pSeq = presult.getOutput();
		logDebug("Payment successful");
		pReturn = aa.finance.getPaymentByPK(itemCap,pSeq,currentUserID);
		if (pReturn.getSuccess())
			{
				pR = pReturn.getOutput();
				//logDebug("PaymentSeq: " + pR.getPaymentSeqNbr());
			}
		else
			{
				logDebug("Error retrieving payment, must apply payment manually: " + pReturn.getErrorMessage());
				return false;
			}

	  }
	else
	  {
		logDebug("error making payment: " + presult.getErrorMessage());
		return false;
	  }

	//apply payment
	//need to figure out how to get payment script model of resulting payment, and paymentFeeStatus and paymentIvnStatus
	feeSeqNbrArray = new Array() ;
	feeSeqNbrArray.push(feeSeqNbr);

	invNbrArray = new Array();
	invNbrArray.push(invNbr);

	feeAllocArray = new Array();
	feeAllocArray.push(feeAmount);

	applyResult = aa.finance.applyPayment(itemCap,pR.getPaymentSeqNbr(),feeAmount,feeSeqNbrArray,invNbrArray,feeAllocArray,aa.date.getCurrentDate(),"Paid","Paid",pR.getCashierID(),null);

	if (applyResult.getSuccess())
	  {
		//get additional payment information
		apply = applyResult.getOutput();
		//logDebug("Apply Payment Successful");
	  }
	else
	  {
		logDebug("error applying funds: " + applyResult.getErrorMessage());
		return false;
	  }


	//generate receipt
	receiptResult = aa.finance.generateReceipt(itemCap,aa.date.getCurrentDate(),pR.getPaymentSeqNbr(),pR.getCashierID(),null);

	if (receiptResult.getSuccess())
	  {
		receipt = receiptResult.getOutput();
		//logDebug("Receipt successfully created: ");// + receipt.getReceiptNbr());
	  }
	else
	  {
		logDebug("error generating receipt: " + receiptResult.getErrorMessage());
		return false;
	  }

	 //everything committed successfully
	 return true;
}

function getTAFeeAmt(costType, ttlMin)
{
	var feeAmt=0;
	var estTasks = new Array();
	var estTasks=getTimeAccountingEntries("Estimate");
	var cnt = 0;
	var estTaskName = new Array();
	for (tskE in estTasks)
	{
		estLogModel = estTasks[tskE];
		estTypeModel = estLogModel.getTimeTypeModel();
		if (estTypeModel)
		{
			estType = "" + estTypeModel.getDispTimeTypeName();
			var repeatedTask = false;
			var taskCnt = 1;
			for (rep in estTaskName)
			{
				if (estType.toString().equals(estTaskName[rep].toString()))
					{taskCnt += 1;}
				cnt = parseFloat(rep);
			}
			if (taskCnt > 1)
				{repeatedTask = true;}
			if (taskCnt == 1)
			{
				cnt += 1;
				estTaskName[cnt] = estType;
			}
			if (!repeatedTask)
			{
				if (costType == estType)
				{
					estGroup = "" + getTimeGroupName(estLogModel);
					lookup("FIN_TimeAcctWF",costType);
					if (estGroup.equals("Hourly")) {
						fsched = "REVIEWHOURLY";
						fDef = getFeeDefByDesc("REVIEWHOURLY", costType);
					}
					if (estGroup.equals("Hourly-AG")) {
						fsched = "REVIEWHOURLY-AG";
						fDef = getFeeDefByDesc("REVIEWHOURLY-AG", costType + "-AG");
					}
					if (estGroup.equals("Expedited")) {
						fsched = "REVIEWHOURLY_EXPEDITED";
						fDef = getFeeDefByDesc("REVIEWHOURLY_EXPEDITED", costType);
					}
					//logDebug("fsched is " + fsched);
					if (fDef != null) {
						//logDebug("Found fee, formula = " + fDef.formula);
						{feeAmt += (ttlMin/60) * fDef.formula;}

					}
				}
			}
		}
	}
	return feeAmt;
}

function getFeeSchedule(costType)
{	var fsched ="EMPTY";
	var estTasks = new Array();
	var estTasks=getTimeAccountingEntries("Estimate");
	for (tskE in estTasks)
	{
		estLogModel = estTasks[tskE];
		estTypeModel = estLogModel.getTimeTypeModel();
		if (estTypeModel)
		{
			estType = "" + estTypeModel.getDispTimeTypeName();
			if (costType == estType)
			{
				estGroup = "" + getTimeGroupName(estLogModel);
				lookup("FIN_TimeAcctWF",costType);
				if (estGroup.equals("Hourly")) {
					fsched = "REVIEWHOURLY";
					fDef = getFeeDefByDesc("REVIEWHOURLY", costType);
				}
				if (estGroup.equals("Hourly-AG")) {
					fsched = "REVIEWHOURLY-AG";
					fDef = getFeeDefByDesc("REVIEWHOURLY-AG", costType + "-AG");
				}
				if (estGroup.equals("Expedited")) {
					fsched = "REVIEWHOURLY_EXPEDITED";
					fDef = getFeeDefByDesc("REVIEWHOURLY_EXPEDITED", costType);
				}
			}
		}
	}
	return fsched;
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
				{ aa.print("WARNING: no trust account") ; }
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

function getCost(costType)
{
	var theCost=0;
	var estTasks = new Array();
	var realTasks = new Array();
	var inspTasks = new Array();
	var estTasks=getTimeAccountingEntries("Estimate");
	var realTasks=getTimeAccountingEntries(null, null, capId, null, "Actual")
	var inspTasks=getTimeAccountingEntriesInspections();
	//process all tasks that have time that should be billed
	for (tskR in realTasks)
	{
		realLogModel = realTasks[tskR];
		realTypeModel = realLogModel.getTimeTypeModel();
		var estTaskName = new Array();
		if (realTypeModel)
		{
			realType = "" + realTypeModel.getDispTimeTypeName();
			//logDebug("realType is: " + realType);
			var cnt = 0;
			//make sure an estimated task exists for the task with actual hours; otherwise do not process
			for (tskE in estTasks)
			{
				estLogModel = estTasks[tskE];
				estTypeModel = estLogModel.getTimeTypeModel();
				if (estTypeModel)
				{
					estType = "" + estTypeModel.getDispTimeTypeName();
					var repeatedTask = false;
					//if there are multiple estimate records, only process each actual time entry once
					var taskCnt = 1;
					for (rep in estTaskName)
					{
						//logDebug("rep is: " + rep + " estTaskName is: " + estTaskName[rep] + " estType is: " + estType);
						if (estType.toString().equals(estTaskName[rep].toString()))
							{taskCnt += 1;}
						cnt = parseFloat(rep);
					}
					//logDebug("taskCnt is: " + taskCnt + " cnt is: " + cnt);
					if (taskCnt > 1)
					{
						//logDebug(" estType is: " + estType);
						repeatedTask = true;
					}
					if (taskCnt < 2)
					{
						//logDebug("cnt is: " + cnt + " estType is: " + estType);
						cnt += 1;
						estTaskName[cnt] = estType;
					}
					if (!repeatedTask)
					{
						//logDebug("estType: " + estType + "; realType: " + realType);
						//logDebug("estType: " + estType);
						if (realType == estType)
						{
							estGroup = "" + getTimeGroupName(estLogModel);
							var realTimeElapsed = realLogModel.getTimeElapsed();
							var realHours = realTimeElapsed.getHourOfDay();
							var realMin = realTimeElapsed.getMinute();
                                                        var fDef=null;
							lookup("FIN_TimeAcctWF",realType);
							if (estGroup.equals("Hourly"))
							{
								fDef = getFeeDefByDesc("REVIEWHOURLY", realType);
							}
							if (estGroup.equals("Hourly-AG"))
							{
								//logDebug("realType is: " + realType);
								fDef = getFeeDefByDesc("REVIEWHOURLY-AG", realType + "-AG");
							}
							if (estGroup.equals("Expedited"))
								fDef = getFeeDefByDesc("REVIEWHOURLY_EXPEDITED", realType);
							if (estGroup.equals("Actual"))
								{fDef=null;}
							if (estGroup.equals("Administrative"))
								{fDef=null;}
							if (fDef != null)
							{
								if (costType=="Total")
								{
									theCost += ((realHours*60) + realMin)/60 * fDef.formula;
									//theCost += sumFees(null, "REVIEWHOURLY", "REVIEWHOURLY_EXPEDITED");
								}
								else
								{
									if (costType=="Current")
									{
										//logDebug("realLogModel.getBillable() is: " + realLogModel.getBillable());
										if (realLogModel.getBillable()=="N" && realLogModel.getTimeLogModel().getTimeLogStatus() !="L")
											{theCost += (((realHours*60) + realMin)/60) * fDef.formula;}
									}
									else
									{
										/*if (costType=="Assessed")
										{
											if (realLogModel.getTimeLogModel().getTimeLogStatus()=="L")
												{theCost += ((realHours*60) + realMin)/60 * fDef.formula;}
										}*/
									}
								}
							}
						}
					}
				}
			}//estim task loop
		}
	}//real task loop
	for (tskI in inspTasks)
	{
		inspLogModel = inspTasks[tskI];
		inspTypeModel = inspLogModel.getTimeTypeModel();
		var estTaskName = new Array();
		if (inspTypeModel)
		{
			inspType = "" + inspTypeModel.getDispTimeTypeName();
			//logDebug("inspType is: " + inspType);
			var cnt = 0;
			//make sure an estimated task exists for the inspection with actual hours; otherwise do not process
			for (tskE in estTasks)
			{
				estLogModel = estTasks[tskE];
				estTypeModel = estLogModel.getTimeTypeModel();
				if (estTypeModel)
				{
					estType = "" + estTypeModel.getDispTimeTypeName();
					var repeatedTask = false;
					//if there are multiple estimate records, only process each actual time entry once
					var taskCnt = 1;
					for (rep in estTaskName)
					{
						//logDebug("rep is: " + rep + " estTaskName is: " + estTaskName[rep] + " estType is: " + estType);
						if (estType.toString().equals(estTaskName[rep].toString()))
							{taskCnt += 1;}
						cnt = parseFloat(rep);
					}
					//logDebug("taskCnt is: " + taskCnt + " cnt is: " + cnt);
					if (taskCnt > 1)
					{
						//logDebug(" estType is: " + estType);
						repeatedTask = true;
					}
					if (taskCnt < 2)
					{
						//logDebug("cnt is: " + cnt + " estType is: " + estType);
						cnt += 1;
						estTaskName[cnt] = estType;
					}
					if (!repeatedTask)
					{
						//logDebug("estType: " + estType + "; inspType: " + inspType);
						//logDebug("estType: " + estType);
						if (inspType == estType)
						{
							estGroup = "" + getTimeGroupName(estLogModel);
							var inspTimeElapsed = inspLogModel.getTimeElapsed();
							var inspHours = inspTimeElapsed.getHourOfDay();
							var inspMin = inspTimeElapsed.getMinute();
							lookup("FIN_TimeAcctWF",inspType);
							if (estGroup.equals("Hourly"))
							{
								fDef = getFeeDefByDesc("REVIEWHOURLY", inspType);
							}
							if (estGroup.equals("Hourly-AG"))
							{
								//logDebug("inspType is: " + inspType);
								fDef = getFeeDefByDesc("REVIEWHOURLY-AG", inspType + "-AG");
							}
							if (estGroup.equals("Expedited"))
								fDef = getFeeDefByDesc("REVIEWHOURLY_EXPEDITED", inspType);
							if (fDef != null)
							{
								if (costType=="Total")
								{
									theCost += ((inspHours*60) + inspMin)/60 * fDef.formula;
									//theCost += sumFees(null, "REVIEWHOURLY", "REVIEWHOURLY_EXPEDITED");
								}
								else
								{
									if (costType=="Current")
									{
										//logDebug("inspHours is: " + inspHours);
										if (inspLogModel.getBillable()=="N" && inspLogModel.getTimeLogModel().getTimeLogStatus() !="L")
											{theCost += (((inspHours*60) + inspMin)/60) * fDef.formula;}
									}
									else
									{
										/*if (costType=="Assessed")
										{
											if (inspLogModel.getTimeLogModel().getTimeLogStatus()=="L")
												{theCost += ((inspHours*60) + inspMin)/60 * fDef.formula;}
										}*/
									}
								}
							}
						}
					}
				}
			}//estim task loop
		}
	}//inspect loop
	return theCost;
}

function getFeeDefByDesc(fsched, feeDesc) {

	var parameterList = aa.util.newArrayList();

	var parameter1 = aa.genericQuery.getParameterModel("SERV_PROV_CODE", "ADDEV").getOutput();
	var parameter2 = aa.genericQuery.getParameterModel("R1_FEE_CODE", fsched).getOutput();
	var parameter3 = aa.genericQuery.getParameterModel("R1_GF_DES", feeDesc).getOutput();
	var parameter4 = aa.genericQuery.getParameterModel("FEE_SCHEDULE_VERSION", aa.finance.getDefaultVersionBySchedule(fsched)).getOutput();

	parameterList.add(parameter1);
	parameterList.add(parameter2);
	parameterList.add(parameter3);
	parameterList.add(parameter4);

	var sqlName = "getFeeDefByDescQuerySQL_1";
	var startRow = 0;
	var endRow = 300;

	var scriptResult = aa.genericQuery.query(sqlName, parameterList, startRow, endRow);
	if(scriptResult.getSuccess())
	{
		var returnInfo = scriptResult.getOutput();
		aa.print("Run Generic Query successfully!");
		aa.print("SQL Name: " + sqlName);
		aa.print("Return Code: " + returnInfo.getReturnCode());
		aa.print("Return Message: " + returnInfo.getReturnMessage());

		var jsonObj = eval('('+ returnInfo.getResult()+')');

		var f = new FeeDef();
		f.feeCode = jsonObj[0].R1_FEE_CODE;
		f.feeDesc = fDesc;
		f.formula = arrFees[0].R1_GF_FORMULA;
		f.comments = arrFees[0].COMMENTS;
		return f;
	}
	else
	{
		aa.print("Run Generic Query is failed!");
	}
	
} // function

function getTimeAccountingEntries(taskName) {
	// returns an array of timeLogModels
	//optional params: processName, capID, timeType, timeGroup

	var useProcess = false;
	var processName = "";
	if (arguments.length > 1) {
		if (arguments[1] != null && arguments[1] != "") {
			processName = arguments[2]; // subprocess
			useProcess = true;
		}
	}
	var itemCap = capId;
	if (arguments.length > 2) {
		if (arguments[2] != null && arguments[2] != "")
			itemCap = arguments[2]; // use cap ID specified in args
	}

	var timeType = null;
	if (arguments.length > 3) {
		if (arguments[3] != null && arguments[3] != "")
			timeType = arguments[3];
	}

	var timeGroup = null;
	if (arguments.length > 4) {
		if (arguments[4] != null && arguments[4] != "")
			timeGroup = arguments[4];
	}
/*		logDebug("arguments[0] is : " + arguments[0]);
		logDebug("arguments[1] is : " + arguments[1]);
		logDebug("arguments[2] is : " + arguments[2]);
		logDebug("arguments[3] is : " + arguments[3]);
		logDebug("arguments[4] is : " + arguments[4]);
 		logDebug("arguments[5] is : " + arguments[5]);
*/
	var retArray = new Array();

	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess()) {
  	 	var wfObj = workflowResult.getOutput();
		for (i in wfObj) {
   			var fTask = wfObj[i];
			if (taskName != null) {
				if (fTask.getTaskDescription().toUpperCase().equals(taskName.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName))) {
					var entityID = "" + fTask.getStepNumber() + ":" + fTask.getProcessID();
					taResult = aa.timeAccounting.getTimeLogModelByEntity(capId, entityID, "WORKFLOW", null, null);
					if (taResult.getSuccess()) {
						timeLogModelList = taResult.getOutput();
						if (timeLogModelList.size() > 0) {
							tlmlIterator = timeLogModelList.iterator();
							while (tlmlIterator.hasNext()) {
								timeLogModel = tlmlIterator.next();
								// for some reason this timeLogModel has null for the timeTypeModel
								timeLogSeq = timeLogModel.getTimeLogSeq();
								// so get it again, using the seq
								var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
									if (tResult.getSuccess()) {
									var timeLogModel = tResult.getOutput();
									if (timeLogModel != null) {
										if (timeType != null) {
											var timeTypeModel = timeLogModel.getTimeTypeModel();
											var thisTimeType = "" + timeTypeModel.getDispTimeTypeName();
											if (thisTimeType == timeType)
												retArray.push(timeLogModel);

										}
										if (timeGroup != null) {
											var thisTimeGroupName = "" + getTimeGroupName(timeLogModel);
											logDebug("timeGroup is: " + timeGroup + " and t.a. timeGroup is: " + thisTimeGroupName);
											if (thisTimeGroupName == timeGroup)
												retArray.push(timeLogModel);
										}
										if (timeType == null && timeGroup == null)
											retArray.push(timeLogModel);
									}
								}
							} // end while
						}
					}
					else  {
						logDebug("Error getting ta entries: " + taResult.getErrorMessage());
					}
					break;
				}
			}
			else
			{
				var entityID = "" + fTask.getStepNumber() + ":" + fTask.getProcessID();
				taResult = aa.timeAccounting.getTimeLogModelByEntity(capId, entityID, "WORKFLOW", null, null);
				if (taResult.getSuccess()) {
					timeLogModelList = taResult.getOutput();
					if (timeLogModelList.size() > 0) {
						tlmlIterator = timeLogModelList.iterator();
						while (tlmlIterator.hasNext()) {
							timeLogModel = tlmlIterator.next();
							// for some reason this timeLogModel has null for the timeTypeModel
							timeLogSeq = timeLogModel.getTimeLogSeq();
							// so get it again, using the seq
							var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
								if (tResult.getSuccess()) {
								var timeLogModel = tResult.getOutput();
								if (timeLogModel != null) {
									if (timeType != null) {
										var timeTypeModel = timeLogModel.getTimeTypeModel();
										var thisTimeType = "" + timeTypeModel.getDispTimeTypeName();
										if (thisTimeType == timeType)
											retArray.push(timeLogModel);

									}
									if (timeGroup != null) {
										var thisTimeGroupName = "" + getTimeGroupName(timeLogModel);
										if (thisTimeGroupName == timeGroup)
											retArray.push(timeLogModel);
									}
									if (timeType == null && timeGroup == null)
										retArray.push(timeLogModel);
								}
							}
						} // end while
					}
				}
				else  {
					logDebug("Error getting ta entries: " + taResult.getErrorMessage());
				}
				//break;
			}
		} // end for each task
	}
	else {
		logDebug("Error getting tasks : " + workflowResult.getErrorMessage());
	}
	return retArray;
}

function getTimeAccountingEntriesInspections() {
	// returns an array of timeLogModels
	var retArray = new Array();

	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
	{
		var inspList = inspResultObj.getOutput();
		for (yy in inspList)
		{
			var entityID = "" + inspList[yy].getIdNumber();
			//logDebug("inspList[yy].getInspectionType() is: " + inspList[yy].getInspectionType());
			taResult = aa.timeAccounting.getTimeLogModelByEntity(capId, entityID, "INSPECTION", null, null);
			if (taResult.getSuccess()) {
				timeLogModelList = taResult.getOutput();
				if (timeLogModelList.size() > 0) {
					tlmlIterator = timeLogModelList.iterator();
					while (tlmlIterator.hasNext()) {
						timeLogModel = tlmlIterator.next();
						// for some reason this timeLogModel has null for the timeTypeModel
						timeLogSeq = timeLogModel.getTimeLogSeq();
						// so get it again, using the seq
						var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
							if (tResult.getSuccess()) {
							var timeLogModel = tResult.getOutput();
							if (timeLogModel != null) {
								retArray.push(timeLogModel);
							}
						}
					} // end while
				}
			}
			else  {
				logDebug("Error getting ta entries: " + taResult.getErrorMessage());
			}
		} // end for each inspection
	}
	else {
		logDebug("Error getting inspections : " + inspResultObj.getErrorMessage());
	}
	return retArray;
}

function runReport(aaReportName)
{
	var bReport = false;
	var reportName=aaReportName;
	report = aa.reportManager.getReportModelByName(reportName);
	report = report.getOutput();
	var permit = aa.reportManager.hasPermission(reportName,currentUserID);
	if (permit.getOutput().booleanValue())
	{
		var parameters = aa.util.newHashMap();
		parameters.put("BatchNumber", setCode);
		//report.setReportParameters(parameters);
		var msg = aa.reportManager.runReport(parameters,report);
		aa.env.setValue("ScriptReturnCode", "0");
		aa.env.setValue("ScriptReturnMessage", msg.getOutput());
	}
}
	/*
	var reportName = aaReportName;
	report = aa.reportManager.getReportInfoModelByName(reportName);
	report = report.getOutput();
	report.setModule("BUILDING");
	//report.setCapId(capId);
	var parameters = aa.util.newHashMap();
	//Make sure the parameters includes some key parameters.
	parameters.put(aaReportParamName, aaReportParamValue);
	report.setReportParameters(parameters);
	var permit = aa.reportManager.hasPermission(reportName,currentUserID);
	if(permit.getOutput().booleanValue())
	{
		var reportResult = aa.reportManager.getReportResult(report);
		if(reportResult)
		{
			reportResult = reportResult.getOutput();
			var reportFile = aa.reportManager.storeReportToDisk(reportResult);
			reportFile = reportFile.getOutput();
		}
	}
	else
		logDebug("No permission to report: "+ reportName + " for Admin" + systemUserObj);
}
*/
function logDebug(edesc) {
	if (showDebug) {
		aa.eventLog.createEventLog("DEBUG", "Batch Process", "batchJobName", sysDate, sysDate,"", edesc,batchJobID);
		aa.print("DEBUG : " + edesc);
		emailText+="DEBUG : " + edesc + "\n" + br; }
	}

function getLastPayment(vCapId)
{
	if (arguments.length < 1)
		vCapId = capId;

	var xx = aa.finance.getPaymentByCapID(vCapId,null);
	var maxSeq = 0;
	var maxPayDD = 0;
	var payments;
	var retPayment = false;
	if (xx.getSuccess())
	{
		payments = xx.getOutput();
		for (yy in payments)
			if (payments[yy].getPaymentDate().getEpochMilliseconds() > maxPayDD && payments[yy].getPaymentStatus() == "Paid")
			{
				maxSeq = payments[yy].getPaymentSeqNbr();
				maxPayDD = payments[yy].getPaymentDate().getEpochMilliseconds();
			}
		if(maxSeq != 0)
		    retPayment = aa.finance.getPaymentByPK(vCapId,maxSeq,null).getOutput();
	}

	return retPayment;

}

function getCapId(pid1,pid2,pid3)
{
    var s_capResult = aa.cap.getCapID(pid1, pid2, pid3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("ERROR", "ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
}
function voidFee(fcode,fperiod,fstatus)
    {
    var feeFound=false;
    getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
    if (getFeeResult.getSuccess())
        {
        var feeList = getFeeResult.getOutput();
        for (feeNum in feeList)
	if (feeList[feeNum].getFeeitemStatus().equals(fstatus)) {
		var feeSeq = feeList[feeNum].getFeeSeqNbr();
		var feeVoidResult = aa.finance.voidFeeItem(capId, feeSeq);
		if (feeVoidResult.getSuccess()) {
			logDebug("Voided fee item " + feeSeq);
            return feeSeq;
		}
		else {
			logDebug("Error voiding fee item " + feeVoidResult.getErrorMessage());
			return false;
		}
        }
    }
    else
		{ logDebug( "**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())}
    return feeFound;
    }
function loadASITable(tname)
{

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
function logMessage(etype,edesc)
	{
	aa.eventLog.createEventLog(etype, "Batch Process", "batchJobName", sysDate, sysDate,"", edesc,batchJobID);
	aa.print(etype + " : " + edesc);
	emailText+=etype + " : " + edesc + "\n";
	}

function asiTableValObj(columnName, fieldValue, readOnly) {
	this.columnName = columnName;
	this.fieldValue = fieldValue;
	this.readOnly = readOnly;

	asiTableValObj.prototype.toString=function(){ return this.fieldValue }
};

function removeASITable(tableName) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValues is an associative array of values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.removeAppSpecificTableInfos(tableName,itemCap,currentUserID)

	if (!tssmResult.getSuccess())
		{ aa.print("**WARNING: error removing ASI table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }
        else
	logDebug("Successfully removed all rows from ASI Table: " + tableName);

	}

function addASITable(tableName,tableValueArray) // optional capId
    {
  	//  tableName is the name of the ASI table
  	//  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
    	var itemCap = capId
  	if (arguments.length > 2)
  		itemCap = arguments[2]; // use cap ID specified in args

  	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

  	if (!tssmResult.getSuccess())
  		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

  	var tssm = tssmResult.getOutput();
  	var tsm = tssm.getAppSpecificTableModel();
  	var fld = tsm.getTableField();
        var fld_readonly = tsm.getReadonlyField(); // get Readonly field

         	for (thisrow in tableValueArray)
  		{

  		var col = tsm.getColumns()
  		var coli = col.iterator();

  		while (coli.hasNext())
  			{
  			var colname = coli.next();

			if (typeof(tableValueArray[thisrow][colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj
				{
	  			fld.add(tableValueArray[thisrow][colname.getColumnName()].fieldValue);
	  			fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
				}
			else // we are passed a string
				{
  				fld.add(tableValueArray[thisrow][colname.getColumnName()]);
  				fld_readonly.add(null);
				}
  			}

  		tsm.setTableField(fld);

  		tsm.setReadonlyField(fld_readonly);

  		}

  	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

  	 if (!addResult .getSuccess())
  		{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
//  	else
//  		logDebug("Successfully added record to ASI Table: " + tableName);

  	}
function addToASITable(tableName,tableValues) // optional capId
{
	//  tableName is the name of the ASI table
	//  tableValues is an associative array of values.  All elements must be either a string or asiTableVal object
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

		if (typeof(tableValues[colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj
			{
			fld.add(tableValues[colname.getColumnName()].fieldValue);
			fld_readonly.add(tableValues[colname.getColumnName()].readOnly);
			}
		else // we are passed a string
			{
			fld.add(tableValues[colname.getColumnName()]);
			fld_readonly.add(null);
			}
		}

	tsm.setTableField(fld);
	tsm.setReadonlyField(fld_readonly); // set readonly field

	addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
	if (!addResult .getSuccess())
		{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	else
		logDebug("Successfully added record to ASI Table: " + tableName);
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
			{ logDebug( "**ERROR: getting fee items: " + feeResult.getErrorMessage()); return false }

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
function Fee() // Fee Object
	{
	this.sequence = null;
	this.code =  null;
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
function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}
function getTimeGroupName(timeLogModel) {
	var timeGroupSeq = timeLogModel.getTimeGroupSeq();
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

function FeeDef() { // Fee Definition object
	this.formula = null;
	this.feeUnit = null;
	this.feeDesc = null;
	this.feeCode = null;
	this.comments = null;
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
function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
{
	// Updated Script will return feeSeq number or null if error encountered (SR5112)
	//logDebug("finvoice is: " + finvoice);

	var feeSeqList = new Array();						// invoicing fee list
	var FeeSeqList = aa.env.getValue("FeeItemsList");
	//logDebug("FeeSeqList = " + FeeSeqList);
	var paymentPeriodList = new Array();					// invoicing pay periods

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
		logDebug("Successfully added Fee " + fcode + ", Qty " + fqty);
		//logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

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
function invoiceFee(fcode,fperiod)
{
    //invoices all assessed fees having fcode and fperiod
    // SR5085 LL
	var feeSeqList = new Array();						// invoicing fee list
	var FeeSeqList = aa.env.getValue("FeeItemsList");
	logDebug("FeeSeqList = " + FeeSeqList);
	var paymentPeriodList = new Array();					// invoicing pay periods
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
}
function makePayment(paymentAmount, cashierID, paymentMethod, refNbr, payee, payeeAddress, prmtId)  {

	// Create the payment
	var totalPaid = paymentAmount;
	var paymentScriptModel = aa.finance.createPaymentScriptModel();
	paymentScriptModel.setCapID(prmtId);
	paymentScriptModel.setPaymentMethod(paymentMethod);
	paymentScriptModel.setPaymentDate(aa.date.getCurrentDate());
	paymentScriptModel.setCashierID(cashierID);
	paymentScriptModel.setPaymentStatus("Paid");
	paymentScriptModel.setPaymentRefNbr(refNbr);
	paymentScriptModel.setPaymentAmount(paymentAmount);
	paymentScriptModel.setAmountNotAllocated(paymentAmount);
	paymentScriptModel.setPaymentChange(0);
	paymentScriptModel.setPayee(payee);
	paymentScriptModel.setPaymentComment(payeeAddress);
	var makePaymentResult = aa.finance.makePayment(paymentScriptModel);
	if (makePaymentResult.getSuccess()) {
		paymentResultModel = makePaymentResult.getOutput();
		logDebug("Made the payment of amount" + paymentAmount);
		return paymentResultModel;
	}
	else {
		logDebug("Error " + makePaymentResult.getErrorMessage());
		return false;
	}

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

	var feeResult=aa.fee.getFeeItems(capId, feestr, null);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		if ( feestr.equals(feeObjArr[ff].getFeeCod()) && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray) ) )
			return true;

	return false;
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
		aa.print("Successfully edited Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
	else
		aa.print("**ERROR editing Std Choice " + editResult.getErrorMessage());
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
function sumAllAssessedFees()
{ // optional : capid, names of fee schedules to ignore

	ignoreArray = new Array();

	if (arguments.length > 0) itemCap = arguments[0]; // use cap ID specified in args
	if (arguments.length > 1) {
		for (var i=1; i<arguments.length;i++)
			ignoreArray.push(arguments[i])
	}

	var feeSum = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess()) {
		var feeObjArr = feeResult.getOutput();
		for (ff in feeObjArr) {
			var feeObj = feeObjArr[ff];
			var f4FeeItemModel = feeObj.getF4FeeItemModel();
			var feeSch = f4FeeItemModel.getFeeSchudle();
			var feeStat = f4FeeItemModel.getFeeitemStatus();
			if (!exists(feeSch, ignoreArray) && feeStat !=("CREDITED") && feeStat !=("NEW"))
				feeSum += feeObj.getFee();
		}
	}
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	feeSum=Math.round(feeSum*Math.pow(10,2))/Math.pow(10,2);
	return feeSum;
}

function sumAllFees()
{ // optional : capid, names of fee schedules to ignore

	ignoreArray = new Array();

	if (arguments.length > 0) itemCap = arguments[0]; // use cap ID specified in args
	if (arguments.length > 1) {
		for (var i=1; i<arguments.length;i++)
			ignoreArray.push(arguments[i])
	}

	var feeSum = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess()) {
		var feeObjArr = feeResult.getOutput();
		for (ff in feeObjArr) {
			var feeObj = feeObjArr[ff];
					var f4FeeItemModel = feeObj.getF4FeeItemModel();
					var feeSch = f4FeeItemModel.getFeeSchudle();
					var feeStat = f4FeeItemModel.getFeeitemStatus();
			if (!exists(feeSch, ignoreArray) && feeStat !=("CREDITED"))
				feeSum += feeObj.getFee();
		}
	}
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	feeSum=Math.round(feeSum*Math.pow(10,2))/Math.pow(10,2);
	return feeSum;
}

function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

function sumFees() { // optional: capid, names of fee schedules to include
	includeArray = new Array();

	if (arguments.length > 0) itemCap = arguments[0]; // use cap ID specified in args
	if (arguments.length > 1) {
		for (var i=1; i<arguments.length;i++)
			includeArray.push(arguments[i])
	}

	var feeSum = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess()) {
		var feeObjArr = feeResult.getOutput();
		for (ff in feeObjArr) {
			var feeObj = feeObjArr[ff];
                        var f4FeeItemModel = feeObj.getF4FeeItemModel();
						var feeStat = f4FeeItemModel.getFeeitemStatus()
                        var feeSch = f4FeeItemModel.getFeeSchudle();
			if (exists(feeSch, includeArray) && feeStat !=("CREDITED"))
				feeSum += feeObj.getFee();
		}
	}
	else
		{ logDebug( "**ERROR: getting fee items: " + feeResult.getErrorMessage()); return false }

	feeSum=Math.round(feeSum*Math.pow(10,2))/Math.pow(10,2);
	return feeSum;
}