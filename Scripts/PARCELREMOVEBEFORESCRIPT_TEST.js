aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "ParcelRemoveBeforeScript_Test successful");

aa.print("aaaaaaaaaaaaaaaaaaaaa");
var capid = aa.env.getValue("CapIdModel");
aa.print(capid.getID1());
var parcelList = aa.env.getValue("DeletedParcelList");
aa.print(parcelList.size());