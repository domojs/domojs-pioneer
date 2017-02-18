// ///<reference path='../../../devices/device.d.ts'/>
"use strict";
var $ = require("underscore");
var deviceTypes;
(function (deviceTypes) {
    var pioneer = (function () {
        function pioneer() {
            this.name = 'pioneer';
        }
        pioneer.prototype.onChange = function () {
            return 'dynamic';
        };
        pioneer.prototype.onAdd = function () {
        };
        pioneer.prototype.onSave = function (data) {
        };
        pioneer.prototype.onServerSave = function (device, body) {
            var send = require('./api').get;
            var ptType = {
                statusMethod: 'pull',
                subdevices: [
                    {
                        name: "power",
                        type: 'switch',
                        statusMethod: 'pull',
                        status: function (callback) {
                            var status = {};
                            send('?P', device.name, function (result) {
                                console.log('result:' + result);
                                if (result)
                                    result = result.trim();
                                callback({ state: result == 'PWR0', color: result == 'PWR0' ? 'green' : 'red' });
                            });
                        },
                        commands: {
                            on: '/api/pioneer/PO?device=' + device.name,
                            off: '/api/pioneer/PF?device=' + device.name
                        }
                    },
                    {
                        name: "mute",
                        type: 'switch',
                        category: 'actuator',
                        statusMethod: 'pull',
                        status: function (callback) {
                            console.log('mute status');
                            send('?M', device.name, function (result) {
                                console.log(result);
                                callback({ state: result == 'MUT0', color: result == 'MUT0' ? 'green' : 'red' });
                            });
                        },
                        commands: {
                            on: '/api/pioneer/MO?device=' + device.name,
                            off: '/api/pioneer/MF?device=' + device.name
                        }
                    },
                    {
                        name: "volume",
                        type: 'analogic',
                        category: 'actuator',
                        statusMethod: 'pull',
                        status: function (callback) {
                            var status = {};
                            send('?V', device.name, function (error, result) {
                                callback({ state: Number(/\d+/.exec(result)) * 100 / 185 });
                            });
                        },
                        commands: {
                            'up': '/api/pioneer/VU?device=' + device.name,
                            'down': '/api/pioneer/VD?device=' + device.name,
                            'set': '/api/pioneer/VL/{value}?device=' + device.name
                        }
                    },
                    {
                        name: "input",
                        type: 'values',
                        statusMethod: 'pull',
                        status: function (callback) {
                            send('?FN', device.name, function (result) {
                                console.log(result);
                                switch (Number(/[0-9]+/.exec(result))) {
                                    case 49:
                                        callback({ state: 'Game' });
                                        break;
                                    case 25:
                                        callback({ state: 'BD' });
                                        break;
                                    case 4:
                                        callback({ state: 'Dvd' });
                                        break;
                                    case 6:
                                        callback({ state: 'Sat/Cbl' });
                                        break;
                                    case 15:
                                        callback({ state: 'Dvr/Bdr' });
                                        break;
                                    case 17:
                                        callback({ state: 'iPod' });
                                        break;
                                    case 10:
                                        callback({ state: 'Video' });
                                        break;
                                    default:
                                        callback(null);
                                        break;
                                }
                            });
                        },
                        commands: {
                            'Game': '/api/pioneer/49FN?device=' + device.name,
                            'Dvd': '/api/pioneer/04FN?device=' + device.name,
                            'Sat/Cbl': '/api/pioneer/06FN?device=' + device.name,
                            'Dvr/Bdr': '/api/pioneer/15FN?device=' + device.name,
                            'iPod': '/api/pioneer/17FN?device=' + device.name,
                            'Video': '/api/pioneer/10FN?device=' + device.name,
                            'BD': '/api/pioneer/25FN?device=' + device.name
                        }
                    }
                ],
                status: function (callback) {
                    var status = {};
                    var commands = this.commands;
                    send('?P', device.name, function (result) {
                        status.power = { state: result, color: result == 'PWR0' ? 'green' : 'red' };
                        send('?FN', device.name, function (result) {
                            status.input = { state: result };
                            $.each($.where(Object.keys(commands), function (value) {
                                return value.indexOf('FN') > 0;
                            }), function (index, value) {
                                status[index] = { state: index == result, color: result == index ? 'green' : 'red' };
                            });
                        });
                    });
                },
                commands: {
                    'on': '/api/pioneer/PO?device=' + device.name,
                    'off': '/api/pioneer/PF?device=' + device.name,
                    'Game': '/api/pioneer/49FN?device=' + device.name,
                    'Dvd': '/api/pioneer/04FN?device=' + device.name,
                    'Sat/Cbl': '/api/pioneer/06FN?device=' + device.name,
                    'Dvr/Bdr': '/api/pioneer/15FN?device=' + device.name,
                    'iPod': '/api/pioneer/17FN?device=' + device.name,
                    'BD': '/api/pioneer/25FN?device=' + device.name,
                    'Volume Down': '/api/pioneer/VD?device=' + device.name,
                    'Volume Up': '/api/pioneer/VU?device=' + device.name,
                    'Mute On': '/api/pioneer/MO?device=' + device.name,
                    'Mute Off': '/api/pioneer/MF?device=' + device.name
                }
            };
            var deviceToSave = $.extend({}, device);
            deviceToSave.prototype = ptType;
            $.extend(device, ptType);
        };
        return pioneer;
    }());
    deviceTypes.pioneer = pioneer;
})(deviceTypes = exports.deviceTypes || (exports.deviceTypes = {}));

//# sourceMappingURL=index.js.map
