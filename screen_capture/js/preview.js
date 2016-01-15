var screenshotHistory = [];
var drawingTool = null;
var previousUuid;

/**
 * 화면 캡쳐시 초기화 하는 함수
 */
var initPreview = function(image)
{
    var bg = chrome.extension.getBackgroundPage();
    
    var canvas = null;
    var context = null;
    
    if (typeof image == 'string')
    {
    	var pattern = /^data:image/g; // data:image로 시작하는..
    	if (pattern.test(image))
    	{
    		bg.screenshot = image;
    	}
    }
    
    if (bg.screenshot) 
	{	
    	var uuid = generateUUID();
    	
        $('<img />').attr({'src': bg.screenshot, 'class': 'screenshot-img'}).appendTo(document.body);    
        
        var canvas = document.querySelector('#screenshot');
        if (!canvas)
        {
	        canvas = document.createElement('canvas');
	        canvas.id = 'screenshot';
        }
        
        context = canvas.getContext('2d');
        
        var img = new Image();
        
	    img.onload = function() 
	    {
	    	canvas.width = this.width;
	    	canvas.height = this.height;
	    	canvas.uuid = uuid;
	    	
	    	context.drawImage(img, this.width, this.height);
	    	
	        if ($('#sketch').find('#screenshot').length == 0)
	        {
	        	$('#sketch').append(canvas);
	        	
	        	drawingTool = new DrawingTool('#screenshot');
	        	drawingTool.init({tool:'rectangle'});
	        }
	        else
	        {
	        	$('#tmp_canvas').attr({width : this.width, height : this.height});
	        }
		    
	        screenshotHistory[uuid] = [];
	        
	        var html = '';
	        html += '<li id="' + uuid + '" class="thumbnail-li selected">';
	        html += '<img src="' + bg.screenshot + '" class="thumbnail_img">';
	        html += '<img src="images/_close.png" class="thumbnail_close" title="닫기" />'
	        html += '</li>';
	        
	        
	        var thumbnailItem = $('#thumbnail').find('ul');
	        thumbnailItem.find('li').removeClass('selected');
	        
	        $(html).appendTo(thumbnailItem)
	        	.on('click', onThumbnailClick) // thumbnail click 이벤트
	        	.hover(function() { // 닫기버튼 hover 이벤트
	        		$(this).find('.thumbnail_close').show();
	        	}, function() {
	        		$(this).find('.thumbnail_close').hide();
	        	})
	        	.trigger('click');
	        
	        // 닫기버튼
	        $('#' + uuid).find('.thumbnail_close').on('click', onThumbnailCloseClick);
	        
	        $('#thumbnail').find('ul').width(getThumbnailWidth());
	        
	        $(window).on('resize', function() {
	        	$('#thumbnail').find('ul').width(getThumbnailWidth());
	        });
	        
	        bg.screenshot = null;
	    }
	    
	    img.src = bg.screenshot;
    }
}

/**
 * 파일추가 기능 - 파일을 Drag&Drop 했을 때
 */
function handleDragFileUpload(files, obj)
{
    var _self = this;
    var oFReader = null; 
    for (var i = 0; i < files.length; i++)
    {
    	console.error(files[i])
    	oFReader = new FileReader();
        oFReader.readAsDataURL(files[i]);

        oFReader.onload = function (obj) 
        {
        	chrome.extension.getBackgroundPage().screenshot = obj.target.result;
            initPreview(obj.target.result);
        };
    }
}
    
/**
 * thumbnail의 width를 가져온다.
 * @returns {Number}
 */
function getThumbnailWidth()
{
	var width = $('#thumbnail').find('ul > li').length * 150;
    if (width < $(window).width())
    {
    	width = $(window).width();
    }
    return width;
}

/**
 * UUID를 생성
 * @returns
 */
