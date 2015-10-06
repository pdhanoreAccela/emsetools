//-------------------------------------------Parameters-----------------------------------------------------------------------//

//You must provide report name.
var reportName = "CrystalCliff_accela";

//You must provide cap id.
var capID = "14CAP-00000-00A7O";

//You must provide module name.
var moduleName = "Building";

//-----------------------------------------------------------------------------------------------------------------------------//
var report = aa.reportManager.getReportInfoModelByName(reportName );
report = report.getOutput();
report.setCapId(capID);
report.setModule(moduleName );
aa.reportManager.getReportResult(report);