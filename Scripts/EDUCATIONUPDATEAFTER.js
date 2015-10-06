var capID = getCapID();
var formSubgroup = "LEGALFORM";
formFieldName = "Due Date"
var educationModel = getOutput(aa.education.getEducationList(capID),"")[0];

var dueDate = getTemplateValueByForm(educationModel.getTemplate(),formSubgroup,formFieldName) ;
var newDate = aa.date.addDate(dueDate,30);
setTemplateValueByForm(educationModel.getTemplate(),formSubgroup,formFieldName,newDate) ;
aa.education.updateEducationModel(educationModel);



function getTemplateValueByForm(templateModel,groupName,fieldName)
{
	
	var asiForms = templateModel.getTemplateForms();
	if(asiForms == null || asiForms.size() == 0)
	{
	   return null;
	}
	var subGroups = asiForms.get(0).getSubgroups();
	for(var groupsIndex = 0; groupsIndex < subGroups.size(); groupsIndex++)
	{
	    var subGroup = subGroups.get(groupsIndex);
	    if(groupName == subGroup.getSubgroupName())
	    {
		var asiFields = subGroup.getFields();
		for(var fieldIndex = 0 ; fieldIndex < asiFields.size() ; fieldIndex++) 
		{
		    var field = asiFields.get(fieldIndex);
		    if(field.getFieldName() == fieldName)
		    {
			return field.getDefaultValue();
		    }
		}
	    }
	}
}
function setTemplateValueByForm(templateModel,groupName,fieldName,newValue)
{
	
	var asiForms = templateModel.getTemplateForms();
	if(asiForms == null || asiForms.size() == 0)
	{
	   return null;
	}
	var subGroups = asiForms.get(0).getSubgroups();
	for(var groupsIndex = 0; groupsIndex < subGroups.size(); groupsIndex++)
	{
	    var subGroup = subGroups.get(groupsIndex);
	    if(groupName == subGroup.getSubgroupName())
	    {
		var asiFields = subGroup.getFields();
		for(var fieldIndex = 0 ; fieldIndex < asiFields.size() ; fieldIndex++) 
		{
		    var field = asiFields.get(fieldIndex);
		    if(field.getFieldName() == fieldName)
		    {
			field.setDefaultValue(newValue);
		    }
		}
	    }
	}
}
function getCapID()
{
    var id1 = aa.env.getValue("PermitId1");
    var id2 = aa.env.getValue("PermitId2");
    var id3 = aa.env.getValue("PermitId3");
    return aa.cap.createCapIDScriptModel(id1, id2, id3);
}
function getCapIDString()
{
	if(capID != null)
	{
		return capID.getCapID().toString();
	}
	else
	{
		return "";
	}
}
function getOutput(result, object)
{
	if (result.getSuccess())
	{
		return result.getOutput();
	}
	else
	{
		logError("ERROR: Failed to get " + object + ": " + result.getErrorMessage());
		return null;
	}
}
