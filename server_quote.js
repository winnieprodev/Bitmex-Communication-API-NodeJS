
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var gSymbol = "";
var payload = require('./symbols.json');
payload = ['XBTUSD'];

var html5websocket = require('html5-websocket');
var reconnectingwebsocket = require('reconnecting-websocket');

var BASE = 'wss://www.bitmex.com/realtime';

//initialize app
app.all('/*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(express.static(__dirname + '/'));
app.use('/setSymbol', function (req, res) {
	gSymbol = req.body.symbol;
	res.send(snapshot[gSymbol]);
});

app.use('/getSymbol', function (req, res) {
	res.send(payload);
});

app.use('/writeSymbol', function (req, res) {
	var newSymbols = req.body.symbols;
	var newSymbols = JSON.stringify(newSymbols);
	fs.writeFile('./symbols.json', newSymbols, function(err){
		if(err){
			res.send('no');
		}else{
			res.send('yes');
		}
	});
});

var initdata = [];
var snapshot = {};
var depth_result = {};

//websocket initialize
var w = new reconnectingwebsocket('wss://www.bitmex.com/realtime?subscribe=quoteBin1d,quote:XBTUSD', undefined, {
		    connectionTimeout: 4E3,
		    constructor: typeof window !== 'undefined' ? WebSocket : html5websocket,
		    debug: false,
		    maxReconnectionDelay: 10E3,
		    maxRetries: Infinity,
		    minReconnectionDelay: 4E3
		  });

w.onopen = function()
{
	console.log('connected');
}

var cnt = 0;
w.onmessage =  function(message){
	
	var main_data = JSON.parse(message.data);
	console.log(main_data);
	if(main_data.action && main_data.action  == 'partial')
	{
		initdata = main_data.data;
		console.log(initdata);
		var sell = []; var buy = [];
		for(var index = 0; index<initdata.length;index++)
		{
			if(!snapshot[initdata[index].symbol])
			{
				snapshot[initdata[index].symbol] = {};
				snapshot[initdata[index].symbol].symbol = initdata[index].symbol;
				snapshot[initdata[index].symbol].askDepth = [];
				snapshot[initdata[index].symbol].bidDepth = [];
			}

			
			if(snapshot[initdata[index].symbol].askDepth.length > 20)
			{
				continue;
			}
			snapshot[initdata[index].symbol].askDepth.push({
				id:initdata[index].id,
				price:initdata[index].askPrice,
				quantity:initdata[index].askSize
			});
			
			snapshot[initdata[index].symbol].bidDepth.push({
				id:initdata[index].id,
				price:initdata[index].bidPrice,
				quantity:initdata[index].bidSize
			});
		}
		depth_result = snapshot;
		//console.log(initdata.length);
		//console.log(initdata);
		//console.log(initdata.slice(0,100));
		// initdata.map(function(value){
		// 	if(!snapshot[value.symbol])
		// 	{
		// 		snapshot[value.symbol] = {};
		// 		snapshot[value.symbol].symbol = value.symbol;
		// 	}

		// 	if(value.side == 'Buy')
		// 	{
		// 		if(!snapshot[value.symbol].bidDepth)
		// 		{
		// 			snapshot[value.symbol].bidDepth = [];	
		// 		}
		// 		if(snapshot[value.symbol].bidDepth.length < 50)
		// 		{
		// 			snapshot[value.symbol].bidDepth.push({
		// 				price:value.price,
		// 				quantity:value.size
		// 			})
		// 		}	
		// 	}

		// 	if(value.side == 'Sell')
		// 	{
		// 		if(!snapshot[value.symbol].askDepth)
		// 		{
		// 			snapshot[value.symbol].askDepth = [];	
		// 		}
		// 		if(snapshot[value.symbol].askDepth.length < 50)
		// 		{
		// 			snapshot[value.symbol].askDepth.push({
		// 				price:value.price,
		// 				quantity:value.size
		// 			})
		// 		}	
		// 	}
			
		// })

	}
	else if(cnt > 3)
	{
		if(main_data.action == 'update')
		{
			depth_result = update_depthdata(depth_result,main_data.data);
		}
		else if(main_data.action == 'insert')
		{
			depth_result = insert_depthdata(depth_result,main_data.data);
			
		}
		else if(main_data.action == 'delete')
		{
			main_data.data.map(function(value){
				if(value.side == 'Sell' && depth_result[value.symbol])
				{
					depth_result[value.symbol].askDepth = delete_depthdata(depth_result[value.symbol].askDepth,main_data.data);
				}
				else if(value.side == 'Buy' && depth_result[value.symbol])
				{
					depth_result[value.symbol].bidDepth = delete_depthdata(depth_result[value.symbol].bidDepth,main_data.data);
				}	
			})
			
		}

		websocketList.forEach(ws=>{
			ws.emit('new_message',depth_result['XBTUSD']);
		})
	}
	cnt++;

	
	// var main_data = JSON.parse(message);
	// console.log(main_data);
	// if(main_data.event)
	// {
	// 	if(main_data.chanId)
	// 	{
	// 		id_array[main_data.chanId] = main_data.symbol;
	// 	}
	// }
	// else
	// {
	// 	if(!snapshot[id_array[main_data[0]]])
	// 	{
	// 		snapshot[id_array[main_data[0]]] = {};
	// 		var ask = [];
	// 		var buy = [];

	// 		for(var i = 0; i < main_data[1].length; i ++)
	// 		{
	// 			if(main_data[1][i][2] > 0)
	// 			{
	// 				buy.push({
	// 					price:main_data[1][i][0],
	// 					quantity:main_data[1][i][2]
	// 				})
	// 			}
	// 			else
	// 			{
	// 				ask.push({
	// 					price:main_data[1][i][0],
	// 					quantity:Math.abs(main_data[1][i][2])
	// 				})
	// 			}
	// 		}

	// 		snapshot[id_array[main_data[0]].substr(1)] = {
	// 			askDepth:ask,
	// 			bidDepth:buy,
	// 			symbol:id_array[main_data[0]].substr(1)
	// 		};

	// 		depth[id_array[main_data[0]].substr(1)] = {
	// 			askDepth:ask,
	// 			bidDepth:buy,
	// 			symbol:id_array[main_data[0]].substr(1)
	// 		};
	// 	}
	// 	else
	// 	{
	// 		var arr = main_data[1];
	// 		if(id_array[main_data[0]] == 't' + gSymbol)
	// 		{
	// 			websocketList.forEach(ws=>{
	// 				if(arr[0] != 'h')
	// 				{
	// 					if(arr[2] > 0)
	// 					{
	// 						if(arr[2] == 1 && arr[1] == 0)
	// 						{
	// 							depth[id_array[main_data[0]].substr(1)].bidDepth = delete_array(depth[id_array[main_data[0]].substr(1)].bidDepth,arr[0]);
	// 						}
	// 						else
	// 						{
	// 							depth[id_array[main_data[0]].substr(1)].bidDepth = set_array(depth[id_array[main_data[0]].substr(1)].bidDepth,arr[0],arr[2]);
	// 						}
	// 					}
	// 					else
	// 					{
	// 						if(arr[2] == -1 && arr[1] == 0)
	// 						{
	// 							depth[id_array[main_data[0]].substr(1)].askDepth = delete_array(depth[id_array[main_data[0]].substr(1)].askDepth,arr[0]);
	// 						}
	// 						else
	// 						{
	// 							depth[id_array[main_data[0]].substr(1)].askDepth = set_array(depth[id_array[main_data[0]].substr(1)].askDepth,arr[0],Math.abs(arr[2]));
	// 						}
	// 					}

	// 					console.log(depth[id_array[main_data[0]].substr(1)]);
	// 					ws.emit("new_message",depth[id_array[main_data[0]].substr(1)]);
	// 				}
	// 			})	
	// 		}
			
	// 	}	
	// }
};


//data initailize


var id_array = {};
var snapshot = {};
var depth = {};

//server initialize
var http = require('http');
var fs = require('fs');

var websocketList = [];
var orderbooksize =50;



// Loading the index file . html displayed to the client
var server = http.createServer(app);


// Loading socket.io
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
	 websocketList.push(socket);
});


