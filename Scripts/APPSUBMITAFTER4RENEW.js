/*---- User intial parameters ----*/
var requiredType = aa.util.newArrayList();

requiredType.add("testing");
requiredType.add("Photos");

var cond_type = "Frederick";
var cond_name = "Frederick_Condition";

/*---- User intial parameters end----*/

/*---- Inital environment parameters ----*/
var s_id1 = aa.env.getValue("PermitId1");
var s_id2 = aa.env.getValue("PermitId2");
var s_id3 = aa.env.getValue("PermitId3");
var userID = aa.env.getValue("CurrentUserID");

var capIDModel = aa.cap.getCapIDModel(s_id1, s_id2, s_id3).getOutput();
var servProvCode = capIDModel.getServiceProviderCode();

function main()
{
	var documentList = aa.document.getCapDocumentList(capIDModel, userID).getOutput();

	if(documentList != null && documentList.length > 0)
	{
		for(var i = 0; i < documentList.length; i++)
		{
			var documentModel = documentList[i];

			var docCategory = documentModel.getDocCategory();
			for(var j =0 ; j < requiredType.size(); j ++)
			{
				if(docCategory != requiredType.get(j))
				{
					addCapCondition();
					break;
				}
			}
		}
	}
	else 
	{
		if ( requiredType.size() > 0)
		{
			addCapCondition();
		}
	}
	
}


function addCapCondition()
{
	var stdcondition = aa.capCondition.getStandardConditions(cond_type, cond_name).getOutput();

	var capConditionModel = aa.capCondition.getNewConditionScriptModel().getOutput();
	var sysUserModel = aa.people.getSysUserByID(userID).getOutput();
	capConditionModel.setIssuedByUser(sysUserModel);
	capConditionModel.setCapID(capIDModel);
	capConditionModel.setServiceProviderCode(servProvCode);
	capConditionModel.setConditionOfApproval("N");
	
	var result = aa.condition.createConditionFromStdCondition(capConditionModel, stdcondition[0].getConditionNbr());
	if(result > 0)
	{
		aa.print("add condition successfully");
	}
	else
	{
		aa.print("add conditon failed");
	}
}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "successful");
main();