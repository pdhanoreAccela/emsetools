aa.print("--------------public user Field---------------");
aa.print("-------------------START--------");
var publicUserSeqNum= aa.env.getValue("publicUserSeqNum");
var serviceProviderCode = aa.env.getValue("serviceProviderCode");
var selectedLicenseTypes = aa.env.getValue("licenseTypes");
var callerID = aa.env.getValue("callerID");
var userModel = aa.env.getValue("userModel");
var allLicenseTypes = aa.evn.getValue("existLicenseTypes");
var publicUserModel = aa.publicUser.getPublicUser(publicUserSeqNum).getOutput();

userModel.setServProvCode(serviceProviderCode);
userModel.setUserName("Test");
userModel.setPassWord(publicUserModel.getPassword());
userModel.setStatus("A");
userModel.setRecFulNam(callerID);
userModel.setGAUserID(userName);
userModel.setInspector("Y");

var dbUserModel = aa.publicUser.getDummyUser(userModel).getOutput();

var moduleName = "Building";
var groupSeqNbr = "3565";

if (dbUserModel == null)
{
	aa.publicUser.createDummyUser(userModel, moduleName, groupSeqNbr);
	aa.publicUser.associateDummyUser(userModel, publicUserSeqNum);
}

for (var i = 0;i <selectedLicenseTypes .size();i++)
{
	if (allLicenseTypes.contains(selectedLicenseTypes.get(i)))
	{
		allLicenseTypes.add(selectedLicenseTypes.get(i));
	}
}
deleteDisciplineAssociation(userModel.getUserName(), serviceProviderCode);
associateDiscipline(serviceProviderCode, userModel.getUserName(), allLicenseTypes);