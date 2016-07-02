<?php
	session_start();
	require_once('lib/twitteroauth.php');
	require_once('config.php');
	$con = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET);
	$temp_token = $con->getRequestToken(OAUTH_CALLBACK);
	$_SESSION['oauth_token'] = $temp_token['oauth_token'];
	$_SESSION['oauth_token_secret'] = $temp_token['oauth_token_secret'];
	//echo $con->http_code;
	//echo "<br>";
	//header($con->getAuthorizeURL($token));
	//echo $con->getAuthorizeURL($temp_token['oauth_token']);
	header("Location: ".$con->getAuthorizeURL($temp_token['oauth_token']));
?>
