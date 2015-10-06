var fromCapID = aa.cap.getCapID('14CAP','00000','003F3').getOutput();
var capID = aa.cap.getCapID('14CAP','00000','003FP').getOutput();
var result = aa.cap.copyRenewCapDocument(fromCapID, capID, 'ADMIN');