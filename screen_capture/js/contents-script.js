var timer = {
	displayTimer : function(number)
	{
		var imageUrl = chrome.extension.getURL('images/number-' + number + '.png');
		var html = '<div class="timer-number" style="position:fixed; top:0; right:0; z-index:99999;">';
		html += '<img src="' + imageUrl + '" />';
		html += '</div>';
		$(html).appendTo('body');
	},
	removeTimer : function()
	{
		$('.timer-number').remove();
	}
}

/*function displayTimer(number)
{
	var imageUrl = chrome.extension.getURL('images/number_' + number + '.png');
	var html = '<div class="timer-number" style="position:fixed; top:0; right:0; z-index:99999;">';
	html += '<img src="' + imageUrl + '" />';
	html += '</div>';
	$(html).appendTo('body');
}*/

/*function removeTimer()
{
	$('.timer-number').remove();
}*/