function generateUUID()
{
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

/**
 * thumbnail 클릭시 이벤트
 * @param e
 */
function onThumbnailClick(e)
{
	$('#thumbnail').find('ul > li').removeClass('selected');
	$(this).addClass('selected');
	
	var uuid = $(this).attr('id');
	$('#screenshot').attr('uuid', uuid)
	
	var canvas = document.querySelector('#screenshot')
	var context = canvas.getContext('2d');

	var tmpCanvas = document.querySelector('#tmp_canvas');
	var tmpCtx = tmpCanvas.getContext('2d');
	tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
	
	// 이전정보 지우기
	var canvas = document.querySelector('#screenshot');
	var context = canvas.getContext('2d');
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	// 그리기
	var img = new Image();
	var length = screenshotHistory[uuid].length;
	var src = screenshotHistory[uuid][length-1];
	if (length <= 0)
	{
		src = $('#thumbnail').find('#' + uuid).find('img').attr('src');
	}
	img.onload = function()
    {
		canvas.width = this.width;
		canvas.height = this.height;
		tmpCanvas.width = this.width;
		tmpCanvas.height = this.height;
		
		context.drawImage(img, 0, 0);
    }
	img.src = src;
}

/**
 * thumbnail 닫기 버튼 클릭시
 * @param e
 */
function onThumbnailCloseClick(e)
{
	e.preventDefault();
	e.stopImmediatePropagation();
	var liObj = $(this).parent('li.thumbnail-li');
	if (liObj.next('li').length)
	{
		liObj.next('li').first().trigger('click');
	}
	else if (liObj.prev('li').length)
	{
		liObj.prev('li').last().trigger('click');
	}
	else
	{
		var canvas = document.querySelector('#screenshot');
		var context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	liObj.fadeOut(function() {
		liObj.remove();
		delete screenshotHistory[$(this).attr('id')];
	});
}

function addThumbnailEvent(e)
{
    var movableTimer;
    $('#thumbnail').find('.forward').hover(function() {
    	movable = true;
    	movableTimer = setInterval(function() {
    		var left = parseInt($('#thumbnail').find('ul').css('left'));
        	var lastLeft = parseInt($('#thumbnail').find('ul > li').last().offset().left);
        	
        	if ($(window).width() - lastLeft > 140)
        	{
        		return;
        	}
    		$('#thumbnail').find('ul').css({left : left-5});
    	}, 10)
    }, function() {
    	clearTimeout(movableTimer);
    });
    
    $('#thumbnail').find('.backward').hover(function() {
    	movable = true;
    	movableTimer = setInterval(function() {
    		var left = parseInt($('#thumbnail').find('ul').css('left'));
    		var firstLeft = parseInt($('#thumbnail').find('ul > li').first().offset().left);
    		if (firstLeft > 0) return;
    		$('#thumbnail').find('ul').css({left : left+5});
    	}, 10)
    }, function() {
    	clearTimeout(movableTimer);
    });
}

/**
 * 파일추가 버튼 클릭 후 파일 선택시
 * @param e
 */
function onAddFileChange(e)
{
	e.preventDefault();
	var files = e.target.files || e.dataTransfer.files;
    handleDragFileUpload(files);
}

/**
 * 메일전송화면에서 Send 버튼 클릭시
 * @param e
 */
function onSendMailClick(e)
{
	var from = $('#from', '#emailModal').val(); // 보내는사람
	var to = $('#to', '#emailModal').val(); // 받는사람
	var subject = $('#subject', '#emailModal').val(); // 제목
	var contents = $('#contents', '#emailModal').val(); // 내용

	// 유효성 체크
	if (!validateEmail(from))
	{
		alert('유효한 이메일 주소를 입력해주세요.');
		$('#from', '#emailModal').focus();
		return;
	}
	
	if (!validateEmail(to))
	{
		alert('유효한 이메일 주소를 입력해주세요.');
		$('#to', '#emailModal').focus();
		return;
	}
	
	if (!subject)
	{
		alert('제목을 입력해주세요.');
		$('#subject', '#emailModal').focus();
		return;
	}
	
	if (!contents)
	{
		alert('내용을 입력해주세요.');
		$('#contents', '#emailModal').focus();
		return;
	}
	
	var img = $('#screenshotHistoryAttachId').find('img');
	var dataUrl = [];
	
	img.each(function(i) {
		dataUrl.push($(this).attr('src'));
	});
	
	var param = {};
	param.from = from;
	param.to = to;
	param.subject = subject;
	param.contents = contents;
	param.dataUrl = dataUrl;
	
	$.ajax({
		type: "POST",
		url: "http://pms.spectra.co.kr/m/imgBase64Upload.jsp",
		contentType: "application/x-www-form-urlencoded; charset=utf-8",
		data: param
	}).success(function(response) {
		var json = JSON.parse(response);
		if (json.result == 'Y')
		{
			alert('메일발송을 하였습니다.');
			$('#emailModal').modal('hide');
		}
		else
		{
			alert('메일발송에 실패하였습니다.');
		}
	}).error(function() {
		alert('메일발송에 실패하였습니다.');
	});
}

/**
 * 이메일 유효성 검증
 * @param email
 * @returns
 */
function validateEmail(email) 
{
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

/**
 * keydown 이벤트 발생시
 * @param e
 */
function onDocumentKeydown(e)
{
	if (e.ctrlKey)
	{
		console.error('keycode : ' + e.keyCode)
		switch (e.keyCode)
		{
			case 90 : // Z
				$('.undo-tool').trigger('click');
				break;
		}
	}
}

$(function() {
	initPreview();
	
	addThumbnailEvent();
	
	$(window).on('focus', initPreview); // 캡쳐 미리보기
	
	$('#btnSendMail').on('click', onSendMailClick); // 메일전소 클릭시
	
	$('[data-toggle="tooltip"]').tooltip(); // 툴팁
	
	$('#add-file-form').find('#files').on('change', onAddFileChange); // 파일추가에서 파일 선택
	
	$(document).on('keydown', onDocumentKeydown); // keydown 이벤트 발생시
})

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) 
{
});