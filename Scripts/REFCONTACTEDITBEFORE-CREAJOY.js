var newCap = aa.cap.getCapID("14CAP", "00000", "008W5").getOutput();
var newAInfo = aa.util.newArrayList();

var newAField = new Object();
newAField.FieldName = aa;
newAField.Value = "456";
newAInfo.add(newAField);

var newAField2 = new Object();
newAField2.FieldName = aa;
newAField2.Value = "textT";
newAInfo.add(newAField2);

for(var item in newAInfo)
{
	var scriptName = "COPYLICASI";
	var envParameters = aa.util.newHashMap();
	envParameters.put("cap", newCap);
	envParameters.put("item", aa);
	envParameters.put("value", newAInfo[item].Value);
	aa.runAsyncScript(scriptName, envParameters);
	//aa.log("Setting " + newCap.getCustomID() + " ASI filed " + "app_spec_info_LINDA_text" + " to " + "textT");
}