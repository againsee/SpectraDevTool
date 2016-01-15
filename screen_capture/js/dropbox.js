var DROPBOX_APP_KEY = '9yv09mjzt1pt5z4';

(function() {
	// Try to finish OAuth authorization.
	/*client.authenticate({interactive:false}, function (error) {
		if (error) {
			alert('Authentication error: ' + error);
		}
	});
	
	alert(client.isAuthenticated());
	client.authenticate();*/
	
	/*var client = new Dropbox.Client({ key: DROPBOX_APP_KEY });
	 
    function doHelloWorld() {
        client.writeFile('hello.txt', 'Hello, World!', function (error) {
            if (error) {
                alert('Error: ' + error);
            } else {
                alert('File written successfully!');
            }
        });
    }

    // Try to complete OAuth flow.
    client.authenticate({ interactive: false }, function (error, client) {
        if (error) {
            alert('Error: ' + error);
        }
    });
    
    console.error('client.isAuthenticated() : ' + client.isAuthenticated())

    if (client.isAuthenticated()) {
        doHelloWorld();
    }

    document.getElementById('writeButton').onclick = function () {
        client.authenticate(function (error, client) {
            if (error) {
                alert('Error: ' + error);
            } else {
                doHelloWorld();
            }
        });
    }*/
	
	
    var client = new Dropbox.Client({ key: DROPBOX_APP_KEY });
	client.authDriver(new Dropbox.AuthDriver.ChromeExtension());

    credentials = localStorage.getItem('DropboxOAuth');
    if (credentials) {
    	client.setCredentials(JSON.parse(credentials));
    }
    if (client.isAuthenticated()) {
        console.log('==> dropbox authenticated');
        //openDefaultDatastore();

    } else {
        console.log('==> try authenticate dropbox');
        client.authenticate(function(error, client){
            if (error) {
                console.log('==> authenticate failed:' + error);
                return;
            } else {
            	console.log('==> authenticate success');
                localStorage.setItem('DropboxOAuth', JSON.stringify(client.credentials()));
                //openDefaultDatastore();
                alert('Dropbox에 연결되었습니다.')
                window.close();
            }
        });
    }
    
    
    /*document.getElementById('writeButton').onclick = function () {
        client.authenticate(function (error, client) {
            if (error) {
                alert('Error: ' + error);
            } else {
                alert('success');
            }
        });
    }*/
})();