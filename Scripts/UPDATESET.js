var setCode = "ASHLEYTEST";				
var setName = "SKY TEST";				
var setComments = "SKY EDIT BY EMSE";				
				
//Update Set.				
var result = aa.set.updateSet(setCode,setName,setComments);				
				
if(result.getSuccess())				
{				
	//If Update Set Successfully.			
	aa.print("Update Successfully");			
}				
else				
{				
	//If Activate fail, then print the error message.			
	aa.print(result.getErrorMessage());			
}