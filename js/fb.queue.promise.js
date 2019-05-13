/** @module fb.queue.promise */
/**
* Modulo que crear una cola de promesas para encadenar callbacks
*
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

var QueuePromise = function () {
	this.promise = $(this).promise();
	this.counter = 0;
};

QueuePromise.prototype.append = function () {
	var args = arguments;

	var fn = args[0];
	if (!fn || !$.isFunction(fn)) {
		throw new TypeError('primer parametro debe ser una funcion');
	}

 	var self = this;
	args = Array.prototype.slice.call(args, 1);

	self.increase();
	this.promise = this.promise.pipe(function () {
		return $.Deferred(function () {
			try {
				return fn.apply(this, args);
			} catch (ex) {
				this.reject(ex);
				return self.promise = $(self).promise();
			}
		}).promise();
	});

	this.promise.always(function () {
		self.decrease();
	});

	return this.promise;
};

QueuePromise.prototype.increase = function () {
	this.counter++;
};

QueuePromise.prototype.decrease = function () {
	this.counter--;
};

QueuePromise.prototype.count = function () {
	return this.counter;
};

