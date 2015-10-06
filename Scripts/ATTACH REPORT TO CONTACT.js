var report  = aa.reportManager.getReportInfoModelByName("CrystalCliff_accela");
report = report.getOutput();
report.setCapId("14CAP-00000-005MP");
report.setModule("Building");
aa.reportManager.getReportResult(report);