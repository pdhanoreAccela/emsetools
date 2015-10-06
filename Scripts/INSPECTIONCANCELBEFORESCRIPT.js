aa.print("InspectionCancelBefore emse script start.");

//Get inspection model list
var inspectionList= aa.env.getValue("InspectionList");

//Get product
var product= aa.env.getValue("Product");

// output the EMSE parameters for test
aa.print("product: " + product);
for (var i=0;i<inspectionList.size();i++)
{
	var inspection = inspectionList.get(i);
	aa.print("Selected Inspection-" + (i+1) + ":");
	aa.print(" | PermitID1: " + inspection.getActivity().getCapID().getID1());
	aa.print(" | PermitID2: " + inspection.getActivity().getCapID().getID2());
	aa.print(" | PermitID3: " + inspection.getActivity().getCapID().getID3());
	aa.print(" | InspectionID: " + inspection.getActivity().getIdNumber());
	aa.print(" | InspectionType: " + inspection.getActivity().getActivityType());
	aa.print(" | Status: " + inspection.getActivity().getStatus());
	aa.print(" | Required/Optional: " + inspection.getActivity().getRequiredInspection());
}

aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", "Successfulluy.");

aa.print("InspectionCancelBefore emse script end.");