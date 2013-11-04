/**
 * PUBLISH - SUBSCRIBE
 * w/ feed
 */

var Pubsub = function(){

	// return stuff
	var pubsub = {};

	// private stuff
	var topics = {};
	var feeds = {};
	var	id = -1;
	var feed_id = -1;

	this.once = function(topic, func)
	{
		pubsub.subscribe(topic, func, 1);
	};

	this.trigger = function( topic, args ){

		if( !topics[topic] )
		{
			return false;
		}

		var subscribers = topics[topic],
			len = subscribers ? subscribers.length : 0;

		while(len--)
		{
			if(subscribers[len].times === false)
			{
				subscribers[len].func( topic, args );
			}
			else
			{
				// fire callback
				subscribers[len].func( args );

				// if times is zero after this 'publish'... unsubscribe
				(--subscribers[len].times) === 0 ? pubsub.unsubscribe( subscribers[len].token ) : null;
			}
		}

		return this;
	};

	this.on = function( topic, func, times )
	{
		if( !topics[topic] )
		{
			topics[topic] = [];
		}

		// create id token
		var token =  (++id).toString();

		topics[topic].push({
			token: token,
			func: func,
			times: times || false
		});

		return token;

	};

	this.off = function( token )
	{
		for( var key in topics )
		{
			if( topics[key] )
			{
				for( var i = 0, j = topics[key].length; i < j; i++)
				{
					if(topics[key][i].token === token)
					{
						topics[key].splice(i, 1);
						return token;
					}
				}
			}
		}
	};

	this.feed = function(feed, max, func)
	{
		var that = this;

		if( !feeds[feed] )
		{
			feeds[feed] = [];
		}

		// if threshold is NOT reached
		if( (feeds[feed].length + 1) < max )
		{
			var token = (++feed_id).toString();

			feeds[feed].push({
				token: token,
				func: func
			});
		}
		else // threshold is reached. fire and delete.
		{
			feeds[feed][0].func.call(that, feed);
			delete feeds[feed];
		}
	};
};

module.exports = Pubsub;