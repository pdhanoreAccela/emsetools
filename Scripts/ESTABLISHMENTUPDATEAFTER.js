var test = "ddd"

try
{
    aa.print("test = " + test);
    var intTest = parseInt(test);
    aa.print("intTest = " + intTest);
}
catch(e)
{
   aa.print("exception......");
   aa.print("e = " + e);
}

try
{
   aa.set.saveSetTypeTest1();
}
catch(e)
{
   aa.print("e = " + e);
}

aa.print("end........");

aa.env.setValue("ScriptReturnCode","0");

aa.env.setValue("ScriptReturnMessage", "DocumentReviewUpdateAfter End，为什么-1也弹出来！！！");