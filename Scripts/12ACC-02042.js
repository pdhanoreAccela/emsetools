var cap = aa.env.getValue("CapModel");

conditionTable = new Array();

row = new Array();
row["Text Field"] = "Yes";
row["DropdownList Field"] = new asiTableValObj("DropdownList Field", "Business", "N"); // this works
row["Y/N Field"] = new asiTableValObj("Y/N Field", "No", "Y");
row["Number Field"] = new asiTableValObj("Number Field", "5", "Y");
row["Textarea Field"] = new asiTableValObj("Textarea Field", "Dangerous / Vicious  Dog Waiver", "Y");
conditionTable.push(row);

asit = cap.getAppSpecificTableGroupModel();

new_asit = addASITable4ACAPageFlow(asit, "INSTRUCTION & WATERMARK VERIFY", conditionTable);


function addASITable4ACAPageFlow(destinationTableGroupModel, tableName, tableValueArray) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
    // 

    var ta = destinationTableGroupModel.getTablesMap().values();
    var tai = ta.iterator();

    var found = false;

    while (tai.hasNext()) {
        var tsm = tai.next();  // com.accela.aa.aamain.appspectable.AppSpecificTableModel
        if (tsm.getTableName().equals(tableName)) { found = true; break; }
    }


    if (!found) { logDebug("cannot update asit for ACA, no matching table name"); return false; }

    var fld = aa.util.newArrayList();  // had to do this since it was coming up null.
    var fld_readonly = aa.util.newArrayList(); // had to do this since it was coming up null.
    var i = -1; // row index counter

    for (thisrow in tableValueArray) {
        var col = tsm.getColumns()
        var coli = col.iterator();

        while (coli.hasNext()) {
            var colname = coli.next();

            if (typeof (tableValueArray[thisrow][colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj
            {
                var args = new Array(tableValueArray[thisrow][colname.getColumnName()].fieldValue, colname);
                var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
                fldToAdd.setRowIndex(i);
                fldToAdd.setFieldLabel(colname.getColumnName());
                fldToAdd.setFieldGroup(tableName);

                /* 12ACC-02042 : I use similar code when adding ASIT rows via EMSE.   However when I use this on a page flow script
                The fields are not created as read-only.   As you can see I tried both the tsm.setReadOnlyField(arrayList) method
                as well as setting the fldToAdd.setReadOnly property
				                 
                */

                fldToAdd.setReadOnly(tableValueArray[thisrow][colname.getColumnName()].readOnly.equals("Y"));
                fld.add(fldToAdd);
                fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
            }
            else // we are passed a string
            {
                var args = new Array(tableValueArray[thisrow][colname.getColumnName()], colname);
                var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
                fldToAdd.setRowIndex(i);
                fldToAdd.setFieldLabel(colname.getColumnName());
                fldToAdd.setFieldGroup(tableName);
                fldToAdd.setReadOnly(false);
                fld.add(fldToAdd);
                fld_readonly.add("N");
            }
        }

        i--;

        tsm.setTableField(fld);
        tsm.setReadonlyField(fld_readonly); // set readonly field
    }

    tssm = tsm;

    return destinationTableGroupModel;
}



function asiTableValObj(columnName, fieldValue, readOnly) {
    this.columnName = columnName;
    this.fieldValue = fieldValue;
    this.readOnly = readOnly;

    asiTableValObj.prototype.toString = function () { return this.fieldValue }
}



function logDebug(dstr) {


    aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}
