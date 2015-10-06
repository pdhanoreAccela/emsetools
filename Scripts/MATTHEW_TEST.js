//Set parameters to Update relationship.
var contactEntityID = "777";
var currentRole = "CEO";
var targetRole = "CTO";
var startDate = new Date("24/03/2013");
var endDate = new Date("31/01/2014");
var status = "A";

var result = aa.people.updateRefContactRelationship(contactEntityID, currentRole, targetRole, startDate, endDate, status);
if (result.getSuccess())
{
	aa.print("Update reletionship successfully");
	aa.print(result.getOutput());
}
else
{
	aa.print("Update reletionship failed");
	aa.print(result.getErrorMessage());	
}