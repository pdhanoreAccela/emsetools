var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
var message = "==<br>";
getContactArray();

aa.env.setValue("ErrorCode", "1");
aa.env.setValue("ErrorMessage", message);

function getContactArray()
	{
	// Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
	// optional capid
	var thisCap = capId;
	if (arguments.length == 1) thisCap = arguments[0];

	var cArray = new Array();

	if (arguments.length == 0 && !cap.isCompleteCap()) // we are in a page flow script so use the capModel to get contacts
		{
		capContactArray = cap.getContactsGroup().toArray() ;
		}
	else
		{
		var capContactResult = aa.people.getCapContactByCapID(thisCap);
		if (capContactResult.getSuccess())
			{
			var capContactArray = capContactResult.getOutput();
			}
		}
	
	if (capContactArray)
	{
		for (yy in capContactArray)
			{
			var aArray = new Array();
			aArray["lastName"] = capContactArray[yy].getPeople().lastName;
			aArray["firstName"] = capContactArray[yy].getPeople().firstName;
			aArray["middleName"] = capContactArray[yy].getPeople().middleName;
			aArray["businessName"] = capContactArray[yy].getPeople().businessName;
			aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
			aArray["contactType"] =capContactArray[yy].getPeople().contactType;
			aArray["relation"] = capContactArray[yy].getPeople().relation;
			aArray["phone1"] = capContactArray[yy].getPeople().phone1;
			aArray["phone2"] = capContactArray[yy].getPeople().phone2;
                        
			var pa = new Array();
			
			if (arguments.length == 0 && !cap.isCompleteCap()) // using capModel to get contacts
			{ 
			       if (capContactArray != null && capContactArray[yy] != null && capContactArray[yy].getPeople() != null && capContactArray[yy].getPeople().getAttributes() != null && capContactArray[yy].getPeople().getAttributes().size() > 0)
			       {
					pa = capContactArray[yy].getPeople().getAttributes().toArray();
				}
			}
			else
			{
			       if (capContactArray != null && capContactArray[yy] != null && capContactArray[yy].getPeople() != null && capContactArray[yy].getPeople().getAttributes() != null && capContactArray[yy].getPeople().getAttributes().size() > 0)
			       {
					pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
				}
			}

	                for (xx1 in pa)
                   		aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
			cArray.push(aArray);
			}
		}

         if (cArray != null && cArray.length > 0) 
         { 
           for (var i = 0; i< cArray.length; i++)
           {
                message += cArray[i]["firstName"]+ "|" + cArray[i]["DATE"] + "<br>";
           }
         }
         else
         {
             message += " Empty contact values";
         }
	return cArray;
}