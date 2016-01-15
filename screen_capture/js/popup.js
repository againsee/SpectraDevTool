function debug(str)
{
	chrome.extension.getBackgroundPage().console.error('[popup.js] ' + str);
}

var command =
{
	capture : function(e)
	{
		chrome.runtime.sendMessage({action: "capture"}, function(response) {});
	},
	captureByTime : function(e)
	{
		chrome.runtime.sendMessage({'action':'capture-by-time'});
		window.close();
	},
	captureBySelection : function(e)
	{
		chrome.runtime.sendMessage({'action':'show-by-selection'});
        window.close();
	},
	captureByFullpage : function(e)
	{
		chrome.runtime.sendMessage({'action':'capture-by-fullpage'});
		window.close();
	},
	captureByDesktop : function(e)
	{
		_permissions.checkPermissions({permissions:['desktopCapture']},function () {
			chrome.runtime.sendMessage({'action' : 'capture-desktop'}, function() {});
			window.close();
		});
	},
	shareScreen : function(e)
	{
		chrome.runtime.sendMessage({'action' : 'share-desktop'}, function() {});
		window.close();
	}

};

(function($) {

    var load = function()
	{
    	// 윈도우 캡쳐하기
        $('#windows').on('click', command.capture);

        // 3초후에 캡처하기
		$('#timer').on('click', command.captureByTime);

		// 선택영역 챕처하기
		$('#selection').on('click', command.captureBySelection);

		// 전체 페이지 캡쳐
		$('#entire').on('click', command.captureByFullpage);

		// 데스크탑 챕처하기
		$('#desktop').on('click', command.captureByDesktop);

		// 화면공유
		$('#desktopSharing').on('click', command.shareScreen);

    };

    $(load);
})(jQuery);
