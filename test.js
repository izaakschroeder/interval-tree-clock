
var clock = require('./itc');

function Node(id) {
	this.id = id;
	this.state = clock;
	this.others = [ ];
	this.messages = [ ];
}

Node.prototype.addPeers = function() {
	Array.prototype.push.apply(this.others, arguments);
}

Node.prototype.removePeers = function() {
	for (var i = 0; i < arguments.length; ++i)
		this.others.splice(this.others.indexOf(arguments[i]), 1);
}

Node.prototype.send = function(data) {
	var 
		source = this,
		parts = this.state.send(), 
		message = parts[0];
	
	this.state = parts[1];
	
	console.log("sending: "+message+" -> "+data+" from "+source.id);
	this.messages.push({ source: source.id, data: data, message: message });

	//Broadcast message
	this.others.forEach(function(other) {
		setTimeout(function() {
			other.receive(source.id, data, message);
		}, Math.floor(Math.random()*100)+50)
		
	})

	return message;
}

Node.prototype.receive = function(source, data, message) {
	this.state = this.state.receive(message);
	console.log(this.id+" received "+data+"; state = "+this.state)
	this.messages.push({ source: source, data: data, message: message });
}


var 
	a = new Node("a"), 
	b = new Node("b"), 
	c = new Node("c"),
	d = new Node("d");

var m1,m2,m3,m4,m5,m6;

a.addPeers(b, c);
b.addPeers(a, c);
c.addPeers(a, b);




function comp(m1, m2) {
	//if (m1.message.event.equals(m2.message.event))
	//	return m1.source.compare(m2.source);
	if (!m2.message.precedes(m1.message))
		return -1;
	if (!m1.message.precedes(m2.message))
		return 1;
	if (m2.source < m1.source)
		return -1;
	if (m2.source > m1.source)
		return 1;

	throw new Error();
}

function str(a) {
	return a.messages.slice().sort(comp).map(function(a) { return a.data; }).join(", ");
		
}

a.send("cow");
b.send("chicken");
a.send("pig");
a.send("rooster");
c.send("duck");

setTimeout(function() {

	b.send("banana");
	b.send("cherry");
	c.send("apple");
	a.send("pineapple");

	setTimeout(function() {
		console.log(str(a));
		console.log(str(b));
		console.log(str(c));
		console.log(str(d));
	}, 200)

}, 200)
