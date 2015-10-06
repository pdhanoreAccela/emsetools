aa.print("autoCreateTrustAccount begins");					
					
var nbr = aa.env.getValue("PEOPLE_SEQUENCE_NBR");					
var type = aa.env.getValue("PEOPLE_TYPE");					
					
aa.print("nbr : "+nbr);					
aa.print("type : "+type);					
					
capResult = aa.trustAccount.autoCreateTrustAccount(type, nbr);					
					
if(capResult.getSuccess())					
{					
	aa.print("create trust account id successfully.");				
	tid  = capResult.getOutput();   				
	aa.print("trustAccountID= "+tid);				
            aa.env.setValue("ScriptReturnMessage", "AutoPayBeforeSuccess trustAccountID="+tid); 					
}					
else					
{					
	aa.print("create trust account id failed!");				
            aa.env.setValue("ScriptReturnMessage", "AutoPayBeforeSuccess create trustAccount failed."); 					
}