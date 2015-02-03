(function($)
{
    function Gateway()
    {
        var _self = this;
        var _userId;
        var _wasConnected = false;
        var _connected = false;
        
        var _gateEvent = {            
            INPUT_STATUS: {id: "INPUT_STATUS", callback: null},
            SUPPORT_STATUS: {id: "SUPPORT_STATUS", callback: null},
            NEW_MESSAGE: {id: "NEW_MESSAGE", callback: null},
            READ_MESSAGE: {id: "READ_MESSAGE", callback: null},
            TICKET_ROUTED: {id: "TICKET_ROUTED", callback: null},
            TICKET_ENDED: {id: "TICKET_ENDED", callback: null},
            TICKET_EXPIRED: {id: "TICKET_EXPIRED", callback: null},
            FORWARD_ACCEPT: {id: "FORWARD_ACCEPT", callback: null},
            FORWARD_COMPLETE: {id: "FORWARD_COMPLETE", callback: null},
            FORWARD_RETURN: {id: "FORWARD_RETURN", callback: null},
            ROUTING_RETURN: {id: "ROUTING_RETURN", callback: null},
            TICKET_DELETED: {id: "TICKET_DELETED", callback: null},
            ROUTING_FLAG_CHANGED: {id: "ROUTING_FLAG_CHANGED", callback: null},
            CONNECTION_ESTABLISHED: {id: "CONNECTION_ESTABLISHED", callback: null},
            CONNECTION_BROKEN: {id: "CONNECTION_BROKEN", callback: null}
        };

        this.EVENT = _gateEvent;
        
        this.addListener = function(event, callback)
        {
            event.callback = callback;
        };
        
        this.receive = function(message)
        {
            var eventId = message.data.__event_id__;
            var talkId = message.data.talkId;
            var serviceType = message.data.serviceType;
            var updatedBy = message.data.updatedBy;
            var value = message.data.value;
            
            if (!_gateEvent[eventId].callback)
                return;
            
            switch(eventId)
            {
                case _gateEvent.INPUT_STATUS.id:
                    _gateEvent[eventId].callback(talkId, serviceType, message.data.status, message.data.userType);
                    break;
                case _gateEvent.SUPPORT_STATUS.id:
                    _gateEvent[eventId].callback(talkId, serviceType, message.data.status);
                    break;
                case _gateEvent.NEW_MESSAGE.id:
                    _gateEvent[eventId].callback(talkId, serviceType, message.data.userType);
                    break;
                case _gateEvent.READ_MESSAGE.id:
                    _gateEvent[eventId].callback(talkId, message.data.seq, serviceType);
                    break;
                case _gateEvent.TICKET_ROUTED.id:
                    _gateEvent[eventId].callback(talkId, serviceType);
                    break;
                case _gateEvent.TICKET_ENDED.id:
                    _gateEvent[eventId].callback(talkId, serviceType);
                    break;
                case _gateEvent.TICKET_EXPIRED.id:
                    _gateEvent[eventId].callback(talkId, serviceType);
                    break;
                case _gateEvent.FORWARD_ACCEPT.id:
                    _gateEvent[eventId].callback(talkId, serviceType);
                    break;
                case _gateEvent.FORWARD_COMPLETE.id:
                    _gateEvent[eventId].callback(talkId, serviceType);
                    break;
                case _gateEvent.FORWARD_RETURN.id:
                    _gateEvent[eventId].callback(talkId, serviceType);
                    break;
                case _gateEvent.ROUTING_RETURN.id:
                    _gateEvent[eventId].callback(talkId, serviceType, updatedBy);
                    break;
                case _gateEvent.TICKET_DELETED.id:
                    _gateEvent[eventId].callback(talkId, serviceType, updatedBy);
                    break;
                case _gateEvent.ROUTING_FLAG_CHANGED.id:
                    _gateEvent[eventId].callback(serviceType, value);
                    break;
            }
        };
        
        /* handshake listener to report client IDs */
        $.cometd.addListener("/meta/handshake", function(message)
        {
            $.cometd.batch(function()
            {
                $.cometd.subscribe('/talk/event', _self.receive);
                $.cometd.publish('/service/members', {
                    user: _userId,
                    status : "associate"
                });
            });
        });

        /* connect listener to report advice */
        $.cometd.addListener("/meta/connect", function(message)
        {
            _wasConnected = _connected;
            _connected = message.successful === true;
            if (!_wasConnected && _connected)
            {
                _connectionEstablished();
            }
            else if (_wasConnected && !_connected)
            {
                _connectionBroken();
            }

        });
        
        function _connectionEstablished()
        {
            if (_gateEvent.CONNECTION_ESTABLISHED.callback)
            {
                _gateEvent.CONNECTION_ESTABLISHED.callback();
            }            
        }
        
        function _connectionBroken()
        {
            if (_gateEvent.CONNECTION_BROKEN.callback)
            {
                _gateEvent.CONNECTION_BROKEN.callback();
            }
        }        
        
        this.init = function(config, userId)
        {
            var _self = this;
            _userId = userId;

            /* Initialize CometD */
            var cometdURL = config.protocol + "://" + config.host + ":" + config.port + "/gateway/cometd";
			
			console.error('cometdURL : ' + cometdURL);
            $.cometd.init({ url: cometdURL, logLevel: "info" });
            
            /* Setup reload extension */
            $(window).unload(function()
            {
                $.cometd.reload({cookieMaxAge:10});
                _self.disconnect();
            });
        };
        
        this.initCustomer = function(config, customerId)
        {
            this.init(config, "C_" + customerId);
        };
        
        this.initAgent = function(config, agentId)
        {
		    this.init(config, "A_" + agentId);
        };
        
        this.disconnect = function()
        {
            $.cometd.publish('/service/members', {
                user: _userId,
                status : "disassociate"
            });
        }
    }

    // The default gateway instance
    $.gateway = new Gateway();
})(jQuery);
