aa.debug("===========================TEST=========", null);
var cap = aa.env.getValue("CapModel");
var LPID = null;
if (cap.getLicenseProfessionalModel() != null)
  LPID = cap.getLicenseProfessionalModel().getLicenseNbr();
aa.debug("Licensed Professional ID is==========" + LPID, null);
