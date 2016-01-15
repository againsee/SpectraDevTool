/**
 * 콘솔에 로그를 남기는 함수
 * @param str
 */
function debug(str)
{
	console.error('[background.js] ' + str);
}

/**
 * 스크립트 실행
 * @param tabId
 * @param injectDetailsArray
 */
function executeScripts(tabId, injectDetailsArray)
{
    function createCallback(tabId, injectDetails, innerCallback)
    {
        return function ()
        {
            chrome.tabs.executeScript(tabId, injectDetails, innerCallback);
        };
    }

    var callback = null;

    for (var i = injectDetailsArray.length - 1; i >= 0; --i)
    {
        callback = createCallback(tabId, injectDetailsArray[i], callback);
    }

    if (callback !== null)
    {
    	callback();   // execute outermost function
    }
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

/**
 * 데스트탑의 화면을 캡쳐한다.
 */
var captureDesktop = function()
{
	chrome.desktopCapture.chooseDesktopMedia(["window", "screen"], function(n) {
	    n && navigator.webkitGetUserMedia({
	        audio: !1,
	        video: {
	            mandatory: {
	                chromeMediaSource: "desktop",
	                chromeMediaSourceId: n,
	                maxWidth: 3e3,
	                maxHeight: 3e3
	            }
	        }
	    }, function(n) {
	        video = document.createElement("video");
	        video.src = URL.createObjectURL(arguments[0]);
	        window.setTimeout(function() {
	            cs = document.createElement("canvas");
	            cs.width = video.videoWidth;
	            cs.height = video.videoHeight;
	            cs.getContext("2d").drawImage(video, 0, 0, cs.width, cs.height);
	            //n.stop();
	            screenshot = cs.toDataURL('image/png');

	            openTab(screenshot);

	        }, 500)
	    }, function() {})
		});

}

/**
 * 영역으로 캡쳐한다.
 */
var cropAndPreview = function(coords)
{
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    canvas.width = coords.width;
    canvas.height = coords.height;

    var img = new Image();
    img.onload = function() {
        context.drawImage(this, coords.x1, coords.y1, coords.width, coords.height, 0, 0, coords.width, coords.height);

        screenshot = canvas.toDataURL('image/png');
        openTab(screenshot);
    };

    chrome.tabs.captureVisibleTab({format: 'png'}, function(res) {
        img.src = res;
    });

};

/**
 * 윈도우 화면 캡쳐하기
 */
var captureWindow = function(request)
{
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
						openTab(screenshot);
					}
				}

				image.src = request.image[i].image;
			})(i);
		}
	}
	else
	{
		screenshot = request.image;
		openTab(screenshot);
	}
};

/**
 * popup에서 오는 메시지를 받는 함수
 */
var receiveMessage = function(request, sender, sendResponse)
{
	if (request.action == 'capture')
	{
		chrome.tabs.captureVisibleTab({format: 'png'}, function(data) {
            request.image = data;
			captureWindow(request);
        });
	}
	else if (request.action == 'capture-by-time')
	{
		delayForCapture(3, function() {
			chrome.windows.getCurrent(function (tab) {
				chrome.tabs.captureVisibleTab({format: 'png'}, function(data) {
					receiveMessage({'action' : 'capture', image: data});
				});
			});
		});
	}
	else if (request.action == 'show-by-selection')
	{
		chrome.tabs.executeScript({
            'file': 'js/selection.inject.js',
            'runAt': 'document_idle'
        });

	}
	else if (request.action == 'capture-by-selection')
	{
		if(request && request.coords) {
			cropAndPreview(request.coords);
		}
	}
	else if (request.action == 'capture-by-fullpage')
	{
		var images = [];
		var height;
        var width;
        var windowHeight;
        var _capture = function(scrollPosition, callback)
        {
            chrome.tabs.executeScript({
                code: 'window.scrollTo(0,' + scrollPosition + '); window.scrollY;'
            }, function(scroll) {
                setTimeout(function () {
                    chrome.tabs.captureVisibleTab({format: 'png'}, function(res) {
                        callback(res, scroll[0]);
                    });
                }, 100);
            });
        };

        var position = 0;

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
                    _capture(position, callback);
                }
                else
                {
                    chrome.tabs.executeScript({
                        code: "document.body.style.overflow = 'visible';"
                    });
                    captureWindow({image: images, height: height, width: width});
                }
            };

            _capture(position, callback);
        });
	}
	else if (request.action == 'capture-desktop')
	{
		captureDesktop();

	}
	else if (request.action == 'share-desktop')
	{
		var uuid = generateUUID();

		//chrome.tabs.create({url:'https://rudaks-han.github.io/test.html#' + uuid}, function(tab) {
			//tabId = tab.id;
		//});
		debug("share-desktop...");
		//captureDesktopForSharing();

		if (connection && connection.attachStreams[0]) {
        //connection.attachStreams[0].onended = function() {};
        connection.attachStreams[0].stop();
        // setDefaults();
    }

    var desktop_id = chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], onAccessApproved);

		/*var shareScreen = createShareScreen(chrome);

		shareScreen(sender, sendResponse);*/

	}

};

