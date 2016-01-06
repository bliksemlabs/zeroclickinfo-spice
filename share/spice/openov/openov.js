(function (env) {
    "use strict";
    env.ddg_spice_openov = function(api_result){
        if (api_result.search.length == 0) {
            return Spice.failed('openov');
        }

        $.ajaxSetup({ cache: true });

        var stop_area_parts = api_result.search[0]._links[0].href.split('/');
        var stop_area_code = stop_area_parts[stop_area_parts.length - 1].split('?')[0];
        $.getScript("/js/spice/openov_departures/" + stop_area_code);
    };

    env.ddg_spice_openov_departures = function(api_result){

        // Validate the response (customize for your Spice)
        if (!api_result || api_result.error) {
            return Spice.failed('openov');
        }

        var destinations = {}, operator = {}, physical_mode = {}, product_category = {}, journey_destination = {}, journey_patterns = {}, journey_routes = {}, journey_lines = {}, lines = {}, vehicle_journey = {}, stop_times = [];

        api_result.operator.forEach(function(val, i) {
            operator[val.id] = val.name;
        });

        api_result.physical_mode.forEach(function(val, i) {
            physical_mode[val.id] = val.name;
        });

        if (api_result.product_category) {
            api_result.product_category.forEach(function(val, i) {
                product_category[val.id] = val.name;
            });
        }

        api_result.destination.forEach(function(val, i) {
            destinations[val.id] = val.name;
        });

        api_result.journey_pattern_point.forEach(function(jpp, i) {
            jpp._links.forEach(function(link) {
                if (link.rt === "destination") {
                    journey_destination[jpp.id] = link.href.replace("http://ovapi.nl/v2/destination/", "");
                } else if (link.rt === "journey_pattern") {
                    journey_patterns[jpp.id] = link.href.replace("http://ovapi.nl/v2/journey_pattern/", "");
                }
            });
        });

        api_result.journey_pattern.forEach(function(jp, i) {
            jp._links.forEach(function(link) {
                if (link.rt === "route") {
                    journey_routes[jp.id] = link.href.replace("http://ovapi.nl/v2/route/", "");
                }
            });
        });

        api_result.route.forEach(function(route, i) {
            route._links.forEach(function(link) {
                if (link.rt === "line") {
                    journey_lines[route.id] = link.href.replace("http://ovapi.nl/v2/line/", "");
                }
            });
        });

        api_result.line.forEach(function(line, i) {
            line._links.forEach(function(link) {
                if (link.rt === "physical_mode") {
                    line.physical_mode = physical_mode[link.href.replace("http://ovapi.nl/v2/physical_mode/", "")];
                }
                else if (link.rt === "operator") {
                    line.operator = operator[link.href.replace("http://ovapi.nl/v2/operator/", "")];
                }
            });

            lines[line.id] = line;
        });

        api_result.vehicle_journey.forEach(function(vj, i) {
            vj._links.forEach(function(link) {
                if (link.rt === "product_category") {
                    vj.product_category = link.href.replace("http://ovapi.nl/v2/product_category/", "");
                }
            });
            vehicle_journey[vj.id] = vj;
        });

        api_result.stop_time.forEach(function(stoptime, i) {
            stoptime._links.forEach(function(link) {
                if (link.rt === "journey_pattern_point") {
                    stoptime.jpp = link.href.replace("http://ovapi.nl/v2/journey_pattern_point/", "");
                }
                else if (link.rt === "vehicle_journey") {
                    stoptime.vj = link.href.replace("http://ovapi.nl/v2/vehicle_journey/", "");
                }

            });
            stoptime.destination = destinations[journey_destination[stoptime.jpp]];
            stoptime.line = lines[journey_lines[journey_routes[journey_patterns[stoptime.jpp]]]];
            stoptime.vehicle_journey = vehicle_journey[stoptime.vj];
            stop_times.push(stoptime);
        });



        // Render the response
        Spice.add({
            id: "openov",

            // Customize these properties
            name: "Vertrektijden",
            data: api_result.stop_time,
            meta: {
                primaryText: api_result.stop_area[0].name,
                sourceName: "1313.nl",
                sourceUrl: 'http://1313.nl/vertrektijden/' + api_result.stop_area[0].id
            },
            normalize: function(item) {
                var status_class = 'openov__unknown';

                if (item.tripStatus == 'PASSED') {
                    status_class = 'openov__passed';
                } else if (item.estimatedDepartureTime) {
                    if ((new Date(item.estimatedDepartureTime)) <= (new Date(item.aimedDepartureTime))) {
                        status_class = 'openov__ontime';
                    } else {
                        status_class = 'openov__delayed';
                    }
                } else if (item.tripStatus == 'CANCELED') {
                    status_class = 'openov__canceled';
                }

                return {
                departureTime: format_time(item.estimatedDepartureTime ? item.estimatedDepartureTime : item.aimedDepartureTime),
                arrivalTime: format_time(item.estimatedArrivalTime ? item.estimatedArrivalTime : item.aimedArrivalTime),
                lineCode: item.line.code,
                status_class: status_class,
                cancelled: (item.tripStatus == 'CANCELED'),
                passed: (item.tripStatus == 'PASSED'),
                operator: item.line.operator,
                destination: item.destination};
            },
            templates: {
                group: 'base',
                detail: false,
                item_detail: false,
                options: {
                    content: Spice.openov.vertrektijd_item,
                    moreAt: false
                }
            }
        });
    };

    function format_time(departure) {
        var dep_array = departure.split('T');
        var time = dep_array[1];
        return time.substr(0, 5);
    }

}(this));
