"use import";

from util.browser import $;

import .Widget;

var elementIDPrefix = 0;

var TreeList = exports = Class(Widget, function(supr) {	
	this.init = function(opts) {
		this._initClasses(opts);

		elementIDPrefix++;
		this._elementIDPrefix = 'menuItem' + elementIDPrefix + '_';

		this._wrapperId = opts.wrapperId || 'browser';
		this._contentId = opts.contentId || 'contentWrapper';

		if (opts.dataSource) {
			this.setDataSource(opts.dataSource);
		} else {
			this._dataSource = null;
		}

		this._def = {id: this._wrapperId, className: 'browser', children: [
						{id: this._contentId, className: 'contentWrapper', children: []}
					]};

		this._key = opts.key || 'id';
		this._root = null;
		this._itemByKey = {};

		supr(this, 'init', arguments);
	};

	this._initClasses = function(opts) {
		this._classNames = {
			nodeWrapper: opts.nodeWrapper || 'browserNodeWrapper',
			nodeWrapperHidden: opts.nodeWrapperHidden || 'browserNodeWrapperHidden',
			node: opts.node || 'browserNode',
			nodeChild: opts.nodeChild || 'browserNodeChild',
			nodeActive: opts.nodeActive || 'browserNodeActive',
			nodeActiveChild: opts.nodeActiveChild || 'browserNodeActiveChild',
			nodeSelected: opts.nodeSelected || 'browserNodeSelected',
			nodeSelectedChild: opts.nodeSelectedChild || 'browserNodeSelectedChild'
		};
	};

	this._createMenuId = function(inc) {
		var menuId = this._menuId;
		if (inc) {
			this._menuId++;
		}
		return this._elementIDPrefix + menuId;
	};

	this._createGroup = function(visible) {
		var menuId = this._createMenuId(true),
			node = $({
					parent: $({
								parent: $.id(this._contentId),
								id: menuId,
								className: this._classNames.nodeWrapper //: this._classNames.nodeWrapperHidden
							}),
					className: this._classNames.node
				});

		node.menuId = menuId;
		return node;
	};

	this._createItem = function(item, group) {
		var id = this._createMenuId(true);

		item.node = $({parent: group, id: id, tag: 'a', text: item.title});
		$.onEvent(id, 'click', this, 'onClick', item);
	};
/*
	// @todo create a duplicate data structure in the TreeList so that
	//       the TreeList doesn't add or change properties in the 
	//       TreeDataSource instance...
	this._createMenu = function(groupNode, node, depth, isRoot) {
		var children = node.children,
			child,
			i, j = children.length;

		groupNode.depth = depth;
		for (i = 0; i < j; i++) {
			child = children[i];
			child.group = groupNode;
			this.addItem(child);
		}

		for (i = 0; i < j; i++) {
			child = children[i];
			if (child.children && child.children.length) {
				this._createMenu(this.addGroup(child), child, depth + 1, false);
			}
		}
	};
*/
	this.buildWidget = function() {
		this._menuId = 0;
		this._menuById = [];
		this._menuStack = [];
		this._menuActiveItem = false;

		if (this._dataSource !== null) {
			this._root = this._dataSource.getRoot();
			if (this._root) {
				//this._createMenu(this.addGroup(null), root, 0, true);
			}
		}
	};

	this._removeFromStack = function(depth) {
		var menuStack = this._menuStack,
			info;

		while (menuStack.length && (menuStack[menuStack.length - 1].depth >= depth)) {
			info = menuStack.pop();

			$.removeClass(info.node.id, this._classNames.nodeActive);
			$.removeClass(info.node.id, this._classNames.nodeActiveChild);

			$.addClass(info.group.menuId, this._classNames.nodeWrapperHidden);
			$.removeClass(info.group.menuId, this._classNames.nodeWrapper);
		}
	};

	this._addToStack = function(item) {
		this._menuStack.push(item);

		$.removeClass(item.node.id, this._classNames.nodeActive);
		$.removeClass(item.node.id, this._classNames.nodeActiveChild);

		$.addClass(item.node.id, (item.children && item.children.length) ? this._classNames.nodeActiveChild : this._classNames.nodeActive);

		$.addClass(item.group.menuId, this._classNames.nodeWrapper);
		$.removeClass(item.group.menuId, this._classNames.nodeWrapperHidden);
	};

	this.onClick = function(item) {
		var menuStack = this._menuStack,
			id;

		if (this._menuActiveItem) {
			$.removeClass(this._menuActiveItem, this._classNames.nodeSelected);
			$.removeClass(this._menuActiveItem, this._classNames.nodeSelectedChild);
		}

		if (item.children && item.children.length) {
			if (menuStack.length) {
				if (item.depth > menuStack[menuStack.length - 1].depth) {
					this._addToStack(item);
				} else {
					this._removeFromStack(item.depth);
				}
			}
			this._addToStack(item);
		} else {
			this._removeFromStack(item.depth);
		}

		this._menuActiveItem = item.node.id;
		$.addClass(this._menuActiveItem, this._classNames.nodeSelected);
		if (menuStack.length) {
			$.id(this._contentId).style.width = ((menuStack.length + 1) * 200) + 'px';
		}

		this.publish('SelectItem', item);
	};

	this.onUpdateItem = function(item, key) {
		var treeItem = {title: item.title},
			parentItem,
			group;

		if (this._itemByKey[item[this._key]]) {
			// @todo check for changes...
			return;
		}

		if (item.parent === null) {
			this._rootGroup = this._createGroup(true);
			this._createItem(treeItem, this._rootGroup);
			this._root = treeItem;
			treeItem.depth = 0;
		} else {
			parentItem = this._itemByKey[item.parent[this._key]];
			if (parentItem) {
				if (!parentItem.group) {
					parentItem.group = this._createGroup(true);
				}
				if (!parentItem.children) {
					parentItem.children = [];
				}
				parentItem.children.push(treeItem);
				this._createItem(treeItem, parentItem.group);
			}
			treeItem.depth = parentItem.depth + 1;
			$.addClass(parentItem.node.id, this._classNames.nodeChild);
		}

		this._itemByKey[key] = treeItem;
	};

	this.onRemoveItem = function(item, key) {
	};

	this.setDataSource = function(dataSource) {
		this._dataSource = dataSource;
		this._dataSource.subscribe('Update', this, this.onUpdateItem);
		this._dataSource.subscribe('Remove', this, this.onRemoveItem);
	};
});