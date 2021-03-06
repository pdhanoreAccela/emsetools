var capModel = aa.env.getValue("CapModel");
var conditionKey = "Redio test";

if(capModel != null)
{
	var asiGroups = capModel.getAppSpecificInfoGroups();
	var conditionValue = getFieldValue(conditionKey,asiGroups);
	if(conditionValue != null && "Y" == conditionValue)
	{
		aa.env.setValue("ReturnData", "{'PageFlow': {'HidePage' : 'Y'}}");
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