/**
 * UUID를 만드는 함수
 * @returns
 */
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

var createShareScreen = function (chrome) {
    return function (sender) {
    	debug('createShareScreen called');
    	debug('sender : ' + sender);
    	debug('sender.tab : ' + sender.tab);
        chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], sender.tab, function (streamId) {
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'relay-to-tab',
                callback: 'share-screen',
                argument: streamId
            }, function () {
                console.log("Message sent with stream %s", streamId);
            });
        });
    };
};

var screenshot = null;
var tabId = null;

/**
 * 캡쳐에 대한 미리보기 탭을 오픈하는 함수 (preview.html)
 * 기존에 떠있는 탭이 있다면 해당 탭을 포커스한다.
 * @param screenShot
 */
function openTab(screenShot)
{
	chrome.windows.getAll({"populate" : true}, function(windows) {
		var existingTab = false;

		for (var i = 0; i < windows.length; i++)
		{
			for (var j = 0; j < windows[i].tabs.length; j++)
			{
				if (windows[i].tabs[j].id == tabId)
				{
					existingTab = true;
					tabId = windows[i].tabs[j].id;
					break;
				}
			}
		}

		if (existingTab)
		{
			chrome.tabs.update(tabId, {selected : true, highlighted : true}, function() {});
		}
		else
		{
			chrome.tabs.create({url:'preview.html'}, function(tab) {
				tabId = tab.id;
			});
		}
	});
}

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
	chrome.tabs.executeScript(null, {code:"timer.removeTimer();"});
}

/**
 * receiver by chrome.runtime.sendMessage
 */
chrome.runtime.onMessage.addListener(receiveMessage);

chrome.extension.onRequest.addListener(function(request, sender)
{
	//alert("Background script has received a message from contentscript:'" + JSON.stringify(request) + "'");
	//returnMessage(request.message);

	//receiveMessage(request, sender);

	chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage', 'scrollToCrop': true}, function(response) {});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab)
{
	debug('chrome.tabs.onUpdated.addListener');
});

chrome.tabs.onCreated.addListener(function(tab)
{
	debug('chrome.tabs.onCreated.addListener');
});

//======================================================================
//this background script is used to invoke desktopCapture API
//to capture screen-MediaStream.

var session = ['screen', 'window'];

chrome.runtime.onConnect.addListener(function (port) {
 port.onMessage.addListener(portOnMessageHanlder);

 // this one is called for each message from "content-script.js"
 function portOnMessageHanlder(message) {
     if(message == 'get-sourceId') {
         chrome.desktopCapture.chooseDesktopMedia(session, port.sender.tab, onAccessApproved);
     }
 }

 // on getting sourceId
 // "sourceId" will be empty if permission is denied.
 function onAccessApproved(sourceId) {
     console.log('sourceId', sourceId);

     // if "cancel" button is clicked
     if(!sourceId || !sourceId.length) {
         return port.postMessage('PermissionDeniedError');
     }

     // "ok" button is clicked; share "sourceId" with the
     // content-script which will forward it to the webpage
     port.postMessage({
         sourceId: sourceId
     });
 }
});


/**
 * context-menu에 메뉴 추가
 */
chrome.runtime.onInstalled.addListener(function() {
	  chrome.contextMenus.create({'id' : 'capture', "title": "화면 캡쳐하기", contexts: ['page'], onclick: function(data) {
		  chrome.tabs.captureVisibleTab({format: 'png'}, function(data) {
			  var request = [];
	            request.image = data;
				captureWindow(request);
	        });
	   }});
	  chrome.contextMenus.create({'id' : 'capture-by-time', "title": "3초 후에 캡쳐하기", contexts: ['page'], onclick: function(data) {
		  delayForCapture(3, function() {
				chrome.windows.getCurrent(function (tab) {
					chrome.tabs.captureVisibleTab({format: 'png'}, function(data) {
						receiveMessage({'action' : 'capture', image: data});
					});
				});
			});
	   }});
	  chrome.contextMenus.create({'id' : 'capture-by-selection', "title": "영역을 지정하여 캡쳐하기", contexts: ['page'], onclick: function(data) {
		  chrome.tabs.executeScript({
	            'file': 'js/selection.inject.js',
	            'runAt': 'document_idle'
	        });
	   }});

	});
