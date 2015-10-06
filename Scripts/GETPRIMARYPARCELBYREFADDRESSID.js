actionResult = aa.parcel.getPrimaryParcelByRefAddressID(addressID,"");
if (actionResult.getSuccess()) {
   aa.print("Success");
               }    
else {
    aa.print("Failed:" + actionResult.getErrorMessage());
}