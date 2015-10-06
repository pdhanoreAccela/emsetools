aa.print("ApplicationSubmitAfter Start");

var capIDModel = aa.cap.getCapIDModel(aa.env.getValue("PermitId1"), aa.env.getValue("PermitId2"), aa.env.getValue("PermitId3")).getOutput();
var addressModel = aa.address.getAddressByPK(capIDModel, 1069566).getOutput().getAddressModel();
addressModel.setHouseNumberStart(addressModel.getHouseNumberStart().intValue() + 1);
aa.address.editAddress(addressModel);

aa.print("ApplicationSubmitAfter End");
aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", "ApplicationSubmitAfter Test");