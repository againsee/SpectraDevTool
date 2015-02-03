var Notification=(function(){
    var notification=null;
 
    return {
        displayContent:function(icon,title,content){
            notification=webkitNotifications.createNotification(icon,title,content);
            notification.show();
        },
        displayURL:function(url){
            notification=webkitNotifications.createHTMLNotification(url);
            notification.show();
        },
        hide:function(){
            notification.close();
        }
    };
})();
 
chrome.browserAction.onClicked.addListener(function(windowId){
    var icon="pixelstech.gif",title="PixelsTech Website Statistic Viewer",content="1,000,000";
    Notification.displayContent(icon,title,content);
});