var CurrentUserID = aa.env.getValue("CurrentUserID");
var LicenseModel = aa.env.getValue("LicenseModel");
var licenseModels = new Array();
licenseModels[0] = LicenseModel;
var email = LicenseModel.getEMailAddress();

//System doesn't allow to creat public user with existing user id or existing email id.
if(!isExistingEmail(email) && !isExistingUserID(email))
{
	//1. Construct Public User Model.
	var publicUserModel = ConstructPublicUserModelByLicenseModel(LicenseModel);
	//2. Create New Public User account.
	var result = aa.publicUser.createPublicUser(publicUserModel, licenseModels);	
	
	if(result.getSuccess() && result.getOutput() != null)
	{
		aa.log("Create public user successfully!");
		
		//3. Send notice email to remind public user to activate the new account.
		aa.publicUser.sendHyperlinkActivateEmail(publicUserModel);
	}
	else
	{
		aa.log("Create public user failed! please contact administrator.");
	}
}
else
{
	//2.1 Get public user by email.
	var result = aa.publicUser.getPublicUserByEmail(email);		
	if(result.getSuccess() && result.getOutput() != null)
	{
		var publicUserModel = result.getOutput();
		//Accociate license to existing account
		issueLicense(publicUserModel.getUserSeqNum(), LicenseModel);
	}
	else
	{
		//Get public user by user id.
		result = aa.publicUser.getPublicUserByUserId(email);
		
		if(result.getSuccess() && result.getOutput() != null)
		{
			var publicUserModel = result.getOutput();
			//Accociate license to existing account
			issueLicense(publicUserModel.getUserSeqNum(), LicenseModel);
		}
	}
}

//Associate license to existing publicuser account.
function issueLicense(userSeqNbr, LicenseModel)
{
	//@return ScriptResult. -1:issue fail / 0:license is not exist / 1:Already has the same type license / 2:issue ok
	var issueResult = aa.contractorLicense.issueContrLicWithExpired(userSeqNbr,LicenseModel,true,true);
	
	if(issueResult.getSuccess())
	{		
		if(issueResult.getOutput() == -1)
		{
			aa.log("issue license failed!, please contact administrator.");
		}
		else if(issueResult.getOutput() == 0)
		{
			aa.log("license is not exist!, please contact administrator.");
		}
		else if(issueResult.getOutput() == 1)
		{
			aa.log("Already has the same type license !, please contact administrator.");
		}
		else if(issueResult.getOutput() == 2)
		{
			aa.log("issue license successfully!");
			
			//Send notice email to agency user and citizen user when the registered user add new license to his account. 
			aa.contractorLicense.sendIssueNoticeEmail(userSeqNbr, LicenseModel.getLicenseType(), LicenseModel.getStateLicense());
			
			//Send ASSOCIATING_LICENSE_TO_MULTIPLE_ACCOUNTS Email.
			aa.contractorLicense.sendNoticeEmailToRelatedAccounts(userSeqNbr, LicenseModel.getLicenseType(), LicenseModel.getStateLicense(), LicenseModel.getLicState());
		}
	}
	else
	{
		aa.log("Error!, please contact administrator.");
	}
}

//Construct PublicUserModel by LicenseModel.
function ConstructPublicUserModelByLicenseModel(licenseModel)
{
	var publicUserModel = aa.publicUser.getPublicUserModel();
	publicUserModel.setServProvCode(licenseModel.getServiceProviderCode());
	publicUserModel.setUserID(licenseModel.getEMailAddress());// email of licensed professional
	publicUserModel.setEmail(licenseModel.getEMailAddress());// email of licensed professional
	publicUserModel.setUUID(aa.publicUser.getNewPublicUserUUID());
	publicUserModel.setUserSeqNum(null);// new sequence.
	publicUserModel.setPassword("88888888");// Initial pass word. it needs be confirmed.
	publicUserModel.setRoleType(null);// set licensed professional user type.
	publicUserModel.setFirstName(licenseModel.getContactFirstName());
	publicUserModel.setMiddleName(licenseModel.getContactMiddleName());
	publicUserModel.setLastName(licenseModel.getContactLastName());
	publicUserModel.setGender(licenseModel.getGender());
	publicUserModel.setBirthDate(licenseModel.getBirthDate());
	publicUserModel.setSalutation(licenseModel.getSalutation());

	publicUserModel.setAddress(licenseModel.getAddress1());
	publicUserModel.setAddress2(licenseModel.getAddress2());
	publicUserModel.setBusinessName(licenseModel.getBusinessName());

	publicUserModel.setCity(licenseModel.getCity());
	publicUserModel.setState(licenseModel.getState());
	publicUserModel.setCountry(licenseModel.getCountry());
	publicUserModel.setHomePhone(licenseModel.getPhone1());
	publicUserModel.setWorkPhone(licenseModel.getPhone2());
	publicUserModel.setHomePhoneCountryCode(licenseModel.getPhone1CountryCode());
	publicUserModel.setWorkPhoneCountryCode(licenseModel.getPhone2CountryCode());
	publicUserModel.setFax(licenseModel.getFax());
	publicUserModel.setFaxCountryCode(licenseModel.getFaxCountryCode());
	publicUserModel.setZip(licenseModel.getZip());
	publicUserModel.setPobox(licenseModel.getPostOfficeBox());

	publicUserModel.setAuditID(CurrentUserID);
	publicUserModel.setAuditStatus("A");
	
	publicUserModel.setCellPhone(null);//
	publicUserModel.setCellPhoneCountryCode(null);//
	publicUserModel.setReceiveSMS(null);//
	publicUserModel.setPager(null);//
	publicUserModel.setPrefPhone(null);
	publicUserModel.setPrefContactChannel(null);
	publicUserModel.setPasswordHint(null);
	publicUserModel.setPasswordRequestQuestion(null);
	publicUserModel.setPasswordRequestAnswer(null);
	publicUserModel.setCookie(null);
	publicUserModel.setViadorUrl(null);
	publicUserModel.setStatusOfV360User(null);
	publicUserModel.setSpecificInfo(null);
	publicUserModel.setEndBirthDate(null);// just for search.
	publicUserModel.setUserTitle(null); // doesn't exists in license model.
	
	return publicUserModel;
}

//**Check whether current email exists in USER_ID column as dublicate user ID.**
function isExistingUserID(email)
{
	var result1 = aa.publicUser.isExistingUser(email);
	aa.print("Check User ID:" + email + " Result: " + result1.getSuccess());
	
	if(result1.getSuccess() && result1.getOutput() != null)
	{
		aa.print("The User ID exists in database. User ID:" + email + "User Sequence:" + result1.getOutput());
		return true;		
	}
	else
	{
		aa.print("The User ID not exists in database. User ID:" + email);
		return false;
	}
}

//**Check whether current email exists in EMAIL_ID column as dublicate Email ID.**
function isExistingEmail(email)
{
	var result2 = aa.publicUser.isExistingEmailID(email);
	aa.print("Check User Email:" + email + " Result: " + result2.getSuccess());
	
	if(result2.getSuccess())
	{
		if(result2.getOutput() != null)
		{
			aa.print("result2.getOutput(): "+ result2.getOutput());
			aa.print("The Email exists in database. Email:" + email + " User Sequence:" + result2.getOutput());
			return true;
		}
		else
		{
			aa.print("The Email not exists in database. Email:" + email);
			return false;
		}
	}	
}