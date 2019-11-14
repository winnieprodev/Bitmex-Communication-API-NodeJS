//express initialization
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var filepath = require('fs');


//initialize the websokcet
var html5websocket = require('html5-websocket');
var reconnectingwebsocket = require('reconnecting-websocket');
var websocketList = [];

//initialize the symbol
var gSymbol = "XBTUSD";
var payload = ['XBTUSD'];

//rest api module
var bitmex = require('./order.js');


//initialize the time
// var prehour = 1;
var endtime = new Date();
var starttime = new Date(endtime.getTime() - 60 * 24 * 60 * 1000);
var starthour = new Date(endtime.getTime() - 60 * 60 * 1000);

var depth_result = {};

var depth_data = {'day':{'Buy':[],'Sell':[]},'hour':{'Buy':[],'Sell':[]}};
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

depth_result[gSymbol] = {};
depth_result[gSymbol]['day'] = {bidtotal:0,asktotal:0};
depth_result[gSymbol]['hour'] ={bidtotal:0,asktotal:0};

var totalcount = 0;
var offset = 500;

var daydata = require('./day.json');
var hourdata = require('./hour.json');

var index_buy = -1;
var buytime = 0;
var selltime = 0;
for(var index = daydata.Buy.length-1;index>=0;index--)
{
	if(new Date(daydata.Buy[index].timestamp).getTime() >= new Date().getTime() - 60 * 60 * 24*1000)
	{	
		depth_result[gSymbol]['day'].bidtotal += Number(daydata.Buy[index].size);
		index_buy = index;
		if(buytime == 0)
		{
			buytime = new Date(daydata.Buy[index].timestamp).getTime();	
		}
		
	}
	else
	{
		break;
	}
}

if(index_buy != -1)
{
	depth_data['day']['Buy'] = daydata.Buy.slice(index_buy,daydata.Buy.length);
}
index_sell = -1;

for(var index = daydata.Sell.length-1;index>=0;index--)
{
	if(new Date(daydata.Sell[index].timestamp).getTime() >= new Date().getTime() - 60 * 60 * 24 * 1000)
	{	

		depth_result[gSymbol]['day'].bidtotal += Number(daydata.Sell[index].size);
		index_sell = index;
		if(selltime == 0)
			selltime = new Date(daydata.Sell[index].timestamp).getTime();
	}
	else
	{
		break;
	}
}

if(index_sell == -1)
{
	depth_data['day']['Sell'] = daydata.Sell.slice(index_sell,daydata.Sell.length);
}


if(buytime != 0 || selltime != 0)
{
	starttime = new Date(Math.max(buytime,selltime));
}

index_sell = -1; index_buy = -1;buytime = 0;selltime = 0;
// for(var index = hourdata.Sell.length-1;index>=0;index--)
// {
// 	if(new Date(hourdata.Sell[index].timestamp).getTime() >= new Date().getTime() - 60 * 60 * 1000)
// 	{	
// 		depth_result[gSymbol]['hour'].bidtotal += Number(hourdata.Buy[index].size);
// 		index_buy = index;
// 		if(buytime == 0)
// 			buytime = new Date(hourdata.Buy[index].timestamp).getTime();
// 	}
// 	else
// 	{
// 		break;
// 	}
// }

// if(index_buy != -1)
// {
// 	depth_data['hour']['Buy'] = hourdata.Buy.slice(index_buy,hourdata.Buy.length);
// }

// index_sell = -1;

// for(var index = hourdata.Sell.length-1;index>=0;index--)
// {
// 	if(new Date(hourdata.Sell[index].timestamp).getTime() >= new Date().getTime() - 60 * 60 * 1000)
// 	{	
// 		depth_result[gSymbol]['hour'].asktotal += Number(hourdata.Sell[index].size);
// 		index_sell = index;
// 		if(selltime == 0)
// 			selltime = new Date(hourdata.Sell[index].timestamp).getTime();
// 	}
// 	else
// 	{
// 		break;
// 	}
// }

