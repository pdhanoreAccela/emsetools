var parcelModel = aa.env.getValue("parcelModel");
var parcelValidatedNumber = parcelModel.getRefParcelId(); 
var conditionType = 'EMSE type';
var conditionName = 'EMSE stdconlock/hold/required/notice';
var conditionComment = 'abc test abc test';
var severity = 'Notice';
var conditionStatus = 'Applied';

//var conditionNumber = aa.addressCondition.addAddressCondition(parcelValidatedNumber, conditionType, conditionName, conditionComment, null, null, severity,
//   conditionStatus, null, null, null, null, null, null).getOutput();
   
//aa.print('New Condition ID:' + conditionNumber);

var stdConditionType = 'EMSE type';
var stdConditionName = 'EMSE stdconlock/hold/required/notice';

                var stdConditionList = aa.capCondition.getStandardConditions(stdConditionType, stdConditionName).getOutput();
                if (stdConditionList != null && stdConditionList.length > 0)
                {
                                var stdCondition = stdConditionList[0];
                                var stdConditionNumber = stdCondition.getConditionNbr();
                                
                                // Step 3: Create a new condition from standard condition
                                var result = aa.parcelCondition.createParcelConditionFromStdCondition(parcelValidatedNumber , stdConditionNumber);
                                if (result.getSuccess())
                                {
                                                conditionNumber = result.getOutput();
                                                aa.print('New address condition ID: ' + conditionNumber);
                                }
                }