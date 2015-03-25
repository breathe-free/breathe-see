"use strict"

// Top-level variables hold data points received and other values
var data = [];
var latestTimestamp;
var chartLines = []; // references to the plotted lines

function plotData(mydata, seriesIndex) {
    // Plot array. Input array should be an array of objects with x and y members.
    
    // Clear any existing line for this series first
    if (chartLines[seriesIndex]) {
        chartLines[seriesIndex].remove();
    }
    var axis = seriesAxis[seriesIndex];
    chartLines[seriesIndex] = svg.append("path").attr("class", "line" + seriesIndex).attr("d", getLine(axis)(mydata));
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
        if (latestTimestamp - datapoint.timestamp > xDomain.max) {
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
            parseFloat(newData[2]),
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

// Set the dimensions of the canvas / graph
var body = d3.select("body")[0][0];
var margin = {top: 30, right: 50, bottom: 30, left: 50},
width  = body.clientWidth - margin.left - margin.right,
height = body.clientHeight - margin.top  - margin.bottom;

// Set the ranges
var x      = d3.scale.linear().range([0, width]);
var yLeft  = d3.scale.linear().range([height, 0]);
var yRight = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis      = d3.svg.axis().scale(x).orient("bottom").ticks(5);
var yAxisLeft  = d3.svg.axis().scale(yLeft).orient("left").ticks(5);
var yAxisRight = d3.svg.axis().scale(yRight).orient("right").ticks(5);

var seriesAxis = [yLeft, yRight, yLeft];

function getLine(yAxis) {
    // Define the line
    return d3.svg.line()
    .x(function(d) { return x(d.x); })
    .y(function(d) { return yAxis(d.y); });
}

// Adds the svg canvas
var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
    "translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
x.domain([xDomain.min, xDomain.max]);
yLeft.domain([yDomainLeft.min, yDomainLeft.max]);
yRight.domain([yDomainRight.min, yDomainRight.max]);

// Add the X Axis
svg.append("g")
.attr("class", "x axis")
.attr("transform", "translate(0," + height + ")")
.call(xAxis);

// Add the Y Axes
svg.append("g")
.attr("class", "y axis")
.call(yAxisLeft);

svg.append("g")
.attr("class", "y axis")
.attr("transform", "translate(" + width + ", 0)")
.call(yAxisRight);

// call the handleData function when new data arrives
client.subscribe('/data', handleData);
