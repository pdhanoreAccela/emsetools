aa.env.setValue("status","Active");
var xRefContactEntityModel = aa.people.getXRefContactEntityModel().getOutput();

xRefContactEntityModel.setContactEntityID(1513);
xRefContactEntityModel.setContactSeqNumber(777);
xRefContactEntityModel.setEntityID1(227);
xRefContactEntityModel.setEntityID3("Manager");
xRefContactEntityModel.setEntityID4("Boss");
xRefContactEntityModel.setStartDate(new Date("2012/02/03"));
xRefContactEntityModel.setEndDate(new Date("2012/12/03"));

var result = aa.people.updateRefContactRelationship(xRefContactEntityModel, aa.env.getValue("status"));
if (result.getSuccess())
{
	aa.print("updateRefContactRelationship Successfully");
}
else
{
	aa.print("updateRefContactRelationship Failed!");
	aa.print(result.getErrorMessage());	
}
