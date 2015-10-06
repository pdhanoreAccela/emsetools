// @Open sesame
var contactModel = aa.env.getValue("Contact");
var newSelectedContactType = aa.env.getValue("selectedContactType");
var oldContactType = contactModel.getPeople().getContactType();
var originTemplate = contactModel.getPeople().getTemplate();
var meetCondition = "N";

if (originTemplate != null)
{
	aa.print("@@@@@@@@");
	var originFields = getTemplateFormFields(originTemplate.getTemplateForms());
	if (originFields != null && originFields.size() > 0)
	{
                for (var i = 0; i < originFields.size(); i ++)
                {
                                var fieldName = originFields.get(i).getFieldName();
				var fieldValue = originFields.get(i).getDefaultValue();
                                aa.print("field name ==" + fieldName);
                                aa.print("field value==" + fieldValue);
				if ("Dropdown".equals(fieldName))
				{

				
					meetCondition = "Y";
					break;
				}

                }
	}
	if("Y".equals(meetCondition))
	{
		aa.env.setValue("ScriptReturnCode", "0");
		aa.env.setValue("ScriptReturnMessage", "Change contact type to Applicant.");
	 
	}
	else
	{
		aa.env.setValue("ScriptReturnCode", "-1");//return "-1" means change failed.
		aa.env.setValue("ScriptReturnMessage", "Change contact type failed, because you do not meet the conditions.");
	}

}





function getTemplateFormFields(templateForms)
{
		var fields = aa.util.newArrayList();
		
		var subgroups = getTemplateSubgroups(templateForms);
		if(subgroups != null)
		{
				for (var i = 0; i < subgroups.size(); i ++)
				{
						if (subgroups.get(i) != null && subgroups.get(i).getFields() != null)
						{
								fields.addAll(subgroups.get(i).getFields());
						}
				}
		}
		return fields;
}


function getTemplateSubgroups(templateGroups)
{
		var subgroups = aa.util.newArrayList();
		if(templateGroups != null)
		{
				for (var i = 0; i < templateGroups.size(); i ++)
				{
						if (templateGroups.get(i) != null && templateGroups.get(i).getSubgroups() != null)
						{
								subgroups.addAll(templateGroups.get(i).getSubgroups());
						}
				}

		}
		return subgroups;
}
