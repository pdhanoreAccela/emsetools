var taskNBR = aa.env.getValue("SD_STP_NUM");
var capId = getCapID().getCapID();
var taskItem = getOutput(aa.workflow.getTask(capId,aa.util.parseInt(taskNBR).intValue()),"");
var assigenUser = getOutput(aa.people.getUsersByUserIdAndName("",taskItem.getAssignedStaff().getFirstName(),taskItem.getAssignedStaff().getMiddleName(),taskItem.getAssignedStaff().getLastName()),"")[0];
var doc = getOutput(aa.document.getDocumentByPK(18160),"");

var docList = aa.util.newArrayList();
var reviewList = aa.util.newArrayList();
docList.add(doc);
reviewList.add(assigenUser);


aa.document.associateReviewer2Doc(docList, reviewList,taskItem.getTaskItem());

function getCapID()
{
    var id1 = aa.env.getValue("PermitId1");
    var id2 = aa.env.getValue("PermitId2");
    var id3 = aa.env.getValue("PermitId3");
    return aa.cap.createCapIDScriptModel(id1, id2, id3);
}

function getOutput(result, object)
{
	if (result.getSuccess())
	{
		return result.getOutput();
	}
	else
	{
		logError("ERROR: Failed to get " + object + ": " + result.getErrorMessage());
		return null;
	}
}


aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage",taskItem.getAssignedStaff().getUserID());