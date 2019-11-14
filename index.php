<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Bitmex</title>
	<link href="assets/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
	<nav class="navbar navbar-default navbar-fixed-top " role="navigation">
		<div class="container">
			<div class="navbar-header">
				<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
				<span class="sr-only">Bitmex</span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				</button>
				<a class="navbar-brand" href="#">Bitmex</a>
			</div>
			<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
				<ul class="nav nav-pills pull-right" role="tablist">
				<li role="presentation"><a href="#">New messages <span class="badge" id="new_count_message">0</span></a></li>
				</ul>
			</div>
		</div>
	</nav>

	<div class="container" style="margin-top: 100px; margin-bottom: 100px;">
		<select class="form-control symbol_name_select"></select>
		<div class="row">
			<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
				<div class="row">
					<h4 style="text-align: center;color:red">24 Days Long And Short</h4>
				</div>
				<div class="row">
					<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
						<h4 style="text-align:center; color:green;float:left;">Long:</h4>
						<h4 style="text-align:right; color:green;float:left;" class="day_long_amount"></h4>
						<h4 style="text-align:right; color:green;float:left" class="day_long_point"></h4>
					</div>
					<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
						<h4 style="text-align:center; color:red;float:left;">Short:</h4>
						<h4 style="text-align:right; color:red;float:left;" class="day_short_amount"></h4>
						<h4 style="text-align:right; color:red;float:left;" class="day_short_point"></h4>
					</div>
				</div>
			</div>
			<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
				<div class="row">
					<h4 style="text-align: center;color:red">1 Hour Long And Short</h4>
				</div>
				<div class="row">
					<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
						<h4 style="text-align:center; color:green;float:left;">Long:</h4>
						<h4 style="text-align:right; color:green;float:left;" class="hour_long_amount"></h4>
						<h4 style="text-align:right; color:green;float:left;" class="hour_long_point"></h4>
					</div>
					<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
						<h4 style="text-align:center; color:red;float:left;">Short:</h4>
						<h4 style="text-align:right; color:red;float:left;" class="hour_short_amount"></h4>
						<h4 style="text-align:right; color:red;float:left;" class="hour_short_point"></h4>
					</div>
				</div>
			</div>
		</div>

		
		<div class="row">
			<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
				<h2 style="text-align:center; color:green;">BUY</h2>
				<h4 style="text-align:right; color:green;" class="buy_total_amount"></h4>
				<table class="table table-striped table-bordered table-hover">
			    	<thead>
			    		<tr>
			    			<th style="text-align: center;">No</th>
			    			<th style="text-align: center;">Price</th>
			    			<th style="text-align: center;">Quantity</th>
			    			<th style="text-align: center;">Total Amount</th>		    			
			    		</tr>
			    	</thead>
			    	<tbody style="text-align: right;" class="buy">
			    	</tbody>
		    	</table>
			</div>
			<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
				<h2 style="text-align:center; color:red;">SELL</h2>
				<h4 style="text-align:right; color:red;" class="sell_total_amount"></h4>
				<table class="table table-striped table-bordered table-hover">
			    	<thead>
			    		<tr>
			    			<th style="text-align: center;">No</th>
			    			<th style="text-align: center;">Price</th>
			    			<th style="text-align: center;">Quantity</th>
			    			<th style="text-align: center;">Total Amount</th>
			    		</tr>
			    	</thead>
			    	<tbody style="text-align: right;" class="sell">
			    	</tbody>
		    	</table>
			</div>
		</div>
	</div>

	<hr>
	<footer class="text-center">Bitmex &copy; 2015</footer>
	<hr>

	<script src="assets/js/jquery-1.11.2.min.js"></script>
	<script src="assets/js/bootstrap.min.js"></script>
	<script src="node_modules/socket.io-client/dist/socket.io.js"></script>

	<script>
		$(document).ready(function(){
			var socket = io.connect( 'http://localhost:3000' );

			socket.on('long_short',function(data){
					console.log(data);
					$('.' + data.type + '_long_amount').html(data.long);
					$('.' + data.type + '_short_amount').html(data.short);

					var totalamount = Number(data.long + data.short);

					$('.' + data.type + '_long_point').html('(' + Number(Number(data.long)/totalamount * 100).toFixed(8) + '%)');
					$('.' + data.type + '_short_point').html('(' + Number(Number(data.short)/totalamount * 100).toFixed(8) + '%)');
					
				});
			$.post('http://localhost:3000/getSymbol', function(response){

				for(var idx in response){
					$('.symbol_name_select').append('<option value="'+response[idx]+'">'+response[idx]+'</option>');
				}

				var symbol_name = $('.symbol_name_select').val();

				// $.post('http://localhost:3000/setSymbol', {symbol:symbol_name}, function(resp){
				// 	// display(resp,symbol_name);
				// });
				socket.emit('set_symbol',symbol_name);
				// getting symbol from select box on top.....
				$('.symbol_name_select').change(function(){
					symbol_name = $(this).val();
					$.post('http://localhost:3000/setSymbol', {symbol:symbol_name}, function(resp){
						display(resp,symbol_name);
					});
					$('.sell').html('');
					$('.buy').html('');
				});

				// receives data from node.js socket io......
				
				

				function display(resp,symbol_name)
				{
					if(resp.symbol == symbol_name){
						var sell = resp.askDepth;
						var buy = resp.bidDepth;

						// rearrange sell price low to high........
						for(var index=1;index<sell.length;index++)
						{
							for(index_j = 0;index_j<index;index_j++)
							{
								if(Number(sell[index_j].price) > Number(sell[index].price))
								{
									var tmp  = sell[index_j];
									sell[index_j] = sell[index];
									sell[index] = tmp;
								}
							}
						}

						// rearrange buy price high to low.........
						for(var index=1;index<buy.length;index++)
						{
							for(index_j = 0;index_j<index;index_j++)
							{
								if(Number(buy[index_j].price) < Number(buy[index].price))
								{
									var tmp  = buy[index_j];
									buy[index_j] = buy[index];
									buy[index] = tmp;
								}
							}
						}

						var sell_div = '';
						var buy_div = '';

						// generating table for Sell ............
						var sell_total = 0.0;
						for(var i in sell){
							var sprice = Number(sell[i].price);
							sprice = sprice.toFixed(8);
							var squantity = Number(sell[i].quantity);
							squantity = squantity.toFixed(8);
							var total = Number(sell[i].quantity);
							sell_total += total;
							total = total.toFixed(8);
							sell_div += '<tr>';
							sell_div += '<td>' + i + '</td>';
							sell_div += '<td style="color: red;">' + sprice + '</td>';
							sell_div += '<td>' + squantity + '</td>';
							sell_div += '<td>' + total + '</td>';
							sell_div += '</tr>';
							
						}

						

						// if(resp.asktotal)
						// {
						// 	sell_total = resp.asktotal;
						// }
						
						// generating table for Buy ............
						var buy_total = 0.0;
						for(var j in buy){
							var bprice = Number(buy[j].price);
							bprice = bprice.toFixed(8);
							var bquantity = Number(buy[j].quantity);
							bquantity = bquantity.toFixed(8);
							var total = Number(buy[j].quantity);
							buy_total += total;
							total = total.toFixed(8);
							buy_div += '<tr>';
							buy_div += '<td>' + j + '</td>';
							buy_div += '<td style="color: green;">' + bprice + '</td>';
							buy_div += '<td>' + bquantity + '</td>';
							buy_div += '<td>' + total + '</td>';
							buy_div += '</tr>';

						}

						// if(resp.bidtotal)
						// {
						// 	buy_total = resp.bidtotal;
						// }

						var sellpercent = sell_total / (sell_total + buy_total) * 100;
						var buypercent = buy_total / (sell_total + buy_total) * 100;
						$('.sell_total_amount').html(sell_total.toFixed(8) + '  (' + sellpercent.toFixed(8) + '%)');
						$('.buy_total_amount').html(buy_total.toFixed(8) + '(' + buypercent.toFixed(8) + '%)');
						$('.sell').html(sell_div);
						$('.buy').html(buy_div);
					}
				}

			});

		});
	</script>
</body>
</html>