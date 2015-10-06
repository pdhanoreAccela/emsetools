//https://ams-server2.achievo.com:5443/admin/eventmanager/index.cfm?FUSEACTION=UpdateScript&SCRIPT_CODE=COPYASITFROMPARENTCAP       
                                                                                                                 
//SACCO                                                                                                                             
//copyASIT                                                                                                                          
                                                                                                                 
                                                                                                                 
var showMessage = false;						// Set to true to see results in popup window                                                    
var showDebug = true;							// Set to true to see debug messages in popup window                                             
var message =	"";								// Message String                                                                                  
var debug = "";									// Debug String                                                                                    
var br = "<BR>";								// Break Tag                                                                                         
                                                                                                                 
var cap = aa.env.getValue("CapModel");                                                                                              
var capId = cap.getCapID();                                                                                                         
var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code                                                 
var currentUserID = aa.env.getValue("CurrentUserID");                                                                               
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN" ; publicUser = true }  // ignore public users               
                                                                                                                 
var parentID = getParent();                                                                                                         
var asitData = loadASITable("KAY_SAME1", parentID);                                                                                
addASITable("KAY_SAME1", asitData);                                                                                                
                                                                                                                 
var tmpCap = aa.cap.getCapViewBySingle(capId);                                                                                      
cap.setAppSpecificTableGroupModel(tmpCap.getAppSpecificTableGroupModel());                                                          
aa.env.setValue("CapModel", cap);                                                                                                   
                                                                                                                 
function getParent()                                                                                                                
{                                                                                                                                   
	// returns the capId object of the parent.  Assumes only one parent!                                                               
	//                                                                                                                                 
	var getCapResult = aa.cap.getCapID("11CAP","00000","000KB");
	if (getCapResult.getSuccess())                                                                                                     
	{                                                                                                                                  
		var parentCapID = getCapResult.getOutput();                                                                                      
		return parentCapID;                                                                                                              
	}                                                                                                                                  
	else                                                                                                                               
	{                                                                                                                                  
		logDebug( "**WARNING: getting project parents:  " + getCapResult.getErrorMessage());                                             
		return false;                                                                                                                    
	}                                                                                                                                  
}                                                                                                                                   
	                                                                                                                                   
function loadASITable(tname) {                                                                                                      
                                                                                                                 
 	//                                                                                                                               
 	// Returns a single ASI Table array of arrays                                                                                    
	// Optional parameter, cap ID to load from                                                                                         
	//                                                                                                                                 
	var itemCap = capId;                                                                                                               
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args                                                 
                                                                                                                 
	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();                                             
	var ta = gm.getTablesArray()                                                                                                       
	var tai = ta.iterator();                                                                                                           
                                                                                                                 
	while (tai.hasNext())                                                                                                              
	{                                                                                                                                  
	  var tsm = tai.next();                                                                                                            
	  var tn = tsm.getTableName();                                                                                                     
                                                                                                                 
      if (!tn.equals(tname)) continue;                                                                                              
                                                                                                                 
	  if (tsm.rowIndex.isEmpty())                                                                                                      
	  	{                                                                                                                              
			logDebug("Couldn't load ASI Table " + tname + " it is empty");                                                                 
			return false;                                                                                                                  
		}                                                                                                                                
                                                                                                                 
   	  var tempObject = new Array();                                                                                                
	  var tempArray = new Array();                                                                                                     
                                                                                                                 
  	  var tsmfldi = tsm.getTableField().iterator();                                                                                  
	  var tsmcoli = tsm.getColumns().iterator();                                                                                       
      var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed                           
	  var numrows = 1;                                                                                                                 
                                                                                                                 
	  while (tsmfldi.hasNext())  // cycle through fields                                                                               
		{                                                                                                                                
		if (!tsmcoli.hasNext())  // cycle through columns                                                                                
			{                                                                                                                              
			var tsmcoli = tsm.getColumns().iterator();                                                                                     
			tempArray.push(tempObject);  // end of record                                                                                  
			var tempObject = new Array();  // clear the temp obj                                                                           
			numrows++;                                                                                                                     
			}                                                                                                                              
		var tcol = tsmcoli.next();                                                                                                       
		var tval = tsmfldi.next();                                                                                                       
		var readOnly = 'N';                                                                                                              
		if (readOnlyi.hasNext()) {                                                                                                       
			readOnly = readOnlyi.next();                                                                                                   
		}                                                                                                                                
		var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);                                                        
		tempObject[tcol.getColumnName()] = fieldInfo;                                                                                    
                                                                                                                 
		}                                                                                                                                
		                                                                                                                                 
	  tempArray.push(tempObject);  // end of record                                                                                    
	}                                                                                                                                  
	                                                                                                                                   
	return tempArray;                                                                                                                  
}                                                                                                                                   
                                                                                                                 
