(function (env) {
    "use strict";
    env.ddg_spice_openov = function(api_result){
        if (api_result.search.length == 0) {
            return Spice.failed('openov');
        }

        var stop_area_parts = api_result.search[0]._links[0].href.split('/');
        var stop_area_code = stop_area_parts[stop_area_parts.length - 1];
        $.getScript("/js/spice/openov_departures/" + stop_area_code);
    };

    env.ddg_spice_openov_departures = function(api_result){

        // Validate the response (customize for your Spice)
        if (!api_result || api_result.error) {
            return Spice.failed('openov');
        }

        // Render the response
        Spice.add({
            id: "openov",

            // Customize these properties
            name: "Vertrektijden",
            data: api_result.search,
            meta: {
                sourceName: "Example.com",
                sourceUrl: 'http://example.com/url/to/details/' + api_result.name
            },
            normalize: function(item) {
                return {
                    // customize as needed for your chosen template
                    title: item.name,
                    subtitle: item.type
                };
            },
            templates: {
                group: 'base',
                detail: false,
                item_detail: false,
                options: {
                    content: Spice.openov.vertrektijd_item,
                    moreAt: true
                }
            }
        });
    };

}(this));
