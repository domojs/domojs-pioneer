import * as devices from '@domojs/devices';
import * as akala from '@akala/server';
import * as api from './api'
const log = akala.log('domojs:pioneer');

akala.worker.createClient('devices').then(function (c)
{
    var deviceCollection: { [name: string]: devices.devices.IDevice } = {};
    akala.injectWithName(['$worker'], function (worker)
    {
        function getMainDevice(name)
        {
            var indexOfDot = name.indexOf('.');
            if (indexOfDot > 0)
                var mainDevice = name.substr(0, indexOfDot);
            else
                var mainDevice = name;

            return deviceCollection[mainDevice];
        }

        var client = akala.api.jsonrpcws(devices.deviceType).createClient(c, {
            exec: function (p)
            {
                var cmd = p.command;
                var mainDevice = getMainDevice(p.device);
                if (p.device != mainDevice.name)
                {
                    switch (p.device.substring(mainDevice.name.length + 1))
                    {
                        case 'power':
                            if (p.command == 'off')
                                cmd = 'PF'
                            else
                                cmd = 'PO'
                            break;
                        case 'mute':
                            if (p.command == 'off')
                                cmd = 'MF';
                            else
                                cmd = 'MO';
                            break;
                        case 'volume':
                            switch (p.command)
                            {
                                case 'up':
                                    cmd = 'VU';
                                    break;
                                case 'down':
                                    cmd = 'VD';
                                    break;
                                case 'set':
                                    cmd = 'VL';
                                    break;
                            }
                            break;
                        case 'input':
                            switch (p.command)
                            {
                                case 'Game':
                                    cmd = '49FN';
                                    break;
                                case 'Dvd':
                                    cmd = '04FN';
                                    break;
                                case 'Sat/Cbl':
                                    cmd = '06FN';
                                    break;
                                case 'Dvr/Bdr':
                                    cmd = '15FN';
                                    break;
                                case 'iPod':
                                    cmd = '17FN';
                                    break;
                                case 'Video':
                                    cmd = '10FN';
                                    break;
                                case 'BD':
                                    cmd = '25FN';
                                    break;
                            }
                            break;
                    }
                }
                return api.send(cmd, mainDevice['address']).then((result) => undefined);
            },
            getStatus: function (device)
            {
                var mainDevice = getMainDevice(device.device);

                if (mainDevice.name == device.device)
                    return Promise.resolve(mainDevice.status());
                else
                    return Promise.resolve(mainDevice.subdevices[device.device.substring(mainDevice.name.length + 1)].status());
            },
            save: (p) =>
            {
                if (p.device.name.indexOf('.') > -1)
                    return p.device;
                deviceCollection[p.device.name] = p.device;
                p.device['address'] = p.body.IP || p.device.name;
                p.device.statusMethod = 'pull';
                p.device.subdevices = [
                    {
                        name: "power",
                        type: 'pioneer',
                        category: 'switch',
                        classes: ['power', 'switch'],
                        statusMethod: 'pull',
                        status: function ()
                        {
                            return api.send('?P', p.device.name).then(function (result)
                            {
                                console.log('result:' + result);
                                if (result)
                                    result = result.trim();
                                return { state: result == 'PWR0', color: result == 'PWR0' ? 'green' : 'red' };
                            });
                        },
                        commands: ['on', 'off']
                    },
                    {
                        name: "mute",
                        type: 'pioneer',
                        category: 'switch',
                        statusMethod: 'pull',
                        status: function ()
                        {
                            console.log('mute status');
                            return api.send('?M', p.device.name).then((result) =>
                            {
                                console.log(result);
                                return { state: result == 'MUT0', color: result == 'MUT0' ? 'green' : 'red' };
                            });
                        },
                        commands: ['on', 'off']
                    },
                    {
                        name: "volume",
                        type: 'pioneer',
                        category: 'input',
                        statusMethod: 'pull',
                        status: function ()
                        {
                            var status = {};
                            return api.send('?V', p.device.name).then(function (result)
                            {
                                return { state: Number(/\d+/.exec(result)) * 100 / 185 };
                            });
                        },
                        commands: ['up', 'down', 'set']
                    },
                    {
                        name: "input",
                        type: 'pioneer',
                        category: 'values',
                        statusMethod: 'pull',
                        status: function ()
                        {
                            return api.send('?FN', p.device.name).then(function (result)
                            {
                                console.log(result);
                                switch (Number(/[0-9]+/.exec(result)))
                                {
                                    case 49:
                                        return { state: 'Game' };
                                    case 25:
                                        return { state: 'BD' };
                                    case 4:
                                        return { state: 'Dvd' };
                                    case 6:
                                        return { state: 'Sat/Cbl' };
                                    case 15:
                                        return { state: 'Dvr/Bdr' };
                                    case 17:
                                        return { state: 'iPod' };
                                    case 10:
                                        return { state: 'Video' };
                                    default:
                                        return null;
                                }
                            });
                        },
                        commands: ['Game', 'Dvd', 'Sat/Cbl', 'Dvr/Bdr', 'iPod', 'Video', 'BD']
                    }
                ]
                return p.device;
            }
        });

        worker.on('ready', function ()
        {
            client.$proxy().register({ commandMode: 'dynamic', name: 'pioneer', view: '/@domojs/pioneer/device.html' });
        });
    })();
});