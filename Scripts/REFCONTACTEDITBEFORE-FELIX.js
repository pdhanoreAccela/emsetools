aa.print("RefContactEditBefore debug");
aa.print("New Ref. Contact Start:");

var contactModel = aa.env.getValue("ContactModel");
var compactAddress = contactModel.getCompactAddress();
var attributes = contactModel.getAttributes();

aa.print("LastName = " + contactModel.getLastName());
aa.print("FirstName = " + contactModel.getFirstName());
aa.print("ContactType = " + contactModel.getContactType());
aa.print("Phone1 = " + contactModel.getPhone1());
aa.print("Email = " + contactModel.getEmail());
aa.print("Phone2 = " + contactModel.getPhone2());
aa.print("AddressLine1 = " + compactAddress.getAddressLine1());
aa.print("AddressLine2 = " + compactAddress.getAddressLine2());
aa.print("AddressLine3 = " + compactAddress.getAddressLine3());
aa.print("City = " + compactAddress.getCity());
aa.print("State = " + compactAddress.getState());
aa.print("Zip = " + compactAddress.getZip());
aa.print("Comment = " + contactModel.getComment());
aa.print("BusinessName = " + contactModel.getBusinessName());
aa.print("MiddleName = " + contactModel.getMiddleName());
aa.print("Fax = " + contactModel.getFax());
aa.print("Relation = " + contactModel.getRelation());
aa.print("FullName = " + contactModel.getFullName());
aa.print("CountryCode = " + compactAddress.getCountryCode());
aa.print("ContactSeqNumber = " + contactModel.getContactSeqNumber());
aa.print("AuditStatus = " + contactModel.getAuditStatus());
aa.print("PreferredChannel = " + contactModel.getPreferredChannel());
aa.print("Phone3 = " + contactModel.getPhone3());
aa.print("Salutation = " + contactModel.getSalutation());
aa.print("Gender = " + contactModel.getGender());
aa.print("PostOfficeBox = " + contactModel.getPostOfficeBox());
aa.print("BirthDate = " + contactModel.getBirthDate());
aa.print("SocialSecurityNumber = " + contactModel.getMaskedSsn());
aa.print("Fein = " + contactModel.getFein());
aa.print("TradeName = " + contactModel.getTradeName());
aa.print("Title = " + contactModel.getTitle());
aa.print("Namesuffix = " + contactModel.getNamesuffix());

aa.print("-------- Attribute Start:");

if (attributes != "" && attributes != null)
{
	var attribute;

	for (var i = 0; i < attributes.size(); i++)
	{
		attribute = attributes.get(i);
		aa.print(attribute.getAttributeName() + " = " + attribute.getAttributeValue());
	}
}

aa.print("-------- Attribute End:");

aa.print("New Ref. Contact End:");
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "New Ref. Contact successful");

/* return -1 to prevent the new contact process.
   aa.env.setValue("ScriptReturnCode","-1");
   aa.env.setValue("ScriptReturnMessage", "New Ref. Contact fail");
*/