aa.print("=======================");

//("10EST", "00000", "00559"
//("10EST", "00000", "00768"
//"10EST", "00000", "01008"
//"10EST", "00000", "01112"
// 01111
// 01338
var parentIDModel = aa.cap.createCapIDScriptModel("10EST", "00000", "04102").getCapID();
//var addressModel = aa.env.getValue("AddressModel");
//var capParcelModel = aa.env.getValue("CapParcelModel");
//var ownerModel = aa.env.getValue("OwnerModel");

for (var i=0; i<2; i++)
{
var capTypeModelResult = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.CapTypeModel");
var capTypeModel = capTypeModelResult .getOutput();
capTypeModel.setGroup("Building");
capTypeModel.setType("ACA");
capTypeModel.setSubType("Alan.Hu");
capTypeModel.setCategory("SubCap1");

var capIDModel = aa.cap.createSimplePartialRecord(capTypeModel, null, "INCOMPLETE TMP").getOutput();
aa.print(capIDModel.toKey());

aa.cap.createAppHierarchy(parentIDModel, capIDModel);
aa.print("Created Record [" + (i + 1)+ "] finished. ");
}