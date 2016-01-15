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

$(function() {
	$(document).on('keydown', function(e) {
		// 단축키 등록
		if (e.ctrlKey && e.altKey)
		{
			switch (e.keyCode)
			{
				case 67 : // C
					chrome.runtime.sendMessage({action: "capture"}, function(response) {});
					break;
				case 77 : // M
					chrome.runtime.sendMessage({action: "capture-by-time"}, function(response) {});
					break;
				case 82 : // R
					chrome.runtime.sendMessage({action: "capture-by-selection"}, function(response) {});
					break;
				case 70 : // F
					chrome.runtime.sendMessage({action: "capture-by-fullpage"}, function(response) {});
					break;
				case 68 : // D
					chrome.runtime.sendMessage({action: "capture-desktop"}, function(response) {});
					break;
				case 76 : // L
					chrome.runtime.sendMessage({action: "share-desktop"}, function(response) {});
					break;
			}
		}
	});
})