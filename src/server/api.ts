import * as net from 'net';
import * as akala from '@akala/server';
const log=akala.log('domojs:pioneer');

function buildQueue(device: string)
{
    var connection = net.createConnection({ port: 8102, allowHalfOpen: true, host: device }, function ()
    {
        log('connected');
        queue.process();
    });
    var queue = new akala.Queue<{ command: string, callback: (status: number, data: string | Error) => void }>((message, next) =>
    {
        var responseSent = false;
        var commandSent = false;
        var firstRReceived = false;
        var receiver = function (data)
        {
            if (commandSent && !responseSent)
            {
                if (!firstRReceived && data == 'R\r\n')
                {
                    firstRReceived = true;
                }
                else
                {
                    responseSent = true;
                    connection.removeListener('data', receiver);
                    next(true);
                    if (!firstRReceived)
                        data = data.replace(/(?:^R+)|(?:R+$)/, '');
                    data = data.replace(/[\r\n]+/g, '');
                    log('received:' + data);
                    message.callback(200, data);
                }
            }
        };
        connection.on('data', receiver);
        connection.setEncoding('ASCII');
        connection.on('error', function (error)
        {
            message.callback(500, error)
        });
        connection.write('\r');
        setTimeout(function ()
        {
            connection.write('\r' + message.command + '\r');
            commandSent = true;
        }, 100);
    });
    return queue;
}

var queue: { [device: string]: akala.Queue<{ command: string, callback: (status: number, data: string | Error) => void }> } = {};

export function send(command: string, device: string)
{
    return new Promise<string>((resolve, reject) =>
    {
        if (!queue[device])
            queue[device] = buildQueue(device);

        queue[device].enqueue({
            command: command, callback: function (status, data)
            {
                if (status == 200 && typeof (data) == 'string')
                    resolve(data);
                else
                    reject(data);
            }
        });
    })
};

export function VL(id, device, callback)
{
    var volume = (id * 185 / 100).toString();
    volume = '000'.substring(0, volume.toString().length) + volume;
    return send(volume + 'VL', device);
}