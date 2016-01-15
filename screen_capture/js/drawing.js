(function($, window, document, undefined) {
	var DrawingTool = function(element) {
		this.element = element;
		this.$element = $(element);
		this.options = null;
		this.canvas = null;
		this.ctx = null;
		this.paintPanel = null;
		this.tmpCanvas = null;
		this.tmpCtx = null;
		this.tmpTextContainer = null;
		this.undoList = [];
		this.undoCount = 0;
		this.sprayIntervalId = null;
		this.mouse = {
			x : 0,
			y : 0
		};
		this.start_mouse = {
			x : 0,
			y : 0
		};
		this.ppts = [];
		this.textarea = null;
	};

	DrawingTool.prototype =
	{
		constructor : DrawingTool,
		defaults :
		{
			tool : 'rectangle',
			lineWidth : 6,
			color : '#f79232'
		},
		init : function(options)
		{
			this.options = $.extend({}, this.defaults, options);

			this.draw();

			$('<div />').css({'position' : 'absolute', 'right' : '0', 'bottom' : '0'}).attr('id', 'debug').appendTo('body');
			$('<div />').attr('id', 'pos').appendTo('#debug');
			$('<div />').attr('id', 'mouse').appendTo('#debug');

			return this;
		},
		debug : function(id, str)
		{
			$('#' + id).html(str);
		},
		draw : function() {
			var _self = this;
			this.canvas = document.querySelector('#' + this.$element.attr('id'));
			this.ctx = this.canvas.getContext('2d');
			this.paintPanel = $('#sketch');

			this.tmpCanvas = document.createElement('canvas');
			this.tmpCtx = this.tmpCanvas.getContext('2d');
			this.tmpCanvas.id = 'tmp_canvas';
			this.tmpCanvas.width = this.canvas.width;
			this.tmpCanvas.height = this.canvas.height;
			this.tmpCanvas.style.margin = this.canvas.style.margin;

			this.paintPanel.append(this.tmpCanvas);

			// for text
			// this.textarea = document.createElement('textarea');
			// this.textarea.id = 'text_tool';
			this.textarea = $('<textarea />').css({
				position : 'absolute',
				border : '1px dashed black',
				outline : 0,
				display : 'block',
				overflow : 'hidden',
				width : '100%',
				height : '100%',
				'font-size' : '14px',
				'font-family' : 'dotum',
				color : _self.options.color
			}).attr('id', 'text_tool');

			var textLayer = $('<div id="textLayer" />').css({
				display:'block',
				position:'absolute',
				left:0,
				right:0,
				top:0,
				bottom:0,
				margin:'0px auto',
				//border:'1px solid red',
				width: this.tmpCanvas.width + 'px',
				height:'0'
			});

			this.paintPanel.append(textLayer);

			var textDiv = $('<div id="textDiv" />').css({
				width : '30px'
			})
			textLayer.append(textDiv);
			$('#textDiv').append(this.textarea);

			var tmpTextDiv = $('<div />').css({
				position : 'absolute',
				top : '-9999px',
				left : '-9999px',
				width : 'auto',
				height : 'auto',
				display : 'inline-block',
				padding : '2px',
				margin : 0
			}).attr('id', 'tmpTextDiv');
			this.paintPanel.append(tmpTextDiv); // .append(this.textarea);
			// this.textarea.appendTo('#textDiv')

			// Text tool's text container for calculating
			// lines/chars
			// this.tmpTextContainer = document.createElement('div');
			this.tmpTextContainer = $('<div />');
			// this.tmpTextContainer.style.display = 'none';
			// this.paintPanel.appendChild(this.tmpTextContainer);
			this.paintPanel.append(this.tmpTextContainer);

			this.textarea.on('keydown', this.onTextareaKeydown.bind(this));

			this.addToolEvent();
			this.addCanvasEvent();
		},

		addToolEvent : function() {
			var _self = this;
			/*
			 * document.querySelector('#eraser').onclick = function () { if
			 * (this.checked) { _self.options.tool = 'eraser'; } // Hide Tmp
			 * Canvas _self.tmpCanvas.style.display = 'none'; };
			 */

			$('.save-tool-panel, .paint-tool, .close, body').on('click', function() {
				//console.error('paint-tool click');
				_self.drawText();
				$('#textDiv').hide();
			});

			// 저장
			$('#save').on('click', function() {
				//console.error('save click')
	            var saveCanvas = document.createElement('canvas')
	            var saveContext = saveCanvas.getContext('2d');

	            saveCanvas.width = this.canvas.width;
	            saveCanvas.height = this.canvas.height;

	            var bg = chrome.extension.getBackgroundPage();

				var img = new Image();
				//img.src = bg.screenshot;
				var uuid = $('#screenshot').attr('uuid');
				img.src = $('#thumbnail').find('#' + uuid).find('img').attr('src');

				saveContext.drawImage(img, 0, 0);
				saveContext.drawImage(this.canvas, 0, 0);

				var image = saveCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.

				var filename = this.getSaveFileName();
				var link = document.createElement('a');
                link.download = filename;
                link.href = image;
                link.click();
				//window.location.href = image;
			}.bind(this));

			// 하나의 파일로 저장
			$('#saveAsOne').on('click', function() {
				var _self = this;
	            var saveCanvas = document.createElement('canvas')
	            var saveContext = saveCanvas.getContext('2d');

	            //saveCanvas.width = this.canvas.width;
	            //saveCanvas.height = this.canvas.height;

	            var bg = chrome.extension.getBackgroundPage();

				var thumbnailImages = $('#thumbnail').find('.thumbnail-li').find('img.thumbnail_img');

				var img = null;
				var top = 0;
				var saveCanvasWidth = 0;
				var saveCanvasHeight = 0;

				saveCanvas.height = 1280* thumbnailImages.length;
				saveCanvas.width = 1920;
				/*if (this.width > saveCanvas.width)
				{
					saveCanvas.width = this.width;
				}*/

				for (var i = 0; i < thumbnailImages.length; i++)
				{
					(function(i) {
						img = new Image();
						img.onload = function()
						{
							saveContext.drawImage(this, 0, top, this.width, this.height);
							//saveContext.drawImage(_self.canvas, 0, top, this.width, this.height);

							top = this.height;

							if (i == thumbnailImages.length-1)
							{
								var image = saveCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
								var filename = _self.getSaveFileName();
								var link = document.createElement('a');
					            link.download = filename;
					            link.href = image;
					            link.click();
							}
						}

						img.src = $(thumbnailImages[i]).attr('src');
					})(i);
				}

			}.bind(this));

			// 파일 추가
			$('#addAttach').on('click', function() {
				$('#files').trigger('click');
			});

			$('#clipboard').on('click', function() {
				if ($('#clipboard_layer').length > 0)
				{
					$('#clipboard_layer').remove();
				}

				var dataUrl = document.querySelector('#screenshot').toDataURL("image/png");
				var html = '<div id="clipboard_layer">';
				html += '<center>';
				html += '<span class="panel">';
				html += '<h2>이미지에 마우스 우클릭을 하고 이미지 복사를 클릭하세요.</h2>';
				html += '<img src="' + dataUrl + '">';
				html += '<span class="close">X</span>';
				html += '</span>';
				html += '</center>';
				html += '</div>';

				$(html).appendTo('body');

				$('#clipboard_layer').find('.close').on('click', function() {
					$('#clipboard_layer').remove();
				});

				$(document).on('keydown.clipboard_layer', function(e) {
					if (e.keyCode == 27) // ESC
					{
						$('#clipboard_layer').remove();

						$(document).off('keydown.clipboard_layer');
					}
				});

			}.bind(this));

			$('#share').on('click', function() {
				//alert('소설 서비스 연결 - Dropbox, Google Drive');
				//window.open('chrome_oauth_receiver.html');

				var client = new Dropbox.Client({ key: "9yv09mjzt1pt5z4" });
				client.authDriver(new Dropbox.AuthDriver.ChromeExtension());
			    credentials = localStorage.getItem('DropboxOAuth');
			    if (credentials) {
			    	client.setCredentials(JSON.parse(credentials));
			    }

				if (!client.isAuthenticated())
				{
					window.open('connect_to_dropbox.html');
				}
				else
				{
					alert('인증완료');
				}
			}.bind(this));

			$('#sendEmail').on('click', function(e) {

				$('#screenshotHistoryAttachId').html('');

				for (var uuid in screenshotHistory)
				{
					console.error('uuid : ' + uuid);
					console.error('length : ' + screenshotHistory[uuid].length);
					var length = screenshotHistory[uuid].length;
					var src = null;

					if (length)
					{
						src = screenshotHistory[uuid][length-1];
					}
					else
					{
						src = $('#' + uuid).find('img').attr('src');
					}

					//var html = $('<a class="thumbnail" />').append('<img />').attr('src', src);
					var html = '<a href="#" class="img-thumbnail" style="margin-left:10px; margin-left:10px;">';
					html += '<img src="' + src + '" style="width:140px; height:85px;" id="img_' + uuid + '">';
					html += '</a>';

					$('#screenshotHistoryAttachId').append(html)
				}



			}.bind(this));

			// 그리기 도구 클릭 이벤트
			$('.paint-tool-panel > .paint-tool').on('click', function() {
				_self.tmpCanvas.style.display = 'block';
				_self.options.tool = $(this).attr('id');

				// 텍스트가 있을때 그려준다.
				_self.drawText();
				$('#textDiv').hide();

				// crop
				if (_self.options.tool == 'crop')
				{
					//_tmpCanvas.on('mousemove', _self.onCropPaint.bind(_self));
					_self.onCropPaint();
				}
			});

			// 선 굵기 설정
			$("#lineWidth").slider({
				range : "min",
				min : 1,
				max : 10,
				step : 1,
				value : _self.options.lineWidth,
				slide : function(event, ui) {
					$('#lineWidthText').html(_self.getSlideDisplay(ui.value));
				}
			});

			$("#lineWidthText").html(_self.getSlideDisplay(_self.options.lineWidth));

			// 선 굵기 이벤트
			$('#lineWidth').on("slidestop", function(event, ui) {
				_self.options.lineWidth = ui.value;
			});

			// 색깔 초기화 설정
			this.options.color = $('.color-list > li').first().css(
					'background-color');
			$('.color-picker').css({
				'background-color' : this.options.color
			});

			// 그리기 도구 마우스 오버 이벤트
			$('li.paint-tool, li.color-tool, li.undo-tool, li.trash-tool').hover(function() {
				if ($(this).attr('selected')) {
					return;
				}
				$(this).addClass('selected');
			}, function() {
				if ($(this).attr('selected')) {
					return;
				}
				$(this).removeClass('selected');
			});

			// 그리기 도구 클릭이벤트
			$('.paint-tool-panel > li.paint-tool').on('click', function() {
				$('.paint-tool-panel > .paint-tool').removeClass('selected');
				$('.paint-tool-panel > .paint-tool').removeAttr('selected');
				$(this).addClass('selected');
				$(this).attr('selected', true);
			});

			// 그리기 도구 초기화 설정
			$('li.paint-tool[id="' + this.options.tool + '"]').trigger('click');

			// 색깔선택도구 클릭 이벤트
			$('.color-tool').on('click', function() {
				if ($('.color-list').hasClass('hide')) {
					$('.color-list').removeClass('hide');
					$('.color-picker > .caret').removeClass('hide');
				} else {
					$('.color-list').addClass('hide');
					$('.color-picker > .caret').addClass('hide');
				}
			});

			// 색깔 목록 마우스 오버 이벤트
			$('.color-list > li').hover(function() {
				$(this).addClass('color-mouseover');
			}, function() {
				$(this).removeClass('color-mouseover');
			})

			// 색깔 목록 클릭 이벤트
			$('.color-list > li').on('click', function() {
				$('.color-picker').css({
					'background-color' : $(this).css('background-color')
				});
				_self.options.color = $(this).css('background-color');
			});

			$('.undo-tool').on('click', function() {
				var uuid = $('#screenshot').attr('uuid');
				var length = screenshotHistory[uuid].length;

				//console.error('_self.undoCount : ' + _self.undoCount)
				if (length <= 0)
				{
					return;
				}
				/*if (_self.undoCount < 1)
				{
					return;
				}*/
				// Clearing tmp canvas
				setTimeout(function() {
					_self.tmpCtx.clearRect(0, 0, _self.tmpCanvas.width, _self.tmpCanvas.height);

					var bg = chrome.extension.getBackgroundPage();

					//var img = new Image();
					//img.src = $('#thumbnail').find('#' + uuid).find('img').attr('src');

					/*_self.tmpCtx.drawImage(img, 0, 0);
					_self.ctx.drawImage(img, 0, 0);*/

					img = new Image();
					img.onload = function ()
					{
			        	//_self.tmpCtx.drawImage(img, 0, 0);
			        	_self.ctx.drawImage(img, 0, 0);
			        }
					//console.error('length : ' + length)
					var src = screenshotHistory[uuid][length - 2];
					if (length < 2)
					{
						src = $('#thumbnail').find('#' + uuid).find('img').attr('src');
					}
					img.src = src;

					/*var html = "<img src='" + src + "' width=200 height=200' style='border:1px solid red' />"
					$('#debug').append(html);

					if ($('#debug').find('img').length == 5)
					{
						$('#debug').find('img').eq(0).remove();
					}*/

					//console.error('ssss : ' + screenshotHistory[uuid][length - 2])

					_self.undoCount--;
					//_self.undoList.pop();
					screenshotHistory[uuid].pop();
				}, 10)

			}.bind(this));

			$('.trash-tool').on('click', function() {
				setTimeout(function() {
					var bg = chrome.extension.getBackgroundPage();

					var img = new Image();
					//img.src = bg.screenshot;
					var uuid = $('#screenshot').attr('uuid');
					img.src = $('#thumbnail').find('#' + uuid).find('img').attr('src');

					_self.tmpCtx.drawImage(img, 0, 0);
					_self.ctx.drawImage(img, 0, 0);

					var uuid = $('#screenshot').attr('uuid');
					screenshotHistory[uuid] = [];
				}, 10)

			}.bind(this));

			$('#close').on('click', function() {
				window.close();
			});
		},

		/**
		 * canvas의 mousedown, mousemove, mouseup 이벤트를 정의
		 */
		addCanvasEvent : function() {
			var _self = this;
			var _tmpCanvas = $('#' + _self.tmpCanvas.id);

			// mousemove 이벤트
			this.tmpCanvas.addEventListener('mousemove', function(e) {
				_self.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
				_self.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
				_self.debug('pos', 'x : ' + _self.mouse.x + ', y : ' + _self.mouse.y);
				_self.debug('mouse', 'mousemove');
			});

			// mousedown 이벤트
			this.tmpCanvas.addEventListener('mousedown', function(e) {
				// console.error('tmpCanvas mousedown');
				_self.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
				_self.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;

				_self.debug('pos', 'x : ' + _self.mouse.x + ', y : ' + _self.mouse.y);
				_self.debug('mouse', 'mousedown');

				_self.start_mouse.x = _self.mouse.x;
				_self.start_mouse.y = _self.mouse.y;

				if (_self.options.tool == 'line')
				{
					_tmpCanvas.on('mousemove', _self.onLinePaint.bind(_self));
				}
				else if (_self.options.tool == 'arrow')
				{
					_tmpCanvas.on('mousemove', _self.onArrowPaint.bind(_self));
				}
				else if (_self.options.tool == 'rectangle')
				{
					_tmpCanvas.on('mousemove', _self.onRectPaint.bind(_self));
				}
				else if (_self.options.tool == 'brush')
				{
					_tmpCanvas.on('mousemove', _self.onBrushPaint.bind(_self));
				}
				else if (_self.options.tool == 'spray')
				{
					_self.tmpCtx.strokeStyle = _self.options.color;
					_self.tmpCtx.fillStyle = _self.options.color;

					_self.sprayIntervalId = setInterval(function() {
						_self.onSprayPaint(_self.tmpCtx);
					}, 10);
					//_tmpCanvas.on('mousemove', _self.onSprayPaint.bind(_self));
				}
				else if (_self.options.tool == 'circle')
				{
					_tmpCanvas.on('mousemove', _self.onCirclePaint.bind(_self));
				}
				else if (_self.options.tool == 'text')
				{
					_self.onText();
				}
				else if (_self.options.tool == 'blur')
				{
					_tmpCanvas.on('mousemove', _self.onBlurPaint.bind(_self));
				}
				else if (_self.options.tool == 'select')
				{
					_self.onSelect();

				}
				/*else if (_self.options.tool == 'crop')
				{
					//_tmpCanvas.on('mousemove', _self.onCropPaint.bind(_self));
					_self.onCropPaint.bind(_self);
				}*/

			}, false);

			// mouseup 이벤트
			this.tmpCanvas.addEventListener('mouseup', function(e) {
				 //console.error('mouseup');
				_tmpCanvas.off('mousemove');
				_self.debug('mouse', '');

				_self.debug('mouse', 'mouseup');

				// console.error('_self.options.tool : ' + _self.options.tool);
				if (_self.options.tool == 'text')
				{
					_self.onText();
				}
				else if (_self.options.tool == 'spray')
				{
					clearInterval(_self.sprayIntervalId);
				}

				// Writing down to real canvas now
				_self.ctx.drawImage(_self.tmpCanvas, 0, 0);

				//console.error('add : ' + _self.canvas.toDataURL())
				//_self.undoList.push(_self.tmpCanvas.toDataURL());
				_self.addUndoList();

				// Clearing tmp canvas
				_self.tmpCtx.clearRect(0, 0, _self.tmpCanvas.width, _self.tmpCanvas.height);

				_self.ppts = [];
			}, false);

			this.tmpCanvas.addEventListener('contextmenu', function(e) {
			});

			this.canvas.addEventListener('mousemove', function(e) {
				_self.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
				_self.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
			}, false);

			this.canvas.addEventListener('mousedown', function(e) {
				_self.canvas.addEventListener('mousemove', _self.onErase, false);

				_self.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
				_self.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;

				_self.ppts.push({
					x : _self.mouse.x,
					y : _self.mouse.y
				});

				_self.onErase();
			}, false);

			this.canvas.addEventListener('mouseup', function() {
				_self.canvas.removeEventListener('mousemove', _self.onErase
						.bind(_self), false);
				// Emptying up Pencil Points
				_self.ppts = [];
			});
		},

		onText : function() {
			var _self = this;
			//console.error('onText');

			_self.drawText();
			var x = Math.min(this.mouse.x, this.start_mouse.x);
			var y = this.mouse.y;
			var width = 30;
			var height = 30;

			if (_self.options.lineWidth < 3)
			{
				height = (_self.options.lineWidth+4) * 3
			}
			else
			{
				height = 20 + (_self.options.lineWidth - 3) * 5;
			}

			$('#textDiv').css({
				left : x,
				top : y,
				width : width,
				height : height,
				display : 'block',
				position : 'absolute'
			});

			this.textarea.css({'font-size' : parseInt(this.options.lineWidth)*5, 'font-weight' : 'bold', 'line-height' : '1.0', color : _self.options.color});
			this.textarea.val('');
			setTimeout(function() {
				_self.textarea.focus();
			}, 100);

		},

		onSelect : function()
		{
			//console.error('onselect')
		},

		onErase : function() {
			var _self = this;

			this.ppts.push({
				x : this.mouse.x,
				y : this.mouse.y
			});

			this.ctx.globalCompositeOperation = 'destination-out';
			this.ctx.fillStyle = 'rgba(0,0,0,1)';
			this.ctx.strokeStyle = 'rgba(0,0,0,1)';
			this.ctx.lineWidth = this.options.lineWidth;

			if (this.ppts.length < 3) {
				var b = this.ppts[0];
				this.ctx.beginPath();
				this.ctx.arc(b.x, b.y, this.ctx.lineWidth / 2, 0, Math.PI * 2,
						!0);
				this.ctx.fill();
				this.ctx.closePath();

				return;
			}

			this.ctx.beginPath();
			this.ctx.moveTo(this.ppts[0].x, this.ppts[0].y);

			for (var i = 1; i < this.ppts.length - 2; i++) {
				var c = (this.ppts[i].x + this.ppts[i + 1].x) / 2;
				var d = (this.ppts[i].y + this.ppts[i + 1].y) / 2;

				this.ctx.quadraticCurveTo(this.ppts[i].x, this.ppts[i].y, c, d);
			}

			// For the last 2 points
			this.ctx.quadraticCurveTo(this.ppts[i].x, this.ppts[i].y,
					this.ppts[i + 1].x, this.ppts[i + 1].y);
			this.ctx.stroke();

		},

		onCirclePaint : function() {
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);

			var x = (this.mouse.x + this.start_mouse.x) / 2;
			var y = (this.mouse.y + this.start_mouse.y) / 2;

			/*
			var radius = Math.max(Math.abs(this.mouse.x - this.start_mouse.x), Math.abs(this.mouse.y - this.start_mouse.y)) / 2;

			this.tmpCtx.beginPath();
			this.tmpCtx.arc(x, y, radius, 0, Math.PI * 2, false);
			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.lineWidth = this.options.lineWidth;
			this.tmpCtx.stroke();
			this.tmpCtx.closePath();*/

			var x = Math.min(this.mouse.x, this.start_mouse.x);
			var y = Math.min(this.mouse.y, this.start_mouse.y);

			var w = Math.abs(this.mouse.x - this.start_mouse.x);
			var h = Math.abs(this.mouse.y - this.start_mouse.y);

			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.lineWidth = this.options.lineWidth;

			this.drawEllipse(this.tmpCtx, x, y, w, h);
		},

		drawEllipse : function(ctx, x, y, w, h)
		{
			var kappa = .5522848;
		      ox = (w / 2) * kappa, // control point offset horizontal
		      oy = (h / 2) * kappa, // control point offset vertical
		      xe = x + w,           // x-end
		      ye = y + h,           // y-end
		      xm = x + w / 2,       // x-middle
		      ym = y + h / 2;       // y-middle

		      ctx.beginPath();
		      ctx.moveTo(x, ym);
		      ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		      ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		      ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		      ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		      ctx.closePath();
		      ctx.stroke();
		},

		onLinePaint : function()
		{
			this.tmpCtx.lineWidth = this.options.lineWidth;
			this.tmpCtx.lineJoin = 'round';
			this.tmpCtx.lineCap = 'round';
			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.fillStyle = this.options.color;
			this.tmpCtx.shadowColor = "#808080";
			this.tmpCtx.shadowOffsetX = 2;
			this.tmpCtx.shadowOffsetY = 2;
			this.tmpCtx.shadowBlur = 2;
			// Tmp canvas is always cleared up before drawing.
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);

			this.tmpCtx.beginPath();
			this.tmpCtx.moveTo(this.start_mouse.x, this.start_mouse.y);
			this.tmpCtx.lineTo(this.mouse.x, this.mouse.y);
			this.tmpCtx.stroke();
			this.tmpCtx.closePath();

		},

		onArrowPaint : function()
		{
			this.tmpCtx.lineWidth = this.options.lineWidth;
			this.tmpCtx.lineJoin = 'round';
			this.tmpCtx.lineCap = 'round';
			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.fillStyle = this.options.color;
			this.tmpCtx.shadowColor = "#808080";
			this.tmpCtx.shadowOffsetX = 2;
			this.tmpCtx.shadowOffsetY = 2;
			this.tmpCtx.shadowBlur = 2;
			// Tmp canvas is always cleared up before drawing.
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);

			this.tmpCtx.beginPath();
			this.tmpCtx.moveTo(this.start_mouse.x, this.start_mouse.y);
			this.tmpCtx.lineTo(this.mouse.x, this.mouse.y);

			this.tmpCtx.stroke();

			// Arrow head
			var angle = Math.atan2(this.mouse.y - this.start_mouse.y, this.mouse.x - this.start_mouse.x);
			this.tmpCtx.translate(this.mouse.x, this.mouse.y);

			var size = 30;

			// Right side
			this.tmpCtx.rotate(angle + 1);
			this.tmpCtx.beginPath();
			this.tmpCtx.moveTo(0, size);
			this.tmpCtx.lineTo(0, 0);
			this.tmpCtx.stroke();

			// Left side
			this.tmpCtx.rotate(-2);
			this.tmpCtx.lineTo(0, -size);
			this.tmpCtx.stroke();

			this.tmpCtx.rotate(1 - angle);
			this.tmpCtx.translate(-this.mouse.x, -this.mouse.y);

			this.tmpCtx.closePath();

		},

		onRectPaint : function()
		{
			this.tmpCtx.lineWidth = this.options.lineWidth;
			this.tmpCtx.lineJoin = 'round';
			this.tmpCtx.lineCap = 'round';
			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.fillStyle = this.options.color;
			this.tmpCtx.shadowColor = "#808080";
			this.tmpCtx.shadowOffsetX = 2;
			this.tmpCtx.shadowOffsetY = 2;
			this.tmpCtx.shadowBlur = 2;

			// Tmp canvas is always cleared up before drawing.
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);

			var x = Math.min(this.mouse.x, this.start_mouse.x);
			var y = Math.min(this.mouse.y, this.start_mouse.y);
			var width = Math.abs(this.mouse.x - this.start_mouse.x);
			var height = Math.abs(this.mouse.y - this.start_mouse.y);
			this.tmpCtx.strokeRect(x, y, width, height);
		},

		// Pencil Points
		// var ppts = [];

		onBrushPaint : function()
		{
			this.ppts.push({
				x : this.mouse.x,
				y : this.mouse.y
			});

			if (this.ppts.length < 3)
			{
				var b = this.ppts[0];
				this.tmpCtx.lineWidth = this.options.lineWidth;
				this.tmpCtx.lineJoin = 'round';
				this.tmpCtx.lineCap = 'round';
				this.tmpCtx.strokeStyle = this.options.color;
				this.tmpCtx.fillStyle = this.options.color;
				this.tmpCtx.shadowColor = "#808080";
				this.tmpCtx.shadowOffsetX = 2;
				this.tmpCtx.shadowOffsetY = 2;
				this.tmpCtx.shadowBlur = 2;
				this.tmpCtx.beginPath();
				// ctx.moveTo(b.x, b.y);
				// ctx.lineTo(b.x+50, b.y+50);
				this.tmpCtx.arc(b.x, b.y, this.tmpCtx.lineWidth / 2, 0, Math.PI * 2, !0);
				this.tmpCtx.fill();
				this.tmpCtx.closePath();

				return;
			}

			// Tmp canvas is always cleared up before drawing.
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);

			this.tmpCtx.beginPath();
			this.tmpCtx.moveTo(this.ppts[0].x, this.ppts[0].y);

			for (var i = 1; i < this.ppts.length - 2; i++)
			{
				var c = (this.ppts[i].x + this.ppts[i + 1].x) / 2;
				var d = (this.ppts[i].y + this.ppts[i + 1].y) / 2;

				this.tmpCtx.quadraticCurveTo(this.ppts[i].x, this.ppts[i].y, c, d);
			}

			// For the last 2 points
			this.tmpCtx.quadraticCurveTo(this.ppts[i].x, this.ppts[i].y, this.ppts[i + 1].x, this.ppts[i + 1].y);
			this.tmpCtx.stroke();

		},

		onSprayPaint : function(ctx)
		{
			var density = 50;

		    for (var i = 0; i < density; i++)
		    {
		        var offset = this.getRandomOffset(10);

		        var x = this.mouse.x + offset.x;
		        var y = this.mouse.y + offset.y;

		        ctx.fillRect(x, y, 1, 1);
		    }
		},

		getRandomOffset : function(radius)
		{
		    var random_angle = Math.random() * (2*Math.PI);
		    var random_radius = Math.random() * radius;

		    // console.log(random_angle, random_radius, Math.cos(random_angle), Math.sin(random_angle));

		    return {
		        x: Math.cos(random_angle) * random_radius,
		        y: Math.sin(random_angle) * random_radius
		    };
		},

		onBlurPaint : function()
		{
			var _self = this;
			_self.tmpCtx.lineWidth = _self.options.lineWidth;
			_self.tmpCtx.lineJoin = 'round';
			_self.tmpCtx.lineCap = 'round';
			_self.tmpCtx.strokeStyle = '#ffffff';

			_self.tmpCtx.shadowBlur = 10;
			_self.tmpCtx.shadowOffsetX = 0;
			_self.tmpCtx.shadowOffsetY = 0;

			_self.tmpCtx.fillStyle="#ffffff";
			_self.tmpCtx.shadowColor="#ffffff"; //set the shadow colour to that of the fill
			_self.tmpCtx.globalAlpha = "0.6";


			// Tmp canvas is always cleared up before drawing.
			_self.tmpCtx.clearRect(0, 0, _self.tmpCanvas.width, _self.tmpCanvas.height);

			var x = Math.min(_self.mouse.x, _self.start_mouse.x);
			var y = Math.min(_self.mouse.y, _self.start_mouse.y);
			var width = Math.abs(_self.mouse.x - _self.start_mouse.x);
			var height = Math.abs(_self.mouse.y - _self.start_mouse.y);

			_self.tmpCtx.fillRect(x, y, width, height);

			isDown = false;
			//this.tmpCtx.save();
			//_self.tmpCtx.globalCompositeOperation = "source-in";
			//_self.tempCtx.drawImage(img, 0, 0);
			//_self.tempCtx.restore();
		   // boxBlurCanvasRGBA('tmp_canvas', x, y, width, height, 4, 0);
		    /*ctx.save();
		    ctx.clearRect(0, 0, canvas.width, canvas.height);
		    ctx.drawImage(tempCanvas, 0, 0);
		    ctx.globalCompositeOperation = "destination-over";
		    ctx.drawImage(img, 0, 0);*/
		},

		onCropPaint : function()
		{
			var _self = this;

			/*console.error(_self.tmpCanvas.toDataURL());
			console.error('onCropPaint');
			var imageObj = new Image();

		      imageObj.onload = function() {
		    	  _self.tmpCtx.drawImage(imageObj, 0, 0);

		    	  var selection = $('#crop_image').imgAreaSelect({
				        handles: true,
				       // x1: coords.x1, y1: coords.y1, x2: coords.x2, y2: coords.y2,
				        onSelectEnd: function(img, selection) {
				            coords = selection;
				        },
				        instance: true,
				        keys: true, // keyboard 가능여부
				        persistent: true // selection 외부 선택시 선택해제
				    });
		      };
		      imageObj.id = 'crop_image';
		      imageObj.src = 'http://www.html5canvastutorials.com/demos/assets/darth-vader.jpg';

			*/
		},

		onTextareaKeydown : function() {
			//console.error('onTextareaKeydown')
			var _self = this;
			setTimeout(function() {
				// console.error('textarea keydown');
				var text = _self.textarea.val();
				// console.error('text : ' + text);
				text = text.replace(/\n/g, '<br/>');
				// console.error('replace text : ' + text);
				var fontSize = _self.textarea.css('font-size');
				var fontFamily = _self.textarea.css('font-family');
				$('#tmpTextDiv').css({
					'font-size' : fontSize,
					'font-family' : fontFamily,
					'font-weight' : 'bold',
					'line-height' : '1.0'
				}).html(text + '&nbsp;&nbsp;');

				setTimeout(function() {
					var width = $('#tmpTextDiv').width();
					var height = $('#tmpTextDiv').height();
					if (width < 30)
					{
						width = 30;
					}

					/*if (height < 25)
					{
						height = 25;
					}*/

					/*if (_self.options.lineWidth < 3)
					{
						height = (_self.options.lineWidth+4) * 3
					}
					else
					{
						height = 20 + (_self.options.lineWidth - 3) * 5;
					}*/

					// console.error('width : ' + width)
					$('#textDiv').css({
						width : width + 10,
						height : height + 5
					});
				}, 10);

			}, 10);
		},
		/**
		 * 텍스트를 화면에 표시
		 */
		drawText : function() {
			//console.error('drawText');
			var _self = this;
			if ($.trim(_self.textarea.val()) == '')
			{
				return;
			}
			var fontSize = _self.textarea.css('font-size');
			var fontFamily = _self.textarea.css('font-family');
			var fontColor = _self.options.color;

			var arTextarea = _self.textarea.val().split('\n');
			if (arTextarea.length > 0)
			{
				_self.tmpCtx.font = 'bold ' + fontSize + ' ' + fontFamily;
				_self.tmpCtx.fillStyle = fontColor;

				/*if (_self.options.lineWidth < 3)
				{
					height = (_self.options.lineWidth+4) * 3
				}
				else
				{
					height = 20 + (_self.options.lineWidth - 3) * 5;
				}*/

				var adjust = 0; // 보정값

				switch (_self.options.lineWidth)
				{
					case 1 :
						adjust = 2;
						break;
					case 2 :
						adjust = 2;
						break;
					case 3 :
						adjust = 6;
						break;
					case 4 :
						adjust = 10;
						break;
					case 5 :
						adjust = 14;
						break;
					case 6 :
						adjust = 19;
						break;
					case 7 :
						adjust = 23;
						break;
					case 8 :
						adjust = 27;
						break;
					case 9 :
						adjust = 32;
						break;
					case 10 :
						adjust = 36;
						break;
					default :
						adjust = 30;
				}
				for (var i = 0; i < arTextarea.length; i++)
				{
					var x = parseInt($('#textDiv').css('left')) + 3;
					var y = parseInt($('#textDiv').css('top')) + i*parseInt(fontSize) + adjust + 10;
					_self.tmpCtx.fillText(arTextarea[i], x, y);
				}

				_self.ctx.drawImage(_self.tmpCanvas, 0, 0);

				//_self.undoList.push(_self.tmpCanvas.toDataURL());
				_self.addUndoList();

				_self.tmpCtx.clearRect(0, 0, _self.tmpCanvas.width, _self.tmpCanvas.height);

				_self.ppts = [];

				$('#tmpTextDiv').html('');
				_self.textarea.val('');
			}
		},

		/**
		 * Slide 두께 표시방식을 Text로 가져오는 함수
		 */
		getSlideDisplay : function(value)
		{
			return '두께 : ' + value;
		},

		/**
		 * Undo List에 추가하는 함수
		 */
		addUndoList : function()
		{
			var _self = this;
			setTimeout(function() {
				//$('body').append('<img src="' + str + '" border=1 width="300"/>')

				/*_self.undoList.push(str);
				_self.undoCount++;*/

				var historyCanvas = document.createElement('canvas')
				var historyContext = historyCanvas.getContext('2d');

				historyCanvas.width = _self.canvas.width;
				historyCanvas.height = _self.canvas.height;

				var img = new Image();
				var uuid = $('#screenshot').attr('uuid');

				if (!screenshotHistory[uuid])
				{
					return;
				}

				var length = screenshotHistory[uuid].length;
				var src = screenshotHistory[uuid][length-1];
				if (length <= 0)
				{
					src = $('#thumbnail').find('#' + uuid).find('img').attr('src');
				}
				img.src = src;
				//img.src = $('#thumbnail').find('#' + uuid).find('img').attr('src');

				historyContext.drawImage(img, 0, 0);
				historyContext.drawImage(_self.canvas, 0, 0);

				//_self.canvas.toDataURL()
				var dataUrl = historyCanvas.toDataURL();
				//console.error('dataUrl : ' + dataUrl)
				var uuid = $('#screenshot').attr('uuid');

				// 이전값과 다를경우만 저장함.
				if (screenshotHistory[uuid][length-1] != dataUrl)
				{
					screenshotHistory[uuid].push(dataUrl);

					//var html = "<img src='" + dataUrl + "' width=200 height=200' />"
					//$('#debug').append(html);

				}
			}, 10)
		},

		getSaveFileName : function()
		{
			var date = new Date();

			var year = date.getFullYear();
			var month = date.getMonth()+1;
			if (String(month).length == 1)
			{
				month = '0' + month;
			}
			var day = date.getDate();
			if (String(day).length == 1)
			{
				day = '0' + day;
			}
			var hour = date.getHours();
			if (String(hour).length == 1)
			{
				hour = '0' + hour;
			}
			var minutes = date.getMinutes();
			if (String(minutes).length == 1)
			{
				minutes = '0' + minutes;
			}
			var seconds = date.getSeconds();
			if (String(seconds).length == 1)
			{
				seconds = '0' + seconds;
			}

			return '스크린샷_' + year + '-' + month + '-' + day + ' ' + hour + '.' + minutes + '.' + seconds + '.png';
		}
	};

	DrawingTool.defaults = DrawingTool.prototype.defaults;

	$.fn.drawingTool = function(options) {
		return this.each(function() {
			new DrawingTool(this, options).init();
		});
	};

	window.DrawingTool = DrawingTool;
	DrawingTool.prototype.window = window;
})(jQuery, window, document);
