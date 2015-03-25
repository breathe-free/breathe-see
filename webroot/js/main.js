"use strict"

// Set up Faye client and listen for data from the server
var client = new Faye.Client('/faye');

// Top-level variables hold data points received and other values
var data = [];
var latestTimestamp;
var chartLines = []; // references to the plotted lines

var xAxisSpan = 30.0; // seconds

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

function plotData(mydata, seriesIndex) {
    // Plot array. Input array should be an array of objects with x and y members.
    
    // Clear any existing line for this series first
    if (chartLines[seriesIndex]) {
        chartLines[seriesIndex].remove();
    }

    chartLines[seriesIndex] = svg.append("path").attr("class", "line" + seriesIndex).attr("d", valueline(mydata));
}

function getDataForPlot(seriesIndex) {
    // return an array of objects with x and y members
    // x=0 corresponds to latestTimestamp
    // x=10 corresponds to 10 seconds ago, and so on
    var outputArray = [];
    for(var i=0; i<data.length; i++) {
        var datapoint = data[i];
        outputArray.push({
            x: latestTimestamp - datapoint.timestamp,
            y: datapoint.values[seriesIndex]
        });
        if (latestTimestamp - datapoint.timestamp > xAxisSpan) {
            break
        }
    }
    return outputArray;
}

function handleData(incoming) {
    // incoming.data is an array of comma-separated lists of numbers
    // The first column always contains a unix timestamp
    // (referenced from the system clock on the publisher)
    // console.log(incoming.data);

    for(var i = 0; i<incoming.data.length; i++) {

        var newData = incoming.data[i].split(",");
        latestTimestamp = parseFloat(newData[0]);

        // Top-level data array has newest values at the front
        data.unshift({ timestamp: latestTimestamp, values: [
            parseFloat(newData[1]),
            parseFloat(newData[2]) * 100,
            parseFloat(newData[3])
        ] });
    }

    if (mode=='now') {
        doPlot();
    }
}

function doPlot() {
    plotData(getDataForPlot(0), 0);
    plotData(getDataForPlot(1), 1);   
    plotData(getDataForPlot(2), 2);   
}
if (mode == 'periodic') {
    setInterval(doPlot, 250);
}

// call the handleData function when new data arrives
client.subscribe('/data', handleData);

// send any instructions
function sendInstruction(instruction) {
    client.publish('/instructions', {instruction: instruction});
}

// Set the dimensions of the canvas / graph
var body = d3.select("body")[0][0];
var margin = {top: 30, right: 50, bottom: 30, left: 50},
width  = body.clientWidth - margin.left - margin.right,
height = body.clientHeight - margin.top  - margin.bottom;

// Set the ranges
var x = d3.scale.linear().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);
var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

// Define the line
var valueline = d3.svg.line()
.x(function(d) { return x(d.x); })
.y(function(d) { return y(d.y); });

// Adds the svg canvas
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
    "translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
x.domain([0, xAxisSpan]);
y.domain([-500, 2000]);

// Add the X Axis
svg.append("g")
.attr("class", "x axis")
.attr("transform", "translate(0," + height + ")")
.call(xAxis);

// Add the Y Axis
svg.append("g")
.attr("class", "y axis")
.call(yAxis);

