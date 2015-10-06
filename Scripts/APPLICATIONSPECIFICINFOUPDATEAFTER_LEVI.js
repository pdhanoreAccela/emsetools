var ID1 = aa.env.getValue("PermitId1");
var ID2 = aa.env.getValue("PermitId2");
var ID3 = aa.env.getValue("PermitId3");
var userID = aa.env.getValue("CurrentUserID");

var capScriptModel = aa.cap.newCapScriptModel().getOutput();
var capModel = capScriptModel.getCapModel();
var capIDModel = capScriptModel.getCapID();
capIDModel.setId(ID1+"-"+ID2+"-"+ID3);
capIDModel.setServiceProviderCode(aa.getServiceProviderCode());
var currentCapModel = aa.cap.getCapByPK(capIDModel, true).getOutput();
var capTypeModel = currentCapModel.getCapType();
capScriptModel.setCapType(capTypeModel);

var capGroup = capTypeModel.getGroup();
var capType = capTypeModel.getType();
var capSubType = capTypeModel.getSubType();
var capCategory = capTypeModel.getCategory();

/*****************************************************************************************************/
// Create cap by capType
aa.print("Create CAP by method:"+"createApp");
var newCapID = aa.cap.createApp(capGroup, capType, capSubType , capCategory,"LEVITEST").getOutput();
/*****************************************************************************************************/


/*****************************************************************************************************/
//aa.print("Create CAP by method:"+"createCap");
//var newCapID = aa.cap.createCap(null,"ADMIN", capModel,null,null).getOutput();
//newCapID = capModel.getCapID();
/*****************************************************************************************************/


/*****************************************************************************************************/
// Create cap by model
aa.print("Create CAP by method:"+"createAppWithModel");
var newCapID = aa.cap.createAppWithModel(capScriptModel).getOutput();
/*****************************************************************************************************/


/*****************************************************************************************************/
// Change partial cap to completed cap.

//aa.print("Create CAP by method:"+"createRegularCapModel4ACA");
//var newCapID = aa.cap.createSimplePartialRecord(capTypeModel,"levicap111",null).getOutput();
//aa.print(newCapID);
//var newPartitialCap = aa.cap.getCapByPK(newCapID, true).getOutput();
//newCapID = aa.cap.createRegularCapModel4ACA(newPartitialCap,"",false,false).getOutput().getCapID();
/*****************************************************************************************************/


/*****************************************************************************************************/
// Create simple partial cap
//aa.print("Create CAP by method:"+"createSimplePartialRecord");
//var newCapID = aa.cap.createSimplePartialRecord(capTypeModel,"levicap111",null).getOutput();
/*****************************************************************************************************/


/*****************************************************************************************************/
// Create partial cap///////////////////////////////////////////////////
//aa.print("Create CAP by method:"+"createPartialRecord");
//var newCapID = aa.cap.createPartialRecord(capModel).getOutput();
/*****************************************************************************************************/


/*****************************************************************************************************/
//aa.print("Create CAP by method:"+"createAppRegardlessAppTypeStatus");
//var newCapID = aa.cap.createAppRegardlessAppTypeStatus(capGroup, capType, capSubType, capCategory, "levitest").getOutput();
/*****************************************************************************************************/

aa.print(newCapID);
aa.env.setValue("scriptMessage",1);
aa.env.setValue("ScriptReturnMessage", "New Cap ID:" + newCapID.toString());