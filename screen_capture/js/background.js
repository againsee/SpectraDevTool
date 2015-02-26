function debug(str)
{
	console.error('[background.js] ' + str);
}

function executeScripts(tabId, injectDetailsArray)
{
    function createCallback(tabId, injectDetails, innerCallback) {
        return function () {
            chrome.tabs.executeScript(tabId, injectDetails, innerCallback);
        };
    }

    var callback = null;

    for (var i = injectDetailsArray.length - 1; i >= 0; --i)
        callback = createCallback(tabId, injectDetailsArray[i], callback);

    if (callback !== null)
        callback();   // execute outermost function
}

/**
 * 3초후에 캡처하기
 * @param seconds
 * @param callbackFn
 */
function delayForCapture(seconds, callbackFn)
{
	displayTimer(seconds);
	
	var timer = setInterval(function() {
		debug('seconds : ' + seconds);
		seconds--;
		
		if (seconds == 0)
		{
			clearInterval(timer);
			
			removeTimer();
			
			// 숫자 이미지 삭제 시간을 확보
			setTimeout(function() {
				callbackFn();
			}, 300);
			
			return;
		}
		
		removeTimer();
		displayTimer(seconds);
		
	}, 1000);
}

var cropAndPreview = function(coords)
{
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
        
    canvas.width = coords.width;
    canvas.height = coords.height;

    debug('canvas.width : ' + canvas.width);
    debug('canvas.height : ' + canvas.height);
    
    var img = new Image();
    img.onload = function() {
        context.drawImage(this, coords.x1, coords.y1, coords.width, coords.height, 0, 0, coords.width, coords.height);
        
        screenshot = canvas.toDataURL('image/png');
        window.open('preview.html');
    };

    debug('capture');
    chrome.tabs.captureVisibleTab({format: 'png'}, function(res) {
    	debug('res : ' + res)
        img.src = res;
    });
    
};

var receiveMessage = function(request, sender, sendResponse)
{
	debug('receiveMessage');
	debug('request.action : ' + request.action);
	
	if (request.action == 'capture') 
	{
		screenshot = request.image;
		
		// 전체 페이지 캡처할 경우
		if (Array.isArray(request.image)) 
		{
			var canvas = document.createElement('canvas');
			var context = canvas.getContext('2d');
			var image;
			var done = 0;
			
			canvas.width = request.width;
			canvas.height = request.height;
			
				
			for (var i = 0; i < request.image.length; i++) 
			{
				(function(i) {
					image = new Image();
					image.onload = function() 
					{
						context.drawImage(this, 0, request.image[i].position, this.width, this.height);
						if (++done == request.image.length) 
						{
							screenshot = canvas.toDataURL('image/png');
							window.open('preview.html');
						}
					}
					
					image.src = request.image[i].image;
				})(i);
			} 
		} 
		else 
		{
			screenshot = request.image;
			window.open('preview.html');
			return;
		}
	}
	else if (request.action == 'time-capture')
	{
		debug('time-capture');
		
		delayForCapture(3, function() {
			chrome.windows.getCurrent(function (tab) {    
				chrome.tabs.captureVisibleTab({format: 'png'}, function(data) {
					receiveMessage({'action' : 'capture', image: data});
				});
			});    
		});
	}
	else if (request.action == 'selection-capture')
	{
		debug('selection-capture');
		
		if(request && request.coords) {
			cropAndPreview(request.coords);
		}
	}
	
};

/**
 * 화면에 시간을 표시
 * @param number
 */
function displayTimer(number)
{
	executeScripts(null, [{file: 'js/jquery-1.9.1.min.js'}, {file: 'js/contents-script.js'}]);
	setTimeout(function() {
		chrome.tabs.executeScript(null, {code:"timer.displayTimer('" + number + "');"});
	}, 300);
	
}

/**
 * 화면에 표시된 시간을 삭제
 */
function removeTimer()
{
	//executeScripts(null, [{file: 'js/jquery-1.9.1.min.js'}, {file: 'js/contents-script.js'}]);
	chrome.tabs.executeScript(null, {code:"timer.removeTimer();"});
}

/**
 * receiver by chrome.runtime.sendMessage
 */
chrome.runtime.onMessage.addListener(receiveMessage);

chrome.extension.onRequest.addListener(function(request, sender)
{
	alert("Background script has received a message from contentscript:'" + request.message + "'");
	//returnMessage(request.message);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) 
{
	debug('chrome.tabs.onUpdated.addListener');
});
