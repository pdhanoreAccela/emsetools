var capConditionID = 194414;

var s_id1 = aa.env.getValue("PermitId1");
var s_id2 = aa.env.getValue("PermitId2");
var s_id3 = aa.env.getValue("PermitId3");

var capIDModel = aa.cap.getCapIDModel(s_id1, s_id2, s_id3).getOutput();
var capCondition = aa.capCondition.getCapCondition(capIDModel, capConditionID).getOutput();
var metStatus = getMetStatus();
if("" != metStatus)
{
	capCondition.setConditionStatus(metStatus);
	aa.capCondition.editCapCondition(capCondition);
}


function getMetStatus()
{
	var bizResult = aa.bizDomain.getBizDomain("STATUS_OF_CONDITIONS_OF_APPROVAL");
	if (bizResult.getSuccess())
	{
		var bizArr = bizResult.getOutput();
		if(bizArr.size()>0)
		{
			 var iterator = bizArr.iterator();
			 while(iterator.hasNext())
			 {
				var bizDomainScriptModel = iterator.next();
				if("Not Applied" == bizDomainScriptModel.getDescription())
				{
					return bizDomainScriptModel.getBizdomainValue();
				}
			 }
		}
	}
	return "";
}