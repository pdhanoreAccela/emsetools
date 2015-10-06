aa.print("LicProRemoveAfter debug");

aa.print("CAPId=" + aa.env.getValue("ApplicantId"));
aa.print("CurrentUserID =" + aa.env.getValue("CurrentUserID")); 
aa.print("LicenseNbr =" + aa.env.getValue("LicenseNbr"));
aa.print("LicenseNbrList =" + aa.env.getValue("LicenseNbrList"));

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","LicProRemoveAfter successful");


var licProfRemoveModelList = aa.env.getValue("LicProfRemoveModelList");

if(licProfRemoveModelList !="" && licProfRemoveModelList  !=null)
{
	aa.print("Remove License Professional List");
	for(var i=0;i<licProfRemoveModelList.size();i++)
	{
		aa.print("Remove License Professional "  + (i+1) );
		var licProfRemoveModel = licProfRemoveModelList.get(i);

		aa.print("Address1 = " + licProfRemoveModel.getAddress1());
		aa.print("Address2 = " + licProfRemoveModel.getAddress2());
		aa.print("Address3 = " + licProfRemoveModel.getAddress3());
		
		aa.print("AuditID = " + licProfRemoveModel.getAuditID());
		aa.print("AuditDate = " + licProfRemoveModel.getAuditDate() );
		aa.print("AuditStatus = " + licProfRemoveModel.getAuditStatus());
		aa.print("BirthDate = " + licProfRemoveModel.getBirthDate());
		aa.print("BusinessLicense =" + licProfRemoveModel.getBusinessLicense());
		aa.print("BusName2 =" + licProfRemoveModel.getBusName2());
		aa.print("City = " + licProfRemoveModel.getCity());
		aa.print("ContactType = " + licProfRemoveModel.getContactType());
		aa.print("FirstName = " + licProfRemoveModel.getContactFirstName());
		aa.print("MiddleName = "+ licProfRemoveModel.getContactMiddleName());
		aa.print("LastName = " + licProfRemoveModel.getContactLastName());
		aa.print("Phone1 = " + licProfRemoveModel.getPhone1());
		aa.print("Phone2 = " + licProfRemoveModel.getPhone2());
		aa.print("Phone3 = " + licProfRemoveModel.getPhone3());

		aa.print("LicenseExpirDate = " + licProfRemoveModel.getLicenseExpirDate());
		aa.print("Zip = " + licProfRemoveModel.getZip());
		aa.print("TypeFlag = " + licProfRemoveModel.getTypeFlag());
		aa.print("Title = " + licProfRemoveModel.getTitle());
		aa.print("SuffixName = " + licProfRemoveModel.getSuffixName());
		aa.print("State = " + licProfRemoveModel.getState());
		aa.print("ResState = " + licProfRemoveModel.getResState());

		aa.print("Remove License Professional "  + (i+1) );
		aa.print("");
	}
	aa.print("Remove License Professional List");
}