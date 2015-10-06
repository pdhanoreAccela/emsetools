var capModel = aa.env.getValue("CapModel");
var fromConfirmPage = aa.env.getValue("fromConfirmPage");
var conditionKey = "Application Type";

if(capModel != null)
{
	var asiGroups = capModel.getAppSpecificInfoGroups();
	var conditionValue = getFieldValue(conditionKey,asiGroups);
	if(fromConfirmPage == "Y" && conditionValue != null && "Education" != conditionValue)
	{
		aa.env.setValue("StepNumber", "3");
		aa.env.setValue("PageNumber", "1");
	}
}

function getFieldValue(fieldName, asiGroups)
{     
    var iteGroups = asiGroups.iterator();
    while (iteGroups.hasNext())
    {
        var group = iteGroups.next();
        var fields = group.getFields();
        if (fields != null)
        {
            var iteFields = fields.iterator();
            while (iteFields.hasNext())
            {
                var field = iteFields.next();              
                if (fieldName == field.getCheckboxDesc())
                {
                    return field.getChecklistComment();
                }
            }
        }
    }   
    return null;    
}