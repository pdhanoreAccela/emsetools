var asiTableDrillDownModelResult = aa.asiDrillDown.getASITableDrillDownModel();
var asiTableDrillDownModel = '';
if (asiTableDrillDownModelResult .getSuccess())
{
  asiTableDrillDownModel = asiTableDrillDownModelResult.getOutput();
  asiTableDrillDownModel.setDrillName("abeltestDrillName"); 
  asiTableDrillDownModel.setEntityKey1("AP_NEW");
  asiTableDrillDownModel.setEntityKey2("SALES&PROMO");
  asiTableDrillDownModel.setDrillType("APPLICATION");
  asiTableDrillDownModel.setApplyTo("ALL");
  asiTableDrillDownModel.setRecStatus("A");
  asiTableDrillDownModel.setPrimaryFlag("Y")
}

var result = aa.asiDrillDown.createASIDrillDown(asiTableDrillDownModel);
if(result.getSuccess())
{
	aa.print(" Add Success");	
	aa.print("-----------------------------------------------------------------");
	var asiTableDrillDownModelResult1 = aa.asiDrillDown.getASITableDrillDownModel();
	var asiTableDrillDownModel1 = '';
	if (asiTableDrillDownModelResult1 .getSuccess())
	{
	  asiTableDrillDownModel1 = asiTableDrillDownModelResult1.getOutput();
	  asiTableDrillDownModel1.setDrillName("testDrillName"); 
	  asiTableDrillDownModel1.setRecStatus("A");
	}
	var result1 = aa.asiDrillDown.getASIDrillDown(asiTableDrillDownModel1);
	var asiDrillDownList = result1.getOutput();
	if (asiDrillDownList != null)
	{
		var its = asiDrillDownList.iterator();
		while(its.hasNext())
		{
			var asiDrillDown = its.next();
			aa.print(" ASI Drill Id :" + asiDrillDown.getDrillId());
			
			aa.print("-----------------------------------------------------------------");
		}
	}
}
else
{
	//If create fail, then print the error message.
	aa.print(result.getErrorMessage());
}