/*
 *   Creating child Records by ASI Table values.
 *   10ACC-06148
 */
var asitgroupModel = aa.env.getValue("AppSpecificTableGroupModel");
if (asitgroupModel != null)
{
		aa.print("============ Print ASI Table Values ============");
        var asitableMap = asitgroupModel.getTablesMap();
        if (asitableMap != null && asitableMap.size() > 0)
        {
        	var valueIterator = ta.values().iterator();

        	while (valueIterator.hasNext())
        	{
        		var tsm = valueIterator.next();
        		if (tsm == null)
        		{
        			continue;
        		}
        		aa.print(tsm.getGroupName() + "|" + tsm.getTableName());

        		var tsmfldi = tsm.getTableField().iterator();
        		var tsmcoli = tsm.getColumns().iterator();

        		while (tsmcoli.hasNext())
        		{
        			var columnModel = tsmcoli.next();
        			aa.print(columnModel.getColumnName());
        		}
        		while (tsmfldi.hasNext())
        		{
        			var fldModel = tsmfldi.next();
        			aa.print(fldModel.getInputValue());
        		}
        		
        		aa.print("-------------------------");
        		var fields = tsm.getTableField();
        		var columns = tsm.getColumns();
        		
        		if (fields != null && fields.size() > 0)
        		{
        			for (var j = 0; j < fields.size(); j++)
        			{
        				aa.print(fields.get(j).getColumnName());
        			}
        		}
        		
        		if (columns != null && columns.size() > 0)
        		{
        			for (var k = 0; k < columns.size(); k++)
        			{
        				aa.print(columns.get(k).getInputValue());
        			}
        		}
        		aa.print("-------------------------");
            }
        }
}
