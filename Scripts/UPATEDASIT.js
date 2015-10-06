//This function be used to create a map that its key is row id and its value is these field object list which belong this row.
function createRowIdAndFieldListMap(fieldObjectList)
{
	if(fieldObjectList== null || fieldObjectList.size()==0)
	{
		return null;
	}
	var rowIdAndFieldListMap = aa.util.newHashMap();
	var size = fieldObjectList.size();
	for(var i =0; i<size;i++)
	{
		var fieldObject = fieldObjectList.get(i);
		var rowid = fieldObject.getRowIndex();
		var fieldList = rowIdAndFieldListMap.get(rowid);
		if(fieldList == null)
		{
			fieldList = aa.util.newArrayList();
			rowIdAndFieldListMap.put(rowid,fieldList);
		}
		fieldList.add(fieldObject);
	}
	return rowIdAndFieldListMap;
}


var capID = "14CAP-00000-00B7A";
//Create a cap object
var caidModel = aa.appSpecificTableScript.createCapIDScriptModel();
var caidModeltest = caidModel.getCapID();
caidModeltest.setID1("14CAP");
caidModeltest.setID2("00000");
caidModeltest.setID3("00B7A");
caidModeltest.setServiceProviderCode("ADDEV");
var callerID = "admin";
//table name
var tableName = "BUNNIASIT";
//2,Create a HashMap.
var searchConditionMap = aa.util.newHashMap();
//Create a List object to add the value of Column.
var columnName ="column1";
var valueofColumn = aa.util.newArrayList();
valueofColumn.add("test");
valueofColumn.add("999");
searchConditionMap.put(columnName,valueofColumn);
var asittableObject = aa.appSpecificTableScript.getAppSpecificTableInfo(caidModeltest,tableName,searchConditionMap);
if(asittableObject.getSuccess())
{
	var resultObject = asittableObject.getOutput().getAppSpecificTableModel();
	//Get the all conform to conidtion field of table. 
	var fieldObjectList = resultObject.getTableFields();
	//build a map<rowid, FieldObjectList>
	var rowIdAndFieldListMap = createRowIdAndFieldListMap(fieldObjectList);
	if(rowIdAndFieldListMap !=null)
	{
		var rowIdArray = rowIdAndFieldListMap.keySet().toArray();
		var rowIdSize = rowIdArray.length;
		var aSITTbaleModel = aa.appSpecificTableScript.createTableScriptModel();
		var realAsitTableModel = aSITTbaleModel.getTabelModel();
		realAsitTableModel.setSubGroup(tableName);
		var rowList = realAsitTableModel.getRows();
		for(var i=0;i<rowIdSize;i++)
		{
			var rowid = rowIdArray[i];
			var rowScriptObjectOfASIT = aa.appSpecificTableScript.createRowScriptModel();
			var rowObject = rowScriptObjectOfASIT.getRow();
			rowObject.setId(rowid);
			var updatedObjectMap = aa.util.newHashMap();
			var fieldList = rowIdAndFieldListMap.get(rowid);
			var fieldSize = fieldList.size();
			for(var t =0; t < fieldSize;t++)
			{
				var oneField = fieldList.get(t);
				var columnName = oneField.getFieldLabel();
				//get the value of column
				var inputValue = oneField.getInputValue();
				if(inputValue == "test" && columnName == "column1")
				{
					//Change the value of column named "column1" to "updatedTestValue". 
					updatedObjectMap.put(columnName,"updatedTestValue");
					//If you want to deleted this field, you can set the value to null.
					//updatedObjectMap.put(columnName,null);
				}
				if(inputValue == "999"&& columnName == "column1")
				{
					updatedObjectMap.put(columnName,"updated999Value");
				}
			
			}
			rowObject.setFields(updatedObjectMap);
			rowList.add(rowObject);
		}
		var result = aa.appSpecificTableScript.updateAppSpecificTableInfors(caidModeltest,realAsitTableModel, callerID);
		 if(result.getSuccess())
		{
			aa.print("delete success");
		}
	}
}