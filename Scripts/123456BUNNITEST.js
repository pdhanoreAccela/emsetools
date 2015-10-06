function getCapId() 
 {
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
 //Get the TaskItem by taskID
function getTaskItem(taskId, currentCapId)
 {
	var allTasksScriptResult = aa.workflow.getTasks(currentCapId);
	if(allTasksScriptResult.getSuccess())
	{
		var allTasks = allTasksScriptResult.getOutput();
		for( i  in allTasks)
		{
			var taskItem = allTasks[i];
			var currenttaskID = taskItem.getCurrentTaskID();
			if(taskId == currenttaskID)
			{
				return taskItem;
			}
		}
	}
	else
	{
		logMessage("**ERROR: Failed to get workflow object: " + workflowTaskResult.getErrorMessage()); 
	}
 }
 // print the message
 function logMessage(message)
 {
   aa.print(message);
 }
 // check the current task  is at the taskName array.
 function isParallentTask(currentTaskName)
 {
	for(var i= 0; i<taskName.length; i++)
	{
		if(taskName[i] == currentTaskName)
		{
			return true;
		}
	}
	return false;
 }
 
 

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

	
function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";	
}

var capId = getCapId();
var currentUpdatedTask = aa.env.getValue("WorkflowTask"); 

var workflowResult =  aa.workflow.getTask(capId, "Subpoena Intake");
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());  }
	
   		var fTask = wfObj;
 		if (fTask.getTaskDescription().toUpperCase().equals(currentUpdatedTask.toUpperCase()))
			{
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
				aa.workflow.handleDisposition(capId,stepnumber,"NA",dispositionDate, null,null,systemUserObj ,"Y");
			
			logMessage("Closing Workflow Task: " + " with status " + "NA");
			}	

aa.print("test");
		