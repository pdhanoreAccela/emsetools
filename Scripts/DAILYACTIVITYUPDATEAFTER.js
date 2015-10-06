//Description:
//This sample script is used to auto create an activity assigned to a user when a public user registers.
//Event Name: RegistrationSubmitAfter  DailyActivityDeleteBefore  DailyActivityDeleteAfter
//            DailyActivityUpdateBefore  DailyActivityUpdateAfter  DailyActivityNewAfter
//-----------------------------------------------------------------------------------------------------------

var createMessage = "Outlook task create successfully";
var updateMessage = "Outlook task update successfully";
var deleteMessage = "Outlook task delete successfully";

//get V360 exists activityModel
var activityModel = aa.env.getValue("ActivityModel");
//var activityModel = aa.activity.getActivityByID(174).getOutput();

/**
// create a new activity model
var activityModel = aa.activity.getNewActivityModel().getOutput();
activityModel.setServiceProviderCode("ADDEV");
activityModel.setInternalOnly("Y"); // must have a value: Y/N
activityModel.setActivityName("Approval register public user");  
activityModel.setActivityDescription("Please approval of registered public user");
activityModel.setAssignedStaffID("TEST1"); // task owener
activityModel.setAuditID("ADMIN");
activityModel.setPriority("Normal");  // Normal, Low, High
var actDate = aa.date.parseDate("2013-01-17");  // task start date, yyyy-MM-dd or MM/dd/yyyy
var actDueDate = aa.date.parseDate("2013-01-17");  // task due date
activityModel.setActDate(transToJavaUtilDate(actDate));
activityModel.setActDueDate(transToJavaUtilDate(actDueDate));

// create V360 activity data
var activityResult = aa.activity.createActivity(activityModel);
if (activityResult.getSuccess())
{
	activityModel.setActivityNumber(activityResult.getOutput());
}
**/

var message = "";
var taskModel = convertModel(activityModel);  // must convert model

// create outlook task data
//createTask(taskModel);
updateTask(taskModel);
//deleteTask(taskModel);
//DailyActivityDeleteAfter get delete activity list
/**
var deleteActivityList = aa.env.getValue("ActivityModelList");
if (deleteActivityList != null && deleteActivityList.size() > 0)
{
	for (var i=0; i < deleteActivityList.size(); i++)
	{
		deleteTask(convertModel(deleteActivityList.get(i)));   // must convert model
	}
}
**/


/**
* create outlook task
*/
function createTask(taskModel)
{
	var taskResult = aa.communication.createTask(taskModel);
	if (taskResult.getSuccess())
	{
		activityModel.setExternalActivityID(taskResult.getOutput());
		aa.activity.updateActivity(activityModel);
		message = createMessage;
	}
	else
	{
		message = "**ERROR: Outlook task create failed.  Reason is: " + taskResult.getErrorType() + ": " + taskResult.getErrorMessage();
	}
}

/**
* update outlook task
*/
function updateTask(taskModel)
{
	var taskResult = aa.communication.updateTask(taskModel);
	if (taskResult.getSuccess())
	{
		activityModel.setExternalActivityID(taskResult.getOutput());
		aa.activity.updateActivity(activityModel);
		message = updateMessage;
	}
	else
	{
		message = "**ERROR: Outlook task update failed.  Reason is: " + taskResult.getErrorType() + ": " + taskResult.getErrorMessage();
	}
}

/**
* deleete outlook task
*/
function deleteTask(taskModel)
{
	var taskResult = aa.communication.deleteTask(taskModel);
	if (taskResult.getSuccess())
	{
		message =  deleteMessage;
	}
	else
	{
		message = "**ERROR: Outlook task delete failed.  Reason is: " + taskResult.getErrorType() + ": " + taskResult.getErrorMessage();
	}
}

/**
* convert business model
*/
function convertModel(activityModel)
{
	var taskModel = aa.communication.getNewTaskModel().getOutput();
	taskModel.setSubject(activityModel.getActivityName());
	taskModel.setBody(activityModel.getActivityDescription());
	taskModel.setStartDate(activityModel.getActDate());
	taskModel.setDueDate(activityModel.getActDueDate());
	taskModel.setStatus(activityModel.getStatus());
	taskModel.setPriority(activityModel.getPriority());
	taskModel.setAssignedStaffID(activityModel.getAssignedStaffID());
	taskModel.setServiceProviderCode(activityModel.getServiceProviderCode());
	taskModel.setTaskID(activityModel.getExternalActivityID());
	return taskModel;
}

/**
* convert to java Date
*/
function transToJavaUtilDate(scriptDateTime)
{
	return aa.date.transToJavaUtilDate(scriptDateTime.getEpochMilliseconds());
}

aa.env.setValue("ScriptReturnMessage",message);