// if(index_sell != -1)
// {
// 	depth_data['day']['Sell'] = hourdata.Sell.slice(index_sell,hourdata.Sell.length);
// }

// if(buytime != 0 || selltime != 0)
// {
// 	starthour = new Date(Math.max(buytime,selltime));
// }

console.log(starttime);console.log(starthour);
var endtime = new Date(new Date().getTime());
// if(new Date(daydata['BUY'][daydata['Buy'].length - 1]))
get_snapshot(starttime,endtime,'day');
get_snapshot(starthour,endtime,'hour');	



// console.log("trade time:" + endtimestamp);
function get_snapshot(starttime,endtime,type)
{
	var prehour;

	if(type == 'hour')
	{
		prehour = 1;
	}
	else if(type == 'day')
	{
		prehour = 24;
	}
	
	var params = {
		symbol:gSymbol,
		startTime:starttime,
		count:offset
	};

	bitmex.get_trade(params,function(result){
		
		var bidDepth = {};var askDepth = {};
		if(result.success)
		{
			for(var item in result.data)
			{
				if(result.data[item].side == 'Buy')
				{
					depth_result[gSymbol][type].bidtotal += result.data[item].size;
					depth_data[type]['Buy'].push({size:result.data[item].size,timestamp:result.data[item].timestamp});
				}
				else
				{
					if(result.data[item].side == 'Sell')
					{
						depth_result[gSymbol][type].asktotal += result.data[item].size;
						depth_data[type]['Sell'].push({size:result.data[item].size,timestamp:result.data[item].timestamp});
					}
				}
			}

			
	        var buy_count = 0;
	        var sell_count = 0;
			var newdate = new Date();

			var end_time = new Date(newdate.getTime() - 60 * 60 * prehour * 1000);

	  		for (var i = 0; i < depth_data[type]['Buy'].length; i++) {
	  			var buytime = new Date(depth_data[type]['Buy'][i].timestamp);

		        if (buytime.getTime() <= end_time.getTime()) {
		        	buy_count++;
		            depth_result[gSymbol][type].bidtotal -= depth_data[type]['Buy'][i].size;
		        }
		        else
		        {
		        	break;
		        }
		    }

		    var index = depth_data[type]['Buy'].length - 1;
		    
		    for (var i = 0; i < depth_data[type]['Sell'].length; i++) {
	  			var selltime = new Date(depth_data[type]['Sell'][i].timestamp);
		        if (selltime.getTime() <= end_time.getTime()) {
		        	sell_count++;
		            depth_result[gSymbol][type].asktotal -= depth_data[type]['Sell'][i].size;
		        }
		        else
		        {
		        	break;
		        }
		    }
	        
	        //console.log(buy_count + ":" + shell_count);
	        var tmp_buy_count = buy_count;
	        var tmp_shell_count = sell_count;
	        while(buy_count)
	        {
	        	depth_data[type]['Buy'].shift();
	        	buy_count--;
	        }

	        while(sell_count)
	        {
		       	depth_data[type]['Sell'].shift();
	        	sell_count--;
	        }

	        if(Array.isArray(result.data) && result.data.length > 0)
	        {
	        	console.log(type);
	        	tracktime = new Date(new Date(result.data[result.data.length - 1].timestamp).getTime());
	        	if(tracktime.getTime() <= new Date().getTime() - 60 * 60 * 1000 * prehour)
	        	{
	        		tracktime = new Date(new Date().getTime() - 60 * 60 * 1000 * prehour);
	        	}

				console.log(' current time : %s',new Date(new Date().getTime()));	        
				console.log("  track time : %s", tracktime);
				console.log("long  : %s",depth_result[gSymbol][type].bidtotal);
				console.log('short : %s',depth_result[gSymbol][type].asktotal);
				starttime = new Date(tracktime.getTime() + 1);
	        }
	        
	        filepath.writeFile(type + '.json',JSON.stringify(depth_data[type]),function(err){
	        	
	        })
	        websocketList.forEach(ws=>{
	        	console.log({type:type,long:depth_result[gSymbol][type].bidtotal,short:depth_result[gSymbol][type].asktotal});
	        	ws.emit('long_short',{type:type,long:depth_result[gSymbol][type].bidtotal,short:depth_result[gSymbol][type].asktotal});
	        })
	       	endtime = new Date(new Date().getTime());
	       	setTimeout(()=>{
	       		get_snapshot(starttime,endtime,type);	
	       	},200);
       	
		}
		else
		{
			console.log('disconnected');
			setTimeout(()=>{
				get_snapshot(starttime,endtime,type);
			},1000);
		}  
	})
}

