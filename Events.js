"use import";

from util.browser import $;
import .Drag;
import lib.PubSub;

exports = Class(lib.PubSub, function() {
	var SLICE = Array.prototype.slice;
	
	var isMobile = /(iPod|iPhone|iPad|Android)/i.test(navigator.userAgent);
	
	this.event = function(el, name, handler) {
		if (!this._eventEnabled) { this._eventEnabled = {}; }
		var args = [this, handler].concat(SLICE.call(arguments, 3)),
			handler = bind.apply(this, args),
			events = this._eventEnabled;
		
		events[name] = true;
		$.onEvent(el, name, function() {
			if(events[name]) {
				handler.apply(this, arguments);
			}
		});
	}
	
	this.isDragging = function() { return this._isDragging || false; }
	
	this.initDragEvents = function(el) {
		if (!this.__drag) {
			var d = this.__drag = new Drag();
			d.subscribe('DragStart', this, 'onDragStart');
			d.subscribe('Drag', this, 'onDrag');
			d.subscribe('DragStop', this, 'onDragStop');
		}
		
		var startDrag = bind(this.__drag, 'startDrag');
		if (!el) { el = this._el; }
		if (el.addEventListener) { el.addEventListener('touchstart', startDrag, true); }
		$.onEvent(el, 'mousedown', startDrag);
	}
	
	this.initMouseEvents = function(el) {
		el = el || this._el;
		
		if (isMobile) {
			this.event(el, 'touchstart', '_onTouchStart');
			this.event(el, 'touchend', '_onTouchEnd');
		} else {
			this.event(el, 'mouseover', 'onMouseOver');
			this.event(el, 'mouseout', 'onMouseOut');
			this.event(el, 'mousedown', 'onMouseDown');
			this.event(el, 'mouseup', 'onMouseUp');
			this.event(el, 'click', 'onClick');
		}
		
		return this;
	}
	
	this.initFocusEvents = function(el) {
		el = el || this._el;
		this.event(el, 'focus', 'onFocus');
		this.event(el, 'blur', 'onBlur');
		return this;
	}
	
	this.initKeyEvents = function(el) {
		el = el || this._el;
		this.event(el, 'keydown', 'onKeyDown');
		this.event(el, 'keypress', 'onKeyPress');
		this.event(el, 'keyup', 'onKeyUp');
		return this;
	}
	
	this._onTouchStart = function(e) {
		this.onMouseOver(e);
		this.onMouseDown(e);
	}
	
	this._onTouchEnd = function(e) {
		this.onMouseUp(e);
		this.onClick(e);
		this.onMouseOut(e);
	}
	
	this.onMouseOver = function(e) {
		if (!this._enableMouseEvents) 
		this._isOver = true;
		$.addClass(this._el, this._class + '-hover');
		this.publish('Over', e);
	}
	
	this.onMouseOut = function(e) {
		this._isOver = false;
		this.onMouseUp();
		$.removeClass(this._el, this._class + '-hover');
		this.publish('Out', e);
	}

	this.onMouseDown = function(e) {
		this._isDown = true;
		$.addClass(this._el, this._class + '-down');
		this.publish('Down', e);
	}
	
	this.onMouseUp = function(e) {
		this._isDown = false;
		$.removeClass(this._el, this._class + '-down');
		this.publish('Up', e);
	}
	
	this.onClick = function(e) {
		this.publish('Select', e);
	}
	
	this.onFocus = function(e) {
		this._isFocused = true;
		$.addClass(this._el, this._class + '-focused');
		this.publish('Focus', e);
	}
	
	this.onBlur = function(e) {
		this._isFocused = false;
		$.removeClass(this._el, this._class + '-focused');
		this.publish('Blur', e);
	}
	
	this.onKeyUp = function(e) {
		this.publish('KeyUp', e);
	}
	
	this.onKeyPress = function(e) {
		this.publish('KeyPress', e);
	}
	
	this.onKeyDown = function(e) {
		this.publish('KeyDown', e);
	}
	
	this.onDragStart = function(dragEvt) {}
	this.onDrag = function(dragEvt, moveEvt) {}
	this.onDragStop = function(dragEvt, upEvt) {}
});
