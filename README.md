Introduction
============

A purely functional implementation of interval tree clocks. Can be used to keep track of causal information in distributed systems. Works in the browser and in nodejs.

Installation:
```
npm install com.izaakschroeder.interval-tree-clock
```


Usage:
```javascript

var seedStamp = require('com.izaakschroeder.interval-tree-clock');

var
	tmp = undefined,
	user1 = seedStamp,
	user2 = seedStamp;

tmp = user1.send();
user1 = tmp[0];
user2.receive(tmp[1]);

```

API Reference
=============

stamp.sync(other)
---------------
Merge two stamps.

stamp.fork()
---------------
Split a stamp.

stamp.peek()
---------------
Special case of fork.

stamp.trigger()
---------------
Trigger an event.

stamp.receive(other)
---------------
Receive a message.

stamp.send()
---------------
Send a message.