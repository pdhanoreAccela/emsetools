var sql = "Select name, age from person";

var selectResult = aa.util.select("custom", sql, null);

if(selectResult.getSuccess())
{
 var selectOutput = selectResult.getOutput();

 for(var i=0; i<selectOutput.size(); i++)
 {
   var eachRecord = selectOutput.get(i);
   aa.print(eachRecord.get("NAME"));
   aa.print(eachRecord.get("AGE"));
 }
}
else
{
 aa.print("Get records from custom db failed!")
}