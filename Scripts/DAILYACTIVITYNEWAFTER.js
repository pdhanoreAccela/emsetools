aa.print("DailyActivityNewAfter emse script start.");

var activityModel = aa.env.getValue("ActivityModel");
if(activityModel)
{
	aa.print(" | Activity Number: " + activityModel.getActivityNumber());
	aa.print(" | Activity Name: " + activityModel.getActivityName());
	aa.print(" | Activity Description: " + activityModel.getActivityDescription());
	aa.print(" | Activity Type: " + activityModel.getActivityType());
	aa.print(" | Activity Start Date: " + activityModel.getActDate());
	aa.print(" | Assigned Department: " + activityModel.getAssignedDeptNumber());
	aa.print(" | Assigned Staff: " + activityModel.getAssignedStaffID());
	aa.print(" | Activity Due Date: " + activityModel.getActDueDate());
	aa.print(" | Status: " + activityModel.getStatus());
	aa.print(" | Priority: " + activityModel.getPriority());
	aa.print(" | Internal Only: " + activityModel.getInternalOnly());
}

aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", "Successfully.");

aa.print("DailyActivityNewAfter emse script end.");