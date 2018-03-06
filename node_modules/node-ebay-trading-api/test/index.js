var ebayTradingAPI = require('../index');

console.log(ebayTradingAPI.getUserToken());

ebayTradingAPI.setUserToken("adfsafdsaf");

console.log(ebayTradingAPI.getUserToken());

var config = require('./config.json');

ebayTradingAPI.setUserToken(config.eBayAuthToken);

console.log(ebayTradingAPI.getUserToken());

/*ebayTradingAPI.call(
	"GetItem",
	{
		"ItemID" : 251636383648
	},
	function(result){
		console.log(result);
	}
);

*/ebayTradingAPI.debug(true);
ebayTradingAPI.toggleSandbox(true);

ebayTradingAPI.call(
	"GetItem",
	{
		"ItemID" : 281943173365
	},
	function(result){
		console.log(result);
	}
);

