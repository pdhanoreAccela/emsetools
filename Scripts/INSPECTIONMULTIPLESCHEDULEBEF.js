// script example to get all properties for InspectionMultipleScheduleBefore EMSE events

aa.print("EMSE Start");

//script entrance.
var ServiceProviderCode = aa.env.getValue("ServiceProviderCode");
var CurrentUserID = aa.env.getValue("CurrentUserID");
var NumberOfInspections = aa.env.getValue("NumberOfInspections");
var PermitID1Array = aa.env.getValue("PermitID1Array");
var PermitID2Array = aa.env.getValue("PermitID2Array");
var PermitID3Array = aa.env.getValue("PermitID3Array");
var InspectionIDArray = aa.env.getValue("InspectionIDArray");
var StaffDepartmentArray = aa.env.getValue("StaffDepartmentArray");
var InspectionInspectorArray = aa.env.getValue("InspectionInspectorArray");
var StaffFirstNameArray = aa.env.getValue("StaffFirstNameArray");
var StaffMiddleNameArray = aa.env.getValue("StaffMiddleNameArray");
var StaffLastNameArray = aa.env.getValue("StaffLastNameArray");
var InspectionDateArray = aa.env.getValue("InspectionDateArray");
var InspectionTimeArray = aa.env.getValue("InspectionTimeArray");
var InspectionAMPMArray = aa.env.getValue("InspectionAMPMArray");
var InspectionEndTimeArray = aa.env.getValue("InspectionEndTimeArray");
var InspectionEndAMPMArray = aa.env.getValue("InspectionEndAMPMArray");

aa.print("ServiceProviderCode: " + ServiceProviderCode);
aa.print("CurrentUserID: " + CurrentUserID);
aa.print("NumberOfInspections: " + NumberOfInspections);

for (var i=0; i<InspectionIDArray.length; i++)
{
	aa.print("Inspection-" + (i+1) + ":");
	aa.print(" | PermitID1: " + PermitID1Array[i]);
	aa.print(" | PermitID2: " + PermitID2Array[i]);
	aa.print(" | PermitID3: " + PermitID3Array[i]);
	aa.print(" | InspectionID: " + InspectionIDArray[i]);
	aa.print(" | StaffDepartment: " + StaffDepartmentArray[i]);
	aa.print(" | InspectionInspector: " + InspectionInspectorArray[i]);
	aa.print(" | StaffFirstName: " + StaffFirstNameArray[i]);
	aa.print(" | StaffMiddleName: " + StaffMiddleNameArray[i]);
	aa.print(" | StaffLastName: " + StaffLastNameArray[i]);
	aa.print(" | InspectionDate: " + InspectionDateArray[i]);
	aa.print(" | InspectionTime: " + InspectionTimeArray[i]);
	aa.print(" | InspectionAMPM: " + InspectionAMPMArray[i]);
	aa.print(" | InspectionEndTime: " + InspectionEndTimeArray[i]);
	aa.print(" | InspectionEndAMPM: " + InspectionEndAMPMArray[i]);
}

aa.print("EMSE End");

aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", "Successfully.");