// app.use('/getSymbol', function (req, res) {
// 	res.send(payload);
// });

// app.use('/writeSymbol', function (req, res) {
// 	var newSymbols = req.body.symbols;
// 	var newSymbols = JSON.stringify(newSymbols);
// 	fs.writeFile('./symbols.json', newSymbols, function(err){
// 		if(err){
// 			res.send('no');
// 		}else{
// 			res.send('yes');
// 		}
// 	});
// });



// //websocket initialize
// var w = new reconnectingwebsocket('wss://www.bitmex.com/realtime?liquidation:XBTUSD', undefined, {
// 		    connectionTimeout: 4E3,
// 		    constructor: typeof window !== 'undefined' ? WebSocket : html5websocket,
// 		    debug: false,
// 		    maxReconnectionDelay: 10E3,
// 		    maxRetries: Infinity,
// 		    minReconnectionDelay: 4E3
// 		  });

// w.onopen = function()
// {
// }

// var cnt = 0;
// w.onmessage =  function(message){
	

// 	var main_data = JSON.parse(message.data);
	
// 	console.log(main_data);
// 	if(main_data.action && main_data.action  == 'partial')
// 	{
// 		console.log(new Date());
// 		initdata = main_data.data;
// 		var sell = []; var buy = [];
// 		console.log(initdata);
// 		for(var index = 0; index<initdata.length;index++)
// 		{
// 			// console.log(initdata[index]);
// 			if(initdata[index].symbol == 'XBTUSD')
// 			{
// 				//console.log(initdata[index]);
// 			}
			
// 			if(!snapshot[initdata[index].symbol])
// 			{
// 				snapshot[initdata[index].symbol] = {};
// 				snapshot[initdata[index].symbol].symbol = initdata[index].symbol;
// 				snapshot[initdata[index].symbol].askDepth = [];
// 				snapshot[initdata[index].symbol].bidDepth = [];
// 				snapshot[initdata[index].symbol].asktotal = 0;
// 				snapshot[initdata[index].symbol].bidtotal = 0;
// 			}

// 			if(initdata[index].side == 'Sell')
// 			{
// 				snapshot[initdata[index].symbol].asktotal += initdata[index].price * initdata[index].size;
// 			}
// 			else
// 			{
// 				snapshot[initdata[index].symbol].bidtotal += initdata[index].price * initdata[index].size;	
// 			}

// 			if(initdata[index].side == 'Sell')
// 			{
// 				if(snapshot[initdata[index].symbol].askDepth.length > 20)
// 				{
// 					continue;
// 				}

// 				snapshot[initdata[index].symbol].askDepth.push({
// 					id:initdata[index].id,
// 					price:initdata[index].price,
// 					quantity:initdata[index].size
// 				});
// 			}
// 			else
// 			{
// 				if(snapshot[initdata[index].symbol].bidDepth.length > 20)
// 				{
// 					break;
// 				}

