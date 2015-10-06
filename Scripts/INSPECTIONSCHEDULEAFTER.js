// script example to get OriginalInspectionIdArray for EMSE events (InspectionScheduleAfter)

aa.print("EMSE Start");

//script entrance.
// inspection type
var inspectionTypeListStr = aa.env.getValue("InspectionTypeList");
var inspectionTypeArray = inspectionTypeListStr.split("\\|");
// original inspection id
var originalInspectionIdArray = aa.env.getValue("OriginalInspectionIdArray");
// new/update inspection id
var inspectionIdListStr = aa.env.getValue("InspectionIdList");
var inspectionIdArray = inspectionIdListStr.split("\\|");

// output the original-new inspection relationship
for(var i=0;i<inspectionTypeArray.length;i++)
{
	// get inspection type
	var inspectionType = inspectionTypeArray[i];

	// get original Inspection ID
	var originalInspectionId = originalInspectionIdArray[i];

	// get new/update Inspection ID
	var inspectionId = inspectionIdArray[i];

	if (originalInspectionId == null)
	{
		// for schedule, the original inspection id is null		
		aa.print("The inspection (" + inspectionType  + ") has been scheduled, the new inspection ID is " + inspectionId + ".");
	}
	else
	{
		// for reschedule
		aa.print("The inspection (" + inspectionType  + ") has been rescheduled, the original inspection ID is " + originalInspectionId + ", the new inspection ID is " +  inspectionId + ".");
	}
}

aa.print("EMSE End");

aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", "Successfully.");