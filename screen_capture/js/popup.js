function debug(str)
{
	chrome.extension.getBackgroundPage().console.error('[popup.js] ' + str);
}

(function($) {

    var load = function() 
	{  
    	// 윈도우 캡쳐하기
        $('#windows').on('click', function() {            
			chrome.tabs.captureVisibleTab({format: 'png'}, function(data) {
                chrome.runtime.sendMessage({'action' : 'capture', image: data}, function() {});
            });
        });
		
        // 3초후에 캡처하기
		$('#timer').on('click', function() {
			chrome.runtime.sendMessage({'action':'time-capture'});
			window.close();
		});
		
		// 선택영역 챕처하기
		$('#selection').on('click', function() {
			chrome.tabs.executeScript({
                'file': 'js/selection.inject.js',
                'runAt': 'document_idle'
            });
            window.close();
		});
		
		// 전체 페이지 캡쳐
		$('#entire').on('click', function() {
		
            var images = [];
			var height;
            var width;
            var windowHeight;
            var capture = function(scrollPosition, callback) {
                    chrome.tabs.executeScript({
                        code: 'window.scrollTo(0,' + scrollPosition + '); window.scrollY;'
                    }, function(scroll) {
                        setTimeout(function () {
                            chrome.tabs.captureVisibleTab({format: 'png'}, function(res) {
                                callback(res, scroll[0]);
                            });
                        }, 100);
                    });
                },
                position = 0;
                
            // First get the height
            chrome.tabs.executeScript({
                code: "document.body.style.webkitTransform = 'translateZ(0)'; document.body.style.overflow = 'hidden'; ([document.body.scrollHeight, window.innerHeight, document.body.scrollWidth]);"
            }, function(res) {
                height = res[0][0];
                width = res[0][2];
                windowHeight = res[0][1];
                callback = function(res, scroll) {
                    images.push({image: res, position: scroll});

                    if (position <= (height - windowHeight)) 
                    {
                        position += windowHeight;
                        capture(position, callback);
                    } 
                    else 
                    {
                        chrome.tabs.executeScript({
                            code: "document.body.style.overflow = 'visible';"
                        });
                        chrome.runtime.sendMessage({'action' : 'capture', image: images, height: height, width: width}, function() {});
                    }
                };
                
                capture(position, callback);
            });
        });
    };
    
    $(load);
})(jQuery);
