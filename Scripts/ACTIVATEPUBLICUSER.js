/***********************************************************************
 * Accela Automation
 * File: ActivatePublicUser.js
 * Accela, Inc.
 * Copyright (C): 2009
 * 
 * Description: Activate Public User by EMSE.
 * 
 * Notes:
 *
 * Revision History:
 **********************************************************************/


//Get the Universally Unique Identifier for public user verification.
var uuid= aa.env.getValue("UUID");

//Activate Public User by servProvCode and uuid.
var result = aa.expiration.activatePublicUser(uuid);

if(result.getSuccess())
{
	//If Activate Public User Successefully, then print the User ID.
	aa.print(result.getOutput());
}
else
{
	//If Activate fail, then print the error message.
	aa.print(result.getErrorMessage());
}
