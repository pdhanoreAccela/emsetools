//https://ams-server2.achievo.com:5443/admin/eventmanager/index.cfm?FUSEACTION=UpdateScript&SCRIPT_CODE=INSERASITBEFORESCRIPT       
                                                                                                                                    
//SACCO                                                                                                                             
//copyASIT                                                                                                                          
                                                                                                                                    
                                                                                                                                    
var showMessage = false;						// Set to true to see results in popup window                                                   
var showDebug = true;							// Set to true to see debug messages in popup window                                              
var message =	"";								// Message String                                                                                   
var debug = "";									// Debug String                                                                                     
var br = "<BR>";								// Break Tag  
var limitRowNum = 2;                                                                                      
                                                                                                                                    
var cap = aa.env.getValue("CapModel");                       		// Service Provider Code                                                
var currentUserID = aa.env.getValue("CurrentUserID");                                                                               
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN" ; publicUser = true }  // ignore public users               

checkASITRow(cap, limitRowNum);
                                                                                                                                    
function checkASITRow(capModel, limitRowNum)
{
	var capId = cap.getCapID();  
	var tmpCap = aa.cap.getCapViewBySingle(capId);                             
	var asitGroupModel = tmpCap.getAppSpecificTableGroupModel(); 
	var asitTables = asitGroupModel.getTablesArray();
	var tai = ta.iterator();                                                                                                           
                                                                                                                 
	while (tai.hasNext())                                                                                                              
	{                                                                                                                                  
	  var asitTable = tai.next();                                                                                                            
	  var tName = asitTable.getTableName();   
	  var tableColumnCount = asitTable.getColumns().size(); 
	  var fieldCount = asitTable.getTableField().size();
	  var rowNum = fieldCount/tableColumnCount;
	  
	  if(rowNum > limitRowNum)
	  {
	  		aa.env.setValue("ScriptReturnCode", "-1");
				aa.env.setValue("ScriptReturnMessage", "App specific table limit in " + limitRowNum + " rows.");
	  }
	}	
}