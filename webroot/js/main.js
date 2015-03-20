"use strict"

// Set up Faye client and listen for data from the server
var client = new Faye.Client('/faye');

// Top-level variables hold data points received and other values
var data = [];
var latestTimestamp;
var myline = false; // a reference to the plotted line

var xAxisSpan = 5.0; // seconds


function plotData(mydata) {
    // Plot array. Input array should be an array of objects with x and y members.
    // Clear any existing line first
    if (myline) {
        myline.remove();
    }

    myline = svg.append("path").attr("class", "line").attr("d", valueline(mydata));

}

function getDataForPlot() {
    // return an array of objects with x and y members
    // x=0 corresponds to latestTimestamp
    // x=10 corresponds to 10 seconds ago, and so on
    var outputArray = [];
    for(var i=0; i<data.length; i++) {
        var datapoint = data[i];
        outputArray.push({
            x: latestTimestamp - datapoint.timestamp,
            y: datapoint.values[0]
        });
        if (latestTimestamp - datapoint.timestamp > xAxisSpan) {
            break
        }
    }
    return outputArray;
}

function handleData(incoming) {
    // incoming.data is a comma-separated list of numbers
    // The first column always contains a unix timestamp
    // (referenced from the system clock on the publisher)
    var newData = incoming.data.split(",");
    console.log(newData);

    latestTimestamp = parseFloat(newData[0]);

    // Top-level data array has newest values at the front
    data.unshift({ timestamp: latestTimestamp, values: [
        parseFloat(newData[1])
    ] });

    plotData(getDataForPlot());

}

// call the plot function when new data arrives
client.subscribe('/data', handleData);

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 50},
width = 600 - margin.left - margin.right,
height = 270 - margin.top - margin.bottom;

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

