var capID = "14CAP-00000-00BA8";
var caidModel = aa.appSpecificTableScript.createCapIDScriptModel();
var caidModeltest = caidModel.getCapID();
caidModeltest.setID1("14CAP");
caidModeltest.setID2("00000");
caidModeltest.setID3("00BA8");
caidModeltest.setServiceProviderCode("ADDEV");
var callerID = "admin";
//table name
var tableName = "BUNNIASIT";
//2,Create a HashMap.
var searchConditionMap = aa.util.newHashMap();
//Create a table Model to addd some row into ASIT.
var aSITTbaleModel = aa.appSpecificTableScript.createTableScriptModel();
var realAsitTableModel = aSITTbaleModel.getTabelModel();
var rowList = realAsitTableModel.getRows();
realAsitTableModel.setSubGroup(tableName);
var rowScriptObjectOfASIT = aa.appSpecificTableScript.createRowScriptModel();
var rowObject = rowScriptObjectOfASIT.getRow();
//Create a map to save the field and value map.
var addASITField = aa.util.newHashMap();
addASITField.put("column1","123");
addASITField.put("column2","6666");
//Set the Map to row object.
rowObject.setFields(addASITField);
//add the row object to AIST Table object.
rowList.add(rowObject);

var result = aa.appSpecificTableScript.addAppSpecificTableInfors(caidModeltest,realAsitTableModel, callerID);
if(result.getSuccess())
{
 aa.print("delete success");
}