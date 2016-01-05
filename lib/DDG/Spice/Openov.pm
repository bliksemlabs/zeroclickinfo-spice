package DDG::Spice::Openov;

# ABSTRACT: Write an abstract here
# Start at https://duck.co/duckduckhack/spice_overview if you are new
# to instant answer development

use DDG::Spice;

# Caching - https://duck.co/duckduckhack/spice_advanced_backend#caching-api-responses
spice is_cached => 1;
spice proxy_cache_valid => "200 1d"; # defaults to this automatically

spice wrap_jsonp_callback => 1; # only enable for non-JSONP APIs (i.e. no &callback= parameter)

# API endpoint - https://duck.co/duckduckhack/spice_attributes#spice-codetocode
spice to => 'http://ovapi.nl/v2/search?type[]=stop_area&q=$1';
spice alt_to => {
    openov_departures => {
        is_cached => 1,
        proxy_cache_valid => '200 1m',
        to => 'http://ovapi.nl/v2/stop_area/$1/departures',
        wrap_jsonp_callback => 1
    }
};

# Triggers - https://duck.co/duckduckhack/spice_triggers
triggers any => 'vertrektijden';

# Handle statement
handle remainder => sub {

    # Query is in $_...if you need to do something with it before returning
    return $_;
};

1;
