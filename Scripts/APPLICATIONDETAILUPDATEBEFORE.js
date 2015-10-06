aa.env.setValue("ScriptReturnCode","-1");
aa.env.setValue("ScriptReturnMessage", "ApplicationDetailUpdateBefore Message");

var appStatus = aa.env.getValue("appStatus");
if (appStatus != null)
{
	aaa.print("The status of current Application is: " + appStatus);
	aa.print("The status of current Application is: " + appStatus);
	aa.print("\n");
}
aa.print("End of Event");
