var error = "";
var message = "";
var br = "<br>";

var capModel = aa.env.getValue("CapModel");
var capId = capModel.capID;

//single standard condition number

//var singleStdConNumVar = "8191";
//createSingleCapConditionByConNum(capId,singleStdConNumVar);


//single group name

var groupNameVar = "levi";
createCapConditionsByGroupName(capId,groupNameVar);


//Multiple group name
//var groupNamesStr = "['Department of Municipalities and Agricultural- Business Activates Requirement(s)','F_Group1','FF']";
//var groupNameArray = eval(groupNamesStr);
//createCapConditionsByGroupNames(capId,groupNameArray)

if (error && error.length > 0)
{
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", error);
}
else
{
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", message);
}
aa.print(message);
aa.print(error);

function createCapConditionsByGroupNames(capId,groupNames)
{
	if (groupNames.length == 0)
	{
		return;
	}
	for(var i=0;i<groupNames.length;i++)
	{
		var groupName = groupNames[i];
		createCapConditionsByGroupName(capId,groupName);
	}

}

function createCapConditionsByGroupName(capId,groupName)
{
	var standardConditions = aa.capCondition.getStandardConditionsByGroup(groupName).getOutput();
	for(i = 0; i<standardConditions.length;i++)
	{
		var stdCon = standardConditions[i];
		var stdConNum = stdCon.getConditionNbr();
		var conditionResult = aa.capCondition.createCapConditionFromStdCondition(capId, stdConNum);
		if (!conditionResult.getSuccess())
		{
			logError("Create CAP condition for CAP("+ capId +") from STD condition(" + stdConNum + ") faild!");
		}
		logMessage("CAP condition(" + conditionResult.getOutput() + ") for CAP(" + capId + ") is created successful.");
	}
}

function createSingleCapConditionByConNum(capId,stdConNum)
{
	var conditionResult = aa.capCondition.createCapConditionFromStdCondition(capId, stdConNum);
	if (!conditionResult.getSuccess())
	{
		logError("Create CAP condition for CAP("+ capId +") from STD condition(" + stdConNum + ") faild!");
		return;
	}
	logMessage("CAP condition(" + conditionResult.getOutput() + ") for CAP(" + capId + ") is created successful.");
}

function logError(str)
{
	error += str + br;
}

function logMessage(str)
{
	message += str + br;
}