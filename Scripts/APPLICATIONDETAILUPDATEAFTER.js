aa.env.setValue("ScriptReturnCode","-1");
aa.env.setValue("ScriptReturnMessage", "ApplicationDetailUpdateAfter Message");

var appStatus = aa.env.getValue("appStatus");
if (appStatus != null)
{
	aa.debug("The status of current Application is: ", appStatus);
}
