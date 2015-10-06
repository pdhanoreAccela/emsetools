
var permitId1 = aa.env.getValue("PermitId1");
var permitId2 = aa.env.getValue("PermitId2");
var permitId3 = aa.env.getValue("PermitId3"); 
var appStatus = aa.env.getValue("ApplicationStatus");


/*var permitId1 = "14CAP";
var permitId2 = "00000";
var permitId3 = "009AZ"; */

var capID = aa.cap.getCapID(permitId1, permitId2, permitId3).getOutput();
var taskItemList = getActiveTaskItems(capID);

function getActiveTaskItems(capID)
{
    var taskItems = new Array();
	var activeTaskItems =  aa.util.newArrayList();
	var taskResult = aa.workflow.getTasks(capID);
	if(taskResult.getSuccess)
	{
		taskItems = taskResult.getOutput();
		for(var i= 0; i < taskItems.length; i++)
		{
			var taskItemScriptModel = taskItems[i];
			var taskItemModel= taskItemScriptModel.getTaskItem();
			if("Y".equals(taskItemModel.getActiveFlag()))
			{
				activeTaskItems.add(taskItemModel);
				aa.print("Get the workflow active taskItem: " + taskItemModel.getTaskDescription());
			}

		}
		aa.env.setValue("ScriptReturnCode", "0");
		aa.env.setValue("ScriptReturnMessage", "Successful get the workflow active taskItem.");
	}
	else
	{
		aa.print( "**ERROR: error getting taskItems: " + taskResult.getErrorMessage())
	}
    return activeTaskItems;
}

















