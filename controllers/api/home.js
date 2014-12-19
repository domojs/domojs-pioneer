var connections={};
var queue={};
var processing={};

var processQueue=function(device){
    if(processing[device])
        return;
    processing[device]=true;
    var message=queue[device].shift();
    if(!message)
        return processing[device]=false;
    var command=message.command;
    var callback=message.callback;
    var responseSent=false;
    var commandSent=false;
    var firstRReceived=false;
    var receiver=function(data){ 
        if(commandSent && !responseSent)
        {
            if(!firstRReceived && data=='R\r\n')
            {
                firstRReceived=true;
            }
            else
            {
                responseSent=true; 
                connections[device].removeListener('data', receiver);
                process.nextTick(function(){ processing[device]=false; processQueue(device); });
                if(!firstRReceived)
                    data=data.replace(/(?:^R+)|(?:R+$)/, '');
                data=data.replace(/[\r\n]+/g, '');
                console.log('received:' +data);
                callback(data);
            }
        }
    };
    connections[device].on('data', receiver);
    connections[device].setEncoding('ASCII');
    connections[device].on('error', callback);
    connections[device].write('\r');
    setTimeout(function(){
        connections[device].write('\r'+command+'\r');
        commandSent=true;
    },100);  
};

module.exports={
    get:function(id, device, callback)
    {
        if(!connections[device])
        {
            queue[device]=[{command:id, callback:callback}];
            connections[device]=$('net').createConnection({port:8102, allowHalfOpen:true, host:device}, function(){ console.log('connected'); processQueue(device); });
        }
        else
        {
            queue[device].push({command:id, callback:callback});
            processQueue(device);
        }
     },
     VL:function(id, device, callback)
     {
        var volume=(id*185/100);
        volume='000'.substring(0,volume.toString().length)+volume;
        module.exports.get.command(volume+'VL', device, function(error, data){
            if(error)
            {
                console.log(error);
                callback(500);
            }
            else
                callback(data);
            });
     }
 };