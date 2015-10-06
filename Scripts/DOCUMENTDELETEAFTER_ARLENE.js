var deleteCount = aa.env.getValue("DeleteCount");
var serviceProviderCode = aa.env.getValue("ServiceProviderCode");
var callerId = aa.getAuditID();
var currentDate = aa.date.getCurrentDate();


if(deleteCount > 0)
{
	aa.print(deleteCount + " documents been deleted successfully...");
  	aa.env.setValue("ScriptReturnMessage", "Prepare to delete document..")
  	aa.env.setValue("ScriptReturnCode","0");
}
else
{
  	aa.env.setValue("ScriptReturnMessage", "No documents have been deleted..")
  	aa.env.setValue("ScriptReturnCode","0");
}