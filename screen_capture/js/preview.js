$(function() {
    var bg = chrome.extension.getBackgroundPage();

    if (bg.screenshot) 
	{
        $('<img />').attr({'src': bg.screenshot, 'id': 'screenshot-img'}).appendTo(document.body);    
        
        var canvas = $('<canvas />').attr('id', 'screenshot');
        var context = canvas[0].getContext('2d');
        var img = new Image();
        var stored = false;
        
	    img.onload = function() 
	    {
	        /*if(this.width < window.innerWidth - 100) 
	        {
	            $(canvas).css({marginTop: 100});
	        }*/
	        canvas.attr({width: this.width, height: this.height}).css({backgroundImage: "url(" + bg.screenshot + ")"});
	        //canvas.appendTo(document.body);
	        canvas.appendTo($('#sketch'));
	        //canvas.sketch();
	        
	        var obj = new DrawingTool('#screenshot');
	        obj.init({tool:'rectangle'});
	    }
	    
	    img.src = bg.screenshot;
    }
});
