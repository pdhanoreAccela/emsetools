var template = aa.env.getValue("Template");

if(template!=null && template != "undefined")
{
	aa.print(template.getTemplateForms);
	getTemplateForSimple(template);
}
else
{
	testToGetConditionTemplate();
}

function testToGetConditionTemplate()
{
	var capId = aa.cap.getCapID("10BLD", "00000", "00047").getOutput();

	var conditionNumber = 398760;

	var condition = aa.capCondition.getCapCondition(capId,conditionNumber).getOutput();
	if(condition!= null)
	{
		aa.print("Condition Name: "+condition.getConditionDescription());

		var template =condition.getTemplateModel();

		//getCompleteTemplateInfo(template);

		getTemplateForSimple(template);
	}
	else
	{
		aa.print("Cannot find the condition");
	}

}

function getTemplateForSimple(template)
{
	var form = "Form";
	var table = "Table";
	if(!template.getTemplateForms)
	   return;
	var group =template.getTemplateForms().toArray()[0];
	var groupName=group.getGroupName();
	var subgroup = group.getSubgroups().toArray()[0];
	var subgroupName= subgroup.getSubgroupName();
	var field = subgroup.getFields().toArray()[0];
	var fieldName = field.getFieldName();
	aa.print("Demo Simple Template Case"); 
	aa.print("Field Value: "+ field.getDefaultValue()); 
}

function getCompleteTemplateInfo(template)
{
	aa.print("Demo Complete Template Case"); 
	var formGroups = template.getTemplateForms().values().toArray();
	printGroups(formGroups);

	var tableGroups = template.getTemplateTables().values().toArray();
	printGroups(tableGroups);
}

function printGroups(groups)
{
	for(var i=0; i<groups.length; i++)
	{
		var group = groups[i];

		if(group!=null)
		{
			aa.print("Group Name: " + group.getGroupName());
			var templateType =group.getTemplateType();
			aa.print("Template Type: " + templateType);

			var subgroups = group.getSubgroups().values().toArray();
			printSubgroups(subgroups,templateType);
		}
	}
}

function printSubgroups(subgroups, templateType)
{
	for(var i=0; i<subgroups.length; i++)
	{
		var subgroup = subgroups[i];
		if(subgroup!=null)
		{
			aa.print("Subgroup Name: " + subgroup.getSubgroupName());

			var fields = subgroup.getFields().values().toArray();
			
			if(templateType.name()=="Form")
			{
				printFields(fields);
			}
			else
			{
				var rows = subgroup.getRows().values().toArray();
				printRows(rows);
			}
		}
	}
}

function printFields(fields)
{
	for(var i=0; i<fields.length; i++)
	{
		var field = fields[i];

		if(field!= null)
		{
			aa.print("Field Name: " + field.getFieldName());
			aa.print("Field value: " + field.getDefaultValue());
		}
	}
}

function printRows(rows)
{
	for(var i=0; i<rows.length; i++)
	{
		var row = rows[i];
		if(row != null)
		{
			aa.print("Row Index: " + row.getRowIndex());
			var values =row.getValues().values().toArray();
			
			printValues(values);
		}
	}
}

function printValues(values)
{
	for(var i=0; i<values.length; i++)
	{
		var value = values[i];

		if(value!= null)
		{
			aa.print("Value Name: " + value.getFieldName());
			aa.print("Value: " + value.getValue());
		}
	}

}
