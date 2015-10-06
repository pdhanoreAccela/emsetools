aa.print("For CAP Set Testing!");

aa.print("ServiceProviderCode=" + aa.env.getValue("ServiceProviderCode"));
aa.print("CurrentUserID=" + aa.env.getValue("CurrentUserID"));
aa.print("SetID=" + aa.env.getValue("SetID"));
aa.print("CapSetScriptID=" + aa.env.getValue("CapSetScriptID"));
var SetMemberArray= aa.env.getValue("SetMemberArray");
for(var i=0; i < SetMemberArray.length; i++)
{
  aa.print("SetMemberArray[" + i + "] is:" + SetMemberArray[i])
}
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "Update Set successful");