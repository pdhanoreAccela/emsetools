var assetDataModel = aa.env.getValue("AssetMasterPK");				// Asset Triggered event
aa.print(assetDataModel.toString());
aa.print(assetDataModel.getClass().toString());
updateTwitterStatus();
getHomeTimeline();
aa.print("**********************************************");
for (m in assetDataModel)
	aa.print(m + ": " + assetDataModel[m] + "<br>");

function updateTwitterStatus()
{
	var client = aa.oAuthClient;

	var oauthProviderCode = 'TWITTER';
	var url = 'https://api.twitter.com/1/statuses/update.json';
	var params = client.initPostParameters();
	params.put('status', 'This is a message sent fromV360!');

	var scripResult = client.post(oauthProviderCode, url, params);
	if (scripResult.getSuccess())
	{
	    aa.print("Success: " + scripResult.getOutput());
	}
	else
	{
	    aa.print("Failure: " + scripResult.getErrorMessage());
	}          
}

//Sample of Get request
function getHomeTimeline()
{
	var client = aa.oAuthClient;
	
	var providerCode = 'TWITTER';
	var url = 'https://api.twitter.com/1/statuses/user_timeline.json';

	var scripResult = client.get(providerCode, url);
	if (scripResult.getSuccess())
	{
	    aa.print("Success: " + scripResult.getOutput());
	}
	else
	{
	    aa.print("Failure: " + scripResult.getErrorMessage());
	}
}