/**
 * <pre>
 * 
 *  Accela Automation
 *  File: ContactRelatedToPublicUserBefore.js
 * 
 *  Accela, Inc.
 *  Copyright (C): 2014
 * 
 *  Description:
 *  TODO
 * 
 *  Notes:
 * 	$Id: ContactRelatedToPublicUserBefore.js 72642 2009-01-01 20:01:57Z ACHIEVO\andy.zhong $ 
 * 
 *  Revision History
 *  <Date>,			<Who>,			<What>
 *  Jun 5, 2014		andy.zhong		Initial.
 *  
 * </pre>
 */
var userSeqNbr = aa.env.getValue("PublicUserSeqNum");
var contactTypeFlag = aa.env.getValue("ContactTypeFlag");
var isFromACA = aa.env.getValue("isFromACA");
var scriptResult = aa.people.getUserAssociatedContact(userSeqNbr);
var people = aa.env.getValue("People");

/*Get the first ASI Fields (Field Name & Field Value)*/
var asiFieldName = people.getTemplate().getTemplateForms().get(0).getSubgroups().get(0).getFields().get(0).getDisplayFieldName();
var asiContactFlag = people.getTemplate().getTemplateForms().get(0).getSubgroups().get(0).getFields().get(0).getDefaultValue();

/*Get the first ASIT Fields (Field Name & Field Value)*/
var asitFieldName = people.getTemplate().getTemplateTables().get(0).getSubgroups().get(0).getFields().get(0).getDisplayFieldName();
var asitContactFlag = people.getTemplate().getTemplateTables().get(0).getSubgroups().get(0).getRows().get(0).getValues().get(0).getValue();


/*we can use the loop to get all ASI Fields*/
for(var i=0; i<people.getTemplate().getTemplateForms().size();i++)
{
   for(var j=0; j<people.getTemplate().getTemplateForms().get(i).getSubgroups().size(); j++)
   {
      for(var k=0; k<people.getTemplate().getTemplateForms().get(i).getSubgroups().get(j).getFields().size(); k++)
	  {
	     aa.debug("***ASI Field Name***",people.getTemplate().getTemplateForms().get(i).getSubgroups().get(j).getFields().get(k).getDisplayFieldName());
		 aa.debug("***ASI Field Value***",people.getTemplate().getTemplateForms().get(i).getSubgroups().get(j).getFields().get(k).getDefaultValue());
	  }
   }
}

/*the similar way we can use the loop to get all ASIT Fields*/
for(var i=0; i<people.getTemplate().getTemplateTables().size();i++)
{
   for(var j=0; j<people.getTemplate().getTemplateTables().get(i).getSubgroups().size(); j++)
   {
      for(var k=0; k<people.getTemplate().getTemplateTables().get(i).getSubgroups().get(j).getFields().size(); k++)
	  {
	     aa.debug("###ASIT Field Name###",people.getTemplate().getTemplateTables().get(i).getSubgroups().get(j).getFields().get(k).getDisplayFieldName());
		 for(var l=0; l<people.getTemplate().getTemplateTables().get(i).getSubgroups().get(j).getRows().size(); l++)
		 {
		   aa.debug("###ASIT Field Value###",people.getTemplate().getTemplateTables().get(i).getSubgroups().get(j).getRows().get(l).getValues().get(k).getValue());
		 }
	  }
   }
}

if(scriptResult.getSuccess() && ((contactTypeFlag != null && "individual".equalsIgnoreCase(contactTypeFlag)) 
                                  ||(asiContactFlag != null && "individual".equalsIgnoreCase(asiContactFlag))
                                  ||(asitContactFlag != null && "individual".equalsIgnoreCase(asitContactFlag))))
{
	var userAssociatedContacts = scriptResult.getOutput();
	if(userAssociatedContacts != null && userAssociatedContacts.size() > 0)
	{
		for(var i = 0; i < userAssociatedContacts.size(); i++)
		{
			var contractorPeople = userAssociatedContacts.get(i);
			
			if("individual".equalsIgnoreCase(contractorPeople.getContactTypeFlag()))
			{
				aa.env.setValue("ScriptReturnCode","-1");

				if ("true".equals(isFromACA))
				{
				   aa.env.setValue("ScriptReturnMessage", "<br/>1. An ACA public user account can only be linked to one reference contact of type 'Individual' <br/> 2. An ACA public user account can be linked to zero/many Reference contacts of type 'Organisation' <br/>3. ASI Field["+asiFieldName+"]:" + asiContactFlag + " ASIT Field["+asitFieldName+"]:" + asitContactFlag);				
				}
				else
				{
				   aa.env.setValue("ScriptReturnMessage", "<br/>1. A public user account can only be linked to one reference contact of type 'Individual' <br/> 2. A public user account can be linked to zero/many Reference contacts of type 'Organisation' ");
				}
			}
		}
	}
}
else
{
    aa.env.setValue("ScriptReturnCode","0");
	aa.env.setValue("ScriptReturnMessage", "Connect successfully."); 
}
