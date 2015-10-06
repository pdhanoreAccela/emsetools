// script example to get OriginalInspectionIdArray for EMSE events (InspectionScheduleBefore)

aa.print("EMSE Start");
var InspectionDesiredDate = aa.env.getValue("InspectionDesiredDate");
var InspectionDesiredTime = aa.env.getValue("InspectionDesiredTime");
var InspectionDesiredAMPM = aa.env.getValue("InspectionDesiredAMPM");
aa.print("InspectionDesiredDate : " + InspectionDesiredDate);
aa.print("InspectionDesiredDate : " + InspectionDesiredTime);
aa.print("InspectionDesiredDate : " + InspectionDesiredAMPM);
//script entrance.
// inspection type
var inspectionTypeListStr = aa.env.getValue("InspectionTypeList");
var inspectionTypeArray = inspectionTypeListStr.split("\\|");
// original inspection id
var originalInspectionIdArray = aa.env.getValue("OriginalInspectionIdArray");

// output the original-new inspection relationship
for(var i=0;i<inspectionTypeArray.length;i++)
{
	// get inspection type
	var inspectionType = inspectionTypeArray[i];

	// get original Inspection ID
	var originalInspectionId = originalInspectionIdArray[i];

	if (originalInspectionId == null)
	{
		// for schedule, the original inspection id is null		
		aa.print("The inspection (" + inspectionType  + ") is scheduling, the new inspection has not been created yet.");
	}
	else
	{
		// for reschedule
		aa.print("The inspection (" + inspectionType  + ") is rescheduling, the original inspection ID is " + originalInspectionId + ", the new inspection has not been created yet.");
	}
}

aa.print("EMSE End");

aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", "unSuccessfully.");

