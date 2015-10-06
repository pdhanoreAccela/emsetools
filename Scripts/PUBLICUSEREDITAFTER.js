/**
 * <pre>
 * 
 *  Accela Automation
 *  File: PublicUserEditAfter.js
 * 
 *  Accela, Inc.
 *  Copyright (C): 2014
 * 
 *  Description:
 *  TODO
 * 
 *  Notes:
 * 	$Id: PublicUserEditAfter.js $ 
 * 
 *  Revision History
 *  <Date>,			<Who>,			<What>
 *  Aug 11 2014 	Ian Chen		Initial.
 * </pre>
 */
var servProvCodes = new Array('JEFF','JEREMYCHEN');//initialize agency codes. not include super agency
var publicUser = aa.env.getValue("PublicUserModel");
var xPublicUserSSO;
var failedAgency = '';

if (publicUser && publicUser != '')
{
	var result = aa.publicUser.getXPublicUserSSO(publicUser.getUserSeqNum());
	if (result.getSuccess())
	{
		xPublicUserSSO = result.getOutput();
	}
	if (xPublicUserSSO != null)
	{
		xPublicUserSSO.getAuditModel().setAuditID(publicUser.getAuditID());
		for(var i in servProvCodes)
		{
			xPublicUserSSO.setServiceProviderCode(servProvCodes[i]);
			result = aa.publicUser.syncXPublicUserSSO(xPublicUserSSO);
			if (!result.getSuccess())
			{
				if (failedAgency == '')
				{
					failedAgency += servProvCode[i];
				}
				else
				{
					failedAgency += ', ' + servProvCode[i];
				}
				
			}			
		}
		if (failedAgency == '')
		{
			aa.env.setValue("ScriptReturnMessage", "Synchronize to sub agency successfully! ");
			aa.env.setValue("ScriptReturnCode", "0");
		}
		else 
		{
			aa.env.setValue("ScriptReturnMessage", "Fail to synchronize to " + failedAgency + "! ");
			aa.env.setValue("ScriptReturnCode", "-1");
		}		
	}
	else
	{		
		aa.env.setValue("ScriptReturnMessage", "Can't find the association in the current agency! ");
		aa.env.setValue("ScriptReturnCode", "-1");
	}
}
else
{	
	aa.env.setValue("ScriptReturnMessage", "The public user model is invalid! ");
	aa.env.setValue("ScriptReturnCode", "-1");
}