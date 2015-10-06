// 10ACC-04228 Test APO template and People(Contact, LicenseProfessional) template.
testAPO_PeopleTemplate();

function testAPO_PeopleTemplate()
{
	var servProvCode = aa.getServiceProviderCode();
	var capId = getRecordId();
	
	aa.print(capId.toString());
	
	loadAddressWithAttributes(capId);
	
	loadParcelAttributes(capId);
	
	loadOwnerWithAttributes(capId);
	
	loadContactWithAttributes(capId);
	
	loadLicenseProfessionalWithAttributes(capId);
}

function getRecordId()
{
    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
    {
      return s_capResult.getOutput();
    }
    else
    {
      aa.print("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
}

function loadAddressWithAttributes(capId)
{
	var capAddResult = aa.address.getAddressWithAttributeByCapId(capId);
	if (capAddResult.getSuccess())
	{
		var Adds = capAddResult.getOutput();
		for (zz in Adds)
		{
			var addressAttributes = Adds[zz].getAttributes();
			if (addressAttributes != null && addressAttributes.size() > 0)
			{
				aa.print("ADDRESS attributes: ");
				var addressAttributesArr = addressAttributes.toArray();
				for (z in addressAttributesArr)
		  		{
					aa.print("ADDRESS -- " + addressAttributesArr[z].getB1AttributeName() + " = " + addressAttributesArr[z].getB1AttributeValue());
		        }
			}
			else
			{
				aa.print("ADDRESS's Template is empty.");
			}
        }
    }
}

function loadParcelAttributes(capId)
{
	var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
   	if (capParcelResult.getSuccess())
   		var fcapParcelObj = capParcelResult.getOutput().toArray();
   	else
     	aa.print("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())
  	
  	for (i in fcapParcelObj)
  	{
  		parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
  		for (z in parcelAttrObj)
  		{
			aa.print("PARCEL -- " + parcelAttrObj[z].getB1AttributeName() + " = " + parcelAttrObj[z].getB1AttributeValue());
        }
    }
}

function loadOwnerWithAttributes(capId)
{
	var ownrReq = aa.owner.getOwnerByCapId(capId);
	if(ownrReq.getSuccess())
	{
		var ownrObj = ownrReq.getOutput();
		for (xx in ownrObj)
		{
			var oAttributeArr = ownrObj[xx].getAttributes();
			if (oAttributeArr != null && oAttributeArr.length > 0)
			{
				for (z in oAttributeArr)
		  		{
					aa.print("OWNER -- " + oAttributeArr[z].getAttributeName() + " = " + oAttributeArr[z].getAttributeValue());
		        }
			}
		}
	}
}

function loadContactWithAttributes(capId)
{
	var capContactResult = aa.people.getCapContactByCapID(capId);
	if (capContactResult.getSuccess())
	{
		contactsArray = capContactResult.getOutput();
		for (yy in contactsArray)
		{
			var attributeCollection = contactsArray[yy].getPeople().getAttributes();
			if (attributeCollection != null && attributeCollection.size() > 0)
			{
				var attributeArr = attributeCollection.toArray();
				for (z in attributeArr)
		  		{
					aa.print("Contact -- " + attributeArr[z].getAttributeName() + " = " + attributeArr[z].getAttributeValue());
		        }
			}
		}
	}
}

function loadLicenseProfessionalWithAttributes(capId)
{
	var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
	if (capLicenseResult.getSuccess())
	{
		var capLicenseArr = capLicenseResult.getOutput();
    }
	else
	{
		aa.print("**ERROR: getting lic prof: " + capLicenseResult.getErrorMessage()); 
        return false;
    }

	if (capLicenseArr == null || !capLicenseArr.length)
	{
        aa.print("**WARNING: no licensed professionals on this CAP"); 
    }
	else
	{
		for (var thisLic in capLicenseArr)
        {
			aa.print(capLicenseArr[thisLic].getLicenseType());
			var lpAttributesArr = capLicenseArr[thisLic].getAttributes();
			if (lpAttributesArr != null && lpAttributesArr.length > 0)
			{
				for (z in lpAttributesArr)
		  		{
					aa.print("LicenseProfessional -- " + lpAttributesArr[z].getAttributeName() + " = " + lpAttributesArr[z].getAttributeValue());
		        }
			}
        }
    }
}
