var subgroup = "PARTNERSHIP"

var validateField = "Share Percentage"


var capModel = aa.env.getValue("CapModel")

var ASITable = capModel.getAppSpecificTableGroupModel()

var ASITMap = ASITable.getTablesMap();

var model = ASITMap.get(subgroup)

var defaultfields = model.getColumns()

var fieldsSize = defaultfields.size()

var fieldValues = model.getTableField()

var fieldValuesSize = fieldValues.size()

var j=0;

for(var i=0; i<fieldsSize; i++)
{
   var filed= defaultfields.get(i);
   if(filed.getColumnName()==validateField)
   {
      j=i;
      break;
   }

}

var m = fieldValuesSize/fieldsSize;

var percentageSum = 0

for (var n=0; n<m; n++)
{
  var fieldvalue = fieldValues.get(j+n*fieldsSize)
  percentageSum = percentageSum + parseInt(fieldvalue.getInputValue());
}

aa.print(percentageSum)

if (percentageSum != '100')
{
  aa.env.setValue("ErrorCode", "-1");
  aa.env.setValue("ErrorMessage", "CapModel is " + capModel.getClass() + " : The Partner's share percentage must be 100");
}