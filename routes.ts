///<reference types="akala-client" />

akala.run(['$part', 'deviceTypes'], function (part: akala.Part, deviceTypes: akala.ObservableArray<string>)
{
    deviceTypes.push('pioneer');
    part.use('/devices/new/pioneer', 'deviceType', {
        template: '/pioneer/index.html', controller: function (scope: akala.IScope)
        {
        }
    })
});