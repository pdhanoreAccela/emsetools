aa.print("=======================");

var capTypeModelResult = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.CapTypeModel");
var capTypeModel = capTypeModelResult .getOutput();
aa.print(capTypeModel);


//var capTypeModel = capTypeScriptModel.getCapType();
//Building/ACA/10ACC-06148/HazMat Reporting
capTypeModel.setGroup("Building");
capTypeModel.setType("ACA");
capTypeModel.setSubType("10ACC-06148");
capTypeModel.setCategory("HazMat Reporting");

var capIDModel = aa.cap.createSimplePartialRecord(capTypeModel, null, "INCOMPLETE EST").getOutput();

aa.print(capIDModel.toKey());
