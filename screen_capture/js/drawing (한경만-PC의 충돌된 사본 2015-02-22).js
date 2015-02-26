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
		this.selectionHandles = [];
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

	DrawingTool.prototype = {
		constructor : DrawingTool,
		defaults : {
			tool : 'line',
			lineWidth : 6,
			color : '#f79232'
		},
		init : function(options) {
			this.options = $.extend({}, this.defaults, options);

			this.draw();

			return this;
		},
		
		debug : function(str)
		{
			$('#debug').html(str);
		},
		
		draw : function() {
			var _self = this;
			this.canvas = document.querySelector('#' + this.$element.attr('id'));
			this.ctx = this.canvas.getContext('2d');
			// this.paintPanel = document.querySelector('#sketch');
			this.paintPanel = $('#sketch');

			this.tmpCanvas = document.createElement('canvas');
			this.tmpCtx = this.tmpCanvas.getContext('2d');
			this.tmpCanvas.id = 'tmp_canvas';
			this.tmpCanvas.width = this.canvas.width;
			this.tmpCanvas.height = this.canvas.height;
			this.tmpCanvas.style.margin = this.canvas.style.margin;

			// this.paintPanel.appendChild(this.tmpCanvas);
			this.paintPanel.append(this.tmpCanvas);

			$('<div />').css({'position' : 'absolute', 'right' : 0, 'bottom' : 0}).appendTo('body').attr('id', 'debug');
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

			// this.paintPanel.appendChild(this.textarea);
			// this.paintPanel.append(this.textarea);
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
				top : '9999px',
				left : '9999px',
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

			// 저장
			$('#save').on('click', function() {
				//console.error('__'+this.tmpCanvas.toDataURL("image/png"))
				
	            var saveCanvas = document.createElement('canvas')
	            var saveContext = saveCanvas.getContext('2d');
	                
	            saveCanvas.width = this.canvas.width;
	            saveCanvas.height = this.canvas.height;
	            
	            var bg = chrome.extension.getBackgroundPage();
				
				var img = new Image();
				img.src = bg.screenshot;
				
				saveContext.drawImage(img, 0, 0);
				saveContext.drawImage(this.canvas, 0, 0);
	            
				var image = saveCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
                // save image as png
				//var image = this.tmpCanvas.toDataURL("image/png");
				//$('<a id="tmpDownload" />').appendTo('body');
                
				/*$('#tmpDownload').prop('download', 'test.png');
				$('#tmpDownload').prop('href', image);
				$('#tmpDownload').trigger('click');*/
				var filename = '';
				
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
				
				var filename = '스크린샷_' + year + '-' + month + '-' + day + ' ' + hour + '.' + minutes + '.' + seconds + '.png';
				var link = document.createElement('a');
                link.download = filename;
                link.href = image;
                link.click();
				//window.location.href = image;
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
			$('li.paint-tool, li.color-tool, li.trash-tool').hover(function() {
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
			
			$('.trash-tool').on('click', function() {
				var bg = chrome.extension.getBackgroundPage();
				
				var img = new Image();
				img.src = bg.screenshot;
				this.tmpCtx.drawImage(img, 0, 0);
				this.ctx.drawImage(img, 0, 0);
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
				
				_self.debug('x : ' + _self.mouse.x + ', y : ' + _self.mouse.y);
			});

			// mousedown 이벤트
			this.tmpCanvas.addEventListener('mousedown', function(e) {
				// console.error('tmpCanvas mousedown');
				_self.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
				_self.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;

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
				else if (_self.options.tool == 'circle') 
				{
					_tmpCanvas.on('mousemove', _self.onCirclePaint.bind(_self));
				} 
				else if (_self.options.tool == 'text') 
				{
					_self.onText();
				} 
				else if (_self.options.tool == 'spoil') 
				{
					_tmpCanvas.on('mousemove', _self.onSpoilPaint.bind(_self));
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
				 console.error('mouseup');
				_tmpCanvas.off('mousemove');

				// console.error('_self.options.tool : ' + _self.options.tool);
				if (_self.options.tool == 'text') {
					_self.onText();
				}

				// Writing down to real canvas now
				_self.ctx.drawImage(_self.tmpCanvas, 0, 0);
				// Clearing tmp canvas
				_self.tmpCtx.clearRect(0, 0, _self.tmpCanvas.width, _self.tmpCanvas.height);

				_self.ppts = [];

			}, false);

			this.canvas.addEventListener('mousemove', function(e) {
				_self.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX
						: e.layerX;
				_self.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY
						: e.layerY;
			}, false);

			this.canvas.addEventListener('mousedown', function(e) {
				_self.canvas
						.addEventListener('mousemove', _self.onErase, false);

				_self.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX
						: e.layerX;
				_self.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY
						: e.layerY;

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
			console.error('onText');

			_self.drawText();
			/*
			 * this.tmpCtx.lineWidth = this.options.lineWidth;
			 * this.tmpCtx.lineJoin = 'round'; this.tmpCtx.lineCap = 'round';
			 * this.tmpCtx.strokeStyle = this.options.color;
			 * this.tmpCtx.fillStyle = this.options.color;
			 *  // Tmp canvas is always cleared up before drawing.
			 * this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width,
			 * this.tmpCanvas.height);
			 */

			var x = Math.min(this.mouse.x, this.start_mouse.x);
			//var x = this.mouse.x;
			// var y = Math.min(this.mouse.y, this.start_mouse.y);
			var y = this.mouse.y;
			// var width = Math.abs(this.mouse.x - this.start_mouse.x);
			var width = 30;
			// var height = Math.abs(this.mouse.y - this.start_mouse.y);
			var height = 30;

			/*
			 * this.textarea.style.left = x + 'px'; this.textarea.style.top = y +
			 * 'px'; this.textarea.style.width = width + 'px';
			 * this.textarea.style.height = height + 'px';
			 * this.textarea.style.display = 'block'; this.textarea.value = '';
			 * this.textarea.focus();
			 */
			$('#textDiv').css({
				left : x,
				top : y,
				width : width,
				height : height,
				display : 'block',
				position : 'absolute'
			});
			// this.textarea.css({left : x, top : y, width : width, height :
			// height, display : 'block'});
			// this.textarea.css({width : width, height : height});

			//console.error('textDiv x : ' + x + ', y : ' + y);
			this.textarea.css({'font-size' : parseInt(this.options.lineWidth)*5, 'font-weight' : 'bold', 'line-height' : '1.0'});
			this.textarea.val('');
			setTimeout(function() {
				_self.textarea.focus();
			}, 100);

		},
		
		onSelect : function()
		{
			console.error('onselect')
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
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width,
					this.tmpCanvas.height);

			var x = (this.mouse.x + this.start_mouse.x) / 2;
			var y = (this.mouse.y + this.start_mouse.y) / 2;

			var radius = Math.max(Math.abs(this.mouse.x - this.start_mouse.x),
					Math.abs(this.mouse.y - this.start_mouse.y)) / 2;

			this.tmpCtx.beginPath();
			this.tmpCtx.arc(x, y, radius, 0, Math.PI * 2, false);
			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.lineWidth = this.options.lineWidth;
			this.tmpCtx.stroke();
			this.tmpCtx.closePath();

		},

		onLinePaint : function() {
			this.tmpCtx.lineWidth = this.options.lineWidth;
			this.tmpCtx.lineJoin = 'round';
			this.tmpCtx.lineCap = 'round';
			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.fillStyle = this.options.color;
			// Tmp canvas is always cleared up before drawing.
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width,
					this.tmpCanvas.height);

			this.tmpCtx.beginPath();
			this.tmpCtx.moveTo(this.start_mouse.x, this.start_mouse.y);
			this.tmpCtx.lineTo(this.mouse.x, this.mouse.y);
			this.tmpCtx.stroke();
			this.tmpCtx.closePath();

		},

		onArrowPaint : function() {
			this.tmpCtx.lineWidth = this.options.lineWidth;
			this.tmpCtx.lineJoin = 'round';
			this.tmpCtx.lineCap = 'round';
			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.fillStyle = this.options.color;
			// Tmp canvas is always cleared up before drawing.
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width,
					this.tmpCanvas.height);

			this.tmpCtx.beginPath();
			this.tmpCtx.moveTo(this.start_mouse.x, this.start_mouse.y);
			this.tmpCtx.lineTo(this.mouse.x, this.mouse.y);

			this.tmpCtx.stroke();

			// Arrow head
			var angle = Math.atan2(this.mouse.y - this.start_mouse.y,
					this.mouse.x - this.start_mouse.x);
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

		onRectPaint : function() {
			this.tmpCtx.lineWidth = this.options.lineWidth;
			this.tmpCtx.lineJoin = 'round';
			this.tmpCtx.lineCap = 'round';
			this.tmpCtx.strokeStyle = this.options.color;
			this.tmpCtx.fillStyle = this.options.color;
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

		onBrushPaint : function() {
			this.ppts.push({
				x : this.mouse.x,
				y : this.mouse.y
			});

			if (this.ppts.length < 3) {
				var b = this.ppts[0];
				this.tmpCtx.lineWidth = this.options.lineWidth;
				this.tmpCtx.lineJoin = 'round';
				this.tmpCtx.lineCap = 'round';
				this.tmpCtx.strokeStyle = this.options.color;
				this.tmpCtx.fillStyle = this.options.color;
				this.tmpCtx.beginPath();
				// ctx.moveTo(b.x, b.y);
				// ctx.lineTo(b.x+50, b.y+50);
				this.tmpCtx.arc(b.x, b.y, this.tmpCtx.lineWidth / 2, 0,
						Math.PI * 2, !0);
				this.tmpCtx.fill();
				this.tmpCtx.closePath();

				return;
			}

			// Tmp canvas is always cleared up before drawing.
			this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width,
					this.tmpCanvas.height);

			this.tmpCtx.beginPath();
			this.tmpCtx.moveTo(this.ppts[0].x, this.ppts[0].y);

			for (var i = 1; i < this.ppts.length - 2; i++) {
				var c = (this.ppts[i].x + this.ppts[i + 1].x) / 2;
				var d = (this.ppts[i].y + this.ppts[i + 1].y) / 2;

				this.tmpCtx.quadraticCurveTo(this.ppts[i].x, this.ppts[i].y, c,
						d);
			}

			// For the last 2 points
			this.tmpCtx.quadraticCurveTo(this.ppts[i].x, this.ppts[i].y,
					this.ppts[i + 1].x, this.ppts[i + 1].y);
			this.tmpCtx.stroke();

		},

		onSpoilPaint : function() {
			var _self = this;
			_self.tmpCtx.lineWidth = _self.options.lineWidth;
			_self.tmpCtx.lineJoin = 'round';
			_self.tmpCtx.lineCap = 'round';
			_self.tmpCtx.strokeStyle = _self.options.color;
			_self.tmpCtx.fillStyle = _self.options.color;
			// Tmp canvas is always cleared up before drawing.
			_self.tmpCtx.clearRect(0, 0, _self.tmpCanvas.width, _self.tmpCanvas.height);

			var x = Math.min(_self.mouse.x, _self.start_mouse.x);
			var y = Math.min(_self.mouse.y, _self.start_mouse.y);
			var width = Math.abs(_self.mouse.x - _self.start_mouse.x);
			var height = Math.abs(_self.mouse.y - _self.start_mouse.y);
			_self.tmpCtx.strokeRect(x, y, width, height);
			
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
			console.error('onTextareaKeydown')
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

				console.error('fontSize : ' + fontSize);
				setTimeout(function() {
					var width = $('#tmpTextDiv').width();
					var height = $('#tmpTextDiv').height();
					if (width < 30) {
						width = 30;
					}

					if (height < 25) {
						height = 25;
					}

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
			console.error('drawText');
			var _self = this;
			if ($.trim(_self.textarea.val()) == '') {
				return;
			}
			var fontSize = _self.textarea.css('font-size');
			var fontFamily = _self.textarea.css('font-family');
			var fontColor = _self.options.color;

			/*
			 * console.error('fontSize : ' + fontSize); console.error('font size : ' +
			 * fontSize); console.error('fontFamily : ' + fontFamily);
			 * console.error('fontColor : ' + fontColor);
			 */

			var arTextarea = _self.textarea.val().split('\n');
			if (arTextarea.length > 0) {
				_self.tmpCtx.font = 'bold ' + fontSize + ' ' + fontFamily;
				_self.tmpCtx.fillStyle = fontColor;

				for (var i = 0; i < arTextarea.length; i++) {
					// var text_node = document.createTextNode(arTextarea[i]);
					// _self.tmpTextContainer.append(text_node);
					// _self.tmpTextContainer.append(arTextarea[i]);
					// _self.tmpTextContainer.css({'position' : 'absolute',
					// 'visibility' : 'hidden', 'display' : 'block'});

					/*
					 * var width = _self.tmpTextContainer.width(); var height =
					 * _self.tmpTextContainer.height();
					 * _self.tmpTextContainer.css({'position' : '', 'visibility' :
					 * '', 'display' : 'none'});
					 */

					var x = parseInt($('#textDiv').css('left'));
					var y = parseInt($('#textDiv').css('top')) + i*parseInt(fontSize) + 20;
					;
					//console.error('textDiv : x : ' + x + ', y : ' + y);
					_self.tmpCtx.fillText(arTextarea[i], x, y);
				}

				_self.ctx.drawImage(_self.tmpCanvas, 0, 0);
				// Clearing tmp canvas
				_self.tmpCtx.clearRect(0, 0, _self.tmpCanvas.width, _self.tmpCanvas.height);

				_self.ppts = [];
			}

			/*
			 * for (var i=0; i<arTextarea.length; i++) { _self.tmpCtx.font =
			 * fontSize + ' ' + fontFamily; _self.tmpCtx.fillStyle = fontColor;
			 * _self.tmpCtx.fillText ( arTextarea[i],
			 * parseInt($('#textDiv').css('left')),
			 * parseInt($('#textDiv').css('top')) + i*parseInt(fontSize) ); }
			 */
		},

		getSlideDisplay : function(value) {
			/*
			 * var text = ''; switch (value) { case 6: text = '중간'; break; case
			 * 11: text = '굵게'; break; default : text = '가늘게'; }
			 */
			return '두께 : ' + value;
		},
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
