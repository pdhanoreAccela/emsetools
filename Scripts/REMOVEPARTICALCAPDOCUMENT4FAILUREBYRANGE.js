//get three months before date
var startDate = aa.util.dateDiff(aa.util.now(), "day", -90);
startDate = aa.util.dateDiff(aa.util.now(), "day", -3);
//get one months before date
var endDate =   aa.util.dateDiff(aa.util.now(), "day", -30);
endDate = aa.util.now();
aa.failureDocument.removeFailurePartialCapDocumentByRange(startDate,endDate);