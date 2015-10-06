var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
var asit = cap.getAppSpecificTableGroupModel();
edtList = new Array();
addRow();
addASITable4ACAPageFlow(asit, 'ASIT_TEST1', edtList);

function addRow(rowType) {
    var row = new Array();
    row["Column1"] = new asiTableValObj("Text", "Add one row", "Y");
    row["Column2"] = new asiTableValObj("Column2", "Y", "N");
    edtList.push(row);
}

function addASITable4ACAPageFlow(destinationTableGroupModel,tableName,tableValueArray) // optional capId
{
  	//  tableName is the name of the ASI table
  	//  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
  	
    var itemCap = capId
  	if (arguments.length > 3)
  		itemCap = arguments[3]; // use cap ID specified in args
  
  	var ta = destinationTableGroupModel.getTablesMap().values();
  	var tai = ta.iterator();
  	
  	var found = false;
  	
  	while (tai.hasNext())
	{
  		  var tsm = tai.next();  // com.accela.aa.aamain.appspectable.AppSpecificTableModel
  		  if (tsm.getTableName().equals(tableName)) { found = true; break; }
	}

  	if (!found) { 
  		//logDebug("cannot update asit for ACA, no matching table name"); 
  		return false; 
  	}
  	
	var fld = aa.util.newArrayList();  // had to do this since it was coming up null.
	var fld_readonly = aa.util.newArrayList(); // had to do this since it was coming up null.
  	var i = -1; // row index counter
  
    for (thisrow in tableValueArray)
  	{
		var col = tsm.getColumns()
  		var coli = col.iterator();
  
  		while (coli.hasNext())
  		{
  			var colname = coli.next();
  			
			if (typeof(tableValueArray[thisrow][colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj
			{
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()].fieldValue ? tableValueArray[thisrow][colname.getColumnName()].fieldValue : "",colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField",args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g,"\+"));
				fldToAdd.setReadOnly(tableValueArray[thisrow][colname.getColumnName()].readOnly.equals("Y"));
				fld.add(fldToAdd);
				fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
				
			}
			else // we are passed a string
			{
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()] ? tableValueArray[thisrow][colname.getColumnName()] : "",colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField",args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g,"\+"));
				fldToAdd.setReadOnly(false);
				fld.add(fldToAdd);
				fld_readonly.add("N");

			}
  		}
  
  		i--;
  		
  		tsm.setTableFields(fld);
  		tsm.setReadonlyField(fld_readonly); // set readonly field
  	}
  
	tssm = tsm;
	return destinationTableGroupModel;
}

function asiTableValObj(columnName, fieldValue, readOnly) {
	this.columnName = columnName;
	this.fieldValue = fieldValue;
	this.readOnly = readOnly;

	asiTableValObj.prototype.toString=function(){ return String(this.fieldValue) }
};