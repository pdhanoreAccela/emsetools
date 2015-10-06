var capModel = aa.env.getValue("CapModel");
var fromReviewPage = aa.env.getValue("fromReviewPage");
var conditionKey = "Application Type";

if(capModel != null)
{
	var asiGroups = capModel.getAppSpecificInfoGroups();
	var conditionValue = getFieldValue(conditionKey,asiGroups);
	if(fromReviewPage == "Y" && conditionValue != null && "Education" == conditionValue)
	{
		aa.env.setValue("ReturnData", "{'PageFlow': {'StepNumber': '3', 'PageNumber':'1'}}");
	}
}

function getFieldValue(fieldName, asiGroups)
{     
		if(asiGroups == null)
		{
			return null;
		}
		
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