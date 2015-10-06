aa.print("=======================");
var recordID1 = aa.env.getValue("PermitId1");
var recordID2 = aa.env.getValue("PermitId2");
var recordID3 = aa.env.getValue("PermitId3");

if (recordID1 != null && recordID2 != null && recordID3 != null)
{

var parentIDModel = aa.cap.createCapIDScriptModel(recordID1, recordID2, recordID3)
		.getCapID();
var addressModel = aa.env.getValue("AddressModel");
var capParcelModel = aa.env.getValue("CapParcelModel");
var ownerModel = aa.env.getValue("OwnerModel");

var typeLevel1 = aa.env.getValue("ApplicationTypeLevel1");
var typeLevel2 = aa.env.getValue("ApplicationTypeLevel2");
var typeLevel3 = aa.env.getValue("ApplicationTypeLevel3");
var typeLevel4 = aa.env.getValue("ApplicationTypeLevel4");

if (typeLevel1.equals("Building") && typeLevel2.equals("ACA") && typeLevel3.equals("10ACC-06148") && typeLevel4.equals("APO_ASI_ASIT"))
{
	for ( var i = 0; i < 1; i++) {
		var capTypeModelResult = aa.proxyInvoker
				.newInstance("com.accela.aa.aamain.cap.CapTypeModel");
		var capTypeModel = capTypeModelResult.getOutput();
		capTypeModel.setGroup("Building");
		capTypeModel.setType("ACA");
		capTypeModel.setSubType("Alan.Hu");
		capTypeModel.setCategory("SubCap1");
	
		var capIDModel = aa.cap.createSimplePartialRecord(capTypeModel, null,
				"INCOMPLETE TMP").getOutput();
		aa.print(capIDModel.toKey());
	
		aa.cap.createAppHierarchy(parentIDModel, capIDModel);
	
		if (addressModel != null) {
			var aResult = aa.address.createAddressWithAPOAttribute(capIDModel,
					addressModel).getOutput();
			aa.print("AddressID = " + aResult);
		}
		
		if (capParcelModel != null) {
			capParcelModel.setCapIDModel(capIDModel);
			aa.parcel.createCapParcelWithAPOAttribute(capParcelModel).getOutput();
			aa.print("Parcel finished.");
		}
		
		if (ownerModel != null) {
			var recordOwners = aa.owner.getOwnerByCapId(parentIDModel).getOutput();
			var capownerScriptModel = null;
			if (recordOwners != null && recordOwners.length > 0)
			{
				capownerScriptModel = recordOwners[0];
				capownerScriptModel.setCapID(capIDModel);
			}
			/*
			// CapOwnerScriptModel RefOwnerModel = ownerModel;
			var capownerScriptModel = aa.owner.getCapOwnerScriptModel().getOutput();
	        aa.print("Address 1 = " + ownerModel.getAddress1());
	        aa.print("Address 2 = " + ownerModel.getAddress2());
	        aa.print("Address 3 = " + ownerModel.getAddress3());
			capownerScriptModel.setAddress1(ownerModel.getAddress1());
			capownerScriptModel.setAddress2(ownerModel.getAddress2());
			capownerScriptModel.setAddress3(ownerModel.getAddress3());
			// B3APOAttributeScriptModel[] <-- B3APOAttributeModel Collection.
			// capownerScriptModel.setAttributes(ownerModel.getAttributes());
			capownerScriptModel.setCapID(ownerModel.getCapID());
			capownerScriptModel.setCapOwnerNumber(ownerModel.getOwnerNumber());
			capownerScriptModel.setCity(ownerModel.getCity());
			capownerScriptModel.setCountry(ownerModel.getCountry());
			capownerScriptModel.setFax(ownerModel.getFax());
			if (ownerModel.getL1OwnerNumber() != null) {
					capownerScriptModel.setL1OwnerNumber(ownerModel
							.getL1OwnerNumber().doubleValue());
				}
			capownerScriptModel.setMailAddress1(ownerModel.getMailAddress1());
			capownerScriptModel.setMailAddress2(ownerModel.getMailAddress2());
			capownerScriptModel.setMailAddress3(ownerModel.getMailAddress3());
			capownerScriptModel.setMailCity(ownerModel.getMailCity());
			capownerScriptModel.setMailCountry(ownerModel.getMailCountry());
			capownerScriptModel.setMailState(ownerModel.getMailState());
			capownerScriptModel.setMailZip(ownerModel.getMailZip());
			capownerScriptModel.setOwnerFirstName(ownerModel.getOwnerFirstName());
			capownerScriptModel.setOwnerFullName(ownerModel.getOwnerFullName());
			capownerScriptModel.setOwnerLastName(ownerModel.getOwnerLastName1());
			capownerScriptModel.setOwnerMiddleName(ownerModel.getOwnerMiddleName());
			capownerScriptModel.setOwnerStatus(ownerModel.getOwnerStatus());
			capownerScriptModel.setOwnerTitle(ownerModel.getOwnerTitle());
			capownerScriptModel.setOwnerType(ownerModel.getOwnerType());
			capownerScriptModel.setPhone(ownerModel.getPhone());
			capownerScriptModel.setPrimaryOwner(ownerModel.getPrimaryOwner());
			capownerScriptModel.setState(ownerModel.getState());
			capownerScriptModel.setTaxID(ownerModel.getTaxID());
			capownerScriptModel.setUID(ownerModel.getUID());
			capownerScriptModel.setZip(ownerModel.getZip());
	        
			*/
			aa.owner.createCapOwnerWithAPOAttribute(capownerScriptModel);
			aa.print("Owner finished.");
		}
		aa.print("Created Record [" + (i + 1) + "] finished. ");
	}
}
else
{
	aa.print("No Record was created. ");
}
}