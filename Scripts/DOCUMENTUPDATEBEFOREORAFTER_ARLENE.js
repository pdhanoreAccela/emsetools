aa.print("DocumentUpdateBefore/After Start");

var documentModel = aa.env.getValue("DocumentModel");
var template = aa.env.getValue("Template");

if(documentModel!=null && documentModel != "undefined")
{
	printDocumentInfo(documentModel);
}

if(template!=null && template != "undefined" && template!='')
{
	//getTemplateForSimple(template);
	getCompleteTemplateInfo(template);
}


function getCompleteTemplateInfo(template)
{
	if(template.getTemplateForms())
	{
		var formGroups = template.getTemplateForms().toArray();
		printGroups(formGroups);
	}

	if(template.getTemplateTables())
	{
		var tableGroups = template.getTemplateTables().toArray();
		printGroups(tableGroups);
	}
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
      if(group.getSubgroups())
      {
			 var subgroups = group.getSubgroups().toArray();
			 printSubgroups(subgroups,templateType);
      }
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

			var fields = subgroup.getFields().toArray();
			
			if(templateType.name()=="Form")
			{
				printFields(fields);
			}
			else
			{
				if(subgroup.getRows())
				{
					var rows = subgroup.getRows().toArray();
					printRows(rows);
				}			
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
			var values =row.getValues().toArray();
			
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

function printDocumentInfo(model)
{
	if(model != null)
	{
		aa.print("Document Name			=:" + model.getDocName());
		aa.print("Document ID			=:" + model.getDocumentNo());
		aa.print("Source			=:" + model.getSource());
		aa.print("File Name			=:" + model.getFileName());
		aa.print("Document status		=:" + model.getDocStatus());
	}

}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "DocumentUpdateBefore/After End");