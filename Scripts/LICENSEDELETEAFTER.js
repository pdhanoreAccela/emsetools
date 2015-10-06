aa.print("--------------public user Field---------------");
aa.print("-------------------START--------");
var strPublicUserNum= aa.env.getValue("strPublicUserNum");
var serviceProviderCode = aa.env.getValue("serviceProviderCode");
var licenseTypes = aa.env.getValue("licenseTypes");

aa.publicUser.deleteDiscipline(strPublicUserNum, serviceProviderCode, licenseTypes);