var LicenseModel = aa.env.getValue("LicenseModel");   		//LicenseModel
var UserSeqNum = aa.env.getValue("UserSeqNum");   		//UserSeqNum
var ResultCode = aa.env.getValue("ResultCode");            //Issue return code

var licenseSeqNbr = LicenseModel.getLicSeqNbr();
var licenseNumber = LicenseModel.getStateLicense();
var licenseType = LicenseModel.getLicenseType();
var licenseStatus = "P";  //A -- Approve status; P -- Pending status; R -- Reject status;

aa.print("====================begin======================");
aa.print("##Unit Test EMSE Event: AddLicenseToPublicUserAfter4ACA");
aa.print("##LicenseModel:" + LicenseModel);
aa.print("##UserSeqNum:" + UserSeqNum);
aa.print("##ResultCode:" + ResultCode);
aa.print("##licenseSeqNbr:" + licenseSeqNbr);
aa.print("##licenseNumber:" + licenseNumber);
aa.print("##licenseType:" + licenseType);
aa.print("##licenseStatus:" + licenseStatus);
aa.print("====================end=======================");

if("ARCHITECT".equalsIgnoreCase(licenseType) || "CONTRACTOR".equalsIgnoreCase(licenseType))
{
	logMessage("This license will be set approved status, when LicenseType is ARCHITECT or CONTRACTOR.");
    licenseStatus = "A"; // set auto approval status.
}

aa.debug("licenseSeqNbr:", licenseSeqNbr);
aa.debug("UserSeqNum:", UserSeqNum);
var result = aa.contractorLicense.getContrLicenseByLicSeqNBR(licenseSeqNbr, UserSeqNum);

if (result.getSuccess())
{
	if(licenseStatus == "A")
	{
		contractorLicenseModel = result.getOutput();
		//Set  status. A -- Approve status
		contractorLicenseModel.setStatus(licenseStatus);		
		var scriptResult = aa.contractorLicense.updateContractorLicense(contractorLicenseModel);
	
		if(scriptResult.getSuccess())
		{
			// -1---update status fail     0---license is not exist     1---update status ok
			var resultCode = scriptResult.getOutput();
			
			if(resultCode == 1)
			{
				logMessage("Auto approve license successful" + " licenseNumber:" + licenseNumber + " licenseType:" + licenseType);
				
				var returnResult = aa.contractorLicense.sendApprovNoticeEmailToUser(licenseNumber,licenseType, UserSeqNum);
				if(returnResult.getSuccess())
				{
					aa.env.setValue("ScriptReturnMessage", "Auto-Approve and send approval notice email to public user successfully !");
					aa.env.setValue("autoApproveCode","1");//issue license and Auto-Approve successfully.
					logMessage("Send approval notice email to public user successfully !");	
				}
				else
				{
					logError("Send approval notice email to public user fail !" + returnResult.getErrorMessage());
				}
			}
			else if(resultCode == 0)
			{
				aa.env.setValue("ScriptReturnMessage", "This license not existing !");
				aa.env.setValue("autoApproveCode","0");// License is not exist.
				logError("This license not existing!");
			}
			else if(resultCode == -1)
			{
				aa.env.setValue("ScriptReturnMessage", "Auto-Approve license fail !");
				aa.env.setValue("autoApproveCode","-1");// Issue license fail.
				logError("Auto-Approve license fail !");
			}
		}
		else
		{
			logError(" Approve license fail !" + scriptResult.getErrorMessage());
		}
	}
	else
	{
		aa.env.setValue("ScriptReturnMessage", "This license type needn't to Auto-Approve !");
		aa.env.setValue("autoApproveCode","2");// Needn't to auto-approve.
		logError("This license type needn't to Auto-Approve !");
	}
}
else
{
	logError(result.getErrorMessage());
}

function logMessage(msg)
{
	aa.print("MESSAGE: " + msg);
}

function logError(errorMsg)
{
	aa.print("ERROR: " + errorMsg);
}
