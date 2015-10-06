/**
 * Description:
 * RegistrationSubmitBefore.js the EMSE Script that related to EMSE EVENT RegistrationSubmitBefore
 *
 * Notes:
 *
 * Revision History:
 * 2012/06/03     andy.zhong	Initial Version
 */
var publicUser = aa.env.getValue("PublicUserModel");
var peopleAttributes = aa.env.getValue("PeopleAttributes");
var licenseList = aa.env.getValue("LicenseList");
aa.debug("-----------------------------RUN EMSE START--------------------------", "-------------------------------------------------");
if(publicUser != null )
{
	aa.debug("User ID :",publicUser.getUserID());
	aa.debug("User Email :",publicUser.getEmail());
			
	if (publicUser.getQuestions() != null)
	{
		var userQuestions = publicUser.getQuestions();
		for (var i = 0; i < userQuestions.length; i++)
		{
			var userQuestion = userQuestions[i];
			aa.debug("---------------------------------------Public User Question----------------------------------", "---------------");

			aa.debug("User Squence Number :", userQuestion.getUserSeqNbr());
			aa.debug("Question Sort Order :", userQuestion.getSortOrder());
			aa.debug("User Question :", userQuestion.getQuestionValue());
			aa.debug("User Question Answer :", userQuestion.getAnswerValue());
		}
	}
	aa.debug("--------------------------------------Print Contact Info---------------------------------------","-----------------------------");


	if (publicUser.getPeoples() != null)
	{
		var userContacts = publicUser.getPeoples();
		for (var i = 0; i < userContacts.size(); i++)
		{
			var peopleModel = userContacts.get(i);
					
			aa.debug("User Contact Type :", peopleModel.getContactType());
			aa.debug("User First Name :", peopleModel.getFirstName());
			aa.debug("User Middle Name :", peopleModel.getMiddleName());
			aa.debug("User Last Name :", peopleModel.getLastName());
			aa.debug("User Phone1 :", peopleModel.getPhone1());
			aa.debug("User Phone2 :", peopleModel.getPhone2());
			aa.debug("User Phone3 :", peopleModel.getPhone3());
			aa.debug("User BirthDate :", peopleModel.getBirthDate());
			aa.debug("User BusinessName :", peopleModel.getBusinessName());
			aa.debug("User BusinessName2 :", peopleModel.getBusinessName2());
			aa.debug("User Email :", peopleModel.getEmail());
			aa.debug("User FullName :", peopleModel.getFullName());
			aa.debug("User Contact Type Flag :", peopleModel.getContactTypeFlag());
			aa.debug("User Country :", peopleModel.getCountry());
			aa.debug("User Audit Date :", peopleModel.getAuditDate());
			aa.debug("User FEIN :", peopleModel.getFein());
			aa.debug("User SSN :", peopleModel.getSocialSecurityNumber());


			printPeopleASI(peopleModel);
			printPeopleASIT(peopleModel);
			printContactAttribute(peopleModel);
			
			if (peopleModel.getContactAddressList() != null)
			{
				var contactAddressList = peopleModel.getContactAddressList();
						
				for (var i = 0; i < contactAddressList.size(); i++)
				{
					var addressModel = contactAddressList.get(i);
							
					if ("Business".equals(addressModel.getAddressType()))
					{
						aa.env.setValue("ScriptReturnCode","-1");
						aa.env.setValue("ScriptReturnMessage", "Registration Public User is fail ! incorrect contact address type [ "+addressModel.getAddressType()+" ] !");
					}
							
					aa.debug("------------------------------------Print Contact Address-------------------------------", "-----------------------------");
							
					aa.debug("Address Type :", addressModel.getAddressType());
					aa.debug("Address Line1 :", addressModel.getAddressLine1());
					aa.debug("Address Line2 :", addressModel.getAddressLine2());
					aa.debug("Address Line3 :", addressModel.getAddressLine3());
					aa.debug("City :", addressModel.getCity());
					aa.debug("CountryCode :", addressModel.getCountryCode());
					aa.debug("Effective Date :", addressModel.getEffectiveDate());
					aa.debug("Entity ID :", addressModel.getEntityID());
					aa.debug("Entity Type :", addressModel.getEntityType());
					aa.debug("Fax :", addressModel.getFax());
					aa.debug("FaxCountryCode :", addressModel.getFaxCountryCode());
					aa.debug("FullAddress :", addressModel.getFullAddress());
					aa.debug("House Number Alpha End :", addressModel.getHouseNumberAlphaEnd());
					aa.debug("House Number Alpha Start :", addressModel.getHouseNumberAlphaStart());
					aa.debug("House Number End :", addressModel.getHouseNumberEnd());
					aa.debug("House Number Start :", addressModel.getHouseNumberStart());
					aa.debug("Level Number End :", addressModel.getLevelNumberEnd());
					aa.debug("Level Number Start :", addressModel.getLevelNumberStart());
					aa.debug("Level Prefix :", addressModel.getLevelPrefix());
					aa.debug("Phone :", addressModel.getPhone());
					aa.debug("Primary :", addressModel.getPrimary());
					aa.debug("State :", addressModel.getState());
					aa.debug("Street Direction :", addressModel.getStreetDirection());
					aa.debug("Street Name :", addressModel.getStreetName());
					aa.debug("Street Prefix :", addressModel.getStreetPrefix());
					aa.debug("Street Suffix :", addressModel.getStreetSuffix());
					aa.debug("Unit nd :", addressModel.getUnitEnd());
					aa.debug("Unit Type :", addressModel.getUnitType());
					aa.debug("Zip :", addressModel.getZip());
				}
			}		
		}
	}		
}
aa.debug("--------------------------------------print people attributes---------------------------------------","----------------------------------------");
if (peopleAttributes != null)
{
	for (var i = 0; i < peopleAttributes.length; i++)
	{
		var peopleAttr = peopleAttributes[i];
		for(var j = 0; j < peopleAttr.size(); j++)
		{
			var attribute = peopleAttr.get(i);
			aa.debug("Attribute Label :", attribute.getAttributeLabel());
			aa.debug("Attribute Name :", attribute.getAttributeName());
			aa.debug("Attribute Template Name :", attribute.getAttributeTemplateName());
			aa.debug("Attribute Unit Type :", attribute.getAttributeUnitType());
			aa.debug("AttributeValue :", attribute.getAttributeValue());
			aa.debug("Attribute Value Data Type :", attribute.getAttributeValueDataType());
			aa.debug("Contact No :", attribute.getContactNo());
			aa.debug("Contact Type :", attribute.getContactType());
			aa.debug("Display Order :", attribute.getDisplayOrder());
			aa.debug("Vch Flag :", attribute.getVchFlag());
			aa.debug("Audit ID :", attribute.getAuditID());
			aa.debug("Audit Date :", attribute.getAuditDate());
			aa.debug("AttributeValueReqFlag :", attribute.getAttributeValueReqFlag());
			aa.debug("Audit Status :", attribute.getAuditStatus());
		}			
	}
}
aa.debug("--------------------------------------print license info---------------------------------------","----------------------------------------");
if (licenseList != null)
{
	for (var i = 0; i < licenseList.length; i++)
	{
		var license = licenseList[i];		
		aa.debug("License Address1 :", license.getAddress1());
		aa.debug("License Address2 :", license.getAddress2());
		aa.debug("License Address3 :", license.getAddress3());
		aa.debug("License Agency Code :", license.getAgencyCode());
		aa.debug("Audit Date :", license.getAuditDate());
		aa.debug("Audit ID :", license.getAuditID());
		aa.debug("Audit Status :", license.getAuditStatus());
		aa.debug("Birth Date :", license.getBirthDate());
		aa.debug("Business License :", license.getBusinessLicense());
		aa.debug("Business License ExpDate :", license.getBusinessLicExpDate());
		aa.debug("Business Name :", license.getBusinessName());
		aa.debug("City :", license.getCity());
		aa.debug("Contact FirstName :", license.getContactFirstName());
		aa.debug("Contact MiddleName :", license.getContactMiddleName());
		aa.debug("Contact LastName :", license.getContactLastName());
		aa.debug("License No :", license.getContrLicNo());
		aa.debug("Country :", license.getCountry());
		aa.debug("License Type :", license.getLicenseType());
		aa.debug("Fein :", license.getFein());
		aa.debug("EMail :", license.getEMailAddress());
		aa.debug("LicState :", license.getLicState());
		aa.debug("Type lag :", license.getTypeFlag());
		aa.debug("License Board :", license.getLicenseBoard());
		aa.debug("License State :", license.getLicState());
	}
}

