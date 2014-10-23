'use strict';

function noop() {
	return '';
}

function getStack(context) {
	return context._layoutStack || (context._layoutStack = []);
}

function initActions(context) {
	var stack = getStack(context),
		actions = [];

	context._layoutActions = actions;

	while (stack.length) {
		stack.pop()(context);
	}

	return actions;
}

function getActions(context) {
	return context._layoutActions || initActions(context);
}

function getActionsByName(context, name) {
	var actions = getActions(context);

	return actions[name] || (actions[name] = []);
}

function applyAction(val, action) {
	/* jshint validthis:true */

	switch (action.mode) {
		case 'append': {
			return val + action.fn(this);
		}

		case 'prepend': {
			return action.fn(this) + val;
		}

		case 'replace': {
			return action.fn(this);
		}

		default: {
			return val;
		}
	}
}

function layouts(handlebars) {
	var helpers = {
		extend: function (name, options) {
			var context = Object.create(this || null),
				template = handlebars.partials[name];

			// Partial template required
			if (template == null) {
				throw new Error('Missing partial: \'' + name + '\'');
			}

			// Compile partial, if needed
			if (typeof template !== 'function') {
				template = handlebars.compile(template);
			}

			// Add overrides to stack
			if (typeof options.fn === 'function') {
				getStack(context).push(options.fn);
			}

			// Render partial
			return template(context);
		},

		embed: function (/* name, options */) {
			var context = Object.create(this || null);

			// Reset context
			context._layoutStack = null;
			context._layoutActions = null;

			// Extend
			return helpers.extend.apply(context, arguments);
		},

		block: function (name, options) {
			return getActionsByName(this, name).reduce(
				applyAction.bind(this),
				options.fn(this)
			);
		},

		content: function (name, options) {
			options = options || {};

			var fn = options.fn || noop,
				hash = options.hash || {},
				mode = hash.mode || 'replace';

			getActionsByName(this, name).push({
				mode: mode.toLowerCase(),
				fn: fn
			});

			return '';
		}
	};

	handlebars.registerHelper(helpers);

	return handlebars;
}

// Assemble
layouts.register = layouts;

// Legacy
module.exports = layouts;
