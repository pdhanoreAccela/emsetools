//To define the query criteria of file date for one month. it will be a dynamic variable in the future.
var fileDateFromStr ="11/01/2013"; 
var fileDateFrom = aa.date.transToJavaUtilDate(new Date(fileDateFromStr));

var fileDateToStr ="11/30/2013"; 
var fileDateTo = aa.date.transToJavaUtilDate(new Date(fileDateToStr));

//To define the query criteria only for created by ACA user.
var isCreatedByACA = 'Y';

var moduleName = 'HolidayHomes';
var auditStatus = 'A';
var capClass = 'COMPLETE';

//To define the Record Type with four levels here.
var group = 'Building';
var type = 'ACA';
var subType = 'Alan.Hu';
var category = 'SubCap1';

var emailFrom = 'galen.zhang@achievo.com';
var emailCc = 'galen.zhang@achievo.com';
var emailSubject = 'test';
var emailContect = '';

var capModel = constructCapModel();

var result = aa.cap.getCapIDListByCapModel(capModel);

if(result.getSuccess())
{
	var capIDScriptModelArray = result.getOutput();
	for (var i = 0 ; i < capIDScriptModelArray.length ; i++)
	{
		var capIDScriptModel = capIDScriptModelArray[i];
		var capIDModel = capIDScriptModel.getCapID();
		
		var capModelResult = aa.cap.getCapByPK(capIDModel, true);
		if(capModelResult.getSuccess())
		{
			var capModel = capModelResult.getOutput();
			var acaUserID = capModel.getCreatedBy();
			
			if(acaUserID != null && acaUserID.indexOf('PUBLICUSER') != -1)
			{	
				var publicUserNumber = acaUserID.substring(10)
				
				var publicUserMdoel = aa.publicUser.getPublicUser(Number(publicUserNumber)).getOutput();
				
				if(publicUserMdoel != null)
				{
					var emailTo = publicUserMdoel.getEmail();
					
					emailContect = capModel.getCapID().toString();
					sendEmail(emailFrom ,emailTo, emailCc, subject, emailContect);
				}	
			}
		}
		else
		{
			logMessage("ERROR: Failed to get capModel: " + result.getErrorMessage());
		}
	}
}
else
{
	logMessage("ERROR: Failed to get CapIDScriptModel: " + result.getErrorMessage());
}

function sendEmail(from, to, cc, subject, content)
{
	var scriptResult = aa.sendMail(from, to, cc, subject, content);

	if(scriptResult.getSuccess())
	{
		aa.print("success");
	}
	else
	{
		logMessage("ERROR: Failed to get capModel: " + scriptResult.getErrorMessage());
		return null;
	}
}

function constructCapModel()
{
	var capModel = aa.cap.getCapModel().getOutput();
	var capTypeModel = aa.cap.getCapTypeModel().getOutput();

	capTypeModel.setGroup(group);
	capTypeModel.setType(type);
	capTypeModel.setSubType(subType);
	capTypeModel.setCategory(category);

	capModel.setCapType(capTypeModel);
	//capModel.setFileDate(fileDateFrom);
	//capModel.setEndFileDate(fileDateTo);
	capModel.setCreatedByACA(isCreatedByACA);
	//capModel.setModuleName(moduleName);
	capModel.setAuditStatus(auditStatus);
	capModel.setCapClass(capClass);
	
	return capModel;
}