// 				snapshot[initdata[index].symbol].bidDepth.push({
// 					id:initdata[index].id,
// 					price:initdata[index].price,
// 					quantity:initdata[index].size
// 				});	
// 			}
// 		}
// 		depth_result = snapshot;
// 		//console.log(initdata.length);
// 		//console.log(initdata);
// 		//console.log(initdata.slice(0,100));
// 		// initdata.map(function(value){
// 		// 	if(!snapshot[value.symbol])
// 		// 	{
// 		// 		snapshot[value.symbol] = {};
// 		// 		snapshot[value.symbol].symbol = value.symbol;
// 		// 	}

// 		// 	if(value.side == 'Buy')
// 		// 	{
// 		// 		if(!snapshot[value.symbol].bidDepth)
// 		// 		{
// 		// 			snapshot[value.symbol].bidDepth = [];	
// 		// 		}
// 		// 		if(snapshot[value.symbol].bidDepth.length < 50)
// 		// 		{
// 		// 			snapshot[value.symbol].bidDepth.push({
// 		// 				price:value.price,
// 		// 				quantity:value.size
// 		// 			})
// 		// 		}	
// 		// 	}

// 		// 	if(value.side == 'Sell')
// 		// 	{
// 		// 		if(!snapshot[value.symbol].askDepth)
// 		// 		{
// 		// 			snapshot[value.symbol].askDepth = [];	
// 		// 		}
// 		// 		if(snapshot[value.symbol].askDepth.length < 50)
// 		// 		{
// 		// 			snapshot[value.symbol].askDepth.push({
// 		// 				price:value.price,
// 		// 				quantity:value.size
// 		// 			})
// 		// 		}	
// 		// 	}
			
// 		// })

// 	}
// 	else if(cnt > 3)
// 	{
// 		if(main_data.action == 'update')
// 		{
// 			websocket_result = update_depthdata(websocket_result,main_data.data);
// 		}
// 		else if(main_data.action == 'insert')
// 		{
// 			websocket_result = insert_depthdata(websocket_result,main_data.data);
			
// 		}
// 		else if(main_data.action == 'delete')
// 		{
// 			main_data.data.map(function(value){
// 				if(value.side == 'Sell' && depth_result[value.symbol])
// 				{
// 					websocket_result[value.symbol].askDepth = delete_depthdata(websocket_result[value.symbol].askDepth,main_data.data);
// 				}
// 				else if(value.side == 'Buy' && depth_result[value.symbol])
// 				{
// 					websocket_result[value.symbol].bidDepth = delete_depthdata(websocket_result[value.symbol].bidDepth,main_data.data);
// 				}	
// 			})
			
// 		}


// 		if(connection)
// 		{
// 			console.log("bidtotal:" + websocket_result['XBTUSD'].bidtotal);
// 			console.log('asktotal:' + websocket_result['XBTUSD'].asktotal);
// 			websocketList.forEach(ws=>{
// 				ws.emit('new_message',websocket_result['XBTUSD']);
// 			})	
// 		}
// 	}
// 	cnt++;
// 	// var main_data = JSON.parse(message);
// 	// console.log(main_data);
// 	// if(main_data.event)
// 	// {
// 	// 	if(main_data.chanId)
// 	// 	{
// 	// 		id_array[main_data.chanId] = main_data.symbol;
// 	// 	}
// 	// }
// 	// else
// 	// {
// 	// 	if(!snapshot[id_array[main_data[0]]])
// 	// 	{
// 	// 		snapshot[id_array[main_data[0]]] = {};
// 	// 		var ask = [];
// 	// 		var buy = [];

// 	// 		for(var i = 0; i < main_data[1].length; i ++)
// 	// 		{
// 	// 			if(main_data[1][i][2] > 0)
// 	// 			{
// 	// 				buy.push({
// 	// 					price:main_data[1][i][0],
// 	// 					quantity:main_data[1][i][2]
// 	// 				})
// 	// 			}
// 	// 			else
// 	// 			{
// 	// 				ask.push({
// 	// 					price:main_data[1][i][0],
// 	// 					quantity:Math.abs(main_data[1][i][2])
// 	// 				})
// 	// 			}
// 	// 		}

