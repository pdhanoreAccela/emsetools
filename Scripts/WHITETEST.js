// Enter your script here...
aa.batchJob.beginTransaction(10);
var parmArray = new Array();
parmArray[0] = "zeal2";
parmArray[1] = "zeal2";
var sql = "Insert into zeal(aaa, bbb) values(?,?)";
aa.util.update2("default", sql, parmArray)

var parmArray = new Array();
parmArray[0] = "zeal2";
parmArray[1] = "zeal2";
var sql = "Insert into zeal(aa,bb) values(?,?)";
aa.util.update2("custom", sql, parmArray)
aa.batchJob.rollbackTransaction();
