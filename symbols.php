<!DOCTYPE html>
<?php
	$servername = "localhost";
	$username = "root";
	$password = "";
	$dbname = "realtime_message";

	// Create connection
	$conn = new mysqli($servername, $username, $password, $dbname);
	// Check connection
	if ($conn->connect_error) {
	    die("Connection failed: " . $conn->connect_error);
	} 

	$sql = "SELECT ExchangePair FROM binance";
	$result = $conn->query($sql);

	$conn->close();
?>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Symbols</title>
	<link href="assets/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
	<nav class="navbar navbar-default navbar-fixed-top " role="navigation">
		<div class="container">
			<div class="navbar-header">
				<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
				<span class="sr-only">Symbols</span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				</button>
				<a class="navbar-brand" href="#">Symbols</a>
			</div>

			<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
				<ul class="nav nav-pills pull-right" role="tablist">
				<li role="presentation"><a href="#">New messages <span class="badge" id="new_count_message">0</span></a></li>
				</ul>
			</div>

		</div>
	</nav>

	<div class="container" style="margin-top: 100px; margin-bottom: 100px;">
		<button class="btn btn-success writesymbolsjson">Write Mysql Data to Symbols.json</button>
		<div class="row">
			<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
				<h2 style="text-align:center; color:red;">MySql Data</h2>
				<div style="border: 2px grey solid; height: 500px; overflow-y: scroll;">
					<div class="mysqldata" style="margin:30px; color:red;">
						<?php
							if ($result->num_rows > 0) {
							    // output data of each row
							    while($row = $result->fetch_assoc()) {
							    	echo '<span value="';
							    	echo $row['ExchangePair'];
							    	echo '">';
							        echo $row['ExchangePair'];
							        echo '</span>';
							        echo '<br/>';
							    }
							}else{
							    echo "0 results";
							}
						?>
					</div>
				</div>
			</div>
			<div class="col col-xs-12 col-sm-12 col-md-6 col-lg-6">
				<h2 style="text-align:center; color:green;">Symbols.json Data</h2>
				<div style="border: 2px grey solid; height: 500px; overflow-y: scroll;">
					<div class="symbolsjsondata" style="margin:30px; color:green;"></div>
				</div>
			</div>
		</div>
	</div>

	<hr>
	<footer class="text-center">Symbols &copy; 2015</footer>
	<hr>

	<script src="assets/js/jquery-1.11.2.min.js"></script>
	<script src="assets/js/bootstrap.min.js"></script>
	<script src="node_modules/socket.io-client/dist/socket.io.js"></script>

	<script>
		$(document).ready(function(){
			$.post('http://localhost:3000/getSymbol', function(response){
				for(var idx in response){
					$('.symbolsjsondata').append('<span value="'+response[idx]+'">'+response[idx]+'</span><br/>');
				}
			});

			$('.writesymbolsjson').click(function(){
				var symbolstmp = [];
				$('.mysqldata').children('span').each(function(index){
					symbolstmp.push($(this).attr('value'));
				});

				$.post('http://localhost:3000/writeSymbol', {symbols:symbolstmp}, function(response){
					if(response = 'yes'){
						$('.symbolsjsondata').html('');
						for(var idx in symbolstmp){
							$('.symbolsjsondata').append('<span value="'+symbolstmp[idx]+'">'+symbolstmp[idx]+'</span><br/>');
						}
					}else{
						alert('Failed!');
					}
				});
			});
		});
	</script>
</body>
</html>