function printPeopleASIT(people)
{
	var template = people.getTemplate();

	if(template == null || template.getTemplateTables() == null || templateGroupList.size() == 0)
	{
		return;
	}

	var templateGroupList = template.getTemplateTables();
        for(var i = 0; i < templateGroupList.size(); i++)
	{
		var templateGroup = templateGroupList.get(i);
		var subGroupsList = templateGroup.getSubgroups();

		if(subGroupsList != null && subGroupsList.size() >0)
		{
			for(var j =0;j<subGroupsList.size(); j++)
			{
				var rows = subGroupsList.get(j).getRows();

				if(rows != null && rows.size() > 0)
				{
					for(var x =0;x < rows.size(); x++)
					{
						var tableValues = rows.get(x).getValues();

						if(tableValues != null && tableValues.size() > 0)
                                                {
                                                        for(var s =0;s < tableValues.size(); s++)
						     {
							  var templateTable = tableValues.get(s);
							  aa.debug("-------- Display value-------- ",templateTable.getValue());
						     }
						}

					}
				}
			}
		}
	}

}

function printPeopleASI(people)
{
	var template = people.getTemplate();

	aa.debug("-----------------------------------------1111--------------------------------------------------------------","-----------");

	if(template == null || template.getTemplateForms() == null)
	{
		return;
	}

	var templateForms =  template.getTemplateForms();

	for(var i = 0; i< templateForms.size();i++)
	{
		aa.debug("-----------------------------------------2222--------------------------------------------------------------","-----------");
		var Subgroups = templateForms.get(i).getSubgroups();
		for(var j = 0; j<Subgroups.size(); j++)
		{
			var fields = Subgroups.get(j).getFields();
			for(var x = 0 ;x<fields.size();x++)
			{
				var field = fields.get(x);
				aa.debug("-- getDisplayFieldName() --",field.getDisplayFieldName());
				aa.debug("-- getDefaultValue() --",field.getDefaultValue());
			}

		}
	}
}

function printContactAttribute(peopleModel)
{
aa.debug("-------------gets 1--------------------------", "-----");
	var attributes = peopleModel.getAttributes();
	aa.debug("-------------attributes---------------",attributes);
	if(attributes != null && attributes.size() > 0)
	{
	aa.debug("-------------gets 2--------------------------", "-----");
		for(var i =0 ; i < attributes.size(); i++)
		{
		var attr = attributes.get(i);
		aa.debug("---------name-------------",attr.getAttributeName());
		aa.debug("---------value-------------",attr.getAttributeValue());
		aa.debug("---------label-------------",attr.getAttributeLabel());
		}
	}
}

aa.debug("-----------------------------RUN EMSE END--------------------------", "-------------------------------------------------");

//aa.env.setValue("ScriptReturnCode","-1");
//aa.env.setValue("ScriptReturnMessage", "Registration Public User Submit Before is fail!");