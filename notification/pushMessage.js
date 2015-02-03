

function ticketRoutedByGateway(ticketId, serviceType)
{
	console.error('[ticketRoutedByGateway] ticketId : ' + ticketId + ', serviceType : ' + serviceType);
	
	var notificationId = ticketId;
	
	
	chrome.notifications.clear(notificationId, function() {});
	
	var options = {
	  type: "basic",
	  title: "새 질문이 접수되었습니다. " + ticketId,
	  message: "새 질문이 접수되었습니다.",
	  iconUrl: "images/_comment.png",
	  buttons: [
		{title : "수락", iconUrl : 'images/accept.png'},
		{title : "반환", iconUrl : 'images/reject.png'}
	  ],
	  priority: 2
	}

	
	chrome.notifications.create(notificationId, options, function() {});
	/*
	chrome.experimental.notification.create(notificationId, options, function(notificationId) {
		console.error("Succesfully created notification");
	});
	*/
	
	/*
	var listeners = {
        onButtonClicked: function(btnIdx) {
            if (btnIdx === 0) {
                console.log('Clicked: "yes"');
            } else if (btnIdx === 1) {
                console.log('Clicked: "no"');
            }
        },
        onClicked: function() {
            console.log('Clicked: "message-body"');
        },
        onClosed: function(byUser) {
            console.log('Closed: '
                        + (byUser ? 'by user' : 'automagically (!?)'));
        }
    };
	*/
    
    //createNotification(options, listeners);
	
}


function newMessageByGateway(ticketId, serviceType, userType)
{
	console.error('[newMessageByGateway] ticketId : ' + ticketId + ', serviceType : ' + serviceType);

	var notificationId = ticketId;
	
	//chrome.notifications.clear(notificationId, function() {});
	

	var options = {
	  type: "basic",
	  title: "새 메시지가 도착하였습니다.",
	  message: "",
	  iconUrl: "images/_comment.png"
	}

/*	
	notificationTimer[notificationId]= setTimeout(function() {
		console.error('update');
		chrome.notifications.clear(notificationId, function() {});
		//chrome.notifications.update(notificationId, {priority:2}, function() {});
		chrome.notifications.create(notificationId, options, function() {});
	}, 8000);
	*/
	
	var listeners = {
        onButtonClicked: function(btnIdx) {
            if (btnIdx === 0) {
                console.log('Clicked: "yes"');
            } else if (btnIdx === 1) {
                console.log('Clicked: "no"');
            }
        },
        onClicked: function() {
            console.log('Clicked: "message-body"');
        },
        onClosed: function(byUser) {
            console.log('Closed: '
                        + (byUser ? 'by user' : 'automagically (!?)'));
        }
    };

    /* Create the notification */
    createNotification(options, listeners);
	
	
	/*
	if (Notification && Notification.permission !== "granted") {
    Notification.requestPermission(function (status) {
      if (Notification.permission !== status) {
        Notification.permission = status;
      }
    });
  }
  if (Notification && Notification.permission === "granted") {
      var n = new Notification(options.title, {icon: 'images/_comment.png', body: 'body...'});
    }
*/
}