function asiTableValObj(columnName, fieldValue, readOnly) {                                                                         
	this.columnName = columnName;                                                                                                      
	this.fieldValue = fieldValue;                                                                                                      
	this.readOnly = readOnly;                                                                                                          
                                                                                                                 
	asiTableValObj.prototype.toString=function(){ return this.fieldValue }                                                             
};                                                                                                                                  
	                                                                                                                                   
function addASITable(tableName,tableValueArray) // optional capId                                                                   
{                                                                                                                                   
  	//  tableName is the name of the ASI table                                                                                       
  	//  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object         
    var itemCap = capId                                                                                                             
  	if (arguments.length > 2)                                                                                                        
  		itemCap = arguments[2]; // use cap ID specified in args                                                                        
                                                                                                                                    
  	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)                                           
                                                                                                                                    
  	if (!tssmResult.getSuccess())                                                                                                    
  		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }
                                                                                                                                    
  	var tssm = tssmResult.getOutput();                                                                                               
  	var tsm = tssm.getAppSpecificTableModel();                                                                                       
  	var fld = tsm.getTableField();                                                                                                   
    var fld_readonly = tsm.getReadonlyField(); // get Readonly field                                                                
                                                                                                                                    
    for (thisrow in tableValueArray)                                                                                                
	{                                                                                                                                  
                                                                                                                                    
  		var col = tsm.getColumns()                                                                                                     
  		var coli = col.iterator();                                                                                                     
                                                                                                                                    
  		while (coli.hasNext())                                                                                                         
  		{                                                                                                                              
  			var colname = coli.next();                                                                                                   
                                                                                                                                    
			if (typeof(tableValueArray[thisrow][colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj                 
				{                                                                                                                            
	  			fld.add(tableValueArray[thisrow][colname.getColumnName()].fieldValue);                                                     
	  			fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);                                              
				}                                                                                                                            
			else // we are passed a string                                                                                                 
				{                                                                                                                            
  				fld.add(tableValueArray[thisrow][colname.getColumnName()]);                                                                
  				fld_readonly.add(null);                                                                                                    
				}                                                                                                                            
  		}                                                                                                                              
                                                                                                                                    
  		tsm.setTableField(fld);                                                                                                        
                                                                                                                                    
  		tsm.setReadonlyField(fld_readonly);                                                                                            
                                                                                                                                    
  	}                                                                                                                                
                                                                                                                                    
  	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);                                
                                                                                                                                    
  	 if (!addResult .getSuccess())                                                                                                   
  		{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }  
  	else                                                                                                                             
  		logDebug("Successfully added record to ASI Table: " + tableName);                                                              
                                                                                                                                    
}                                                                                                                                   
                                                                                                                 
function logDebug(dstr) {                                                                                                           
                                                                                                                 
    if (!aa.calendar.getNextWorkDay) {                                                                                              
                                                                                                                 
		var vLevel = 1                                                                                                                   
		if (arguments.length > 1)                                                                                                        
			vLevel = arguments[1]                                                                                                          
                                                                                                                 
		if ((showDebug & vLevel) == vLevel || vLevel == 1)                                                                               
			debug += dstr + br;                                                                                                            
                                                                                                                 
		if ((showDebug & vLevel) == vLevel)                                                                                              
			aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)                                         
		}                                                                                                                                
	else {                                                                                                                             
			debug+=dstr + br;                                                                                                              
		}                                                                                                                                
                                                                                                                 
}