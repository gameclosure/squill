"use import";

import lib.PubSub;

/**
 * The Selection class connects a selection storage to a UI element.
 *
 * A selection storage is very simple class that maintains the data layer of 
 * a selection. It is entirely based on item ID, exposing the methods:
 *   isSelected(id) -> bool
 *   select(id)
 *   deselect(id)
 * You may, for example, want to implement a selection store that persists
 * the current selection over a network. The base implementation of a selection
 * storage is exports.LocalStore, which simply wraps an in-memory object.
 * 
 * The Selection class handles logic such as how many items can be selected
 * at once, and provides the API that UI widgets can interact with.  For example,
 * the squill.List class contains a public proprty .selection that is an
 * instance of a Selection instance.
 */
exports = Class(lib.PubSub, function() {
	
	this.init = function(opts) {
		this._dataSource = opts.dataSource;
		this._type = opts.type || false;
		this._selection = opts.selectionStore || new exports.LocalStore();
		this._lastSelected = null;
	}
	
	this.getType = function() { return this._type; }
	
	this.isSelected = function(id) {
		if (typeof id == 'object') {
			id = id[this._dataSource.key];
		}
		
		return this._selection.isSelected(id);
	}
	
	this.select = function(item) { this._setSelected(item, true); }
	this.deselect = function(item) { this._setSelected(item, false); }
	
	this._setSelected = function(item, isSelected) {
		if (!item) { return; }
		var key = this._dataSource.key;
		var id = item[key];
		if (this._selection.isSelected(id) != isSelected) {
			if (isSelected) {
				if (this._lastSelected && this._type == 'single') {
					var lastID = this._lastSelected[key];
					this._selection.deselect(lastID);
					this.publish('Deselect', this._lastSelected, lastID);
				}
				
				this._lastSelected = item;
				this._selection.select(id);
			} else {
				this._selection.deselect(id);
			}
			
			this.publish(isSelected ? 'Select' : 'Deselect', item, id);
		}
	}
});

exports.LocalStore = Class(function() {
	this.init = function() {
		this._store = {};
	}
	
	this.select = function(id) {
		this._store[id] = true;
	}
	
	this.deselect = function(id) {
		delete this._store[id];
	}
	
	this.isSelected = function(id) {
		return !!this._store[id];
	}
});
