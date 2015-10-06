capID1="14CAP";
capID2="00000";
capID3="001SW";
capIDObj = aa.cap.getCapID(capID1,capID2,capID3).getOutput();
rs= aa.cap.isPendingValidationRecord(capIDObj);
if(rs.getSuccess())
{
 aa.print(rs.getOutput());
}
else
{
  aa.print("fail");
  aa.print("ERROR: " + rs.getErrorMessage()); 
}