// 	// 		snapshot[id_array[main_data[0]].substr(1)] = {
// 	// 			askDepth:ask,
// 	// 			bidDepth:buy,
// 	// 			symbol:id_array[main_data[0]].substr(1)
// 	// 		};

// 	// 		depth[id_array[main_data[0]].substr(1)] = {
// 	// 			askDepth:ask,
// 	// 			bidDepth:buy,
// 	// 			symbol:id_array[main_data[0]].substr(1)
// 	// 		};
// 	// 	}
// 	// 	else
// 	// 	{
// 	// 		var arr = main_data[1];
// 	// 		if(id_array[main_data[0]] == 't' + gSymbol)
// 	// 		{
// 	// 			websocketList.forEach(ws=>{
// 	// 				if(arr[0] != 'h')
// 	// 				{
// 	// 					if(arr[2] > 0)
// 	// 					{
// 	// 						if(arr[2] == 1 && arr[1] == 0)
// 	// 						{
// 	// 							depth[id_array[main_data[0]].substr(1)].bidDepth = delete_array(depth[id_array[main_data[0]].substr(1)].bidDepth,arr[0]);
// 	// 						}
// 	// 						else
// 	// 						{
// 	// 							depth[id_array[main_data[0]].substr(1)].bidDepth = set_array(depth[id_array[main_data[0]].substr(1)].bidDepth,arr[0],arr[2]);
// 	// 						}
// 	// 					}
// 	// 					else
// 	// 					{
// 	// 						if(arr[2] == -1 && arr[1] == 0)
// 	// 						{
// 	// 							depth[id_array[main_data[0]].substr(1)].askDepth = delete_array(depth[id_array[main_data[0]].substr(1)].askDepth,arr[0]);
// 	// 						}
// 	// 						else
// 	// 						{
// 	// 							depth[id_array[main_data[0]].substr(1)].askDepth = set_array(depth[id_array[main_data[0]].substr(1)].askDepth,arr[0],Math.abs(arr[2]));
// 	// 						}
// 	// 					}

// 	// 					console.log(depth[id_array[main_data[0]].substr(1)]);
// 	// 					ws.emit("new_message",depth[id_array[main_data[0]].substr(1)]);
// 	// 				}
// 	// 			})	
// 	// 		}
			
// 	// 	}	
// 	// }

	
// };


// w.onerror = function(error){
// 	console.log(error);
// }


// //data initailize


// var id_array = {};
// var snapshot = {};
// var depth = {};

// //server initialize
var http = require('http');
// var fs = require('fs');

// var orderbooksize =50;



// // Loading the index file . html displayed to the client
 var server = http.createServer(app);


// // Loading socket.io
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
	console.log('connected');
	 websocketList.push(socket);
});


server.listen(3000);


// function delete_depthdata(array,value)
// {
// 	initdata.push(value);


// 	var index = array.findIndex(function(element){
// 		return element.id == value.id;
// 	})

// 	if(index > -1)
// 	{
// 		array = array.splice(index,1);
// 	}
// 	return array;
// }

// function insert_depthdata(array,value)
// {
// 	var sell_add = [];
// 	var buy_add = [];
	

// 	value.map(function(info){

// 		if(info.symbol == 'XBTUSD')
// 		{
// 			//console.log(info);
// 		}
// 		if(info.side == 'Sell')
// 		{
// 			if(!array[info.symbol])
// 			{
// 				var info_array = {
// 					id:info.id,
// 					price:info.price,
// 					quantity:info.size
// 				}

// 				array[info.symbol] = {};
// 				array[info.symbol].symbol = info.symbol;
// 				array[info.symbol].bidDepth = [];
// 				array[info.symbol].askDepth	 = [info_array];

