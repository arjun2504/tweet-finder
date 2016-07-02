$(document).ready(function() {
	var checkTweet;
	var activityType = 'new';
});
function findTweets(findNext) {
	$('#fetch-not-started').css('display','none');
	goToPage('rettab');
	var flag = 1;
	var q = document.getElementById('q').value;
	var name = document.getElementById('name').value;
	var mode = document.getElementById('search-mode').value;
	var lang = document.getElementById('lang').value;
	var time = document.getElementById('time').value;
	var interval = 1000 * 60 * parseInt(time);
	document.getElementById('json-cont').value = "";
	$('#progress-fetch').css('display','none');
	$('#stop-fetch').css('display','none');
	$('#wait-fetch').css('display','block');

	$.ajax({
		type: 'POST',
		data: { 'keyword': q, 'name': name, 'api_method': mode, 'lang': lang, 'time': time },
		url: 'initiate-activity.php',
		success: function(response) {
			$('#console').html(response);
		}
	});

	
	$.ajax({
		type: 'POST',
		data: { 'q': q, 'mode': mode, 'lang': lang },
		url: 'search-tweets.php',
		beforeSend: function() {
			$('#progress-fetch').css('display','block');
			$('#wait-fetch').css('display','none');
		},
		success: function(response) {
			var oldjson = document.getElementById('json-cont').value;
			
			document.getElementById('json-cont').value = response;

			//getTweetCount();
			$('#progress-fetch').css('display','none');
			$('#wait-fetch').css('display','block');
			flag = 2;

			
		}
	});
	

	

	checkTweet = setInterval(function() {
		$.ajax({
		type: 'POST',
		data: { 'q': q, 'mode': mode, 'lang': lang },
		url: 'search-tweets.php',
		beforeSend: function() {
			$('#progress-fetch').css('display','block');
			$('#wait-fetch').css('display','none');
		},
		success: function(response) {
			var oldjson = document.getElementById('json-cont').value;
			
			document.getElementById('json-cont').value = response;

			//getTweetCount();
			$('#progress-fetch').css('display','none');
			$('#wait-fetch').css('display','block');
			flag = 2;

			
		}
	});
	}, interval);

	$('#stop-fetch').css('display','none');
}
function getTweetCount() {
	document.getElementById('tweet-count').innerHTML = JSON.parse(document.getElementById('json-cont').value).statuses.length;
}
function stopFetch() {
	$('#progress-fetch').css('display','none');
	$('#wait-fetch').css('display','none');
	$('#stop-fetch').css('display','block');
	clearInterval(checkTweet);
}
function convertToPlainText() {
	$.ajax({
		type: 'GET',
		url: 'make-plain.php',
		beforeSend: function() {
		},
		success: function(response) {
			document.getElementById('plain-text-cont').value = response;	
		}
	});
	goToPage('pttab');
}
function generateTable() {
	var data;
	$.ajax({
		url: 'get-json-file.php',
		type: 'GET',
		success: function(response) {
			data = response;
			var lines = data.split("\n"), output = [], i;
			for (i = 0; i < lines.length; i++)
		    output.push("<tr><td>"
		                + lines[i].slice(0,-1).split("|, ").join("</td><td>")
		                + "</td></tr>");
			document.getElementById('table-contents').innerHTML = output.join("") + "";

			if(activityType != "new") {
				$('#dbwarning').css('display','block');
			}
			else {
				$('#dbwarning').css('display','none');	
			}
		}
	});
	//var data = document.getElementById('plain-text-cont').value;

	goToPage('dbtab');
}
function testConnection() {
	var host = document.getElementById('dbhost').value;
	var user = document.getElementById('dbuser').value;
	var pass = document.getElementById('dbpass').value;
	var dbname = document.getElementById('dbname').value;
	var flag = 1;
	if(host.trim() == "" || user.trim() == "" || dbname.trim() == "") {
		var snackbarContainer = document.querySelector('#test-toast');
		var showToastButton = document.querySelector('#test-btn');
		'use strict';
		var data = {message: 'Insufficient details provided'};
		snackbarContainer.MaterialSnackbar.showSnackbar(data);
		flag = 2;
		return;
	}

	$.ajax({
		type: 'POST',
		url: 'db-conn-test.php',
		data: { 'host': host, 'user': user, 'pass': pass, 'dbname':dbname },
		error: function() {
			var snackbarContainer = document.querySelector('#test-toast');
			var showToastButton = document.querySelector('#test-btn');
			'use strict';
			var data = {message: 'An error occurred'};
			snackbarContainer.MaterialSnackbar.showSnackbar(data);
		},
		success: function(response) {
			if(response == "Error connecting database!") {
				var snackbarContainer = document.querySelector('#test-toast');
				var showToastButton = document.querySelector('#test-btn');
				'use strict';
				var data = {message: 'Connection Unsuccessful'};
				snackbarContainer.MaterialSnackbar.showSnackbar(data);
			}
			else {
				var snackbarContainer = document.querySelector('#test-toast');
				var showToastButton = document.querySelector('#test-btn');
				'use strict';
				var data = {message: 'Connection Successful'};
				snackbarContainer.MaterialSnackbar.showSnackbar(data);
			}
		}
	});
}
function makeRaw() {
	var json_data = document.getElementById('json-cont').value;
	$.ajax({
		type: 'POST',
		url: 'make-raw.php',
		data: { 'json': json_data },
		success: function(response) {
			$('#table-contents').html(response);
		}
	});
	activityType = 'raw';
	$('#dbwarning').css('display','block');
}
function openActivity(pid, status, keyword, pname, mode) {
	//setting activity to session
	document.getElementById('q').value = keyword;
	document.getElementById('name').value = pname;
	activityType = status;
	if(mode == "search") {
		document.getElementById('search-mode').click();
	}
	else {
		document.getElementById('stream-mode').click();
	}
	document.getElementById('time').value = '1';

	$.ajax({
		type: 'GET',
		url: 'set-activity.php',
		data: { 'pid' : pid },
		beforeSend: function() {
			
		},
		success: function(response) {
			$("#console").html(response);
		}
	});

	if(status == "new") {
		findTweets(true);
	}
	else if(status == "raw") {
		loadNoisyTweets();
		$('#cleanwarning').html("Clicking Clean will remove unnecessary components from the tweets such as mentions, hashtags, media, links, symbols and punctuations.");
	}
	else if(status == "eliminated") {
		cleanTweets();
	}

	if(activityType != 'new') {
		$('#dbwarning').css('display','block');
	}
	else {
		$('#dbwarning').css('display','none');	
	}

	if(activityType == "eliminated") {
		$('#cleanwarning').html();
	}

	//write code for navigating to appropriate page
}
function loadNoisyTweets() {
	$.ajax({
		type: 'POST',
		url: 'get-noisy-tweets.php',
		beforeSend: function() {
			$('#noisy-tweets').html('Loading...');
		},
		success: function(response) {
			$('#noisy-tweets').html(response);
		}
	});
	activityType = 'raw';
	goToPage('elimtab');
}
function cleanTweets() {
	$.ajax({
		type: 'POST',
		url: 'clean-tweets.php',
		beforeSend: function() {
			$('#noisy-tweets').html('Loading...');
		},
		success: function(response) {
			$('#noisy-tweets').html(response);
		}
	});
	activityType = 'eliminated';
	goToPage('elimtab');
}
function goToPage(page) {
	document.getElementById(page).click();
	// content = "";
	// switch(page) {
	// 	case 'rettab':
	// 		content = "retrieve";
	// 		break;
	// }
	// $('#' + content).delay(1000).show('slide', { 'direction': 'left' }, 100);
}







