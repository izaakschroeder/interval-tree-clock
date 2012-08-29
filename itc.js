
/**
 *
 * see 
 *  http://gsd.di.uminho.pt/members/cbm/ps/itc2008.pdf
 *  http://code.google.com/p/itclocks
 *  http://code.google.com/p/itc4j
 */


if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function() {


	function Event(value, left, right) {
		if (typeof value !== "number")
			throw new TypeError();
		if ((left && !right) || (!left && right))
			throw new TypeError();
		if (left && left instanceof Event === false)
			throw new TypeError();
		if (right && right instanceof Event === false)
			throw new TypeError();

		this.value = value || 0;
		this.left = left || null;
		this.right = right || null;

		Object.freeze(this);
	}

	Object.defineProperty(Event.prototype, "empty", {
		get: function() {
			return this.left === null;
		}
	});

	Event.join = function(e1, e2) {
		if (e1.empty && e2.empty)
			return new Event(Math.max(e1.value, e2.value));
		else if (e1.empty)
			return Event.join(new Event(e1.value, new Event(0), new Event(0)), e2);
		else if (e2.empty)
			return Event.join(e1, new Event(e2.value, new Event(0), new Event(0)));
		else 
			return (e1.value > e2.value) ? Event.join(e2, e1) : new Event(e1.value, Event.join(e1.left ,lift(e2.left ,e2.value - e1.value)), Event.join(e1.right ,lift(e2.right ,e2.value - e1.value))).normalize();
	}

	Event.prototype.lift = function(amount) {
		return new Event(this.value + amount, this.left, this.right);
	}

	Event.prototype.sink = function(amount) {
		return new Event(this.value - amount, this.left, this.right);
	}

	Event.prototype.min = function() {
		return this.value;
	}

	Event.prototype.max = function() {
		if (this.empty)
			return this.value;
		return this.value + Math.max(this.left.max(), this.right.max());
	}

	Event.prototype.normalize = function() {
		if (this.empty)
			return this;
		if (this.left.value === this.right.value)
			return new Event(this.left.value + this.value);

		var min = Math.min(this.left.min(), this.right.min());
		return new Event(this.value + min, this.left.sink(min), this.right.sink(min));
	}

	Event.prototype.maxDepth = function() {
		if (this.empty)
			return 0;
		return Math.max(this.left.maxDepth() + 1, this.right.maxDepth() + 1);
	}

	Event.prototype.precedes = function(other) {
		if (this.empty)
			return this.value <= other.value;
		else if (other.empty)
			return this.value <= other.value && this.left.lift(this.value).precedes(other) && this.right.lift(this.value).precedes(other);
		else
			return this.value <= other.value && this.left.lift(this.value).precedes(other.left.lift(other.value)) && this.right.lift(this.value).precedes(other.right.lift(other.value));
	}

	Event.prototype.equals = function(other) {
		if (other instanceof Event === false)
			return false;
		if (this.empty !== other.empty)
			return false;
		if (this.empty)
			return this.value === other.value;
		else
			return this.value === other.value && this.left.equals(other.left) && this.right.equals(other.right);
	}

	Event.prototype.toString = function() {
		if (this.empty)
			return "" + this.value;
		return "(" + this.value + ", " + this.left + ", " + this.right + ")";
	}

	function ID(left, right) {
		if (left && left instanceof ID === false)
			throw new TypeError();
		if (right && right instanceof ID === false)
			throw new TypeError();
		this.left = left || null;
		this.right = right || null;
	}

	ID.join = function(left, right) {
		if (left === null)
			return right;
		if (right === null)
			return left;
		return new ID(ID.join(left.left, right.left), ID.join(left.right, right.right)).normalize();
	}

	ID.prototype.normalize = function() {
		if (this.left !== null && this.right !== null && this.left.left === null && this.left.right === null && this.right.left === null && this.right.right === null)
			return ID.leaf;
		else if (this.left === null && this.right === null)
			return null;
		else
			return this;
	}

	ID.prototype.split = function() {
		if (this.left === null && this.right === null)
			return [ new ID(ID.leaf, null), new ID(null, ID.leaf) ];
		else if (this.left === null) 
			return this.right.split().map(function(part) { return new ID(null, part); });
		else if (this.right === null) 
			return this.left.split().map(function(part) { return new ID(part, null) });
		else
			return [ new ID(this.left, null), new ID(null, this.right) ];
	}

	ID.prototype.toString = function() {
		if (this.left === null && this.right === null)
			return "1";
		if (this.left === null && this.right !== null)
			return "(0, " + this.right + ")";
		if (this.left !== null && this.right === null)
			return "(" + this.left + ", 0)";
		return "(" + this.left + ", " + this.right + ")";
	}

	ID.leaf = new ID(null, null);

	function Stamp(id, event) {
		if (id !== null && id instanceof ID === false)
			throw new TypeError("Gave invalid id!");
		if (event instanceof Event === false)
			throw new TypeError("Gave invalid event!");
		this.id = id;
		this.event = event;
		Object.freeze(this);
	}

	Stamp.prototype.precedes = function(other) {
		return this.event.precedes(other.event);
	}

	function fill(id, event) {
		if (id === null)
			return event;
		
		if (id.left == null && id.right == null)
			return new Event(event.max());
		if (event.empty)
			return new Event(event.value);
		if (id.left != null && id.left.left == null && id.left.right == null) {
			var er = fill(id.right, event.right);
			return new Event(event.value, new Event(Math.max(event.left.max(), er.min())), er).normalize();
		}
		if (id.right != null && id.right.left == null && id.right.right == null) {
			var el = fill(id.left, event.left);
			return new Event(event.value, el, new Event(Math.max(event.right.max(), el.min()))).normalize();
		}
		return new Event(event.value, fill(id.left, event.left), fill(id.right, event.right)).normalize();
		
	}

	function grow(id, event) {
		if (event.left === null && event.right === null) {
			
			if (id !== null && id.left === null && id.right === null)
				return { 
					event: new Event(event.value + 1), 
					c: 0
				};
			
			if (id !== null) {
				var er = grow(id, new Event(event.value, new Event(0), new Event(0)));
				return {
					event: er.event,
					c: er.c + event.maxDepth() + 1
				};
			}
		} 
		else {
			if (id.left === null && id.right !== null) {
				var er = grow(id.right, event.right);
				return { 
					event: new Event(event.value, event.left, er.event), 
					c: er.c + 1 
				};
			} 
			else if (id.left !== null && id.right === null) {
				var er = grow(id.left, event.left);
				return { 
					event: new Event(event.value, er.event, event.right), 
					c: er.c + 1 
				};
			} 
			else {
				var left = grow(id.left, event.left), right = grow(id.right, event.right);
				return (left.c < right.c) ? { 
					event: new Event(event.value, left.event, event.right), 
					c: left.c + 1 
				} : { 
					event: new Event(event.value, event.left, right.event), 
					c: right.c + 1
				};
				
			}
		}
		throw new Error();
	}

	Stamp.join = function(s1, s2) {
		return new Stamp(ID.join(s1.id, s2.id), Event.join(s1.event, s2.event));
	}

	Stamp.prototype.sync = function(s2) {
		return Stamp.join(this, s2).fork();
	}

	Stamp.prototype.receive = function(s2) {
		return Stamp.join(this, s2).trigger();
	}

	Stamp.prototype.fork = function() {
		return this.id.split().map(function(id) {
			return new Stamp(id, this.event)
		}, this);
	}

	Stamp.prototype.peek = function() {
		return [
			new Stamp(null, this.event), 
			new Stamp(this.id, this.event)
		];
	}

	Stamp.prototype.send = function() {
		return this.trigger().peek();
	}

	Stamp.prototype.trigger = function() {
		var e = fill(this.id, this.event);
		if (!this.event.equals(e))
			return new Stamp(this.id, e);
		else 
			return new Stamp(this.id, grow(this.id, this.event).event);
	}

	Stamp.prototype.toString = function() {
		return "(" + this.id + ", " + this.event + ")";
	}

	return Stamp.seed = new Stamp(new ID(), new Event(0));
})


