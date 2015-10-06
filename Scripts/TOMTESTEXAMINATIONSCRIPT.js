handleWrittenExam();
handleEducationReview();


function handleWrittenExam()
{
	// Get values from enviroment
	var capId = aa.cap.getCapID(aa.env.getValue("PermitId1"),aa.env.getValue("PermitId2"),aa.env.getValue("PermitId3")).getOutput();
	var capIdScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(),capId.getID2(),capId.getID3());
	var capScriptModel = aa.cap.getCap(capId).getOutput();

	// Specify the special Record type.
	var recordTypeAlias = "tomWorkflowTestCapType";
	var group = 'Building', type = 'tom', subtype = 'tom', category = 'tom';

	var statusPath = 'Special Arrangements Required';
	var taskPath = 'Written Exam';

	if(aa.env.getValue('WorkflowStatus') == statusPath && aa.env.getValue("WorkflowTask") == taskPath)
	{
		createChildCap();
	}

	function createChildCap()
	{
		// Get the record type.
		var recordTypesMap = getAllRecordTypes();
		var recordType = recordTypesMap.get(recordTypeAlias);
		if(recordType != null)
		{
			var initialCapModel = aa.cap.getCapModel().getOutput();
			initialCapModel.setCapType(recordType);
			initialCapModel.setParentCapID(capId);
			
			// Create the record, which is set as the child record for the current record.
			var childCapId = aa.cap.createApp(group, type, subtype, category, null).getOutput();
			
			// Create hierarchy.
			aa.cap.createAppHierarchy(capId, childCapId);
			
			var childCapScriptModel = aa.cap.getCap(childCapId).getOutput();
			// Copy contact.
			aa.cap.copyContact(capScriptModel, childCapScriptModel);
			// Copy address.
			aa.cap.copyAddress(capScriptModel, childCapScriptModel);
			// Copy comments.
			aa.cap.copyComments(capScriptModel, childCapScriptModel);
			// Copy education.
			aa.education.copyEducationList(capId, childCapId);
			// Copy examination.
			aa.examination.copyExaminationList(capId, childCapId);
			// Copy ASI items.
			aa.appSpecificInfo.copyASISubGroups(capId, childCapId, null);
			
			aa.print("Record created successfully. The record type is " + recordTypeAlias);
			aa.env.setValue("ScriptReturnCode","0");
			aa.env.setValue("ScriptReturnMessage", "Record created.");
		}
		else
		{
			aa.env.setValue("ScriptReturnCode","0");
			aa.env.setValue("ScriptReturnMessage", "ERROR: Failed to get record type." + recordType.getErrorMessage());
		}
	}

	/**
	 * Get all Record Type from Database.
	 */
	function getAllRecordTypes() 
	{
		var allRecordTypeMap = aa.util.newHashMap();
		var allRecordTypes = aa.cap.getCapTypeList(null).getOutput();
		if (allRecordTypes != null && allRecordTypes.length > 0) 
		{
			for ( var i = 0; i < allRecordTypes.length; i++) 
			{
				var recordType = allRecordTypes[i].getCapType();
				var alias = recordType.getAlias();
				allRecordTypeMap.put(alias, recordType);
			}
		}
		return allRecordTypeMap;
	}
}

function handleEducationReview()
{
	var taskPath ="Education Review";

	var initialStatus = "Verification Request Initiated";
	var autoCompleteStatus = "Auto Verification Complete";
	var denialStatus = "Auto Verification Denied";
	var originalStatus = "Pending Auto Verification";

	// Get values from enviroment
	var capId = aa.cap.getCapID(aa.env.getValue("PermitId1"),aa.env.getValue("PermitId2"),aa.env.getValue("PermitId3")).getOutput();
	var capScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(),capId.getID2(),capId.getID3());

	//if(aa.env.getValue('WorkflowTask') != taskPath)
	//{
	//	return;
	//}
	
	// Get workflow task item
	var taskResult = aa.workflow.getTask(capId, taskPath);
	if(taskResult.getSuccess())
	{
		
		//1. update task status			
		var sTask = taskResult.getOutput();
		aa.print("get task successful : task name = " + sTask.getTaskDescription() + "; Process name = " + sTask.getProcessCode()+
							"; Disposition = " + sTask.getDisposition());
		
		var nextTaskStatus = handleNextStatus(sTask);
		aa.print('Set the status to: ' + nextTaskStatus);
		
		sTask.setDisposition(nextTaskStatus);		
		updateResult = aa.workflow.handleDisposition(sTask.getTaskItem(), capId);	
		
		if(updateResult.getSuccess()){
			aa.print("update task status successfully!");
			aa.env.setValue("ScriptReturnCode","0");
			aa.env.setValue("ScriptReturnMessage", "update task status successfully!");
		}
		else
		{
			aa.print("ERROR: Failed to update task status!");
			aa.env.setValue("ScriptReturnCode","0");
			aa.env.setValue("ScriptReturnMessage", "ERROR: Failed to update task status!");
		}
	}//if get task successfully
	else {
		aa.print("ERROR: Failed to get workflow task(" + capId + ") for review: " + taskResult.getErrorMessage());
		aa.env.setValue("ScriptReturnCode","0");
		aa.env.setValue("ScriptReturnMessage", "ERROR: Failed to get workflow task(" + capId + ") for review: " + taskResult.getErrorMessage());
	}//if else getting task is failed



	function handleNextStatus(task)
	{
		// 1. verify.
		var pending = isRequiredPendingStatus(task);
		if(pending)
		{
			return initialStatus;
		}
		else
		{
			//return getExaminationsResult() == true ? autoCompleteStatus : denialStatus;
		}
		
	}

	function isRequiredPendingStatus(task)
	{
		if(task.getDisposition() == originalStatus)
		{
			return true;
		}
		
		return false;
	}

	function getExaminationsResult()
	{
		var exams = aa.examination.getExaminationList(capScriptModel);
		if(exams.getSuccess())
		{
			exams = exams.getOutput();
			for(var i = 0, len = exams.length; i < len; i++)
			{
				if(!passExams(exams[i]))
					return false;
			}
			
			return true;
		}
	}

	function passExams(examModel)
	{
		var gradeingStyle = examModel.getGradingStyle().trim();
		var finalScore = examModel.getFinalScore();
		var passScore = examModel.getPassingScore();
		var result = true;
		if("none" !== gradeingStyle && finalScore < passScore)
		{
			result = false;
		}
		return result;
	}
}