// 				if(info.tickDirection == 'MinusTick' || info.tickDirection == 'ZeroMinusTick')
// 				{
// 					array[info.symbol].asktotal = info.price * info.size;
// 					array[info.symbol].bidtotal = 0;	
// 				}
// 				else
// 				{
// 					array[info.symbol].asktotal = 0;
// 					array[info.symbol].bidtotal = info.price * info.size;		
// 				}
				
// 			}
// 			else
// 			{
// 				var index_update = array[info.symbol].askDepth.findIndex(function(element){
// 					return element.price == info.price;
// 				})

// 				var index_tmp = array[info.symbol].askDepth.findIndex(function(element){
// 					return element.price > info.price;
// 				})

// 				var info_array = {
// 					id:info.id,
// 					price:info.price,
// 					quantity:info.size
// 				};

// 				if(index_update > -1)
// 				{
// 					array[info.symbol].askDepth[index_update].quantity += info_array.quantity;	
// 				}
// 				else if(index_tmp > -1)
// 				{
// 					array[info.symbol].askDepth.splice(index_tmp,0,info_array);
// 				}
// 				else
// 				{
// 					array[info.symbol].askDepth.push(info_array);
// 				}
// 				array[info.symbol].askDepth = array[info.symbol].askDepth.slice(0,Math.min(array[info.symbol].askDepth.length,30));

// 			}
			
// 		}

// 		else
// 		{
// 			if(!array[info.symbol])
// 			{
// 				var info_array = {
// 					id:info.id,
// 					price:info.price,
// 					quantity:info.size
// 				}

// 				array[info.symbol] = {};
// 				array[info.symbol].symbol = info.symbol;
// 				array[info.symbol].bidDepth = [info_array];
// 				array[info.symbol].askDepth	 = [];
// 				array[info.symbol].bidtotal = info.price * info.size;
// 				array[info.symbol].asktotal = 0;
// 			}

// 			else
// 			{
// 				var index_update = array[info.symbol].bidDepth.findIndex(function(element){
// 					return element.price == info.price;
// 				})

// 				var index_tmp = array[info.symbol].bidDepth.findIndex(function(element){
// 					return element.price < info.price;
// 				})

// 				var info_array = {
// 					id:info.id,
// 					price:info.price,
// 					quantity:info.size
// 				};

// 				if(index_update > -1)
// 				{
// 					array[info.symbol].bidDepth[index_update].quantity += info_array.quantity;	
// 				}

// 				else if(index_tmp > -1)
// 				{
// 					array[info.symbol].bidDepth.splice(index_tmp,0,info_array);	
// 				}
// 				else
// 				{
// 					array[info.symbol].bidDepth.push(info_array);	
// 				}
// 				array[info.symbol].bidDepth = array[info.symbol].bidDepth.slice(0,30);	
// 			}
			
// 		}

// 		if(info.tickDirection == 'MinusTick' || info.tickDirection == 'ZeroMinusTick')
// 		{
// 			array[info.symbol].asktotal += info.price * info.size;
// 		}
// 		else
// 		{
// 			array[info.symbol].bidtotal += info.price * info.size;		
// 		}
// 	})

// 	return array;
// }

// function update_depthdata(array,value)
// {
// 	value.map(function(info){
// 		if(info.side == 'Sell' && array[info.symbol])
// 		{
// 			var index_tmp  = array[info.symbol].askDepth.findIndex(function(element){
// 				return element.id == info.id;
// 			})

// 			if(index_tmp > -1)
// 			{
// 				array[info.symbol].askDepth[index_tmp].quantity = info.size;
// 			}
// 		}

// 		if(info.side == 'Buy'  && array[info.symbol])
// 		{
// 			var index_tmp  = array[info.symbol].bidDepth.findIndex(function(element){
// 				return element.id == info.id;
// 			})

// 			if(index_tmp > -1)
// 			{
// 				array[info.symbol].bidDepth[index_tmp].quantity = info.size;
// 			}
// 		}
// 	})

// 	return array;
// }