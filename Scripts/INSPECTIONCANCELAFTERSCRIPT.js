aa.print("InspectionCancelAfter emse script start.");

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

//if (product == "ACA")
{
	//aa.print("product == ACA");
	if(inspectionList != null)
	{ 	
		aa.print("inspectionList != null");
		var its = inspectionList.iterator();

		while(its.hasNext())
		{
			aa.print("inspectionModel != null");

			var inspectionModel = its.next();
			var requiredInspection = inspectionModel.getActivity().getRequiredInspection();

			aa.print("requiredInspection=" + requiredInspection);
			//if(requiredInspection == "Y")
			{
				//aa.print("requiredInspection == Y");

				inspectionModel.getActivity().setIdNumber(0); // clear the inspection ID, otherwise the inspection will not be created but updated
				inspectionModel.getActivity().setResStatus("Y"); // update the status to 'Y' because the status of canceled pending inspection is 'N'
                                inspectionModel.getActivity().setCreatedByACA(null); // update the flag to indicate current inspection is created by V360.
				//inspectionModel.setResultComment("created by Cancel Inspection EMSE script automatically.")
				aa.inspection.pendingInspection(inspectionModel);
				
				aa.print("create one pending inspection.");
			}
		}
	}
}

aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", "Successfully.");
//aa.env.setValue("ScriptReturnMessage", "cancel after failed.");


aa.print("InspectionCancelAfter emse script end.");
