"use strict"

var xDomain      = { min:    0, max:  30.0 }; // seconds
var yDomainLeft  = { min: -500, max: 1000  };
var yDomainRight = { min:    0, max:   10  };

// Read the querystring into qs
var qs = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'));


var mode = 'now';
if (qs.mode == 'periodic') {
    mode = 'periodic';  // for periodic redraws, instead of as soon as data received
}

