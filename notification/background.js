var pendingNotifications = {};

chrome.notifications.onClicked.addListener(function(notifId) {
	console.error('onClosed');
	window.open('http://localhost:9090/enomix/monitoring/viewConsultingPage.ee');
	
	if (pendingNotifications[notifId] !== undefined) {
        var handler = pendingNotifications[notifId].listeners.onClicked;
        destroyNotification(notifId, handler());
    }
});

chrome.notifications.onClosed.addListener(function(notifId, byUser) {
	console.error('onClosed');
	
	if (pendingNotifications[notifId] !== undefined) {
        var handler = pendingNotifications[notifId].listeners.onClosed;
        destroyNotification(notifId, handler(byUser));
    }
});

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
	console.error('onButtonClicked');
	if (pendingNotifications[notifId] !== undefined) {
        var handler = pendingNotifications[notifId].listeners.onButtonClicked;
        destroyNotification(notifId, handler(btnIdx));
    }
});

chrome.notifications.onShowSettings.addListener(function() {
	console.error('onShowSettings');
});

function createNotification(options, listeners, notifId) {
    (notifId !== undefined) || (notifId = "");
    chrome.notifications.create(notifId, options, function(id) {
        console.log('Created notification "' + id + '" !');
        if (pendingNotifications[id] !== undefined) {
            clearTimeout(pendingNotifications[id].timer);
        }

        pendingNotifications[id] = {
            listeners: listeners,
            timer: setTimeout(function() {
                console.log('Re-spawning notification "' + id + '"...');
                destroyNotification(id, function(wasCleared) {
                    if (wasCleared) {
                        createNotification(options, listeners, id);
                    }
                });
            }, 8000)
        };
    });
}

function destroyNotification(notifId, callback) {

    /* Cancel the "re-spawn" timer (if any) */
    if (pendingNotifications[notifId] !== undefined) {
        clearTimeout(pendingNotifications[notifId].timer);
        delete(pendingNotifications[notifId]);
    }

    /* Remove the notification itself */
    chrome.notifications.clear(notifId, function(wasCleared) {
        console.log('Destroyed notification "' + notifId + '" !');

        /* Execute the callback (if any) */
        callback && callback(wasCleared);
    });
}




// Test for notification support.
if (window.Notification) {
    
  var _accountId = "kmhan";
    
        var config = {
			protocol : "http",
            host : "211.63.24.124",
            port : "9010"
        };
        
        $.gateway.addListener('NEW_MESSAGE', _newMessage);

     	// Gateway 서버와 연결되었을 경우 호출
        function _connectionEstablished()
        {
            console.error('_connectionEstablished');
        }
     	
     	// Gateway 서버와 연결이 끊어졌을 경우 호출
        function _connectionBroken()
        {
            console.error('_connectionBroken');
        }
     	
     	// 신규 메세지 유무
        function _newMessage(talkId, serviceType, userType)
        {
			console.error('_newMessage');
     	    //parent.doNewMessageByGateway(talkId, serviceType, userType);
			newMessageByGateway(talkId, serviceType, userType);
        }
     	
     	// 메세지 읽음
        function _readMessage(talkId, seq, serviceType)
        {
     	    //parent.doReadMessageByGateway(talkId, seq, serviceType);
        }
        
        // 메세지 입력 상태
        function _inputStatus(talkId, serviceType, status, userType)
        {
            //parent.doInputStatusByGateway(talkId, serviceType, status, userType);
        }
        
        // 티켓 라우팅 
        function _ticketRouted(talkId, serviceType)
        {
			console.error('_ticketRouted');
            //parent.doTicketRoutedByGateway(talkId, serviceType);
			ticketRoutedByGateway(talkId, serviceType);
        }
        
        // 티켓 종료 
        function _ticketEnded(talkId, serviceType)
        {
            //parent.doTicketEndedByGateway(talkId, serviceType);
        }
        
        // 티켓 회수
        function _ticketExpired(talkId, serviceType)
        {
            //parent.doTicketExpiredByGateway(talkId, serviceType);
        }
        
        function _supportStatus(talkId, serviceType, status)
        {
            //parent.doSupportStatusByGateway(talkId, serviceType, status);
        }
        
        function _forwardAccept(talkId, serviceType)
        {
			console.error('_forwardAccept');
        	//parent.doForwardAcceptByGateway(talkId, serviceType);
        }
        
        function _forwardComplete(talkId, serviceType)
        {
			console.error('_forwardComplete');
        	//parent.doForwardCompleteByGateway(talkId, serviceType);
        }
        
        function _forwardReturn(talkId, serviceType)
        {
			console.error('_forwardReturn');
        	//parent.doForwardReturnByGateway(talkId, serviceType);
        }
        
        function _routingReturn(talkId, serviceType, updatedBy)
        {
			console.error('_routingReturn');
            //parent.doRoutingReturnByGateway(talkId, serviceType, updatedBy);
        }
        
        function _ticketDeleted(talkId, serviceType, updatedBy)
        {
			console.error('_ticketDeleted');
            //parent.doTicketDeletedByGateway(talkId, serviceType, updatedBy);
        }
        
        function _routingFlagChanged(serviceType, routingFlag)
        {
            //parent.doRoutingFlagChangedByGateway(serviceType, routingFlag);
        }
        
        $.gateway.addListener($.gateway.EVENT.NEW_MESSAGE, _newMessage);
        $.gateway.addListener($.gateway.EVENT.READ_MESSAGE, _readMessage);
        $.gateway.addListener($.gateway.EVENT.INPUT_STATUS, _inputStatus);
        $.gateway.addListener($.gateway.EVENT.TICKET_ROUTED, _ticketRouted);
        $.gateway.addListener($.gateway.EVENT.TICKET_ENDED, _ticketEnded);
        $.gateway.addListener($.gateway.EVENT.TICKET_EXPIRED, _ticketExpired);
        $.gateway.addListener($.gateway.EVENT.SUPPORT_STATUS, _supportStatus);
        $.gateway.addListener($.gateway.EVENT.FORWARD_ACCEPT, _forwardAccept);
        $.gateway.addListener($.gateway.EVENT.FORWARD_COMPLETE, _forwardComplete);
        $.gateway.addListener($.gateway.EVENT.FORWARD_RETURN, _forwardReturn);
        $.gateway.addListener($.gateway.EVENT.ROUTING_RETURN, _routingReturn);
        $.gateway.addListener($.gateway.EVENT.TICKET_DELETED, _ticketDeleted);
        $.gateway.addListener($.gateway.EVENT.ROUTING_FLAG_CHANGED, _routingFlagChanged);
        $.gateway.addListener($.gateway.EVENT.CONNECTION_ESTABLISHED, _connectionEstablished);
        $.gateway.addListener($.gateway.EVENT.CONNECTION_BROKEN, _connectionBroken);
        
		
        $.gateway.initAgent(config, _accountId);
  
  
  setTimeout(function() {
    
    //show();
  }, 1000);
}
