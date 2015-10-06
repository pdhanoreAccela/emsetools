var newCap = aa.cap.getCapID("14CAP", "00000", "009AH").getOutput();

// set the filed name and value into map
var newAInfo = aa.util.newArrayList();

var newAField = new Object();
newAField.FieldName = "Name";
newAField.Value = "11";
newAInfo.add(newAField);

var newAField2 = new Object();
newAField2.FieldName = "Password";
newAField2.Value = "22";
newAInfo.add(newAField2);

// to copy the field value into cap's asi
for(var item in newAInfo)
{
       var scriptName = "COPYLICASI";
       var envParameters = aa.util.newHashMap();
       envParameters.put("cap", newCap);
       envParameters.put("item", "Name");
       envParameters.put("value", "121212121212121");
       aa.runAsyncScript(scriptName, envParameters);
       aa.log("Setting " + newCap.getCustomID() + " ASI filed " + newAInfo[item].FieldName + " to " + newAInfo[item].Value);
}




aa.env.setValue("ScriptReturnCode","0");
aa.print("Edit Daily Contact before event");
aa.env.setValue("ScriptReturnMessage", "Edit Daily Contact before event");