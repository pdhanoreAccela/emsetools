/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2014
|
| SVN Id: ExternalDocReviewCompleted.js 6515 2014-08-01 18:15:38Z james.liang
| Program : ContactAddAfterV2.0.js
| Event   : ContactAddAfter
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
var controlString = "ExternalDocReviewCompleted"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents"				// Standard choice to execute first (for globals, etc)
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps
var testIsOk = true;

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 2.0

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}
	
function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var servProvCode = aa.env.getValue("ServiceProviderCode");
var capId = aa.env.getValue("CapIDModel");
var capType = aa.env.getValue("RecordType").toString();
var checkInDocuments = aa.env.getValue("CheckedinDocuments");
var altID = aa.env.getValue("AlternateID");
var capStatus = aa.env.getValue("CapStatus");
var year = aa.date.getCurrentDate().getYear();
var month =aa.date.getCurrentDate().getMonth();
var day = aa.date.getCurrentDate().getDayOfMonth();
var sysDate = aa.date.getCurrentDate();
var currentDate = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"");
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
capId = aa.cap.getCapID("14CAP", "00000", "00AXX").getOutput();
var checkedinFileName='';
var docSeqNbr = '';
var firstName ='';
var middleName ='';
var lastName = '';
var planReview="Plan Review";
var needCorrection="Need Corrections";
var wfObj = aa.workflow.getTasks(capId).getOutput();
var stepnumber;
var processID;
var workflowTaskStatus =capStatus;
/*-------------get checked in document name.........................*/
for(i in checkInDocuments)
{
	docSeqNbr = checkInDocuments[i].getDocumentNo();
	checkedinFileName = checkInDocuments[i].getFileName();
}

//update the current workflow task Plan Review to Need Corrections
for (i in wfObj)
{
	fTask = wfObj[i];
	//complete the "Plan Review" task
	if (planReview.equals(fTask.getTaskDescription()))
	{
		aa.print("Complete the task: Plan Review");
		stepnumber = fTask.getStepNumber();
		processID = fTask.getProcessID();
		aa.workflow.adjustTask(capId, stepnumber, processID, "N", "Y", null, null);
	}
	if (needCorrection.equals(fTask.getTaskDescription()))
	{
		aa.print("Active the task: Need Corrections");
		stepnumber = fTask.getStepNumber();
		processID = fTask.getProcessID();
		aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null);
	}
}

