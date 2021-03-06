var capTypeList = aa.env.getValue("CapTypeList");
var totalAmount = aa.env.getValue("TotalAmount");

var capTypeIterator = capTypeList.iterator();

var i = 0;
while (capTypeIterator.hasNext())
{
	i++;
	var capType = capTypeIterator.next();
	var merchantAccountResult = aa.finance.getMerchantAccInfo(capType);
	if(merchantAccountResult.getSuccess())
	{
		var merchantAccount = merchantAccountResult.getOutput();
		if(merchantAccount)
		{
			aa.print("principalAccName" + i + "=" + merchantAccount.getPrincipalAccName() + ";");	
		}
	}	
}

aa.env.setValue("ErrorCode","-1");
aa.env.setValue("ErrorMessage", "Shopping cart check out EMSE.");