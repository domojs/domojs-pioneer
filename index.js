
exports.init=function(config)
{
	$('fs').exists('./modules/pioneer/devices.json', function(exists){
        if(exists)
            $.each($('./modules/pioneer/devices.json'), function(index, device){
                $.device(device);
            });
    });
}; 