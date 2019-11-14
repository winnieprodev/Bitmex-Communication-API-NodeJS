var request = require('request');
var crypto = require('crypto');
const BASEURL = 'https://www.bitmex.com';

var module_order = {};

//init REST API for use it.

//consist the request for REST API
module_order.request_options = function(opts,path,verb)
{
 	var data = opts;
 	// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
	// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
	
	var postBody = JSON.stringify(data);
	var headers = {
		  'content-type' : 'application/json',
		  'Accept': 'application/json',
		  'X-Requested-With': 'XMLHttpRequest',
		  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
		  // https://www.bitmex.com/app/apiKeysUsage for more details.
		};

	//initialize the header for REST API	
	var requestOptions = {
		  headers: headers,
		  url:BASEURL + path,
		  method: verb,
		  body: postBody
		};	

	return requestOptions;
}	

module_order.get_trade = function(opts,cb)
{
	var path = '/api/v1/trade';
	var verb = 'GET';

	var requestOptions  = this.request_options(opts,path,verb);

	request(requestOptions,function(error,response,body){
		if(error)
		{
			console.log(error);
			cb({
				success:false
			});
		}
		else
		{
			body = JSON.parse(body);
			cb({success:true,data:body});
		}
	})
}

module.exports = module_order;