server.listen(3000);


function delete_depthdata(array,value)
{

	var index = array.findIndex(function(element){
		return element.price == value.bidPrice;
	})

	if(index > -1)
	{
		array = array.splice(index,1);
	}
	return array;
}

function insert_depthdata(array,value)
{
	var sell_add = [];
	var buy_add = [];
	
	console.log(value);
	value.map(function(info){
			if(!array[info.symbol])
			{
				var info_array_ask = {
					price:info.askPrice,
					quantity:info.askSize
				}

				var info_array_depth = {
					price:info.bidPrice,
					quantity:info.bidSize
				}

				array[info.symbol] = {};
				array[info.symbol].symbol = info.symbol;
				array[info.symbol].bidDepth = [info_array_depth];
				array[info.symbol].askDepth	 = [info_array_ask];
			}
			else
			{
				var index_update = array[info.symbol].askDepth.findIndex(function(element){
					return element.price == info.askPrice;
				})

				var index_tmp = array[info.symbol].askDepth.findIndex(function(element){
					return element.price > info.askPrice;
				})

				var info_array = {
					price:info.askPrice,
					quantity:info.askSize
				};

				console.log(index_tmp);
				if(index_update > -1)
				{
					array[info.symbol].askDepth[index_update] = info_array;	
				}
				else if(index_tmp > -1)
				{
					array[info.symbol].askDepth.splice(index_tmp,0,info_array);
				}
				else
				{
					array[info.symbol].askDepth.push(info_array);
				}
				array[info.symbol].askDepth = array[info.symbol].askDepth.slice(0,Math.min(array[info.symbol].askDepth.length,30));

				info_array = {
					price:info.bidPrice,
					quantity:info.bidSize
				}
				var index_update = array[info.symbol].bidDepth.findIndex(function(element){
					return element.price == info.bidPrice;
				})

				var index_tmp = array[info.symbol].bidDepth.findIndex(function(element){
					return element.price < info.bidPrice;
				})

				if(index_update > -1)
				{
					array[info.symbol].bidDepth[index_update] = info_array;	
				}
				else if(index_tmp > -1)
				{
					array[info.symbol].bidDepth.splice(index_tmp,0,info_array);
				}
				else
				{
					array[info.symbol].bidDepth.push(info_array);
				}
				array[info.symbol].bidDepth = array[info.symbol].bidDepth.slice(0,Math.min(array[info.symbol].askDepth.length,30));
			}
		})
			
			
	return array;
}

function update_depthdata(array,value)
{
	value.map(function(info){
		
	})

	return array;
}